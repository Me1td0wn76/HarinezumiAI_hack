---
theme: default
title: LT会支援アプリ
info: |
  テーマ「AI（アイ）」を「出会い」と捉えた、LT会支援アプリの発表資料（5 分）。
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
mascot: hedgehog
---

<span class="eyebrow"><Bolt :size="12" /> LT会支援アプリ</span>

<h1 class="hero-title">LT会で、<br>もっと気軽に<br>出会おう。</h1>

<p class="hero-lead">テーマ「AI」＝ 出会い（で<b>あい</b>）。<br>タイトルと候補日を書くだけで、話したい人と聞きたい人が出会う。</p>

<!--
【0:00〜0:10】
みなさん、LT会で誰かと出会ったことはありますか？
私たちはテーマの「AI（アイ）」を「出会い」と捉えて、LT会で人が出会えるアプリを作りました。
（ハリネズミが稲妻を充電しているのは、アプリの読み込み中の画面です）
-->

---

<div class="eyebrow"><Bolt :size="12" /> MEMBER</div>

# 作ったのは、この 4 人

<FleeingIcons class="corner-icons" :icons="['clap', 'mic', 'bubble']" />

<div class="grid grid-cols-4 gap-4 mt-2">
  <Member login="Me1td0wn76" img="/members/Me1td0wn76.jpg" role="設計・API・デプロイ">
    <ul>
      <li>検索・タグ・開催形式</li>
      <li>共有・Discord 通知</li>
      <li>通報・レート制限</li>
      <li>主要な基盤の開発</li>
    </ul>
  </Member>
  <Member login="Sabigon-MA" img="/members/Sabigon-MA.png" role="デザイン・参加表明">
    <ul>
      <li>画面のリデザイン</li>
      <li>登壇・聴講の表明</li>
      <li>みんなのカレンダー</li>
      <li>API のテスト整備</li>
    </ul>
  </Member>
  <Member login="Tongari-Boy" img="/members/Tongari-Boy.png" role="フォロー・回答">
    <ul>
      <li>ユーザーのフォロー</li>
      <li>回答コメントの表示</li>
      <li>決定前の確認ダイアログ</li>
    </ul>
  </Member>
  <Member login="shouras" img="/members/shouras.png" role="通知・プロフィール・団体">
    <ul>
      <li>アプリ内通知</li>
      <li>公開プロフィール</li>
      <li>団体（サークル・研究室）</li>
    </ul>
  </Member>
</div>

<p class="!mt-5 text-center text-sm font-bold">機能ごとに Issue を分けて、4 人で 31 の PR をマージ</p>

<!--
【0:10〜0:25】
メンバーは 4 人です。（一人ずつ名前と担当を一言で）
機能ごとに Issue を分けて、それぞれが PR で持ち寄る形で作りました。
-->

---

<div class="eyebrow"><Bolt :size="12" /> PROBLEM</div>

# LT会は出会いの場。なのに――

<FleeingIcons class="corner-icons" :icons="['megaphone', 'calendar', 'hourglass']" />

<div class="grid grid-cols-3 gap-5 mt-5">
  <div v-click class="lt-card min-h-52">
    <div class="num">01</div>
    <h3>人が集まらない</h3>
    <p>告知しても届かず、いつもの顔ぶれで終わる。新しい出会いが生まれない</p>
  </div>
  <div v-click class="lt-card min-h-52">
    <div class="num">02</div>
    <h3>集まれる日がわからない</h3>
    <p>人が集まる日にしか開けないのに、みんなの都合が見えない</p>
  </div>
  <div v-click class="lt-card min-h-52">
    <div class="num">03</div>
    <h3>日程調整がめんどう</h3>
    <p>候補日を送って、返事を集めて、数えて……開く前に疲れてしまう</p>
  </div>
</div>

<p v-click class="!mt-10 text-center text-xl font-bold">開くハードルが高いと、出会いの場そのものが生まれない</p>

<!--
【0:25〜0:50】
LT会は、話したい人と聞きたい人が出会える場です。でも開こうとすると、3 つの壁があります。（クリックで 1 つずつ）
人が集まらない。集まれる日がわからない。日程調整がめんどう。
開くのが大変だと、出会いの場そのものが生まれません。
-->

---

<div class="eyebrow"><Bolt :size="12" /> CONCEPT</div>

# テーマ「AI」を、出会いの「アイ」に

