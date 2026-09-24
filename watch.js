/* ---------- the watch: a 3D model, with the old flat SVG as a fallback ---------- */
const motionOff = matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// A spoked wheel centered on 0,0: toothed rim, cut-outs showing the plate, a hub.
function wheel(r, teeth, spokes = 4, sharp = false) {
  let arms = "";
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    arms += `<line x1="0" y1="0" x2="${(Math.cos(a) * r * .8).toFixed(2)}" y2="${(Math.sin(a) * r * .8).toFixed(2)}"/>`;
  }
  return `<path d="${gearPath(r, teeth, sharp ? r * .28 : Math.max(1.1, r * .09), sharp)}" fill="url(#gilt)"/>
    <circle r="${r * .8}" fill="#15162a"/>
    <g stroke="#b3b7d3" stroke-width="${Math.max(1.4, r * .13)}" stroke-linecap="round">${arms}</g>
    <circle r="${r * .22}" fill="url(#gilt)"/>`;
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

/* ---------- artwork, in the 200×200 units of the original drawing ---------- */
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
let timing = "";
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  timing += `<circle cx="${(Math.cos(a) * 17.5).toFixed(2)}" cy="${(Math.sin(a) * 17.5).toFixed(2)}" r="1.1" fill="url(#gilt)"/>`;
}
let ratchet = "";
for (let i = 0; i < 24; i++) ratchet += `<path d="M0,-11 L2.6,-11 L0,-8.6Z" transform="rotate(${i * 15})"/>`;

const DIAL_DEFS = `
  <radialGradient id="dial" cx="40%" cy="35%" r="75%">
    <stop offset="0" stop-color="#171833"/><stop offset="1" stop-color="#08080f"/>
  </radialGradient>`;
const DIAL = `
  <circle cx="100" cy="100" r="81" fill="url(#dial)"/>
  <g stroke="#3b3e58" stroke-width=".8">${ticks}</g>
  <g fill="#d6d8ec">${idx}</g>
  <rect x="143" y="93" width="19" height="14" rx="1" fill="#e9e8f3"/>`;
// dial printing, as [text, x, y, size, letter-spacing, color]
const DIAL_TEXT = [
  [String(day), 152.5, 103.8, 9.5, 0, "#101018"],
  ["CK", 100, 58, 8, 2, "#d6d8ec"],
  ["AUTOMATIC", 100, 138, 5.5, 1.5, "#7c80a0"],
  ["21,600 VPH", 100, 146, 4.5, 1, "#3b3e58"],
];
const RING_TEXT = "CALIBRE CK-26 · TWENTY-ONE JEWELS · 21,600 VPH · ADJUSTED FIVE POSITIONS · PITTSBURGH ·";
// The riddle is shifted by today's date, so the engraving says which letter stands for A.
const KEY_TEXT = `KEY · ${String.fromCharCode(65 + day % 26)}→A`;

const BACK_DEFS = `
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
  </linearGradient>`;
const PLATE = `
  <circle cx="100" cy="100" r="81" fill="#0b0b15"/>
  <circle cx="100" cy="100" r="81" fill="url(#plate)"/>
  <circle cx="100" cy="100" r="81" fill="url(#geneva)"/>`;

