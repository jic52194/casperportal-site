// Shared layout + helpers for casperportal.com (static build). Brand: navy #020817, orange #F97316, green #22C55E.
// CasperPortal is the software platform. CasperB2B (casperb2b.com) is a separate company that provides done-for-you
// services; it is mentioned only where the live site already says so, and its content is never published here.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const SITE = "https://casperportal.com";
export const NAME = "CasperPortal";
export const PHONE = "1-207-222-7737";
export const PHONE_VANITY = "1-207-2-CASPER";
export const PHONE_TEL = "+12072227737";
export const PAY_MONTHLY = "https://pay.casperportal.net/b/dRmaEYacS3E2dU037RdIA14"; // Stripe payment link, monthly plan (unchanged from live site)
export const PAY_ANNUAL = "https://pay.casperportal.net/b/fZudRabgW0rQ8zGbEndIA15"; // Stripe payment link, annual plan (unchanged)
export const LOGO = "/img/casperportal-logo.png";
export const OG_DEFAULT = "/img/og-default.png";
export const OUT = new URL("../dist/", import.meta.url).pathname;
export const BUILT = new Date().toISOString();
export const TODAY = BUILT.slice(0, 10);
export const V = TODAY.replace(/-/g, "");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
export const strip = (h) => String(h).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

export const ORG_ID = `${SITE}/#org`;
export const ORG = {
  "@context": "https://schema.org", "@type": "Organization", "@id": ORG_ID, name: NAME, url: SITE + "/", logo: SITE + LOGO,
  description: "CasperPortal is CRM and marketing-automation software for local service businesses: lead capture, missed-call text-back, follow-up automation, booking, reviews and pipelines in one platform.",
  telephone: PHONE_TEL, areaServed: "US",
  founder: { "@type": "Person", name: "Jared Casper", url: SITE + "/jared-casper" },
  contactPoint: [{ "@type": "ContactPoint", contactType: "sales", telephone: PHONE_TEL, areaServed: "US", availableLanguage: "English" }],
  sameAs: ["https://www.instagram.com/casperportal", "https://www.linkedin.com/company/casperportal", "https://facebook.com/casperportal"],
};
export const SOFTWARE = {
  "@context": "https://schema.org", "@type": "SoftwareApplication", "@id": `${SITE}/#software`, name: NAME, url: SITE + "/",
  applicationCategory: "BusinessApplication", applicationSubCategory: "CRM and marketing automation", operatingSystem: "Web, iOS, Android",
  description: "All-in-one CRM, automation and follow-up platform for local service businesses.", publisher: { "@id": ORG_ID },
  offers: [
    { "@type": "Offer", name: "Growth Plan (monthly)", price: "297", priceCurrency: "USD", url: SITE + "/pricing", priceSpecification: { "@type": "UnitPriceSpecification", price: "297", priceCurrency: "USD", unitCode: "MON" } },
    { "@type": "Offer", name: "Growth Plan (annual)", price: "2970", priceCurrency: "USD", url: SITE + "/pricing", priceSpecification: { "@type": "UnitPriceSpecification", price: "2970", priceCurrency: "USD", unitCode: "ANN" } },
  ],
};

// Header navigation (same groups and order as the live site).
export const NAV = [
  ["Platform", [["Core Features", [["/features/workflow-automations", "Workflow Automations", "Automate tasks with sub-200ms processing."], ["/features/sales-pipelines", "Sales Pipelines", "See every opportunity in your pipeline."], ["/features/omnichannel-messaging", "Omnichannel Messaging", "One inbox for texts, emails, and chat."], ["/features", "All Features", "Explore the full suite of tools."]]],
    ["Use Cases & Platform", [["/use-cases", "Use Cases", "See exactly how businesses use CasperPortal."], ["/integrations", "Integrations", "Connect Stripe, Zapier, Quickbooks, and more."], ["/security", "Security", "Enterprise-grade encryption and compliance."], ["/problems", "Problems We Fix", "See the exact bottlenecks we solve."]]]]],
  ["Services", [["Our Expertise", [["/services", "Solutions & Services", "Full-service agency growth solutions."], ["/affiliate", "Affiliate Program", "Partner with us and earn."], ["/development", "Custom Development", "Bespoke engineering by Jared Casper."]]]]],
  ["Pricing", "/pricing"],
  ["Resources", [["Learning Hub", [["/blog", "Blog & Insights", "Actionable marketing strategies."], ["/glossary", "Glossary", "CRM and marketing terms defined."], ["/help", "Help Center", "Support and documentation."], ["/compare", "Competitor Comparisons", "How we stack up against the rest."], ["/niches", "Industries We Serve", "Tailored solutions for your sector."]]],
    ["Local Business", [["/directory", "Local Business Directory", "Explore North Shore MA businesses."], ["/locations", "Service Areas", "North Shore MA towns we serve."], ["/tools", "Free Tools Hub", "Calculators and generators."], ["/roi-calculator", "ROI Calculator", "Calculate your potential savings."], ["/brand-kit", "Brand Kit", "Official assets and logos."]]]]],
  ["Company", [["Who We Are", [["/our-story", "Our Story", "The history of CasperPortal."], ["/our-team", "Our Team", "Meet the Casper family."], ["/about-us", "About Us", "Our mission and values."], ["/contact", "Contact", "Talk to sales and support."]]]]],
];
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

