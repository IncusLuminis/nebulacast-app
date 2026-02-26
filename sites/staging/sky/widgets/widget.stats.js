// sky/widgets/widget.stats.js
// Alerts Statistics Dialog — six canvas-based chart sections
// computed entirely from alerts_now.json data (client-side, no dependencies).

// ─── Group colour palette (spec §4.1) ────────────────────────────────────────
const GROUP_COLORS = {
  pha:       '#ef4444',   // Red
  risk:      '#f97316',   // Orange
  neo:       '#3b82f6',   // Blue
  neocp:     '#eab308',   // Yellow
  transient: '#a855f7',   // Purple
  grb:       '#06b6d4',   // Cyan
  gcn:       '#6b7280',   // Grey
};
const COLOR_DEFAULT = '#64748b';

function groupColor(g) {
  return GROUP_COLORS[String(g || '').toLowerCase()] || COLOR_DEFAULT;
}

// ─── Injected stylesheet ─────────────────────────────────────────────────────
const STATS_CSS = `
.sky-stats-overlay{
  position:fixed; inset:0; z-index:99999;
  background:rgba(0,0,0,0.58);
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  display:none;
}
.sky-stats-panel{
  position:absolute; left:50%; top:50%;
  transform:translate(-50%,-50%);
  width:min(900px,calc(100vw - 28px));
  max-height:min(90vh,920px);
  overflow-y:auto;
  border-radius:18px;
  background:rgba(12,15,22,0.98);
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:0 28px 90px rgba(0,0,0,0.72);
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
  color:rgba(255,255,255,0.88);
  scrollbar-width:thin;
  scrollbar-color:rgba(255,255,255,0.12) transparent;
}
.sky-stats-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:12px; padding:15px 17px 11px;
  border-bottom:1px solid rgba(255,255,255,0.06);
  position:sticky; top:0;
  background:rgba(12,15,22,0.99); z-index:2;
}
.sky-stats-title{
  font-size:14px; font-weight:700; letter-spacing:0.1px;
  opacity:0.92; line-height:1.2;
}
.sky-stats-meta{
  font-size:9.5px; opacity:0.38; margin-top:3px;
  font-variant-numeric:tabular-nums;
  font-family:ui-monospace,monospace;
}
.sky-stats-close{
  flex-shrink:0; width:29px; height:29px; border-radius:9px;
  border:1px solid rgba(255,255,255,0.10);
  background:rgba(255,255,255,0.04);
  color:rgba(255,255,255,0.70);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:14px; line-height:1; transition:background .12s;
}
.sky-stats-close:hover{ background:rgba(255,255,255,0.09); }

.sky-stats-body{
  padding:13px 15px 17px;
  display:flex; flex-direction:column; gap:12px;
}
.sky-stats-section{
  border:1px solid rgba(255,255,255,0.07);
  border-radius:11px; overflow:hidden;
}
.sky-stats-section-head{
  padding:6px 12px;
  font-size:9.5px; font-weight:700; letter-spacing:0.75px;
  text-transform:uppercase; color:rgba(255,255,255,0.40);
  border-bottom:1px solid rgba(255,255,255,0.05);
  background:rgba(255,255,255,0.02);
}
.sky-stats-section-body{ padding:10px 12px 12px; }

.sky-stats-chart-row{ display:flex; gap:14px; align-items:center; }

.sky-stats-canvas-wrap{ flex:1; min-width:0; }
.sky-stats-canvas-wrap canvas{ display:block; width:100%; height:auto; }

.sky-stats-canvas-wrap--donut{ flex:0 0 180px; }
.sky-stats-canvas-wrap--donut canvas{ width:180px; height:180px; }

.sky-stats-legend{
  display:flex; flex-direction:column; gap:5px;
  font-size:10px; min-width:0; flex:1;
}
.sky-stats-legend-item{ display:flex; align-items:center; gap:6px; }
.sky-stats-legend-dot{
  width:8px; height:8px; border-radius:50%; flex-shrink:0;
}
.sky-stats-legend-label{
  flex:1; opacity:0.78;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.sky-stats-legend-count{
  font-variant-numeric:tabular-nums; opacity:0.48;
  font-size:9.5px; flex-shrink:0;
}

.sky-stats-kpi-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(148px,1fr));
  gap:8px;
}
.sky-stats-kpi{
  background:rgba(255,255,255,0.025);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:9px; padding:9px 11px 10px;
}
.sky-stats-kpi-label{
  font-size:9px; letter-spacing:0.45px; text-transform:uppercase;
  color:rgba(255,255,255,0.38); margin-bottom:5px;
}
.sky-stats-kpi-value{
  font-size:16px; font-weight:800;
  font-variant-numeric:tabular-nums; letter-spacing:-0.2px; line-height:1;
}
.sky-stats-kpi-value--warn   { color:#f97316; }
.sky-stats-kpi-value--danger { color:#ef4444; }

.sky-stats-empty{
  font-size:11px; color:rgba(255,255,255,0.28);
  padding:8px 0; text-align:center;
}

.sky-stats-row-2col{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}
`;

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected) return;
  _styleInjected = true;
  const s = document.createElement('style');
  s.setAttribute('data-sky-stats', '1');
  s.textContent = STATS_CSS;
  document.head.appendChild(s);
}

