// DESIGN.md の frontmatter を唯一の真実として dist/css/tokens.css を生成する。
// トークンを手で CSS に転記しない — 転記ミスを構造的に潰すのが目的。
import { parse } from "jsr:@std/yaml@1";

const SOURCE = new URL("../DESIGN.md", import.meta.url);
const OUT = new URL("../dist/css/tokens.css", import.meta.url);

// frontmatter に入っていても CSS 変数にしないキー (散文・コンポーネント定義)
const GROUPS = {
  colors: "color",
  spacing: "space",
  rounded: "radius",
  typography: "type",
};

const PROP = {
  fontFamily: "family",
  fontSize: "size",
  fontWeight: "weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
};

const md = await Deno.readTextFile(SOURCE);
const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
if (!fm) throw new Error("DESIGN.md に YAML frontmatter がない");
const design = parse(fm[1]);

const lines = [];
for (const [group, prefix] of Object.entries(GROUPS)) {
  const entries = design[group];
  if (!entries) throw new Error(`DESIGN.md frontmatter に ${group} がない`);
  lines.push(`\n  /* ${group} */`);
  for (const [name, value] of Object.entries(entries)) {
    if (typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) {
        const key = PROP[prop];
        if (!key) throw new Error(`未知の typography プロパティ: ${prop}`);
        lines.push(`  --${prefix}-${name}-${key}: ${v};`);
      }
    } else {
      lines.push(`  --${prefix}-${name}: ${value};`);
    }
  }
}

const css =
  `/* 生成ファイル — 直接編集しない。DESIGN.md を編集して \`mise run tokens\` */
:root {${lines.join("\n")}\n}\n`;

await Deno.mkdir(new URL(".", OUT), { recursive: true });
await Deno.writeTextFile(OUT, css);
console.log(`dist/css/tokens.css (${lines.length - 4} tokens)`);
