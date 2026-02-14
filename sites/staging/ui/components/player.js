// ui/components/player.js
import { el, dispatch, fmtTimeMMSS } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { PLAYER_CSS } from "./player.css.js";

export class UIPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, PLAYER_CSS);

    this._state = { playing: false, muted: false, current: 0, duration: 0 };

    this._wrap = el("div", { class: "surface wrap" });
    this._btnPlay = el("button", { type: "button", title: "Play/Pause", "data-action": "toggle-play" }, ["▶"]);
    this._btnMute = el("button", { type: "button", title: "Mute", "data-action": "toggle-mute" }, ["🔈"]);
    this._time = el("div", { class: "time" }, ["00:00 / 00:00"]);
    this._seek = el("input", { type: "range", min: "0", max: "1000", value: "0", step: "1", "data-action": "seek" });

    this.shadowRoot.append(this._wrap);
    this._wrap.append(this._btnPlay, this._btnMute, this._time, this._seek);

    this._wrap.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");
      if (act === "toggle-play") {
        this.setPlaying(!this._state.playing);
        dispatch(this, "player:toggle", { playing: this._state.playing });
      } else if (act === "toggle-mute") {
        this.setMuted(!this._state.muted);
        dispatch(this, "player:mute", { muted: this._state.muted });
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

  setMuted(v) {
    this._state.muted = !!v;
    this._btnMute.textContent = this._state.muted ? "🔇" : "🔈";
  }

  setTime(currentSec, durationSec) {
    this._state.current = Math.max(0, Number(currentSec) || 0);
    this._state.duration = Math.max(0, Number(durationSec) || 0);
    this._time.textContent = `${fmtTimeMMSS(this._state.current)} / ${fmtTimeMMSS(this._state.duration)}`;
    const p = this._state.duration > 0 ? (this._state.current / this._state.duration) : 0;
    this._seek.value = String(Math.max(0, Math.min(1000, Math.round(p * 1000))));
  }
}

if (!customElements.get("ui-player")) {
  customElements.define("ui-player", UIPlayer);
}