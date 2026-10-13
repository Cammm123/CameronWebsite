// fluxes.js - interactive diagram for "A Wormhole Between Two Math Classes".
// Two sliders set the flux vector v = (photosynthesis, respiration). The
// diagram multiplies S v row by row and shows which molecules build up or get
// used up. When the two rates match, S v = 0: v is in the null space.
// Usage: <div id="fluxes"></div> <script src="fluxes.js"></script>
//        mountFluxes(document.getElementById("fluxes"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea",
              orange: "#d9622b", teal: "#12946b", purple: "#6a4bd6" };
  const ROWS = ["glucose", "O₂", "CO₂", "H₂O"];
  const S = [[1, -1], [6, -6], [-6, 6], [-6, 6]];

  const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  const signed = (x) => (x > 0 ? `+${fmt(x)}` : x < 0 ? `−${fmt(-x)}` : "0");

  function mountFluxes(root) {
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:grid;gap:8px">
          <div><div style="display:flex;justify-content:space-between"><label for="fx-p" style="color:${C.teal}">photosynthesis speed</label><b id="fx-pv" style="color:${C.teal}"></b></div>
          <input id="fx-p" type="range" min="0" max="3" step="0.5" value="2" style="accent-color:${C.teal};width:100%;margin:2px 0 0"></div>
          <div><div style="display:flex;justify-content:space-between"><label for="fx-r" style="color:${C.purple}">respiration speed</label><b id="fx-rv" style="color:${C.purple}"></b></div>
          <input id="fx-r" type="range" min="0" max="3" step="0.5" value="1" style="accent-color:${C.purple};width:100%;margin:2px 0 0"></div>
        </div>
        <svg id="fx-svg" viewBox="0 0 640 230" style="width:100%;display:block;margin-top:10px" role="img"
             aria-label="How fast each molecule builds up or is used up"></svg>
        <p id="fx-status" style="margin:6px 0 0;font-size:15px"></p>
      </div>`;
    const p = root.querySelector("#fx-p"), r = root.querySelector("#fx-r"), svg = root.querySelector("#fx-svg");

    function draw() {
      const v = [+p.value, +r.value];
      root.querySelector("#fx-pv").textContent = fmt(v[0]);
      root.querySelector("#fx-rv").textContent = fmt(v[1]);
      const zero = 470, unit = 7, parts = [];
      parts.push(`<text x="0" y="16" fill="${C.muted}" font-size="13">each row of S v: (made by photosynthesis) + (made by respiration)</text>`);
      parts.push(`<line x1="${zero}" y1="30" x2="${zero}" y2="220" stroke="${C.muted}"/>`);
      parts.push(`<text x="${zero + 8}" y="40" fill="${C.orange}" font-size="12">builds up →</text>`);
      parts.push(`<text x="${zero - 8}" y="40" fill="${C.purple}" font-size="12" text-anchor="end">← used up</text>`);
      ROWS.forEach((name, i) => {
        const y = 72 + 44 * i, value = S[i][0] * v[0] + S[i][1] * v[1];
        const term = (coef, x) => `(${signed(coef)})(${fmt(x)})`;
        parts.push(`<text x="0" y="${y}" fill="${C.text}" font-size="15">${name}</text>`);
        parts.push(`<text x="72" y="${y}" fill="${C.muted}" font-size="14">${term(S[i][0], v[0])} + ${term(S[i][1], v[1])} = <tspan fill="${C.text}">${signed(value)}</tspan></text>`);
        if (value !== 0) {
          const x = value > 0 ? zero : zero + value * unit;
          parts.push(`<rect x="${x}" y="${y - 14}" width="${Math.abs(value) * unit}" height="18" rx="3" fill="${value > 0 ? C.orange : C.purple}"/>`);
        } else {
          parts.push(`<circle cx="${zero}" cy="${y - 5}" r="5" fill="${C.teal}"/>`);
        }
      });
      svg.innerHTML = parts.join("");
      const status = root.querySelector("#fx-status");
      if (v[0] === v[1]) {
        status.innerHTML = `<b style="color:${C.teal}">Balanced: S v = 0.</b> Every molecule is made exactly as fast as it is used, so this v is in the null space of S.${v[0] === 0 ? " (Nothing is running at all, which is balanced too.)" : ""}`;
      } else if (v[0] > v[1]) {
        status.innerHTML = `<b style="color:${C.orange}">Photosynthesis is faster.</b> Glucose and O₂ pile up: the plant is storing energy and growing.`;
      } else {
        status.innerHTML = `<b style="color:${C.purple}">Respiration is faster.</b> Glucose and O₂ run down: the plant is burning its stored sugar, like at night.`;
      }
    }
    p.addEventListener("input", draw);
    r.addEventListener("input", draw);
    draw();
  }

  window.mountFluxes = mountFluxes;
})();
