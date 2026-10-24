// Shared layout + helpers for casperportal.com (static build). Brand: navy #020817, orange #F97316, green #22C55E.
// CasperPortal is the software platform. CasperB2B is a separate agency that offers optional done-for-you setup; the site
// names it only as that, links casperb2b.com from exactly one page (/casperb2b), and never publishes its agency content.
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const SITE = "https://casperportal.com";
export const NAME = "CasperPortal";
export const PHONE = "1-207-222-7737";
export const PHONE_VANITY = "1-207-2-CASPER";
export const PHONE_TEL = "+12072227737";
// Verified live 2026-10-24 on pay.casperportal.net (Stripe Checkout, 14-day trial, $0 due today).
export const PAY_TRIAL = "https://pay.casperportal.net/b/5kQeVe98O6Qe03adMvdIA12"; // $97/month after the trial. /start and every primary trial CTA.
export const PAY_MONTHLY = "https://pay.casperportal.net/b/dRmaEYacS3E2dU037RdIA14"; // $297/month Growth Plan after the trial. Pricing-tier button only.
export const PAY_ANNUAL = "https://pay.casperportal.net/b/fZudRabgW0rQ8zGbEndIA15"; // $2,970/year after the trial. Pricing-tier button only.
export const LOGO = "/img/casperportal-logo.png";
export const OG_DEFAULT = "/img/og-default.png";
export const OG_TRIAL = "/img/og-trial.png";
export const OG_W = "1200";
export const OG_H = "630";
export const OUT = fileURLToPath(new URL("../dist/", import.meta.url));
export const BUILT = new Date().toISOString();
export const TODAY = BUILT.slice(0, 10);
export const V = TODAY.replace(/-/g, "");

// The two conversion goals. Trial buttons go to /start (terms box → Stripe checkout), as on the live site.
export const CTA = { trial: ["/start", "Start 14-day free trial"], demo: ["/demo", "Book a demo"] };

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
export const strip = (h) => String(h).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

export const ORG_ID = `${SITE}/#org`;
export const ORG = {
  "@context": "https://schema.org", "@type": "Organization", "@id": ORG_ID, name: NAME, url: SITE + "/", logo: SITE + LOGO,
  description: "CasperPortal is CRM and marketing-automation software for local businesses: lead capture, missed-call text-back, follow-up automation, booking, reviews and sales pipelines in one platform.",
  telephone: PHONE_TEL, areaServed: "US",
  address: { "@type": "PostalAddress", addressLocality: "Georgetown", addressRegion: "MA", addressCountry: "US" },
  founder: [{ "@type": "Person", name: "Jared Casper", jobTitle: "Founder", url: SITE + "/jared-casper" }, { "@type": "Person", name: "Mark Casper", jobTitle: "Co-Founder", url: SITE + "/mark-casper" }],
  contactPoint: [{ "@type": "ContactPoint", contactType: "sales", telephone: PHONE_TEL, areaServed: "US", availableLanguage: "English", url: SITE + "/contact" }],
  sameAs: ["https://www.instagram.com/casperportal", "https://facebook.com/casperportal"],
};
export const SOFTWARE = {
  "@context": "https://schema.org", "@type": "SoftwareApplication", "@id": `${SITE}/#software`, name: NAME, url: SITE + "/",
  applicationCategory: "BusinessApplication", applicationSubCategory: "CRM and marketing automation", operatingSystem: "Web, iOS, Android",
  description: "All-in-one CRM, marketing automation and lead follow-up software for local businesses.", publisher: { "@id": ORG_ID },
  offers: [
    { "@type": "Offer", name: "Self-serve trial (monthly)", price: "97", priceCurrency: "USD", url: SITE + "/start", priceSpecification: { "@type": "UnitPriceSpecification", price: "97", priceCurrency: "USD", unitCode: "MON" } },
    { "@type": "Offer", name: "Growth Plan (monthly)", price: "297", priceCurrency: "USD", url: SITE + "/pricing", priceSpecification: { "@type": "UnitPriceSpecification", price: "297", priceCurrency: "USD", unitCode: "MON" } },
    { "@type": "Offer", name: "Growth Plan (annual)", price: "2970", priceCurrency: "USD", url: SITE + "/pricing", priceSpecification: { "@type": "UnitPriceSpecification", price: "2970", priceCurrency: "USD", unitCode: "ANN" } },
  ],
};

