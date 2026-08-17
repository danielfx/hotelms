import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/data.ts", import.meta.url), "utf8");
const drafts = src.slice(src.indexOf("const drafts"), src.indexOf("export const cards"));
const slugs = [...drafts.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);

const required = [
  "base-set-charizard-4",
  "base-set-pikachu-58",
  "neo-discovery-umbreon-13",
  "evolving-skies-umbreon-vmax-215",
  "neo-genesis-lugia-9",
  "base-set-mewtwo-10",
];

const missing = required.filter((s) => !slugs.includes(s));
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);

if (missing.length || dupes.length || slugs.length < 40) {
  console.error({ missing, dupes, count: slugs.length });
  process.exit(1);
}

console.log(`inventory ok · ${slugs.length} lots · icons present`);