const navDesktop = (path) => NAV.map(([label, v]) => typeof v === "string"
  ? `<a href="${v}"${path === v ? ' aria-current="page"' : ""}>${esc(label)}</a>`
  : `<details><summary>${esc(label)}</summary><div class="menu">${v.map(([h, items]) => `<p class="mh">${esc(h)}</p>${items.map(([href, n, d]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${esc(n)}<span>${esc(d)}</span></a>`).join("")}`).join("")}</div></details>`).join("");
const navMobile = () => NAV.map(([label, v]) => typeof v === "string" ? `<a href="${v}">${esc(label)}</a>` : v.map(([h, items]) => `<p class="mh">${esc(label)} · ${esc(h)}</p>${items.map(([href, n]) => `<a href="${href}">${esc(n)}</a>`).join("")}`).join("")).join("");

const footer = () => `<footer class="foot"><div class="wrap">
<div class="offer"><div><p><b style="color:#fff">Welcome — First Visit Offer</b></p><p>Get a free CRM &amp; automation audit for your business. We'll show you exactly what to fix and how to grow — no strings attached.</p></div><a class="btn sm" href="/demo">Get a Free Audit</a></div>
<div class="cols">
<div><p><a class="logo" href="/"><img src="${LOGO}" alt="" width="36" height="36">CasperPortal</a></p><p>Enterprise-grade CRM and growth software for local businesses. Automate follow-up, manage leads, and scale — all in one platform.</p>
<h2>Stay Informed</h2><form class="inline-form" data-form="footer-newsletter" novalidate><label for="fnl-email" class="sr">Email address</label><input id="fnl-email" type="email" name="email" placeholder="Your work email" autocomplete="email" required><button class="btn sm" type="submit">Subscribe</button><p class="msg" role="status" aria-live="polite"></p></form><p class="note">By joining, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
<h2>Sales &amp; Support</h2><p><a href="tel:${PHONE_TEL}">${PHONE_VANITY}</a> · <a href="tel:${PHONE_TEL}">${PHONE}</a><br><a href="/demo">Book a Demo</a></p></div>
<div><h2>Platform</h2><ul><li><a href="/features">Features</a></li><li><a href="/integrations">Integrations</a></li><li><a href="/security">Security</a></li><li><a href="/problems">Problems We Fix</a></li><li><a href="/niches">Industries</a></li><li><a href="/compare">Competitor Comparisons</a></li></ul></div>
<div><h2>Services</h2><ul><li><a href="/services">All Services</a></li><li><a href="/use-cases">Use Cases</a></li><li><a href="/crm-for-local-businesses">CRM for Local Business</a></li><li><a href="/marketing-automation-for-small-business">Marketing Automation</a></li><li><a href="/locations">Service Areas</a></li><li><a href="/directory">Local Directory</a></li><li><a href="/pricing">Pricing</a></li></ul></div>
<div><h2>Resources</h2><ul><li><a href="/blog">Blog &amp; Insights</a></li><li><a href="/roi-calculator">ROI Calculator</a></li><li><a href="/help">Help Center</a></li><li><a href="/glossary">Glossary of Terms</a></li><li><a href="/tools">Free Tools</a></li><li><a href="/brand-kit">Brand Kit</a></li><li><a href="/quiz">Is CasperPortal for me?</a></li></ul></div>
<div><h2>Partners</h2><ul><li><a href="/affiliate">Affiliate Program</a></li><li><a href="/affiliate-kit">Affiliate Kit</a></li><li><a href="/affiliate-terms">Affiliate Terms</a></li><li><a href="/casperb2b">The Ecosystem (CasperB2B)</a></li><li><a href="https://casperb2b.com/setup" rel="noopener">Expert Implementation</a></li><li><a href="https://casperb2b.com/strategy" rel="noopener">Growth Strategy</a></li></ul></div>
<div><h2>Company</h2><ul><li><a href="/about-us">About Us</a></li><li><a href="/our-story">Our Story</a></li><li><a href="/our-team">Our Team</a></li><li><a href="/contact">Contact</a></li><li><a href="/demo">Book a Demo</a></li></ul></div>
</div>
<div class="areas"><h2>Serving the North Shore</h2><p>CasperPortal proudly serves local businesses in Georgetown, MA and surrounding Essex County communities. <a href="/directory">View Full Local Business Directory →</a></p>
<ul>${TOWNS.map((t) => `<li><a href="/locations/crm-software-${t}-ma">${townName(t)}</a></li>`).join("")}</ul></div>
<div class="legal"><p>© ${TODAY.slice(0, 4)} CasperPortal. · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/agreement-builder">Agreement Builder</a> · <a href="#" data-consent-open>Cookie settings</a></p>
<p>Powered by <a href="/casperb2b">CasperB2B</a> · Georgetown, MA · Built for local businesses that want to grow smarter.</p>
<p><a href="https://www.linkedin.com/in/jaredcasper94/" rel="noopener">LinkedIn</a> · <a href="https://www.facebook.com/jaredcasper94/" rel="noopener">Facebook</a> · <a href="https://www.instagram.com/casperportal" rel="noopener">Instagram</a></p></div>
</div></footer>
<div class="float-contact no-print" data-float><button type="button" aria-expanded="false" aria-controls="fc-panel" aria-label="Get in touch">✆</button><div class="panel" id="fc-panel" hidden><p><b>GET IN TOUCH</b></p><a class="btn sm" href="tel:${PHONE_TEL}">Call (207) 222-7737</a><a class="btn sm ghost" href="sms:${PHONE_TEL}">Text us from your phone at (207) 222-7737</a></div></div>`;

/** The page shell. crumbs = [[name, path], ...] (adds BreadcrumbList + visible breadcrumb). */
export function page({ path, title, desc, body, schema = [], noindex = false, crumbs, ogType = "website", image = OG_DEFAULT, lastmod = TODAY, related = "" }) {
  const url = SITE + (path === "/" ? "/" : path);
  const schemas = [{ "@context": "https://schema.org", "@type": "WebPage", "@id": url, url, name: title, description: desc, inLanguage: "en-US", dateModified: lastmod, isPartOf: { "@type": "WebSite", "@id": `${SITE}/#site`, name: NAME, url: SITE + "/" }, publisher: { "@id": ORG_ID } }, ...schema];
  if (crumbs && crumbs.length > 1) schemas.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + (p || "/") })) });
  if (!noindex) urls.push([path, lastmod]);
  const img = image.startsWith("http") ? image : SITE + image;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="CasperPortal"><meta property="og:locale" content="en_US"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${img}"><meta property="og:image:alt" content="CasperPortal">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}"><meta name="theme-color" content="#020817">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="sitemap" type="application/xml" href="/sitemap.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
