// Observer Console — Stats page (Phase 1: descriptive + in-snapshot time series).
// Consumes existing JSON endpoints only; no trend claims beyond each snapshot.

const GROUP_COLORS = {
  pha: '#ef4444',
  risk: '#f97316',
  neo: '#3b82f6',
  neocp: '#eab308',
  transient: '#a855f7',
  grb: '#06b6d4',
  gcn: '#6b7280',
};
const COLOR_DEFAULT = '#64748b';

const C_GRID = 'rgba(255,255,255,0.075)';
const C_AXIS = 'rgba(255,255,255,0.32)';
const C_LABEL = 'rgba(255,255,255,0.58)';
const C_TEXT = 'rgba(255,255,255,0.94)';
const BG_PANEL = 'rgba(12,15,22,0.98)';

/** Shared with hit-testing for tooltips */
const LINE_PAD = { L: 50, R: 12, T: 14, B: 30 };
const BAR_PAD = { L: 40, R: 8, T: 10, B: 26 };

let _cssDone = false;
let _chartTooltipEl = null;

function injectCss() {
  if (_cssDone) return;
  _cssDone = true;
  const s = document.createElement('style');
  s.setAttribute('data-nc-stats-page', '1');
  s.textContent = `
.nc-stats-root{
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
  color:rgba(255,255,255,0.96);
}
.nc-stats-hero{
  margin-bottom:20px;
}
.nc-stats-hero h1{
  font-size:1.35rem;font-weight:600;margin:0 0 6px;color:rgba(255,255,255,0.88);
}
.nc-stats-hero p{
  font-size:0.95rem;margin:0;opacity:0.58;line-height:1.5;max-width:52rem;
}
.nc-stats-badge{
  display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.65px;
  text-transform:uppercase;padding:3px 8px;border-radius:6px;margin-bottom:8px;
  border:1px solid rgba(255,255,255,0.16);
  background:rgba(255,255,255,0.06);
  color:rgba(255,255,255,0.64);
}
.nc-stats-badge--time{ color:#93d8fd; border-color:rgba(147,216,253,0.42); }
.nc-stats-badge--static{ color:#d4c7fd; border-color:rgba(212,199,253,0.42); }
.nc-stats-sections{ display:flex; flex-direction:column; gap:14px; }
.nc-stats-section{
  border:1px solid rgba(255,255,255,0.08);
  border-radius:12px; overflow:hidden;
  background:${BG_PANEL};
}
.nc-stats-section-head{
  padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:0.7px;
  text-transform:uppercase;color:rgba(255,255,255,0.58);
  border-bottom:1px solid rgba(255,255,255,0.06);
  background:rgba(255,255,255,0.025);
}
.nc-stats-section-body{ padding:14px 16px 16px; }
.nc-stats-table-wrap{ overflow-x:auto; }
.nc-stats-table{
  width:100%;border-collapse:collapse;font-size:13px;
  font-variant-numeric:tabular-nums;
}
.nc-stats-table th,.nc-stats-table td{
  text-align:left;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.06);
}
.nc-stats-table th{ color:rgba(255,255,255,0.56); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; }
.nc-stats-fresh-sub{ color:rgba(255,255,255,0.52); font-size:12px; }
.nc-stats-stale{ color:#f97316; }
.nc-stats-row2{
  display:grid; grid-template-columns:1fr 1fr; gap:12px;
}
@media (max-width:900px){ .nc-stats-row2{ grid-template-columns:1fr; } }
.nc-stats-kpi-grid{
  display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px; margin-bottom:10px;
}
.nc-stats-kpi{
  background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
  border-radius:9px; padding:8px 10px 9px;
}
.nc-stats-kpi-l{ font-size:11px; letter-spacing:0.4px; text-transform:uppercase; color:rgba(255,255,255,0.56); margin-bottom:4px; }
.nc-stats-kpi-v{ font-size:18px; font-weight:800; font-variant-numeric:tabular-nums; }
.nc-stats-chart-grid{ display:grid; grid-template-columns:1fr; gap:10px; width:100%; }
.nc-stats-chart-cell{ width:100%; min-width:0; }
.nc-stats-canvas-h{ display:block; width:100%; height:auto; border-radius:8px; background:rgba(0,0,0,0.15); }
.nc-stats-chart-row{ display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.nc-stats-donut-box{ flex:0 0 auto; }
.nc-stats-legend{ flex:1; min-width:140px; display:flex; flex-direction:column; gap:4px; font-size:12px; }
.nc-stats-legend-item{ display:flex; align-items:center; gap:6px; }
.nc-stats-dot{ width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.nc-stats-legend-l{ flex:1; opacity:0.92; }
.nc-stats-legend-c{ opacity:0.62; font-size:11px; }
.nc-stats-note{ font-size:12px; color:rgba(255,255,255,0.55); margin-top:8px; line-height:1.45; }
.nc-stats-loading{ opacity:0.62; font-size:15px; }
.nc-stats-err{ color:#f87171; font-size:14px; }
.nc-stats-chart-tooltip{
  position:fixed; z-index:100050; pointer-events:none; left:0; top:0;
  max-width:min(280px,calc(100vw - 24px));
  padding:8px 11px; border-radius:9px;
  font-size:12px; line-height:1.4;
  color:rgba(255,255,255,0.95);
  background:rgba(15,18,28,0.97);
  border:1px solid rgba(255,255,255,0.14);
  box-shadow:0 12px 40px rgba(0,0,0,0.55);
  font-variant-numeric:tabular-nums;
  white-space:pre-wrap;
  visibility:hidden; opacity:0; transition:opacity .08s ease;
}
.nc-stats-chart-tooltip.is-visible{ visibility:visible; opacity:1; }
`;
  document.head.appendChild(s);
}

