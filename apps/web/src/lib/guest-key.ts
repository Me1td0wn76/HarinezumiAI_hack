/**
 * ゲストの guestKey から回答者一覧の responderKey を求める。
 * API は guestKey をそのまま公開せず `guest:<SHA-256 の16進>` にしている（apps/api/src/modules/events/events.mapper.ts）。
 * Web Crypto は非同期なので、クライアントで await して使う
 */
export async function guestResponderKey(guestKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(guestKey));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return `guest:${hex}`;
}
