/**
 * Helio Widget — Space Weather component for nebulacast.app
 *
 * Mount API:
 *   HelioWidget.mount(element, { dataUrl: '/data/helio_now.json' })
 *
 * Self-contained: no external dependencies.
 */

import type {
  HelioNow, HelioEvent, KpForecastPoint,
  KpHistoryPoint, WindHistoryPoint, BzHistoryPoint, XrayHistoryPoint,
  HelioWidgetOptions, ImpactLevel, AlertLevel, HelioStatus, AuroraLabel, ObserverImpact,
} from "./helio.types";

const REFRESH_MS_DEFAULT = 10 * 60 * 1000; // 10 minutes

// ── Tone / colour helpers ────────────────────────────────────────────────────

const STATUS_TONE: Record<HelioStatus, { bg: string; accent: string }> = {
  quiet:    { bg: "#1a2e22", accent: "#5cce8c" },
  active:   { bg: "#2e2a1a", accent: "#d4cc5c" },
  elevated: { bg: "#2e1f10", accent: "#e0a84a" },
  storm:    { bg: "#2e1212", accent: "#e05c5c" },
};

const IMPACT_COLOR: Record<ImpactLevel, string> = {
  none:     "#666",
  low:      "#5cce8c",
  moderate: "#e0a84a",
  high:     "#e05c5c",
};

const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  info:    "#666",
  watch:   "#d4cc5c",
  warning: "#e05c5c",
};

const XRAY_COLOR: Record<string, string> = {
  A: "#888", B: "#5cce8c", C: "#aad47a", M: "#e0a84a", X: "#e05c5c",
};

// ── Timestamp formatting ─────────────────────────────────────────────────────

