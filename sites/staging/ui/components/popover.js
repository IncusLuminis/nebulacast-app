// ui/components/popover.js
import { el, dispatch, clamp } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { POPOVER_CSS } from "./popover.css.js";

export class UIPopover extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, POPOVER_CSS);

    this._isOpen = false;
    this._anchor = null;
    this._placement = "top";
    this._offset = 8;
    this._boundaryEl = null;

    this._panel = el("div", { class: "surface panel" });
    this._content = el("div", { class: "content" });
    this.shadowRoot.append(this._panel);
    this._panel.append(this._content);

    this._onDocPointerDown = (e) => {
      if (!this._isOpen) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (path.includes(this)) return;
      if (this._anchor && (path.includes(this._anchor) || this._anchor.contains(e.target))) return;
      this.close("outside");
    };
    this._onDocKeyDown = (e) => {
      if (!this._isOpen) return;
      if (e.key === "Escape") this.close("escape");
    };
    this._onReposition = () => {
      if (this._isOpen) this._position();
    };
  }

  set content(v) {
    this._content.innerHTML = "";
    if (v == null) return;
    if (typeof v === "string") this._content.innerHTML = v;
    else if (v instanceof Node) this._content.appendChild(v);
    else this._content.textContent = String(v);
    if (this._isOpen) this._position();
  }

  open(anchorEl, opts = {}) {
    if (!anchorEl || !(anchorEl instanceof Element)) return;

    this._anchor = anchorEl;
    this._placement = opts.placement || this._placement;
    this._offset = Number(opts.offset ?? this._offset);
    this._boundaryEl = opts.boundaryEl instanceof Element ? opts.boundaryEl : null;

    this.style.display = "block";
    this._isOpen = true;

    // open animation retrigger
    this._panel.classList.remove("is-open");
    void this._panel.offsetWidth;
    this._panel.classList.add("is-open");

    this._position();

    document.addEventListener("pointerdown", this._onDocPointerDown, true);
    document.addEventListener("keydown", this._onDocKeyDown);
    window.addEventListener("resize", this._onReposition);
    window.addEventListener("scroll", this._onReposition, true);

    dispatch(this, "popover:open", {});
  }

  close(reason = "close") {
    if (!this._isOpen) return;
    this._isOpen = false;

    this._panel.classList.remove("is-open");
    this.style.display = "none";

    document.removeEventListener("pointerdown", this._onDocPointerDown, true);
    document.removeEventListener("keydown", this._onDocKeyDown);
    window.removeEventListener("resize", this._onReposition);
    window.removeEventListener("scroll", this._onReposition, true);

    dispatch(this, "popover:close", { reason });
  }

  _position() {
    if (!this._anchor) return;

    const aAbs = this._anchor.getBoundingClientRect();
    const bAbs = this._boundaryEl ? this._boundaryEl.getBoundingClientRect() : null;

    // panel rect (host is visible)
    const r = this._panel.getBoundingClientRect();
    const w = r.width || 0;
    const h = r.height || 0;
    const off = this._offset;

    const a = bAbs
      ? {
          left: aAbs.left - bAbs.left,
          top: aAbs.top - bAbs.top,
          right: aAbs.right - bAbs.left,
          bottom: aAbs.bottom - bAbs.top,
          width: aAbs.width,
          height: aAbs.height,
        }
      : aAbs;

    let x = 0, y = 0;

    if (this._placement === "top") {
      x = a.left + a.width / 2 - w / 2;
      y = a.top - h - off;
    } else if (this._placement === "bottom") {
      x = a.left + a.width / 2 - w / 2;
      y = a.bottom + off;
    } else if (this._placement === "left") {
      x = a.left - w - off;
      y = a.top + a.height / 2 - h / 2;
    } else {
      x = a.right + off;
      y = a.top + a.height / 2 - h / 2;
    }

    const pad = 8;
    if (bAbs) {
      x = clamp(x, pad, bAbs.width - w - pad);
      y = clamp(y, pad, bAbs.height - h - pad);
    } else {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      x = clamp(x, pad, vw - w - pad);
      y = clamp(y, pad, vh - h - pad);
    }

    this.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
}

if (!customElements.get("ui-popover")) {
  customElements.define("ui-popover", UIPopover);
}