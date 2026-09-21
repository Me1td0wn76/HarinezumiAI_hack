import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-lg font-bold">ページが見つかりません</p>
      <Link href="/" className="btn-secondary mt-4">
        トップへ戻る
      </Link>
    </div>
  );
}
