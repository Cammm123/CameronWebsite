// budget.js - interactive diagram for "A Wormhole Between Two Math Classes".
// The shared protein budget: a cell splits a budget B between glucose
// transporters (uptake u, cost 1 each) and mitochondria (capacity M, cost k
// each): u + k M = B. Sliders set the split and the environment; the chart
// shows ATP for every split, with the best split marked.
// Usage: <div id="budget"></div> <script src="budget.js"></script>
//        mountBudget(document.getElementById("budget"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea",
              orange: "#d9622b", teal: "#12946b", purple: "#6a4bd6" };
  const B = 10, K = 10;

  /** The cell's day for a split s (share of budget on mitochondria), glucose G and oxygen O. */
  function cell(s, G, O) {
    const u = (1 - s) * B, M = (s * B) / K, g = Math.min(u, G), b = Math.min(g, O / 6, M / 2), a = g - b;
    return { u, M, g, a, b, atp: 2 * a + 32 * b, lactate: 2 * a, index: g > 0 ? a / g : 0 };
  }
  const fmt = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toString();

  function slider(id, label, color, min, max, step, value) {
    return `<div><div style="display:flex;justify-content:space-between"><label for="${id}" style="color:${color}">${label}</label><b id="${id}-v" style="color:${color}"></b></div>
            <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" style="accent-color:${color};width:100%;margin:2px 0 0"></div>`;
  }
  const stat = (label, id, color) =>
    `<div style="background:#f1f0f6;border-radius:8px;padding:8px 10px"><div style="color:${C.muted};font-size:12px">${label}</div><div id="${id}" style="font-size:19px;font-weight:600;color:${color}"></div></div>`;

  function mountBudget(root) {
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:grid;gap:8px">
          ${slider("bd-s", "budget spent on mitochondria", C.purple, 0, 100, 1, 50)}
          ${slider("bd-g", "glucose around the cell", C.text, 0.5, 10, 0.5, 10)}
          ${slider("bd-o", "oxygen around the cell", C.teal, 0, 12, 0.5, 10)}
        </div>
        <svg viewBox="0 0 640 60" style="width:100%;display:block;margin-top:10px" role="img" aria-label="How the budget is split">
          <rect id="bd-u" x="0" y="8" height="30" rx="5" fill="${C.teal}"/>
          <rect id="bd-m" y="8" height="30" rx="5" fill="${C.purple}"/>
          <text id="bd-ul" x="10" y="28" fill="${C.bg}" font-size="13" font-weight="600"></text>
          <text id="bd-ml" y="28" fill="${C.bg}" font-size="13" font-weight="600"></text>
          <text x="0" y="56" fill="${C.muted}" font-size="12">budget ${B}: a transporter costs 1, a unit of mitochondria costs ${K}</text>
        </svg>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:8px">
          ${stat("glucose taken in", "bd-gin", C.text)}${stat("fermented a / respired b", "bd-ab", C.text)}
          ${stat("ATP made", "bd-atp", C.teal)}${stat("lactate made", "bd-lac", C.orange)}${stat("Warburg index", "bd-wi", C.text)}
        </div>
        <svg id="bd-chart" viewBox="0 0 640 260" style="width:100%;display:block;margin-top:12px" role="img" aria-label="ATP for every budget split, with the best split marked"></svg>
      </div>`;
    const s = root.querySelector("#bd-s"), gl = root.querySelector("#bd-g"), ox = root.querySelector("#bd-o");

    function draw() {
      const share = +s.value / 100, G = +gl.value, O = +ox.value, c = cell(share, G, O);
      root.querySelector("#bd-s-v").textContent = `${Math.round(share * 100)}%`;
      root.querySelector("#bd-g-v").textContent = fmt(G, 1);
      root.querySelector("#bd-o-v").textContent = fmt(O, 1);
      const W = 640, uw = W * (1 - share);
      root.querySelector("#bd-u").setAttribute("width", Math.max(uw, 0.01));
      root.querySelector("#bd-m").setAttribute("x", uw);
      root.querySelector("#bd-m").setAttribute("width", Math.max(W - uw, 0.01));
      root.querySelector("#bd-ul").textContent = uw > 150 ? `transporters: uptake ${fmt(c.u, 1)}` : "";
      root.querySelector("#bd-ml").setAttribute("x", uw + 10);
      root.querySelector("#bd-ml").textContent = W - uw > 150 ? `mitochondria: M ${fmt(c.M)}` : "";
      root.querySelector("#bd-gin").textContent = fmt(c.g);
      root.querySelector("#bd-ab").textContent = `${fmt(c.a)} / ${fmt(c.b)}`;
      root.querySelector("#bd-atp").textContent = fmt(c.atp, 1);
      root.querySelector("#bd-lac").textContent = fmt(c.lactate, 1);
      root.querySelector("#bd-wi").textContent = fmt(c.index);
      // ATP for every split, best split marked, current split marked.
      let best = null;
      const pts = [];
      for (let i = 0; i <= 200; i++) {
        const x = i / 200, v = cell(x, G, O).atp;
        pts.push([x, v]);
        if (!best || v > best[1] + 1e-9) best = [x, v];
      }
      const top = Math.max(25, ...pts.map((p) => p[1])) * 1.1;
      const X = (x) => 50 + x * 570, Y = (v) => 220 - (200 * v) / top;
      const parts = [
        `<line x1="50" y1="220" x2="620" y2="220" stroke="${C.muted}"/>`, `<line x1="50" y1="20" x2="50" y2="220" stroke="${C.muted}"/>`,
        `<text x="56" y="16" fill="${C.muted}" font-size="12">ATP made</text>`,
        `<text x="335" y="252" fill="${C.muted}" font-size="12" text-anchor="middle">share of budget on mitochondria</text>`,
        `<text x="50" y="238" fill="${C.muted}" font-size="11" text-anchor="middle">0%</text>`,
        `<text x="620" y="238" fill="${C.muted}" font-size="11" text-anchor="middle">100%</text>`,
        `<line x1="50" y1="${Y(20)}" x2="620" y2="${Y(20)}" stroke="${C.muted}" stroke-dasharray="4 4"/>`,
        `<text x="616" y="${Y(20) - 6}" fill="${C.muted}" font-size="11" text-anchor="end">a cell needs 20 ATP to divide</text>`,
        `<path d="${pts.map(([x, v], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${C.orange}" stroke-width="2.5"/>`,
        `<circle cx="${X(best[0])}" cy="${Y(best[1])}" r="7" fill="none" stroke="${C.teal}" stroke-width="2.5"/>`,
        `<text x="${Math.min(Math.max(X(best[0]), 120), 540)}" y="${Math.max(Y(best[1]) - 14, 30)}" fill="${C.teal}" font-size="12" text-anchor="middle">best: ${Math.round(best[0] * 100)}% on mitochondria, ${fmt(best[1], 1)} ATP</text>`,
        `<circle cx="${X(share)}" cy="${Y(c.atp)}" r="5" fill="${C.purple}"/>`,
      ];
      root.querySelector("#bd-chart").innerHTML = parts.join("");
    }
    [s, gl, ox].forEach((el) => el.addEventListener("input", draw));
    draw();
  }

  window.mountBudget = mountBudget;
})();