function fmtUpdated(ts: string | null): string {
  if (!ts) return "Update time unavailable";
  try {
    const diffMin = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (diffMin < 1)  return "Updated just now";
    if (diffMin < 60) return `Updated ${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `Updated ${diffH}h ago`;
    return `Updated ${Math.floor(diffH / 24)}d ago`;
  } catch { return "Updated recently"; }
}

function fmtAlertTs(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-GB", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "UTC", hour12: false,
    }) + " UTC";
  } catch { return ts; }
}

function fmtKpTime(ts: string | null): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-GB", {
      hour: "2-digit", minute: "2-digit",
      hour12: false,
    });
  } catch { return ts; }
}

function fmtHour(ts: string): string {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      hour: "2-digit", minute: "2-digit",
      hour12: false,
    });
  } catch { return ts.slice(11, 16); }
}

// ── Escape helpers ───────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function scaleIsActive(scale: string): boolean {
  return parseInt(scale.slice(1), 10) > 0;
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const WIDGET_CSS = `
.hw-root{font-family:inherit;color:#e0e0e0;background:#161c1e;border-radius:6px;overflow:hidden}
.hw-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#1a2428;border-bottom:1px solid #2a3438}
.hw-header-title{font-size:.78em;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b4c4cc}
.hw-freshness{font-size:.72em;color:#7a9098}

/* Hero */
.hw-hero{padding:12px 14px 10px;border-bottom:1px solid #1e2c30}
.hw-aurora-banner{display:flex;align-items:center;justify-content:space-between;margin:10px -14px -10px;padding:7px 14px;background:#0f2d1c;border-top:1px solid #1e4a2e}
.hw-aurora-banner-text{font-size:.75em;font-weight:600;color:#5cce8c;letter-spacing:.02em}
.hw-aurora-map-btn{font-size:.7em;color:#5cce8c;background:none;border:1px solid #2a5a3a;border-radius:3px;padding:2px 9px;cursor:pointer;transition:background .15s;white-space:nowrap}
.hw-aurora-map-btn:hover{background:#1a4a2a}
.hw-hero-main{display:flex;gap:14px;align-items:flex-start;margin-bottom:10px}
.hw-kp-col{display:flex;flex-direction:column;gap:6px;min-width:72px;border:1px solid #2a3c42;border-radius:6px;padding:8px 10px}
.hw-kp-big{font-size:2em;line-height:1;color:#b4c6cc;letter-spacing:-.01em}
.hw-kp-big b{color:#d4e4e8;font-weight:700}
.hw-info-col{flex:1;display:flex;flex-direction:column;gap:5px;padding-top:3px}
.hw-status-badge{font-size:.82em;font-weight:700;padding:2px 10px;border-radius:3px;letter-spacing:.04em}
.hw-scales-row{display:flex;gap:6px}
.hw-scale-chip{font-size:.72em;font-weight:600;padding:1px 6px;border-radius:2px;background:#222e32;color:#7a9098;border:1px solid #2a3c42}
.hw-scale-chip.hw-scale-active{color:#e0a84a;border-color:#5a4020}
.hw-summary-text{font-size:.78em;color:#96a8b8;line-height:1.4}

/* Hero toggle (bottom-left, 2 font steps up) */
.hw-hero-toggle-btn{font-size:.78em;color:#607880;background:none;border:none;cursor:pointer;padding:0;white-space:nowrap;margin-top:8px;display:block;transition:color .15s}
.hw-hero-toggle-btn:hover{color:#b4c6cc}

/* Hero quick details — KPI items are clickable */
.hw-quick-details{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-kpi-item{display:flex;align-items:baseline;gap:5px;cursor:pointer;border-radius:4px;padding:3px 5px;margin:-3px -5px;transition:background .12s}
.hw-kpi-item:hover{background:#ffffff0d}
.hw-kpi-item.hw-kpi-active{background:#ffffff12}
.hw-qd-label{font-size:.68em;color:#7a9098;flex-shrink:0}
.hw-qd-value{font-size:.82em;font-weight:600}
.hw-trend{font-size:.8em;opacity:.72;margin-left:2px;font-weight:400;letter-spacing:0}

/* KPI popover */
.hw-kpi-popover{background:#0e1517;border-radius:4px;padding:10px 12px;margin-top:10px;border:1px solid #1e2c30}
.hw-kpi-popover-title{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.hw-kpi-popover-close{background:none;border:none;color:#607880;cursor:pointer;font-size:.9em;padding:0;line-height:1;transition:color .15s}
.hw-kpi-popover-close:hover{color:#b4c6cc}
.hw-kpi-stat-row{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #1a2428}
.hw-kpi-stat{display:flex;flex-direction:column;gap:2px;flex:1}
.hw-kpi-stat-label{font-size:.63em;color:#607880;text-transform:uppercase;letter-spacing:.05em}
.hw-kpi-stat-value{font-size:.78em;font-weight:600;color:#b4c6cc}
.hw-kpi-hint{font-size:.72em;color:#7a9098;margin-top:8px;padding:6px 8px;background:#131a1c;border-radius:3px;border-left:2px solid #2a3c42;line-height:1.4}
.hw-xray-scale{display:flex;gap:0;height:6px;border-radius:3px;overflow:hidden;margin-top:8px}
.hw-xray-scale-band{flex:1;position:relative}
.hw-xray-scale-marker{position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid #fff}
.hw-xray-scale-labels{display:flex;margin-top:3px}
.hw-xray-scale-label{flex:1;font-size:.63em;color:#607880;text-align:center}
.hw-aurora-map-wrap{position:relative;border-radius:3px;overflow:hidden;background:#0a1012}
.hw-aurora-img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
.hw-aurora-caption{font-size:.65em;color:#607880;margin-top:5px;text-align:center}
.hw-aurora-obs-panel{display:flex;align-items:center;gap:5px;padding:5px 0 1px;font-size:.72em;color:#9ab4bc}
.hw-aurora-prob{font-weight:600;margin-left:auto}

/* Hero detail panel */
.hw-hero-detail{border-bottom:1px solid #1e2c30;padding:10px 14px;background:#131a1c}
.hw-spark-row{margin-bottom:10px}
.hw-spark-row:last-child{margin-bottom:0}
.hw-spark-label{font-size:.65em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.hw-spark-wrap{border-radius:3px;overflow:hidden;background:#0e1517}

/* Forecast */
.hw-forecast{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-section-label{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.hw-forecast-text{font-size:.78em;color:#b4c6cc;margin-bottom:8px}
.hw-forecast-bars{display:flex;align-items:flex-end;gap:2px;height:40px}
.hw-bar-col{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1}
.hw-bar{width:100%;border-radius:2px 2px 0 0;min-height:2px}

/* Timeline scrubber */
.hw-scrub-wrap{margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-scrub-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.hw-scrub-title{font-size:.65em;color:#607880;letter-spacing:.04em}
.hw-scrub-reset{font-size:.65em;color:#607880;background:none;border:none;cursor:pointer;padding:0 2px;line-height:1.2;transition:color .15s}
.hw-scrub-reset:hover{color:#b4c6cc}
.hw-scrub-slider{width:100%;cursor:pointer;margin:2px 0 0;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:linear-gradient(to right,#5cce8c var(--pct,0%),#2a3c42 var(--pct,0%));outline:none;display:block}
.hw-scrub-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;margin-top:-4.5px}
.hw-scrub-slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;border:none}
.hw-scrub-tick-row{display:flex;justify-content:space-between;margin-top:3px}
.hw-scrub-tick{font-size:.62em;color:#607880}
/* Simulated state banner */
.hw-sim-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1c2810;border:1px solid #364a1e;border-radius:3px;padding:4px 8px;margin-top:8px}
.hw-sim-badge{font-size:.72em;font-weight:600;color:#9acf60}
.hw-sim-kp{font-size:.72em;color:#7a9870}

/* Impacts */
.hw-impacts{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-impact-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;cursor:default;border-radius:3px;padding:3px 4px;margin-left:-4px;margin-right:-4px;transition:background .12s}
.hw-impact-row:last-child{margin-bottom:0}
.hw-impact-row:hover{background:#ffffff09}
.hw-impact-kind{font-size:.75em;font-weight:600;min-width:88px;color:#b4c6cc;display:flex;align-items:center;gap:5px}
.hw-impact-badge{font-size:.68em;font-weight:700;padding:1px 7px;border-radius:2px;text-transform:capitalize;min-width:52px;text-align:center;flex-shrink:0}
.hw-impact-tip{flex-basis:100%;font-size:.72em;color:#7a9098;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px}
.hw-impact-row:hover .hw-impact-tip{display:block}
.hw-solar-tip{flex-basis:100%;display:none;flex-direction:row;align-items:center;gap:10px;margin-top:6px;padding:6px;background:#111b1e;border-radius:4px;border:1px solid #1e2c30}
.hw-impact-row:hover .hw-solar-tip{display:flex}
.hw-solar-disk-wrap{position:relative;flex-shrink:0;width:80px;height:80px}
.hw-solar-disk-img{position:absolute;top:0;left:0;width:80px;height:80px;border-radius:50%;object-fit:cover;background:#0a0a0a;border:1px solid #2a3c42}
.hw-solar-tip-text{font-size:.72em;color:#7a9098;line-height:1.5}

/* Alerts */
.hw-alerts{padding:10px 14px}
.hw-alerts-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.hw-alerts-label{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase}
.hw-alerts-toggle{font-size:.68em;color:#607880;background:none;border:none;cursor:pointer;padding:0;transition:color .15s;letter-spacing:.03em}
.hw-alerts-toggle:hover{color:#b4c6cc}
.hw-alert-item{border-left:2px solid;padding:7px 10px;margin-bottom:6px;border-radius:0 3px 3px 0;background:#1a2428;cursor:pointer;transition:background .12s}
.hw-alert-item:last-child{margin-bottom:0}
.hw-alert-item:hover{background:#1e2c32}
.hw-alert-item.hw-alert-open{background:#1e2c32}
.hw-alert-top{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.hw-alert-icon{flex-shrink:0;opacity:.85}
.hw-alert-level{font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.hw-alert-title{font-size:.8em;font-weight:600;color:#ccdade}
.hw-alert-summary{font-size:.75em;color:#7a9098;line-height:1.3;margin-bottom:3px}
.hw-alert-meta{font-size:.68em;color:#607880}
.hw-alert-body{margin-top:8px;padding:7px 8px;background:#111b1e;border-radius:2px;font-size:.7em;color:#96a8b8;line-height:1.55;white-space:pre-wrap;font-family:monospace;word-break:break-word;border-top:1px solid #2a3c42}
.hw-empty-alerts{font-size:.78em;color:#607880;font-style:italic;padding:4px 0}

/* Magnetosphere */
.hw-info-top-row{display:flex;gap:8px;align-items:flex-start}
.hw-magnet-mini{flex-shrink:0;cursor:pointer;border-radius:4px;border:1px solid #1e2c30;padding:1px;transition:background .12s;display:flex;flex-direction:column;align-items:center;width:80px}
.hw-magnet-mini:hover,.hw-magnet-mini.hw-kpi-active{background:#ffffff0d;border-color:#2a3c42}
.hw-magnet-state{font-size:.64em;text-align:center;margin-top:2px;font-weight:600;letter-spacing:.03em}
@keyframes hw-wind{0%{transform:translateX(0);opacity:.85}100%{transform:translateX(14px);opacity:0}}
.hw-wg{animation:hw-wind 1.5s linear infinite}

/* States */
.hw-error{padding:16px;text-align:center;color:#607880}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`;

let cssInjected = false;
function injectCss(): void {
  if (cssInjected) return;
  const s = document.createElement("style");
  s.id = "helio-widget-css";
  s.textContent = WIDGET_CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

// ── Sparkline helpers ────────────────────────────────────────────────────────

/** Bar chart sparkline for Kp history (colored by level). */
function sparkKp(points: KpHistoryPoint[]): string {
  if (!points.length) return '<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';
  const W = 200, H = 32;
  const n = points.length;
  const bw = W / n;
  const rects = points.map((p, i) => {
    const h  = Math.max(2, Math.min(H, (p.kp / 9) * H));
    const y  = H - h;
    const x  = i * bw;
    const cl = p.kp >= 6 ? "#e05c5c" : p.kp >= 5 ? "#e0a84a" : p.kp >= 4 ? "#d4cc5c" : "#5cce8c";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${cl}" rx="1"><title>Kp ${p.kp.toFixed(1)} · ${escText(fmtHour(p.t_utc))} UTC</title></rect>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" preserveAspectRatio="none">${rects}</svg>`;
}

/** Line sparkline with optional zero-line (for Bz). */
function sparkLine(
  rawVals: number[],
  ticks: string[],
  color: string,
  H: number,
  zeroLine: boolean,
): string {
  if (rawVals.length < 2) return '<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';
  const W = 200;
  const vmin = Math.min(...rawVals), vmax = Math.max(...rawVals);
  const range = vmax - vmin || 1;
  const yOf = (v: number) => H - 2 - ((v - vmin) / range) * (H - 4);
  const pts = rawVals.map((v, i) =>
    `${((i / (rawVals.length - 1)) * W).toFixed(1)},${yOf(v).toFixed(1)}`
  ).join(" ");

  let extras = "";
  if (zeroLine && vmin < 0 && vmax > 0) {
    const y0 = yOf(0);
    extras = `<line x1="0" y1="${y0.toFixed(1)}" x2="${W}" y2="${y0.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`;
  }
  const tips = rawVals.map((v, i) => {
    const x = (i / (rawVals.length - 1)) * W;
    return `<rect x="${(x - 4).toFixed(1)}" y="0" width="8" height="${H}" fill="transparent"><title>${escText(ticks[i] || "")} · ${v.toFixed(1)}</title></rect>`;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" preserveAspectRatio="none">
    ${extras}
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${tips}
  </svg>`;
}

/** Line sparkline using log10 scale — for X-ray flux. */
function sparkXray(points: XrayHistoryPoint[]): string {
  if (points.length < 2) return '<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';
  const W = 200, H = 32;
  // Log10 of flux; clamp to [-9, -3]
  const logVals = points.map(p => Math.max(-9, Math.min(-3, Math.log10(p.flux))));
  const vmin = Math.min(...logVals), vmax = Math.max(...logVals);
  const range = vmax - vmin || 1;
  const yOf = (v: number) => H - 2 - ((v - vmin) / range) * (H - 4);
  const pts = logVals.map((v, i) =>
    `${((i / (logVals.length - 1)) * W).toFixed(1)},${yOf(v).toFixed(1)}`
  ).join(" ");
  const tips = points.map((p, i) => {
    const x = (i / (logVals.length - 1)) * W;
    const cls = p.flux >= 1e-4 ? "X" : p.flux >= 1e-5 ? "M" : p.flux >= 1e-6 ? "C" : p.flux >= 1e-7 ? "B" : "A";
    return `<rect x="${(x - 4).toFixed(1)}" y="0" width="8" height="${H}" fill="transparent"><title>${escText(fmtHour(p.t_utc))} · ${cls}-class (${p.flux.toExponential(2)})</title></rect>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${tips}
  </svg>`;
}

// ── KPI Popovers ─────────────────────────────────────────────────────────────

function renderPopoverHeader(title: string): string {
  return `<div class="hw-kpi-popover-title">
    <span>${title}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">✕</button>
  </div>`;
}

function renderSolarWindPopover(data: HelioNow): string {
  const pts: WindHistoryPoint[] = data.metrics.wind_history_1h ?? [];
  const svg = sparkLine(
    pts.map(p => p.kms ?? 0).filter(v => v > 0),
    pts.map(p => fmtHour(p.t_utc)),
    "#5cce8c", 36, false,
  );
  const latest = pts[pts.length - 1];
  const densityVal  = latest?.density  != null ? `${latest.density.toFixed(2)} cm⁻³`   : "—";
  const tempVal     = latest?.temp_kk  != null ? `${latest.temp_kk.toFixed(0)} kK`      : "—";
  const pressureVal = latest?.pressure_npa != null ? `${latest.pressure_npa.toFixed(2)} nPa` : "—";

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("Solar Wind · Last 24h")}
    <div class="hw-spark-wrap">${svg}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${escText(densityVal)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${escText(tempVal)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${escText(pressureVal)}</span>
      </div>
    </div>
  </div>`;
}

function renderXrayPopover(data: HelioNow): string {
  const pts: XrayHistoryPoint[] = data.metrics.xray_history_1h ?? [];
  const svg = sparkXray(pts);
  const currentClass = data.metrics.xray_class ?? "A";
  const flux = data.metrics.xray_flux_wm2;
  const fluxStr = flux != null ? flux.toExponential(2) + " W/m²" : "—";

  const bands = [
    { label: "A", color: "#888",     start: 1e-8, end: 1e-7 },
    { label: "B", color: "#5cce8c",  start: 1e-7, end: 1e-6 },
    { label: "C", color: "#aad47a",  start: 1e-6, end: 1e-5 },
    { label: "M", color: "#e0a84a",  start: 1e-5, end: 1e-4 },
    { label: "X", color: "#e05c5c",  start: 1e-4, end: 1e-3 },
  ];
  const scaleBands = bands.map(b => {
    const isActive = b.label === currentClass;
    const marker = isActive ? `<div class="hw-xray-scale-marker"></div>` : "";
    return `<div class="hw-xray-scale-band" style="background:${b.color}${isActive ? "cc" : "44"}">${marker}</div>`;
  }).join("");
  const scaleLabels = bands.map(b =>
    `<div class="hw-xray-scale-label" style="color:${b.label === currentClass ? "#c8d8dc" : "#607880"}">${b.label}</div>`
  ).join("");

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("X-Ray Flux · Last 24h")}
    <div class="hw-spark-wrap">${svg}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${scaleBands}</div>
      <div class="hw-xray-scale-labels">${scaleLabels}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${XRAY_COLOR[currentClass] ?? "#a0b4b8"}">${escText(currentClass)}-class</b> · ${escText(fluxStr)}</div>
  </div>`;
}

function renderBzPopover(data: HelioNow): string {
  const pts5m: BzHistoryPoint[] = data.metrics.bz_history_5m ?? [];
  const svg = sparkLine(
    pts5m.map(p => p.bz),
    pts5m.map(p => fmtHour(p.t_utc)),
    "#d4cc5c", 36, true,
  );
  const bz = data.metrics.imf_bz_nt;
  const bzColor = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";
  const bzStr = bz != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("IMF Bz · Last 6h")}
    <div class="hw-spark-wrap">${svg}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${bzColor}">${escText(bzStr)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`;
}

// ── Magnetosphere Visualization (Issue #178) ─────────────────────────────────

interface MagnetInfo {
  state:    "stable" | "active" | "storm";
  color:    string;
  label:    string;
  coupling: string;
}

function deriveMagnetInfo(data: HelioNow): MagnetInfo {
  const bz   = data.metrics.imf_bz_nt;
  const kp   = data.metrics.kp_latest ?? 0;
  const wind = data.metrics.solar_wind_kms ?? 0;

  let state: MagnetInfo["state"];
  let color: string;
  let label: string;

  if ((bz != null && bz < -5) || kp >= 6) {
    state = "storm";  color = "#e05c5c"; label = "Storm conditions";
  } else if ((bz != null && bz < 0) || kp >= 4 || wind >= 400) {
    const coupling = bz != null && bz < 0;
    state = "active"; color = "#e0a84a"; label = coupling ? "Active coupling" : "Elevated";
  } else {
    state = "stable"; color = "#5cce8c"; label = "Stable";
  }

  let coupling: string;
  if (bz == null)    coupling = "Unknown";
  else if (bz > 2)   coupling = "Closed";
  else if (bz > 0)   coupling = "Minimal";
  else if (bz > -5)  coupling = "Moderate";
  else if (bz > -10) coupling = "Strong";
  else               coupling = "Very strong";

  return { state, color, label, coupling };
}

/** Render SVG magnetosphere diagram.
 *  compact=true  → 80×50 viewBox (hero mini)
 *  compact=false → 200×120 viewBox (popover) */
function renderMagnetosphereSvg(
  info: MagnetInfo,
  bz: number | null,
  wind: number | null,
  compact: boolean,
): string {
  const uid = compact ? "mc" : "mf";
  const c   = info.color;

  // Wind animation speed
  const wKms = wind ?? 0;
  const wHigh = wKms > 500, wSlow = wKms < 350;
  const dur = wHigh ? 0.9 : wSlow ? 1.8 : 1.3;

  if (compact) {
    // ── Compact 80×50, Earth at (45, 25) ──────────────────────────────────
    const ex = 45, ey = 25, er = 4.5;
    const standoff = info.state === "storm" ? 11 : info.state === "active" ? 16 : 21;
    const nx = ex - standoff;
    const topY = info.state === "storm" ? 12 : info.state === "active" ? 10 : 8;
    const botY = 50 - topY;
    const tailX = 76;

    const path = [
      `M ${nx},${ey}`,
      `C ${nx - 2},${ey - 10} ${ex - 4},${topY} ${ex},${topY}`,
      `C ${ex + 8},${topY} ${tailX - 8},${topY + 4} ${tailX},${ey - 5}`,
      `C ${tailX + 1},${ey - 2} ${tailX + 1},${ey + 2} ${tailX},${ey + 5}`,
      `C ${tailX - 8},${botY - 4} ${ex + 8},${botY} ${ex},${botY}`,
      `C ${ex - 4},${botY} ${nx - 2},${ey + 10} ${nx},${ey}`,
      "Z",
    ].join(" ");

    const numGroups = wHigh ? 3 : 2;
    const arrowRows = [14, 25, 36];
    const arrowPath = (y: number) =>
      `<path d="M 0,${y} L ${wHigh ? 8 : 6},${y} M ${wHigh ? 6 : 4},${y - 2} L ${wHigh ? 8 : 6},${y} L ${wHigh ? 6 : 4},${y + 2}" stroke="${c}bb" stroke-width="${wHigh ? 1.4 : 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const arrowSet = arrowRows.map(y => arrowPath(y)).join("");
    const windGroups = Array.from({ length: numGroups }, (_, i) =>
      `<g class="hw-wg" style="animation-duration:${dur}s;animation-delay:${((dur / numGroups) * i).toFixed(2)}s">${arrowSet}</g>`
    ).join("");

    const bzArrow = bz == null ? "" : bz > 0
      ? `<path d="M ${ex},${ey + 2} L ${ex},${ey - 2} M ${ex - 1.5},${ey - 0.5} L ${ex},${ey - 2} L ${ex + 1.5},${ey - 0.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`
      : `<path d="M ${ex},${ey - 2} L ${ex},${ey + 2} M ${ex - 1.5},${ey + 0.5} L ${ex},${ey + 2} L ${ex + 1.5},${ey + 0.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;

    return `<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${uid}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${uid}-wclip)">${windGroups}</g>
      <path d="${path}" fill="${c}14" stroke="${c}b0" stroke-width="0.9"/>
      <circle cx="${ex}" cy="${ey}" r="${er}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${bzArrow}
    </svg>`;

  } else {
    // ── Full 200×120, Earth at (110, 60) ──────────────────────────────────
    const ex = 110, ey = 60, er = 10;
    const standoff = info.state === "storm" ? 26 : info.state === "active" ? 38 : 50;
    const nx = ex - standoff;
    const topY = info.state === "storm" ? 28 : info.state === "active" ? 22 : 18;
    const botY = 120 - topY;
    const tailX = 188;

    const path = [
      `M ${nx},${ey}`,
      `C ${nx - 5},${ey - 22} ${ex - 10},${topY} ${ex},${topY}`,
      `C ${ex + 18},${topY} ${tailX - 20},${topY + 10} ${tailX},${ey - 12}`,
      `C ${tailX + 3},${ey - 5} ${tailX + 3},${ey + 5} ${tailX},${ey + 12}`,
      `C ${tailX - 20},${botY - 10} ${ex + 18},${botY} ${ex},${botY}`,
      `C ${ex - 10},${botY} ${nx - 5},${ey + 22} ${nx},${ey}`,
      "Z",
    ].join(" ");

    const couplingPath = `M ${nx + 2},${ey} C ${nx + 2},${ey - standoff * 0.4} ${ex - 4},${ey - 8} ${ex - er},${ey} C ${ex - 4},${ey + 8} ${nx + 2},${ey + standoff * 0.4} ${nx + 2},${ey} Z`;

    const numGroups = wHigh ? 4 : 3;
    const arrowRows = [24, 42, 60, 78, 96];
    const aOff = 40; // start arrows after sun right edge (cx=0 r=36 → right=36)
    const aLen = wHigh ? 18 : 14;
    const aHead = wHigh ? 14 : 10;
    const arrowPath = (y: number) =>
      `<path d="M ${aOff},${y} L ${aOff + aLen},${y} M ${aOff + aHead},${y - 4} L ${aOff + aLen},${y} L ${aOff + aHead},${y + 4}" stroke="${c}bb" stroke-width="${wHigh ? 2 : 1.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const arrowSet = arrowRows.map(y => arrowPath(y)).join("");
    const windGroups = Array.from({ length: numGroups }, (_, i) =>
      `<g class="hw-wg" style="animation-duration:${dur}s;animation-delay:${((dur / numGroups) * i).toFixed(2)}s">${arrowSet}</g>`
    ).join("");

    const bzArrow = bz == null ? "" : bz > 0
      ? `<path d="M ${ex},${ey + 5} L ${ex},${ey - 5} M ${ex - 3},${ey - 2} L ${ex},${ey - 5} L ${ex + 3},${ey - 2}" stroke="#5cce8c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M ${ex},${ey - 5} L ${ex},${ey + 5} M ${ex - 3},${ey + 2} L ${ex},${ey + 5} L ${ex + 3},${ey + 2}" stroke="#e05c5c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

    const bzLabel = bz == null ? "" :
      `<text x="${ex + 13}" y="${ey + 2}" font-size="7" fill="${bz > 0 ? "#5cce8c" : "#e05c5c"}" font-family="monospace">Bz${bz > 0 ? "↑" : "↓"}</text>`;

    return `<svg viewBox="0 0 200 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${uid}-wclip"><rect x="38" y="0" width="46" height="120"/></clipPath></defs>
      <rect width="200" height="120" fill="#0a1014" rx="3"/>
      <circle cx="0" cy="60" r="36" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${uid}-wclip)">${windGroups}</g>
      <path d="${couplingPath}" fill="${c}08"/>
      <path d="${path}" fill="${c}12" stroke="${c}aa" stroke-width="1.2"/>
      <text x="${nx + 3}" y="${topY - 2}" font-size="7" fill="${c}" opacity=".75" font-family="sans-serif">${escText(info.label)}</text>
      <circle cx="${ex}" cy="${ey}" r="${er}" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${bzArrow}
      ${bzLabel}
      <text x="2" y="113" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
    </svg>`;
  }
}

function renderMagnetospherePopover(data: HelioNow): string {
  const info  = deriveMagnetInfo(data);
  const bz    = data.metrics.imf_bz_nt;
  const wind  = data.metrics.solar_wind_kms;
  const kp    = data.metrics.kp_latest;

  const bzStr   = bz   != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";
  const windStr = wind != null ? `${Math.round(wind)} km/s` : "—";
  const kpStr   = kp   != null ? kp.toFixed(1) : "—";
  const bzColor = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";

  const hintText = (bz != null && bz < -5)
    ? "Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely."
    : (bz != null && bz < 0)
    ? "Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible."
    : "Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${renderMagnetosphereSvg(info, bz, wind, false)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${bzColor}">${escText(bzStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${escText(windStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${info.color}">${escText(info.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${escText(hintText)}</div>
  </div>`;
}

// ── Aurora probability map (Issue #177) ─────────────────────────────────────

interface OvationEntry { lon: number; lat: number; prob: number; }
interface OvationData  { entries: OvationEntry[]; forecastTime: string; }

/** Nearest-grid-cell lookup of OVATION aurora probability at observer lat/lon. */
function lookupOvationProb(entries: OvationEntry[], lat: number, lon: number): number | null {
  if (!entries.length) return null;
  const normLon = ((lon % 360) + 360) % 360;
  let best = -1, bestDist = Infinity;
  const cosLat = Math.cos(lat * Math.PI / 180);
  for (const e of entries) {
    const dLat = e.lat - lat;
    const dLon = ((e.lon - normLon + 180 + 360) % 360) - 180;
    const dist  = dLat * dLat + (dLon * cosLat) * (dLon * cosLat);
    if (dist < bestDist) { bestDist = dist; best = e.prob; }
  }
  return best >= 0 ? best : null;
}

/** SVG overlay: observer dot + cardinal labels, viewBox 0 0 100 100. */
function renderAuroraSvgOverlay(opts: HelioWidgetOptions): string {
  const CX = 50, CY = 50, R = 50;

  const cardinals = [
    `<text x="${CX}" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>`,
    `<text x="96"  y="${CY + 1}" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>`,
    `<text x="${CX}" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>`,
    `<text x="4"   y="${CY + 1}" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>`,
  ].join("");

  return `<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${cardinals}</svg>`;
}

function renderAuroraPopover(opts: HelioWidgetOptions, ovationData: OvationData | null): string {
  const url = `https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`;

  let prob: number | null = null;
  if (ovationData && opts.lat != null && opts.lon != null) {
    prob = lookupOvationProb(ovationData.entries, opts.lat, opts.lon);
  }

  const hasLocation = opts.lat != null && opts.lon != null;
  const probColor   = prob != null
    ? (prob >= 30 ? "#5cce8c" : prob >= 10 ? "#d4cc5c" : "#9ab4bc") : "#607880";
  const probLabel   = prob != null ? `${prob}%` : ovationData ? "n/a" : "…";

  const obsPanel = hasLocation ? `
    <div class="hw-aurora-obs-panel">
      <span>📍</span>
      <span>${opts.locationName ? escText(opts.locationName) + " · " : ""}${opts.lat!.toFixed(1)}°${opts.lat! >= 0 ? "N" : "S"} ${Math.abs(opts.lon!).toFixed(1)}°${opts.lon! >= 0 ? "E" : "W"}</span>
      <span class="hw-aurora-prob" style="color:${probColor}">Aurora: ${probLabel}</span>
    </div>` : "";

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("Aurora Oval · Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${esc(url)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${renderAuroraSvgOverlay(opts)}
    </div>
    ${obsPanel}
    <div class="hw-aurora-caption">NOAA OVATION Prime model · updates every 5 min</div>
  </div>`;
}

function renderKpiPopover(
  data: HelioNow, key: string,
  opts: HelioWidgetOptions, ovationData: OvationData | null,
): string {
  switch (key) {
    case "solar_wind":    return renderSolarWindPopover(data);
    case "xray":          return renderXrayPopover(data);
    case "imf_bz":        return renderBzPopover(data);
    case "aurora":        return renderAuroraPopover(opts, ovationData);
    case "magnetosphere": return renderMagnetospherePopover(data);
    default:              return "";
  }
}

// ── Trend arrows ──────────────────────────────────────────────────────────────

/** Compare last value vs 3 steps back; returns ↑ ↓ or → */
function trendArrow(vals: number[], threshold: number): "↑" | "↓" | "→" {
  if (vals.length < 2) return "→";
  const last    = vals[vals.length - 1];
  const lookIdx = Math.max(0, vals.length - 4); // 3 steps back, or start
  const prev    = vals[lookIdx];
  if (!isFinite(last) || !isFinite(prev)) return "→";
  const delta = last - prev;
  if (delta >  threshold) return "↑";
  if (delta < -threshold) return "↓";
  return "→";
}

// ── Hero section ─────────────────────────────────────────────────────────────

function renderHero(
  data: HelioNow, heroExpanded: boolean, activePopover: string | null,
  scrubData: ScrubData | null, opts: HelioWidgetOptions, ovationData: OvationData | null,
): string {
  const { summary, scales, metrics, aurora_hint } = data;
  const tone = STATUS_TONE[summary.status] ?? STATUS_TONE.quiet;

  // When scrubbing, display forecasted Kp + G-scale; otherwise live values
  const kp = scrubData != null
    ? scrubData.kp.toFixed(1)
    : (metrics.kp_latest != null ? metrics.kp_latest.toFixed(1) : "—");

  const gScaleDisplay = scrubData ? scrubData.gScale : scales.g_scale;
  const scaleChips = [gScaleDisplay, scales.r_scale, scales.s_scale].map(s => {
    const active = scaleIsActive(s);
    const style  = active ? `color:${tone.accent};border-color:${tone.accent}33` : "";
    return `<span class="hw-scale-chip${active ? " hw-scale-active" : ""}" style="${style}">${escText(s)}</span>`;
  }).join("");

  const auroraLabel = scrubData ? scrubData.auroraLabel : aurora_hint.aurora_label;
  const auroraColor = auroraLabel === "good" ? "#5cce8c" : auroraLabel === "possible" ? "#d4cc5c" : "#607880";
  const auroraDisp  = auroraLabel.charAt(0).toUpperCase() + auroraLabel.slice(1);

  const windColor = "#b4c6cc";
  const windDisp  = metrics.solar_wind_kms != null ? `${Math.round(metrics.solar_wind_kms)} km/s` : "—";

  const bz     = metrics.imf_bz_nt;
  const bzColor = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";
  const bzDisp  = bz != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";

  const xray      = metrics.xray_class;
  const xrayColor = xray ? (XRAY_COLOR[xray] ?? "#a0b4b8") : "#607880";
  const xrayDisp  = xray ? `${xray}-class` : "—";

  // Trend arrows — compare current vs ~3h ago in each history array
  const kpTrend   = trendArrow((metrics.kp_history_1h   ?? []).map(p => p.kp),                    0.5);
  const windTrend = trendArrow((metrics.wind_history_1h  ?? []).map(p => p.kms),                   20);
  const bzTrend   = trendArrow((metrics.bz_history_1h    ?? []).map(p => p.bz),                    1.5);
  // X-ray: use log10(flux) so small changes at low flux don't dominate
  const xrayTrend = trendArrow((metrics.xray_history_1h  ?? []).map(p => Math.log10(p.flux + 1e-9)), 0.15);

  const toggleLabel  = heroExpanded ? "▼ Details" : "▶ Details";
  const magnetInfo   = deriveMagnetInfo(data);

  // Aurora highlight — live Kp only (scrub shows forecast, not an "alert")
  const liveKp        = metrics.kp_latest ?? 0;
  const isAuroraAlert = liveKp >= 5;
  const heroBg        = isAuroraAlert
    ? `linear-gradient(160deg, #0d2a1a 0%, ${tone.bg}22 75%)`
    : `${tone.bg}18`;

  const kpiItem = (key: string, label: string, value: string, color: string, trend?: string) => {
    const trendHtml = trend ? `<span class="hw-trend">${trend}</span>` : "";
    const isActive = activePopover === key;
    return `<div class="hw-kpi-item${isActive ? " hw-kpi-active" : ""}" data-kpi="${key}">
      <span class="hw-qd-label">${label}</span>
      <span class="hw-qd-value" style="color:${color}">${value}${trendHtml}</span>
    </div>`;
  };

  const auroraBanner = isAuroraAlert ? `
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">✦ Aurora alert · Kp ${liveKp.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map →</button>
    </div>` : "";

  return `
    <div class="hw-hero" style="background:${heroBg}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${scrubData ? "color:#9acf60" : ""}">Kp <b>${escText(kp)}</b>${scrubData ? "" : `<span class="hw-trend">${kpTrend}</span>`}</div>
          <span class="hw-status-badge" style="background:${tone.accent}22;color:${tone.accent};display:block;text-align:center">${escText(summary.label)}</span>
          <div class="hw-scales-row">${scaleChips}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${escText(summary.text)}</div>
            <div class="hw-magnet-mini${activePopover === "magnetosphere" ? " hw-kpi-active" : ""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${renderMagnetosphereSvg(magnetInfo, bz, metrics.solar_wind_kms, true)}
              <div class="hw-magnet-state" style="color:${magnetInfo.color}">${escText(magnetInfo.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${kpiItem("aurora",     "Aurora",     escText(auroraDisp), auroraColor)}
        ${kpiItem("solar_wind", "Solar wind", escText(windDisp),   windColor, windTrend)}
        ${kpiItem("imf_bz",     "IMF Bz",     escText(bzDisp),     bzColor,   bzTrend)}
        ${kpiItem("xray",       "X-ray",      escText(xrayDisp),   xrayColor, xrayTrend)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${toggleLabel}</button>
      ${auroraBanner}
      ${activePopover ? renderKpiPopover(data, activePopover, opts, ovationData) : ""}
    </div>`;
}

function renderHeroDetail(data: HelioNow): string {
  const { metrics } = data;
  const kpPts:   KpHistoryPoint[]   = metrics.kp_history_1h  ?? [];
  const windPts: WindHistoryPoint[] = metrics.wind_history_1h ?? [];
  const bzPts:   BzHistoryPoint[]   = metrics.bz_history_1h  ?? [];

  const kpSvg   = sparkKp(kpPts);
  const windSvg = sparkLine(
    windPts.map(p => p.kms ?? 0).filter(v => v > 0),
    windPts.map(p => fmtHour(p.t_utc)),
    "#5cce8c", 28, false,
  );
  const bzSvg   = sparkLine(
    bzPts.map(p => p.bz), bzPts.map(p => fmtHour(p.t_utc)),
    "#d4cc5c", 28, true,
  );

  return `
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp · Last 24h</div>
        <div class="hw-spark-wrap">${kpSvg}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz · Last 24h</div>
        <div class="hw-spark-wrap">${bzSvg}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind · Last 24h</div>
        <div class="hw-spark-wrap">${windSvg}</div>
      </div>
    </div>`;
}

// ── Remaining sections ───────────────────────────────────────────────────────

function renderHeader(data: HelioNow): string {
  const freshness = fmtUpdated(data.updated_utc);
  return `
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${escText(freshness)}</span>
    </div>`;
}

/** Smooth an array of values with a 3-point moving average. */
function smooth3(vals: number[]): number[] {
  return vals.map((v, i) => {
    if (i === 0)              return (v + vals[1]) / 2;
    if (i === vals.length - 1) return (vals[i - 1] + v) / 2;
    return (vals[i - 1] + v + vals[i + 1]) / 3;
  });
}

// ── Timeline scrub utilities ──────────────────────────────────────────────────

interface ScrubData {
  offsetH:      number;
  kp:           number;
  gScale:       string;
  auroraLabel:  AuroraLabel;
  auroraMinLat: number | null;
  impacts:      ObserverImpact[];
}

function kpToGScale(kp: number): string {
  if (kp >= 9) return "G5";
  if (kp >= 8) return "G4";
  if (kp >= 7) return "G3";
  if (kp >= 6) return "G2";
  if (kp >= 5) return "G1";
  return "G0";
}

function kpToAuroraLabel(kp: number): AuroraLabel {
  if (kp >= 5) return "good";
  if (kp >= 3) return "possible";
  return "none";
}

function kpToMinLat(kp: number): number | null {
  if (kp >= 9) return 40;
  if (kp >= 8) return 45;
  if (kp >= 7) return 50;
  if (kp >= 6) return 55;
  if (kp >= 5) return 60;
  return null;
}

function kpToImpacts(kp: number): ObserverImpact[] {
  const auroraLevel: ImpactLevel = kp >= 7 ? "high" : kp >= 5 ? "moderate" : kp >= 3 ? "low" : "none";
  const auroraMinLat = kpToMinLat(kp);
  const auroraSum =
    auroraLevel === "none"    ? "No aurora expected at mid-latitudes" :
    auroraMinLat != null      ? `Aurora possible equatorward of ~${auroraMinLat}° lat` :
                                "Minor aurora possible at high latitudes";

  const radioLevel: ImpactLevel = kp >= 7 ? "moderate" : kp >= 5 ? "low" : "none";
  const radioSum =
    radioLevel === "none"     ? "No significant HF degradation expected" :
    radioLevel === "low"      ? "Minor HF degradation at high latitudes" :
                                "Moderate HF degradation, possible blackouts at high latitudes";

  const actLevel: ImpactLevel = kp >= 8 ? "high" : kp >= 6 ? "moderate" : kp >= 4 ? "low" : "none";
  const actSum =
    actLevel === "none"       ? "Quiet geomagnetic conditions expected" :
    actLevel === "low"        ? "Active geomagnetic conditions possible" :
    actLevel === "moderate"   ? "Minor to moderate storm conditions" :
                                "Major geomagnetic storm conditions";

  return [
    { kind: "aurora",         level: auroraLevel, label: "Aurora",         summary: auroraSum },
    { kind: "radio",          level: radioLevel,   label: "HF Radio",       summary: radioSum  },
    { kind: "solar_activity", level: actLevel,     label: "Solar Activity", summary: actSum    },
  ];
}

function buildScrubData(data: HelioNow, offsetH: number): ScrubData | null {
  if (offsetH <= 0) return null;
  const pts = data.metrics.kp_forecast_3h ?? [];
  if (!pts.length) return null;

  const targetMs = Date.now() + offsetH * 3_600_000;
  let nearest = pts[0];
  let minDiff  = Infinity;
  for (const pt of pts) {
    const d = Math.abs(new Date(pt.t_utc).getTime() - targetMs);
    if (d < minDiff) { minDiff = d; nearest = pt; }
  }

  const kp           = nearest.kp;
  const gScale       = kpToGScale(kp);
  const auroraLabel  = kpToAuroraLabel(kp);
  const auroraMinLat = kpToMinLat(kp);
  const impacts      = kpToImpacts(kp);
  return { offsetH, kp, gScale, auroraLabel, auroraMinLat, impacts };
}

// ── Forecast & scrubber ───────────────────────────────────────────────────────

function renderForecast(data: HelioNow, scrubOffset: number, scrubData: ScrubData | null): string {
  const { forecast, metrics } = data;
  const { kp_max_next_24h, kp_max_at_utc, trend } = forecast;
  const pts: KpForecastPoint[] = (metrics.kp_forecast_3h ?? []).slice(0, 16);
  const n      = pts.length;
  const maxH   = n * 3;                                              // full chart range
  const pct    = maxH > 0 ? `${(scrubOffset / maxH * 100).toFixed(0)}%` : "0%";
  const scrubLabel = scrubOffset > 0
    ? `⏱ +${Math.round(scrubOffset)}h`
    : "Timeline";

  let forecastText = "Kp forecast unavailable";
  if (kp_max_next_24h != null) {
    const timeStr  = fmtKpTime(kp_max_at_utc);
    const trendStr = trend === "rising" ? "rising" : trend === "falling" ? "falling" : "steady";
    forecastText   = `Peak Kp ${kp_max_next_24h.toFixed(1)} next 24h${timeStr ? ` at ${timeStr}` : ""} · ${trendStr}`;
  }

  if (!pts.length) return `
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast · Next 24h</div>
      <div class="hw-forecast-text">${escText(forecastText)}</div>
    </div>`; // no scrubber when no data

  const W = 320, BAR_H = 38, LABEL_H = 14, H = BAR_H + LABEL_H;
  const bw  = W / n;
  const kpY = (kp: number) => BAR_H - Math.max(2, Math.min(BAR_H - 2, (kp / 9) * (BAR_H - 2)));

  // Bars + labels + tooltip rects
  let barsSvg = "";
  const trendRaw: number[] = pts.map(p => p.kp);
  const trendSmooth = smooth3(trendRaw);

  pts.forEach((p, i) => {
    const by  = kpY(p.kp);
    const bh  = BAR_H - by;
    const bx  = i * bw;
    const cx  = bx + bw / 2;
    const col = p.kp >= 6 ? "#e05c5c" : p.kp >= 5 ? "#e0a84a" : p.kp >= 4 ? "#d4cc5c" : "#5cce8c";
    const tip = `Kp ${p.kp.toFixed(1)} · ${fmtKpTime(p.t_utc)}`;

    // Colored bar
    barsSvg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(bw - 1.5).toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}" fill-opacity="0.85" rx="1.5"/>`;

    // Invisible hover target with tooltip
    barsSvg += `<rect x="${bx.toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${BAR_H}" fill="transparent"><title>${esc(tip)}</title></rect>`;

    // Time label — local hour, every 2nd bar (= every 6h) for dense charts
    const showLabel = n <= 8 || i % 2 === 0;
    if (showLabel) {
      const hour = new Date(p.t_utc).getHours();
      barsSvg += `<text x="${cx.toFixed(1)}" y="${(H - 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${hour.toString().padStart(2, "0")}</text>`;
    }
  });

  // Smoothed trend line
  const trendPoints = pts.map((_, i) => {
    const cx = i * bw + bw / 2;
    const ty = kpY(trendSmooth[i]);
    return `${cx.toFixed(1)},${ty.toFixed(1)}`;
  }).join(" ");

  const trendSvg = `<polyline points="${trendPoints}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Vertical scrub marker at current offset
  let markerSvg = "";
  if (scrubOffset > 0 && n > 0) {
    const mx = Math.min(W - 1, (scrubOffset / (n * 3)) * W);
    markerSvg = `
      <line x1="${mx.toFixed(1)}" y1="0" x2="${mx.toFixed(1)}" y2="${BAR_H}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${mx.toFixed(1)},${BAR_H} ${(mx - 4).toFixed(1)},${(BAR_H - 7).toFixed(1)} ${(mx + 4).toFixed(1)},${(BAR_H - 7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`;
  }

  // Scrub slider
  const q4 = Math.round(maxH / 4), q2 = Math.round(maxH / 2), q3 = Math.round((maxH * 3) / 4);
  const scrubHtml = `
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${escText(scrubLabel)}</span>
        ${scrubOffset > 0 ? `<button class="hw-scrub-reset">↺ Live</button>` : ""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${maxH}" step="1" value="${scrubOffset}" style="--pct:${pct}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${q4}h</span>
        <span class="hw-scrub-tick">+${q2}h</span>
        <span class="hw-scrub-tick">+${q3}h</span>
        <span class="hw-scrub-tick">+${maxH}h</span>
      </div>
    </div>`;

  const simBannerHtml = scrubData ? `
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">⏱ +${Math.round(scrubData.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${scrubData.kp.toFixed(1)} · ${scrubData.gScale}</span>
    </div>` : "";

  return `
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast · Next 24h</div>
      ${simBannerHtml}
      <div class="hw-forecast-text">${escText(forecastText)}</div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" preserveAspectRatio="none">
        ${barsSvg}
        ${trendSvg}
        ${markerSvg}
      </svg>
      ${scrubHtml}
    </div>`;
}

// ── Impact icons (inline SVG, 12×12, currentColor) ───────────────────────────

// ── Solar active regions overlay ──────────────────────────────────────────────

interface SolarRegion {
  region: number;
  location: string;       // e.g. "S15E54"
  spot_class: string | null;
  mag_class:  string | null;
  c_flare_probability: number;
  m_flare_probability: number;
  x_flare_probability: number;
}

/** Parse NOAA location string "N##E##" → {lat, lon} in degrees. */
function parseSolarLocation(loc: string): { lat: number; lon: number } | null {
  const m = /([NS])(\d+)([EW])(\d+)/i.exec(loc);
  if (!m) return null;
  return {
    lat: (m[1].toUpperCase() === "N" ?  1 : -1) * parseInt(m[2], 10),
    lon: (m[3].toUpperCase() === "E" ?  1 : -1) * parseInt(m[4], 10),
  };
}

/** Render SVG dot-overlay of active regions on top of the solar disk image. */
function renderSolarOverlay(regions: SolarRegion[], sizePx: number): string {
  const cx = sizePx / 2;
  const diskR = cx * 0.87; // HMI disk fills ~87% of the square image
  const dots = regions.map(reg => {
    const pos = parseSolarLocation(reg.location);
    if (!pos || Math.abs(pos.lon) > 88) return ""; // skip behind-limb regions
    const latR = pos.lat * Math.PI / 180;
    const lonR = pos.lon * Math.PI / 180;
    const x = (cx + diskR * Math.cos(latR) * Math.sin(lonR)).toFixed(1);
    const y = (cx - diskR * Math.sin(latR)).toFixed(1);
    const color = reg.x_flare_probability > 0  ? "#e05c5c"
                : reg.m_flare_probability > 10 ? "#e0a84a"
                : reg.c_flare_probability > 20 ? "#d4cc5c"
                : "#c8d8e0";
    const tip = `AR ${reg.region} · ${reg.location
      }\nClass: ${reg.spot_class ?? "—"} / ${reg.mag_class ?? "—"
      }\nC: ${reg.c_flare_probability}%  M: ${reg.m_flare_probability}%  X: ${reg.x_flare_probability}%`;
    return `<g style="pointer-events:all">
      <title>${escText(tip)}</title>
      <circle cx="${x}" cy="${y}" r="3.5" fill="${color}" stroke="#000" stroke-width="0.6" opacity="0.88"/>
      <text x="${x}" y="${(parseFloat(y) - 5).toFixed(1)}" font-size="5" fill="${color}" text-anchor="middle" font-family="monospace" opacity="0.95">${reg.region}</text>
    </g>`;
  }).join("");
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${dots}</svg>`;
}

const IMPACT_ICONS: Record<string, string> = {
  aurora: `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>`,
  radio:  `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>`,
  solar_activity: `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>`,
};
const IMPACT_ICON_FALLBACK = `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>`;

const SOLAR_DISK_URL = "https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg";
const SOLAR_DISK_PX  = 80;

function renderImpacts(data: HelioNow, scrubData: ScrubData | null, solarRegions: SolarRegion[] | null): string {
  const rows = scrubData?.impacts ?? data.observer_impacts ?? [];
  const rowsHtml = rows.map(row => {
    const color      = IMPACT_COLOR[row.level] ?? "#666";
    const levelLabel = row.level === "none" ? "None" : row.level.charAt(0).toUpperCase() + row.level.slice(1);
    const icon       = IMPACT_ICONS[row.kind] ?? IMPACT_ICON_FALLBACK;
    const iconColor  = row.level === "none" ? "#606870" : color;
    const tipHtml    = row.kind === "solar_activity"
      ? `<div class="hw-solar-tip">
           <div class="hw-solar-disk-wrap">
             <img class="hw-solar-disk-img" src="${SOLAR_DISK_URL}" alt="Solar disk" loading="lazy" />
             ${solarRegions ? renderSolarOverlay(solarRegions, SOLAR_DISK_PX) : ""}
           </div>
           <span class="hw-solar-tip-text">${escText(row.summary)}</span>
         </div>`
      : `<div class="hw-impact-tip">${escText(row.summary)}</div>`;
    return `<div class="hw-impact-row">
      <span class="hw-impact-kind" style="color:${iconColor}">${icon}<span style="color:#b4c6cc">${escText(row.label)}</span></span>
      <span class="hw-impact-badge" style="background:${color}22;color:${color}">${escText(levelLabel)}</span>
      ${tipHtml}
    </div>`;
  }).join("");
  const simNote = scrubData
    ? `<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> · simulated</span>`
    : "";
  return `
    <div class="hw-impacts">
      <div class="hw-section-label">Observer Impacts${simNote}</div>
      ${rowsHtml}
    </div>`;
}

// ── Alert icons (inline SVG, 13×13) ──────────────────────────────────────────

const ALERT_ICONS: Record<string, string> = {
  geomagnetic_storm:  `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>`,
  geomagnetic_watch:  `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>`,
  radio_blackout:     `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
  radiation_storm:    `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>`,
  cme_arrival:        `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>`,
  cme_watch:          `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  aurora_watch:       `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>`,
  solar_flare:        `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>`,
  space_weather_info: `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>`,
  unknown:            `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>`,
};

function renderAlertItem(ev: HelioEvent, isOpen: boolean): string {
  const lvlColor  = ALERT_LEVEL_COLOR[ev.level] ?? "#666";
  const lvlLabel  = ev.level.charAt(0).toUpperCase() + ev.level.slice(1);
  const icon      = ALERT_ICONS[ev.kind] ?? ALERT_ICONS.unknown;
  const meta      = [fmtAlertTs(ev.t_utc), ev.source_code ? `SWPC: ${ev.source_code}` : ""]
    .filter(Boolean).join(" · ");
  const bodyHtml  = isOpen && ev.raw_body
    ? `<div class="hw-alert-body">${escText(ev.raw_body)}</div>`
    : "";
  const openClass = isOpen ? " hw-alert-open" : "";
  return `<div class="hw-alert-item${openClass}" style="border-color:${lvlColor}" data-alert-key="${esc(ev.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${lvlColor}">${icon}</span>
      <span class="hw-alert-level" style="color:${lvlColor}">${escText(lvlLabel)}</span>
      <span class="hw-alert-title">${escText(ev.title)}</span>
    </div>
    <div class="hw-alert-summary">${escText(ev.summary_short)}</div>
    <div class="hw-alert-meta">${escText(meta)}</div>
    ${bodyHtml}
  </div>`;
}

const ALERTS_DEFAULT_LIMIT = 3;

function renderAlerts(data: HelioNow, alertsExpanded: boolean, expandedAlertKey: string | null): string {
  const all    = data.alerts_all ?? [];
  const total  = all.length;
  if (total === 0) return `
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts</span>
      </div>
      <div class="hw-empty-alerts">No significant recent SWPC alerts</div>
    </div>`;

  const visible    = alertsExpanded ? all : all.slice(0, ALERTS_DEFAULT_LIMIT);
  const hiddenCnt  = total - ALERTS_DEFAULT_LIMIT;
  const toggleBtn  = hiddenCnt > 0 ? (
    alertsExpanded
      ? `<button class="hw-alerts-toggle hw-alerts-expand">▲ Show less</button>`
      : `<button class="hw-alerts-toggle hw-alerts-expand">▼ Show all ${total}</button>`
  ) : "";
  const items = visible.map(ev => renderAlertItem(ev, ev.dedupe_key === expandedAlertKey)).join("");
  return `
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts (${total})</span>
        ${toggleBtn}
      </div>
      ${items}
    </div>`;
}

function renderCard(
  data:             HelioNow,
  expanded:         boolean,
  heroExpanded:     boolean,
  activePopover:    string | null,
  scrubOffset:      number,
  alertsExpanded:   boolean,
  expandedAlertKey: string | null,
  solarRegions:     SolarRegion[] | null,
  opts:             HelioWidgetOptions,
  ovationData:      OvationData | null,
): string {
  const scrubData = buildScrubData(data, scrubOffset);
  return `
    <div class="hw-root">
      ${renderHeader(data)}
      ${renderHero(data, heroExpanded, activePopover, scrubData, opts, ovationData)}
      ${heroExpanded ? renderHeroDetail(data) : ""}
      ${renderForecast(data, scrubOffset, scrubData)}
      ${renderImpacts(data, scrubData, solarRegions)}
      ${renderAlerts(data, alertsExpanded, expandedAlertKey)}
    </div>`;
}

function renderError(msg: string): string {
  return `<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${escText(msg)}</div>
    </div>
  </div>`;
}

function renderLoading(): string {
  return `<div class="hw-root"><div class="hw-loading">Loading space weather data…</div></div>`;
}

// ── Widget state + lifecycle ─────────────────────────────────────────────────

class HelioWidgetInstance {
  private el:               HTMLElement;
  private opts:             HelioWidgetOptions;
  private expanded          = false;
  private heroExpanded      = false;
  private activePopover:    string | null = null;
  private scrubOffset       = 0;
  private alertsExpanded    = false;
  private expandedAlertKey: string | null = null;
  private solarRegions:     SolarRegion[] | null = null;
  private ovationData:      OvationData | null = null;
  private timer:            ReturnType<typeof setTimeout> | null = null;
  private data:             HelioNow | null = null;

  constructor(el: HTMLElement, opts: HelioWidgetOptions) {
    this.el   = el;
    this.opts = opts;
    this.el.innerHTML = renderLoading();
    this.el.addEventListener("click",  this.onClick.bind(this));
    this.el.addEventListener("input",  this.onInput.bind(this));
    this.el.addEventListener("change", this.onChange.bind(this));
    this.fetch();
  }

  private onClick(e: Event): void {
    const target = e.target as Element;

    // Reset scrub to live
    if (target.closest(".hw-scrub-reset")) {
      this.scrubOffset = 0;
      this.render();
      return;
    }

    // Alerts: expand/collapse all
    if (target.closest(".hw-alerts-expand")) {
      this.alertsExpanded = !this.alertsExpanded;
      this.render();
      return;
    }

    // Alert item: toggle full message
    const alertEl = target.closest("[data-alert-key]") as HTMLElement | null;
    if (alertEl) {
      const key = alertEl.dataset.alertKey ?? null;
      this.expandedAlertKey = this.expandedAlertKey === key ? null : key;
      this.render();
      return;
    }

    // Close button inside a KPI popover
    if (target.closest(".hw-kpi-close")) {
      this.activePopover = null;
      this.render();
      return;
    }

    // KPI item click — toggle its popover
    const kpiEl = target.closest("[data-kpi]") as HTMLElement | null;
    if (kpiEl) {
      const key = kpiEl.dataset.kpi ?? null;
      this.activePopover = this.activePopover === key ? null : key;
      this.render();
      return;
    }

    // Card-level expand (header + "▼ More" button)
    if (target.closest(".hw-toggle")) {
      this.expanded = !this.expanded;
      this.render();
      return;
    }

    // Hero detail expand ("▼ Details" button only)
    if (target.closest(".hw-hero-click")) {
      this.heroExpanded = !this.heroExpanded;
      this.render();
    }
  }

  /** Live update: only patch label + slider fill — no full re-render to keep drag smooth. */
  private onInput(e: Event): void {
    const inp = e.target as HTMLInputElement;
    if (!inp.matches("[data-scrub]")) return;
    const val = parseFloat(inp.value);
    this.scrubOffset = val;
    // Update visual indicator inline (avoids killing slider focus)
    inp.style.setProperty("--pct", `${(val / parseFloat(inp.max) * 100).toFixed(0)}%`);
    const lbl = this.el.querySelector(".hw-scrub-title");
    if (lbl) lbl.textContent = val > 0
      ? `⏱ +${Math.round(val)}h`
      : "Timeline";
  }

  /** Full re-render when user releases the scrub slider. */
  private onChange(e: Event): void {
    if (!(e.target as HTMLElement).matches("[data-scrub]")) return;
    this.render();
  }

  private async fetch(): Promise<void> {
    try {
      const res = await fetch(this.opts.dataUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.data = await res.json() as HelioNow;
      this.render();
      this.fetchSolarRegions();  // parallel, re-renders when ready
      this.fetchOvationData();   // parallel, re-renders when ready
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.el.innerHTML = renderError(`Space weather data unavailable (${msg})`);
    } finally {
      this.timer = setTimeout(() => this.fetch(), this.opts.refreshMs ?? REFRESH_MS_DEFAULT);
    }
  }

  private async fetchSolarRegions(): Promise<void> {
    try {
      const res = await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");
      if (!res.ok) return;
      const all = await res.json() as (SolarRegion & { observed_date: string })[];
      // Keep only the latest observation per region number
      const latest = new Map<number, SolarRegion & { observed_date: string }>();
      for (const r of all) {
        const prev = latest.get(r.region);
        if (!prev || r.observed_date > prev.observed_date) latest.set(r.region, r);
      }
      this.solarRegions = [...latest.values()];
      this.render();
    } catch { /* non-critical, overlay just won't show */ }
  }

  private async fetchOvationData(): Promise<void> {
    if (this.opts.lat == null || this.opts.lon == null) return; // no observer → skip
    try {
      const res = await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");
      if (!res.ok) return;
      const json = await res.json() as Record<string, unknown>;
      // NOAA format: { "coordinates": [[lon, lat, aurora], ...], "type": "MultiPoint", ... }
      // "Data Format" field confirms: [Longitude, Latitude, Aurora]
      const raw = (json["coordinates"] ?? json["Data"] ?? json["data"] ?? []) as [number, number, number][];
      const entries: OvationEntry[] = raw.map(([lon, lat, prob]) => ({ lon, lat, prob }));
      this.ovationData = {
        entries,
        forecastTime: String(json["Forecast Time"] ?? json["forecast_time"] ?? json["Observation Time"] ?? ""),
      };
      this.render();
    } catch { /* non-critical */ }
  }


  private render(): void {
    if (!this.data) return;
    this.el.innerHTML = renderCard(
      this.data, this.expanded, this.heroExpanded, this.activePopover,
      this.scrubOffset, this.alertsExpanded, this.expandedAlertKey,
      this.solarRegions, this.opts, this.ovationData,
    );
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.el.removeEventListener("click", this.onClick.bind(this));
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const HelioWidget = {
  mount(el: HTMLElement, opts: HelioWidgetOptions): HelioWidgetInstance {
    injectCss();
    return new HelioWidgetInstance(el, opts);
  },
};

declare global { interface Window { HelioWidget: typeof HelioWidget; } }
if (typeof window !== "undefined") window.HelioWidget = HelioWidget;
