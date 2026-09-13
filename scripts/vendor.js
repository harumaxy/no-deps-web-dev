// deno.json の imports (LSP 用の esm.sh URL) を唯一の真実として
// dist/js/vendor/ に実ファイルを取得する。バージョン指定は deno.json 側だけ。
const OUT_DIR = new URL("../dist/js/vendor/", import.meta.url);
const CSS_DIR = new URL("../dist/css/vendor/", import.meta.url);

// esm.sh の変換済み出力は、同一パッケージ内のサブモジュール (preact -> preact/hooks)
// を内部 URL で参照する。その結果 preact が二重に読み込まれて hooks が壊れるので、
// npm パッケージに入っている ESM の実ファイルを ?raw でそのまま取得する。
const ENTRY = {
  "preact": "dist/preact.module.js",
  "preact/hooks": "hooks/dist/hooks.module.js",
  "htm": "dist/htm.module.js",
  "htm/preact": "preact/index.module.js",
};

// CSS は import map の対象外なので、ここに直接書く (PicoCSS のバージョンもここ)
const STYLESHEETS = {
  "pico.classless.min.css":
    "https://esm.sh/@picocss/pico@2.1.1/css/pico.classless.min.css",
};

const { imports } = JSON.parse(
  await Deno.readTextFile(new URL("../deno.json", import.meta.url)),
);

// "preact/hooks" -> "preact", "@scope/pkg/sub" -> "@scope/pkg"
const pkgOf = (s) => s.split("/").slice(0, s.startsWith("@") ? 2 : 1).join("/");
const fileOf = (s) => s.replace(/[@/]/g, "-").replace(/^-/, "") + ".js";
const depsOf = (code) =>
  [...code.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)].map((m) => m[1]);

const packages = [...new Set(Object.keys(imports).map(pkgOf))];
const isBare = (dep) =>
  packages.some((p) => dep === p || dep.startsWith(p + "/"));

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return await res.text();
}

await Deno.mkdir(OUT_DIR, { recursive: true });

for (const [specifier, url] of Object.entries(imports)) {
  const entry = ENTRY[specifier];
  if (!entry) throw new Error(`${specifier}: ENTRY に実ファイルのパスがない`);

  // "https://esm.sh/preact@10.27.2/hooks" -> "preact@10.27.2"
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const pkgver = segments.slice(0, segments[0].startsWith("@") ? 2 : 1).join(
    "/",
  );
  const src = `https://esm.sh/${pkgver}/${entry}?raw`;

  const code = (await get(src)).replace(/\n?\/\/# sourceMappingURL=\S*/g, "");

  // 外部 URL が残っていたら CDN 依存が残っている = vendoring 失敗。
  const left = depsOf(code).filter((d) => !isBare(d));
  if (left.length) throw new Error(`${specifier}: 外部参照が残った ${left}`);

  await Deno.writeTextFile(new URL(fileOf(specifier), OUT_DIR), code);
  console.log(`${specifier} -> dist/js/vendor/${fileOf(specifier)}`);
}

await Deno.mkdir(CSS_DIR, { recursive: true });
for (const [name, url] of Object.entries(STYLESHEETS)) {
  await Deno.writeTextFile(new URL(name, CSS_DIR), await get(url));
  console.log(`${name} -> dist/css/vendor/${name}`);
}

const map = Object.fromEntries(
  Object.keys(imports).map((s) => [s, `/js/vendor/${fileOf(s)}`]),
);
const expected = JSON.stringify({ imports: map }, null, 2);

// ブラウザは外部 import map を読めないので、各ページへの inline 複製は避けられない。
// 手で合わせる代わりにここで検証する — ずれたら落とす。
const DIST = new URL("../dist/", import.meta.url);
let checked = 0;
for await (const entry of Deno.readDir(DIST)) {
  if (!entry.isFile || !entry.name.endsWith(".html")) continue;
  const html = await Deno.readTextFile(new URL(entry.name, DIST));
  const block = html.match(/<script type="importmap">\n([\s\S]*?)\n<\/script>/);
  if (!block) continue;
  checked++;
  if (block[1] !== expected) {
    throw new Error(
      `dist/${entry.name}: import map がずれている。この内容に置き換える:\n${expected}`,
    );
  }
}
console.log(`\nimport map OK (${checked} ファイル)`);
