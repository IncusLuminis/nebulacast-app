// ui/components/modal.css.js
import { baseHostCSS } from "../shared/style.js";

export const MODAL_CSS = baseHostCSS(`
:host{
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: none;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji";
}

.overlay{
  position:absolute;
  inset:0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
}

.dlg{
  position:absolute;
  left:50%;
  top:50%;
  transform: translate(-50%, -50%);

  width: min(540px, calc(100vw - 48px));
  max-height: min(86vh, 860px);

  overflow: auto;
  padding: 18px;

  border-radius: 18px;
  background: var(--ui-surface, rgba(16,18,24,0.92));
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 20px 80px rgba(0,0,0,0.55);
}

.head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  padding: 2px 2px 14px;
}

.title{
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0.2px;
  color: var(--ui-fg);
  line-height: 1.05;
}

.close{
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: var(--ui-fg);
  cursor:pointer;
}
.close:hover{ background: rgba(255,255,255,0.08); }
.close:active{ transform: translateY(1px); }

.body{
  padding: 6px 2px 2px;
  color: var(--ui-fg);
  font-size: 14px;
}

/* =========================
   Alerts modal (All alerts)
   ========================= */

.sky-alerts-modal{
  display:flex;
  flex-direction:column;
  gap: 14px;
}

.sky-alerts-tabs{
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 2px 0 4px;
}

.sky-alerts-tab{
  appearance:none;
  border: 1px solid rgba(255,255,255,0.28);
  background: transparent;
  color: var(--ui-fg);
  padding: 12px 26px;
  border-radius: 12px;
  font-size: 22px;
  font-weight: 800;
  cursor: pointer;
}
.sky-alerts-tab:hover{ background: rgba(255,255,255,0.06); }
.sky-alerts-tab.active{
  background: rgba(255,255,255,0.38);
  border-color: rgba(255,255,255,0.38);
  color: rgba(0,0,0,0.85);
}

.sky-alerts-table{
  display:flex;
  flex-direction:column;
  gap: 14px;
}

/* Header row */
.sky-alerts-table-header{
  display:grid;
  grid-template-columns: 76px 220px 1fr 160px 76px;
  gap: 14px;
  align-items: stretch;
}

.sky-alerts-table-header > div{
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.14);
  padding: 14px 16px;
  font-size: 22px;
  font-weight: 800;
  color: rgba(190, 235, 230, 0.95); /* мягкий "терминальный" оттенок */
}

/* Data row */
.sky-alerts-table-row{
  display:grid;
  grid-template-columns: 76px 220px 1fr 160px 76px;
  gap: 14px;
  align-items: stretch;
  cursor: pointer;
}
.sky-alerts-table-row[data-hidden="true"]{ display:none; }

.sky-alerts-table-row > div{
  border-radius: 16px;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.14);
  padding: 14px 16px;
}

.sky-alerts-table-row:hover > div{
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.20);
}

/* Icon column */
.sky-alerts-col-icon{
  display:flex;
  align-items:center;
  justify-content:center;
}
.sky-alerts-icon{
  font-size: 28px;
  line-height: 1;
}

/* Score column */
.sky-alerts-col-score{
  display:flex;
  align-items:center;
  justify-content:flex-start;
}

.sky-alerts-score-bar{
  position: relative;
  width: 100%;
  height: 56px;
  border-radius: 14px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  display:flex;
  align-items:center;
  padding-left: 18px;
  box-sizing: border-box;
}

.sky-alerts-score-text{
  position: relative;
  z-index: 2;
  font-size: 32px;
  font-weight: 900;
  color: rgba(0,0,0,0.78);
  text-shadow: 0 1px 0 rgba(255,255,255,0.22);
}

/* IMPORTANT:
   In your HTML you set inline style: background + width on .sky-alerts-score-bar.
   That makes the whole bar shrink.
   We compensate by treating width as a fill overlay instead of element width:
   -> if you keep inline width, it will still shrink the element.
   Best: move "width" to a child fill div later.
   For now: force bar width to 100%, and apply "fill" via background-size trick is not possible.
   So: remove inline width in widget.js later.
*/
.sky-alerts-score-bar{ width: 100% !important; }

/* Content column */
.sky-alerts-col-content{
  display:flex;
  flex-direction:column;
  gap: 8px;
}

.sky-alerts-col-content strong{
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.sky-alerts-col-updated{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  font-size: 24px;
  font-weight: 850;
  color: rgba(255,255,255,0.92);
}

.sky-alerts-col-target{
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 10px;
}

/* If target button still exists somewhere */
.sky-alerts-target-btn{
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: var(--ui-fg);
  cursor: pointer;
}
.sky-alerts-target-btn:hover{ background: rgba(255,255,255,0.10); }

/* =========================
   Existing ranking/object modal
   (kept, minor compatibility)
   ========================= */

.sky-modal-ranking{
  display:flex;
  flex-direction:column;
  gap:8px;
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
  width: 18px;
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
  font-size: 12px;
  opacity: 0.86;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
}

.sky-modal-gradeText{
  font-weight: 700;
  opacity: 0.95;
}

.sky-modal-meta{
  margin-top: 5px;
  display:flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  font-size: 11px;
  font-weight: 650;
  opacity: 0.9;
}

.sky-modal-chip{ white-space: nowrap; }
.sky-modal-dot{ opacity: 0.6; }
.sky-modal-chip--label{ opacity: 0.65; font-weight: 650; }

@media (max-width: 340px){
  .dlg{ width: min(340px, calc(100vw - 24px)); padding: 14px; }
  .title{ font-size: 26px; }
  .sky-alerts-tab{ font-size: 18px; padding: 10px 18px; }
  .sky-alerts-table-header, .sky-alerts-table-row{
    grid-template-columns: 64px 180px 1fr 140px 64px;
    gap: 10px;
  }
  .sky-alerts-table-header > div{ font-size: 18px; padding: 12px 14px; }
  .sky-alerts-col-content strong{ font-size: 26px; }
  .sky-alerts-col-updated{ font-size: 20px; }
}

@media (max-width: 340px){
  .dlg{ width: calc(100vw - 20px); max-height: 76vh; }
  .title{ font-size: 22px; }
  .sky-alerts-table-header, .sky-alerts-table-row{
    grid-template-columns: 56px 1fr;
  }
  .sky-alerts-table-header > div:nth-child(n+3),
  .sky-alerts-table-row > div:nth-child(n+3){
    grid-column: 1 / -1;
  }
}

/* =========================================
   Alerts modal layout (reuse sky-modal-*)
   ========================================= */

/* 4 columns:
   1) icon
   2) score
   3) content
   4) updated
*/

.sky-modal-table-header--alerts,
.sky-modal-row--alerts {
  display: grid;
  grid-template-columns: 64px 180px 1fr 140px;
  gap: 14px;
  align-items: center;
}

.sky-modal-table-header--alerts > div {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 800;
  opacity: 0.75;
}

.sky-modal-row--alerts > div {
  padding: 10px 12px;
}

/* icon column */
.sky-modal-time--icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* updated column */
.sky-modal-time--updated {
  font-size: 12px;
  font-weight: 700;
  opacity: 0.85;
}

/* make score bar slightly larger for alerts */
.sky-modal-row--alerts .sky-modal-bar {
  height: 14px;
}

.sky-modal-row--alerts .sky-modal-score-value {
  font-size: 12px;
  font-weight: 800;
}

/* ===== OBJECTS MODAL: group chips ===== */

.sky-objects-tabs{
  display: flex;
  gap: 8px;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.12);
}

.sky-objects-tab{
  appearance: none;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.sky-objects-tab:hover{
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.24);
}

.sky-objects-tab.active{
  background: rgba(255,255,255,0.20);
  border-color: rgba(255,255,255,0.34);
  color: rgba(255,255,255,1);
}

/* make header sticky below tabs */
.sky-modal-table-header{
  top: 44px; /* height of tabs area */
}

/* --- 3-col real table for Objects/Alerts modals --- */
.sky-modal-tableWrap { width: 100%; }

table.sky-modal-table3 {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 12px; /* gaps between rows like cards */
  table-layout: fixed;
}

table.sky-modal-table3 thead th {
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  padding: 6px 12px;
}

table.sky-modal-table3 thead th.col-time { width: 90px; }
table.sky-modal-table3 thead th.col-score { width: 160px; }

table.sky-modal-table3 tbody tr.sky-modal-tr td {
  vertical-align: top;
  padding: 0;
}

table.sky-modal-table3 tbody tr.sky-modal-tr td.time {
  padding: 16px 12px;
  font-size: 18px;
  font-weight: 600;
}

table.sky-modal-table3 tbody tr.sky-modal-tr td.obj,
table.sky-modal-table3 tbody tr.sky-modal-tr td.score {
  padding: 12px;
}

table.sky-modal-table3 tbody tr.sky-modal-tr {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}

table.sky-modal-table3 tbody tr.sky-modal-tr td:first-child {
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}
table.sky-modal-table3 tbody tr.sky-modal-tr td:last-child {
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
}

/* filtering (same mechanism you already use elsewhere) */
tr[data-hidden="true"] { display: none; }

`.trim());