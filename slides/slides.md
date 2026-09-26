---
theme: default
title: LT会支援アプリ
info: |
  LT会を気軽に立てて、見つけて、参加できる Web アプリ「LT会支援アプリ」の発表資料。
colorSchema: light
aspectRatio: 16/9
canvasWidth: 980
fonts:
  sans: Zen Kaku Gothic New
  weights: '400,500,700,900'
transition: slide-left
drawings:
  persist: false
mdc: true
layout: hero
---

<span class="eyebrow"><Bolt :size="12" /> LT会支援アプリ</span>

<h1 class="hero-title">LT会を<br>もっと気軽に<br>始めよう。</h1>

<p class="hero-lead">タイトルと候補日を書くだけ。集まって、話して、また次へ。</p>

<!--
LT会支援アプリの発表です。
LT会を「立てる・見つける・参加する」を、SNS に投稿するくらいの気軽さでできる Web アプリを作りました。
-->

---

<div class="eyebrow"><Bolt :size="12" /> PROBLEM</div>

# LT会、開くのって大変じゃない？

<FleeingIcons class="corner-icons" :icons="['megaphone', 'calendar', 'hourglass']" />

<div class="grid grid-cols-3 gap-5 mt-5">
  <div v-click class="lt-card min-h-56">
    <div class="num">01</div>
    <h3>人が集まらない</h3>
    <p>告知しても届かず、いつもの顔ぶれで終わってしまう</p>
  </div>
  <div v-click class="lt-card min-h-56">
    <div class="num">02</div>
    <h3>集まれる日がわからない</h3>
    <p>人が集まる日にしか開けないのに、みんなの都合が見えない</p>
  </div>
  <div v-click class="lt-card min-h-56">
    <div class="num">03</div>
    <h3>日程調整がめんどう</h3>
    <p>候補日を送って、返事を集めて、数えて……主催者も参加者もひと苦労</p>
  </div>
</div>

<p v-click class="!mt-10 text-center text-xl font-bold">このハードルを下げて、LT会をもっと増やしたい</p>

<!--
LT会を開こうとすると、よくある悩みが 3 つあります。（クリックごとに 1 つずつ）
1. 人が集まらない。告知しても届かない。
2. 人が集まる日にしか開けないのに、その日がわからない。
3. 日程調整そのものが面倒。
このハードルを下げたい、というのが出発点です。
-->

---

<div class="eyebrow"><Bolt :size="12" /> SOLUTION</div>

# SNS に投稿するくらいの気軽さで

学校・会社・コミュニティを問わず、全国の誰でも使える LT会の公開サービス

<div class="grid grid-cols-3 gap-5 mt-5">
  <div class="verb verb-peach">
    <div class="flex items-start justify-between">
      <div class="verb-label">立てる</div>
      <LtIcon name="pencil" :size="44" />
    </div>
    <p>タイトルと候補日を書くだけで公開。共有URLを貼って呼びかける</p>
  </div>
  <div class="verb verb-yellow">
    <div class="flex items-start justify-between">
      <div class="verb-label">見つける</div>
      <LtIcon name="magnifier" :size="44" />
    </div>
    <p>新着・タグ・キーワード・開催形式から、行きたいLT会を探す</p>
  </div>
  <div class="verb verb-cream">
    <div class="flex items-start justify-between">
      <div class="verb-label">参加する</div>
      <LtIcon name="mic" :size="44" />
    </div>
    <p>候補日に ○△× で答えて、登壇か聴講かを表明する</p>
  </div>
</div>

<!--
答えは「SNS に投稿するくらいの気軽さ」です。
最初は学内向けで考えていましたが、全国の誰でも使える公開サービスに方針を変えました。
できることは「立てる・見つける・参加する」の 3 つです。
-->

---

<div class="eyebrow"><Bolt :size="12" /> FLOW</div>

# LT会ができるまで

<FleeingIcons class="corner-icons" :icons="['flag', 'clap', 'check']" />

