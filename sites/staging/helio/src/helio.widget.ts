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
  CmeTrackerEvent, CmeTrackerStatus, CmeImpactLevel,
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

const CME_IMPACT_COLOR: Record<string, string> = {
  low:      "#5cce8c",
  moderate: "#d4cc5c",
  high:     "#e05c5c",
  unknown:  "#96a8b8",
};

const CME_STATUS_LABEL: Record<string, string> = {
  detected:       "Detected",
  inbound:        "Inbound",
  arrival_window: "Arriving",
  arrived:        "Arrived",
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

function fmtCmeTs(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-GB", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "UTC", hour12: false,
    }) + " UTC";
  } catch { return ts; }
}

// ── Escape helpers ───────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** Scroll targets for hero G/R/S/X chips (fragment ids below the hero). */
const HERO_SCALE_SCROLL_IDS = {
  G: "geomagnetic",
  R: "radio",
  S: "radiation",
  X: "solar",
} as const;

type HeroScaleChipKey = keyof typeof HERO_SCALE_SCROLL_IDS;

function normalizeHeroXClass(x: string): string {
  const t = x.trim();
  if (t.toUpperCase().startsWith("X:")) return t.slice(2).trim() || "—";
  return t || "—";
}

/** NOAA G/R/S index 0–5 from scale label (e.g. G3 → 3). */
function tierFromNoaaScale(scale: string, prefix: "G" | "R" | "S"): number {
  const s = scale.trim().toUpperCase();
  if (s.length < 2 || s[0] !== prefix) return 0;
  const n = parseInt(s.slice(1), 10);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(5, n);
}

interface HeroScaleChipPalette {
  color: string;
  background: string;
  borderColor: string;
}

/** G / R / S chips: quiet → severe (matches app greens / ambers / reds). */
function heroGrsChipColors(tier: number): HeroScaleChipPalette {
  if (tier <= 0) return { color: "#96a8b8", background: "#1e2830", borderColor: "#2a3c42" };
  if (tier === 1) return { color: "#d4cc5c", background: "#2a2616", borderColor: "#5a5028" };
  if (tier === 2) return { color: "#e0a84a", background: "#2c2214", borderColor: "#6a5018" };
  if (tier === 3) return { color: "#e8a060", background: "#301810", borderColor: "#744018" };
  if (tier === 4) return { color: "#e07058", background: "#2c1412", borderColor: "#762820" };
  return { color: "#e05c5c", background: "#2e1214", borderColor: "#7a2828" };
}

/** X chip: GOES class letter, aligned with XRAY_COLOR ramps. */
function heroXChipColors(letter: string): HeroScaleChipPalette {
  const L = letter.trim().toUpperCase();
  if (L === "—" || L === "" || L === "-") {
    return { color: "#607880", background: "#1e2830", borderColor: "#2a3c42" };
  }
  const fg = XRAY_COLOR[L] ?? "#a0b4b8";
  const bg: Record<string, string> = {
    A: "#242628", B: "#15221c", C: "#1a2215", M: "#221a10", X: "#281416",
  };
  const br: Record<string, string> = {
    A: "#404448", B: "#2a5a40", C: "#3e6a30", M: "#6a5018", X: "#7a2828",
  };
  return {
    color: fg,
    background: bg[L] ?? "#1e2830",
    borderColor: br[L] ?? "#3a4c52",
  };
}

function resolveHeroScaleLabels(data: HelioNow, scrubData: ScrubData | null): { g: string; r: string; s: string; x: string } {
  const xFallback = data.metrics.xray_class != null ? String(data.metrics.xray_class) : "—";
  const base = {
    g: scrubData?.gScale ?? data.scales.g_scale,
    r: data.scales.r_scale,
    s: data.scales.s_scale,
    x: normalizeHeroXClass(xFallback),
  };
  const h = data.hero?.scales;
  if (!h) return base;
  return {
    g: h.g ?? base.g,
    r: h.r ?? base.r,
    s: h.s ?? base.s,
    x: normalizeHeroXClass(h.x ?? base.x),
  };
}

// ── CSS ──────────────────────────────────────────────────────────────────────

const WIDGET_CSS = `
.hw-root{font-family:inherit;color:#e0e0e0;background:#161c1e;border-radius:6px;overflow:hidden}
.hw-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#1a2428;border-bottom:1px solid #2a3438}
.hw-header-title{font-size:.78em;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b4c4cc}
.hw-freshness{font-size:.72em;color:#96a8b8}

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
.hw-scales-row{display:flex;gap:6px;justify-content:flex-end}
.hw-scale-chip{font-size:.72em;font-weight:600;padding:1px 6px;border-radius:2px;background:#222e32;color:#96a8b8;border:1px solid #2a3c42}
.hw-scale-chip.hw-scale-active{color:#e0a84a;border-color:#5a4020}
.hw-hero-scale-chip{font:inherit;font-family:inherit;line-height:inherit;margin:0;-webkit-appearance:none;appearance:none;text-align:center;cursor:pointer;border-style:solid;border-width:1px;transition:filter .12s,box-shadow .12s}
.hw-hero-scale-chip:hover{filter:brightness(1.14)}
.hw-hero-scale-chip:active{filter:brightness(0.96)}
.hw-hero-scale-chip:focus{outline:none}
.hw-hero-scale-chip:focus-visible{outline:2px solid #5a8a98;outline-offset:1px}
.hw-summary-text{font-size:.78em;color:#96a8b8;line-height:1.4}

/* Hero toggle (bottom-left, 2 font steps up) */
.hw-hero-toggle-btn{font-size:.78em;color:#96a8b8;background:none;border:none;cursor:pointer;padding:0;white-space:nowrap;margin-top:8px;display:block;transition:color .15s}
.hw-hero-toggle-btn:hover{color:#b4c6cc}
.hw-section-toggle{font-size:.78em;color:#96a8b8;background:none;border:none;cursor:pointer;padding:8px 14px;white-space:nowrap;display:block;width:100%;text-align:left;transition:color .15s}
.hw-section-toggle:hover{color:#b4c6cc}
/* Radio Blackout R-scale (horizontal blocks) */
.hw-radio-scale{display:flex;gap:5px;margin:4px 0 6px}
.hw-radio-block{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.hw-radio-blabel{font-size:.82em;font-weight:700}
.hw-radio-bbar{width:100%;height:7px;border-radius:3px}
.hw-radio-bdesc{font-size:.70em;text-align:center;line-height:1.2}
.hw-radio-meta{font-size:.75em;color:#7a9298;margin-top:2px}
/* Solar Cycle section */
.hw-sc-body{padding:4px 14px 10px}
.hw-sc-name{font-size:.82em;color:#96a8b8;margin-bottom:2px}
.hw-sc-svg{display:block;overflow:visible}
.hw-sc-axlabel{font-size:11px;fill:#607880;font-family:inherit}
.hw-sc-footer{font-size:.75em;color:#7a9298;margin-top:3px}
/* Geomagnetic Storm Probability */
.hw-gstorm-header{font-size:.75em;color:#7a9298;margin-bottom:5px}
.hw-gstorm-rows{display:flex;flex-direction:column;gap:4px}
.hw-gstorm-row{display:flex;align-items:center;gap:6px}
.hw-gstorm-lbl{font-size:.82em;font-weight:700;min-width:18px;flex-shrink:0}
.hw-gstorm-track{flex:1;height:6px;background:#1e2c30;border-radius:3px;overflow:hidden}
.hw-gstorm-fill{height:100%;border-radius:3px;transition:width .3s}
.hw-gstorm-pct{font-size:.78em;min-width:28px;text-align:right;flex-shrink:0}
.hw-gstorm-footer{font-size:.70em;color:#607880;margin-top:5px}
/* Storm Progress Indicator */
@keyframes hw-spi-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.hw-spi-wrap{margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e2c30;cursor:default}
.hw-spi-hdr{font-size:.73em;color:#7a9298;margin-bottom:7px}
.hw-spi-track{display:flex;align-items:center;gap:2px;cursor:default}
.hw-spi-node{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;cursor:default}
.hw-spi-dot{width:9px;height:9px;border-radius:50%;border:2px solid #1e2c30;background:#111b1e;flex-shrink:0}
.hw-spi-dot-active{animation:hw-spi-pulse 2s ease-in-out infinite}
.hw-spi-txt{font-size:.70em;font-weight:600;letter-spacing:.02em}
.hw-spi-arr{color:#2a3c42;font-size:.78em;flex-shrink:0;margin-bottom:13px;cursor:default}
.hw-spi-params{font-size:.70em;color:#607880;margin-top:7px;padding-top:6px;border-top:1px solid #1e2c30}
/* Coronal Hole / HSS Indicator */
.hw-hss-diagram{display:block;width:100%;margin:4px 0 5px;overflow:visible}
.hw-hss-meta{font-size:.75em;color:#7a9298;margin-top:1px}
/* Satellite Drag Indicator */
.hw-satdrag-ladder{display:flex;flex-direction:column;gap:4px;margin:4px 0 6px}
.hw-satdrag-rung{display:flex;align-items:center;gap:7px}
.hw-satdrag-label{font-size:.82em;font-weight:700;min-width:54px;flex-shrink:0}
.hw-satdrag-bar-track{flex:1;height:6px;background:#1e2c30;border-radius:3px;overflow:hidden}
.hw-satdrag-bar-fill{height:100%;border-radius:3px}
.hw-satdrag-mark{font-size:.72em;min-width:14px;flex-shrink:0}
.hw-satdrag-meta{font-size:.75em;color:#7a9298;margin-top:2px}
/* GNSS Disturbance Risk */
.hw-gnss-ladder{display:flex;flex-direction:column;gap:4px;margin:4px 0 6px}
.hw-gnss-rung{display:flex;align-items:center;gap:7px}
.hw-gnss-label{font-size:.82em;font-weight:700;min-width:54px;flex-shrink:0}
.hw-gnss-bar-track{flex:1;height:6px;background:#1e2c30;border-radius:3px;overflow:hidden}
.hw-gnss-bar-fill{height:100%;border-radius:3px}
.hw-gnss-mark{font-size:.72em;min-width:14px;flex-shrink:0}
.hw-gnss-meta{font-size:.75em;color:#7a9298;margin-top:2px}
/* Solar Wind Dynamic Pressure gauge */
.hw-swdp-gauge{display:block;width:100%;margin:4px 0 5px;overflow:visible}
.hw-swdp-axlabel{font-size:10px;fill:#607880;font-family:inherit}
.hw-swdp-meta{font-size:.75em;color:#7a9298;margin-top:1px}
/* CME Impact Uncertainty Cone (Observer Impacts panel) */
.hw-cme-cone-svg{display:block;width:100%;margin:4px 0 5px;overflow:visible}
.hw-cme-footer{font-size:.75em;color:#7a9298;margin-top:2px}
.hw-solar-earth-scene{display:block;width:100%;margin:4px 0 5px;overflow:hidden}

/* Hero quick details — KPI items are clickable */
.hw-quick-details{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-kpi-item{display:flex;align-items:baseline;gap:5px;cursor:pointer;border-radius:4px;padding:3px 5px;margin:-3px -5px;transition:background .12s}
.hw-kpi-item:hover{background:#ffffff0d}
.hw-kpi-item.hw-kpi-active{background:#ffffff12}
.hw-qd-label{font-size:.68em;color:#96a8b8;flex-shrink:0}
.hw-qd-value{font-size:.82em;font-weight:600}
.hw-trend{font-size:.8em;opacity:.72;margin-left:2px;font-weight:400;letter-spacing:0}

/* KPI popover */
.hw-kpi-popover{background:#0e1517;border-radius:4px;padding:10px 12px;margin-top:10px;border:1px solid #1e2c30}
.hw-kpi-popover-title{font-size:.68em;color:#96a8b8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.hw-kpi-popover-close{background:none;border:none;color:#96a8b8;cursor:pointer;font-size:.9em;padding:0;line-height:1;transition:color .15s}
.hw-kpi-popover-close:hover{color:#b4c6cc}
.hw-kpi-stat-row{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #1a2428}
.hw-kpi-stat{display:flex;flex-direction:column;gap:2px;flex:1}
.hw-kpi-stat-label{font-size:.63em;color:#96a8b8;text-transform:uppercase;letter-spacing:.05em}
.hw-kpi-stat-value{font-size:.78em;font-weight:600;color:#b4c6cc}
.hw-kpi-hint{font-size:.72em;color:#96a8b8;margin-top:8px;padding:6px 8px;background:#131a1c;border-radius:3px;border-left:2px solid #2a3c42;line-height:1.4}
.hw-xray-scale{display:flex;gap:0;height:6px;border-radius:3px;overflow:hidden;margin-top:8px}
.hw-xray-scale-band{flex:1;position:relative}
.hw-xray-scale-marker{position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid #fff}
.hw-xray-scale-labels{display:flex;margin-top:3px}
.hw-xray-scale-label{flex:1;font-size:.63em;color:#96a8b8;text-align:center}
.hw-aurora-map-wrap{position:relative;border-radius:3px;overflow:hidden;background:#0a1012}
.hw-aurora-img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
.hw-aurora-caption{font-size:.65em;color:#96a8b8;margin-top:5px;text-align:center}
.hw-aurora-obs-panel{display:flex;align-items:center;gap:5px;padding:5px 0 1px;font-size:.72em;color:#9ab4bc}
.hw-aurora-prob{font-weight:600;margin-left:auto}

/* Hero detail panel */
.hw-hero-detail{border-bottom:1px solid #1e2c30;padding:10px 14px;background:#131a1c}
.hw-spark-row{margin-bottom:10px}
.hw-spark-row:last-child{margin-bottom:0}
.hw-spark-label{font-size:.65em;color:#96a8b8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.hw-spark-wrap{border-radius:3px;overflow:hidden;background:#0e1517}

/* Forecast */
.hw-forecast{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-section-label{font-size:.68em;color:#96a8b8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.hw-forecast-text{font-size:.78em;color:#b4c6cc;margin-bottom:8px}
.hw-forecast-bars{display:flex;align-items:flex-end;gap:2px;height:40px}
.hw-bar-col{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1}
.hw-bar{width:100%;border-radius:2px 2px 0 0;min-height:2px}

/* Timeline scrubber */
.hw-scrub-wrap{margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-scrub-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.hw-scrub-title{font-size:.65em;color:#96a8b8;letter-spacing:.04em}
.hw-scrub-reset{font-size:.65em;color:#96a8b8;background:none;border:none;cursor:pointer;padding:0 2px;line-height:1.2;transition:color .15s}
.hw-scrub-reset:hover{color:#b4c6cc}
.hw-scrub-slider{width:100%;cursor:pointer;margin:2px 0 0;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:linear-gradient(to right,#5cce8c var(--pct,0%),#2a3c42 var(--pct,0%));outline:none;display:block}
.hw-scrub-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;margin-top:-4.5px}
.hw-scrub-slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;border:none}
.hw-scrub-tick-row{display:flex;justify-content:space-between;margin-top:3px}
.hw-scrub-tick{font-size:.62em;color:#96a8b8}
/* Simulated state banner */
.hw-sim-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1c2810;border:1px solid #364a1e;border-radius:3px;padding:4px 8px;margin-top:8px}
.hw-sim-badge{font-size:.72em;font-weight:600;color:#9acf60}
.hw-sim-kp{font-size:.72em;color:#7a9870}

/* Impacts */
.hw-impacts{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-impact-row{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap;cursor:default;border-radius:3px;padding:3px 4px;margin-left:-4px;margin-right:-4px;transition:background .12s}
.hw-impact-row:last-child{margin-bottom:0}
.hw-impact-row{cursor:pointer}
.hw-impact-row:hover{background:#ffffff09}
.hw-impact-row.hw-impact-open{background:#ffffff06}
.hw-impact-caret{font-size:.6em;color:#607880;margin-right:5px;flex-shrink:0;transition:transform .15s}
.hw-impact-row.hw-impact-open .hw-impact-caret{transform:rotate(90deg)}
.hw-impact-kind{font-size:.75em;font-weight:600;min-width:88px;color:#b4c6cc;display:flex;align-items:center;gap:5px}
.hw-impact-badge{font-size:.68em;font-weight:700;padding:1px 7px;border-radius:2px;text-transform:capitalize;min-width:52px;text-align:center;flex-shrink:0;margin-left:auto}
.hw-impact-tip{flex-basis:100%;font-size:.86em;color:#96a8b8;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px;overflow:hidden}
.hw-impact-tip.hw-impact-tip-open{display:block}
.hw-solar-tip,.hw-aurora-tip{flex-basis:100%;display:none;flex-direction:column;align-items:stretch;gap:6px;margin-top:6px;padding:10px 6px 8px;background:#111b1e;border-radius:4px;border:1px solid #1e2c30}
.hw-solar-tip{align-items:center}
.hw-solar-tip.hw-solar-open,.hw-aurora-tip.hw-aurora-tip-open{display:flex}
.hw-solar-disk-wrap{position:relative;flex-shrink:0;width:240px;height:240px}
.hw-solar-disk-img{position:absolute;top:0;left:0;width:240px;height:240px;border-radius:50%;object-fit:cover;background:#0a0a0a;border:1px solid #2a3c42}
.hw-solar-tip-text{font-size:.72em;color:#96a8b8;line-height:1.5;text-align:center}
.hw-solar-layers{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}
.hw-sl-btn{font-size:.63em;padding:2px 8px;border-radius:3px;border:1px solid;cursor:pointer;background:transparent;transition:opacity .15s;font-family:inherit;letter-spacing:.03em}
.hw-impact-row[data-solar-toggle]{cursor:pointer}

/* Alerts */
.hw-alerts{padding:10px 14px}
.hw-alerts-header{display:flex;align-items:center;margin-bottom:8px}
.hw-alerts-label{font-size:.68em;color:#96a8b8;letter-spacing:.06em;text-transform:uppercase}
.hw-alert-item{border-left:2px solid;padding:7px 10px;margin-bottom:6px;border-radius:0 3px 3px 0;background:#1a2428;cursor:pointer;transition:background .12s}
.hw-alert-item:last-child{margin-bottom:0}
.hw-alert-item:hover{background:#1e2c32}
.hw-alert-item.hw-alert-open{background:#1e2c32}
.hw-alert-top{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.hw-alert-icon{flex-shrink:0;opacity:.85}
.hw-alert-level{font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.hw-alert-title{font-size:.8em;font-weight:600;color:#ccdade}
.hw-alert-summary{font-size:.75em;color:#96a8b8;line-height:1.3;margin-bottom:3px}
.hw-alert-meta{font-size:.68em;color:#96a8b8}
.hw-alert-body{margin-top:8px;padding:7px 8px;background:#111b1e;border-radius:2px;font-size:.7em;color:#96a8b8;line-height:1.55;white-space:pre-wrap;font-family:monospace;word-break:break-word;border-top:1px solid #2a3c42}
.hw-empty-alerts{font-size:.78em;color:#96a8b8;font-style:italic;padding:4px 0}

/* Collapsible section rows (shared by Timeline header, SWPC Alerts, per-day headers) */
.hw-section-row{display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none;padding:2px 4px;margin:-2px -4px 4px;border-radius:3px;transition:background .12s}
.hw-section-row:hover{background:#ffffff09}
.hw-section-caret{font-size:.68em;color:#96a8b8;flex-shrink:0;width:10px;display:inline-block}

/* Timeline */
.hw-timeline{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-tl-group{margin-bottom:10px}
.hw-tl-group:last-child{margin-bottom:0}
.hw-tl-day-row{display:flex;align-items:center;gap:5px;cursor:pointer;user-select:none;padding:2px 4px;margin:-2px -4px 4px;border-radius:3px;transition:background .12s}
.hw-tl-day-row:hover{background:#ffffff09}
.hw-tl-date{font-size:.65em;color:#96a8b8;letter-spacing:.06em;text-transform:uppercase}
.hw-tl-day-count{font-size:.63em;color:#7a9098;margin-left:2px}
.hw-tl-item{display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:3px 4px;border-radius:3px;margin-left:-4px;margin-right:-4px;transition:background .12s}
.hw-tl-item:hover{background:#ffffff09}
.hw-tl-chain{display:flex;flex-direction:column;align-items:center;padding-top:3px;width:8px;flex-shrink:0}
.hw-tl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.hw-tl-line{width:1px;flex:1;background:#2a3c44;min-height:12px;margin-top:2px}
.hw-tl-body{flex:1;min-width:0;padding-bottom:2px}
.hw-tl-meta{display:flex;align-items:center;gap:6px;margin-bottom:1px}
.hw-tl-time{font-size:.65em;color:#96a8b8}
.hw-tl-src{font-size:.60em;color:#7a9098;letter-spacing:.03em}
.hw-tl-title{font-size:.76em;color:#c4d4d8;line-height:1.3}
.hw-tl-title.hw-tl-active{color:#e0f0e8;font-weight:600}
.hw-tl-detail{font-size:.70em;color:#96a8b8;margin-top:4px;padding:6px 8px;background:#111b1e;border-radius:3px;line-height:1.55;white-space:pre-wrap;word-break:break-word;border-top:1px solid #1e2c30}

/* Magnetosphere */
.hw-info-top-row{display:flex;gap:8px;align-items:flex-start}
.hw-magnet-mini{flex-shrink:0;cursor:pointer;border-radius:4px;border:1px solid #1e2c30;padding:1px;transition:background .12s;display:flex;flex-direction:column;align-items:center;width:80px}
.hw-magnet-mini:hover,.hw-magnet-mini.hw-kpi-active{background:#ffffff0d;border-color:#2a3c42}
/* Solar Disk Mini Loop */
.hw-solar-mini-wrap{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default;border-radius:4px;border:1px solid #1e2c30;padding:1px}
.hw-solar-mini-inner{position:relative;width:86px;height:86px;border-radius:50%;overflow:hidden;border:1px solid #2a3c42;background:#0a0a0a;flex-shrink:0}
.hw-solar-mini-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;object-position:center}
.hw-solar-mini-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s;background:transparent}
.hw-solar-mini-switcher{display:flex;align-items:center;gap:3px;margin-top:3px}
.hw-solar-mini-btn{background:none;border:none;color:#607880;font-size:.75em;cursor:pointer;padding:0 2px;line-height:1;transition:color .12s;font-family:inherit}
.hw-solar-mini-btn:hover{color:#b4c6cc}
.hw-solar-mini-lbl{font-size:.60em;color:#96a8b8;letter-spacing:.02em;min-width:52px;text-align:center;font-weight:600}
.hw-magnet-state{font-size:.64em;text-align:center;margin-top:2px;font-weight:600;letter-spacing:.03em}
@keyframes hw-wind{0%{transform:translateX(0);opacity:.85}100%{transform:translateX(14px);opacity:0}}
.hw-wg{animation:hw-wind 1.5s linear infinite}
@keyframes hw-arrow-chase{0%{opacity:.12}4%{opacity:.42}8%{opacity:.82}13%{opacity:.82}18%{opacity:.42}23%{opacity:.12}100%{opacity:.12}}

/* Bz Gauge */
.hw-bz-gauge-wrap{margin-bottom:8px}
.hw-bz-gauge-labels{display:flex;justify-content:space-between;font-size:.6em;color:#607880;margin-top:2px;padding:0 2px}

/* CME Tracker */
.hw-cme{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-cme-row{display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;padding:2px 4px;margin:-2px -4px 6px;border-radius:3px;transition:background .12s}
.hw-cme-row:hover{background:#ffffff09}
.hw-cme-badge{font-size:.68em;font-weight:700;padding:1px 8px;border-radius:2px;text-transform:capitalize;margin-left:auto;flex-shrink:0}
.hw-cme-svg{width:100%;display:block;height:44px;margin-bottom:4px}
.hw-cme-detail{margin-top:6px;padding:8px 10px;background:#111b1e;border-radius:4px;border:1px solid #1e2c30}
.hw-cme-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-top:0}
.hw-cme-stat{display:flex;flex-direction:column;gap:1px}
.hw-cme-stat-label{font-size:.63em;color:#96a8b8;text-transform:uppercase;letter-spacing:.05em}
.hw-cme-stat-value{font-size:.78em;font-weight:600;color:#b4c6cc}
.hw-cme-note{font-size:.68em;color:#96a8b8;margin-top:6px;line-height:1.4}
@keyframes hw-cme-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.6)}}
.hw-cme-pulse-dot{animation:hw-cme-pulse 1.6s ease-in-out infinite}

/* States */
.hw-error{padding:16px;text-align:center;color:#96a8b8}
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
  const latest = pts[pts.length - 1];
  const speed    = data.metrics.solar_wind_kms;
  const speedStr = speed != null ? `${Math.round(speed)} km/s` : "—";
  const speedColor = speed != null
    ? (speed >= 700 ? "#e05c5c" : speed >= 500 ? "#e0a84a" : speed >= 400 ? "#d4cc5c" : "#5cce8c")
    : "#607880";
  const densityVal  = latest?.density      != null ? `${latest.density.toFixed(2)} cm⁻³`      : "—";
  const tempVal     = latest?.temp_kk      != null ? `${latest.temp_kk.toFixed(0)} kK`         : "—";
  const pressureVal = latest?.pressure_npa != null ? `${latest.pressure_npa.toFixed(2)} nPa`   : "—";

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("Solar Wind · Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${speedColor}">${escText(speedStr)}</span>
      </div>
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
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: ▶ HISTORY</div>
  </div>`;
}

