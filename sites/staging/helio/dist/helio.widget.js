"use strict";var HelioWidgetModule=(()=>{var ht=Object.defineProperty;var Ut=Object.getOwnPropertyDescriptor;var Xt=Object.getOwnPropertyNames;var Yt=Object.prototype.hasOwnProperty;var qt=(t,s)=>{for(var e in s)ht(t,e,{get:s[e],enumerable:!0})},Vt=(t,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of Xt(s))!Yt.call(t,n)&&n!==e&&ht(t,n,{get:()=>s[n],enumerable:!(o=Ut(s,n))||o.enumerable});return t};var Zt=t=>Vt(ht({},"__esModule",{value:!0}),t);var ns={};qt(ns,{HelioWidget:()=>Dt});var bt={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Qt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},Jt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},mt={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},te={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},ee={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function se(t){if(!t)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(t).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let e=Math.floor(s/60);return e<24?`Updated ${e}h ago`:`Updated ${Math.floor(e/24)}d ago`}catch(s){return"Updated recently"}}function oe(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function vt(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t}}function it(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t.slice(11,16)}}function yt(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function X(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ne(t){return parseInt(t.slice(1),10)>0}var ae=`
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
/* Solar Disk Mini Loop */
.hw-solar-mini-wrap{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border-radius:4px;border:1px solid #1e2c30;padding:1px;transition:background .12s}
.hw-solar-mini-wrap:hover,.hw-solar-mini-wrap.hw-kpi-active{background:#ffffff0d;border-color:#2a3c42}
.hw-solar-mini-inner{position:relative;width:86px;height:86px;border-radius:50%;overflow:hidden;border:1px solid #2a3c42;background:#0a0a0a;flex-shrink:0}
.hw-solar-mini-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;object-position:center}
.hw-solar-mini-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s;background:transparent}
.hw-solar-mini-label{font-size:.60em;letter-spacing:.03em;font-weight:600;margin-top:2px}
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
`,kt=!1;function ie(){if(kt)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=ae,document.head.appendChild(t),kt=!0}function re(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.length,n=s/o,c=t.map((i,r)=>{let a=Math.max(2,Math.min(e,i.kp/9*e)),l=e-a,p=r*n,d=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${p.toFixed(1)}" y="${l.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${d}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${u(it(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">${c}</svg>`}function _t(t,s,e,o,n){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let c=200,i=Math.min(...t),r=Math.max(...t),a=r-i||1,l=w=>o-2-(w-i)/a*(o-4),p=t.map((w,g)=>`${(g/(t.length-1)*c).toFixed(1)},${l(w).toFixed(1)}`).join(" "),d="";if(n&&i<0&&r>0){let w=l(0);d=`<line x1="0" y1="${w.toFixed(1)}" x2="${c}" y2="${w.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let h=t.map((w,g)=>`<rect x="${(g/(t.length-1)*c-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${u(s[g]||"")} \xB7 ${w.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${c} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${d}
    <polyline points="${p}" fill="none" stroke="${e}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${h}
  </svg>`}function le(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.map(p=>Math.max(-9,Math.min(-3,Math.log10(p.flux)))),n=Math.min(...o),i=Math.max(...o)-n||1,r=p=>e-2-(p-n)/i*(e-4),a=o.map((p,d)=>`${(d/(o.length-1)*s).toFixed(1)},${r(p).toFixed(1)}`).join(" "),l=t.map((p,d)=>{let h=d/(o.length-1)*s,w=p.flux>=1e-4?"X":p.flux>=1e-5?"M":p.flux>=1e-6?"C":p.flux>=1e-7?"B":"A";return`<rect x="${(h-4).toFixed(1)}" y="0" width="8" height="${e}" fill="transparent"><title>${u(it(p.t_utc))} \xB7 ${w}-class (${p.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function Q(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ce(t){var l;let s=(l=t.metrics.wind_history_1h)!=null?l:[],e=s[s.length-1],o=t.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",c=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",i=(e==null?void 0:e.density)!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",r=(e==null?void 0:e.temp_kk)!=null?`${e.temp_kk.toFixed(0)} kK`:"\u2014",a=(e==null?void 0:e.pressure_npa)!=null?`${e.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${Q("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${u(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${u(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function de(t){var r,a;let s=(r=t.metrics.xray_class)!=null?r:"A",e=t.metrics.xray_flux_wm2,o=e!=null?e.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],c=n.map(l=>{let p=l.label===s,d=p?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${p?"cc":"44"}">${d}</div>`}).join(""),i=n.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===s?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${Q("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${c}</div>
      <div class="hw-xray-scale-labels">${i}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=mt[s])!=null?a:"#a0b4b8"}">${u(s)}-class</b> \xB7 ${u(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function pe(t){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(v=>{let y=100+v/20*100;return`<line x1="${y.toFixed(1)}" y1="16" x2="${y.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),p='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${l}${p}</svg>`;let d=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",h=Math.max(-20,Math.min(20,t)),w=100+h/20*100,g=3,m=h<0?w-g:100-g,k=Math.max(2*g,Math.abs(w-100)+2*g),x=`<rect x="${m.toFixed(1)}" y="16" width="${k.toFixed(1)}" height="6" rx="${g}" fill="${d}" opacity="0.82"/>`,$=5,b=15,f=b-$*1.1,L=`<polygon points="${w.toFixed(1)},${b.toFixed(1)} ${(w-$).toFixed(1)},${f.toFixed(1)} ${(w+$).toFixed(1)},${f.toFixed(1)}" fill="${d}"/>`,H=`<line x1="${w.toFixed(1)}" y1="${b.toFixed(1)}" x2="${w.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${d}" stroke-width="1" opacity="0.6"/>`,z=`<text x="${w.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${d}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${l}${p}${x}${L}${H}${z}
  </svg>`}function he(t){var h;let s=t.metrics.imf_bz_nt,e=t.metrics.imf_bt_nt,o=t.metrics.solar_wind_kms,n=(h=t.metrics.pressure_npa)!=null?h:null,c=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",i=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",r=e!=null?e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=n!=null?`${n.toFixed(2)} nPa`:"\u2014",p=gt(t),d=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${Q("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${pe(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${u(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${u(l)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${d.color};font-weight:600;margin-bottom:4px">${u(d.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${p.color};font-weight:600">${u(p.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function gt(t){var a,l;let s=t.metrics.imf_bz_nt,e=(a=t.metrics.kp_latest)!=null?a:0,o=(l=t.metrics.solar_wind_kms)!=null?l:0,n,c,i;if(s!=null&&s<-5||e>=6)n="storm",c="#e05c5c",i="Storm conditions";else if(s!=null&&s<0||e>=4||o>=400){let p=s!=null&&s<0;n="active",c="#e0a84a",i=p?"Active coupling":"Elevated"}else n="stable",c="#5cce8c",i="Stable";let r;return s==null?r="Unknown":s>2?r="Closed":s>0?r="Minimal":s>-5?r="Moderate":s>-10?r="Strong":r="Very strong",{state:n,color:c,label:i,coupling:r}}function ue(t,s,e,o){let n=o?"mc":"mf",c=t.color,i=e!=null?e:0,r=i>500,a=i<350,l=r?.9:a?1.8:1.3;if(o){let g=45-(t.state==="storm"?11:t.state==="active"?16:21),m=t.state==="storm"?12:t.state==="active"?10:8,k=50-m,x=76,$=[`M ${g},25`,`C ${g-2},15 41,${m} 45,${m}`,`C 53,${m} ${x-8},${m+4} ${x},20`,`C ${x+1},23 ${x+1},27 ${x},30`,`C ${x-8},${k-4} 53,${k} 45,${k}`,`C 41,${k} ${g-2},35 ${g},25`,"Z"].join(" "),b=r?3:2,f=[14,25,36],L=v=>`<path d="M 0,${v} L ${r?8:6},${v} M ${r?6:4},${v-2} L ${r?8:6},${v} L ${r?6:4},${v+2}" stroke="${c}bb" stroke-width="${r?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,H=f.map(v=>L(v)).join(""),M=Array.from({length:b},(v,y)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/b*y).toFixed(2)}s">${H}</g>`).join(""),z=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${M}</g>
      <path d="${$}" fill="${c}14" stroke="${c}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${z}
    </svg>`}else{let x=t.state==="storm"?16:t.state==="active"?26:38,$=155-x,b=t.state==="storm"?22:t.state==="active"?30:40,f=120-b,L=240,H=[`M ${$},60`,`C ${$-4},42 150,${b} 155,${b}`,`C 173,${b} ${L-5},${b+18} ${L},60`,`C ${L-5},${f-18} 173,${f} 155,${f}`,`C 150,${f} ${$-4},78 ${$},60`,"Z"].join(" "),M=`M ${$+2},60 C ${$+2},${60-x*.4} 152,54 150,60 C 152,66 ${$+2},${60+x*.4} ${$+2},60 Z`,z=i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c",v=i>700?.4:i>500?.65:i>350?1.1:1.8,y=i>500?[10,24,40,57,74,90,106]:i>350?[14,34,57,82,104]:[20,50,82,108],F=16,C=22,D=$-6,R=Math.ceil((D-C)/F)+2,j=Array.from({length:R},(E,O)=>C-F+O*F),I=12,P=8,S=j.flatMap(E=>y.map(O=>`<path d="M ${E},${O} L ${E+I},${O} M ${E+P},${O-3} L ${E+I},${O} L ${E+P},${O+3}" stroke="${z}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),T=`<g class="hw-wg-full" style="animation-duration:${v}s">${S}</g>`,_=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',A=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="${C}" y="0" width="${D-C}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${n}-wclip)">${T}</g>
      <path d="${M}" fill="${c}08"/>
      <path d="${H}" fill="${c}12" stroke="${c}aa" stroke-width="1.2"/>
      <text x="${$+2}" y="${b-2}" font-size="7" fill="${c}" opacity=".8" font-family="sans-serif">${u(t.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${_}
      ${A}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function me(t){let s=gt(t),e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=t.metrics.kp_latest,c=t.metrics.density,i=t.metrics.pressure_npa,r=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=c!=null?`${c.toFixed(1)} p/cm\xB3`:"\u2014",p=i!=null?`${i.toFixed(2)} nPa`:"\u2014",d=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",h=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",w=e!=null&&e<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":e!=null&&e<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${Q("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${ue(s,e,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${s.color}">${u(s.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${u(p)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(w)}</div>
  </div>`}function Ct(t,s,e){if(!t.length)return null;let o=(e%360+360)%360,n=-1,c=1/0,i=Math.cos(s*Math.PI/180);for(let r of t){let a=r.lat-s,l=(r.lon-o+180+360)%360-180,p=a*a+l*i*(l*i);p<c&&(c=p,n=r.prob)}return n>=0?n:null}function Lt(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function ge(t,s){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&t.lat!=null&&t.lon!=null&&(o=Ct(s.entries,t.lat,t.lon));let n=t.lat!=null&&t.lon!=null,c=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",i=o!=null?`${o}%`:s?"n/a":"\u2026",r=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?u(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${c}">Aurora: ${i}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${Q("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${X(e)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Lt(t)}
    </div>
    ${r}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function we(t,s,e,o){switch(s){case"solar_wind":return ce(t);case"xray":return de(t);case"imf_bz":return he(t);case"aurora":return ge(e,o);case"magnetosphere":return me(t);default:return""}}function nt(t,s){if(t.length<2)return"\u2192";let e=t[t.length-1],o=Math.max(0,t.length-4),n=t[o];if(!isFinite(e)||!isFinite(n))return"\u2192";let c=e-n;return c>s?"\u2191":c<-s?"\u2193":"\u2192"}function xe(t,s,e,o,n,c,i){var A,E,O,N,G,Y,V;let{summary:r,scales:a,metrics:l,aurora_hint:p}=t,d=(A=bt[r.status])!=null?A:bt.quiet,h=n!=null?n.kp.toFixed(1):l.kp_latest!=null?l.kp_latest.toFixed(1):"\u2014",g=[n?n.gScale:a.g_scale,a.r_scale,a.s_scale].map(W=>{let U=ne(W),q=U?`color:${d.accent};border-color:${d.accent}33`:"";return`<span class="hw-scale-chip${U?" hw-scale-active":""}" style="${q}">${u(W)}</span>`}).join(""),m=n?n.auroraLabel:p.aurora_label,k=m==="good"?"#5cce8c":m==="possible"?"#d4cc5c":"#607880",x=m.charAt(0).toUpperCase()+m.slice(1),$="#b4c6cc",b=l.solar_wind_kms!=null?`${Math.round(l.solar_wind_kms)} km/s`:"\u2014",f=l.imf_bz_nt,L=f!=null?f<=-10?"#e05c5c":f<=-5?"#e0a84a":f>=5?"#5cce8c":"#a0b4b8":"#607880",H=f!=null?(f>=0?"+":"")+f.toFixed(1)+" nT":"\u2014",M=l.xray_class,z=M?(E=mt[M])!=null?E:"#a0b4b8":"#607880",v=M?`${M}-class`:"\u2014",y=nt(((O=l.kp_history_1h)!=null?O:[]).map(W=>W.kp),.5),F=nt(((N=l.wind_history_1h)!=null?N:[]).map(W=>W.kms),20),C=nt(((G=l.bz_history_1h)!=null?G:[]).map(W=>W.bz),1.5),D=nt(((Y=l.xray_history_1h)!=null?Y:[]).map(W=>Math.log10(W.flux+1e-9)),.15),R=s?"\u25BC HISTORY":"\u25B6 HISTORY",j=gt(t),I=(V=l.kp_latest)!=null?V:0,P=I>=5,S=P?`linear-gradient(160deg, #0d2a1a 0%, ${d.bg}22 75%)`:`${d.bg}18`,T=(W,U,q,wt,J)=>{let tt=J?`<span class="hw-trend">${J}</span>`:"";return`<div class="hw-kpi-item${o===W?" hw-kpi-active":""}" data-kpi="${W}">
      <span class="hw-qd-label">${U}</span>
      <span class="hw-qd-value" style="color:${wt}">${q}${tt}</span>
    </div>`},_=P?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${I.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${S}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${n?"color:#9acf60":""}">Kp <b>${u(h)}</b>${n?"":`<span class="hw-trend">${y}</span>`}</div>
          <span class="hw-status-badge" style="background:${d.accent}22;color:${d.accent};display:block;text-align:center">${u(r.label)}</span>
          <div class="hw-scales-row">${g}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${u(r.text)}</div>
            <div class="hw-solar-mini-wrap${o==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              <div class="hw-solar-mini-inner">
                <img class="hw-solar-mini-img" src="${X(Te)}" alt="SDO AIA 171" />
                <video class="hw-solar-mini-video" autoplay loop muted playsinline
                  oncanplay="this.style.opacity=1"
                  aria-label="Solar disk \xB7 SDO AIA 171 \xB7 last 24h">
                  <source src="${X(Ae)}" type="video/mp4">
                </video>
              </div>
              <span class="hw-solar-mini-label" style="color:${j.color}">${u(j.label)}</span>
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
        ${T("aurora","Aurora",u(x),k)}
        ${T("solar_wind","Solar wind",u(b),$,F)}
        ${T("imf_bz","IMF Bz",u(H),L,C)}
        ${T("xray","X-ray",u(v),z,D)}
      </div>
      ${o?we(t,o,c,i):""}
      <div class="hw-section-row" data-hero-toggle style="margin-top:6px">
        <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">HISTORY</span>
      </div>`:""}
      ${_}
    </div>`}function fe(t){var p,d,h,w;let{metrics:s}=t,e=(p=s.kp_history_1h)!=null?p:[],o=(d=s.wind_history_1h)!=null?d:[],n=(h=s.bz_history_1h)!=null?h:[],c=(w=s.xray_history_1h)!=null?w:[],i=re(e),r=_t(o.map(g=>{var m;return(m=g.kms)!=null?m:0}).filter(g=>g>0),o.map(g=>it(g.t_utc)),"#5cce8c",28,!1),a=_t(n.map(g=>g.bz),n.map(g=>it(g.t_utc)),"#d4cc5c",28,!0),l=le(c);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
    </div>`}function $e(t){let s=se(t.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${u(s)}</span>
    </div>`}function be(t){return t.map((s,e)=>e===0?(s+t[1])/2:e===t.length-1?(t[e-1]+s)/2:(t[e-1]+s+t[e+1])/3)}function ve(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function ye(t){return t>=5?"good":t>=3?"possible":"none"}function Ht(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function ke(t){let s=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",e=Ht(t),o=s==="none"?"No aurora expected at mid-latitudes":e!=null?`Aurora possible equatorward of ~${e}\xB0 lat`:"Minor aurora possible at high latitudes",n=t>=7?"moderate":t>=5?"low":"none",c=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:c},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function _e(t,s){var d;if(s<=0)return null;let e=(d=t.metrics.kp_forecast_3h)!=null?d:[];if(!e.length)return null;let o=Date.now()+s*36e5,n=e[0],c=1/0;for(let h of e){let w=Math.abs(new Date(h.t_utc).getTime()-o);w<c&&(c=w,n=h)}let i=n.kp,r=ve(i),a=ye(i),l=Ht(i),p=ke(i);return{offsetH:s,kp:i,gScale:r,auroraLabel:a,auroraMinLat:l,impacts:p}}function Se(t,s,e,o){var P;let{forecast:n,metrics:c}=t,{kp_max_next_24h:i,kp_max_at_utc:r,trend:a}=n,l=((P=c.kp_forecast_3h)!=null?P:[]).slice(0,16),p=l.length,d=p*3,h=d>0?`${(s/d*100).toFixed(0)}%`:"0%",w=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",g="Kp forecast unavailable";if(i!=null){let S=vt(r),T=a==="rising"?"rising":a==="falling"?"falling":"steady";g=`Peak Kp ${i.toFixed(1)} next 24h${S?` at ${S}`:""} \xB7 ${T}`}let m=o?"\u25BC FORECAST":"\u25B6 FORECAST";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${o?`<div class="hw-forecast-text">${u(g)}</div>`:""}
    </div>`;let k=320,x=38,$=14,b=x+$,f=k/p,L=S=>x-Math.max(2,Math.min(x-2,S/9*(x-2))),H="",M=l.map(S=>S.kp),z=be(M);l.forEach((S,T)=>{let _=L(S.kp),A=x-_,E=T*f,O=E+f/2,N=S.kp>=6?"#e05c5c":S.kp>=5?"#e0a84a":S.kp>=4?"#d4cc5c":"#5cce8c",G=`Kp ${S.kp.toFixed(1)} \xB7 ${vt(S.t_utc)}`;if(H+=`<rect x="${E.toFixed(1)}" y="${_.toFixed(1)}" width="${(f-1.5).toFixed(1)}" height="${A.toFixed(1)}" fill="${N}" fill-opacity="0.85" rx="1.5"/>`,H+=`<rect x="${E.toFixed(1)}" y="0" width="${f.toFixed(1)}" height="${x}" fill="transparent"><title>${X(G)}</title></rect>`,p<=8||T%2===0){let V=new Date(S.t_utc).getHours();H+=`<text x="${O.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${V.toString().padStart(2,"0")}</text>`}});let y=`<polyline points="${l.map((S,T)=>{let _=T*f+f/2,A=L(z[T]);return`${_.toFixed(1)},${A.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,F="";if(s>0&&p>0){let S=Math.min(k-1,s/(p*3)*k);F=`
      <line x1="${S.toFixed(1)}" y1="0" x2="${S.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${S.toFixed(1)},${x} ${(S-4).toFixed(1)},${(x-7).toFixed(1)} ${(S+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let C=Math.round(d/4),D=Math.round(d/2),R=Math.round(d*3/4),j=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${u(w)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${d}" step="1" value="${s}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${C}h</span>
        <span class="hw-scrub-tick">+${D}h</span>
        <span class="hw-scrub-tick">+${R}h</span>
        <span class="hw-scrub-tick">+${d}h</span>
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
      <div class="hw-forecast-text">${u(g)}</div>
      <svg viewBox="0 0 ${k} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${H}
        ${y}
        ${F}
      </svg>
      ${j}`:""}
    </div>`}function Me(t){let s=/([NS])(\d+)([EW])(\d+)/i.exec(t);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var zt=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Ce(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function Le(t,s,e){let o=s/2,n=o*.87,c=s*.03,i=s*.009,r=t.map(a=>{var x,$;let l=Me(a.location);if(!l||Math.abs(l.lon)>88||a.location.includes("*"))return"";let p=Ce(a);if(!e.has(p))return"";let d=zt.find(b=>b.id===p).color,h=l.lat*Math.PI/180,w=l.lon*Math.PI/180,g=(o+n*Math.cos(h)*Math.sin(w)).toFixed(1),m=(o-n*Math.sin(h)).toFixed(1),k=`AR ${a.region} \xB7 ${a.location}
Class: ${(x=a.spot_class)!=null?x:"\u2014"} / ${($=a.mag_class)!=null?$:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${u(k)}</title>
      <circle cx="${g}" cy="${m}" r="${(c+i+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(i*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${g}" cy="${m}" r="${c.toFixed(1)}" fill="none" stroke="${d}" stroke-width="${i.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${r}</svg>`}var He={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},ze='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Fe="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Te="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Ae="/data/sun_loop.mp4",Ee=240;function Oe(t,s){var l,p,d;let e=parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10),o=(p=t.metrics.xray_class)!=null?p:"A",n=t.metrics.xray_flux_wm2,c=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",r=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(h=>{let w=h.r===e,g=h.r<=e,m=g?h.color:"#1e2c30",k=w?"1":g?"0.5":"1",x=w?h.color:g?h.color+"99":"#566068",$=w?h.color:g?h.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${x}">R${h.r}</span>
      <div class="hw-radio-bbar" style="background:${m};opacity:${k}"></div>
      <span class="hw-radio-bdesc" style="color:${$}">${h.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${r}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(d=mt[o])!=null?d:"#a0b4b8"}">${u(o)}-class</b> \xB7 ${u(c)}</div>
  </div>`}var Ft={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function Tt(t){var r;let s=(r=t.metrics.kp_forecast_3h)!=null?r:[],e=Date.now(),o=e+24*60*60*1e3,n=s.filter(a=>{let l=new Date(a.t_utc).getTime();return l>=e-3*60*60*1e3&&l<=o});if(n.length===0)return{g1:0,g2:0,g3:0};let c=Math.max(...n.map(a=>a.kp)),i=a=>{if(c<a-.7)return 0;if(c>a+1)return 90;let l=(c-(a-.7))/1.7;return Math.round(Math.pow(Math.max(0,l),.7)*90)};return{g1:i(5),g2:i(6),g3:i(7)}}var St={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function Re(t){var l,p,d;let s=(l=t.metrics.kp_latest)!=null?l:0,e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=parseInt(((p=t.scales.g_scale)!=null?p:"G0").replace("G",""),10)||0,c=s>=5||n>=1,i=(d=t.metrics.kp_history_1h)!=null?d:[],r=0;if(i.length>=2&&(r=i[i.length-1].kp-i[i.length-2].kp),!c)return{active:!1,phase:"quiet",kp_current:s,kp_trend:r,bz_nt:e,solar_wind_kms:o};let a;return r>.3&&(e==null||e<-5)?a="rising":r<-.5?a="decline":a="peak",{active:!0,phase:a,kp_current:s,kp_trend:r,bz_nt:e,solar_wind_kms:o}}function Ie(t){if(!t.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],e=s.findIndex(r=>r.key===t.phase),o=St[t.phase],n=s[e].label,c=s.map((r,a)=>{let l=a===e,p=a<e,d=St[r.key],h=l?`background:${d};border-color:${d};box-shadow:0 0 6px ${d}88`:p?`background:${d}44;border-color:${d}66`:"background:#111b1e;border-color:#1e2c30",w=l?" hw-spi-dot-active":"",g=l?`color:${d};font-weight:700`:p?`color:${d}66`:"color:#2e4248",m=a<s.length-1?`<div class="hw-spi-arr">${p?`<span style="color:${d}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${w}" style="${h}"></div>
        <div class="hw-spi-txt" style="${g}">${r.label}</div>
      </div>${m}`}).join(""),i=[`Kp ${t.kp_current.toFixed(1)}`];return t.bz_nt!=null&&i.push(`Bz ${t.bz_nt>0?"+":""}${t.bz_nt.toFixed(1)} nT`),t.solar_wind_kms!=null&&i.push(`Wind ${Math.round(t.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${c}</div>
    <div class="hw-spi-params">${i.join(" \xB7 ")}</div>
  </div>`}function Pe(t,s){let e=Tt(t),o=Re(t),n=(()=>{var w;let l=(w=t.metrics.kp_forecast_3h)!=null?w:[],p=Date.now(),d=p+24*60*60*1e3,h=l.filter(g=>new Date(g.t_utc).getTime()<=d);return h.length?Math.max(...h.map(g=>g.kp)):null})(),i=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:l,label:p})=>{let d=e[l],h=Ft[l];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${h};${d===0?" opacity:.35":""}">${p}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${d}%;background:${h}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${d>0?h:"#607880"}">${d}%</span>
    </div>`}).join(""),r=n!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${n.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${Ie(o)}
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${i}</div>
    ${r?`<div class="hw-gstorm-footer">${r} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var at={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},At={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function De(t){var v;let s=at,e=(v=At[s.phase])!=null?v:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,c=52,i=10,r=c-6,a=c-18,l=.5,p=.19,d=y=>Math.exp(-Math.pow((y-l)/p,2)/2),h=y=>i+y*(n-2*i),w=y=>r-d(y)*a,g=80,m=[];for(let y=0;y<=g;y++){let F=y/g;m.push(`${y===0?"M":"L"}${h(F).toFixed(1)},${w(F).toFixed(1)}`)}let k=Math.round(s.progress_0_1*g),x=[];for(let y=0;y<=k;y++){let F=y/g;x.push(`${y===0?"M":"L"}${h(F).toFixed(1)},${w(F).toFixed(1)}`)}let $=h(s.progress_0_1),b=[`M${i},${r}`,...x.slice(1),`L${$.toFixed(1)},${r} Z`],f=w(s.progress_0_1),L=5,H=`M${$.toFixed(1)},${f.toFixed(1)} L${($-L).toFixed(1)},${(f-L*1.8).toFixed(1)} L${($+L).toFixed(1)},${(f-L*1.8).toFixed(1)} Z`,M=r+11;return`<div class="hw-impact-tip${t?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${u(s.cycle_name)}</div>
    <svg width="100%" height="${c+14}" viewBox="0 0 ${n} ${c+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${e}" opacity="0.12"/>
      <path d="${m.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${x.join(" ")}" fill="none" stroke="${e}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${i}" y1="${r}" x2="${n-i}" y2="${r}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${H}" fill="${e}"/>
      <text x="${i+2}" y="${M}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${h(.5).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-i-2).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${e}">${u(o)}</b>${s.subtitle?` \xB7 ${u(s.subtitle)}`:""}</div>
  </div>`}function Et(t){var a,l,p,d,h;let s=(l=(a=t.coronal_hole)==null?void 0:a.estimated_speed_kms)!=null?l:t.metrics.solar_wind_kms,e=(p=t.coronal_hole)==null?void 0:p.status,o=s!=null?s:0,n=e!=null?e:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",c={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},i={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},r={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:c[n],label:i[n],desc:(h=(d=t.coronal_hole)==null?void 0:d.note)!=null?h:r[n],speed:s}}function Ne(t,s){var S;let e=Et(t),o=(S=e.speed)!=null?S:0,n=e.speed!=null?`${Math.round(e.speed)} km/s`:"\u2014",c=s?" hw-impact-tip-open":"",i=320,r=72,a=36,l=36,p=284,d=36,h=11,w=14,g=19,m=9,k=o>=500,x=o>=420,$=k?"#f5c540":x?"#c8a020":"#7a6010",b=k?"#f5c540":x?"#c8a020":"#3a3808",f=e.color,L=x?"0.9":"0.25",H=k?"0.18":x?"0.10":"0.04",M=[0,45,90,135,180,225,270,315].map(T=>{let _=T*Math.PI/180,A=(a+w*Math.cos(_)).toFixed(1),E=(l+w*Math.sin(_)).toFixed(1),O=(a+g*Math.cos(_)).toFixed(1),N=(l+g*Math.sin(_)).toFixed(1),G=T>300||T<60?"0.9":"0.5";return`<line x1="${A}" y1="${E}" x2="${O}" y2="${N}"
      stroke="${$}" stroke-width="1.6" stroke-linecap="round" opacity="${G}"/>`}).join(""),z=a+h+2,v=p-m-3,y=14,F=`${z},${l} ${v},${d-y} ${v},${d+y}`,C=v+1,D=`${C},${d-4} ${C+7},${d} ${C},${d+4}`,R=m,j=`
    <ellipse cx="${p}" cy="${d}" rx="${R}" ry="${(R*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${p}" y1="${d-R}" x2="${p}" y2="${d+R}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${p-R}" y1="${d}" x2="${p+R}" y2="${d}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.35"/>`,I=`<svg class="hw-hss-diagram" width="100%" height="${r}"
      viewBox="0 0 ${i} ${r}" preserveAspectRatio="none" aria-hidden="true">
    <!-- stream fan -->
    <polygon points="${F}" fill="${f}" opacity="${H}"/>
    <!-- dashed stream axis -->
    <line x1="${z}" y1="${l}" x2="${v-2}" y2="${d}"
          stroke="${f}" stroke-width="2" stroke-dasharray="5 3.5"
          stroke-linecap="round" opacity="${L}"/>
    <!-- arrow -->
    <polygon points="${D}" fill="${f}" opacity="${x?"0.9":"0.25"}"/>
    <!-- Sun glow ring -->
    <circle cx="${a}" cy="${l}" r="${h+6}" fill="none"
            stroke="${b}" stroke-width="1.5" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${a}" cy="${l}" r="${h}" fill="${$}" opacity="0.92"/>
    ${M}
    <!-- Earth body -->
    <circle cx="${p}" cy="${d}" r="${R}" fill="#1a4a6e" opacity="0.92"/>
    ${j}
    <!-- labels -->
    <text x="${a}" y="${r-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${p}" y="${r-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
  </svg>`,P=x?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${c}">
    ${I}
    <div class="hw-hss-meta">Solar wind: <b style="color:${e.color}">${u(n)}</b> \xB7 ${u(e.desc)}</div>
    ${P}
  </div>`}function Ot(t){var n,c;let s=(n=t.scales.g_scale)!=null?n:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let i=(c=t.metrics.kp_forecast_3h)!=null?c:[],r=Date.now(),a=i.filter(l=>new Date(l.t_utc).getTime()<=r+3*60*60*1e3).sort((l,p)=>new Date(p.t_utc).getTime()-new Date(l.t_utc).getTime());a.length>0&&(o=a[0].kp)}return e>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:e>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function Be(t,s){let e=Ot(t),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(a=>{let l=a.l===e.level,p=l?a.color:"#566068",d=l?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${p}">${a.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${a.width}%;background:${a.color};opacity:${d}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${l?a.color:"transparent"}">${l?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",r={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${c}</div>
    <div class="hw-satdrag-meta">${i} \xB7 ${u(e.gScale)} \xB7 ${r[e.level]}</div>
  </div>`}function Rt(t){var l,p,d;let s=(l=t.scales.g_scale)!=null?l:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let h=(p=t.metrics.kp_forecast_3h)!=null?p:[],w=Date.now(),g=h.filter(m=>new Date(m.t_utc).getTime()<=w+3*60*60*1e3).sort((m,k)=>new Date(k.t_utc).getTime()-new Date(m.t_utc).getTime());g.length>0&&(o=g[0].kp)}let n=0;e>=2||o!=null&&o>=6?n=2:(e>=1||o!=null&&o>=4)&&(n=1);let c=parseInt(((d=t.scales.r_scale)!=null?d:"R0").slice(1),10),i=c>=2&&n<2;c>=2&&(n=Math.min(2,n+1));let r={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:r[n],label:a[n],kp:o,gScale:s,boostedByFlare:i}}function je(t,s){var l;let e=Rt(t),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(p=>{let d=p.l===e.level,h=d?p.color:"#566068",w=d?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${h}">${p.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${p.width}%;background:${p.color};opacity:${w}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${d?p.color:"transparent"}">${d?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",r={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=e.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${c}</div>
    <div class="hw-gnss-meta">${i} \xB7 ${u(e.gScale)} \xB7 ${r[e.level]}</div>
    ${a}
  </div>`}function It(t){var n;let s=t.metrics.pressure_npa,e=s!=null?s:null,o=(n=t.metrics.density)!=null?n:null;return e==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:e>=6?{pressure:e,color:"#e05c5c",label:"Extreme",density:o}:e>=4?{pressure:e,color:"#e0a84a",label:"Strong",density:o}:e>=2?{pressure:e,color:"#d4cc5c",label:"Elevated",density:o}:e>=1?{pressure:e,color:"#5cce8c",label:"Typical",density:o}:{pressure:e,color:"#7a9298",label:"Weak",density:o}}function We(t,s){let e=It(t),o=s?" hw-impact-tip-open":"",n=e.pressure,c=200,i=6,r=10,a=i+r,l=a+4,p=l+11,d=a+9,h=p+4,g=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(v=>`<rect x="${v.x}" y="${i}" width="${v.w}" height="${r}" fill="${v.color}" opacity="0.55" rx="0"/>`).join(""),m=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],k=m.map(v=>`<line x1="${v.x}" y1="${a}" x2="${v.x}" y2="${l}" stroke="#3a5058" stroke-width="1"/>`).join(""),x=m.map(v=>`<text x="${v.x}" y="${p}" class="hw-swdp-axlabel" text-anchor="${v.anchor}">${v.label}</text>`).join(""),$="";if(n!=null){let y=Math.min(Math.max(n,0),8)/8*c;$=`<polygon points="${`${y-5},${d} ${y+5},${d} ${y},${a}`}" fill="${e.color}" opacity="0.95"/>
    <line x1="${y}" y1="${i}" x2="${y}" y2="${a}" stroke="${e.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${i}" width="${c}" height="${r}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,f=`<svg class="hw-swdp-gauge" viewBox="0 0 ${c} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${g}${b}${$}${k}${x}
  </svg>`,L=n!=null?`${n.toFixed(2)} nPa`:"\u2014",H=e.density!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",M=t.metrics.solar_wind_kms!=null?`${Math.round(t.metrics.solar_wind_kms)} km/s`:"\u2014",z=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${f}
    <div class="hw-swdp-meta"><b style="color:${e.color}">${u(L)}</b>${u(z)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${u(M)} \xB7 Density ${u(H)}</div>
  </div>`}function Pt(t){var l,p;let s=(l=t.alerts_all)!=null?l:[],e=s.find(d=>d.kind==="cme_impact"),o=s.find(d=>d.kind==="cme_watch"),n=e!=null?e:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let c=((p=n.raw_body)!=null?p:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),i=c?parseInt(c[1],10):null,r=null;if(i&&n.t_utc){let d=1496e5/i*1e3;r=new Date(new Date(n.t_utc).getTime()+d).toISOString().replace(".000Z","Z")}let a=e?"impact":"watch";return{status:a,color:a==="impact"?"#e05c5c":"#d4cc5c",label:a==="impact"?"Active":"Watch",speed_kms:i,issued_utc:n.t_utc,arrival_utc:r}}function Ke(t,s){let e=Pt(t),o=s?" hw-impact-tip-open":"",n=320,c=80,i=24,r=40,a=268,l=296,p=a-i,d=_=>Math.tan(_*Math.PI/180),h=Math.round(d(9)*p),w=Math.round(d(6)*p),g=Math.round(d(3)*p),m=_=>`${i},${r} ${a},${r-_} ${a},${r+_}`,k=e.status==="impact"?r:e.status==="watch"?r+w+8:r,x=Math.min(c-14,Math.max(14,k)),$=Math.abs(x-r)<=g,b=Math.abs(x-r)<=w,f=Math.abs(x-r)<=h,L=$?"#e05c5c":b?"#d4cc5c":f?"#e0a84a":"#5cce8c",H=e.status!=="quiet"?`<polygon points="${m(h)}" fill="#253238" opacity="0.85"/>
       <polygon points="${m(w)}"   fill="#d4cc5c" opacity="0.14"/>
       <polygon points="${m(g)}" fill="#e0a84a" opacity="0.28"/>
       <line x1="${i+9}" y1="${r}" x2="${a-2}" y2="${r}"
             stroke="#3a5058" stroke-dasharray="3 3" stroke-width="1"/>`:`<line x1="${i+9}" y1="${r}" x2="${l-9}" y2="${r}"
             stroke="#1e2c30" stroke-dasharray="4 3" stroke-width="1"/>`,M=8,z=11,v=15,y="#f5c540",F=[0,45,90,135,180,225,270,315].map(_=>{let A=_*Math.PI/180,E=(i+z*Math.cos(A)).toFixed(1),O=(r+z*Math.sin(A)).toFixed(1),N=(i+v*Math.cos(A)).toFixed(1),G=(r+v*Math.sin(A)).toFixed(1),Y=_<45||_>315?"0.9":"0.5";return`<line x1="${E}" y1="${O}" x2="${N}" y2="${G}"
      stroke="${y}" stroke-width="1.4" stroke-linecap="round" opacity="${Y}"/>`}).join(""),C=7,D=`
    <ellipse cx="${l}" cy="${x}" rx="${C}" ry="${(C*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${l}" y1="${x-C}" x2="${l}" y2="${x+C}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>`,R="\u2014";if(e.arrival_utc){let _=new Date(e.arrival_utc),A=_.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),E=_.getUTCDate(),O=String(_.getUTCHours()).padStart(2,"0"),N=String(_.getUTCMinutes()).padStart(2,"0");R=`~${A}\xA0${E}\xA0${O}:${N}\u202FUTC`}let j=e.speed_kms?`${e.speed_kms}\u202Fkm/s`:"\u2014",I=e.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${u(j)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${u(R)}</b>`:"No Earth-directed CME in forecast window",P=$?"Direct impact likely":b?"Glancing blow possible":f?"Near outer edge":"Impact unlikely",S=$?"#e05c5c":b?"#d4cc5c":f?"#e0a84a":"#5cce8c",T=`<svg class="hw-cme-cone-svg" width="100%" height="${c}"
      viewBox="0 0 ${n} ${c}" preserveAspectRatio="none" aria-hidden="true">
    ${H}
    <!-- Sun glow -->
    <circle cx="${i}" cy="${r}" r="${M+5}" fill="none"
            stroke="${y}" stroke-width="1.2" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${i}" cy="${r}" r="${M}" fill="${y}" opacity="0.92"/>
    ${F}
    <!-- Earth body -->
    <circle cx="${l}" cy="${x}" r="${C}" fill="#1a4a6e" opacity="0.92"/>
    ${D}
    <!-- Earth glow -->
    <circle cx="${l}" cy="${x}" r="${C+4}" fill="none"
            stroke="${L}" stroke-width="4" opacity="0.12"/>
    <!-- Labels -->
    <text x="${i}" y="${c-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${l}" y="${c-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
    ${e.status!=="quiet"?`<text x="${Math.round((i+l)/2)}" y="${c-3}" font-size="7.5"
               fill="${S}" text-anchor="middle" font-family="inherit">${u(P)}</text>`:""}
  </svg>`;return`<div class="hw-impact-tip${o}">
    ${T}
    <div class="hw-cme-footer">${I}</div>
  </div>`}function Ge(t,s,e,o,n,c,i,r,a){var tt,rt,xt;let l=(rt=(tt=s==null?void 0:s.impacts)!=null?tt:t.observer_impacts)!=null?rt:[],p=l.map(B=>{var ft,$t;let lt=(ft=Qt[B.level])!=null?ft:"#666",Nt=B.level==="none"?"None":B.level.charAt(0).toUpperCase()+B.level.slice(1),Bt=($t=He[B.kind])!=null?$t:ze,jt=B.level==="none"?"#606870":lt,et=B.kind==="solar_activity"?n:i.has(B.kind),Wt=et?" hw-impact-open":"",Z;if(B.kind==="solar_activity"){let st=n?" hw-solar-open":"",ct=zt.map(K=>{let ot=c.has(K.id),dt=ot?K.color+"22":"transparent",pt=ot?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${K.id}" style="color:${K.color};border-color:${K.color};background:${dt};opacity:${pt}">${K.label}</button>`}).join("");Z=`<div class="hw-solar-tip${st}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Fe}" alt="Solar disk" loading="lazy" />
            ${e?Le(e,Ee,c):""}
          </div>
          <div class="hw-solar-layers">${ct}</div>
          <span class="hw-solar-tip-text">${u(B.summary)}</span>
        </div>`}else if(B.kind==="aurora"){let st=et?" hw-aurora-tip-open":"",ct=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,K=null;r&&a.lat!=null&&a.lon!=null&&(K=Ct(r.entries,a.lat,a.lon));let ot=a.lat!=null&&a.lon!=null,dt=K!=null?K>=30?"#5cce8c":K>=10?"#d4cc5c":"#9ab4bc":"#607880",pt=K!=null?`${K}%`:r?"n/a":"\u2026",Gt=ot?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${a.locationName?u(a.locationName)+" \xB7 ":""}${a.lat.toFixed(1)}\xB0${a.lat>=0?"N":"S"} ${Math.abs(a.lon).toFixed(1)}\xB0${a.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${dt}">Aurora: ${pt}</span>
        </div>`:"";Z=`<div class="hw-aurora-tip${st}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${X(ct)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Lt(a)}
          </div>
          ${Gt}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else B.kind==="radio"?Z=Oe(t,et):Z=`<div class="hw-impact-tip${et?" hw-impact-tip-open":""}">${u(B.summary)}</div>`;let Kt=B.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${X(B.kind)}"`;return`<div class="hw-impact-row${Wt}"${Kt}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${jt}">${Bt}<span style="color:#b4c6cc">${u(B.label)}</span></span>
      <span class="hw-impact-badge" style="background:${lt}22;color:${lt}">${u(Nt)}</span>
      ${Z}
    </div>`}).join(""),d=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",h=l.length+7,w=o?"\u25BC":"\u25B6",g=h>0?`Observer Impacts (${h})`:"Observer Impacts",m=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${w}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}${d}</span>
    </div>`,k=i.has("geomag_storm"),x=Tt(t),$=x.g1,b=x.g1>=30?Ft.g1:x.g1>0?"#7a9298":"#607880",f=$>0?`G1 ${$}%`:"None",H=`<div class="hw-impact-row${k?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${b}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${b}22;color:${b}">${f}</span>
      ${Pe(t,k)}
    </div>`,M=i.has("solar_cycle"),z=(xt=At[at.phase])!=null?xt:"#96a8b8",v=at.phase.charAt(0).toUpperCase()+at.phase.slice(1),F=`<div class="hw-impact-row${M?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${z}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${z}22;color:${z}">${v}</span>
      ${De(M)}
    </div>`,C=Et(t),D=i.has("hss"),j=`<div class="hw-impact-row${D?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${C.color}22;color:${C.color}">${C.label}</span>
      ${Ne(t,D)}
    </div>`,I=Ot(t),P=i.has("sat_drag"),T=`<div class="hw-impact-row${P?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${I.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${I.color}22;color:${I.color}">${I.label}</span>
      ${Be(t,P)}
    </div>`,_=Rt(t),A=i.has("gnss"),O=`<div class="hw-impact-row${A?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${_.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${_.color}22;color:${_.color}">${_.label}</span>
      ${je(t,A)}
    </div>`,N=It(t),G=i.has("sw_pressure"),Y=N.pressure!=null?`${N.pressure.toFixed(2)} nPa`:"\u2014",W=`<div class="hw-impact-row${G?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${N.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${N.color}22;color:${N.color}">${Y}</span>
      ${We(t,G)}
    </div>`,U=Pt(t),q=i.has("cme_cone"),J=`<div class="hw-impact-row${q?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${U.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${U.color}22;color:${U.color}">${u(U.label)}</span>
      ${Ke(t,q)}
    </div>`;return`
    <div class="hw-impacts">
      ${m}
      ${o?p+H+F+j+T+O+W+J:""}
    </div>`}var Mt={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Ue(t,s){var a,l;let e=(a=Jt[t.level])!=null?a:"#666",o=t.level.charAt(0).toUpperCase()+t.level.slice(1),n=(l=Mt[t.kind])!=null?l:Mt.unknown,c=[oe(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),i=s&&t.raw_body?`<div class="hw-alert-body">${u(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${e}" data-alert-key="${X(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${e}">${n}</span>
      <span class="hw-alert-level" style="color:${e}">${u(o)}</span>
      <span class="hw-alert-title">${u(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${u(t.summary_short)}</div>
    <div class="hw-alert-meta">${u(c)}</div>
    ${i}
  </div>`}var Xe={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Ye="#4ae0a4";function qe(t){let s=(e,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${e}</svg>`;switch(t){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function Ve(t){var o;let s=(o=t.metadata)!=null?o:{},e=[];return s.source_code&&e.push(`Code: ${s.source_code}`),s.model&&e.push(`Model: ${String(s.model).toUpperCase()}`),e.length===0?"":`
${e.join(" \xB7 ")}`}function Ze(t,s,e){var a;let o=t.is_active?Ye:(a=Xe[t.level])!=null?a:"#445c64",n=t.event_time===e,c=t.event_time.slice(11,16)+" UTC",i=t.source==="NASA_DONKI"?"DONKI":"SWPC",r=n?`<div class="hw-tl-detail">${u(t.description)}${u(Ve(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${X(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${c}</span>
          <span class="hw-tl-src">${i}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${qe(t.event_type)} ${u(t.event_title)}
        </div>
        ${r}
      </div>
    </div>`}function Qe(t,s,e,o){var x,$;let n=(x=t.timeline)!=null?x:[],c=Date.now(),i=new Date(c).toISOString().slice(0,10),r=new Date(c-864e5).toISOString().slice(0,10),a=new Date(c-1728e5).toISOString().slice(0,10),l=new Set([i,r,a]),p=n.filter(b=>{var f;return l.has(((f=b.event_time)!=null?f:"").slice(0,10))}).slice().reverse(),d=p.length,h=e?"\u25BC":"\u25B6",w=d>0?`Solar Activity Timeline (${d})`:"Solar Activity Timeline",g=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${h}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}</span>
    </div>`;if(!e||d===0)return`<div class="hw-timeline">${g}</div>`;let m=new Map;for(let b of p){let f=(($=b.event_time)!=null?$:"").slice(0,10);m.has(f)||m.set(f,[]),m.get(f).push(b)}let k=[...m.entries()].map(([b,f])=>{let H=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=o.has(b),z=M?"\u25B6":"\u25BC",v=M?`<span class="hw-tl-day-count">${f.length} events</span>`:"",y=`
      <div class="hw-tl-day-row" data-tl-day="${X(b)}">
        <span class="hw-section-caret">${z}</span>
        <span class="hw-tl-date">${H}</span>
        ${v}
      </div>`,F=M?"":f.map((C,D)=>Ze(C,D<f.length-1,s)).join("");return`<div class="hw-tl-group">${y}${F}</div>`}).join("");return`
    <div class="hw-timeline">
      ${g}
      ${k}
    </div>`}function Je(t,s,e){var l;let o=(l=t.alerts_all)!=null?l:[],n=o.length,c=s?"\u25BC":"\u25B6",i=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",r=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${c}</span>
        <span class="hw-alerts-label">${i}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${r}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=o.map(p=>Ue(p,p.dedupe_key===e)).join("");return`
    <div class="hw-alerts">
      ${r}
      ${a}
    </div>`}function ts(t,s){var R,j,I;let e=t.cme_tracker;if(!e)return"";let o=(R=te[e.impact_level])!=null?R:"#96a8b8",n=(j=ee[e.status])!=null?j:e.status,c=300,i=44,r=18,a=i/2,l=10,p=c-18,d=7,h=`<line x1="${r+l}" y1="${a}" x2="${p-d}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,w=`<circle cx="${r}" cy="${a}" r="${l}" fill="#f0c040" opacity="0.92"/>`,g=`
    <circle cx="${p}" cy="${a}" r="${d}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${p}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,m=`<text x="${r}" y="${a+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,k=`<text x="${p}" y="${a+d+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,x="";if(e.progress!=null){let P=r+l+4,S=p-d-4,T=P+e.progress*(S-P),_=5;e.status==="arrival_window"?x=`
        <g transform="translate(${T.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${_}" fill="${o}" opacity="0.92"/>
        </g>`:x=`<circle cx="${T.toFixed(1)}" cy="${a}" r="${_}" fill="${o}" opacity="0.85"/>`}let $=`<svg class="hw-cme-svg" viewBox="0 0 ${c} ${i}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${h}
    ${w}${m}
    ${g}${k}
    ${x}
  </svg>`,b=yt(e.arrival_time_utc),f=yt(e.launch_time_utc),L=e.speed_kms!=null?`${Math.round(e.speed_kms)} km/s`:"\u2014",H=e.half_angle_deg!=null?`${e.half_angle_deg}\xB0`:"\u2014",M=(I=e.source_location)!=null?I:"\u2014",z=e.is_earth_direct?"Direct hit":"Glancing blow",v=e.progress!=null?`${Math.round(e.progress*100)}%`:"\u2014",y=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${u(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${u(L)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${u(e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${u(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${u(f)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${u(v)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${u(H)} \xB7 Source: ${u(M)} \xB7 ${u(z)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,F=s?"\u25BC":"\u25B6",C=e.impact_level==="unknown"?"Unrated":e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1),D=s?`${$}${y}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${F}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${u(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${u(C)} impact</span>
      </div>
      ${D}
    </div>`}function es(t,s,e,o,n,c,i,r,a,l,p,d,h,w,g,m,k,x,$,b){let f=_e(t,n);return`
    <div class="hw-root">
      ${$e(t)}
      ${xe(t,e,w,o,f,$,b)}
      ${e?fe(t):""}
      ${Se(t,n,f,h)}
      ${ts(t,d)}
      ${Ge(t,f,g,p,m,k,x,b,$)}
      ${Qe(t,r,a,l)}
      ${Je(t,c,i)}
    </div>`}function ss(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${u(t)}</div>
    </div>
  </div>`}function os(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var ut=class{constructor(s,e){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=e,this.el.innerHTML=os(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var l,p,d,h,w,g;let e=s.target;if(e.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(e.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(e.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.render();return}if(e.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.render();return}if(e.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let o=e.closest("[data-impact-row]");if(o){let m=(l=o.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(m)?this.expandedImpacts.delete(m):this.expandedImpacts.add(m),this.render();return}let n=e.closest("[data-solar-layer]");if(n){let m=(p=n.dataset.solarLayer)!=null?p:"";this.solarLayers.has(m)?this.solarLayers.delete(m):this.solarLayers.add(m),this.render();return}if(e.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(e.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let c=e.closest("[data-alert-key]");if(c){let m=(d=c.dataset.alertKey)!=null?d:null;this.expandedAlertKey=this.expandedAlertKey===m?null:m,this.render();return}if(e.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let m=Date.now();this.collapsedDays=new Set([new Date(m).toISOString().slice(0,10),new Date(m-864e5).toISOString().slice(0,10),new Date(m-1728e5).toISOString().slice(0,10)])}this.render();return}let i=e.closest("[data-tl-day]");if(i){let m=(h=i.dataset.tlDay)!=null?h:"";this.collapsedDays.has(m)?this.collapsedDays.delete(m):this.collapsedDays.add(m),this.render();return}let r=e.closest("[data-timeline-key]");if(r){let m=(w=r.dataset.timelineKey)!=null?w:null;this.expandedTimelineKey=this.expandedTimelineKey===m?null:m,this.render();return}if(e.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let a=e.closest("[data-kpi]");if(a){let m=(g=a.dataset.kpi)!=null?g:null;this.activePopover=this.activePopover===m?null:m,this.render();return}if(e.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}e.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(s){let e=s.target;if(!e.matches("[data-scrub]"))return;let o=parseFloat(e.value);this.scrubOffset=o,e.style.setProperty("--pct",`${(o/parseFloat(e.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let e=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);this.data=await e.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(e){let o=e instanceof Error?e.message:String(e);this.el.innerHTML=ss(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let e=await s.json(),o=new Map;for(let n of e){let c=o.get(n.region),i=n.area!=null,r=(c==null?void 0:c.area)!=null;(!c||!r&&i||r===i&&n.observed_date>c.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,e,o,n,c,i;if(!(this.opts.lat==null||this.opts.lon==null))try{let r=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!r.ok)return;let a=await r.json(),p=((o=(e=(s=a.coordinates)!=null?s:a.Data)!=null?e:a.data)!=null?o:[]).map(([d,h,w])=>({lon:d,lat:h,prob:w}));this.ovationData={entries:p,forecastTime:String((i=(c=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?c:a["Observation Time"])!=null?i:"")},this.render()}catch(r){}}render(){this.data&&(this.el.innerHTML=es(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},Dt={mount(t,s){return ie(),new ut(t,s)}};typeof window!="undefined"&&(window.HelioWidget=Dt);return Zt(ns);})();
