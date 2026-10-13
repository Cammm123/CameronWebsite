// fba.js - interactive diagram for "A Wormhole Between Two Math Classes".
// Flux balance analysis for one cell: sliders set the glucose, oxygen and
// mitochondria limits; the shaded region is every (a, b) the cell can afford;
// the best corner (most ATP) is marked, with the limit that stops it.
// Usage: <div id="fba"></div> <script src="fba.js"></script>
//        mountFba(document.getElementById("fba"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea",
              orange: "#d9622b", teal: "#12946b", purple: "#6a4bd6" };

  /** Keep the part of a polygon where p a + q b <= r. */
  function clip(poly, p, q, r) {
    const out = [], inside = ([a, b]) => p * a + q * b <= r + 1e-12;
    poly.forEach((cur, i) => {
      const prev = poly[(i + poly.length - 1) % poly.length];
      if (inside(cur) !== inside(prev)) {
        const d1 = p * prev[0] + q * prev[1] - r, d2 = p * cur[0] + q * cur[1] - r, t = d1 / (d1 - d2);
        out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
      }
      if (inside(cur)) out.push(cur);
    });
    return out;
  }

  const fmt = (x) => (Math.abs(x) < 1e-9 ? "0" : x.toFixed(2).replace(/\.?0+$/, ""));

  function slider(id, label, color, min, max, step, value) {
    return `<div><div style="display:flex;justify-content:space-between"><label for="${id}" style="color:${color}">${label}</label><b id="${id}-v" style="color:${color}"></b></div>
            <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" style="accent-color:${color};width:100%;margin:2px 0 0"></div>`;
  }

  function mountFba(root) {
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:grid;gap:8px">
          ${slider("fb-g", "glucose the cell can take in", C.text, 0.25, 2, 0.05, 1)}
          ${slider("fb-o", "oxygen available", C.teal, 0, 12, 0.25, 10)}
          ${slider("fb-m", "mitochondria capacity M", C.purple, 0, 4, 0.05, 0.5)}
        </div>
        <svg id="fb-svg" viewBox="0 0 520 330" style="width:100%;display:block;margin-top:10px" role="img"
             aria-label="Every choice of a and b the cell can afford, and the best one"></svg>
        <p id="fb-out" style="margin:4px 0 0"></p>
      </div>`;
    const g = root.querySelector("#fb-g"), o = root.querySelector("#fb-o"), m = root.querySelector("#fb-m");

    function draw() {
      const G = +g.value, O = +o.value, Mc = +m.value;
      root.querySelector("#fb-g-v").textContent = fmt(G);
      root.querySelector("#fb-o-v").textContent = fmt(O);
      root.querySelector("#fb-m-v").textContent = fmt(Mc);
      const limits = [
        { p: 1, q: 1, r: G, name: "glucose: a + b ≤ " + fmt(G), color: C.text },
        { p: 0, q: 1, r: O / 6, name: "oxygen: 6b ≤ " + fmt(O), color: C.teal },
        { p: 0, q: 1, r: Mc / 2, name: "mitochondria: 2b ≤ " + fmt(Mc), color: C.purple },
      ];
      const b = Math.min(G, O / 6, Mc / 2), a = G - b, atp = 2 * a + 32 * b;
      const binding = b === G ? "all the glucose is respired" : b === O / 6 ? "oxygen runs out first" : "the mitochondria are full";
      const span = 2.2, x0 = 50, y0 = 300, size = 270;
      const X = (v) => x0 + (v / span) * size, Y = (v) => y0 - (v / span) * size;
      let poly = [[0, 0], [span, 0], [span, span], [0, span]];
      for (const l of limits) poly = clip(poly, l.p, l.q, l.r);
      const parts = [];
      parts.push(`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(span)}" y2="${Y(0)}" stroke="${C.muted}"/>`);
      parts.push(`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(span)}" stroke="${C.muted}"/>`);
      parts.push(`<text x="${X(span)}" y="${Y(0) + 20}" fill="${C.orange}" font-size="13" text-anchor="end">a: glucose fermented</text>`);
      parts.push(`<text x="${X(0) - 8}" y="${Y(span) + 4}" fill="${C.purple}" font-size="13" text-anchor="end">b</text>`);
      if (poly.length >= 3) {
        parts.push(`<polygon points="${poly.map(([pa, pb]) => `${X(pa).toFixed(1)},${Y(pb).toFixed(1)}`).join(" ")}" fill="${C.teal}" fill-opacity="0.16"/>`);
      }
      // Limit lines.
      limits.forEach((l, i) => {
        let pts;
        if (l.p === 0) { if (l.r / l.q > span) return; pts = [[0, l.r], [span, l.r]]; }
        else pts = [[Math.min(l.r, span), 0], [Math.max(0, l.r - span), Math.min(l.r, span)]];
        parts.push(`<line x1="${X(pts[0][0])}" y1="${Y(pts[0][1])}" x2="${X(pts[1][0])}" y2="${Y(pts[1][1])}" stroke="${l.color}" stroke-width="1.5" stroke-dasharray="6 4"/>`);
      });
      // Legend for the limits (right side).
      limits.forEach((l, i) => {
        parts.push(`<line x1="345" y1="${40 + 22 * i}" x2="365" y2="${40 + 22 * i}" stroke="${l.color}" stroke-width="2" stroke-dasharray="6 4"/>`);
        parts.push(`<text x="372" y="${44 + 22 * i}" fill="${C.muted}" font-size="12">${l.name}${l.p === 0 && l.r / l.q > span ? " (off chart)" : ""}</text>`);
      });
      // ATP isoline through the best point, then the best point.
      const value = atp, aL = 0, aR = span;
      parts.push(`<line x1="${X(aL)}" y1="${Y((value - 2 * aL) / 32)}" x2="${X(aR)}" y2="${Y((value - 2 * aR) / 32)}" stroke="${C.text}" stroke-dasharray="2 4" opacity="0.5"/>`);
      parts.push(`<circle cx="${X(a)}" cy="${Y(b)}" r="8" fill="${C.orange}" stroke="${C.text}" stroke-width="1.5"/>`);
      parts.push(`<text x="345" y="120" fill="${C.text}" font-size="13">● best corner</text>`);
      parts.push(`<text x="345" y="140" fill="${C.muted}" font-size="12">dotted: same ATP as the best</text>`);
      root.querySelector("#fb-svg").innerHTML = parts.join("");
      root.querySelector("#fb-out").innerHTML =
        `Best: a = <b style="color:${C.orange}">${fmt(a)}</b>, b = <b style="color:${C.purple}">${fmt(b)}</b> → <b style="color:${C.teal}">${fmt(atp)} ATP</b>, ` +
        `${fmt(2 * a)} lactate, Warburg index ${G > 0 ? fmt(a / G) : "–"}. It stops there because ${binding}.`;
    }
    [g, o, m].forEach((el) => el.addEventListener("input", draw));
    draw();
  }

  window.mountFba = mountFba;
})();