// ─── Canvas palette ───────────────────────────────────────────────────────────
const C_GRID  = 'rgba(255,255,255,0.055)';
const C_AXIS  = 'rgba(255,255,255,0.20)';
const C_LABEL = 'rgba(255,255,255,0.40)';
const C_TEXT  = 'rgba(255,255,255,0.80)';
const C_MEAN  = 'rgba(234,179,8,0.80)';
const BG_HOLE = 'rgba(12,15,22,1)';

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function mkCanvas(w, h, fluid = false) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (fluid) {
    canvas.style.width  = '100%';
    canvas.style.height = 'auto';
  } else {
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
  }
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, w, h };
}

// Polyfill-safe rounded rect fill
function fillRR(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ── Donut chart (190 × 190 fixed canvas) ──────────────────────────────────────
// segments: [{label, count, color}]
function drawDonut(canvas, ctx, W, H, segments) {
  const cx = W / 2, cy = H / 2;
  const R  = W * 0.41;
  const ri = R  * 0.58;
  const total = segments.reduce((s, g) => s + g.count, 0);

  if (!total) {
    ctx.fillStyle = C_LABEL;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data', cx, cy);
    return;
  }

  let angle = -Math.PI / 2;
  for (const seg of segments) {
    const arc = (seg.count / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + arc);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    angle += arc;
  }

  // Thin separator lines
  angle = -Math.PI / 2;
  for (const seg of segments) {
    const arc = (seg.count / total) * 2 * Math.PI;
    ctx.save();
    ctx.strokeStyle = BG_HOLE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.stroke();
    ctx.restore();
    angle += arc;
  }

  // Hollow centre
  ctx.beginPath();
  ctx.arc(cx, cy, ri, 0, 2 * Math.PI);
  ctx.fillStyle = BG_HOLE;
  ctx.fill();

  // Centre text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C_TEXT;
  ctx.font = `bold ${Math.round(W * 0.12)}px system-ui`;
  ctx.fillText(String(total), cx, cy - 7);
  ctx.font = `${Math.round(W * 0.067)}px system-ui`;
  ctx.fillStyle = C_LABEL;
  ctx.fillText('Total Alerts', cx, cy + 9);
}

// ── Generic bar / histogram chart (760 × 155 fluid canvas) ──────────────────
// opts: { yFmt, maxVal, meanFrac, meanLabel }
function drawBars(canvas, ctx, W, H, labels, values, colors, opts = {}) {
  const padL = 44, padR = 10, padT = 12, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = values.length;

  if (!n) {
    ctx.fillStyle = C_LABEL;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data', W / 2, H / 2);
    return;
  }

  const maxVal = opts.maxVal != null && opts.maxVal > 0 ? opts.maxVal : 1;
  const yFmt   = opts.yFmt || (v => String(Math.round(v)));
  const nGridY = 4;

  // Horizontal grid lines + Y labels
  ctx.strokeStyle = C_GRID;
  ctx.lineWidth = 1;
  for (let i = 0; i <= nGridY; i++) {
    const y = padT + chartH - (chartH * i / nGridY);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.fillStyle = C_LABEL;
    ctx.font = '8px ui-monospace,monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(yFmt(maxVal * i / nGridY), padL - 4, y);
  }

  // Bars
  const slot = chartW / n;
  const barW = Math.max(2, Math.min(slot * 0.82, 52));
  const offX = (slot - barW) / 2;

  for (let i = 0; i < n; i++) {
    const bh = maxVal > 0 ? Math.max(0, (values[i] / maxVal) * chartH) : 0;
    const x  = padL + i * slot + offX;
    const y  = padT + chartH - bh;
    ctx.fillStyle = Array.isArray(colors) ? (colors[i] || '#3b82f6') : (colors || '#3b82f6');
    fillRR(ctx, x, y, barW, bh, 3);
  }

  // X-axis labels (thinned when too many bars)
  const maxLbls = Math.max(1, Math.floor(chartW / 38));
  const step    = Math.max(1, Math.ceil(n / maxLbls));
  ctx.fillStyle = C_LABEL;
  ctx.font = '8px system-ui';
  ctx.textBaseline = 'top';
  for (let i = 0; i < n; i++) {
    if (i % step !== 0 && i !== n - 1) continue;
    const raw  = String(labels[i] ?? '');
    const lbl  = raw.length > 8 ? raw.slice(0, 7) + '…' : raw;
    ctx.textAlign = 'center';
    ctx.fillText(lbl, padL + i * slot + slot / 2, padT + chartH + 4);
  }

  // Axes
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + chartH);
  ctx.lineTo(padL + chartW, padT + chartH);
  ctx.stroke();

  // Optional mean / reference vertical line
  if (opts.meanFrac != null && isFinite(opts.meanFrac)) {
    const mx = padL + Math.max(0, Math.min(1, opts.meanFrac)) * chartW;
    ctx.save();
    ctx.strokeStyle = C_MEAN;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, padT);
    ctx.lineTo(mx, padT + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C_MEAN;
    ctx.font = '8px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(opts.meanLabel || 'mean', mx + 3, padT + 2);
    ctx.restore();
  }
}

