import { permanentRedirect } from "next/navigation";

/**
 * 大文字小文字を区別しない URL パラメータ（ハンドル・団体の slug）を小文字にそろえる。
 * /users/Taro のような URL は正規の小文字の URL（`${basePath}/taro`）へ 308 で移動させる。
 * generateMetadata とページは並行して動くので、両方で呼ぶ（片方だけだと、もう片方が先に 404 を出し得る）
 */
export function canonicalLowercaseParam(raw: string, basePath: string): string {
  const value = raw.toLowerCase();
  if (raw !== value) permanentRedirect(`${basePath}/${value}`);
  return value;
}
