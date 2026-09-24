import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

interface EventDateDto {
  id: string;
  startsAt: string;
  endsAt: string | null;
}

interface EventDetailDto {
  id: string;
  status: string;
  shareToken: string | null;
  candidateDates: EventDateDto[];
  confirmedDate: EventDateDto | null;
  tallies: { eventDate: EventDateDto; yes: number; maybe: number; no: number }[];
}

// lt_test データベース（apps/api/.env.test）が起動している前提で動く。
// README の「テスト用 DB」セットアップを参照。
describe('LT会のフロー (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let organizerId: string | undefined;
  let eventId: string | undefined;

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
    // 作成したデータを後始末する（Event を消せば候補日・回答は cascade で消える）
    if (eventId) {
      await prisma.event.delete({ where: { id: eventId } }).catch(() => undefined);
    }
    if (organizerId) {
      await prisma.user.delete({ where: { id: organizerId } }).catch(() => undefined);
    }
    // beforeAll 自体が失敗すると app が undefined のまま残る。ここで app.close() を呼ぶと
    // 本当の失敗原因（DB接続エラー等）が TypeError で隠れてしまうため、? を付けて回避する
    await app?.close();
  });

  it('登録 → ログイン → 作成 → 回答 → 決定 → ゲスト回答 の一連が動く', async () => {
    const email = `e2e-${randomUUID()}@example.com`;
    const password = 'password123';

    // 登録
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'E2Eテスト主催者' })
      .expect(201);
    organizerId = registerRes.body.user.id as string;
    expect(registerRes.body.accessToken).toBeTruthy();

    // ログイン
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    const accessToken = loginRes.body.accessToken as string;
    expect(accessToken).toBeTruthy();

    // 作成
    const startsAtA = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const startsAtB = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const createRes = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'E2Eテスト LT会',
        description: 'e2eテストで作成したLT会',
        candidateDates: [{ startsAt: startsAtA }, { startsAt: startsAtB }],
      })
      .expect(201);
    const created = createRes.body as EventDetailDto;
    eventId = created.id;
    const dateId = created.candidateDates[0].id;
    const shareToken = created.shareToken;
    // 主催者本人が作成直後に見ているので shareToken を含む
    expect(shareToken).toBeTruthy();

    // 回答（主催者自身が回答する）
    const respondRes = await request(app.getHttpServer())
      .put(`/events/${eventId}/responses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ responses: [{ eventDateId: dateId, availability: 'YES' }] })
      .expect(200);
    const responded = respondRes.body as EventDetailDto;
    const tally = responded.tallies.find((t) => t.eventDate.id === dateId);
    expect(tally?.yes).toBe(1);

    // ゲスト回答（決定前なので通り、集計に反映される）
    const guestRes = await request(app.getHttpServer())
      .put(`/share/${shareToken}/responses`)
      .send({
        guestKey: `guest-${randomUUID()}`,
        guestName: 'ゲスト参加者',
        responses: [{ eventDateId: dateId, availability: 'YES' }],
      })
      .expect(200);
    const guestResponded = guestRes.body as EventDetailDto;
    const guestTally = guestResponded.tallies.find((t) => t.eventDate.id === dateId);
    expect(guestTally?.yes).toBe(2);

    // 決定
    const confirmRes = await request(app.getHttpServer())
      .post(`/events/${eventId}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ eventDateId: dateId })
      .expect(201);
    const confirmed = confirmRes.body as EventDetailDto;
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedDate?.id).toBe(dateId);

    // ゲスト回答: 開催日決定後は回答を締め切っているので 400（締め切り後の回答拒否）
    const closedGuestRes = await request(app.getHttpServer())
      .put(`/share/${shareToken}/responses`)
      .send({
        guestKey: `guest-${randomUUID()}`,
        guestName: 'ゲスト参加者2',
        responses: [{ eventDateId: dateId, availability: 'YES' }],
      })
      .expect(400);
    expect(closedGuestRes.body.message).toContain('締め切っています');
  });
});
