/* ---------- the terminal: how you get around the homepage ---------- */
(function terminal() {
  const box = document.getElementById("term");
  if (!box) return;
  const out = document.getElementById("t-out");
  const input = document.getElementById("t-input");
  const pathEl = box.querySelector(".t-path");
  const titleEl = box.querySelector(".t-title");
  const PANDA = "ʕ◉ᴥ◉ʔ";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let typing = false; // true while a click is typing a command out

  // [title, reasoning]
  const LIKES = [
    ["Running", "Only if it's a morning run. The breath of the cold fresh air is the greatest feeling of every day."],
    ["Working out", "It feels like I am playing a video game and upgrading my own body after every workout."],
    ["Learning new things", "I love learning about random fun facts!"],
    ["Optimizing things with AI", "It feels like a superpower to be able to make any creative idea in your mind a real thing. Everyone now has this superpower with AI."],
    ["Root beer", "It’s just the greatest soda. Specifically Mug."],
  ];
  const TAKES = [
    ["Energy drinks are dumb", "Why rely on caffeine? Buying that energy drink every day can add up fast, especially in today’s economy. Also, they don’t even taste that good."],
    ["The NIH should direct all funding to cure everyone who is lactose intolerant immediately", "No justification needed for this one."],
    ["A boat license is the coolest thing you can have", "You’re able to live on water, drive on water, and swim in water whenever you want."],
  ];
  const POSTS = [
    ["2026-09-22", "my_first_blog.txt", "blog/first-blog.html"],
    ["2024-06-01", "the_future_of_biomedical_diagnostics.txt", "blog/future-of-biomedical-diagnostics.html"],
  ];

  const dir = children => ({ type: "dir", children });
  const FS = dir({
    "things_i_like.txt": { type: "doc", title: "things i like", items: LIKES },
    "hot_takes.txt": { type: "doc", title: "hot takes", items: TAKES },
    "blog": dir(Object.fromEntries(POSTS.map(([date, name, href]) => [name, { type: "post", date, href }]))),
    "riddle": { type: "watch" },
    "github": { type: "url", href: "https://github.com/Cammm123" },
    "linkedin": { type: "url", href: "https://www.linkedin.com/in/cameron-kani-134b69372" },
  });

  let cwd = [];
  const home = () => "~" + cwd.map(p => "/" + p).join("");

  /* ---------- printing ---------- */
  const esc = t => t.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function print(html, cls = "") {
    const line = document.createElement("div");
    line.className = "t-row " + cls;
    line.innerHTML = html;
    out.append(line);
    out.scrollTop = out.scrollHeight;
    return line;
  }
  const said = new Set();
  function panda(msg, once) {
    if (once) { if (said.has(once)) return; said.add(once); }
    print(`<span class="t-face">${PANDA}</span> ${msg}`, "t-say");
  }
  // anything with a data-run attribute can be clicked instead of typed
  const cmd = c => /</.test(c) ? `<b class="t-cmd">${esc(c)}</b>`
    : `<button type="button" class="t-cmd" data-run="${esc(c)}">${esc(c)}</button>`;

  const suffix = node => ({ dir: "/", url: "@" })[node.type] || "";
  const action = (path, node) => ({
    dir: ["cd " + path, "ls"], doc: ["nvim " + path], watch: ["./riddle"],
    url: ["open " + path], post: ["open " + path],
  })[node.type];
  const nameHTML = (name, node, path = name) =>
    `<button type="button" class="t-name t-${node.type}" data-run="${esc(action(path, node).join("\n"))}">${esc(name)}${suffix(node)}</button>`;

  /* ---------- paths ---------- */
  function resolve(arg = "") {
    let parts = arg.startsWith("~") || arg.startsWith("/") ? [] : [...cwd];
    for (const seg of arg.replace(/^~/, "").split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop(); else parts.push(seg);
    }
    let node = FS;
    for (const p of parts) {
      node = node.type === "dir" ? node.children[p] : undefined;
      if (!node) return { parts, node: undefined };
    }
    return { parts, node };
  }
  /* ---------- what things do ---------- */
  // the plain way to read a text file
  function showDoc(node) {
    print(`<span class="t-dim"># ${esc(node.title)}</span>`);
    for (const [head, text] of node.items) {
      print(`<b class="t-title-line">${esc(head)}</b>`);
      print(esc(text), "t-text");
    }
  }

  // the fun way: neovim takes over the terminal window until :q
  let vimOpen = false;
  function nvim(arg) {
    if (!arg) return print(`nvim: which file? e.g. ${cmd("nvim things_i_like.txt")}`, "t-err");
    const { node } = resolve(arg);
    if (!node) return notFound("nvim", arg);
    if (node.type === "dir") return print(`nvim: ${esc(arg)} is a directory. try ${cmd("cd " + arg)}`, "t-err");
    if (node.type !== "doc") return print(`nvim: ${esc(arg)}: not a text file`, "t-err");
    vimOpen = true;
    box.classList.add("in-vim");
    const before = titleEl.textContent;
    titleEl.textContent = before + " · nvim";
    openVim({
      host: box, name: arg.split("/").pop(), title: node.title, items: node.items,
      onQuit() {
        vimOpen = false;
        box.classList.remove("in-vim");
        titleEl.textContent = before;
        out.scrollTop = out.scrollHeight;
        panda("you made it out of vim. most people never do.", "vim-out");
        if (!matchMedia("(pointer: coarse)").matches) input.focus({ preventScroll: true });
      },
    });
  }
  function go(href) {
    print(`opening ${esc(href)}…`, "t-dim");
    setTimeout(() => { if (!fadeTo(href)) location.href = href; }, 450);
  }
  function openURL(node) {
    print(`opening ${esc(node.href)} in a new tab…`, "t-dim");
    window.open(node.href, "_blank", "noopener");
  }
  // the watch (with its riddle underneath) stays hidden until the terminal calls it up
  const home_ = document.querySelector(".home");
  const narrow = () => matchMedia("(max-width: 640px)").matches;
  const where = () => narrow() ? "(scroll down ↓)" : "(look right →)";
  function reveal() {
    const parts = document.querySelectorAll(".side > [hidden]");
    if (!parts.length) return false;
    parts.forEach(el => { el.hidden = false; });
    home_.classList.add("has-side");
    requestAnimationFrame(() => parts.forEach(el => el.classList.add("shown")));
    if (narrow()) setTimeout(() => parts[0].scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return true;
  }
  function flipWatch() {
    if (reveal()) {
      print(`the watch is out, with a riddle underneath. ${where()}`, "t-dim");
      panda(`the key to the riddle is somewhere on the watch. run ${cmd("./riddle")} again to flip the watch over.`, "watch-out");
      return;
    }
    document.getElementById("watch")?.click();
    print(`flipped the watch. ${where()}`, "t-dim");
    panda(`look at the back. something is engraved there… answer with ${cmd("answer <word>")}`, "watch");
  }
  function tryAnswer(word) {
    if ((word || "").toLowerCase() === ANSWER) {
      print("correct.", "t-ok");
      setTimeout(openRoom, 400);
    } else {
      print("not quite.", "t-err");
      panda(`the key is on the back of the watch. flip it with ${cmd("./riddle")}.`, "wrong");
    }
  }

  function open(arg) {
    const { node } = resolve(arg);
    if (!arg) return print("open: which one? e.g. " + cmd("open linkedin"), "t-err");
    if (!node) return notFound("open", arg);
    if (node.type === "url") return openURL(node);
    if (node.type === "post") return go(node.href);
    if (node.type === "watch") return flipWatch();
    if (node.type === "doc") return nvim(arg);
    if (node.type === "dir") return cd(arg);
  }

  function notFound(c, arg) {
    print(`${c}: no such file or directory: ${esc(arg)}`, "t-err");
    panda(`${cmd("ls")} shows what's here. ${cmd("cd ..")} goes back up.`, "notfound");
  }

  function ls(arg) {
    const { node } = resolve(arg);
    if (!node) return notFound("ls", arg);
    if (node.type !== "dir") return print(nameHTML(arg, node));
    const entries = Object.entries(node.children);
    const at = name => (arg ? arg.replace(/\/$/, "") + "/" : "") + name;
    if (entries.every(([, n]) => n.type === "post")) {
      for (const [name, n] of entries) print(`<span class="t-dim">${n.date}</span>  ${nameHTML(name, n, at(name))}`);
    } else {
      print(entries.map(([name, n]) => nameHTML(name, n, at(name))).join("  "), "t-ls");
    }
    // the panda's tips, depending on where you are
    const here = cwd.join("/");
    if (!here) panda(`this is everything. the .txt files open in neovim: ${cmd("nvim things_i_like.txt")} (or just ${cmd("cat hot_takes.txt")})`, "ls-home");
    else if (here === "blog") panda(`open a post with ${cmd("open " + entries[0][0])}`, "ls-blog");
  }

  function cd(arg = "~") {
    const { parts, node } = resolve(arg);
    if (!node) return notFound("cd", arg);
    if (node.type !== "dir") {
      print(`cd: not a directory: ${esc(arg)}`, "t-err");
      const hint = { watch: "./riddle", url: "open " + arg, post: "open " + arg, doc: "nvim " + arg }[node.type];
      if (hint) panda(`that one's not a folder. try ${cmd(hint)}`);
      return;
    }
    cwd = parts;
    pathEl.textContent = titleEl.textContent = home();
    if (parts.length && !typing) {
      panda(`you're in ${esc(parts.at(-1))}/ now. type ${cmd("ls")} to look inside.`, "cd-" + parts[0]);
    }
  }

  function cat(arg) {
    if (!arg) return print("cat: which file?", "t-err");
    const { node } = resolve(arg);
    if (!node) return notFound("cat", arg);
    if (node.type === "doc") return showDoc(node);
    if (node.type === "post") return go(node.href);
    if (node.type === "url") return print(`${esc(arg)} -> ${esc(node.href)}`);
    if (node.type === "dir") return print(`cat: ${esc(arg)}: is a directory`, "t-err");
    if (node.type === "watch") return print(`cat: ${esc(arg)}: it's a program. run it with ` + cmd("./riddle"), "t-err");
  }

  const HELP = [
    ["ls", "list what's here"],
    ["cd <folder>", "go into a folder (cd .. goes back)"],
    ["cat <file>", "read a file"],
    ["nvim <file>", "open a text file in neovim (:q quits)"],
    ["open <name>", "open a link, a post, or the riddle"],
    ["./riddle", "bring out the riddle and its watch, then flip the watch"],
    ["answer <word>", "answer the riddle"],
    ["clear", "clear the screen"],
  ];

  const COMMANDS = {
    help: () => HELP.forEach(([c, d]) => print(`${cmd(c.padEnd(14, " "))} <span class="t-dim">${esc(d)}</span>`, "t-pre")),
    ls: a => ls(a[0]),
    cd: a => cd(a[0]),
    cat: a => cat(a[0]),
    open: a => open(a[0]),
    "./riddle": () => flipWatch(),
    "./watch": () => flipWatch(),
    watch: () => flipWatch(),
    nvim: a => nvim(a[0]),
    vim: a => nvim(a[0]),
    vi: a => nvim(a[0]),
    nano: () => panda(`we use neovim in this house. ${cmd("nvim things_i_like.txt")}`),
    emacs: () => panda(`we use neovim in this house. ${cmd("nvim things_i_like.txt")}`),
    answer: a => tryAnswer(a[0]),
    [ANSWER]: () => tryAnswer(ANSWER),
    pwd: () => print(home().replace("~", "/home/cameron")),
    whoami: () => print("cameron kani · computational biology @ carnegie mellon"),
    clear: () => { out.innerHTML = ""; },
    sudo: () => { print("nice try.", "t-err"); panda("i'm not allowed to give out root access. only root beer."); },
    exit: () => panda(`there's no leaving. ${cmd("cd ~")} takes you home, though.`),
  };

  function run(line) {
    print(`<span class="t-p">${esc(home())} $</span> ${esc(line)}`, "t-echo");
    const [name, ...args] = line.trim().split(/\s+/);
    if (!name) return;
    const fn = COMMANDS[name.toLowerCase()];
    if (fn) return fn(args);
    // running a file by name, like typing "linkedin"
    const { node } = resolve(name);
    if (node && node.type !== "dir") return open(name);
    if (node) return cd(name);
    print(`command not found: ${esc(name)}`, "t-err");
    panda(`i don't know that one. type ${cmd("help")} to see what works.`);
  }

  /* ---------- typing ---------- */
  const history = [];
  let hIdx = 0;
  input.addEventListener("keydown", e => {
    if (typing) { e.preventDefault(); return; }
    if (e.key === "Enter") {
      const line = input.value;
      input.value = "";
      if (line.trim()) { history.push(line); }
      hIdx = history.length;
      run(line);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!history.length) return;
      e.preventDefault();
      hIdx = Math.max(0, Math.min(history.length, hIdx + (e.key === "ArrowUp" ? -1 : 1)));
      input.value = history[hIdx] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    }
  });

  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    const word = parts.at(-1);
    let options;
    if (parts.length === 1) {
      options = [...Object.keys(COMMANDS).filter(c => c !== ANSWER), ...Object.keys(resolve().node.children)];
    } else {
      const slash = word.lastIndexOf("/");
      const base = slash >= 0 ? word.slice(0, slash + 1) : "";
      const { node } = resolve(base || ".");
      if (!node || node.type !== "dir") return;
      options = Object.entries(node.children).map(([n, c]) => base + n + (c.type === "dir" ? "/" : ""));
    }
    const hits = options.filter(o => o.startsWith(word));
    if (hits.length === 1) input.value = v.slice(0, v.length - word.length) + hits[0];
    else if (hits.length > 1) print(hits.map(esc).join("  "), "t-dim");
  }

  function typeOut(lines) {
    if (typing) return;
    typing = true;
    const queue = lines.split("\n");
    const next = () => {
      const text = queue.shift();
      if (text === undefined) { typing = false; return; }
      let i = 0;
      const t = setInterval(() => {
        input.value = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(t);
          setTimeout(() => { input.value = ""; run(text); setTimeout(next, 250); }, 180);
        }
      }, reduce ? 0 : 28);
    };
    next();
  }
  out.addEventListener("click", e => {
    const b = e.target.closest("[data-run]");
    if (b) typeOut(b.dataset.run);
  });
  box.addEventListener("click", e => {
    if (!vimOpen && !e.target.closest("a, button") && !getSelection().toString() && !typing) input.focus({ preventScroll: true });
  });

  /* ---------- first boot: the panda types ls for you ---------- */
  function boot() {
    panda("hi! this terminal is how you get around here. type, or click anything highlighted.");
    setTimeout(() => typeOut("ls"), 400);
  }
  // start once the terminal has faded in
  const obs = new MutationObserver(() => {
    if (box.classList.contains("in")) { obs.disconnect(); setTimeout(boot, reduce ? 0 : 500); }
  });
  obs.observe(box, { attributes: true, attributeFilter: ["class"] });
  if (box.classList.contains("in") || !document.documentElement.classList.contains("js")) { obs.disconnect(); boot(); }
})();
