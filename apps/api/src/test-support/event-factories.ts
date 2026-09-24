import type { User } from '../generated/prisma/client.js';
import type { EventDetail } from '../modules/events/events.repository.js';

/** ユニットテスト用の User ビルダー。必要なフィールドだけ上書きする */
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'organizer@example.com',
    passwordHash: 'hashed-password',
    displayName: '主催者',
    bio: null,
    termsAcceptedAt: null,
    passwordChangedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** ユニットテスト用の EventDetail（Repository が返す形）ビルダー */
export function buildEvent(overrides: Partial<EventDetail> = {}): EventDetail {
  return {
    id: 'event-1',
    title: 'テストLT会',
    description: 'テスト用の説明',
    status: 'OPEN',
    shareToken: 'share-token-1',
    format: 'ONLINE',
    venue: null,
    meetingUrl: null,
    webhookUrl: null,
    organizerId: 'user-1',
    organizer: { id: 'user-1', displayName: '主催者' },
    confirmedDateId: null,
    confirmedDate: null,
    tags: [],
    candidateDates: [
      {
        id: 'date-1',
        eventId: 'event-1',
        startsAt: new Date('2026-02-01T10:00:00.000Z'),
        endsAt: null,
        responses: [],
      },
      {
        id: 'date-2',
        eventId: 'event-1',
        startsAt: new Date('2026-02-08T10:00:00.000Z'),
        endsAt: null,
        responses: [],
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