// Moving parts, bottom to top: [name, center x, center y, reach, artwork centered on 0,0]
const PARTS = [
  ["barrel", 57, 104, 17.5, wheel(17, 72, 0)],
  ["ratchet", 57, 104, 11.5, `<g fill="#c3c6de"><circle r="9" fill="#9da1c0"/>${ratchet}<circle r="3" fill="#6d7194"/></g>`],
  ["center", 104, 95, 19.5, wheel(19, 64, 4)],
  ["third", 133, 75, 12.5, wheel(12, 42, 4)],
  ["fourth", 137, 114, 14.5, wheel(14, 48, 5)],
  ["escape", 114, 136, 10, wheel(9.5, 15, 3, true)],
  ["rev1", 148, 140, 9.5, wheel(9, 30, 3)],
  ["rev2", 160, 122, 9.5, wheel(9, 30, 3)],
  ["crownw", 36, 86, 8.5, wheel(8, 28, 0)],
  // pallet fork, snapping side to side on every beat
  ["pallet", 101, 142, 21, `<path d="M-1.2,0 L-20,1.2 L-20,-1.2Z M0,0 L10,-5 M0,0 L10,5" stroke="#c3c6de" stroke-width="1.3" fill="#c3c6de" stroke-linecap="round"/>
      <circle cx="10" cy="-5" r="1.2" fill="#d63a63"/><circle cx="10" cy="5" r="1.2" fill="#d63a63"/>`],
  // balance wheel and hairspring
  ["balance", 77, 146, 19.5, `<circle r="17.5" fill="none" stroke="url(#gilt)" stroke-width="2.6"/>${timing}
      <g stroke="#b3b7d3" stroke-width="1.6"><line x1="-17" x2="17"/><line y1="-17" y2="17"/></g>`],
  ["spring", 77, 146, 12, `<path d="${spiral(6, 2.5, 11)}" fill="none" stroke="#b9bdd8" stroke-width=".45" opacity=".85"/>`],
  "BRIDGES",
  // off-center micro-rotor: it swings like a pendulum, and moving the mouse winds it
  ["rotor", 78, 62, 26, `<path d="M-25,0 A25,25 0 0,0 25,0 L11,0 A11,11 0 0,1 -11,0Z" fill="url(#rotorg)"/>
      <path d="M-25,0 A25,25 0 0,0 25,0 L11,0 A11,11 0 0,1 -11,0Z" fill="url(#geneva)"/>
      <text y="18" text-anchor="middle" ${MONO} font-size="5" letter-spacing="1.4" fill="#1b1c2e">CK</text>
      <circle r="11" fill="none" stroke="#6f7399" stroke-width=".6" opacity=".6"/>${screw(0, 0, 55)}`],
];
const BRIDGES = `
  <path d="M150,62 L133,75 L137,114 L114,136" fill="none" stroke="url(#bridge)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M150,62 L133,75 L137,114 L114,136" fill="none" stroke="#ffffff" stroke-opacity=".06" stroke-width="1" transform="translate(-1.5 -1.5)"/>
  <path d="M44,168 L77,146" stroke="url(#bridge)" stroke-width="10" stroke-linecap="round"/>
  <path d="M32,110 L57,104 L84,92 L104,95" fill="none" stroke="url(#bridge)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
  ${jewel(133, 75)}${jewel(137, 114)}${jewel(114, 136, 1.6)}${jewel(77, 146, 2.2)}${jewel(104, 95, 2.1)}${jewel(101, 142, 1.3)}${jewel(148, 140, 1.5)}${jewel(160, 122, 1.5)}
  ${screw(150, 62, 20)}${screw(44, 168, 75)}${screw(32, 110, 140)}${screw(57, 104, 10)}${screw(125, 128, 110)}${screw(36, 86, 95)}`;

/* ---------- what the movement is doing right now ---------- */
const state = { rotor: .6, rotorV: 0, wound: 0, flipped: false };

addEventListener("pointermove", e => {
  if (!state.flipped) return;
  state.rotorV += Math.max(-8, Math.min(8, e.movementX)) * .0012;
  state.rotorV = Math.max(-.3, Math.min(.3, state.rotorV));
});

// Angles in degrees for the hands and for every moving part of the movement.
function pose(runMovement) {
  const n = new Date();
  const beats = Math.floor(n.getMilliseconds() / 1000 * 6); // 6 beats per second
  const s = n.getSeconds() + beats / 6;
  const m = n.getMinutes() + s / 60;
  const h = (n.getHours() % 12) + m / 60;
  const a = { sec: s * 6, min: m * 6, hour: h * 30 };
  if (!runMovement) return a;

  const t = performance.now() / 1000;
  const beat = Math.floor(t * 6);
  state.rotorV += -Math.sin(state.rotor) * .0035; // gravity pulls the weight down
  state.rotorV *= .985;
  state.rotor += state.rotorV;
  state.wound += Math.abs(state.rotorV) * 1.4; // winds in both directions
  const deg = state.rotor * 180 / Math.PI;
  return Object.assign(a, {
    balance: Math.sin(t * Math.PI * 2 * 3) * 200, // 3 Hz, like 21,600 vph
    spring: Math.sin(t * Math.PI * 2 * 3) * 25,
    pallet: beat % 2 ? 9 : -9,
    escape: -beat * 12,
    fourth: s * 6, // the seconds wheel really turns once a minute
    third: -t * 9,
    center: m * 6,
    barrel: -t * .6,
    rotor: deg,
    ratchet: state.wound * 180 / Math.PI,
    rev1: -deg * 3, // reversing wheels follow the rotor
    rev2: deg * 3,
    crownw: state.wound * 60 / Math.PI,
  });
}

