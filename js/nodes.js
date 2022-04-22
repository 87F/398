function Node(id, rect = { x: 0, y: 0, w: 2, h: 2 }) {
  this.id = id;
  this.ports = {};
  this.rect = rect;
  this.parent = null;
  this.children = [];
  this.label = id;
  this.name = this.constructor.name.toLowerCase();
  this.glyph = "";
  this.note = "";

  this.setup = function (pos) {
    this.ports.left = new this.Port(this, "left");
    this.ports.right = new this.Port(this, "right");
    this.ports.top = new this.Port(this, "top");
    this.ports.bottom = new this.Port(this, "bottom");
    this.rect.x = pos.x;
    this.rect.y = pos.y;
  };

  this.create = function (pos = { x: 0, y: 0 }, Type, ...params) {
    if (!Type) return this;
    const node = new Type(this.id, rect, ...params);
    node.setup(pos);
    TheGrid.add(node);
    return node;
  };

  this.attach = function (note) {
    this.note = note;
    return this;
  };
  this.alias = function (label) {
    this.label = label;
    return this;
  };

  this.connect = function (q, syphon, target_port = undefined) {
    if (q instanceof Array) {
      for (const id in q) {
        this.connect(q[id], syphon);
      }
    } else if (O(q)) {
      const port = (syphon ? this.ports.bottom : this.ports.right);
      const target = target_port
        ? O(q).ports[target_port]
        : syphon
        ? O(q).ports.top
        : O(q).ports.left;
      if (!port) {
        console.warn(`Unknown: ${q}`);
        return;
      }
      port.connect(target);
    } else {
      console.warn(`Unknown ${q}`);
    }
    return this;
  };

  this.syphon = function (q) {
    this.connect(q, true);
    return this;
  };

  this.Port = function (host, type = undefined) {
    this.host = host;
    this.type = type;
    this.routes = [];

    this.connect = function (port) {
      if (!port) {
        console.warn(`unknown port from: ${this.host.id}`);
        return;
      }
      this.routes.push({ route: port });
    };
  };
}

const NODES = {
  Service: {
    Identity: function (id, rect) {
      Node.call(this, id, rect);
      this.fill = "var(--acc)";
      this.glyph = "M150,240 L150,240 L240,150 L150,60 L60,150 L150,240 ";
    },
    Payment: function (id, rect) {
      Node.call(this, id, rect);
      this.fill = "var(--acc)";
      this.glyph =
        "M155,65 A90,90 0 0,1 245,155 A90,90 0 0,1 155,245 A90,90 0 0,1 65,155 A90,90 0 0,1 155,65 Z";
    },
    Log: function (id, rect) {
      Node.call(this, id, rect);
      this.fill = "var(--acc)";
      this.glyph = "M60,60 L60,60 L60,60 L60,240 L240,240 L240,60 L60,60 ";
    },
  },
  Mesh: function (id, rect, children) {
    Node.call(this, id, rect);
    this.name = "meshnode";

    this.update = function () {
      const bounds = { x: 0, y: 0 };
      for (const id in this.children) {
        const { x, y } = this.children[id].rect;
        if (x > bounds.x) bounds.x = x;
        if (y > bounds.y) bounds.y = y;
      }
      this.rect.w = bounds.x + 6;
      this.rect.h = bounds.y + 6;
    };

    for (const cid in children) {
      children[cid].parent = this;
      this.children.push(children[cid]);
      this.update();
    }
  },
};

