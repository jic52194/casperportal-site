// Builds casperportal.com into dist/ (static, GitHub Pages): node scripts/build.mjs
// Hand-written page bodies: content/pages/*.html (+ titles etc. in content/meta.json, overridden by content/data/meta-*.json).
// Page families rendered from data: content/data/{features,niches,problems,compare,towns}.json (written from the old site's
// data in data/source/, with invented claims removed). Interactive parts are <div data-widget="..."> markers filled in here.
// Also writes KEYWORDS.md and LINKS.md (repo root) so the keyword map and link plan always match what was built.
import { fileURLToPath } from "node:url";
import { rmSync, mkdirSync, cpSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE, OUT, TODAY, PHONE, PHONE_TEL, PAY_MONTHLY, PAY_ANNUAL, CTA, ORG, SOFTWARE, TOWNS, townName, urls, write, page, redirect, relatedBlock, nextBlock, faqSchema, setNav, getNav, esc, strip } from "./lib.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const json = (f, fallback) => (existsSync(ROOT + f) ? JSON.parse(readFileSync(ROOT + f, "utf8")) : fallback);
const META = json("content/meta.json");
const POLLS = json("data/polls.json");
const SERVICES = json("data/agreement-services.json");
const KEY = readFileSync(ROOT + "data/indexnow-key", "utf8").trim();
const SRC_TOWNS = json("data/source/directory.directoryTowns.json", []);

// ── page families (null = not written yet → the old imported HTML pages are used) ──
const FAM = { features: json("content/data/features.json", null), niches: json("content/data/niches.json", null), problems: json("content/data/problems.json", null), compare: json("content/data/compare.json", null), towns: json("content/data/towns.json", null) };
const PREFIX = { features: "/features/", niches: "/niches/", problems: "/problems/", compare: "/compare/", towns: "/locations/crm-software-" };
const pathOf = (fam, slug) => fam === "towns" ? `/locations/crm-software-${slug}-ma` : PREFIX[fam] + slug;
const OVR = { ...json("content/data/meta-core.json", {}), ...json("content/data/meta-hubs.json", {}), ...json("content/data/meta-blog.json", {}) };

// ── redirects: hand list + merges decided by the content data ──
const REDIRECTS = { ...json("content/redirects.json") };
for (const t of TOWNS) REDIRECTS[`/directory/${t}-ma`] = `/locations/crm-software-${t}-ma`;
for (const [from, to] of Object.entries(FAM.niches?._merge || {})) REDIRECTS[`/niches/${from}`] = `/niches/${to}`;
for (const fam of Object.keys(FAM)) if (FAM[fam]) delete FAM[fam]._merge;
const finalOf = (p) => { const seen = new Set(); while (REDIRECTS[p] && !seen.has(p)) { seen.add(p); p = REDIRECTS[p]; } return p; };
for (const k of Object.keys(REDIRECTS)) REDIRECTS[k] = finalOf(k);

// ── the page list ──
const PAGES = {}; // path → { src: "html"|family, slug, title, desc, kw, cta, next, noindex, published, data }
for (const [p, m] of Object.entries(META)) {
  if (REDIRECTS[p]) continue;
  const fam = Object.keys(PREFIX).find((f) => FAM[f] && p.startsWith(PREFIX[f]));
  if (fam) continue; // rendered from data instead
  PAGES[p] = { src: "html", ...m, ...(OVR[p] || {}) };
}
for (const [fam, rows] of Object.entries(FAM)) if (rows) for (const [slug, d] of Object.entries(rows)) PAGES[pathOf(fam, slug)] = { src: fam, slug, title: d.title, desc: d.desc, kw: d.kw, cta: d.cta || "trial", next: d.next, data: d };
for (const p of Object.keys(OVR)) if (!PAGES[p] && !REDIRECTS[p]) console.warn("override for unknown page", p);

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
cpSync(ROOT + "static/", OUT, { recursive: true });

const bodyOf = (p) => PAGES[p].src === "html" ? readFileSync(ROOT + `content/pages/${PAGES[p].slug}.html`, "utf8") : "";
const h1Cache = {};
const h1Of = (p) => h1Cache[p] ??= (PAGES[p].data?.h1 || strip((bodyOf(p).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, PAGES[p].title])[1]));
const nameOf = (p) => PAGES[p].data?.name ? (PAGES[p].src === "compare" ? `CasperPortal vs ${PAGES[p].data.name}` : PAGES[p].src === "towns" ? `CRM software in ${PAGES[p].data.name}, MA` : PAGES[p].data.name) : h1Of(p);
const blurbOf = (p) => { const s = PAGES[p].data?.summary || PAGES[p].desc || ""; return s.length > 110 ? s.slice(0, 108).replace(/\s+\S*$/, "") + "…" : s; };
const cardOf = (p) => (p && PAGES[p] ? [p, nameOf(p), blurbOf(p)] : null);
const indexable = (p) => !PAGES[p].noindex;
const family = (fam) => Object.keys(PAGES).filter((p) => PAGES[p].src === fam || (!FAM[fam] && PAGES[p].src === "html" && p.startsWith(PREFIX[fam]) && p !== PREFIX[fam].replace(/\/$/, ""))).sort();
const isPost = (p) => /^\/blog\/[^/]+$/.test(p) && !p.startsWith("/blog/topic");
const GUIDES = () => [...Object.keys(PAGES).filter(isPost), "/crm-for-local-businesses", "/marketing-automation-for-small-business"].filter((p) => PAGES[p]);