// Header navigation is grouped by what the visitor wants; build.mjs fills it from the page data (setNav).
// NAV = [[label, href]] or [[label, [[groupHeading, [[href, name, blurb]...]]...], {all: [href, label]}]]
let NAV = [];
export const setNav = (n) => { NAV = n; };
export const getNav = () => NAV;
export const TOWNS = ["georgetown", "rowley", "boxford", "groveland", "haverhill", "lawrence", "methuen", "newbury", "newburyport", "north-andover", "topsfield", "amesbury", "salisbury", "ipswich", "danvers", "beverly", "salem"];
export const townName = (t) => t.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export const urls = []; // [path, lastmod]
export function write(path, html) {
  const file = join(OUT, path === "/" ? "index.html" : path.endsWith("/") ? path + "index.html" : path + (path.includes(".") ? "" : "/index.html"));
  mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html);
  // GitHub Pages answers /pricing with a 301 to /pricing/ when only pricing/index.html exists; a sibling pricing.html makes
  // the canonical /pricing itself a 200 (pricing/index.html stays for old /pricing/ links).
  if (path !== "/" && !path.endsWith("/") && !path.includes(".")) writeFileSync(join(OUT, path + ".html"), html);
}

const cur = (path, href) => (path === href ? ' aria-current="page"' : "");
const navDesktop = (path) => NAV.map(([label, v, o = {}]) => typeof v === "string"
  ? `<a href="${v}"${cur(path, v)}>${esc(label)}</a>`
  : `<details><summary>${esc(label)}</summary><div class="menu${v.length > 2 ? " wide" : ""}">${v.map(([h, items]) => `<div class="mcol"><p class="mh">${esc(h)}</p>${items.map(([href, n, d]) => `<a href="${href}"${cur(path, href)}>${esc(n)}${d ? `<span>${esc(d)}</span>` : ""}</a>`).join("")}</div>`).join("")}${o.all ? `<a class="mall" href="${o.all[0]}">${esc(o.all[1])} →</a>` : ""}</div></details>`).join("");
const navMobile = () => NAV.map(([label, v, o = {}]) => typeof v === "string" ? `<a href="${v}">${esc(label)}</a>`
  : `<details><summary>${esc(label)}</summary>${o.all ? `<a href="${o.all[0]}"><b>${esc(o.all[1])}</b></a>` : ""}${v.map(([h, items]) => `<p class="mh">${esc(h)}</p>${items.map(([href, n]) => `<a href="${href}">${esc(n)}</a>`).join("")}`).join("")}</details>`).join("");

/** Facts-only trust strip (every fact is stated consistently on the pricing and start pages). */
export const trustBlock = () => `<ul class="trust" aria-label="Plan facts">
<li><b>14-day free trial</b><span>Billed only after the trial; cancel during it and pay nothing.</span></li>
<li><b>$97/month after the trial</b><span>Self-serve checkout from the trial page. $297/month and annual billing are on the pricing page.</span></li>
<li><b>Month-to-month</b><span>No long-term contract and no setup fee on the self-serve plan.</span></li>
<li><b>Keep your number</b><span>Port your business number or add a local number that forwards to you.</span></li>
<li><b>Local people</b><span>Built in Georgetown, MA by Jared and Mark Casper. Call or text <a href="tel:${PHONE_TEL}">(207) 222-7737</a>.</span></li>
</ul>`;

