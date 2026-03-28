"use strict";var HelioWidgetModule=(()=>{var fe=Object.defineProperty,nt=Object.defineProperties,at=Object.getOwnPropertyDescriptor,it=Object.getOwnPropertyDescriptors,rt=Object.getOwnPropertyNames,Te=Object.getOwnPropertySymbols;var Ae=Object.prototype.hasOwnProperty,lt=Object.prototype.propertyIsEnumerable;var Fe=(e,s,t)=>s in e?fe(e,s,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[s]=t,Oe=(e,s)=>{for(var t in s||(s={}))Ae.call(s,t)&&Fe(e,t,s[t]);if(Te)for(var t of Te(s))lt.call(s,t)&&Fe(e,t,s[t]);return e},Ie=(e,s)=>nt(e,it(s));var ct=(e,s)=>{for(var t in s)fe(e,t,{get:s[t],enumerable:!0})},dt=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let a of rt(s))!Ae.call(e,a)&&a!==t&&fe(e,a,{get:()=>s[a],enumerable:!(o=at(s,a))||o.enumerable});return e};var pt=e=>dt(fe({},"__esModule",{value:!0}),e);var bs={};ct(bs,{HelioWidget:()=>st});var Re={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},ht={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},mt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},He={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},ut={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},gt={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function wt(e){if(!e)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(e).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let t=Math.floor(s/60);return t<24?`Updated ${t}h ago`:`Updated ${Math.floor(t/24)}d ago`}catch(s){return"Updated recently"}}function xt(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function he(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e}}function ye(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e.slice(11,16)}}function Ne(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function W(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function $t(e){return parseInt(e.slice(1),10)>0}var ft=`
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
`,Pe=!1;function bt(){if(Pe)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=ft,document.head.appendChild(e),Pe=!0}function vt(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.length,a=s/o,d=e.map((i,l)=>{let n=Math.max(2,Math.min(t,i.kp/9*t)),r=t-n,c=l*a,p=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${r.toFixed(1)}" width="${(a-1).toFixed(1)}" height="${n.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${m(ye(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">${d}</svg>`}function De(e,s,t,o,a){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let d=200,i=Math.min(...e),l=Math.max(...e),n=l-i||1,r=g=>o-2-(g-i)/n*(o-4),c=e.map((g,w)=>`${(w/(e.length-1)*d).toFixed(1)},${r(g).toFixed(1)}`).join(" "),p="";if(a&&i<0&&l>0){let g=r(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${d}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let h=e.map((g,w)=>`<rect x="${(w/(e.length-1)*d-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${m(s[w]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${d} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${c}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${h}
  </svg>`}function yt(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),a=Math.min(...o),i=Math.max(...o)-a||1,l=c=>t-2-(c-a)/i*(t-4),n=o.map((c,p)=>`${(p/(o.length-1)*s).toFixed(1)},${l(c).toFixed(1)}`).join(" "),r=e.map((c,p)=>{let h=p/(o.length-1)*s,g=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(h-4).toFixed(1)}" y="0" width="8" height="${t}" fill="transparent"><title>${m(ye(c.t_utc))} \xB7 ${g}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">
    <polyline points="${n}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${r}
  </svg>`}function ue(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function kt(e){var r;let s=(r=e.metrics.wind_history_1h)!=null?r:[],t=s[s.length-1],o=e.metrics.solar_wind_kms,a=o!=null?`${Math.round(o)} km/s`:"\u2014",d=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",i=(t==null?void 0:t.density)!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",l=(t==null?void 0:t.temp_kk)!=null?`${t.temp_kk.toFixed(0)} kK`:"\u2014",n=(t==null?void 0:t.pressure_npa)!=null?`${t.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ue("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${m(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${m(n)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function _t(e){var l,n;let s=(l=e.metrics.xray_class)!=null?l:"A",t=e.metrics.xray_flux_wm2,o=t!=null?t.toExponential(2)+" W/m\xB2":"\u2014",a=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],d=a.map(r=>{let c=r.label===s,p=c?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${r.color}${c?"cc":"44"}">${p}</div>`}).join(""),i=a.map(r=>`<div class="hw-xray-scale-label" style="color:${r.label===s?"#c8d8dc":"#607880"}">${r.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ue("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${d}</div>
      <div class="hw-xray-scale-labels">${i}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(n=He[s])!=null?n:"#a0b4b8"}">${m(s)}-class</b> \xB7 ${m(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function St(e){let n='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',r=[-10,-5,5,10].map(y=>{let k=100+y/20*100;return`<line x1="${k.toFixed(1)}" y1="16" x2="${k.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),c='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(e==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${n}${r}${c}</svg>`;let p=e<=-10?"#e05c5c":e<=-5?"#e0a84a":e<0?"#d4b84a":e>=5?"#5cce8c":"#7acca8",h=Math.max(-20,Math.min(20,e)),g=100+h/20*100,w=3,u=h<0?g-w:100-w,f=Math.max(2*w,Math.abs(g-100)+2*w),$=`<rect x="${u.toFixed(1)}" y="16" width="${f.toFixed(1)}" height="6" rx="${w}" fill="${p}" opacity="0.82"/>`,x=5,b=15,v=b-x*1.1,_=`<polygon points="${g.toFixed(1)},${b.toFixed(1)} ${(g-x).toFixed(1)},${v.toFixed(1)} ${(g+x).toFixed(1)},${v.toFixed(1)}" fill="${p}"/>`,H=`<line x1="${g.toFixed(1)}" y1="${b.toFixed(1)}" x2="${g.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,C=`<text x="${g.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${e>=0?"+":""}${e.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${n}${r}${c}${$}${_}${H}${C}
  </svg>`}function Mt(e){var h;let s=e.metrics.imf_bz_nt,t=e.metrics.imf_bt_nt,o=e.metrics.solar_wind_kms,a=(h=e.metrics.pressure_npa)!=null?h:null,d=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",i=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",l=t!=null?t.toFixed(1)+" nT":"\u2014",n=o!=null?`${Math.round(o)} km/s`:"\u2014",r=a!=null?`${a.toFixed(2)} nPa`:"\u2014",c=ge(e),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ue("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${St(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(r)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${m(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${c.color};font-weight:600">${m(c.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function ge(e){var n,r;let s=e.metrics.imf_bz_nt,t=(n=e.metrics.kp_latest)!=null?n:0,o=(r=e.metrics.solar_wind_kms)!=null?r:0,a,d,i;if(s!=null&&s<-5||t>=6)a="storm",d="#e05c5c",i="Storm conditions";else if(s!=null&&s<0||t>=4||o>=400){let c=s!=null&&s<0;a="active",d="#e0a84a",i=c?"Active coupling":"Elevated"}else a="stable",d="#5cce8c",i="Stable";let l;return s==null?l="Unknown":s>2?l="Closed":s>0?l="Minimal":s>-5?l="Moderate":s>-10?l="Strong":l="Very strong",{state:a,color:d,label:i,coupling:l}}function Ct(e,s,t,o){let a=o?"mc":"mf",d=e.color,i=t!=null?t:0,l=i>500,n=i<350,r=l?.9:n?1.8:1.3;if(o){let w=45-(e.state==="storm"?11:e.state==="active"?16:21),u=e.state==="storm"?12:e.state==="active"?10:8,f=50-u,$=76,x=[`M ${w},25`,`C ${w-2},15 41,${u} 45,${u}`,`C 53,${u} ${$-8},${u+4} ${$},20`,`C ${$+1},23 ${$+1},27 ${$},30`,`C ${$-8},${f-4} 53,${f} 45,${f}`,`C 41,${f} ${w-2},35 ${w},25`,"Z"].join(" "),b=l?3:2,v=[14,25,36],_=y=>`<path d="M 0,${y} L ${l?8:6},${y} M ${l?6:4},${y-2} L ${l?8:6},${y} L ${l?6:4},${y+2}" stroke="${d}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,H=v.map(y=>_(y)).join(""),M=Array.from({length:b},(y,k)=>`<g class="hw-wg" style="animation-duration:${r}s;animation-delay:${(r/b*k).toFixed(2)}s">${H}</g>`).join(""),C=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${a}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${a}-wclip)">${M}</g>
      <path d="${x}" fill="${d}14" stroke="${d}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${C}
    </svg>`}else{let $=e.state==="storm"?16:e.state==="active"?26:38,x=155-$,b=e.state==="storm"?22:e.state==="active"?30:40,v=120-b,_=240,H=[`M ${x},60`,`C ${x-4},42 150,${b} 155,${b}`,`C 173,${b} ${_-5},${b+18} ${_},60`,`C ${_-5},${v-18} 173,${v} 155,${v}`,`C 150,${v} ${x-4},78 ${x},60`,"Z"].join(" "),M=`M ${x+2},60 C ${x+2},${60-$*.4} 152,54 150,60 C 152,66 ${x+2},${60+$*.4} ${x+2},60 Z`,C=i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c",y=i>700?.4:i>500?.65:i>350?1.1:1.8,k=i>500?[10,24,40,57,74,90,106]:i>350?[14,34,57,82,104]:[20,50,82,108],E=16,F=22,U=x-6,V=Math.ceil((U-F)/E)+2,G=Array.from({length:V},(O,N)=>F-E+N*E),A=12,K=8,J=G.flatMap(O=>k.map(N=>`<path d="M ${O},${N} L ${O+A},${N} M ${O+K},${N-3} L ${O+A},${N} L ${O+K},${N+3}" stroke="${C}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),S=`<g class="hw-wg-full" style="animation-duration:${y}s">${J}</g>`,z=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',X=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return ke("magnetosphere",{magnetInfo:e,bz:s,windKms:t,uid:a})}}function ke(e,s={}){var S,z,X,O,N,q;let d=(S=s.uid)!=null?S:"hse",i=0,l=160,n=800,r=17,c=n-r,p=s.magnetInfo,h=(z=p==null?void 0:p.state)!=null?z:"stable",g=(X=p==null?void 0:p.color)!=null?X:"#e0a84a",u=n-(h==="storm"?55:h==="active"?80:110),f=h==="storm"?58:h==="active"?76:95,$=1120,x=20,b=[`M ${u},130`,`C ${u-8},${130-f*.55} ${n-18},${130-f} ${n},${130-f}`,`C ${n+120},${130-f} ${$-180},${130-x} ${$},${130-x}`,`L ${$},${130+x}`,`C ${$-180},${130+x} ${n+120},${130+f} ${n},${130+f}`,`C ${n-18},${130+f} ${u-8},${130+f*.55} ${u},130`,"Z"].join(" "),v=e==="magnetosphere",_=v?h==="storm"?"0.12":"0.08":"0.04",H=v?"0.75":"0.28",M=`<g id="${d}-base-sun">
    <circle cx="${i}" cy="130" r="${l+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${i}" cy="130" r="${l}" fill="#f0c040" opacity="0.88"/>
  </g>`,C=`
    <ellipse cx="${n}" cy="130" rx="${r}" ry="${(r*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${n}" y1="${130-r}" x2="${n}" y2="${130+r}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${c}" y1="130" x2="${n+r}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,y=`<g id="${d}-base-earth">
    <circle cx="${n}" cy="130" r="${r}" fill="#1a4a6e" opacity="0.92"/>
    ${C}
  </g>`,k=`<g id="${d}-base-magnetosphere">
    <path d="${b}" fill="${g}" fill-opacity="${_}"
          stroke="${g}" stroke-opacity="${H}" stroke-width="1.8"/>
    ${p?`<text x="${u+5}" y="${130-f-7}" font-size="12" fill="${g}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,E=`<g id="${d}-base-axis">
    <line x1="${l}" y1="130" x2="${u}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,F="";if(e==="magnetosphere"){let I=(O=s.windKms)!=null?O:0,B=I>500,Y=I<350,P=(B?.5:Y?1.4:.9)*1.3,j=I>700?"#e05c5c":I>500?"#e0a84a":I>350?"#d4c840":"#5cce8c",Z=l+8,ee=u-14,L=8,R=6,D=(ee-Z)/(L-1),ne=260/(R+1),te=38,ae=24,re=2,we=Array.from({length:L},(le,pe)=>{let ie=Z+pe*D,ce=Array.from({length:R},(_e,se)=>{let oe=ne*(se+1);return`<path d="M ${ie.toFixed(1)},${oe.toFixed(1)} L ${(ie+te).toFixed(1)},${oe.toFixed(1)} M ${(ie+ae).toFixed(1)},${(oe-6).toFixed(1)} L ${(ie+te).toFixed(1)},${oe.toFixed(1)} L ${(ie+ae).toFixed(1)},${(oe+6).toFixed(1)}"
          stroke="${j}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:re},(_e,se)=>{let oe=-((L-pe)/L*P)-se*P/re;return`<g style="opacity:.12;animation:hw-arrow-chase ${P}s linear ${oe.toFixed(3)}s infinite">${ce}</g>`}).join("")}).join(""),T=(N=s.bz)!=null?N:null,de=T==null?"":(()=>{let le=T>0?"#5cce8c":"#e05c5c";return`${T>0?`<path d="M ${n},137 L ${n},123 M ${n-3},126 L ${n},123 L ${n+3},126"
           stroke="${le}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${n},123 L ${n},137 M ${n-3},134 L ${n},137 L ${n+3},134"
           stroke="${le}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${n+22}" y="135" font-size="13"
        fill="${le}" font-family="monospace">Bz${T>0?"\u2191":"\u2193"}</text>`})();F=`${we}${de}`}let U=`<g id="${d}-overlay-solar-wind">${F}</g>`,V="";if(e==="coronal_hole"&&s.hssState){let I=s.hssState,B=(q=I.speed)!=null?q:0,Y=B>=420,P=I.color,j=Y?"0.85":"0.25",Z=B>=500?"0.18":Y?"0.10":"0.04",ee=l+8,L=c-16,R=60,D=`${ee},130 ${L},${130-R} ${L},${130+R}`,ne=L+6,te=`${ne},120 ${ne+18},130 ${ne},140`;V=`
    <polygon points="${D}" fill="${P}" opacity="${Z}"/>
    <line x1="${ee}" y1="130" x2="${L-5}" y2="130"
          stroke="${P}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${j}"/>
    <polygon points="${te}" fill="${P}" opacity="${Y?"0.9":"0.25"}"/>`}let G=`<g id="${d}-overlay-coronal-hole">${V}</g>`,A="";if(e==="cme_cone"&&s.cmeState){let I=s.cmeState,B=l,Y=c-10,P=Y-B,j=D=>Math.tan(D*Math.PI/180),Z=Math.round(j(9)*P),ee=Math.round(j(6)*P),L=Math.round(j(3)*P),R=D=>`${B},130 ${Y},${130-D} ${Y},${130+D}`;if(I.status!=="quiet"){let D=I.status==="impact"?"#e05c5c":"#d4cc5c";A=`
    <polygon points="${R(Z)}" fill="#253238" opacity="0.85"/>
    <polygon points="${R(ee)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${R(L)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${B+14}" y1="130" x2="${Y-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${n}" cy="130" r="${r+8}" fill="none"
            stroke="${D}" stroke-width="7" opacity="0.16"/>`}else A=`
    <line x1="${B+14}" y1="130" x2="${c-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let K=`<g id="${d}-overlay-cme-cone">${A}</g>`,J=`<g id="${d}-overlay-labels">
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
  </svg>`}function Lt(e){let s=ge(e),t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,a=e.metrics.kp_latest,d=e.metrics.density,i=e.metrics.pressure_npa,l=t!=null?(t>=0?"+":"")+t.toFixed(1)+" nT":"\u2014",n=o!=null?`${Math.round(o)} km/s`:"\u2014",r=d!=null?`${d.toFixed(1)} p/cm\xB3`:"\u2014",c=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=t!=null?t<=-10?"#e05c5c":t<=-5?"#e0a84a":t>=5?"#5cce8c":"#a0b4b8":"#607880",h=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",g=t!=null&&t<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":t!=null&&t<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ue("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Ct(s,t,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${s.color}">${m(s.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function Ht(e,s){if(!s)return"";let t=ge(e),o=e.metrics.imf_bz_nt,a=e.metrics.solar_wind_kms,d=e.metrics.density,i=e.metrics.pressure_npa,l=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",n=a!=null?`${Math.round(a)} km/s`:"\u2014",r=d!=null?`${d.toFixed(1)} p/cm\xB3`:"\u2014",c=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",h=a!=null?a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c":"#607880",g=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${ke("magnetosphere",{windKms:a!=null?a:void 0,bz:o!=null?o:void 0})}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${m(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${m(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function We(e,s,t){if(!e.length)return null;let o=(t%360+360)%360,a=-1,d=1/0,i=Math.cos(s*Math.PI/180);for(let l of e){let n=l.lat-s,r=(l.lon-o+180+360)%360-180,c=n*n+r*i*(r*i);c<d&&(d=c,a=l.prob)}return a>=0?a:null}function Ue(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Et(e,s){let t=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&e.lat!=null&&e.lon!=null&&(o=We(s.entries,e.lat,e.lon));let a=e.lat!=null&&e.lon!=null,d=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",i=o!=null?`${o}%`:s?"n/a":"\u2026",l=a?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?m(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${d}">Aurora: ${i}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ue("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${W(t)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Ue(e)}
    </div>
    ${l}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function zt(e,s,t,o){switch(s){case"solar_wind":return kt(e);case"xray":return _t(e);case"imf_bz":return Mt(e);case"aurora":return Et(t,o);case"magnetosphere":return Lt(e);default:return""}}function be(e,s){if(e.length<2)return"\u2192";let t=e[e.length-1],o=Math.max(0,e.length-4),a=e[o];if(!isFinite(t)||!isFinite(a))return"\u2192";let d=t-a;return d>s?"\u2191":d<-s?"\u2193":"\u2192"}function Tt(e,s){let t=me[s],o=Xt;return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner">
      <img class="hw-solar-mini-img" src="${W(t.url)}" alt="${W(t.label)}"
        onerror="if(this.src!=='${W(o)}')this.src='${W(o)}'" />
      <video class="hw-solar-mini-video" autoplay loop muted playsinline
        oncanplay="this.style.opacity=1"
        aria-label="Solar disk \xB7 ${W(t.label)} \xB7 last 24h">
        <source src="${W(qt)}" type="video/mp4">
      </video>
    </div>
    <div class="hw-solar-mini-switcher">
      <button class="hw-solar-mini-btn" data-solar-prev>&#8249;</button>
      <span class="hw-solar-mini-lbl">${W(t.label)}</span>
      <button class="hw-solar-mini-btn" data-solar-next>&#8250;</button>
    </div>
  </div>`}function Ft(e,s,t,o,a,d,i,l=0){var q,I,B,Y,P,j,Z,ee;let{summary:n,scales:r,metrics:c,aurora_hint:p}=e,h=(q=Re[n.status])!=null?q:Re.quiet,g=a!=null?a.kp.toFixed(1):c.kp_latest!=null?c.kp_latest.toFixed(1):"\u2014",u=[a?a.gScale:r.g_scale,r.r_scale,r.s_scale].map(L=>{let R=$t(L),D=R?`color:${h.accent};border-color:${h.accent}33`:"";return`<span class="hw-scale-chip${R?" hw-scale-active":""}" style="${D}">${m(L)}</span>`}).join(""),f=a?a.auroraLabel:p.aurora_label,$=f==="good"?"#5cce8c":f==="possible"?"#d4cc5c":"#607880",x=f.charAt(0).toUpperCase()+f.slice(1),b="#b4c6cc",v=c.solar_wind_kms!=null?`${Math.round(c.solar_wind_kms)} km/s`:"\u2014",_=c.imf_bz_nt,H=_!=null?_<=-10?"#e05c5c":_<=-5?"#e0a84a":_>=5?"#5cce8c":"#a0b4b8":"#607880",M=_!=null?(_>=0?"+":"")+_.toFixed(1)+" nT":"\u2014",C=c.xray_class,y=C?(I=He[C])!=null?I:"#a0b4b8":"#607880",k=C?`${C}-class`:"\u2014",E=be(((B=c.kp_history_1h)!=null?B:[]).map(L=>L.kp),.5),F=be(((Y=c.wind_history_1h)!=null?Y:[]).map(L=>L.kms),20),U=be(((P=c.bz_history_1h)!=null?P:[]).map(L=>L.bz),1.5),V=be(((j=c.xray_history_1h)!=null?j:[]).map(L=>Math.log10(L.flux+1e-9)),.15),G=(Z=c.kp_history_1h)!=null?Z:[],A=G.length?he(G[G.length-1].t_utc):null,K=A?`Recent history \xB7 Last step ${A}`:"Recent history",J=ge(e),S=(ee=c.kp_latest)!=null?ee:0,z=S>=5,X=z?`linear-gradient(160deg, #0d2a1a 0%, ${h.bg}22 75%)`:`${h.bg}18`,O=(L,R,D,ne,te)=>{let ae=te?`<span class="hw-trend">${te}</span>`:"";return`<div class="hw-kpi-item${o===L?" hw-kpi-active":""}" data-kpi="${L}">
      <span class="hw-qd-label">${R}</span>
      <span class="hw-qd-value" style="color:${ne}">${D}${ae}</span>
    </div>`},N=z?`
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
            ${Tt(o,l)}
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${t?"0":"4px"}">
        <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${t?`
      <div class="hw-quick-details">
        ${O("aurora","Aurora",m(x),$)}
        ${O("solar_wind","Solar wind",m(v),b,F)}
        ${O("imf_bz","IMF Bz",m(M),H,U)}
        ${O("xray","X-ray",m(k),y,V)}
      </div>
      ${o?zt(e,o,d,i):""}`:""}
      ${N}
    </div>`}function At(e){var c,p,h,g;let{metrics:s}=e,t=(c=s.kp_history_1h)!=null?c:[],o=(p=s.wind_history_1h)!=null?p:[],a=(h=s.bz_history_1h)!=null?h:[],d=(g=s.xray_history_1h)!=null?g:[],i=vt(t),l=De(o.map(w=>{var u;return(u=w.kms)!=null?u:0}).filter(w=>w>0),o.map(w=>ye(w.t_utc)),"#5cce8c",28,!1),n=De(a.map(w=>w.bz),a.map(w=>ye(w.t_utc)),"#d4cc5c",28,!0),r=yt(d);return`
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
        <div class="hw-spark-wrap">${l}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
    </div>`}function Ot(e){let s=wt(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${m(s)}</span>
    </div>`}function It(e){return e.map((s,t)=>t===0?(s+e[1])/2:t===e.length-1?(e[t-1]+s)/2:(e[t-1]+s+e[t+1])/3)}function Rt(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Nt(e){return e>=5?"good":e>=3?"possible":"none"}function Ge(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Pt(e){let s=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",t=Ge(e),o=s==="none"?"No aurora expected at mid-latitudes":t!=null?`Aurora possible equatorward of ~${t}\xB0 lat`:"Minor aurora possible at high latitudes",a=e>=7?"moderate":e>=5?"low":"none",d=a==="none"?"No significant HF degradation expected":a==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:a,label:"HF Radio",summary:d},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Dt(e,s){var p;if(s<=0)return null;let t=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!t.length)return null;let o=Date.now()+s*36e5,a=t[0],d=1/0;for(let h of t){let g=Math.abs(new Date(h.t_utc).getTime()-o);g<d&&(d=g,a=h)}let i=a.kp,l=Rt(i),n=Nt(i),r=Ge(i),c=Pt(i);return{offsetH:s,kp:i,gScale:l,auroraLabel:n,auroraMinLat:r,impacts:c}}function Bt(e,s,t,o){var J;let{forecast:a,metrics:d}=e,{kp_max_next_24h:i,kp_max_at_utc:l,trend:n}=a,r=((J=d.kp_forecast_3h)!=null?J:[]).slice(0,16),c=r.length,p=c*3,h=p>0?`${(s/p*100).toFixed(0)}%`:"0%",g=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",w="Kp forecast unavailable";if(i!=null){let S=he(l),z=n==="rising"?"rising":n==="falling"?"falling":"steady";w=`Peak Kp ${i.toFixed(1)} next 24h${S?` at ${S}`:""} \xB7 ${z}`}let u=r.length?he(r[0].t_utc):null,f=u?`Forecast \xB7 Next step ${u}`:"Forecast";if(!r.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(f)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${m(w)}</div>`:""}
    </div>`;let $=320,x=38,b=14,v=x+b,_=$/c,H=S=>x-Math.max(2,Math.min(x-2,S/9*(x-2))),M="",C=r.map(S=>S.kp),y=It(C);r.forEach((S,z)=>{let X=H(S.kp),O=x-X,N=z*_,q=N+_/2,I=S.kp>=6?"#e05c5c":S.kp>=5?"#e0a84a":S.kp>=4?"#d4cc5c":"#5cce8c",B=`Kp ${S.kp.toFixed(1)} \xB7 ${he(S.t_utc)}`;if(M+=`<rect x="${N.toFixed(1)}" y="${X.toFixed(1)}" width="${(_-1.5).toFixed(1)}" height="${O.toFixed(1)}" fill="${I}" fill-opacity="0.85" rx="1.5"/>`,M+=`<rect x="${N.toFixed(1)}" y="0" width="${_.toFixed(1)}" height="${x}" fill="transparent"><title>${W(B)}</title></rect>`,c<=8||z%2===0){let P=new Date(S.t_utc).getHours();M+=`<text x="${q.toFixed(1)}" y="${(v-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${P.toString().padStart(2,"0")}</text>`}});let E=`<polyline points="${r.map((S,z)=>{let X=z*_+_/2,O=H(y[z]);return`${X.toFixed(1)},${O.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,F="";if(s>0&&c>0){let S=Math.min($-1,s/(c*3)*$);F=`
      <line x1="${S.toFixed(1)}" y1="0" x2="${S.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${S.toFixed(1)},${x} ${(S-4).toFixed(1)},${(x-7).toFixed(1)} ${(S+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let U=Math.round(p/4),V=Math.round(p/2),G=Math.round(p*3/4),A=`
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
    </div>`,K=t?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(t.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${t.kp.toFixed(1)} \xB7 ${t.gScale}</span>
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
        ${F}
      </svg>
      ${A}`:""}
    </div>`}function Yt(e){let s=/([NS])(\d+)([EW])(\d+)/i.exec(e);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Ke=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function jt(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function Wt(e,s,t){let o=s/2,a=o*.87,d=s*.03,i=s*.009,l=e.map(n=>{var $,x;let r=Yt(n.location);if(!r||Math.abs(r.lon)>88||n.location.includes("*"))return"";let c=jt(n);if(!t.has(c))return"";let p=Ke.find(b=>b.id===c).color,h=r.lat*Math.PI/180,g=r.lon*Math.PI/180,w=(o+a*Math.cos(h)*Math.sin(g)).toFixed(1),u=(o-a*Math.sin(h)).toFixed(1),f=`AR ${n.region} \xB7 ${n.location}
Class: ${($=n.spot_class)!=null?$:"\u2014"} / ${(x=n.mag_class)!=null?x:"\u2014"}
C: ${n.c_flare_probability}%  M: ${n.m_flare_probability}%  X: ${n.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${m(f)}</title>
      <circle cx="${w}" cy="${u}" r="${(d+i+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(i*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${w}" cy="${u}" r="${d.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${i.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Ut={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Gt='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Kt="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",me=[{id:"eit171",label:"EIT 171",url:"/assets/gifs/current_eit_171.gif"},{id:"eit195",label:"EIT 195",url:"/assets/gifs/current_eit_195.gif"},{id:"eit284",label:"EIT 284",url:"/assets/gifs/current_eit_284.gif"},{id:"eit304",label:"EIT 304",url:"/assets/gifs/current_eit_304.gif"},{id:"cont",label:"Continuum",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg"},{id:"mag",label:"Magnetogram",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_mag/512/latest.jpg"}],Xt="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ys=me[0].url,qt="https://sdo.gsfc.nasa.gov/assets/img/latest/mpeg/latest_512_0171.mp4",Qt=240;function Vt(e,s){var r,c,p;let t=parseInt(((r=e.scales.r_scale)!=null?r:"R0").slice(1),10),o=(c=e.metrics.xray_class)!=null?c:"A",a=e.metrics.xray_flux_wm2,d=a!=null?a.toExponential(2)+" W/m\xB2":"\u2014",l=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(h=>{let g=h.r===t,w=h.r<=t,u=w?h.color:"#1e2c30",f=g?"1":w?"0.5":"1",$=g?h.color:w?h.color+"99":"#566068",x=g?h.color:w?h.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${$}">R${h.r}</span>
      <div class="hw-radio-bbar" style="background:${u};opacity:${f}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${h.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${l}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=He[o])!=null?p:"#a0b4b8"}">${m(o)}-class</b> \xB7 ${m(d)}</div>
  </div>`}var Xe={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function qe(e){var l;let s=(l=e.metrics.kp_forecast_3h)!=null?l:[],t=Date.now(),o=t+24*60*60*1e3,a=s.filter(n=>{let r=new Date(n.t_utc).getTime();return r>=t-3*60*60*1e3&&r<=o});if(a.length===0)return{g1:0,g2:0,g3:0};let d=Math.max(...a.map(n=>n.kp)),i=n=>{if(d<n-.7)return 0;if(d>n+1)return 90;let r=(d-(n-.7))/1.7;return Math.round(Math.pow(Math.max(0,r),.7)*90)};return{g1:i(5),g2:i(6),g3:i(7)}}var Be={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function Zt(e){var r,c,p;let s=(r=e.metrics.kp_latest)!=null?r:0,t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,a=parseInt(((c=e.scales.g_scale)!=null?c:"G0").replace("G",""),10)||0,d=s>=5||a>=1,i=(p=e.metrics.kp_history_1h)!=null?p:[],l=0;if(i.length>=2&&(l=i[i.length-1].kp-i[i.length-2].kp),!d)return{active:!1,phase:"quiet",kp_current:s,kp_trend:l,bz_nt:t,solar_wind_kms:o};let n;return l>.3&&(t==null||t<-5)?n="rising":l<-.5?n="decline":n="peak",{active:!0,phase:n,kp_current:s,kp_trend:l,bz_nt:t,solar_wind_kms:o}}function Jt(e){if(!e.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],t=s.findIndex(l=>l.key===e.phase),o=Be[e.phase],a=s[t].label,d=s.map((l,n)=>{let r=n===t,c=n<t,p=Be[l.key],h=r?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:c?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",g=r?" hw-spi-dot-active":"",w=r?`color:${p};font-weight:700`:c?`color:${p}66`:"color:#2e4248",u=n<s.length-1?`<div class="hw-spi-arr">${c?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${g}" style="${h}"></div>
        <div class="hw-spi-txt" style="${w}">${l.label}</div>
      </div>${u}`}).join(""),i=[`Kp ${e.kp_current.toFixed(1)}`];return e.bz_nt!=null&&i.push(`Bz ${e.bz_nt>0?"+":""}${e.bz_nt.toFixed(1)} nT`),e.solar_wind_kms!=null&&i.push(`Wind ${Math.round(e.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${a}</span></div>
    <div class="hw-spi-track">${d}</div>
    <div class="hw-spi-params">${i.join(" \xB7 ")}</div>
  </div>`}function es(e,s){let t=qe(e),o=Zt(e),a=(()=>{var g;let r=(g=e.metrics.kp_forecast_3h)!=null?g:[],c=Date.now(),p=c+24*60*60*1e3,h=r.filter(w=>new Date(w.t_utc).getTime()<=p);return h.length?Math.max(...h.map(w=>w.kp)):null})(),i=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:r,label:c})=>{let p=t[r],h=Xe[r];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${h};${p===0?" opacity:.35":""}">${c}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${p}%;background:${h}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${p>0?h:"#607880"}">${p}%</span>
    </div>`}).join(""),l=a!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${a.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${Jt(o)}
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${i}</div>
    ${l?`<div class="hw-gstorm-footer">${l} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var ve={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},Qe={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function ts(e){var y;let s=ve,t=(y=Qe[s.phase])!=null?y:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),a=280,d=52,i=10,l=d-6,n=d-18,r=.5,c=.19,p=k=>Math.exp(-Math.pow((k-r)/c,2)/2),h=k=>i+k*(a-2*i),g=k=>l-p(k)*n,w=80,u=[];for(let k=0;k<=w;k++){let E=k/w;u.push(`${k===0?"M":"L"}${h(E).toFixed(1)},${g(E).toFixed(1)}`)}let f=Math.round(s.progress_0_1*w),$=[];for(let k=0;k<=f;k++){let E=k/w;$.push(`${k===0?"M":"L"}${h(E).toFixed(1)},${g(E).toFixed(1)}`)}let x=h(s.progress_0_1),b=[`M${i},${l}`,...$.slice(1),`L${x.toFixed(1)},${l} Z`],v=g(s.progress_0_1),_=5,H=`M${x.toFixed(1)},${v.toFixed(1)} L${(x-_).toFixed(1)},${(v-_*1.8).toFixed(1)} L${(x+_).toFixed(1)},${(v-_*1.8).toFixed(1)} Z`,M=l+11;return`<div class="hw-impact-tip${e?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${m(s.cycle_name)}</div>
    <svg width="100%" height="${d+14}" viewBox="0 0 ${a} ${d+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${t}" opacity="0.12"/>
      <path d="${u.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${$.join(" ")}" fill="none" stroke="${t}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${i}" y1="${l}" x2="${a-i}" y2="${l}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${H}" fill="${t}"/>
      <text x="${i+2}" y="${M}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${h(.5).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(a-i-2).toFixed(1)}" y="${M}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${t}">${m(o)}</b>${s.subtitle?` \xB7 ${m(s.subtitle)}`:""}</div>
  </div>`}function Ve(e){var n,r,c,p,h;let s=(r=(n=e.coronal_hole)==null?void 0:n.estimated_speed_kms)!=null?r:e.metrics.solar_wind_kms,t=(c=e.coronal_hole)==null?void 0:c.status,o=s!=null?s:0,a=t!=null?t:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",d={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},i={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},l={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:a,color:d[a],label:i[a],desc:(h=(p=e.coronal_hole)==null?void 0:p.note)!=null?h:l[a],speed:s}}function ss(e,s){var r;let t=Ve(e),o=(r=t.speed)!=null?r:0,a=t.speed!=null?`${Math.round(t.speed)} km/s`:"\u2014",d=s?" hw-impact-tip-open":"",i=o>=420,l=ke("coronal_hole",{hssState:t,uid:"hss"}),n=i?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${d}">
    ${l}
    <div class="hw-hss-meta">Solar wind: <b style="color:${t.color}">${m(a)}</b> \xB7 ${m(t.desc)}</div>
    ${n}
  </div>`}function Ze(e){var a,d;let s=(a=e.scales.g_scale)!=null?a:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let i=(d=e.metrics.kp_forecast_3h)!=null?d:[],l=Date.now(),n=i.filter(r=>new Date(r.t_utc).getTime()<=l+3*60*60*1e3).sort((r,c)=>new Date(c.t_utc).getTime()-new Date(r.t_utc).getTime());n.length>0&&(o=n[0].kp)}return t>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:t>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function os(e,s){let t=Ze(e),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(n=>{let r=n.l===t.level,c=r?n.color:"#566068",p=r?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${c}">${n.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${n.width}%;background:${n.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${r?n.color:"transparent"}">${r?"\u25C0":""}</span>
    </div>`}).join(""),i=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",l={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${d}</div>
    <div class="hw-satdrag-meta">${i} \xB7 ${m(t.gScale)} \xB7 ${l[t.level]}</div>
  </div>`}function Je(e){var r,c,p;let s=(r=e.scales.g_scale)!=null?r:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let h=(c=e.metrics.kp_forecast_3h)!=null?c:[],g=Date.now(),w=h.filter(u=>new Date(u.t_utc).getTime()<=g+3*60*60*1e3).sort((u,f)=>new Date(f.t_utc).getTime()-new Date(u.t_utc).getTime());w.length>0&&(o=w[0].kp)}let a=0;t>=2||o!=null&&o>=6?a=2:(t>=1||o!=null&&o>=4)&&(a=1);let d=parseInt(((p=e.scales.r_scale)!=null?p:"R0").slice(1),10),i=d>=2&&a<2;d>=2&&(a=Math.min(2,a+1));let l={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},n={0:"Low",1:"Moderate",2:"High"};return{level:a,color:l[a],label:n[a],kp:o,gScale:s,boostedByFlare:i}}function ns(e,s){var r;let t=Je(e),o=s?" hw-impact-tip-open":"",d=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(c=>{let p=c.l===t.level,h=p?c.color:"#566068",g=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${h}">${c.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${c.width}%;background:${c.color};opacity:${g}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?c.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),i=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",l={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},n=t.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((r=e.scales.r_scale)!=null?r:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${d}</div>
    <div class="hw-gnss-meta">${i} \xB7 ${m(t.gScale)} \xB7 ${l[t.level]}</div>
    ${n}
  </div>`}function et(e){var a;let s=e.metrics.pressure_npa,t=s!=null?s:null,o=(a=e.metrics.density)!=null?a:null;return t==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:t>=6?{pressure:t,color:"#e05c5c",label:"Extreme",density:o}:t>=4?{pressure:t,color:"#e0a84a",label:"Strong",density:o}:t>=2?{pressure:t,color:"#d4cc5c",label:"Elevated",density:o}:t>=1?{pressure:t,color:"#5cce8c",label:"Typical",density:o}:{pressure:t,color:"#7a9298",label:"Weak",density:o}}function as(e,s){let t=et(e),o=s?" hw-impact-tip-open":"",a=t.pressure,d=200,i=6,l=10,n=i+l,r=n+4,c=r+11,p=n+9,h=c+4,w=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(y=>`<rect x="${y.x}" y="${i}" width="${y.w}" height="${l}" fill="${y.color}" opacity="0.55" rx="0"/>`).join(""),u=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],f=u.map(y=>`<line x1="${y.x}" y1="${n}" x2="${y.x}" y2="${r}" stroke="#3a5058" stroke-width="1"/>`).join(""),$=u.map(y=>`<text x="${y.x}" y="${c}" class="hw-swdp-axlabel" text-anchor="${y.anchor}">${y.label}</text>`).join(""),x="";if(a!=null){let k=Math.min(Math.max(a,0),8)/8*d;x=`<polygon points="${`${k-5},${p} ${k+5},${p} ${k},${n}`}" fill="${t.color}" opacity="0.95"/>
    <line x1="${k}" y1="${i}" x2="${k}" y2="${n}" stroke="${t.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${i}" width="${d}" height="${l}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,v=`<svg class="hw-swdp-gauge" viewBox="0 0 ${d} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${w}${b}${x}${f}${$}
  </svg>`,_=a!=null?`${a.toFixed(2)} nPa`:"\u2014",H=t.density!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",M=e.metrics.solar_wind_kms!=null?`${Math.round(e.metrics.solar_wind_kms)} km/s`:"\u2014",C=a==null?"":a>=4?" \xB7 Magnetosphere compressed":a>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${v}
    <div class="hw-swdp-meta"><b style="color:${t.color}">${m(_)}</b>${m(C)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${m(M)} \xB7 Density ${m(H)}</div>
  </div>`}function tt(e){var r,c;let s=(r=e.alerts_all)!=null?r:[],t=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),a=t!=null?t:o;if(!a)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let d=((c=a.raw_body)!=null?c:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),i=d?parseInt(d[1],10):null,l=null;if(i&&a.t_utc){let p=1496e5/i*1e3;l=new Date(new Date(a.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let n=t?"impact":"watch";return{status:n,color:n==="impact"?"#e05c5c":"#d4cc5c",label:n==="impact"?"Active":"Watch",speed_kms:i,issued_utc:a.t_utc,arrival_utc:l}}function is(e,s){let t=tt(e),o=s?" hw-impact-tip-open":"",a="\u2014";if(t.arrival_utc){let n=new Date(t.arrival_utc),r=n.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),c=n.getUTCDate(),p=String(n.getUTCHours()).padStart(2,"0"),h=String(n.getUTCMinutes()).padStart(2,"0");a=`~${r}\xA0${c}\xA0${p}:${h}\u202FUTC`}let d=t.speed_kms?`${t.speed_kms}\u202Fkm/s`:"\u2014",i=t.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${m(d)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${m(a)}</b>`:"No Earth-directed CME in forecast window",l=ke("cme_cone",{cmeState:t,uid:"cme"});return`<div class="hw-impact-tip${o}">
    ${l}
    <div class="hw-cme-footer">${i}</div>
  </div>`}function rs(e,s,t,o,a,d,i,l,n){var ae,re,we;let r=(re=(ae=s==null?void 0:s.impacts)!=null?ae:e.observer_impacts)!=null?re:[],c=r.map(T=>{var Ee,ze;let de=(Ee=ht[T.level])!=null?Ee:"#666",le=T.level==="none"?"None":T.level.charAt(0).toUpperCase()+T.level.slice(1),pe=(ze=Ut[T.kind])!=null?ze:Gt,ie=T.level==="none"?"#606870":de,ce=T.kind==="solar_activity"?a:i.has(T.kind),_e=ce?" hw-impact-open":"",se;if(T.kind==="solar_activity"){let xe=a?" hw-solar-open":"",Se=Ke.map(Q=>{let $e=d.has(Q.id),Me=$e?Q.color+"22":"transparent",Ce=$e?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${Q.id}" style="color:${Q.color};border-color:${Q.color};background:${Me};opacity:${Ce}">${Q.label}</button>`}).join("");se=`<div class="hw-solar-tip${xe}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Kt}" alt="Solar disk" loading="lazy" />
            ${t?Wt(t,Qt,d):""}
          </div>
          <div class="hw-solar-layers">${Se}</div>
          <span class="hw-solar-tip-text">${m(T.summary)}</span>
        </div>`}else if(T.kind==="aurora"){let xe=ce?" hw-aurora-tip-open":"",Se=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,Q=null;l&&n.lat!=null&&n.lon!=null&&(Q=We(l.entries,n.lat,n.lon));let $e=n.lat!=null&&n.lon!=null,Me=Q!=null?Q>=30?"#5cce8c":Q>=10?"#d4cc5c":"#9ab4bc":"#607880",Ce=Q!=null?`${Q}%`:l?"n/a":"\u2026",ot=$e?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${n.locationName?m(n.locationName)+" \xB7 ":""}${n.lat.toFixed(1)}\xB0${n.lat>=0?"N":"S"} ${Math.abs(n.lon).toFixed(1)}\xB0${n.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${Me}">Aurora: ${Ce}</span>
        </div>`:"";se=`<div class="hw-aurora-tip${xe}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${W(Se)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Ue(n)}
          </div>
          ${ot}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else T.kind==="radio"?se=Vt(e,ce):se=`<div class="hw-impact-tip${ce?" hw-impact-tip-open":""}">${m(T.summary)}</div>`;let oe=T.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${W(T.kind)}"`;return`<div class="hw-impact-row${_e}"${oe}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${ie}">${pe}<span style="color:#b4c6cc">${m(T.label)}</span></span>
      <span class="hw-impact-badge" style="background:${de}22;color:${de}">${m(le)}</span>
      ${se}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",h=r.length+8,g=o?"\u25BC":"\u25B6",w=h>0?`Observer Impacts (${h})`:"Observer Impacts",u=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${w}${p}</span>
    </div>`,f=i.has("geomag_storm"),$=qe(e),x=$.g1,b=$.g1>=30?Xe.g1:$.g1>0?"#7a9298":"#607880",v=x>0?`G1 ${x}%`:"None",H=`<div class="hw-impact-row${f?" hw-impact-open":""}" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${b}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span><span style="color:#607880;font-size:.85em;font-weight:normal"> \u2014 Next 24h</span></span>
      <span class="hw-impact-badge" style="background:${b}22;color:${b}">${v}</span>
      ${es(e,f)}
    </div>`,M=i.has("solar_cycle"),C=(we=Qe[ve.phase])!=null?we:"#96a8b8",y=ve.phase.charAt(0).toUpperCase()+ve.phase.slice(1),E=`<div class="hw-impact-row${M?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${C}22;color:${C}">${y}</span>
      ${ts(M)}
    </div>`,F=Ve(e),U=i.has("hss"),G=`<div class="hw-impact-row${U?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${F.color}22;color:${F.color}">${F.label}</span>
      ${ss(e,U)}
    </div>`,A=Ze(e),K=i.has("sat_drag"),S=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${A.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${A.color}22;color:${A.color}">${A.label}</span>
      ${os(e,K)}
    </div>`,z=Je(e),X=i.has("gnss"),N=`<div class="hw-impact-row${X?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${z.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${z.color}22;color:${z.color}">${z.label}</span>
      ${ns(e,X)}
    </div>`,q=et(e),I=i.has("sw_pressure"),B=q.pressure!=null?`${q.pressure.toFixed(2)} nPa`:"\u2014",P=`<div class="hw-impact-row${I?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${q.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${q.color}22;color:${q.color}">${B}</span>
      ${as(e,I)}
    </div>`,j=tt(e),Z=i.has("cme_cone"),L=`<div class="hw-impact-row${Z?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${j.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${j.color}22;color:${j.color}">${m(j.label)}</span>
      ${is(e,Z)}
    </div>`,R=ge(e),D=i.has("magnetosphere"),te=`<div class="hw-impact-row${D?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${R.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${R.color}22;color:${R.color}">${m(R.label)}</span>
      ${Ht(e,D)}
    </div>`;return`
    <div class="hw-impacts">
      ${u}
      ${o?c+H+te+E+G+S+N+P+L:""}
    </div>`}var Ye={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function ls(e,s){var n,r;let t=(n=mt[e.level])!=null?n:"#666",o=e.level.charAt(0).toUpperCase()+e.level.slice(1),a=(r=Ye[e.kind])!=null?r:Ye.unknown,d=[xt(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),i=s&&e.raw_body?`<div class="hw-alert-body">${m(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${t}" data-alert-key="${W(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${t}">${a}</span>
      <span class="hw-alert-level" style="color:${t}">${m(o)}</span>
      <span class="hw-alert-title">${m(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${m(e.summary_short)}</div>
    <div class="hw-alert-meta">${m(d)}</div>
    ${i}
  </div>`}var cs={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},ds="#4ae0a4";function ps(e){let s=(t,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${t}</svg>`;switch(e){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function hs(e){var o;let s=(o=e.metadata)!=null?o:{},t=[];return s.source_code&&t.push(`Code: ${s.source_code}`),s.model&&t.push(`Model: ${String(s.model).toUpperCase()}`),t.length===0?"":`
${t.join(" \xB7 ")}`}function ms(e,s,t){var n;let o=e.is_active?ds:(n=cs[e.level])!=null?n:"#445c64",a=e.event_time===t,d=e.event_time.slice(11,16)+" UTC",i=e.source==="NASA_DONKI"?"DONKI":"SWPC",l=a?`<div class="hw-tl-detail">${m(e.description)}${m(hs(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${W(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${d}</span>
          <span class="hw-tl-src">${i}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${ps(e.event_type)} ${m(e.event_title)}
        </div>
        ${l}
      </div>
    </div>`}function us(e,s,t,o){var $,x;let a=($=e.timeline)!=null?$:[],d=Date.now(),i=new Date(d).toISOString().slice(0,10),l=new Date(d-864e5).toISOString().slice(0,10),n=new Date(d-1728e5).toISOString().slice(0,10),r=new Set([i,l,n]),c=a.filter(b=>{var v;return r.has(((v=b.event_time)!=null?v:"").slice(0,10))}).slice().reverse(),p=c.length,h=t?"\u25BC":"\u25B6",g=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",w=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${h}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!t||p===0)return`<div class="hw-timeline">${w}</div>`;let u=new Map;for(let b of c){let v=((x=b.event_time)!=null?x:"").slice(0,10);u.has(v)||u.set(v,[]),u.get(v).push(b)}let f=[...u.entries()].map(([b,v])=>{let H=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=o.has(b),C=M?"\u25B6":"\u25BC",y=M?`<span class="hw-tl-day-count">${v.length} events</span>`:"",k=`
      <div class="hw-tl-day-row" data-tl-day="${W(b)}">
        <span class="hw-section-caret">${C}</span>
        <span class="hw-tl-date">${H}</span>
        ${y}
      </div>`,E=M?"":v.map((F,U)=>ms(F,U<v.length-1,s)).join("");return`<div class="hw-tl-group">${k}${E}</div>`}).join("");return`
    <div class="hw-timeline">
      ${w}
      ${f}
    </div>`}function gs(e,s,t){var r;let o=(r=e.alerts_all)!=null?r:[],a=o.length,d=s?"\u25BC":"\u25B6",i=a>0?`SWPC Alerts (${a})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${d}</span>
        <span class="hw-alerts-label">${i}</span>
      </div>
    </div>`;if(!s||a===0)return`<div class="hw-alerts">${l}${s&&a===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let n=o.map(c=>ls(c,c.dedupe_key===t)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${n}
    </div>`}function ws(e,s){var V,G,A;let t=e.cme_tracker;if(!t)return"";let o=(V=ut[t.impact_level])!=null?V:"#96a8b8",a=(G=gt[t.status])!=null?G:t.status,d=300,i=44,l=18,n=i/2,r=10,c=d-18,p=7,h=`<line x1="${l+r}" y1="${n}" x2="${c-p}" y2="${n}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${l}" cy="${n}" r="${r}" fill="#f0c040" opacity="0.92"/>`,w=`
    <circle cx="${c}" cy="${n}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${c}" cy="${n}" r="2.5" fill="#fff" opacity="0.7"/>`,u=`<text x="${l}" y="${n+r+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,f=`<text x="${c}" y="${n+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,$="";if(t.progress!=null){let K=l+r+4,J=c-p-4,S=K+t.progress*(J-K),z=5;t.status==="arrival_window"?$=`
        <g transform="translate(${S.toFixed(1)},${n})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${z}" fill="${o}" opacity="0.92"/>
        </g>`:$=`<circle cx="${S.toFixed(1)}" cy="${n}" r="${z}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${d} ${i}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${h}
    ${g}${u}
    ${w}${f}
    ${$}
  </svg>`,b=Ne(t.arrival_time_utc),v=Ne(t.launch_time_utc),_=t.speed_kms!=null?`${Math.round(t.speed_kms)} km/s`:"\u2014",H=t.half_angle_deg!=null?`${t.half_angle_deg}\xB0`:"\u2014",M=(A=t.source_location)!=null?A:"\u2014",C=t.is_earth_direct?"Direct hit":"Glancing blow",y=t.progress!=null?`${Math.round(t.progress*100)}%`:"\u2014",k=`
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
          <span class="hw-cme-stat-value" style="color:${o}">${m(t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1))}</span>
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
    </div>`,E=s?"\u25BC":"\u25B6",F=t.impact_level==="unknown"?"Unrated":t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1),U=s?`${x}${k}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${E}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${m(a)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${m(F)} impact</span>
      </div>
      ${U}
    </div>`}function xs(e,s,t,o,a,d,i,l,n,r,c,p,h,g,w,u,f,$,x,b,v=0){var E;let _=Dt(e,a),H=(E=e.metrics.kp_history_1h)!=null?E:[],M=H.length?he(H[H.length-1].t_utc):null,C=M?`Recent history \xB7 Last step ${M}`:"Recent history",y=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${W(C)}</span>
  </div></div>`,k=t?At(e):"";return`
    <div class="hw-root">
      ${Ot(e)}
      ${Ft(e,t,g,o,_,x,b,v)}
      ${rs(e,_,w,c,u,f,$,b,x)}
      ${y}
      ${k}
      ${Bt(e,a,_,h)}
      ${ws(e,p)}
      ${us(e,l,n,r)}
      ${gs(e,d,i)}
    </div>`}function $s(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${m(e)}</div>
    </div>
  </div>`}function fs(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var je="nc-helio-ui",Le=class{constructor(s,t){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.solarChannelIdx=0;this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=t,this.loadUiState(),this.el.innerHTML=fs(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var r,c,p,h,g,w;let t=s.target;if(t.closest("[data-solar-prev]")){this.solarChannelIdx=(this.solarChannelIdx-1+me.length)%me.length,this.saveUiState(),this.render();return}if(t.closest("[data-solar-next]")){this.solarChannelIdx=(this.solarChannelIdx+1)%me.length,this.saveUiState(),this.render();return}if(t.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(t.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(t.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.saveUiState(),this.render();return}if(t.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}let o=t.closest("[data-impact-row]");if(o){let u=(r=o.dataset.impactRow)!=null?r:"";this.expandedImpacts.has(u)?this.expandedImpacts.delete(u):this.expandedImpacts.add(u),this.saveUiState(),this.render();return}let a=t.closest("[data-solar-layer]");if(a){let u=(c=a.dataset.solarLayer)!=null?c:"";this.solarLayers.has(u)?this.solarLayers.delete(u):this.solarLayers.add(u),this.saveUiState(),this.render();return}if(t.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let d=t.closest("[data-alert-key]");if(d){let u=(p=d.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===u?null:u,this.render();return}if(t.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let u=Date.now();this.collapsedDays=new Set([new Date(u).toISOString().slice(0,10),new Date(u-864e5).toISOString().slice(0,10),new Date(u-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let i=t.closest("[data-tl-day]");if(i){let u=(h=i.dataset.tlDay)!=null?h:"";this.collapsedDays.has(u)?this.collapsedDays.delete(u):this.collapsedDays.add(u),this.saveUiState(),this.render();return}let l=t.closest("[data-timeline-key]");if(l){let u=(g=l.dataset.timelineKey)!=null?g:null;this.expandedTimelineKey=this.expandedTimelineKey===u?null:u,this.render();return}if(t.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let n=t.closest("[data-kpi]");if(n){let u=(w=n.dataset.kpi)!=null?w:null;this.activePopover=this.activePopover===u?null:u,this.render();return}if(t.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}t.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(s){let t=s.target;if(!t.matches("[data-scrub]"))return;let o=parseFloat(t.value);this.scrubOffset=o,t.style.setProperty("--pct",`${(o/parseFloat(t.max)*100).toFixed(0)}%`);let a=this.el.querySelector(".hw-scrub-title");a&&(a.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let t=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!t.ok)throw new Error(`HTTP ${t.status}`);this.data=await t.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(t){let o=t instanceof Error?t.message:String(t);this.el.innerHTML=$s(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let t=await s.json(),o=new Map;for(let a of t){let d=o.get(a.region),i=a.area!=null,l=(d==null?void 0:d.area)!=null;(!d||!l&&i||l===i&&a.observed_date>d.observed_date)&&o.set(a.region,a)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,t,o,a,d,i;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let n=await l.json(),c=((o=(t=(s=n.coordinates)!=null?s:n.Data)!=null?t:n.data)!=null?o:[]).map(([p,h,g])=>({lon:p,lat:h,prob:g}));this.ovationData={entries:c,forecastTime:String((i=(d=(a=n["Forecast Time"])!=null?a:n.forecast_time)!=null?d:n["Observation Time"])!=null?i:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=xs(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData,this.solarChannelIdx))}saveUiState(){try{localStorage.setItem(je,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,indicatorsOpen:this.indicatorsOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],solarChannelIdx:this.solarChannelIdx,expandedImpacts:[...this.expandedImpacts]}))}catch(s){}}loadUiState(){try{let s=localStorage.getItem(je);if(!s)return;let t=JSON.parse(s);typeof t.expanded=="boolean"&&(this.expanded=t.expanded),typeof t.heroExpanded=="boolean"&&(this.heroExpanded=t.heroExpanded),typeof t.alertsExpanded=="boolean"&&(this.alertsExpanded=t.alertsExpanded),typeof t.timelineOpen=="boolean"&&(this.timelineOpen=t.timelineOpen),typeof t.impactsOpen=="boolean"&&(this.impactsOpen=t.impactsOpen),typeof t.cmeExpanded=="boolean"&&(this.cmeExpanded=t.cmeExpanded),typeof t.forecastOpen=="boolean"&&(this.forecastOpen=t.forecastOpen),typeof t.indicatorsOpen=="boolean"&&(this.indicatorsOpen=t.indicatorsOpen),typeof t.solarExpanded=="boolean"&&(this.solarExpanded=t.solarExpanded),typeof t.solarChannelIdx=="number"&&(this.solarChannelIdx=t.solarChannelIdx),Array.isArray(t.collapsedDays)&&(this.collapsedDays=new Set(t.collapsedDays)),Array.isArray(t.solarLayers)&&(this.solarLayers=new Set(t.solarLayers)),Array.isArray(t.expandedImpacts)&&(this.expandedImpacts=new Set(t.expandedImpacts))}catch(s){}}updateLocation(s,t,o){this.opts=Ie(Oe({},this.opts),{lat:s,lon:t,locationName:o}),this.render()}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},st={mount(e,s){return bt(),new Le(e,s)}};typeof window!="undefined"&&(window.HelioWidget=st);return pt(bs);})();
