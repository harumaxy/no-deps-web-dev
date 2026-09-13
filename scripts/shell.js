// 全ページ共通の <header> と <footer> を書き戻す。ここが nav とフッターの唯一の真実。
// head は各ページ固有 (title / description / OG / 構造化データ) なので触らない。
// aria-current と CTA はファイル名から導出する。手で付け外しすると必ずどこかで忘れる。
const DIST = new URL("../dist/", import.meta.url);

const WORDMARK = `Supa<b>baze</b>`;
const TAGLINE = "Postgres をそのままプロダクトの土台に。";
const DISCLAIMER =
  "これは実在しない架空のサービスです。デザイントークンは DESIGN.md から生成しています。";

const GENERATED =
  "  <!-- scripts/shell.js が生成 — 直接編集しても `mise run shell` で上書きされる -->";

const LINKS = [
  ["/docs.html", "Docs"],
  ["/pricing.html", "Pricing"],
  ["/changelog.html", "Changelog"],
];

// CTA の例外。既定は "/pricing.html"、null なら CTA を出さない。
const CTA = {
  "404.html": null, // 迷子のページから購入導線に押し込まない
  "pricing.html": "/pricing.html#plans", // 同一ページなのでプラン表まで送る
};

const COLUMNS = [
  ["Product", [
    ["/#database", "Database"],
    ["/pricing.html", "Pricing"],
    ["/changelog.html", "Changelog"],
  ]],
  ["Developers", [
    ["/docs.html", "Docs"],
    ["/docs.html#api", "API リファレンス"],
    ["/llms.txt", "llms.txt"],
  ]],
  ["Company", [
    ["/pricing.html#faq", "FAQ"],
    ["/changelog.html", "ステータス"],
  ]],
];

const header = (page) => {
  const cta = page in CTA ? CTA[page] : "/pricing.html";
  const items = LINKS.map(([href, label]) => {
    const current = href === `/${page}` ? ` aria-current="page"` : "";
    return `      <li><a href="${href}"${current}>${label}</a></li>`;
  });
  if (cta) {
    items.push(
      `      <li><a href="${cta}" role="button">Start your project</a></li>`,
    );
  }
  return [
    `<header>`,
    GENERATED,
    `  <nav>`,
    `    <ul>`,
    `      <li><a class="wordmark" href="/"><strong>${WORDMARK}</strong></a></li>`,
    `    </ul>`,
    `    <ul>`,
    ...items,
    `    </ul>`,
    `  </nav>`,
    `</header>`,
  ].join("\n");
};

// フッターはページによらず同じ。index.html のデザインを全ページに敷く。
const footer = () =>
  [
    `<footer>`,
    GENERATED,
    `  <div class="grid">`,
    `    <div>`,
    `      <strong class="wordmark">${WORDMARK}</strong>`,
    `      <p><small>${TAGLINE}</small></p>`,
    `    </div>`,
    ...COLUMNS.flatMap(([title, links]) => [
      `    <div>`,
      `      <small>${title}</small>`,
      `      <ul>`,
      ...links.map(([href, label]) =>
        `        <li><a href="${href}">${label}</a></li>`
      ),
      `      </ul>`,
      `    </div>`,
    ]),
    `  </div>`,
    `  <small>${DISCLAIMER}</small>`,
    `</footer>`,
  ].join("\n");

// 行頭のタグだけを狙う。article 内の入れ子 header / footer は巻き込まない。
const BLOCKS = [
  ["header", /^<header>\n[\s\S]*?\n<\/header>$/m, header],
  ["footer", /^<footer>\n[\s\S]*?\n<\/footer>$/m, footer],
];

// --check: 書き換えずに、ずれているページがあれば落とす (CI ゲート用)。
// dist/ 全体を git diff で見ると通常のコンテンツ編集でも落ちてしまうため、
// 生成範囲であるこの 2 ブロックだけをここで突き合わせる。
const checkOnly = Deno.args.includes("--check");

let updated = 0;
for await (const entry of Deno.readDir(DIST)) {
  if (!entry.isFile || !entry.name.endsWith(".html")) continue;
  const path = new URL(entry.name, DIST);
  const html = await Deno.readTextFile(path);

  let next = html;
  for (const [name, block, build] of BLOCKS) {
    if (!block.test(next)) {
      throw new Error(`dist/${entry.name}: <${name}> がない`);
    }
    const after = next.replace(block, () => build(entry.name));
    if (after === next) continue;
    if (checkOnly) {
      throw new Error(
        `dist/${entry.name}: <${name}> が古い。\`mise run shell\` を実行してコミットする`,
      );
    }
    next = after;
  }

  if (next === html) continue;
  await Deno.writeTextFile(path, next);
  console.log(`dist/${entry.name}`);
  updated++;
}
console.log(
  !checkOnly && updated
    ? `${updated} ファイルを更新`
    : "header / footer は全ページ最新",
);
