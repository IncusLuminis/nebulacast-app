// ui/components/side_toolbar.js
import { el, dispatch, svgToNode } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { SIDE_TOOLBAR_CSS } from "./side_toolbar.css.js";

export class UISideToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, SIDE_TOOLBAR_CSS);

    this._items = [];
    this._wrap = el("div", { class: "surface wrap" });
    this._list = el("div", { class: "list" });

    this.shadowRoot.append(this._wrap);
    this._wrap.append(this._list);

    this._list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      if (btn.getAttribute("aria-disabled") === "true") return;

      const id = btn.getAttribute("data-id");
      const kind = btn.getAttribute("data-kind") || "toggle";

      // anchorEl должен быть именно кнопкой (div.btn)
      const anchorEl = btn;

      if (kind === "action") {
        dispatch(this, "toolbar:action", { id, anchorEl });
        return;
      }

      // toggle behavior (kept for compatibility)
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", pressed ? "false" : "true");

      dispatch(this, "toolbar:toggle", { id, pressed: !pressed, anchorEl });
      dispatch(this, "layers:toggle", { id, checked: !pressed }); // legacy
      dispatch(this, "layers:click", { id }); // legacy
    });
  }

  set items(v) {
    this._items = Array.isArray(v) ? v : [];
    this._render();
  }
  get items() {
    return this._items;
  }

  setPressed(id, pressed) {
    const btn = this.shadowRoot.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (btn) btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  }

  _render() {
    this._list.innerHTML = "";
    for (const it of this._items) {
      const iconNode =
        typeof it.icon === "string" && it.icon.trim().startsWith("<svg")
          ? svgToNode(it.icon, "ico")
          : el("span", { class: "ico" }, [String(it.icon || "•")]);

      const kind = it.kind || "toggle";

      const btn = el(
        "div",
        {
          class: "btn",
          role: "button",
          tabIndex: "0",
          "data-id": it.id,
          "data-kind": kind,
          "aria-pressed": it.pressed ? "true" : "false",
          "aria-disabled": it.disabled ? "true" : "false",
          title: it.label || it.title || it.id,
        },
        [iconNode]
      );

      this._list.appendChild(btn);
    }
  }
}

if (!customElements.get("ui-side-toolbar")) {
  customElements.define("ui-side-toolbar", UISideToolbar);
}