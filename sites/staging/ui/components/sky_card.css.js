// ui/components/sky_card_css.js
export const SKY_CARD_CSS = `
.sky-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000; /* above ui-modal (99998) so card shows over open table modal */
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sky-card-overlay.is-visible {
  opacity: 1;
}

.sky-card-panel {
  min-width: 320px;
  max-width: 420px;
  background: rgba(20, 24, 32, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.sky-card-overlay.is-visible .sky-card-panel {
  transform: scale(1);
}

.sky-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sky-card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.sky-card-icon img {
  width: 40px;
  height: 40px;
  display: block;
}

.sky-card-icon span {
  font-size: 32px;
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

.sky-card-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;
}

.sky-card-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.15s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  line-height: 1;
  user-select: none;
}

.sky-card-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

.sky-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sky-card-note {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  word-wrap: break-word;
}

.sky-card-coords,
.sky-card-meta {
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
}

.sky-card-coords {
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* ─────────────────────────────────────────────
   ALERT CARD — wider panel with tabs
───────────────────────────────────────────── */

.sky-card-panel.has-tabs {
  min-width: 480px;
  max-width: 620px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

/* ── Alert header ── */
.sky-card-header-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

/* Left: icon box with group badge below */
.sky-card-icon-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.sky-card-icon-wrap .sky-card-group-badge {
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}

/* Right: title + note stacked */
.sky-card-header-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sky-card-header-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.sky-card-group-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.50);
}

.sky-card-header-title {
  flex: 1;
  font-size: 18px;          /* ← +1 ступень от 15px */
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  line-height: 1.2;
}

.sky-card-header-score {
  flex-shrink: 0;
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
  color: rgba(160, 200, 255, 0.80);
}

/* Note line under title */
.sky-card-header-note {
  font-size: 11px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Tab bar ── */
.sky-card-body.has-tabs {
  padding: 0;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sky-card-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 0 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  overflow-x: auto;
  scrollbar-width: none;
}
.sky-card-tabs::-webkit-scrollbar { display: none; }

.sky-card-tab {
  padding: 8px 11px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.30);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  user-select: none;
  transition: color 0.12s;
  margin-bottom: -1px;
}
.sky-card-tab:hover { color: rgba(255, 255, 255, 0.60); }
.sky-card-tab.active {
  color: rgba(255, 255, 255, 0.90);
  border-bottom-color: rgba(100, 160, 255, 0.75);
}

/* ── Panes ── */
.sky-card-panes {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.sky-card-pane {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 14px 20px 16px;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}
.sky-card-pane.active { display: flex; }

.sky-card-pane::-webkit-scrollbar       { width: 4px; }
.sky-card-pane::-webkit-scrollbar-track { background: transparent; }
.sky-card-pane::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

/* ── Field rows ── */
.sky-card-field {
  display: flex;
  gap: 10px;
  min-height: 20px;
  align-items: baseline;
}

.sky-card-field-label {
  flex-shrink: 0;
  width: 138px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.35px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  padding-top: 1px;
  line-height: 1.4;
}

.sky-card-field-value {
  flex: 1;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.sky-card-field-value.mono {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
}

.sky-card-field-value a {
  color: rgba(100, 160, 255, 0.80);
  text-decoration: none;
}
.sky-card-field-value a:hover { text-decoration: underline; }

/* ── Section divider ── */
.sky-card-section-head {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.20);
  margin: 8px 0 2px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

/* ── Raw JSON pane ── */
.sky-card-json {
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 10px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.50);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── Score bar chart (Scoring tab) ── */
.sky-score-chart {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* Groups one bar row + its optional breakdown panel */
.sky-score-bar-group {
  display: flex;
  flex-direction: column;
}

/*
 * Four-column grid: [▶ 16px] [label 88px] [track 1fr] [value 54px]
 * Arrow cell is empty for rows without breakdown.
 */
.sky-score-bar-row {
  display: grid;
  grid-template-columns: 16px 88px 1fr 54px;
  align-items: center;
  gap: 10px;
}

/* Arrow cell: tiny ▶ / ▼ indicator */
.sky-score-bar-arrow-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.30);
  transition: color 0.15s;
  user-select: none;
}

.sky-score-bar-arrow-cell:hover {
  color: rgba(255, 255, 255, 0.70);
}

.sky-score-bar-arrow {
  font-size: 8px;
  line-height: 1;
}

/* Muted label */
.sky-score-bar-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.40);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
  transition: color 0.15s;
}

.sky-score-bar-label:hover {
  color: rgba(255, 255, 255, 0.70);
}

/* Dark groove that the fill sits inside */
.sky-score-bar-track {
  height: 7px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 4px;
  overflow: hidden;
}

/*
 * Fill bar. --t: 0-1 threat level.
 * 0 → 220° blue (safe)  →  1 → 20° orange-red (dangerous)
 */
.sky-score-bar-fill {
  height: 100%;
  border-radius: 4px;
  background:  hsl(calc(220deg - 200deg * var(--t, 0)), 75%, 55%);
  box-shadow: 0 0 7px hsl(calc(220deg - 200deg * var(--t, 0)), 80%, 55%, 0.45);
  transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Mono value on the right */
.sky-score-bar-value {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: rgba(255, 255, 255, 0.60);
  text-align: right;
  white-space: nowrap;
}

/* ── Inline breakdown panel (expands under a bar row) ── */

/* Collapsible panel — max-height transition for smooth open/close */
.sky-breakdown-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.28s ease;
}

.sky-breakdown-panel.is-open {
  /* 7 features × ~22px + model tag + bottom padding */
  max-height: 260px;
}

/* Optional model name tag at the top of the panel */
.sky-breakdown-model-tag {
  font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: rgba(255, 255, 255, 0.16);
  text-align: right;
  /* indent to align with label column: 16px arrow + 88px label + 10px gap */
  padding: 4px 18px 2px calc(16px + 88px + 10px + 18px);
}

/*
 * Feature rows: same 4-col grid as bar rows.
 * Arrow cell is left empty — rows indent naturally under the main bar.
 */
.sky-breakdown-row {
  display: grid;
  grid-template-columns: 16px 88px 1fr 78px;
  align-items: center;
  gap: 10px;
  padding: 2px 18px 2px 18px;
}

.sky-breakdown-row:last-child {
  padding-bottom: 9px;
}

/* Feature name (right-aligned in label column, dimmer than main labels) */
.sky-breakdown-label {
  grid-column: 2;  /* skip the arrow cell */
  font-size: 11px;
  color: rgba(255, 255, 255, 0.28);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Value + ×weight cell */
.sky-breakdown-value {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: rgba(255, 255, 255, 0.55);
  text-align: right;
  white-space: nowrap;
}

/* Weight multiplier — visible but secondary */
.sky-breakdown-weight {
  margin-left: 4px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
}
`;