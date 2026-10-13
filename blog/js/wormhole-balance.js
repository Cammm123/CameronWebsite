// balance.js - interactive diagram for "A Wormhole Between Two Math Classes".
// Balance photosynthesis yourself: pick the four coefficients and watch the
// carbon, hydrogen and oxygen counts on each side. "Show the null space
// answer" fills in (6, 6, 1, 6).
// Usage: <div id="balance"></div> <script src="balance.js"></script>
//        mountBalance(document.getElementById("balance"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea",
              orange: "#d9622b", teal: "#12946b", purple: "#6a4bd6", red: "#ff6b6b" };
  // Molecules: name and atom counts [C, H, O]; the first two are reactants.
  const MOLECULES = [["CO₂", [1, 0, 2]], ["H₂O", [0, 2, 1]], ["C₆H₁₂O₆", [6, 12, 6]], ["O₂", [0, 0, 2]]];
  const ATOMS = ["carbon (C)", "hydrogen (H)", "oxygen (O)"];

  function mountBalance(root) {
    const inputs = MOLECULES.map(([name], i) =>
      `<label style="display:flex;align-items:center;gap:6px">
         <input id="bal-${i}" type="number" min="0" max="30" step="1" value="1"
                style="width:3.4em;background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:6px;padding:4px;font:inherit;font-size:16px">
         <span style="color:${i < 2 ? C.teal : C.orange}">${name}</span></label>`);
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;font-size:16px">
          ${inputs[0]}<span>+</span>${inputs[1]}<span>→</span>${inputs[2]}<span>+</span>${inputs[3]}
        </div>
        <table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:15px">
          <thead><tr style="color:${C.muted};text-align:left"><th style="font-weight:400;padding:4px 0">atom</th>
            <th style="font-weight:400">left side</th><th style="font-weight:400">right side</th><th></th></tr></thead>
          <tbody id="bal-rows"></tbody>
        </table>
        <p id="bal-status" style="margin:10px 0 0"></p>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button id="bal-answer" style="background:${C.bg};color:${C.text};border:1px solid ${C.teal};border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer">Show the null space answer</button>
          <button id="bal-reset" style="background:${C.bg};color:${C.muted};border:1px solid ${C.grid};border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer">Start over</button>
        </div>
      </div>`;
    const fields = MOLECULES.map((_, i) => root.querySelector(`#bal-${i}`));

    function draw() {
      const x = fields.map((f) => Math.max(0, Math.round(+f.value || 0)));
      let balanced = true;
      const rows = ATOMS.map((atom, a) => {
        const left = x[0] * MOLECULES[0][1][a] + x[1] * MOLECULES[1][1][a];
        const right = x[2] * MOLECULES[2][1][a] + x[3] * MOLECULES[3][1][a];
        const ok = left === right;
        if (!ok) balanced = false;
        return `<tr style="border-top:1px solid ${C.grid}"><td style="padding:5px 0">${atom}</td><td>${left}</td><td>${right}</td>
                <td style="color:${ok ? C.teal : C.red}">${ok ? "✓ equal" : "✗ off by " + Math.abs(left - right)}</td></tr>`;
      });
      root.querySelector("#bal-rows").innerHTML = rows.join("");
      const status = root.querySelector("#bal-status");
      const allZero = x.every((v) => v === 0);
      if (balanced && !allZero) {
        const g = x.reduce((acc, v) => { let [p, q] = [acc, v]; while (q) [p, q] = [q, p % q]; return p; }, 0);
        status.innerHTML = g === 1
          ? `<b style="color:${C.teal}">Balanced, with the smallest whole numbers.</b> (${x.join(", ")}) is the first whole-number point on the null space line.`
          : `<b style="color:${C.teal}">Balanced!</b> (${x.join(", ")}) is ${g} × (${x.map((v) => v / g).join(", ")}): another point on the same null space line. Chemists divide by the gcd, ${g}, to get the smallest one.`;
      } else if (allZero) {
        status.innerHTML = `<span style="color:${C.muted}">All zeros balances too, but it is the trivial solution: no reaction at all.</span>`;
      } else {
        status.innerHTML = `<span style="color:${C.muted}">Not balanced yet. Change the numbers until every atom matches.</span>`;
      }
    }
    fields.forEach((f) => f.addEventListener("input", draw));
    root.querySelector("#bal-answer").addEventListener("click", () => { [6, 6, 1, 6].forEach((v, i) => { fields[i].value = v; }); draw(); });
    root.querySelector("#bal-reset").addEventListener("click", () => { fields.forEach((f) => { f.value = 1; }); draw(); });
    draw();
  }

  window.mountBalance = mountBalance;
})();
