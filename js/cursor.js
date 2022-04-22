function Cursor() {
  this.host = null;
  this.pos = { x: 0, y: 0 };
  this.offset = { x: 0, y: 0 };
  this.origin = null;
  this.target = document.getElementById("map");

  this.update = function () {
    const v =
      `${-(this.offset.x)} ${-(this.offset.y)} ${windowWidth} ${windowHeight}`;
    document.getElementById("map").setAttribute("viewBox", v);
    sessionStorage.setItem("viewBox", v);
  };

  this.touch = function (pos, click = null) {
    if (click === true) {
      this.origin = pos;
      return;
    }

    if (click === null) {
      this.origin = null;
      return;
    }

    if (this.origin) {
      this.offset.x += parseInt(pos.x - this.origin.x);
      this.offset.y += parseInt(pos.y - this.origin.y);
      this.update();
      this.origin = pos;
    }

    this.pos = pos;
  };

  this.scan = function (target) {
    const id = target.slice(5);
    const { rect } = TheGrid.network[id];
    const { x, y } = rect;
    document.getElementById("extra").innerHTML = `[${id}] { ${x}, ${y} }`;
  };

  this.install = function (host) {
    this.host = host;

    this.target.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.touch({ x: e.clientX, y: e.clientY }, true);
    });

    this.target.addEventListener("mousemove", (e) => {
      e.preventDefault();
      this.touch({ x: e.clientX, y: e.clientY }, false);
      if (
        e.target.parentElement.className &&
        e.target.parentElement.className.baseVal.split(" ")[0] === "node"
      ) {
        this.scan(e.target.parentElement.id);
      }
    });

    this.target.addEventListener("mouseup", (e) => {
      e.preventDefault();
      this.touch({ x: e.clientX, y: e.clientY });

      // hacky af. change sometime
      if (
        e.target.parentElement.className &&
        e.target.parentElement.className.baseVal.split(" ")[0] === "node"
      ) {
        const id = e.target.parentElement.id.slice(5);
        document.getElementById("input").value = `lock ${id}`;
        document.getElementById("input").focus();
      }
    });
  };
}
