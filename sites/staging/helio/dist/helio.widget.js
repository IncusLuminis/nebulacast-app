"use strict";var HelioWidgetModule=(()=>{var wt=Object.defineProperty;var Xt=Object.getOwnPropertyDescriptor;var Yt=Object.getOwnPropertyNames;var qt=Object.prototype.hasOwnProperty;var Vt=(t,s)=>{for(var e in s)wt(t,e,{get:s[e],enumerable:!0})},Zt=(t,s,e,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of Yt(s))!qt.call(t,n)&&n!==e&&wt(t,n,{get:()=>s[n],enumerable:!(o=Xt(s,n))||o.enumerable});return t};var Qt=t=>Zt(wt({},"__esModule",{value:!0}),t);var is={};Vt(is,{HelioWidget:()=>Bt});var kt={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Jt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},te={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},ft={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},ee={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},se={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function oe(t){if(!t)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(t).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let e=Math.floor(s/60);return e<24?`Updated ${e}h ago`:`Updated ${Math.floor(e/24)}d ago`}catch(s){return"Updated recently"}}function ne(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function et(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t}}function pt(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return t.slice(11,16)}}function _t(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return t}}function W(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function m(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ae(t){return parseInt(t.slice(1),10)>0}var ie=`
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
.hw-solar-mini-switcher{display:flex;align-items:center;gap:3px;margin-top:3px}
.hw-solar-mini-btn{background:none;border:none;color:#607880;font-size:.75em;cursor:pointer;padding:0 2px;line-height:1;transition:color .12s;font-family:inherit}
.hw-solar-mini-btn:hover{color:#b4c6cc}
.hw-solar-mini-lbl{font-size:.60em;color:#96a8b8;letter-spacing:.02em;min-width:52px;text-align:center;font-weight:600}
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
`,St=!1;function re(){if(St)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=ie,document.head.appendChild(t),St=!0}function le(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.length,n=s/o,d=t.map((i,r)=>{let a=Math.max(2,Math.min(e,i.kp/9*e)),l=e-a,c=r*n,p=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${l.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${m(pt(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">${d}</svg>`}function Mt(t,s,e,o,n){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let d=200,i=Math.min(...t),r=Math.max(...t),a=r-i||1,l=g=>o-2-(g-i)/a*(o-4),c=t.map((g,w)=>`${(w/(t.length-1)*d).toFixed(1)},${l(g).toFixed(1)}`).join(" "),p="";if(n&&i<0&&r>0){let g=l(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${d}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let h=t.map((g,w)=>`<rect x="${(w/(t.length-1)*d-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${m(s[w]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${d} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${c}" fill="none" stroke="${e}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${h}
  </svg>`}function ce(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,e=32,o=t.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),n=Math.min(...o),i=Math.max(...o)-n||1,r=c=>e-2-(c-n)/i*(e-4),a=o.map((c,p)=>`${(p/(o.length-1)*s).toFixed(1)},${r(c).toFixed(1)}`).join(" "),l=t.map((c,p)=>{let h=p/(o.length-1)*s,g=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(h-4).toFixed(1)}" y="0" width="8" height="${e}" fill="transparent"><title>${m(pt(c.t_utc))} \xB7 ${g}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${e}" style="width:100%;height:${e}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function ot(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function de(t){var l;let s=(l=t.metrics.wind_history_1h)!=null?l:[],e=s[s.length-1],o=t.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",d=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",i=(e==null?void 0:e.density)!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",r=(e==null?void 0:e.temp_kk)!=null?`${e.temp_kk.toFixed(0)} kK`:"\u2014",a=(e==null?void 0:e.pressure_npa)!=null?`${e.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ot("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${m(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${m(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function pe(t){var r,a;let s=(r=t.metrics.xray_class)!=null?r:"A",e=t.metrics.xray_flux_wm2,o=e!=null?e.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],d=n.map(l=>{let c=l.label===s,p=c?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${c?"cc":"44"}">${p}</div>`}).join(""),i=n.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===s?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ot("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${d}</div>
      <div class="hw-xray-scale-labels">${i}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=ft[s])!=null?a:"#a0b4b8"}">${m(s)}-class</b> \xB7 ${m(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function he(t){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(b=>{let y=100+b/20*100;return`<line x1="${y.toFixed(1)}" y1="16" x2="${y.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),c='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${l}${c}</svg>`;let p=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",h=Math.max(-20,Math.min(20,t)),g=100+h/20*100,w=3,u=h<0?g-w:100-w,_=Math.max(2*w,Math.abs(g-100)+2*w),f=`<rect x="${u.toFixed(1)}" y="16" width="${_.toFixed(1)}" height="6" rx="${w}" fill="${p}" opacity="0.82"/>`,x=5,$=15,v=$-x*1.1,k=`<polygon points="${g.toFixed(1)},${$.toFixed(1)} ${(g-x).toFixed(1)},${v.toFixed(1)} ${(g+x).toFixed(1)},${v.toFixed(1)}" fill="${p}"/>`,z=`<line x1="${g.toFixed(1)}" y1="${$.toFixed(1)}" x2="${g.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,L=`<text x="${g.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${l}${c}${f}${k}${z}${L}
  </svg>`}function me(t){var h;let s=t.metrics.imf_bz_nt,e=t.metrics.imf_bt_nt,o=t.metrics.solar_wind_kms,n=(h=t.metrics.pressure_npa)!=null?h:null,d=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",i=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",r=e!=null?e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=n!=null?`${n.toFixed(2)} nPa`:"\u2014",c=$t(t),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ot("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${he(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${m(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${m(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${m(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${c.color};font-weight:600">${m(c.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function $t(t){var a,l;let s=t.metrics.imf_bz_nt,e=(a=t.metrics.kp_latest)!=null?a:0,o=(l=t.metrics.solar_wind_kms)!=null?l:0,n,d,i;if(s!=null&&s<-5||e>=6)n="storm",d="#e05c5c",i="Storm conditions";else if(s!=null&&s<0||e>=4||o>=400){let c=s!=null&&s<0;n="active",d="#e0a84a",i=c?"Active coupling":"Elevated"}else n="stable",d="#5cce8c",i="Stable";let r;return s==null?r="Unknown":s>2?r="Closed":s>0?r="Minimal":s>-5?r="Moderate":s>-10?r="Strong":r="Very strong",{state:n,color:d,label:i,coupling:r}}function ue(t,s,e,o){let n=o?"mc":"mf",d=t.color,i=e!=null?e:0,r=i>500,a=i<350,l=r?.9:a?1.8:1.3;if(o){let w=45-(t.state==="storm"?11:t.state==="active"?16:21),u=t.state==="storm"?12:t.state==="active"?10:8,_=50-u,f=76,x=[`M ${w},25`,`C ${w-2},15 41,${u} 45,${u}`,`C 53,${u} ${f-8},${u+4} ${f},20`,`C ${f+1},23 ${f+1},27 ${f},30`,`C ${f-8},${_-4} 53,${_} 45,${_}`,`C 41,${_} ${w-2},35 ${w},25`,"Z"].join(" "),$=r?3:2,v=[14,25,36],k=b=>`<path d="M 0,${b} L ${r?8:6},${b} M ${r?6:4},${b-2} L ${r?8:6},${b} L ${r?6:4},${b+2}" stroke="${d}bb" stroke-width="${r?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,z=v.map(b=>k(b)).join(""),C=Array.from({length:$},(b,y)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/$*y).toFixed(2)}s">${z}</g>`).join(""),L=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${C}</g>
      <path d="${x}" fill="${d}14" stroke="${d}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${L}
    </svg>`}else{let f=t.state==="storm"?16:t.state==="active"?26:38,x=155-f,$=t.state==="storm"?22:t.state==="active"?30:40,v=120-$,k=240,z=[`M ${x},60`,`C ${x-4},42 150,${$} 155,${$}`,`C 173,${$} ${k-5},${$+18} ${k},60`,`C ${k-5},${v-18} 173,${v} 155,${v}`,`C 150,${v} ${x-4},78 ${x},60`,"Z"].join(" "),C=`M ${x+2},60 C ${x+2},${60-f*.4} 152,54 150,60 C 152,66 ${x+2},${60+f*.4} ${x+2},60 Z`,L=i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c",b=i>700?.4:i>500?.65:i>350?1.1:1.8,y=i>500?[10,24,40,57,74,90,106]:i>350?[14,34,57,82,104]:[20,50,82,108],T=16,H=22,P=x-6,A=Math.ceil((P-H)/T)+2,N=Array.from({length:A},(F,E)=>H-T+E*T),O=12,B=8,K=N.flatMap(F=>y.map(E=>`<path d="M ${F},${E} L ${F+O},${E} M ${F+B},${E-3} L ${F+O},${E} L ${F+B},${E+3}" stroke="${L}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),M=`<g class="hw-wg-full" style="animation-duration:${b}s">${K}</g>`,S=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',R=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="${H}" y="0" width="${P-H}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${n}-wclip)">${M}</g>
      <path d="${C}" fill="${d}08"/>
      <path d="${z}" fill="${d}12" stroke="${d}aa" stroke-width="1.2"/>
      <text x="${x+2}" y="${$-2}" font-size="7" fill="${d}" opacity=".8" font-family="sans-serif">${m(t.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${S}
      ${R}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function ge(t){let s=$t(t),e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=t.metrics.kp_latest,d=t.metrics.density,i=t.metrics.pressure_npa,r=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=d!=null?`${d.toFixed(1)} p/cm\xB3`:"\u2014",c=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",h=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",g=e!=null&&e<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":e!=null&&e<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ot("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${ue(s,e,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${m(r)}</span>
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
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function Ht(t,s,e){if(!t.length)return null;let o=(e%360+360)%360,n=-1,d=1/0,i=Math.cos(s*Math.PI/180);for(let r of t){let a=r.lat-s,l=(r.lon-o+180+360)%360-180,c=a*a+l*i*(l*i);c<d&&(d=c,n=r.prob)}return n>=0?n:null}function zt(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function we(t,s){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&t.lat!=null&&t.lon!=null&&(o=Ht(s.entries,t.lat,t.lon));let n=t.lat!=null&&t.lon!=null,d=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",i=o!=null?`${o}%`:s?"n/a":"\u2026",r=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?m(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${d}">Aurora: ${i}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ot("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${W(e)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${zt(t)}
    </div>
    ${r}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function xe(t,s,e,o){switch(s){case"solar_wind":return de(t);case"xray":return pe(t);case"imf_bz":return me(t);case"aurora":return we(e,o);case"magnetosphere":return ge(t);default:return""}}function ct(t,s){if(t.length<2)return"\u2192";let e=t[t.length-1],o=Math.max(0,t.length-4),n=t[o];if(!isFinite(e)||!isFinite(n))return"\u2192";let d=e-n;return d>s?"\u2191":d<-s?"\u2193":"\u2192"}function fe(t,s){let e=st[s],o=Ae;return`<div class="hw-solar-mini-wrap${t==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
    <div class="hw-solar-mini-inner">
      <img class="hw-solar-mini-img" src="${W(e.url)}" alt="${W(e.label)}"
        onerror="if(this.src!=='${W(o)}')this.src='${W(o)}'" />
      <video class="hw-solar-mini-video" autoplay loop muted playsinline
        oncanplay="this.style.opacity=1"
        aria-label="Solar disk \xB7 ${W(e.label)} \xB7 last 24h">
        <source src="${W(Re)}" type="video/mp4">
      </video>
    </div>
    <div class="hw-solar-mini-switcher">
      <button class="hw-solar-mini-btn" data-solar-prev>&#8249;</button>
      <span class="hw-solar-mini-lbl">${W(e.label)}</span>
      <button class="hw-solar-mini-btn" data-solar-next>&#8250;</button>
    </div>
  </div>`}function $e(t,s,e,o,n,d,i,r=0){var D,G,X,nt,V,Y,Q,ht;let{summary:a,scales:l,metrics:c,aurora_hint:p}=t,h=(D=kt[a.status])!=null?D:kt.quiet,g=n!=null?n.kp.toFixed(1):c.kp_latest!=null?c.kp_latest.toFixed(1):"\u2014",u=[n?n.gScale:l.g_scale,l.r_scale,l.s_scale].map(j=>{let q=ae(j),Z=q?`color:${h.accent};border-color:${h.accent}33`:"";return`<span class="hw-scale-chip${q?" hw-scale-active":""}" style="${Z}">${m(j)}</span>`}).join(""),_=n?n.auroraLabel:p.aurora_label,f=_==="good"?"#5cce8c":_==="possible"?"#d4cc5c":"#607880",x=_.charAt(0).toUpperCase()+_.slice(1),$="#b4c6cc",v=c.solar_wind_kms!=null?`${Math.round(c.solar_wind_kms)} km/s`:"\u2014",k=c.imf_bz_nt,z=k!=null?k<=-10?"#e05c5c":k<=-5?"#e0a84a":k>=5?"#5cce8c":"#a0b4b8":"#607880",C=k!=null?(k>=0?"+":"")+k.toFixed(1)+" nT":"\u2014",L=c.xray_class,b=L?(G=ft[L])!=null?G:"#a0b4b8":"#607880",y=L?`${L}-class`:"\u2014",T=ct(((X=c.kp_history_1h)!=null?X:[]).map(j=>j.kp),.5),H=ct(((nt=c.wind_history_1h)!=null?nt:[]).map(j=>j.kms),20),P=ct(((V=c.bz_history_1h)!=null?V:[]).map(j=>j.bz),1.5),A=ct(((Y=c.xray_history_1h)!=null?Y:[]).map(j=>Math.log10(j.flux+1e-9)),.15),N=(Q=c.kp_history_1h)!=null?Q:[],O=N.length?et(N[N.length-1].t_utc):null,B=O?`Recent history \xB7 Last step ${O}`:"Recent history",K=$t(t),M=(ht=c.kp_latest)!=null?ht:0,S=M>=5,R=S?`linear-gradient(160deg, #0d2a1a 0%, ${h.bg}22 75%)`:`${h.bg}18`,F=(j,q,Z,at,I)=>{let J=I?`<span class="hw-trend">${I}</span>`:"";return`<div class="hw-kpi-item${o===j?" hw-kpi-active":""}" data-kpi="${j}">
      <span class="hw-qd-label">${q}</span>
      <span class="hw-qd-value" style="color:${at}">${Z}${J}</span>
    </div>`},E=S?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${M.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${R}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${n?"color:#9acf60":""}">Kp <b>${m(g)}</b>${n?"":`<span class="hw-trend">${T}</span>`}</div>
          <span class="hw-status-badge" style="background:${h.accent}22;color:${h.accent};display:block;text-align:center">${m(a.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${u}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${m(a.text)}</div>
            ${fe(o,r)}
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${e?"0":"4px"}">
        <span class="hw-section-caret">${e?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${e?`
      <div class="hw-quick-details">
        ${F("aurora","Aurora",m(x),f)}
        ${F("solar_wind","Solar wind",m(v),$,H)}
        ${F("imf_bz","IMF Bz",m(C),z,P)}
        ${F("xray","X-ray",m(y),b,A)}
      </div>
      ${o?xe(t,o,d,i):""}`:""}
      ${E}
    </div>`}function be(t){var c,p,h,g;let{metrics:s}=t,e=(c=s.kp_history_1h)!=null?c:[],o=(p=s.wind_history_1h)!=null?p:[],n=(h=s.bz_history_1h)!=null?h:[],d=(g=s.xray_history_1h)!=null?g:[],i=le(e),r=Mt(o.map(w=>{var u;return(u=w.kms)!=null?u:0}).filter(w=>w>0),o.map(w=>pt(w.t_utc)),"#5cce8c",28,!1),a=Mt(n.map(w=>w.bz),n.map(w=>pt(w.t_utc)),"#d4cc5c",28,!0),l=ce(d);return`
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
    </div>`}function ve(t){let s=oe(t.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${m(s)}</span>
    </div>`}function ye(t){return t.map((s,e)=>e===0?(s+t[1])/2:e===t.length-1?(t[e-1]+s)/2:(t[e-1]+s+t[e+1])/3)}function ke(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function _e(t){return t>=5?"good":t>=3?"possible":"none"}function Tt(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function Se(t){let s=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",e=Tt(t),o=s==="none"?"No aurora expected at mid-latitudes":e!=null?`Aurora possible equatorward of ~${e}\xB0 lat`:"Minor aurora possible at high latitudes",n=t>=7?"moderate":t>=5?"low":"none",d=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:d},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Me(t,s){var p;if(s<=0)return null;let e=(p=t.metrics.kp_forecast_3h)!=null?p:[];if(!e.length)return null;let o=Date.now()+s*36e5,n=e[0],d=1/0;for(let h of e){let g=Math.abs(new Date(h.t_utc).getTime()-o);g<d&&(d=g,n=h)}let i=n.kp,r=ke(i),a=_e(i),l=Tt(i),c=Se(i);return{offsetH:s,kp:i,gScale:r,auroraLabel:a,auroraMinLat:l,impacts:c}}function Ce(t,s,e,o){var K;let{forecast:n,metrics:d}=t,{kp_max_next_24h:i,kp_max_at_utc:r,trend:a}=n,l=((K=d.kp_forecast_3h)!=null?K:[]).slice(0,16),c=l.length,p=c*3,h=p>0?`${(s/p*100).toFixed(0)}%`:"0%",g=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",w="Kp forecast unavailable";if(i!=null){let M=et(r),S=a==="rising"?"rising":a==="falling"?"falling":"steady";w=`Peak Kp ${i.toFixed(1)} next 24h${M?` at ${M}`:""} \xB7 ${S}`}let u=l.length?et(l[0].t_utc):null,_=u?`Forecast \xB7 Next step ${u}`:"Forecast";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(_)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${m(w)}</div>`:""}
    </div>`;let f=320,x=38,$=14,v=x+$,k=f/c,z=M=>x-Math.max(2,Math.min(x-2,M/9*(x-2))),C="",L=l.map(M=>M.kp),b=ye(L);l.forEach((M,S)=>{let R=z(M.kp),F=x-R,E=S*k,D=E+k/2,G=M.kp>=6?"#e05c5c":M.kp>=5?"#e0a84a":M.kp>=4?"#d4cc5c":"#5cce8c",X=`Kp ${M.kp.toFixed(1)} \xB7 ${et(M.t_utc)}`;if(C+=`<rect x="${E.toFixed(1)}" y="${R.toFixed(1)}" width="${(k-1.5).toFixed(1)}" height="${F.toFixed(1)}" fill="${G}" fill-opacity="0.85" rx="1.5"/>`,C+=`<rect x="${E.toFixed(1)}" y="0" width="${k.toFixed(1)}" height="${x}" fill="transparent"><title>${W(X)}</title></rect>`,c<=8||S%2===0){let V=new Date(M.t_utc).getHours();C+=`<text x="${D.toFixed(1)}" y="${(v-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${V.toString().padStart(2,"0")}</text>`}});let T=`<polyline points="${l.map((M,S)=>{let R=S*k+k/2,F=z(b[S]);return`${R.toFixed(1)},${F.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,H="";if(s>0&&c>0){let M=Math.min(f-1,s/(c*3)*f);H=`
      <line x1="${M.toFixed(1)}" y1="0" x2="${M.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${M.toFixed(1)},${x} ${(M-4).toFixed(1)},${(x-7).toFixed(1)} ${(M+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let P=Math.round(p/4),A=Math.round(p/2),N=Math.round(p*3/4),O=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${m(g)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${P}h</span>
        <span class="hw-scrub-tick">+${A}h</span>
        <span class="hw-scrub-tick">+${N}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,B=e?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(e.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${e.kp.toFixed(1)} \xB7 ${e.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(_)}</span>
      </div>
      ${o?`
      ${B}
      <div class="hw-forecast-text">${m(w)}</div>
      <svg viewBox="0 0 ${f} ${v}" style="width:100%;height:${v}px;display:block" preserveAspectRatio="none">
        ${C}
        ${T}
        ${H}
      </svg>
      ${O}`:""}
    </div>`}function Le(t){let s=/([NS])(\d+)([EW])(\d+)/i.exec(t);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Ft=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function He(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function ze(t,s,e){let o=s/2,n=o*.87,d=s*.03,i=s*.009,r=t.map(a=>{var f,x;let l=Le(a.location);if(!l||Math.abs(l.lon)>88||a.location.includes("*"))return"";let c=He(a);if(!e.has(c))return"";let p=Ft.find($=>$.id===c).color,h=l.lat*Math.PI/180,g=l.lon*Math.PI/180,w=(o+n*Math.cos(h)*Math.sin(g)).toFixed(1),u=(o-n*Math.sin(h)).toFixed(1),_=`AR ${a.region} \xB7 ${a.location}
Class: ${(f=a.spot_class)!=null?f:"\u2014"} / ${(x=a.mag_class)!=null?x:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${m(_)}</title>
      <circle cx="${w}" cy="${u}" r="${(d+i+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(i*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${w}" cy="${u}" r="${d.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${i.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${r}</svg>`}var Te={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Fe='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Ee="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",st=[{id:"eit171",label:"EIT 171",url:"https://soho.nascom.nasa.gov/data/realtime/eit_171/512/latest.jpg"},{id:"eit195",label:"EIT 195",url:"https://soho.nascom.nasa.gov/data/realtime/eit_195/512/latest.jpg"},{id:"eit284",label:"EIT 284",url:"https://soho.nascom.nasa.gov/data/realtime/eit_284/512/latest.jpg"},{id:"eit304",label:"EIT 304",url:"https://soho.nascom.nasa.gov/data/realtime/eit_304/512/latest.jpg"},{id:"cont",label:"Continuum",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg"},{id:"mag",label:"Magnetogram",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_mag/512/latest.jpg"}],Ae="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ls=st[0].url,Re="/data/sun_loop.mp4",Oe=240;function Ie(t,s){var l,c,p;let e=parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10),o=(c=t.metrics.xray_class)!=null?c:"A",n=t.metrics.xray_flux_wm2,d=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",r=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(h=>{let g=h.r===e,w=h.r<=e,u=w?h.color:"#1e2c30",_=g?"1":w?"0.5":"1",f=g?h.color:w?h.color+"99":"#566068",x=g?h.color:w?h.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${f}">R${h.r}</span>
      <div class="hw-radio-bbar" style="background:${u};opacity:${_}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${h.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${r}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=ft[o])!=null?p:"#a0b4b8"}">${m(o)}-class</b> \xB7 ${m(d)}</div>
  </div>`}var Et={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function At(t){var r;let s=(r=t.metrics.kp_forecast_3h)!=null?r:[],e=Date.now(),o=e+24*60*60*1e3,n=s.filter(a=>{let l=new Date(a.t_utc).getTime();return l>=e-3*60*60*1e3&&l<=o});if(n.length===0)return{g1:0,g2:0,g3:0};let d=Math.max(...n.map(a=>a.kp)),i=a=>{if(d<a-.7)return 0;if(d>a+1)return 90;let l=(d-(a-.7))/1.7;return Math.round(Math.pow(Math.max(0,l),.7)*90)};return{g1:i(5),g2:i(6),g3:i(7)}}var Ct={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function Pe(t){var l,c,p;let s=(l=t.metrics.kp_latest)!=null?l:0,e=t.metrics.imf_bz_nt,o=t.metrics.solar_wind_kms,n=parseInt(((c=t.scales.g_scale)!=null?c:"G0").replace("G",""),10)||0,d=s>=5||n>=1,i=(p=t.metrics.kp_history_1h)!=null?p:[],r=0;if(i.length>=2&&(r=i[i.length-1].kp-i[i.length-2].kp),!d)return{active:!1,phase:"quiet",kp_current:s,kp_trend:r,bz_nt:e,solar_wind_kms:o};let a;return r>.3&&(e==null||e<-5)?a="rising":r<-.5?a="decline":a="peak",{active:!0,phase:a,kp_current:s,kp_trend:r,bz_nt:e,solar_wind_kms:o}}function Ne(t){if(!t.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],e=s.findIndex(r=>r.key===t.phase),o=Ct[t.phase],n=s[e].label,d=s.map((r,a)=>{let l=a===e,c=a<e,p=Ct[r.key],h=l?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:c?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",g=l?" hw-spi-dot-active":"",w=l?`color:${p};font-weight:700`:c?`color:${p}66`:"color:#2e4248",u=a<s.length-1?`<div class="hw-spi-arr">${c?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${g}" style="${h}"></div>
        <div class="hw-spi-txt" style="${w}">${r.label}</div>
      </div>${u}`}).join(""),i=[`Kp ${t.kp_current.toFixed(1)}`];return t.bz_nt!=null&&i.push(`Bz ${t.bz_nt>0?"+":""}${t.bz_nt.toFixed(1)} nT`),t.solar_wind_kms!=null&&i.push(`Wind ${Math.round(t.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${d}</div>
    <div class="hw-spi-params">${i.join(" \xB7 ")}</div>
  </div>`}function De(t,s){let e=At(t),o=Pe(t),n=(()=>{var g;let l=(g=t.metrics.kp_forecast_3h)!=null?g:[],c=Date.now(),p=c+24*60*60*1e3,h=l.filter(w=>new Date(w.t_utc).getTime()<=p);return h.length?Math.max(...h.map(w=>w.kp)):null})(),i=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:l,label:c})=>{let p=e[l],h=Et[l];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${h};${p===0?" opacity:.35":""}">${c}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${p}%;background:${h}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${p>0?h:"#607880"}">${p}%</span>
    </div>`}).join(""),r=n!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${n.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${Ne(o)}
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${i}</div>
    ${r?`<div class="hw-gstorm-footer">${r} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var dt={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},Rt={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function Be(t){var b;let s=dt,e=(b=Rt[s.phase])!=null?b:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,d=52,i=10,r=d-6,a=d-18,l=.5,c=.19,p=y=>Math.exp(-Math.pow((y-l)/c,2)/2),h=y=>i+y*(n-2*i),g=y=>r-p(y)*a,w=80,u=[];for(let y=0;y<=w;y++){let T=y/w;u.push(`${y===0?"M":"L"}${h(T).toFixed(1)},${g(T).toFixed(1)}`)}let _=Math.round(s.progress_0_1*w),f=[];for(let y=0;y<=_;y++){let T=y/w;f.push(`${y===0?"M":"L"}${h(T).toFixed(1)},${g(T).toFixed(1)}`)}let x=h(s.progress_0_1),$=[`M${i},${r}`,...f.slice(1),`L${x.toFixed(1)},${r} Z`],v=g(s.progress_0_1),k=5,z=`M${x.toFixed(1)},${v.toFixed(1)} L${(x-k).toFixed(1)},${(v-k*1.8).toFixed(1)} L${(x+k).toFixed(1)},${(v-k*1.8).toFixed(1)} Z`,C=r+11;return`<div class="hw-impact-tip${t?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${m(s.cycle_name)}</div>
    <svg width="100%" height="${d+14}" viewBox="0 0 ${n} ${d+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${$.join(" ")}" fill="${e}" opacity="0.12"/>
      <path d="${u.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${f.join(" ")}" fill="none" stroke="${e}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${i}" y1="${r}" x2="${n-i}" y2="${r}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${z}" fill="${e}"/>
      <text x="${i+2}" y="${C}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${h(.5).toFixed(1)}" y="${C}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-i-2).toFixed(1)}" y="${C}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${e}">${m(o)}</b>${s.subtitle?` \xB7 ${m(s.subtitle)}`:""}</div>
  </div>`}function Ot(t){var a,l,c,p,h;let s=(l=(a=t.coronal_hole)==null?void 0:a.estimated_speed_kms)!=null?l:t.metrics.solar_wind_kms,e=(c=t.coronal_hole)==null?void 0:c.status,o=s!=null?s:0,n=e!=null?e:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",d={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},i={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},r={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:d[n],label:i[n],desc:(h=(p=t.coronal_hole)==null?void 0:p.note)!=null?h:r[n],speed:s}}function je(t,s){var K;let e=Ot(t),o=(K=e.speed)!=null?K:0,n=e.speed!=null?`${Math.round(e.speed)} km/s`:"\u2014",d=s?" hw-impact-tip-open":"",i=320,r=72,a=36,l=36,c=284,p=36,h=11,g=14,w=19,u=9,_=o>=500,f=o>=420,x=_?"#f5c540":f?"#c8a020":"#7a6010",$=_?"#f5c540":f?"#c8a020":"#3a3808",v=e.color,k=f?"0.9":"0.25",z=_?"0.18":f?"0.10":"0.04",C=[0,45,90,135,180,225,270,315].map(M=>{let S=M*Math.PI/180,R=(a+g*Math.cos(S)).toFixed(1),F=(l+g*Math.sin(S)).toFixed(1),E=(a+w*Math.cos(S)).toFixed(1),D=(l+w*Math.sin(S)).toFixed(1),G=M>300||M<60?"0.9":"0.5";return`<line x1="${R}" y1="${F}" x2="${E}" y2="${D}"
      stroke="${x}" stroke-width="1.6" stroke-linecap="round" opacity="${G}"/>`}).join(""),L=a+h+2,b=c-u-3,y=14,T=`${L},${l} ${b},${p-y} ${b},${p+y}`,H=b+1,P=`${H},${p-4} ${H+7},${p} ${H},${p+4}`,A=u,N=`
    <ellipse cx="${c}" cy="${p}" rx="${A}" ry="${(A*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${c}" y1="${p-A}" x2="${c}" y2="${p+A}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${c-A}" y1="${p}" x2="${c+A}" y2="${p}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.35"/>`,O=`<svg class="hw-hss-diagram" width="100%" height="${r}"
      viewBox="0 0 ${i} ${r}" preserveAspectRatio="none" aria-hidden="true">
    <!-- stream fan -->
    <polygon points="${T}" fill="${v}" opacity="${z}"/>
    <!-- dashed stream axis -->
    <line x1="${L}" y1="${l}" x2="${b-2}" y2="${p}"
          stroke="${v}" stroke-width="2" stroke-dasharray="5 3.5"
          stroke-linecap="round" opacity="${k}"/>
    <!-- arrow -->
    <polygon points="${P}" fill="${v}" opacity="${f?"0.9":"0.25"}"/>
    <!-- Sun glow ring -->
    <circle cx="${a}" cy="${l}" r="${h+6}" fill="none"
            stroke="${$}" stroke-width="1.5" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${a}" cy="${l}" r="${h}" fill="${x}" opacity="0.92"/>
    ${C}
    <!-- Earth body -->
    <circle cx="${c}" cy="${p}" r="${A}" fill="#1a4a6e" opacity="0.92"/>
    ${N}
    <!-- labels -->
    <text x="${a}" y="${r-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${c}" y="${r-4}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
  </svg>`,B=f?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${d}">
    ${O}
    <div class="hw-hss-meta">Solar wind: <b style="color:${e.color}">${m(n)}</b> \xB7 ${m(e.desc)}</div>
    ${B}
  </div>`}function It(t){var n,d;let s=(n=t.scales.g_scale)!=null?n:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let i=(d=t.metrics.kp_forecast_3h)!=null?d:[],r=Date.now(),a=i.filter(l=>new Date(l.t_utc).getTime()<=r+3*60*60*1e3).sort((l,c)=>new Date(c.t_utc).getTime()-new Date(l.t_utc).getTime());a.length>0&&(o=a[0].kp)}return e>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:e>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function We(t,s){let e=It(t),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(a=>{let l=a.l===e.level,c=l?a.color:"#566068",p=l?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${c}">${a.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${a.width}%;background:${a.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${l?a.color:"transparent"}">${l?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",r={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${d}</div>
    <div class="hw-satdrag-meta">${i} \xB7 ${m(e.gScale)} \xB7 ${r[e.level]}</div>
  </div>`}function Pt(t){var l,c,p;let s=(l=t.scales.g_scale)!=null?l:"G0",e=parseInt(s.slice(1),10),o=t.metrics.kp_latest;if(o==null){let h=(c=t.metrics.kp_forecast_3h)!=null?c:[],g=Date.now(),w=h.filter(u=>new Date(u.t_utc).getTime()<=g+3*60*60*1e3).sort((u,_)=>new Date(_.t_utc).getTime()-new Date(u.t_utc).getTime());w.length>0&&(o=w[0].kp)}let n=0;e>=2||o!=null&&o>=6?n=2:(e>=1||o!=null&&o>=4)&&(n=1);let d=parseInt(((p=t.scales.r_scale)!=null?p:"R0").slice(1),10),i=d>=2&&n<2;d>=2&&(n=Math.min(2,n+1));let r={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:r[n],label:a[n],kp:o,gScale:s,boostedByFlare:i}}function Ke(t,s){var l;let e=Pt(t),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(c=>{let p=c.l===e.level,h=p?c.color:"#566068",g=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${h}">${c.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${c.width}%;background:${c.color};opacity:${g}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?c.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),i=e.kp!=null?`Kp ${e.kp.toFixed(1)}`:"Kp \u2014",r={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=e.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((l=t.scales.r_scale)!=null?l:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${d}</div>
    <div class="hw-gnss-meta">${i} \xB7 ${m(e.gScale)} \xB7 ${r[e.level]}</div>
    ${a}
  </div>`}function Nt(t){var n;let s=t.metrics.pressure_npa,e=s!=null?s:null,o=(n=t.metrics.density)!=null?n:null;return e==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:e>=6?{pressure:e,color:"#e05c5c",label:"Extreme",density:o}:e>=4?{pressure:e,color:"#e0a84a",label:"Strong",density:o}:e>=2?{pressure:e,color:"#d4cc5c",label:"Elevated",density:o}:e>=1?{pressure:e,color:"#5cce8c",label:"Typical",density:o}:{pressure:e,color:"#7a9298",label:"Weak",density:o}}function Ue(t,s){let e=Nt(t),o=s?" hw-impact-tip-open":"",n=e.pressure,d=200,i=6,r=10,a=i+r,l=a+4,c=l+11,p=a+9,h=c+4,w=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(b=>`<rect x="${b.x}" y="${i}" width="${b.w}" height="${r}" fill="${b.color}" opacity="0.55" rx="0"/>`).join(""),u=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],_=u.map(b=>`<line x1="${b.x}" y1="${a}" x2="${b.x}" y2="${l}" stroke="#3a5058" stroke-width="1"/>`).join(""),f=u.map(b=>`<text x="${b.x}" y="${c}" class="hw-swdp-axlabel" text-anchor="${b.anchor}">${b.label}</text>`).join(""),x="";if(n!=null){let y=Math.min(Math.max(n,0),8)/8*d;x=`<polygon points="${`${y-5},${p} ${y+5},${p} ${y},${a}`}" fill="${e.color}" opacity="0.95"/>
    <line x1="${y}" y1="${i}" x2="${y}" y2="${a}" stroke="${e.color}" stroke-width="1.5" opacity="0.7"/>`}let $=`<rect x="0" y="${i}" width="${d}" height="${r}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,v=`<svg class="hw-swdp-gauge" viewBox="0 0 ${d} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${w}${$}${x}${_}${f}
  </svg>`,k=n!=null?`${n.toFixed(2)} nPa`:"\u2014",z=e.density!=null?`${e.density.toFixed(2)} cm\u207B\xB3`:"\u2014",C=t.metrics.solar_wind_kms!=null?`${Math.round(t.metrics.solar_wind_kms)} km/s`:"\u2014",L=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${v}
    <div class="hw-swdp-meta"><b style="color:${e.color}">${m(k)}</b>${m(L)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${m(C)} \xB7 Density ${m(z)}</div>
  </div>`}function Dt(t){var l,c;let s=(l=t.alerts_all)!=null?l:[],e=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=e!=null?e:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let d=((c=n.raw_body)!=null?c:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),i=d?parseInt(d[1],10):null,r=null;if(i&&n.t_utc){let p=1496e5/i*1e3;r=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let a=e?"impact":"watch";return{status:a,color:a==="impact"?"#e05c5c":"#d4cc5c",label:a==="impact"?"Active":"Watch",speed_kms:i,issued_utc:n.t_utc,arrival_utc:r}}function Ge(t,s){let e=Dt(t),o=s?" hw-impact-tip-open":"",n=320,d=80,i=24,r=40,a=268,l=296,c=a-i,p=S=>Math.tan(S*Math.PI/180),h=Math.round(p(9)*c),g=Math.round(p(6)*c),w=Math.round(p(3)*c),u=S=>`${i},${r} ${a},${r-S} ${a},${r+S}`,_=e.status==="impact"?r:e.status==="watch"?r+g+8:r,f=Math.min(d-14,Math.max(14,_)),x=Math.abs(f-r)<=w,$=Math.abs(f-r)<=g,v=Math.abs(f-r)<=h,k=x?"#e05c5c":$?"#d4cc5c":v?"#e0a84a":"#5cce8c",z=e.status!=="quiet"?`<polygon points="${u(h)}" fill="#253238" opacity="0.85"/>
       <polygon points="${u(g)}"   fill="#d4cc5c" opacity="0.14"/>
       <polygon points="${u(w)}" fill="#e0a84a" opacity="0.28"/>
       <line x1="${i+9}" y1="${r}" x2="${a-2}" y2="${r}"
             stroke="#3a5058" stroke-dasharray="3 3" stroke-width="1"/>`:`<line x1="${i+9}" y1="${r}" x2="${l-9}" y2="${r}"
             stroke="#1e2c30" stroke-dasharray="4 3" stroke-width="1"/>`,C=8,L=11,b=15,y="#f5c540",T=[0,45,90,135,180,225,270,315].map(S=>{let R=S*Math.PI/180,F=(i+L*Math.cos(R)).toFixed(1),E=(r+L*Math.sin(R)).toFixed(1),D=(i+b*Math.cos(R)).toFixed(1),G=(r+b*Math.sin(R)).toFixed(1),X=S<45||S>315?"0.9":"0.5";return`<line x1="${F}" y1="${E}" x2="${D}" y2="${G}"
      stroke="${y}" stroke-width="1.4" stroke-linecap="round" opacity="${X}"/>`}).join(""),H=7,P=`
    <ellipse cx="${l}" cy="${f}" rx="${H}" ry="${(H*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>
    <line x1="${l}" y1="${f-H}" x2="${l}" y2="${f+H}"
          stroke="#4a8ab0" stroke-width="0.8" opacity="0.6"/>`,A="\u2014";if(e.arrival_utc){let S=new Date(e.arrival_utc),R=S.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),F=S.getUTCDate(),E=String(S.getUTCHours()).padStart(2,"0"),D=String(S.getUTCMinutes()).padStart(2,"0");A=`~${R}\xA0${F}\xA0${E}:${D}\u202FUTC`}let N=e.speed_kms?`${e.speed_kms}\u202Fkm/s`:"\u2014",O=e.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${m(N)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${m(A)}</b>`:"No Earth-directed CME in forecast window",B=x?"Direct impact likely":$?"Glancing blow possible":v?"Near outer edge":"Impact unlikely",K=x?"#e05c5c":$?"#d4cc5c":v?"#e0a84a":"#5cce8c",M=`<svg class="hw-cme-cone-svg" width="100%" height="${d}"
      viewBox="0 0 ${n} ${d}" preserveAspectRatio="none" aria-hidden="true">
    ${z}
    <!-- Sun glow -->
    <circle cx="${i}" cy="${r}" r="${C+5}" fill="none"
            stroke="${y}" stroke-width="1.2" opacity="0.25"/>
    <!-- Sun body -->
    <circle cx="${i}" cy="${r}" r="${C}" fill="${y}" opacity="0.92"/>
    ${T}
    <!-- Earth body -->
    <circle cx="${l}" cy="${f}" r="${H}" fill="#1a4a6e" opacity="0.92"/>
    ${P}
    <!-- Earth glow -->
    <circle cx="${l}" cy="${f}" r="${H+4}" fill="none"
            stroke="${k}" stroke-width="4" opacity="0.12"/>
    <!-- Labels -->
    <text x="${i}" y="${d-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Sun</text>
    <text x="${l}" y="${d-3}" font-size="8" fill="#607880"
          text-anchor="middle" font-family="inherit">Earth</text>
    ${e.status!=="quiet"?`<text x="${Math.round((i+l)/2)}" y="${d-3}" font-size="7.5"
               fill="${K}" text-anchor="middle" font-family="inherit">${m(B)}</text>`:""}
  </svg>`;return`<div class="hw-impact-tip${o}">
    ${M}
    <div class="hw-cme-footer">${O}</div>
  </div>`}function Xe(t,s,e,o,n,d,i,r,a){var q,Z,at;let l=(Z=(q=s==null?void 0:s.impacts)!=null?q:t.observer_impacts)!=null?Z:[],c=l.map(I=>{var vt,yt;let J=(vt=Jt[I.level])!=null?vt:"#666",bt=I.level==="none"?"None":I.level.charAt(0).toUpperCase()+I.level.slice(1),jt=(yt=Te[I.kind])!=null?yt:Fe,Wt=I.level==="none"?"#606870":J,it=I.kind==="solar_activity"?n:i.has(I.kind),Kt=it?" hw-impact-open":"",tt;if(I.kind==="solar_activity"){let rt=n?" hw-solar-open":"",mt=Ft.map(U=>{let lt=d.has(U.id),ut=lt?U.color+"22":"transparent",gt=lt?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${U.id}" style="color:${U.color};border-color:${U.color};background:${ut};opacity:${gt}">${U.label}</button>`}).join("");tt=`<div class="hw-solar-tip${rt}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Ee}" alt="Solar disk" loading="lazy" />
            ${e?ze(e,Oe,d):""}
          </div>
          <div class="hw-solar-layers">${mt}</div>
          <span class="hw-solar-tip-text">${m(I.summary)}</span>
        </div>`}else if(I.kind==="aurora"){let rt=it?" hw-aurora-tip-open":"",mt=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,U=null;r&&a.lat!=null&&a.lon!=null&&(U=Ht(r.entries,a.lat,a.lon));let lt=a.lat!=null&&a.lon!=null,ut=U!=null?U>=30?"#5cce8c":U>=10?"#d4cc5c":"#9ab4bc":"#607880",gt=U!=null?`${U}%`:r?"n/a":"\u2026",Gt=lt?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${a.locationName?m(a.locationName)+" \xB7 ":""}${a.lat.toFixed(1)}\xB0${a.lat>=0?"N":"S"} ${Math.abs(a.lon).toFixed(1)}\xB0${a.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${ut}">Aurora: ${gt}</span>
        </div>`:"";tt=`<div class="hw-aurora-tip${rt}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${W(mt)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${zt(a)}
          </div>
          ${Gt}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else I.kind==="radio"?tt=Ie(t,it):tt=`<div class="hw-impact-tip${it?" hw-impact-tip-open":""}">${m(I.summary)}</div>`;let Ut=I.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${W(I.kind)}"`;return`<div class="hw-impact-row${Kt}"${Ut}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${Wt}">${jt}<span style="color:#b4c6cc">${m(I.label)}</span></span>
      <span class="hw-impact-badge" style="background:${J}22;color:${J}">${m(bt)}</span>
      ${tt}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",h=l.length+7,g=o?"\u25BC":"\u25B6",w=h>0?`Observer Impacts (${h})`:"Observer Impacts",u=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}${p}</span>
    </div>`,_=i.has("geomag_storm"),f=At(t),x=f.g1,$=f.g1>=30?Et.g1:f.g1>0?"#7a9298":"#607880",v=x>0?`G1 ${x}%`:"None",z=`<div class="hw-impact-row${_?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${$}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span><span style="color:#607880;font-size:.85em;font-weight:normal"> \u2014 Next 24h</span></span>
      <span class="hw-impact-badge" style="background:${$}22;color:${$}">${v}</span>
      ${De(t,_)}
    </div>`,C=i.has("solar_cycle"),L=(at=Rt[dt.phase])!=null?at:"#96a8b8",b=dt.phase.charAt(0).toUpperCase()+dt.phase.slice(1),T=`<div class="hw-impact-row${C?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${L}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${L}22;color:${L}">${b}</span>
      ${Be(C)}
    </div>`,H=Ot(t),P=i.has("hss"),N=`<div class="hw-impact-row${P?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${H.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${H.color}22;color:${H.color}">${H.label}</span>
      ${je(t,P)}
    </div>`,O=It(t),B=i.has("sat_drag"),M=`<div class="hw-impact-row${B?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${O.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${O.color}22;color:${O.color}">${O.label}</span>
      ${We(t,B)}
    </div>`,S=Pt(t),R=i.has("gnss"),E=`<div class="hw-impact-row${R?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${S.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${S.color}22;color:${S.color}">${S.label}</span>
      ${Ke(t,R)}
    </div>`,D=Nt(t),G=i.has("sw_pressure"),X=D.pressure!=null?`${D.pressure.toFixed(2)} nPa`:"\u2014",V=`<div class="hw-impact-row${G?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${D.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${D.color}22;color:${D.color}">${X}</span>
      ${Ue(t,G)}
    </div>`,Y=Dt(t),Q=i.has("cme_cone"),j=`<div class="hw-impact-row${Q?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${Y.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${Y.color}22;color:${Y.color}">${m(Y.label)}</span>
      ${Ge(t,Q)}
    </div>`;return`
    <div class="hw-impacts">
      ${u}
      ${o?c+z+T+N+M+E+V+j:""}
    </div>`}var Lt={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Ye(t,s){var a,l;let e=(a=te[t.level])!=null?a:"#666",o=t.level.charAt(0).toUpperCase()+t.level.slice(1),n=(l=Lt[t.kind])!=null?l:Lt.unknown,d=[ne(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),i=s&&t.raw_body?`<div class="hw-alert-body">${m(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${e}" data-alert-key="${W(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${e}">${n}</span>
      <span class="hw-alert-level" style="color:${e}">${m(o)}</span>
      <span class="hw-alert-title">${m(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${m(t.summary_short)}</div>
    <div class="hw-alert-meta">${m(d)}</div>
    ${i}
  </div>`}var qe={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Ve="#4ae0a4";function Ze(t){let s=(e,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${e}</svg>`;switch(t){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function Qe(t){var o;let s=(o=t.metadata)!=null?o:{},e=[];return s.source_code&&e.push(`Code: ${s.source_code}`),s.model&&e.push(`Model: ${String(s.model).toUpperCase()}`),e.length===0?"":`
${e.join(" \xB7 ")}`}function Je(t,s,e){var a;let o=t.is_active?Ve:(a=qe[t.level])!=null?a:"#445c64",n=t.event_time===e,d=t.event_time.slice(11,16)+" UTC",i=t.source==="NASA_DONKI"?"DONKI":"SWPC",r=n?`<div class="hw-tl-detail">${m(t.description)}${m(Qe(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${W(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${d}</span>
          <span class="hw-tl-src">${i}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${Ze(t.event_type)} ${m(t.event_title)}
        </div>
        ${r}
      </div>
    </div>`}function ts(t,s,e,o){var f,x;let n=(f=t.timeline)!=null?f:[],d=Date.now(),i=new Date(d).toISOString().slice(0,10),r=new Date(d-864e5).toISOString().slice(0,10),a=new Date(d-1728e5).toISOString().slice(0,10),l=new Set([i,r,a]),c=n.filter($=>{var v;return l.has(((v=$.event_time)!=null?v:"").slice(0,10))}).slice().reverse(),p=c.length,h=e?"\u25BC":"\u25B6",g=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",w=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${h}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!e||p===0)return`<div class="hw-timeline">${w}</div>`;let u=new Map;for(let $ of c){let v=((x=$.event_time)!=null?x:"").slice(0,10);u.has(v)||u.set(v,[]),u.get(v).push($)}let _=[...u.entries()].map(([$,v])=>{let z=new Date($+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),C=o.has($),L=C?"\u25B6":"\u25BC",b=C?`<span class="hw-tl-day-count">${v.length} events</span>`:"",y=`
      <div class="hw-tl-day-row" data-tl-day="${W($)}">
        <span class="hw-section-caret">${L}</span>
        <span class="hw-tl-date">${z}</span>
        ${b}
      </div>`,T=C?"":v.map((H,P)=>Je(H,P<v.length-1,s)).join("");return`<div class="hw-tl-group">${y}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${w}
      ${_}
    </div>`}function es(t,s,e){var l;let o=(l=t.alerts_all)!=null?l:[],n=o.length,d=s?"\u25BC":"\u25B6",i=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",r=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${d}</span>
        <span class="hw-alerts-label">${i}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${r}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=o.map(c=>Ye(c,c.dedupe_key===e)).join("");return`
    <div class="hw-alerts">
      ${r}
      ${a}
    </div>`}function ss(t,s){var A,N,O;let e=t.cme_tracker;if(!e)return"";let o=(A=ee[e.impact_level])!=null?A:"#96a8b8",n=(N=se[e.status])!=null?N:e.status,d=300,i=44,r=18,a=i/2,l=10,c=d-18,p=7,h=`<line x1="${r+l}" y1="${a}" x2="${c-p}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${r}" cy="${a}" r="${l}" fill="#f0c040" opacity="0.92"/>`,w=`
    <circle cx="${c}" cy="${a}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${c}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,u=`<text x="${r}" y="${a+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,_=`<text x="${c}" y="${a+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,f="";if(e.progress!=null){let B=r+l+4,K=c-p-4,M=B+e.progress*(K-B),S=5;e.status==="arrival_window"?f=`
        <g transform="translate(${M.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${S}" fill="${o}" opacity="0.92"/>
        </g>`:f=`<circle cx="${M.toFixed(1)}" cy="${a}" r="${S}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${d} ${i}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${h}
    ${g}${u}
    ${w}${_}
    ${f}
  </svg>`,$=_t(e.arrival_time_utc),v=_t(e.launch_time_utc),k=e.speed_kms!=null?`${Math.round(e.speed_kms)} km/s`:"\u2014",z=e.half_angle_deg!=null?`${e.half_angle_deg}\xB0`:"\u2014",C=(O=e.source_location)!=null?O:"\u2014",L=e.is_earth_direct?"Direct hit":"Glancing blow",b=e.progress!=null?`${Math.round(e.progress*100)}%`:"\u2014",y=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${m($)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${m(k)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${m(e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${m(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${m(v)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${m(b)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${m(z)} \xB7 Source: ${m(C)} \xB7 ${m(L)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,T=s?"\u25BC":"\u25B6",H=e.impact_level==="unknown"?"Unrated":e.impact_level.charAt(0).toUpperCase()+e.impact_level.slice(1),P=s?`${x}${y}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${T}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${m(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${m(H)} impact</span>
      </div>
      ${P}
    </div>`}function os(t,s,e,o,n,d,i,r,a,l,c,p,h,g,w,u,_,f,x,$,v=0){var T;let k=Me(t,n),z=(T=t.metrics.kp_history_1h)!=null?T:[],C=z.length?et(z[z.length-1].t_utc):null,L=C?`Recent history \xB7 Last step ${C}`:"Recent history",b=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${e?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${W(L)}</span>
  </div></div>`,y=e?be(t):"";return`
    <div class="hw-root">
      ${ve(t)}
      ${$e(t,e,g,o,k,x,$,v)}
      ${Xe(t,k,w,c,u,_,f,$,x)}
      ${b}
      ${y}
      ${Ce(t,n,k,h)}
      ${ss(t,p)}
      ${ts(t,r,a,l)}
      ${es(t,d,i)}
    </div>`}function ns(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${m(t)}</div>
    </div>
  </div>`}function as(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var xt=class{constructor(s,e){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.solarChannelIdx=0;this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=e,this.el.innerHTML=as(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var l,c,p,h,g,w;let e=s.target;if(e.closest("[data-solar-prev]")){this.solarChannelIdx=(this.solarChannelIdx-1+st.length)%st.length,this.render();return}if(e.closest("[data-solar-next]")){this.solarChannelIdx=(this.solarChannelIdx+1)%st.length,this.render();return}if(e.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(e.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(e.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.render();return}if(e.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.render();return}if(e.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let o=e.closest("[data-impact-row]");if(o){let u=(l=o.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(u)?this.expandedImpacts.delete(u):this.expandedImpacts.add(u),this.render();return}let n=e.closest("[data-solar-layer]");if(n){let u=(c=n.dataset.solarLayer)!=null?c:"";this.solarLayers.has(u)?this.solarLayers.delete(u):this.solarLayers.add(u),this.render();return}if(e.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(e.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let d=e.closest("[data-alert-key]");if(d){let u=(p=d.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===u?null:u,this.render();return}if(e.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let u=Date.now();this.collapsedDays=new Set([new Date(u).toISOString().slice(0,10),new Date(u-864e5).toISOString().slice(0,10),new Date(u-1728e5).toISOString().slice(0,10)])}this.render();return}let i=e.closest("[data-tl-day]");if(i){let u=(h=i.dataset.tlDay)!=null?h:"";this.collapsedDays.has(u)?this.collapsedDays.delete(u):this.collapsedDays.add(u),this.render();return}let r=e.closest("[data-timeline-key]");if(r){let u=(g=r.dataset.timelineKey)!=null?g:null;this.expandedTimelineKey=this.expandedTimelineKey===u?null:u,this.render();return}if(e.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let a=e.closest("[data-kpi]");if(a){let u=(w=a.dataset.kpi)!=null?w:null;this.activePopover=this.activePopover===u?null:u,this.render();return}if(e.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}e.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(s){let e=s.target;if(!e.matches("[data-scrub]"))return;let o=parseFloat(e.value);this.scrubOffset=o,e.style.setProperty("--pct",`${(o/parseFloat(e.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let e=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!e.ok)throw new Error(`HTTP ${e.status}`);this.data=await e.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(e){let o=e instanceof Error?e.message:String(e);this.el.innerHTML=ns(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let e=await s.json(),o=new Map;for(let n of e){let d=o.get(n.region),i=n.area!=null,r=(d==null?void 0:d.area)!=null;(!d||!r&&i||r===i&&n.observed_date>d.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,e,o,n,d,i;if(!(this.opts.lat==null||this.opts.lon==null))try{let r=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!r.ok)return;let a=await r.json(),c=((o=(e=(s=a.coordinates)!=null?s:a.Data)!=null?e:a.data)!=null?o:[]).map(([p,h,g])=>({lon:p,lat:h,prob:g}));this.ovationData={entries:c,forecastTime:String((i=(d=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?d:a["Observation Time"])!=null?i:"")},this.render()}catch(r){}}render(){this.data&&(this.el.innerHTML=os(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData,this.solarChannelIdx))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},Bt={mount(t,s){return re(),new xt(t,s)}};typeof window!="undefined"&&(window.HelioWidget=Bt);return Qt(is);})();
