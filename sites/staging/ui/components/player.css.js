// ui/components/player.css.js
import { baseHostCSS } from "../shared/style.js";

export const PLAYER_CSS = baseHostCSS(`
.wrap{
  display:flex; align-items:center; gap: 10px;
  padding: var(--ui-pad);
  border-radius: var(--ui-radius);
}
button{
  width: 42px; height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: var(--ui-fg);
  cursor: pointer;
  display:flex; align-items:center; justify-content:center;
  padding:0;
}
button:hover{ background: var(--ui-hover); }
button:active{ transform: translateY(1px); }
.time{
  font: 12px/1.2 var(--ui-mono);
  color: var(--ui-fg-dim);
  min-width: 110px;
  text-align:center;
}
input[type="range"]{ flex: 1; min-width: 140px; }
`.trim());