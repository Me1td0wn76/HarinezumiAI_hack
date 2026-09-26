import type { EventEntryDto } from "@lt/shared";
import { UserLink } from "./user-link";

/**
 * 登壇者と聴講者の一覧。発表タイトルは誰にでも見せる。
 * 話す内容と発表時間は API が主催者と本人にしか返さない（それ以外は null）ので、あれば出す
 */
export function EntryList({ entries, showTotal }: { entries: EventEntryDto[]; showTotal: boolean }) {
  const speakers = entries.filter((e) => e.role === "SPEAKER");
  const audience = entries.filter((e) => e.role === "AUDIENCE");
  const totalMinutes = speakers.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const undecided = speakers.filter((e) => e.durationMinutes === null).length;

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">まだ参加表明はありません。</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-display text-sm font-bold text-muted-foreground">
          <span aria-hidden="true">🎤 </span>登壇者（{speakers.length}人）
        </h3>
        {speakers.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだいません。</p>
        ) : (
          // 並びは表明の古い順で、発表順ではないので ol にしない
          <ul className="divide-y divide-card-border">
            {speakers.map((e) => (
              <li key={e.user.id} className="space-y-1 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {/* URL などの長い英数字でもカードからはみ出さないよう折り返す */}
                  <span className="min-w-0 break-words font-display font-bold text-foreground [overflow-wrap:anywhere]">
                    {e.talkTitle}
                  </span>
                  {e.durationMinutes !== null && (
                    <span className="badge bg-muted text-muted-foreground">{e.durationMinutes}分</span>
                  )}
                  <UserLink user={e.user} className="ml-auto text-sm text-muted-foreground" />
                </div>
                {e.talkDetail && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                    {e.talkDetail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {showTotal && speakers.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            発表時間の合計: <strong className="text-foreground">{totalMinutes}分</strong>
            {undecided > 0 && `（時間未定 ${undecided}人）`}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-display text-sm font-bold text-muted-foreground">
          <span aria-hidden="true">👀 </span>聴講者（{audience.length}人）
        </h3>
        {audience.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだいません。</p>
        ) : (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {audience.map((e) => (
              <li key={e.user.id} className="min-w-0">
                <UserLink user={e.user} className="text-sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
