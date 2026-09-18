// ui/components/side_toolbar.css.js
import { baseHostCSS } from "../shared/style.js";

export const SIDE_TOOLBAR_CSS = baseHostCSS(`
.wrap{ padding: 10px; width: auto; }
.list{ display:flex; flex-direction:column; gap: 8px; align-items:center; }

.btn{
  width: 20px; height: 20px;              /* <-- размер кнопки */
  border-radius: 8px;                     /* <-- радиус */
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: inherit;
  padding: 0;
  font: inherit;
}
.btn:hover{ background: var(--ui-hover); }
.btn:focus-visible{ outline: 2px solid var(--ui-accent); outline-offset: 2px; }
.btn[aria-pressed="true"]{ background: var(--ui-accent); border-color: var(--ui-accent-border); }
.btn[aria-disabled="true"]{ opacity:0.4; pointer-events:none; }

.ico{ width: 16px; height: 16px; display:block; } /* <-- размер иконки */
.divider{ width: 60%; height: 1px; background: rgba(255,255,255,0.12); border-radius: 1px; }
`.trim());
