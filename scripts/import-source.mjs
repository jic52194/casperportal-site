// One-time import: turns the old React site's data files (src/data/*.ts from _sources/casperportal-source.zip,
// unzipped to a temp folder) into plain JSON in data/source/. The build reads only the JSON.
//   node scripts/import-source.mjs <unzipped>/casperportal/src/data
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const from = process.argv[2]; if (!from) throw new Error("usage: node scripts/import-source.mjs <src/data folder>");
const OUT = fileURLToPath(new URL("../data/source/", import.meta.url)); mkdirSync(OUT, { recursive: true });
const tmp = join(tmpdir(), "cp-import-" + Date.now()); mkdirSync(tmp, { recursive: true });
for (const f of readdirSync(from).filter((f) => f.endsWith(".ts"))) {
  let src = readFileSync(join(from, f), "utf8");
  const icons = [...src.matchAll(/^import \{([^}]+)\} from "lucide-react";/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim()).filter(Boolean));
  src = src.replace(/^import [^\n]*\n/gm, "");
  src = icons.map((i) => `const ${i} = ${JSON.stringify(i)};`).join("\n") + "\n" + src.replace(/: ReactNode \| string/g, ": string").replace(/: ReactNode/g, ": string");
  const file = join(tmp, f); writeFileSync(file, src);
  const mod = await import(pathToFileURL(file).href);
  for (const [k, v] of Object.entries(mod)) if (typeof v !== "function") writeFileSync(join(OUT, `${f.replace(/\.ts$/, "")}.${k}.json`), JSON.stringify(v, null, 1) + "\n");
}
console.log("imported", readdirSync(OUT).join(", "));
