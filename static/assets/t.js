/* CarSales / FMYCAR first-party analytics — t.js
 * One small script for fmycar.com, cars.fmycar.com and carsalessoftware.com (the app uses lib/track.ts).
 *   <script src="/assets/t.js" data-site="fmycar" data-banner="1" defer></script>
 *   On a car page add  data-vid="<vehicle uuid>"  (or <meta name="cso:vehicle" content="...">) to log a car view.
 * What it records: page views, car views, clicks on links/buttons (their label, never typed text), form start/submit,
 * scroll depth, time on page and JavaScript errors. No input values, no query strings except utm tags, gclid and fbclid.
 * Privacy: nothing at all when the browser sends Global Privacy Control or the visitor said no to analytics.
 * Data goes only to our own collector (Supabase function `track`); nothing is sold or shared with ad networks.
 * window.csoTrack.event(type, label, props) · .identify({email, phone, name, source}) · .off()
 * v2 (2026-10-21): data-site="auto-app" (CarSales app: /v/ /s/ /q/ /w/ → "showroom", else "app"); data-mask="1" privacy mode
 * for apps (no page titles, ids in paths become :id, link text never recorded — only data-track/aria-label/short button text);
 * rage clicks; page-load timing ("perf"); optional Microsoft Clarity heatmaps + replays via data-clarity="<project id>"
 * (loads only when analytics is allowed; Clarity masks typed text).
 * v3 (2026-10-22): optional Google Analytics 4 via data-ga4="G-XXXXXXX" — loads only when analytics is allowed, with
  * GA4 waits for an explicit OK on the cookie notice (unlike our own analytics); Consent Mode v2 (ads storage/personalization always denied, IP not used for ads signals), stops when the visitor turns
 * analytics off. The notice names Google Analytics whenever it is on.
 */
