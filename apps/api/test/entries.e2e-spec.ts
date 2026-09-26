import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { e2eHandle } from './e2e-handle.js';

interface EntryDto {
  user: { id: string };
  role: string;
  talkTitle: string | null;
  talkDetail: string | null;
  durationMinutes: number | null;
}

interface EventDetailDto {
  id: string;
  entries: EntryDto[];
  myEntry: EntryDto | null;
}

const DAY = 24 * 60 * 60 * 1000;

// lt_test データベース（apps/api/.env.test）が起動している前提で動く
describe('参加表明とみんなのカレンダー (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let eventId: string | undefined;
  const extraEventIds: string[] = [];

  async function register(displayName: string): Promise<{ id: string; token: string }> {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `e2e-${randomUUID()}@example.com`,
        password: 'password123',
        displayName,
        handle: e2eHandle(),
        agreeToTerms: true,
      })
      .expect(201);
    userIds.push(res.body.user.id as string);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    const ids = [...(eventId ? [eventId] : []), ...extraEventIds];
    await prisma.event.deleteMany({ where: { id: { in: ids } } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => undefined);
    await app?.close();
  });

  it('登壇・聴講を表明でき、発表内容は主催者と本人にだけ見える', async () => {
    const organizer = await register('E2E主催者');
    const speaker = await register('E2E登壇者');
    const stranger = await register('E2E第三者');
    const startsAt = new Date(Date.now() + 10 * DAY).toISOString();

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({ title: 'E2E 参加表明 LT会', description: '', candidateDates: [{ startsAt }] })
      .expect(201);
    eventId = created.body.id as string;

    // 未ログインは 401
    await request(app.getHttpServer()).put(`/events/${eventId}/entry`).send({ role: 'AUDIENCE' }).expect(401);

    // 登壇なのにタイトルが無ければ 400
    await request(app.getHttpServer())
      .put(`/events/${eventId}/entry`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .send({ role: 'SPEAKER' })
      .expect(400);

    // 登壇を表明
    const put = await request(app.getHttpServer())
      .put(`/events/${eventId}/entry`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .send({ role: 'SPEAKER', talkTitle: 'E2Eの話', talkDetail: '詳しい内容', durationMinutes: 5 })
      .expect(200);
    expect(put.body).toMatchObject({ role: 'SPEAKER', talkTitle: 'E2Eの話', durationMinutes: 5 });

    // 主催者には説明と時間が見え、登壇の通知が届く
    const asOrganizer = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .expect(200);
    expect((asOrganizer.body as EventDetailDto).entries).toEqual([
      expect.objectContaining({ talkTitle: 'E2Eの話', talkDetail: '詳しい内容', durationMinutes: 5 }),
    ]);
    // 通知の保存は本処理を待たずに行うので、少し待って確認する
    await vi.waitFor(async () => {
      const count = await prisma.notification.count({ where: { userId: organizer.id, type: 'SPEAKER_ENTERED' } });
      expect(count).toBe(1);
    });

    // 第三者にはタイトルだけ
    const asStranger = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(200);
    const strangerView = asStranger.body as EventDetailDto;
    expect(strangerView.entries[0]).toMatchObject({ talkTitle: 'E2Eの話', talkDetail: null, durationMinutes: null });
    expect(strangerView.myEntry).toBeNull();

    // 聴講に変更すると発表内容は消える（1人1件で上書き）
    await request(app.getHttpServer())
      .put(`/events/${eventId}/entry`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .send({ role: 'AUDIENCE', talkTitle: '残らない' })
      .expect(200);
    const asSpeaker = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .expect(200);
    const speakerView = asSpeaker.body as EventDetailDto;
    expect(speakerView.entries).toHaveLength(1);
    expect(speakerView.myEntry).toMatchObject({ role: 'AUDIENCE', talkTitle: null });

    // 参加表明したLT会は参加履歴に出る（候補日には回答していない）
    const history = await request(app.getHttpServer())
      .get('/users/me/events')
      .set('Authorization', `Bearer ${speaker.token}`)
      .expect(200);
    expect((history.body.participated as { id: string }[]).map((e) => e.id)).toContain(eventId);

    // みんなのカレンダーに候補日が出る（ログイン不要）
    const schedule = await request(app.getHttpServer())
      .get('/schedule')
      .query({ from: new Date(Date.now()).toISOString(), to: new Date(Date.now() + 30 * DAY).toISOString() })
      .expect(200);
    expect((schedule.body as { eventId: string }[]).some((i) => i.eventId === eventId)).toBe(true);

    // 取り消し → もう一度取り消すと 404
    await request(app.getHttpServer())
      .delete(`/events/${eventId}/entry`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .expect(204);
    await request(app.getHttpServer())
      .delete(`/events/${eventId}/entry`)
      .set('Authorization', `Bearer ${speaker.token}`)
      .expect(404);
  });

  it('登壇通知は切り替えを繰り返しても重ならず、主催者がブロックした相手からは届かない。ブロックした相手は一覧から除く', async () => {
    const organizer = await register('E2E主催者2');
    const speaker = await register('E2E登壇者2');
    const blocked = await register('E2Eブロック対象');
    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.token}`)
      .send({
        title: 'E2E 通知の重複 LT会',
        description: '',
        candidateDates: [{ startsAt: new Date(Date.now() + 12 * DAY).toISOString() }],
      })
      .expect(201);
    const id = created.body.id as string;
    extraEventIds.push(id);

    const enter = (token: string, role: 'SPEAKER' | 'AUDIENCE') =>
      request(app.getHttpServer())
        .put(`/events/${id}/entry`)
        .set('Authorization', `Bearer ${token}`)
        .send(role === 'SPEAKER' ? { role, talkTitle: 'LT' } : { role })
        .expect(200);
    const speakerNotifications = () =>
      prisma.notification.count({ where: { userId: organizer.id, type: 'SPEAKER_ENTERED', eventId: id } });

    // 登壇 → 聴講 → 登壇 と切り替えても、未読の通知があるうちは 1 件のまま
    await enter(speaker.token, 'SPEAKER');
    await vi.waitFor(async () => expect(await speakerNotifications()).toBe(1));
    await enter(speaker.token, 'AUDIENCE');
    await enter(speaker.token, 'SPEAKER');
    // 通知の保存は本処理を待たないので、作られるなら作られるだけの時間を置いてから数える
    await new Promise((r) => setTimeout(r, 500));
    expect(await speakerNotifications()).toBe(1);

    // 主催者がブロックした相手の登壇表明は通知しない
    await request(app.getHttpServer())
      .post(`/users/${blocked.id}/block`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .expect(204);
    await enter(blocked.token, 'SPEAKER');
    await new Promise((r) => setTimeout(r, 500));
    expect(await speakerNotifications()).toBe(1);

    // ブロックした相手の表明は主催者の一覧から除く（コメント欄と同じ扱い）。第三者には見える
    const asOrganizer = await request(app.getHttpServer())
      .get(`/events/${id}`)
      .set('Authorization', `Bearer ${organizer.token}`)
      .expect(200);
    expect((asOrganizer.body as EventDetailDto).entries.map((e) => e.user.id)).toEqual([speaker.id]);
    const asGuest = await request(app.getHttpServer()).get(`/events/${id}`).expect(200);
    expect((asGuest.body as EventDetailDto).entries).toHaveLength(2);
  });

  it('みんなのカレンダーは期間の指定が不正なら 400', async () => {
    await request(app.getHttpServer()).get('/schedule').expect(400);
    await request(app.getHttpServer())
      .get('/schedule')
      .query({ from: '2026-01-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' })
      .expect(400);
  });
});
