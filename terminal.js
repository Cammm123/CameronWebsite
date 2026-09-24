/* ---------- the terminal: how you get around the homepage ---------- */
(function terminal() {
  const box = document.getElementById("term");
  if (!box) return;
  const out = document.getElementById("t-out");
  const input = document.getElementById("t-input");
  const pathEl = box.querySelector(".t-path");
  const titleEl = box.querySelector(".t-title");
  const PANDA = "ʕ◉ᴥ◉ʔ";

  // [folder name, title, reasoning]
  const LIKES = [
    ["running", "Running", "Only if it's a morning run. The breath of the cold fresh air is the greatest feeling of every day."],
    ["working_out", "Working out", "It feels like I am playing a video game and upgrading my own body after every workout."],
    ["learning_new_things", "Learning new things", "I love learning about random fun facts!"],
    ["optimizing_things_with_ai", "Optimizing things with AI", "It feels like a superpower to be able to make any creative idea in your mind a real thing. Everyone now has this superpower with AI."],
    ["root_beer", "Root beer", "It’s just the greatest soda. Specifically Mug."],
  ];
  const TAKES = [
    ["energy_drinks_are_dumb", "Energy drinks are dumb", "Why rely on caffeine? Buying that energy drink every day can add up fast, especially in today’s economy. Also, they don’t even taste that good."],
    ["nih_lactose_funding", "The NIH should direct all funding to cure everyone who is lactose intolerant immediately", "No justification needed for this one."],
    ["boat_license", "A boat license is the coolest thing you can have", "You’re able to live on water, drive on water, and swim in water whenever you want."],
  ];
  const POSTS = [
    ["2026-09-22", "my_first_blog.txt", "blog/first-blog.html"],
    ["2024-06-01", "the_future_of_biomedical_diagnostics.txt", "blog/future-of-biomedical-diagnostics.html"],
  ];

  const dir = children => ({ type: "dir", children });
  const topics = list => dir(Object.fromEntries(list.map(([slug, title, text]) =>
    [slug, dir({ "why.txt": { type: "why", title, text } })])));
  const FS = dir({
    "things_i_like": topics(LIKES),
    "hot_takes": topics(TAKES),
    "blog": dir(Object.fromEntries(POSTS.map(([date, name, href]) => [name, { type: "post", date, href }]))),
    "riddle.txt": { type: "riddle" },
    "watch": { type: "watch" },
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
  const cmd = c => `<b class="t-cmd">${esc(c)}</b>`;

  const suffix = node => ({ dir: "/", watch: "*", url: "@" })[node.type] || "";
  const nameHTML = (name, node) => `<span class="t-${node.type}">${esc(name)}${suffix(node)}</span>`;

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
  const isTopic = node => node?.type === "dir" && node.children["why.txt"];

  /* ---------- what things do ---------- */
  function showTopic(node) {
    const why = node.children["why.txt"];
    print(`<b class="t-title-line">${esc(why.title)}</b>`);
    print(esc(why.text), "t-text");
  }
  function go(href) {
    print(`opening ${esc(href)}…`, "t-dim");
    setTimeout(() => { location.href = href; }, 450);
  }
  function openURL(node) {
    print(`opening ${esc(node.href)} in a new tab…`, "t-dim");
    window.open(node.href, "_blank", "noopener");
  }
  function flipWatch() {
    document.getElementById("watch")?.click();
    print(matchMedia("(max-width: 640px)").matches ? "flipped the watch. (scroll down to see it ↓)" : "flipped the watch. (look right →)", "t-dim");
    panda("look at the back. something is engraved there…", "watch");
  }
  function showRiddle() {
    print(esc(caesar(CLUE, new Date().getDate() % 26)), "t-text");
    print("∴ the key is in the watch.", "t-dim");
    panda(`when you think you have it, type ${cmd("answer <word>")}`, "riddle");
  }
  function tryAnswer(word) {
    if ((word || "").toLowerCase() === ANSWER) {
      print("correct.", "t-ok");
      setTimeout(openRoom, 400);
    } else {
      print("not quite.", "t-err");
      panda(`${cmd("cat riddle.txt")} to see it again. the key is on the back of the watch (${cmd("./watch")}).`, "wrong");
    }
  }

  function open(arg) {
    const { node } = resolve(arg);
    if (!arg) return print("open: which one? e.g. " + cmd("open linkedin"), "t-err");
    if (!node) return notFound("open", arg);
    if (node.type === "url") return openURL(node);
    if (node.type === "post") return go(node.href);
    if (node.type === "watch") return flipWatch();
    if (node.type === "riddle") return showRiddle();
    if (node.type === "why") return cat(arg);
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
    if (entries.every(([, n]) => n.type === "post")) {
      for (const [name, n] of entries) print(`<span class="t-dim">${n.date}</span>  ${nameHTML(name, n)}`);
    } else {
      print(entries.map(([name, n]) => nameHTML(name, n)).join("  "), "t-ls");
    }
    // the panda's tips, depending on where you are
    const here = cwd.join("/");
    if (!here) panda(`this is everything. try ${cmd("cd things_i_like")}`, "ls-home");
    else if (here === "blog") panda(`open a post with ${cmd("open " + entries[0][0])}`, "ls-blog");
    else if (here === "things_i_like" || here === "hot_takes") panda(`pick one: ${cmd("cd " + entries[0][0])}`, "ls-cat");
  }

  function cd(arg = "~") {
    const { parts, node } = resolve(arg);
    if (!node) return notFound("cd", arg);
    if (node.type !== "dir") {
      print(`cd: not a directory: ${esc(arg)}`, "t-err");
      const hint = { riddle: "cat riddle.txt", watch: "./watch", url: "open " + arg, post: "open " + arg, why: "cat " + arg }[node.type];
      if (hint) panda(`that one's not a folder. try ${cmd(hint)}`);
      return;
    }
    cwd = parts;
    pathEl.textContent = titleEl.textContent = home();
    if (isTopic(node)) {
      showTopic(node);
      panda(`${cmd("cd ..")} to go back and pick another.`, "topic");
    } else if (parts.length) {
      panda(`you're in ${esc(parts.at(-1))}/ now. type ${cmd("ls")} to look inside.`, "cd-" + parts[0]);
    }
  }

  function cat(arg) {
    if (!arg) return print("cat: which file?", "t-err");
    const { node } = resolve(arg);
    if (!node) return notFound("cat", arg);
    if (node.type === "why") {
      print(esc(node.text), "t-text");
      return;
    }
    if (node.type === "riddle") return showRiddle();
    if (node.type === "post") return go(node.href);
    if (node.type === "url") return print(`${esc(arg)} -> ${esc(node.href)}`);
    if (node.type === "dir") return print(`cat: ${esc(arg)}: is a directory`, "t-err");
    if (node.type === "watch") return print("cat: watch: it's a program. run it with " + cmd("./watch"), "t-err");
  }

  const HELP = [
    ["ls", "list what's here"],
    ["cd <folder>", "go into a folder (cd .. goes back)"],
    ["cat <file>", "read a file"],
    ["open <name>", "open a link, post, or the watch"],
    ["./watch", "flip the watch over"],
    ["answer <word>", "answer the riddle"],
    ["clear", "clear the screen"],
  ];

  const COMMANDS = {
    help: () => HELP.forEach(([c, d]) => print(`${cmd(c.padEnd(14, " "))} <span class="t-dim">${esc(d)}</span>`, "t-pre")),
    ls: a => ls(a[0]),
    cd: a => cd(a[0]),
    cat: a => cat(a[0]),
    open: a => open(a[0]),
    "./watch": () => flipWatch(),
    watch: () => flipWatch(),
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

  box.addEventListener("click", e => {
    if (!e.target.closest("a") && !getSelection().toString()) input.focus({ preventScroll: true });
  });

  /* ---------- first boot: the panda types ls for you ---------- */
  function boot() {
    panda("hi! this terminal is how you get around here.");
    const cmdText = "ls";
    let i = 0;
    const typer = setInterval(() => {
      input.value = cmdText.slice(0, ++i);
      if (i >= cmdText.length) {
        clearInterval(typer);
        setTimeout(() => { input.value = ""; run(cmdText); }, 350);
      }
    }, 160);
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // start once the terminal has faded in
  const obs = new MutationObserver(() => {
    if (box.classList.contains("in")) { obs.disconnect(); setTimeout(boot, reduce ? 0 : 500); }
  });
  obs.observe(box, { attributes: true, attributeFilter: ["class"] });
  if (box.classList.contains("in") || !document.documentElement.classList.contains("js")) { obs.disconnect(); boot(); }
})();