(function () {
  "use strict";
  if (window.csoTrack) return;
  var END = "https://suooupofqybiojouttxe.supabase.co/functions/v1/track";
  var VERSION = "2026-10-21";
  var me = document.currentScript || document.querySelector("script[data-site]");
  var attr = function (k) { return me ? me.getAttribute(k) : null; };
  var SITE_ATTR = attr("data-site") || "fmycar", MASK = attr("data-mask") === "1", CLARITY = attr("data-clarity"), GA4 = attr("data-ga4");
  if (GA4 && !/^G-[A-Z0-9]{6,12}$/.test(GA4)) GA4 = null;
  function siteNow() { return SITE_ATTR === "auto-app" ? (/^\/(v|s|q|w)\//.test(location.pathname) ? "showroom" : "app") : SITE_ATTR; }
  var SITE = siteNow();
  var UUIDS = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[0-9a-f]{16,64}\b|\b\d{4,}\b/gi;
  function pathOf(p) { p = p || location.pathname; return MASK ? p.replace(UUIDS, ":id") : p; }
  var host = location.hostname, ROOT = (host.match(/(fmycar|carsalessoftware)\.com$/) || [])[0];
  var noop = function () {};

  // ---- consent (shared cookie across the brand's subdomains) ----
  function readConsent() {
    var raw = null;
    try { raw = localStorage.getItem("cookie-consent"); } catch (e) {}
    if (raw === "accepted") return { analytics: true, marketing: true };
    if (raw === "declined") return { analytics: false, marketing: false };
    try { if (raw) { var c = JSON.parse(raw); if (c && c.v === VERSION) return c; } } catch (e) {}
    var m = document.cookie.match(/(?:^|; )cso_consent=([^;]+)/);
    if (m) { try { var k = JSON.parse(decodeURIComponent(m[1])); if (k && k.v === VERSION) return k; } catch (e) {} }
    return null;
  }
  function saveConsent(a, mk, by) {
    var c = { analytics: a, marketing: mk, at: new Date().toISOString(), v: VERSION, by: by };
    try { localStorage.setItem("cookie-consent", JSON.stringify(c)); } catch (e) {}
    document.cookie = "cso_consent=" + encodeURIComponent(JSON.stringify(c)) + "; max-age=15552000; path=/; samesite=lax" + (location.protocol === "https:" ? "; secure" : "") + (ROOT ? "; domain=." + ROOT : "");
    try { window.dispatchEvent(new CustomEvent("cso:consent", { detail: c })); } catch (e) {}
    return c;
  }
  var gpc = navigator.globalPrivacyControl === true;
  if (gpc && !readConsent()) saveConsent(false, false, "gpc");
  if (!window.csoConsent) window.csoConsent = function () { var c = readConsent(); return c ? { analytics: !!c.analytics, marketing: !!c.marketing } : null; };
  // First-party analytics runs unless the visitor turned it off (or their browser asks us not to).
  function allowed() { if (gpc) return false; var c = window.csoConsent(); return !c || c.analytics !== false; }

  // ---- ids ----
  function rid(n) { var a = new Uint8Array(n), s = "", abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; (window.crypto || window.msCrypto).getRandomValues(a); for (var i = 0; i < n; i++) s += abc[a[i] % 62]; return s; }
  function visitorId() {
    var v = null, m = document.cookie.match(/(?:^|; )cso_vid=([A-Za-z0-9_-]{8,64})/);
    if (m) v = m[1];
    if (!v) { try { v = localStorage.getItem("cso_vid"); } catch (e) {} }
    if (!v || !/^[A-Za-z0-9_-]{8,64}$/.test(v)) v = "v" + rid(21);
    try { localStorage.setItem("cso_vid", v); } catch (e) {}
    document.cookie = "cso_vid=" + v + "; max-age=34560000; path=/; samesite=lax" + (location.protocol === "https:" ? "; secure" : "") + (ROOT ? "; domain=." + ROOT : "");
    return v;
  }
  function sessionId() {
    var s = null, now = Date.now();
    try { var j = JSON.parse(sessionStorage.getItem("cso_sid") || "null"); if (j && now - j.t < 30 * 60000) s = j.s; } catch (e) {}
    if (!s) s = "s" + rid(15);
    try { sessionStorage.setItem("cso_sid", JSON.stringify({ s: s, t: now })); } catch (e) {}
    return s;
  }
  function utm() {
    var o = {}, q = new URLSearchParams(location.search), any = false;
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(function (k) { var x = q.get(k); if (x) { o[k] = x.slice(0, 120); any = true; } });
    return any ? o : null;
  }
  function clip(x, n) { return x == null ? null : String(x).replace(/\s+/g, " ").trim().slice(0, n) || null; }

  // ---- queue + send ----
  var VID = null, q = [], timer = null, auth = null, sent = 0, errs = 0;
  function base() { return { v: VID, s: sessionId(), site: SITE, ref: clip(MASK ? (document.referrer || "").split("?")[0] : document.referrer, 300), utm: utm(), wd: navigator.webdriver === true ? 1 : 0 }; }
  function flush(beacon) {
    clearTimeout(timer); timer = null;
    if (!q.length || !VID) return;
    var body = base(); body.e = q.splice(0, 40);
    var txt = JSON.stringify(body);
    try {
      if (beacon && !auth && navigator.sendBeacon && navigator.sendBeacon(END, new Blob([txt], { type: "text/plain" }))) return;
      var h = { "content-type": "text/plain" }; if (auth) h.authorization = "Bearer " + auth;
      fetch(END, { method: "POST", body: txt, headers: h, keepalive: txt.length < 60000, mode: "cors", credentials: "omit" }).catch(noop);
    } catch (e) {}
    if (q.length) flush(beacon);
  }
  function push(t, o) {
    if (!VID || sent > 400 || window.csoPaused) return;   // csoPaused: e.g. an admin viewing as / impersonating a user
    o = o || {}; sent++;
    var site = siteNow(); if (site !== SITE) { flush(); SITE = site; }
    q.push({ t: t, p: clip(pathOf(o.p), 300), ti: MASK ? null : clip(o.ti || document.title, 200), l: clip(o.l, 200), vid: o.vid || VEHICLE || undefined, x: o.x, at: new Date().toISOString() });
    if (q.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 4000);
  }

  // ---- what we watch ----
  var VEHICLE = attr("data-vid") || (document.querySelector('meta[name="cso:vehicle"]') || {}).content || null;
  var depth = 0, shown = Date.now(), visible = 0, lastPath = location.pathname;
  function pageView() {
    depth = 0; visible = 0; shown = Date.now();
    VEHICLE = (document.querySelector('meta[name="cso:vehicle"]') || {}).content || attr("data-vid") || null;
    push(VEHICLE ? "car_view" : "page_view");
  }
  function leave() {
    if (document.visibilityState === "hidden" || arguments[0] === "route") {
      visible += Date.now() - shown; shown = Date.now();
      if (visible > 2000) push("time", { l: String(Math.round(visible / 1000)), x: { sec: Math.round(visible / 1000), scroll: depth } });
      visible = 0;
      flush(true);
    } else shown = Date.now();
  }
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight; if (max <= 0) return;
    var pct = Math.round((h.scrollTop / max) * 100);
    [25, 50, 75, 100].forEach(function (m) { if (pct >= m && depth < m) { depth = m; push("scroll", { l: m + "%", x: { pct: m } }); } });
  }
  function labelOf(el) {
    var named = el.getAttribute("data-track") || el.getAttribute("aria-label") || el.getAttribute("title");
    if (named) return clip(named, 80);
    if (MASK) {
      // apps show customers' names on rows and links: keep only short, generic button/tab text
      if (el.tagName === "A" && !el.closest("nav,aside,[role=tablist],[role=menu]")) return null;
      var t = clip(el.innerText || el.value || "", 40);
      return t && !/\d{3,}|@/.test(t) && t.split(" ").length <= 5 ? t : null;
    }
    return clip(el.innerText || el.value || "", 80);
  }
  var lastEl = null, lastAt = 0, burst = 0;
  function onClick(e) {
    var el = e.target && e.target.closest ? e.target.closest("a,button,[role=button],[data-track],input[type=submit]") : null;
    if (!el || el.closest("[data-no-track]")) return;
    var href = el.getAttribute && el.getAttribute("href"), x = {};
    var now = Date.now(); if (el === lastEl && now - lastAt < 800) { if (++burst === 2) push("rage_click", { l: labelOf(el), x: { tag: el.tagName.toLowerCase() } }); } else burst = 0; lastEl = el; lastAt = now;
    if (href) { x.href = pathOf(href.split("?")[0]).slice(0, 200); if (/^tel:/.test(href)) x.kind = "call"; else if (/^sms:/.test(href)) x.kind = "text"; else if (/^mailto:/.test(href)) x.kind = "email"; else if (el.host && el.host !== location.host) x.kind = "outbound"; }
    var cv = el.closest("[data-car-id]"); if (cv) x.car = cv.getAttribute("data-car-id");
    push("click", { l: labelOf(el), x: x, vid: cv ? cv.getAttribute("data-car-id") : undefined });
    if (x.kind === "outbound") flush(true);
  }
  var started = typeof WeakSet === "function" ? new WeakSet() : null;
  function formName(f) { return clip(f.getAttribute("data-fm") || f.getAttribute("name") || f.getAttribute("id") || f.getAttribute("aria-label") || "form", 60); }
  function onFocus(e) { var f = e.target && e.target.form; if (!f || !started || started.has(f)) return; started.add(f); push("form_start", { l: formName(f) }); }
  function onSubmit(e) { var f = e.target; if (f && f.tagName === "FORM") { push("form_submit", { l: formName(f) }); flush(true); } }
  function onError(msg, src, line) { if (++errs > 5) return; push("error", { l: clip(msg, 200), x: { src: clip(String(src || "").split("?")[0], 200), line: line || null } }); }
  function route() { if (location.pathname !== lastPath) { leave("route"); lastPath = location.pathname; setTimeout(pageView, 50); } }

  var P0 = location.pathname;
  function perf() {
    try {
      var n = performance.getEntriesByType("navigation")[0]; if (!n || !n.loadEventEnd) return setTimeout(perf, 1500);
      push("perf", { p: P0, l: String(Math.round(n.loadEventEnd)), x: { ttfb: Math.round(n.responseStart), dom: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), kb: Math.round((n.transferSize || 0) / 1024) } });
    } catch (e) {}
  }
  function clarity() {
    if (!CLARITY || !/^[a-z0-9]{6,20}$/i.test(CLARITY) || window.clarity) return;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", CLARITY);
    try { window.clarity("set", "site", SITE); window.clarity("identify", VID); } catch (e) {}
  }
  function ga4() {
    if (!GA4 || window.__csoGa4 || gpc) return; var cc = window.csoConsent(); if (!cc || cc.analytics !== true) return; window.__csoGa4 = 1;  // Google Analytics only after an explicit OK
    window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date()); gtag("config", GA4, { allow_google_signals: false, allow_ad_personalization_signals: false, site_name: SITE });
    var t = document.createElement("script"); t.async = true; t.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4; document.head.appendChild(t);
  }
  function start() {
    if (VID || !allowed()) return;
    VID = visitorId();
    pageView();
    setTimeout(perf, 2500);
    clarity();
    ga4();
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("visibilitychange", leave);
    addEventListener("pagehide", function () { leave("route"); });
    addEventListener("error", function (e) { onError(e.message, e.filename, e.lineno); });
    addEventListener("unhandledrejection", function (e) { onError("Unhandled: " + (e.reason && e.reason.message || e.reason), "", 0); });
    ["pushState", "replaceState"].forEach(function (k) { var o = history[k]; history[k] = function () { var r = o.apply(this, arguments); route(); return r; }; });
    addEventListener("popstate", route);
  }
  function stop() { try { if (window.clarity) window.clarity("consent", false); } catch (e) {} try { if (window.gtag && GA4) gtag("consent", "update", { analytics_storage: "denied" }); } catch (e) {} q = []; VID = null; try { localStorage.removeItem("cso_vid"); } catch (e) {} document.cookie = "cso_vid=; max-age=0; path=/" + (ROOT ? "; domain=." + ROOT : ""); }

  window.csoTrack = {
    event: function (type, label, props) { push(type || "custom", { l: label, x: props }); },
    identify: function (who) {
      if (!VID || !who) return;
      flush();
      var b = { action: "identify", v: VID, email: clip(who.email, 120), phone: clip(who.phone, 20), name: clip(who.name, 80), source: clip(who.source || SITE, 40) };
      try { fetch(END, { method: "POST", body: JSON.stringify(b), headers: { "content-type": "text/plain" }, keepalive: true }).catch(noop); } catch (e) {}
    },
    setAuth: function (jwt) { auth = jwt || null; },
    visitor: function () { return VID; },
    off: function () { saveConsent(false, false, "reject"); stop(); }
  };
  window.addEventListener("cso:consent", function (e) { var c = e.detail || {}; if (c.analytics === false) stop(); else { start(); ga4(); } });

  // ---- tiny consent notice (fmycar sites; carsalessoftware.com has its own React banner) ----
  function banner(now) {
    if (readConsent() || gpc || document.getElementById("cso-cc")) return;
    // compact on phones so it never hides the page's main buttons; waits for the first scroll (or 5 s) before showing,
    // and sits above any fixed bottom bar (e.g. Call / Text / Test drive on car pages)
    var css = "#cso-cc{position:fixed;z-index:2147483600;left:8px;right:8px;bottom:calc(8px + var(--cso-cc-off,0px));background:#fff;color:#111;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);padding:10px 12px;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;gap:10px}"
      + "#cso-cc p{margin:0;flex:1;min-width:0}#cso-cc a{color:inherit}#cso-cc .r{display:flex;gap:6px;flex-shrink:0}#cso-cc button{min-height:40px;padding:0 12px;border-radius:9px;font:600 13px system-ui,sans-serif;cursor:pointer;border:1px solid #111;background:#fff;color:#111}#cso-cc button.y{background:#111;color:#fff}#cso-cc .l{display:none}"
      + "@media(min-width:640px){#cso-cc{left:16px;right:auto;bottom:calc(16px + var(--cso-cc-off,0px));max-width:420px;padding:16px;display:block;font-size:14px}#cso-cc p{margin:0 0 10px}#cso-cc .r{display:grid;grid-template-columns:1fr 1fr;gap:8px}#cso-cc button{min-height:44px;font-size:15px}#cso-cc .l{display:inline}#cso-cc .s{display:none}}";
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    var d = document.createElement("div"); d.id = "cso-cc"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Cookies"); d.setAttribute("data-no-track", "");
    d.innerHTML = '<p><span class="l"><b>Cookies on ' + (ROOT || host) + '.</b> We use essential cookies and analytics' + (GA4 ? " (our own plus Google Analytics)" : " (our own)") + (ROOT ? ' (pages viewed, cars viewed, buttons used) to improve the site and show dealers which cars get attention.' : ' (pages viewed, buttons used) to improve the site.') + ' No ad networks, nothing sold. </span><span class="s">' + (GA4 ? "Analytics incl. Google Analytics. No ads." : "Our own analytics only. No ad networks.") + ' </span><a href="' + (attr("data-privacy") || (ROOT ? 'https://fmycar.com/privacy' : '/privacy')) + '">Privacy</a></p><div class="r"><button type="button" data-n aria-label="Turn off analytics">Turn off</button><button type="button" class="y" data-y>OK</button></div>';
    d.querySelector("[data-y]").onclick = function () { saveConsent(true, false, "accept"); d.remove(); };
    d.querySelector("[data-n]").onclick = function () { window.csoTrack.off(); d.remove(); };
    var shown = false;
    var show = function () {
      if (shown || readConsent()) return; shown = true; removeEventListener("scroll", show);
      // lift above any other bar fixed to the bottom of the screen
      var off = 0; var all = document.body.querySelectorAll("*");
      for (var i = 0; i < all.length && i < 4000; i++) { var el = all[i]; if (el === d) continue; var cs = getComputedStyle(el);
        if (cs.position === "fixed" && cs.display !== "none" && cs.visibility !== "hidden") { var r = el.getBoundingClientRect(); if (r.height > 0 && r.height < 160 && Math.abs(innerHeight - r.bottom) < 4 && r.width > innerWidth * 0.6) off = Math.max(off, r.height); } }
      d.style.setProperty("--cso-cc-off", off + "px");
      document.body.appendChild(d);
    };
    if (now) show(); else { addEventListener("scroll", show, { passive: true }); setTimeout(show, 5000); }
  }
  window.addEventListener("cso:consent-open", function () { try { localStorage.removeItem("cookie-consent"); } catch (e) {} document.cookie = "cso_consent=; max-age=0; path=/" + (ROOT ? "; domain=." + ROOT : ""); banner(true); });

  var go = function () { start(); if (attr("data-banner") === "1") banner(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
