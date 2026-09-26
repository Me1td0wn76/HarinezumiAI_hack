import type { OrganizationSummaryDto } from "@lt/shared";
import Link from "next/link";

/**
 * LT会を紐付ける団体の選択欄（作成フォームと編集フォームで共通）。選べるのは自分が所属する団体だけ。
 * @param current 編集中のLT会に今付いている団体。団体を抜けた後でも付けたままにできるよう選択肢に残す
 */
export function OrganizationSelect({
  organizations,
  current = null,
}: {
  organizations: OrganizationSummaryDto[];
  current?: OrganizationSummaryDto | null;
}) {
  const options = current && !organizations.some((o) => o.id === current.id) ? [current, ...organizations] : organizations;

  if (options.length === 0) {
    return (
      <p className="text-xs text-subtle">
        所属している団体はありません。サークルや研究室でまとめたいときは
        <Link href="/orgs/new" className="font-semibold text-secondary-foreground underline">
          団体を作成
        </Link>
        してください。
      </p>
    );
  }

  return (
    <div>
      <label className="label" htmlFor="organizationId">
        団体（任意）
      </label>
      <select id="organizationId" name="organizationId" className="input" defaultValue={current?.id ?? ""} aria-describedby="organizationId-help">
        <option value="">団体なし（個人で主催）</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <p id="organizationId-help" className="mt-1 text-xs text-subtle">
        選んだ団体のページに表示され、団体の Discord にもお知らせが流れます。
      </p>
    </div>
  );
}