const GROUPS = { capture: "Get more leads", "follow-up": "Follow up automatically", "book-pay": "Book jobs & get paid", manage: "Manage & grow", content: "Content & community" };
const CLUSTERS = { "home-trades": "Home services & trades", "health-wellness": "Health & wellness", retail: "Retail stores", "hospitality-events": "Hospitality & events", professional: "Professional services", auto: "Automotive" };
const grouped = (fam, key, labels) => { const out = {}; for (const p of family(fam)) { const g = PAGES[p].data?.[key] || "other"; (out[g] ||= []).push(p); } return Object.entries(labels).filter(([g]) => out[g]).map(([g, l]) => [l, out[g]]).concat(out.other ? [["More", out.other]] : []); };

// ── navigation (grouped by what the visitor wants) ──
const navItems = (ps, blurb = false) => ps.map((p) => [p, PAGES[p].data?.name || nameOf(p), blurb ? blurbOf(p) : ""]);
setNav([
  ["Features", grouped("features", "group", GROUPS).map(([l, ps]) => [l, navItems(ps)]), { all: ["/features", "All features"] }],
  ["Who it's for", [...grouped("niches", "cluster", CLUSTERS).map(([l, ps]) => [l, navItems(ps)]), ["By location", [["/locations", "North Shore service areas", ""]]]], { all: ["/niches", "All industries"] }],
  ["Problems we solve", [["Problems", navItems(family("problems"), true)]], { all: ["/problems", "All problems"] }],
  ["Compare", [["CasperPortal vs", family("compare").map((p) => [p, PAGES[p].data?.name || nameOf(p), ""])], ["Decide", [["/pricing", "Pricing", ""], ["/roi-calculator", "ROI calculator", ""], ["/quiz", "Is CasperPortal right for you?", ""]]]], { all: ["/compare", "All comparisons"] }],
  ["Pricing", [["Plans", [["/pricing", "Plans & pricing", "$297/month, unlimited users"], ["/start", "Start 14-day free trial", "Billed after the trial"], ["/demo", "Book a demo", "30-minute live walkthrough"], ["/casperb2b", "Done-for-you setup", "Have the setup built for you"]]]]],
  ["Resources", [["Learn", [["/blog", "Blog", ""], ["/crm-for-local-businesses", "CRM for local businesses", ""], ["/marketing-automation-for-small-business", "Marketing automation guide", ""], ["/glossary", "Glossary", ""], ["/help", "Help center", ""]]],
    ["Tools", [["/roi-calculator", "ROI calculator", ""], ["/quiz", "CRM readiness quiz", ""], ["/agreement-builder", "Agreement builder", ""], ["/tools", "All free tools", ""]]],
    ["Company", [["/about-us", "About us", ""], ["/our-story", "Our story", ""], ["/our-team", "Our team", ""], ["/contact", "Contact", ""], ["/affiliate", "Affiliate program", ""]]]]],
].map(([l, g, o]) => [l, g.filter(([, items]) => items.length), o]));