function chartTooltipNode() {
  if (!_chartTooltipEl) {
    _chartTooltipEl = document.createElement('div');
    _chartTooltipEl.className = 'nc-stats-chart-tooltip';
    _chartTooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(_chartTooltipEl);
  }
  return _chartTooltipEl;
}

function showChartTooltip(clientX, clientY, text) {
  const el = chartTooltipNode();
  el.textContent = text;
  el.classList.add('is-visible');
  const pad = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  el.style.left = '0';
  el.style.top = '0';
  const tw = el.offsetWidth;
  const th = el.offsetHeight;
  let x = clientX + pad;
  let y = clientY + pad;
  if (x + tw > vw - 8) x = clientX - tw - pad;
  if (y + th > vh - 8) y = clientY - th - pad;
  if (x < 8) x = 8;
  if (y < 8) y = 8;
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
}

function hideChartTooltip() {
  if (_chartTooltipEl) {
    _chartTooltipEl.classList.remove('is-visible');
    _chartTooltipEl.textContent = '';
  }
}

/** Map pointer position to logical chart coordinates (matches draw calls using w×h). */
function canvasToLogical(canvas, wLogical, hLogical, offsetX, offsetY) {
  const rw = canvas.clientWidth || 1;
  const rh = canvas.clientHeight || 1;
  return {
    x: offsetX * (wLogical / rw),
    y: offsetY * (hLogical / rh),
  };
}

function attachLineChartTooltip(canvas, W, H, labels, values, opts = {}) {
  const n = values.length;
  if (!n) return;
  const { L, R, T, B } = LINE_PAD;
  const cw = W - L - R;
  const fmtVal = v => (opts.yFmt ? opts.yFmt(v) : String(Math.round(v * 10) / 10));
  const seriesName = opts.seriesName || 'Value';

  function onMove(e) {
    const { x: mx, y: my } = canvasToLogical(canvas, W, H, e.offsetX, e.offsetY);
    const ch = H - T - B;
    if (mx < L || mx > L + cw || my < T || my > T + ch) {
      hideChartTooltip();
      return;
    }
    let idx;
    if (n === 1) idx = 0;
    else {
      const u = (mx - L) / Math.max(cw, 1e-6);
      idx = Math.round(u * (n - 1));
      idx = Math.max(0, Math.min(n - 1, idx));
    }
    const tLbl = String(labels[idx] ?? '—');
    const tVal = values[idx];
    showChartTooltip(e.clientX, e.clientY, `${seriesName}\n${tLbl}\n${fmtVal(tVal)}`);
  }
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', hideChartTooltip);
  canvas.addEventListener('blur', hideChartTooltip);
}

function attachBarChartTooltip(canvas, W, H, labels, values, opts = {}) {
  const n = values.length;
  if (!n) return;
  const { L, R, T, B } = BAR_PAD;
  const cw = W - L - R, ch = H - T - B;
  const valLabel = opts.valueLabel || 'Count';
  const fmt = opts.formatValue || (v => String(v));

  function onMove(e) {
    const { x: mx, y: my } = canvasToLogical(canvas, W, H, e.offsetX, e.offsetY);
    if (mx < L || mx > L + cw || my < T || my > T + ch) {
      hideChartTooltip();
      return;
    }
    const slot = cw / n;
    const i = Math.max(0, Math.min(n - 1, Math.floor((mx - L) / slot)));
    const lbl = String(labels[i] ?? '—');
    showChartTooltip(e.clientX, e.clientY, `${lbl}\n${valLabel}: ${fmt(values[i])}`);
  }
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', hideChartTooltip);
  canvas.addEventListener('blur', hideChartTooltip);
}