// ─── Data processors ──────────────────────────────────────────────────────────

function computeGroupCounts(items) {
  const ORDER = ['pha', 'risk', 'neo', 'neocp', 'transient', 'grb', 'gcn'];
  const raw = {};
  for (const it of items) {
    const g = String(it.group || 'other').toLowerCase();
    raw[g] = (raw[g] || 0) + 1;
  }
  const out = [];
  for (const g of ORDER) {
    if (raw[g]) out.push({ label: g.toUpperCase(), count: raw[g], color: groupColor(g) });
  }
  for (const [g, c] of Object.entries(raw)) {
    if (!ORDER.includes(g)) out.push({ label: (g || 'other').toUpperCase(), count: c, color: COLOR_DEFAULT });
  }
  return out;
}

function computeCloseApproaches(items) {
  const out = [];
  for (const it of items) {
    const g = String(it.group || '').toLowerCase();
    if (!['neo', 'pha', 'risk'].includes(g)) continue;
    const m = it.meta || {};
    const dist = m.moid_au != null ? Number(m.moid_au)
               : m.dist_au  != null ? Number(m.dist_au)
               : m.dist_ld  != null ? Number(m.dist_ld) * 0.002570
               : null;
    if (dist == null || !isFinite(dist)) continue;
    out.push({ id: String(it.id || it.title || '?'), dist, group: g });
  }
  out.sort((a, b) => a.dist - b.dist);
  return out.slice(0, 40);          // cap at 40 bars
}

function makeHistogram(values, nBins) {
  if (!values.length) return { edges: [], counts: [], mn: 0, mx: 0, bw: 0 };
  const mn = Math.min(...values), mx = Math.max(...values);
  const bw = (mx - mn || 1) / nBins;
  const counts = new Array(nBins).fill(0);
  for (const v of values) {
    counts[Math.min(nBins - 1, Math.floor((v - mn) / bw))]++;
  }
  const edges = Array.from({ length: nBins }, (_, i) => mn + i * bw);
  return { edges, counts, mn, mx, bw };
}

function computeMagHistogram(items) {
  const vals = items
    .map(it => it.mag ?? it.meta?.mag ?? it.meta?.vmag)
    .filter(v => v != null && isFinite(Number(v)))
    .map(Number);
  const h = makeHistogram(vals, 12);
  const mean = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  return { ...h, mean, n: vals.length };
}