// ── widgets ──
const field = (id, label, input) => `<div class="field"><label for="${id}">${label}</label>${input}</div>`;
const consentBox = (id) => `<label class="check" for="${id}"><input type="checkbox" id="${id}" name="consent" required> <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>, and consent to receive communications.</span></label>`;
const status = `<p class="msg" role="status" aria-live="polite"></p>`;
const townCard = (t) => { const d = FAM.towns?.[t], s = SRC_TOWNS.find((x) => x.slug === t + "-ma") || {}; const inds = (d?.industries || s.keyIndustries || []).slice(0, 2).join(", "); return `<li><a href="/locations/crm-software-${t}-ma">${esc(townName(t))}<span>${esc([d?.population || s.population, inds].filter(Boolean).join(" · "))}</span></a></li>`; };
const cards = (ps, h = "h3") => `<div class="grid">${ps.map((p) => { const img = PAGES[p].data?.image; return `<a class="card cardlink" href="${p}">${img ? `<img src="${esc(img.src)}" alt="" width="48" height="48" loading="lazy" decoding="async" class="ico">` : ""}<${h}>${esc(nameOf(p))}</${h}><p>${esc(blurbOf(p))}</p></a>`; }).join("")}</div>`;
const W = {
  video: () => `<div class="video"><video controls playsinline preload="none" poster="/img/3016e196-2eb7-4699-b3c9-7d8877c5b78e-9fc822.webp" width="1200" height="655" aria-label="CasperPortal product walkthrough video"><source src="https://storage.googleapis.com/msgsndr/DNB14sOqM0GayjGjxxSy/media/6976d7ad29dcf57be16929e3.mp4" type="video/mp4"></video></div>`,
  roi: () => `<div class="card" data-roi><h2>Calculate Your Savings &amp; Growth</h2>
<p>Estimate the revenue you could recover from missed calls and what you'd save by consolidating your tools. Change the numbers to match your business.</p>
<div class="roi"><div>
<div class="field"><div class="range-row"><label for="roi-leads">Monthly Leads</label><span data-out="leads">50</span></div><input id="roi-leads" name="leads" type="range" min="10" max="1000" step="10" value="50"></div>
<div class="field"><div class="range-row"><label for="roi-missed">Missed Call Rate (%)</label><span data-out="missed">30%</span></div><input id="roi-missed" name="missed" type="range" min="0" max="100" step="5" value="30"></div>
<div class="field"><div class="range-row"><label for="roi-close">Close Rate (%)</label><span data-out="close">20%</span></div><input id="roi-close" name="close" type="range" min="0" max="100" step="5" value="20"></div>
<div class="two" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${field("roi-sale", "Avg. Sale Value ($)", `<input id="roi-sale" name="sale" type="number" min="0" inputmode="numeric" value="1500">`)}${field("roi-tools", "Current Tool Cost ($/mo)", `<input id="roi-tools" name="tools" type="number" min="0" inputmode="numeric" value="450">`)}</div>
</div><div class="card" style="background:var(--card2)"><h3>Estimated Recovery Opportunity</h3>
<p>Monthly Revenue Gain</p><output data-out="gain">$1,800</output><p data-out="sales">+1.2 sales/mo</p>
<p>Annual Growth Value</p><output data-out="annual">$23,436</output><p>Consolidated Savings Included</p>
<p class="note">*This is an estimate, not a promise. It assumes text-back recovers 40% of missed calls (an assumption, not a measured average) and compares your current tool cost with the $297/month Growth Plan.</p>
<p><a class="btn" href="/start">Start 14-day free trial</a></p></div></div></div>`,
  sales: () => `<form class="form" data-form="sales" novalidate><h3>Request a Custom Demo</h3><div class="two">${field("homeFirstName", "First Name", `<input id="homeFirstName" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("homeLastName", "Last Name", `<input id="homeLastName" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
${field("homeEmail", "Work Email", `<input id="homeEmail" name="email" type="email" placeholder="john@company.com" autocomplete="email" required>`)}${field("homePhone", "Phone Number", `<input id="homePhone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel">`)}<button class="btn" type="submit">Contact Sales</button>${status}</form>`,
  contact: () => `<form class="form" data-form="contact" novalidate><h2>Send us a Message</h2><div class="two">${field("firstName", "First Name", `<input id="firstName" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("lastName", "Last Name", `<input id="lastName" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
<div class="two">${field("email", "Email Address", `<input id="email" name="email" type="email" placeholder="john@example.com" autocomplete="email" required>`)}${field("phone", "Phone Number", `<input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel">`)}</div>
${field("message", "Message", `<textarea id="message" name="message" placeholder="How can we help you?" required></textarea>`)}${consentBox("contact-terms")}<p><button class="btn" type="submit">Send Message</button></p>${status}</form>`,
  partner: () => `<form class="form" data-form="partner" novalidate><h2>Apply to Partner</h2><p>Free to join.</p><div class="two">${field("pFirst", "First Name", `<input id="pFirst" name="firstName" placeholder="John" autocomplete="given-name" required>`)}${field("pLast", "Last Name", `<input id="pLast" name="lastName" placeholder="Doe" autocomplete="family-name" required>`)}</div>
<div class="two">${field("pEmail", "Email Address", `<input id="pEmail" name="email" type="email" placeholder="john@example.com" autocomplete="email" required>`)}${field("pPhone", "Phone Number", `<input id="pPhone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel" required>`)}</div>
${field("pWeb", "Website or Primary Social Profile", `<input id="pWeb" name="website" type="url" placeholder="https://...">`)}${field("pStrat", "Primary Promotion Strategy", `<select id="pStrat" name="promotionStrategy" required><option value="">Select your main channel...</option><option value="agency">Agency / My Clients</option><option value="social">YouTube / Social Media</option><option value="email">Email List / Newsletter</option><option value="blog">Blog / SEO</option><option value="network">Personal Network / Word of Mouth</option><option value="other">Other</option></select>`)}
<p class="note">By applying you agree to the <a href="/affiliate-terms">Partner Terms of Service</a>.</p><button class="btn" type="submit">Apply to Partner</button>${status}</form>`,
  addbiz: () => `<form class="form" data-form="addbiz" novalidate><h2>Business Details</h2>${field("businessName", "Business Name *", `<input id="businessName" name="businessName" autocomplete="organization" required>`)}${field("industry", "Industry / Business Type *", `<input id="industry" name="industry" placeholder="e.g. HVAC, Salon, Plumber" required>`)}
<div class="two">${field("town", "Town / City *", `<input id="town" name="town" list="town-list" autocomplete="address-level2" required><datalist id="town-list">${TOWNS.map((t) => `<option value="${townName(t)}">`).join("")}</datalist>`)}${field("website", "Website URL", `<input id="website" name="website" type="url" placeholder="https://">`)}</div>
<h3>Contact Person</h3><div class="two">${field("firstName", "First Name *", `<input id="firstName" name="firstName" autocomplete="given-name" required>`)}${field("lastName", "Last Name *", `<input id="lastName" name="lastName" autocomplete="family-name" required>`)}</div>
<div class="two">${field("email", "Email Address *", `<input id="email" name="email" type="email" autocomplete="email" required>`)}${field("phone", "Phone Number *", `<input id="phone" name="phone" type="tel" autocomplete="tel" required>`)}</div>
${field("description", "Short Business Description", `<textarea id="description" name="description" placeholder="Tell us a bit about what you do..."></textarea>`)}<button class="btn" type="submit">Send My Business Details</button>${status}
<p class="note">By submitting this form, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p></form>`,
  newsletter: () => `<form class="form" data-form="newsletter" novalidate><h3>Get local growth tips by email</h3><p>Local SEO tips, automation workflows and follow-up ideas for North Shore businesses.</p><div class="inline-form"><label class="sr" for="nl-email">Email address</label><input id="nl-email" name="email" type="email" placeholder="your@email.com" autocomplete="email" required><button class="btn ghost" type="submit">Subscribe Free</button></div>${status}</form>`,
  poll: (a) => {
    const p = POLLS[a["data-q"]]; if (!p) return "";
    const id = "poll-" + Math.abs([...a["data-q"]].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
    return `<div class="card" data-poll><p class="eyebrow">Quick Poll</p><form><fieldset style="border:0;padding:0;margin:0"><legend class="quiz-q" style="font-size:1.1rem">${esc(a["data-q"])}</legend><div class="svc">${p.options.map((o, i) => `<label for="${id}-${i}"><input type="radio" id="${id}-${i}" name="${id}" value="${esc(o)}"> ${esc(o)}</label>`).join("")}</div></fieldset><p><button class="btn sm ghost" type="submit">Submit My Answer</button></p></form>
<div data-poll-result hidden><p>You said: <b></b></p><p>${esc(p.followUp)}</p><p><a class="btn sm ghost" href="${esc(p.ctaUrl)}">${esc(p.ctaLabel)}</a></p></div></div>`;
  },
  youtube: (a) => { const src = a["data-src"], vid = src.split("/embed/")[1].split("?")[0], t = a["data-title"] || "Video";
    return `<div class="yt" data-yt="https://www.youtube-nocookie.com/embed/${vid}" data-title="${esc(t)}"><button type="button" style="background-image:url(https://i.ytimg.com/vi/${vid}/hqdefault.jpg)" aria-label="Play video: ${esc(t)}">▶ Play</button></div><p class="note"><a href="https://www.youtube.com/watch?v=${vid}" rel="noopener">Watch on YouTube</a></p>`; },
  booking: () => `<div class="card" data-booking><h2>Schedule Your Live Demo</h2><h3>Select a Date &amp; Time</h3><p class="note">30 min meeting • <span data-tz>America/New_York</span></p><p data-cal-status role="status" aria-live="polite">Loading open times… (If nothing appears, call <a href="tel:${PHONE_TEL}">${PHONE}</a>.)</p>
<div class="cal"><div><div class="cal-days" aria-label="Available days"></div></div><div class="cal-slots" aria-label="Available times"></div></div>
<form class="form" hidden novalidate data-fm="Demo Booking"><h3>Complete Your Booking</h3><p data-picked></p><div class="two">${field("bookingFirstName", "First Name", `<input id="bookingFirstName" name="firstName" autocomplete="given-name" required>`)}${field("bookingLastName", "Last Name", `<input id="bookingLastName" name="lastName" autocomplete="family-name" required>`)}</div>
<div class="two">${field("bookingEmail", "Email", `<input id="bookingEmail" name="email" type="email" autocomplete="email" required>`)}${field("bookingPhone", "Phone", `<input id="bookingPhone" name="phone" type="tel" autocomplete="tel" required>`)}</div>
${field("bookingNotes", "What are your main goals with CasperPortal?", `<textarea id="bookingNotes" name="notes"></textarea>`)}${consentBox("booking-terms")}<p><button class="btn" type="submit">Confirm Booking</button></p>${status}</form></div>`,
  // Hub pages: always-complete, grouped cards for a page family.
  cluster: (a) => {
    const fam = a["data-family"];
    if (fam === "features") return grouped("features", "group", GROUPS).map(([l, ps]) => `<h2>${esc(l)}</h2>${cards(ps)}`).join("");
    if (fam === "niches") return grouped("niches", "cluster", CLUSTERS).map(([l, ps]) => `<h2>${esc(l)}</h2>${cards(ps)}`).join("");
    if (fam === "problems" || fam === "compare") return cards(family(fam));
    if (fam === "locations") return `<ul class="towns">${TOWNS.map(townCard).join("")}</ul>`;
    throw new Error("unknown cluster family " + fam);
  },
};
function widgets(html) {
  return html.replace(/<div ((?:data-[a-z]+="[^"]*"\s*)+)><\/div>/g, (m, all) => {
    const kind = (all.match(/data-widget="([a-z]+)"/) || [])[1]; if (!kind) return m;
    const attrs = Object.fromEntries([...all.matchAll(/(data-[a-z]+)="([^"]*)"/g)].map((x) => [x[1], x[2].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')]));
    if (!W[kind]) throw new Error("unknown widget " + kind);
    return W[kind](attrs);
  });
}
// GHL form names on every form (t.js logs form_start/form_submit under these names)
const FORM_NAMES = { sales: "Sales Contact Form", contact: "Contact Us Form", partner: "Partner Program Application", addbiz: "Add Business Directory Form", newsletter: "Newsletter Signup", "footer-newsletter": "Footer Newsletter Form", agreement: "Agreement Builder Form" };
const nameForms = (html) => html.replace(/<form\b([^>]*?)data-form="([a-z-]+)"([^>]*)>/g, (m, a, f, b) => /data-fm=/.test(m) ? m : `<form${a}data-form="${f}" data-fm="${FORM_NAMES[f] || f}"${b}>`);

// ── conversion: one primary CTA destination per page ──
const ctaKind = (href) => href === "/start" || href.startsWith(PAY_MONTHLY) || href.startsWith(PAY_ANNUAL) ? "trial" : href === "/demo" || href.startsWith("/demo#") ? "demo" : "other";
function onePrimary(body, cta) {
  return body.replace(/<a\b([^>]*?)\bclass="([^"]*\bbtn\b[^"]*)"([^>]*)>/g, (m, a, cls, b) => {
    if (/\bghost\b/.test(cls)) return m;
    const href = ((a + b).match(/href="([^"]+)"/) || [])[1] || "";
    return ctaKind(href) === cta ? m : `<a${a}class="${cls} ghost"${b}>`;
  });
}
// internal links that point at a moved page go straight to its new home
const fixLinks = (html) => html.replace(/href="(\/[^"#?]*)([#?][^"]*)?"/g, (m, p, rest = "") => (REDIRECTS[p] ? `href="${REDIRECTS[p]}${rest.startsWith("#") ? "" : rest}"` : m));

// ── family templates ──
const faqHtml = (name, faqs = []) => faqs.length ? `<section id="faq"><h2>${esc(name)} FAQ</h2><div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></section>` : "";
const steps = (xs) => `<ol class="steps">${xs.map((s) => `<li><p>${esc(s)}</p></li>`).join("")}</ol>`;
const blocks = (xs) => `<div class="grid">${xs.map(({ h, p }) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join("")}</div>`;
const ctaRow = (cta) => { const [ph, pl] = CTA[cta], [sh, sl] = CTA[cta === "trial" ? "demo" : "trial"]; return `<p class="ctas"><a class="btn" href="${ph}">${pl}</a><a class="btn ghost" href="${sh}">${sl}</a></p>`; };
const TRIAL_NOTE = `<p class="note">14-day free trial · then $297/month · cancel during the trial and you pay nothing</p>`;
const hero = (eyebrow, d, cta, art = "") => `<section class="lead-block"><div class="${art ? "hero" : ""}"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(d.h1)}</h1><p class="lede">${esc(d.intro)}</p>${ctaRow(cta)}${cta === "trial" ? TRIAL_NOTE : ""}</div>${art}</div></section>`;
const art = (img) => img ? `<div class="feat-art"><img src="${esc(img.src)}" alt="${esc(img.alt || "")}" width="${img.w || 64}" height="${img.h || 64}" loading="eager" fetchpriority="high" decoding="async"></div>` : "";
const linked = (ps) => ps.map((p) => (PAGES[p] ? p : REDIRECTS[p])).filter((p, i, a) => p && PAGES[p] && a.indexOf(p) === i);
const RENDER = {
  features: (d, slug, cta) => hero(`Feature · ${GROUPS[d.group] || "Platform"}`, d, cta, art(d.image)) +
    `<section><h2>What you can do with ${esc(d.name)}</h2>${blocks(d.blocks || [])}</section>` +
    `<section><h2>How ${esc(d.name)} works</h2>${steps(d.steps || [])}</section>` +
    ((d.for || []).length ? `<section><h2>Who uses ${esc(d.name)}</h2>${cards(linked(d.for.map((s) => "/niches/" + s)))}</section>` : "") +
    faqHtml(d.name, d.faqs),
  niches: (d, slug, cta) => hero(`Who it's for · ${CLUSTERS[d.cluster] || "Local business"}`, d, cta, art(d.image)) +
    `<section><h2>What slows ${esc(d.name.toLowerCase())} down</h2>${blocks(d.pains || [])}</section>` +
    `<section><h2>A CasperPortal workflow for ${esc(d.name.toLowerCase())}</h2>${steps(d.workflow || [])}</section>` +
    `<section><h2>Features ${esc(d.name.toLowerCase())} use most</h2>${cards(linked((d.features || []).map((s) => "/features/" + s)))}</section>` +
    faqHtml(d.name, d.faqs),
  problems: (d, slug, cta) => hero("Problem we solve", d, cta, art(d.image)) +
    `<section><div class="split"><div class="card"><h2>Why it happens</h2><p>${esc(d.why)}</p></div><div class="card"><h2>What it costs you</h2><p>${esc(d.cost)}</p></div></div></section>` +
    `<section><h2>How CasperPortal fixes it</h2><p>${esc(d.solution)}</p>${steps(d.steps || [])}</section>` +
    `<section><h2>Features that solve it</h2>${cards(linked((d.features || []).map((s) => "/features/" + s)))}</section>` +
    faqHtml(d.name, d.faqs),
  compare: (d, slug, cta) => hero(`${d.name} alternative`, d, cta) +
    `<section><h2>CasperPortal vs ${esc(d.name)} at a glance</h2><table><thead><tr><th scope="col">Capability</th><th scope="col">CasperPortal</th><th scope="col">${esc(d.name)}</th></tr></thead><tbody>${(d.rows || []).map(([c, a, b]) => `<tr><th scope="row">${esc(c)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table><p class="note">Based on each product's public positioning; check ${esc(d.name)}'s current plans before you decide.</p></section>` +
    `<section><div class="split"><div class="card"><h2>Choose CasperPortal if…</h2><ul class="checks">${(d.chooseUs || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="card"><h2>Choose ${esc(d.name)} if…</h2><ul class="checks">${(d.chooseThem || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></section>` +
    `<section><h2>Switching from ${esc(d.name)}</h2>${steps(d.switch || [])}</section>` +
    faqHtml(`CasperPortal vs ${d.name}`, d.faqs) +
    `<section class="final-cta"><h2>Try CasperPortal before you switch</h2><p>Run your own leads through CasperPortal for 14 days. Billed only after the trial, $297/month, month-to-month.</p><p class="ctas"><a class="btn" href="/start">Start 14-day free trial</a><a class="btn ghost" href="/pricing">See pricing</a></p></section>`,
  towns: (d, slug, cta) => hero(`${d.region || "North Shore"} · ${d.county || "Essex County"}`, d, cta) +
    `<section><div class="split"><div class="card"><h2>${esc(d.name)} at a glance</h2><ul class="checks"><li>Population: ${esc(d.population)}</li><li>Key industries: ${esc((d.industries || []).join(", "))}</li><li>Common business types: ${esc((d.businessTypes || []).join(", "))}</li></ul></div><div class="card"><h2>Why follow-up matters in ${esc(d.name)}</h2><p>${esc(d.localHook)}</p></div></div></section>` +
    `<section><h2>How ${esc(d.name)} businesses use CasperPortal</h2><div class="grid">${(d.useCases || []).map((u) => { const n = linked([u.niche])[0]; return `<div class="card"><h3>${esc(u.h)}</h3><p>${esc(u.p)}</p>${n ? `<p><a href="${n}">CRM for ${esc((PAGES[n].data?.name || nameOf(n)).toLowerCase())} →</a></p>` : ""}</div>`; }).join("")}</div></section>` +
    ((d.nearby || []).length ? `<section><h2>Nearby service areas</h2><ul class="towns">${d.nearby.filter((t) => TOWNS.includes(t)).map(townCard).join("")}</ul><p><a href="/locations">All North Shore service areas →</a></p></section>` : "") +
    faqHtml(`${d.name}, MA`, d.faqs),
};

// ── next best step: the page's own choice, else the best keyword match ──
const STOP = new Set("a an and the for to of in on with your you our is are it its by or from that this how what why can do does at as be crm casperportal software business businesses local small".split(" "));
const toks = (s) => (strip(s).toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
const keyToks = (p) => [...new Set(toks(`${PAGES[p].kw || ""} ${nameOf(p)}`))];
function bestMatch(p, pool, text) {
  const words = toks(text), count = {}; for (const w of words) count[w] = (count[w] || 0) + 1;
  let best = null, score = -1;
  for (const c of pool) { if (c === p) continue; const s = keyToks(c).reduce((n, w) => n + Math.min(count[w] || 0, 5), 0); if (s > score) { score = s; best = c; } }
  return best;
}
const nextFor = (p, text) => {
  const n = PAGES[p].next || {}, ok = (x, pool) => { const y = x && (PAGES[x] ? x : REDIRECTS[x]); return y && y !== p && pool.includes(y) ? y : null; };
  const feats = family("features"), comps = family("compare"), guides = GUIDES();
  return { feature: cardOf(ok(n.feature, feats) || bestMatch(p, feats, text)), compare: cardOf(ok(n.compare, comps) || bestMatch(p, comps, text)), guide: cardOf(ok(n.guide, guides) || bestMatch(p, guides, text)) };
};
const NEXT = {}; // for LINKS.md

// ── siblings inside a cluster ──
const ring = (list, p, n = 3) => { const i = list.indexOf(p); return [1, 2, 3, 4, 5].map((k) => list[(i + k) % list.length]).filter((x) => x !== p).slice(0, n); };
function siblings(p) {
  const fam = Object.keys(PREFIX).find((f) => PAGES[p].src === f) || (p.startsWith("/blog/") && isPost(p) ? "blog" : null);
  if (!fam) return null;
  if (fam === "blog") return ["More guides", ring(Object.keys(PAGES).filter(isPost).sort(), p)];
  if (fam === "towns") { const d = PAGES[p].data; const near = linked((d.nearby || []).map((t) => pathOf("towns", t))).slice(0, 3); return ["Nearby towns", near.length ? near : ring(family("towns"), p)]; }
  const key = fam === "features" ? "group" : fam === "niches" ? "cluster" : null, list = family(fam);
  const same = key ? list.filter((x) => PAGES[x].data?.[key] === PAGES[p].data?.[key]) : list;
  return [{ features: "More features", niches: "Similar industries", problems: "Other problems we solve", compare: "Other comparisons" }[fam], ring(same.length > 3 ? same : list, p)];
}

// ── breadcrumbs ──
const SECTION = { features: ["Features", "/features"], niches: ["Who it's for", "/niches"], problems: ["Problems we solve", "/problems"], compare: ["Compare", "/compare"], blog: ["Blog", "/blog"], locations: ["Service areas", "/locations"], directory: ["Service areas", "/locations"] };
function crumbsFor(p, name) {
  if (p === "/") return null;
  const segs = p.split("/").filter(Boolean), c = [["Home", "/"]];
  if (segs.length > 1 && SECTION[segs[0]]) c.push(SECTION[segs[0]]);
  if (segs[0] === "blog" && segs[1] === "topic") c.push(["Topics", "/blog"]);
  c.push([name, p]);
  return c.filter((x, i, a) => a.findIndex((y) => y[1] === x[1]) === i);
}

// ── pages ──
const STICKY = { "/start": "none", "/thank-you": "none", "/directory/add": "none", "/demo": "trial-only" };
const ARTICLE_GUIDES = ["/crm-for-local-businesses", "/marketing-automation-for-small-business"];
const HUB = { "/features": "features", "/niches": "niches", "/problems": "problems", "/compare": "compare", "/locations": "towns" };
let faqPages = 0;
const BUILT = {}; // path → {title, h1, desc, kw, cta}
for (const [p, m] of Object.entries(PAGES)) {
  const cta = m.cta === "demo" ? "demo" : "trial";
  let body = m.src === "html" ? bodyOf(p) : RENDER[m.src](m.data, m.slug, cta);
  body = nameForms(onePrimary(widgets(body), cta));
  // first content image is the LCP candidate: load it eagerly
  body = body.replace(/<img ([^>]*?)loading="lazy"/, (x, a) => (body.indexOf(x) < 2500 ? `<img ${a}loading="eager" fetchpriority="high"` : x));
  const name = m.src === "html" ? h1Of(p) : nameOf(p);
  const schema = [];
  if (p === "/") schema.push(ORG, SOFTWARE, { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE}/#site`, name: "CasperPortal", url: SITE + "/", publisher: { "@id": ORG["@id"] } });
  if (["/pricing", "/start", "/features"].includes(p) || m.src === "features" || m.src === "compare") schema.push(SOFTWARE);
  const pairs = [...body.matchAll(/<details><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map((x) => [strip(x[1]), strip(x[2])]).filter(([q, a]) => q && a);
  if (pairs.length && !m.noindex) { schema.push(faqSchema(pairs)); faqPages++; }
  const img = (body.match(/<img [^>]*src="(\/img\/[^"]+)"/) || [])[1];
  if (isPost(p) || ARTICLE_GUIDES.includes(p)) schema.push({ "@context": "https://schema.org", "@type": "Article", headline: h1Of(p).slice(0, 110), description: m.desc, url: SITE + p, mainEntityOfPage: SITE + p, inLanguage: "en-US", ...(m.published ? { datePublished: m.published } : {}), dateModified: TODAY, ...(img ? { image: SITE + img } : {}), publisher: { "@type": "Organization", "@id": ORG["@id"], name: "CasperPortal", logo: { "@type": "ImageObject", url: SITE + "/img/casperportal-logo.png" } },
    author: isPost(p) ? { "@type": "Person", name: "Jared Casper", jobTitle: "Founder", url: SITE + "/jared-casper" } : { "@type": "Organization", name: "CasperPortal", url: SITE + "/" } });
  if (HUB[p]) { const list = HUB[p] === "towns" ? family("towns") : family(HUB[p]); if (list.length) schema.push({ "@context": "https://schema.org", "@type": "ItemList", name: h1Of(p), itemListElement: list.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: nameOf(x), url: SITE + x })) }); }
  if (p === "/jared-casper" || p === "/mark-casper") schema.push({ "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": "Person", name: p === "/jared-casper" ? "Jared Casper" : "Mark Casper", jobTitle: p === "/jared-casper" ? "Founder" : "Co-Founder", url: SITE + p, worksFor: { "@id": ORG["@id"] } } });
  let after = "";
  if (!m.noindex) {
    const nx = nextFor(p, `${m.kw || ""} ${m.title} ${body}`); NEXT[p] = { ...nx, cta };
    after = nextBlock({ ...nx, cta });
    const sib = siblings(p); if (sib) after += relatedBlock(sib[1].map(cardOf).filter(Boolean), sib[0]);
  }
  const sticky = STICKY[p] || (cta === "demo" ? "demo" : "trial");
  const html = fixLinks(page({ path: p, title: m.title, desc: m.desc, body, schema, noindex: !!m.noindex, crumbs: crumbsFor(p, name), related: after, stickyCta: sticky, ogType: isPost(p) ? "article" : "website" }));
  write(p, html);
  BUILT[p] = { title: m.title, h1: strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1]), desc: m.desc, kw: m.kw || "", cta, src: m.src, noindex: !!m.noindex };
}
for (const [from, to] of Object.entries(REDIRECTS)) if (!PAGES[from]) write(from, redirect(to));

// 404
writeFileSync(join(OUT, "404.html"), page({ path: "/404", title: "Page Not Found | CasperPortal", desc: "This page does not exist. Find CasperPortal features, pricing and demos from here.", noindex: true,
  body: `<section><h1>Page Not Found</h1><p>The page you were looking for doesn't exist or has moved.</p><p class="ctas"><a class="btn" href="/start">Start 14-day free trial</a><a class="btn ghost" href="/features">See all features</a><a class="btn ghost" href="/pricing">Pricing</a><a class="btn ghost" href="/demo">Book a demo</a></p></section>` }).replace(`<link rel="canonical" href="${SITE}/404">`, ""));
urls.splice(0, urls.length, ...urls.filter(([p]) => p !== "/404"));

// sitemap / robots / llms.txt / CNAME
const PRI = (p) => (p === "/" ? "1.0" : ["/pricing", "/demo", "/start", "/features"].includes(p) ? "0.9" : /^\/(features|problems|compare|niches)\//.test(p) || ARTICLE_GUIDES.includes(p) ? "0.8" : isPost(p) || p.startsWith("/locations/") ? "0.7" : "0.5");
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d]) => `<url><loc>${SITE}${p}</loc><lastmod>${d}</lastmod><priority>${PRI(p)}</priority></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\n# AI answer engines and search crawlers are welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: Claude-User\nAllow: /\nUser-agent: anthropic-ai\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Perplexity-User\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\nUser-agent: Bingbot\nAllow: /\nUser-agent: Googlebot\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
const li = (p) => `- [${nameOf(p)}](${SITE}${p}): ${blurbOf(p)}`;
const llms = readFileSync(ROOT + "content/llms.txt", "utf8")
  .replace("{{FEATURES}}", grouped("features", "group", GROUPS).map(([l, ps]) => `### ${l}\n${ps.map(li).join("\n")}`).join("\n\n"))
  .replace("{{NICHES}}", family("niches").filter(indexable).map(li).join("\n"))
  .replace("{{PROBLEMS}}", family("problems").map(li).join("\n"))
  .replace("{{COMPARE}}", family("compare").map(li).join("\n"))
  .replace("{{GUIDES}}", GUIDES().filter(indexable).map(li).join("\n"))
  .replace("{{LOCATIONS}}", TOWNS.map((t) => `- [${townName(t)}, MA](${SITE}/locations/crm-software-${t}-ma)`).join("\n"));
writeFileSync(join(OUT, "llms.txt"), llms);
writeFileSync(join(OUT, "CNAME"), "casperportal.com\n");
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(ROOT + "data/urls.txt", urls.map(([p]) => SITE + p).join("\n") + "\n");
writeFileSync(join(OUT, "build-pages.json"), JSON.stringify(BUILT));
if (!existsSync(join(OUT, KEY + ".txt"))) throw new Error("IndexNow key file missing from static/");

// ── KEYWORDS.md + LINKS.md (generated; edit the data, not these files) ──
const SECTIONS = [["Core & conversion", (p) => ["/", "/pricing", "/start", "/demo", "/contact", "/casperb2b"].includes(p)], ["Features", (p) => p.startsWith("/features")], ["Who it's for (industries)", (p) => p.startsWith("/niches")], ["Problems we solve", (p) => p.startsWith("/problems")], ["Compare", (p) => p.startsWith("/compare")], ["Guides & blog", (p) => p.startsWith("/blog") || ARTICLE_GUIDES.includes(p)], ["Service areas", (p) => p.startsWith("/locations")], ["Everything else", () => true]];
const idx = Object.keys(BUILT).filter((p) => !BUILT[p].noindex), done = new Set();
const cell = (s) => String(s || "").replace(/\|/g, "\\|");
let kmd = `# KEYWORDS.md — one primary keyword per indexable page\n\nGenerated by \`npm run build\` from content/data/*.json and content/meta.json (edit those, not this file). ${idx.length} indexable pages; \`npm run check\` fails if two pages share a keyword or title.\n\nRules: each keyword appears in the page's title, H1 (or a close natural form), the first sentence of the answer-first intro and the meta description. Near-duplicates were merged (see Redirects below).\n`;
for (const [h, f] of SECTIONS) { const ps = idx.filter((p) => !done.has(p) && f(p)); if (!ps.length) continue; ps.forEach((p) => done.add(p)); kmd += `\n## ${h} (${ps.length})\n\n| Page | Primary keyword | Title | H1 |\n|---|---|---|---|\n${ps.map((p) => `| ${p} | ${cell(BUILT[p].kw)} | ${cell(BUILT[p].title)} | ${cell(BUILT[p].h1)} |`).join("\n")}\n`; }
kmd += `\n## Not indexed (noindex, URL kept)\n\n${Object.keys(BUILT).filter((p) => BUILT[p].noindex).map((p) => `- ${p}`).join("\n")}\n\n## Redirects (old URL → new home)\n\n${Object.entries(REDIRECTS).filter(([f]) => !PAGES[f]).sort().map(([f, t]) => `- ${f} → ${t}`).join("\n")}\n`;
writeFileSync(ROOT + "KEYWORDS.md", kmd);
const navMd = getNav().map(([l, g, o]) => typeof g === "string" ? `- **${l}** → ${g}` : `- **${l}**${o?.all ? ` (hub: ${o.all[0]})` : ""}\n${g.map(([h, items]) => `  - ${h}: ${items.map(([href, n]) => `[${n}](${href})`).join(", ")}`).join("\n")}`).join("\n");
let lmd = `# LINKS.md — navigation, hubs and next-best-step links\n\nGenerated by \`npm run build\` (edit the "next" fields in content/data/*.json, not this file).\n\n## Header menu (grouped by what the visitor wants)\n\nEvery page header also has **Book a demo** (/demo) and **Start free trial** (/start), and phones get a sticky bottom bar with the page's primary CTA, so every page is one click from a trial or a demo (checked by \`npm run check\`).\n\n${navMd}\n\n## Cluster hubs\n\n${Object.entries(HUB).map(([h, f]) => `- ${h}: ${family(f).length} pages, grouped (cards rendered from the same data as the pages)`).join("\n")}\n\n## Next best step per page\n\nCTA = the page's one primary call to action (trial = /start → Stripe checkout; demo = /demo calendar). Feature/Compare/Guide = the most relevant page of each kind.\n\n| Page | CTA | Feature | Compare | Guide |\n|---|---|---|---|---|\n${Object.entries(NEXT).map(([p, n]) => `| ${p} | ${n.cta} | ${n.feature?.[0] || ""} | ${n.compare?.[0] || ""} | ${n.guide?.[0] || ""} |`).join("\n")}\n`;
writeFileSync(ROOT + "LINKS.md", lmd);
console.log(`built ${urls.length} pages + ${Object.keys(REDIRECTS).filter((f) => !PAGES[f]).length} redirects (${faqPages} with FAQPage) at ${TODAY}; families from data: ${Object.keys(FAM).filter((f) => FAM[f]).join(", ") || "none yet"}`);
