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

Preview: `cd dist && python3 -m http.server 8080`.

## Layout

- `content/pages/*.html` — page bodies, imported once from the live site's rendered pages (wording kept). Edit these.
- `content/meta.json` — per page: title (≤60), description (≤155), `noindex`, blog `published` date.
- `content/redirects.json` — old URLs → new home (meta refresh + canonical + noindex pages).
- `content/llms.txt` — template for `/llms.txt` (lists are filled in at build).
- `scripts/lib.mjs` — layout (header, footer, JSON-LD), `scripts/build.mjs` — widgets, related links, sitemap etc.
- `static/assets/` — `site.css`, `app.js` (menu, ROI calculator, quiz, polls, video), `forms.js` (all form posts + demo calendar), `agreement.js`, `brand.js`, `t.js` (first-party analytics + cookie notice, `data-site="casperportal"`; add GA4 later with `data-ga4="G-…"`).
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
- **Payments** (Stripe payment links, unchanged): monthly `https://pay.casperportal.net/b/dRmaEYacS3E2dU037RdIA14` (all "Start 14-Day Free Trial" buttons, `/start`), annual `https://pay.casperportal.net/b/fZudRabgW0rQ8zGbEndIA15` (`/pricing`).
- **Contact bubble**: call / text (207) 222-7737 (the old site's "chat" button was the same call/text panel).
- Hero video stays on the owner's GHL media storage (163 MB, not copied); poster image is local.
- The old site had no app/login links, so none were added.

## Pages (153)

- **top-level** (38): `/`, `/about-us`, `/affiliate`, `/affiliate-kit`, `/affiliate-terms`, `/agreement-builder`, `/blog`, `/brand-kit`, `/casperb2b`, `/compare`, `/contact`, `/crm-for-local-businesses`, `/demo`, `/development`, `/directory`, `/features`, `/glossary`, `/help`, `/integrations`, `/jared-casper`, `/locations`, `/mark-casper`, `/marketing-automation-for-small-business`, `/niches`, `/our-story`, `/our-team`, `/pricing`, `/privacy`, `/problems`, `/quiz`, `/roi-calculator`, `/security`, `/services`, `/start`, `/terms`, `/thank-you`, `/tools`, `/use-cases`
- **blog** (16): `/blog/5-essential-automations`, `/blog/ai-automation-support`, `/blog/economics-of-crm-roi`, `/blog/mastering-local-seo`, `/blog/medspa-crm-consolidation`, `/blog/multi-channel-marketing`, `/blog/reputation-management-guide`, `/blog/setup-first-automation`, `/blog/stop-missing-calls`, `/blog/topic/automation`, `/blog/topic/growth`, `/blog/topic/marketing`, `/blog/topic/sales`, `/blog/topic/seo`, `/blog/ultimate-b2b-follow-ups`, `/blog/why-unified-crm`
- **compare** (5): `/compare/activecampaign`, `/compare/calendly`, `/compare/gohighlevel`, `/compare/hubspot`, `/compare/salesforce`
- **directory** (19): `/directory/add`, `/directory/amesbury-ma`, `/directory/beverly-ma`, `/directory/boxford-ma`, `/directory/compare`, `/directory/danvers-ma`, `/directory/georgetown-ma`, `/directory/groveland-ma`, `/directory/haverhill-ma`, `/directory/ipswich-ma`, `/directory/lawrence-ma`, `/directory/methuen-ma`, `/directory/newbury-ma`, `/directory/newburyport-ma`, `/directory/north-andover-ma`, `/directory/rowley-ma`, `/directory/salem-ma`, `/directory/salisbury-ma`, `/directory/topsfield-ma`
- **features** (28): `/features/ai-chat-tools`, `/features/appointment-booking`, `/features/automation-triggers`, `/features/blog-publishing`, `/features/communities`, `/features/crm-contact-management`, `/features/customer-surveys`, `/features/email-sms-marketing`, `/features/facebook-messenger`, `/features/funnel-landing-page-builder`, `/features/google-call-tracking`, `/features/invoicing`, `/features/lead-capture-forms`, `/features/marketing-campaigns`, `/features/memberships`, `/features/missed-call-text-back`, `/features/mobile-app`, `/features/omnichannel-messaging`, `/features/proposals-and-estimates`, `/features/reporting-analytics`, `/features/reputation-management`, `/features/sales-pipelines`, `/features/sms-and-email-templates`, `/features/social-media-planner`, `/features/text-to-pay`, `/features/trigger-links`, `/features/website-live-chat`, `/features/workflow-automations`
- **locations** (17): `/locations/crm-software-amesbury-ma`, `/locations/crm-software-beverly-ma`, `/locations/crm-software-boxford-ma`, `/locations/crm-software-danvers-ma`, `/locations/crm-software-georgetown-ma`, `/locations/crm-software-groveland-ma`, `/locations/crm-software-haverhill-ma`, `/locations/crm-software-ipswich-ma`, `/locations/crm-software-lawrence-ma`, `/locations/crm-software-methuen-ma`, `/locations/crm-software-newbury-ma`, `/locations/crm-software-newburyport-ma`, `/locations/crm-software-north-andover-ma`, `/locations/crm-software-rowley-ma`, `/locations/crm-software-salem-ma`, `/locations/crm-software-salisbury-ma`, `/locations/crm-software-topsfield-ma`
- **niches** (24): `/niches/automotive-parts-stores`, `/niches/beauty-salons`, `/niches/breweries`, `/niches/car-dealerships`, `/niches/clothing-boutiques`, `/niches/construction-companies`, `/niches/consulting-firms`, `/niches/daycare-centers`, `/niches/dental-clinics`, `/niches/event-planners`, `/niches/fitness-centers-gyms`, `/niches/furniture-stores`, `/niches/hotels`, `/niches/insurance-agencies`, `/niches/it-services`, `/niches/jewelry-stores`, `/niches/legal-firms`, `/niches/marketing-agencies`, `/niches/pet-stores`, `/niches/pharmacies`, `/niches/real-estate-agents`, `/niches/real-estate-development`, `/niches/restaurants`, `/niches/travel-agencies`
- **problems** (6): `/problems/disconnected-tools`, `/problems/losing-leads`, `/problems/missed-calls`, `/problems/no-visibility-into-pipeline`, `/problems/reviews-stagnant`, `/problems/slow-follow-up`

`/thank-you` is `noindex` and not in the sitemap. `/404.html` is the not-found page.

## Redirects (26)

- `/niches/home-services` → `/niches`
- `/niches/dining` → `/niches`
- `/niches/trades` → `/niches`
- `/niches/healthcare` → `/niches`
- `/niches/retail` → `/niches`
- `/niches/equestrian` → `/niches`
- `/niches/construction` → `/niches`
- `/niches/landscaping` → `/niches`
- `/niches/agriculture` → `/niches`
- `/niches/hvac` → `/niches`
- `/niches/marine` → `/niches`
- `/niches/tech` → `/niches`
- `/niches/manufacturing` → `/niches`
- `/niches/automotive` → `/niches`
- `/niches/professional-services` → `/niches`
- `/niches/tourism` → `/niches`
- `/niches/boutique-retail` → `/niches`
- `/niches/hospitality` → `/niches`
- `/niches/food-service` → `/niches`
- `/niches/real-estate` → `/niches`
- `/niches/legal` → `/niches`
- `/blog/topic/ai-tech` → `/blog`
- `/blog/topic/economics` → `/blog`
- `/blog/topic/how-to` → `/blog`
- `/problems/no-online-reviews` → `/problems/reviews-stagnant`
- `/portfolio` → `/casperb2b`

## DNS (GitHub Pages)

- Apex `casperportal.com`: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (optionally AAAA `2606:50c0:8000::153` … `8003::153`).
- `www`: CNAME → `<github-user>.github.io`.
- In the repo's Settings → Pages: source "GitHub Actions", custom domain `casperportal.com`, enforce HTTPS. `dist/CNAME` is written by the build.
