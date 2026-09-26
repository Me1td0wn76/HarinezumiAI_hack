import type { User } from '../generated/prisma/client.js';
import type { EntryWithUser } from '../modules/entries/entries.repository.js';
import type { EventDetail } from '../modules/events/events.repository.js';

/** ユニットテスト用の User ビルダー。必要なフィールドだけ上書きする */
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'organizer@example.com',
    passwordHash: 'hashed-password',
    handle: 'organizer',
    displayName: '主催者',
    bio: null,
    avatarUrl: null,
    role: 'USER',
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
    organizer: { id: 'user-1', handle: 'organizer', displayName: '主催者', avatarUrl: null },
    organizationId: null,
    organization: null,
    confirmedDateId: null,
    confirmedDate: null,
    hiddenAt: null,
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

/** ユニットテスト用の参加表明（EntriesRepository が返す形）ビルダー */
export function buildEntry(overrides: Partial<EntryWithUser> = {}): EntryWithUser {
  return {
    id: 'entry-1',
    eventId: 'event-1',
    userId: 'user-2',
    user: { id: 'user-2', handle: 'speaker', displayName: '登壇者', avatarUrl: null },
    role: 'SPEAKER',
    talkTitle: '発表タイトル',
    talkDetail: '発表内容の説明',
    durationMinutes: 5,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}
