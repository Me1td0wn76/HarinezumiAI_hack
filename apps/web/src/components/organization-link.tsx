import type { OrganizationSummaryDto } from "@lt/shared";
import Link from "next/link";

/** 団体ページ（/orgs/[slug]）へのリンク。LT会のカードと詳細で使う */
export function OrganizationLink({ organization }: { organization: OrganizationSummaryDto }) {
  return (
    <Link href={`/orgs/${organization.slug}`} className="min-w-0 truncate font-semibold hover:text-foreground hover:underline">
      👥 {organization.name}
    </Link>
  );
}