/** "Next best step" block: the most relevant feature, comparison and guide for this page, plus the page's conversion goal. */
export function nextBlock({ feature, compare, guide, cta = "trial" }) {
  const card = (kind, x) => x ? `<li><a href="${x[0]}" data-track="next:${kind}"><small>${kind}</small><b>${esc(x[1])}</b>${x[2] ? `<span>${esc(x[2])}</span>` : ""}</a></li>` : "";
  const [ph, pl] = CTA[cta], [sh, sl] = CTA[cta === "trial" ? "demo" : "trial"];
  return `<section class="next-step no-print" aria-labelledby="next-h" data-place="next"><div class="wrap">
<h2 id="next-h">Your next best step</h2>
<ul class="next-cards">${card("Feature", feature)}${card("Compare", compare)}${card("Guide", guide)}
<li class="go"><div><small>${cta === "trial" ? "Try it" : "See it live"}</small><b>${cta === "trial" ? "Run CasperPortal on your own leads for 14 days." : "Get a 30-minute walkthrough on your own workflow."}</b>
<p class="ctas"><a class="btn" href="${ph}">${pl}</a><a class="btn ghost" href="${sh}">${sl}</a></p></div></li></ul>
${trustBlock()}</div></section>`;
}

const footer = () => `<footer class="foot"><div class="wrap">
<div class="cols">
<div><p><a class="logo" href="/"><img src="${LOGO}" alt="" width="36" height="36">CasperPortal</a></p><p>CRM and marketing automation software for local businesses: capture every lead, follow up automatically, book the job and get the review.</p>
<h2>Stay Informed</h2><form class="inline-form" data-form="footer-newsletter" data-fm="Footer Newsletter Form" novalidate><label for="fnl-email" class="sr">Email address</label><input id="fnl-email" type="email" name="email" placeholder="Your work email" autocomplete="email" required><button class="btn sm ghost" type="submit">Subscribe</button><p class="msg" role="status" aria-live="polite"></p></form><p class="note">By joining, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
<h2>Sales &amp; Support</h2><p><a href="tel:${PHONE_TEL}">${PHONE_VANITY}</a> · <a href="tel:${PHONE_TEL}">${PHONE}</a><br><a href="/demo">Book a demo</a> · <a href="/start">Start free trial</a> · <a href="/contact">Contact</a></p></div>
<div><h2>Features</h2><ul><li><a href="/features/missed-call-text-back">Missed-call text-back</a></li><li><a href="/features/workflow-automations">Workflow automations</a></li><li><a href="/features/sales-pipelines">Sales pipelines</a></li><li><a href="/features/omnichannel-messaging">Unified inbox</a></li><li><a href="/features/appointment-booking">Appointment booking</a></li><li><a href="/features/reputation-management">Reputation management</a></li><li><a href="/features">All features</a></li></ul></div>
<div><h2>Who it's for</h2><ul><li><a href="/niches">All industries</a></li><li><a href="/niches/construction-companies">Contractors</a></li><li><a href="/niches/dental-clinics">Dental clinics</a></li><li><a href="/niches/beauty-salons">Salons</a></li><li><a href="/niches/real-estate-agents">Real estate</a></li><li><a href="/locations">North Shore service areas</a></li></ul></div>
<div><h2>Problems we solve</h2><ul><li><a href="/problems/missed-calls">Missed calls</a></li><li><a href="/problems/slow-follow-up">Slow follow-up</a></li><li><a href="/problems/losing-leads">Losing leads</a></li><li><a href="/problems/disconnected-tools">Too many tools</a></li><li><a href="/problems/reviews-stagnant">Too few reviews</a></li><li><a href="/problems">All problems</a></li></ul></div>
<div><h2>Compare</h2><ul><li><a href="/compare/hubspot">vs HubSpot</a></li><li><a href="/compare/salesforce">vs Salesforce</a></li><li><a href="/compare/gohighlevel">vs GoHighLevel</a></li><li><a href="/compare/activecampaign">vs ActiveCampaign</a></li><li><a href="/compare/calendly">vs Calendly</a></li><li><a href="/pricing">Pricing</a></li></ul></div>
<div><h2>Resources</h2><ul><li><a href="/blog">Blog</a></li><li><a href="/crm-for-local-businesses">CRM guide</a></li><li><a href="/roi-calculator">ROI calculator</a></li><li><a href="/glossary">Glossary</a></li><li><a href="/help">Help center</a></li><li><a href="/about-us">About us</a></li><li><a href="/affiliate">Affiliate program</a></li><li><a href="/casperb2b">Done-for-you setup</a></li></ul></div>
</div>
<div class="areas"><h2>Serving the North Shore</h2><p>CasperPortal is based in Georgetown, MA and works with local businesses across Essex County and the Merrimack Valley. <a href="/locations">All service areas →</a></p>
<ul>${TOWNS.map((t) => `<li><a href="/locations/crm-software-${t}-ma">${townName(t)}</a></li>`).join("")}</ul></div>
<div class="legal"><p>© ${TODAY.slice(0, 4)} CasperPortal · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/agreement-builder">Agreement Builder</a> · <a href="/brand-kit">Brand kit</a> · <a href="#" data-consent-open>Cookie settings</a></p>
<p>Georgetown, MA · <a href="https://www.linkedin.com/in/jaredcasper94/" rel="noopener">LinkedIn</a> · <a href="https://www.facebook.com/jaredcasper94/" rel="noopener">Facebook</a> · <a href="https://www.instagram.com/casperportal" rel="noopener">Instagram</a></p></div>
</div></footer>
<div class="float-contact no-print" data-float><button type="button" aria-expanded="false" aria-controls="fc-panel" aria-label="Call or text us">✆</button><div class="panel" id="fc-panel" hidden><p><b>GET IN TOUCH</b></p><a class="btn sm ghost" href="tel:${PHONE_TEL}">Call (207) 222-7737</a><a class="btn sm ghost" href="sms:${PHONE_TEL}">Text (207) 222-7737</a></div></div>`;

