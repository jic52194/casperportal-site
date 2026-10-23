// Internal link check for dist/ (casperportal.com; run after a build: `npm run check`). For every indexable page in sitemap.xml:
//   • counts distinct OTHER casperportal.com pages linked from the article body (inside <main>, excluding the breadcrumb),
//     and flags any page with fewer than MIN (a dead end);
//   • resolves every internal href on the page (header, body, footer) to a file in dist/ and flags missing targets;
//   • flags #fragment links whose target page has no element with that id.
// No network calls: links to other hosts are not fetched.
//   • SEO/conversion rules: one H1; unique primary keyword, title and H1; title ≤ 60 / description ≤ 160 (warnings);
//     a next-best-step block on every indexable page; banned claims (fake stats, conflicting claims) anywhere in the body;
//     exactly one link to casperb2b.com site-wide; a trial (/start) and demo (/demo) link within 2 clicks of every page.
// Exit code 1 when a page links to a missing page or is a dead end, so it can gate a deploy.
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = fileURLToPath(new URL("../dist/", import.meta.url));
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
// ── SEO + conversion rules ──
const BUILT = JSON.parse(readFileSync(join(OUT, "build-pages.json"), "utf8"));
const errors = [], warns = [];
const dupes = (key) => { const seen = {}; for (const p of locs) { const v = (BUILT[p]?.[key] || "").toLowerCase().trim(); if (!v) { if (key === "kw") errors.push(`${p}: no primary keyword`); continue; } (seen[v] ||= []).push(p); } for (const [v, ps] of Object.entries(seen)) if (ps.length > 1) errors.push(`duplicate ${key} "${v}": ${ps.join(", ")}`); };
dupes("kw"); dupes("title"); dupes("h1");
const BANNED = [/no credit card/i, /sub-200ms/i, /bank-level/i, /enterprise-grade/i, /military-grade/i, /2\.5x/i, /40% lead recovery/i, /\$1,200\+/, /fastest-growing/i, /24\/7 priority/i, /agency[- ]vetted/i, /CasperB2B Advantage/i, /powered by CasperB2B/i, /built by CasperB2B/i, /world's #1/i, /lorem ipsum/i, /\bTODO\b/, /approval in 24 hours/i, /@casperb2b\.com/i, /info@casperportal|hello@casperportal|mcsalestraining/i, /Mark Casper,? (CEO|Founder of)/i, /trusted by [0-9]/i];
let b2b = 0; const b2bPages = [];
const linksOf = (html) => [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);
const pageLinks = {};
for (const path of locs) {
  const file = fileFor(path); if (!file) continue; const html = readFileSync(file, "utf8");
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
  const h1s = (main.match(/<h1[\s>]/g) || []).length; if (h1s !== 1) errors.push(`${path}: ${h1s} <h1> elements`);
  if (!/class="next-step/.test(main)) errors.push(`${path}: no next-best-step block`);
  const text = main.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  for (const re of BANNED) if (re.test(text) || (re.source.includes("@") && re.test(main))) errors.push(`${path}: banned claim ${re}`);
  const n = (html.match(/href="https?:\/\/(www\.)?casperb2b\.com/g) || []).length; if (n) { b2b += n; b2bPages.push(path); }
  const t = BUILT[path]?.title || "", d = BUILT[path]?.desc || "";
  if (t.length > 60) warns.push(`${path}: title ${t.length} chars`); if (d.length > 160 || d.length < 70) warns.push(`${path}: description ${d.length} chars`);
  pageLinks[path] = new Set(linksOf(html).filter((h) => h.startsWith("/") && !h.startsWith("//")).map((h) => norm(h.split(/[?#]/)[0]).replace(/\/$/, "") || "/"));
}
if (b2b !== 1) errors.push(`casperb2b.com is linked ${b2b} times (${b2bPages.join(", ")}); expected exactly 1`);
// every page is ≤ 2 clicks from starting a trial and from booking a demo (header + sticky bar make it 1)
for (const [p, set] of Object.entries(pageLinks)) for (const goal of ["/start", "/demo"]) {
  if (p === goal || set.has(goal)) continue;
  if (![...set].some((q) => pageLinks[q]?.has(goal))) errors.push(`${p}: ${goal} is more than 2 clicks away`);
}
console.log(`  SEO/conversion rules: ${errors.length} errors, ${warns.length} warnings`);
if (errors.length) console.log("    " + errors.slice(0, 60).join("\n    "));
if (warns.length && !process.argv.includes("--quiet")) console.log("    (warn) " + warns.slice(0, 40).join("\n    (warn) "));
if (dead.length || missing.length || errors.length) process.exitCode = 1;