function attachDonutTooltip(canvas, W, H, segments) {
  const total = _segmentsTotal(segments);
  if (!total) return;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.38;
  const ri = R * 0.55;

  function onMove(e) {
    const { x: mx, y: my } = canvasToLogical(canvas, W, H, e.offsetX, e.offsetY);
    const dx = mx - cx, dy = my - cy;
    const d = Math.hypot(dx, dy);
    if (d < ri || d > R) {
      hideChartTooltip();
      return;
    }
    let ang = Math.atan2(dy, dx) + Math.PI / 2;
    if (ang < 0) ang += 2 * Math.PI;
    if (ang >= 2 * Math.PI) ang -= 2 * Math.PI;
    const t = ang / (2 * Math.PI);
    let u = 0;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const f = seg.count / total;
      const end = u + f;
      const last = i === segments.length - 1;
      if (t >= u - 1e-9 && (last ? t <= end + 1e-6 : t < end - 1e-9)) {
        const pct = Math.round(f * 1000) / 10;
        showChartTooltip(e.clientX, e.clientY, `${seg.label}\n${seg.count} (${pct}%)`);
        return;
      }
      u = end;
    }
    hideChartTooltip();
  }
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', hideChartTooltip);
  canvas.addEventListener('blur', hideChartTooltip);
}

/** Usable width for full-bleed charts inside the stats column (not capped at 640px). */
function statsContentWidth(el) {
  let w = 0;
  if (el) w = el.clientWidth || Math.floor(el.getBoundingClientRect().width);
  if (!w || w < 160) {
    const main = document.querySelector('.console-main');
    w = (main && main.clientWidth) || window.innerWidth || 640;
  }
  return Math.max(280, Math.floor(w));
}

function mkCanvas(w, h, fluid = true) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.className = 'nc-stats-canvas-h';
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (fluid) {
    canvas.style.width = '100%';
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
  }
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, w, h };
}

function fillRR(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawLineSeries(ctx, W, H, labels, values, opts) {
  const padL = LINE_PAD.L, padR = LINE_PAD.R, padT = LINE_PAD.T, padB = LINE_PAD.B;
  const cw = W - padL - padR, ch = H - padT - padB;
  const n = values.length;
  if (!n) {
    ctx.fillStyle = C_LABEL;
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('No data', W / 2, H / 2);
    return;
  }
  const vmin = opts.vmin != null ? opts.vmin : Math.min(...values);
  const vmax = opts.vmax != null ? opts.vmax : Math.max(...values);
  const span = vmax - vmin || 1;

  ctx.strokeStyle = C_GRID;
  for (let i = 0; i <= 3; i++) {
    const y = padT + ch - (ch * i / 3);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + cw, y);
    ctx.stroke();
    ctx.fillStyle = C_LABEL;
    ctx.font = '10px ui-monospace,monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const val = vmin + (span * i / 3);
    ctx.fillText(opts.yFmt ? opts.yFmt(val) : String(Math.round(val * 10) / 10), padL - 4, y);
  }

  ctx.strokeStyle = C_AXIS;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + ch);
  ctx.lineTo(padL + cw, padT + ch);
  ctx.stroke();

  if (opts.nightFlags && opts.nightFlags.length === n) {
    const slot = cw / Math.max(1, n - 1);
    for (let i = 0; i < n; i++) {
      if (!opts.nightFlags[i]) continue;
      const x0 = padL + (i - 0.5) * slot;
      const w0 = Math.max(slot, 4);
      ctx.fillStyle = 'rgba(99,102,241,0.12)';
      fillRR(ctx, x0, padT, w0, ch, 0);
    }
  }

  ctx.strokeStyle = opts.color || '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t = (values[i] - vmin) / span;
    const x = padL + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);
    const y = padT + ch - t * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const maxLbl = Math.max(1, Math.floor(cw / 40));
  const step = Math.max(1, Math.ceil(n / maxLbl));
  ctx.fillStyle = C_LABEL;
  ctx.font = '10px system-ui';
  ctx.textBaseline = 'top';
  for (let i = 0; i < n; i += step) {
    ctx.textAlign = 'center';
    const x = padL + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);
    const raw = String(labels[i] ?? '');
    ctx.fillText(raw.length > 6 ? raw.slice(0, 5) + '…' : raw, x, padT + ch + 4);
  }
}

