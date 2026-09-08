// ui/components/popover.css.js
import { baseHostCSS } from "../shared/style.js";

export const POPOVER_CSS = baseHostCSS(`
:host{
  position: fixed;
  display: none;
  z-index: 1000;
}

.panel{
  width: min(450px, 94vw);
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
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.05;
  opacity: 0.95;
  margin: 0;
  max-width: 70%;
  word-break: break-word;
}

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
  cursor: pointer;
  transition: all 0.15s ease;
}

.sky-pop-ranking .sky-pop-showall-btn:hover{
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.16);
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
  
  cursor: pointer;
  transition: all 0.15s ease;
}

.sky-pop-ranking .sky-pop-item--ranking:hover{
  background: rgba(0,0,0,0.28);
  border-color: rgba(255,255,255,0.18);
}

.sky-pop-ranking .sky-pop-name{
  font-weight: 800;
  font-size: 18px;
  line-height: 1.15;
  margin-left: 10px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sky-pop-ranking .sky-pop-note{
  font-size: 13px;
  line-height: 1.25;
  opacity: 0.88;
  white-space: normal;
  overflow-wrap: anywhere;
  margin-left: 1px;
}

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

.sky-pop-ranking .sky-pop-meta2 .sky-pop-chip,
.sky-pop-ranking .sky-pop-meta2 .sky-pop-dot{
  font-size: 10px;
  font-weight: 300;
  line-height: 1.2;
  white-space: nowrap;
}

.sky-pop-ranking .sky-pop-meta2 .sky-pop-chip--score{
  font-weight: 300;
}

.sky-pop-ranking .sky-pop-section-title,
.sky-pop-ranking .sky-pop-section-h{
  display: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.sky-pop-ranking .sky-pop-section{
  margin-top: 0 !important;
}

/* ===== Alerts popover (new card-based design) ===== */

.sky-alerts-container{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sky-alerts-header{
  position: sticky;
  top: -12px;
  z-index: 2;
  
  background: rgba(18,22,28,0.95);
  backdrop-filter: blur(12px);
  padding: 6px 2px 10px;
  margin: -12px -12px 4px;
  padding-left: 12px;
  padding-right: 12px;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sky-alerts-title{
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.01em;
  opacity: 0.95;
}

.sky-alerts-showall-btn{
  appearance: none;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.92);
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sky-alerts-showall-btn:hover{
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.16);
}

/* Alert item card */
.sky-alert-item{
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  padding: 14px;
  border-radius: 16px;
  
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.25);
  
  cursor: pointer;
  transition: all 0.15s ease;
}

.sky-alert-item:hover{
  background: rgba(0,0,0,0.35);
  border-color: rgba(255,255,255,0.18);
  transform: translateY(-1px);
}

/* Header row: icon + title + type badge */
.sky-alert-header{
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.sky-alert-icon{
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 20px;
  line-height: 1;
}

.sky-alert-main{
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sky-alert-title{
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sky-alert-type{
  font-size: 11px;
  font-weight: 600;
  opacity: 0.65;
  letter-spacing: 0.03em;
}

/* Metadata row */
.sky-alert-meta{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  opacity: 0.85;
  line-height: 1.3;
  margin-left: 42px;
}

.sky-alert-meta-item{
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.sky-alert-meta-label{
  opacity: 0.7;
}

.sky-alert-meta-value{
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Score indicator with colored dot */
.sky-alert-score{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  font-size: 11px;
  font-weight: 700;
}

.sky-alert-score-dot{
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sky-alert-score-dot--high{
  background: #4ade80;
}

.sky-alert-score-dot--medium{
  background: #fbbf24;
}

.sky-alert-score-dot--low{
  background: #94a3b8;
}

/* Empty state */
.sky-alerts-empty{
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  opacity: 0.6;
}

`.trim());