const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- background field: a slow drift of faint points ---------- */
(function field() {
  const cv = document.getElementById("field");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const LINK = 115;
  const pts = [];
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

  const n = Math.round(Math.min(60, (W * H) / 22000));
  for (let i = 0; i < n; i++) {
    pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = ctx.fillStyle = "#3b3e58";
    ctx.lineWidth = .8;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.globalAlpha = (1 - d / LINK) * .35;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2); ctx.fill(); }
  }

  function step() {
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
    }
    draw();
    requestAnimationFrame(step);
  }
  reduceMotion ? draw() : requestAnimationFrame(step);
})();

/* ---------- the panda: roams the bottom edge, and pops out wherever you click ---------- */
const PANDA = "ʕ◉ᴥ◉ʔ";
const HELLOS = ["hi!", "hello :)", "hey there", "boo!", "♪", "psst, try the terminal", "you found me", "hi again"];

(function panda() {
  const roamer = document.createElement("div");
  roamer.className = "roamer";
  roamer.setAttribute("aria-hidden", "true");
  roamer.innerHTML = `<span class="r-face">${PANDA}</span><span class="r-say">click anywhere!</span>`;
  document.body.append(roamer);
  const face = roamer.firstElementChild;

  let x = 40, target = x, pauseUntil = 0, hiddenUntil = 0, lastMove = performance.now(), napping = false;
  const place = () => { roamer.style.transform = `translateX(${x}px)`; };
  place();

  function tick(t) {
    const idle = t - lastMove > 45000;
    if (idle !== napping) { napping = idle; face.textContent = idle ? "ʕ-ᴥ-ʔ zz" : PANDA; }
    if (!napping && t > pauseUntil && t > hiddenUntil) {
      const dx = target - x;
      if (Math.abs(dx) < 1) {
        pauseUntil = t + 1500 + Math.random() * 5000; // sit for a bit, then wander somewhere new
        target = 20 + Math.random() * Math.max(0, innerWidth - 110);
        roamer.classList.remove("walking");
      } else {
        x += Math.sign(dx) * Math.min(Math.abs(dx), .7);
        roamer.classList.add("walking");
        place();
      }
    }
    requestAnimationFrame(tick);
  }
  if (!reduceMotion) requestAnimationFrame(tick);
  addEventListener("pointermove", () => { lastMove = performance.now(); });

  let greeted = false;
  document.addEventListener("click", e => {
    lastMove = performance.now();
    if (e.target.closest("a, button, input, label, #watch, .room, .riddle, #term")) return;
    if (!greeted) { greeted = true; roamer.classList.add("greeted"); }
    peek(e.clientX, e.clientY);
    // it ducks away at the bottom and reappears under the spot you clicked
    roamer.classList.add("ducked");
    hiddenUntil = performance.now() + 2300;
    setTimeout(() => {
      x = target = Math.max(10, Math.min(innerWidth - 80, e.clientX - 25));
      place();
      roamer.classList.remove("ducked", "walking");
      pauseUntil = performance.now() + 2500;
    }, 2300);
  });

  function peek(px, py) {
    const old = document.querySelectorAll(".peek");
    if (old.length > 3) old[0].remove();
    const el = document.createElement("div");
    el.className = "peek";
    el.setAttribute("aria-hidden", "true");
    el.style.left = px + "px";
    el.style.top = py + "px";
    el.innerHTML = `<div class="p-hole"></div><div class="p-mask"><span class="p-face">${PANDA}</span></div>
      <span class="p-say">${HELLOS[(Math.random() * HELLOS.length) | 0]}</span>`;
    document.body.append(el);
    setTimeout(() => el.remove(), 2400);
  }
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
const SKIP = "#cipher, #fact, .room, .caret, svg, script, input, .answer, .hint, .riddle, #term, .roamer, .peek";
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
const CLUE = "floor of a ship";
const ANSWER = "deck";

function caesar(text, shift) {
  return text.replace(/[a-z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 97 + shift) % 26 + 97));
}

(function cipher() {
  const el = document.getElementById("cipher");
  if (!el) return;
  // the key changes daily; the back of the watch has it engraved
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
  "%cnice of you to check the source.%c\nthe page is hiding something. the answer is technically in here, but that's no fun. start with the riddle.",
  "color:#a78bfa;font:14px monospace", "color:#7c80a0;font:12px monospace"
);
