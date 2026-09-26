import { toEventDetailDto } from './events.mapper.js';
import { buildEntry, buildEvent } from '../../test-support/event-factories.js';

describe('toEventDetailDto の参加表明', () => {
  const event = buildEvent();
  const audience = buildEntry({
    id: 'e-audience',
    userId: 'user-3',
    user: { id: 'user-3', handle: 'aud', displayName: '聴講者', avatarUrl: null },
    role: 'AUDIENCE',
    talkTitle: null,
    talkDetail: null,
    durationMinutes: null,
  });
  const speaker = buildEntry({ id: 'e-speaker' });
  // EntriesRepository.findForEvent は表明の古い順で返す
  const list = [audience, speaker];

  it('登壇者を先に並べる', () => {
    const dto = toEventDetailDto(event, {}, { list, mine: null });
    expect(dto.entries.map((e) => e.role)).toEqual(['SPEAKER', 'AUDIENCE']);
  });

  it('第三者には発表タイトルだけを見せ、説明と時間は伏せる', () => {
    const dto = toEventDetailDto(event, { userId: 'someone-else' }, { list, mine: null });
    expect(dto.entries[0]).toMatchObject({ talkTitle: '発表タイトル', talkDetail: null, durationMinutes: null });
    expect(dto.myEntry).toBeNull();
  });

  it('主催者には説明と時間も見せる', () => {
    const dto = toEventDetailDto(event, { userId: 'user-1' }, { list, mine: null });
    expect(dto.entries[0]).toMatchObject({ talkDetail: '発表内容の説明', durationMinutes: 5 });
  });

  it('本人には自分の表明を myEntry として返す（一覧の範囲外でも）', () => {
    const dto = toEventDetailDto(event, { userId: 'user-2' }, { list: [audience], mine: speaker });
    expect(dto.myEntry).toMatchObject({ role: 'SPEAKER', talkDetail: '発表内容の説明', durationMinutes: 5 });
    expect(dto.entries).toHaveLength(1);
  });

  it('開催日決定後は、回答していなくても参加表明した人に配信URL を見せる', () => {
    const confirmed = buildEvent({ status: 'CONFIRMED', meetingUrl: 'https://example.com/live' });
    const entries = { list: [speaker], mine: null };
    expect(toEventDetailDto(confirmed, { userId: 'user-2' }, { ...entries, mine: speaker }).meetingUrl).toBe(
      'https://example.com/live',
    );
    expect(toEventDetailDto(confirmed, { userId: 'someone-else' }, entries).meetingUrl).toBeNull();
  });
});
