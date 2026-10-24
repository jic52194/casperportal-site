# casperportal.com

Static rebuild of casperportal.com (CasperPortal, the CRM and marketing-automation software platform). Plain Node build, no framework: `content/` → `dist/`, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main` (then pings IndexNow).

CasperPortal is the software. CasperB2B (casperb2b.com) is a separate company that provides done-for-you services; it is only mentioned where the old site already described that relationship.

## Build

```
npm ci            # sharp, used only by `npm run images`
npm run build     # → dist/ (pages, redirects, 404.html, sitemap.xml, robots.txt, llms.txt, CNAME)
npm run check     # fails on links to missing pages or pages with < 3 in-content links
npm run images    # (re)download the live site's images from data/image-sources.json into static/img as WebP
```

Preview: `npm run serve` (http://localhost:8080, resolves URLs like GitHub Pages). `npm run test:browser` loads every page at 360px and 1280px in a local Chrome/Edge and reports JS errors, broken links/images and sideways scroll.

## Layout

- `content/data/{features,niches,problems,compare,towns}.json` — the page families (28 features, 23 industries, 6 problems, 5 comparisons, 17 town pages), rendered by `scripts/build.mjs`. Each entry holds its primary keyword, title, description, H1, answer-first intro, sections, FAQs and `next` (most relevant feature / comparison / guide).
- `content/pages/*.html` — hand-written page bodies (home, pricing, start, demo, hubs, guides, blog, company, legal). Their keyword, title, description, primary CTA and `next` live in `content/data/meta-{core,hubs,blog}.json` (overriding `content/meta.json`).
- `content/redirects.json` — old URLs → new home (meta refresh + canonical + noindex pages). The build adds `/directory/<town>-ma` → `/locations/crm-software-<town>-ma` and niche merges (`_merge` in niches.json).
- `content/llms.txt` — template for `/llms.txt` (lists are filled in at build).
- `data/source/*.json` — the old React site's data, imported once with `node scripts/import-source.mjs <unzipped src/data>` (reference only).
- `scripts/lib.mjs` — layout: grouped header menu, sticky mobile CTA, next-best-step block with a facts-only trust strip, footer, JSON-LD. `scripts/build.mjs` — templates, widgets, one-primary-CTA rule, schema, sitemap, llms.txt, and the generated `KEYWORDS.md` / `LINKS.md`.
- `npm run check` also fails on duplicate keywords/titles/H1s, a missing next-step block, banned claims (fake stats, "no credit card required", conflicting emails…), more than one casperb2b.com link, or a trial/demo more than 2 clicks away.
- `static/assets/` — `site.css`, `app.js` (menu, `cta_click` events, ROI calculator, quiz, polls, video, /start terms gate), `forms.js` (all form posts + demo calendar + `lead_form_submit` events), `agreement.js`, `brand.js`, `t.js` (first-party analytics + cookie notice, `data-site="casperportal"`; add GA4 later with `data-ga4="G-…"`).
- `static/3808756a46524e2fd878c401cb0c664c.txt` — IndexNow key file.

## Forms, booking and payments (unchanged destinations)

Every form posts the same JSON the old site sent to GoHighLevel/LeadConnector: `POST https://backend.leadconnectorhq.com/external-tracking/events`, `trackingId tk_327e0fdeb26a4f8dacbe3b24fe1c4f78`, `locationId DNB14sOqM0GayjGjxxSy`, with the same `formId` and field mapping, so leads keep landing in the same GHL location.

| Form (page) | formId | After submit |
|---|---|---|
| Request a Custom Demo (`/`) | Sales Contact Form | → /thank-you |
| Send us a Message (`/contact`) | Contact Us Form | → /thank-you |
| Apply to Partner (`/affiliate`) | Partner Program Application | message on page |
| Add Your Business (`/directory/add`) | Add Business Directory Form | → /thank-you (the "Short Business Description" field was never sent by the old site and still is not) |
| Blog newsletter (blog posts) | Newsletter Signup | message on page |
| Footer "Stay Informed" (every page) | Footer Newsletter Form | → /thank-you |
| "Personalize your visit" pop-up (every page, once) | Personalization Form | stored in localStorage (`casperportal_user_name`) |
| Agreement Builder (`/agreement-builder`) | Agreement Builder Form | opens print dialog with the 9-page packet |

- **Demo calendar** (`/demo`): same GHL calendar `1VqK9zKLQ8h6cj5NRe7v` — open times from `https://backend.leadconnectorhq.com/calendars/1VqK9zKLQ8h6cj5NRe7v/free-slots`, bookings to `https://backend.leadconnectorhq.com/vibe-ai/booking/submit` → /thank-you.
- **Payments** (Stripe payment links, verified live): trial `https://pay.casperportal.net/b/5kQeVe98O6Qe03adMvdIA12` ($97/month after 14 days; `/start` and every primary trial button), Growth Plan monthly `https://pay.casperportal.net/b/dRmaEYacS3E2dU037RdIA14` ($297/month; `/pricing`), annual `https://pay.casperportal.net/b/fZudRabgW0rQ8zGbEndIA15` ($2,970/year; `/pricing`).
- **Contact bubble**: call / text (207) 222-7737 (the old site's "chat" button was the same call/text panel).
- Hero video stays on the owner's GHL media storage (163 MB, not copied); poster image is local.
- The old site had no app/login links, so none were added.

## Pages and redirects

See KEYWORDS.md (every indexable page with its primary keyword, plus all redirects) and LINKS.md (menu, hubs, next-best-step links); both are regenerated by every build.

## DNS (GitHub Pages)

- Apex `casperportal.com`: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (optionally AAAA `2606:50c0:8000::153` … `8003::153`).
- `www`: CNAME → `<github-user>.github.io`.
- In the repo's Settings → Pages: source "GitHub Actions", custom domain `casperportal.com`, enforce HTTPS. `dist/CNAME` is written by the build.
