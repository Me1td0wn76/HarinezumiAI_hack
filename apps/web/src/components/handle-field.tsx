import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "@lt/shared";

/**
 * ハンドルの入力欄（登録フォームとプロフィール編集で共通）。
 * 大文字は API 側で小文字にするので、入力時は大文字も通す。予約語と重複は API が判定する
 */
export function HandleField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <label className="label" htmlFor="handle">
        ハンドル
      </label>
      <div className="flex items-center gap-1">
        <span aria-hidden="true" className="text-sm text-subtle">
          @
        </span>
        <input
          id="handle"
          name="handle"
          className="input"
          defaultValue={defaultValue}
          required
          minLength={HANDLE_MIN_LENGTH}
          maxLength={HANDLE_MAX_LENGTH}
          pattern="[A-Za-z0-9_]+"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="handle-hint"
        />
      </div>
      <p id="handle-hint" className="mt-1 text-xs text-subtle">
        プロフィールの URL（/users/ハンドル）に使います。{HANDLE_MIN_LENGTH}〜{HANDLE_MAX_LENGTH}文字の半角英数字と _。後から変更できます
      </p>
    </div>
  );
}
