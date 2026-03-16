"use strict";var HelioWidgetModule=(()=>{var ht=Object.defineProperty;var Gt=Object.getOwnPropertyDescriptor;var Ut=Object.getOwnPropertyNames;var Yt=Object.prototype.hasOwnProperty;var qt=(t,s)=>{for(var e in s)ht(t,e,{get:s[e],enumerable:!0})},Vt=(t,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of Ut(s))!Yt.call(t,n)&&n!==e&&ht(t,n,{get:()=>s[n],enumerable:!(o=Gt(s,n))||o.enumerable});return t};var Zt=t=>Vt(ht({},"__esModule",{value:!0}),t);var Je={};qt(Je,{HelioWidget:()=>Nt});var bt={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Qt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},Jt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},gt={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},te={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},ee={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function se(t){if(!t)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(t).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let e=Math.floor(s/60);return e<24?`Updated ${e}h ago`:`Updated ${Math.floor(e/24)}d ago`}catch(s){return"Updated recently"}}function oe(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function vt(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t}}function rt(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t.slice(11,16)}}function yt(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function Y(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ne(t){return parseInt(t.slice(1),10)>0}var ae=`
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
.hw-scales-row{display:flex;gap:6px}
.hw-scale-chip{font-size:.72em;font-weight:600;padding:1px 6px;border-radius:2px;background:#222e32;color:#96a8b8;border:1px solid #2a3c42}
.hw-scale-chip.hw-scale-active{color:#e0a84a;border-color:#5a4020}
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
/* CME Impact Uncertainty Cone */
.hw-cme-svg{display:block;width:100%;margin:4px 0 5px;overflow:visible}
.hw-cme-footer{font-size:.75em;color:#7a9298;margin-top:2px}

/* Hero quick details \u2014 KPI items are clickable */
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
.hw-impact-badge{font-size:.68em;font-weight:700;padding:1px 7px;border-radius:2px;text-transform:capitalize;min-width:52px;text-align:center;flex-shrink:0}
.hw-impact-tip{flex-basis:100%;font-size:.86em;color:#96a8b8;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px}
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
.hw-magnet-state{font-size:.64em;text-align:center;margin-top:2px;font-weight:600;letter-spacing:.03em}
@keyframes hw-wind{0%{transform:translateX(0);opacity:.85}100%{transform:translateX(14px);opacity:0}}
.hw-wg{animation:hw-wind 1.5s linear infinite}
@keyframes hw-wind-full{from{transform:translateX(0)}to{transform:translateX(16px)}}
.hw-wg-full{animation:hw-wind-full linear infinite}

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
`,kt=!1;function re(){if(kt)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=ae,document.head.appendChild(t),kt=!0}function ie(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.length,n=s/o,c=t.map((r,l)=>{let a=Math.max(2,Math.min(e,r.kp/9*e)),i=e-a,d=l*n,p=r.kp>=6?"#e05c5c":r.kp>=5?"#e0a84a":r.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${i.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${r.kp.toFixed(1)} \xB7 ${h(rt(r.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">${c}</svg>`}function _t(t,s,e,o,n){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let c=200,r=Math.min(...t),l=Math.max(...t),a=l-r||1,i=m=>o-2-(m-r)/a*(o-4),d=t.map((m,w)=>`${(w/(t.length-1)*c).toFixed(1)},${i(m).toFixed(1)}`).join(" "),p="";if(n&&r<0&&l>0){let m=i(0);p=`<line x1="0" y1="${m.toFixed(1)}" x2="${c}" y2="${m.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let g=t.map((m,w)=>`<rect x="${(w/(t.length-1)*c-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${h(s[w]||"")} \xB7 ${m.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${c} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${e}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${g}
  </svg>`}function le(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),n=Math.min(...o),r=Math.max(...o)-n||1,l=d=>e-2-(d-n)/r*(e-4),a=o.map((d,p)=>`${(p/(o.length-1)*s).toFixed(1)},${l(d).toFixed(1)}`).join(" "),i=t.map((d,p)=>{let g=p/(o.length-1)*s,m=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(g-4).toFixed(1)}" y="0" width="8" height="${e}" fill="transparent"><title>${h(rt(d.t_utc))} \xB7 ${m}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${i}
  </svg>`}function Q(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ce(t){var i;let s=(i=t.metrics.wind_history_1h)!=null?i:[],e=s[s.length-1],o=t.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",c=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",r=(e==null?void 0:e.density)!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",l=(e==null?void 0:e.temp_kk)!=null?`${e.temp_kk.toFixed(0)} kK`:"\u2014",a=(e==null?void 0:e.pressure_npa)!=null?`${e.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${Q("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${h(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${h(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function de(t){var l,a;let s=(l=t.metrics.xray_class)!=null?l:"A",e=t.metrics.xray_flux_wm2,o=e!=null?e.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],c=n.map(i=>{let d=i.label===s,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${i.color}${d?"cc":"44"}">${p}</div>`}).join(""),r=n.map(i=>`<div class="hw-xray-scale-label" style="color:${i.label===s?"#c8d8dc":"#607880"}">${i.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${Q("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${c}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=gt[s])!=null?a:"#a0b4b8"}">${h(s)}-class</b> \xB7 ${h(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function pe(t){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',i=[-10,-5,5,10].map(v=>{let y=100+v/20*100;return`<line x1="${y.toFixed(1)}" y1="16" x2="${y.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${i}${d}</svg>`;let p=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",g=Math.max(-20,Math.min(20,t)),m=100+g/20*100,w=3,u=g<0?m-w:100-w,k=Math.max(2*w,Math.abs(m-100)+2*w),x=`<rect x="${u.toFixed(1)}" y="16" width="${k.toFixed(1)}" height="6" rx="${w}" fill="${p}" opacity="0.82"/>`,f=5,b=15,$=b-f*1.1,L=`<polygon points="${m.toFixed(1)},${b.toFixed(1)} ${(m-f).toFixed(1)},${$.toFixed(1)} ${(m+f).toFixed(1)},${$.toFixed(1)}" fill="${p}"/>`,H=`<line x1="${m.toFixed(1)}" y1="${b.toFixed(1)}" x2="${m.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,F=`<text x="${m.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${i}${d}${x}${L}${H}${F}
  </svg>`}function he(t){var g;let s=t.metrics.imf_bz_nt,e=t.metrics.imf_bt_nt,o=t.metrics.solar_wind_kms,n=(g=t.metrics.pressure_npa)!=null?g:null,c=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",r=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",l=e!=null?e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",i=n!=null?`${n.toFixed(2)} nPa`:"\u2014",d=mt(t),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${Q("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${pe(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${h(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${h(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${h(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${h(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function mt(t){var a,i;let s=t.metrics.imf_bz_nt,e=(a=t.metrics.kp_latest)!=null?a:0,o=(i=t.metrics.solar_wind_kms)!=null?i:0,n,c,r;if(s!=null&&s<-5||e>=6)n="storm",c="#e05c5c",r="Storm conditions";else if(s!=null&&s<0||e>=4||o>=400){let d=s!=null&&s<0;n="active",c="#e0a84a",r=d?"Active coupling":"Elevated"}else n="stable",c="#5cce8c",r="Stable";let l;return s==null?l="Unknown":s>2?l="Closed":s>0?l="Minimal":s>-5?l="Moderate":s>-10?l="Strong":l="Very strong",{state:n,color:c,label:r,coupling:l}}function Mt(t,s,e,o){let n=o?"mc":"mf",c=t.color,r=e!=null?e:0,l=r>500,a=r<350,i=l?.9:a?1.8:1.3;if(o){let w=45-(t.state==="storm"?11:t.state==="active"?16:21),u=t.state==="storm"?12:t.state==="active"?10:8,k=50-u,x=76,f=[`M ${w},25`,`C ${w-2},15 41,${u} 45,${u}`,`C 53,${u} ${x-8},${u+4} ${x},20`,`C ${x+1},23 ${x+1},27 ${x},30`,`C ${x-8},${k-4} 53,${k} 45,${k}`,`C 41,${k} ${w-2},35 ${w},25`,"Z"].join(" "),b=l?3:2,$=[14,25,36],L=v=>`<path d="M 0,${v} L ${l?8:6},${v} M ${l?6:4},${v-2} L ${l?8:6},${v} L ${l?6:4},${v+2}" stroke="${c}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,H=$.map(v=>L(v)).join(""),M=Array.from({length:b},(v,y)=>`<g class="hw-wg" style="animation-duration:${i}s;animation-delay:${(i/b*y).toFixed(2)}s">${H}</g>`).join(""),F=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${M}</g>
      <path d="${f}" fill="${c}14" stroke="${c}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${F}
    </svg>`}else{let x=t.state==="storm"?16:t.state==="active"?26:38,f=155-x,b=t.state==="storm"?22:t.state==="active"?30:40,$=120-b,L=240,H=[`M ${f},60`,`C ${f-4},42 150,${b} 155,${b}`,`C 173,${b} ${L-5},${b+18} ${L},60`,`C ${L-5},${$-18} 173,${$} 155,${$}`,`C 150,${$} ${f-4},78 ${f},60`,"Z"].join(" "),M=`M ${f+2},60 C ${f+2},${60-x*.4} 152,54 150,60 C 152,66 ${f+2},${60+x*.4} ${f+2},60 Z`,F=r>700?"#e05c5c":r>500?"#e0a84a":r>350?"#d4c840":"#5cce8c",v=r>700?.4:r>500?.65:r>350?1.1:1.8,y=r>500?[10,24,40,57,74,90,106]:r>350?[14,34,57,82,104]:[20,50,82,108],T=16,C=22,N=f-6,R=Math.ceil((N-C)/T)+2,P=Array.from({length:R},(A,O)=>C-T+O*T),I=12,D=8,S=P.flatMap(A=>y.map(O=>`<path d="M ${A},${O} L ${A+I},${O} M ${A+D},${O-3} L ${A+I},${O} L ${A+D},${O+3}" stroke="${F}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),z=`<g class="hw-wg-full" style="animation-duration:${v}s">${S}</g>`,_=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',E=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="${C}" y="0" width="${N-C}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${n}-wclip)">${z}</g>
      <path d="${M}" fill="${c}08"/>
      <path d="${H}" fill="${c}12" stroke="${c}aa" stroke-width="1.2"/>
      <text x="${f+2}" y="${b-2}" font-size="7" fill="${c}" opacity=".8" font-family="sans-serif">${h(t.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${_}
      ${E}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function ue(t){let s=mt(t),e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=t.metrics.kp_latest,c=t.metrics.density,r=t.metrics.pressure_npa,l=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",i=c!=null?`${c.toFixed(1)} p/cm\xB3`:"\u2014",d=r!=null?`${r.toFixed(2)} nPa`:"\u2014",p=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",g=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",m=e!=null&&e<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":e!=null&&e<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${Q("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Mt(s,e,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${g}">${h(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${s.color}">${h(s.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${h(m)}</div>
  </div>`}function Ct(t,s,e){if(!t.length)return null;let o=(e%360+360)%360,n=-1,c=1/0,r=Math.cos(s*Math.PI/180);for(let l of t){let a=l.lat-s,i=(l.lon-o+180+360)%360-180,d=a*a+i*r*(i*r);d<c&&(c=d,n=l.prob)}return n>=0?n:null}function Lt(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function ge(t,s){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&t.lat!=null&&t.lon!=null&&(o=Ct(s.entries,t.lat,t.lon));let n=t.lat!=null&&t.lon!=null,c=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",r=o!=null?`${o}%`:s?"n/a":"\u2026",l=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?h(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${c}">Aurora: ${r}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${Q("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${Y(e)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Lt(t)}
    </div>
    ${l}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function me(t,s,e,o){switch(s){case"solar_wind":return ce(t);case"xray":return de(t);case"imf_bz":return he(t);case"aurora":return ge(e,o);case"magnetosphere":return ue(t);default:return""}}function nt(t,s){if(t.length<2)return"\u2192";let e=t[t.length-1],o=Math.max(0,t.length-4),n=t[o];if(!isFinite(e)||!isFinite(n))return"\u2192";let c=e-n;return c>s?"\u2191":c<-s?"\u2193":"\u2192"}function we(t,s,e,o,n,c,r){var E,A,O,B,X,U,V;let{summary:l,scales:a,metrics:i,aurora_hint:d}=t,p=(E=bt[l.status])!=null?E:bt.quiet,g=n!=null?n.kp.toFixed(1):i.kp_latest!=null?i.kp_latest.toFixed(1):"\u2014",w=[n?n.gScale:a.g_scale,a.r_scale,a.s_scale].map(W=>{let G=ne(W),q=G?`color:${p.accent};border-color:${p.accent}33`:"";return`<span class="hw-scale-chip${G?" hw-scale-active":""}" style="${q}">${h(W)}</span>`}).join(""),u=n?n.auroraLabel:d.aurora_label,k=u==="good"?"#5cce8c":u==="possible"?"#d4cc5c":"#607880",x=u.charAt(0).toUpperCase()+u.slice(1),f="#b4c6cc",b=i.solar_wind_kms!=null?`${Math.round(i.solar_wind_kms)} km/s`:"\u2014",$=i.imf_bz_nt,L=$!=null?$<=-10?"#e05c5c":$<=-5?"#e0a84a":$>=5?"#5cce8c":"#a0b4b8":"#607880",H=$!=null?($>=0?"+":"")+$.toFixed(1)+" nT":"\u2014",M=i.xray_class,F=M?(A=gt[M])!=null?A:"#a0b4b8":"#607880",v=M?`${M}-class`:"\u2014",y=nt(((O=i.kp_history_1h)!=null?O:[]).map(W=>W.kp),.5),T=nt(((B=i.wind_history_1h)!=null?B:[]).map(W=>W.kms),20),C=nt(((X=i.bz_history_1h)!=null?X:[]).map(W=>W.bz),1.5),N=nt(((U=i.xray_history_1h)!=null?U:[]).map(W=>Math.log10(W.flux+1e-9)),.15),R=s?"\u25BC HISTORY":"\u25B6 HISTORY",P=mt(t),I=(V=i.kp_latest)!=null?V:0,D=I>=5,S=D?`linear-gradient(160deg, #0d2a1a 0%, ${p.bg}22 75%)`:`${p.bg}18`,z=(W,G,q,wt,J)=>{let tt=J?`<span class="hw-trend">${J}</span>`:"";return`<div class="hw-kpi-item${o===W?" hw-kpi-active":""}" data-kpi="${W}">
      <span class="hw-qd-label">${G}</span>
      <span class="hw-qd-value" style="color:${wt}">${q}${tt}</span>
    </div>`},_=D?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${I.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${S}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${n?"color:#9acf60":""}">Kp <b>${h(g)}</b>${n?"":`<span class="hw-trend">${y}</span>`}</div>
          <span class="hw-status-badge" style="background:${p.accent}22;color:${p.accent};display:block;text-align:center">${h(l.label)}</span>
          <div class="hw-scales-row">${w}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${h(l.text)}</div>
            <div class="hw-magnet-mini${o==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${Mt(P,$,i.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${P.color}">${h(P.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${e?"0":"4px"}">
        <span class="hw-section-caret">${e?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${e?`
      <div class="hw-quick-details">
        ${z("aurora","Aurora",h(x),k)}
        ${z("solar_wind","Solar wind",h(b),f,T)}
        ${z("imf_bz","IMF Bz",h(H),L,C)}
        ${z("xray","X-ray",h(v),F,N)}
      </div>
      ${o?me(t,o,c,r):""}
      <div class="hw-section-row" data-hero-toggle style="margin-top:6px">
        <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">HISTORY</span>
      </div>`:""}
      ${_}
    </div>`}function xe(t){var d,p,g,m;let{metrics:s}=t,e=(d=s.kp_history_1h)!=null?d:[],o=(p=s.wind_history_1h)!=null?p:[],n=(g=s.bz_history_1h)!=null?g:[],c=(m=s.xray_history_1h)!=null?m:[],r=ie(e),l=_t(o.map(w=>{var u;return(u=w.kms)!=null?u:0}).filter(w=>w>0),o.map(w=>rt(w.t_utc)),"#5cce8c",28,!1),a=_t(n.map(w=>w.bz),n.map(w=>rt(w.t_utc)),"#d4cc5c",28,!0),i=le(c);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
    </div>`}function $e(t){let s=se(t.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${h(s)}</span>
    </div>`}function fe(t){return t.map((s,e)=>e===0?(s+t[1])/2:e===t.length-1?(t[e-1]+s)/2:(t[e-1]+s+t[e+1])/3)}function be(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function ve(t){return t>=5?"good":t>=3?"possible":"none"}function Ht(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function ye(t){let s=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",e=Ht(t),o=s==="none"?"No aurora expected at mid-latitudes":e!=null?`Aurora possible equatorward of ~${e}\xB0 lat`:"Minor aurora possible at high latitudes",n=t>=7?"moderate":t>=5?"low":"none",c=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",r=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:c},{kind:"solar_activity",level:r,label:"Solar Activity",summary:r==="none"?"Quiet geomagnetic conditions expected":r==="low"?"Active geomagnetic conditions possible":r==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function ke(t,s){var p;if(s<=0)return null;let e=(p=t.metrics.kp_forecast_3h)!=null?p:[];if(!e.length)return null;let o=Date.now()+s*36e5,n=e[0],c=1/0;for(let g of e){let m=Math.abs(new Date(g.t_utc).getTime()-o);m<c&&(c=m,n=g)}let r=n.kp,l=be(r),a=ve(r),i=Ht(r),d=ye(r);return{offsetH:s,kp:r,gScale:l,auroraLabel:a,auroraMinLat:i,impacts:d}}function _e(t,s,e,o){var D;let{forecast:n,metrics:c}=t,{kp_max_next_24h:r,kp_max_at_utc:l,trend:a}=n,i=((D=c.kp_forecast_3h)!=null?D:[]).slice(0,16),d=i.length,p=d*3,g=p>0?`${(s/p*100).toFixed(0)}%`:"0%",m=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",w="Kp forecast unavailable";if(r!=null){let S=vt(l),z=a==="rising"?"rising":a==="falling"?"falling":"steady";w=`Peak Kp ${r.toFixed(1)} next 24h${S?` at ${S}`:""} \xB7 ${z}`}let u=o?"\u25BC FORECAST":"\u25B6 FORECAST";if(!i.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${o?`<div class="hw-forecast-text">${h(w)}</div>`:""}
    </div>`;let k=320,x=38,f=14,b=x+f,$=k/d,L=S=>x-Math.max(2,Math.min(x-2,S/9*(x-2))),H="",M=i.map(S=>S.kp),F=fe(M);i.forEach((S,z)=>{let _=L(S.kp),E=x-_,A=z*$,O=A+$/2,B=S.kp>=6?"#e05c5c":S.kp>=5?"#e0a84a":S.kp>=4?"#d4cc5c":"#5cce8c",X=`Kp ${S.kp.toFixed(1)} \xB7 ${vt(S.t_utc)}`;if(H+=`<rect x="${A.toFixed(1)}" y="${_.toFixed(1)}" width="${($-1.5).toFixed(1)}" height="${E.toFixed(1)}" fill="${B}" fill-opacity="0.85" rx="1.5"/>`,H+=`<rect x="${A.toFixed(1)}" y="0" width="${$.toFixed(1)}" height="${x}" fill="transparent"><title>${Y(X)}</title></rect>`,d<=8||z%2===0){let V=new Date(S.t_utc).getHours();H+=`<text x="${O.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${V.toString().padStart(2,"0")}</text>`}});let y=`<polyline points="${i.map((S,z)=>{let _=z*$+$/2,E=L(F[z]);return`${_.toFixed(1)},${E.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,T="";if(s>0&&d>0){let S=Math.min(k-1,s/(d*3)*k);T=`
      <line x1="${S.toFixed(1)}" y1="0" x2="${S.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${S.toFixed(1)},${x} ${(S-4).toFixed(1)},${(x-7).toFixed(1)} ${(S+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let C=Math.round(p/4),N=Math.round(p/2),R=Math.round(p*3/4),P=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${h(m)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${g}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${C}h</span>
        <span class="hw-scrub-tick">+${N}h</span>
        <span class="hw-scrub-tick">+${R}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,I=e?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(e.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${e.kp.toFixed(1)} \xB7 ${e.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${o?`
      ${I}
      <div class="hw-forecast-text">${h(w)}</div>
      <svg viewBox="0 0 ${k} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${H}
        ${y}
        ${T}
      </svg>
      ${P}`:""}
    </div>`}function Se(t){let s=/([NS])(\d+)([EW])(\d+)/i.exec(t);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Ft=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Me(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function Ce(t,s,e){let o=s/2,n=o*.87,c=s*.03,r=s*.009,l=t.map(a=>{var x,f;let i=Se(a.location);if(!i||Math.abs(i.lon)>88||a.location.includes("*"))return"";let d=Me(a);if(!e.has(d))return"";let p=Ft.find(b=>b.id===d).color,g=i.lat*Math.PI/180,m=i.lon*Math.PI/180,w=(o+n*Math.cos(g)*Math.sin(m)).toFixed(1),u=(o-n*Math.sin(g)).toFixed(1),k=`AR ${a.region} \xB7 ${a.location}
Class: ${(x=a.spot_class)!=null?x:"\u2014"} / ${(f=a.mag_class)!=null?f:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${h(k)}</title>
      <circle cx="${w}" cy="${u}" r="${(c+r+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(r*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${w}" cy="${u}" r="${c.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${r.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Le={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},He='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Fe="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Te=240;function ze(t,s){var i,d,p;let e=parseInt(((i=t.scales.r_scale)!=null?i:"R0").slice(1),10),o=(d=t.metrics.xray_class)!=null?d:"A",n=t.metrics.xray_flux_wm2,c=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",l=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(g=>{let m=g.r===e,w=g.r<=e,u=w?g.color:"#1e2c30",k=m?"1":w?"0.5":"1",x=m?g.color:w?g.color+"99":"#566068",f=m?g.color:w?g.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${x}">R${g.r}</span>
      <div class="hw-radio-bbar" style="background:${u};opacity:${k}"></div>
      <span class="hw-radio-bdesc" style="color:${f}">${g.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${l}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=gt[o])!=null?p:"#a0b4b8"}">${h(o)}-class</b> \xB7 ${h(c)}</div>
  </div>`}var Tt={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function zt(t){var l;let s=(l=t.metrics.kp_forecast_3h)!=null?l:[],e=Date.now(),o=e+24*60*60*1e3,n=s.filter(a=>{let i=new Date(a.t_utc).getTime();return i>=e-3*60*60*1e3&&i<=o});if(n.length===0)return{g1:0,g2:0,g3:0};let c=Math.max(...n.map(a=>a.kp)),r=a=>{if(c<a-.7)return 0;if(c>a+1)return 90;let i=(c-(a-.7))/1.7;return Math.round(Math.pow(Math.max(0,i),.7)*90)};return{g1:r(5),g2:r(6),g3:r(7)}}function Ee(t,s){let e=zt(t),o=(()=>{var g;let a=(g=t.metrics.kp_forecast_3h)!=null?g:[],i=Date.now(),d=i+24*60*60*1e3,p=a.filter(m=>new Date(m.t_utc).getTime()<=d);return p.length?Math.max(...p.map(m=>m.kp)):null})(),c=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:a,label:i})=>{let d=e[a],p=Tt[a];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${p};${d===0?" opacity:.35":""}">${i}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${d}%;background:${p}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${d>0?p:"#607880"}">${d}%</span>
    </div>`}).join(""),r=o!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${o.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${c}</div>
    ${r?`<div class="hw-gstorm-footer">${r} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var at={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},Et={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function Ae(t){var v;let s=at,e=(v=Et[s.phase])!=null?v:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,c=52,r=10,l=c-6,a=c-18,i=.5,d=.19,p=y=>Math.exp(-Math.pow((y-i)/d,2)/2),g=y=>r+y*(n-2*r),m=y=>l-p(y)*a,w=80,u=[];for(let y=0;y<=w;y++){let T=y/w;u.push(`${y===0?"M":"L"}${g(T).toFixed(1)},${m(T).toFixed(1)}`)}let k=Math.round(s.progress_0_1*w),x=[];for(let y=0;y<=k;y++){let T=y/w;x.push(`${y===0?"M":"L"}${g(T).toFixed(1)},${m(T).toFixed(1)}`)}let f=g(s.progress_0_1),b=[`M${r},${l}`,...x.slice(1),`L${f.toFixed(1)},${l} Z`],$=m(s.progress_0_1),L=5,H=`M${f.toFixed(1)},${$.toFixed(1)} L${(f-L).toFixed(1)},${($-L*1.8).toFixed(1)} L${(f+L).toFixed(1)},${($-L*1.8).toFixed(1)} Z`,M=l+11;return`<div class="hw-impact-tip${t?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${h(s.cycle_name)}</div>
    <svg width="100%" height="${c+14}" viewBox="0 0 ${n} ${c+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${e}" opacity="0.12"/>
      <path d="${u.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${x.join(" ")}" fill="none" stroke="${e}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${r}" y1="${l}" x2="${n-r}" y2="${l}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${H}" fill="${e}"/>
      <text x="${r+2}" y="${M}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${g(.5).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-r-2).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${e}">${h(o)}</b>${s.subtitle?` \xB7 ${h(s.subtitle)}`:""}</div>
  </div>`}function At(t){var a,i,d,p,g;let s=(i=(a=t.coronal_hole)==null?void 0:a.estimated_speed_kms)!=null?i:t.metrics.solar_wind_kms,e=(d=t.coronal_hole)==null?void 0:d.status,o=s!=null?s:0,n=e!=null?e:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",c={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},r={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},l={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:c[n],label:r[n],desc:(g=(p=t.coronal_hole)==null?void 0:p.note)!=null?g:l[n],speed:s}}function Oe(t,s){var S;let e=At(t),o=(S=e.speed)!=null?S:0,n=e.speed!=null?`${Math.round(e.speed)} km/s`:"\u2014",c=s?" hw-impact-tip-open":"",r=160,l=72,a=18,i=36,d=142,p=36,g=11,m=14,w=19,u=9,k=o>=500,x=o>=420,f=k?"#f5c540":x?"#c8a020":"#7a6010",b=k?"#f5c540":x?"#c8a020":"#3a3808",$=e.color,L=x?"0.9":"0.25",H=k?"0.18":x?"0.10":"0.04",M=[0,45,90,135,180,225,270,315].map(z=>{let _=z*Math.PI/180,E=(a+m*Math.cos(_)).toFixed(1),A=(i+m*Math.sin(_)).toFixed(1),O=(a+w*Math.cos(_)).toFixed(1),B=(i+w*Math.sin(_)).toFixed(1),X=z>300||z<60?"0.9":"0.5";return`<line x1="${E}" y1="${A}" x2="${O}" y2="${B}"
      stroke="${f}" stroke-width="1.6" stroke-linecap="round" opacity="${X}"/>`}).join(""),F=a+g+2,v=d-u-3,y=14,T=`${F},${i} ${v},${p-y} ${v},${p+y}`,C=v+1,N=`${C},${p-4} ${C+7},${p} ${C},${p+4}`,R=u,P=`
    <ellipse cx="${d}" cy="${p}" rx="${R}" ry="${(R*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${d}" y1="${p-R}" x2="${d}" y2="${p+R}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${d-R}" y1="${p}" x2="${d+R}" y2="${p}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.35"/>`,I=`<svg class="hw-hss-diagram" width="100%" height="${l}"
      viewBox="0 0 ${r} ${l}" preserveAspectRatio="none" aria-hidden="true">
    <!-- stream fan -->
    <polygon points="${T}" fill="${$}" opacity="${H}"/>
    <!-- dashed stream axis -->
    <line x1="${F}" y1="${i}" x2="${v-2}" y2="${p}"
          stroke="${$}" stroke-width="2" stroke-dasharray="5 3.5"
          stroke-linecap="round" opacity="${L}"/>
    <!-- arrow -->
    <polygon points="${N}" fill="${$}" opacity="${x?"0.9":"0.25"}"/>
    <!-- Sun glow ring -->
    <circle cx="${a}" cy="${i}" r="${g+6}" fill="none"
            stroke="${b}" stroke-width="1.5" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${a}" cy="${i}" r="${g}" fill="${f}" opacity="0.92"/>
    ${M}
    <!-- Earth body -->
    <circle cx="${d}" cy="${p}" r="${R}" fill="#1a4a6e" opacity="0.92"/>
    ${P}
    <!-- labels -->
    <text x="${a}" y="${l-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${d}" y="${l-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
  </svg>`,D=x?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${c}">
    ${I}
    <div class="hw-hss-meta">Solar wind: <b style="color:${e.color}">${h(n)}</b> \xB7 ${h(e.desc)}</div>
    ${D}
  </div>`}function Ot(t){var n,c;let s=(n=t.scales.g_scale)!=null?n:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let r=(c=t.metrics.kp_forecast_3h)!=null?c:[],l=Date.now(),a=r.filter(i=>new Date(i.t_utc).getTime()<=l+3*60*60*1e3).sort((i,d)=>new Date(d.t_utc).getTime()-new Date(i.t_utc).getTime());a.length>0&&(o=a[0].kp)}return e>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:e>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function Re(t,s){let e=Ot(t),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(a=>{let i=a.l===e.level,d=i?a.color:"#566068",p=i?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${d}">${a.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${a.width}%;background:${a.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${i?a.color:"transparent"}">${i?"\u25C0":""}</span>
    </div>`}).join(""),r=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",l={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${c}</div>
    <div class="hw-satdrag-meta">${r} \xB7 ${h(e.gScale)} \xB7 ${l[e.level]}</div>
  </div>`}function Rt(t){var i,d,p;let s=(i=t.scales.g_scale)!=null?i:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let g=(d=t.metrics.kp_forecast_3h)!=null?d:[],m=Date.now(),w=g.filter(u=>new Date(u.t_utc).getTime()<=m+3*60*60*1e3).sort((u,k)=>new Date(k.t_utc).getTime()-new Date(u.t_utc).getTime());w.length>0&&(o=w[0].kp)}let n=0;e>=2||o!=null&&o>=6?n=2:(e>=1||o!=null&&o>=4)&&(n=1);let c=parseInt(((p=t.scales.r_scale)!=null?p:"R0").slice(1),10),r=c>=2&&n<2;c>=2&&(n=Math.min(2,n+1));let l={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:l[n],label:a[n],kp:o,gScale:s,boostedByFlare:r}}function Ie(t,s){var i;let e=Rt(t),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(d=>{let p=d.l===e.level,g=p?d.color:"#566068",m=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${g}">${d.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${d.width}%;background:${d.color};opacity:${m}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?d.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),r=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",l={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=e.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((i=t.scales.r_scale)!=null?i:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${c}</div>
    <div class="hw-gnss-meta">${r} \xB7 ${h(e.gScale)} \xB7 ${l[e.level]}</div>
    ${a}
  </div>`}function It(t){var n;let s=t.metrics.pressure_npa,e=s!=null?s:null,o=(n=t.metrics.density)!=null?n:null;return e==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:e>=6?{pressure:e,color:"#e05c5c",label:"Extreme",density:o}:e>=4?{pressure:e,color:"#e0a84a",label:"Strong",density:o}:e>=2?{pressure:e,color:"#d4cc5c",label:"Elevated",density:o}:e>=1?{pressure:e,color:"#5cce8c",label:"Typical",density:o}:{pressure:e,color:"#7a9298",label:"Weak",density:o}}function De(t,s){let e=It(t),o=s?" hw-impact-tip-open":"",n=e.pressure,c=200,r=6,l=10,a=r+l,i=a+4,d=i+11,p=a+9,g=d+4,w=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(v=>`<rect x="${v.x}" y="${r}" width="${v.w}" height="${l}" fill="${v.color}" opacity="0.55" rx="0"/>`).join(""),u=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],k=u.map(v=>`<line x1="${v.x}" y1="${a}" x2="${v.x}" y2="${i}" stroke="#3a5058" stroke-width="1"/>`).join(""),x=u.map(v=>`<text x="${v.x}" y="${d}" class="hw-swdp-axlabel" text-anchor="${v.anchor}">${v.label}</text>`).join(""),f="";if(n!=null){let y=Math.min(Math.max(n,0),8)/8*c;f=`<polygon points="${`${y-5},${p} ${y+5},${p} ${y},${a}`}" fill="${e.color}" opacity="0.95"/>
    <line x1="${y}" y1="${r}" x2="${y}" y2="${a}" stroke="${e.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${r}" width="${c}" height="${l}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,$=`<svg class="hw-swdp-gauge" viewBox="0 0 ${c} ${g}" preserveAspectRatio="none" aria-hidden="true">
    ${w}${b}${f}${k}${x}
  </svg>`,L=n!=null?`${n.toFixed(2)} nPa`:"\u2014",H=e.density!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",M=t.metrics.solar_wind_kms!=null?`${Math.round(t.metrics.solar_wind_kms)} km/s`:"\u2014",F=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${$}
    <div class="hw-swdp-meta"><b style="color:${e.color}">${h(L)}</b>${h(F)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${h(M)} \xB7 Density ${h(H)}</div>
  </div>`}function Dt(t){var i,d;let s=(i=t.alerts_all)!=null?i:[],e=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=e!=null?e:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let c=((d=n.raw_body)!=null?d:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),r=c?parseInt(c[1],10):null,l=null;if(r&&n.t_utc){let p=1496e5/r*1e3;l=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let a=e?"impact":"watch";return{status:a,color:a==="impact"?"#e05c5c":"#d4cc5c",label:a==="impact"?"Active":"Watch",speed_kms:r,issued_utc:n.t_utc,arrival_utc:l}}function Ne(t,s){let e=Dt(t),o=s?" hw-impact-tip-open":"",n=320,c=80,r=24,l=40,a=268,i=296,d=a-r,p=_=>Math.tan(_*Math.PI/180),g=Math.round(p(9)*d),m=Math.round(p(6)*d),w=Math.round(p(3)*d),u=_=>`${r},${l} ${a},${l-_} ${a},${l+_}`,k=e.status==="impact"?l:e.status==="watch"?l+m+8:l,x=Math.min(c-14,Math.max(14,k)),f=Math.abs(x-l)<=w,b=Math.abs(x-l)<=m,$=Math.abs(x-l)<=g,L=f?"#e05c5c":b?"#d4cc5c":$?"#e0a84a":"#5cce8c",H=e.status!=="quiet"?`<polygon points="${u(g)}" fill="#253238" opacity="0.85"/>
       <polygon points="${u(m)}"   fill="#d4cc5c" opacity="0.14"/>
       <polygon points="${u(w)}" fill="#e0a84a" opacity="0.28"/>
       <line x1="${r+9}" y1="${l}" x2="${a-2}" y2="${l}"
             stroke="#3a5058" stroke-dasharray="3 3" stroke-width="1"/>`:`<line x1="${r+9}" y1="${l}" x2="${i-9}" y2="${l}"
             stroke="#1e2c30" stroke-dasharray="4 3" stroke-width="1"/>`,M=8,F=11,v=15,y="#f5c540",T=[0,45,90,135,180,225,270,315].map(_=>{let E=_*Math.PI/180,A=(r+F*Math.cos(E)).toFixed(1),O=(l+F*Math.sin(E)).toFixed(1),B=(r+v*Math.cos(E)).toFixed(1),X=(l+v*Math.sin(E)).toFixed(1),U=_<45||_>315?"0.9":"0.5";return`<line x1="${A}" y1="${O}" x2="${B}" y2="${X}"
      stroke="${y}" stroke-width="1.4" stroke-linecap="round" opacity="${U}"/>`}).join(""),C=7,N=`
    <ellipse cx="${i}" cy="${x}" rx="${C}" ry="${(C*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${i}" y1="${x-C}" x2="${i}" y2="${x+C}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>`,R="\u2014";if(e.arrival_utc){let _=new Date(e.arrival_utc),E=_.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),A=_.getUTCDate(),O=String(_.getUTCHours()).padStart(2,"0"),B=String(_.getUTCMinutes()).padStart(2,"0");R=`~${E}\xA0${A}\xA0${O}:${B}\u202FUTC`}let P=e.speed_kms?`${e.speed_kms}\u202Fkm/s`:"\u2014",I=e.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${h(P)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${h(R)}</b>`:"No Earth-directed CME in forecast window",D=f?"Direct impact likely":b?"Glancing blow possible":$?"Near outer edge":"Impact unlikely",S=f?"#e05c5c":b?"#d4cc5c":$?"#e0a84a":"#5cce8c",z=`<svg class="hw-cme-svg" width="100%" height="${c}"
      viewBox="0 0 ${n} ${c}" preserveAspectRatio="none" aria-hidden="true">
    ${H}
    <!-- Sun glow -->
    <circle cx="${r}" cy="${l}" r="${M+5}" fill="none"
            stroke="${y}" stroke-width="1.2" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${r}" cy="${l}" r="${M}" fill="${y}" opacity="0.92"/>
    ${T}
    <!-- Earth body -->
    <circle cx="${i}" cy="${x}" r="${C}" fill="#1a4a6e" opacity="0.92"/>
    ${N}
    <!-- Earth glow -->
    <circle cx="${i}" cy="${x}" r="${C+4}" fill="none"
            stroke="${L}" stroke-width="4" opacity="0.12"/>
    <!-- Labels -->
    <text x="${r}" y="${c-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${i}" y="${c-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
    ${e.status!=="quiet"?`<text x="${Math.round((r+i)/2)}" y="${c-3}" font-size="7.5"
               fill="${S}" text-anchor="middle" font-family="inherit">${h(D)}</text>`:""}
  </svg>`;return`<div class="hw-impact-tip${o}">
    ${z}
    <div class="hw-cme-footer">${I}</div>
  </div>`}function Pe(t,s,e,o,n,c,r,l,a){var tt,it,xt;let i=(it=(tt=s==null?void 0:s.impacts)!=null?tt:t.observer_impacts)!=null?it:[],d=i.map(j=>{var $t,ft;let lt=($t=Qt[j.level])!=null?$t:"#666",Pt=j.level==="none"?"None":j.level.charAt(0).toUpperCase()+j.level.slice(1),Bt=(ft=Le[j.kind])!=null?ft:He,jt=j.level==="none"?"#606870":lt,et=j.kind==="solar_activity"?n:r.has(j.kind),Wt=et?" hw-impact-open":"",Z;if(j.kind==="solar_activity"){let st=n?" hw-solar-open":"",ct=Ft.map(K=>{let ot=c.has(K.id),dt=ot?K.color+"22":"transparent",pt=ot?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${K.id}" style="color:${K.color};border-color:${K.color};background:${dt};opacity:${pt}">${K.label}</button>`}).join("");Z=`<div class="hw-solar-tip${st}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Fe}" alt="Solar disk" loading="lazy" />
            ${e?Ce(e,Te,c):""}
          </div>
          <div class="hw-solar-layers">${ct}</div>
          <span class="hw-solar-tip-text">${h(j.summary)}</span>
        </div>`}else if(j.kind==="aurora"){let st=et?" hw-aurora-tip-open":"",ct=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,K=null;l&&a.lat!=null&&a.lon!=null&&(K=Ct(l.entries,a.lat,a.lon));let ot=a.lat!=null&&a.lon!=null,dt=K!=null?K>=30?"#5cce8c":K>=10?"#d4cc5c":"#9ab4bc":"#607880",pt=K!=null?`${K}%`:l?"n/a":"\u2026",Xt=ot?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${a.locationName?h(a.locationName)+" \xB7 ":""}${a.lat.toFixed(1)}\xB0${a.lat>=0?"N":"S"} ${Math.abs(a.lon).toFixed(1)}\xB0${a.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${dt}">Aurora: ${pt}</span>
        </div>`:"";Z=`<div class="hw-aurora-tip${st}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${Y(ct)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Lt(a)}
          </div>
          ${Xt}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else j.kind==="radio"?Z=ze(t,et):Z=`<div class="hw-impact-tip${et?" hw-impact-tip-open":""}">${h(j.summary)}</div>`;let Kt=j.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${Y(j.kind)}"`;return`<div class="hw-impact-row${Wt}"${Kt}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${jt}">${Bt}<span style="color:#b4c6cc">${h(j.label)}</span></span>
      <span class="hw-impact-badge" style="background:${lt}22;color:${lt}">${h(Pt)}</span>
      ${Z}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",g=i.length+7,m=o?"\u25BC":"\u25B6",w=g>0?`Observer Impacts (${g})`:"Observer Impacts",u=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}${p}</span>
    </div>`,k=r.has("geomag_storm"),x=zt(t),f=x.g1,b=x.g1>=30?Tt.g1:x.g1>0?"#7a9298":"#607880",$=f>0?`G1 ${f}%`:"None",H=`<div class="hw-impact-row${k?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${b}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${b}22;color:${b}">${$}</span>
      ${Ee(t,k)}
    </div>`,M=r.has("solar_cycle"),F=(xt=Et[at.phase])!=null?xt:"#96a8b8",v=at.phase.charAt(0).toUpperCase()+at.phase.slice(1),T=`<div class="hw-impact-row${M?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${F}22;color:${F}">${v}</span>
      ${Ae(M)}
    </div>`,C=At(t),N=r.has("hss"),P=`<div class="hw-impact-row${N?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${C.color}22;color:${C.color}">${C.label}</span>
      ${Oe(t,N)}
    </div>`,I=Ot(t),D=r.has("sat_drag"),z=`<div class="hw-impact-row${D?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${I.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${I.color}22;color:${I.color}">${I.label}</span>
      ${Re(t,D)}
    </div>`,_=Rt(t),E=r.has("gnss"),O=`<div class="hw-impact-row${E?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${_.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${_.color}22;color:${_.color}">${_.label}</span>
      ${Ie(t,E)}
    </div>`,B=It(t),X=r.has("sw_pressure"),U=B.pressure!=null?`${B.pressure.toFixed(2)} nPa`:"\u2014",W=`<div class="hw-impact-row${X?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${B.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${B.color}22;color:${B.color}">${U}</span>
      ${De(t,X)}
    </div>`,G=Dt(t),q=r.has("cme_cone"),J=`<div class="hw-impact-row${q?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${G.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${G.color}22;color:${G.color}">${h(G.label)}</span>
      ${Ne(t,q)}
    </div>`;return`
    <div class="hw-impacts">
      ${u}
      ${o?d+H+T+P+z+O+W+J:""}
    </div>`}var St={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Be(t,s){var a,i;let e=(a=Jt[t.level])!=null?a:"#666",o=t.level.charAt(0).toUpperCase()+t.level.slice(1),n=(i=St[t.kind])!=null?i:St.unknown,c=[oe(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),r=s&&t.raw_body?`<div class="hw-alert-body">${h(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${e}" data-alert-key="${Y(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${e}">${n}</span>
      <span class="hw-alert-level" style="color:${e}">${h(o)}</span>
      <span class="hw-alert-title">${h(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${h(t.summary_short)}</div>
    <div class="hw-alert-meta">${h(c)}</div>
    ${r}
  </div>`}var je={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},We="#4ae0a4";function Ke(t){let s=(e,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${e}</svg>`;switch(t){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
        <line x1="6.5" y1="1" x2="6.5" y2="3"/>
        <line x1="6.5" y1="10" x2="6.5" y2="12"/>
        <line x1="1" y1="6.5" x2="3" y2="6.5"/>
        <line x1="10" y1="6.5" x2="12" y2="6.5"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="8.9" y1="8.9" x2="10.3" y2="10.3"/>
        <line x1="10.3" y1="2.7" x2="8.9" y2="4.1"/>
        <line x1="4.1" y1="8.9" x2="2.7" y2="10.3"/>`);case"cme_launch":return s(`<line x1="1" y1="6.5" x2="10" y2="6.5"/>
        <polyline points="7,3.5 10,6.5 7,9.5"/>
        <line x1="1" y1="4.5" x2="6" y2="4.5" stroke-opacity=".5"/>
        <line x1="1" y1="8.5" x2="6" y2="8.5" stroke-opacity=".5"/>`);case"cme_arrival":return s(`<path d="M11,6.5 A4.5,4.5 0 0,1 2,6.5" stroke-opacity=".4"/>
        <path d="M9.5,6.5 A3,3 0 0,1 3.5,6.5" stroke-opacity=".7"/>
        <path d="M8,6.5 A1.5,1.5 0 0,1 5,6.5"/>
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>`);case"geomagnetic_storm":return s('<polyline points="8,1.5 5,6.5 7.5,6.5 5,11.5"/>');case"geomagnetic_watch":return s(`<circle cx="6.5" cy="6.5" r="5"/>
        <line x1="6.5" y1="3.5" x2="6.5" y2="6.5"/>
        <line x1="6.5" y1="6.5" x2="9" y2="7.5"/>`);case"radio_blackout":return s(`<path d="M3,3.5 Q6.5,6.5 10,9.5" stroke-opacity=".5"/>
        <path d="M10,3.5 Q6.5,6.5 3,9.5"/>
        <line x1="5" y1="1" x2="8" y2="12" stroke-opacity=".3"/>`);case"radiation_storm":return s(`<path d="M6.5,1.5 L12,11 L1,11 Z"/>
        <line x1="6.5" y1="5" x2="6.5" y2="8"/>
        <circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/>`);default:return s(`<circle cx="6.5" cy="6.5" r="5.5"/>
        <line x1="6.5" y1="5.5" x2="6.5" y2="9"/>
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function Xe(t){var o;let s=(o=t.metadata)!=null?o:{},e=[];return s.source_code&&e.push(`Code: ${s.source_code}`),s.model&&e.push(`Model: ${String(s.model).toUpperCase()}`),e.length===0?"":`
${e.join(" \xB7 ")}`}function Ge(t,s,e){var a;let o=t.is_active?We:(a=je[t.level])!=null?a:"#445c64",n=t.event_time===e,c=t.event_time.slice(11,16)+" UTC",r=t.source==="NASA_DONKI"?"DONKI":"SWPC",l=n?`<div class="hw-tl-detail">${h(t.description)}${h(Xe(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${Y(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${c}</span>
          <span class="hw-tl-src">${r}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${Ke(t.event_type)} ${h(t.event_title)}
        </div>
        ${l}
      </div>
    </div>`}function Ue(t,s,e,o){var x,f;let n=(x=t.timeline)!=null?x:[],c=Date.now(),r=new Date(c).toISOString().slice(0,10),l=new Date(c-864e5).toISOString().slice(0,10),a=new Date(c-1728e5).toISOString().slice(0,10),i=new Set([r,l,a]),d=n.filter(b=>{var $;return i.has((($=b.event_time)!=null?$:"").slice(0,10))}).slice().reverse(),p=d.length,g=e?"\u25BC":"\u25B6",m=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",w=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${m}</span>
    </div>`;if(!e||p===0)return`<div class="hw-timeline">${w}</div>`;let u=new Map;for(let b of d){let $=((f=b.event_time)!=null?f:"").slice(0,10);u.has($)||u.set($,[]),u.get($).push(b)}let k=[...u.entries()].map(([b,$])=>{let H=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=o.has(b),F=M?"\u25B6":"\u25BC",v=M?`<span class="hw-tl-day-count">${$.length} events</span>`:"",y=`
      <div class="hw-tl-day-row" data-tl-day="${Y(b)}">
        <span class="hw-section-caret">${F}</span>
        <span class="hw-tl-date">${H}</span>
        ${v}
      </div>`,T=M?"":$.map((C,N)=>Ge(C,N<$.length-1,s)).join("");return`<div class="hw-tl-group">${y}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${w}
      ${k}
    </div>`}function Ye(t,s,e){var i;let o=(i=t.alerts_all)!=null?i:[],n=o.length,c=s?"\u25BC":"\u25B6",r=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${c}</span>
        <span class="hw-alerts-label">${r}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${l}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=o.map(d=>Be(d,d.dedupe_key===e)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${a}
    </div>`}function qe(t,s){var R,P,I;let e=t.cme_tracker;if(!e)return"";let o=(R=te[e.impact_level])!=null?R:"#96a8b8",n=(P=ee[e.status])!=null?P:e.status,c=300,r=44,l=18,a=r/2,i=10,d=c-18,p=7,g=`<line x1="${l+i}" y1="${a}" x2="${d-p}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,m=`<circle cx="${l}" cy="${a}" r="${i}" fill="#f0c040" opacity="0.92"/>`,w=`
    <circle cx="${d}" cy="${a}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,u=`<text x="${l}" y="${a+i+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,k=`<text x="${d}" y="${a+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,x="";if(e.progress!=null){let D=l+i+4,S=d-p-4,z=D+e.progress*(S-D),_=5;e.status==="arrival_window"?x=`
        <g transform="translate(${z.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${_}" fill="${o}" opacity="0.92"/>
        </g>`:x=`<circle cx="${z.toFixed(1)}" cy="${a}" r="${_}" fill="${o}" opacity="0.85"/>`}let f=`<svg class="hw-cme-svg" viewBox="0 0 ${c} ${r}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${g}
    ${m}${u}
    ${w}${k}
    ${x}
  </svg>`,b=yt(e.arrival_time_utc),$=yt(e.launch_time_utc),L=e.speed_kms!=null?`${Math.round(e.speed_kms)} km/s`:"\u2014",H=e.half_angle_deg!=null?`${e.half_angle_deg}\xB0`:"\u2014",M=(I=e.source_location)!=null?I:"\u2014",F=e.is_earth_direct?"Direct hit":"Glancing blow",v=e.progress!=null?`${Math.round(e.progress*100)}%`:"\u2014",y=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${h(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${h(L)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${h(e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${h(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${h($)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${h(v)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${h(H)} \xB7 Source: ${h(M)} \xB7 ${h(F)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,T=s?"\u25BC":"\u25B6",C=e.impact_level==="unknown"?"Unrated":e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1),N=s?`${f}${y}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${T}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${h(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${h(C)} impact</span>
      </div>
      ${N}
    </div>`}function Ve(t,s,e,o,n,c,r,l,a,i,d,p,g,m,w,u,k,x,f,b){let $=ke(t,n);return`
    <div class="hw-root">
      ${$e(t)}
      ${we(t,e,m,o,$,f,b)}
      ${e?xe(t):""}
      ${_e(t,n,$,g)}
      ${qe(t,p)}
      ${Pe(t,$,w,d,u,k,x,b,f)}
      ${Ue(t,l,a,i)}
      ${Ye(t,c,r)}
    </div>`}function Ze(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${h(t)}</div>
    </div>
  </div>`}function Qe(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var ut=class{constructor(s,e){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=e,this.el.innerHTML=Qe(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var i,d,p,g,m,w;let e=s.target;if(e.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(e.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(e.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.render();return}if(e.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.render();return}if(e.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let o=e.closest("[data-impact-row]");if(o){let u=(i=o.dataset.impactRow)!=null?i:"";this.expandedImpacts.has(u)?this.expandedImpacts.delete(u):this.expandedImpacts.add(u),this.render();return}let n=e.closest("[data-solar-layer]");if(n){let u=(d=n.dataset.solarLayer)!=null?d:"";this.solarLayers.has(u)?this.solarLayers.delete(u):this.solarLayers.add(u),this.render();return}if(e.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(e.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let c=e.closest("[data-alert-key]");if(c){let u=(p=c.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===u?null:u,this.render();return}if(e.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let u=Date.now();this.collapsedDays=new Set([new Date(u).toISOString().slice(0,10),new Date(u-864e5).toISOString().slice(0,10),new Date(u-1728e5).toISOString().slice(0,10)])}this.render();return}let r=e.closest("[data-tl-day]");if(r){let u=(g=r.dataset.tlDay)!=null?g:"";this.collapsedDays.has(u)?this.collapsedDays.delete(u):this.collapsedDays.add(u),this.render();return}let l=e.closest("[data-timeline-key]");if(l){let u=(m=l.dataset.timelineKey)!=null?m:null;this.expandedTimelineKey=this.expandedTimelineKey===u?null:u,this.render();return}if(e.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let a=e.closest("[data-kpi]");if(a){let u=(w=a.dataset.kpi)!=null?w:null;this.activePopover=this.activePopover===u?null:u,this.render();return}if(e.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}e.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(s){let e=s.target;if(!e.matches("[data-scrub]"))return;let o=parseFloat(e.value);this.scrubOffset=o,e.style.setProperty("--pct",`${(o/parseFloat(e.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let e=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);this.data=await e.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(e){let o=e instanceof Error?e.message:String(e);this.el.innerHTML=Ze(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let e=await s.json(),o=new Map;for(let n of e){let c=o.get(n.region),r=n.area!=null,l=(c==null?void 0:c.area)!=null;(!c||!l&&r||l===r&&n.observed_date>c.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,e,o,n,c,r;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let a=await l.json(),d=((o=(e=(s=a.coordinates)!=null?s:a.Data)!=null?e:a.data)!=null?o:[]).map(([p,g,m])=>({lon:p,lat:g,prob:m}));this.ovationData={entries:d,forecastTime:String((r=(c=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?c:a["Observation Time"])!=null?r:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=Ve(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},Nt={mount(t,s){return re(),new ut(t,s)}};typeof window!="undefined"&&(window.HelioWidget=Nt);return Zt(Je);})();
