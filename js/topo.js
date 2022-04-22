function Topo(opts = {}) {
  this.klass = opts.className || "topo";

  this.create = (target) => {
    this.element = target;
    const span = document.createElement("span");
    span.id = this.klass + "_" + this.element.id;
    span.style.position = "absolute";
    span.className = "topo";
    span.innerHTML = this.element.dataset.tooltip;
    document.getElementById("main").appendChild(span);
    this.tip = document.getElementById(this.klass + "_" + this.element.id);
  };

  this.move = (x, y) => {
    const n = 16;
    Object.assign(this.tip.style, {
      top: `${y + n}px`,
      left: `${x + n}px`,
    });
  };

  this.destroy = () => {
    if (!this.tip) return;
    this.tip.remove();
    this.tip = null;
    if (this.element) this.element = null;
  };

  this.handleEvent = ({ pageX, pageY, target, type }) => {
    switch (type) {
      case "mouseenter":
        this.create(target);
        break;
      case "mouseleave":
        this.destroy();
        break;
      case "mousemove":
        this.move(pageX, pageY);
        break;
      default:
        return;
    }
  };

  this.init = () => {
    const elements = document.querySelectorAll(`.${this.klass}`);
    if (!elements) return;
    this.elements = elements;

    for (const x of elements) {
      x.addEventListener("mouseenter", this, false);
      x.addEventListener("mousemove", this, false);
      x.addEventListener("mouseleave", this, false);
    }
  };
}