<div class="grid grid-cols-[300px_1fr] gap-10 mt-2 items-center">
  <div>
    <div class="dea"><ruby>出<rt>で</rt></ruby><ruby class="dea-ai">会い<rt>アイ</rt></ruby></div>
    <p class="dea-caption">LT会を「出会いの入口」にする。<br>SNS に投稿するくらいの気軽さで、<br>立てる・見つける・参加する</p>
  </div>
  <div class="grid gap-3">
    <div v-click class="lt-card meet">
      <h3>話したい人 <span>×</span> 聞きたい人</h3>
      <p>登壇・聴講をワンタップで表明。公開プロフィールとフォローで「また会いたい人」を追える</p>
    </div>
    <div v-click class="lt-card meet">
      <h3>あなた <span>×</span> 気になる話題</h3>
      <p>全国のLT会から、タグ・キーワード・開催形式（オンライン / オフライン）で探せる</p>
    </div>
    <div v-click class="lt-card meet">
      <h3>コミュニティ <span>×</span> コミュニティ</h3>
      <p>ログインなしで答えられる共有URLと Discord への自動投稿で、身内の外まで届く</p>
    </div>
  </div>
</div>

<!--
【0:50〜1:25】
テーマの「AI」は、出会い（であい）の「アイ」として使いました。
このアプリは、LT会を出会いの入口にします。生まれる出会いは 3 つです。（クリックで 1 つずつ）
話したい人と聞きたい人。あなたと気になる話題。そしてコミュニティとコミュニティ。
-->

---

<div class="eyebrow"><Bolt :size="12" /> IDEA</div>

# 日程調整を、出会いの入口にした

<div class="lanes mt-4">
  <div class="lane">
    <div class="lane-label">いつもの<br>LT会</div>
    <div class="lane-steps">
      <span class="step">身内で日程を調整</span><i>→</i>
      <span class="step">日時を決めて告知</span><i>→</i>
      <span class="step">来られる人だけ集まる</span>
    </div>
  </div>
  <div v-click class="lane is-ours">
    <div class="lane-label">このアプリ</div>
    <div class="lane-steps">
      <span class="step">日程を決める前に<br>全国へ公開</span><i>→</i>
      <span class="step">気になった人が<br>○△× で答える</span><i>→</i>
      <span class="step">いちばん集まれる日に<br>開催 → 通知</span>
    </div>
  </div>
</div>

<div v-click class="idea-sum">
  <span class="chip">日程調整の ○△×</span>
  <b>×</b>
  <span class="chip">SNS のタイムライン・フォロー</span>
  <b>＝</b>
  <span class="idea-result">候補日への回答が、そのまま「行きたい」のサインになる</span>
</div>

<!--
【1:25〜2:00】
ここが一番のアイデアです。
いつもの LT会は、身内で日程を決めてから告知するので、来られる人しか集まりません。
（クリック）このアプリでは、日程を決める前に全国へ公開します。気になった人が ○△× で答え、いちばん集まれる日に開催します。
（クリック）日程調整と SNS を組み合わせたことで、候補日への回答が、そのまま「行きたい」のサインになります。
-->

---

<div class="eyebrow"><Bolt :size="12" /> DEMO</div>

# 実際に動かします

<div class="grid grid-cols-3 gap-5 mt-3">
  <div>
    <div class="demo-head"><span class="num">1</span><div><span class="role">主催者</span><h3>立てる</h3></div></div>
    <Screen src="/screens/create.png" url="/events/new" height="170px" alt="LT会を作る画面" />
    <p class="demo-cap">タイトルと候補日を書くだけ。稲妻が充電されていく</p>
  </div>
  <div>
    <div class="demo-head"><span class="num">2</span><div><span class="role">参加者</span><h3>集まる</h3></div></div>
    <Screen src="/screens/responses.png" url="/share/…" height="170px" alt="回答状況の横棒と ○△× の回答フォーム" />
    <p class="demo-cap">共有URLから、ログインなしで ○△× を答える</p>
  </div>
  <div>
    <div class="demo-head"><span class="num">3</span><div><span class="role">主催者</span><h3>決まる</h3></div></div>
    <Screen src="/screens/organizer.png" url="/events/…" height="170px" alt="主催者メニュー。候補日ごとの人数と「この日に決定」ボタン" />
    <p class="demo-cap">集計を見て「この日に決定」。答えた人に通知が届く</p>
  </div>
</div>

<!--
【2:00〜3:30】ここでブラウザに切り替えてデモ（約 90 秒）
事前準備: pnpm dev を起動。主催者は通常ウィンドウで demo@example.com にログイン。参加者用にシークレットウィンドウを開いておく。

1. 主催者: 「LT会を作る」→ タイトルと候補日を 2 つ入れる。右の稲妻が充電されていくのを見せる → 公開（20 秒）
2. 主催者: 詳細ページの主催者メニューから共有URLをコピー（10 秒）
3. 参加者（シークレット）: 共有URLを開き、ログインなしで名前を入れて ○△× を回答（25 秒）。○ を押すと輪が広がる
4. 主催者: 再読み込みして回答状況の横棒を見せ、「この日に決定」を押す（20 秒）
5. 通知のベルを見せて締める（15 秒）