function drawBars(ctx, W, H, labels, values, color) {
  const padL = BAR_PAD.L, padR = BAR_PAD.R, padT = BAR_PAD.T, padB = BAR_PAD.B;
  const cw = W - padL - padR, ch = H - padT - padB;
  const n = values.length;
  if (!n) return;
  const mx = Math.max(...values, 1);
  ctx.strokeStyle = C_GRID;
  for (let g = 0; g <= 3; g++) {
    const y = padT + ch - (ch * g / 3);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + cw, y);
    ctx.stroke();
  }
  const slot = cw / n;
  const bw = Math.max(2, Math.min(slot * 0.78, 40));
  for (let i = 0; i < n; i++) {
    const bh = (values[i] / mx) * ch;
    const x = padL + i * slot + (slot - bw) / 2;
    ctx.fillStyle = Array.isArray(color) ? color[i % color.length] : color || '#818cf8';
    fillRR(ctx, x, padT + ch - bh, bw, bh, 3);
  }
  ctx.strokeStyle = C_AXIS;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + ch);
  ctx.lineTo(padL + cw, padT + ch);
  ctx.stroke();

  ctx.fillStyle = C_LABEL;
  ctx.font = '10px system-ui';
  ctx.textBaseline = 'top';
  const maxLbl = Math.max(1, Math.floor(cw / 36));
  const step = Math.max(1, Math.ceil(n / maxLbl));
  for (let i = 0; i < n; i += step) {
    ctx.textAlign = 'center';
    const lbl = String(labels[i] ?? '').slice(0, 8);
    ctx.fillText(lbl, padL + i * slot + slot / 2, padT + ch + 3);
  }
}

