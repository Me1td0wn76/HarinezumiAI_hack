import { LoadingScreen } from "@/components/loading-screen";

/**
 * ページを読み込んでいるあいだ、ヘッダーの下に出す画面。
 * ルートに置いているので、どのページへの移動でも（そのページに loading.tsx が無ければ）これが出る
 */
export default function Loading() {
  return <LoadingScreen />;
}