const GLYPHS = {
  Blank:
    "M90,135 A15,15 0 0,1 105,150 A15,15 0 0,1 90,165 A15,15 0 0,1 75,150 A15,15 0 0,1 90,135 M150,135 A15,15 0 0,1 165,150 A15,15 0 0,1 150,165 A15,15 0 0,1 135,150 A15,15 0 0,1 150,135 M210,135 A15,15 0 0,1 225,150 A15,15 0 0,1 210,165 A15,15 0 0,1 195,150 A15,15 0 0,1 210,135",
  Password:
    "M150,60 L150,60 L150,240 M90,90 L90,90 L210,210 M90,210 L90,210 L210,90 M60,150 L60,150 L240,150",
  Log:
    "M210,150 L210,150 L90,150 M90,105 L90,105 L210,105 M90,195 L90,195 L210,195",
  Router:
    "M150,60 L150,60 L150,240 M60,150 L60,150 L240,150 M240,60 L240,60 L240,240 M60,60 L60,60 L60,240",
  Database:
    "M150,60 A90,30 0 0,0 60,90 A90,30 0 0,0 150,120 A90,30 0 0,0 240,90 A90,30 0 0,0 150,60 M60,90 L60,195 A90,45 0 0,0 150,240 A90,45 0 0,0 240,195 L240,90 M60,150 A90,30 0 0,0 150,180 A90,30 0 0,0 240,150",
  Controller:
    "M150,60 A90,90 0 0,0 60,150 A90,90 0 0,0 150,240 A90,90 0 0,0 240,150 A90,90 0 0,0 150,60 M150,90 A60,60 0 0,0 90,150 A60,60 0 0,0 150,210 A60,60 0 0,0 210,150 M150,90 A60,60 0 0,1 210,150",
  Permission:
    "M195,105 A45,45 0 0,0 150,150 A45,45 0 0,0 195,195 A45,45 0 0,0 240,150 A45,45 0 0,0 195,105 M150,150 L150,150 L60,150 L60,180 M105,150 L105,150 L105,180",
  Endpoint: "M150,240 L150,240 L240,60 M60,240 L60,240 L150,60",
  User:
    "M150,60 A45,45 0 0,0 105,105 A45,45 0 0,0 150,150 A45,45 0 0,0 195,105 A45,45 0 0,0 150,60 M120,150 Q60,180 60,240 M180,150 Q240,180 240,240 M60,240 L60,240 L240,240",
  Email:
    "M60,90 L60,90 L60,210 L240,210 L240,90 L60,90 L60,90 L150,165 L240,90",
  Phone:
    "M90,180 A30,30 0 0,0 120,150 A30,30 0 0,0 90,120 A30,30 0 0,0 60,150 A30,30 0 0,0 90,180 L210,180 A30,30 0 0,0 240,150 A30,30 0 0,0 210,120 A30,30 0 0,0 180,150 A30,30 0 0,0 210,180",
  MFA:
    "M150,60 A90,90 0 0,0 60,150 A90,90 0 0,0 150,240 A90,90 0 0,0 240,150 A90,90 0 0,0 150,60 M150,90 A60,60 0 0,0 90,150 A60,60 0 0,0 150,210 A60,60 0 0,0 210,150 A60,60 0 0,0 150,90 M150,120 A30,30 0 0,0 120,150 A30,30 0 0,0 150,180 A30,30 0 0,0 180,150 A30,30 0 0,0 150,120",
  Pin:
    "M150,60 L150,60 L90,120 L150,180 L210,120 L150,60 M150,180 L150,180 L150,240",
  Server:
    "M60,60 L60,60 L240,60 L240,240 L60,240 L60,60 M60,120 L60,120 L240,120 M60,180 L60,180 L240,180",
  Tenant:
    "M150,60 L150,60 L60,150 L150,240 L240,150 L150,60 M60,150 L60,150 L240,150",
  Role:
    "M150,60 A90,90 0 0,0 60,150 A90,90 0 0,0 150,240 A90,90 0 0,0 240,150 A90,90 0 0,0 150,60 M150,90 L150,90 L90,150 L150,210 L210,150 L150,90",
  Cashback:
    "M120,60 L120,60 L120,240 L240,240 L240,60 L120,60 M120,150 L120,150 L60,150 L90,120 M60,150 L60,150 L90,180",
  Withdrawal:
    "M60,60 L60,60 L240,60 L240,180 L60,180 L60,60 M150,180 L150,180 L150,240 M120,210 L120,210 L150,240 L180,210",
  Deposit:
    "M60,120 L60,120 L240,120 L240,240 L60,240 L60,120 M150,120 L150,120 L150,60 M120,90 L120,90 L150,60 L180,90",
  Payment:
    "M150,60 A90,90 0 0,0 60,150 A90,90 0 0,0 150,240 A90,90 0 0,0 240,150 A90,90 0 0,0 150,60 M150,90 A60,60 0 0,0 90,150 A60,60 0 0,0 150,210",
  Refund:
    "M150,90 A60,60 0 0,1 210,150 A60,60 0 0,1 150,210 A60,60 0 0,1 90,150 M165,60 L165,60 L135,90 L165,120",
  Void:
    "M150,60 A90,90 0 0,0 60,150 A90,90 0 0,0 150,240 A90,90 0 0,0 240,150 A90,90 0 0,0 150,60 M90,90 L90,90 L210,210 M90,210 L90,210 L210,90",
};

for (const x in GLYPHS) {
  NODES[x] = function (id, rect) {
    Node.call(this, id, rect);
    this.glyph = GLYPHS[x];
  };
}
