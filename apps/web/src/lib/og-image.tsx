import 'server-only';
import { EVENT_STATUS_LABEL, type EventDetailDto } from '@lt/shared';
import { ImageResponse } from 'next/og';
import { formatDateRange } from './format';
import { OG_FONT_FAMILY, OG_FONT_WEIGHT, loadJapaneseFont } from './og-font';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const BRAND = 'LT会支援';

/** 画像に載せる日付の行。決定済みならその日、未定なら候補日を最大3件 */
function dateLines(detail: EventDetailDto): { heading: string; lines: string[] } {
  if (detail.confirmedDate) {
    return { heading: '開催日', lines: [formatDateRange(detail.confirmedDate.startsAt, detail.confirmedDate.endsAt)] };
  }
  const lines = detail.candidateDates.slice(0, 3).map((d) => formatDateRange(d.startsAt, d.endsAt));
  if (detail.candidateDates.length > 3) lines.push(`ほか ${detail.candidateDates.length - 3} 件`);
  return { heading: '候補日', lines };
}

/**
 * LT会の OG 画像（1200x630）。詳細ページと共有ページで共通。
 * Satori は flexbox のみ対応なので、すべて display:flex で組む。
 */
export async function renderEventOgImage(detail: EventDetailDto): Promise<ImageResponse> {
  const dates = dateLines(detail);
  const status = EVENT_STATUS_LABEL[detail.status];
  const organizer = `主催: ${detail.organizer.displayName}`;
  const text = [detail.title, organizer, status, dates.heading, ...dates.lines, BRAND, '参加できる日を回答しよう'].join('');
  const font = await loadJapaneseFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)',
          fontFamily: font ? OG_FONT_FAMILY : 'sans-serif',
          color: '#1c1917',
          padding: 56,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#047857' }}>
          <div
            style={{
              display: 'flex',
              padding: '6px 18px',
              borderRadius: 999,
              background: detail.status === 'CONFIRMED' ? '#d1fae5' : '#fef3c7',
              color: detail.status === 'CONFIRMED' ? '#065f46' : '#92400e',
              fontSize: 26,
            }}
          >
            {status}
          </div>
          <div style={{ display: 'flex', color: '#57534e' }}>{organizer}</div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            fontSize: detail.title.length > 20 ? 64 : 80,
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: 'hidden',
          }}
        >
          {detail.title}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 30 }}>
            <div style={{ display: 'flex', color: '#57534e', fontSize: 24 }}>{dates.heading}</div>
            {dates.lines.map((line) => (
              <div key={line} style={{ display: 'flex' }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 24, color: '#57534e' }}>参加できる日を回答しよう</div>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#047857' }}>{BRAND}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: font ? [{ name: OG_FONT_FAMILY, data: font, weight: OG_FONT_WEIGHT, style: 'normal' }] : undefined,
    },
  );
}

/** metadata の description 用。説明の先頭を短く切る */
export function eventDescription(detail: EventDetailDto): string {
  const dates = dateLines(detail);
  const summary = `${dates.heading}: ${dates.lines.join(' / ')}`;
  const body = detail.description.replace(/\s+/g, ' ').trim();
  return body ? `${body.slice(0, 80)}${body.length > 80 ? '…' : ''}｜${summary}` : summary;
}