<div class="flow mt-5">
  <div class="lt-card">
    <span class="role">主催者</span>
    <div class="num mt-2">1</div>
    <h3>立てる</h3>
    <p>話したいことと候補日を書いて公開。共有URLを Discord・LINE・X に貼って呼びかける</p>
  </div>
  <div v-click="1" class="arch-arrow">→</div>
  <div v-click="1" class="lt-card">
    <span class="role">参加者</span>
    <div class="num mt-2">2</div>
    <h3>集まる</h3>
    <p>候補日ごとに ○△× で回答。共有URLならログインなしで答えられる。登壇か聴講かも表明する</p>
  </div>
  <div v-click="2" class="arch-arrow">→</div>
  <div v-click="2" class="lt-card">
    <span class="role">主催者</span>
    <div class="num mt-2">3</div>
    <h3>決まる</h3>
    <p>集計を見て開催日を決定。回答した人に通知が届き、配信URLも見られるようになる</p>
  </div>
</div>

<p v-click="3" class="!mt-6">開催後は主催者が「終了」にする。関わったLT会はマイページの参加履歴に残る</p>

<!--
LT会ができるまでは 3 ステップです。
主催者が立てて、参加者が集まって、主催者が決める。
ここからは、それぞれのステップの画面を見ていきます。
-->

---

<div class="screen-slide">
<div>
  <div class="eyebrow"><Bolt :size="12" /> HOME</div>
  <h1>入口の HOME</h1>
  <ul>
    <li>最初に目に入るのは「LT会をもっと気軽に始めよう。」</li>
    <li>近日開催のLT会（今後 60 日）と人気のタグ</li>
    <li>「探す」と「作る」の 2 つの入口から始められる</li>
  </ul>
</div>
<div class="screen-stack mt-4">
  <Screen src="/screens/home.png" alt="HOME の画面。黄色い帯に「LT会をもっと気軽に始めよう。」の見出し" />
  <Screen v-click class="overlay" src="/screens/home-upcoming.png" alt="HOME の近日開催のLT会と人気のタグ" />
</div>
</div>

<!--
HOME です。黄色が主役の、明るい見た目にしました。
（クリック）下にスクロールすると、近日開催のLT会と人気のタグが並びます。
-->

---

<div class="screen-slide">
<div>
  <div class="eyebrow"><Bolt :size="12" /> STEP 1</div>
  <h1>立てる</h1>
  <ul>
    <li>必須はタイトルと候補日だけ。発表内容・タグは任意</li>
    <li>右の「できあがりイメージ」で、HOME での見え方をその場で確かめられる</li>
    <li>基本情報 → 開催形式 → 候補日と埋めるごとに、稲妻が充電されていく</li>
    <li>オンライン / オフライン / ハイブリッド。配信URLは開催日が決まってから回答者だけに見せる</li>
  </ul>
</div>
<div class="mt-4">
  <Screen src="/screens/create.png" url="localhost:3000/events/new" alt="LT会を作る画面。左に入力フォーム、右にできあがりイメージ" />
</div>
</div>

<!--
LT会を作る画面です。必須はタイトルと候補日だけにして、投稿するくらいの手軽さにしました。
右側に HOME でどう見えるかがそのまま出るので、公開前に確かめられます。
-->

---

<div class="screen-slide">
<div>
  <div class="eyebrow"><Bolt :size="12" /> STEP 2</div>
  <h1>集まる</h1>
  <ul>
    <li>候補日ごとに ○ / △ / × で回答。コメントも添えられる</li>
    <li>共有URLからなら、ログインなしで回答できる</li>
    <li>「このLT会に参加する」で登壇・聴講を表明。登壇は発表タイトルも</li>
    <li>回答状況は横棒で、どの日が有力か一目でわかる</li>
  </ul>
