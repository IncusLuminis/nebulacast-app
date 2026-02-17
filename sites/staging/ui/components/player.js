// ui/components/player.js
import { el, dispatch, fmtTimeMMSS } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { PLAYER_CSS } from "./player.css.js";

export class UIPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, PLAYER_CSS);

    this._state = { playing: false, current: 0, duration: 0 };

    this._wrap = el("div", { class: "surface wrap" });

    this._btnRow = el("div", { class: "btn-row" });
    this._btnFirst = el("button", { type: "button", title: "First",      "data-action": "seek-first"   }, ["|◀"]);
    this._btnFB    = el("button", { type: "button", title: "FB",         "data-action": "seek-back"    }, ["◀◀"]);
    this._btnPlay  = el("button", { type: "button", title: "Play/Pause", "data-action": "toggle-play"  }, ["▶"]);
    this._btnFF    = el("button", { type: "button", title: "FF",         "data-action": "seek-forward" }, ["▶▶"]);
    this._btnNow   = el("button", { type: "button", title: "Now",        "data-action": "seek-now"     }, ["Now"]);

    this._seek = el("input", { type: "range", min: "0", max: "1000", value: "0", step: "1", "data-action": "seek", class: "seek" });

    this._btnRow.append(this._btnFirst, this._btnFB, this._btnPlay, this._btnFF, this._btnNow);
    this._wrap.append(this._btnRow, this._seek);
    this.shadowRoot.append(this._wrap);

    this._wrap.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");
      if (act === "toggle-play") {
        this.setPlaying(!this._state.playing);
        dispatch(this, "player:toggle", { playing: this._state.playing });
      } else if (act === "seek-first") {
        dispatch(this, "player:seek", { position01: 0 });
      } else if (act === "seek-back") {
        dispatch(this, "player:seek-back", {});
      } else if (act === "seek-forward") {
        dispatch(this, "player:seek-forward", {});
      } else if (act === "seek-now") {
        dispatch(this, "player:seek-now", {});
      }
    });

    this._seek.addEventListener("input", () => {
      const pos = Number(this._seek.value) / 1000;
      dispatch(this, "player:seek", { position01: pos });
    });
  }

  setPlaying(v) {
    this._state.playing = !!v;
    this._btnPlay.textContent = this._state.playing ? "⏸" : "▶";
  }

  setTime(currentSec, durationSec) {
    this._state.current = Math.max(0, Number(currentSec) || 0);
    this._state.duration = Math.max(0, Number(durationSec) || 0);
    const p = this._state.duration > 0 ? (this._state.current / this._state.duration) : 0;
    this._seek.value = String(Math.max(0, Math.min(1000, Math.round(p * 1000))));
  }
}

if (!customElements.get("ui-player")) {
  customElements.define("ui-player", UIPlayer);
}