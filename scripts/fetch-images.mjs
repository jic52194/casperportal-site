// Downloads the live site's own images (listed in data/image-sources.json) into static/img/ as optimized WebP
// (SVG copied as-is) and writes data/images.json: { "<original url>": { file, w, h } }. Run once: npm run images.
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUT = ROOT + "static/img/";
mkdirSync(OUT, { recursive: true });
const sources = JSON.parse(readFileSync(ROOT + "data/image-sources.json", "utf8")); // [{ src, max }]
const manifest = existsSync(ROOT + "data/images.json") ? JSON.parse(readFileSync(ROOT + "data/images.json", "utf8")) : {};
const name = (u) => {
  const base = decodeURIComponent(u.split("?")[0].split("/").pop()).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9-]+/gi, "-").slice(0, 40);
  return `${base}-${createHash("sha1").update(u).digest("hex").slice(0, 6)}`.toLowerCase();
};
let ok = 0, fail = 0;
for (const { src, max = 1200 } of sources) {
  if (manifest[src]) { ok++; continue; }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (/\.svg($|\?)/i.test(src) || (res.headers.get("content-type") || "").includes("svg")) {
      const file = `/img/${name(src)}.svg`;
      writeFileSync(ROOT + "static" + file, buf);
      const svg = buf.toString("utf8");
      const vb = svg.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
      manifest[src] = { file, w: Math.round(vb ? +vb[1] : 300), h: Math.round(vb ? +vb[2] : 150) };
    } else {
      const img = sharp(buf, { animated: false }).rotate();
      const meta = await img.metadata();
      const w = Math.min(meta.width || max, max);
      const out = await img.resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      const file = `/img/${name(src)}.webp`;
      writeFileSync(ROOT + "static" + file, out.data);
      manifest[src] = { file, w: out.info.width, h: out.info.height };
    }
    ok++;
  } catch (e) { fail++; console.warn("image failed", src, e.message); }
}
writeFileSync(ROOT + "data/images.json", JSON.stringify(manifest, null, 1));
console.log(`images: ${ok} ok, ${fail} failed`);
