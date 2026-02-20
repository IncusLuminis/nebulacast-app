// ui/components/modal.css.js
import { baseHostCSS } from "../shared/style.js";

export const MODAL_CSS = baseHostCSS(`
:host{ 
  position: fixed; 
  inset: 0; 
  z-index: 99998; 
  display:none; 
}

.overlay{ 
  position:absolute; 
  inset:0; 
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
}

.dlg{
  position:absolute; 
  left:50%; 
  top:50%;
  transform: translate(-50%, -50%);
  width: min(680px, calc(100vw - 24px));
  max-height: min(75vh, 800px);
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  background: rgba(18,22,28,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
}

/* Header - sticky */
.head{ 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  padding: 10px 14px;
  background: rgba(25,29,35,0.98);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.title{ 
  font-size: 13px; 
  font-weight: 600; 
  color: var(--ui-fg);
  letter-spacing: 0.02em;
}

.close{
  width: 28px; 
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  background: var(--ui-surface);
  color: var(--ui-fg);
  cursor:pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  transition: all 0.15s ease;
}

.close:hover{ 
  background: var(--ui-hover); 
  border-color: rgba(255,255,255,0.2);
}

/* Body - scrollable */
.body{ 
  padding: 0;
  color: var(--ui-fg); 
  font-size: 10px;
  overflow-y: auto;
  flex: 1;
}

/* ===== Table-style ranking list ===== */

.sky-modal-ranking{
  display: flex;
  flex-direction: column;
}

/* Section titles - hidden for compact view */
.sky-modal-section-title{
  display: none;
}

/* Table header */
.sky-modal-table-header{
  display: grid;
  grid-template-columns: 110px 1fr 120px;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(30,34,40,0.6);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Compact row */
.sky-modal-row{
  display: grid;
  grid-template-columns: 110px 1fr 120px;
  gap: 8px;
  align-items: center;
  padding: 5px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.02);
  transition: background 0.1s ease;
  cursor: pointer;
}

.sky-modal-row:hover{
  background: rgba(255,255,255,0.04);
}

/* Time column */
.sky-modal-time{
  font-size: 10px;
  font-weight: 400;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

/* Center content - name + metadata */
.sky-modal-left{
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sky-modal-r1{
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sky-modal-gradeEmoji{
  width: 16px;
  flex: 0 0 16px;
  text-align: center;
  font-size: 12px;
  line-height: 1;
}

.sky-modal-name{
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  opacity: 0.95;
}

.sky-modal-note{
  font-size: 10px;
  opacity: 0.75;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sky-modal-gradeText{
  font-weight: 600;
  opacity: 0.85;
}

/* Metadata chips - compact */
.sky-modal-meta{
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: baseline;
  font-size: 9px;
  font-weight: 400;
  opacity: 0.7;
  line-height: 1.2;
}

.sky-modal-chip{ 
  white-space: nowrap; 
  font-variant-numeric: tabular-nums;
}

.sky-modal-dot{ 
  opacity: 0.5; 
}

.sky-modal-chip--label{ 
  opacity: 0.6; 
  font-weight: 500; 
}

/* Score/Value column - bar visualization */
.sky-modal-score{
  display: flex;
  align-items: center;
  gap: 6px;
}

.sky-modal-bar{
  position: relative;
  flex: 1;
  height: 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 2px;
  overflow: hidden;
}

.sky-modal-bar-fill{
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #4ade80 0%, #22d3ee 50%, #3b82f6 100%);
  transition: width 0.3s ease;
}

.sky-modal-score-value{
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  opacity: 0.9;
  min-width: 28px;
  text-align: right;
}

/* Compact scrollbar */
.body::-webkit-scrollbar{
  width: 6px;
}

.body::-webkit-scrollbar-track{
  background: rgba(255,255,255,0.02);
}

.body::-webkit-scrollbar-thumb{
  background: rgba(255,255,255,0.15);
  border-radius: 3px;
}

.body::-webkit-scrollbar-thumb:hover{
  background: rgba(255,255,255,0.25);
}

/* Empty state */
.sky-modal-empty{
  padding: 40px 20px;
  text-align: center;
  font-size: 12px;
  opacity: 0.5;
}

@media (max-width: 520px){
  .dlg{ 
    width: min(95vw, calc(100vw - 16px)); 
    max-height: 80vh; 
  }
  
  .sky-modal-row{
    grid-template-columns: 90px 1fr 100px;
    gap: 6px;
    padding: 4px 10px;
  }
  
  .sky-modal-table-header{
    grid-template-columns: 90px 1fr 100px;
    gap: 6px;
    padding: 5px 10px;
  }
  
  .sky-modal-name{ 
    font-size: 10px; 
  }
  
  .sky-modal-meta{ 
    font-size: 8px; 
  }
}
`.trim());