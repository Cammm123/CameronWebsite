// diffusion.js - interactive diagram for "A Wormhole Between Two Math Classes".
// A sandbox for the Gray-Scott diffusion kernel: click to drop oxygen and
// watch it spread. Turn on capillaries and hungry cells to see a stable
// gradient form, with too little oxygen far from the capillaries.
// Usage: <div id="diffusion"></div> <script src="diffusion.js"></script>
//        mountDiffusion(document.getElementById("diffusion"));

(function () {
  const C = { bg: "#ffffff", text: "#1b1c29", muted: "#62667f", grid: "#e3e1ea", teal: "#12946b", purple: "#6a4bd6" };
  const N = 31, KERNEL = [[0.05, 0.2, 0.05], [0.2, -1, 0.2], [0.05, 0.2, 0.05]];
  const VESSELS = [[7, 7], [7, 23], [23, 7], [23, 23], [15, 15]];

  /** One diffusion step with closed edges (same rule as the simulation). */
  function diffuse(f, rate) {
    const out = f.map((row) => row.slice());
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const moved = rate * KERNEL[dr + 1][dc + 1] * f[r][c];
        out[r][c] -= moved; out[nr][nc] += moved;
      }
    }
    return out.map((row) => row.map((v) => Math.max(v, 0)));
  }

  function mountDiffusion(root) {
    root.innerHTML = `
      <div style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:12px;padding:14px;font:15px Inter,system-ui,sans-serif">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button id="df-play" style="background:${C.teal};color:${C.bg};border:none;border-radius:8px;padding:6px 14px;font:inherit;font-weight:600;cursor:pointer">Play</button>
          <button id="df-clear" style="background:${C.bg};color:${C.text};border:1px solid ${C.grid};border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer">Clear</button>
          <label style="color:${C.muted};font-size:14px;display:flex;gap:6px;align-items:center"><input id="df-tissue" type="checkbox" style="accent-color:${C.purple}"> capillaries + hungry cells</label>
        </div>
        <div id="df-hunger-row" hidden style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:14px"><label for="df-hunger" style="color:${C.purple}">how hungry the cells are</label><b id="df-hunger-v" style="color:${C.purple}"></b></div>
          <input id="df-hunger" type="range" min="0" max="0.08" step="0.005" value="0.03" style="accent-color:${C.purple};width:100%;margin:2px 0 0"></div>
        <canvas id="df-canvas" width="${N}" height="${N}" style="width:100%;max-width:420px;aspect-ratio:1;display:block;margin:12px auto 6px;image-rendering:pixelated;border-radius:8px;cursor:crosshair"></canvas>
        <p id="df-info" style="margin:0;font-size:14px;color:${C.muted};text-align:center"></p>
      </div>`;
    const canvas = root.querySelector("#df-canvas"), ctx = canvas.getContext("2d");
    const tissue = root.querySelector("#df-tissue"), info = root.querySelector("#df-info");
    let field = Array.from({ length: N }, () => new Array(N).fill(0)), playing = false, step = 0, timer = null;

    function draw() {
      root.querySelector("#df-hunger-row").hidden = !tissue.checked;
      root.querySelector("#df-hunger-v").textContent = (+root.querySelector("#df-hunger").value).toFixed(3);
      const img = ctx.createImageData(N, N), vset = new Set(VESSELS.map(([r, c]) => r * N + c));
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const t = Math.min(field[r][c] / 10, 1), i = 4 * (r * N + c);
        const col = tissue.checked && vset.has(r * N + c) ? [232, 230, 240] : [13 + (79 - 13) * t, 13 + (209 - 13) * t, 23 + (165 - 23) * t];
        img.data.set([col[0], col[1], col[2], 255], i);
      }
      ctx.putImageData(img, 0, 0);
      const total = field.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0);
      if (tissue.checked) {
        let starved = 0;
        for (const row of field) for (const v of row) if (v < 0.5) starved++;
        info.textContent = `step ${step}: white dots are capillaries. ${starved} of ${N * N} squares have almost no oxygen (dark).`;
      } else {
        info.textContent = `step ${step}: click anywhere to drop oxygen. Total oxygen: ${total.toFixed(0)} (it never changes).`;
      }
    }

    function tick() {
      if (tissue.checked) {
        for (const [r, c] of VESSELS) field[r][c] = 10;                 // capillaries refill
        const hunger = +root.querySelector("#df-hunger").value;
        field = field.map((row) => row.map((v) => Math.max(v - hunger, 0))); // cells use some up
      }
      field = diffuse(field, 1);
      step++;
      draw();
    }

    function setPlaying(on) {
      playing = on;
      root.querySelector("#df-play").textContent = on ? "Pause" : "Play";
      clearInterval(timer);
      if (on) timer = setInterval(tick, 90);
    }

    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const c = Math.floor(((e.clientX - rect.left) / rect.width) * N), r = Math.floor(((e.clientY - rect.top) / rect.height) * N);
      if (r >= 0 && r < N && c >= 0 && c < N) { field[r][c] += 100; draw(); if (!playing) setPlaying(true); }
    });
    root.querySelector("#df-play").addEventListener("click", () => setPlaying(!playing));
    root.querySelector("#df-clear").addEventListener("click", () => { field = field.map((row) => row.map(() => 0)); step = 0; draw(); });
    tissue.addEventListener("change", () => { field = field.map((row) => row.map(() => 0)); step = 0; draw(); if (tissue.checked) setPlaying(true); });
    root.querySelector("#df-hunger").addEventListener("input", draw);
    field[15][15] = 100;
    draw();
  }

  window.mountDiffusion = mountDiffusion;
})();
