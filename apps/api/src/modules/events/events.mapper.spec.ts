import { toEventDetailDto } from './events.mapper.js';
import { buildEntry, buildEvent } from '../../test-support/event-factories.js';

describe('toEventDetailDto の参加表明', () => {
  const event = buildEvent({
    entries: [
      buildEntry({
        id: 'e-audience',
        userId: 'user-3',
        user: { id: 'user-3', handle: 'aud', displayName: '聴講者', avatarUrl: null },
        role: 'AUDIENCE',
        talkTitle: null,
        talkDetail: null,
        durationMinutes: null,
      }),
      buildEntry({ id: 'e-speaker' }),
    ],
  });

  it('登壇者を先に並べる', () => {
    const dto = toEventDetailDto(event, {});
    expect(dto.entries.map((e) => e.role)).toEqual(['SPEAKER', 'AUDIENCE']);
  });

  it('第三者には発表タイトルだけを見せ、説明と時間は伏せる', () => {
    const dto = toEventDetailDto(event, { userId: 'someone-else' });
    expect(dto.entries[0]).toMatchObject({ talkTitle: '発表タイトル', talkDetail: null, durationMinutes: null });
    expect(dto.myEntry).toBeNull();
  });

  it('主催者には説明と時間も見せる', () => {
    const dto = toEventDetailDto(event, { userId: 'user-1' });
    expect(dto.entries[0]).toMatchObject({ talkDetail: '発表内容の説明', durationMinutes: 5 });
  });

  it('excludeEntryUserIds（閲覧者がブロックした相手）の表明は一覧から除く', () => {
    const dto = toEventDetailDto(event, { userId: 'someone-else', excludeEntryUserIds: ['user-2'] });
    expect(dto.entries.map((e) => e.user.id)).toEqual(['user-3']);
  });

  it('本人には自分の表明を myEntry として返す', () => {
    const dto = toEventDetailDto(event, { userId: 'user-2' });
    expect(dto.myEntry).toMatchObject({ role: 'SPEAKER', talkDetail: '発表内容の説明', durationMinutes: 5 });
  });

  it('開催日決定後は、回答していなくても参加表明した人に配信URL を見せる', () => {
    const confirmed = buildEvent({
      status: 'CONFIRMED',
      meetingUrl: 'https://example.com/live',
      entries: [buildEntry()],
    });
    expect(toEventDetailDto(confirmed, { userId: 'user-2' }).meetingUrl).toBe('https://example.com/live');
    expect(toEventDetailDto(confirmed, { userId: 'someone-else' }).meetingUrl).toBeNull();
  });
});
