const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COLORS = ["#6ea8ff", "#a78bfa", "#8b9dff"];

/* ---------- background field: click anywhere to add points ---------- */
(function field() {
  const cv = document.getElementById("field");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const LINK = 115;
  const pts = [];
  const rings = [];
  let W, H;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  const base = Math.round(Math.min(60, (W * H) / 22000));
  for (let i = 0; i < base; i++) {
    pts.push({ x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      c: "#3b3e58", r: 1.1, spawned: false });
  }

  function burst(x, y) {
    rings.push({ x, y, t: 0 });
    for (let i = 0; i < 9; i++) {
      const a = (Math.PI * 2 * i) / 9 + Math.random() * .4;
      const sp = 1 + Math.random() * 1.8;
      pts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        c: COLORS[(Math.random() * COLORS.length) | 0], r: 2, spawned: true });
    }
    // keep it light: drop the oldest spawned points past a cap
    let extra = pts.filter(p => p.spawned).length - 140;
    for (let i = 0; extra > 0 && i < pts.length; i++) {
      if (pts[i].spawned) { pts.splice(i--, 1); extra--; }
    }
    if (reduceMotion) draw();
  }

  document.addEventListener("click", e => {
    if (e.target.closest("a, button, input, #watch, .room, #cipher")) return;
    burst(e.clientX, e.clientY);
    document.getElementById("hint")?.classList.add("gone");
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.globalAlpha = (1 - d / LINK) * (a.spawned || b.spawned ? .75 : .35);
          ctx.strokeStyle = a.spawned ? a.c : b.spawned ? b.c : "#3b3e58";
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      ctx.globalAlpha = Math.max(0, 1 - r.t / 40) * .6;
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, 4 + r.t * 1.4, 0, Math.PI * 2); ctx.stroke();
      if (++r.t > 40 || reduceMotion) rings.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    for (const p of pts) {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function step() {
    for (const p of pts) {
      // spawned points coast out, then settle into the same slow drift
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > .18) { p.vx *= .975; p.vy *= .975; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
    }
    draw();
    requestAnimationFrame(step);
  }
  reduceMotion ? draw() : requestAnimationFrame(step);
})();

