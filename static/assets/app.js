/* casperportal.com — small progressive enhancements. Every page is complete without this file. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  // mobile menu
  var burger = $("[data-burger]"), drawer = $("[data-drawer]");
  if (burger && drawer) burger.addEventListener("click", function () { var o = drawer.classList.toggle("open"); burger.setAttribute("aria-expanded", o ? "true" : "false"); });
  // desktop dropdowns: one open at a time, close on outside click / Escape
  var menus = $$(".mainnav details");
  menus.forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) menus.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  document.addEventListener("click", function (e) { menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menus.forEach(function (d) { d.open = false; }); });
  // floating contact
  var fc = $("[data-float]");
  if (fc) { var b = $("button", fc), p = $(".panel", fc); b.addEventListener("click", function () { p.hidden = !p.hidden; b.setAttribute("aria-expanded", p.hidden ? "false" : "true"); }); }
  // cookie settings link (t.js listens for this event)
  $$("[data-consent-open]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); window.dispatchEvent(new Event("cso:consent-open")); }); });

  // YouTube: load the player only when asked (keeps pages fast)
  $$("[data-yt]").forEach(function (box) {
    var btn = $("button", box); if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe"); f.src = box.getAttribute("data-yt") + "?autoplay=1"; f.title = box.getAttribute("data-title") || "Video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"; f.allowFullscreen = true; box.innerHTML = ""; box.appendChild(f);
    });
  });

  // ROI calculator (same formula as the live site: 40% of missed calls recovered; tool savings vs $297/mo)
  $$("[data-roi]").forEach(function (r) {
    var get = function (n) { return Number($("[name=" + n + "]", r).value) || 0; };
    var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    function calc() {
      var leads = get("leads"), missed = get("missed"), close = get("close"), sale = get("sale"), tools = get("tools");
      $("[data-out=leads]", r).textContent = leads; $("[data-out=missed]", r).textContent = missed + "%"; $("[data-out=close]", r).textContent = close + "%";
      var missedCalls = Math.round(leads * (missed / 100)), sales = Math.round(missedCalls * 0.4) * (close / 100), gain = sales * sale, save = tools - 297;
      $("[data-out=gain]", r).textContent = money(gain); $("[data-out=sales]", r).textContent = "+" + (Math.round(sales * 10) / 10) + " sales/mo";
      $("[data-out=annual]", r).textContent = money((gain + (save > 0 ? save : 0)) * 12);
    }
    $$("input", r).forEach(function (i) { i.addEventListener("input", calc); }); calc();
  });

  // Blog quick polls (answers stay in the browser, as on the live site)
  $$("[data-poll]").forEach(function (box) {
    var form = $("form", box);
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var c = $("input:checked", form); if (!c) return;
      $("[data-poll-result] b", box).textContent = c.value; $("[data-poll-result]", box).hidden = false; form.hidden = true;
    });
  });

  // Self-assessment quiz
  var quiz = $("[data-quiz]");
  if (quiz) {
    var steps = $$("[data-step]", quiz), answers = {}, i = 0, bar = $(".progress i", quiz), lbl = $("[data-step-label]", quiz), back = $("[data-back]", quiz);
    var show = function () { steps.forEach(function (s, k) { s.hidden = k !== i; }); bar.style.width = ((i + 1) / steps.length * 100) + "%"; lbl.textContent = "Step " + (i + 1) + " of " + steps.length; back.disabled = i === 0; };
    quiz.classList.add("js"); $("[data-quiz-static]", quiz) && ($("[data-quiz-static]", quiz).hidden = true); $("[data-quiz-live]", quiz).hidden = false;
    steps.forEach(function (s, k) { $$("button", s).forEach(function (b) { b.addEventListener("click", function () {
      answers[k + 1] = b.getAttribute("data-a");
      if (k < steps.length - 1) { i = k + 1; show(); return; }
      $("[data-quiz-live]", quiz).hidden = true; var res = $("[data-quiz-result]", quiz); res.hidden = false;
      $("[data-rec=missed]", res).hidden = !(answers[2] === "a" || answers[5] === "a");
      $("[data-rec=auto]", res).hidden = !(answers[2] === "b" || answers[5] === "b");
      res.querySelector("h2").focus();
    }); }); });
    back.addEventListener("click", function () { if (i > 0) { i--; show(); } });
    show();
  }

  // /start: checkout link only after the terms box is ticked (as on the live site)
  $$("[data-checkout]").forEach(function (box) {
    var cb = $("input[type=checkbox]", box), a = $("a", box);
    var sync = function () { a.setAttribute("aria-disabled", cb.checked ? "false" : "true"); a.classList.toggle("ghost", !cb.checked); };
    a.addEventListener("click", function (e) { if (!cb.checked) { e.preventDefault(); cb.focus(); cb.reportValidity && cb.setCustomValidity("Please agree to the Terms of Service and Privacy Policy first."); cb.reportValidity(); cb.setCustomValidity(""); } });
    cb.addEventListener("change", sync); sync();
  });
})();
