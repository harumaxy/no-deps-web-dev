## no-deps-web-dev

ビルドもバンドルもせず、少ないコードで静的なウェブサイトを開発する。
SSR は考えない。`dist/` に置いたファイルが、そのままブラウザで動く形になっていること。

## 技術

- mise (ツールのバージョン固定 + タスクランナー)
- Deno (dev tool。実行時の依存ではない)
- HTML / CSS
- PicoCSS (classless)
- Preact + htm (import map 経由)

## プロジェクト構成

```
- dist/                        ← Web で動作する形のアセット。デプロイ対象
  - index.html                 ← import map をここに書く
  - css/
    - tokens.css               ← 生成物 (DESIGN.md 由来)。コミットする
    - theme.css                ← トークンを PicoCSS 変数に割り当てる層
    - vendor/                  ← 取得物。git 管理外
  - js/
    - app.js
    - vendor/                  ← 取得物。git 管理外
  - (robots.txt, sitemap.xml, llms.txt, 追加ページ など)
- scripts/
  - vendor.js                  ← 依存を dist/*/vendor/ に取得
  - tokens.js                  ← DESIGN.md → dist/css/tokens.css
- deno.json                    ← import map (LSP の型解決用) と fmt 設定のみ
- mise.toml                    ← ツールとタスク
- DESIGN.md                    ← デザイントークンの唯一の真実
```

No package.json, No node_modules, No bundler, No transpiler.

### 設定ファイルについて

「設定ファイルゼロ」ではなく **ビルド設定ゼロ**。存在してよい設定ファイルは以下だけで、
これ以外 (tsconfig, vite.config, postcss.config, tailwind.config など) は追加しない。

- `mise.toml` — ツールのバージョンとタスク
- `deno.json` — import map (エディタ / LSP 用) と `fmt` 設定
- `dist/index.html` 内の `<script type="importmap">` — ブラウザ用の import map

`deno.json` の imports と `index.html` の import map は **別物** なので両方必要。
前者は LSP に型を解決させるための esm.sh URL、後者はブラウザに vendor 済みファイルを
読ませるためのパス。`mise run vendor` が後者に貼るべき JSON を出力するので、ずれたら合わせる。

## セットアップ

clone 直後、および CI / デプロイ時は必ず最初に実行する。

```
mise run setup     # 依存の取得 + トークン生成
mise run dev       # http://localhost:8000
```

`dist/js/vendor/` と `dist/css/vendor/` は git 管理外なので、これを飛ばすと画面が壊れる。

## 開発方針

すべてのアセットは**ビルド不要**の方法で記述する。

- TS は使わない。すべて JS で書く
  - 型は import map + LSP で解決する。型注釈が欲しければ JSDoc
- 生の HTML / CSS を書く
  - ただし classless CSS フレームワーク (PicoCSS) に乗り、最小のコードで成立させる
  - カスタムは CSS 変数で行う。生 CSS を書く場合も CSS nesting などで最小限に
- 動的コンポーネントは Preact + htm。JSX は使わない (トランスパイルが必要になるため)

### 依存を追加するとき

1. `deno.json` の `imports` に esm.sh の URL をバージョン固定で追加
2. `scripts/vendor.js` の `ENTRY` に、その npm パッケージ内の ESM 実ファイルのパスを追加
   - esm.sh の変換済み出力は同一パッケージ内のサブモジュールを内部 URL で参照してしまい、
     ライブラリが二重ロードされる。そのため `?raw` で npm の実ファイルを取る
3. `mise run vendor` を実行し、出力された import map を `dist/index.html` に反映
4. CSS ライブラリは import map の対象外。`scripts/vendor.js` の `STYLESHEETS` に追加

CDN を HTML から直接読むのは禁止 (フォントを除く)。CDN が落ちるとサイトが動かなくなるため、
JS / CSS は必ず vendoring する。Web フォントだけは例外 — 失敗しても
`system-ui` にフォールバックするだけでレイアウトは壊れないので Google Fonts を使う。

## デザイン

デザインは `DESIGN.md` に従う。ハードコードされた色・サイズをあちこちに書き散らさない。

- **トークンは手で転記しない。** `DESIGN.md` の frontmatter が唯一の真実で、
  `mise run tokens` が `dist/css/tokens.css` (CSS カスタムプロパティ) を生成する
- `dist/css/theme.css` がトークンを PicoCSS の `--pico-*` 変数に割り当てる唯一の場所。
  色やサイズの実値を書いてよいのはここだけ (それも `var(--color-*)` 経由)
- PicoCSS は `:root:not([data-theme=dark]),[data-theme=light]` で色を定義するため、
  上書きは `:root[data-theme="light"]` 以上の詳細度で行う
- 緑 (`--color-primary`) は唯一の色彩イベント。塗りつぶし CTA とワードマークだけに使う
- 白キャンバスは非交渉。ヒーローにグラデーションを敷かない

## 検証

エージェントの判断任せにせず、機械的に落とす。

```
mise run check     # tokens.css が DESIGN.md と一致するか (差分があれば失敗)
deno fmt --check   # scripts/ の整形
```

- `scripts/vendor.js` は、取得したファイルに外部 URL への import が残っていたら失敗する
  (= CDN 依存が残っていないことの検証)
- `scripts/tokens.js` は DESIGN.md の frontmatter が壊れていたら失敗する
- `dist/index.html` のカウンターは、import map と vendoring が生きていることの確認用。
  描画されなければどこかが壊れている

## デプロイ

出力は `dist/`。vendor が git 管理外なので、どちらの環境でも先に `mise run setup` を走らせる。

- **GitHub Pages** — `.github/workflows/pages.yml` が `mise run setup` 後に `dist/` を公開する
- **Cloudflare Pages** — Build command: `mise run setup` / Build output directory: `dist`
