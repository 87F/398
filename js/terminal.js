const PALETTES = {
  avanier: ["#1e1e24", "#e4e4e4", "#555", "#ed4141"],
  wildberry: ["#2a1f33", "#f8f8f8", "#2cbc63", "#9b5ae2"],
  toyota: ["#f0f3f6", "#030303", "#777c80", "#d82662"],
  mint: ["#1a2232", "#92a5a3", "#3c4947", "#87cc7f"],
  safari: ["#bdbbb0", "#353535", "#d2d7df", "#353535"],
  verdure: ["#00120B", "#d8e4ff", "#6b818c", "#35605a"],
  gameboy: ["#9bbc0f", "#306230", "#306230", "#0f380f"],
  lisa: ["#544f73", "#f2f0d8", "#be99f2", "#f2c48d"],
  sakura: ["#882238", "#f3eeea", "#72be9a", "#f5c1c3"],
  matrix: ["#020402", "#c6dec6", "#758173", "#a9c5a0"],
  mono: ["#030303", "#f8f8f8", "#555", "#555"],
  onix: ["#f6eeee", "#524a4a", "#bdb4b4", "#524a4a"],
  magikarp: ["#ff9c62", "#fff", "#bd4141", "#f66218"],
  eevee: ["#bd9c7b", "#ffe6ac", "#734a4a", "#e6c594"],
  kakuna: ["#f6cd31", "#393939", "#6a6a6a", "#393939"],
  daredevil: ["#0d0001", "#cd575f", "#6e252c", "#99444b"],
  pop: ["#e9c311", "#090800", "#099bac", "#eb481e"],
  raymond: ["#ffffe8", "#2a3336", "#8496a1", "#ff7975"],
  xiao: ["#23242b", "#f1ebec", "#349b99", "#ebbf36"],
};

