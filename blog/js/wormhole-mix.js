// mix.js - interactive diagram for "A Wormhole Between Two Math Classes".
// Choose a (glucose fermented) and b (glucose respired). The diagram builds
// v = a·ferment + b·respire, multiplies S v live to show it is zero, and reports
// ATP, lactate, oxygen and the Warburg index. A small (a, b) plane marks some
// example cells.
// Usage: <div id="mix"></div> <script src="mix.js"></script>
//        mountMix(document.getElementById("mix"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea",
              orange: "#d9622b", teal: "#12946b", purple: "#6a4bd6" };
  const REACTIONS = ["glucose in", "glycolysis", "electron transport", "fermentation", "pyruvate burned", "lactate out"];
  const S = [[1, -1, 0, 0, 0, 0], [0, 2, 0, -1, -1, 0], [0, -2, 1, 1, 0, 0], [0, 2, -1, -1, 0, 0], [0, 0, 0, 1, 0, -1]];
  const METABOLITES = ["glucose", "pyruvate", "NAD⁺", "NADH", "lactate"];
  const FERMENT = [1, 1, 0, 2, 0, 2], RESPIRE = [1, 1, 2, 0, 2, 0];
  const EXAMPLES = [["healthy cell", 0, 1], ["no oxygen", 1, 0], ["Warburg tumor cell", 0.75, 0.25]];

  const f2 = (x) => (Math.abs(x) < 1e-12 ? "0" : x.toFixed(2).replace(/\.?0+$/, ""));

  function mountMix(root) {
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:grid;gap:8px">
          <div><div style="display:flex;justify-content:space-between"><label for="mx-a" style="color:${C.orange}">a: glucose fermented</label><b id="mx-av" style="color:${C.orange}"></b></div>
          <input id="mx-a" type="range" min="0" max="1" step="0.05" value="0.75" style="accent-color:${C.orange};width:100%;margin:2px 0 0"></div>
          <div><div style="display:flex;justify-content:space-between"><label for="mx-b" style="color:${C.purple}">b: glucose respired</label><b id="mx-bv" style="color:${C.purple}"></b></div>
          <input id="mx-b" type="range" min="0" max="1" step="0.05" value="0.25" style="accent-color:${C.purple};width:100%;margin:2px 0 0"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:12px">
          <div>
            <div style="color:${C.muted};font-size:13px;margin-bottom:4px">v = a · ferment + b · respire</div>
            <table id="mx-v" style="width:100%;border-collapse:collapse;font-size:14px"></table>
            <div id="mx-sv" style="margin-top:8px;font-size:14px"></div>
          </div>
          <div>
            <svg id="mx-plane" viewBox="0 0 260 230" style="width:100%;display:block" role="img" aria-label="The cell as a point (a, b)"></svg>
          </div>
        </div>
        <div id="mx-out" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:10px"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" id="mx-ex"></div>
      </div>`;
    const a = root.querySelector("#mx-a"), b = root.querySelector("#mx-b");
    root.querySelector("#mx-ex").innerHTML = '<span style="color:' + C.muted + ';font-size:13px;align-self:center">Try:</span>' +
      EXAMPLES.map(([name], i) => `<button data-i="${i}" style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:8px;padding:4px 10px;font:inherit;font-size:13px;cursor:pointer">${name}</button>`).join("");
    root.querySelectorAll("#mx-ex button").forEach((btn) => btn.addEventListener("click", () => {
      const [, ea, eb] = EXAMPLES[+btn.dataset.i];
      a.value = ea; b.value = eb; draw();
    }));

    function stat(label, value, color) {
      return `<div style="background:#f1f0f6;border-radius:8px;padding:8px 10px"><div style="color:${C.muted};font-size:12px">${label}</div><div style="font-size:20px;font-weight:600;color:${color}">${value}</div></div>`;
    }

    function draw() {
      const av = +a.value, bv = +b.value;
      root.querySelector("#mx-av").textContent = f2(av);
      root.querySelector("#mx-bv").textContent = f2(bv);
      const v = FERMENT.map((fv, j) => av * fv + bv * RESPIRE[j]);
      root.querySelector("#mx-v").innerHTML = REACTIONS.map((name, j) =>
        `<tr style="border-top:1px solid ${C.grid}"><td style="padding:3px 0;color:${C.muted}">${name}</td><td style="text-align:right">${f2(v[j])}</td></tr>`).join("");
      const sv = S.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
      const zero = sv.every((x) => Math.abs(x) < 1e-9);
      root.querySelector("#mx-sv").innerHTML = `S v = (${sv.map(f2).join(", ")}) ` +
        (zero ? `<b style="color:${C.teal}">✓ steady state</b>` : "");
      const atp = 2 * av + 32 * bv, total = av + bv;
      root.querySelector("#mx-out").innerHTML =
        stat("ATP made", f2(atp), C.teal) + stat("lactate made", f2(2 * av), C.orange) +
        stat("O₂ used", f2(6 * bv), C.purple) +
        stat("Warburg index a/(a+b)", total > 0 ? f2(av / total) : "–", C.text);
      // The (a, b) plane.
      const X = (x) => 40 + x * 190, Y = (y) => 200 - y * 180;
      const parts = [`<line x1="${X(0)}" y1="${Y(0)}" x2="${X(1.05)}" y2="${Y(0)}" stroke="${C.muted}"/>`,
                     `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(1.05)}" stroke="${C.muted}"/>`,
                     `<text x="${X(1.05)}" y="${Y(0) + 18}" fill="${C.orange}" font-size="12" text-anchor="end">a (fermented) →</text>`,
                     `<text x="${X(0) - 8}" y="${Y(1.05) + 4}" fill="${C.purple}" font-size="12" text-anchor="end">b</text>`,
                     `<line x1="${X(1)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(1)}" stroke="${C.grid}" stroke-dasharray="4 4"/>`,
                     `<text x="${X(0.55)}" y="${Y(0.5) - 6}" fill="${C.muted}" font-size="11">a + b = 1 glucose</text>`];
      for (const [name, ea, eb] of EXAMPLES) {
        parts.push(`<circle cx="${X(ea)}" cy="${Y(eb)}" r="4" fill="${C.muted}"/>`);
        parts.push(`<text x="${X(ea) + (ea > 0.5 ? -8 : 8)}" y="${Y(eb) - 8}" fill="${C.muted}" font-size="11" text-anchor="${ea > 0.5 ? "end" : "start"}">${name}</text>`);
      }
      parts.push(`<circle cx="${X(av)}" cy="${Y(bv)}" r="7" fill="${C.orange}" stroke="${C.text}" stroke-width="1.5"/>`);
      root.querySelector("#mx-plane").innerHTML = parts.join("");
    }
    a.addEventListener("input", draw);
    b.addEventListener("input", draw);
    draw();
  }

  window.mountMix = mountMix;
})();
