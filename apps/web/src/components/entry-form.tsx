"use client";

import {
  ENTRY_ROLE,
  TALK_DETAIL_MAX_LENGTH,
  TALK_DURATION_MAX_MINUTES,
  TALK_TITLE_MAX_LENGTH,
  type EntryRole,
  type EventEntryDto,
} from "@lt/shared";
import { useActionState, useId, useState } from "react";
import { submitEntry, withdrawEntry } from "@/actions/entries";
import { keepValuesOnSubmit } from "@/lib/keep-values-on-submit";
import { FormMessage } from "./form-message";

const ROLE_OPTION: Record<EntryRole, { icon: string; label: string; hint: string }> = {
  SPEAKER: { icon: "🎤", label: "登壇する", hint: "LT で発表します" },
  AUDIENCE: { icon: "👀", label: "聴講する", hint: "発表を聞きに行きます" },
};

/**
 * 参加表明（登壇 / 聴講）のフォーム。登壇を選んだときだけ発表内容の入力欄を出す。
 * 入力は state で持ち、送信は keepValuesOnSubmit で引き取る（React 19 のフォーム action は送信後に入力欄を
 * リセットするため、そのままだと表示が空に戻り、state と食い違ったまま再送信されてしまう）
 */
export function EntryForm({ eventId, initial }: { eventId: string; initial: EventEntryDto | null }) {
  const [state, action, pending] = useActionState(submitEntry, undefined);
  const [withdrawState, withdrawAction, withdrawing] = useActionState(withdrawEntry, undefined);
  const [role, setRole] = useState<EntryRole | null>(initial?.role ?? null);
  const [talkTitle, setTalkTitle] = useState(initial?.talkTitle ?? "");
  const [talkDetail, setTalkDetail] = useState(initial?.talkDetail ?? "");
  const [duration, setDuration] = useState(initial?.durationMinutes?.toString() ?? "");
  // 直前に行った操作。表明と取り消しの結果は別々の state に残るので、最後の操作の結果だけを出す
  // （取り消した後に、前回の「参加表明しました」が残らないようにする）。
  // 新規か更新かは送信時点で決める（保存後は initial が入るので、後から判定すると常に「更新」になる）
  const [lastAction, setLastAction] = useState<"create" | "update" | "withdraw" | null>(null);
  const submitWithValues = keepValuesOnSubmit(action);
  const id = useId();

  return (
    <div className="space-y-3">
      <form
        action={action}
        onSubmit={(e) => {
          setLastAction(initial ? "update" : "create");
          submitWithValues(e);
        }}
        className="space-y-4"
      >
        <input type="hidden" name="eventId" value={eventId} />
        <fieldset>
          <legend className="label">参加のしかた</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENTRY_ROLE.map((r) => (
              <label key={r} className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  className="peer sr-only"
                  required
                />
                <span className="block rounded-[1.25rem] border-2 border-border-strong bg-card px-4 py-3 transition-colors hover:border-primary/70 peer-checked:border-primary peer-checked:bg-secondary/60 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40">
                  <span className="block font-display font-extrabold text-foreground">
                    <span aria-hidden="true">{ROLE_OPTION[r].icon} </span>
                    {ROLE_OPTION[r].label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{ROLE_OPTION[r].hint}</span>
                </span>
              </label>
            ))}
          </div>
          {/* 聴講でも名前は一覧に出るので、選ぶ前に分かるようにする */}
          <p className="mt-1.5 text-xs text-muted-foreground">表明すると、名前が「登壇者・参加者」の一覧に表示されます。</p>
        </fieldset>

        {role === "SPEAKER" && (
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor={`${id}-title`}>
                発表タイトル <span className="text-danger-foreground">*</span>
              </label>
              <input
                id={`${id}-title`}
                name="talkTitle"
                className="input"
                required
                maxLength={TALK_TITLE_MAX_LENGTH}
                value={talkTitle}
                onChange={(e) => setTalkTitle(e.target.value)}
                placeholder="例: Rust で CLI を作ってみた"
              />
              <p className="mt-1 text-xs text-muted-foreground">発表タイトルも一覧で公開されます。</p>
            </div>
            <div>
              <label className="label" htmlFor={`${id}-detail`}>
                話す内容（任意）
              </label>
              <textarea
                id={`${id}-detail`}
                name="talkDetail"
                className="input"
                rows={3}
                maxLength={TALK_DETAIL_MAX_LENGTH}
                value={talkDetail}
                onChange={(e) => setTalkDetail(e.target.value)}
                placeholder="概要、デモの有無、必要な機材など"
              />
            </div>
            <div>
              <label className="label" htmlFor={`${id}-duration`}>
                発表時間の見込み（分・任意）
              </label>
              <input
                id={`${id}-duration`}
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={TALK_DURATION_MAX_MINUTES}
                className="input w-32"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5"
              />
            </div>
            <p className="text-xs text-muted-foreground">話す内容と発表時間は主催者だけに見えます。</p>
          </div>
        )}

        {(lastAction === "create" || lastAction === "update") && (
          <FormMessage
            state={state}
            successText={lastAction === "update" ? "参加表明を更新しました" : "参加表明しました"}
          />
        )}
        {/* 役割が未選択でも押せるようにし、ブラウザの必須チェックで「選んでください」と案内させる（無言で押せないボタンにしない） */}
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "送信中…" : initial ? "参加表明を更新する" : "参加表明する"}
        </button>
      </form>

      {initial && (
        <form
          action={withdrawAction}
          onSubmit={(e) => {
            if (!window.confirm("参加表明を取り消しますか？")) {
              e.preventDefault();
              return;
            }
            setLastAction("withdraw");
          }}
        >
          <input type="hidden" name="eventId" value={eventId} />
          <button type="submit" className="btn-secondary text-xs" disabled={withdrawing}>
            {withdrawing ? "取り消し中…" : "参加表明を取り消す"}
          </button>
        </form>
      )}
      {/* 取り消しに成功すると上のフォームごと消えるので、結果はフォームの外に出す */}
      {lastAction === "withdraw" && <FormMessage state={withdrawState} successText="参加表明を取り消しました" />}
    </div>
  );
}
