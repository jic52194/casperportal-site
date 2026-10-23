// Local preview of dist/ that resolves URLs the way GitHub Pages does (/x → x.html or x/index.html, 404.html otherwise).
//   node scripts/serve.mjs [port]   (default 8080)
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
const OUT = fileURLToPath(new URL("../dist/", import.meta.url)), PORT = Number(process.argv[2] || 8080);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
const isFile = (f) => existsSync(f) && statSync(f).isFile();
createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const tries = p.endsWith("/") ? [join(OUT, p, "index.html")] : [join(OUT, p), join(OUT, p + ".html"), join(OUT, p, "index.html")];
  const f = tries.find(isFile);
  if (!f) { res.writeHead(404, { "content-type": TYPES[".html"] }); return res.end(readFileSync(join(OUT, "404.html"))); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`));
