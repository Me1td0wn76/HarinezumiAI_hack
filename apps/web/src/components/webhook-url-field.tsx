const DEFAULT_HELP =
  "設定すると、作成・開催日決定のお知らせを自分の Discord チャンネルに流せます。URL は主催者にしか表示されません。";

/** Discord Webhook URL の入力欄。LT会の作成フォーム・主催者メニュー・団体のフォームで共通 */
export function WebhookUrlField({
  id,
  defaultValue,
  help = DEFAULT_HELP,
}: {
  id: string;
  defaultValue?: string | null;
  help?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        Discord Webhook URL（任意）
      </label>
      <input
        id={id}
        name="webhookUrl"
        type="url"
        inputMode="url"
        className="input"
        defaultValue={defaultValue ?? ""}
        placeholder="https://discord.com/api/webhooks/..."
        pattern="https://(ptb\.|canary\.)?discord(app)?\.com/api/webhooks/.+"
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`} className="mt-1 text-xs text-subtle">
        {help}
      </p>
    </div>
  );
}