</div>
<div class="screen-stack mt-4">
  <Screen src="/screens/detail.png" url="localhost:3000/events/…" alt="LT会の詳細画面。タイトル、主催者、タグ、参加ボタン、共有ボタン" />
  <Screen v-click class="overlay" style="width: 42%" src="/screens/responses.png" alt="回答状況の横棒と、○△× で回答するフォーム" />
</div>
</div>

<!--
LT会の詳細画面です。参加者は候補日ごとに ○△× で答えます。
2 値ではなく △ を入れたのは、主催者が日を決めるときの判断材料を増やすためです。
（クリック）回答状況は横棒で見せています。
共有URLからならログインなしで答えられるので、アカウントを作ってもらう手間がありません。
-->

---

<div class="screen-slide">
<div>
  <div class="eyebrow"><Bolt :size="12" /> STEP 3</div>
  <h1>決まる</h1>
  <ul>
    <li>候補日ごとの ○△× の人数を見て「この日に決定」</li>
    <li>回答した人にアプリ内通知。配信URLも見えるようになる</li>
    <li>主催者のコミュニティの Discord にも自動で投稿（Webhook）</li>
    <li>共有URLは X・LINE でも送れる（OGP 画像つき）</li>
  </ul>
</div>
<div class="mt-2 flex justify-center">
  <Screen style="width: 400px" src="/screens/organizer.png" url="localhost:3000/events/…" alt="主催者メニュー。共有URLと、候補日ごとの人数と「この日に決定」ボタン" />
</div>
</div>

<!--
主催者にだけ見える主催者メニューです。
候補日ごとの人数を見比べて「この日に決定」を押すと、回答した人に通知が届きます。
Discord の Webhook を設定しておけば、自分のコミュニティのチャンネルにも自動で流れます。
-->

---

<div class="screen-slide">
<div>
  <div class="eyebrow"><Bolt :size="12" /> DISCOVER</div>
  <h1>見つける</h1>
  <ul>
    <li>新着のLT会をタイムラインのように眺められる</li>
    <li>タグ・キーワード・開催形式・状態で絞り込み</li>
    <li>公開プロフィール（@ハンドル）: 主催したLT会・参加予定・フォロー</li>
    <li>団体ページで、団体名義のLT会をまとめて見られる</li>
  </ul>
</div>
<div class="screen-stack mt-4">
  <Screen src="/screens/events.png" url="localhost:3000/events" alt="LT会を探す画面。検索欄、状態のタブ、開催形式と人気のタグ" />
  <Screen v-click class="overlay" src="/screens/profile.png" url="localhost:3000/users/…" alt="公開プロフィール。アバター、ハンドル、フォロー数、主催したLT会" />
</div>
</div>

<!--
全国向けにすると、「自分に関係あるLT会」が見つからないと使われません。
そこで、タグ・キーワード・開催形式で探せるようにしました。
（クリック）人のページもあり、主催したLT会や参加予定が見られて、フォローもできます。
-->

---

<div class="eyebrow"><Bolt :size="12" /> ANSWER</div>

# 課題と機能の対応

<FleeingIcons class="corner-icons" :icons="['bulb', 'check', 'megaphone']" />

| 課題 | 機能 |
| --- | --- |
| 日程調整がめんどう | ○△× で回答するだけで人数を自動集計。ワンクリックで開催日を決定 |
| 集まれる日がわからない | 候補日ごとの ○△× を横棒で比較。回答にはコメントも添えられる |
| 人が集まらない（身近な人） | ログインなしで回答できる共有URL、Discord への自動投稿、X・LINE 共有 |
| 人が集まらない（全国） | タグ・キーワード検索、公開プロフィールとフォロー、団体ページ |

<!--
最初の 3 つの課題に、それぞれどの機能で答えたかの対応です。
「人が集まらない」は、身近な人に届ける手段と、全国から見つけてもらう手段の両方を用意しました。
-->

---

<div class="eyebrow"><Bolt :size="12" /> DESIGN</div>

# 気軽さは、見た目と動きからも

<FleeingIcons class="corner-icons" :icons="['spotlight', 'mic', 'clap']" />