デモが動かなかったら、このスライドの 3 枚の画面で同じ流れを説明する。
-->

---

<div class="eyebrow"><Bolt :size="12" /> FUN</div>

# 触りたくなる仕掛け

<FleeingIcons class="corner-icons" :icons="['spotlight', 'mic', 'clap']" />

<div class="grid grid-cols-[320px_1fr] gap-10 mt-1 items-center">
  <div class="fun-panel">
    <LoadingHedgehog label="読み込み中" :scale="0.85" />
  </div>
  <div>
    <ul>
      <li><strong>読み込み中</strong>は、ハリネズミが稲妻を充電。満タンで跳ねる</li>
      <li><strong>見出しのアイコン</strong>は、カーソルから逃げる（このスライドの右上も）</li>
      <li><strong>○△× を選ぶ</strong>と、その色の輪が広がる</li>
      <li><strong>LT会を作る</strong>と、入力するたびに稲妻がたまっていく</li>
      <li>動きが苦手な人は OFF にできる。OS の「視差効果を減らす」設定にも従う</li>
    </ul>
  </div>
</div>

<!--
【3:30〜4:00】
「触ってみたい」と思ってもらえるように、小さな仕掛けを入れています。
読み込み中は、ハリネズミが稲妻を充電して、満タンになると跳ねます。
右上のアイコンにカーソルを近づけると逃げます。（実際に近づけて見せる）
一方で、動きが苦手な人のために OFF にもできます。
-->

---

<div class="eyebrow"><Bolt :size="12" /> TECH</div>

# ちゃんと動く、ちゃんと守る

<div class="arch mt-3">
  <div class="arch-box">
    <div class="arch-name">ブラウザ</div>
    <div class="arch-sub">PC / スマホ</div>
  </div>
  <div class="arch-arrow">⇄</div>
  <div class="arch-box is-key">
    <div class="arch-name">Next.js 16</div>
    <div class="arch-sub">画面 + BFF</div>
  </div>
  <div class="arch-arrow">→</div>
  <div class="arch-box is-key">
    <div class="arch-name">NestJS 12</div>
    <div class="arch-sub">Controller → Service → Repository</div>
  </div>
  <div class="arch-arrow">→</div>
  <div class="arch-box">
    <div class="arch-name">PostgreSQL 17</div>
    <div class="arch-sub">Prisma 7</div>
  </div>
</div>

<div class="grid grid-cols-[1fr_1fr_1fr_1.6fr] gap-4 mt-5">
  <div class="stat"><div class="stat-value">21<small>画面</small></div><div class="stat-label">探す・作る・カレンダー・団体 など</div></div>
  <div class="stat"><div class="stat-value">175<small>テスト</small></div><div class="stat-label">単体 161 + e2e 14<br>push ごとに CI</div></div>
  <div class="stat"><div class="stat-value">31<small>PR</small></div><div class="stat-label">Issue → PR で機能を追加</div></div>
  <div class="lt-card">
    <h3>公開サービスの守り</h3>
    <p>会場の Wi-Fi で全員が同じ IP でも詰まらないレート制限。通報・ブロック、Google ログイン（PKCE）</p>
  </div>
</div>

<!--
【4:00〜4:35】
技術面です。画面は Next.js、API は NestJS の 3 層構成で、ブラウザは Next.js とだけ通信する BFF 構成にしました。
テストは 175 件あり、push のたびに CI で回しています。
誰でも使える公開サービスなので、守りも入れました。LT会の会場では参加者全員が同じ Wi-Fi から一斉に回答するので、それでも詰まらないようにレート制限の上限を決めています。
-->

---
layout: hero
mascot: hedgehog
---

<span class="eyebrow"><Bolt :size="12" /> THANK YOU</span>

<h1 class="hero-title">LT会から、<br>出会い（アイ）を。</h1>

<p class="hero-lead">全国のどこかで、今日も誰かの話が誰かに届くように。</p>

<p class="hero-meta">これから: フォロー中の人のLT会フィード / GitHub・X ログイン / スマホアプリ<br>github.com/Me1td0wn76/HarinezumiAI_hack</p>

<!--
【4:35〜4:55】
LT会から、出会いを。全国のどこかで、今日も誰かの話が誰かに届くように。
これからは、フォロー中の人の LT会が流れてくるフィードやスマホアプリを作っていきます。
（ここで、自分たちが LT会で出会った経験を一言添えると、熱意が伝わります）
ありがとうございました。
-->
