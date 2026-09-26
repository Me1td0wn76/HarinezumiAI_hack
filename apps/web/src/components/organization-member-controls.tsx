"use client";

import { ORGANIZATION_ROLE_LABEL, type OrganizationRole } from "@lt/shared";
import { useActionState } from "react";
import {
  addOrganizationMember,
  deleteOrganization,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/actions/organizations";
import { FormMessage } from "./form-message";

/** OWNER 向け: ハンドルでメンバーを追加する（団体は招待制） */
export function AddMemberForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(addOrganizationMember, undefined);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <label className="label" htmlFor="member-handle">
        メンバーを追加
      </label>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-48 flex-1 items-center gap-1">
          <span aria-hidden="true" className="text-sm text-subtle">
            @
          </span>
          <input
            id="member-handle"
            name="handle"
            className="input"
            required
            maxLength={50}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            placeholder="ハンドル"
          />
        </div>
        <select name="role" className="input w-auto" defaultValue="MEMBER" aria-label="役割">
          <option value="MEMBER">{ORGANIZATION_ROLE_LABEL.MEMBER}</option>
          <option value="OWNER">{ORGANIZATION_ROLE_LABEL.OWNER}</option>
        </select>
        <button type="submit" className="btn-primary text-xs" disabled={pending}>
          {pending ? "追加中…" : "追加"}
        </button>
      </div>
      <FormMessage state={state} successText="メンバーを追加しました" />
    </form>
  );
}

/** OWNER 向け: 1人分の役割変更と削除 */
export function MemberActions({
  slug,
  userId,
  displayName,
  role,
}: {
  slug: string;
  userId: string;
  displayName: string;
  role: OrganizationRole;
}) {
  const [roleState, roleAction, changing] = useActionState(updateOrganizationMemberRole, undefined);
  const [removeState, removeAction, removing] = useActionState(removeOrganizationMember, undefined);
  const nextRole: OrganizationRole = role === "OWNER" ? "MEMBER" : "OWNER";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap justify-end gap-1.5">
        <form action={roleAction}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="role" value={nextRole} />
          <button type="submit" className="btn-secondary px-3 py-1.5 text-xs" disabled={changing}>
            {nextRole === "OWNER" ? "オーナーにする" : "メンバーに戻す"}
          </button>
        </form>
        <form
          action={removeAction}
          onSubmit={(e) => {
            if (!window.confirm(`${displayName} さんを団体から外しますか？`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="userId" value={userId} />
          <button type="submit" className="btn-danger px-3 py-1.5 text-xs" disabled={removing}>
            外す
          </button>
        </form>
      </div>
      <FormMessage state={roleState} />
      <FormMessage state={removeState} />
    </div>
  );
}

/** メンバー本人が団体を抜ける */
export function LeaveButton({ slug, userId, name }: { slug: string; userId: string; name: string }) {
  const [state, action, pending] = useActionState(removeOrganizationMember, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`「${name}」を抜けますか？もう一度参加するにはオーナーに追加してもらう必要があります。`)) {
          e.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="btn-secondary text-xs" disabled={pending}>
        {pending ? "処理中…" : "団体を抜ける"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

/** OWNER 向け: 団体の削除。紐付いていたLT会は残る */
export function DeleteOrganizationButton({ slug, name }: { slug: string; name: string }) {
  const [state, action, pending] = useActionState(deleteOrganization, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`「${name}」を削除します。LT会は残りますが、団体との紐付けは外れます。元に戻せません。よろしいですか？`)) {
          e.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="btn-danger text-xs" disabled={pending}>
        {pending ? "削除中…" : "団体を削除"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
