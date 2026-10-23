// Real-browser test of every page in dist/sitemap.xml at 360px and 1280px wide: JavaScript errors, failed requests
// (broken links to local files, missing images), images that did not load, and sideways scroll.
// Needs a local Chrome or Edge (uses playwright-core, no browser download):  npm run test:browser
//   BROWSER=msedge|chrome (default: chrome, falls back to msedge)  ·  PAGES=/,/pricing to test only some pages
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../dist/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };
const isFile = (f) => existsSync(f) && statSync(f).isFile();
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const f = (p.endsWith("/") ? [join(OUT, p, "index.html")] : [join(OUT, p), join(OUT, p + ".html"), join(OUT, p, "index.html")]).find(isFile);
  if (!f) { res.writeHead(404, { "content-type": TYPES[".html"] }); return res.end(readFileSync(join(OUT, "404.html"))); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

let pages = [...readFileSync(join(OUT, "sitemap.xml"), "utf8").matchAll(/<loc>https:\/\/casperportal\.com([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
if (process.env.PAGES) pages = process.env.PAGES.split(",");
let browser;
for (const channel of [process.env.BROWSER || "chrome", "msedge"]) { try { browser = await chromium.launch({ channel }); break; } catch (e) { if (channel === "msedge") throw e; } }

// Third-party calls (fonts, GHL calendar, analytics collector) are stubbed so results don't depend on the network.
const EXTERNAL_OK = /fonts\.(googleapis|gstatic)\.com|leadconnectorhq\.com|supabase\.co|storage\.googleapis\.com|i\.ytimg\.com|youtube/;
const problems = [];
for (const [w, h] of [[360, 780], [1280, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => (EXTERNAL_OK.test(r.request().url()) ? r.fulfill({ status: 200, body: r.request().resourceType() === "fetch" || r.request().resourceType() === "xhr" ? "{}" : "", contentType: r.request().resourceType() === "stylesheet" ? "text/css" : "application/json" }) : r.abort()));
  const pg = await ctx.newPage();
  for (const path of pages) {
    const errs = [];
    const onErr = (e) => errs.push("js: " + e.message.split("\n")[0]);
    const onCon = (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR_FAILED/.test(m.text())) errs.push("console: " + m.text().slice(0, 160)); };
    const onResp = (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) errs.push(`${r.status()} ${r.url().slice(BASE.length)}`); };
    pg.on("pageerror", onErr); pg.on("console", onCon); pg.on("response", onResp);
    try {
      const res = await pg.goto(BASE + path, { waitUntil: "load", timeout: 30000 });
      if (!res || res.status() !== 200) errs.push(`status ${res && res.status()}`);
      await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 15)); } window.scrollTo(0, 0); });
      await pg.waitForTimeout(150);
      const r = await pg.evaluate(() => {
        const sw = document.documentElement.scrollWidth, iw = window.innerWidth, wide = [];
        if (sw > iw + 1) for (const el of document.querySelectorAll("body *")) { const b = el.getBoundingClientRect(); if (b.right > iw + 1 && b.width > 0 && getComputedStyle(el).position !== "fixed" && !el.closest("table,.cal-slots,pre,[hidden]")) wide.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 60)); }
        const badImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !/ytimg/.test(i.src)).map((i) => i.getAttribute("src"));
        return { sw, iw, wide: wide.slice(0, 4), badImg };
      });
      if (r.sw > r.iw + 1) errs.push(`sideways scroll ${r.sw}px > ${r.iw}px: ${r.wide.join(" | ")}`);
      for (const s of r.badImg) errs.push("broken image " + s);
    } catch (e) { errs.push("load failed: " + e.message.split("\n")[0]); }
    pg.off("pageerror", onErr); pg.off("console", onCon); pg.off("response", onResp);
    for (const e of errs) problems.push(`${w}px ${path}: ${e}`);
  }
  await ctx.close();
}
await browser.close(); server.close();
console.log(`browser test: ${pages.length} pages × 2 widths (360px, 1280px) — ${problems.length} problems`);
if (problems.length) { console.log("  " + [...new Set(problems)].slice(0, 80).join("\n  ")); process.exitCode = 1; }
