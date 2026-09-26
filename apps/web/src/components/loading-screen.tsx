/**
 * 読み込み中の画面（app/loading.tsx から使う）。ヘッダーの下を黄色い帯で埋め、
 * ハリネズミの頭の上でロゴの稲妻が下から充電されていき、満タンでキラッと光ってハリネズミが跳ねる。
 * 絵と動きは globals.css の .lt-loading-* で描く（JS を使わないので Server Component のまま）。
 * 「動きを減らす」設定・演出 OFF のときは、充電が 2/3 たまった絵で止まる
 *
 * 読み上げは role="status" の中の sr-only の文だけ。絵とラベル（点が跳ねる）は aria-hidden
 */
export function LoadingScreen({ label = "読み込み中" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="lt-loading">
      <span className="sr-only">{label}…</span>
      <div aria-hidden="true" className="lt-loading-stage">
        <span className="lt-loading-halo" />
        <span className="lt-loading-shadow" />
        {/* 稲妻はロゴ（nav.tsx）と同じ形。clipPath の四角が下から上がって、オレンジが満ちていく */}
        <svg className="lt-loading-bolt" viewBox="0 0 24 24">
          <defs>
            <clipPath id="lt-loading-charge">
              <rect className="lt-loading-level" x="0" y="0" width="24" height="24" />
            </clipPath>
          </defs>
          <path className="lt-bolt-empty" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
          <path className="lt-bolt-full" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" clipPath="url(#lt-loading-charge)" />
          <path className="lt-bolt-line" d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
          <g className="lt-bolt-sparks">
            <path d="M20.5 3.5l2.2-1.6" />
            <path d="M3.2 8.2l-2.4-.6" />
            <path d="M20.4 17.6l2.3 1.1" />
            <path d="M6 21l-1.7 1.8" />
          </g>
        </svg>
        {/* ハリネズミ。針（.lt-hh-back）は満タンで立ち、目は満タンのあいだだけにっこり（.lt-hh-happy）になる */}
        <svg className="lt-loading-hh" viewBox="0 0 170 130">
          <ellipse className="lt-hh-foot" cx="58" cy="115" rx="9" ry="5.5" />
          <ellipse className="lt-hh-foot" cx="100" cy="115" rx="9" ry="5.5" />
          <g className="lt-hh-back">
            <path className="lt-hh-spikes" d="M33 100L18 96L29 86L16 77L30 71L21 59L36 58L31 44L46 47L46 31L60 39L64 24L75 35L83 22L90 36L102 26L105 41L120 35L117 50L133 48L126 62L141 65L131 76L144 83L130 90L110 100L46 100Z" />
            <path className="lt-hh-quills" d="M50 54l-6-6M70 42l-2-8M92 42l4-7M40 74l-8-3" />
          </g>
          <path className="lt-hh-belly" d="M32 100c4-8 24-12 50-12s44 5 46 13c1 9-20 15-48 15s-50-6-48-16z" />
          <path className="lt-hh-line" d="M33 104c6 8 24 12 47 12s40-4 46-12" />
          <path className="lt-hh-skin" d="M98 58c-2-9 6-15 13-11 5 3 5 10 1 14" />
          <path className="lt-hh-skin" d="M96 54c22-2 42 12 52 30 3 5 1 10-5 11-10 2-16 12-30 16-16 4-34-2-38-16-4-14 2-38 21-41z" />
          <path className="lt-hh-ear-in" d="M102 56c0-4 4-6 7-4" />
          <ellipse className="lt-hh-cheek" cx="122" cy="90" rx="7" ry="4" />
          <g className="lt-hh-eye">
            <ellipse cx="118" cy="74" rx="4" ry="4.8" />
            <circle cx="119.5" cy="72.2" r="1.4" />
          </g>
          <path className="lt-hh-happy" d="M113 76q5-7 10 0" />
          <circle className="lt-hh-nose" cx="147" cy="88" r="4.6" />
          <path className="lt-hh-mouth" d="M136 95q4 3 8-1" />
        </svg>
      </div>
      <p aria-hidden="true" className="lt-loading-label">
        {label}
        <span className="lt-loading-dots">
          <span />
          <span />
          <span />
        </span>
      </p>
    </div>
  );
}