/* ---------- text that decodes itself ---------- */
const GLYPHS = "!<>-_\\/[]{}=+*^?#01";
function scramble(el, dur = 800) {
  const final = el.dataset.final || (el.dataset.final = el.textContent);
  if (reduceMotion) { el.textContent = final; return; }
  let start;
  function frame(t) {
    start ??= t;
    const p = Math.min((t - start) / dur, 1);
    const n = Math.floor(p * final.length);
    let out = final.slice(0, n);
    for (let i = n; i < final.length; i++) {
      out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Every block of text sits scrambled until it scrolls into view, then decodes.
// It scrambles again once it leaves, so scrolling back up replays it.
const BLOCKS = "h1, h2, h3, p, li, .head, nav a, .fine > *, .cta a, .term-row, .prompt";
const SKIP = "#cipher, #fact, .room, .caret, svg, script, input, .answer, .hint";
const REPLAY_ON_HOVER = "nav div a, .term-row";
const LOWER = "abcdefghijklmnopqrstuvwxyz";

// proportional text gets same-case letters so line wrapping barely moves
function noise(ch, mono) {
  if (ch === " " || ch === "\n" || ch === " ") return ch;
  if (mono) return GLYPHS[(Math.random() * GLYPHS.length) | 0];
  if (/[a-z]/.test(ch)) return LOWER[(Math.random() * 26) | 0];
  if (/[A-Z]/.test(ch)) return LOWER[(Math.random() * 26) | 0].toUpperCase();
  if (/[0-9]/.test(ch)) return String((Math.random() * 10) | 0);
  return ch;
}

const blocks = new Map();
if (!reduceMotion) {
  for (const el of document.querySelectorAll(BLOCKS)) {
    if (el.closest(SKIP) || el.parentElement.closest(BLOCKS)) continue;
    const nodes = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest(SKIP) || !n.nodeValue.trim()
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (walk.nextNode()) nodes.push(walk.currentNode);
    if (!nodes.length) continue;
    const orig = nodes.map(n => Array.from(n.nodeValue));
    const text = nodes.map(n => n.nodeValue);
    const mono = nodes.map(n => /mono/i.test(getComputedStyle(n.parentElement).fontFamily));
    const len = orig.reduce((a, o) => a + o.length, 0);
    blocks.set(el, { nodes, orig, text, mono, len, raf: 0 });
  }
}

function hideBlock(b) {
  cancelAnimationFrame(b.raf);
  b.nodes.forEach((n, i) => { n.nodeValue = b.orig[i].map(c => noise(c, b.mono[i])).join(""); });
}

function revealBlock(b, dur = b.len > 80 ? 420 : 750) {
  cancelAnimationFrame(b.raf);
  let start, frame = 0;
  const tick = t => {
    start ??= t;
    const p = Math.min((t - start) / dur, 1);
    const front = p * b.len;
    const churn = frame++ % 2 === 0; // re-roll the noise every other frame
    let offset = 0;
    b.nodes.forEach((n, i) => {
      const o = b.orig[i];
      if (offset + o.length <= front) {
        if (n.nodeValue !== b.text[i]) n.nodeValue = b.text[i];
      } else if (churn || offset < front) {
        n.nodeValue = o.map((c, k) => (offset + k < front ? c : noise(c, b.mono[i]))).join("");
      }
      offset += o.length;
    });
    if (p < 1) b.raf = requestAnimationFrame(tick);
  };
  b.raf = requestAnimationFrame(tick);
}

const watcher = new IntersectionObserver(entries => {
  for (const e of entries) {
    const b = blocks.get(e.target);
    e.isIntersecting ? revealBlock(b) : hideBlock(b);
  }
}, { rootMargin: "0px 0px -6% 0px" });

for (const [el, b] of blocks) {
  hideBlock(b);
  watcher.observe(el);
  if (el.matches(REPLAY_ON_HOVER)) {
    el.addEventListener("mouseenter", () => { hideBlock(b); revealBlock(b, 350); });
  }
}

/* ---------- the watch ---------- */
const FACTS = [
  "most vintage movements beat 18,000–21,600 times an hour. that's why this seconds hand sweeps in tiny steps instead of ticking.",
  "the “jewels” in a movement are synthetic rubies, used as low-friction bearings. nothing to do with looking expensive.",
  "december 1969: seiko sold the astron, the first quartz wristwatch. it set off the “quartz crisis” that nearly ended swiss watchmaking.",
  "also 1969: the first automatic chronographs arrived. zenith, seiko, and a heuer–breitling team all raced to be first.",
  "an omega speedmaster went to the moon in 1969. nasa picked it after putting several watches through brutal heat, shock, and vacuum tests.",
  "wristwatches were long thought of as women's jewelry. world war i helped change that, since checking a pocket watch in a trench was impractical.",
];

// Gear outline centered on 0,0: trapezoid teeth, or sharp ones for an escape wheel.
function gearPath(r, teeth, depth, sharp = false) {
  const step = (Math.PI * 2) / teeth;
  const pt = (a, rad) => `${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const tooth = sharp
      ? [pt(a, r - depth), pt(a + step * .75, r), pt(a + step * .8, r - depth)]
      : [pt(a, r - depth), pt(a + step * .18, r), pt(a + step * .47, r), pt(a + step * .65, r - depth)];
    d += (i ? "L" : "M") + tooth.join("L");
  }
  return d + "Z";
}

// A spoked wheel: toothed rim, cut-outs showing the plate, a hub, and a jeweled pivot.
function wheel(id, cx, cy, r, teeth, spokes = 4, sharp = false) {
  let arms = "";
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    arms += `<line x1="0" y1="0" x2="${(Math.cos(a) * r * .8).toFixed(2)}" y2="${(Math.sin(a) * r * .8).toFixed(2)}"/>`;
  }
  return `<g transform="translate(${cx} ${cy})"><g id="${id}">
    <path d="${gearPath(r, teeth, sharp ? r * .28 : Math.max(1.1, r * .09), sharp)}" fill="url(#gilt)"/>
    <circle r="${r * .8}" fill="#15162a"/>
    <g stroke="#b3b7d3" stroke-width="${Math.max(1.4, r * .13)}" stroke-linecap="round">${arms}</g>
    <circle r="${r * .22}" fill="url(#gilt)"/>
  </g></g>`;
}

const jewel = (x, y, r = 1.9) =>
  `<circle cx="${x}" cy="${y}" r="${r + .9}" fill="#c9ccdf"/><circle cx="${x}" cy="${y}" r="${r}" fill="#d63a63"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .3}" fill="#ffd1dc"/>`;
const screw = (x, y, a = 30) =>
  `<g transform="translate(${x} ${y}) rotate(${a})"><circle r="2.6" fill="#3f6fe0"/><circle r="2.6" fill="url(#blued)"/><line x1="-2.2" x2="2.2" stroke="#0b1433" stroke-width=".8"/></g>`;

// Hairspring: an Archimedean spiral around the balance staff.
function spiral(turns, r0, r1) {
  let d = "";
  const n = turns * 40;
  for (let i = 0; i <= n; i++) {
    const a = (i / 40) * Math.PI * 2, rad = r0 + (r1 - r0) * (i / n);
    d += (i ? "L" : "M") + (Math.cos(a) * rad).toFixed(2) + "," + (Math.sin(a) * rad).toFixed(2);
  }
  return d;
}

(function watch() {
  const el = document.getElementById("watch");
  if (!el) return;
  const day = new Date().getDate();
  const MONO = `font-family="JetBrains Mono, monospace"`;

  let ticks = "";
  for (let i = 0; i < 60; i++) {
    if (i % 5) ticks += `<line x1="100" y1="21" x2="100" y2="24" transform="rotate(${i * 6} 100 100)"/>`;
  }
  let idx = "";
  for (let h = 0; h < 12; h++) {
    if (h === 3) continue; // the date window lives here
    idx += h === 0
      ? `<rect x="95.5" y="24" width="3" height="13" rx=".6"/><rect x="101.5" y="24" width="3" height="13" rx=".6"/>`
      : `<rect x="98.5" y="24" width="3" height="11" rx=".6" transform="rotate(${h * 30} 100 100)"/>`;
  }
  let caseScrews = "";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + .3;
    caseScrews += `<g transform="translate(${(100 + Math.cos(a) * 85.5).toFixed(2)} ${(100 + Math.sin(a) * 85.5).toFixed(2)}) rotate(${i * 47})"><circle r="1.9" fill="#232540"/><line x1="-1.5" x2="1.5" stroke="#0c0c16" stroke-width=".6"/></g>`;
  }
  let timing = "";
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    timing += `<circle cx="${(Math.cos(a) * 17.5).toFixed(2)}" cy="${(Math.sin(a) * 17.5).toFixed(2)}" r="1.1" fill="url(#gilt)"/>`;
  }
  let ratchet = "";
  for (let i = 0; i < 24; i++) ratchet += `<path d="M0,-11 L2.6,-11 L0,-8.6Z" transform="rotate(${i * 15})"/>`;

  const front = `
  <svg class="face front" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="dial" cx="40%" cy="35%" r="75%">
        <stop offset="0" stop-color="#171833"/><stop offset="1" stop-color="#08080f"/>
      </radialGradient>
      <linearGradient id="case" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3a3c5c"/><stop offset=".5" stop-color="#1a1b2c"/><stop offset="1" stop-color="#34365a"/>
      </linearGradient>
    </defs>
    <rect x="76" y="0" width="48" height="26" rx="4" fill="#12131f"/>
    <rect x="76" y="174" width="48" height="26" rx="4" fill="#12131f"/>
    <rect x="188" y="92" width="9" height="16" rx="2" fill="#2c2e48"/>
    <circle cx="100" cy="100" r="89" fill="url(#case)"/>
    <circle cx="100" cy="100" r="81" fill="url(#dial)"/>
    <g stroke="#3b3e58" stroke-width=".8">${ticks}</g>
    <g fill="#d6d8ec">${idx}</g>
    <rect x="143" y="93" width="19" height="14" rx="1" fill="#e9e8f3"/>
    <text x="152.5" y="103.8" text-anchor="middle" ${MONO} font-size="9.5" fill="#101018">${day}</text>
    <text x="100" y="58" text-anchor="middle" ${MONO} font-size="8" letter-spacing="2" fill="#d6d8ec">CK</text>
    <text x="100" y="138" text-anchor="middle" ${MONO} font-size="5.5" letter-spacing="1.5" fill="#7c80a0">AUTOMATIC</text>
    <text x="100" y="146" text-anchor="middle" ${MONO} font-size="4.5" letter-spacing="1" fill="#3b3e58">21,600 VPH</text>
    <polygon id="hh" points="100,54 104,100 100,108 96,100" fill="#d6d8ec"/>
    <polygon id="mh" points="100,30 102.8,100 100,108 97.2,100" fill="#d6d8ec"/>
    <g id="sh"><line x1="100" y1="116" x2="100" y2="26" stroke="#a78bfa" stroke-width="1.1"/><circle cx="100" cy="114" r="2.6" fill="#a78bfa"/></g>
    <circle cx="100" cy="100" r="3.6" fill="#a78bfa"/><circle cx="100" cy="100" r="1.4" fill="#07070c"/>
  </svg>`;

  // Seen from behind, the crown sits on the left.
  const back = `
  <svg class="face back" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="bcase" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3c5c"/><stop offset=".5" stop-color="#1a1b2c"/><stop offset="1" stop-color="#34365a"/>
      </linearGradient>
      <radialGradient id="plate" cx="45%" cy="40%" r="70%">
        <stop offset="0" stop-color="#23254099"/><stop offset="1" stop-color="#101120"/>
      </radialGradient>
      <pattern id="geneva" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <rect width="4.5" height="9" fill="#ffffff" opacity=".035"/>
      </pattern>
      <linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e2e4f4"/><stop offset=".55" stop-color="#8d91b3"/><stop offset="1" stop-color="#c3c6de"/>
      </linearGradient>
      <radialGradient id="blued" cx="35%" cy="35%" r="70%">
        <stop offset="0" stop-color="#9ab8ff" stop-opacity=".9"/><stop offset=".5" stop-color="#3f6fe0" stop-opacity="0"/><stop offset="1" stop-color="#1b2f86" stop-opacity=".8"/>
      </radialGradient>
      <linearGradient id="rotorg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8b8fb4"/><stop offset=".5" stop-color="#3d4060"/><stop offset="1" stop-color="#6f7399"/>
      </linearGradient>
      <linearGradient id="bridge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3a3d5e"/><stop offset="1" stop-color="#23253d"/>
      </linearGradient>
      <path id="ring" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0"/>
    </defs>
    <rect x="76" y="0" width="48" height="26" rx="4" fill="#12131f"/>
    <rect x="76" y="174" width="48" height="26" rx="4" fill="#12131f"/>
    <rect x="3" y="92" width="9" height="16" rx="2" fill="#2c2e48"/>
    <circle cx="100" cy="100" r="89" fill="url(#bcase)"/>
    ${caseScrews}
    <circle cx="100" cy="100" r="81" fill="#0b0b15"/>
    <circle cx="100" cy="100" r="81" fill="url(#plate)"/>
    <circle cx="100" cy="100" r="81" fill="url(#geneva)"/>
    <text ${MONO} font-size="3.6" letter-spacing=".9" fill="#5d6185"><textPath href="#ring" startOffset="2%">CALIBRE CK-26 · TWENTY-ONE JEWELS · 21,600 VPH · ADJUSTED FIVE POSITIONS · PITTSBURGH ·</textPath></text>

    <!-- mainspring barrel, with the ratchet wheel the rotor winds -->
    ${wheel("bk-barrel", 57, 104, 17, 72, 0)}
    <g transform="translate(57 104)"><g id="bk-ratchet" fill="#c3c6de"><circle r="9" fill="#9da1c0"/>${ratchet}<circle r="3" fill="#6d7194"/></g></g>

    ${wheel("bk-center", 104, 95, 19, 64, 4)}
    ${wheel("bk-third", 133, 75, 12, 42, 4)}
    ${wheel("bk-fourth", 137, 114, 14, 48, 5)}
    ${wheel("bk-escape", 114, 136, 9.5, 15, 3, true)}
    ${wheel("bk-rev1", 148, 140, 9, 30, 3)}
    ${wheel("bk-rev2", 160, 122, 9, 30, 3)}
    ${wheel("bk-crownw", 36, 86, 8, 28, 0)}

    <!-- pallet fork, snapping side to side on every beat -->
    <g transform="translate(101 142)"><g id="bk-pallet">
      <path d="M-1.2,0 L-20,1.2 L-20,-1.2Z M0,0 L10,-5 M0,0 L10,5" stroke="#c3c6de" stroke-width="1.3" fill="#c3c6de" stroke-linecap="round"/>
      <circle cx="10" cy="-5" r="1.2" fill="#d63a63"/><circle cx="10" cy="5" r="1.2" fill="#d63a63"/>
    </g></g>

    <!-- balance wheel and hairspring -->
    <g transform="translate(77 146)"><g id="bk-balance">
      <circle r="17.5" fill="none" stroke="url(#gilt)" stroke-width="2.6"/>
      ${timing}
      <g stroke="#b3b7d3" stroke-width="1.6"><line x1="-17" x2="17"/><line y1="-17" y2="17"/></g>
    </g>
    <path id="bk-spring" d="${spiral(6, 2.5, 11)}" fill="none" stroke="#b9bdd8" stroke-width=".45" opacity=".85"/></g>

    <!-- bridges -->
    <path d="M150,62 L133,75 L137,114 L114,136" fill="none" stroke="url(#bridge)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M150,62 L133,75 L137,114 L114,136" fill="none" stroke="#ffffff" stroke-opacity=".06" stroke-width="1" transform="translate(-1.5 -1.5)"/>
    <path d="M44,168 L77,146" stroke="url(#bridge)" stroke-width="10" stroke-linecap="round"/>
    <path d="M32,110 L57,104 L84,92 L104,95" fill="none" stroke="url(#bridge)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
    ${jewel(133, 75)}${jewel(137, 114)}${jewel(114, 136, 1.6)}${jewel(77, 146, 2.2)}${jewel(104, 95, 2.1)}${jewel(101, 142, 1.3)}${jewel(148, 140, 1.5)}${jewel(160, 122, 1.5)}
    ${screw(150, 62, 20)}${screw(44, 168, 75)}${screw(32, 110, 140)}${screw(57, 104, 10)}${screw(125, 128, 110)}${screw(36, 86, 95)}

    <!-- off-center micro-rotor: it swings like a pendulum, and moving the mouse winds it -->
    <g transform="translate(78 62)"><g id="bk-rotor">
      <path d="M-25,0 A25,25 0 0,0 25,0 L11,0 A11,11 0 0,1 -11,0Z" fill="url(#rotorg)"/>
      <path d="M-25,0 A25,25 0 0,0 25,0 L11,0 A11,11 0 0,1 -11,0Z" fill="url(#geneva)"/>
      <text y="18" text-anchor="middle" ${MONO} font-size="5" letter-spacing="1.4" fill="#1b1c2e">CK</text>
      <circle r="11" fill="none" stroke="#6f7399" stroke-width=".6" opacity=".6"/>
    </g>${screw(0, 0, 55)}</g>

    <ellipse cx="78" cy="62" rx="52" ry="30" fill="#ffffff" opacity=".04" transform="rotate(-35 78 62)"/>
  </svg>`;

  el.innerHTML = `<div class="flip">${front}${back}</div>`;
  const flip = el.firstElementChild;

  const $ = s => el.querySelector(s);
  const hh = $("#hh"), mh = $("#mh"), sh = $("#sh");
  const parts = ["barrel", "ratchet", "center", "third", "fourth", "escape", "pallet", "balance", "spring", "rotor", "rev1", "rev2", "crownw"]
    .reduce((o, k) => (o[k] = $("#bk-" + k), o), {});
  const rot = (node, deg) => node.setAttribute("transform", `rotate(${deg.toFixed(2)})`);
  const rotC = (node, deg) => node.setAttribute("transform", `rotate(${deg.toFixed(2)} 100 100)`);

  // rotor physics: a weighted pendulum that settles hanging down
  let rotor = 0.6, rotorV = 0, wound = 0, flipped = false;
  addEventListener("pointermove", e => {
    if (!flipped) return;
    rotorV += Math.max(-8, Math.min(8, e.movementX)) * .0012;
    rotorV = Math.max(-.3, Math.min(.3, rotorV));
  });

  function frame() {
    const n = new Date();
    const beats = Math.floor(n.getMilliseconds() / 1000 * 6); // 6 beats per second
    const s = n.getSeconds() + beats / 6;
    const m = n.getMinutes() + s / 60;
    const h = (n.getHours() % 12) + m / 60;
    rotC(sh, s * 6); rotC(mh, m * 6); rotC(hh, h * 30);

    if (flipped) {
      const t = performance.now() / 1000;
      const beat = Math.floor(t * 6);
      rot(parts.balance, Math.sin(t * Math.PI * 2 * 3) * 200); // 3 Hz, like 21,600 vph
      rot(parts.spring, Math.sin(t * Math.PI * 2 * 3) * 25);
      rot(parts.pallet, beat % 2 ? 9 : -9);
      rot(parts.escape, -beat * 12);
      rot(parts.fourth, s * 6); // the seconds wheel really turns once a minute
      rot(parts.third, -t * 9);
      rot(parts.center, m * 6);
      rot(parts.barrel, -t * .6);

      rotorV += -Math.sin(rotor) * .0035; // gravity pulls the weight down
      rotorV *= .985;
      rotor += rotorV;
      wound += Math.abs(rotorV) * 1.4; // winds in both directions
      rot(parts.rotor, rotor * 180 / Math.PI);
      rot(parts.ratchet, wound * 180 / Math.PI);
      rot(parts.rev1, -rotor * 540 / Math.PI); // reversing wheels follow the rotor
      rot(parts.rev2, rotor * 540 / Math.PI);
      rot(parts.crownw, wound * 60 / Math.PI);
    }
    requestAnimationFrame(frame);
  }
  frame();

  const fact = document.getElementById("fact");
  let i = -1, seenBack = false;
  function toggle() {
    flipped = !flipped;
    flip.classList.toggle("flipped", flipped);
    if (flipped && !seenBack) {
      seenBack = true;
      rotorV += .09; // give the rotor a nudge on its first reveal
      fact.dataset.final = "that's the movement. move your mouse to wind the rotor.";
    } else {
      i = (i + 1) % FACTS.length;
      fact.dataset.final = FACTS[i];
    }
    scramble(fact, 600);
  }
  el.addEventListener("click", toggle);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
})();

/* ---------- the cipher in the footer ---------- */
const CLUE = "floor of a ship, or what a magician shuffles (4). then type it.";
const ANSWER = "deck";

function caesar(text, shift) {
  return text.replace(/[a-z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 97 + shift) % 26 + 97));
}

