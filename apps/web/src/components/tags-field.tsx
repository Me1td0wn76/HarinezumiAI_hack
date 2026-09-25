import { TAG_MAX_LENGTH, TAG_MAX_PER_EVENT } from "@lt/shared";

/**
 * タグの入力欄。name は tags（actions/form.ts の parseTags で分割する）
 * @param defaultTags 編集時の現在のタグ
 */
export function TagsField({ defaultTags }: { defaultTags?: string[] }) {
  return (
    <div>
      <label className="label" htmlFor="tags">
        タグ（任意・{TAG_MAX_PER_EVENT}つまで）
      </label>
      <input
        id="tags"
        name="tags"
        className="input"
        placeholder="web, typescript, 初心者歓迎"
        maxLength={(TAG_MAX_LENGTH + 2) * TAG_MAX_PER_EVENT}
        defaultValue={defaultTags?.join(", ")}
      />
      <p className="mt-1 text-xs text-subtle">カンマか空白で区切ります。興味のある人に見つけてもらいやすくなります。</p>
    </div>
  );
}