function renderXrayPopover(data: HelioNow): string {
  const currentClass = data.metrics.xray_class ?? "A";
  const flux = data.metrics.xray_flux_wm2;
  const fluxStr = flux != null ? flux.toExponential(2) + " W/m²" : "—";

  const bands = [
    { label: "A", color: "#888"    },
    { label: "B", color: "#5cce8c" },
    { label: "C", color: "#aad47a" },
    { label: "M", color: "#e0a84a" },
    { label: "X", color: "#e05c5c" },
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
    ${renderPopoverHeader("X-Ray · Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${scaleBands}</div>
      <div class="hw-xray-scale-labels">${scaleLabels}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${XRAY_COLOR[currentClass] ?? "#a0b4b8"}">${escText(currentClass)}-class</b> · ${escText(fluxStr)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: ▶ HISTORY</div>
  </div>`;
}

function renderBzGauge(bz: number | null): string {
  // Layout: triangle pointer above track, value label below track
  // H=36: 0..10 = triangle zone, 10..20 = track zone, 20..30 = label zone, 30..36 = padding
  const W = 200, H = 36;
  const MAX = 20;
  const cx = W / 2;
  const trackY = 16, trackH = 6;   // track top-y and height
  const trackMid = trackY + trackH / 2;

  const track = `<rect x="0" y="${trackY}" width="${W}" height="${trackH}" rx="3" fill="#1e2c30"/>`;

  // Threshold tick marks at ±5, ±10 (inside track)
  const ticks = [-10, -5, 5, 10].map(v => {
    const x = cx + (v / MAX) * cx;
    return `<line x1="${x.toFixed(1)}" y1="${trackY}" x2="${x.toFixed(1)}" y2="${trackY + trackH}" stroke="#2a3c42" stroke-width="1"/>`;
  }).join("");

  // Center tick — slightly taller
  const centerTick = `<line x1="${cx}" y1="${trackY - 2}" x2="${cx}" y2="${trackY + trackH + 2}" stroke="#3a4c52" stroke-width="1.5"/>`;

  if (bz == null) {
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block">${track}${ticks}${centerTick}</svg>`;
  }

  const color = bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz < 0 ? "#d4b84a" : bz >= 5 ? "#5cce8c" : "#7acca8";
  const clampedBz = Math.max(-MAX, Math.min(MAX, bz));
  const markerX = cx + (clampedBz / MAX) * cx;

  // Colored bar: rx=3 (= trackH/2) gives semicircular end caps.
  // Shift bar by rx so the cap's visual CENTER aligns with markerX,
  // making the triangle tip point to the center of the cap (not its edge).
  const capR = 3;
  const barStartX = clampedBz < 0 ? markerX - capR : cx - capR;
  const barW = Math.max(2 * capR, Math.abs(markerX - cx) + 2 * capR);
  const bar = `<rect x="${barStartX.toFixed(1)}" y="${trackY}" width="${barW.toFixed(1)}" height="${trackH}" rx="${capR}" fill="${color}" opacity="0.82"/>`;

  // Downward-pointing triangle above the track (▼)
  const triSize = 5;
  const triTip  = trackY - 1;           // tip of triangle just touches track top
  const triBase = triTip - triSize * 1.1;
  const triangle = `<polygon points="${markerX.toFixed(1)},${triTip.toFixed(1)} ${(markerX - triSize).toFixed(1)},${triBase.toFixed(1)} ${(markerX + triSize).toFixed(1)},${triBase.toFixed(1)}" fill="${color}"/>`;

  // Vertical stem from triangle tip to track midline
  const stem = `<line x1="${markerX.toFixed(1)}" y1="${triTip.toFixed(1)}" x2="${markerX.toFixed(1)}" y2="${trackMid.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.6"/>`;

  // Value label below track
  const labelY = trackY + trackH + 9;
  const label = `<text x="${markerX.toFixed(1)}" y="${labelY}" text-anchor="middle" font-size="8" fill="${color}" font-weight="600">${bz >= 0 ? "+" : ""}${bz.toFixed(1)}</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block">
    ${track}${ticks}${centerTick}${bar}${triangle}${stem}${label}
  </svg>`;
}

function renderBzPopover(data: HelioNow): string {
  const bz       = data.metrics.imf_bz_nt;
  const bt       = data.metrics.imf_bt_nt;
  const wind     = data.metrics.solar_wind_kms;
  const pressure = (data.metrics as Record<string, unknown>).pressure_npa as number | null | undefined ?? null;

  const bzColor  = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";
  const bzStr    = bz != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";
  const btStr    = bt != null ? bt.toFixed(1) + " nT" : "—";
  const windStr  = wind != null ? `${Math.round(wind)} km/s` : "—";
  const pressStr = pressure != null ? `${(pressure as number).toFixed(2)} nPa` : "—";

  const magnetInfo   = deriveMagnetInfo(data);

  const aurora = bz != null && bz < -5
    ? { msg: "Southward IMF · Aurora favorable", color: "#5cce8c" }
    : bz != null && bz < 0
    ? { msg: "Weakly southward · Conditions may improve", color: "#d4cc5c" }
    : { msg: "Northward IMF · Stable magnetosphere", color: "#96a8b8" };

  return `<div class="hw-kpi-popover">
    ${renderPopoverHeader("IMF Bz · Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${renderBzGauge(bz)}
      <div class="hw-bz-gauge-labels"><span>−20 nT</span><span>−10</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${bzColor}">${escText(bzStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${escText(btStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${escText(windStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${escText(pressStr)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${aurora.color};font-weight:600;margin-bottom:4px">${escText(aurora.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${magnetInfo.color};font-weight:600">${escText(magnetInfo.coupling)}</span> · Trend history: ▶ Details</div>
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
    // ── viewBox "-60 0 280 120" — Sun arc off-screen left, Earth+tail off-screen right ──
    // Sun center at cx=-60, r=80: large golden arc visible at left edge of frame
    //   at x=0: y = 60 ± sqrt(80²-60²) = 60 ± 53 → arc spans y≈7..113 (almost full height)
    //   right edge at x=20 → just the rightmost crescent of the Sun visible
    // Magnetosphere tail at tailX=240 extends 20px past right edge (220) → clipped = elongated
    const VX = -60, VW = 280;             // viewBox: x from -60 to 220
    const ey = 60;
    const sx = -60, sr = 80;             // Sun: center off-screen, large arc at left edge
    const ex = 155, er = 5;              // Earth: right side of frame
    const standoff = info.state === "storm" ? 16 : info.state === "active" ? 26 : 38;
    const nx   = ex - standoff;
    const topY = info.state === "storm" ? 22 : info.state === "active" ? 30 : 40;
    const botY = 120 - topY;
    const tailX = 240;                   // extends beyond right edge → tail clips naturally

    const path = [
      `M ${nx},${ey}`,
      `C ${nx - 4},${ey - 18} ${ex - 5},${topY} ${ex},${topY}`,
      `C ${ex + 18},${topY} ${tailX - 5},${topY + 18} ${tailX},${ey}`,
      `C ${tailX - 5},${botY - 18} ${ex + 18},${botY} ${ex},${botY}`,
      `C ${ex - 5},${botY} ${nx - 4},${ey + 18} ${nx},${ey}`,
      "Z",
    ].join(" ");

    const couplingPath = `M ${nx + 2},${ey} C ${nx + 2},${ey - standoff * 0.4} ${ex - 3},${ey - 6} ${ex - er},${ey} C ${ex - 3},${ey + 6} ${nx + 2},${ey + standoff * 0.4} ${nx + 2},${ey} Z`;

    const windColor = wKms > 700 ? "#e05c5c" : wKms > 500 ? "#e0a84a" : wKms > 350 ? "#d4c840" : "#5cce8c";
    const wDur      = wKms > 700 ? 0.4 : wKms > 500 ? 0.65 : wKms > 350 ? 1.1 : 1.8;
    const arrowRows = wKms > 500 ? [10, 24, 40, 57, 74, 90, 106]  // 7 rows
                    : wKms > 350 ? [14, 34, 57, 82, 104]           // 5 rows
                                 : [20, 50, 82, 108];               // 4 rows
    const S = 16;
    const clipStart = sx + sr + 2;       // = 22 (just past Sun right edge)
    const clipEnd   = nx - 6;
    const numArrows = Math.ceil((clipEnd - clipStart) / S) + 2;
    const arrowXs   = Array.from({ length: numArrows }, (_, i) => clipStart - S + i * S);
    const aLen = 12, aHead = 8;
    const arrowSet = arrowXs.flatMap(ax =>
      arrowRows.map(y =>
        `<path d="M ${ax},${y} L ${ax + aLen},${y} M ${ax + aHead},${y - 3} L ${ax + aLen},${y} L ${ax + aHead},${y + 3}" stroke="${windColor}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      )
    ).join("");
    const windGroups = `<g class="hw-wg-full" style="animation-duration:${wDur}s">${arrowSet}</g>`;

    const bzArrow = bz == null ? "" : bz > 0
      ? `<path d="M ${ex},${ey + 4} L ${ex},${ey - 4} M ${ex - 2},${ey - 2} L ${ex},${ey - 4} L ${ex + 2},${ey - 2}" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      : `<path d="M ${ex},${ey - 4} L ${ex},${ey + 4} M ${ex - 2},${ey + 2} L ${ex},${ey + 4} L ${ex + 2},${ey + 2}" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    const bzLabel = bz == null ? "" :
      `<text x="${ex + 8}" y="${ey + 2}" font-size="6" fill="${bz > 0 ? "#5cce8c" : "#e05c5c"}" font-family="monospace">Bz${bz > 0 ? "↑" : "↓"}</text>`;

    return buildHelioSolarEarthScene("magnetosphere", {
      magnetInfo: info,
      bz,
      windKms: wind,
      uid: uid,
    });
  }
}