(function cipher() {
  const el = document.getElementById("cipher");
  if (!el) return;
  // the key changes daily: it's whatever the watch's date window says
  el.textContent = caesar(CLUE, new Date().getDate() % 26);

  const box = document.getElementById("answer");
  const input = document.getElementById("answer-input");
  const nope = document.getElementById("nope");
  el.addEventListener("click", () => { box.classList.add("open"); input.focus(); });
  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    if (input.value.trim().toLowerCase() === ANSWER) { input.value = ""; openRoom(); }
    else { nope.classList.add("show"); setTimeout(() => nope.classList.remove("show"), 1400); }
  });

  let typed = "";
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-12);
    if (typed.endsWith(ANSWER)) { typed = ""; openRoom(); }
  });
})();

/* ---------- the back room: a small piece of mentalism ---------- */
const SUITS = [["♠", false], ["♥", true], ["♦", true], ["♣", false]];
const RANKS = ["J", "Q", "K"];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function cardHTML([rank, suit, red], k) {
  return `<div class="card${red ? " red" : ""}" style="animation-delay:${k * 70}ms">
    <div class="c">${rank}<small>${suit}</small></div><div class="m">${suit}</div>
    <div class="c b">${rank}<small>${suit}</small></div></div>`;
}

function openRoom() {
  if (document.querySelector(".room")) return;
  const room = document.createElement("div");
  room.className = "room";
  room.setAttribute("role", "dialog");
  room.setAttribute("aria-label", "The back room");
  room.innerHTML = `<button class="close">close ✕</button><div class="inner"></div>`;
  document.body.append(room);
  requestAnimationFrame(() => room.classList.add("in"));
  const inner = room.querySelector(".inner");

  const close = () => { room.classList.remove("in"); setTimeout(() => room.remove(), 500); removeEventListener("keydown", onEsc); };
  const onEsc = e => { if (e.key === "Escape") close(); };
  room.querySelector(".close").addEventListener("click", close);
  addEventListener("keydown", onEsc);

  function show(title, body, extra) {
    inner.innerHTML = `<h2>${title}</h2><p>${body}</p>${extra}`;
    scramble(inner.querySelector("h2"), 700);
  }

  function run(first) {
    const deck = [];
    for (const r of RANKS) for (const [s, red] of SUITS) deck.push([r, s, red]);
    shuffle(deck);
    const shown = deck.slice(0, 6), rest = deck.slice(6, 11);

    show(first ? "you found the back room." : "again, then.",
      "Here's a small piece of mentalism. Pick one of these cards. Don't click it, and don't tell me. Just remember it.",
      `<div class="cards">${shown.map(cardHTML).join("")}</div><button class="go">i've got it.</button>`);

    inner.querySelector(".go").addEventListener("click", () => {
      show("concentrate.", "Picture your card. Hold it there for a moment.", `<div class="reading" id="reading">reading</div>`);
      const reading = inner.querySelector("#reading");
      let n = 0;
      const t = setInterval(() => { reading.textContent = "reading" + ".".repeat(n++ % 4); }, 300);
      setTimeout(() => {
        clearInterval(t);
        show("your card is gone.",
          "I took it right out of the deck. Look.",
          `<div class="cards">${rest.map(cardHTML).join("")}</div>
           <button class="go">again?</button>
           <p style="margin-top:22px;font:12px var(--mono);color:var(--faint)">a magician never explains. a puzzler might work it out.</p>`);
        inner.querySelector(".go").addEventListener("click", () => run(false));
      }, 3000);
    });
  }
  run(true);
}

console.log(
  "%cnice of you to check the source.%c\nthe page is hiding something. the answer is technically in here, but that's no fun. start at the bottom of the page.",
  "color:#a78bfa;font:14px monospace", "color:#7c80a0;font:12px monospace"
);