<div class="grid grid-cols-[220px_1fr] gap-10 mt-2">
<div>
  <div class="swatch"><i style="background: #ffe45c"></i><div><b>黄色</b><span>主役。ページ上部の帯</span></div></div>
  <div class="swatch"><i style="background: #ff9f43"></i><div><b>オレンジ</b><span>主な操作ボタン</span></div></div>
  <div class="swatch"><i style="background: #ffd7b0"></i><div><b>ピーチ</b><span>「作る」の色</span></div></div>
  <div class="swatch"><i style="background: #fff9db"></i><div><b>クリーム</b><span>カード</span></div></div>
  <div class="swatch"><i style="background: #2b2410"></i><div><b>濃い茶色</b><span>文字。真っ黒にしない</span></div></div>
</div>
<div class="text-sm">
  <h3>動き</h3>
  <ul>
    <li>ボタンは押すと、ばねのように縮んで戻る</li>
    <li>何もない所をクリックすると、6 色の波紋が広がる</li>
    <li>見出しの横のアイコンは、カーソルから逃げる（右上のアイコンも同じ）</li>
  </ul>
  <h3 class="!mt-5">使いやすさへの配慮</h3>
  <ul>
    <li>OS の「視差効果を減らす」設定では動かさない。フッターから OFF にもできる</li>
    <li>波紋はリンク・ボタン・入力欄の上では出さない</li>
    <li>文字のコントラストは WCAG AA（4.5:1）以上</li>
  </ul>
</div>
</div>

<!--
気軽さは機能だけでなく、見た目と動きでも出しています。
黄色を主役にして、黒は文字にだけ、それも濃い茶色にしました。
右上のアイコンにカーソルを近づけると逃げます。アプリの見出しと同じ動きです。
一方で、動きが苦手な人のために、OS の設定に合わせて止めたり、フッターから OFF にしたりできます。
-->

---

<div class="eyebrow"><Bolt :size="12" /> ARCHITECTURE</div>

# ブラウザは Next.js とだけ話す

<div class="arch mt-6">
  <div class="arch-box">
    <div class="arch-name">ブラウザ</div>
    <div class="arch-sub">PC / スマホ</div>
  </div>
  <div class="arch-arrow">⇄<small>Cookie</small></div>
  <div class="arch-box is-key">
    <div class="arch-name">Next.js 16</div>
    <div class="arch-sub">App Router<br>画面 + BFF</div>
    <span class="arch-host">Vercel</span>
  </div>
  <div class="arch-arrow">→<small>REST + JWT</small></div>
  <div class="arch-box is-key">
    <div class="arch-name">NestJS 12</div>
    <div class="arch-sub">REST API<br>Prisma 7</div>
    <span class="arch-host">Render</span>
  </div>
  <div class="arch-arrow">→</div>
  <div class="arch-box">
    <div class="arch-name">PostgreSQL 17</div>
    <div class="arch-sub">pg_trgm で<br>日本語の部分一致検索</div>
    <span class="arch-host">Neon</span>
  </div>
  <div class="shared-bar">packages/shared — リクエスト / レスポンスの型と列挙値を web・api で共有</div>
</div>

<div v-click class="grid grid-cols-2 gap-5 mt-6">
  <div class="lt-card">
    <h3>BFF にした理由</h3>
    <p>ブラウザから API を直接呼ばないので、CORS を気にしなくてよい。JWT は httpOnly Cookie に入れ、JavaScript から触れない</p>
  </div>
  <div class="lt-card">
    <h3>API を分けた理由</h3>
    <p>画面と API で担当を分けやすい。将来のスマホアプリからも同じ API を使える</p>
  </div>
</div>

<!--
構成です。pnpm の monorepo で、画面は Next.js、API は NestJS、DB は PostgreSQL です。
ブラウザは Next.js とだけ通信し、Next.js のサーバー側が API を呼ぶ BFF 構成にしました。
型は packages/shared に置いて、画面と API で二重に書かないようにしています。
本番は Vercel・Render・Neon で、どれも無料枠で動きます。
-->

