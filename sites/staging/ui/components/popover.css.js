// ui/components/popover.css.js
import { baseHostCSS } from "../shared/style.js";

export const POPOVER_CSS = baseHostCSS(`
:host{
  position: fixed;
  display: none;
  z-index: 1000;
}

/* --- single source of truth for typography in ranking popover --- */
:host{
  --pop-fz-title: 20px;
  --pop-fz-name: 18px;
  --pop-fz-note: 13px;
  --pop-fw-note: 400;
  --pop-fz-meta: 13px;     /* хочешь 9px -> поставь 9px */
  --pop-fw-meta: 400;      /* как note */
}

.panel{
  width: min(500px, 94vw);
  min-width: 320px;
  max-height: 70vh;
  overflow-y: auto;

  padding: 12px;
  border-radius: 14px;

  backdrop-filter: blur(12px);
  background: rgba(18,22,28,0.75);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 24px 60px rgba(0,0,0,0.45);

  transform-origin: top right;
  transform: translateY(6px) scale(0.98);
  opacity: 0;
  transition: transform 160ms ease, opacity 160ms ease;
}

.panel.is-open{
  transform: translateY(0px) scale(1);
  opacity: 1;
}

.content{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ===== Ranking popover ===== */

.sky-pop-header{
  position: sticky;
  top: 0;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  padding: 6px 2px 10px;
  margin-bottom: 2px;

  background: rgba(18,22,28,0.90);
  backdrop-filter: blur(12px);
}

.sky-pop-ranking .sky-pop-title{
  font-size: var(--pop-fz-title);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.05;
  opacity: 0.95;
  margin: 0;
  max-width: 70%;
  word-break: break-word;
}

/* Show All button in header — themed */
.sky-pop-ranking .sky-pop-showall-btn{
  appearance: none;
  -webkit-appearance: none;

  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.92);

  border-radius: 12px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 650;

  width: auto;
  flex: 0 0 auto;
  white-space: nowrap;

  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}

.sky-pop-ranking .sky-pop-showall-btn:hover{
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.16);
}


.sky-pop-ranking .sky-pop-section-title{
  margin: 10px 6px 6px;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 700;
  opacity: 0.95;
}

.sky-pop-ranking .sky-pop-item--ranking{
  display: flex;
  flex-direction: column;
  gap: 6px;

  padding: 12px 14px;
  border-radius: 18px;

  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}

.sky-pop-ranking .sky-pop-item--ranking:hover{
  background: rgba(0,0,0,0.28);
  border-color: rgba(255,255,255,0.18);
}

.sky-pop-ranking .sky-pop-name{
  font-weight: 800;
  font-size: var(--pop-fz-name);
  line-height: 1.15;
  margin-left: 10px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* NOTE (вторая строка) */
.sky-pop-ranking .sky-pop-note{
  font-size: 13px;
  line-height: 1.25;
  opacity: 0.88;
  white-space: normal;
  overflow-wrap: anywhere;
  margin-left: 1px;
}

/* META (третья строка) — контейнер */
.sky-pop-ranking .sky-pop-meta2{
  font-size: 10px;
  font-weight: 400;
  line-height: 1.2;
  opacity: 0.88;

  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;

  margin-left: 1px;
}

/* META — сами чипы (time/mag/alt/RA/DEC/score) */
.sky-pop-ranking .sky-pop-meta2 .sky-pop-chip,
.sky-pop-ranking .sky-pop-meta2 .sky-pop-dot{
  font-size: 10px;
  font-weight: 300;
  line-height: 1.2;
  white-space: nowrap;
}

/* score не выделяем жирностью */
.sky-pop-ranking .sky-pop-meta2 .sky-pop-chip--score{
  font-weight: 300;
}

/* Ranking: НЕ показываем заголовки секций вообще */
.sky-pop-ranking .sky-pop-section-title,
.sky-pop-ranking .sky-pop-section-h{
  display: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Если "воздух" создаётся отступами вокруг секций */
.sky-pop-ranking .sky-pop-section{
  margin-top: 0 !important;
}
  

`.trim());