"use strict";var HelioWidgetModule=(()=>{var ft=Object.defineProperty,ne=Object.defineProperties,ae=Object.getOwnPropertyDescriptor,ie=Object.getOwnPropertyDescriptors,re=Object.getOwnPropertyNames,zt=Object.getOwnPropertySymbols;var Ft=Object.prototype.hasOwnProperty,le=Object.prototype.propertyIsEnumerable;var Tt=(t,s,e)=>s in t?ft(t,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[s]=e,Ot=(t,s)=>{for(var e in s||(s={}))Ft.call(s,e)&&Tt(t,e,s[e]);if(zt)for(var e of zt(s))le.call(s,e)&&Tt(t,e,s[e]);return t},Rt=(t,s)=>ne(t,ie(s));var ce=(t,s)=>{for(var e in s)ft(t,e,{get:s[e],enumerable:!0})},de=(t,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let a of re(s))!Ft.call(t,a)&&a!==e&&ft(t,a,{get:()=>s[a],enumerable:!(o=ae(s,a))||o.enumerable});return t};var pe=t=>de(ft({},"__esModule",{value:!0}),t);var ys={};ce(ys,{HelioWidget:()=>se});var It={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},he={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},me={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},Ht={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},ue={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},ge={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function we(t){if(!t)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(t).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let e=Math.floor(s/60);return e<24?`Updated ${e}h ago`:`Updated ${Math.floor(e/24)}d ago`}catch(s){return"Updated recently"}}function xe(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function ht(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t}}function yt(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t.slice(11,16)}}function Nt(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function W(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function m(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function $e(t){return parseInt(t.slice(1),10)>0}var fe=`
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
`,Pt=!1;function be(){if(Pt)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=fe,document.head.appendChild(t),Pt=!0}function ve(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.length,a=s/o,r=t.map((i,c)=>{let n=Math.max(2,Math.min(e,i.kp/9*e)),l=e-n,d=c*a,p=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${l.toFixed(1)}" width="${(a-1).toFixed(1)}" height="${n.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${m(yt(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">${r}</svg>`}function Dt(t,s,e,o,a){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let r=200,i=Math.min(...t),c=Math.max(...t),n=c-i||1,l=g=>o-2-(g-i)/n*(o-4),d=t.map((g,w)=>`${(w/(t.length-1)*r).toFixed(1)},${l(g).toFixed(1)}`).join(" "),p="";if(a&&i<0&&c>0){let g=l(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${r}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let h=t.map((g,w)=>`<rect x="${(w/(t.length-1)*r-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${m(s[w]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${r} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${e}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${h}
  </svg>`}function ye(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),a=Math.min(...o),i=Math.max(...o)-a||1,c=d=>e-2-(d-a)/i*(e-4),n=o.map((d,p)=>`${(p/(o.length-1)*s).toFixed(1)},${c(d).toFixed(1)}`).join(" "),l=t.map((d,p)=>{let h=p/(o.length-1)*s,g=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(h-4).toFixed(1)}" y="0" width="8" height="${e}" fill="transparent"><title>${m(yt(d.t_utc))} \xB7 ${g}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">
    <polyline points="${n}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function ut(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ke(t){var l;let s=(l=t.metrics.wind_history_1h)!=null?l:[],e=s[s.length-1],o=t.metrics.solar_wind_kms,a=o!=null?`${Math.round(o)} km/s`:"\u2014",r=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",i=(e==null?void 0:e.density)!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",c=(e==null?void 0:e.temp_kk)!=null?`${e.temp_kk.toFixed(0)} kK`:"\u2014",n=(e==null?void 0:e.pressure_npa)!=null?`${e.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ut("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${m(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${m(n)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function _e(t){var c,n;let s=(c=t.metrics.xray_class)!=null?c:"A",e=t.metrics.xray_flux_wm2,o=e!=null?e.toExponential(2)+" W/m\xB2":"\u2014",a=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],r=a.map(l=>{let d=l.label===s,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${d?"cc":"44"}">${p}</div>`}).join(""),i=a.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===s?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ut("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${r}</div>
      <div class="hw-xray-scale-labels">${i}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(n=Ht[s])!=null?n:"#a0b4b8"}">${m(s)}-class</b> \xB7 ${m(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Se(t){let n='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(y=>{let k=100+y/20*100;return`<line x1="${k.toFixed(1)}" y1="16" x2="${k.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${n}${l}${d}</svg>`;let p=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",h=Math.max(-20,Math.min(20,t)),g=100+h/20*100,w=3,u=h<0?g-w:100-w,f=Math.max(2*w,Math.abs(g-100)+2*w),$=`<rect x="${u.toFixed(1)}" y="16" width="${f.toFixed(1)}" height="6" rx="${w}" fill="${p}" opacity="0.82"/>`,x=5,b=15,v=b-x*1.1,_=`<polygon points="${g.toFixed(1)},${b.toFixed(1)} ${(g-x).toFixed(1)},${v.toFixed(1)} ${(g+x).toFixed(1)},${v.toFixed(1)}" fill="${p}"/>`,H=`<line x1="${g.toFixed(1)}" y1="${b.toFixed(1)}" x2="${g.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,C=`<text x="${g.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${n}${l}${d}${$}${_}${H}${C}
  </svg>`}function Me(t){var h;let s=t.metrics.imf_bz_nt,e=t.metrics.imf_bt_nt,o=t.metrics.solar_wind_kms,a=(h=t.metrics.pressure_npa)!=null?h:null,r=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",i=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",c=e!=null?e.toFixed(1)+" nT":"\u2014",n=o!=null?`${Math.round(o)} km/s`:"\u2014",l=a!=null?`${a.toFixed(2)} nPa`:"\u2014",d=gt(t),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ut("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${Se(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${m(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${m(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function gt(t){var n,l;let s=t.metrics.imf_bz_nt,e=(n=t.metrics.kp_latest)!=null?n:0,o=(l=t.metrics.solar_wind_kms)!=null?l:0,a,r,i;if(s!=null&&s<-5||e>=6)a="storm",r="#e05c5c",i="Storm conditions";else if(s!=null&&s<0||e>=4||o>=400){let d=s!=null&&s<0;a="active",r="#e0a84a",i=d?"Active coupling":"Elevated"}else a="stable",r="#5cce8c",i="Stable";let c;return s==null?c="Unknown":s>2?c="Closed":s>0?c="Minimal":s>-5?c="Moderate":s>-10?c="Strong":c="Very strong",{state:a,color:r,label:i,coupling:c}}function Ce(t,s,e,o){let a=o?"mc":"mf",r=t.color,i=e!=null?e:0,c=i>500,n=i<350,l=c?.9:n?1.8:1.3;if(o){let w=45-(t.state==="storm"?11:t.state==="active"?16:21),u=t.state==="storm"?12:t.state==="active"?10:8,f=50-u,$=76,x=[`M ${w},25`,`C ${w-2},15 41,${u} 45,${u}`,`C 53,${u} ${$-8},${u+4} ${$},20`,`C ${$+1},23 ${$+1},27 ${$},30`,`C ${$-8},${f-4} 53,${f} 45,${f}`,`C 41,${f} ${w-2},35 ${w},25`,"Z"].join(" "),b=c?3:2,v=[14,25,36],_=y=>`<path d="M 0,${y} L ${c?8:6},${y} M ${c?6:4},${y-2} L ${c?8:6},${y} L ${c?6:4},${y+2}" stroke="${r}bb" stroke-width="${c?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,H=v.map(y=>_(y)).join(""),M=Array.from({length:b},(y,k)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/b*k).toFixed(2)}s">${H}</g>`).join(""),C=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${a}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${a}-wclip)">${M}</g>
      <path d="${x}" fill="${r}14" stroke="${r}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${C}
    </svg>`}else{let $=t.state==="storm"?16:t.state==="active"?26:38,x=155-$,b=t.state==="storm"?22:t.state==="active"?30:40,v=120-b,_=240,H=[`M ${x},60`,`C ${x-4},42 150,${b} 155,${b}`,`C 173,${b} ${_-5},${b+18} ${_},60`,`C ${_-5},${v-18} 173,${v} 155,${v}`,`C 150,${v} ${x-4},78 ${x},60`,"Z"].join(" "),M=`M ${x+2},60 C ${x+2},${60-$*.4} 152,54 150,60 C 152,66 ${x+2},${60+$*.4} ${x+2},60 Z`,C=i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c",y=i>700?.4:i>500?.65:i>350?1.1:1.8,k=i>500?[10,24,40,57,74,90,106]:i>350?[14,34,57,82,104]:[20,50,82,108],E=16,T=22,U=x-6,V=Math.ceil((U-T)/E)+2,G=Array.from({length:V},(O,N)=>T-E+N*E),F=12,K=8,J=G.flatMap(O=>k.map(N=>`<path d="M ${O},${N} L ${O+F},${N} M ${O+K},${N-3} L ${O+F},${N} L ${O+K},${N+3}" stroke="${C}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),S=`<g class="hw-wg-full" style="animation-duration:${y}s">${J}</g>`,A=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',X=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return kt("magnetosphere",{magnetInfo:t,bz:s,windKms:e,uid:a})}}function kt(t,s={}){var S,A,X,O,N,q;let r=(S=s.uid)!=null?S:"hse",i=0,c=160,n=800,l=17,d=n-l,p=s.magnetInfo,h=(A=p==null?void 0:p.state)!=null?A:"stable",g=(X=p==null?void 0:p.color)!=null?X:"#e0a84a",u=n-(h==="storm"?55:h==="active"?80:110),f=h==="storm"?58:h==="active"?76:95,$=1120,x=20,b=[`M ${u},130`,`C ${u-8},${130-f*.55} ${n-18},${130-f} ${n},${130-f}`,`C ${n+120},${130-f} ${$-180},${130-x} ${$},${130-x}`,`L ${$},${130+x}`,`C ${$-180},${130+x} ${n+120},${130+f} ${n},${130+f}`,`C ${n-18},${130+f} ${u-8},${130+f*.55} ${u},130`,"Z"].join(" "),v=t==="magnetosphere",_=v?h==="storm"?"0.12":"0.08":"0.04",H=v?"0.75":"0.28",M=`<g id="${r}-base-sun">
    <circle cx="${i}" cy="130" r="${c+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${i}" cy="130" r="${c}" fill="#f0c040" opacity="0.88"/>
  </g>`,C=`
    <ellipse cx="${n}" cy="130" rx="${l}" ry="${(l*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${n}" y1="${130-l}" x2="${n}" y2="${130+l}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${d}" y1="130" x2="${n+l}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,y=`<g id="${r}-base-earth">
    <circle cx="${n}" cy="130" r="${l}" fill="#1a4a6e" opacity="0.92"/>
    ${C}
  </g>`,k=`<g id="${r}-base-magnetosphere">
    <path d="${b}" fill="${g}" fill-opacity="${_}"
          stroke="${g}" stroke-opacity="${H}" stroke-width="1.8"/>
    ${p?`<text x="${u+5}" y="${130-f-7}" font-size="12" fill="${g}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,E=`<g id="${r}-base-axis">
    <line x1="${c}" y1="130" x2="${u}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,T="";if(t==="magnetosphere"){let R=(O=s.windKms)!=null?O:0,B=R>500,Y=R<350,P=(B?.5:Y?1.4:.9)*1.3,j=R>700?"#e05c5c":R>500?"#e0a84a":R>350?"#d4c840":"#5cce8c",Z=c+8,tt=u-14,L=8,I=6,D=(tt-Z)/(L-1),nt=260/(I+1),et=38,at=24,rt=2,wt=Array.from({length:L},(lt,pt)=>{let it=Z+pt*D,ct=Array.from({length:I},(_t,st)=>{let ot=nt*(st+1);return`<path d="M ${it.toFixed(1)},${ot.toFixed(1)} L ${(it+et).toFixed(1)},${ot.toFixed(1)} M ${(it+at).toFixed(1)},${(ot-6).toFixed(1)} L ${(it+et).toFixed(1)},${ot.toFixed(1)} L ${(it+at).toFixed(1)},${(ot+6).toFixed(1)}"
          stroke="${j}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:rt},(_t,st)=>{let ot=-((L-pt)/L*P)-st*P/rt;return`<g style="opacity:.12;animation:hw-arrow-chase ${P}s linear ${ot.toFixed(3)}s infinite">${ct}</g>`}).join("")}).join(""),z=(N=s.bz)!=null?N:null,dt=z==null?"":(()=>{let lt=z>0?"#5cce8c":"#e05c5c";return`${z>0?`<path d="M ${n},137 L ${n},123 M ${n-3},126 L ${n},123 L ${n+3},126"
           stroke="${lt}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${n},123 L ${n},137 M ${n-3},134 L ${n},137 L ${n+3},134"
           stroke="${lt}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${n+22}" y="135" font-size="13"
        fill="${lt}" font-family="monospace">Bz${z>0?"\u2191":"\u2193"}</text>`})();T=`${wt}${dt}`}let U=`<g id="${r}-overlay-solar-wind">${T}</g>`,V="";if(t==="coronal_hole"&&s.hssState){let R=s.hssState,B=(q=R.speed)!=null?q:0,Y=B>=420,P=R.color,j=Y?"0.85":"0.25",Z=B>=500?"0.18":Y?"0.10":"0.04",tt=c+8,L=d-16,I=60,D=`${tt},130 ${L},${130-I} ${L},${130+I}`,nt=L+6,et=`${nt},120 ${nt+18},130 ${nt},140`;V=`
    <polygon points="${D}" fill="${P}" opacity="${Z}"/>
    <line x1="${tt}" y1="130" x2="${L-5}" y2="130"
          stroke="${P}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${j}"/>
    <polygon points="${et}" fill="${P}" opacity="${Y?"0.9":"0.25"}"/>`}let G=`<g id="${r}-overlay-coronal-hole">${V}</g>`,F="";if(t==="cme_cone"&&s.cmeState){let R=s.cmeState,B=c,Y=d-10,P=Y-B,j=D=>Math.tan(D*Math.PI/180),Z=Math.round(j(9)*P),tt=Math.round(j(6)*P),L=Math.round(j(3)*P),I=D=>`${B},130 ${Y},${130-D} ${Y},${130+D}`;if(R.status!=="quiet"){let D=R.status==="impact"?"#e05c5c":"#d4cc5c";F=`
    <polygon points="${I(Z)}" fill="#253238" opacity="0.85"/>
    <polygon points="${I(tt)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${I(L)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${B+14}" y1="130" x2="${Y-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${n}" cy="130" r="${l+8}" fill="none"
            stroke="${D}" stroke-width="7" opacity="0.16"/>`}else F=`
    <line x1="${B+14}" y1="130" x2="${d-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let K=`<g id="${r}-overlay-cme-cone">${F}</g>`,J=`<g id="${r}-overlay-labels">
    <text x="18" y="250" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${n}" y="252" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;return`<svg class="hw-solar-earth-scene" viewBox="0 0 1000 260"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="260" fill="#0a1014"/>
    ${E}
    ${U}
    ${G}
    ${K}
    ${M}
    ${k}
    ${y}
    ${J}
  </svg>`}function Le(t){let s=gt(t),e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,a=t.metrics.kp_latest,r=t.metrics.density,i=t.metrics.pressure_npa,c=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",n=o!=null?`${Math.round(o)} km/s`:"\u2014",l=r!=null?`${r.toFixed(1)} p/cm\xB3`:"\u2014",d=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",h=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",g=e!=null&&e<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":e!=null&&e<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ut("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Ce(s,e,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${s.color}">${m(s.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function He(t,s){if(!s)return"";let e=gt(t),o=t.metrics.imf_bz_nt,a=t.metrics.solar_wind_kms,r=t.metrics.density,i=t.metrics.pressure_npa,c=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",n=a!=null?`${Math.round(a)} km/s`:"\u2014",l=r!=null?`${r.toFixed(1)} p/cm\xB3`:"\u2014",d=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",h=a!=null?a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c":"#607880",g=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${kt("magnetosphere",{windKms:a!=null?a:void 0,bz:o!=null?o:void 0})}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${e.color}">${m(e.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function Wt(t,s,e){if(!t.length)return null;let o=(e%360+360)%360,a=-1,r=1/0,i=Math.cos(s*Math.PI/180);for(let c of t){let n=c.lat-s,l=(c.lon-o+180+360)%360-180,d=n*n+l*i*(l*i);d<r&&(r=d,a=c.prob)}return a>=0?a:null}function Ut(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Ee(t,s){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&t.lat!=null&&t.lon!=null&&(o=Wt(s.entries,t.lat,t.lon));let a=t.lat!=null&&t.lon!=null,r=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",i=o!=null?`${o}%`:s?"n/a":"\u2026",c=a?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?m(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${r}">Aurora: ${i}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ut("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${W(e)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Ut(t)}
    </div>
    ${c}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Ae(t,s,e,o){switch(s){case"solar_wind":return ke(t);case"xray":return _e(t);case"imf_bz":return Me(t);case"aurora":return Ee(e,o);case"magnetosphere":return Le(t);default:return""}}function bt(t,s){if(t.length<2)return"\u2192";let e=t[t.length-1],o=Math.max(0,t.length-4),a=t[o];if(!isFinite(e)||!isFinite(a))return"\u2192";let r=e-a;return r>s?"\u2191":r<-s?"\u2193":"\u2192"}function ze(t,s,e){let o=mt[s],a=Qe,r=Xe(o.url,e);return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner">
      <img class="hw-solar-mini-img" src="${W(r)}" alt="${W(o.label)}"
        onerror="if(this.src!=='${W(a)}')this.src='${W(a)}'" />
      <video class="hw-solar-mini-video" autoplay loop muted playsinline
        oncanplay="this.style.opacity=1"
        aria-label="Solar disk \xB7 ${W(o.label)} \xB7 last 24h">
        <source src="${W(Ve)}" type="video/mp4">
      </video>
    </div>
    <div class="hw-solar-mini-switcher">
      <button class="hw-solar-mini-btn" data-solar-prev>&#8249;</button>
      <span class="hw-solar-mini-lbl">${W(o.label)}</span>
      <button class="hw-solar-mini-btn" data-solar-next>&#8250;</button>
    </div>
  </div>`}function Te(t,s,e,o,a,r,i,c=0){var q,R,B,Y,P,j,Z,tt;let{summary:n,scales:l,metrics:d,aurora_hint:p}=t,h=(q=It[n.status])!=null?q:It.quiet,g=a!=null?a.kp.toFixed(1):d.kp_latest!=null?d.kp_latest.toFixed(1):"\u2014",u=[a?a.gScale:l.g_scale,l.r_scale,l.s_scale].map(L=>{let I=$e(L),D=I?`color:${h.accent};border-color:${h.accent}33`:"";return`<span class="hw-scale-chip${I?" hw-scale-active":""}" style="${D}">${m(L)}</span>`}).join(""),f=a?a.auroraLabel:p.aurora_label,$=f==="good"?"#5cce8c":f==="possible"?"#d4cc5c":"#607880",x=f.charAt(0).toUpperCase()+f.slice(1),b="#b4c6cc",v=d.solar_wind_kms!=null?`${Math.round(d.solar_wind_kms)} km/s`:"\u2014",_=d.imf_bz_nt,H=_!=null?_<=-10?"#e05c5c":_<=-5?"#e0a84a":_>=5?"#5cce8c":"#a0b4b8":"#607880",M=_!=null?(_>=0?"+":"")+_.toFixed(1)+" nT":"\u2014",C=d.xray_class,y=C?(R=Ht[C])!=null?R:"#a0b4b8":"#607880",k=C?`${C}-class`:"\u2014",E=bt(((B=d.kp_history_1h)!=null?B:[]).map(L=>L.kp),.5),T=bt(((Y=d.wind_history_1h)!=null?Y:[]).map(L=>L.kms),20),U=bt(((P=d.bz_history_1h)!=null?P:[]).map(L=>L.bz),1.5),V=bt(((j=d.xray_history_1h)!=null?j:[]).map(L=>Math.log10(L.flux+1e-9)),.15),G=(Z=d.kp_history_1h)!=null?Z:[],F=G.length?ht(G[G.length-1].t_utc):null,K=F?`Recent history \xB7 Last step ${F}`:"Recent history",J=gt(t),S=(tt=d.kp_latest)!=null?tt:0,A=S>=5,X=A?`linear-gradient(160deg, #0d2a1a 0%, ${h.bg}22 75%)`:`${h.bg}18`,O=(L,I,D,nt,et)=>{let at=et?`<span class="hw-trend">${et}</span>`:"";return`<div class="hw-kpi-item${o===L?" hw-kpi-active":""}" data-kpi="${L}">
      <span class="hw-qd-label">${I}</span>
      <span class="hw-qd-value" style="color:${nt}">${D}${at}</span>
    </div>`},N=A?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${S.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${X}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${a?"color:#9acf60":""}">Kp <b>${m(g)}</b>${a?"":`<span class="hw-trend">${E}</span>`}</div>
          <span class="hw-status-badge" style="background:${h.accent}22;color:${h.accent};display:block;text-align:center">${m(n.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${u}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${m(n.text)}</div>
            ${ze(o,c,r.baseUrl)}
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${e?"0":"4px"}">
        <span class="hw-section-caret">${e?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${e?`
      <div class="hw-quick-details">
        ${O("aurora","Aurora",m(x),$)}
        ${O("solar_wind","Solar wind",m(v),b,T)}
        ${O("imf_bz","IMF Bz",m(M),H,U)}
        ${O("xray","X-ray",m(k),y,V)}
      </div>
      ${o?Ae(t,o,r,i):""}`:""}
      ${N}
    </div>`}function Fe(t){var d,p,h,g;let{metrics:s}=t,e=(d=s.kp_history_1h)!=null?d:[],o=(p=s.wind_history_1h)!=null?p:[],a=(h=s.bz_history_1h)!=null?h:[],r=(g=s.xray_history_1h)!=null?g:[],i=ve(e),c=Dt(o.map(w=>{var u;return(u=w.kms)!=null?u:0}).filter(w=>w>0),o.map(w=>yt(w.t_utc)),"#5cce8c",28,!1),n=Dt(a.map(w=>w.bz),a.map(w=>yt(w.t_utc)),"#d4cc5c",28,!0),l=ye(r);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${n}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${c}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
    </div>`}function Oe(t){let s=we(t.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${m(s)}</span>
    </div>`}function Re(t){return t.map((s,e)=>e===0?(s+t[1])/2:e===t.length-1?(t[e-1]+s)/2:(t[e-1]+s+t[e+1])/3)}function Ie(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function Ne(t){return t>=5?"good":t>=3?"possible":"none"}function Gt(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function Pe(t){let s=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",e=Gt(t),o=s==="none"?"No aurora expected at mid-latitudes":e!=null?`Aurora possible equatorward of ~${e}\xB0 lat`:"Minor aurora possible at high latitudes",a=t>=7?"moderate":t>=5?"low":"none",r=a==="none"?"No significant HF degradation expected":a==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:a,label:"HF Radio",summary:r},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function De(t,s){var p;if(s<=0)return null;let e=(p=t.metrics.kp_forecast_3h)!=null?p:[];if(!e.length)return null;let o=Date.now()+s*36e5,a=e[0],r=1/0;for(let h of e){let g=Math.abs(new Date(h.t_utc).getTime()-o);g<r&&(r=g,a=h)}let i=a.kp,c=Ie(i),n=Ne(i),l=Gt(i),d=Pe(i);return{offsetH:s,kp:i,gScale:c,auroraLabel:n,auroraMinLat:l,impacts:d}}function Be(t,s,e,o){var J;let{forecast:a,metrics:r}=t,{kp_max_next_24h:i,kp_max_at_utc:c,trend:n}=a,l=((J=r.kp_forecast_3h)!=null?J:[]).slice(0,16),d=l.length,p=d*3,h=p>0?`${(s/p*100).toFixed(0)}%`:"0%",g=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",w="Kp forecast unavailable";if(i!=null){let S=ht(c),A=n==="rising"?"rising":n==="falling"?"falling":"steady";w=`Peak Kp ${i.toFixed(1)} next 24h${S?` at ${S}`:""} \xB7 ${A}`}let u=l.length?ht(l[0].t_utc):null,f=u?`Forecast \xB7 Next step ${u}`:"Forecast";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(f)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${m(w)}</div>`:""}
    </div>`;let $=320,x=38,b=14,v=x+b,_=$/d,H=S=>x-Math.max(2,Math.min(x-2,S/9*(x-2))),M="",C=l.map(S=>S.kp),y=Re(C);l.forEach((S,A)=>{let X=H(S.kp),O=x-X,N=A*_,q=N+_/2,R=S.kp>=6?"#e05c5c":S.kp>=5?"#e0a84a":S.kp>=4?"#d4cc5c":"#5cce8c",B=`Kp ${S.kp.toFixed(1)} \xB7 ${ht(S.t_utc)}`;if(M+=`<rect x="${N.toFixed(1)}" y="${X.toFixed(1)}" width="${(_-1.5).toFixed(1)}" height="${O.toFixed(1)}" fill="${R}" fill-opacity="0.85" rx="1.5"/>`,M+=`<rect x="${N.toFixed(1)}" y="0" width="${_.toFixed(1)}" height="${x}" fill="transparent"><title>${W(B)}</title></rect>`,d<=8||A%2===0){let P=new Date(S.t_utc).getHours();M+=`<text x="${q.toFixed(1)}" y="${(v-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${P.toString().padStart(2,"0")}</text>`}});let E=`<polyline points="${l.map((S,A)=>{let X=A*_+_/2,O=H(y[A]);return`${X.toFixed(1)},${O.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,T="";if(s>0&&d>0){let S=Math.min($-1,s/(d*3)*$);T=`
      <line x1="${S.toFixed(1)}" y1="0" x2="${S.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${S.toFixed(1)},${x} ${(S-4).toFixed(1)},${(x-7).toFixed(1)} ${(S+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let U=Math.round(p/4),V=Math.round(p/2),G=Math.round(p*3/4),F=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${m(g)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${U}h</span>
        <span class="hw-scrub-tick">+${V}h</span>
        <span class="hw-scrub-tick">+${G}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,K=e?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(e.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${e.kp.toFixed(1)} \xB7 ${e.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(f)}</span>
      </div>
      ${o?`
      ${K}
      <div class="hw-forecast-text">${m(w)}</div>
      <svg viewBox="0 0 ${$} ${v}" style="width:100%;height:${v}px;display:block" preserveAspectRatio="none">
        ${M}
        ${E}
        ${T}
      </svg>
      ${F}`:""}
    </div>`}function Ye(t){let s=/([NS])(\d+)([EW])(\d+)/i.exec(t);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Kt=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function je(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function We(t,s,e){let o=s/2,a=o*.87,r=s*.03,i=s*.009,c=t.map(n=>{var $,x;let l=Ye(n.location);if(!l||Math.abs(l.lon)>88||n.location.includes("*"))return"";let d=je(n);if(!e.has(d))return"";let p=Kt.find(b=>b.id===d).color,h=l.lat*Math.PI/180,g=l.lon*Math.PI/180,w=(o+a*Math.cos(h)*Math.sin(g)).toFixed(1),u=(o-a*Math.sin(h)).toFixed(1),f=`AR ${n.region} \xB7 ${n.location}
Class: ${($=n.spot_class)!=null?$:"\u2014"} / ${(x=n.mag_class)!=null?x:"\u2014"}
C: ${n.c_flare_probability}%  M: ${n.m_flare_probability}%  X: ${n.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${m(f)}</title>
      <circle cx="${w}" cy="${u}" r="${(r+i+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(i*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${w}" cy="${u}" r="${r.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${i.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${c}</svg>`}var Ue={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ge='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Ke="https://staging.nebulacast.app";function Xe(t,s){return!t||/^https?:\/\//.test(t)||t.startsWith("//")?t:(s!=null?s:Ke).replace(/\/$/,"")+(t.startsWith("/")?t:"/"+t)}var qe="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",mt=[{id:"eit171",label:"EIT 171",url:"/assets/gifs/current_eit_171.gif"},{id:"eit195",label:"EIT 195",url:"/assets/gifs/current_eit_195.gif"},{id:"eit284",label:"EIT 284",url:"/assets/gifs/current_eit_284.gif"},{id:"eit304",label:"EIT 304",url:"/assets/gifs/current_eit_304.gif"},{id:"cont",label:"Continuum",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg"},{id:"mag",label:"Magnetogram",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_mag/512/latest.jpg"}],Qe="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",_s=mt[0].url,Ve="https://sdo.gsfc.nasa.gov/assets/img/latest/mpeg/latest_512_0171.mp4",Ze=240;function Je(t,s){var l,d,p;let e=parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10),o=(d=t.metrics.xray_class)!=null?d:"A",a=t.metrics.xray_flux_wm2,r=a!=null?a.toExponential(2)+" W/m\xB2":"\u2014",c=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(h=>{let g=h.r===e,w=h.r<=e,u=w?h.color:"#1e2c30",f=g?"1":w?"0.5":"1",$=g?h.color:w?h.color+"99":"#566068",x=g?h.color:w?h.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${$}">R${h.r}</span>
      <div class="hw-radio-bbar" style="background:${u};opacity:${f}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${h.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${c}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=Ht[o])!=null?p:"#a0b4b8"}">${m(o)}-class</b> \xB7 ${m(r)}</div>
  </div>`}var Xt={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function qt(t){var c;let s=(c=t.metrics.kp_forecast_3h)!=null?c:[],e=Date.now(),o=e+24*60*60*1e3,a=s.filter(n=>{let l=new Date(n.t_utc).getTime();return l>=e-3*60*60*1e3&&l<=o});if(a.length===0)return{g1:0,g2:0,g3:0};let r=Math.max(...a.map(n=>n.kp)),i=n=>{if(r<n-.7)return 0;if(r>n+1)return 90;let l=(r-(n-.7))/1.7;return Math.round(Math.pow(Math.max(0,l),.7)*90)};return{g1:i(5),g2:i(6),g3:i(7)}}var Bt={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function ts(t){var l,d,p;let s=(l=t.metrics.kp_latest)!=null?l:0,e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,a=parseInt(((d=t.scales.g_scale)!=null?d:"G0").replace("G",""),10)||0,r=s>=5||a>=1,i=(p=t.metrics.kp_history_1h)!=null?p:[],c=0;if(i.length>=2&&(c=i[i.length-1].kp-i[i.length-2].kp),!r)return{active:!1,phase:"quiet",kp_current:s,kp_trend:c,bz_nt:e,solar_wind_kms:o};let n;return c>.3&&(e==null||e<-5)?n="rising":c<-.5?n="decline":n="peak",{active:!0,phase:n,kp_current:s,kp_trend:c,bz_nt:e,solar_wind_kms:o}}function es(t){if(!t.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],e=s.findIndex(c=>c.key===t.phase),o=Bt[t.phase],a=s[e].label,r=s.map((c,n)=>{let l=n===e,d=n<e,p=Bt[c.key],h=l?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:d?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",g=l?" hw-spi-dot-active":"",w=l?`color:${p};font-weight:700`:d?`color:${p}66`:"color:#2e4248",u=n<s.length-1?`<div class="hw-spi-arr">${d?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${g}" style="${h}"></div>
        <div class="hw-spi-txt" style="${w}">${c.label}</div>
      </div>${u}`}).join(""),i=[`Kp ${t.kp_current.toFixed(1)}`];return t.bz_nt!=null&&i.push(`Bz ${t.bz_nt>0?"+":""}${t.bz_nt.toFixed(1)} nT`),t.solar_wind_kms!=null&&i.push(`Wind ${Math.round(t.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${a}</span></div>
    <div class="hw-spi-track">${r}</div>
    <div class="hw-spi-params">${i.join(" \xB7 ")}</div>
  </div>`}function ss(t,s){let e=qt(t),o=ts(t),a=(()=>{var g;let l=(g=t.metrics.kp_forecast_3h)!=null?g:[],d=Date.now(),p=d+24*60*60*1e3,h=l.filter(w=>new Date(w.t_utc).getTime()<=p);return h.length?Math.max(...h.map(w=>w.kp)):null})(),i=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:l,label:d})=>{let p=e[l],h=Xt[l];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${h};${p===0?" opacity:.35":""}">${d}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${p}%;background:${h}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${p>0?h:"#607880"}">${p}%</span>
    </div>`}).join(""),c=a!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${a.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${es(o)}
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${i}</div>
    ${c?`<div class="hw-gstorm-footer">${c} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var vt={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},Qt={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function os(t){var y;let s=vt,e=(y=Qt[s.phase])!=null?y:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),a=280,r=52,i=10,c=r-6,n=r-18,l=.5,d=.19,p=k=>Math.exp(-Math.pow((k-l)/d,2)/2),h=k=>i+k*(a-2*i),g=k=>c-p(k)*n,w=80,u=[];for(let k=0;k<=w;k++){let E=k/w;u.push(`${k===0?"M":"L"}${h(E).toFixed(1)},${g(E).toFixed(1)}`)}let f=Math.round(s.progress_0_1*w),$=[];for(let k=0;k<=f;k++){let E=k/w;$.push(`${k===0?"M":"L"}${h(E).toFixed(1)},${g(E).toFixed(1)}`)}let x=h(s.progress_0_1),b=[`M${i},${c}`,...$.slice(1),`L${x.toFixed(1)},${c} Z`],v=g(s.progress_0_1),_=5,H=`M${x.toFixed(1)},${v.toFixed(1)} L${(x-_).toFixed(1)},${(v-_*1.8).toFixed(1)} L${(x+_).toFixed(1)},${(v-_*1.8).toFixed(1)} Z`,M=c+11;return`<div class="hw-impact-tip${t?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${m(s.cycle_name)}</div>
    <svg width="100%" height="${r+14}" viewBox="0 0 ${a} ${r+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${e}" opacity="0.12"/>
      <path d="${u.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${$.join(" ")}" fill="none" stroke="${e}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${i}" y1="${c}" x2="${a-i}" y2="${c}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${H}" fill="${e}"/>
      <text x="${i+2}" y="${M}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${h(.5).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(a-i-2).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${e}">${m(o)}</b>${s.subtitle?` \xB7 ${m(s.subtitle)}`:""}</div>
  </div>`}function Vt(t){var n,l,d,p,h;let s=(l=(n=t.coronal_hole)==null?void 0:n.estimated_speed_kms)!=null?l:t.metrics.solar_wind_kms,e=(d=t.coronal_hole)==null?void 0:d.status,o=s!=null?s:0,a=e!=null?e:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",r={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},i={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},c={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:a,color:r[a],label:i[a],desc:(h=(p=t.coronal_hole)==null?void 0:p.note)!=null?h:c[a],speed:s}}function ns(t,s){var l;let e=Vt(t),o=(l=e.speed)!=null?l:0,a=e.speed!=null?`${Math.round(e.speed)} km/s`:"\u2014",r=s?" hw-impact-tip-open":"",i=o>=420,c=kt("coronal_hole",{hssState:e,uid:"hss"}),n=i?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${r}">
    ${c}
    <div class="hw-hss-meta">Solar wind: <b style="color:${e.color}">${m(a)}</b> \xB7 ${m(e.desc)}</div>
    ${n}
  </div>`}function Zt(t){var a,r;let s=(a=t.scales.g_scale)!=null?a:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let i=(r=t.metrics.kp_forecast_3h)!=null?r:[],c=Date.now(),n=i.filter(l=>new Date(l.t_utc).getTime()<=c+3*60*60*1e3).sort((l,d)=>new Date(d.t_utc).getTime()-new Date(l.t_utc).getTime());n.length>0&&(o=n[0].kp)}return e>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:e>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function as(t,s){let e=Zt(t),o=s?" hw-impact-tip-open":"",r=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(n=>{let l=n.l===e.level,d=l?n.color:"#566068",p=l?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${d}">${n.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${n.width}%;background:${n.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${l?n.color:"transparent"}">${l?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",c={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${r}</div>
    <div class="hw-satdrag-meta">${i} \xB7 ${m(e.gScale)} \xB7 ${c[e.level]}</div>
  </div>`}function Jt(t){var l,d,p;let s=(l=t.scales.g_scale)!=null?l:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let h=(d=t.metrics.kp_forecast_3h)!=null?d:[],g=Date.now(),w=h.filter(u=>new Date(u.t_utc).getTime()<=g+3*60*60*1e3).sort((u,f)=>new Date(f.t_utc).getTime()-new Date(u.t_utc).getTime());w.length>0&&(o=w[0].kp)}let a=0;e>=2||o!=null&&o>=6?a=2:(e>=1||o!=null&&o>=4)&&(a=1);let r=parseInt(((p=t.scales.r_scale)!=null?p:"R0").slice(1),10),i=r>=2&&a<2;r>=2&&(a=Math.min(2,a+1));let c={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},n={0:"Low",1:"Moderate",2:"High"};return{level:a,color:c[a],label:n[a],kp:o,gScale:s,boostedByFlare:i}}function is(t,s){var l;let e=Jt(t),o=s?" hw-impact-tip-open":"",r=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(d=>{let p=d.l===e.level,h=p?d.color:"#566068",g=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${h}">${d.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${d.width}%;background:${d.color};opacity:${g}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?d.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",c={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},n=e.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${r}</div>
    <div class="hw-gnss-meta">${i} \xB7 ${m(e.gScale)} \xB7 ${c[e.level]}</div>
    ${n}
  </div>`}function te(t){var a;let s=t.metrics.pressure_npa,e=s!=null?s:null,o=(a=t.metrics.density)!=null?a:null;return e==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:e>=6?{pressure:e,color:"#e05c5c",label:"Extreme",density:o}:e>=4?{pressure:e,color:"#e0a84a",label:"Strong",density:o}:e>=2?{pressure:e,color:"#d4cc5c",label:"Elevated",density:o}:e>=1?{pressure:e,color:"#5cce8c",label:"Typical",density:o}:{pressure:e,color:"#7a9298",label:"Weak",density:o}}function rs(t,s){let e=te(t),o=s?" hw-impact-tip-open":"",a=e.pressure,r=200,i=6,c=10,n=i+c,l=n+4,d=l+11,p=n+9,h=d+4,w=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(y=>`<rect x="${y.x}" y="${i}" width="${y.w}" height="${c}" fill="${y.color}" opacity="0.55" rx="0"/>`).join(""),u=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],f=u.map(y=>`<line x1="${y.x}" y1="${n}" x2="${y.x}" y2="${l}" stroke="#3a5058" stroke-width="1"/>`).join(""),$=u.map(y=>`<text x="${y.x}" y="${d}" class="hw-swdp-axlabel" text-anchor="${y.anchor}">${y.label}</text>`).join(""),x="";if(a!=null){let k=Math.min(Math.max(a,0),8)/8*r;x=`<polygon points="${`${k-5},${p} ${k+5},${p} ${k},${n}`}" fill="${e.color}" opacity="0.95"/>
    <line x1="${k}" y1="${i}" x2="${k}" y2="${n}" stroke="${e.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${i}" width="${r}" height="${c}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,v=`<svg class="hw-swdp-gauge" viewBox="0 0 ${r} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${w}${b}${x}${f}${$}
  </svg>`,_=a!=null?`${a.toFixed(2)} nPa`:"\u2014",H=e.density!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",M=t.metrics.solar_wind_kms!=null?`${Math.round(t.metrics.solar_wind_kms)} km/s`:"\u2014",C=a==null?"":a>=4?" \xB7 Magnetosphere compressed":a>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${v}
    <div class="hw-swdp-meta"><b style="color:${e.color}">${m(_)}</b>${m(C)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${m(M)} \xB7 Density ${m(H)}</div>
  </div>`}function ee(t){var l,d;let s=(l=t.alerts_all)!=null?l:[],e=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),a=e!=null?e:o;if(!a)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let r=((d=a.raw_body)!=null?d:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),i=r?parseInt(r[1],10):null,c=null;if(i&&a.t_utc){let p=1496e5/i*1e3;c=new Date(new Date(a.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let n=e?"impact":"watch";return{status:n,color:n==="impact"?"#e05c5c":"#d4cc5c",label:n==="impact"?"Active":"Watch",speed_kms:i,issued_utc:a.t_utc,arrival_utc:c}}function ls(t,s){let e=ee(t),o=s?" hw-impact-tip-open":"",a="\u2014";if(e.arrival_utc){let n=new Date(e.arrival_utc),l=n.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),d=n.getUTCDate(),p=String(n.getUTCHours()).padStart(2,"0"),h=String(n.getUTCMinutes()).padStart(2,"0");a=`~${l}\xA0${d}\xA0${p}:${h}\u202FUTC`}let r=e.speed_kms?`${e.speed_kms}\u202Fkm/s`:"\u2014",i=e.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${m(r)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${m(a)}</b>`:"No Earth-directed CME in forecast window",c=kt("cme_cone",{cmeState:e,uid:"cme"});return`<div class="hw-impact-tip${o}">
    ${c}
    <div class="hw-cme-footer">${i}</div>
  </div>`}function cs(t,s,e,o,a,r,i,c,n){var at,rt,wt;let l=(rt=(at=s==null?void 0:s.impacts)!=null?at:t.observer_impacts)!=null?rt:[],d=l.map(z=>{var Et,At;let dt=(Et=he[z.level])!=null?Et:"#666",lt=z.level==="none"?"None":z.level.charAt(0).toUpperCase()+z.level.slice(1),pt=(At=Ue[z.kind])!=null?At:Ge,it=z.level==="none"?"#606870":dt,ct=z.kind==="solar_activity"?a:i.has(z.kind),_t=ct?" hw-impact-open":"",st;if(z.kind==="solar_activity"){let xt=a?" hw-solar-open":"",St=Kt.map(Q=>{let $t=r.has(Q.id),Mt=$t?Q.color+"22":"transparent",Ct=$t?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${Q.id}" style="color:${Q.color};border-color:${Q.color};background:${Mt};opacity:${Ct}">${Q.label}</button>`}).join("");st=`<div class="hw-solar-tip${xt}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${qe}" alt="Solar disk" loading="lazy" />
            ${e?We(e,Ze,r):""}
          </div>
          <div class="hw-solar-layers">${St}</div>
          <span class="hw-solar-tip-text">${m(z.summary)}</span>
        </div>`}else if(z.kind==="aurora"){let xt=ct?" hw-aurora-tip-open":"",St=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,Q=null;c&&n.lat!=null&&n.lon!=null&&(Q=Wt(c.entries,n.lat,n.lon));let $t=n.lat!=null&&n.lon!=null,Mt=Q!=null?Q>=30?"#5cce8c":Q>=10?"#d4cc5c":"#9ab4bc":"#607880",Ct=Q!=null?`${Q}%`:c?"n/a":"\u2026",oe=$t?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${n.locationName?m(n.locationName)+" \xB7 ":""}${n.lat.toFixed(1)}\xB0${n.lat>=0?"N":"S"} ${Math.abs(n.lon).toFixed(1)}\xB0${n.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${Mt}">Aurora: ${Ct}</span>
        </div>`:"";st=`<div class="hw-aurora-tip${xt}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${W(St)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Ut(n)}
          </div>
          ${oe}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else z.kind==="radio"?st=Je(t,ct):st=`<div class="hw-impact-tip${ct?" hw-impact-tip-open":""}">${m(z.summary)}</div>`;let ot=z.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${W(z.kind)}"`;return`<div class="hw-impact-row${_t}"${ot}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${it}">${pt}<span style="color:#b4c6cc">${m(z.label)}</span></span>
      <span class="hw-impact-badge" style="background:${dt}22;color:${dt}">${m(lt)}</span>
      ${st}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",h=l.length+8,g=o?"\u25BC":"\u25B6",w=h>0?`Observer Impacts (${h})`:"Observer Impacts",u=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}${p}</span>
    </div>`,f=i.has("geomag_storm"),$=qt(t),x=$.g1,b=$.g1>=30?Xt.g1:$.g1>0?"#7a9298":"#607880",v=x>0?`G1 ${x}%`:"None",H=`<div class="hw-impact-row${f?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${b}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span><span style="color:#607880;font-size:.85em;font-weight:normal"> \u2014 Next 24h</span></span>
      <span class="hw-impact-badge" style="background:${b}22;color:${b}">${v}</span>
      ${ss(t,f)}
    </div>`,M=i.has("solar_cycle"),C=(wt=Qt[vt.phase])!=null?wt:"#96a8b8",y=vt.phase.charAt(0).toUpperCase()+vt.phase.slice(1),E=`<div class="hw-impact-row${M?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${C}22;color:${C}">${y}</span>
      ${os(M)}
    </div>`,T=Vt(t),U=i.has("hss"),G=`<div class="hw-impact-row${U?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${T.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${T.color}22;color:${T.color}">${T.label}</span>
      ${ns(t,U)}
    </div>`,F=Zt(t),K=i.has("sat_drag"),S=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${F.color}22;color:${F.color}">${F.label}</span>
      ${as(t,K)}
    </div>`,A=Jt(t),X=i.has("gnss"),N=`<div class="hw-impact-row${X?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${A.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${A.color}22;color:${A.color}">${A.label}</span>
      ${is(t,X)}
    </div>`,q=te(t),R=i.has("sw_pressure"),B=q.pressure!=null?`${q.pressure.toFixed(2)} nPa`:"\u2014",P=`<div class="hw-impact-row${R?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${q.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${q.color}22;color:${q.color}">${B}</span>
      ${rs(t,R)}
    </div>`,j=ee(t),Z=i.has("cme_cone"),L=`<div class="hw-impact-row${Z?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${j.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${j.color}22;color:${j.color}">${m(j.label)}</span>
      ${ls(t,Z)}
    </div>`,I=gt(t),D=i.has("magnetosphere"),et=`<div class="hw-impact-row${D?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${I.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${I.color}22;color:${I.color}">${m(I.label)}</span>
      ${He(t,D)}
    </div>`;return`
    <div class="hw-impacts">
      ${u}
      ${o?d+H+et+E+G+S+N+P+L:""}
    </div>`}var Yt={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function ds(t,s){var n,l;let e=(n=me[t.level])!=null?n:"#666",o=t.level.charAt(0).toUpperCase()+t.level.slice(1),a=(l=Yt[t.kind])!=null?l:Yt.unknown,r=[xe(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),i=s&&t.raw_body?`<div class="hw-alert-body">${m(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${e}" data-alert-key="${W(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${e}">${a}</span>
      <span class="hw-alert-level" style="color:${e}">${m(o)}</span>
      <span class="hw-alert-title">${m(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${m(t.summary_short)}</div>
    <div class="hw-alert-meta">${m(r)}</div>
    ${i}
  </div>`}var ps={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},hs="#4ae0a4";function ms(t){let s=(e,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${e}</svg>`;switch(t){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function us(t){var o;let s=(o=t.metadata)!=null?o:{},e=[];return s.source_code&&e.push(`Code: ${s.source_code}`),s.model&&e.push(`Model: ${String(s.model).toUpperCase()}`),e.length===0?"":`
${e.join(" \xB7 ")}`}function gs(t,s,e){var n;let o=t.is_active?hs:(n=ps[t.level])!=null?n:"#445c64",a=t.event_time===e,r=t.event_time.slice(11,16)+" UTC",i=t.source==="NASA_DONKI"?"DONKI":"SWPC",c=a?`<div class="hw-tl-detail">${m(t.description)}${m(us(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${W(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${r}</span>
          <span class="hw-tl-src">${i}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${ms(t.event_type)} ${m(t.event_title)}
        </div>
        ${c}
      </div>
    </div>`}function ws(t,s,e,o){var $,x;let a=($=t.timeline)!=null?$:[],r=Date.now(),i=new Date(r).toISOString().slice(0,10),c=new Date(r-864e5).toISOString().slice(0,10),n=new Date(r-1728e5).toISOString().slice(0,10),l=new Set([i,c,n]),d=a.filter(b=>{var v;return l.has(((v=b.event_time)!=null?v:"").slice(0,10))}).slice().reverse(),p=d.length,h=e?"\u25BC":"\u25B6",g=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",w=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${h}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!e||p===0)return`<div class="hw-timeline">${w}</div>`;let u=new Map;for(let b of d){let v=((x=b.event_time)!=null?x:"").slice(0,10);u.has(v)||u.set(v,[]),u.get(v).push(b)}let f=[...u.entries()].map(([b,v])=>{let H=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=o.has(b),C=M?"\u25B6":"\u25BC",y=M?`<span class="hw-tl-day-count">${v.length} events</span>`:"",k=`
      <div class="hw-tl-day-row" data-tl-day="${W(b)}">
        <span class="hw-section-caret">${C}</span>
        <span class="hw-tl-date">${H}</span>
        ${y}
      </div>`,E=M?"":v.map((T,U)=>gs(T,U<v.length-1,s)).join("");return`<div class="hw-tl-group">${k}${E}</div>`}).join("");return`
    <div class="hw-timeline">
      ${w}
      ${f}
    </div>`}function xs(t,s,e){var l;let o=(l=t.alerts_all)!=null?l:[],a=o.length,r=s?"\u25BC":"\u25B6",i=a>0?`SWPC Alerts (${a})`:"SWPC Alerts",c=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${r}</span>
        <span class="hw-alerts-label">${i}</span>
      </div>
    </div>`;if(!s||a===0)return`<div class="hw-alerts">${c}${s&&a===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let n=o.map(d=>ds(d,d.dedupe_key===e)).join("");return`
    <div class="hw-alerts">
      ${c}
      ${n}
    </div>`}function $s(t,s){var V,G,F;let e=t.cme_tracker;if(!e)return"";let o=(V=ue[e.impact_level])!=null?V:"#96a8b8",a=(G=ge[e.status])!=null?G:e.status,r=300,i=44,c=18,n=i/2,l=10,d=r-18,p=7,h=`<line x1="${c+l}" y1="${n}" x2="${d-p}" y2="${n}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${c}" cy="${n}" r="${l}" fill="#f0c040" opacity="0.92"/>`,w=`
    <circle cx="${d}" cy="${n}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${n}" r="2.5" fill="#fff" opacity="0.7"/>`,u=`<text x="${c}" y="${n+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,f=`<text x="${d}" y="${n+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,$="";if(e.progress!=null){let K=c+l+4,J=d-p-4,S=K+e.progress*(J-K),A=5;e.status==="arrival_window"?$=`
        <g transform="translate(${S.toFixed(1)},${n})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${A}" fill="${o}" opacity="0.92"/>
        </g>`:$=`<circle cx="${S.toFixed(1)}" cy="${n}" r="${A}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${r} ${i}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${h}
    ${g}${u}
    ${w}${f}
    ${$}
  </svg>`,b=Nt(e.arrival_time_utc),v=Nt(e.launch_time_utc),_=e.speed_kms!=null?`${Math.round(e.speed_kms)} km/s`:"\u2014",H=e.half_angle_deg!=null?`${e.half_angle_deg}\xB0`:"\u2014",M=(F=e.source_location)!=null?F:"\u2014",C=e.is_earth_direct?"Direct hit":"Glancing blow",y=e.progress!=null?`${Math.round(e.progress*100)}%`:"\u2014",k=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${m(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${m(_)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${m(e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${m(a)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${m(v)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${m(y)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${m(H)} \xB7 Source: ${m(M)} \xB7 ${m(C)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,E=s?"\u25BC":"\u25B6",T=e.impact_level==="unknown"?"Unrated":e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1),U=s?`${x}${k}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${E}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${m(a)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${m(T)} impact</span>
      </div>
      ${U}
    </div>`}function fs(t,s,e,o,a,r,i,c,n,l,d,p,h,g,w,u,f,$,x,b,v=0){var E;let _=De(t,a),H=(E=t.metrics.kp_history_1h)!=null?E:[],M=H.length?ht(H[H.length-1].t_utc):null,C=M?`Recent history \xB7 Last step ${M}`:"Recent history",y=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${e?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${W(C)}</span>
  </div></div>`,k=e?Fe(t):"";return`
    <div class="hw-root">
      ${Oe(t)}
      ${Te(t,e,g,o,_,x,b,v)}
      ${cs(t,_,w,d,u,f,$,b,x)}
      ${y}
      ${k}
      ${Be(t,a,_,h)}
      ${$s(t,p)}
      ${ws(t,c,n,l)}
      ${xs(t,r,i)}
    </div>`}function bs(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${m(t)}</div>
    </div>
  </div>`}function vs(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var jt="nc-helio-ui",Lt=class{constructor(s,e){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.solarChannelIdx=0;this.solarChannelAutoSet=!1;this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=e,this.loadUiState(),this.el.innerHTML=vs(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var l,d,p,h,g,w;let e=s.target;if(e.closest("[data-solar-prev]")){this.solarChannelIdx=(this.solarChannelIdx-1+mt.length)%mt.length,this.solarChannelAutoSet=!0,this.saveUiState(),this.render();return}if(e.closest("[data-solar-next]")){this.solarChannelIdx=(this.solarChannelIdx+1)%mt.length,this.solarChannelAutoSet=!0,this.saveUiState(),this.render();return}if(e.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(e.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(e.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(e.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.saveUiState(),this.render();return}if(e.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}let o=e.closest("[data-impact-row]");if(o){let u=(l=o.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(u)?this.expandedImpacts.delete(u):this.expandedImpacts.add(u),this.saveUiState(),this.render();return}let a=e.closest("[data-solar-layer]");if(a){let u=(d=a.dataset.solarLayer)!=null?d:"";this.solarLayers.has(u)?this.solarLayers.delete(u):this.solarLayers.add(u),this.saveUiState(),this.render();return}if(e.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(e.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let r=e.closest("[data-alert-key]");if(r){let u=(p=r.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===u?null:u,this.render();return}if(e.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let u=Date.now();this.collapsedDays=new Set([new Date(u).toISOString().slice(0,10),new Date(u-864e5).toISOString().slice(0,10),new Date(u-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let i=e.closest("[data-tl-day]");if(i){let u=(h=i.dataset.tlDay)!=null?h:"";this.collapsedDays.has(u)?this.collapsedDays.delete(u):this.collapsedDays.add(u),this.saveUiState(),this.render();return}let c=e.closest("[data-timeline-key]");if(c){let u=(g=c.dataset.timelineKey)!=null?g:null;this.expandedTimelineKey=this.expandedTimelineKey===u?null:u,this.render();return}if(e.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let n=e.closest("[data-kpi]");if(n){let u=(w=n.dataset.kpi)!=null?w:null;this.activePopover=this.activePopover===u?null:u,this.render();return}if(e.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}e.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(s){let e=s.target;if(!e.matches("[data-scrub]"))return;let o=parseFloat(e.value);this.scrubOffset=o,e.style.setProperty("--pct",`${(o/parseFloat(e.max)*100).toFixed(0)}%`);let a=this.el.querySelector(".hw-scrub-title");a&&(a.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s,e,o,a;try{let r=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);if(this.data=await r.json(),!this.solarChannelAutoSet){let i={quiet:1,active:0,elevated:2,storm:3};this.solarChannelIdx=(o=i[(e=(s=this.data.summary)==null?void 0:s.status)!=null?e:"quiet"])!=null?o:0,this.solarChannelAutoSet=!0}this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(r){let i=r instanceof Error?r.message:String(r);this.el.innerHTML=bs(`Space weather data unavailable (${i})`)}finally{this.timer=setTimeout(()=>this.fetch(),(a=this.opts.refreshMs)!=null?a:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let e=await s.json(),o=new Map;for(let a of e){let r=o.get(a.region),i=a.area!=null,c=(r==null?void 0:r.area)!=null;(!r||!c&&i||c===i&&a.observed_date>r.observed_date)&&o.set(a.region,a)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,e,o,a,r,i;if(!(this.opts.lat==null||this.opts.lon==null))try{let c=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!c.ok)return;let n=await c.json(),d=((o=(e=(s=n.coordinates)!=null?s:n.Data)!=null?e:n.data)!=null?o:[]).map(([p,h,g])=>({lon:p,lat:h,prob:g}));this.ovationData={entries:d,forecastTime:String((i=(r=(a=n["Forecast Time"])!=null?a:n.forecast_time)!=null?r:n["Observation Time"])!=null?i:"")},this.render()}catch(c){}}render(){this.data&&(this.el.innerHTML=fs(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData,this.solarChannelIdx))}saveUiState(){try{localStorage.setItem(jt,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,indicatorsOpen:this.indicatorsOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],expandedImpacts:[...this.expandedImpacts]}))}catch(s){}}loadUiState(){try{let s=localStorage.getItem(jt);if(!s)return;let e=JSON.parse(s);typeof e.expanded=="boolean"&&(this.expanded=e.expanded),typeof e.heroExpanded=="boolean"&&(this.heroExpanded=e.heroExpanded),typeof e.alertsExpanded=="boolean"&&(this.alertsExpanded=e.alertsExpanded),typeof e.timelineOpen=="boolean"&&(this.timelineOpen=e.timelineOpen),typeof e.impactsOpen=="boolean"&&(this.impactsOpen=e.impactsOpen),typeof e.cmeExpanded=="boolean"&&(this.cmeExpanded=e.cmeExpanded),typeof e.forecastOpen=="boolean"&&(this.forecastOpen=e.forecastOpen),typeof e.indicatorsOpen=="boolean"&&(this.indicatorsOpen=e.indicatorsOpen),typeof e.solarExpanded=="boolean"&&(this.solarExpanded=e.solarExpanded),Array.isArray(e.collapsedDays)&&(this.collapsedDays=new Set(e.collapsedDays)),Array.isArray(e.solarLayers)&&(this.solarLayers=new Set(e.solarLayers)),Array.isArray(e.expandedImpacts)&&(this.expandedImpacts=new Set(e.expandedImpacts))}catch(s){}}updateLocation(s,e,o){this.opts=Rt(Ot({},this.opts),{lat:s,lon:e,locationName:o}),this.render()}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},se={mount(t,s){return be(),new Lt(t,s)}};typeof window!="undefined"&&(window.HelioWidget=se);return pe(ys);})();
