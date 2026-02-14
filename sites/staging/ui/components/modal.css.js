// ui/components/modal.css.js
import { baseHostCSS } from "../shared/style.js";

export const MODAL_CSS = baseHostCSS(`
:host{ position: fixed; inset: 0; z-index: 99998; display:none; }
.overlay{ position:absolute; inset:0; background: rgba(0,0,0,0.45); }


.dlg{
  position:absolute; left:50%; top:50%;
  transform: translate(-50%, -50%);
  width: min(560px, calc(100vw - 24px));    /* ужато */
  max-height: min(70vh, 760px);             /* ниже — будет скролл */
  overflow: auto;
  padding: 12px;
}
.head{ display:flex; align-items:center; justify-content:space-between; padding: 4px 4px 10px; }
.title{ font-size: 14px; font-weight: 800; color: var(--ui-fg); }
.close{
  width: 34px; height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: var(--ui-fg);
  cursor:pointer;
}
.close:hover{ background: var(--ui-hover); }
.body{ padding: 4px; color: var(--ui-fg); font-size: 12px; }

/* ===== Modal ranking list ===== */
.sky-modal-ranking{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.sky-modal-section-title{
  margin: 6px 2px 2px;
  font-size: 13px;
  font-weight: 900;
  opacity: 0.95;
}

.sky-modal-row{
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
}
.sky-modal-row:hover{
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.14);
}

.sky-modal-left{ min-width:0; }

.sky-modal-r1{
  display:flex;
  align-items:baseline;
  gap:8px;
  min-width:0;
}

.sky-modal-gradeEmoji{
  width: 18px;            /* “кружок” размером с эмодзи */
  flex: 0 0 18px;
  text-align:center;
}

.sky-modal-name{
  font-size: 15px;
  font-weight: 900;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width:0;
}

.sky-modal-note{
  margin-top: 5px;
  font-size: 12px;        /* note + grade одним стилем */
  opacity: 0.86;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
}

.sky-modal-gradeText{
  font-weight: 700;       /* только жирнее, но тем же размером */
  opacity: 0.95;
}

.sky-modal-meta{
  margin-top: 5px;
  display:flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  font-size: 11px;        /* маленько, чтобы всё влезало */
  font-weight: 650;
  opacity: 0.9;
}

.sky-modal-chip{ white-space: nowrap; }
.sky-modal-dot{ opacity: 0.6; }
.sky-modal-chip--label{ opacity: 0.65; font-weight: 650; }

@media (max-width: 520px){
  .dlg{ width: min(480px, calc(100vw - 20px)); max-height: 66vh; }
  .sky-modal-name{ font-size: 14px; }
  .sky-modal-meta{ font-size: 10.5px; }
}
  
`.trim());