---

<div class="eyebrow"><Bolt :size="12" /> BACKEND</div>

# API は 3 層に分ける

<div class="grid grid-cols-[250px_1fr] gap-10 mt-2">
  <div>
    <div class="layer"><b>Controller</b><span>HTTP の受け付けと返却</span></div>
    <div class="layer-arrow">↓</div>
    <div class="layer is-key"><b>Service</b><span>業務ルール（誰が何をできるか）</span></div>
    <div class="layer-arrow">↓</div>
    <div class="layer"><b>Repository</b><span>Prisma でデータベースへ</span></div>
    <div class="layer-arrow">↓</div>
    <div class="layer"><b>PostgreSQL</b><span>16 テーブル</span></div>
  </div>
  <div>
    <h3>機能ごとのモジュール（16）</h3>
    <div class="mt-1">
      <span class="chip">auth</span><span class="chip">users</span><span class="chip">profiles</span><span class="chip">follows</span><span class="chip">events</span><span class="chip">responses</span><span class="chip">entries</span><span class="chip">schedule</span><span class="chip">share</span><span class="chip">comments</span><span class="chip">notifications</span><span class="chip">organizations</span><span class="chip">reports</span><span class="chip">blocks</span><span class="chip">admin</span><span class="chip">mail</span>
    </div>
    <ul class="!mt-5 text-sm">
      <li>Service は Prisma を直接使わない。Repository を差し替えて、DB なしで単体テストできる</li>
      <li>レスポンスの型は packages/shared に置き、Prisma の型から mapper で変換して返す</li>
      <li>Prisma の enum と shared の列挙値はそろえておく</li>
    </ul>
  </div>
</div>

<!--
API は Controller・Service・Repository の 3 層です。
Service に Prisma を直接入れないことで、Repository をモックに差し替えて、DB なしで業務ルールをテストできます。
-->

---

<div class="eyebrow"><Bolt :size="12" /> SAFETY</div>

# 誰でも使える、だから守りも

<div class="grid grid-cols-2 gap-4 mt-3">
  <div class="lt-card">
    <h3>スパム対策</h3>
    <p>IP ごとのレート制限（全体 120 回/分、ログイン 10 回/分 など）。会場の Wi-Fi で参加者全員が同じ IP でも詰まらない上限にした</p>
  </div>
  <div class="lt-card">
    <h3>通報・ブロック・非表示</h3>
    <p>LT会とユーザーを通報でき、運営が確認して非表示にできる。ブロックした相手のLT会やコメントは表示しない</p>
  </div>
  <div class="lt-card">
    <h3>アカウント</h3>
    <p>パスワードは bcrypt。Google ログインは OAuth 2.0 + PKCE。同じメールの既存アカウントには自動で紐付けない（乗っ取り対策）</p>
  </div>
  <div class="lt-card">
    <h3>個人情報</h3>
    <p>メールアドレスは本人以外に返さない。アバターに Gravatar を使わない。配信URLは回答した人だけに見せる</p>
  </div>
</div>

<!--
誰でも投稿できる公開サービスなので、守りも入れました。
面白いのはレート制限で、LT会の会場では参加者全員が同じ Wi-Fi、つまり同じ IP から一斉に回答します。
その人数で詰まらない上限にして、1 つの IP からの大量投稿だけを止めています。
Google ログインでは、同じメールのアカウントに自動で紐付けると乗っ取りに使えるので、あえて紐付けていません。
-->

---

<div class="eyebrow"><Bolt :size="12" /> TEAM</div>

# チームでの作り方

