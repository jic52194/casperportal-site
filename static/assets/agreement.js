/* Agreement Builder (/agreement-builder): plan + services → live totals → print-ready packet.
 * Plans and service rates are the live site's (data embedded by the build as JSON in #ab-data).
 * On "Generate" the client details are sent to the same GHL form ("Agreement Builder Form") as before, then the
 * browser print dialog opens (save as PDF or print). Email sending was not connected on the live site either. */
(function () {
  var root = document.querySelector("[data-agreement]"); if (!root) return;
  var D = JSON.parse(document.getElementById("ab-data").textContent);
  var PLANS = D.plans, SERVICES = D.services;
  var $ = function (s) { return root.querySelector(s); };
  var money = function (n) { return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var form = $("form");
  var q = new URLSearchParams(location.search).get("plan");
  if (q && PLANS[q]) { var r = form.querySelector('input[name=plan][value="' + q + '"]'); if (r) r.checked = true; }
  function state() {
    var plan = (form.querySelector("input[name=plan]:checked") || {}).value || "software-monthly";
    var accounts = Math.max(1, parseInt(form.elements.accounts.value, 10) || 1);
    var picked = SERVICES.filter(function (s) { var c = form.querySelector('input[name="svc"][value="' + s.id + '"]'); return c && c.checked; });
    var declined = SERVICES.filter(function (s) { return picked.indexOf(s) < 0; });
    var P = PLANS[plan], sub = P.monthly * accounts, svc = picked.reduce(function (a, s) { return a + s.price; }, 0);
    return { plan: plan, P: P, accounts: accounts, picked: picked, declined: declined, sub: sub, svc: svc, total: sub + svc };
  }
  function render() {
    var s = state();
    $("[data-t=plan]").textContent = s.accounts + " account" + (s.accounts > 1 ? "s" : "") + " · " + s.P.name;
    $("[data-t=sub]").textContent = money(s.sub) + "/mo" + (s.P.setup ? " + " + money(s.P.setup) + " setup" : "");
    $("[data-t=count]").textContent = s.picked.length;
    $("[data-t=svc]").textContent = money(s.svc) + "/mo";
    $("[data-t=total]").textContent = money(s.total) + "/mo";
  }
  form.addEventListener("input", render); form.addEventListener("change", render); render();

  function fmt(d) { return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
  function table(list, rate) {
    var cats = ["Technical & Infrastructure", "Software Delivery & Product", "Marketing & Creative", "General & Admin", "Sales & Growth", "Finance"];
    return cats.map(function (c) { var rows = list.filter(function (s) { return s.category === c; }); if (!rows.length) return "";
      return "<h4>" + esc(c) + "</h4><table><thead><tr><th>Role</th><th>What They Do For You</th><th>" + rate + "</th></tr></thead><tbody>" +
        rows.map(function (s) { return "<tr><td>" + esc(s.name) + "</td><td>" + esc(s.desc) + "</td><td>" + money(s.price) + "/mo</td></tr>"; }).join("") + "</tbody></table>"; }).join("");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; }
    var s = state(), f = form.elements, v = function (n) { return String(f[n].value || "").trim(); };
    if (window.cpSend) window.cpSend("Agreement Builder Form", { first_name: v("firstName"), last_name: v("lastName"), email: v("email"), phone: v("phone"), organization: v("company"), address: v("address"), "contact.title": v("title") },
      { first_name: "First Name", last_name: "Last Name", email: "Email", phone: "Phone", organization: "Company", address: "Address", "contact.title": "Job Title" });
    var today = new Date(), trial = new Date(+today + 14 * 864e5), exp = new Date(+today + (parseInt(v("validity"), 10) || 30) * 864e5);
    var client = esc(v("firstName") + " " + v("lastName")), company = esc(v("company"));
    var provider = "<p><b>CasperPortal</b> (Software) · <b>CasperB2B</b> (Services)<br>Jared Casper — Founder<br>info@casperportal.com · 1-207-222-7737<br>252 Daniel Webster Hwy #1093, Nashua, NH 03060</p>";
    var foot = function (n, t) { return '<p class="note">Page ' + n + " of 9 · " + t + " · Customer Initials: __________ | I confirm I reviewed this page.</p>"; };
    var sig = '<table><tbody><tr><td>Printed Full Name</td><td style="width:60%">&nbsp;</td></tr><tr><td>Signature</td><td>&nbsp;</td></tr><tr><td>Date</td><td>&nbsp;</td></tr><tr><td>Company / Organization</td><td>&nbsp;</td></tr><tr><td>Title / Capacity (if applicable)</td><td>&nbsp;</td></tr></tbody></table>';
    var html =
      '<div class="pg"><h1>CasperPortal Software &amp; Services Agreement</h1><p>Software Platform · Georgetown, MA · casperportal.com</p><h2>Software Subscription &amp; Statement of Work</h2>' +
      "<p><b>Client:</b> " + client + (company ? ", " + company : "") + "<br>" + esc(v("title")) + "<br>" + esc(v("email")) + " · " + esc(v("phone")) + "<br>" + esc(v("address")) + "</p><h3>Providers</h3>" + provider +
      "<p><b>Agreement Date:</b> " + fmt(today) + " · <b>Free Trial Ends:</b> " + fmt(trial) + " · <b>Packet Expiration:</b> " + fmt(exp) + "</p>" +
      "<p>Thank you for considering CasperPortal. Our goal is to provide structured software access and service support in a format that is clear, reviewable, and ready for execution.</p><p>This packet outlines the selected subscription plan, authorized accounts, professional services chosen, services not selected at signing, payment authorization, and final signature pages that complete the agreement.</p>" +
      "<h3>Your Selected Plan</h3><p><b>" + money(s.P.monthly) + " / mo</b>" + (s.P.setup ? " + " + money(s.P.setup) + " Setup Fee" : "") + "<br>" + esc(s.P.name) + " · Standard rate applied and locked in.</p><p>Please review each page carefully, initial where indicated, and sign the final page to complete the packet.</p><p>Jared Casper<br>Founder, CasperPortal<br>info@casperportal.com · 1-207-222-7737 · casperportal.com</p>" + foot(1, "Cover") + "</div>" +
      '<div class="pg"><h2>Subscription Terms</h2>' + D.terms.map(function (t) { return "<h4>" + esc(t[0]) + "</h4><p>" + esc(t[1]) + "</p>"; }).join("") + foot(2, "Terms Acknowledged") + "</div>" +
      '<div class="pg"><h2>Subaccounts</h2><p>The following subaccounts are authorized under this agreement. Changes require prior written notice to CasperPortal. Additions, transfers, or reassignments require a written amendment executed by both parties.</p><table><tbody><tr><td>Total Accounts</td><td>' + s.accounts + "</td></tr><tr><td>Monthly Total</td><td>" + money(s.sub) + "</td></tr><tr><td>Setup Fee</td><td>" + money(s.P.setup) + "</td></tr></tbody></table>" + foot(3, "Subaccount List Confirmed") + "</div>" +
      '<div class="pg"><h2>Selected Services</h2><p>The following professional roles were selected as part of this agreement. Each selected service requires a separate written work order before work begins. Service rates are billed monthly in addition to the subscription fee unless otherwise agreed in writing.</p>' + (s.picked.length ? table(s.picked, "Monthly Rate") + "<p><b>Total Selected Services:</b> " + money(s.svc) + "/mo</p>" : "<p>No services were selected at the time of execution.</p>") + foot(4, "Selected Services Confirmed") + "</div>" +
      '<div class="pg"><h2>Declined Services</h2><p>The professional services listed on this page were presented to Customer, described in full, and were not selected as part of this agreement at the time of signing. Customer may initial next to each declined service to confirm it was offered and intentionally declined.</p>' + (s.declined.length ? table(s.declined, "Standard Rate") : "<p>No services were declined.</p>") + foot(5, "Declined Services Confirmed") + "</div>" +
      '<div class="pg"><h2>Terms of Service</h2><p>Software Subscription Agreement • Effective: May 10, 2026. The full text is published at casperportal.com/terms.</p><h3>Acknowledgment of Receipt, Review &amp; Understanding</h3><p>By signing below, the undersigned acknowledges receipt, review, and understanding of the CasperPortal Terms of Service dated May 10, 2026.</p>' + sig + foot(6, "Terms of Service") + "</div>" +
      '<div class="pg"><h2>Privacy Policy</h2><p>Data Protection &amp; Privacy • Effective: May 10, 2026. The full text is published at casperportal.com/privacy.</p><h3>Acknowledgment of Receipt, Review &amp; Understanding</h3><p>By signing below, the undersigned acknowledges receipt, review, and understanding of the CasperPortal Privacy Policy dated May 10, 2026, and consents to the collection, use, and processing of personal information as described herein.</p>' + sig + foot(7, "Privacy Policy") + "</div>" +
      '<div class="pg"><h2>Payment Authorization</h2><h3>Authorization Statement</h3><p>I, ' + client + ", hereby authorize CasperPortal to charge the secure payment method on file for recurring subscription payments beginning on the First Billing Date noted in this agreement, in the amount of " + money(s.P.annual > 0 ? s.P.annual : s.P.monthly) + " per " + (s.P.annual > 0 ? "year" : "month") + " per the plan selected in this packet." + (s.P.setup ? " A one-time setup fee of " + money(s.P.setup) + " will be charged on the Agreement Date by CasperB2B." : "") + "</p>" +
      "<p><b>Security Notice:</b> For your security, payment will be completed through a secure digital invoice or encrypted payment link. Do not email, mail, or submit raw credit card details on this form.</p>" +
      '<table><tbody><tr><td>Authorized Billing Contact Name</td><td style="width:60%">&nbsp;</td></tr><tr><td>Billing Address (Street, City, State, Zip)</td><td>&nbsp;</td></tr><tr><td>Authorized Signature</td><td>&nbsp;</td></tr><tr><td>Date Signed</td><td>&nbsp;</td></tr></tbody></table>' +
      "<p><b>Security &amp; Privacy:</b> CasperPortal uses commercially reasonable security measures to protect payment information. Retained solely for billing purposes per our Privacy Policy at casperportal.com/privacy.</p>" + foot(8, "Payment Authorization") + "</div>" +
      '<div class="pg"><h2>Agreement Signatures</h2><p>By signing below, each party confirms they reviewed the full packet, including subscription terms, subaccount schedule, payment authorization, selected services, and declined services included in this packet.</p>' +
      "<h3>Agreement Summary</h3><p><b>Client:</b> " + client + (company ? ", " + company : "") + "<br><b>Providers:</b> CasperPortal &amp; CasperB2B<br><b>Accounts:</b> " + s.accounts + "<br><b>Rate:</b> " + esc(s.P.name) + "<br><b>Monthly Total:</b> " + money(s.total) + "<br><b>Setup Fee:</b> " + money(s.P.setup) + "<br><b>Services:</b> " + s.picked.length + "<br><b>Free Trial:</b> 14 days, ends " + fmt(trial) + "<br><b>First Billing:</b> " + fmt(trial) + "</p>" +
      "<h3>Client</h3>" + '<table><tbody><tr><td>Signature</td><td style="width:60%">&nbsp;</td></tr><tr><td>Printed Name</td><td>&nbsp;</td></tr><tr><td>Date</td><td>&nbsp;</td></tr></tbody></table>' +
      "<h3>Providers</h3>" + provider + '<table><tbody><tr><td>Authorized Signature</td><td style="width:60%">&nbsp;</td></tr><tr><td>Printed Name &amp; Title</td><td>&nbsp;</td></tr><tr><td>Date</td><td>&nbsp;</td></tr></tbody></table>' + foot(9, "Agreement Signatures") + "</div>";
    var packet = document.getElementById("ab-packet"); packet.innerHTML = html; packet.hidden = false;
    $("[data-ab-done]").hidden = false;
    setTimeout(function () { window.print(); }, 300);
  });
})();
