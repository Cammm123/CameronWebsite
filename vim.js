/* ---------- a small neovim, for reading the text files in the terminal ---------- */
// openVim({ host, name, title, items: [[heading, text], ...], onQuit }) draws the editor inside host.
function openVim({ host, name, title, items, onQuit }) {
  const PANDA = "ʕ◉ᴥ◉ʔ";
  const esc = t => t.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // the file: a heading, then one fold per item (its heading, its text, a blank line)
  const fresh = () => {
    const b = [{ t: "# " + title }, { t: "" }];
    items.forEach(([head, text], f) => {
      b.push({ t: "## " + head, f, head: true }, { t: text, f });
      if (f < items.length - 1) b.push({ t: "", f });
    });
    return b;
  };
  let buf = fresh();
  const closed = items.map(() => true);
  let cy = 2, cx = 0;                 // cursor: buffer line and column
  let mode = "normal", line = "";     // line is what's typed after : or /
  let pending = "", recording = "", query = "", modified = false;
  const bytes = buf.reduce((n, l) => n + new Blob([l.t]).size + 1, 0);
  let msg = `"${name}" [RO] ${buf.length}L, ${bytes}B`, msgErr = false;

  const touch = matchMedia("(pointer: coarse)").matches;
  const root = document.createElement("div");
  root.className = "vim";
  root.innerHTML = `
    <div class="v-buf"></div>
    <div class="v-status"><span class="v-mode"></span><span class="v-file"></span><span class="v-pos"></span></div>
    <div class="v-cmd"></div>
    <div class="v-bar">
      <button type="button" data-keys="z a"><b>za</b> open/close</button>
      <button type="button" data-keys="j"><b>j</b> down</button>
      <button type="button" data-keys="k"><b>k</b> up</button>
      ${touch ? "" : `<button type="button" data-keys="/"><b>/</b> search</button>`}
      <button type="button" data-keys=": q Enter"><b>:q</b> quit</button>
    </div>
    <div class="v-panda" aria-live="polite"></div>
    <input class="v-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Neovim. j and k move, z a opens a fold, colon q quits.">`;
  host.append(root);
  const $ = s => root.querySelector(s);
  const bufEl = $(".v-buf"), modeEl = $(".v-mode"), fileEl = $(".v-file"), posEl = $(".v-pos"),
    cmdEl = $(".v-cmd"), bubble = $(".v-panda"), input = $(".v-input");

  /* ---------- what's on screen ---------- */
  const rows = () => {
    const r = [];
    buf.forEach((l, i) => {
      if (l.f !== undefined && closed[l.f]) { if (l.head) r.push({ i, fold: l.f }); }
      else r.push({ i });
    });
    return r;
  };
  const rowIndex = rs => Math.max(0, rs.findIndex(r => r.i === cy || (r.fold !== undefined && buf[cy].f === r.fold)));
  const foldLen = f => buf.filter(l => l.f === f).length;
  const headOf = f => buf.findIndex(l => l.f === f && l.head);

  // a line's text with the cursor block and any search matches marked
  function paint(text, cur) {
    const hit = new Array(text.length).fill(false);
    if (query) {
      const low = text.toLowerCase(), q = query.toLowerCase();
      for (let k = low.indexOf(q); k >= 0; k = low.indexOf(q, k + 1)) hit.fill(true, k, k + q.length);
    }
    let html = "";
    for (let k = 0; k < Math.max(text.length, cur === null ? 0 : cur + 1); k++) {
      const ch = k < text.length ? esc(text[k]) : " ";
      const cls = [hit[k] && "v-hl", cur === k && "v-cur"].filter(Boolean).join(" ");
      html += cls ? `<span class="${cls}">${ch}</span>` : ch;
    }
    return html;
  }

  function render() {
    const rs = rows();
    const at = rowIndex(rs);
    let html = "";
    rs.forEach((r, n) => {
      const here = n === at;
      const l = buf[r.i];
      if (r.fold !== undefined) {
        const label = `+--${String(foldLen(r.fold)).padStart(3)} lines: ${l.t.replace(/^## /, "")} `;
        html += `<div class="v-row v-fold${here ? " v-line" : ""}" data-i="${r.i}"><span class="v-ln">${r.i + 1}</span>` +
          `<span class="v-txt">${paint(label, here && mode !== "command" && mode !== "search" ? 0 : null)}<span class="v-dots"></span></span></div>`;
      } else {
        const kind = l.head ? " v-h2" : r.i === 0 ? " v-h1" : "";
        const cur = here && mode !== "command" && mode !== "search" ? Math.min(cx, Math.max(0, l.t.length - (mode === "insert" ? 0 : 1))) : null;
        html += `<div class="v-row${kind}${here ? " v-line" : ""}" data-i="${r.i}"><span class="v-ln">${r.i + 1}</span>` +
          `<span class="v-txt">${paint(l.t, cur)}</span></div>`;
      }
    });
    for (let n = rs.length; n < 12; n++) html += `<div class="v-row v-tilde"><span class="v-ln"></span><span class="v-txt">~</span></div>`;
    bufEl.innerHTML = html;

    // keep the cursor's row in view without scrolling the page
    const curEl = bufEl.querySelector(".v-line");
    if (curEl) {
      const top = curEl.offsetTop - bufEl.offsetTop, bottom = top + curEl.offsetHeight;
      if (top < bufEl.scrollTop) bufEl.scrollTop = top;
      else if (bottom > bufEl.scrollTop + bufEl.clientHeight) bufEl.scrollTop = bottom - bufEl.clientHeight;
    }

    const label = { normal: "NORMAL", insert: "INSERT", command: "COMMAND", search: "COMMAND" }[mode];
    modeEl.textContent = label;
    modeEl.className = "v-mode v-" + mode;
    fileEl.textContent = `${name} [RO]${modified ? " [+]" : ""}`;
    const pct = at === 0 ? "Top" : at === rs.length - 1 ? "Bot" : Math.round((at / (rs.length - 1)) * 100) + "%";
    posEl.textContent = `${recording ? "recording @" + recording + "   " : ""}${cy + 1},${cx + 1}   ${rs.length <= 12 ? "All" : pct}`;
    if (mode === "command" || mode === "search") {
      cmdEl.innerHTML = (mode === "command" ? ":" : "/") + esc(line) + `<span class="v-cur"> </span>`;
      cmdEl.className = "v-cmd";
    } else {
      cmdEl.textContent = mode === "insert" ? "-- INSERT --" : msg;
      cmdEl.className = "v-cmd" + (msgErr && mode !== "insert" ? " v-err" : "");
    }
  }
  const say = (text, err = false) => { msg = text; msgErr = err; };

  /* ---------- moving around ---------- */
  function moveRow(d) {
    const rs = rows();
    const n = Math.max(0, Math.min(rs.length - 1, rowIndex(rs) + d));
    cy = rs[n].i;
    cx = Math.min(cx, Math.max(0, buf[cy].t.length - 1));
  }
  function setFold(f, shut) {
    if (f === undefined) return false;
    closed[f] = shut === undefined ? !closed[f] : shut;
    if (closed[f]) { cy = headOf(f); cx = 0; }
    return true;
  }
  function find(dir = 1) {
    if (!query) return say("E35: No previous regular expression", true);
    const q = query.toLowerCase();
    for (let step = 1; step <= buf.length; step++) {
      const i = (cy + dir * step + buf.length * 2) % buf.length;
      const k = buf[i].t.toLowerCase().indexOf(q);
      if (k >= 0) {
        const wrapped = dir > 0 ? i <= cy : i >= cy;
        cy = i; cx = k;
        if (buf[i].f !== undefined) closed[buf[i].f] = false; // search opens the fold it lands in
        return say(wrapped ? `search hit ${dir > 0 ? "BOTTOM, continuing at TOP" : "TOP, continuing at BOTTOM"}` : "/" + query, wrapped);
      }
    }
    say("E486: Pattern not found: " + query, true);
  }
  function edit() {
    if (!modified) { modified = true; say(`W10: Warning: Changing a readonly file`, true); }
  }

  /* ---------- getting stuck, and getting out ---------- */
  let escapes = 0, junk = [], lastHelp = 0, bubbleTimer;
  function stuck() {
    if (Date.now() - lastHelp < 8000) return;
    lastHelp = Date.now();
    const q = modified ? ":q!" : ":q";
    bubble.innerHTML = `<span class="v-face">${PANDA}</span> stuck? type <button type="button" data-keys=": ${q.slice(1).split("").join(" ")} Enter">${q}</button> and press enter.` +
      (modified ? " the ! throws away your edits." : " happens to everyone.");
    bubble.classList.add("on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("on"), 7000);
  }
  function flail() {
    const now = Date.now();
    junk = junk.filter(t => now - t < 5000);
    junk.push(now);
    if (junk.length >= 6) stuck();
  }
  function quit() {
    root.remove();
    onQuit();
  }

  function exec(c) {
    c = c.trim();
    if (/^(q|qa|quit|qall|x|wq|wqa|xa)$/.test(c) && modified) {
      if (/^(q|qa|quit|qall)$/.test(c)) { say("E37: No write since last change (add ! to override)", true); stuck(); return; }
    }
    if (/^(q|qa|quit|qall)!?$/.test(c)) return quit();
    if (/^(w|wq|x|wa|wqa|xa|write|up|update)$/.test(c)) return say("E45: 'readonly' option is set (add ! to override)", true);
    if (/^(w|wq|x|wa|wqa|xa|write)!$/.test(c)) return say("E212: Can't open file for writing. nice try " + PANDA, true);
    if (/^\d+$/.test(c)) {
      cy = Math.max(0, Math.min(buf.length - 1, +c - 1)); cx = 0;
      if (buf[cy].f !== undefined) closed[buf[cy].f] = false;
      return say("");
    }
    if (/^noh(lsearch)?$/.test(c)) { query = ""; return say(""); }
    if (/^h(elp)?$/.test(c)) return say("j/k move · za opens a fold · /word searches · :q quits");
    if (c === "smile") return say(PANDA + " :)");
    if (/^set?\b/.test(c) || c === "") return say("");
    say("E492: Not an editor command: " + c, true);
    flail();
  }

  /* ---------- keys ---------- */
  function key(k) {
    if (mode === "command" || mode === "search") {
      if (k === "Escape") { mode = "normal"; say(""); }
      else if (k === "Enter") {
        const c = line; const was = mode; mode = "normal"; line = "";
        if (was === "command") exec(c);
        else if (c) { query = c; find(1); }
      } else if (k === "Backspace") { if (!line) { mode = "normal"; say(""); } else line = line.slice(0, -1); }
      else if (k.length === 1) line += k;
      return render();
    }

    if (mode === "insert") {
      const l = buf[cy];
      if (k === "Escape") { mode = "normal"; cx = Math.max(0, cx - 1); say(""); }
      else if (k === "Enter") {
        buf.splice(cy + 1, 0, { t: l.t.slice(cx), f: l.f });
        l.t = l.t.slice(0, cx); cy++; cx = 0;
      } else if (k === "Backspace") { if (cx > 0) { l.t = l.t.slice(0, cx - 1) + l.t.slice(cx); cx--; } }
      else if (k === "ArrowLeft") cx = Math.max(0, cx - 1);
      else if (k === "ArrowRight") cx = Math.min(l.t.length, cx + 1);
      else if (k === "ArrowUp" || k === "ArrowDown") moveRow(k === "ArrowUp" ? -1 : 1);
      else if (k.length === 1) { l.t = l.t.slice(0, cx) + k + l.t.slice(cx); cx++; }
      return render();
    }

    // normal mode
    const l = buf[cy];
    if (k !== "Escape") escapes = 0;
    if (pending === "q") { pending = ""; if (/^[a-z0-9]$/i.test(k)) { recording = k; say("recording @" + k); return render(); } }
    if (pending === "g") { pending = ""; if (k === "g") { cy = rows()[0].i; cx = 0; return render(); } }
    if (pending === "z") {
      pending = "";
      if (k === "a") setFold(l.f);
      else if (k === "o") setFold(l.f, false);
      else if (k === "c") setFold(l.f, true);
      else if (k === "R") closed.fill(false);
      else if (k === "M") { closed.fill(true); if (l.f !== undefined) { cy = headOf(l.f); cx = 0; } }
      return render();
    }
    const insertHere = () => { if (l.f !== undefined) closed[l.f] = false; edit(); mode = "insert"; };
    switch (k) {
      case "j": case "ArrowDown": moveRow(1); break;
      case "k": case "ArrowUp": moveRow(-1); break;
      case "h": case "ArrowLeft": cx = Math.max(0, cx - 1); break;
      case "l": case "ArrowRight": cx = Math.min(Math.max(0, l.t.length - 1), cx + 1); break;
      case "0": cx = 0; break;
      case "$": cx = Math.max(0, l.t.length - 1); break;
      case "G": { const rs = rows(); cy = rs[rs.length - 1].i; cx = 0; break; }
      case "g": case "z": pending = k; return;
      case "Enter": if (l.f !== undefined && (l.head || closed[l.f])) setFold(l.f); else moveRow(1); break;
      case "/": mode = "search"; line = ""; break;
      case ":": mode = "command"; line = ""; break;
      case "n": find(1); break;
      case "N": find(-1); break;
      case "i": insertHere(); break;
      case "a": insertHere(); cx = Math.min(l.t.length, cx + 1); break;
      case "I": insertHere(); cx = 0; break;
      case "A": insertHere(); cx = l.t.length; break;
      case "o": insertHere(); buf.splice(cy + 1, 0, { t: "", f: l.f }); cy++; cx = 0; break;
      case "x": if (l.t.length) { if (l.f !== undefined) closed[l.f] = false; edit(); l.t = l.t.slice(0, cx) + l.t.slice(cx + 1); cx = Math.min(cx, Math.max(0, l.t.length - 1)); } break;
      case "u":
        if (modified) { buf = fresh(); modified = false; cy = Math.min(cy, buf.length - 1); cx = 0; say("1 change; before #1  0 seconds ago"); }
        else say("Already at oldest change");
        break;
      case "q":
        if (recording) { recording = ""; say(""); } else pending = "q";
        break;
      case "ctrl-c": say("Type  :qa!  and press <Enter> to abandon all changes and exit Nvim"); flail(); break;
      case "Escape":
        say("");
        if (++escapes >= 3) stuck();
        break;
      default:
        if (k.length === 1) flail();
        return;
    }
    render();
  }
  const feed = keys => keys.split(" ").forEach(key);

  input.addEventListener("keydown", e => {
    if (e.metaKey || e.altKey || (e.ctrlKey && e.key !== "c")) return;
    if (e.key === "Tab" || e.key === "Shift" || e.key === "Dead") return;
    e.preventDefault();
    key(e.ctrlKey ? "ctrl-c" : e.key);
  });
  root.addEventListener("click", e => {
    e.stopPropagation(); // clicks re-render the editor, so outer handlers can't tell where they landed
    const b = e.target.closest("[data-keys]");
    if (b) feed(b.dataset.keys);
    const row = e.target.closest(".v-row[data-i]");
    if (row && !b) {
      const i = +row.dataset.i;
      const l = buf[i];
      if (mode === "command" || mode === "search") mode = "normal";
      cy = i; cx = 0;
      if (l.f !== undefined && (l.head || closed[l.f])) setFold(l.f);
      render();
    }
    if (!touch) input.focus({ preventScroll: true });
  });

  render();
  if (!touch) input.focus({ preventScroll: true });
}