/** Mobile sticky CTA: the page's primary goal + the other one. Hidden on thank-you. /start scrolls to its checkout card. */
const sticky = (cta) => cta === "none" ? "" : `<div class="sticky-cta no-print" data-place="sticky">${cta === "checkout"
  ? `<a class="btn" href="#checkout">${CTA.trial[1]}</a>`
  : cta === "trial-only"
  ? `<a class="btn" href="${CTA.trial[0]}">${CTA.trial[1]}</a>`
  : cta === "demo" ? `<a class="btn" href="${CTA.demo[0]}">${CTA.demo[1]}</a><a class="btn ghost" href="${CTA.trial[0]}">Free trial</a>`
  : `<a class="btn" href="${CTA.trial[0]}">${CTA.trial[1]}</a><a class="btn ghost" href="${CTA.demo[0]}">Demo</a>`}</div>`;

/** Marks every conversion link so app.js can log it: data-cta="trial|annual|demo". */
export function tagCtas(html) {
  return html.replace(/<a\b([^>]*?)\shref="([^"]+)"([^>]*)>/g, (m, a, href, b) => {
    if (/data-cta=/.test(a + b)) return m;
    const kind = href === "/start" || href === "#checkout" || href.startsWith(PAY_TRIAL) || href.startsWith(PAY_MONTHLY) ? "trial" : href.startsWith(PAY_ANNUAL) ? "annual" : href === "/demo" || href.startsWith("/demo#") ? "demo" : null;
    return kind ? `<a${a} href="${href}" data-cta="${kind}"${b}>` : m;
  });
}

