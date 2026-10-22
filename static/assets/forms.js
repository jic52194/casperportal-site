/* casperportal.com forms — every form posts to the same LeadConnector (GHL) endpoint, form id and field mapping the
 * live site used, so submissions keep landing in the same CRM location (locationId DNB14sOqM0GayjGjxxSy).
 * Booking uses the same GHL calendar (1VqK9zKLQ8h6cj5NRe7v) through the same free-slots + booking endpoints. */
(function () {
  var EP = "https://backend.leadconnectorhq.com/external-tracking/events";
  var TRACKING_ID = "tk_327e0fdeb26a4f8dacbe3b24fe1c4f78", LOCATION_ID = "DNB14sOqM0GayjGjxxSy";
  var CAL_ID = "1VqK9zKLQ8h6cj5NRe7v", BOOK_EP = "https://backend.leadconnectorhq.com/vibe-ai/booking/submit";
  var uuid = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); };
  var device = function () { return /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop"; };
  function send(formId, formData, formLabels, withProps) {
    var body = { type: "external_form_submission", timestamp: Date.now(), formId: formId, formData: formData, formLabels: formLabels,
      url: location.href, title: document.title, path: location.pathname, userAgent: navigator.userAgent, trackingId: TRACKING_ID, locationId: LOCATION_ID, sessionId: uuid() };
    if (withProps !== false) body.properties = { deviceType: device() };
    return fetch(EP, { method: "POST", headers: { "Content-Type": "application/json", version: "2021-07-28" }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
  }
  window.cpSend = send;
  var v = function (f, n) { var el = f.elements[n]; return el ? String(el.value || "").trim() : ""; };
  var msg = function (f, text, ok) { var m = f.querySelector(".msg"); if (m) { m.textContent = text; m.className = "msg " + (ok ? "ok" : "err"); } };
  var go = function (url, delay) { setTimeout(function () { location.href = url; }, delay || 0); };

  var FORMS = {
    "sales": function (f) { // home page "Request a Custom Demo"
      send("Sales Contact Form", { first_name: v(f, "firstName"), last_name: v(f, "lastName"), email: v(f, "email"), phone: v(f, "phone") },
        { first_name: "First Name", last_name: "Last Name", email: "Email Address", phone: "Phone Number" });
      go("/thank-you", 300);
    },
    "contact": function (f) {
      send("Contact Us Form", { first_name: v(f, "firstName"), last_name: v(f, "lastName"), email: v(f, "email"), phone: v(f, "phone"), "contact.inquiry_message": v(f, "message") },
        { first_name: "First Name", last_name: "Last Name", email: "Email Address", phone: "Phone Number", "contact.inquiry_message": "Message" });
      msg(f, "Form submitted successfully!", true); go("/thank-you", 400);
    },
    "partner": function (f) {
      send("Partner Program Application", { first_name: v(f, "firstName"), last_name: v(f, "lastName"), email: v(f, "email"), phone: v(f, "phone"), website: v(f, "website"), "contact.promotion_strategy": v(f, "promotionStrategy") },
        { first_name: "First Name", last_name: "Last Name", email: "Email Address", phone: "Phone Number", website: "Website", "contact.promotion_strategy": "Promotion Strategy" });
      msg(f, "Application submitted successfully! We'll review and get back to you within 24 hours.", true); f.reset();
    },
    "addbiz": function (f) {
      send("Add Business Directory Form", { first_name: v(f, "firstName"), last_name: v(f, "lastName"), email: v(f, "email"), phone: v(f, "phone"), organization: v(f, "businessName"), city: v(f, "town"), website: v(f, "website"), "contact.industry": v(f, "industry") },
        { first_name: "First Name", last_name: "Last Name", email: "Email Address", phone: "Phone Number", organization: "Business Name", city: "Town/City", website: "Website", "contact.industry": "Industry" });
      go("/thank-you", 500);
    },
    "newsletter": function (f) {
      send("Newsletter Signup", { email: v(f, "email") }, { email: "Email Address" });
      msg(f, "You're subscribed!", true); f.reset();
    },
    "footer-newsletter": function (f) {
      send("Footer Newsletter Form", { email: v(f, "email") }, { email: "Email Address" }, false);
      go("/thank-you", 300);
    },
    "personalize": function (f) {
      var name = v(f, "name"), ind = v(f, "industry"); if (!name) return;
      var first = name.charAt(0).toUpperCase() + name.slice(1).split(" ")[0];
      try { localStorage.setItem("casperportal_user_name", name); if (ind) localStorage.setItem("casperportal_user_industry", ind); } catch (e) {}
      send("Personalization Form", { first_name: first, last_name: name.split(" ").slice(1).join(" ") || "", "contact.industry": ind },
        { first_name: "First Name", last_name: "Last Name", "contact.industry": "Industry" });
      var box = f.closest(".personalize"); if (box) box.querySelector("[data-body]").innerHTML = "<h3>Nice to meet you, " + first.replace(/[<>&"]/g, "") + "!</h3><p>Customizing your experience...</p>";
      setTimeout(function () { if (box) box.remove(); greet(); }, 1500);
    },
  };

  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("form[data-form]"); if (!f) return;
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var fn = FORMS[f.getAttribute("data-form")]; if (fn) fn(f);
  });

  // Personalization (same storage keys as the live site): greet a returning visitor by first name.
  function greet() {
    var n = ""; try { n = (localStorage.getItem("casperportal_user_name") || "").split(" ")[0]; } catch (e) {}
    if (!n) return; n = n.charAt(0).toUpperCase() + n.slice(1);
    document.querySelectorAll("[data-greet]").forEach(function (el) { el.textContent = n + ", " + el.getAttribute("data-greet"); });
  }
  greet();
  function personalizePopup() {
    try { if (localStorage.getItem("casperportal_user_name") || sessionStorage.getItem("casperportal_personalization_dismissed")) return; } catch (e) { return; }
    if (/^\/(thank-you|agreement-builder|start)/.test(location.pathname)) return;
    var d = document.createElement("div"); d.className = "personalize no-print"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Personalize your visit");
    d.innerHTML = '<button class="x" type="button" aria-label="Close">×</button><div data-body><h3>Personalize your visit</h3><p>What should we call you and what\'s your industry?</p>' +
      '<form data-form="personalize"><div class="field"><label for="pz-name">Your name</label><input id="pz-name" name="name" placeholder="Your name" autocomplete="given-name" required></div>' +
      '<div class="field"><label for="pz-ind">Your industry</label><input id="pz-ind" name="industry" placeholder="Your industry (e.g. HVAC, MedSpa)"></div><button class="btn sm green" type="submit">Save &amp; Continue</button></form></div>';
    d.querySelector(".x").addEventListener("click", function () { d.remove(); try { sessionStorage.setItem("casperportal_personalization_dismissed", "true"); } catch (e) {} });
    document.body.appendChild(d);
  }
  setTimeout(personalizePopup, 12000);

  // ── Demo booking calendar (GHL calendar, same endpoints as the live site) ──
  document.querySelectorAll("[data-booking]").forEach(function (root) {
    var tz = "America/New_York"; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}
    var daysEl = root.querySelector(".cal-days"), slotsEl = root.querySelector(".cal-slots"), form = root.querySelector("form"), status = root.querySelector("[data-cal-status]"), picked = root.querySelector("[data-picked]");
    root.querySelector("[data-tz]").textContent = tz;
    var data = {}, day = null, slot = null;
    var fmtDay = function (k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); };
    var fmtTime = function (s) { return new Date(s).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); };
    function renderSlots() {
      slotsEl.innerHTML = ""; slot = null; form.hidden = true;
      (data[day] && data[day].slots || []).forEach(function (s) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = fmtTime(s); b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { slotsEl.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); slot = s; picked.textContent = fmtDay(day) + " at " + fmtTime(s) + " (" + tz + ")"; form.hidden = false; form.querySelector("input").focus(); });
        slotsEl.appendChild(b);
      });
    }
    var start = new Date(); start.setHours(0, 0, 0, 0);
    fetch("https://backend.leadconnectorhq.com/calendars/" + CAL_ID + "/free-slots?startDate=" + start.getTime() + "&endDate=" + (start.getTime() + 31 * 864e5) + "&timezone=" + encodeURIComponent(tz))
      .then(function (r) { return r.json(); }).then(function (j) {
        data = j || {}; var keys = Object.keys(data).filter(function (k) { return /^\d{4}-\d\d-\d\d$/.test(k) && data[k].slots && data[k].slots.length; }).sort();
        status.textContent = keys.length ? "Choose a day, then a time." : "No open times were found. Please call 1-207-222-7737 or use the contact form.";
        daysEl.innerHTML = "";
        keys.forEach(function (k, i) {
          var b = document.createElement("button"); b.type = "button"; b.textContent = fmtDay(k); b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
          b.addEventListener("click", function () { daysEl.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); day = k; renderSlots(); });
          daysEl.appendChild(b);
        });
        if (keys.length) { day = keys[0]; renderSlots(); }
      }).catch(function () { status.textContent = "The calendar could not load. Please call 1-207-222-7737 or use the contact form."; });
    form.addEventListener("submit", function (e) {
      e.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } if (!slot) return;
      var btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Confirming...";
      fetch(BOOK_EP, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId: LOCATION_ID, calendarId: CAL_ID, firstName: v(form, "firstName"), lastName: v(form, "lastName"), email: v(form, "email"), phone: v(form, "phone"), notes: v(form, "notes"), selectedSlot: slot, selectedTimezone: tz, sessionId: uuid() }) })
        .then(function (r) { if (r.ok) { location.href = "/thank-you"; } else { throw 0; } })
        .catch(function () { btn.disabled = false; btn.textContent = "Confirm Booking"; msg(form, "Failed to book appointment. Please try again.", false); });
    });
  });
})();
