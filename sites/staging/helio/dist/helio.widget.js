"use strict";var HelioWidgetModule=(()=>{var ht=Object.defineProperty;var Gt=Object.getOwnPropertyDescriptor;var Ut=Object.getOwnPropertyNames;var Yt=Object.prototype.hasOwnProperty;var qt=(t,s)=>{for(var e in s)ht(t,e,{get:s[e],enumerable:!0})},Vt=(t,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of Ut(s))!Yt.call(t,n)&&n!==e&&ht(t,n,{get:()=>s[n],enumerable:!(o=Gt(s,n))||o.enumerable});return t};var Zt=t=>Vt(ht({},"__esModule",{value:!0}),t);var Je={};qt(Je,{HelioWidget:()=>Nt});var bt={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Qt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},Jt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},gt={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},te={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},ee={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function se(t){if(!t)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(t).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let e=Math.floor(s/60);return e<24?`Updated ${e}h ago`:`Updated ${Math.floor(e/24)}d ago`}catch(s){return"Updated recently"}}function oe(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function vt(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t}}function rt(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t.slice(11,16)}}function yt(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function U(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ne(t){return parseInt(t.slice(1),10)>0}var ae=`
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
`,kt=!1;function re(){if(kt)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=ae,document.head.appendChild(t),kt=!0}function ie(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.length,n=s/o,d=t.map((a,l)=>{let r=Math.max(2,Math.min(e,a.kp/9*e)),i=e-r,c=l*n,p=a.kp>=6?"#e05c5c":a.kp>=5?"#e0a84a":a.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${i.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${r.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${a.kp.toFixed(1)} \xB7 ${h(rt(a.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">${d}</svg>`}function _t(t,s,e,o,n){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let d=200,a=Math.min(...t),l=Math.max(...t),r=l-a||1,i=m=>o-2-(m-a)/r*(o-4),c=t.map((m,w)=>`${(w/(t.length-1)*d).toFixed(1)},${i(m).toFixed(1)}`).join(" "),p="";if(n&&a<0&&l>0){let m=i(0);p=`<line x1="0" y1="${m.toFixed(1)}" x2="${d}" y2="${m.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let u=t.map((m,w)=>`<rect x="${(w/(t.length-1)*d-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${h(s[w]||"")} \xB7 ${m.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${d} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${c}" fill="none" stroke="${e}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${u}
  </svg>`}function le(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),n=Math.min(...o),a=Math.max(...o)-n||1,l=c=>e-2-(c-n)/a*(e-4),r=o.map((c,p)=>`${(p/(o.length-1)*s).toFixed(1)},${l(c).toFixed(1)}`).join(" "),i=t.map((c,p)=>{let u=p/(o.length-1)*s,m=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(u-4).toFixed(1)}" y="0" width="8" height="${e}" fill="transparent"><title>${h(rt(c.t_utc))} \xB7 ${m}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">
    <polyline points="${r}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${i}
  </svg>`}function Q(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ce(t){var i;let s=(i=t.metrics.wind_history_1h)!=null?i:[],e=s[s.length-1],o=t.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",d=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",a=(e==null?void 0:e.density)!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",l=(e==null?void 0:e.temp_kk)!=null?`${e.temp_kk.toFixed(0)} kK`:"\u2014",r=(e==null?void 0:e.pressure_npa)!=null?`${e.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${Q("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${h(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${h(r)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function de(t){var l,r;let s=(l=t.metrics.xray_class)!=null?l:"A",e=t.metrics.xray_flux_wm2,o=e!=null?e.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],d=n.map(i=>{let c=i.label===s,p=c?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${i.color}${c?"cc":"44"}">${p}</div>`}).join(""),a=n.map(i=>`<div class="hw-xray-scale-label" style="color:${i.label===s?"#c8d8dc":"#607880"}">${i.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${Q("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${d}</div>
      <div class="hw-xray-scale-labels">${a}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(r=gt[s])!=null?r:"#a0b4b8"}">${h(s)}-class</b> \xB7 ${h(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function pe(t){let r='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',i=[-10,-5,5,10].map(y=>{let k=100+y/20*100;return`<line x1="${k.toFixed(1)}" y1="16" x2="${k.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),c='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${r}${i}${c}</svg>`;let p=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",u=Math.max(-20,Math.min(20,t)),m=100+u/20*100,w=3,g=u<0?m-w:100-w,v=Math.max(2*w,Math.abs(m-100)+2*w),x=`<rect x="${g.toFixed(1)}" y="16" width="${v.toFixed(1)}" height="6" rx="${w}" fill="${p}" opacity="0.82"/>`,f=5,b=15,$=b-f*1.1,C=`<polygon points="${m.toFixed(1)},${b.toFixed(1)} ${(m-f).toFixed(1)},${$.toFixed(1)} ${(m+f).toFixed(1)},${$.toFixed(1)}" fill="${p}"/>`,L=`<line x1="${m.toFixed(1)}" y1="${b.toFixed(1)}" x2="${m.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,H=`<text x="${m.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${r}${i}${c}${x}${C}${L}${H}
  </svg>`}function he(t){var u;let s=t.metrics.imf_bz_nt,e=t.metrics.imf_bt_nt,o=t.metrics.solar_wind_kms,n=(u=t.metrics.pressure_npa)!=null?u:null,d=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",a=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",l=e!=null?e.toFixed(1)+" nT":"\u2014",r=o!=null?`${Math.round(o)} km/s`:"\u2014",i=n!=null?`${n.toFixed(2)} nPa`:"\u2014",c=mt(t),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${Q("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${pe(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${h(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${h(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${h(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${c.color};font-weight:600">${h(c.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function mt(t){var r,i;let s=t.metrics.imf_bz_nt,e=(r=t.metrics.kp_latest)!=null?r:0,o=(i=t.metrics.solar_wind_kms)!=null?i:0,n,d,a;if(s!=null&&s<-5||e>=6)n="storm",d="#e05c5c",a="Storm conditions";else if(s!=null&&s<0||e>=4||o>=400){let c=s!=null&&s<0;n="active",d="#e0a84a",a=c?"Active coupling":"Elevated"}else n="stable",d="#5cce8c",a="Stable";let l;return s==null?l="Unknown":s>2?l="Closed":s>0?l="Minimal":s>-5?l="Moderate":s>-10?l="Strong":l="Very strong",{state:n,color:d,label:a,coupling:l}}function Mt(t,s,e,o){let n=o?"mc":"mf",d=t.color,a=e!=null?e:0,l=a>500,r=a<350,i=l?.9:r?1.8:1.3;if(o){let w=45-(t.state==="storm"?11:t.state==="active"?16:21),g=t.state==="storm"?12:t.state==="active"?10:8,v=50-g,x=76,f=[`M ${w},25`,`C ${w-2},15 41,${g} 45,${g}`,`C 53,${g} ${x-8},${g+4} ${x},20`,`C ${x+1},23 ${x+1},27 ${x},30`,`C ${x-8},${v-4} 53,${v} 45,${v}`,`C 41,${v} ${w-2},35 ${w},25`,"Z"].join(" "),b=l?3:2,$=[14,25,36],C=y=>`<path d="M 0,${y} L ${l?8:6},${y} M ${l?6:4},${y-2} L ${l?8:6},${y} L ${l?6:4},${y+2}" stroke="${d}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,L=$.map(y=>C(y)).join(""),M=Array.from({length:b},(y,k)=>`<g class="hw-wg" style="animation-duration:${i}s;animation-delay:${(i/b*k).toFixed(2)}s">${L}</g>`).join(""),H=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${M}</g>
      <path d="${f}" fill="${d}14" stroke="${d}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${H}
    </svg>`}else{let x=t.state==="storm"?16:t.state==="active"?26:38,f=155-x,b=t.state==="storm"?22:t.state==="active"?30:40,$=120-b,C=240,L=[`M ${f},60`,`C ${f-4},42 150,${b} 155,${b}`,`C 173,${b} ${C-5},${b+18} ${C},60`,`C ${C-5},${$-18} 173,${$} 155,${$}`,`C 150,${$} ${f-4},78 ${f},60`,"Z"].join(" "),M=`M ${f+2},60 C ${f+2},${60-x*.4} 152,54 150,60 C 152,66 ${f+2},${60+x*.4} ${f+2},60 Z`,H=a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c",y=a>700?.4:a>500?.65:a>350?1.1:1.8,k=a>500?[10,24,40,57,74,90,106]:a>350?[14,34,57,82,104]:[20,50,82,108],T=16,_=22,O=f-6,E=Math.ceil((O-_)/T)+2,R=Array.from({length:E},(D,N)=>_-T+N*T),A=12,I=8,S=R.flatMap(D=>k.map(N=>`<path d="M ${D},${N} L ${D+A},${N} M ${D+I},${N-3} L ${D+A},${N} L ${D+I},${N+3}" stroke="${H}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),z=`<g class="hw-wg-full" style="animation-duration:${y}s">${S}</g>`,F=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',j=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="${_}" y="0" width="${O-_}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${n}-wclip)">${z}</g>
      <path d="${M}" fill="${d}08"/>
      <path d="${L}" fill="${d}12" stroke="${d}aa" stroke-width="1.2"/>
      <text x="${f+2}" y="${b-2}" font-size="7" fill="${d}" opacity=".8" font-family="sans-serif">${h(t.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${F}
      ${j}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function ue(t){let s=mt(t),e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=t.metrics.kp_latest,d=t.metrics.density,a=t.metrics.pressure_npa,l=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",r=o!=null?`${Math.round(o)} km/s`:"\u2014",i=d!=null?`${d.toFixed(1)} p/cm\xB3`:"\u2014",c=a!=null?`${a.toFixed(2)} nPa`:"\u2014",p=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",u=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",m=e!=null&&e<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":e!=null&&e<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${Q("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Mt(s,e,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${u}">${h(r)}</span>
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
  </div>`}function Ct(t,s,e){if(!t.length)return null;let o=(e%360+360)%360,n=-1,d=1/0,a=Math.cos(s*Math.PI/180);for(let l of t){let r=l.lat-s,i=(l.lon-o+180+360)%360-180,c=r*r+i*a*(i*a);c<d&&(d=c,n=l.prob)}return n>=0?n:null}function Lt(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function ge(t,s){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&t.lat!=null&&t.lon!=null&&(o=Ct(s.entries,t.lat,t.lon));let n=t.lat!=null&&t.lon!=null,d=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",a=o!=null?`${o}%`:s?"n/a":"\u2026",l=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?h(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${d}">Aurora: ${a}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${Q("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${U(e)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Lt(t)}
    </div>
    ${c}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function me(t,s,e,o){switch(s){case"solar_wind":return ce(t);case"xray":return de(t);case"imf_bz":return he(t);case"aurora":return ge(e,o);case"magnetosphere":return ue(t);default:return""}}function nt(t,s){if(t.length<2)return"\u2192";let e=t[t.length-1],o=Math.max(0,t.length-4),n=t[o];if(!isFinite(e)||!isFinite(n))return"\u2192";let d=e-n;return d>s?"\u2191":d<-s?"\u2193":"\u2192"}function we(t,s,e,o,n,d,a){var j,D,N,X,K,q,V;let{summary:l,scales:r,metrics:i,aurora_hint:c}=t,p=(j=bt[l.status])!=null?j:bt.quiet,u=n!=null?n.kp.toFixed(1):i.kp_latest!=null?i.kp_latest.toFixed(1):"\u2014",w=[n?n.gScale:r.g_scale,r.r_scale,r.s_scale].map(B=>{let G=ne(B),Y=G?`color:${p.accent};border-color:${p.accent}33`:"";return`<span class="hw-scale-chip${G?" hw-scale-active":""}" style="${Y}">${h(B)}</span>`}).join(""),g=n?n.auroraLabel:c.aurora_label,v=g==="good"?"#5cce8c":g==="possible"?"#d4cc5c":"#607880",x=g.charAt(0).toUpperCase()+g.slice(1),f="#b4c6cc",b=i.solar_wind_kms!=null?`${Math.round(i.solar_wind_kms)} km/s`:"\u2014",$=i.imf_bz_nt,C=$!=null?$<=-10?"#e05c5c":$<=-5?"#e0a84a":$>=5?"#5cce8c":"#a0b4b8":"#607880",L=$!=null?($>=0?"+":"")+$.toFixed(1)+" nT":"\u2014",M=i.xray_class,H=M?(D=gt[M])!=null?D:"#a0b4b8":"#607880",y=M?`${M}-class`:"\u2014",k=nt(((N=i.kp_history_1h)!=null?N:[]).map(B=>B.kp),.5),T=nt(((X=i.wind_history_1h)!=null?X:[]).map(B=>B.kms),20),_=nt(((K=i.bz_history_1h)!=null?K:[]).map(B=>B.bz),1.5),O=nt(((q=i.xray_history_1h)!=null?q:[]).map(B=>Math.log10(B.flux+1e-9)),.15),E=s?"\u25BC HISTORY":"\u25B6 HISTORY",R=mt(t),A=(V=i.kp_latest)!=null?V:0,I=A>=5,S=I?`linear-gradient(160deg, #0d2a1a 0%, ${p.bg}22 75%)`:`${p.bg}18`,z=(B,G,Y,wt,J)=>{let tt=J?`<span class="hw-trend">${J}</span>`:"";return`<div class="hw-kpi-item${o===B?" hw-kpi-active":""}" data-kpi="${B}">
      <span class="hw-qd-label">${G}</span>
      <span class="hw-qd-value" style="color:${wt}">${Y}${tt}</span>
    </div>`},F=I?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${A.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${S}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${n?"color:#9acf60":""}">Kp <b>${h(u)}</b>${n?"":`<span class="hw-trend">${k}</span>`}</div>
          <span class="hw-status-badge" style="background:${p.accent}22;color:${p.accent};display:block;text-align:center">${h(l.label)}</span>
          <div class="hw-scales-row">${w}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${h(l.text)}</div>
            <div class="hw-magnet-mini${o==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${Mt(R,$,i.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${R.color}">${h(R.label)}</div>
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
        ${z("aurora","Aurora",h(x),v)}
        ${z("solar_wind","Solar wind",h(b),f,T)}
        ${z("imf_bz","IMF Bz",h(L),C,_)}
        ${z("xray","X-ray",h(y),H,O)}
      </div>
      ${o?me(t,o,d,a):""}
      <div class="hw-section-row" data-hero-toggle style="margin-top:6px">
        <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">HISTORY</span>
      </div>`:""}
      ${F}
    </div>`}function xe(t){var c,p,u,m;let{metrics:s}=t,e=(c=s.kp_history_1h)!=null?c:[],o=(p=s.wind_history_1h)!=null?p:[],n=(u=s.bz_history_1h)!=null?u:[],d=(m=s.xray_history_1h)!=null?m:[],a=ie(e),l=_t(o.map(w=>{var g;return(g=w.kms)!=null?g:0}).filter(w=>w>0),o.map(w=>rt(w.t_utc)),"#5cce8c",28,!1),r=_t(n.map(w=>w.bz),n.map(w=>rt(w.t_utc)),"#d4cc5c",28,!0),i=le(d);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
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
    </div>`}function fe(t){return t.map((s,e)=>e===0?(s+t[1])/2:e===t.length-1?(t[e-1]+s)/2:(t[e-1]+s+t[e+1])/3)}function be(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function ve(t){return t>=5?"good":t>=3?"possible":"none"}function Ht(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function ye(t){let s=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",e=Ht(t),o=s==="none"?"No aurora expected at mid-latitudes":e!=null?`Aurora possible equatorward of ~${e}\xB0 lat`:"Minor aurora possible at high latitudes",n=t>=7?"moderate":t>=5?"low":"none",d=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",a=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:d},{kind:"solar_activity",level:a,label:"Solar Activity",summary:a==="none"?"Quiet geomagnetic conditions expected":a==="low"?"Active geomagnetic conditions possible":a==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function ke(t,s){var p;if(s<=0)return null;let e=(p=t.metrics.kp_forecast_3h)!=null?p:[];if(!e.length)return null;let o=Date.now()+s*36e5,n=e[0],d=1/0;for(let u of e){let m=Math.abs(new Date(u.t_utc).getTime()-o);m<d&&(d=m,n=u)}let a=n.kp,l=be(a),r=ve(a),i=Ht(a),c=ye(a);return{offsetH:s,kp:a,gScale:l,auroraLabel:r,auroraMinLat:i,impacts:c}}function _e(t,s,e,o){var I;let{forecast:n,metrics:d}=t,{kp_max_next_24h:a,kp_max_at_utc:l,trend:r}=n,i=((I=d.kp_forecast_3h)!=null?I:[]).slice(0,16),c=i.length,p=c*3,u=p>0?`${(s/p*100).toFixed(0)}%`:"0%",m=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",w="Kp forecast unavailable";if(a!=null){let S=vt(l),z=r==="rising"?"rising":r==="falling"?"falling":"steady";w=`Peak Kp ${a.toFixed(1)} next 24h${S?` at ${S}`:""} \xB7 ${z}`}let g=o?"\u25BC FORECAST":"\u25B6 FORECAST";if(!i.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${o?`<div class="hw-forecast-text">${h(w)}</div>`:""}
    </div>`;let v=320,x=38,f=14,b=x+f,$=v/c,C=S=>x-Math.max(2,Math.min(x-2,S/9*(x-2))),L="",M=i.map(S=>S.kp),H=fe(M);i.forEach((S,z)=>{let F=C(S.kp),j=x-F,D=z*$,N=D+$/2,X=S.kp>=6?"#e05c5c":S.kp>=5?"#e0a84a":S.kp>=4?"#d4cc5c":"#5cce8c",K=`Kp ${S.kp.toFixed(1)} \xB7 ${vt(S.t_utc)}`;if(L+=`<rect x="${D.toFixed(1)}" y="${F.toFixed(1)}" width="${($-1.5).toFixed(1)}" height="${j.toFixed(1)}" fill="${X}" fill-opacity="0.85" rx="1.5"/>`,L+=`<rect x="${D.toFixed(1)}" y="0" width="${$.toFixed(1)}" height="${x}" fill="transparent"><title>${U(K)}</title></rect>`,c<=8||z%2===0){let V=new Date(S.t_utc).getHours();L+=`<text x="${N.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${V.toString().padStart(2,"0")}</text>`}});let k=`<polyline points="${i.map((S,z)=>{let F=z*$+$/2,j=C(H[z]);return`${F.toFixed(1)},${j.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,T="";if(s>0&&c>0){let S=Math.min(v-1,s/(c*3)*v);T=`
      <line x1="${S.toFixed(1)}" y1="0" x2="${S.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${S.toFixed(1)},${x} ${(S-4).toFixed(1)},${(x-7).toFixed(1)} ${(S+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let _=Math.round(p/4),O=Math.round(p/2),E=Math.round(p*3/4),R=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${h(m)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${u}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${_}h</span>
        <span class="hw-scrub-tick">+${O}h</span>
        <span class="hw-scrub-tick">+${E}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,A=e?`
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
      ${A}
      <div class="hw-forecast-text">${h(w)}</div>
      <svg viewBox="0 0 ${v} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${L}
        ${k}
        ${T}
      </svg>
      ${R}`:""}
    </div>`}function Se(t){let s=/([NS])(\d+)([EW])(\d+)/i.exec(t);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Tt=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Me(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function Ce(t,s,e){let o=s/2,n=o*.87,d=s*.03,a=s*.009,l=t.map(r=>{var x,f;let i=Se(r.location);if(!i||Math.abs(i.lon)>88||r.location.includes("*"))return"";let c=Me(r);if(!e.has(c))return"";let p=Tt.find(b=>b.id===c).color,u=i.lat*Math.PI/180,m=i.lon*Math.PI/180,w=(o+n*Math.cos(u)*Math.sin(m)).toFixed(1),g=(o-n*Math.sin(u)).toFixed(1),v=`AR ${r.region} \xB7 ${r.location}
Class: ${(x=r.spot_class)!=null?x:"\u2014"} / ${(f=r.mag_class)!=null?f:"\u2014"}
C: ${r.c_flare_probability}%  M: ${r.m_flare_probability}%  X: ${r.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${h(v)}</title>
      <circle cx="${w}" cy="${g}" r="${(d+a+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(a*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${w}" cy="${g}" r="${d.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${a.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Le={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},He='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Te="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ze=240;function Fe(t,s){var i,c,p;let e=parseInt(((i=t.scales.r_scale)!=null?i:"R0").slice(1),10),o=(c=t.metrics.xray_class)!=null?c:"A",n=t.metrics.xray_flux_wm2,d=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",l=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(u=>{let m=u.r===e,w=u.r<=e,g=w?u.color:"#1e2c30",v=m?"1":w?"0.5":"1",x=m?u.color:w?u.color+"99":"#566068",f=m?u.color:w?u.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${x}">R${u.r}</span>
      <div class="hw-radio-bbar" style="background:${g};opacity:${v}"></div>
      <span class="hw-radio-bdesc" style="color:${f}">${u.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${l}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=gt[o])!=null?p:"#a0b4b8"}">${h(o)}-class</b> \xB7 ${h(d)}</div>
  </div>`}var zt={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function Ft(t){var l;let s=(l=t.metrics.kp_forecast_3h)!=null?l:[],e=Date.now(),o=e+24*60*60*1e3,n=s.filter(r=>{let i=new Date(r.t_utc).getTime();return i>=e-3*60*60*1e3&&i<=o});if(n.length===0)return{g1:0,g2:0,g3:0};let d=Math.max(...n.map(r=>r.kp)),a=r=>{if(d<r-.7)return 0;if(d>r+1)return 90;let i=(d-(r-.7))/1.7;return Math.round(Math.pow(Math.max(0,i),.7)*90)};return{g1:a(5),g2:a(6),g3:a(7)}}function Ae(t,s){let e=Ft(t),o=(()=>{var u;let r=(u=t.metrics.kp_forecast_3h)!=null?u:[],i=Date.now(),c=i+24*60*60*1e3,p=r.filter(m=>new Date(m.t_utc).getTime()<=c);return p.length?Math.max(...p.map(m=>m.kp)):null})(),d=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:r,label:i})=>{let c=e[r],p=zt[r];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${p};${c===0?" opacity:.35":""}">${i}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${c}%;background:${p}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${c>0?p:"#607880"}">${c}%</span>
    </div>`}).join(""),a=o!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${o.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${d}</div>
    ${a?`<div class="hw-gstorm-footer">${a} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var at={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},At={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function Ee(t){var y;let s=at,e=(y=At[s.phase])!=null?y:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,d=52,a=10,l=d-6,r=d-18,i=.5,c=.19,p=k=>Math.exp(-Math.pow((k-i)/c,2)/2),u=k=>a+k*(n-2*a),m=k=>l-p(k)*r,w=80,g=[];for(let k=0;k<=w;k++){let T=k/w;g.push(`${k===0?"M":"L"}${u(T).toFixed(1)},${m(T).toFixed(1)}`)}let v=Math.round(s.progress_0_1*w),x=[];for(let k=0;k<=v;k++){let T=k/w;x.push(`${k===0?"M":"L"}${u(T).toFixed(1)},${m(T).toFixed(1)}`)}let f=u(s.progress_0_1),b=[`M${a},${l}`,...x.slice(1),`L${f.toFixed(1)},${l} Z`],$=m(s.progress_0_1),C=5,L=`M${f.toFixed(1)},${$.toFixed(1)} L${(f-C).toFixed(1)},${($-C*1.8).toFixed(1)} L${(f+C).toFixed(1)},${($-C*1.8).toFixed(1)} Z`,M=l+11;return`<div class="hw-impact-tip${t?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${h(s.cycle_name)}</div>
    <svg width="100%" height="${d+14}" viewBox="0 0 ${n} ${d+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${e}" opacity="0.12"/>
      <path d="${g.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${x.join(" ")}" fill="none" stroke="${e}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${a}" y1="${l}" x2="${n-a}" y2="${l}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${L}" fill="${e}"/>
      <text x="${a+2}" y="${M}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${u(.5).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-a-2).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${e}">${h(o)}</b>${s.subtitle?` \xB7 ${h(s.subtitle)}`:""}</div>
  </div>`}function Et(t){var r,i,c,p,u;let s=(i=(r=t.coronal_hole)==null?void 0:r.estimated_speed_kms)!=null?i:t.metrics.solar_wind_kms,e=(c=t.coronal_hole)==null?void 0:c.status,o=s!=null?s:0,n=e!=null?e:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",d={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},a={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},l={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:d[n],label:a[n],desc:(u=(p=t.coronal_hole)==null?void 0:p.note)!=null?u:l[n],speed:s}}function Oe(t,s){var S;let e=Et(t),o=(S=e.speed)!=null?S:0,n=e.speed!=null?`${Math.round(e.speed)} km/s`:"\u2014",d=s?" hw-impact-tip-open":"",a=160,l=72,r=18,i=36,c=142,p=36,u=11,m=14,w=19,g=9,v=o>=500,x=o>=420,f=v?"#f5c540":x?"#c8a020":"#7a6010",b=v?"#f5c540":x?"#c8a020":"#3a3808",$=e.color,C=x?"0.9":"0.25",L=v?"0.18":x?"0.10":"0.04",M=[0,45,90,135,180,225,270,315].map(z=>{let F=z*Math.PI/180,j=(r+m*Math.cos(F)).toFixed(1),D=(i+m*Math.sin(F)).toFixed(1),N=(r+w*Math.cos(F)).toFixed(1),X=(i+w*Math.sin(F)).toFixed(1),K=z>300||z<60?"0.9":"0.5";return`<line x1="${j}" y1="${D}" x2="${N}" y2="${X}"
      stroke="${f}" stroke-width="1.6" stroke-linecap="round" opacity="${K}"/>`}).join(""),H=r+u+2,y=c-g-3,k=14,T=`${H},${i} ${y},${p-k} ${y},${p+k}`,_=y+1,O=`${_},${p-4} ${_+7},${p} ${_},${p+4}`,E=g,R=`
    <ellipse cx="${c}" cy="${p}" rx="${E}" ry="${(E*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${c}" y1="${p-E}" x2="${c}" y2="${p+E}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${c-E}" y1="${p}" x2="${c+E}" y2="${p}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.35"/>`,A=`<svg class="hw-hss-diagram" viewBox="0 0 ${a} ${l}"
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <!-- stream fan -->
    <polygon points="${T}" fill="${$}" opacity="${L}"/>
    <!-- dashed stream axis -->
    <line x1="${H}" y1="${i}" x2="${y-2}" y2="${p}"
          stroke="${$}" stroke-width="2" stroke-dasharray="5 3.5"
          stroke-linecap="round" opacity="${C}"/>
    <!-- arrow -->
    <polygon points="${O}" fill="${$}" opacity="${x?"0.9":"0.25"}"/>
    <!-- Sun glow ring -->
    <circle cx="${r}" cy="${i}" r="${u+6}" fill="none"
            stroke="${b}" stroke-width="1.5" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${r}" cy="${i}" r="${u}" fill="${f}" opacity="0.92"/>
    ${M}
    <!-- Earth body -->
    <circle cx="${c}" cy="${p}" r="${E}" fill="#1a4a6e" opacity="0.92"/>
    ${R}
    <!-- labels -->
    <text x="${r}" y="${l-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${c}" y="${l-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
  </svg>`,I=x?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${d}">
    ${A}
    <div class="hw-hss-meta">Solar wind: <b style="color:${e.color}">${h(n)}</b> \xB7 ${h(e.desc)}</div>
    ${I}
  </div>`}function Ot(t){var n,d;let s=(n=t.scales.g_scale)!=null?n:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let a=(d=t.metrics.kp_forecast_3h)!=null?d:[],l=Date.now(),r=a.filter(i=>new Date(i.t_utc).getTime()<=l+3*60*60*1e3).sort((i,c)=>new Date(c.t_utc).getTime()-new Date(i.t_utc).getTime());r.length>0&&(o=r[0].kp)}return e>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:e>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function Re(t,s){let e=Ot(t),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(r=>{let i=r.l===e.level,c=i?r.color:"#566068",p=i?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${c}">${r.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${r.width}%;background:${r.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${i?r.color:"transparent"}">${i?"\u25C0":""}</span>
    </div>`}).join(""),a=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",l={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${d}</div>
    <div class="hw-satdrag-meta">${a} \xB7 ${h(e.gScale)} \xB7 ${l[e.level]}</div>
  </div>`}function Rt(t){var i,c,p;let s=(i=t.scales.g_scale)!=null?i:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let u=(c=t.metrics.kp_forecast_3h)!=null?c:[],m=Date.now(),w=u.filter(g=>new Date(g.t_utc).getTime()<=m+3*60*60*1e3).sort((g,v)=>new Date(v.t_utc).getTime()-new Date(g.t_utc).getTime());w.length>0&&(o=w[0].kp)}let n=0;e>=2||o!=null&&o>=6?n=2:(e>=1||o!=null&&o>=4)&&(n=1);let d=parseInt(((p=t.scales.r_scale)!=null?p:"R0").slice(1),10),a=d>=2&&n<2;d>=2&&(n=Math.min(2,n+1));let l={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},r={0:"Low",1:"Moderate",2:"High"};return{level:n,color:l[n],label:r[n],kp:o,gScale:s,boostedByFlare:a}}function Ie(t,s){var i;let e=Rt(t),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(c=>{let p=c.l===e.level,u=p?c.color:"#566068",m=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${u}">${c.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${c.width}%;background:${c.color};opacity:${m}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?c.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),a=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",l={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},r=e.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((i=t.scales.r_scale)!=null?i:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${d}</div>
    <div class="hw-gnss-meta">${a} \xB7 ${h(e.gScale)} \xB7 ${l[e.level]}</div>
    ${r}
  </div>`}function It(t){var n;let s=t.metrics.pressure_npa,e=s!=null?s:null,o=(n=t.metrics.density)!=null?n:null;return e==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:e>=6?{pressure:e,color:"#e05c5c",label:"Extreme",density:o}:e>=4?{pressure:e,color:"#e0a84a",label:"Strong",density:o}:e>=2?{pressure:e,color:"#d4cc5c",label:"Elevated",density:o}:e>=1?{pressure:e,color:"#5cce8c",label:"Typical",density:o}:{pressure:e,color:"#7a9298",label:"Weak",density:o}}function De(t,s){let e=It(t),o=s?" hw-impact-tip-open":"",n=e.pressure,d=200,a=6,l=10,r=a+l,i=r+4,c=i+11,p=r+9,u=c+4,w=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(y=>`<rect x="${y.x}" y="${a}" width="${y.w}" height="${l}" fill="${y.color}" opacity="0.55" rx="0"/>`).join(""),g=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],v=g.map(y=>`<line x1="${y.x}" y1="${r}" x2="${y.x}" y2="${i}" stroke="#3a5058" stroke-width="1"/>`).join(""),x=g.map(y=>`<text x="${y.x}" y="${c}" class="hw-swdp-axlabel" text-anchor="${y.anchor}">${y.label}</text>`).join(""),f="";if(n!=null){let k=Math.min(Math.max(n,0),8)/8*d;f=`<polygon points="${`${k-5},${p} ${k+5},${p} ${k},${r}`}" fill="${e.color}" opacity="0.95"/>
    <line x1="${k}" y1="${a}" x2="${k}" y2="${r}" stroke="${e.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${a}" width="${d}" height="${l}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,$=`<svg class="hw-swdp-gauge" viewBox="0 0 ${d} ${u}" preserveAspectRatio="none" aria-hidden="true">
    ${w}${b}${f}${v}${x}
  </svg>`,C=n!=null?`${n.toFixed(2)} nPa`:"\u2014",L=e.density!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",M=t.metrics.solar_wind_kms!=null?`${Math.round(t.metrics.solar_wind_kms)} km/s`:"\u2014",H=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${$}
    <div class="hw-swdp-meta"><b style="color:${e.color}">${h(C)}</b>${h(H)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${h(M)} \xB7 Density ${h(L)}</div>
  </div>`}function Dt(t){var i,c;let s=(i=t.alerts_all)!=null?i:[],e=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=e!=null?e:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let d=((c=n.raw_body)!=null?c:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),a=d?parseInt(d[1],10):null,l=null;if(a&&n.t_utc){let p=1496e5/a*1e3;l=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let r=e?"impact":"watch";return{status:r,color:r==="impact"?"#e05c5c":"#d4cc5c",label:r==="impact"?"Active":"Watch",speed_kms:a,issued_utc:n.t_utc,arrival_utc:l}}function Ne(t,s){let e=Dt(t),o=s?" hw-impact-tip-open":"",n=160,d=120,a=80,l=16,r=94,i=r-l,c=_=>Math.tan(_*Math.PI/180),p=Math.round(c(36)*i),u=Math.round(c(23)*i),m=Math.round(c(12)*i),w=_=>`${a},${l} ${a+_},${r} ${a-_},${r}`,g=e.status==="impact"?a:e.status==="watch"?a+u+10:a+p+20,v=Math.min(n-8,Math.max(8,g)),x=v>=a-m&&v<=a+m,f=v>=a-u&&v<=a+u,b=v>=a-p&&v<=a+p,$=x?"#e05c5c":f?"#d4cc5c":b?"#e0a84a":"#5cce8c",C=e.status!=="quiet"?`<polygon points="${w(p)}" fill="#253238" opacity="0.85"/>
       <polygon points="${w(u)}"   fill="#d4cc5c" opacity="0.14"/>
       <polygon points="${w(m)}" fill="#e0a84a" opacity="0.28"/>
       <line x1="${a}" y1="${l+9}" x2="${a}" y2="${r-7}"
             stroke="#3a5058" stroke-dasharray="3 3" stroke-width="1"/>`:`<line x1="${a+8}" y1="${l}" x2="${v-7}" y2="${r}"
             stroke="#1e2c30" stroke-dasharray="4 3" stroke-width="1"/>`,L="\u2014";if(e.arrival_utc){let _=new Date(e.arrival_utc),O=_.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),E=_.getUTCDate(),R=String(_.getUTCHours()).padStart(2,"0"),A=String(_.getUTCMinutes()).padStart(2,"0");L=`~${O}\xA0${E}\xA0${R}:${A}\u202FUTC`}let M=e.speed_kms?`${e.speed_kms}\u202Fkm/s`:"\u2014",H=e.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${h(M)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${h(L)}</b>`:"No Earth-directed CME in forecast window",y=x?"Direct impact likely":f?"Glancing blow possible":b?"Near outer edge":"Impact unlikely",k=x?"#e05c5c":f?"#d4cc5c":b?"#e0a84a":"#5cce8c",T=`<svg class="hw-cme-svg" viewBox="0 0 ${n} ${d}"
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${C}
    <!-- Sun -->
    <circle cx="${a}" cy="${l}" r="6" fill="#f5c540" opacity="0.92"/>
    <circle cx="${a}" cy="${l}" r="9" fill="none" stroke="#f5c540" stroke-width="1.2" opacity="0.3"/>
    <!-- Earth -->
    <circle cx="${v}" cy="${r}" r="5.5" fill="${$}" opacity="0.85"/>
    <circle cx="${v}" cy="${r}" r="8" fill="none" stroke="${$}" stroke-width="5" opacity="0.12"/>
    <!-- Sun label -->
    <text x="${a}" y="${l-11}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <!-- Earth label -->
    <text x="${v}" y="${r+16}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
    <!-- Zone label (when CME active) -->
    ${e.status!=="quiet"?`<text x="${a}" y="${d-4}" font-size="8" fill="${k}"
               text-anchor="middle" font-family="inherit">${h(y)}</text>`:""}
  </svg>`;return`<div class="hw-impact-tip${o}">
    ${T}
    <div class="hw-cme-footer">${H}</div>
  </div>`}function Pe(t,s,e,o,n,d,a,l,r){var tt,it,xt;let i=(it=(tt=s==null?void 0:s.impacts)!=null?tt:t.observer_impacts)!=null?it:[],c=i.map(P=>{var $t,ft;let lt=($t=Qt[P.level])!=null?$t:"#666",Pt=P.level==="none"?"None":P.level.charAt(0).toUpperCase()+P.level.slice(1),Bt=(ft=Le[P.kind])!=null?ft:He,jt=P.level==="none"?"#606870":lt,et=P.kind==="solar_activity"?n:a.has(P.kind),Wt=et?" hw-impact-open":"",Z;if(P.kind==="solar_activity"){let st=n?" hw-solar-open":"",ct=Tt.map(W=>{let ot=d.has(W.id),dt=ot?W.color+"22":"transparent",pt=ot?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${W.id}" style="color:${W.color};border-color:${W.color};background:${dt};opacity:${pt}">${W.label}</button>`}).join("");Z=`<div class="hw-solar-tip${st}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Te}" alt="Solar disk" loading="lazy" />
            ${e?Ce(e,ze,d):""}
          </div>
          <div class="hw-solar-layers">${ct}</div>
          <span class="hw-solar-tip-text">${h(P.summary)}</span>
        </div>`}else if(P.kind==="aurora"){let st=et?" hw-aurora-tip-open":"",ct=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,W=null;l&&r.lat!=null&&r.lon!=null&&(W=Ct(l.entries,r.lat,r.lon));let ot=r.lat!=null&&r.lon!=null,dt=W!=null?W>=30?"#5cce8c":W>=10?"#d4cc5c":"#9ab4bc":"#607880",pt=W!=null?`${W}%`:l?"n/a":"\u2026",Kt=ot?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${r.locationName?h(r.locationName)+" \xB7 ":""}${r.lat.toFixed(1)}\xB0${r.lat>=0?"N":"S"} ${Math.abs(r.lon).toFixed(1)}\xB0${r.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${dt}">Aurora: ${pt}</span>
        </div>`:"";Z=`<div class="hw-aurora-tip${st}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${U(ct)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Lt(r)}
          </div>
          ${Kt}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else P.kind==="radio"?Z=Fe(t,et):Z=`<div class="hw-impact-tip${et?" hw-impact-tip-open":""}">${h(P.summary)}</div>`;let Xt=P.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${U(P.kind)}"`;return`<div class="hw-impact-row${Wt}"${Xt}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${jt}">${Bt}<span style="color:#b4c6cc">${h(P.label)}</span></span>
      <span class="hw-impact-badge" style="background:${lt}22;color:${lt}">${h(Pt)}</span>
      ${Z}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",u=i.length+7,m=o?"\u25BC":"\u25B6",w=u>0?`Observer Impacts (${u})`:"Observer Impacts",g=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}${p}</span>
    </div>`,v=a.has("geomag_storm"),x=Ft(t),f=x.g1,b=x.g1>=30?zt.g1:x.g1>0?"#7a9298":"#607880",$=f>0?`G1 ${f}%`:"None",L=`<div class="hw-impact-row${v?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${b}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${b}22;color:${b}">${$}</span>
      ${Ae(t,v)}
    </div>`,M=a.has("solar_cycle"),H=(xt=At[at.phase])!=null?xt:"#96a8b8",y=at.phase.charAt(0).toUpperCase()+at.phase.slice(1),T=`<div class="hw-impact-row${M?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${H}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${H}22;color:${H}">${y}</span>
      ${Ee(M)}
    </div>`,_=Et(t),O=a.has("hss"),R=`<div class="hw-impact-row${O?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${_.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${_.color}22;color:${_.color}">${_.label}</span>
      ${Oe(t,O)}
    </div>`,A=Ot(t),I=a.has("sat_drag"),z=`<div class="hw-impact-row${I?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${A.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${A.color}22;color:${A.color}">${A.label}</span>
      ${Re(t,I)}
    </div>`,F=Rt(t),j=a.has("gnss"),N=`<div class="hw-impact-row${j?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${F.color}22;color:${F.color}">${F.label}</span>
      ${Ie(t,j)}
    </div>`,X=It(t),K=a.has("sw_pressure"),q=X.pressure!=null?`${X.pressure.toFixed(2)} nPa`:"\u2014",B=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${X.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${X.color}22;color:${X.color}">${q}</span>
      ${De(t,K)}
    </div>`,G=Dt(t),Y=a.has("cme_cone"),J=`<div class="hw-impact-row${Y?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${G.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${G.color}22;color:${G.color}">${h(G.label)}</span>
      ${Ne(t,Y)}
    </div>`;return`
    <div class="hw-impacts">
      ${g}
      ${o?c+L+T+R+z+N+B+J:""}
    </div>`}var St={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Be(t,s){var r,i;let e=(r=Jt[t.level])!=null?r:"#666",o=t.level.charAt(0).toUpperCase()+t.level.slice(1),n=(i=St[t.kind])!=null?i:St.unknown,d=[oe(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),a=s&&t.raw_body?`<div class="hw-alert-body">${h(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${e}" data-alert-key="${U(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${e}">${n}</span>
      <span class="hw-alert-level" style="color:${e}">${h(o)}</span>
      <span class="hw-alert-title">${h(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${h(t.summary_short)}</div>
    <div class="hw-alert-meta">${h(d)}</div>
    ${a}
  </div>`}var je={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},We="#4ae0a4";function Xe(t){let s=(e,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${e}</svg>`;switch(t){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function Ke(t){var o;let s=(o=t.metadata)!=null?o:{},e=[];return s.source_code&&e.push(`Code: ${s.source_code}`),s.model&&e.push(`Model: ${String(s.model).toUpperCase()}`),e.length===0?"":`
${e.join(" \xB7 ")}`}function Ge(t,s,e){var r;let o=t.is_active?We:(r=je[t.level])!=null?r:"#445c64",n=t.event_time===e,d=t.event_time.slice(11,16)+" UTC",a=t.source==="NASA_DONKI"?"DONKI":"SWPC",l=n?`<div class="hw-tl-detail">${h(t.description)}${h(Ke(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${U(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${d}</span>
          <span class="hw-tl-src">${a}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${Xe(t.event_type)} ${h(t.event_title)}
        </div>
        ${c}
      </div>
    </div>`}function Ue(t,s,e,o){var x,f;let n=(x=t.timeline)!=null?x:[],d=Date.now(),a=new Date(d).toISOString().slice(0,10),l=new Date(d-864e5).toISOString().slice(0,10),r=new Date(d-1728e5).toISOString().slice(0,10),i=new Set([a,l,r]),c=n.filter(b=>{var $;return i.has((($=b.event_time)!=null?$:"").slice(0,10))}).slice().reverse(),p=c.length,u=e?"\u25BC":"\u25B6",m=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",w=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${u}</span>
      <span class="hw-section-label" style="margin-bottom:0">${m}</span>
    </div>`;if(!e||p===0)return`<div class="hw-timeline">${w}</div>`;let g=new Map;for(let b of c){let $=((f=b.event_time)!=null?f:"").slice(0,10);g.has($)||g.set($,[]),g.get($).push(b)}let v=[...g.entries()].map(([b,$])=>{let L=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=o.has(b),H=M?"\u25B6":"\u25BC",y=M?`<span class="hw-tl-day-count">${$.length} events</span>`:"",k=`
      <div class="hw-tl-day-row" data-tl-day="${U(b)}">
        <span class="hw-section-caret">${H}</span>
        <span class="hw-tl-date">${L}</span>
        ${y}
      </div>`,T=M?"":$.map((_,O)=>Ge(_,O<$.length-1,s)).join("");return`<div class="hw-tl-group">${k}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${w}
      ${v}
    </div>`}function Ye(t,s,e){var i;let o=(i=t.alerts_all)!=null?i:[],n=o.length,d=s?"\u25BC":"\u25B6",a=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${d}</span>
        <span class="hw-alerts-label">${a}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${l}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let r=o.map(c=>Be(c,c.dedupe_key===e)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${r}
    </div>`}function qe(t,s){var E,R,A;let e=t.cme_tracker;if(!e)return"";let o=(E=te[e.impact_level])!=null?E:"#96a8b8",n=(R=ee[e.status])!=null?R:e.status,d=300,a=44,l=18,r=a/2,i=10,c=d-18,p=7,u=`<line x1="${l+i}" y1="${r}" x2="${c-p}" y2="${r}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,m=`<circle cx="${l}" cy="${r}" r="${i}" fill="#f0c040" opacity="0.92"/>`,w=`
    <circle cx="${c}" cy="${r}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${c}" cy="${r}" r="2.5" fill="#fff" opacity="0.7"/>`,g=`<text x="${l}" y="${r+i+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,v=`<text x="${c}" y="${r+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,x="";if(e.progress!=null){let I=l+i+4,S=c-p-4,z=I+e.progress*(S-I),F=5;e.status==="arrival_window"?x=`
        <g transform="translate(${z.toFixed(1)},${r})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${F}" fill="${o}" opacity="0.92"/>
        </g>`:x=`<circle cx="${z.toFixed(1)}" cy="${r}" r="${F}" fill="${o}" opacity="0.85"/>`}let f=`<svg class="hw-cme-svg" viewBox="0 0 ${d} ${a}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${u}
    ${m}${g}
    ${w}${v}
    ${x}
  </svg>`,b=yt(e.arrival_time_utc),$=yt(e.launch_time_utc),C=e.speed_kms!=null?`${Math.round(e.speed_kms)} km/s`:"\u2014",L=e.half_angle_deg!=null?`${e.half_angle_deg}\xB0`:"\u2014",M=(A=e.source_location)!=null?A:"\u2014",H=e.is_earth_direct?"Direct hit":"Glancing blow",y=e.progress!=null?`${Math.round(e.progress*100)}%`:"\u2014",k=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${h(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${h(C)}</span>
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
          <span class="hw-cme-stat-value">${h(x)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${h(k)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${h(L)} \xB7 Source: ${h(M)} \xB7 ${h(H)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,T=s?"\u25BC":"\u25B6",_=e.impact_level==="unknown"?"Unrated":e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1),O=s?`${f}${k}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${A}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${h(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${h(_)} impact</span>
      </div>
      ${O}
    </div>`}function Ve(t,s,e,o,n,d,a,l,r,i,c,p,u,m,w,g,v,x,f,b){let $=ke(t,n);return`
    <div class="hw-root">
      ${$e(t)}
      ${we(t,e,m,o,$,f,b)}
      ${e?xe(t):""}
      ${_e(t,n,$,u)}
      ${qe(t,p)}
      ${Pe(t,$,w,c,g,v,x,b,f)}
      ${Ue(t,l,r,i)}
      ${Ye(t,d,a)}
    </div>`}function Ze(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${h(t)}</div>
    </div>
  </div>`}function Qe(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var ut=class{constructor(s,e){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=e,this.el.innerHTML=Qe(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var i,c,p,u,m,w;let e=s.target;if(e.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(e.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(e.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.render();return}if(e.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.render();return}if(e.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let o=e.closest("[data-impact-row]");if(o){let g=(i=o.dataset.impactRow)!=null?i:"";this.expandedImpacts.has(g)?this.expandedImpacts.delete(g):this.expandedImpacts.add(g),this.render();return}let n=e.closest("[data-solar-layer]");if(n){let g=(c=n.dataset.solarLayer)!=null?c:"";this.solarLayers.has(g)?this.solarLayers.delete(g):this.solarLayers.add(g),this.render();return}if(e.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(e.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let d=e.closest("[data-alert-key]");if(d){let g=(p=d.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===g?null:g,this.render();return}if(e.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let g=Date.now();this.collapsedDays=new Set([new Date(g).toISOString().slice(0,10),new Date(g-864e5).toISOString().slice(0,10),new Date(g-1728e5).toISOString().slice(0,10)])}this.render();return}let a=e.closest("[data-tl-day]");if(a){let g=(u=a.dataset.tlDay)!=null?u:"";this.collapsedDays.has(g)?this.collapsedDays.delete(g):this.collapsedDays.add(g),this.render();return}let l=e.closest("[data-timeline-key]");if(l){let g=(m=l.dataset.timelineKey)!=null?m:null;this.expandedTimelineKey=this.expandedTimelineKey===g?null:g,this.render();return}if(e.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let r=e.closest("[data-kpi]");if(r){let g=(w=r.dataset.kpi)!=null?w:null;this.activePopover=this.activePopover===g?null:g,this.render();return}if(e.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}e.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(s){let e=s.target;if(!e.matches("[data-scrub]"))return;let o=parseFloat(e.value);this.scrubOffset=o,e.style.setProperty("--pct",`${(o/parseFloat(e.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let e=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);this.data=await e.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(e){let o=e instanceof Error?e.message:String(e);this.el.innerHTML=Ze(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let e=await s.json(),o=new Map;for(let n of e){let d=o.get(n.region),a=n.area!=null,l=(d==null?void 0:d.area)!=null;(!d||!l&&a||l===a&&n.observed_date>d.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,e,o,n,d,a;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let r=await l.json(),c=((o=(e=(s=r.coordinates)!=null?s:r.Data)!=null?e:r.data)!=null?o:[]).map(([p,u,m])=>({lon:p,lat:u,prob:m}));this.ovationData={entries:c,forecastTime:String((a=(d=(n=r["Forecast Time"])!=null?n:r.forecast_time)!=null?d:r["Observation Time"])!=null?a:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=Ve(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},Nt={mount(t,s){return re(),new ut(t,s)}};typeof window!="undefined"&&(window.HelioWidget=Nt);return Zt(Je);})();