<div class="grid grid-cols-3 gap-4 mt-3">
  <div class="lt-card">
    <h3>決めたことを残す</h3>
    <p>設計判断は理由と日付をつけて docs に記録し、蒸し返さない。「学内向け → 全国向け」の方針転換もここで整理した</p>
  </div>
  <div class="lt-card">
    <h3>Issue と PR で進める</h3>
    <p>本体にない機能は Issue に切り出し、優先度ラベル（high / medium / low）の順に PR で取り込む</p>
  </div>
  <div class="lt-card">
    <h3>テストと CI</h3>
    <p>Service の単体テストと、本物の PostgreSQL を使う e2e テスト。push・PR ごとに GitHub Actions で lint とテストを回す</p>
  </div>
</div>

<div v-click class="lt-card ai-card mt-5">
  <h3>AI エージェント（Claude Code）と並行開発</h3>
  <p>CLAUDE.md に「守る約束」を書き、1 PR = 1 worktree で複数のセッションを並行して動かす。Next.js / NestJS / Prisma / Playwright のスキルを入れ、1 日の終わりには引き継ぎ資料を残す</p>
</div>

<!--
チームでの進め方です。
決めたことは docs/open-questions.md に理由と日付つきで残し、議論を蒸し返さないようにしました。
（クリック）AI エージェントとも並行で開発しました。守るべき約束を CLAUDE.md に書き、PR ごとに worktree を分けて、複数のセッションを同時に動かしています。
-->

---

<div class="eyebrow"><Bolt :size="12" /> NUMBERS</div>

# 数字で見る

<div class="grid grid-cols-3 gap-4 mt-4">
  <div class="stat"><div class="stat-value">21<small>画面</small></div><div class="stat-label">HOME・探す・作る・詳細・カレンダー・団体 など</div></div>
  <div class="stat"><div class="stat-value">16<small>モジュール</small></div><div class="stat-label">API の機能単位（Controller / Service / Repository）</div></div>
  <div class="stat"><div class="stat-value">16<small>テーブル</small></div><div class="stat-label">マイグレーションも 16 回</div></div>
  <div class="stat"><div class="stat-value">175<small>テスト</small></div><div class="stat-label">単体 161 + e2e 14</div></div>
  <div class="stat"><div class="stat-value">31<small>PR</small></div><div class="stat-label">マージした Pull Request</div></div>
  <div class="stat"><div class="stat-value">210<small>コミット</small></div><div class="stat-label">main ブランチ（2026 年 9 月 26 日時点）</div></div>
</div>

<!--
数字で見るとこのくらいの規模です。
画面は 21、API のモジュールは 16、テストは 175 件あります。
-->

---

<div class="eyebrow"><Bolt :size="12" /> NEXT</div>

# これから

<FleeingIcons class="corner-icons" :icons="['flag', 'bell', 'laptop']" />

<div class="grid grid-cols-2 gap-x-10 mt-3">
<div>
  <ul>
    <li><strong>「フォロー中の人のLT会」のフィード</strong><br>フォローとプロフィールは実装済み</li>
    <li><strong>GitHub / X ログイン</strong><br>プロバイダを足すだけで対応できる形にしてある</li>
    <li><strong>登壇枠の上限</strong><br>人数と持ち時間を主催者が決められるように</li>
  </ul>
</div>
<div>
  <ul>
    <li><strong>メール認証</strong><br>捨てアカウントを減らす</li>
    <li><strong>スマホアプリと Web Push</strong><br>API はそのまま使える</li>
    <li><strong>外部カレンダー連携</strong><br>決まった開催日を自分のカレンダーへ</li>
  </ul>
</div>
</div>

<!--
これからやりたいことです。
一番はフォロー中の人のLT会が流れてくるフィードで、フォローの仕組み自体はもうできています。
-->

---
layout: hero
---

<span class="eyebrow"><Bolt :size="12" /> THANK YOU</span>

<h1 class="hero-title">LT会を、<br>もっと気軽に。</h1>

<p class="hero-lead">ご清聴ありがとうございました</p>

<p class="hero-meta">github.com/Me1td0wn76/HarinezumiAI_hack</p>

<!--
以上です。ありがとうございました。
-->
