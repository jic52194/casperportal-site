// Builds casperportal.com into dist/ (static, GitHub Pages): node scripts/build.mjs
// Page bodies live in content/pages/*.html (imported once from the live site's rendered pages, wording unchanged);
// titles/descriptions in content/meta.json. Interactive parts are <div data-widget="..."> markers filled in here.
import { rmSync, mkdirSync, cpSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE, OUT, TODAY, PHONE, PHONE_TEL, PAY_MONTHLY, PAY_ANNUAL, ORG, SOFTWARE, TOWNS, townName, urls, write, page, redirect, relatedBlock, faqSchema, esc, strip } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const META = JSON.parse(readFileSync(ROOT + "content/meta.json", "utf8"));
const REDIRECTS = JSON.parse(readFileSync(ROOT + "content/redirects.json", "utf8"));
const POLLS = JSON.parse(readFileSync(ROOT + "data/polls.json", "utf8"));
const SERVICES = JSON.parse(readFileSync(ROOT + "data/agreement-services.json", "utf8"));
const KEY = readFileSync(ROOT + "data/indexnow-key", "utf8").trim();

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
cpSync(ROOT + "static/", OUT, { recursive: true });

// ── widgets ──
const field = (id, label, input) => `<div class="field"><label for="${id}">${label}</label>${input}</div>`;
const consentBox = (id) => `<label class="check" for="${id}"><input type="checkbox" id="${id}" name="consent" required> <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>, and consent to receive communications.</span></label>`;
const status = `<p class="msg" role="status" aria-live="polite"></p>`;
const W = {
  video: () => `<div class="video"><video controls playsinline preload="none" poster="/img/3016e196-2eb7-4699-b3c9-7d8877c5b78e-9fc822.webp" width="1200" height="655" aria-label="CasperPortal product walkthrough video"><source src="https://storage.googleapis.com/msgsndr/DNB14sOqM0GayjGjxxSy/media/6976d7ad29dcf57be16929e3.mp4" type="video/mp4"></video></div>`,
  roi: () => `<div class="card" data-roi><h2>Calculate Your Savings &amp; Growth</h2>
<p>See exactly how much revenue you're leaving on the table and how much you'll save by consolidating your tech stack.</p>
<div class="roi"><div>
<div class="field"><div class="range-row"><label for="roi-leads">Monthly Leads</label><span data-out="leads">50</span></div><input id="roi-leads" name="leads" type="range" min="10" max="1000" step="10" value="50"></div>
<div class="field"><div class="range-row"><label for="roi-missed">Missed Call Rate (%)</label><span data-out="missed">30%</span></div><input id="roi-missed" name="missed" type="range" min="0" max="100" step="5" value="30"></div>
<div class="field"><div class="range-row"><label for="roi-close">Close Rate (%)</label><span data-out="close">20%</span></div><input id="roi-close" name="close" type="range" min="0" max="100" step="5" value="20"></div>
<div class="two" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${field("roi-sale", "Avg. Sale Value ($)", `<input id="roi-sale" name="sale" type="number" min="0" inputmode="numeric" value="1500">`)}${field("roi-tools", "Current Tool Cost ($/mo)", `<input id="roi-tools" name="tools" type="number" min="0" inputmode="numeric" value="450">`)}</div>
</div><div class="card" style="background:var(--card2)"><h3>Estimated Recovery Opportunity</h3>
<p>Monthly Revenue Gain</p><output data-out="gain">$1,800</output><p data-out="sales">+1.2 sales/mo</p>
<p>Annual Growth Value</p><output data-out="annual">$23,436</output><p>Consolidated Savings Included</p>
<p class="note">*Estimates based on 40% lead recovery from missed-call text-back and tool consolidation. Actual results vary by industry and follow-up speed.</p>
<p><a class="btn" href="/demo">Book a Workflow Audit &amp; Demo</a></p></div></div></div>`,
  sales: () => `<form class="form" data-form="sales" novalidate><h3>Request a Custom Demo</h3><div class="two">${field("homeFirstName", "First Name", `<input id="homeFirstName" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("homeLastName", "Last Name", `<input id="homeLastName" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
${field("homeEmail", "Work Email", `<input id="homeEmail" name="email" type="email" placeholder="john@company.com" autocomplete="email" required>`)}${field("homePhone", "Phone Number", `<input id="homePhone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel">`)}<button class="btn" type="submit">Contact Sales</button>${status}</form>`,
  contact: () => `<form class="form" data-form="contact" novalidate><h2>Send us a Message</h2><div class="two">${field("firstName", "First Name", `<input id="firstName" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("lastName", "Last Name", `<input id="lastName" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
<div class="two">${field("email", "Email Address", `<input id="email" name="email" type="email" placeholder="john@example.com" autocomplete="email" required>`)}${field("phone", "Phone Number", `<input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel">`)}</div>
${field("message", "Message", `<textarea id="message" name="message" placeholder="How can we help you?" required></textarea>`)}${consentBox("contact-terms")}<p><button class="btn" type="submit">Send Message</button></p>${status}</form>`,
  partner: () => `<form class="form" data-form="partner" novalidate><h2>Apply to Partner</h2><p>Free to join • Approval in 24 hours</p><div class="two">${field("pFirst", "First Name", `<input id="pFirst" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("pLast", "Last Name", `<input id="pLast" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
<div class="two">${field("pEmail", "Email Address", `<input id="pEmail" name="email" type="email" placeholder="john@example.com" autocomplete="email" required>`)}${field("pPhone", "Phone Number", `<input id="pPhone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel" required>`)}</div>
${field("pWeb", "Website or Primary Social Profile", `<input id="pWeb" name="website" type="url" placeholder="https://...">`)}${field("pStrat", "Primary Promotion Strategy", `<select id="pStrat" name="promotionStrategy" required><option value="">Select your main channel...</option><option value="agency">Agency / My Clients</option><option value="social">YouTube / Social Media</option><option value="email">Email List / Newsletter</option><option value="blog">Blog / SEO</option><option value="network">Personal Network / Word of Mouth</option><option value="other">Other</option></select>`)}
<p class="note">By applying you agree to the <a href="/affiliate-terms">Partner Terms of Service</a>.</p><button class="btn" type="submit">Apply to Partner</button>${status}</form>`,
  addbiz: () => `<form class="form" data-form="addbiz" novalidate><h2>Business Details</h2>${field("businessName", "Business Name *", `<input id="businessName" name="businessName" autocomplete="organization" required>`)}${field("industry", "Industry / Business Type *", `<input id="industry" name="industry" placeholder="e.g. HVAC, Salon, Plumber" required>`)}
<div class="two">${field("town", "Town / City *", `<input id="town" name="town" list="town-list" autocomplete="address-level2" required><datalist id="town-list">${TOWNS.map((t) => `<option value="${townName(t)}">`).join("")}</datalist>`)}${field("website", "Website URL", `<input id="website" name="website" type="url" placeholder="https://">`)}</div>
<h3>Contact Person</h3><div class="two">${field("firstName", "First Name *", `<input id="firstName" name="firstName" autocomplete="given-name" required>`)}${field("lastName", "Last Name *", `<input id="lastName" name="lastName" autocomplete="family-name" required>`)}</div>
<div class="two">${field("email", "Email Address *", `<input id="email" name="email" type="email" autocomplete="email" required>`)}${field("phone", "Phone Number *", `<input id="phone" name="phone" type="tel" autocomplete="tel" required>`)}</div>
${field("description", "Short Business Description", `<textarea id="description" name="description" placeholder="Tell us a bit about what you do..."></textarea>`)}<button class="btn" type="submit">Submit Business Listing</button>${status}
<p class="note">By submitting this form, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>. Your information will be reviewed before publication.</p></form>`,
  newsletter: () => `<form class="form" data-form="newsletter" novalidate><h3>Get local growth tips every week</h3><p>Local SEO tips, automation workflows, and North Shore business growth strategies — delivered every week.</p><div class="inline-form"><label class="sr" for="nl-email">Email address</label><input id="nl-email" name="email" type="email" placeholder="your@email.com" autocomplete="email" required><button class="btn" type="submit">Subscribe Free</button></div>${status}</form>`,
  poll: (a) => {
    const p = POLLS[a["data-q"]]; if (!p) return "";
    const id = "poll-" + Math.abs([...a["data-q"]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
    return `<div class="card" data-poll><p class="eyebrow">Quick Poll</p><form><fieldset style="border:0;padding:0;margin:0"><legend class="quiz-q" style="font-size:1.1rem">${esc(a["data-q"])}</legend><div class="svc">${p.options.map((o, i) => `<label for="${id}-${i}"><input type="radio" id="${id}-${i}" name="${id}" value="${esc(o)}"> ${esc(o)}</label>`).join("")}</div></fieldset><p><button class="btn sm" type="submit">Submit My Answer</button></p></form>
<div data-poll-result hidden><p>You said: <b></b></p><p>${esc(p.followUp)}</p><p><a class="btn sm" href="${esc(p.ctaUrl)}">${esc(p.ctaLabel)}</a></p></div></div>`;
  },
  youtube: (a) => { const src = a["data-src"], vid = src.split("/embed/")[1].split("?")[0], t = a["data-title"] || "Video";
    return `<div class="yt" data-yt="https://www.youtube-nocookie.com/embed/${vid}" data-title="${esc(t)}"><button type="button" style="background-image:url(https://i.ytimg.com/vi/${vid}/hqdefault.jpg)" aria-label="Play video: ${esc(t)}">▶ Play</button></div><p class="note"><a href="https://www.youtube.com/watch?v=${vid}" rel="noopener">Watch on YouTube</a></p>`; },
  booking: () => `<div class="card" data-booking><h2>Schedule Your Live Demo</h2><h3>Select a Date &amp; Time</h3><p class="note">30 min meeting • <span data-tz>America/New_York</span></p><p data-cal-status role="status" aria-live="polite">Loading open times… (If nothing appears, call <a href="tel:${PHONE_TEL}">${PHONE}</a>.)</p>
<div class="cal"><div><div class="cal-days" aria-label="Available days"></div></div><div class="cal-slots" aria-label="Available times"></div></div>
<form class="form" hidden novalidate><h3>Complete Your Booking</h3><p data-picked></p><div class="two">${field("bookingFirstName", "First Name", `<input id="bookingFirstName" name="firstName" autocomplete="given-name" required>`)}${field("bookingLastName", "Last Name", `<input id="bookingLastName" name="lastName" autocomplete="family-name" required>`)}</div>
<div class="two">${field("bookingEmail", "Email", `<input id="bookingEmail" name="email" type="email" autocomplete="email" required>`)}${field("bookingPhone", "Phone", `<input id="bookingPhone" name="phone" type="tel" autocomplete="tel" required>`)}</div>
${field("bookingNotes", "What are your main goals with CasperPortal?", `<textarea id="bookingNotes" name="notes"></textarea>`)}${consentBox("booking-terms")}<p><button class="btn" type="submit">Confirm Booking</button></p>${status}</form></div>`,
};
function widgets(html) {
  return html.replace(/<div ((?:data-[a-z]+="[^"]*"\s*)+)><\/div>/g, (m, all) => {
    const kind = (all.match(/data-widget="([a-z]+)"/) || [])[1]; if (!kind) return m; const rest = all;
    const attrs = Object.fromEntries([...rest.matchAll(/(data-[a-z]+)="([^"]*)"/g)].map((x) => [x[1], x[2].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')]));
    if (!W[kind]) throw new Error("unknown widget " + kind);
    return W[kind](attrs);
  });
}

// ── related pages (every page links to at least three related pages) ──
const all = Object.keys(META).filter((p) => !META[p].noindex);
const h1Of = (p) => META[p].name || strip((readFileSync(ROOT + `content/pages/${META[p].slug}.html`, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, META[p].title])[1]);
const group = (prefix) => all.filter((p) => p.startsWith(prefix) && p !== prefix.replace(/\/$/, "")).sort();
const ring = (list, p, n = 3) => { const i = list.indexOf(p); return [1, 2, 3, 4, 5].map((k) => list[(i + k) % list.length]).filter((x) => x !== p).slice(0, n); };
const town = (p) => (p.match(/(?:crm-software-|directory\/)([a-z-]+)-ma$/) || [])[1];
function relatedFor(p) {
  let items = [];
  const sections = ["/features/", "/niches/", "/problems/", "/compare/", "/blog/topic/", "/locations/", "/directory/"];
  const sec = sections.find((s) => p.startsWith(s) && p !== s.slice(0, -1));
  if (p.startsWith("/blog/") && !p.startsWith("/blog/topic/")) items = ring(all.filter((x) => /^\/blog\/[^/]+$/.test(x) && !x.startsWith("/blog/topic")).sort(), p);
  else if (sec === "/locations/" || sec === "/directory/") {
    const t = town(p), i = TOWNS.indexOf(t), nb = [TOWNS[(i + 1) % TOWNS.length], TOWNS[(i + TOWNS.length - 1) % TOWNS.length]];
    items = sec === "/locations/" ? [`/directory/${t}-ma`, ...nb.map((x) => `/locations/crm-software-${x}-ma`)] : [`/locations/crm-software-${t}-ma`, ...nb.map((x) => `/directory/${x}-ma`)];
    items = items.filter((x) => META[x]);
  } else if (sec) items = ring(group(sec), p);
  const fallback = ["/features", "/pricing", "/demo", "/problems", "/niches", "/blog"];
  for (const f of fallback) if (items.length < 3 && f !== p && !items.includes(f)) items.push(f);
  return items.map((x) => [x, h1Of(x), META[x].desc.length > 90 ? META[x].desc.slice(0, 88).replace(/\s+\S*$/, "") + "…" : META[x].desc]);
}

// ── breadcrumbs ──
const SECTION_NAMES = { features: "Features", niches: "Industries", problems: "Problems We Fix", compare: "Comparisons", blog: "Blog", locations: "Service Areas", directory: "Directory" };
function crumbsFor(p, name) {
  if (p === "/") return null;
  const segs = p.split("/").filter(Boolean), c = [["Home", "/"]];
  if (segs.length > 1 && SECTION_NAMES[segs[0]]) c.push([SECTION_NAMES[segs[0]], "/" + segs[0]]);
  if (segs[0] === "blog" && segs[1] === "topic") c.push(["Topics", "/blog"]);
  c.push([name, p]);
  return c.filter((x, i, a) => a.findIndex((y) => y[1] === x[1]) === i);
}

// ── pages ──
let faqPages = 0;
for (const [p, m] of Object.entries(META)) {
  let body = readFileSync(ROOT + `content/pages/${m.slug}.html`, "utf8");
  body = widgets(body);
  // first content image is the LCP candidate: load it eagerly
  body = body.replace(/<img ([^>]*?)loading="lazy"/, (x, a) => (body.indexOf(x) < 2500 ? `<img ${a}loading="eager" fetchpriority="high"` : x));
  const name = h1Of(p);
  const schema = [];
  if (p === "/") schema.push(ORG, SOFTWARE, { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE}/#site`, name: "CasperPortal", url: SITE + "/", publisher: { "@id": ORG["@id"] } });
  if (p === "/pricing") schema.push(SOFTWARE);
  const pairs = [...body.matchAll(/<details><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map((x) => [strip(x[1]), strip(x[2])]).filter(([q, a]) => q && a);
  if (pairs.length) { schema.push(faqSchema(pairs)); faqPages++; }
  if (/^\/blog\/[^/]+$/.test(p) && !p.startsWith("/blog/topic")) schema.push({ "@context": "https://schema.org", "@type": "BlogPosting", headline: name, description: m.desc, url: SITE + p, ...(m.published ? { datePublished: m.published } : {}), mainEntityOfPage: SITE + p, inLanguage: "en-US", publisher: { "@id": ORG["@id"] }, ...(/href="\/jared-casper"/.test(body) ? { author: { "@type": "Person", name: "Jared Casper", url: SITE + "/jared-casper" } } : {}) });
  if (p === "/jared-casper" || p === "/mark-casper") schema.push({ "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name: p === "/jared-casper" ? "Jared Casper" : "Mark Casper", url: SITE + p, worksFor: { "@id": ORG["@id"] } } });
  const related = m.noindex ? "" : relatedBlock(relatedFor(p), m.relatedTitle || "Related pages");
  write(p, page({ path: p, title: m.title, desc: m.desc, body, schema, noindex: !!m.noindex, crumbs: crumbsFor(p, name), related, ogType: p.startsWith("/blog/") && !p.startsWith("/blog/topic") && p !== "/blog" ? "article" : "website" }));
}
for (const [from, to] of Object.entries(REDIRECTS)) write(from, redirect(to));

// 404
writeFileSync(join(OUT, "404.html"), page({ path: "/404", title: "Page Not Found | CasperPortal", desc: "This page does not exist. Find CasperPortal features, pricing and demos from here.", noindex: true,
  body: `<section><h1>Page Not Found</h1><p>The page you were looking for doesn't exist or has moved.</p><p class="ctas"><a class="btn" href="/">Go to the home page</a><a class="btn ghost" href="/features">See all features</a><a class="btn ghost" href="/pricing">Pricing</a><a class="btn ghost" href="/contact">Contact us</a></p></section>` }).replace(`<link rel="canonical" href="${SITE}/404">`, ""));
urls.splice(0, urls.length, ...urls.filter(([p]) => p !== "/404"));

// sitemap / robots / llms.txt / CNAME
const PRI = (p) => (p === "/" ? "1.0" : ["/pricing", "/demo", "/features"].includes(p) ? "0.9" : /^\/(features|problems|compare|niches|blog)\//.test(p) ? "0.7" : "0.6");
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d]) => `<url><loc>${SITE}${p}</loc><lastmod>${d}</lastmod><priority>${PRI(p)}</priority></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\n# AI answer engines and search crawlers are welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: Claude-User\nAllow: /\nUser-agent: anthropic-ai\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Perplexity-User\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\nUser-agent: Bingbot\nAllow: /\nUser-agent: Googlebot\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const llms = readFileSync(ROOT + "content/llms.txt", "utf8")
  .replace("{{BLOG}}", all.filter((p) => /^\/blog\/[^/]+$/.test(p) && !p.startsWith("/blog/topic")).map((p) => `- [${h1Of(p)}](${SITE}${p})`).join("\n"))
  .replace("{{NICHES}}", group("/niches/").map((p) => `- [${h1Of(p)}](${SITE}${p})`).join("\n"))
  .replace("{{LOCATIONS}}", TOWNS.map((t) => `- ${townName(t)}, MA: [CRM software](${SITE}/locations/crm-software-${t}-ma) · [business directory](${SITE}/directory/${t}-ma)`).join("\n"))
  .replace("{{FEATURES}}", group("/features/").map((p) => `- [${h1Of(p)}](${SITE}${p})`).join("\n"));
writeFileSync(join(OUT, "llms.txt"), llms);
writeFileSync(join(OUT, "CNAME"), "casperportal.com\n");
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(ROOT + "data/urls.txt", urls.map(([p]) => SITE + p).join("\n") + "\n");
if (!existsSync(join(OUT, KEY + ".txt"))) throw new Error("IndexNow key file missing from static/");
console.log(`built ${urls.length} pages + ${Object.keys(REDIRECTS).length} redirects (${faqPages} with FAQPage) at ${TODAY}`);