/* ---------- clicking: flip it over, and read a fact ---------- */
function wireClicks(el, onFlip) {
  const fact = document.getElementById("fact");
  let i = -1, seenBack = false;
  function toggle() {
    state.flipped = !state.flipped;
    onFlip(state.flipped);
    if (state.flipped && !seenBack) {
      seenBack = true;
      state.rotorV += .09; // give the rotor a nudge on its first reveal
      fact.dataset.final = "that's the movement. move your mouse to wind the rotor.";
    } else {
      i = (i + 1) % FACTS.length;
      fact.dataset.final = FACTS[i];
    }
    window.scramble ? window.scramble(fact, 600) : (fact.textContent = fact.dataset.final);
  }
  el.addEventListener("click", toggle);
  el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
}

/* ---------- the 3D model ---------- */
const svgImage = (w, h, viewBox, defs, body) => {
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}"><defs>${defs}</defs>${body}</svg>`);
  return img.decode().then(() => img);
};

// SVG images can't use the page's web fonts, so dial printing is drawn on the canvas.
function spaced(ctx, text, x, y, size, spacing, color) {
  ctx.font = `500 ${size}px "JetBrains Mono", monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  const widths = Array.from(text, ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, w) => a + w, 0) + spacing * (text.length - 1);
  let cx = x - total / 2;
  Array.from(text).forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i] + spacing; });
}

async function build3D(el) {
  const THREE = await import("three");
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
  const { RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js");
  await document.fonts.load('500 10px "JetBrains Mono"').catch(() => {});

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, .1, 20);
  camera.fov = 34;
  camera.position.set(0, 0, 4.3);
  camera.updateProjectionMatrix();

  // colored light so the steel picks up the site's blue and purple
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(-1.2, 1.6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -1;
  key.shadow.camera.right = key.shadow.camera.top = 1;
  key.shadow.bias = -.0005;
  key.shadow.radius = 3;
  const blue = new THREE.PointLight(0x6ea8ff, 10, 8); blue.position.set(2.2, -1.2, 1.5);
  const purple = new THREE.PointLight(0xa78bfa, 10, 8); purple.position.set(-2.2, 1.4, -1.2);
  scene.add(key, blue, purple);

  const watch = new THREE.Group();
  scene.add(watch);

  // satin gunmetal: brushed, not mirror-polished
  const steel = new THREE.MeshStandardMaterial({ color: 0x2c2e40, metalness: .9, roughness: .42, side: THREE.DoubleSide });
  const polished = new THREE.MeshStandardMaterial({ color: 0xc9cce0, metalness: .8, roughness: .35 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x05050c, metalness: 0, roughness: .1, transparent: true, opacity: .12, envMapIntensity: .5, depthWrite: false,
  });

  // case: one lathed profile from the caseback lip, round the flank, up to the bezel
  const profile = [
    [.80, -.2], [.80, -.255], [.835, -.27], [.875, -.265], [.91, -.24], [.935, -.17], [.948, -.07], [.945, .0],
    [.936, .045], [.918, .088], [.89, .113], [.865, .126], [.84, .13], [.826, .124], [.818, .1], [.815, .05],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const caseGeo = new THREE.LatheGeometry(profile, 160);
  caseGeo.rotateX(Math.PI / 2);
  watch.add(new THREE.Mesh(caseGeo, steel));

  // lugs and crown
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const lug = new THREE.Mesh(new RoundedBoxGeometry(.15, .34, .2, 4, .05), steel);
    lug.position.set(sx * .4, sy * .86, -.08);
    lug.rotation.z = sx * sy * -.08;
    watch.add(lug);
  }
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .09, 20), steel);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.0, 0, -.08);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .07, 16), steel);
  stem.rotation.z = Math.PI / 2;
  stem.position.set(.945, 0, -.08);
  watch.add(crown, stem);

  // caseback screws
  const screwGeo = new THREE.CylinderGeometry(.018, .018, .01, 12);
  screwGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + .3;
    const s = new THREE.Mesh(screwGeo, polished);
    s.position.set(Math.cos(a) * .853, Math.sin(a) * .853, -.27);
    watch.add(s);
  }

  // dial: the original artwork, printed onto a canvas texture
  const TEX = 1024;
  const dialCanvas = Object.assign(document.createElement("canvas"), { width: TEX, height: TEX });
  {
    const ctx = dialCanvas.getContext("2d");
    const S = TEX / 162;
    ctx.setTransform(S, 0, 0, S, -19 * S, -19 * S);
    ctx.drawImage(await svgImage(TEX * 200 / 162, TEX * 200 / 162, "0 0 200 200", DIAL_DEFS, DIAL), 0, 0, 200, 200);
    for (const [t, x, y, size, sp, c] of DIAL_TEXT) spaced(ctx, t, x, y, size, sp, c);
  }
  const dialTex = new THREE.CanvasTexture(dialCanvas);
  dialTex.colorSpace = THREE.SRGBColorSpace;
  dialTex.anisotropy = aniso;
  const dial = new THREE.Mesh(new THREE.CircleGeometry(.815, 96),
    new THREE.MeshStandardMaterial({ map: dialTex, roughness: .55, metalness: 0, envMapIntensity: .35 }));
  dial.position.z = .05;
  dial.receiveShadow = true;
  watch.add(dial);

  // hands: the dial's polygons, extruded
  const handGeo = (pts, depth) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2((x - 100) / 100, -(y - 100) / 100)));
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .003, bevelSize: .002, bevelSegments: 2 });
  };
  const hourHand = new THREE.Mesh(handGeo([[100, 54], [96, 100], [100, 108], [104, 100]], .006), polished);
  const minHand = new THREE.Mesh(handGeo([[100, 30], [97.2, 100], [100, 108], [102.8, 100]], .006), polished);
  hourHand.position.z = .058; minHand.position.z = .068;
  const accent = new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0xa78bfa, emissiveIntensity: .35, metalness: .4, roughness: .3 });
  const secHand = new THREE.Group();
  const secBar = new THREE.Mesh(new THREE.BoxGeometry(.011, .9, .005), accent);
  secBar.position.y = .29;
  const secTail = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .005, 24), accent);
  secTail.rotation.x = Math.PI / 2; secTail.position.y = -.14;
  secHand.add(secBar, secTail);
  secHand.position.z = .08;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .012, 24), accent);
  cap.rotation.x = Math.PI / 2; cap.position.z = .086;
  for (const h of [hourHand, minHand, secBar, secTail]) h.castShadow = true;
  watch.add(hourHand, minHand, secHand, cap);

  // a thick "box" crystal: a solid lens that stands above the bezel and bends the dial beneath it
  const lens = [
    [0, .125], [.82, .125], [.822, .15], [.818, .178], [.806, .198], [.78, .213], [.7, .226], [.5, .237], [.25, .243], [0, .245],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const crystalGeo = new THREE.LatheGeometry(lens, 128);
  crystalGeo.rotateX(Math.PI / 2);
  const crystal = new THREE.Mesh(crystalGeo, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: .05, ior: 1.4,
    attenuationColor: 0x9aa2e0, attenuationDistance: 1.6, specularIntensity: .45, envMapIntensity: .5,
  }));
  crystal.renderOrder = 2;
  watch.add(crystal);


  // back: the movement, redrawn every frame onto a canvas behind an exhibition window
  const W0 = 20, SPAN = 160; // the window shows x/y 20..180 of the drawing
  const movCanvas = Object.assign(document.createElement("canvas"), { width: TEX, height: TEX });
  const mctx = movCanvas.getContext("2d");
  const MS = TEX / SPAN;
  const base = Object.assign(document.createElement("canvas"), { width: TEX, height: TEX });
  {
    const ctx = base.getContext("2d");
    ctx.setTransform(MS, 0, 0, MS, -W0 * MS, -W0 * MS);
    ctx.drawImage(await svgImage(TEX * 200 / SPAN, TEX * 200 / SPAN, "0 0 200 200", BACK_DEFS, PLATE), 0, 0, 200, 200);
    // the calibre engraving, running clockwise from nine o'clock like the SVG's textPath
    ctx.font = `500 3.6px "JetBrains Mono", monospace`;
    ctx.fillStyle = "#5d6185";
    ctx.textAlign = "center";
    let a = Math.PI + .02 * Math.PI * 2;
    for (const ch of RING_TEXT) {
      const w = ctx.measureText(ch).width + .9;
      a += w / 2 / 75;
      ctx.save();
      ctx.translate(100 + Math.cos(a) * 75, 100 + Math.sin(a) * 75);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a += w / 2 / 75;
    }
    ctx.font = `500 5.2px "JetBrains Mono", monospace`;
    ctx.fillStyle = "#a78bfa";
    const kw = Array.from(KEY_TEXT, ch => ctx.measureText(ch).width + .8);
    a = Math.PI / 2 + kw.reduce((x, w) => x + w, 0) / 2 / 77;
    Array.from(KEY_TEXT).forEach((ch, i) => {
      a -= kw[i] / 2 / 77;
      ctx.save();
      ctx.translate(100 + Math.cos(a) * 77, 100 + Math.sin(a) * 77);
      ctx.rotate(a - Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a -= kw[i] / 2 / 77;
    });
  }
  const sprites = await Promise.all(PARTS.map(p => p === "BRIDGES"
    ? svgImage(TEX * 200 / SPAN, TEX * 200 / SPAN, "0 0 200 200", BACK_DEFS, BRIDGES)
    : svgImage(Math.ceil(p[3] * 2 * MS), Math.ceil(p[3] * 2 * MS), `${-p[3]} ${-p[3]} ${p[3] * 2} ${p[3] * 2}`, BACK_DEFS, p[4])));

  function drawMovement(a) {
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.drawImage(base, 0, 0);
    mctx.setTransform(MS, 0, 0, MS, -W0 * MS, -W0 * MS);
    PARTS.forEach((p, i) => {
      if (p === "BRIDGES") { mctx.drawImage(sprites[i], 0, 0, 200, 200); return; }
      const [name, cx, cy, reach] = p;
      mctx.save();
      mctx.translate(cx, cy);
      mctx.rotate((a[name] || 0) * Math.PI / 180);
      mctx.drawImage(sprites[i], -reach, -reach, reach * 2, reach * 2);
      mctx.restore();
    });
    movTex.needsUpdate = true;
  }
  const movTex = new THREE.CanvasTexture(movCanvas);
  movTex.colorSpace = THREE.SRGBColorSpace;
  movTex.anisotropy = aniso;
  const movement = new THREE.Mesh(new THREE.CircleGeometry(.8, 96),
    new THREE.MeshStandardMaterial({ map: movTex, roughness: .6, metalness: 0, envMapIntensity: .4 }));
  movement.rotation.y = Math.PI;
  movement.position.z = -.2;
  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(.8, 96), glass);
  backGlass.rotation.y = Math.PI;
  backGlass.position.z = -.25;
  backGlass.renderOrder = 2;
  watch.add(movement, backGlass);
  drawMovement(pose(true));

  el.innerHTML = "";
  el.append(renderer.domElement);
  const fit = () => {
    const w = el.clientWidth || 240;
    renderer.setSize(w, w, false);
  };
  fit();
  new ResizeObserver(fit).observe(el);

  // tilt toward the pointer; flip on click
  let tx = 0, ty = 0, flipAngle = 0, lean = -.3;
  addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
    tx = Math.max(-1, Math.min(1, dy * 2)) * .32;
    ty = Math.max(-1, Math.min(1, dx * 2)) * .42;
  });
  wireClicks(el, () => {});

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = performance.now() / 1000;
    const target = state.flipped ? Math.PI : 0;
    flipAngle += (target - flipAngle) * (motionOff ? 1 : .075);
    const float = motionOff ? 0 : Math.sin(t * .7) * .04;
    lean += ((state.flipped ? .3 : -.3) - lean) * (motionOff ? 1 : .075); // rest at an angle so the case's depth shows
    watch.rotation.x += (.16 + tx + float - watch.rotation.x) * .08;
    watch.rotation.y = flipAngle + lean + (state.flipped ? -ty : ty) * (motionOff ? 0 : 1);
    watch.position.y = motionOff ? 0 : Math.sin(t * .9) * .015;

    const showingBack = Math.cos(flipAngle) < 0;
    const a = pose(showingBack);
    hourHand.rotation.z = -a.hour * Math.PI / 180;
    minHand.rotation.z = -a.min * Math.PI / 180;
    secHand.rotation.z = -a.sec * Math.PI / 180;
    if (showingBack) drawMovement(a);
    renderer.render(scene, camera);
  }
  frame();
  el.classList.add("is-3d");
}

/* ---------- fallback: the flat SVG watch that flips with CSS ---------- */
function build2D(el) {
  const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w > 20 ? 4 : 2}" fill="${fill}"/>`;
  const caseDefs = (id, x1) => `<linearGradient id="${id}" x1="${x1}" y1="0" x2="${1 - x1}" y2="1">
    <stop offset="0" stop-color="#3a3c5c"/><stop offset=".5" stop-color="#1a1b2c"/><stop offset="1" stop-color="#34365a"/></linearGradient>`;
  const texts = DIAL_TEXT.map(([t, x, y, size, sp, c]) =>
    `<text x="${x}" y="${y}" text-anchor="middle" ${MONO} font-size="${size}" letter-spacing="${sp}" fill="${c}">${t}</text>`).join("");
  const front = `<svg class="face front" viewBox="0 0 200 200" aria-hidden="true"><defs>${DIAL_DEFS}${caseDefs("case", 0)}</defs>
    ${rect(76, 0, 48, 26, "#12131f")}${rect(76, 174, 48, 26, "#12131f")}${rect(188, 92, 9, 16, "#2c2e48")}
    <circle cx="100" cy="100" r="89" fill="url(#case)"/>${DIAL}${texts}
    <polygon id="hh" points="100,54 104,100 100,108 96,100" fill="#d6d8ec"/>
    <polygon id="mh" points="100,30 102.8,100 100,108 97.2,100" fill="#d6d8ec"/>
    <g id="sh"><line x1="100" y1="116" x2="100" y2="26" stroke="#a78bfa" stroke-width="1.1"/><circle cx="100" cy="114" r="2.6" fill="#a78bfa"/></g>
    <circle cx="100" cy="100" r="3.6" fill="#a78bfa"/><circle cx="100" cy="100" r="1.4" fill="#07070c"/></svg>`;

  let caseScrews = "";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + .3;
    caseScrews += `<g transform="translate(${(100 + Math.cos(a) * 85.5).toFixed(2)} ${(100 + Math.sin(a) * 85.5).toFixed(2)}) rotate(${i * 47})"><circle r="1.9" fill="#232540"/><line x1="-1.5" x2="1.5" stroke="#0c0c16" stroke-width=".6"/></g>`;
  }
  const parts = PARTS.map(p => p === "BRIDGES" ? BRIDGES
    : `<g transform="translate(${p[1]} ${p[2]})"><g id="bk-${p[0]}">${p[4]}</g></g>`).join("");
  // Seen from behind, the crown sits on the left.
  const back = `<svg class="face back" viewBox="0 0 200 200" aria-hidden="true"><defs>${BACK_DEFS}${caseDefs("bcase", 1)}
    <path id="ring" d="M100,100 m-75,0 a75,75 0 1,1 150,0 a75,75 0 1,1 -150,0"/></defs>
    ${rect(76, 0, 48, 26, "#12131f")}${rect(76, 174, 48, 26, "#12131f")}${rect(3, 92, 9, 16, "#2c2e48")}
    <circle cx="100" cy="100" r="89" fill="url(#bcase)"/>${caseScrews}${PLATE}
    <text ${MONO} font-size="3.6" letter-spacing=".9" fill="#5d6185"><textPath href="#ring" startOffset="2%">${RING_TEXT}</textPath></text>
    <text x="100" y="176" text-anchor="middle" ${MONO} font-size="5" letter-spacing=".8" fill="#a78bfa">${KEY_TEXT}</text>
    ${parts}
    <ellipse cx="78" cy="62" rx="52" ry="30" fill="#ffffff" opacity=".04" transform="rotate(-35 78 62)"/></svg>`;

  el.innerHTML = `<div class="flip">${front}${back}</div>`;
  const flip = el.firstElementChild;
  const $ = s => el.querySelector(s);
  const hh = $("#hh"), mh = $("#mh"), sh = $("#sh");
  const nodes = Object.fromEntries(PARTS.filter(p => p !== "BRIDGES").map(p => [p[0], $("#bk-" + p[0])]));
  const rotC = (node, deg) => node.setAttribute("transform", `rotate(${deg.toFixed(2)} 100 100)`);

  function frame() {
    const a = pose(state.flipped);
    rotC(sh, a.sec); rotC(mh, a.min); rotC(hh, a.hour);
    if (state.flipped) for (const k in nodes) nodes[k].setAttribute("transform", `rotate(${a[k].toFixed(2)})`);
    requestAnimationFrame(frame);
  }
  frame();
  wireClicks(el, on => flip.classList.toggle("flipped", on));
}

const el = document.getElementById("watch");
if (el) {
  build3D(el).catch(err => {
    console.warn("3D watch unavailable, using the flat one:", err);
    build2D(el);
  });
}
