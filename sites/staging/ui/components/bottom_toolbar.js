// ui/components/bottom_toolbar.js
import { el, dispatch, svgToNode } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { BOTTOM_TOOLBAR_CSS } from "./bottom_toolbar.css.js";

export class UIBottomToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    mountShadowStyle(this.shadowRoot, BOTTOM_TOOLBAR_CSS);

    this._items = [];
    this._bar = el("div", { class: "surface bar", role: "toolbar" });
    this.shadowRoot.append(this._bar);

    this._bar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn || btn.disabled) return;

      const id = btn.getAttribute("data-id");
      const kind = btn.getAttribute("data-kind") || "button";

      if (kind === "toggle") {
        const pressed = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", pressed ? "false" : "true");
        dispatch(this, "toolbar:toggle", { id, pressed: !pressed });
      } else {
        dispatch(this, "toolbar:click", { id });
      }
    });
  }

  set items(v) {
    this._items = Array.isArray(v) ? v : [];
    this._render();
  }
  get items() { return this._items; }

  setPressed(id, pressed) {
    const btn = this.shadowRoot.querySelector(`button[data-id="${CSS.escape(id)}"]`);
    if (btn) btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  }

  _render() {
    this._bar.innerHTML = "";
    for (const it of this._items) {
      const kind = it.kind || "button";

      const iconNode =
        typeof it.icon === "string" && it.icon.trim().startsWith("<svg")
          ? svgToNode(it.icon, "ico")
          : el("span", { class: "ico" }, [String(it.icon || "•")]);

      const btn = el("button", {
        type: "button",
        "data-id": it.id,
        "data-kind": kind,
        "aria-label": it.label || it.title || it.id,
        title: it.title || "",
        "aria-pressed": kind === "toggle" ? (it.pressed ? "true" : "false") : null,
        disabled: it.disabled ? true : false
      }, [iconNode]);

      this._bar.appendChild(btn);
    }
  }
}

if (!customElements.get("ui-bottom-toolbar")) {
  customElements.define("ui-bottom-toolbar", UIBottomToolbar);
}
