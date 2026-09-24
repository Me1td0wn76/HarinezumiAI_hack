import type { PublicUserDto } from "@lt/shared";
import { BlockButton } from "./block-button";
import { ReportForm } from "./report-form";

/**
 * LT会詳細ページの「通報・ブロック」。主催者以外のログインユーザーに出す。
 * 普段は目立たないよう <details> で畳んでおく
 */
export function SafetyMenu({
  eventId,
  organizer,
  organizerBlocked,
}: {
  eventId: string;
  organizer: PublicUserDto;
  organizerBlocked: boolean;
}) {
  return (
    <details className="card group text-sm">
      <summary className="cursor-pointer font-display text-xs font-bold text-subtle hover:text-foreground">
        通報・ブロック
      </summary>
      <div className="mt-4 space-y-6">
        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold text-foreground">このLT会を通報</h3>
          <ReportForm targetType="EVENT" targetId={eventId} />
        </section>
        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold text-foreground">主催者（{organizer.displayName}）を通報</h3>
          <ReportForm targetType="USER" targetId={organizer.id} />
        </section>
        <section className="space-y-2">
          <h3 className="font-display text-sm font-bold text-foreground">ブロック</h3>
          <BlockButton userId={organizer.id} displayName={organizer.displayName} blocked={organizerBlocked} />
        </section>
      </div>
    </details>
  );
}
