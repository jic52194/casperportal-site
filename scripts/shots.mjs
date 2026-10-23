// Full-page screenshots for design review: node scripts/shots.mjs <outDir> <width> /path /path ...
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("../dist/", import.meta.url));
const T = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const isF = (f) => existsSync(f) && statSync(f).isFile();
const srv = createServer((q, s) => { const p = decodeURIComponent(new URL(q.url, "http://x").pathname); const f = (p.endsWith("/") ? [join(OUT, p, "index.html")] : [join(OUT, p), join(OUT, p + ".html"), join(OUT, p, "index.html")]).find(isF); if (!f) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": T[extname(f)] || "application/octet-stream" }); s.end(readFileSync(f)); }).listen(0);
const [dir, w, ...paths] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: +w, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem("cookie-consent", "declined"); sessionStorage.setItem("casperportal_personalization_dismissed", "true"); } catch (e) {} });
const pg = await ctx.newPage();
for (const p of paths) { await pg.goto(`http://127.0.0.1:${srv.address().port}${p}`, { waitUntil: "load" }); await pg.waitForTimeout(300); await pg.screenshot({ path: join(dir, `${w}${p.replace(/\//g, "_") || "_home"}.jpg`), fullPage: true, quality: 55, type: "jpeg" }); }
await b.close(); srv.close();
