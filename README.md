## no-deps-web-dev

ビルドもバンドルもせず、少ないコードで静的なウェブサイトをモダンな技術スタックで開発するPoC。
SSR は考えない。`dist/` に置いたファイルが、そのままブラウザで動く形になっていること。

## 技術

- mise (ツールのバージョン固定 + タスクランナー)
- Deno (dev tool。実行時の依存ではない)
- HTML / CSS
- PicoCSS (classless)
- Preact + htm (import map 経由)