/** The page shell. crumbs = [[name, path], ...] (adds BreadcrumbList + visible breadcrumb). */
export function page({ path, title, desc, body, schema = [], noindex = false, crumbs, ogType = "website", image = OG_DEFAULT, imageAlt = "CasperPortal", lastmod = TODAY, related = "", stickyCta = "trial" }) {
  const url = SITE + (path === "/" ? "/" : path);
  const schemas = [{ "@context": "https://schema.org", "@type": "WebPage", "@id": url, url, name: title, description: desc, inLanguage: "en-US", dateModified: lastmod, isPartOf: { "@type": "WebSite", "@id": `${SITE}/#site`, name: NAME, url: SITE + "/" }, publisher: { "@id": ORG_ID } }, ...schema];
  if (crumbs && crumbs.length > 1) schemas.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + (p || "/") })) });
  if (!noindex) urls.push([path, lastmod]);
  const img = image.startsWith("http") ? image : SITE + image;
  const imgType = img.endsWith(".jpg") || img.endsWith(".jpeg") ? "image/jpeg" : img.endsWith(".webp") ? "image/webp" : "image/png";
  const trialHref = path === "/start" ? "#checkout" : CTA.trial[0];
  return tagCtas(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="CasperPortal"><meta property="og:locale" content="en_US"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${img}"><meta property="og:image:secure_url" content="${img}"><meta property="og:image:type" content="${imgType}"><meta property="og:image:width" content="${OG_W}"><meta property="og:image:height" content="${OG_H}"><meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:url" content="${url}"><meta name="twitter:image" content="${img}"><meta name="twitter:image:alt" content="${esc(imageAlt)}"><meta name="theme-color" content="#020817">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="sitemap" type="application/xml" href="/sitemap.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
${schemas.map(ld).join("")}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="top" data-place="header"><div class="wrap row"><a class="logo" href="/" aria-label="CasperPortal home"><img src="${LOGO}" alt="" width="36" height="36">CasperPortal</a>
<nav class="mainnav" aria-label="Main">${navDesktop(path)}</nav>
<div class="topcta"><a class="phone" href="tel:${PHONE_TEL}"><small>Call or text</small>${PHONE}</a><a class="btn sm ghost" href="${CTA.demo[0]}">Book a demo</a><a class="btn sm green" href="${trialHref}">Start free trial</a></div>
<button class="burger" type="button" data-burger aria-label="Menu" aria-expanded="false" aria-controls="drawer">☰</button></div>
<nav class="drawer" id="drawer" data-drawer aria-label="Mobile">${navMobile()}<a href="/contact">Contact</a><a href="tel:${PHONE_TEL}">Call ${PHONE}</a><p class="ctas"><a class="btn green" href="${trialHref}">${CTA.trial[1]}</a><a class="btn ghost" href="${CTA.demo[0]}">${CTA.demo[1]}</a></p></nav></header>
<main id="main">${crumbs && crumbs.length > 1 ? `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(([n, p], i) => (i < crumbs.length - 1 ? `<a href="${p || "/"}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`)).join(" › ")}</nav></div>` : ""}
<div class="wrap content" data-place="body">${body}</div>${related}</main>
${footer()}${sticky(stickyCta)}
<script src="/assets/app.js?v=${V}" defer></script><script src="/assets/forms.js?v=${V}" defer></script><script src="/assets/t.js?v=${V}" data-site="casperportal" data-banner="1" defer></script>
</body></html>`);
}

/** Redirect page for a merged/dropped URL (GitHub Pages serves it with a 200, so it carries canonical + meta refresh + noindex). */
export const redirect = (to) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved | CasperPortal</title><meta name="robots" content="noindex"><link rel="canonical" href="${to.startsWith("http") ? to : SITE + to}"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)}+location.search)</script></head><body><p>This page moved to <a href="${to}">${SITE}${to}</a>.</p></body></html>`;

/** Sibling links inside a cluster ("More features", "More industries"…). items = [[path, title, blurb]] */
export const relatedBlock = (items, h = "Related pages") => items.length ? `<section class="related no-print" aria-label="${esc(h)}"><div class="wrap"><h2>${esc(h)}</h2><ul>${items.map(([p, t, d]) => `<li><a href="${p}">${esc(t)}${d ? `<span>${esc(d)}</span>` : ""}</a></li>`).join("")}</ul></div></section>` : "";

export const faqSchema = (pairs) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pairs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
