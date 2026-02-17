// ui/components/player.css.js
import { baseHostCSS } from "../shared/style.js";

export const PLAYER_CSS = baseHostCSS(`
:host {
  display: inline-block;        /* shrink-wraps to content width */
}
.wrap {
  display: inline-flex;         /* sized by the btn-row, not the container */
  flex-direction: column;
  align-items: stretch;         /* seek bar stretches to match btn-row width */
  gap: 6px;
  padding: var(--ui-pad);
  border-radius: var(--ui-radius);
}
.btn-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
button {
  width: 42px; height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: var(--ui-fg);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  flex-shrink: 0;               /* buttons never compress */
}
button:hover{ background: var(--ui-hover); }
button:active{ transform: translateY(1px); }
.seek {
  width: 100%;
  box-sizing: border-box;
}
  
`.trim());