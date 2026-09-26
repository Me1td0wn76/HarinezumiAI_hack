import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { e2eHandle } from './e2e-handle.js';

// lt_test データベース（apps/api/.env.test）が起動している前提で動く
describe('団体 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const slugs: string[] = [];

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
    await prisma?.event.deleteMany({ where: { organizerId: { in: userIds } } });
    await prisma?.organization.deleteMany({ where: { slug: { in: slugs } } });
    await prisma?.user.deleteMany({ where: { id: { in: userIds } } });
    await app?.close();
  });

  async function register() {
    const handle = e2eHandle();
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-org-${randomUUID()}@example.com`,
        password: 'password123',
        displayName: 'E2E団体',
        handle,
        agreeToTerms: true,
      })
      .expect(201);
    userIds.push(res.body.user.id as string);
    return { id: res.body.user.id as string, handle, auth: `Bearer ${res.body.accessToken}` };
  }

  function newSlug(): string {
    const slug = `e2e-${randomBytes(6).toString('hex')}`;
    slugs.push(slug);
    return slug;
  }

  function createEvent(auth: string, organizationId?: string) {
    return request(app.getHttpServer())
      .post('/events')
      .set('Authorization', auth)
      .send({
        title: 'E2E 団体のLT会',
        description: '',
        candidateDates: [{ startsAt: new Date(Date.now() + 86_400_000).toISOString() }],
        organizationId,
      });
  }

  it('作成・メンバー管理・団体ごとのLT会一覧・削除までの流れ', async () => {
    const owner = await register();
    const member = await register();
    const outsider = await register();
    const slug = newSlug();
    const server = app.getHttpServer();

    // 作成（slug は小文字に正規化）。作成者が OWNER
    const created = await request(server)
      .post('/organizations')
      .set('Authorization', owner.auth)
      .send({ name: 'E2E 研究室', slug: slug.toUpperCase(), webhookUrl: 'https://discord.com/api/webhooks/1/abc' })
      .expect(201);
    expect(created.body.slug).toBe(slug);
    expect(created.body.viewerRole).toBe('OWNER');
    const orgId = created.body.id as string;

    // 同じ slug・不正な形式・予約語は作れない
    await request(server).post('/organizations').set('Authorization', owner.auth).send({ name: 'x', slug }).expect(409);
    await request(server)
      .post('/organizations')
      .set('Authorization', owner.auth)
      .send({ name: 'x', slug: '-bad' })
      .expect(400);
    await request(server)
      .post('/organizations')
      .set('Authorization', owner.auth)
      .send({ name: 'x', slug: 'new' })
      .expect(400);

    // 空白だけの名前は通さない。NOT NULL の項目に null を送っても 500 にならず 400
    await request(server)
      .post('/organizations')
      .set('Authorization', owner.auth)
      .send({ name: '   ', slug: newSlug() })
      .expect(400);
    await request(server)
      .patch(`/organizations/${slug}`)
      .set('Authorization', owner.auth)
      .send({ slug: null })
      .expect(400);
    await request(server)
      .patch(`/organizations/${slug}`)
      .set('Authorization', owner.auth)
      .send({ name: null })
      .expect(400);
    await request(server)
      .patch(`/organizations/${slug}`)
      .set('Authorization', owner.auth)
      .send({ name: ' ' })
      .expect(400);

    // 招待制: メンバー以外は団体名義でLT会を作れず、メンバーの追加も OWNER だけ
    await createEvent(member.auth, orgId).expect(403);
    await request(server)
      .post(`/organizations/${slug}/members`)
      .set('Authorization', member.auth)
      .send({ handle: member.handle })
      .expect(403);
    const added = await request(server)
      .post(`/organizations/${slug}/members`)
      .set('Authorization', owner.auth)
      .send({ handle: `@${member.handle}` })
      .expect(201);
    expect(added.body.role).toBe('MEMBER');
    await request(server)
      .post(`/organizations/${slug}/members`)
      .set('Authorization', owner.auth)
      .send({ handle: member.handle })
      .expect(409);

    // メンバーになれば作れる。一覧・詳細に団体が載る
    const event = await createEvent(member.auth, orgId).expect(201);
    expect(event.body.organization).toEqual({ id: orgId, slug, name: 'E2E 研究室' });
    await createEvent(outsider.auth).expect(201);
    // 空文字は「団体なし」（PATCH と同じ扱い）
    const noOrg = await createEvent(outsider.auth, '').expect(201);
    expect(noOrg.body.organization).toBeNull();

    const orgEvents = await request(server).get(`/organizations/${slug}/events`).expect(200);
    expect(orgEvents.body.items.map((e: { id: string }) => e.id)).toEqual([event.body.id]);
    const filtered = await request(server).get(`/events?organization=${slug}`).expect(200);
    expect(filtered.body.items.map((e: { id: string }) => e.id)).toEqual([event.body.id]);
    await request(server).get('/organizations/no-such-org-e2e/events').expect(404);

    // 詳細: webhookUrl は OWNER にだけ返す
    const asMember = await request(server).get(`/organizations/${slug}`).set('Authorization', member.auth).expect(200);
    expect(asMember.body.viewerRole).toBe('MEMBER');
    expect(asMember.body.webhookUrl).toBeNull();
    expect(asMember.body.members.map((m: { role: string }) => m.role)).toEqual(['OWNER', 'MEMBER']);
    const asOwner = await request(server).get(`/organizations/${slug}`).set('Authorization', owner.auth).expect(200);
    expect(asOwner.body.webhookUrl).toBe('https://discord.com/api/webhooks/1/abc');

    // 自分の所属団体
    const mine = await request(server).get('/users/me/organizations').set('Authorization', member.auth).expect(200);
    expect(mine.body).toEqual([{ id: orgId, slug, name: 'E2E 研究室', role: 'MEMBER' }]);

    // 最後の OWNER は抜けられない。本人は自分で抜けられる
    await request(server)
      .delete(`/organizations/${slug}/members/${owner.id}`)
      .set('Authorization', owner.auth)
      .expect(400);
    await request(server)
      .delete(`/organizations/${slug}/members/${member.id}`)
      .set('Authorization', member.auth)
      .expect(204);

    // 団体を削除しても LT会は残り、団体なしになる
    await request(server).delete(`/organizations/${slug}`).set('Authorization', member.auth).expect(403);
    await request(server).delete(`/organizations/${slug}`).set('Authorization', owner.auth).expect(204);
    const after = await request(server).get(`/events/${event.body.id}`).expect(200);
    expect(after.body.organization).toBeNull();
    await request(server).get(`/organizations/${slug}`).expect(404);
  });
});