function Terminal() {
  this.el = document.getElementById("terminal");
  this.input = document.getElementById("input");
  this.output = document.getElementById("output");

  this.history = [];
  this.historyIndex = 0;
  this.lock = false;
  this.nodeLock = undefined;
  this.slideIndex = 0;

  const rnEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isHex = (value) => /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value);

  function updateMesh(node) {
    if (TheGrid.network[node].parent) {
      TheGrid.network[node].parent.update();
    }
  }

  function displayPalette(scheme) {
    return scheme.reduce(
      (x, y) =>
        x +
        `<span title="${y}" style="color:${y}">\u2588\u2588</span>`,
      "",
    );
  }

  function notFound(item) {
    return `<span class="n">${item}</span> not found.`;
  }

  function notNum(n, command) {
    return `<span class="n">'${n}'</span> is not a number.<br><br>${
      this.lib[command].help
    }`;
  }

  this.lib = {
    help: {
      help: "-,-<br><br>syntax: help {command}",
      fn: ([command = "help"]) => {
        if (!this.lib[command]) {
          return `command ${
            notFound(command)
          }<br><br>${this.lib.commands.fn()}`;
        }
        return this.lib[command].help;
      },
    },
    config: {
      help: "display config",
      fn: () =>
        Object.keys(CONFIG).reduce(
          (x, y) => x + `${y}: <span class="n">${CONFIG[y]}</span><br>`,
          "",
        ),
    },
    slides: {
      help: "lists available slides to load",
      fn: (_) =>
        Object.keys(SLIDES).reduce(
          (x, y) => x + `<span class="n">${y}</span><br>`,
          "",
        ),
    },
    commands: {
      help: "lists available commands",
      fn: (_) => Object.keys(this.lib).sort().join("<br>"),
    },
    load: {
      help: "loads a slide<br><br>syntax: load {slide}",
      fn: ([id]) => {
        if (!id) return this.lib.load.help;
        if (!SLIDES[id]) return notFound(id);

        this.slideIndex = Object.keys(SLIDES).indexOf(id);
        const x = performance.now();
        sessionStorage.removeItem("viewBox");
        TheGrid.network = {};
        document.getElementById("main").innerHTML = "";
        SLIDES[id]();
        TheGrid.graph();
        const y = performance.now() - x;

        const msg = `loaded <span class="n">${id}</span> in ${y} ms.`;

        return CONFIG.statsOnRender
          ? `${msg}<br><br>${this.lib.nodes.fn()}<br>${this.lib.routes.fn()}`
          : msg;
      },
    },
    add: {
      help:
        "add a node<br><br>syntax: add {x} {y} <span class=n>{nodeName}</span>",
      fn: ([x, y, id, type = ""]) => {
        if (!x || !y || !id) return this.lib.add.help;
        if (TheGrid.network[id]) {
          return `<span class="n">${id}</span> already exists.`;
        }

        O(id).create({ x: +x, y: +y }, NODES[type] || Node);
        TheGrid.graph();
        return `created <span class="n">${id}</span> at {${x}, ${y}}`;
      },
    },
    remove: {
      help:
        "remove a node<br><br>syntax: remove <span class=n>{nodeName}</span>",
      fn: ([id]) => {
        if (!id) return this.lib.remove.help;
        if (!TheGrid.network[id]) return notFound(id);

        delete TheGrid.network[id];
        TheGrid.graph();
        return `removed <span class="n">${id}</span>`;
      },
    },
    lock: {
      help:
        "lock onto a node for key-based relocation<br><br>syntax: lock <span class=n>{nodeName}</span>",
      fn: ([id]) => {
        if (!id) return this.lib.lock.help;
        if (!TheGrid.network[id]) return notFound(id);

        this.lock = true;
        this.nodeLock = id;
        return `locked onto <span class="n">${id}</span>. move with arrow keys.`;
      },
    },
    unlock: {
      help: "disengage lock mode",
      fn: (_) => {
        this.lock = false;
        return `unlocked.`;
      },
    },
    move: {
      help:
        "move a node<br><br>syntax: move <span class=n>{nodeName}</span> {x} {y}",
      fn: ([id, x, y]) => {
        if (!id || !x || !y) return this.lib.move.help;
        if (!TheGrid.network[id]) return notFound(id);
        if (isNaN(+x)) return notNum(x, "move");
        else if (isNaN(+y)) return notNum(y, "move");

        TheGrid.network[id].rect.x = +x;
        TheGrid.network[id].rect.y = +y;
        updateMesh(id);
        TheGrid.graph();
        return `moved <span class="n">${id}</span> to {${x}, ${y}}`;
      },
    },
    hor: {
      help:
        "shift a node's position (hor)izontally (x-axis)<br><br>syntax: hor <span class=n>{nodeName}</span> {shiftAmount}",
      fn: ([id, shift]) => {
        if (!id || !shift) return this.lib.hor.help;
        if (!TheGrid.network[id]) return notFound(id);
        if (isNaN(+shift)) return notNum(shift, "hor");

        TheGrid.network[id].rect.x += +shift;
        updateMesh(id);
        TheGrid.graph();
        return `moved <span class="n">${id}</span> to {${
          TheGrid.network[id].rect.x
        }, ${TheGrid.network[id].rect.y}}`;
      },
    },
    ver: {
      help:
        "shift a node's position (ver)tically (y-axis)<br><br>syntax: ver <span class=n>{nodeName}</span> {shiftAmount}",
      fn: ([id, shift]) => {
        if (!id || !shift) return this.lib.ver.help;
        if (!TheGrid.network[id]) return notFound(id);
        if (isNaN(+shift)) return notNum(shift, "ver");

        TheGrid.network[id].rect.y += +shift;
        updateMesh(id);
        TheGrid.graph();
        return `moved <span class="n">${id}</span> to {${
          TheGrid.network[id].rect.x
        }, ${TheGrid.network[id].rect.y}}`;
      },
    },
    query: {
      help: "query slides and nodes<br><br>syntax: query {expression}",
      fn: ([search]) => {
        if (!search) return this.lib.query.help;
        const r = new RegExp(search);
        const slides = Object.keys(SLIDES).filter((x) => r.test(x));
        const nodes = Object.keys(TheGrid.network).filter((x) => r.test(x));
        let results = "";

        if (slides.length > 0) results += `slides: ${slides.join(", ")}<br>`;
        if (nodes.length > 0) results += `nodes: ${nodes.join(", ")}<br>`;
        if (SLIDES[search]) results += `slide found: ${search}<br>`;
        if (TheGrid.network[search]) results += `node found: ${search}<br>`;

        return results === "" ? "no results." : results;
      },
    },
    connect: {
      help:
        "connect <span class=n>{nodeA}</span> to <span class=n>{nodeB}</span><br><br>syntax: connect <span class=n>{nodeA}</span> <span class=n>{nodeB}</span>",
      fn: ([a, b]) => {
        if (!a || !b) return this.lib.connect.help;
        const nodes = b.split(",");
        if (!TheGrid.network[a]) return notFound(a);
        for (const node of nodes) {
          if (!TheGrid.network[node]) {
            return notFound(node);
          }
        }
        O(a).connect(nodes);
        TheGrid.graph();
        return `<span class="n">${a}</span> connected to <span class="n">${b}</span>`;
      },
    },
    syphon: {
      help:
        "set up syphon route from <span class=n>{nodeB}</span> to <span class=n>{nodeA}</span><br><br>syntax: syphon <span class=n>{nodeA}</span> <span class=n>{nodeB}</span>",
      fn: ([a, b]) => {
        if (!a || !b) return this.lib.syphon.help;
        O(a).syphon(b.split(","));
        TheGrid.graph();
        return `<span class="n">${a}</span> syphoning from <span class="n">${b}</span>`;
      },
    },
    // loc: {
    //   help:
    //     "print node's coordinates<br><br>syntax: loc <span class=n>{nodeName}</span>",
    //   fn: ([id]) => {
    //     if (!id) return this.lib.loc.help;
    //     if (!TheGrid.network[id]) return notFound(id);

    //     const { x, y } = TheGrid.network[id].rect;
    //     return `<span class="n">${id}</span> is at {${x}, ${y}}`;
    //   },
    // },
    nodes: {
      help: "list nodes",
      fn: (_) => {
        let result = "";
        let counter = 0;
        for (const x of Object.keys(TheGrid.network).sort()) {
          const node = TheGrid.network[x];
          counter++;
          result += `<span class="n">${x} ${
            node.note ? " [*]" : ""
          }</span> {${node.rect.x}, ${node.rect.y}}<br>`;
        }
        return `${counter} nodes<br>${result}`;
      },
    },
    routes: {
      help: "list routes",
      fn: (_) => {
        let result = "";
        let counter = 0;
        for (const x in TheGrid.network) {
          const node = TheGrid.network[x];
          for (const id in node.ports) {
            const port = node.ports[id];
            for (const routeId in port.routes) {
              const { route } = port.routes[routeId];
              if (!route) continue;
              counter++;
              result += `<span class="n">${port.host.id}</span> ${
                (port.id === "out" ? "-" : port.id === "request" ? "<" : "~") +
                (route.id === "in" ? ">" : route.id === "answer" ? "-" : "~")
              } <span class="n">${route.host.id}</span><br>`;
            }
          }
        }
        return `${counter} routes<br>${result}`;
      },
    },
    "clear": {
      help: "clear the graph",
      fn: (_) => {
        TheGrid.network = {};
        document.getElementById("main").innerHTML = "";
        return rnEl([
          "poof!",
          "ta-da! it's &hellip; gone &hellip; ",
          "all clear.",
          "cleared.",
          "<em>it's quiet uptown.</em>",
          "the world is quiet here.",
          "it's so minimalist!",
          "(╯°□°）╯︵ ┻━┻",
        ]);
      },
    },
    palette: {
      help:
        "set a colour palette to use<br><br>syntax: palette {paletteName|random}<br>palette {bg} {fg} {mid} {acc}",
      fn: (args) => {
        if (!args[0]) return this.lib.palette.help;
        if (args[0] === "list") {
          return Object.keys(PALETTES).sort().reduce(
            (x, y) => x + `${displayPalette(PALETTES[y])} ${y}<br>`,
            "",
          );
        }
        let [bg, fg, mid, acc] = args[0] === "random"
          ? PALETTES[rnEl(Object.keys(PALETTES))]
          : PALETTES[args[0]]
          ? PALETTES[args[0]]
          : args;
        let msg = `palette: ${
          displayPalette([bg, fg, mid, acc])
        } ${bg} ${fg} ${mid} ${acc} `;
        if (!bg || !fg || !mid || !acc) {
          [bg, fg, mid, acc] = PALETTES.avanier;
          msg = "invalid palette. reverted to default.";
        }
        const root = document.querySelector(":root");
        root.style.setProperty("--bg", bg);
        root.style.setProperty("--fg", fg);
        root.style.setProperty("--mid", mid);
        root.style.setProperty("--acc", acc);
        localStorage.setItem("theme", JSON.stringify([bg, fg, mid, acc]));
        return msg;
      },
    },
  };

  this.parse = () => {
    const input = this.input.value.trim();
    const [command, ...args] = input.split(" ");
    this.output.innerHTML = command === ""
      ? "..."
      : this.lib[command]
      ? this.lib[command].fn(args)
      : `unknown command: '${command}'`;
    if (this.history[this.history.length - 1] !== input) {
      this.history.push(input);
    }
    localStorage.setItem("histoire", JSON.stringify(this.history));
    this.input.placeholder = input;
    this.input.value = "";
    this.input.focus();
  };

  this.install = () => {
    this.el.onsubmit = () => this.parse();

    this.el.onkeydown = (e) => {
      if (this.lock) {
        e.preventDefault();
        switch (e.code) {
          case "ArrowUp":
            TheGrid.network[this.nodeLock].rect.y--;
            break;
          case "ArrowDown":
            TheGrid.network[this.nodeLock].rect.y++;
            break;
          case "ArrowLeft":
            TheGrid.network[this.nodeLock].rect.x--;
            break;
          case "ArrowRight":
            TheGrid.network[this.nodeLock].rect.x++;
            break;
          case "Enter":
          case "Backspace":
          case "Escape":
            this.lock = false;
            this.output.value = "unlocked.";
          default:
            break;
        }
        updateMesh(this.nodeLock);
        TheGrid.graph();
        return;
      }
      switch (e.code) {
        case "ArrowUp":
          this.historyIndex++;
          if (this.historyIndex > this.history.length) this.historyIndex = 0;
          this.input.value =
            this.history[this.history.length - this.historyIndex];
          break;
        case "ArrowDown":
          this.historyIndex--;
          if (this.historyIndex < 1) this.historyIndex = 1;
          this.input.value =
            this.history[this.history.length - this.historyIndex];
          break;
        default:
          break;
      }

      if (e.shiftKey) {
        switch (e.code) {
          case "Comma":
            this.slideIndex--;
            if (this.slideIndex < 0) {
              this.slideIndex = Object.keys(SLIDES).length - 1;
            }
            this.output.innerHTML = this.lib.load.fn([
              Object.keys(SLIDES)[this.slideIndex],
            ]);
            break;
          case "Period":
            this.slideIndex++;
            if (this.slideIndex > Object.keys(SLIDES).length - 1) {
              this.slideIndex = 0;
            }
            this.output.innerHTML = this.lib.load.fn([
              Object.keys(SLIDES)[this.slideIndex],
            ]);
            break;
          default:
            break;
        }
      }
    };

    let logs = [];

    if (Object.prototype.hasOwnProperty.call(localStorage, "histoire")) {
      this.history = JSON.parse(localStorage.getItem("histoire"));
      logs.push(
        `${this.history.length} history items found.`,
      );
    } else {
      logs.push("no local history found. setting a new slate...");
      this.history = [];
      localStorage.setItem("histoire", "[]");
    }

    logs.push(`${Object.keys(this.lib).length} available commands.`);

    const setTheme = localStorage.getItem("theme");
    this.lib.palette.fn(setTheme ? JSON.parse(setTheme) : PALETTES["avanier"]);
    logs.push(
      setTheme
        ? `loaded theme: ${displayPalette(JSON.parse(setTheme))}`
        : "loaded default theme.",
    );

    this.input.focus();
    logs.push("<br>terminal ready.<br>type 'commands' for a list of commands.");
    this.output.innerHTML = logs.join("<br>");
  };
}

new Terminal().install();
