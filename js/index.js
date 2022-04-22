const windowWidth = window.innerWidth || document.documentElement.clientWidth ||
  document.body.clientWidth;

const windowHeight = window.innerHeight ||
  document.documentElement.clientHeight || document.body.clientHeight;

function Grid() {
  this.lib = {};
  this.network = {};

  this.add = (node) => {
    this.network[node.id] = node;
  };

  this.graph = () => {
    const network = this.network;
    const resolution = 20;

    this.el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.el.id = "map";
    document.getElementById("main").innerHTML = "";

    let savedView = sessionStorage.getItem("viewBox");
    this.el.setAttribute(
      "viewBox",
      savedView || `0 0 ${windowWidth} ${windowHeight}`,
    );
    document.getElementById("main").appendChild(this.el);

    this.el.innerHTML =
      `<g id="routes">${Object.keys(network).reduce(
        (acc, val) => `${acc}${drawRoutes(network[val])}`,
        "",
      )}</g><g id="nodes">${Object.keys(network).reduce(
        (acc, val) => `${acc}${drawNode(network[val])}`,
        "",
      )}</g>`;

    new Topo().init();

    function drawRoutes(node) {
      let html = "";
      for (const id in node.ports) {
        const port = node.ports[id];
        for (const routeId in port.routes) {
          const { route, line_type, origin } = port.routes[routeId];
          if (!route) continue;
          console.log(port.routes[routeId]);
          html += route ? drawConnection(port, route, line_type, origin) : "";
        }
      }
      return html;
    }

    function drawNode(node) {
      const rect = getRect(node);
      const borderRadius = 8;
      return `
      <g class="node ${node.name} ${
        node.note ? "topo" : ""
      }" id="node_${node.id}" ${node.note ? `data-tooltip="${node.note}"` : ""}>
        <rect rx="${borderRadius}" ry="${borderRadius}" x=${rect.x} y=${
        rect.y - (resolution / 2)
      } width="${rect.w}" height="${rect.h}" class='${
        node.children.length === 0 ? "fill" : ""
      }' fill='${node.fill || "var(--mid)"}' stroke='${
        node.fill || "var(--mid)"
      }'/>
        <text x="${
        rect.x + (resolution * 0.3) - (node.label.length * 0.5)
      }" y="${rect.y + rect.h + (resolution * 0.2)}">${node.label}</text>
        ${drawGlyph(node)}
      </g>`;
    }

    function drawGlyph(node) {
      const rect = getRect(node);
      return node.glyph
        ? `<path class="glyph" transform="translate(${
          rect.x + (resolution / 4)
        },${rect.y - (resolution / 4)}) scale(0.1)" d="${node.glyph}"/>`
        : "";
    }

    function drawConnection(a, b) {
      return a.type === "right" ? drawDashedLine(a, b) : drawDottedLine(a, b);
    }

    function drawDashedLine(a, b) {
      const posA = getPortPosition(a);
      const posB = getPortPosition(b);
      const posM = middle(posA, posB);
      const posC1 = { x: (posM.x + (posA.x + resolution)) / 2, y: posA.y };
      const posC2 = { x: (posM.x + (posB.x - resolution)) / 2, y: posB.y };

      console.log(posA, posB, posM, posC1, posC2);

      return `
      <path d="
        M${posA.x},${posA.y} L${posA.x},${posA.y} 
        Q${posC1.x},${posC1.y} ${posM.x},${posM.y} 
        Q${posC2.x},${posC2.y} ${posB.x},${posB.y} 
        L${posB.x},${posB.y}
      " class="route output"/>`;
    }

    function drawDottedLine(a, b) {
      const posA = getPortPosition(a);
      const posB = getPortPosition(b);

      return `<path d="
        M${posA.x},${posA.y} 
        L${posA.x},${posA.y + resolution} 
        L${posB.x},${posA.y + resolution} 
        L${posB.x},${posB.y}
      " class="route request"/>`;
    }

    function getPortPosition(port) {
      const rect = getRect(port.host);
      let offset = { x: 0, y: 0 };

      switch (port.type) {
        case "right":
          offset = { x: rect.w, y: (rect.h - (resolution * 1.5)) };
          break;
        case "left":
          offset = { x: 0, y: resolution / 2 };
          break;
        case "bottom":
          offset = { x: resolution, y: -resolution * 0.5 };
          break;
        case "top":
          offset = { x: (rect.w - (resolution)), y: (rect.h - (resolution / 2)) };
          break;
        default:
          return;
      }

      return { x: rect.x + offset.x, y: rect.y + offset.y };
    }

    function getRect(node) {
      const w = node.rect.w * resolution;
      const h = node.rect.h * resolution;
      let x = node.rect.x * resolution;
      let y = node.rect.y * resolution;

      if (node.parent) {
        const offset = getRect(node.parent);
        x += offset.x;
        y += offset.y;
      }

      return { x: x + (2 * resolution), y: y + (2 * resolution), w: w, h: h };
    }

    function middle(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    new Cursor().install(this);
  };
}

const CONFIG = {
  listNodesOnLoad: false,
  topoModuleEnabled: true,
  censorMode: false,
  lockNodesOnClick: true,
  statsOnRender: true,
  palette: "avanier",
};

const TheGrid = new Grid();
