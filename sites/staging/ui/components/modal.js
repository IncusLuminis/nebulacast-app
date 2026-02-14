// ui/components/modal.js
import { el, dispatch } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { MODAL_CSS } from "./modal.css.js";

export class UIModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, MODAL_CSS);

    this._overlay = el("div", { class: "overlay" });
    this._dlg = el("div", { class: "surface dlg", role: "dialog", "aria-modal": "true" });
    this._head = el("div", { class: "head" });
    this._title = el("div", { class: "title" }, [""]);
    this._btnClose = el("button", { class: "close", type: "button", "aria-label": "Close" }, ["✕"]);
    this._body = el("div", { class: "body" });

    this.shadowRoot.append(this._overlay, this._dlg);
    this._dlg.append(this._head, this._body);
    this._head.append(this._title, this._btnClose);

    this._onKeyDown = (e) => {
      if (e.key === "Escape") this.close("escape");
    };

    this._overlay.addEventListener("click", () => this.close("overlay"));
    this._btnClose.addEventListener("click", () => this.close("button"));
  }

  set title(v) { this._title.textContent = String(v || ""); }
  get title() { return this._title.textContent; }

  set content(v) {
    this._body.innerHTML = "";
    if (v == null) return;
    if (typeof v === "string") this._body.innerHTML = v;
    else if (v instanceof Node) this._body.appendChild(v);
    else this._body.textContent = String(v);
  }

  open(opts = {}) {
    if (opts.title != null) this.title = opts.title;
    if (opts.content != null) this.content = opts.content;

    this.style.display = "block";
    document.addEventListener("keydown", this._onKeyDown);
    dispatch(this, "modal:open", {});
  }

  close(reason = "close") {
    this.style.display = "none";
    document.removeEventListener("keydown", this._onKeyDown);
    dispatch(this, "modal:close", { reason });
  }
}

if (!customElements.get("ui-modal")) {
  customElements.define("ui-modal", UIModal);
}