function drawDonut(canvas, ctx, W, H, segments, centerSub = 'items') {
  const cx = W / 2, cy = H / 2;
  const R = W * 0.38;
  const ri = R * 0.55;
  const total = _segmentsTotal(segments);
  if (!total) {
    ctx.fillStyle = C_LABEL;
    ctx.font = '13px system-ui';
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
  ctx.beginPath();
  ctx.arc(cx, cy, ri, 0, 2 * Math.PI);
  ctx.fillStyle = BG_PANEL;
  ctx.fill();
  ctx.fillStyle = C_TEXT;
  ctx.font = `bold ${Math.round(W * 0.128)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), cx, cy - 6);
  ctx.font = `${Math.round(W * 0.078)}px system-ui`;
  ctx.fillStyle = C_LABEL;
  ctx.fillText(centerSub, cx, cy + 10);
}

function _segmentsTotal(segments) {
  return segments.reduce((s, g) => s + g.count, 0);
}

function groupColor(g) {
  return GROUP_COLORS[String(g || '').toLowerCase()] || COLOR_DEFAULT;
}

function parseIsoish(s) {
  if (s == null) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function ageLabel(ms) {
  if (ms == null) return '—';
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 120) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function makeHistogram(values, nBins) {
  if (!values.length) return { counts: [], labels: [] };
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const bw = (mx - mn || 1) / nBins;
  const counts = new Array(nBins).fill(0);
  for (const v of values) {
    counts[Math.min(nBins - 1, Math.floor((v - mn) / bw))]++;
  }
  const labels = counts.map((_, i) => {
    const lo = mn + i * bw;
    const hi = lo + bw;
    return `${lo.toFixed(1)}–${hi.toFixed(1)}`;
  });
  return { counts, labels };
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

function section(title, inner) {
  const wrap = document.createElement('div');
  wrap.className = 'nc-stats-section';
  const h = document.createElement('div');
  h.className = 'nc-stats-section-head';
  h.textContent = title;
  const b = document.createElement('div');
  b.className = 'nc-stats-section-body';
  b.appendChild(inner);
  wrap.append(h, b);
  return wrap;
}

function freshnessTable(rows, now) {
  const wrap = document.createElement('div');
  wrap.className = 'nc-stats-table-wrap';
  const t = document.createElement('table');
  t.className = 'nc-stats-table';
  t.innerHTML = '<thead><tr><th>Dataset</th><th>Timestamp field</th><th>Value (UTC)</th><th>Age</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const r of rows) {
    const tr = document.createElement('tr');
    const ageMs = r.ts != null ? now - r.ts : null;
    const stale = ageMs != null && ageMs > 36 * 3600 * 1000;
    tr.innerHTML = `<td>${esc(r.name)}<div class="nc-stats-fresh-sub">${esc(r.sub || '')}</div></td><td>${esc(r.field)}</td><td>${esc(r.display)}</td><td class="${stale ? 'nc-stats-stale' : ''}">${esc(r.ageStr)}</td>`;
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  wrap.appendChild(t);
  return wrap;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function kpiGrid(pairs) {
  const g = document.createElement('div');
  g.className = 'nc-stats-kpi-grid';
  for (const [lab, val] of pairs) {
    const box = document.createElement('div');
    box.className = 'nc-stats-kpi';
    box.innerHTML = `<div class="nc-stats-kpi-l">${esc(lab)}</div><div class="nc-stats-kpi-v">${esc(String(val))}</div>`;
    g.appendChild(box);
  }
  return g;
}

function donutBlock(segments, centerSub = 'items') {
  const row = document.createElement('div');
  row.className = 'nc-stats-chart-row';
  const { canvas, ctx, w, h } = mkCanvas(180, 180, false);
  drawDonut(canvas, ctx, w, h, segments, centerSub);
  attachDonutTooltip(canvas, w, h, segments);
  const box = document.createElement('div');
  box.className = 'nc-stats-donut-box';
  box.appendChild(canvas);
  const leg = document.createElement('div');
  leg.className = 'nc-stats-legend';
  for (const s of segments) {
    const it = document.createElement('div');
    it.className = 'nc-stats-legend-item';
    it.innerHTML = `<span class="nc-stats-dot" style="background:${s.color}"></span><span class="nc-stats-legend-l">${esc(s.label)}</span><span class="nc-stats-legend-c">${s.count}</span>`;
    leg.appendChild(it);
  }
  row.append(box, leg);
  return row;
}

/** @param {HTMLElement} root */
export async function initStatsPage(root) {
  injectCss();
  root.className = 'nc-stats-root';
  root.innerHTML = `
    <div class="nc-stats-hero">
      <h1>Observer stats</h1>
      <p>Phase 1 uses only snapshots already produced by the app. Time-based charts show the hourly grid inside the current weather file or embedded forecast steps in helio — not a retained history archive.</p>
    </div>
    <p class="nc-stats-loading">Loading datasets…</p>
  `;

  const loadingP = root.querySelector('.nc-stats-loading');
  const now = Date.now();

  const urls = {
    weather: '/data/observer_weather_now.json',
    helio: '/data/helio_now.json',
    sunMoon: '/sky/data/sun_moon.json',
    ranking: '/sky/data/ranking.json',
    alerts: '/sky/data/alerts_now.json',
    daily: '/calendar/daily_signal.json',
    map: '/data/weather_map_now.json',
    stars: '/sky/data/stars.json',
    messier: '/sky/data/dso_messier.json',
  };

  const keys = Object.keys(urls);
  const settled = await Promise.allSettled(keys.map(k => fetchJson(urls[k])));
  /** @type {Record<string, any>} */
  const data = {};
  /** @type {Record<string, Error>} */
  const errors = {};
  keys.forEach((k, i) => {
    const r = settled[i];
    if (r.status === 'fulfilled') data[k] = r.value;
    else errors[k] = r.reason;
  });

  if (loadingP) loadingP.remove();

  const sectionsEl = document.createElement('div');
  sectionsEl.className = 'nc-stats-sections';

  if (Object.keys(errors).length) {
    const errEl = document.createElement('p');
    errEl.className = 'nc-stats-err';
    errEl.textContent = 'Some datasets failed to load: ' + Object.keys(errors).join(', ');
    root.appendChild(errEl);
  }

  const freshRows = [];
  function addFresh(name, sub, field, rawTs, display) {
    const ts = typeof rawTs === 'number' ? rawTs : parseIsoish(rawTs);
    const ageStr = ts != null ? ageLabel(now - ts) : '—';
    const disp = display != null ? String(display) : rawTs != null ? String(rawTs) : '—';
    freshRows.push({ name, sub, field, ts, display: disp, ageStr });
  }

  addFresh('observer_weather_now.json', 'Surface & observing snapshot', 'generated_utc', data.weather?.generated_utc);
  addFresh('helio_now.json', 'Space weather', 'updated_utc', data.helio?.updated_utc);
  addFresh('sun_moon.json', 'Sun & moon ephemeris', 'generated_at', data.sunMoon?.generated_at);
  addFresh('alerts_now.json', 'Consolidated sky alerts', 'generated_utc', data.alerts?.generated_utc);
  addFresh('daily_signal.json', 'Calendar signal feed', 'meta.generated_at', data.daily?.meta?.generated_at);
  addFresh('weather_map_now.json', 'Map manifest', 'updated_utc', data.map?.updated_utc);
  addFresh('stars.json', 'HYG catalog slice', 'generated_at', data.stars?.generated_at);
  addFresh('dso_messier.json', 'Messier list', 'generated_at', data.messier?.generated_at);
  addFresh('ranking.json', 'Tonight object ranking', '—', null, 'Not stamped in JSON');

  sectionsEl.appendChild(section('1. Data freshness / health', freshnessTable(freshRows, now)));

  const catalogBody = document.createElement('div');
  const staticNote = document.createElement('div');
  staticNote.innerHTML = '<span class="nc-stats-badge nc-stats-badge--static">Static catalogs</span><p class="nc-stats-note" style="margin-top:0">Distributions below describe reference snapshots. They do not change with observer location or time of day.</p>';
  catalogBody.appendChild(staticNote);

  const catRow = document.createElement('div');
  catRow.className = 'nc-stats-row2';

  if (data.stars?.stars?.length) {
    const stars = data.stars.stars;
    const mags = stars.map(s => s.mag).filter(v => v != null && isFinite(Number(v))).map(Number);
    const hist = makeHistogram(mags, 10);
    const specCounts = {};
    for (const s of stars) {
      const sp = (s.spect || '?').trim();
      const letter = sp ? sp.charAt(0).toUpperCase() : '?';
      specCounts[letter] = (specCounts[letter] || 0) + 1;
    }
    const specLabels = Object.keys(specCounts).sort();
    const specVals = specLabels.map(l => specCounts[l]);

    const col = document.createElement('div');
    col.innerHTML = `<p class="nc-stats-note"><strong>Stars</strong> (limit_mag ${data.stars.limit_mag ?? '—'}, n=${stars.length})</p>`;
    const g1 = mkCanvas(360, 140);
    const magAxis = hist.labels.map(l => l.split('–')[0]);
    drawBars(g1.ctx, g1.w, g1.h, magAxis, hist.counts, '#60a5fa');
    attachBarChartTooltip(g1.canvas, g1.w, g1.h, hist.labels, hist.counts, { valueLabel: 'Stars in bin' });
    col.appendChild(g1.canvas);
    const g2 = mkCanvas(360, 120);
    drawBars(g2.ctx, g2.w, g2.h, specLabels, specVals, '#a78bfa');
    attachBarChartTooltip(g2.canvas, g2.w, g2.h, specLabels, specVals, { valueLabel: 'Stars' });
    col.appendChild(g2.canvas);
    catRow.appendChild(col);
  } else {
    const em = document.createElement('p');
    em.className = 'nc-stats-note';
    em.textContent = 'Stars catalog not loaded.';
    catRow.appendChild(em);
  }

  if (data.messier?.items?.length) {
    const items = data.messier.items;
    const byType = {};
    for (const it of items) {
      const k = it.type_label || it.meta?.class || 'unknown';
      byType[k] = (byType[k] || 0) + 1;
    }
    const lbls = Object.keys(byType).sort((a, b) => byType[b] - byType[a]);
    const vals = lbls.map(l => byType[l]);
    const col = document.createElement('div');
    col.innerHTML = `<p class="nc-stats-note"><strong>Messier objects</strong> (n=${items.length})</p>`;
    const g = mkCanvas(360, Math.min(40 + lbls.length * 10, 220));
    drawBars(g.ctx, g.w, g.h, lbls, vals, '#34d399');
    attachBarChartTooltip(g.canvas, g.w, g.h, lbls, vals, { valueLabel: 'Objects' });
    col.appendChild(g.canvas);
    catRow.appendChild(col);
  }

  catalogBody.appendChild(catRow);
  sectionsEl.appendChild(section('2. Catalog intelligence', catalogBody));

  const atmBody = document.createElement('div');
  if (data.weather?.hourly?.length) {
    atmBody.innerHTML = '<span class="nc-stats-badge nc-stats-badge--time">In-snapshot hourly grid</span>';
    const hourly = data.weather.hourly;
    const labels = hourly.map(h => {
      try {
        return new Date(h.timestamp_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (_) {
        return '—';
      }
    });
    const cloud = hourly.map(h => h.cloud?.total_percent ?? 0);
    const temp = hourly.map(h => h.air?.temperature_c ?? 0);
    const wind = hourly.map(h => h.wind?.speed_mps ?? 0);
    const nightFlags = hourly.map(h => !!h.night);

    const charts = document.createElement('div');
    charts.className = 'nc-stats-chart-grid';
    const w = statsContentWidth(root);
    for (const spec of [
      { label: 'Cloud cover (% total)', values: cloud, color: '#94a3b8', yFmt: v => String(Math.round(v)), nightFlags },
 { label: 'Air temperature (°C)', values: temp, color: '#fbbf24', yFmt: v => String(Math.round(v * 10) / 10) },
      { label: 'Wind speed (m/s)', values: wind, color: '#22d3ee', yFmt: v => String(Math.round(v * 10) / 10) },
    ]) {
      const wrap = document.createElement('div');
      wrap.className = 'nc-stats-chart-cell';
      wrap.innerHTML = `<p class="nc-stats-note" style="margin-bottom:4px"><strong>${esc(spec.label)}</strong>${spec.nightFlags ? ' — violet band = night flag in snapshot' : ''}</p>`;
      const cv = mkCanvas(w, 130);
      drawLineSeries(cv.ctx, cv.w, cv.h, labels, spec.values, {
        color: spec.color,
        yFmt: spec.yFmt,
        nightFlags: spec.nightFlags,
      });
      attachLineChartTooltip(cv.canvas, cv.w, cv.h, labels, spec.values, {
        yFmt: spec.yFmt,
        seriesName: spec.label,
        nightFlags: spec.nightFlags,
      });
      wrap.appendChild(cv.canvas);
      charts.appendChild(wrap);
    }
    atmBody.appendChild(charts);
  } else {
    atmBody.appendChild(document.createTextNode('Observer weather snapshot not available.'));
  }
  sectionsEl.appendChild(section('3. Atmosphere & observing', atmBody));

  const spaceBody = document.createElement('div');
  if (data.helio) {
    const m = data.helio.metrics || {};
    const hero = data.helio.hero || {};
    const scales = data.helio.scales || {};
    const pairs = [
      ['Kp (latest)', m.kp_latest != null ? String(m.kp_latest) : String(hero.kp ?? '—')],
      ['Kp sample time', m.kp_time_utc || '—'],
      ['G / R / S scales', [scales.g_scale, scales.r_scale, scales.s_scale].filter(Boolean).join(' · ') || '—'],
      ['IMF Bz (nT)', m.imf_bz_nt != null ? String(m.imf_bz_nt) : '—'],
      ['Solar wind speed (km/s)', m.solar_wind_kms != null ? String(m.solar_wind_kms) : '—'],
      ['Proton density (cm⁻³)', m.density != null ? String(m.density) : '—'],
      ['X-ray class', m.xray_class || hero.scales?.x || '—'],
    ];
    if (data.helio.forecast) {
      pairs.push(['Kp max (24h)', String(data.helio.forecast.kp_max_next_24h ?? '—')]);
    }
    spaceBody.appendChild(kpiGrid(pairs));

    const fc = m.kp_forecast_3h;
    if (fc?.length) {
      const badge = document.createElement('span');
      badge.className = 'nc-stats-badge nc-stats-badge--time';
      badge.style.marginTop = '12px';
      badge.style.display = 'inline-block';
      badge.textContent = '3-hour Kp forecast steps (embedded)';
      spaceBody.appendChild(badge);
      const lbls = fc.map(s => {
        try {
          return new Date(s.t_utc).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', hour12: false });
        } catch (_) {
          return '—';
        }
      });
      const vals = fc.map(s => Number(s.kp) || 0);
      const kpW = statsContentWidth(root);
      const cv = mkCanvas(kpW, 140);
      const lineOpts = { color: '#c084fc', vmin: 0, vmax: Math.max(9, ...vals, 1), yFmt: v => v.toFixed(1) };
      drawLineSeries(cv.ctx, cv.w, cv.h, lbls, vals, lineOpts);
      attachLineChartTooltip(cv.canvas, cv.w, cv.h, lbls, vals, { ...lineOpts, seriesName: 'Kp (forecast step)' });
      spaceBody.appendChild(cv.canvas);
    }

    const prev = data.helio.alerts_preview;
    if (prev?.length) {
      const byLevel = {};
      for (const a of prev) {
        const lv = a.level || 'unknown';
        byLevel[lv] = (byLevel[lv] || 0) + 1;
      }
      const segments = Object.entries(byLevel).map(([label, count]) => ({
        label: String(label),
        count,
        color: label === 'warning' ? '#f97316' : label === 'watch' ? '#eab308' : '#64748b',
      }));
      const p = document.createElement('p');
      p.className = 'nc-stats-note';
      p.textContent = 'NOAA-style preview alerts (severity mix)';
      spaceBody.appendChild(p);
      spaceBody.appendChild(donutBlock(segments, 'alerts'));
    }
  } else {
    spaceBody.textContent = 'Helio snapshot not available.';
  }
  sectionsEl.appendChild(section('4. Space environment', spaceBody));

  const evtBody = document.createElement('div');
  if (data.alerts?.counts?.by_group) {
    const segs = Object.entries(data.alerts.counts.by_group).map(([g, count]) => ({
      label: g.toUpperCase(),
      count: Number(count) || 0,
      color: groupColor(g),
    }));
    const p0 = document.createElement('p');
    p0.className = 'nc-stats-note';
    p0.textContent = 'Sky alerts by group (from alerts_now counts)';
    evtBody.appendChild(p0);
    evtBody.appendChild(donutBlock(segs, 'alerts'));
  }

  if (data.ranking?.items?.length) {
    const scores = data.ranking.items.map(it => Number(it.score)).filter(x => isFinite(x));
    const hist = makeHistogram(scores, 8);
    const pR = document.createElement('p');
    pR.className = 'nc-stats-note';
    pR.textContent = 'Ranking score bins (tonight list)';
    evtBody.appendChild(pR);
    const cv = mkCanvas(statsContentWidth(root), 140);
    const rAxis = hist.labels.map(l => l.split('–')[0]);
    drawBars(cv.ctx, cv.w, cv.h, rAxis, hist.counts, '#38bdf8');
    attachBarChartTooltip(cv.canvas, cv.w, cv.h, hist.labels, hist.counts, { valueLabel: 'Objects in bin' });
    evtBody.appendChild(cv.canvas);
  }

  if (data.daily?.items?.length) {
    const byStream = {};
    for (const it of data.daily.items) {
      const k = it.stream || it.category || 'other';
      byStream[k] = (byStream[k] || 0) + 1;
    }
    const lbls = Object.keys(byStream).sort((a, b) => byStream[b] - byStream[a]);
    const vals = lbls.map(l => byStream[l]);
    const pD = document.createElement('p');
    pD.className = 'nc-stats-note';
    pD.textContent = 'Calendar signal items by stream/category';
    evtBody.appendChild(pD);
    const cv = mkCanvas(statsContentWidth(root), Math.min(200, 36 + lbls.length * 12));
    drawBars(cv.ctx, cv.w, cv.h, lbls, vals, '#34d399');
    attachBarChartTooltip(cv.canvas, cv.w, cv.h, lbls, vals, { valueLabel: 'Items' });
    evtBody.appendChild(cv.canvas);
  }

  if (!evtBody.childNodes.length) evtBody.textContent = 'No events/alerts data loaded.';
  sectionsEl.appendChild(section('5. Events & alerts', evtBody));

  const mapBody = document.createElement('div');
  if (data.map?.timeline) {
    const tl = data.map.timeline;
    const frames = Array.isArray(tl.frames) ? tl.frames : [];
    let nHist = 0, nFc = 0;
    for (const f of frames) {
      if (f.phase === 'forecast') nFc++;
      else nHist++;
    }
    mapBody.appendChild(kpiGrid([
      ['Total frames', String(tl.total_frames ?? frames.length)],
      ['Current index', String(tl.current_index ?? '—')],
      ['Step (hours)', String(tl.step_hours ?? '—')],
      ['Anchor (UTC)', String(tl.anchor_utc ?? '—')],
      ['History / forecast frames', `${nHist} / ${nFc}`],
    ]));
    const prods = data.map.source?.products;
    if (prods?.length) {
      const p = document.createElement('p');
      p.className = 'nc-stats-note';
      p.textContent = 'Products in manifest: ' + prods.join(', ');
      mapBody.appendChild(p);
    }
    const layerKeys = data.map.layers ? Object.keys(data.map.layers) : [];
    if (layerKeys.length) {
      const p = document.createElement('p');
      p.className = 'nc-stats-note';
      p.textContent = `Layer ids (${layerKeys.length}): ${layerKeys.slice(0, 12).join(', ')}${layerKeys.length > 12 ? '…' : ''}`;
      mapBody.appendChild(p);
    }
  } else {
    mapBody.textContent = data.map ? 'Map JSON loaded but no timeline block found.' : 'Map manifest not loaded.';
  }
  sectionsEl.appendChild(section('6. Map pipeline summary', mapBody));

  root.appendChild(sectionsEl);
}
