// Internal link check for dist/ (casperportal.com; run after a build: `npm run check`). For every indexable page in sitemap.xml:
//   • counts distinct OTHER casperportal.com pages linked from the article body (inside <main>, excluding the breadcrumb),
//     and flags any page with fewer than MIN (a dead end);
//   • resolves every internal href on the page (header, body, footer) to a file in dist/ and flags missing targets;
//   • flags #fragment links whose target page has no element with that id.
// No network calls: links to other hosts are not fetched.
// Exit code 1 when a page links to a missing page or is a dead end, so it can gate a deploy.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../dist/", import.meta.url).pathname;
const MIN = Number(process.env.MIN_LINKS || 3);
const HOST = /^https?:\/\/(www\.)?casperportal\.com(?=\/|$)/i;

const locs = [...readFileSync(join(OUT, "sitemap.xml"), "utf8").matchAll(/<loc>https:\/\/casperportal\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
const isFile = (f) => existsSync(f) && statSync(f).isFile();
/** URL path → the file GitHub Pages would serve for it, or null. */
function fileFor(p) {
  if (p === "/" || p === "") return join(OUT, "index.html");
  if (p.endsWith("/")) return isFile(join(OUT, p, "index.html")) ? join(OUT, p, "index.html") : null;
  if (isFile(join(OUT, p))) return join(OUT, p);
  if (isFile(join(OUT, p + ".html"))) return join(OUT, p + ".html");
  if (isFile(join(OUT, p, "index.html"))) return join(OUT, p, "index.html");
  return null;
}
const norm = (p) => (p === "/" ? "/" : p.replace(/\/index\.html$/, "/").replace(/\.html$/, ""));
const idCache = new Map();
const idsOf = (file) => { if (!idCache.has(file)) idCache.set(file, new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return idCache.get(file); };

const pages = [], missing = [], badHash = [];
for (const path of locs) {
  const file = fileFor(path); if (!file) { missing.push([path, "(sitemap entry has no file)"]); continue; }
  const html = readFileSync(file, "utf8");
  const main = (html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "").replace(/<nav class="crumbs"[\s\S]*?<\/nav>/, "");
  const self = norm(path).replace(/\/$/, "") || "/";
  const targets = new Set();
  for (const [scope, src] of [["main", main], ["page", html]]) {
    for (const m of src.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
      let href = m[1].replace(/&amp;/g, "&");
      if (HOST.test(href)) href = href.replace(HOST, "") || "/";
      if (!href.startsWith("/") || href.startsWith("//")) continue; // external, mailto:, tel:, sms:, same-page #anchors
      const [pq, hash] = href.split("#"); const p = pq.split("?")[0];
      const f = fileFor(p);
      if (scope === "page") {
        if (!f) missing.push([path, href]);
        else if (hash && f.endsWith(".html") && !idsOf(f).has(decodeURIComponent(hash))) badHash.push([path, href]);
        continue;
      }
      const key = norm(p).replace(/\/$/, "") || "/";
      if (f && f.endsWith(".html") && key !== self) targets.add(key);
    }
  }
  pages.push({ path, n: targets.size });
}

const dead = pages.filter((p) => p.n < MIN);
const uniq = (xs) => [...new Map(xs.map((x) => [x.join(" → "), x])).values()];
const avg = pages.reduce((s, p) => s + p.n, 0) / (pages.length || 1);
const sorted = pages.map((p) => p.n).sort((a, b) => a - b);
const summary = { pages: pages.length, avgInContentLinks: +avg.toFixed(1), minInContentLinks: sorted[0] ?? 0, medianInContentLinks: sorted[Math.floor(sorted.length / 2)] ?? 0,
  deadEnds: dead.length, linksToMissingPages: uniq(missing).length, brokenFragments: uniq(badHash).length };
if (process.argv.includes("--json")) { console.log(JSON.stringify(summary)); }
else {
  console.log(`linkcheck: ${summary.pages} indexable pages · in-content links to other pages: avg ${summary.avgInContentLinks}, median ${summary.medianInContentLinks}, min ${summary.minInContentLinks}`);
  console.log(`  pages with < ${MIN} in-content links: ${dead.length}${dead.length ? "\n    " + dead.map((p) => `${p.path} (${p.n})`).join("\n    ") : ""}`);
  console.log(`  links to missing pages: ${summary.linksToMissingPages}${missing.length ? "\n    " + uniq(missing).slice(0, 40).map((x) => x.join(" → ")).join("\n    ") : ""}`);
  console.log(`  #fragment links with no matching id (warning): ${summary.brokenFragments}${badHash.length ? "\n    " + uniq(badHash).slice(0, 40).map((x) => x.join(" → ")).join("\n    ") : ""}`);
}
if (dead.length || missing.length) process.exitCode = 1;