// ── Shared Solar–Earth SVG Scene ─────────────────────────────────────────────
function buildHelioSolarEarthScene(
  mode: "magnetosphere" | "coronal_hole" | "cme_cone",
  opts: {
    magnetInfo?: MagnetInfo;
    bz?: number | null;
    windKms?: number | null;
    hssState?: HSSState;
    cmeState?: CMEState;
    uid?: string;
  } = {}
): string {
  const W = 1000, H = 260, midY = 130;
  const uid = opts.uid ?? "hse";

  // Geometry anchors
  // Earth is placed left-of-center so the dayside nose is a tight compressed
  // bulge and the nightside tail has plenty of room to extend rightward.
  const SUN_CX    = 0,   SUN_R    = 160;   // Sun: large arc, right edge at x=160
  const EARTH_CX  = 800, EARTH_R  = 17;    // ~4/5 of width from left
  const EARTH_LEFT = EARTH_CX - EARTH_R;

  // Magnetosphere geometry — asymmetric: short sunward standoff, long nightside tail
  const magInfo  = opts.magnetInfo;
  const magState = magInfo?.state ?? "stable";
  const magColor = magInfo?.color ?? "#e0a84a";
  const standoff = magState === "storm" ? 55 : magState === "active" ? 80 : 110;
  const noseX    = EARTH_CX - standoff;        // 690–745
  const halfW    = magState === "storm" ? 58  : magState === "active" ? 76  : 95;
  const tailX    = W + 120;                    // 1120 — tail extends well past right edge
  const tailHW   = 20;

  // Upper boundary: blunt nose → max width near Earth → narrow tail
  // Lower boundary: mirror image
  const magPath = [
    `M ${noseX},${midY}`,
    `C ${noseX - 8},${midY - halfW * 0.55} ${EARTH_CX - 18},${midY - halfW} ${EARTH_CX},${midY - halfW}`,
    `C ${EARTH_CX + 120},${midY - halfW} ${tailX - 180},${midY - tailHW} ${tailX},${midY - tailHW}`,
    `L ${tailX},${midY + tailHW}`,
    `C ${tailX - 180},${midY + tailHW} ${EARTH_CX + 120},${midY + halfW} ${EARTH_CX},${midY + halfW}`,
    `C ${EARTH_CX - 18},${midY + halfW} ${noseX - 8},${midY + halfW * 0.55} ${noseX},${midY}`,
    "Z",
  ].join(" ");

  const magEmph     = mode === "magnetosphere";
  const magFillOp   = magEmph ? (magState === "storm" ? "0.12" : "0.08") : "0.04";
  const magStrokeOp = magEmph ? "0.75" : "0.28";

  // ── Base layer groups ───────────────────────────────────────────────────
  const sunGroup = `<g id="${uid}-base-sun">
    <circle cx="${SUN_CX}" cy="${midY}" r="${SUN_R + 18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${SUN_CX}" cy="${midY}" r="${SUN_R}" fill="#f0c040" opacity="0.88"/>
  </g>`;

  const earthGrid = `
    <ellipse cx="${EARTH_CX}" cy="${midY}" rx="${EARTH_R}" ry="${(EARTH_R * 0.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${EARTH_CX}" y1="${midY - EARTH_R}" x2="${EARTH_CX}" y2="${midY + EARTH_R}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${EARTH_LEFT}" y1="${midY}" x2="${EARTH_CX + EARTH_R}" y2="${midY}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`;
  const earthGroup = `<g id="${uid}-base-earth">
    <circle cx="${EARTH_CX}" cy="${midY}" r="${EARTH_R}" fill="#1a4a6e" opacity="0.92"/>
    ${earthGrid}
  </g>`;

  const magGroup = `<g id="${uid}-base-magnetosphere">
    <path d="${magPath}" fill="${magColor}" fill-opacity="${magFillOp}"
          stroke="${magColor}" stroke-opacity="${magStrokeOp}" stroke-width="1.8"/>
    ${magInfo ? `<text x="${noseX + 5}" y="${midY - halfW - 7}" font-size="12" fill="${magColor}"
          opacity="0.85" font-family="sans-serif">${magInfo.label}</text>` : ""}
  </g>`;

  const axisGroup = `<g id="${uid}-base-axis">
    <line x1="${SUN_R}" y1="${midY}" x2="${noseX}" y2="${midY}"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`;

  // ── Overlay: Solar wind (magnetosphere mode) ────────────────────────────
  let solarWindContent = "";
  if (mode === "magnetosphere") {
    const wKms  = opts.windKms ?? 0;
    const wHigh = wKms > 500, wSlow = wKms < 350;
    // Chase period ×1.3 slower; two waves travel simultaneously (offset T/2 each)
    const T     = (wHigh ? 0.5 : wSlow ? 1.4 : 0.9) * 1.3;
    const wCol  = wKms > 700 ? "#e05c5c" : wKms > 500 ? "#e0a84a" : wKms > 350 ? "#d4c840" : "#5cce8c";
    const clipS = SUN_R + 8;
    const clipE = noseX - 14;

    // 8 columns evenly across corridor, 6 rows evenly across height
    const N_COLS = 8, N_ROWS = 6;
    const colStep = (clipE - clipS) / (N_COLS - 1);
    const rowStep = H / (N_ROWS + 1);
    const aL = 38, aH = 24;   // large arrows in SVG-unit space

    // Chase animation: col 0 lights first, col 7 last, repeating left→right.
    // Two waves travel simultaneously — wave 1 and wave 2 offset by T/2.
    const N_WAVES = 2;
    const colGroups = Array.from({ length: N_COLS }, (_, col) => {
      const ax    = clipS + col * colStep;
      const paths = Array.from({ length: N_ROWS }, (__, row) => {
        const y = rowStep * (row + 1);
        return `<path d="M ${ax.toFixed(1)},${y.toFixed(1)} L ${(ax+aL).toFixed(1)},${y.toFixed(1)} M ${(ax+aH).toFixed(1)},${(y-6).toFixed(1)} L ${(ax+aL).toFixed(1)},${y.toFixed(1)} L ${(ax+aH).toFixed(1)},${(y+6).toFixed(1)}"
          stroke="${wCol}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join("");
      return Array.from({ length: N_WAVES }, (__, wave) => {
        const delay = -((N_COLS - col) / N_COLS * T) - (wave * T / N_WAVES);
        return `<g style="opacity:.12;animation:hw-arrow-chase ${T}s linear ${delay.toFixed(3)}s infinite">${paths}</g>`;
      }).join("");
    }).join("");

    const bz = opts.bz ?? null;
    const bzHtml = bz == null ? "" : (() => {
      const col = bz > 0 ? "#5cce8c" : "#e05c5c";
      const arrow = bz > 0
        ? `<path d="M ${EARTH_CX},${midY+7} L ${EARTH_CX},${midY-7} M ${EARTH_CX-3},${midY-4} L ${EARTH_CX},${midY-7} L ${EARTH_CX+3},${midY-4}"
           stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
        : `<path d="M ${EARTH_CX},${midY-7} L ${EARTH_CX},${midY+7} M ${EARTH_CX-3},${midY+4} L ${EARTH_CX},${midY+7} L ${EARTH_CX+3},${midY+4}"
           stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      return `${arrow}<text x="${EARTH_CX+22}" y="${midY+5}" font-size="13"
        fill="${col}" font-family="monospace">Bz${bz > 0 ? "↑" : "↓"}</text>`;
    })();
    solarWindContent = `${colGroups}${bzHtml}`;
  }
  const solarWindGroup = `<g id="${uid}-overlay-solar-wind">${solarWindContent}</g>`;

  // ── Overlay: Coronal Hole / HSS (coronal_hole mode) ─────────────────────
  let coronalContent = "";
  if (mode === "coronal_hole" && opts.hssState) {
    const hss    = opts.hssState;
    const spd    = hss.speed ?? 0;
    const watch  = spd >= 420;
    const sCol   = hss.color;
    const sOp    = watch  ? "0.85" : "0.25";
    const fanOp  = spd >= 500 ? "0.18" : watch ? "0.10" : "0.04";
    const fX1    = SUN_R + 8;
    const fX2    = EARTH_LEFT - 16;
    const fanH   = 60;
    const fanPts = `${fX1},${midY} ${fX2},${midY - fanH} ${fX2},${midY + fanH}`;
    const arrX   = fX2 + 6;
    const arrPts = `${arrX},${midY - 10} ${arrX + 18},${midY} ${arrX},${midY + 10}`;
    coronalContent = `
    <polygon points="${fanPts}" fill="${sCol}" opacity="${fanOp}"/>
    <line x1="${fX1}" y1="${midY}" x2="${fX2 - 5}" y2="${midY}"
          stroke="${sCol}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${sOp}"/>
    <polygon points="${arrPts}" fill="${sCol}" opacity="${watch ? "0.9" : "0.25"}"/>`;
  }
  const coronalGroup = `<g id="${uid}-overlay-coronal-hole">${coronalContent}</g>`;

  // ── Overlay: CME Cone (cme_cone mode) ───────────────────────────────────
  let cmeContent = "";
  if (mode === "cme_cone" && opts.cmeState) {
    const cme      = opts.cmeState;
    const coneOriX = SUN_R;
    const coneEndX = EARTH_LEFT - 10;
    const coneLen  = coneEndX - coneOriX;
    const td       = (d: number) => Math.tan(d * Math.PI / 180);
    const outerHW  = Math.round(td(9) * coneLen);
    const midHW    = Math.round(td(6) * coneLen);
    const innerHW  = Math.round(td(3) * coneLen);
    const tri      = (hw: number) => `${coneOriX},${midY} ${coneEndX},${midY - hw} ${coneEndX},${midY + hw}`;
    if (cme.status !== "quiet") {
      const earthFill = (cme.status === "impact") ? "#e05c5c" : "#d4cc5c";
      cmeContent = `
    <polygon points="${tri(outerHW)}" fill="#253238" opacity="0.85"/>
    <polygon points="${tri(midHW)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${tri(innerHW)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${coneOriX + 14}" y1="${midY}" x2="${coneEndX - 5}" y2="${midY}"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${EARTH_CX}" cy="${midY}" r="${EARTH_R + 8}" fill="none"
            stroke="${earthFill}" stroke-width="7" opacity="0.16"/>`;
    } else {
      cmeContent = `
    <line x1="${coneOriX + 14}" y1="${midY}" x2="${EARTH_LEFT - 14}" y2="${midY}"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`;
    }
  }
  const cmeGroup = `<g id="${uid}-overlay-cme-cone">${cmeContent}</g>`;

  // ── Labels ───────────────────────────────────────────────────────────────
  const labelsGroup = `<g id="${uid}-overlay-labels">
    <text x="18" y="${H - 10}" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${EARTH_CX}" y="${H - 8}" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;

  return `<svg class="hw-solar-earth-scene" viewBox="0 0 ${W} ${H}"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="${W}" height="${H}" fill="#0a1014"/>
    ${axisGroup}
    ${solarWindGroup}
    ${coronalGroup}
    ${cmeGroup}
    ${sunGroup}
    ${magGroup}
    ${earthGroup}
    ${labelsGroup}
  </svg>`;
}

function renderMagnetospherePopover(data: HelioNow): string {
  const info     = deriveMagnetInfo(data);
  const bz       = data.metrics.imf_bz_nt;
  const wind     = data.metrics.solar_wind_kms;
  const kp       = data.metrics.kp_latest;
  const density  = (data.metrics as Record<string, unknown>).density  as number | null | undefined;
  const pressure = (data.metrics as Record<string, unknown>).pressure_npa as number | null | undefined;

  const bzStr      = bz      != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";
  const windStr    = wind    != null ? `${Math.round(wind)} km/s` : "—";
  const densityStr = density != null ? `${(density as number).toFixed(1)} p/cm³` : "—";
  const pressStr   = pressure != null ? `${(pressure as number).toFixed(2)} nPa` : "—";
  const bzColor    = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";
  const windColor  = wind != null ? (wind > 700 ? "#e05c5c" : wind > 500 ? "#e0a84a" : wind > 350 ? "#d4c840" : "#5cce8c") : "#607880";

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
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${windColor}">${escText(windStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${bzColor}">${escText(bzStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${info.color}">${escText(info.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${escText(densityStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${escText(pressStr)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${escText(hintText)}</div>
  </div>`;
}

/** Tip content for Magnetosphere impact row (Observer Impacts panel) */
function renderMagnetosphereTip(data: HelioNow, isOpen: boolean): string {
  if (!isOpen) return "";
  const info     = deriveMagnetInfo(data);
  const bz       = data.metrics.imf_bz_nt;
  const wind     = data.metrics.solar_wind_kms;
  const density  = (data.metrics as Record<string, unknown>).density  as number | null | undefined;
  const pressure = (data.metrics as Record<string, unknown>).pressure_npa as number | null | undefined;

  const bzStr      = bz      != null ? (bz >= 0 ? "+" : "") + bz.toFixed(1) + " nT" : "—";
  const windStr    = wind    != null ? `${Math.round(wind)} km/s` : "—";
  const densityStr = density != null ? `${(density as number).toFixed(1)} p/cm³` : "—";
  const pressStr   = pressure != null ? `${(pressure as number).toFixed(2)} nPa` : "—";
  const bzColor    = bz != null ? (bz <= -10 ? "#e05c5c" : bz <= -5 ? "#e0a84a" : bz >= 5 ? "#5cce8c" : "#a0b4b8") : "#607880";
  const windColor  = wind != null ? (wind > 700 ? "#e05c5c" : wind > 500 ? "#e0a84a" : wind > 350 ? "#d4c840" : "#5cce8c") : "#607880";

  const hintText = (bz != null && bz < -5)
    ? "Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely."
    : (bz != null && bz < 0)
    ? "Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible."
    : "Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";

  const scene = buildHelioSolarEarthScene("magnetosphere", { windKms: wind ?? undefined, bz: bz ?? undefined });

  return `<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${scene}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${windColor}">${escText(windStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${bzColor}">${escText(bzStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${info.color}">${escText(info.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${escText(densityStr)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${escText(pressStr)}</span>
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

function renderSolarMini(activePopover: string | null, channelIdx: number, baseUrl?: string): string {
  const ch  = SOLAR_CHANNELS[channelIdx];
  const hmi = SUN_HMI_URL;
  const src = resolveAssetUrl(ch.url, baseUrl);
  return `<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner">
      <img class="hw-solar-mini-img" src="${esc(src)}" alt="${esc(ch.label)}"
        onerror="if(this.src!=='${esc(hmi)}')this.src='${esc(hmi)}'" />
      <video class="hw-solar-mini-video" autoplay loop muted playsinline
        oncanplay="this.style.opacity=1"
        aria-label="Solar disk · ${esc(ch.label)} · last 24h">
        <source src="${esc(SUN_LOOP_URL)}" type="video/mp4">
      </video>
    </div>
    <div class="hw-solar-mini-switcher">
      <button class="hw-solar-mini-btn" data-solar-prev>&#8249;</button>
      <span class="hw-solar-mini-lbl">${esc(ch.label)}</span>
      <button class="hw-solar-mini-btn" data-solar-next>&#8250;</button>
    </div>
  </div>`;
}

function renderHero(
  data: HelioNow, heroExpanded: boolean, indicatorsOpen: boolean, activePopover: string | null,
  scrubData: ScrubData | null, opts: HelioWidgetOptions, ovationData: OvationData | null,
  solarChannelIdx: number = 0,
): string {
  const { summary, scales, metrics, aurora_hint } = data;
  const tone = STATUS_TONE[summary.status] ?? STATUS_TONE.quiet;

  // When scrubbing, display forecasted Kp + G-scale; otherwise live values
  const kp = scrubData != null
    ? scrubData.kp.toFixed(1)
    : (metrics.kp_latest != null ? metrics.kp_latest.toFixed(1) : "—");

  const heroScales = resolveHeroScaleLabels(data, scrubData);
  const heroScaleDefs: { key: HeroScaleChipKey; text: string; title: string; aria: string }[] = [
    { key: "G", text: heroScales.g, title: "Geomagnetic storm level. Based on Kp index.",
      aria: "Geomagnetic storm level" },
    { key: "R", text: heroScales.r, title: "Radio blackout level. Based on solar X-ray flux.",
      aria: "Radio blackout level" },
    { key: "S", text: heroScales.s, title: "Solar radiation storm level. Based on energetic proton flux.",
      aria: "Solar radiation storm level" },
    { key: "X", text: `X:${heroScales.x}`, title: "Current solar X-ray activity class.",
      aria: "Solar X-ray activity" },
  ];
  const scaleChips = heroScaleDefs.map(def => {
    const scrollId = HERO_SCALE_SCROLL_IDS[def.key];
    let pal: HeroScaleChipPalette;
    if (def.key === "G") pal = heroGrsChipColors(tierFromNoaaScale(heroScales.g, "G"));
    else if (def.key === "R") pal = heroGrsChipColors(tierFromNoaaScale(heroScales.r, "R"));
    else if (def.key === "S") pal = heroGrsChipColors(tierFromNoaaScale(heroScales.s, "S"));
    else pal = heroXChipColors(heroScales.x);
    const style = `color:${pal.color};background:${pal.background};border-color:${pal.borderColor}`;
    return `<button type="button" class="hw-scale-chip hw-hero-scale-chip"
      style="${style}" data-hero-scroll="${esc(scrollId)}" title="${esc(def.title)}" aria-label="${esc(def.aria)}">${escText(def.text)}</button>`;
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

  const historyPts   = metrics.kp_history_1h ?? [];
  const lastStepTime = historyPts.length ? fmtKpTime(historyPts[historyPts.length - 1].t_utc) : null;
  const historyLabel = lastStepTime ? `Recent history · Last step ${lastStepTime}` : "Recent history";
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
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${scaleChips}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${escText(summary.text)}</div>
            ${renderSolarMini(activePopover, solarChannelIdx, opts.baseUrl)}
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${indicatorsOpen ? "0" : "4px"}">
        <span class="hw-section-caret">${indicatorsOpen ? "▼" : "▶"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${indicatorsOpen ? `
      <div class="hw-quick-details">
        ${kpiItem("aurora",     "Aurora",     escText(auroraDisp), auroraColor)}
        ${kpiItem("solar_wind", "Solar wind", escText(windDisp),   windColor, windTrend)}
        ${kpiItem("imf_bz",     "IMF Bz",     escText(bzDisp),     bzColor,   bzTrend)}
        ${kpiItem("xray",       "X-ray",      escText(xrayDisp),   xrayColor, xrayTrend)}
      </div>
      ${activePopover ? renderKpiPopover(data, activePopover, opts, ovationData) : ""}` : ""}
      ${auroraBanner}
    </div>`;
}

function renderHeroDetail(data: HelioNow): string {
  const { metrics } = data;
  const kpPts:   KpHistoryPoint[]   = metrics.kp_history_1h  ?? [];
  const windPts: WindHistoryPoint[] = metrics.wind_history_1h ?? [];
  const bzPts:   BzHistoryPoint[]   = metrics.bz_history_1h  ?? [];
  const xrayPts: XrayHistoryPoint[] = metrics.xray_history_1h ?? [];

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
  const xraySvg = sparkXray(xrayPts);

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
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray · Last 24h</div>
        <div class="hw-spark-wrap">${xraySvg}</div>
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

function renderForecast(data: HelioNow, scrubOffset: number, scrubData: ScrubData | null, forecastOpen: boolean): string {
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

  const nextStepTime    = pts.length ? fmtKpTime(pts[0].t_utc) : null;
  const forecastLabel   = nextStepTime ? `Forecast · Next step ${nextStepTime}` : "Forecast";

  if (!pts.length) return `
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${forecastOpen ? "▼" : "▶"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${escText(forecastLabel)}</span>
      </div>
      ${forecastOpen ? `<div class="hw-forecast-text">${escText(forecastText)}</div>` : ""}
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
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${forecastOpen ? "▼" : "▶"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${escText(forecastLabel)}</span>
      </div>
      ${forecastOpen ? `
      ${simBannerHtml}
      <div class="hw-forecast-text">${escText(forecastText)}</div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;display:block" preserveAspectRatio="none">
        ${barsSvg}
        ${trendSvg}
        ${markerSvg}
      </svg>
      ${scrubHtml}` : ""}
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
const SOLAR_LAYER_DEFS = [
  { id: "X",     label: "X-risk", color: "#e05c5c" },
  { id: "M",     label: "M-risk", color: "#e0a84a" },
  { id: "C",     label: "C-risk", color: "#d4cc5c" },
  { id: "quiet", label: "Quiet",  color: "#5cce8c" },
] as const;

function solarRegionLayer(reg: SolarRegion): string {
  return reg.x_flare_probability > 0 ? "X"
       : reg.m_flare_probability > 0 ? "M"
       : reg.c_flare_probability > 0 ? "C"
       : "quiet";
}

function renderSolarOverlay(regions: SolarRegion[], sizePx: number, activeLayers: Set<string>): string {
  const cx    = sizePx / 2;
  const diskR = cx * 0.87; // HMI disk fills ~87% of the square image
  const dotR  = sizePx * 0.030;  // ring radius (~7.2 at 240px)
  const sw    = sizePx * 0.009;  // stroke width (~2.2 at 240px)
  const rings = regions.map(reg => {
    const pos = parseSolarLocation(reg.location);
    // skip behind-limb and "past limb" tracked regions (asterisk in location)
    if (!pos || Math.abs(pos.lon) > 88 || reg.location.includes("*")) return "";
    const layer = solarRegionLayer(reg);
    if (!activeLayers.has(layer)) return "";
    const color = SOLAR_LAYER_DEFS.find(l => l.id === layer)!.color;
    const latR  = pos.lat * Math.PI / 180;
    const lonR  = pos.lon * Math.PI / 180;
    const x     = (cx + diskR * Math.cos(latR) * Math.sin(lonR)).toFixed(1);
    const y     = (cx - diskR * Math.sin(latR)).toFixed(1);
    const tip   = `AR ${reg.region} · ${reg.location
      }\nClass: ${reg.spot_class ?? "—"} / ${reg.mag_class ?? "—"
      }\nC: ${reg.c_flare_probability}%  M: ${reg.m_flare_probability}%  X: ${reg.x_flare_probability}%`;
    return `<g style="pointer-events:all">
      <title>${escText(tip)}</title>
      <circle cx="${x}" cy="${y}" r="${(dotR + sw + 1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(sw * 2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${x}" cy="${y}" r="${dotR.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}"/>
    </g>`;
  }).join("");
  return `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${rings}</svg>`;
}

const IMPACT_ICONS: Record<string, string> = {
  aurora: `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>`,
  radio:  `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>`,
  solar_activity: `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>`,
};
const IMPACT_ICON_FALLBACK = `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>`;

const ASSET_BASE_DEFAULT = "https://staging.nebulacast.app";

function resolveAssetUrl(path: string, baseUrl?: string): string {
  if (!path || /^https?:\/\//.test(path) || path.startsWith("//")) return path;
  const base = (baseUrl ?? ASSET_BASE_DEFAULT).replace(/\/$/, "");
  return base + (path.startsWith("/") ? path : "/" + path);
}

const SOLAR_DISK_URL    = "https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg";

const SOLAR_CHANNELS = [
  { id: "eit171", label: "EIT 171",    url: "/assets/gifs/current_eit_171.gif" },
  { id: "eit195", label: "EIT 195",    url: "/assets/gifs/current_eit_195.gif" },
  { id: "eit284", label: "EIT 284",    url: "/assets/gifs/current_eit_284.gif" },
  { id: "eit304", label: "EIT 304",    url: "/assets/gifs/current_eit_304.gif" },
  { id: "cont",   label: "Continuum",  url: "https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg" },
  { id: "mag",    label: "Magnetogram",url: "https://soho.nascom.nasa.gov/data/realtime/hmi_mag/512/latest.jpg" },
] as const;

const SUN_HMI_URL    = "https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg";
const SUN_AIA171_URL = SOLAR_CHANNELS[0].url;
// NASA SDO publishes a rolling "latest 24h" AIA 171 Å loop, refreshed automatically
const SUN_LOOP_URL   = "https://sdo.gsfc.nasa.gov/assets/img/latest/mpeg/latest_512_0171.mp4";
const SOLAR_DISK_PX  = 240;

function renderRadioBlackoutPanel(data: HelioNow, isOpen: boolean): string {
  const rLevel    = parseInt((data.scales.r_scale ?? "R0").slice(1), 10);
  const xrayClass = data.metrics.xray_class ?? "A";
  const flux      = data.metrics.xray_flux_wm2;
  const fluxStr   = flux != null ? flux.toExponential(2) + " W/m²" : "—";

  const LEVELS = [
    { r: 0, color: "#5cce8c", desc: "Quiet"    },
    { r: 1, color: "#d4cc5c", desc: "Minor"    },
    { r: 2, color: "#e0a84a", desc: "Moderate" },
    { r: 3, color: "#e05c5c", desc: "Strong"   },
    { r: 4, color: "#c0407a", desc: "Severe"   },
    { r: 5, color: "#8c3cc0", desc: "Extreme"  },
  ];

  const blocks = LEVELS.map(l => {
    const isCurrent = l.r === rLevel;
    const isActive  = l.r <= rLevel;
    const barBg     = isActive ? l.color : "#1e2c30";
    const barOp     = isCurrent ? "1" : isActive ? "0.5" : "1";
    const labelCol  = isCurrent ? l.color : isActive ? l.color + "99" : "#566068";
    const descCol   = isCurrent ? l.color : isActive ? l.color + "88" : "#566068";
    return `<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${labelCol}">R${l.r}</span>
      <div class="hw-radio-bbar" style="background:${barBg};opacity:${barOp}"></div>
      <span class="hw-radio-bdesc" style="color:${descCol}">${l.desc}</span>
    </div>`;
  }).join("");

  const openClass = isOpen ? " hw-impact-tip-open" : "";
  return `<div class="hw-impact-tip${openClass}">
    <div class="hw-radio-scale">${blocks}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${XRAY_COLOR[xrayClass] ?? "#a0b4b8"}">${escText(xrayClass)}-class</b> · ${escText(fluxStr)}</div>
  </div>`;
}

// ── Solar Cycle ───────────────────────────────────────────────────────────────

// ── Geomagnetic Storm Probability ────────────────────────────────────────────

const G_STORM_COLORS = { g1: "#d4cc5c", g2: "#e0a84a", g3: "#e05c5c" };
const G_STORM_LABELS = { g1: "Minor", g2: "Moderate", g3: "Strong" };

/** Derive approximate G-storm probabilities from Kp 3-hour forecast. */
function deriveStormProbs(data: HelioNow): { g1: number; g2: number; g3: number } {
  const forecast = data.metrics.kp_forecast_3h ?? [];
  const now = Date.now();
  const cutoff = now + 24 * 60 * 60 * 1000;
  const next24h = forecast.filter(p => {
    const t = new Date(p.t_utc).getTime();
    return t >= now - 3 * 60 * 60 * 1000 && t <= cutoff; // include current period
  });
  if (next24h.length === 0) return { g1: 0, g2: 0, g3: 0 };
  const maxKp = Math.max(...next24h.map(p => p.kp));

  // Ramp: 0% below (threshold - 0.7), ~90% above (threshold + 1)
  const prob = (threshold: number) => {
    if (maxKp < threshold - 0.7) return 0;
    if (maxKp > threshold + 1.0) return 90;
    const frac = (maxKp - (threshold - 0.7)) / 1.7;
    return Math.round(Math.pow(Math.max(0, frac), 0.7) * 90);
  };
  return { g1: prob(5), g2: prob(6), g3: prob(7) };
}

const STORM_PHASE_COLORS = {
  rising:  "#e0884a",
  peak:    "#e05c5c",
  decline: "#d4cc5c",
};

interface StormPhaseResult {
  active:         boolean;
  phase:          "rising" | "peak" | "decline" | "quiet";
  kp_current:     number;
  kp_trend:       number;
  bz_nt:          number | null;
  solar_wind_kms: number | null;
}

function deriveStormPhase(data: HelioNow): StormPhaseResult {
  const kp   = data.metrics.kp_latest ?? 0;
  const bz   = data.metrics.imf_bz_nt;
  const wind = data.metrics.solar_wind_kms;

  const gNum   = parseInt((data.scales.g_scale ?? "G0").replace("G", ""), 10) || 0;
  const active = kp >= 5 || gNum >= 1;

  // Kp trend from last two history readings (3h periods)
  const hist = data.metrics.kp_history_1h ?? [];
  let kp_trend = 0;
  if (hist.length >= 2) {
    kp_trend = hist[hist.length - 1].kp - hist[hist.length - 2].kp;
  }

  if (!active) {
    return { active: false, phase: "quiet", kp_current: kp, kp_trend, bz_nt: bz, solar_wind_kms: wind };
  }

  let phase: "rising" | "peak" | "decline";
  if (kp_trend > 0.3 && (bz == null || bz < -5)) {
    phase = "rising";
  } else if (kp_trend < -0.5) {
    phase = "decline";
  } else {
    phase = "peak";
  }

  return { active: true, phase, kp_current: kp, kp_trend, bz_nt: bz, solar_wind_kms: wind };
}

function renderStormProgress(sp: StormPhaseResult): string {
  if (!sp.active) return "";

  const stages: Array<{ key: "rising" | "peak" | "decline"; label: string }> = [
    { key: "rising",  label: "Rising"  },
    { key: "peak",    label: "Peak"    },
    { key: "decline", label: "Decline" },
  ];

  const curIdx     = stages.findIndex(s => s.key === sp.phase);
  const phaseColor = STORM_PHASE_COLORS[sp.phase];
  const phaseLabel = stages[curIdx].label;

  const nodesHtml = stages.map((s, i) => {
    const isCur  = i === curIdx;
    const isPast = i < curIdx;
    const col    = STORM_PHASE_COLORS[s.key];
    const dotStyle = isCur
      ? `background:${col};border-color:${col};box-shadow:0 0 6px ${col}88`
      : isPast
        ? `background:${col}44;border-color:${col}66`
        : `background:#111b1e;border-color:#1e2c30`;
    const dotClass = isCur ? " hw-spi-dot-active" : "";
    const txtStyle = isCur
      ? `color:${col};font-weight:700`
      : isPast
        ? `color:${col}66`
        : `color:#2e4248`;
    const arrow = i < stages.length - 1
      ? `<div class="hw-spi-arr">${isPast ? `<span style="color:${col}55">→</span>` : "→"}</div>`
      : "";
    return `<div class="hw-spi-node">
        <div class="hw-spi-dot${dotClass}" style="${dotStyle}"></div>
        <div class="hw-spi-txt" style="${txtStyle}">${s.label}</div>
      </div>${arrow}`;
  }).join("");

  const parts = [`Kp ${sp.kp_current.toFixed(1)}`];
  if (sp.bz_nt != null) parts.push(`Bz ${sp.bz_nt > 0 ? "+" : ""}${sp.bz_nt.toFixed(1)} nT`);
  if (sp.solar_wind_kms != null) parts.push(`Wind ${Math.round(sp.solar_wind_kms)} km/s`);

  return `<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm · <span style="color:${phaseColor};font-weight:700">${phaseLabel}</span></div>
    <div class="hw-spi-track">${nodesHtml}</div>
    <div class="hw-spi-params">${parts.join(" · ")}</div>
  </div>`;
}

function renderGeomagStormTip(data: HelioNow, isOpen: boolean): string {
  const probs   = deriveStormProbs(data);
  const sp      = deriveStormPhase(data);
  const maxKp24 = (() => {
    const forecast = data.metrics.kp_forecast_3h ?? [];
    const now = Date.now(), cutoff = now + 24 * 60 * 60 * 1000;
    const pts = forecast.filter(p => new Date(p.t_utc).getTime() <= cutoff);
    return pts.length ? Math.max(...pts.map(p => p.kp)) : null;
  })();

  const levels: Array<{ key: "g1"|"g2"|"g3"; label: string }> = [
    { key: "g1", label: "G1" }, { key: "g2", label: "G2" }, { key: "g3", label: "G3" },
  ];

  const rows = levels.map(({ key, label }) => {
    const pct   = probs[key];
    const color = G_STORM_COLORS[key];
    const dim   = pct === 0 ? " opacity:.35" : "";
    return `<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${color};${dim}">${label}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${pct > 0 ? color : "#607880"}">${pct}%</span>
    </div>`;
  }).join("");

  const kpNote = maxKp24 != null
    ? `Max Kp forecast 24h: <b style="color:#b4c6cc">${maxKp24.toFixed(1)}</b>`
    : "";

  const openClass = isOpen ? " hw-impact-tip-open" : "";
  return `<div class="hw-impact-tip${openClass}">
    ${renderStormProgress(sp)}
    <div class="hw-gstorm-header">Storm probability · next 24h</div>
    <div class="hw-gstorm-rows">${rows}</div>
    ${kpNote ? `<div class="hw-gstorm-footer">${kpNote} · derived from Kp forecast</div>` : ""}
  </div>`;
}

// Static config — low-frequency data (~monthly); update manually each season.
// SC25 started Dec 2019, peak ~Jul 2025, expected end ~2030.
// Mar 2026 → 75 months of 132 → progress ≈ 0.57  (declining phase post-peak)
const SOLAR_CYCLE = {
  cycle_name:         "Solar Cycle 25",
  phase:              "declining" as "minimum" | "rising" | "maximum" | "declining",
  progress_0_1:       0.57,
  cycle_start_year:   2019,
  expected_peak_year: 2025,
  expected_end_year:  2030,
  subtitle:           "Activity remains elevated",
};

const SC_PHASE_COLOR: Record<string, string> = {
  minimum:  "#607880",
  rising:   "#d4cc5c",
  maximum:  "#e0a84a",
  declining: "#96a8c8",
};

function renderSolarCycleTip(isOpen: boolean): string {
  const sc         = SOLAR_CYCLE;
  const phaseColor = SC_PHASE_COLOR[sc.phase] ?? "#96a8b8";
  const phaseLabel = sc.phase.charAt(0).toUpperCase() + sc.phase.slice(1);

  // SVG geometry (viewBox-based so it scales to container width)
  const W = 280, H = 52;
  const padX = 10;
  const baseline = H - 6;
  const peakH    = H - 18;
  const mu       = 0.5, sigma = 0.19;
  const bell     = (t: number) => Math.exp(-Math.pow((t - mu) / sigma, 2) / 2);
  const xOf      = (t: number) => padX + t * (W - 2 * padX);
  const yOf      = (t: number) => baseline - bell(t) * peakH;

  const N = 80;
  const fullPts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    fullPts.push(`${i === 0 ? "M" : "L"}${xOf(t).toFixed(1)},${yOf(t).toFixed(1)}`);
  }

  const activeN   = Math.round(sc.progress_0_1 * N);
  const activePts: string[] = [];
  for (let i = 0; i <= activeN; i++) {
    const t = i / N;
    activePts.push(`${i === 0 ? "M" : "L"}${xOf(t).toFixed(1)},${yOf(t).toFixed(1)}`);
  }

  const mx       = xOf(sc.progress_0_1);
  const fillPts  = [`M${padX},${baseline}`, ...activePts.slice(1), `L${mx.toFixed(1)},${baseline} Z`];
  const my       = yOf(sc.progress_0_1);
  const ts       = 5;
  const tri      = `M${mx.toFixed(1)},${my.toFixed(1)} L${(mx-ts).toFixed(1)},${(my-ts*1.8).toFixed(1)} L${(mx+ts).toFixed(1)},${(my-ts*1.8).toFixed(1)} Z`;
  const yL       = baseline + 11;

  const openClass = isOpen ? " hw-impact-tip-open" : "";
  return `<div class="hw-impact-tip${openClass}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${escText(sc.cycle_name)}</div>
    <svg width="100%" height="${H + 14}" viewBox="0 0 ${W} ${H + 14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${fillPts.join(" ")}" fill="${phaseColor}" opacity="0.12"/>
      <path d="${fullPts.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${activePts.join(" ")}" fill="none" stroke="${phaseColor}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${padX}" y1="${baseline}" x2="${W - padX}" y2="${baseline}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${tri}" fill="${phaseColor}"/>
      <text x="${padX + 2}" y="${yL}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${xOf(0.5).toFixed(1)}" y="${yL}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(W - padX - 2).toFixed(1)}" y="${yL}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${phaseColor}">${escText(phaseLabel)}</b>${sc.subtitle ? ` · ${escText(sc.subtitle)}` : ""}</div>
  </div>`;
}

// ── Coronal Hole / HSS Indicator ─────────────────────────────────────────────
interface HSSState {
  status: "quiet" | "watch" | "active" | "strong";
  color:  string;
  label:  string;
  desc:   string;
  speed:  number | null;
}
function deriveHSSState(data: HelioNow): HSSState {
  // Prefer backend-derived coronal_hole field when available
  const speed = data.coronal_hole?.estimated_speed_kms ?? data.metrics.solar_wind_kms;
  const backendStatus = data.coronal_hole?.status;
  const spd   = speed ?? 0;

  const status = backendStatus ?? (
    spd >= 600 ? "strong" : spd >= 500 ? "active" : spd >= 420 ? "watch" : "quiet"
  ) as HSSState["status"];

  const COLOR_MAP: Record<string, string> = {
    strong: "#e05c5c", active: "#e0a84a", watch: "#d4cc5c", quiet: "#5cce8c",
  };
  const LABEL_MAP: Record<string, string> = {
    strong: "Strong", active: "Active", watch: "Watch", quiet: "None",
  };
  const DESC_MAP: Record<string, string> = {
    strong: "Strong high-speed stream",
    active: "High-speed stream active",
    watch:  "Elevated solar wind",
    quiet:  "Background solar wind",
  };

  return {
    status,
    color: COLOR_MAP[status],
    label: LABEL_MAP[status],
    desc:  data.coronal_hole?.note ?? DESC_MAP[status],
    speed,
  };
}

function renderHSSTip(data: HelioNow, isOpen: boolean): string {
  const hss     = deriveHSSState(data);
  const spd     = hss.speed ?? 0;
  const spdStr  = hss.speed != null ? `${Math.round(hss.speed)} km/s` : "—";
  const openCls = isOpen ? " hw-impact-tip-open" : "";

  const watch = spd >= 420;
  const svg = buildHelioSolarEarthScene("coronal_hole", { hssState: hss, uid: "hss" });

  const note = watch
    ? `<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>`
    : `<div class="hw-hss-meta" style="font-size:.72em">Background solar wind · no HSS detected</div>`;

  return `<div class="hw-impact-tip${openCls}">
    ${svg}
    <div class="hw-hss-meta">Solar wind: <b style="color:${hss.color}">${escText(spdStr)}</b> · ${escText(hss.desc)}</div>
    ${note}
  </div>`;
}

// ── Satellite Drag Indicator ──────────────────────────────────────────────────
interface SatDragState {
  level:  0 | 1 | 2;
  color:  string;
  label:  string;
  kp:     number | null;
  gScale: string;
}
function deriveSatDragState(data: HelioNow): SatDragState {
  const gStr  = data.scales.g_scale ?? "G0";
  const gNum  = parseInt(gStr.slice(1), 10);

  // Best Kp: kp_latest, else closest forecast entry near now
  let kp = data.metrics.kp_latest;
  if (kp == null) {
    const forecast = data.metrics.kp_forecast_3h ?? [];
    const now      = Date.now();
    const nearby   = forecast
      .filter(p => new Date(p.t_utc).getTime() <= now + 3 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.t_utc).getTime() - new Date(a.t_utc).getTime());
    if (nearby.length > 0) kp = nearby[0].kp;
  }

  if (gNum >= 2 || (kp != null && kp >= 6)) return { level: 2, color: "#e05c5c", label: "High",     kp, gScale: gStr };
  if (gNum >= 1 || (kp != null && kp >= 4)) return { level: 1, color: "#d4cc5c", label: "Moderate", kp, gScale: gStr };
  return                                           { level: 0, color: "#5cce8c", label: "Low",      kp, gScale: gStr };
}

function renderSatDragTip(data: HelioNow, isOpen: boolean): string {
  const sd      = deriveSatDragState(data);
  const openCls = isOpen ? " hw-impact-tip-open" : "";

  const DRAG_LEVELS = [
    { l: 0 as 0|1|2, label: "Low",      color: "#5cce8c", width: 33,  desc: "Normal density"     },
    { l: 1 as 0|1|2, label: "Moderate", color: "#d4cc5c", width: 64,  desc: "Elevated density"   },
    { l: 2 as 0|1|2, label: "High",     color: "#e05c5c", width: 100, desc: "Strong expansion"   },
  ];

  const rungs = DRAG_LEVELS.map(dl => {
    const isCurrent = dl.l === sd.level;
    const labelCol  = isCurrent ? dl.color : "#566068";
    const barOp     = isCurrent ? "0.88" : "0.16";
    return `<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${labelCol}">${dl.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${dl.width}%;background:${dl.color};opacity:${barOp}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${isCurrent ? dl.color : "transparent"}">${isCurrent ? "◀" : ""}</span>
    </div>`;
  }).join("");

  const kpStr   = sd.kp != null ? `Kp ${sd.kp.toFixed(1)}` : "Kp —";
  const noteMap: Record<number, string> = {
    0: "Near-normal thermospheric density",
    1: "Elevated drag — minor orbit correction may be needed",
    2: "Strong thermospheric expansion — significant drag increase",
  };

  return `<div class="hw-impact-tip${openCls}">
    <div class="hw-satdrag-ladder">${rungs}</div>
    <div class="hw-satdrag-meta">${kpStr} · ${escText(sd.gScale)} · ${noteMap[sd.level]}</div>
  </div>`;
}

// ── GNSS Disturbance Risk ─────────────────────────────────────────────────────
interface GnssState {
  level:  0 | 1 | 2;
  color:  string;
  label:  string;
  kp:     number | null;
  gScale: string;
  boostedByFlare: boolean;
}
function deriveGnssState(data: HelioNow): GnssState {
  const gStr  = data.scales.g_scale ?? "G0";
  const gNum  = parseInt(gStr.slice(1), 10);

  let kp = data.metrics.kp_latest;
  if (kp == null) {
    const forecast = data.metrics.kp_forecast_3h ?? [];
    const now      = Date.now();
    const nearby   = forecast
      .filter(p => new Date(p.t_utc).getTime() <= now + 3 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.t_utc).getTime() - new Date(a.t_utc).getTime());
    if (nearby.length > 0) kp = nearby[0].kp;
  }

  // Base level from G-scale / Kp
  let level: 0 | 1 | 2 = 0;
  if (gNum >= 2 || (kp != null && kp >= 6)) level = 2;
  else if (gNum >= 1 || (kp != null && kp >= 4)) level = 1;

  // Boost from R-scale: M/X flares cause direct ionospheric disturbance
  const rNum = parseInt((data.scales.r_scale ?? "R0").slice(1), 10);
  const boostedByFlare = rNum >= 2 && level < 2;
  if (rNum >= 2) level = Math.min(2, level + 1) as 0 | 1 | 2;

  const COLORS: Record<number, string> = { 0: "#5cce8c", 1: "#d4cc5c", 2: "#e05c5c" };
  const LABELS: Record<number, string> = { 0: "Low", 1: "Moderate", 2: "High" };

  return { level, color: COLORS[level], label: LABELS[level], kp, gScale: gStr, boostedByFlare };
}

function renderGnssTip(data: HelioNow, isOpen: boolean): string {
  const gn      = deriveGnssState(data);
  const openCls = isOpen ? " hw-impact-tip-open" : "";

  const GNSS_LEVELS = [
    { l: 0 as 0|1|2, label: "Low",      color: "#5cce8c", width: 33  },
    { l: 1 as 0|1|2, label: "Moderate", color: "#d4cc5c", width: 64  },
    { l: 2 as 0|1|2, label: "High",     color: "#e05c5c", width: 100 },
  ];

  const rungs = GNSS_LEVELS.map(gl => {
    const isCurrent = gl.l === gn.level;
    const labelCol  = isCurrent ? gl.color : "#566068";
    const barOp     = isCurrent ? "0.88" : "0.16";
    return `<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${labelCol}">${gl.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${gl.width}%;background:${gl.color};opacity:${barOp}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${isCurrent ? gl.color : "transparent"}">${isCurrent ? "◀" : ""}</span>
    </div>`;
  }).join("");

  const kpStr   = gn.kp != null ? `Kp ${gn.kp.toFixed(1)}` : "Kp —";
  const noteMap: Record<number, string> = {
    0: "Stable ionosphere · normal positioning accuracy",
    1: "Possible signal delay or scintillation",
    2: "Significant positioning errors · possible signal loss",
  };
  const flareNote = gn.boostedByFlare
    ? `<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt((data.scales.r_scale ?? "R0").slice(1), 10)})</div>`
    : "";

  return `<div class="hw-impact-tip${openCls}">
    <div class="hw-gnss-ladder">${rungs}</div>
    <div class="hw-gnss-meta">${kpStr} · ${escText(gn.gScale)} · ${noteMap[gn.level]}</div>
    ${flareNote}
  </div>`;
}

// ── Solar Wind Dynamic Pressure ───────────────────────────────────────────────
function deriveSWDPState(data: HelioNow): {
  pressure: number | null; color: string; label: string; density: number | null;
} {
  const p = (data.metrics as Record<string, unknown>).pressure_npa as number | null | undefined;
  const pressure = p ?? null;
  const density  = (data.metrics as Record<string, unknown>).density as number | null | undefined ?? null;
  if (pressure == null) return { pressure: null, color: "#607880", label: "—",        density };
  if (pressure >= 6)    return { pressure,       color: "#e05c5c", label: "Extreme",  density };
  if (pressure >= 4)    return { pressure,       color: "#e0a84a", label: "Strong",   density };
  if (pressure >= 2)    return { pressure,       color: "#d4cc5c", label: "Elevated", density };
  if (pressure >= 1)    return { pressure,       color: "#5cce8c", label: "Typical",  density };
  return                       { pressure,       color: "#7a9298", label: "Weak",     density };
}

function renderSWDPTip(data: HelioNow, isOpen: boolean): string {
  const sw      = deriveSWDPState(data);
  const openCls = isOpen ? " hw-impact-tip-open" : "";
  const p       = sw.pressure;

  // Gauge geometry (viewBox fixed, scales to container)
  const W = 200, barY1 = 6, barH = 10, barY2 = barY1 + barH;
  const tickY2 = barY2 + 4, lblY = tickY2 + 11, triBase = barY2 + 9, H = lblY + 4;

  // 4 color zones: 0–2, 2–4, 4–6, 6–8 nPa (each = 50px at W=200, scale max=8)
  const ZONES = [
    { x: 0,   w: 50, color: "#5cce8c" },
    { x: 50,  w: 50, color: "#d4cc5c" },
    { x: 100, w: 50, color: "#e0a84a" },
    { x: 150, w: 50, color: "#e05c5c" },
  ];
  const zones = ZONES.map(z =>
    `<rect x="${z.x}" y="${barY1}" width="${z.w}" height="${barH}" fill="${z.color}" opacity="0.55" rx="0"/>`
  ).join("");

  // Tick marks and labels at 0,2,4,6,8
  const TICKS = [
    { x: 0,   label: "0",  anchor: "start"  },
    { x: 50,  label: "2",  anchor: "middle" },
    { x: 100, label: "4",  anchor: "middle" },
    { x: 150, label: "6",  anchor: "middle" },
    { x: 200, label: "8+", anchor: "end"    },
  ];
  const ticks = TICKS.map(t =>
    `<line x1="${t.x}" y1="${barY2}" x2="${t.x}" y2="${tickY2}" stroke="#3a5058" stroke-width="1"/>`
  ).join("");
  const labels = TICKS.map(t =>
    `<text x="${t.x}" y="${lblY}" class="hw-swdp-axlabel" text-anchor="${t.anchor}">${t.label}</text>`
  ).join("");

  // Marker triangle (pointing up, base below bar)
  let markerSvg = "";
  if (p != null) {
    const pClamped = Math.min(Math.max(p, 0), 8);
    const mx = (pClamped / 8) * W;
    const triPts = `${mx - 5},${triBase} ${mx + 5},${triBase} ${mx},${barY2}`;
    markerSvg = `<polygon points="${triPts}" fill="${sw.color}" opacity="0.95"/>
    <line x1="${mx}" y1="${barY1}" x2="${mx}" y2="${barY2}" stroke="${sw.color}" stroke-width="1.5" opacity="0.7"/>`;
  }

  // Bar border overlay
  const border = `<rect x="0" y="${barY1}" width="${W}" height="${barH}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`;

  const svg = `<svg class="hw-swdp-gauge" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    ${zones}${border}${markerSvg}${ticks}${labels}
  </svg>`;

  const pStr      = p != null ? `${p.toFixed(2)} nPa` : "—";
  const densStr   = sw.density != null ? `${(sw.density as number).toFixed(2)} cm⁻³` : "—";
  const speedStr  = data.metrics.solar_wind_kms != null ? `${Math.round(data.metrics.solar_wind_kms)} km/s` : "—";
  const compress  = p == null ? "" : p >= 4 ? " · Magnetosphere compressed" : p >= 2 ? " · Moderate compression" : "";

  return `<div class="hw-impact-tip${openCls}">
    ${svg}
    <div class="hw-swdp-meta"><b style="color:${sw.color}">${escText(pStr)}</b>${escText(compress)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${escText(speedStr)} · Density ${escText(densStr)}</div>
  </div>`;
}

// ── CME Impact Uncertainty Cone ──────────────────────────────────────────────

interface CMEState {
  status:      "quiet" | "watch" | "impact";
  color:       string;
  label:       string;
  speed_kms:   number | null;
  issued_utc:  string | null;
  arrival_utc: string | null;
}

function deriveCMEState(data: HelioNow): CMEState {
  const alerts    = data.alerts_all ?? [];
  const impactEvt = alerts.find(a => a.kind === "cme_impact");
  const watchEvt  = alerts.find(a => a.kind === "cme_watch");
  const evt       = impactEvt ?? watchEvt;

  if (!evt) {
    return { status: "quiet", color: "#5cce8c", label: "None",
             speed_kms: null, issued_utc: null, arrival_utc: null };
  }

  // Parse "Estimated Velocity: 1227 km/s" from raw_body
  const velMatch = (evt.raw_body ?? "").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i);
  const speed_kms = velMatch ? parseInt(velMatch[1], 10) : null;

  // Travel time: 1 AU (1.496 × 10⁸ km) ÷ speed
  let arrival_utc: string | null = null;
  if (speed_kms && evt.t_utc) {
    const travelMs  = (1.496e8 / speed_kms) * 1000;
    arrival_utc = new Date(new Date(evt.t_utc).getTime() + travelMs)
      .toISOString().replace(".000Z", "Z");
  }

  const status = impactEvt ? "impact" : "watch";
  return {
    status,
    color:       status === "impact" ? "#e05c5c" : "#d4cc5c",
    label:       status === "impact" ? "Active"  : "Watch",
    speed_kms,
    issued_utc:  evt.t_utc,
    arrival_utc,
  };
}

function renderCMEConeTip(data: HelioNow, isOpen: boolean): string {
  const cme       = deriveCMEState(data);
  const openClass = isOpen ? " hw-impact-tip-open" : "";

  // Arrival footer
  let arrStr = "—";
  if (cme.arrival_utc) {
    const d  = new Date(cme.arrival_utc);
    const mo = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const dy = d.getUTCDate();
    const hr = String(d.getUTCHours()).padStart(2, "0");
    const mn = String(d.getUTCMinutes()).padStart(2, "0");
    arrStr = `~${mo}\u00a0${dy}\u00a0${hr}:${mn}\u202fUTC`;
  }
  const speedStr   = cme.speed_kms ? `${cme.speed_kms}\u202fkm/s` : "—";
  const footerHtml = cme.status !== "quiet"
    ? `Velocity: <b style="color:#b4c6cc">${escText(speedStr)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${escText(arrStr)}</b>`
    : `No Earth-directed CME in forecast window`;

  const svg = buildHelioSolarEarthScene("cme_cone", { cmeState: cme, uid: "cme" });

  return `<div class="hw-impact-tip${openClass}">
    ${svg}
    <div class="hw-cme-footer">${footerHtml}</div>
  </div>`;
}

function renderImpacts(
  data:            HelioNow,
  scrubData:       ScrubData | null,
  solarRegions:    SolarRegion[] | null,
  impactsOpen:     boolean,
  solarExpanded:   boolean,
  solarLayers:     Set<string>,
  expandedImpacts: Set<string>,
  ovationData:     OvationData | null,
  opts:            HelioWidgetOptions,
): string {
  const rows = scrubData?.impacts ?? data.observer_impacts ?? [];
  const rowsHtml = rows.map(row => {
    const color      = IMPACT_COLOR[row.level] ?? "#666";
    const levelLabel = row.level === "none" ? "None" : row.level.charAt(0).toUpperCase() + row.level.slice(1);
    const icon       = IMPACT_ICONS[row.kind] ?? IMPACT_ICON_FALLBACK;
    const iconColor  = row.level === "none" ? "#606870" : color;
    const isOpen     = row.kind === "solar_activity" ? solarExpanded : expandedImpacts.has(row.kind);
    const openClass  = isOpen ? " hw-impact-open" : "";
    let tipHtml: string;
    if (row.kind === "solar_activity") {
      const solarOpen  = solarExpanded ? " hw-solar-open" : "";
      const layerBtns  = SOLAR_LAYER_DEFS.map(l => {
        const on = solarLayers.has(l.id);
        const bg = on ? l.color + "22" : "transparent";
        const op = on ? "1" : "0.32";
        return `<button class="hw-sl-btn" data-solar-layer="${l.id}" style="color:${l.color};border-color:${l.color};background:${bg};opacity:${op}">${l.label}</button>`;
      }).join("");
      tipHtml = `<div class="hw-solar-tip${solarOpen}">
          <div class="hw-solar-disk-wrap" id="solar">
            <img class="hw-solar-disk-img" src="${SOLAR_DISK_URL}" alt="Solar disk" loading="lazy" />
            ${solarRegions ? renderSolarOverlay(solarRegions, SOLAR_DISK_PX, solarLayers) : ""}
          </div>
          <div class="hw-solar-layers">${layerBtns}</div>
          <span class="hw-solar-tip-text">${escText(row.summary)}</span>
        </div>`;
    } else if (row.kind === "aurora") {
      const auroraOpen = isOpen ? " hw-aurora-tip-open" : "";
      const aUrl = `https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`;
      let prob: number | null = null;
      if (ovationData && opts.lat != null && opts.lon != null) {
        prob = lookupOvationProb(ovationData.entries, opts.lat, opts.lon);
      }
      const hasLocation = opts.lat != null && opts.lon != null;
      const probColor   = prob != null ? (prob >= 30 ? "#5cce8c" : prob >= 10 ? "#d4cc5c" : "#9ab4bc") : "#607880";
      const probLabel   = prob != null ? `${prob}%` : ovationData ? "n/a" : "…";
      const obsPanel    = hasLocation ? `
        <div class="hw-aurora-obs-panel">
          <span>📍</span>
          <span>${opts.locationName ? escText(opts.locationName) + " · " : ""}${opts.lat!.toFixed(1)}°${opts.lat! >= 0 ? "N" : "S"} ${Math.abs(opts.lon!).toFixed(1)}°${opts.lon! >= 0 ? "E" : "W"}</span>
          <span class="hw-aurora-prob" style="color:${probColor}">Aurora: ${probLabel}</span>
        </div>` : "";
      tipHtml = `<div class="hw-aurora-tip${auroraOpen}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${esc(aUrl)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${renderAuroraSvgOverlay(opts)}
          </div>
          ${obsPanel}
          <div class="hw-aurora-caption">NOAA OVATION Prime model · updates every 5 min</div>
        </div>`;
    } else if (row.kind === "radio") {
      tipHtml = renderRadioBlackoutPanel(data, isOpen);
    } else {
      const tipOpen = isOpen ? " hw-impact-tip-open" : "";
      tipHtml = `<div class="hw-impact-tip${tipOpen}">${escText(row.summary)}</div>`;
    }
    const rowAttr = row.kind === "solar_activity" ? " data-solar-toggle" : ` data-impact-row="${esc(row.kind)}"`;
    const rowId   = row.kind === "radio" ? ' id="radio"' : row.kind === "solar_activity" ? ' id="radiation"' : "";
    return `<div class="hw-impact-row${openClass}"${rowId}${rowAttr}>
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${iconColor}">${icon}<span style="color:#b4c6cc">${escText(row.label)}</span></span>
      <span class="hw-impact-badge" style="background:${color}22;color:${color}">${escText(levelLabel)}</span>
      ${tipHtml}
    </div>`;
  }).join("");
  const simNote = scrubData
    ? `<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> · simulated</span>`
    : "";
  const total = rows.length + 8; // +8 for Magnetosphere, Storm Risk, Solar Cycle, Coronal Hole, Satellite Drag, GNSS, SW Pressure, CME Cone
  const caret = impactsOpen ? "▼" : "▶";
  const label = total > 0 ? `Observer Impacts (${total})` : "Observer Impacts";
  const sectionHdr = `
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${caret}</span>
      <span class="hw-section-label" style="margin-bottom:0">${label}${simNote}</span>
    </div>`;
  // Geomagnetic Storm Probability — derived from Kp forecast
  const gsOpen      = expandedImpacts.has("geomag_storm");
  const gsProbs     = deriveStormProbs(data);
  const gsBadgePct  = gsProbs.g1;
  const gsBadgeCol  = gsProbs.g1 >= 30 ? G_STORM_COLORS.g1 : gsProbs.g1 > 0 ? "#7a9298" : "#607880";
  const gsBadgeTxt  = gsBadgePct > 0 ? `G1 ${gsBadgePct}%` : "None";
  const gsIcon      = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg>`;
  const gsRowHtml   = `<div class="hw-impact-row${gsOpen ? " hw-impact-open" : ""}" id="geomagnetic" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${gsBadgeCol}">${gsIcon}<span style="color:#b4c6cc">Storm Risk</span><span style="color:#607880;font-size:.85em;font-weight:normal"> — Next 24h</span></span>
      <span class="hw-impact-badge" style="background:${gsBadgeCol}22;color:${gsBadgeCol}">${gsBadgeTxt}</span>
      ${renderGeomagStormTip(data, gsOpen)}
    </div>`;

  // Solar Cycle — hardcoded context row appended to Observer Impacts
  const scOpen      = expandedImpacts.has("solar_cycle");
  const scColor     = SC_PHASE_COLOR[SOLAR_CYCLE.phase] ?? "#96a8b8";
  const scPhase     = SOLAR_CYCLE.phase.charAt(0).toUpperCase() + SOLAR_CYCLE.phase.slice(1);
  const scIcon      = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg>`;
  const scRowHtml   = `<div class="hw-impact-row${scOpen ? " hw-impact-open" : ""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${scColor}">${scIcon}<span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${scColor}22;color:${scColor}">${scPhase}</span>
      ${renderSolarCycleTip(scOpen)}
    </div>`;

  // Coronal Hole / High-Speed Stream — derived from solar wind speed
  const hssState    = deriveHSSState(data);
  const hssOpen     = expandedImpacts.has("hss");
  const hssIcon     = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg>`;
  const hssRowHtml  = `<div class="hw-impact-row${hssOpen ? " hw-impact-open" : ""}" data-impact-row="hss">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${hssState.color}">${hssIcon}<span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${hssState.color}22;color:${hssState.color}">${hssState.label}</span>
      ${renderHSSTip(data, hssOpen)}
    </div>`;

  // Satellite Drag — derived from G-scale / Kp
  const sdState     = deriveSatDragState(data);
  const sdOpen      = expandedImpacts.has("sat_drag");
  const sdIcon      = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg>`;
  const sdRowHtml   = `<div class="hw-impact-row${sdOpen ? " hw-impact-open" : ""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${sdState.color}">${sdIcon}<span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${sdState.color}22;color:${sdState.color}">${sdState.label}</span>
      ${renderSatDragTip(data, sdOpen)}
    </div>`;

  // GNSS Disturbance Risk — derived from G-scale / Kp + R-scale boost
  const gnState     = deriveGnssState(data);
  const gnOpen      = expandedImpacts.has("gnss");
  const gnIcon      = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg>`;
  const gnRowHtml   = `<div class="hw-impact-row${gnOpen ? " hw-impact-open" : ""}" data-impact-row="gnss">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${gnState.color}">${gnIcon}<span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${gnState.color}22;color:${gnState.color}">${gnState.label}</span>
      ${renderGnssTip(data, gnOpen)}
    </div>`;

  // Solar Wind Dynamic Pressure
  const swdpState   = deriveSWDPState(data);
  const swdpOpen    = expandedImpacts.has("sw_pressure");
  const swdpBadge   = swdpState.pressure != null ? `${swdpState.pressure.toFixed(2)} nPa` : "—";
  const swdpIcon    = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg>`;
  const swdpRowHtml = `<div class="hw-impact-row${swdpOpen ? " hw-impact-open" : ""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${swdpState.color}">${swdpIcon}<span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${swdpState.color}22;color:${swdpState.color}">${swdpBadge}</span>
      ${renderSWDPTip(data, swdpOpen)}
    </div>`;

  const cmeState    = deriveCMEState(data);
  const cmeOpen     = expandedImpacts.has("cme_cone");
  const cmeIcon     = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg>`;
  const cmeRowHtml  = `<div class="hw-impact-row${cmeOpen ? " hw-impact-open" : ""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${cmeState.color}">${cmeIcon}<span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${cmeState.color}22;color:${cmeState.color}">${escText(cmeState.label)}</span>
      ${renderCMEConeTip(data, cmeOpen)}
    </div>`;

  // Magnetosphere — moved from hero KPI popover into Observer Impacts
  const magInfo     = deriveMagnetInfo(data);
  const magOpen     = expandedImpacts.has("magnetosphere");
  const magIcon     = `<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>`;
  const magRowHtml  = `<div class="hw-impact-row${magOpen ? " hw-impact-open" : ""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">▶</span>
      <span class="hw-impact-kind" style="color:${magInfo.color}">${magIcon}<span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${magInfo.color}22;color:${magInfo.color}">${escText(magInfo.label)}</span>
      ${renderMagnetosphereTip(data, magOpen)}
    </div>`;

  return `
    <div class="hw-impacts">
      ${sectionHdr}
      ${impactsOpen ? rowsHtml + gsRowHtml + magRowHtml + scRowHtml + hssRowHtml + sdRowHtml + gnRowHtml + swdpRowHtml + cmeRowHtml : ""}
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

// ── Solar Activity Timeline ───────────────────────────────────────────────────

const TL_LEVEL_COLOR: Record<string, string> = {
  info:    "#445c64",
  watch:   "#e0a84a",
  warning: "#e05c5c",
};
const TL_ACTIVE_COLOR = "#4ae0a4";

function timelineIcon(type: string): string {
  // All icons are 13×13 inline SVG, stroke-based, consistent with alert icons
  const s = (d: string, extra = "") =>
    `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  switch (type) {
    case "solar_flare":
      // Circle with 8 short rays
      return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
        <line x1="6.5" y1="1" x2="6.5" y2="3"/>
        <line x1="6.5" y1="10" x2="6.5" y2="12"/>
        <line x1="1" y1="6.5" x2="3" y2="6.5"/>
        <line x1="10" y1="6.5" x2="12" y2="6.5"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="8.9" y1="8.9" x2="10.3" y2="10.3"/>
        <line x1="10.3" y1="2.7" x2="8.9" y2="4.1"/>
        <line x1="4.1" y1="8.9" x2="2.7" y2="10.3"/>`);
    case "cme_launch":
      // Arrow pointing right with trailing lines
      return s(`<line x1="1" y1="6.5" x2="10" y2="6.5"/>
        <polyline points="7,3.5 10,6.5 7,9.5"/>
        <line x1="1" y1="4.5" x2="6" y2="4.5" stroke-opacity=".5"/>
        <line x1="1" y1="8.5" x2="6" y2="8.5" stroke-opacity=".5"/>`);
    case "cme_arrival":
      // Concentric arcs converging inward
      return s(`<path d="M11,6.5 A4.5,4.5 0 0,1 2,6.5" stroke-opacity=".4"/>
        <path d="M9.5,6.5 A3,3 0 0,1 3.5,6.5" stroke-opacity=".7"/>
        <path d="M8,6.5 A1.5,1.5 0 0,1 5,6.5"/>
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>`);
    case "geomagnetic_storm":
      // Lightning bolt
      return s(`<polyline points="8,1.5 5,6.5 7.5,6.5 5,11.5"/>`);
    case "geomagnetic_watch":
      // Clock face
      return s(`<circle cx="6.5" cy="6.5" r="5"/>
        <line x1="6.5" y1="3.5" x2="6.5" y2="6.5"/>
        <line x1="6.5" y1="6.5" x2="9" y2="7.5"/>`);
    case "radio_blackout":
      // Crossed radio waves
      return s(`<path d="M3,3.5 Q6.5,6.5 10,9.5" stroke-opacity=".5"/>
        <path d="M10,3.5 Q6.5,6.5 3,9.5"/>
        <line x1="5" y1="1" x2="8" y2="12" stroke-opacity=".3"/>`);
    case "radiation_storm":
      // Triangle + exclamation
      return s(`<path d="M6.5,1.5 L12,11 L1,11 Z"/>
        <line x1="6.5" y1="5" x2="6.5" y2="8"/>
        <circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/>`);
    default:
      // Info circle
      return s(`<circle cx="6.5" cy="6.5" r="5.5"/>
        <line x1="6.5" y1="5.5" x2="6.5" y2="9"/>
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`);
  }
}

function renderTimelineMetadata(ev: TimelineEvent): string {
  // Show only supplementary fields not already present in the description text.
  // (speed/half_angle are in description for CMEs; region/location for flares)
  const meta = ev.metadata ?? {};
  const parts: string[] = [];
  if (meta["source_code"]) parts.push(`Code: ${meta["source_code"]}`);
  if (meta["model"])       parts.push(`Model: ${String(meta["model"]).toUpperCase()}`);
  if (parts.length === 0) return "";
  return `\n${parts.join(" · ")}`;
}

function renderTimelineItem(
  ev:          TimelineEvent,
  hasNext:     boolean,
  expandedKey: string | null,
): string {
  const dotColor = ev.is_active ? TL_ACTIVE_COLOR : (TL_LEVEL_COLOR[ev.level] ?? "#445c64");
  const isOpen   = ev.event_time === expandedKey;
  const timeStr  = ev.event_time.slice(11, 16) + " UTC";
  const srcLabel = ev.source === "NASA_DONKI" ? "DONKI" : "SWPC";
  const detail   = isOpen
    ? `<div class="hw-tl-detail">${escText(ev.description)}${escText(renderTimelineMetadata(ev))}</div>`
    : "";
  return `
    <div class="hw-tl-item" data-timeline-key="${esc(ev.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${dotColor}"></div>
        ${hasNext ? `<div class="hw-tl-line"></div>` : ""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${timeStr}</span>
          <span class="hw-tl-src">${srcLabel}</span>
        </div>
        <div class="hw-tl-title${ev.is_active ? " hw-tl-active" : ""}">
          ${timelineIcon(ev.event_type)} ${escText(ev.event_title)}
        </div>
        ${detail}
      </div>
    </div>`;
}

function renderTimeline(
  data:                HelioNow,
  expandedTimelineKey: string | null,
  timelineOpen:        boolean,
  collapsedDays:       Set<string>,
): string {
  const allEvents = data.timeline ?? [];

  // Limit to 3 UTC calendar days: today, yesterday, day-before
  const nowMs = Date.now();
  const day0  = new Date(nowMs).toISOString().slice(0, 10);
  const day1  = new Date(nowMs - 86_400_000).toISOString().slice(0, 10);
  const day2  = new Date(nowMs - 172_800_000).toISOString().slice(0, 10);
  const validDays = new Set([day0, day1, day2]);

  // Filter + sort descending (most recent first)
  const events = allEvents
    .filter(ev => validDays.has((ev.event_time ?? "").slice(0, 10)))
    .slice()
    .reverse();

  const total = events.length;
  const caret = timelineOpen ? "▼" : "▶";
  const label = total > 0 ? `Solar Activity Timeline (${total})` : "Solar Activity Timeline";

  const sectionHdr = `
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${caret}</span>
      <span class="hw-section-label" style="margin-bottom:0">${label}</span>
    </div>`;

  if (!timelineOpen || total === 0) {
    return `<div class="hw-timeline">${sectionHdr}</div>`;
  }

  // Group by date (descending: day0, day1, day2)
  const groupMap = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const dk = (ev.event_time ?? "").slice(0, 10);
    if (!groupMap.has(dk)) groupMap.set(dk, []);
    groupMap.get(dk)!.push(ev);
  }

  const groupsHtml = [...groupMap.entries()].map(([dk, evts]) => {
    const dt        = new Date(dk + "T12:00:00Z");
    const dateLabel = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    const collapsed = collapsedDays.has(dk);
    const dayCaret  = collapsed ? "▶" : "▼";
    const countNote = collapsed ? `<span class="hw-tl-day-count">${evts.length} events</span>` : "";
    const dayHdr    = `
      <div class="hw-tl-day-row" data-tl-day="${esc(dk)}">
        <span class="hw-section-caret">${dayCaret}</span>
        <span class="hw-tl-date">${dateLabel}</span>
        ${countNote}
      </div>`;
    const itemsHtml = collapsed ? "" :
      evts.map((ev, i) => renderTimelineItem(ev, i < evts.length - 1, expandedTimelineKey)).join("");
    return `<div class="hw-tl-group">${dayHdr}${itemsHtml}</div>`;
  }).join("");

  return `
    <div class="hw-timeline">
      ${sectionHdr}
      ${groupsHtml}
    </div>`;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

function renderAlerts(data: HelioNow, alertsExpanded: boolean, expandedAlertKey: string | null): string {
  const all   = data.alerts_all ?? [];
  const total = all.length;
  const caret = alertsExpanded ? "▼" : "▶";
  const label = total > 0 ? `SWPC Alerts (${total})` : "SWPC Alerts";

  const header = `
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${caret}</span>
        <span class="hw-alerts-label">${label}</span>
      </div>
    </div>`;

  if (!alertsExpanded || total === 0) {
    const empty = alertsExpanded && total === 0
      ? `<div class="hw-empty-alerts">No significant recent SWPC alerts</div>` : "";
    return `<div class="hw-alerts">${header}${empty}</div>`;
  }

  const items = all.map(ev => renderAlertItem(ev, ev.dedupe_key === expandedAlertKey)).join("");
  return `
    <div class="hw-alerts">
      ${header}
      ${items}
    </div>`;
}

function renderCmeTracker(data: HelioNow, cmeExpanded: boolean): string {
  const cme = data.cme_tracker;
  if (!cme) return "";

  const color      = CME_IMPACT_COLOR[cme.impact_level] ?? "#96a8b8";
  const statusText = CME_STATUS_LABEL[cme.status] ?? cme.status;

  // ── SVG trajectory ───────────────────────────────────────────────────────
  const VW = 300, VH = 44;
  const sunCx = 18, cy = VH / 2, sunR = 10;
  const earthCx = VW - 18, earthR = 7;

  const trackLine = `<line x1="${sunCx + sunR}" y1="${cy}" x2="${earthCx - earthR}" y2="${cy}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`;
  const sunCircle = `<circle cx="${sunCx}" cy="${cy}" r="${sunR}" fill="#f0c040" opacity="0.92"/>`;
  const earthCircle = `
    <circle cx="${earthCx}" cy="${cy}" r="${earthR}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${earthCx}" cy="${cy}" r="2.5" fill="#fff" opacity="0.7"/>`;
  const sunLabel   = `<text x="${sunCx}" y="${cy + sunR + 9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`;
  const earthLabel = `<text x="${earthCx}" y="${cy + earthR + 9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`;

  let progressDot = "";
  if (cme.progress != null) {
    const trackStart = sunCx + sunR + 4;
    const trackEnd   = earthCx - earthR - 4;
    const dotX       = trackStart + cme.progress * (trackEnd - trackStart);
    const dotR       = 5;
    if (cme.status === "arrival_window") {
      progressDot = `
        <g transform="translate(${dotX.toFixed(1)},${cy})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${dotR}" fill="${color}" opacity="0.92"/>
        </g>`;
    } else {
      progressDot = `<circle cx="${dotX.toFixed(1)}" cy="${cy}" r="${dotR}" fill="${color}" opacity="0.85"/>`;
    }
  }

  const svg = `<svg class="hw-cme-svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${trackLine}
    ${sunCircle}${sunLabel}
    ${earthCircle}${earthLabel}
    ${progressDot}
  </svg>`;

  // ── Detail panel ──────────────────────────────────────────────────────────
  const arrivalText  = fmtCmeTs(cme.arrival_time_utc);
  const launchText   = fmtCmeTs(cme.launch_time_utc);
  const speedText    = cme.speed_kms   != null ? `${Math.round(cme.speed_kms)} km/s` : "—";
  const angleText    = cme.half_angle_deg != null ? `${cme.half_angle_deg}°` : "—";
  const locText      = cme.source_location ?? "—";
  const hitText      = cme.is_earth_direct ? "Direct hit" : "Glancing blow";
  const progressPct  = cme.progress != null ? `${Math.round(cme.progress * 100)}%` : "—";

  const detailHtml = `
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${escText(arrivalText)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${color}">${escText(speedText)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${color}">${escText(cme.impact_level.charAt(0).toUpperCase() + cme.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${escText(statusText)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${escText(launchText)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${escText(progressPct)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${escText(angleText)} · Source: ${escText(locText)} · ${escText(hitText)} · Model: Enlil (NASA DONKI)</div>
    </div>`;

  // ── Header row ────────────────────────────────────────────────────────────
  const caret = cmeExpanded ? "▼" : "▶";
  const impactLabel = cme.impact_level === "unknown"
    ? "Unrated"
    : cme.impact_level.charAt(0).toUpperCase() + cme.impact_level.slice(1);

  const body = cmeExpanded ? `${svg}${detailHtml}` : "";

  return `
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${caret}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${color}22;color:${color};margin-left:auto">${escText(statusText)}</span>
        <span class="hw-cme-badge" style="background:${color}15;color:${color};margin-left:4px">${escText(impactLabel)} impact</span>
      </div>
      ${body}
    </div>`;
}

function renderCard(
  data:                  HelioNow,
  expanded:              boolean,
  heroExpanded:          boolean,
  activePopover:         string | null,
  scrubOffset:           number,
  alertsExpanded:        boolean,
  expandedAlertKey:      string | null,
  expandedTimelineKey:   string | null,
  timelineOpen:          boolean,
  collapsedDays:         Set<string>,
  impactsOpen:           boolean,
  cmeExpanded:           boolean,
  forecastOpen:          boolean,
  indicatorsOpen:        boolean,
  solarRegions:          SolarRegion[] | null,
  solarExpanded:         boolean,
  solarLayers:           Set<string>,
  expandedImpacts:       Set<string>,
  opts:                  HelioWidgetOptions,
  ovationData:           OvationData | null,
  solarChannelIdx:       number = 0,
): string {
  const scrubData   = buildScrubData(data, scrubOffset);
  const histPts     = data.metrics.kp_history_1h ?? [];
  const lastStepT   = histPts.length ? fmtKpTime(histPts[histPts.length - 1].t_utc) : null;
  const histLbl     = lastStepT ? `Recent history · Last step ${lastStepT}` : "Recent history";
  const histToggle  = `<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${heroExpanded ? "▼" : "▶"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${esc(histLbl)}</span>
  </div></div>`;
  const histDetail  = heroExpanded ? renderHeroDetail(data) : "";
  return `
    <div class="hw-root">
      ${renderHeader(data)}
      ${renderHero(data, heroExpanded, indicatorsOpen, activePopover, scrubData, opts, ovationData, solarChannelIdx)}
      ${renderImpacts(data, scrubData, solarRegions, impactsOpen, solarExpanded, solarLayers, expandedImpacts, ovationData, opts)}
      ${histToggle}
      ${histDetail}
      ${renderForecast(data, scrubOffset, scrubData, forecastOpen)}
      ${renderCmeTracker(data, cmeExpanded)}
      ${renderTimeline(data, expandedTimelineKey, timelineOpen, collapsedDays)}
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

const HELIO_UI_STORAGE_KEY = "nc-helio-ui";

class HelioWidgetInstance {
  private el:               HTMLElement;
  private opts:             HelioWidgetOptions;
  private expanded          = false;
  private heroExpanded      = false;
  private activePopover:    string | null = null;
  private scrubOffset       = 0;
  private alertsExpanded       = false;
  private expandedAlertKey:    string | null = null;
  private expandedTimelineKey: string | null = null;
  private timelineOpen         = false;
  private collapsedDays:       Set<string>   = new Set();
  private impactsOpen          = false;
  private cmeExpanded          = false;
  private forecastOpen         = false;
  private indicatorsOpen       = true;
  private solarRegions:        SolarRegion[] | null = null;
  private solarExpanded        = false;
  private solarLayers:         Set<string> = new Set(["X", "M", "C", "quiet"]);
  private solarChannelIdx      = 0;
  private solarChannelAutoSet  = false; // true once auto-set from status or loaded from storage
  private expandedImpacts:     Set<string> = new Set();
  private ovationData:      OvationData | null = null;
  private timer:            ReturnType<typeof setTimeout> | null = null;
  private data:             HelioNow | null = null;

  constructor(el: HTMLElement, opts: HelioWidgetOptions) {
    this.el   = el;
    this.opts = opts;
    this.loadUiState();
    this.el.innerHTML = renderLoading();
    this.el.addEventListener("click",  this.onClick.bind(this));
    this.el.addEventListener("input",  this.onInput.bind(this));
    this.el.addEventListener("change", this.onChange.bind(this));
    this.fetch();
  }

  private onClick(e: Event): void {
    const target = e.target as Element;

    const heroScrollEl = target.closest("[data-hero-scroll]") as HTMLElement | null;
    if (heroScrollEl) {
      const id = heroScrollEl.dataset.heroScroll;
      if (id) {
        const scrollToTarget = () => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        if (!this.impactsOpen) {
          this.impactsOpen = true;
          this.saveUiState();
          this.render();
          requestAnimationFrame(() => requestAnimationFrame(scrollToTarget));
        } else {
          scrollToTarget();
        }
      }
      return;
    }

    // Solar channel switcher
    if (target.closest("[data-solar-prev]")) {
      this.solarChannelIdx = (this.solarChannelIdx - 1 + SOLAR_CHANNELS.length) % SOLAR_CHANNELS.length;
      this.solarChannelAutoSet = true;
      this.saveUiState();
      this.render();
      return;
    }
    if (target.closest("[data-solar-next]")) {
      this.solarChannelIdx = (this.solarChannelIdx + 1) % SOLAR_CHANNELS.length;
      this.solarChannelAutoSet = true;
      this.saveUiState();
      this.render();
      return;
    }

    // Reset scrub to live
    if (target.closest(".hw-scrub-reset")) {
      this.scrubOffset = 0;
      this.render();
      return;
    }

    // CME Tracker: toggle detail panel
    if (target.closest("[data-cme-toggle]")) {
      this.cmeExpanded = !this.cmeExpanded;
      this.saveUiState();
      this.render();
      return;
    }

    // Forecast section: collapse / expand
    if (target.closest("[data-forecast-toggle]")) {
      this.forecastOpen = !this.forecastOpen;
      this.saveUiState();
      this.render();
      return;
    }

    // Indicators group: collapse / expand
    if (target.closest("[data-indicators-toggle]")) {
      this.indicatorsOpen = !this.indicatorsOpen;
      this.saveUiState();
      this.render();
      return;
    }

    // Observer Impacts section: collapse / expand
    if (target.closest("[data-impacts-toggle]")) {
      this.impactsOpen = !this.impactsOpen;
      this.saveUiState();
      this.render();
      return;
    }

    // Impact row toggle (Aurora, Radio, Solar Cycle, etc.)
    const impactRowEl = target.closest("[data-impact-row]") as HTMLElement | null;
    if (impactRowEl) {
      const kind = impactRowEl.dataset.impactRow ?? "";
      if (this.expandedImpacts.has(kind)) this.expandedImpacts.delete(kind);
      else this.expandedImpacts.add(kind);
      this.saveUiState();
      this.render();
      return;
    }

    // Solar layer toggle button (must be before solar-toggle to prevent bubbling)
    const layerEl = target.closest("[data-solar-layer]") as HTMLElement | null;
    if (layerEl) {
      const layer = layerEl.dataset.solarLayer ?? "";
      if (this.solarLayers.has(layer)) this.solarLayers.delete(layer);
      else this.solarLayers.add(layer);
      this.saveUiState();
      this.render();
      return;
    }

    // Solar activity row: toggle disk panel
    if (target.closest("[data-solar-toggle]")) {
      this.solarExpanded = !this.solarExpanded;
      this.saveUiState();
      this.render();
      return;
    }

    // SWPC Alerts section: collapse / expand
    if (target.closest("[data-alerts-toggle]")) {
      this.alertsExpanded = !this.alertsExpanded;
      this.saveUiState();
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

    // Timeline section: collapse / expand
    if (target.closest("[data-tl-section]")) {
      this.timelineOpen = !this.timelineOpen;
      if (this.timelineOpen) {
        // Pre-collapse all day groups so user opts in per-day
        const nowMs = Date.now();
        this.collapsedDays = new Set([
          new Date(nowMs).toISOString().slice(0, 10),
          new Date(nowMs - 86_400_000).toISOString().slice(0, 10),
          new Date(nowMs - 172_800_000).toISOString().slice(0, 10),
        ]);
      }
      this.saveUiState();
      this.render();
      return;
    }

    // Timeline day: collapse / expand one day group
    const dayEl = target.closest("[data-tl-day]") as HTMLElement | null;
    if (dayEl) {
      const dk = dayEl.dataset.tlDay ?? "";
      if (this.collapsedDays.has(dk)) this.collapsedDays.delete(dk);
      else this.collapsedDays.add(dk);
      this.saveUiState();
      this.render();
      return;
    }

    // Timeline item: toggle detail panel
    const tlEl = target.closest("[data-timeline-key]") as HTMLElement | null;
    if (tlEl) {
      const key = tlEl.dataset.timelineKey ?? null;
      this.expandedTimelineKey = this.expandedTimelineKey === key ? null : key;
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
      this.saveUiState();
      this.render();
      return;
    }

    // Hero detail expand (HISTORY toggle)
    if (target.closest("[data-hero-toggle]")) {
      this.heroExpanded = !this.heroExpanded;
      this.saveUiState();
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
      if (!this.solarChannelAutoSet) {
        const STATUS_CHANNEL: Record<string, number> = { quiet: 1, active: 0, elevated: 2, storm: 3 };
        this.solarChannelIdx = STATUS_CHANNEL[this.data.summary?.status ?? "quiet"] ?? 0;
        this.solarChannelAutoSet = true;
      }
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
      const all = await res.json() as (SolarRegion & { observed_date: string; area: number | null })[];
      // Prefer latest record with non-null area (classified); fall back to latest overall
      const latest = new Map<number, SolarRegion & { observed_date: string; area: number | null }>();
      for (const r of all) {
        const prev        = latest.get(r.region);
        const hasData     = r.area != null;
        const prevHasData = prev?.area != null;
        if (!prev
          || (!prevHasData && hasData)                                    // upgrade: no data → has data
          || (prevHasData === hasData && r.observed_date > prev.observed_date)  // same quality, newer
        ) latest.set(r.region, r);
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
      this.expandedTimelineKey, this.timelineOpen, this.collapsedDays,
      this.impactsOpen, this.cmeExpanded, this.forecastOpen, this.indicatorsOpen, this.solarRegions, this.solarExpanded, this.solarLayers,
      this.expandedImpacts, this.opts, this.ovationData, this.solarChannelIdx,
    );
  }

  /** Persist toggle/expand UI state to localStorage. */
  private saveUiState(): void {
    try {
      localStorage.setItem(HELIO_UI_STORAGE_KEY, JSON.stringify({
        expanded:       this.expanded,
        heroExpanded:   this.heroExpanded,
        alertsExpanded: this.alertsExpanded,
        timelineOpen:   this.timelineOpen,
        collapsedDays:  [...this.collapsedDays],
        impactsOpen:    this.impactsOpen,
        cmeExpanded:    this.cmeExpanded,
        forecastOpen:   this.forecastOpen,
        indicatorsOpen: this.indicatorsOpen,
        solarExpanded:  this.solarExpanded,
        solarLayers:    [...this.solarLayers],
        expandedImpacts: [...this.expandedImpacts],
      }));
    } catch (_) {}
  }

  /** Restore UI state from localStorage (called in constructor before first fetch). */
  private loadUiState(): void {
    try {
      const raw = localStorage.getItem(HELIO_UI_STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.expanded       === "boolean") this.expanded       = s.expanded;
      if (typeof s.heroExpanded   === "boolean") this.heroExpanded   = s.heroExpanded;
      if (typeof s.alertsExpanded === "boolean") this.alertsExpanded = s.alertsExpanded;
      if (typeof s.timelineOpen   === "boolean") this.timelineOpen   = s.timelineOpen;
      if (typeof s.impactsOpen    === "boolean") this.impactsOpen    = s.impactsOpen;
      if (typeof s.cmeExpanded    === "boolean") this.cmeExpanded    = s.cmeExpanded;
      if (typeof s.forecastOpen   === "boolean") this.forecastOpen   = s.forecastOpen;
      if (typeof s.indicatorsOpen === "boolean") this.indicatorsOpen = s.indicatorsOpen;
      if (typeof s.solarExpanded  === "boolean") this.solarExpanded  = s.solarExpanded;
      if (Array.isArray(s.collapsedDays))  this.collapsedDays  = new Set(s.collapsedDays);
      if (Array.isArray(s.solarLayers))    this.solarLayers    = new Set(s.solarLayers);
      if (Array.isArray(s.expandedImpacts)) this.expandedImpacts = new Set(s.expandedImpacts);
    } catch (_) {}
  }

  /** Update observer location and re-render the aurora section. */
  updateLocation(lat: number | undefined, lon: number | undefined, locationName?: string): void {
    this.opts = { ...this.opts, lat, lon, locationName };
    this.render();
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
