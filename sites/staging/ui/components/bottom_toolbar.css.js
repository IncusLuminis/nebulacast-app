// ui/components/bottom_toolbar.css.js
import { baseHostCSS } from "../shared/style.js";

export const BOTTOM_TOOLBAR_CSS = baseHostCSS(`
.bar{
  display:flex; align-items:center; gap: 10px;
  padding: var(--ui-pad);
  border-radius: var(--ui-radius);
}
:host([dense]) .bar{ gap: 8px; padding: 8px 10px; border-radius: 12px; }

button{
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: inherit;
  cursor: pointer;
  display:flex; align-items:center; justify-content:center;
  padding:0;
}
:host([dense]) button{ width: 24px; height: 24px; border-radius: 8px; }
button:hover{ background: var(--ui-hover); }
button:active{ transform: translateY(1px); }
button[aria-pressed="true"]{ background: var(--ui-accent); border-color: var(--ui-accent-border); }
button:disabled{ opacity: 0.45; cursor: default; }
.ico{ width: 22px; height: 22px; display:block; }
`.trim());