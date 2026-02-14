// ui/components/side_toolbar.css.js
import { baseHostCSS } from "../shared/style.js";

export const SIDE_TOOLBAR_CSS = baseHostCSS(`
.wrap{ padding: 10px; width: auto; }
.list{ display:flex; flex-direction:column; gap: 8px; align-items:center; }

.btn{
  width: 40px; height: 40px;              /* <-- размер кнопки */
  border-radius: 12px;                     /* <-- радиус */
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
}
.btn:hover{ background: var(--ui-hover); }
.btn[aria-pressed="true"]{ background: var(--ui-accent); border-color: var(--ui-accent-border); }
.btn[aria-disabled="true"]{ opacity:0.4; pointer-events:none; }

.ico{ width: 20px; height: 20px; display:block; } /* <-- размер иконки */
`.trim());