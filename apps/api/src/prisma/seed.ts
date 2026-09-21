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

  console.log(`seeded: users=2 event="${event.title}" (share: /share/${event.shareToken})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
