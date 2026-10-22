/* Brand Builder (/brand-kit): font picker (Google Fonts loaded on demand), color picker with color-theory palette,
 * up to four saved colors, live preview. Everything stays in the browser. */
(function () {
  var root = document.querySelector("[data-brand]"); if (!root) return;
  var prev = root.querySelector("[data-preview]"), input = root.querySelector("#bk-color");
  var loaded = {};
  root.querySelectorAll("[data-font]").forEach(function (b) {
    b.style.fontFamily = "'" + b.getAttribute("data-font") + "', system-ui";
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-font");
      if (!loaded[f]) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + f.replace(/ /g, "+") + ":wght@400;700&display=swap"; document.head.appendChild(l); loaded[f] = 1; }
      root.querySelectorAll("[data-font]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      prev.style.fontFamily = "'" + f + "', system-ui";
    });
  });
  function hsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2, d = max - min;
    if (d) { s = l > .5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  var rot = function (hex, deg) { var c = hsl(hex); return "hsl(" + ((c[0] + deg) % 360) + "," + c[1].toFixed(0) + "%," + c[2].toFixed(0) + "%)"; };
  function apply() {
    var hex = input.value; root.querySelector("[data-hex]").textContent = hex.toUpperCase();
    prev.querySelector("[data-accent]").style.color = hex; prev.querySelector("[data-accent-bg]").style.background = hex;
    var t = { comp: 180, t1: 120, t2: 240, an: 30 };
    root.querySelectorAll("[data-theory] i").forEach(function (i) { i.style.background = rot(hex, t[i.getAttribute("data-k")]); });
  }
  input.addEventListener("input", apply); apply();
  var slot = 0;
  root.querySelector("[data-save]").addEventListener("click", function () { var s = root.querySelectorAll("[data-saved] i"); s[slot % 4].style.background = input.value; slot++; });
})();
