/**
 * 開発用の初期データ。`pnpm prisma:seed` または `prisma migrate reset` 時に実行される。
 * ログイン: demo@example.com / password123
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHash = await hash('password123', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', passwordHash, displayName: 'デモ主催者' },
  });
  const taro = await prisma.user.upsert({
    where: { email: 'taro@example.com' },
    update: {},
    create: { email: 'taro@example.com', passwordHash, displayName: '山田太郎' },
  });

  const nextWeek = (days: number, hour: number) => {
    const d = new Date();
    d.setUTCHours(hour - 9, 0, 0, 0); // JST の hour 時
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  };

  const event = await prisma.event.create({
    data: {
      title: '第1回 LT会',
      description: '好きな技術について5分で話しましょう。\n発表者・聴講のみどちらも歓迎です。',
      organizer: { connect: { id: demo.id } },
      tags: { create: [{ tag: 'web' }, { tag: 'typescript' }, { tag: '初心者歓迎' }] },
      candidateDates: {
        create: [
          { startsAt: nextWeek(7, 18), endsAt: nextWeek(7, 19) },
          { startsAt: nextWeek(9, 18), endsAt: nextWeek(9, 19) },
          { startsAt: nextWeek(12, 13) },
        ],
      },
    },
    include: { candidateDates: { orderBy: { startsAt: 'asc' } } },
  });

  const [d1, d2, d3] = event.candidateDates;
  await prisma.dateResponse.createMany({
    data: [
      { eventDateId: d1.id, userId: taro.id, availability: 'YES' },
      { eventDateId: d2.id, userId: taro.id, availability: 'MAYBE', comment: '19時なら' },
      { eventDateId: d3.id, userId: taro.id, availability: 'NO' },
      { eventDateId: d1.id, guestKey: 'seed-guest-1', guestName: 'ゲスト花子', availability: 'YES' },
      { eventDateId: d2.id, guestKey: 'seed-guest-1', guestName: 'ゲスト花子', availability: 'YES' },
    ],
  });

  // 発見画面（タグ・検索・ページング）の確認用に、タグ違いのLT会をいくつか足す
  const extras: { title: string; description: string; tags: string[]; organizer: string }[] = [
    { title: 'Rust もくもく LT', description: 'Rust で作った CLI やライブラリの話。所有権の話も歓迎', tags: ['rust', 'cli'], organizer: taro.id },
    { title: 'AI ツール活用 LT', description: 'Claude や Copilot を開発でどう使っているか', tags: ['ai', 'web'], organizer: demo.id },
    { title: 'インフラ雑談 LT', description: 'Docker、Kubernetes、家のサーバーの話', tags: ['infra', 'docker'], organizer: taro.id },
  ];
  for (const [i, e] of extras.entries()) {
    await prisma.event.create({
      data: {
        title: e.title,
        description: e.description,
        organizer: { connect: { id: e.organizer } },
        tags: { create: e.tags.map((tag) => ({ tag })) },
        candidateDates: { create: [{ startsAt: nextWeek(14 + i * 2, 19), endsAt: nextWeek(14 + i * 2, 20) }] },
      },
    });
  }

  console.log(`seeded: users=2 events=${1 + extras.length} (share: /share/${event.shareToken})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