function computeDiameterHistogram(items) {
  const vals = items
    .map(it => it.meta?.diameter_est_km ?? it.meta?.sbdb_diameter_est_km)
    .filter(v => v != null && isFinite(Number(v)) && Number(v) > 0)
    .map(Number);
  if (!vals.length) return { labels: [], counts: [], n: 0 };

  // Choose display precision from magnitude so labels are human-readable
  function fmtKm(v) {
    if (v < 0.001) return v.toExponential(0);
    if (v < 0.01)  return v.toFixed(3);
    if (v < 0.1)   return v.toFixed(2);
    if (v < 1)     return v.toFixed(1);
    return v.toFixed(0);
  }

  // Aggregate: items that share a display label form one bar.
  // Normalise via parseFloat to collapse "0.010" → "0.01" etc.
  const grouped = new Map();
  for (const v of vals) {
    const key = String(parseFloat(fmtKm(v)));
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }

  // Sort ascending by numeric value
  const sorted = [...grouped.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  return { labels: sorted.map(([l]) => l), counts: sorted.map(([, c]) => c), n: vals.length };
}

function computeEventTimes(items) {
  const counts = {};
  for (const it of items) {
    const ts = it.meta?.t_utc_iso || it.updated_utc || it.ingested_utc;
    if (!ts) continue;
    const date = String(ts).slice(0, 10);   // YYYY-MM-DD
    counts[date] = (counts[date] || 0) + 1;
  }
  const dates = Object.keys(counts).sort();
  return { dates, counts: dates.map(d => counts[d]) };
}

function computeRiskKPIs(items) {
  let nRisk = 0, nPHA = 0;
  let maxIP = null, maxHazard = null, sumHazard = 0, nHazard = 0;
  let maxTS = null, maxPS = null;
  for (const it of items) {
    const g = String(it.group || '').toLowerCase();
    const m = it.meta || {};
    if (g === 'risk') nRisk++;
    if (g === 'pha' || m.pha === true) nPHA++;
    if (m.ip != null && isFinite(Number(m.ip))) {
      if (maxIP === null || Number(m.ip) > maxIP) maxIP = Number(m.ip);
    }
    // score_norm is a top-level normalised 0-1 hazard/priority score present
    // on every alert; risk_score in meta is a fallback (often 0 for risk items).
    const hs = it.score_norm ?? m.risk_score ?? null;
    if (hs != null && isFinite(Number(hs))) {
      if (maxHazard === null || Number(hs) > maxHazard) maxHazard = Number(hs);
      sumHazard += Number(hs); nHazard++;
    }
    if (m.ts != null && isFinite(Number(m.ts))) {
      if (maxTS === null || Number(m.ts) > maxTS) maxTS = Number(m.ts);
    }
    if (m.ps != null && isFinite(Number(m.ps))) {
      if (maxPS === null || Number(m.ps) > maxPS) maxPS = Number(m.ps);
    }
  }
  return {
    total: items.length, nRisk, nPHA,
    maxIP, maxHazard,
    avgHazard: nHazard ? sumHazard / nHazard : null,
    maxTS, maxPS,
  };
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
function makeSection(title, bodyEl) {
  const s = document.createElement('div');
  s.className = 'sky-stats-section';
  const h = document.createElement('div');
  h.className = 'sky-stats-section-head';
  h.textContent = title;
  const b = document.createElement('div');
  b.className = 'sky-stats-section-body';
  b.appendChild(bodyEl);
  s.append(h, b);
  return s;
}

function makeEmpty(msg) {
  const d = document.createElement('div');
  d.className = 'sky-stats-empty';
  d.textContent = msg;
  return d;
}

function makeLegend(segments) {
  const wrap = document.createElement('div');
  wrap.className = 'sky-stats-legend';
  for (const seg of segments) {
    const row  = document.createElement('div'); row.className = 'sky-stats-legend-item';
    const dot  = document.createElement('span'); dot.className = 'sky-stats-legend-dot'; dot.style.background = seg.color;
    const lbl  = document.createElement('span'); lbl.className = 'sky-stats-legend-label'; lbl.textContent = seg.label;
    const cnt  = document.createElement('span'); cnt.className = 'sky-stats-legend-count'; cnt.textContent = String(seg.count);
    row.append(dot, lbl, cnt);
    wrap.appendChild(row);
  }
  return wrap;
}

function makeCanvasWrap(canvas, donut = false) {
  const w = document.createElement('div');
  w.className = 'sky-stats-canvas-wrap' + (donut ? ' sky-stats-canvas-wrap--donut' : '');
  w.appendChild(canvas);
  return w;
}

function addKPI(grid, label, value, warnCls = '') {
  const box = document.createElement('div'); box.className = 'sky-stats-kpi';
  const lbl = document.createElement('div'); lbl.className = 'sky-stats-kpi-label'; lbl.textContent = label;
  const val = document.createElement('div'); val.className = 'sky-stats-kpi-value' + (warnCls ? ' ' + warnCls : ''); val.textContent = value;
  box.append(lbl, val);
  grid.appendChild(box);
}

// ─── Public factory ───────────────────────────────────────────────────────────
export function createStatsDialog() {
  injectStyles();

  const overlay = document.createElement('div');
  overlay.className = 'sky-stats-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.className = 'sky-stats-panel';
  overlay.appendChild(panel);

  // Header
  const head     = document.createElement('div'); head.className = 'sky-stats-head';
  const headInfo = document.createElement('div');
  const titleEl  = document.createElement('div'); titleEl.className = 'sky-stats-title'; titleEl.textContent = 'Alerts Statistics';
  const metaEl   = document.createElement('div'); metaEl.className  = 'sky-stats-meta';
  headInfo.append(titleEl, metaEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'sky-stats-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close statistics');
  closeBtn.textContent = '✕';

  head.append(headInfo, closeBtn);
  panel.appendChild(head);

  // Scrollable body
  const body = document.createElement('div');
  body.className = 'sky-stats-body';
  panel.appendChild(body);

  // ── Close logic ────────────────────────────────────────────────────────────
  function onKey(e) { if (e.key === 'Escape') close(); }

  function close() {
    overlay.style.display = 'none';
    document.removeEventListener('keydown', onKey);
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // ── Render / open ──────────────────────────────────────────────────────────
  function open(alertsData) {
    const items = Array.isArray(alertsData?.items)  ? alertsData.items
                : Array.isArray(alertsData?.alerts) ? alertsData.alerts
                : Array.isArray(alertsData)         ? alertsData
                : [];

    // Meta line
    metaEl.textContent = alertsData?.generated_utc
      ? `Generated ${String(alertsData.generated_utc).slice(0, 16).replace('T', ' ')} UTC · ${items.length} alerts`
      : `${items.length} alerts`;

    body.innerHTML = '';

    // Collect all canvas draw callbacks; fire them in one RAF after the
    // overlay is shown so every canvas is guaranteed to be in the DOM.
    const draws = [];

    // ── §1 · Distribution by Group (donut) ─────────────────────────────────
    let sec1;
    {
      const groups = computeGroupCounts(items);
      const { canvas: dc, ctx: dctx, w: dW, h: dH } = mkCanvas(180, 180);
      const row = document.createElement('div');
      row.className = 'sky-stats-chart-row';
      row.append(makeCanvasWrap(dc, true), makeLegend(groups));
      sec1 = makeSection('1 · Distribution by Group', row);
      draws.push(() => drawDonut(dc, dctx, dW, dH, groups));
    }

    // ── §2 · Close Approaches (vertical bar) ───────────────────────────────
    let sec2;
    {
      const approaches = computeCloseApproaches(items);
      let content;
      if (approaches.length) {
        const { canvas: bc, ctx: bctx, w, h } = mkCanvas(760, 150, true);
        content = makeCanvasWrap(bc);
        draws.push(() => drawBars(bc, bctx, w, h,
          approaches.map(a => a.id),
          approaches.map(a => a.dist),
          approaches.map(a => groupColor(a.group)),
          { yFmt: v => v.toFixed(3), maxVal: Math.max(...approaches.map(a => a.dist)) }
        ));
      } else {
        content = makeEmpty('No close approach data — NEO · PHA · Risk items with moid_au / dist_au needed');
      }
      sec2 = makeSection('2 · Close Approaches (AU, ascending)', content);
    }

    // ── §3 · Magnitude Distribution (histogram) ────────────────────────────
    let sec3;
    {
      const mh = computeMagHistogram(items);
      let content;
      if (mh.n) {
        const { canvas: bc, ctx: bctx, w, h } = mkCanvas(400, 175, true);
        content = makeCanvasWrap(bc);
        const meanFrac = mh.mean != null
          ? (mh.mean - mh.mn) / Math.max(mh.mx - mh.mn, 1e-9)
          : null;
        draws.push(() => drawBars(bc, bctx, w, h,
          mh.edges.map(e => e.toFixed(1)),
          mh.counts,
          '#3b82f6',
          { yFmt: v => String(Math.round(v)), maxVal: Math.max(...mh.counts), meanFrac,
            meanLabel: mh.mean != null ? `mean ${mh.mean.toFixed(1)}` : null }
        ));
      } else {
        content = makeEmpty('No magnitude data (item.mag or meta.mag)');
      }
      sec3 = makeSection('3 · Magnitude Distribution', content);
    }

    // ── §4 · Diameter Distribution — NEO / PHA (histogram, km) ────────────
    let sec4;
    {
      const dh = computeDiameterHistogram(items);
      let content;
      if (dh.n) {
        const { canvas: bc, ctx: bctx, w, h } = mkCanvas(400, 175, true);
        content = makeCanvasWrap(bc);
        draws.push(() => drawBars(bc, bctx, w, h,
          dh.labels,
          dh.counts,
          '#a855f7',
          { yFmt: v => String(Math.round(v)), maxVal: Math.max(...dh.counts) }
        ));
      } else {
        content = makeEmpty('No diameter data (meta.diameter_est_km / sbdb_diameter_est_km)');
      }
      sec4 = makeSection('4 · Diameter Distribution (km)', content);
    }

    // ── §5 · Event Time Distribution (daily histogram) ─────────────────────
    let sec5;
    {
      const et = computeEventTimes(items);
      let content;
      if (et.dates.length) {
        const { canvas: bc, ctx: bctx, w, h } = mkCanvas(400, 175, true);
        content = makeCanvasWrap(bc);
        draws.push(() => drawBars(bc, bctx, w, h,
          et.dates.map(d => d.slice(5)),   // MM-DD
          et.counts,
          '#06b6d4',
          { yFmt: v => String(Math.round(v)), maxVal: Math.max(...et.counts) }
        ));
      } else {
        content = makeEmpty('No timestamp data (meta.t_utc_iso / updated_utc / ingested_utc)');
      }
      sec5 = makeSection('5 · Event Time Distribution (UTC, by date)', content);
    }

    // ── §6 · Risk Monitoring Overview (KPI grid) ───────────────────────────
    let sec6;
    {
      const kpis = computeRiskKPIs(items);
      const grid  = document.createElement('div');
      grid.className = 'sky-stats-kpi-grid';

      const DASH = '—';
      addKPI(grid, 'Total Alerts',      String(kpis.total));
      addKPI(grid, 'Risk Objects',      String(kpis.nRisk),
             kpis.nRisk > 0 ? 'sky-stats-kpi-value--warn' : '');
      addKPI(grid, 'PHA Objects',       String(kpis.nPHA),
             kpis.nPHA  > 0 ? 'sky-stats-kpi-value--danger' : '');
      addKPI(grid, 'Max Impact Prob.',  kpis.maxIP     != null ? kpis.maxIP.toExponential(2) : DASH);
      addKPI(grid, 'Max Hazard Score',  kpis.maxHazard != null ? kpis.maxHazard.toFixed(3) : DASH,
             kpis.maxHazard > 0.7 ? 'sky-stats-kpi-value--danger'
           : kpis.maxHazard > 0.4 ? 'sky-stats-kpi-value--warn' : '');
      addKPI(grid, 'Avg Hazard Score',  kpis.avgHazard != null ? kpis.avgHazard.toFixed(3) : DASH);
      addKPI(grid, 'Max Torino Scale',  kpis.maxTS     != null ? String(kpis.maxTS) : DASH);
      addKPI(grid, 'Max Palermo Scale', kpis.maxPS     != null ? kpis.maxPS.toFixed(2) : DASH);

      sec6 = makeSection('6 · Risk Monitoring Overview', grid);
    }

    // ── Compose layout ──────────────────────────────────────────────────────
    // Row 1: Risk Monitoring Overview (full width)
    body.appendChild(sec6);

    // Row 2: Distribution by Group | Event Time Distribution (2 columns)
    const row2 = document.createElement('div');
    row2.className = 'sky-stats-row-2col';
    row2.append(sec1, sec5);
    body.appendChild(row2);

    // Row 3: Close Approaches (full width)
    body.appendChild(sec2);

    // Row 4: Magnitude Distribution | Diameter Distribution (2 columns)
    const row4 = document.createElement('div');
    row4.className = 'sky-stats-row-2col';
    row4.append(sec3, sec4);
    body.appendChild(row4);

    // Show, then draw all canvases in one animation frame
    overlay.style.display = 'block';
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => draws.forEach(fn => fn()));
  }

  return { open, close };
}
