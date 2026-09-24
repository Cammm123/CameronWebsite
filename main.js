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
    if (e.target.closest("a, button, input, #watch, .room, .riddle")) return;
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

// Text sits still until you point at it; then it scrambles and decodes.
const BLOCKS = "h1, h2, h3, p, li, .head, nav a, .fine > *, .cta a, .term-row, .prompt";
const SKIP = "#cipher, #fact, .room, .caret, svg, script, input, .answer, .hint, .riddle";
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
  b.busy = true;
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
    else b.busy = false;
  };
  b.raf = requestAnimationFrame(tick);
}

for (const [el, b] of blocks) {
  el.addEventListener("mouseenter", () => {
    if (b.busy) return;
    hideBlock(b); revealBlock(b, b.len > 80 ? 380 : 350);
  });
}

// On the homepage, pieces arrive one at a time and decode as they land.
(function stages() {
  const stages = document.querySelectorAll(".stage");
  if (!stages.length) return;
  const land = el => {
    el.classList.add("in");
    for (const [blk, b] of blocks) if (el.contains(blk)) { hideBlock(b); revealBlock(b); }
  };
  if (reduceMotion) { stages.forEach(el => el.classList.add("in")); return; }
  for (const [blk, b] of blocks) if (blk.closest(".stage")) hideBlock(b);
  const delays = [150, 1150, 2150, 2150];
  stages.forEach((el, i) => setTimeout(() => land(el), delays[Math.min(i, delays.length - 1)]));
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

  const input = document.getElementById("answer-input");
  const nope = document.getElementById("nope");
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
