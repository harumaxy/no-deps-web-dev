## no-deps-web-dev

設定レス、ビルド・バンドルレス、少コード、AI駆動でウェブサイトを開発する。
SSRは考えず、静的なフロントページのみ


## 技術

- Deno (dev tool)
- HTML
- PicoCSS
- Preact + htm

## プロジェクト構成

すべてのアセットは `/dist` にWebで動作する形で配置する (コミットする)

```
- dist
  - index.html
  - css/
  - js/
  - ... (その他マルチページ、robots.txt, sitemap.xml, llms.txt etc...) 
- mise.toml
  - 依存ツール、環境変数、task
```

No package.json, No node_modules, No config files.
依存最小限、プロジェクトルートの依存はなるべくなくす
