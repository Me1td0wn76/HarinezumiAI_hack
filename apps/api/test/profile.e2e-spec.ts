import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { e2eHandle } from './e2e-handle.js';

// lt_test データベース（apps/api/.env.test）が起動している前提で動く
describe('公開プロフィール (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    // 主催したLT会を先に消す（候補日・回答は cascade）
    await prisma?.event.deleteMany({ where: { organizerId: { in: userIds } } });
    await prisma?.user.deleteMany({ where: { id: { in: userIds } } });
    await app?.close();
  });

  async function register(handle: string, status = 201) {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-profile-${randomUUID()}@example.com`,
        password: 'password123',
        displayName: 'E2Eプロフィール',
        handle,
        agreeToTerms: true,
      })
      .expect(status);
    if (res.status === 201) userIds.push(res.body.user.id as string);
    return res;
  }

  function daysLater(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  it('ハンドルは小文字で保存し、重複・予約語・不正な形式は登録できない', async () => {
    const handle = e2eHandle();
    const res = await register(handle.toUpperCase());
    expect(res.body.user.handle).toBe(handle);

    await register(handle, 409);
    await register('me', 400);
    await register('ab', 400);
    await register('has-hyphen', 400);
  });

  it('GET /users/me は /users/:handle に取られない', async () => {
    const res = await register(e2eHandle());
    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toContain('@example.com');
  });

  it('公開情報・主催したLT会・参加予定を返し、メールアドレスは返さない', async () => {
    const ownerHandle = e2eHandle();
    const owner = await register(ownerHandle);
    const other = await register(e2eHandle());
    const ownerAuth = `Bearer ${owner.body.accessToken}`;
    const otherAuth = `Bearer ${other.body.accessToken}`;

    // プロフィールの本人が主催するLT会（1つは運営が非表示にする）
    const organized = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', ownerAuth)
      .send({ title: 'プロフィールE2E 主催', description: '', candidateDates: [{ startsAt: daysLater(7) }] })
      .expect(201);
    const hidden = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', ownerAuth)
      .send({ title: 'プロフィールE2E 非表示', description: '', candidateDates: [{ startsAt: daysLater(7) }] })
      .expect(201);
    await prisma.event.update({ where: { id: hidden.body.id as string }, data: { hiddenAt: new Date() } });

    // ほかの人が主催し、本人が回答したLT会: 調整中 / 開催前に決定 / 開催済み
    const titles = ['プロフィールE2E 調整中', 'プロフィールE2E 開催前', 'プロフィールE2E 開催済み'];
    const ids: string[] = [];
    for (const title of titles) {
      const created = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', otherAuth)
        .send({ title, description: '', candidateDates: [{ startsAt: daysLater(10) }] })
        .expect(201);
      const dateId = created.body.candidateDates[0].id as string;
      await request(app.getHttpServer())
        .put(`/events/${created.body.id}/responses`)
        .set('Authorization', ownerAuth)
        .send({ responses: [{ eventDateId: dateId, availability: 'NO' }] })
        .expect(200);
      ids.push(created.body.id as string);
    }
    for (const id of ids.slice(1)) {
      const detail = await request(app.getHttpServer()).get(`/events/${id}`).expect(200);
      await request(app.getHttpServer())
        .post(`/events/${id}/confirm`)
        .set('Authorization', otherAuth)
        .send({ eventDateId: detail.body.candidateDates[0].id })
        .expect(201);
    }
    // 開催済みにするため、決定した日を過去へずらす
    const past = await prisma.event.findUniqueOrThrow({ where: { id: ids[2] } });
    await prisma.eventDate.update({
      where: { id: past.confirmedDateId! },
      data: { startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const res = await request(app.getHttpServer()).get(`/users/${ownerHandle.toUpperCase()}`).expect(200);
    expect(res.body.user).toMatchObject({ handle: ownerHandle, displayName: 'E2Eプロフィール', avatarUrl: null });
    expect(JSON.stringify(res.body)).not.toContain('e2e-profile-');
    expect(res.body.organized.map((e: { id: string }) => e.id)).toEqual([organized.body.id]);
    expect(res.body.organized[0].organizer.handle).toBe(ownerHandle);
    expect(res.body.upcoming.map((e: { title: string }) => e.title).sort()).toEqual(titles.slice(0, 2).sort());
  });

  it('プロフィールを更新でき、使用中のハンドルや http のアバターは弾く', async () => {
    const taken = e2eHandle();
    await register(taken);
    const me = await register(e2eHandle());
    const auth = `Bearer ${me.body.accessToken}`;
    const next = e2eHandle();

    const updated = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ handle: next, avatarUrl: 'https://example.com/avatar.png' })
      .expect(200);
    expect(updated.body).toMatchObject({ handle: next, avatarUrl: 'https://example.com/avatar.png' });

    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ handle: taken })
      .expect(409);
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ avatarUrl: 'http://example.com/avatar.png' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ avatarUrl: null })
      .expect(200);

    // 空文字も解除として扱う
    const cleared = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ avatarUrl: '' })
      .expect(200);
    expect(cleared.body.avatarUrl).toBeNull();

    // NOT NULL の項目に null を送っても 500 にしない
    await request(app.getHttpServer()).patch('/users/me').set('Authorization', auth).send({ handle: null }).expect(400);
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', auth)
      .send({ displayName: null })
      .expect(400);
  });

  it('存在しないハンドルは 404', async () => {
    await request(app.getHttpServer()).get(`/users/${e2eHandle()}`).expect(404);
  });
});
