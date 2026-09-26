"use client";

import {
  ORGANIZATION_SLUG_MAX_LENGTH,
  ORGANIZATION_SLUG_MIN_LENGTH,
  type OrganizationDetailDto,
} from "@lt/shared";
import { useActionState } from "react";
import { createOrganization, updateOrganization } from "@/actions/organizations";
import { keepValuesOnSubmit } from "@/lib/keep-values-on-submit";
import { FormMessage } from "./form-message";
import { WebhookUrlField } from "./webhook-url-field";

/**
 * 団体の作成・編集フォーム。organization を渡すと編集（OWNER のみ）になる。
 * slug が使用済みで弾かれても入力が消えないようにする
 */
export function OrganizationForm({
  organization,
}: {
  organization?: Pick<OrganizationDetailDto, "slug" | "name" | "description" | "webhookUrl">;
}) {
  const editing = organization !== undefined;
  const [state, action, pending] = useActionState(editing ? updateOrganization : createOrganization, undefined);

  return (
    <form action={action} onSubmit={keepValuesOnSubmit(action)} className="space-y-4">
      {editing && <input type="hidden" name="currentSlug" value={organization.slug} />}
      <div>
        <label className="label" htmlFor="org-name">
          団体名
        </label>
        <input
          id="org-name"
          name="name"
          className="input"
          required
          maxLength={50}
          autoComplete="off"
          defaultValue={organization?.name}
          placeholder="〇〇大学 プログラミングサークル"
        />
      </div>
      <div>
        <label className="label" htmlFor="org-slug">
          ID（URL に使います）
        </label>
        <div className="flex items-center gap-1">
          <span aria-hidden="true" className="shrink-0 text-sm text-subtle">
            /orgs/
          </span>
          <input
            id="org-slug"
            name="slug"
            className="input"
            required
            minLength={ORGANIZATION_SLUG_MIN_LENGTH}
            maxLength={ORGANIZATION_SLUG_MAX_LENGTH}
            pattern="[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            defaultValue={organization?.slug}
            placeholder="my-circle"
            aria-describedby="org-slug-hint"
          />
        </div>
        <p id="org-slug-hint" className="mt-1 text-xs text-subtle">
          {ORGANIZATION_SLUG_MIN_LENGTH}〜{ORGANIZATION_SLUG_MAX_LENGTH}文字の半角英数字とハイフン（先頭と末尾はハイフン以外）。
          {editing && "変更すると団体ページの URL も変わります"}
        </p>
      </div>
      <div>
        <label className="label" htmlFor="org-description">
          紹介文（任意）
        </label>
        <textarea
          id="org-description"
          name="description"
          className="input"
          rows={3}
          maxLength={1000}
          defaultValue={organization?.description ?? ""}
          placeholder="活動内容や、LT会の雰囲気など"
        />
      </div>
      <WebhookUrlField
        id="org-webhook-url"
        defaultValue={organization?.webhookUrl}
        help="設定すると、この団体に紐付いたLT会の作成・開催日決定のお知らせを団体の Discord チャンネルに流せます。URL はオーナーにしか表示されません。"
      />
      <FormMessage state={state} successText="保存しました" />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "保存中…" : editing ? "保存する" : "団体を作成する"}
      </button>
    </form>
  );
}