${schemas.map(ld).join("")}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap row"><a class="logo" href="/" aria-label="CasperPortal home"><img src="${LOGO}" alt="" width="36" height="36">CasperPortal</a>
<nav class="mainnav" aria-label="Main">${navDesktop(path)}</nav>
<div class="topcta"><a class="phone" href="tel:${PHONE_TEL}"><small>Direct line</small>${PHONE}</a><a class="btn sm ghost" href="/contact">Contact</a><a class="btn sm green" href="/demo">Book a Demo</a></div>
<button class="burger" type="button" data-burger aria-label="Menu" aria-expanded="false" aria-controls="drawer">☰</button></div>
<nav class="drawer" id="drawer" data-drawer aria-label="Mobile">${navMobile()}<a href="/contact">Contact</a><a href="tel:${PHONE_TEL}">Call ${PHONE}</a><a class="btn green" href="/demo">Book a Demo</a></nav></header>
<main id="main">${crumbs && crumbs.length > 1 ? `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(([n, p], i) => (i < crumbs.length - 1 ? `<a href="${p || "/"}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`)).join(" › ")}</nav></div>` : ""}
<div class="wrap content">${body}</div>${related}</main>
${footer()}
<script src="/assets/app.js?v=${V}" defer></script><script src="/assets/forms.js?v=${V}" defer></script><script src="/assets/t.js?v=${V}" data-site="casperportal" data-banner="1" defer></script>
</body></html>`;
}

/** Redirect page for a merged/dropped URL (GitHub Pages serves it with a 200, so it carries canonical + meta refresh + noindex). */
export const redirect = (to) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved | CasperPortal</title><meta name="robots" content="noindex"><link rel="canonical" href="${to.startsWith("http") ? to : SITE + to}"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)}+location.search)</script></head><body><p>This page moved to <a href="${to}">${SITE}${to}</a>.</p></body></html>`;

/** "Related pages" block inside <main>: guarantees every page links to at least three related pages. items = [[path, title, blurb]] */
export const relatedBlock = (items, h = "Related pages") => items.length ? `<section class="related" aria-label="${esc(h)}"><div class="wrap"><h2>${esc(h)}</h2><ul>${items.map(([p, t, d]) => `<li><a href="${p}">${esc(t)}${d ? `<span>${esc(d)}</span>` : ""}</a></li>`).join("")}</ul></div></section>` : "";

export const faqSchema = (pairs) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pairs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
