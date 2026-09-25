import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { e2eHandle } from './e2e-handle.js';

interface PageDto {
  items: { id: string; title: string }[];
  nextCursor: string | null;
}

// lt_test データベース（apps/api/.env.test）が起動している前提で動く。
// 他のテストのデータと混ざらないよう、organizerId で自分が作ったイベントだけに絞って確かめる
describe('LT会一覧のページネーション (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let organizerId: string | undefined;

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
    if (organizerId) {
      await prisma.event.deleteMany({ where: { organizerId } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: organizerId } }).catch(() => undefined);
    }
    await app?.close();
  });

  it('前ページ最後のイベントが削除されても、続きを取得できる', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-list-${randomUUID()}@example.com`,
        password: 'password123',
        displayName: 'E2E一覧',
        handle: e2eHandle(),
        agreeToTerms: true,
      })
      .expect(201);
    organizerId = registerRes.body.user.id as string;
    const accessToken = registerRes.body.accessToken as string;

    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    for (const title of ['一覧E2E 1', '一覧E2E 2', '一覧E2E 3']) {
      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title, description: '', candidateDates: [{ startsAt }], tags: ['e2e'] })
        .expect(201);
    }

    const first = (await request(app.getHttpServer()).get(`/events?organizerId=${organizerId}&limit=2`).expect(200))
      .body as PageDto;
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();

    // 読み込みの合間に、カーソルの元になったイベントが削除された
    await prisma.event.delete({ where: { id: first.items[1].id } });

    const second = (
      await request(app.getHttpServer())
        .get(`/events?organizerId=${organizerId}&limit=2&cursor=${encodeURIComponent(first.nextCursor!)}`)
        .expect(200)
    ).body as PageDto;
    expect(second.items).toHaveLength(1);
    expect(first.items.map((e) => e.id)).not.toContain(second.items[0].id);
    expect(second.nextCursor).toBeNull();
  });

  it('壊れた cursor は 400', async () => {
    await request(app.getHttpServer()).get('/events?cursor=broken').expect(400);
  });
});
