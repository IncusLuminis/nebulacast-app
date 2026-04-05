"use strict";var HelioWidgetModule=(()=>{var be=Object.defineProperty,lt=Object.defineProperties,ct=Object.getOwnPropertyDescriptor,dt=Object.getOwnPropertyDescriptors,pt=Object.getOwnPropertyNames,Fe=Object.getOwnPropertySymbols;var Re=Object.prototype.hasOwnProperty,ht=Object.prototype.propertyIsEnumerable;var Oe=(e,s,t)=>s in e?be(e,s,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[s]=t,Ie=(e,s)=>{for(var t in s||(s={}))Re.call(s,t)&&Oe(e,t,s[t]);if(Fe)for(var t of Fe(s))ht.call(s,t)&&Oe(e,t,s[t]);return e},Ne=(e,s)=>lt(e,dt(s));var mt=(e,s)=>{for(var t in s)be(e,t,{get:s[t],enumerable:!0})},ut=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of pt(s))!Re.call(e,n)&&n!==t&&be(e,n,{get:()=>s[n],enumerable:!(o=ct(s,n))||o.enumerable});return e};var gt=e=>ut(be({},"__esModule",{value:!0}),e);var Ls={};mt(Ls,{HelioWidget:()=>at});var Pe={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},wt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},xt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},ke={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},ft={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},bt={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function $t(e){if(!e)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(e).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let t=Math.floor(s/60);return t<24?`Updated ${t}h ago`:`Updated ${Math.floor(t/24)}d ago`}catch(s){return"Updated recently"}}function vt(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function me(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e}}function ye(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e.slice(11,16)}}function Be(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function N(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var yt={G:"geomagnetic",R:"radio",S:"radiation",X:"solar"};function De(e){let s=e.trim();return s.toUpperCase().startsWith("X:")?s.slice(2).trim()||"\u2014":s||"\u2014"}function He(e,s){let t=e.trim().toUpperCase();if(t.length<2||t[0]!==s)return 0;let o=parseInt(t.slice(1),10);return!isFinite(o)||o<0?0:Math.min(5,o)}function Ee(e){return e<=0?{color:"#96a8b8",background:"#1e2830",borderColor:"#2a3c42"}:e===1?{color:"#d4cc5c",background:"#2a2616",borderColor:"#5a5028"}:e===2?{color:"#e0a84a",background:"#2c2214",borderColor:"#6a5018"}:e===3?{color:"#e8a060",background:"#301810",borderColor:"#744018"}:e===4?{color:"#e07058",background:"#2c1412",borderColor:"#762820"}:{color:"#e05c5c",background:"#2e1214",borderColor:"#7a2828"}}function kt(e){var r,i,l;let s=e.trim().toUpperCase();if(s==="\u2014"||s===""||s==="-")return{color:"#607880",background:"#1e2830",borderColor:"#2a3c42"};let t=(r=ke[s])!=null?r:"#a0b4b8",o={A:"#242628",B:"#15221c",C:"#1a2215",M:"#221a10",X:"#281416"},n={A:"#404448",B:"#2a5a40",C:"#3e6a30",M:"#6a5018",X:"#7a2828"};return{color:t,background:(i=o[s])!=null?i:"#1e2830",borderColor:(l=n[s])!=null?l:"#3a4c52"}}function _t(e,s){var r,i,l,a,c,d;let t=e.metrics.xray_class!=null?String(e.metrics.xray_class):"\u2014",o={g:(r=s==null?void 0:s.gScale)!=null?r:e.scales.g_scale,r:e.scales.r_scale,s:e.scales.s_scale,x:De(t)},n=(i=e.hero)==null?void 0:i.scales;return n?{g:(l=n.g)!=null?l:o.g,r:(a=n.r)!=null?a:o.r,s:(c=n.s)!=null?c:o.s,x:De((d=n.x)!=null?d:o.x)}:o}var St=`
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
`,Ye=!1;function Ct(){if(Ye)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=St,document.head.appendChild(e),Ye=!0}function Mt(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.length,n=s/o,r=e.map((i,l)=>{let a=Math.max(2,Math.min(t,i.kp/9*t)),c=t-a,d=l*n,p=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${c.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${m(ye(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">${r}</svg>`}function je(e,s,t,o,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let r=200,i=Math.min(...e),l=Math.max(...e),a=l-i||1,c=g=>o-2-(g-i)/a*(o-4),d=e.map((g,u)=>`${(u/(e.length-1)*r).toFixed(1)},${c(g).toFixed(1)}`).join(" "),p="";if(n&&i<0&&l>0){let g=c(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${r}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let h=e.map((g,u)=>`<rect x="${(u/(e.length-1)*r-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${m(s[u]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${r} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${h}
  </svg>`}function Lt(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),n=Math.min(...o),i=Math.max(...o)-n||1,l=d=>t-2-(d-n)/i*(t-4),a=o.map((d,p)=>`${(p/(o.length-1)*s).toFixed(1)},${l(d).toFixed(1)}`).join(" "),c=e.map((d,p)=>{let h=p/(o.length-1)*s,g=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(h-4).toFixed(1)}" y="0" width="8" height="${t}" fill="transparent"><title>${m(ye(d.t_utc))} \xB7 ${g}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${c}
  </svg>`}function ge(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Ht(e){var c;let s=(c=e.metrics.wind_history_1h)!=null?c:[],t=s[s.length-1],o=e.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",r=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",i=(t==null?void 0:t.density)!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",l=(t==null?void 0:t.temp_kk)!=null?`${t.temp_kk.toFixed(0)} kK`:"\u2014",a=(t==null?void 0:t.pressure_npa)!=null?`${t.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ge("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${m(n)}</span>
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
        <span class="hw-kpi-stat-value">${m(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Et(e){var l,a;let s=(l=e.metrics.xray_class)!=null?l:"A",t=e.metrics.xray_flux_wm2,o=t!=null?t.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],r=n.map(c=>{let d=c.label===s,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${c.color}${d?"cc":"44"}">${p}</div>`}).join(""),i=n.map(c=>`<div class="hw-xray-scale-label" style="color:${c.label===s?"#c8d8dc":"#607880"}">${c.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ge("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${r}</div>
      <div class="hw-xray-scale-labels">${i}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=ke[s])!=null?a:"#a0b4b8"}">${m(s)}-class</b> \xB7 ${m(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function At(e){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',c=[-10,-5,5,10].map($=>{let k=100+$/20*100;return`<line x1="${k.toFixed(1)}" y1="16" x2="${k.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(e==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${c}${d}</svg>`;let p=e<=-10?"#e05c5c":e<=-5?"#e0a84a":e<0?"#d4b84a":e>=5?"#5cce8c":"#7acca8",h=Math.max(-20,Math.min(20,e)),g=100+h/20*100,u=3,f=h<0?g-u:100-u,w=Math.max(2*u,Math.abs(g-100)+2*u),b=`<rect x="${f.toFixed(1)}" y="16" width="${w.toFixed(1)}" height="6" rx="${u}" fill="${p}" opacity="0.82"/>`,x=5,v=15,y=v-x*1.1,_=`<polygon points="${g.toFixed(1)},${v.toFixed(1)} ${(g-x).toFixed(1)},${y.toFixed(1)} ${(g+x).toFixed(1)},${y.toFixed(1)}" fill="${p}"/>`,C=`<line x1="${g.toFixed(1)}" y1="${v.toFixed(1)}" x2="${g.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,E=`<text x="${g.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${e>=0?"+":""}${e.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${c}${d}${b}${_}${C}${E}
  </svg>`}function zt(e){var h;let s=e.metrics.imf_bz_nt,t=e.metrics.imf_bt_nt,o=e.metrics.solar_wind_kms,n=(h=e.metrics.pressure_npa)!=null?h:null,r=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",i=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",l=t!=null?t.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",c=n!=null?`${n.toFixed(2)} nPa`:"\u2014",d=we(e),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ge("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${At(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${m(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${m(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${m(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${m(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${m(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function we(e){var a,c;let s=e.metrics.imf_bz_nt,t=(a=e.metrics.kp_latest)!=null?a:0,o=(c=e.metrics.solar_wind_kms)!=null?c:0,n,r,i;if(s!=null&&s<-5||t>=6)n="storm",r="#e05c5c",i="Storm conditions";else if(s!=null&&s<0||t>=4||o>=400){let d=s!=null&&s<0;n="active",r="#e0a84a",i=d?"Active coupling":"Elevated"}else n="stable",r="#5cce8c",i="Stable";let l;return s==null?l="Unknown":s>2?l="Closed":s>0?l="Minimal":s>-5?l="Moderate":s>-10?l="Strong":l="Very strong",{state:n,color:r,label:i,coupling:l}}function Tt(e,s,t,o){let n=o?"mc":"mf",r=e.color,i=t!=null?t:0,l=i>500,a=i<350,c=l?.9:a?1.8:1.3;if(o){let u=45-(e.state==="storm"?11:e.state==="active"?16:21),f=e.state==="storm"?12:e.state==="active"?10:8,w=50-f,b=76,x=[`M ${u},25`,`C ${u-2},15 41,${f} 45,${f}`,`C 53,${f} ${b-8},${f+4} ${b},20`,`C ${b+1},23 ${b+1},27 ${b},30`,`C ${b-8},${w-4} 53,${w} 45,${w}`,`C 41,${w} ${u-2},35 ${u},25`,"Z"].join(" "),v=l?3:2,y=[14,25,36],_=$=>`<path d="M 0,${$} L ${l?8:6},${$} M ${l?6:4},${$-2} L ${l?8:6},${$} L ${l?6:4},${$+2}" stroke="${r}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,C=y.map($=>_($)).join(""),L=Array.from({length:v},($,k)=>`<g class="hw-wg" style="animation-duration:${c}s;animation-delay:${(c/v*k).toFixed(2)}s">${C}</g>`).join(""),E=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${L}</g>
      <path d="${x}" fill="${r}14" stroke="${r}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${E}
    </svg>`}else{let b=e.state==="storm"?16:e.state==="active"?26:38,x=155-b,v=e.state==="storm"?22:e.state==="active"?30:40,y=120-v,_=240,C=[`M ${x},60`,`C ${x-4},42 150,${v} 155,${v}`,`C 173,${v} ${_-5},${v+18} ${_},60`,`C ${_-5},${y-18} 173,${y} 155,${y}`,`C 150,${y} ${x-4},78 ${x},60`,"Z"].join(" "),L=`M ${x+2},60 C ${x+2},${60-b*.4} 152,54 150,60 C 152,66 ${x+2},${60+b*.4} ${x+2},60 Z`,E=i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c",$=i>700?.4:i>500?.65:i>350?1.1:1.8,k=i>500?[10,24,40,57,74,90,106]:i>350?[14,34,57,82,104]:[20,50,82,108],H=16,O=22,X=x-6,Q=Math.ceil((X-O)/H)+2,V=Array.from({length:Q},(B,T)=>O-H+T*H),F=12,W=8,ee=V.flatMap(B=>k.map(T=>`<path d="M ${B},${T} L ${B+F},${T} M ${B+W},${T-3} L ${B+F},${T} L ${B+W},${T+3}" stroke="${E}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),M=`<g class="hw-wg-full" style="animation-duration:${$}s">${ee}</g>`,z=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',K=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return _e("magnetosphere",{magnetInfo:e,bz:s,windKms:t,uid:n})}}function _e(e,s={}){var M,z,K,B,T,Z;let r=(M=s.uid)!=null?M:"hse",i=0,l=160,a=800,c=17,d=a-c,p=s.magnetInfo,h=(z=p==null?void 0:p.state)!=null?z:"stable",g=(K=p==null?void 0:p.color)!=null?K:"#e0a84a",f=a-(h==="storm"?55:h==="active"?80:110),w=h==="storm"?58:h==="active"?76:95,b=1120,x=20,v=[`M ${f},130`,`C ${f-8},${130-w*.55} ${a-18},${130-w} ${a},${130-w}`,`C ${a+120},${130-w} ${b-180},${130-x} ${b},${130-x}`,`L ${b},${130+x}`,`C ${b-180},${130+x} ${a+120},${130+w} ${a},${130+w}`,`C ${a-18},${130+w} ${f-8},${130+w*.55} ${f},130`,"Z"].join(" "),y=e==="magnetosphere",_=y?h==="storm"?"0.12":"0.08":"0.04",C=y?"0.75":"0.28",L=`<g id="${r}-base-sun">
    <circle cx="${i}" cy="130" r="${l+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${i}" cy="130" r="${l}" fill="#f0c040" opacity="0.88"/>
  </g>`,E=`
    <ellipse cx="${a}" cy="130" rx="${c}" ry="${(c*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${a}" y1="${130-c}" x2="${a}" y2="${130+c}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${d}" y1="130" x2="${a+c}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,$=`<g id="${r}-base-earth">
    <circle cx="${a}" cy="130" r="${c}" fill="#1a4a6e" opacity="0.92"/>
    ${E}
  </g>`,k=`<g id="${r}-base-magnetosphere">
    <path d="${v}" fill="${g}" fill-opacity="${_}"
          stroke="${g}" stroke-opacity="${C}" stroke-width="1.8"/>
    ${p?`<text x="${f+5}" y="${130-w-7}" font-size="12" fill="${g}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,H=`<g id="${r}-base-axis">
    <line x1="${l}" y1="130" x2="${f}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,O="";if(e==="magnetosphere"){let R=(B=s.windKms)!=null?B:0,D=R>500,U=R<350,I=(D?.5:U?1.4:.9)*1.3,G=R>700?"#e05c5c":R>500?"#e0a84a":R>350?"#d4c840":"#5cce8c",J=l+8,te=f-14,Y=8,S=6,P=(te-J)/(Y-1),j=260/(S+1),se=38,ae=24,ie=2,de=Array.from({length:Y},(le,he)=>{let re=J+he*P,ce=Array.from({length:S},(Se,oe)=>{let ne=j*(oe+1);return`<path d="M ${re.toFixed(1)},${ne.toFixed(1)} L ${(re+se).toFixed(1)},${ne.toFixed(1)} M ${(re+ae).toFixed(1)},${(ne-6).toFixed(1)} L ${(re+se).toFixed(1)},${ne.toFixed(1)} L ${(re+ae).toFixed(1)},${(ne+6).toFixed(1)}"
          stroke="${G}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:ie},(Se,oe)=>{let ne=-((Y-he)/Y*I)-oe*I/ie;return`<g style="opacity:.12;animation:hw-arrow-chase ${I}s linear ${ne.toFixed(3)}s infinite">${ce}</g>`}).join("")}).join(""),A=(T=s.bz)!=null?T:null,pe=A==null?"":(()=>{let le=A>0?"#5cce8c":"#e05c5c";return`${A>0?`<path d="M ${a},137 L ${a},123 M ${a-3},126 L ${a},123 L ${a+3},126"
           stroke="${le}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${a},123 L ${a},137 M ${a-3},134 L ${a},137 L ${a+3},134"
           stroke="${le}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${a+22}" y="135" font-size="13"
        fill="${le}" font-family="monospace">Bz${A>0?"\u2191":"\u2193"}</text>`})();O=`${de}${pe}`}let X=`<g id="${r}-overlay-solar-wind">${O}</g>`,Q="";if(e==="coronal_hole"&&s.hssState){let R=s.hssState,D=(Z=R.speed)!=null?Z:0,U=D>=420,I=R.color,G=U?"0.85":"0.25",J=D>=500?"0.18":U?"0.10":"0.04",te=l+8,Y=d-16,S=60,P=`${te},130 ${Y},${130-S} ${Y},${130+S}`,j=Y+6,se=`${j},120 ${j+18},130 ${j},140`;Q=`
    <polygon points="${P}" fill="${I}" opacity="${J}"/>
    <line x1="${te}" y1="130" x2="${Y-5}" y2="130"
          stroke="${I}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${G}"/>
    <polygon points="${se}" fill="${I}" opacity="${U?"0.9":"0.25"}"/>`}let V=`<g id="${r}-overlay-coronal-hole">${Q}</g>`,F="";if(e==="cme_cone"&&s.cmeState){let R=s.cmeState,D=l,U=d-10,I=U-D,G=P=>Math.tan(P*Math.PI/180),J=Math.round(G(9)*I),te=Math.round(G(6)*I),Y=Math.round(G(3)*I),S=P=>`${D},130 ${U},${130-P} ${U},${130+P}`;if(R.status!=="quiet"){let P=R.status==="impact"?"#e05c5c":"#d4cc5c";F=`
    <polygon points="${S(J)}" fill="#253238" opacity="0.85"/>
    <polygon points="${S(te)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${S(Y)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${D+14}" y1="130" x2="${U-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${a}" cy="130" r="${c+8}" fill="none"
            stroke="${P}" stroke-width="7" opacity="0.16"/>`}else F=`
    <line x1="${D+14}" y1="130" x2="${d-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let W=`<g id="${r}-overlay-cme-cone">${F}</g>`,ee=`<g id="${r}-overlay-labels">
    <text x="18" y="250" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${a}" y="252" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;return`<svg class="hw-solar-earth-scene" viewBox="0 0 1000 260"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="260" fill="#0a1014"/>
    ${H}
    ${X}
    ${V}
    ${W}
    ${L}
    ${k}
    ${$}
    ${ee}
  </svg>`}function Ft(e){let s=we(e),t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=e.metrics.kp_latest,r=e.metrics.density,i=e.metrics.pressure_npa,l=t!=null?(t>=0?"+":"")+t.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",c=r!=null?`${r.toFixed(1)} p/cm\xB3`:"\u2014",d=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=t!=null?t<=-10?"#e05c5c":t<=-5?"#e0a84a":t>=5?"#5cce8c":"#a0b4b8":"#607880",h=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",g=t!=null&&t<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":t!=null&&t<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ge("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Tt(s,t,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(a)}</span>
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
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function Ot(e,s){if(!s)return"";let t=we(e),o=e.metrics.imf_bz_nt,n=e.metrics.solar_wind_kms,r=e.metrics.density,i=e.metrics.pressure_npa,l=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",a=n!=null?`${Math.round(n)} km/s`:"\u2014",c=r!=null?`${r.toFixed(1)} p/cm\xB3`:"\u2014",d=i!=null?`${i.toFixed(2)} nPa`:"\u2014",p=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",h=n!=null?n>700?"#e05c5c":n>500?"#e0a84a":n>350?"#d4c840":"#5cce8c":"#607880",g=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${_e("magnetosphere",{windKms:n!=null?n:void 0,bz:o!=null?o:void 0})}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${m(a)}</span>
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
        <span class="hw-kpi-stat-value">${m(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${m(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${m(g)}</div>
  </div>`}function Xe(e,s,t){if(!e.length)return null;let o=(t%360+360)%360,n=-1,r=1/0,i=Math.cos(s*Math.PI/180);for(let l of e){let a=l.lat-s,c=(l.lon-o+180+360)%360-180,d=a*a+c*i*(c*i);d<r&&(r=d,n=l.prob)}return n>=0?n:null}function Ke(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Rt(e,s){let t=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&e.lat!=null&&e.lon!=null&&(o=Xe(s.entries,e.lat,e.lon));let n=e.lat!=null&&e.lon!=null,r=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",i=o!=null?`${o}%`:s?"n/a":"\u2026",l=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?m(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${r}">Aurora: ${i}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ge("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${N(t)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Ke(e)}
    </div>
    ${l}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function It(e,s,t,o){switch(s){case"solar_wind":return Ht(e);case"xray":return Et(e);case"imf_bz":return zt(e);case"aurora":return Rt(t,o);case"magnetosphere":return Ft(e);default:return""}}function $e(e,s){if(e.length<2)return"\u2192";let t=e[e.length-1],o=Math.max(0,e.length-4),n=e[o];if(!isFinite(t)||!isFinite(n))return"\u2192";let r=t-n;return r>s?"\u2191":r<-s?"\u2193":"\u2192"}function Nt(e,s,t){let o=ue[s],n=ss,r=es(o.url,t);return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner">
      <img class="hw-solar-mini-img" src="${N(r)}" alt="${N(o.label)}"
        onerror="if(this.src!=='${N(n)}')this.src='${N(n)}'" />
      <video class="hw-solar-mini-video" autoplay loop muted playsinline
        oncanplay="this.style.opacity=1"
        aria-label="Solar disk \xB7 ${N(o.label)} \xB7 last 24h">
        <source src="${N(os)}" type="video/mp4">
      </video>
    </div>
    <div class="hw-solar-mini-switcher">
      <button class="hw-solar-mini-btn" data-solar-prev>&#8249;</button>
      <span class="hw-solar-mini-lbl">${N(o.label)}</span>
      <button class="hw-solar-mini-btn" data-solar-next>&#8250;</button>
    </div>
  </div>`}function Pt(e,s,t,o,n,r,i,l=0){var R,D,U,I,G,J,te,Y;let{summary:a,scales:c,metrics:d,aurora_hint:p}=e,h=(R=Pe[a.status])!=null?R:Pe.quiet,g=n!=null?n.kp.toFixed(1):d.kp_latest!=null?d.kp_latest.toFixed(1):"\u2014",u=_t(e,n),w=[{key:"G",text:u.g,title:"Geomagnetic storm level. Based on Kp index.",aria:"Geomagnetic storm level"},{key:"R",text:u.r,title:"Radio blackout level. Based on solar X-ray flux.",aria:"Radio blackout level"},{key:"S",text:u.s,title:"Solar radiation storm level. Based on energetic proton flux.",aria:"Solar radiation storm level"},{key:"X",text:`X:${u.x}`,title:"Current solar X-ray activity class.",aria:"Solar X-ray activity"}].map(S=>{let P=yt[S.key],j;return S.key==="G"?j=Ee(He(u.g,"G")):S.key==="R"?j=Ee(He(u.r,"R")):S.key==="S"?j=Ee(He(u.s,"S")):j=kt(u.x),`<button type="button" class="hw-scale-chip hw-hero-scale-chip"
      style="${`color:${j.color};background:${j.background};border-color:${j.borderColor}`}" data-hero-scroll="${N(P)}" title="${N(S.title)}" aria-label="${N(S.aria)}">${m(S.text)}</button>`}).join(""),b=n?n.auroraLabel:p.aurora_label,x=b==="good"?"#5cce8c":b==="possible"?"#d4cc5c":"#607880",v=b.charAt(0).toUpperCase()+b.slice(1),y="#b4c6cc",_=d.solar_wind_kms!=null?`${Math.round(d.solar_wind_kms)} km/s`:"\u2014",C=d.imf_bz_nt,L=C!=null?C<=-10?"#e05c5c":C<=-5?"#e0a84a":C>=5?"#5cce8c":"#a0b4b8":"#607880",E=C!=null?(C>=0?"+":"")+C.toFixed(1)+" nT":"\u2014",$=d.xray_class,k=$?(D=ke[$])!=null?D:"#a0b4b8":"#607880",H=$?`${$}-class`:"\u2014",O=$e(((U=d.kp_history_1h)!=null?U:[]).map(S=>S.kp),.5),X=$e(((I=d.wind_history_1h)!=null?I:[]).map(S=>S.kms),20),Q=$e(((G=d.bz_history_1h)!=null?G:[]).map(S=>S.bz),1.5),V=$e(((J=d.xray_history_1h)!=null?J:[]).map(S=>Math.log10(S.flux+1e-9)),.15),F=(te=d.kp_history_1h)!=null?te:[],W=F.length?me(F[F.length-1].t_utc):null,ee=W?`Recent history \xB7 Last step ${W}`:"Recent history",M=we(e),z=(Y=d.kp_latest)!=null?Y:0,K=z>=5,B=K?`linear-gradient(160deg, #0d2a1a 0%, ${h.bg}22 75%)`:`${h.bg}18`,T=(S,P,j,se,ae)=>{let ie=ae?`<span class="hw-trend">${ae}</span>`:"";return`<div class="hw-kpi-item${o===S?" hw-kpi-active":""}" data-kpi="${S}">
      <span class="hw-qd-label">${P}</span>
      <span class="hw-qd-value" style="color:${se}">${j}${ie}</span>
    </div>`},Z=K?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${z.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${B}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${n?"color:#9acf60":""}">Kp <b>${m(g)}</b>${n?"":`<span class="hw-trend">${O}</span>`}</div>
          <span class="hw-status-badge" style="background:${h.accent}22;color:${h.accent};display:block;text-align:center">${m(a.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${w}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${m(a.text)}</div>
            ${Nt(o,l,r.baseUrl)}
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${t?"0":"4px"}">
        <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${t?`
      <div class="hw-quick-details">
        ${T("aurora","Aurora",m(v),x)}
        ${T("solar_wind","Solar wind",m(_),y,X)}
        ${T("imf_bz","IMF Bz",m(E),L,Q)}
        ${T("xray","X-ray",m(H),k,V)}
      </div>
      ${o?It(e,o,r,i):""}`:""}
      ${Z}
    </div>`}function Bt(e){var d,p,h,g;let{metrics:s}=e,t=(d=s.kp_history_1h)!=null?d:[],o=(p=s.wind_history_1h)!=null?p:[],n=(h=s.bz_history_1h)!=null?h:[],r=(g=s.xray_history_1h)!=null?g:[],i=Mt(t),l=je(o.map(u=>{var f;return(f=u.kms)!=null?f:0}).filter(u=>u>0),o.map(u=>ye(u.t_utc)),"#5cce8c",28,!1),a=je(n.map(u=>u.bz),n.map(u=>ye(u.t_utc)),"#d4cc5c",28,!0),c=Lt(r);return`
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
        <div class="hw-spark-wrap">${l}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${c}</div>
      </div>
    </div>`}function Dt(e){let s=$t(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${m(s)}</span>
    </div>`}function Yt(e){return e.map((s,t)=>t===0?(s+e[1])/2:t===e.length-1?(e[t-1]+s)/2:(e[t-1]+s+e[t+1])/3)}function jt(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Wt(e){return e>=5?"good":e>=3?"possible":"none"}function qe(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ut(e){let s=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",t=qe(e),o=s==="none"?"No aurora expected at mid-latitudes":t!=null?`Aurora possible equatorward of ~${t}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",r=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:r},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Gt(e,s){var p;if(s<=0)return null;let t=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!t.length)return null;let o=Date.now()+s*36e5,n=t[0],r=1/0;for(let h of t){let g=Math.abs(new Date(h.t_utc).getTime()-o);g<r&&(r=g,n=h)}let i=n.kp,l=jt(i),a=Wt(i),c=qe(i),d=Ut(i);return{offsetH:s,kp:i,gScale:l,auroraLabel:a,auroraMinLat:c,impacts:d}}function Xt(e,s,t,o){var ee;let{forecast:n,metrics:r}=e,{kp_max_next_24h:i,kp_max_at_utc:l,trend:a}=n,c=((ee=r.kp_forecast_3h)!=null?ee:[]).slice(0,16),d=c.length,p=d*3,h=p>0?`${(s/p*100).toFixed(0)}%`:"0%",g=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",u="Kp forecast unavailable";if(i!=null){let M=me(l),z=a==="rising"?"rising":a==="falling"?"falling":"steady";u=`Peak Kp ${i.toFixed(1)} next 24h${M?` at ${M}`:""} \xB7 ${z}`}let f=c.length?me(c[0].t_utc):null,w=f?`Forecast \xB7 Next step ${f}`:"Forecast";if(!c.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(w)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${m(u)}</div>`:""}
    </div>`;let b=320,x=38,v=14,y=x+v,_=b/d,C=M=>x-Math.max(2,Math.min(x-2,M/9*(x-2))),L="",E=c.map(M=>M.kp),$=Yt(E);c.forEach((M,z)=>{let K=C(M.kp),B=x-K,T=z*_,Z=T+_/2,R=M.kp>=6?"#e05c5c":M.kp>=5?"#e0a84a":M.kp>=4?"#d4cc5c":"#5cce8c",D=`Kp ${M.kp.toFixed(1)} \xB7 ${me(M.t_utc)}`;if(L+=`<rect x="${T.toFixed(1)}" y="${K.toFixed(1)}" width="${(_-1.5).toFixed(1)}" height="${B.toFixed(1)}" fill="${R}" fill-opacity="0.85" rx="1.5"/>`,L+=`<rect x="${T.toFixed(1)}" y="0" width="${_.toFixed(1)}" height="${x}" fill="transparent"><title>${N(D)}</title></rect>`,d<=8||z%2===0){let I=new Date(M.t_utc).getHours();L+=`<text x="${Z.toFixed(1)}" y="${(y-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${I.toString().padStart(2,"0")}</text>`}});let H=`<polyline points="${c.map((M,z)=>{let K=z*_+_/2,B=C($[z]);return`${K.toFixed(1)},${B.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,O="";if(s>0&&d>0){let M=Math.min(b-1,s/(d*3)*b);O=`
      <line x1="${M.toFixed(1)}" y1="0" x2="${M.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${M.toFixed(1)},${x} ${(M-4).toFixed(1)},${(x-7).toFixed(1)} ${(M+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let X=Math.round(p/4),Q=Math.round(p/2),V=Math.round(p*3/4),F=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${m(g)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${X}h</span>
        <span class="hw-scrub-tick">+${Q}h</span>
        <span class="hw-scrub-tick">+${V}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,W=t?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(t.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${t.kp.toFixed(1)} \xB7 ${t.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${m(w)}</span>
      </div>
      ${o?`
      ${W}
      <div class="hw-forecast-text">${m(u)}</div>
      <svg viewBox="0 0 ${b} ${y}" style="width:100%;height:${y}px;display:block" preserveAspectRatio="none">
        ${L}
        ${H}
        ${O}
      </svg>
      ${F}`:""}
    </div>`}function Kt(e){let s=/([NS])(\d+)([EW])(\d+)/i.exec(e);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var Qe=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function qt(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function Qt(e,s,t){let o=s/2,n=o*.87,r=s*.03,i=s*.009,l=e.map(a=>{var b,x;let c=Kt(a.location);if(!c||Math.abs(c.lon)>88||a.location.includes("*"))return"";let d=qt(a);if(!t.has(d))return"";let p=Qe.find(v=>v.id===d).color,h=c.lat*Math.PI/180,g=c.lon*Math.PI/180,u=(o+n*Math.cos(h)*Math.sin(g)).toFixed(1),f=(o-n*Math.sin(h)).toFixed(1),w=`AR ${a.region} \xB7 ${a.location}
Class: ${(b=a.spot_class)!=null?b:"\u2014"} / ${(x=a.mag_class)!=null?x:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${m(w)}</title>
      <circle cx="${u}" cy="${f}" r="${(r+i+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(i*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${u}" cy="${f}" r="${r.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${i.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Vt={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Zt='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Jt="https://staging.nebulacast.app";function es(e,s){return!e||/^https?:\/\//.test(e)||e.startsWith("//")?e:(s!=null?s:Jt).replace(/\/$/,"")+(e.startsWith("/")?e:"/"+e)}var ts="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ue=[{id:"eit171",label:"EIT 171",url:"/assets/gifs/current_eit_171.gif"},{id:"eit195",label:"EIT 195",url:"/assets/gifs/current_eit_195.gif"},{id:"eit284",label:"EIT 284",url:"/assets/gifs/current_eit_284.gif"},{id:"eit304",label:"EIT 304",url:"/assets/gifs/current_eit_304.gif"},{id:"cont",label:"Continuum",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg"},{id:"mag",label:"Magnetogram",url:"https://soho.nascom.nasa.gov/data/realtime/hmi_mag/512/latest.jpg"}],ss="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Es=ue[0].url,os="https://sdo.gsfc.nasa.gov/assets/img/latest/mpeg/latest_512_0171.mp4",ns=240;function as(e,s){var c,d,p;let t=parseInt(((c=e.scales.r_scale)!=null?c:"R0").slice(1),10),o=(d=e.metrics.xray_class)!=null?d:"A",n=e.metrics.xray_flux_wm2,r=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",l=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(h=>{let g=h.r===t,u=h.r<=t,f=u?h.color:"#1e2c30",w=g?"1":u?"0.5":"1",b=g?h.color:u?h.color+"99":"#566068",x=g?h.color:u?h.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${b}">R${h.r}</span>
      <div class="hw-radio-bbar" style="background:${f};opacity:${w}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${h.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${l}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=ke[o])!=null?p:"#a0b4b8"}">${m(o)}-class</b> \xB7 ${m(r)}</div>
  </div>`}var Ve={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c"};function Ze(e){var l;let s=(l=e.metrics.kp_forecast_3h)!=null?l:[],t=Date.now(),o=t+24*60*60*1e3,n=s.filter(a=>{let c=new Date(a.t_utc).getTime();return c>=t-3*60*60*1e3&&c<=o});if(n.length===0)return{g1:0,g2:0,g3:0};let r=Math.max(...n.map(a=>a.kp)),i=a=>{if(r<a-.7)return 0;if(r>a+1)return 90;let c=(r-(a-.7))/1.7;return Math.round(Math.pow(Math.max(0,c),.7)*90)};return{g1:i(5),g2:i(6),g3:i(7)}}var We={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function is(e){var c,d,p;let s=(c=e.metrics.kp_latest)!=null?c:0,t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=parseInt(((d=e.scales.g_scale)!=null?d:"G0").replace("G",""),10)||0,r=s>=5||n>=1,i=(p=e.metrics.kp_history_1h)!=null?p:[],l=0;if(i.length>=2&&(l=i[i.length-1].kp-i[i.length-2].kp),!r)return{active:!1,phase:"quiet",kp_current:s,kp_trend:l,bz_nt:t,solar_wind_kms:o};let a;return l>.3&&(t==null||t<-5)?a="rising":l<-.5?a="decline":a="peak",{active:!0,phase:a,kp_current:s,kp_trend:l,bz_nt:t,solar_wind_kms:o}}function rs(e){if(!e.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],t=s.findIndex(l=>l.key===e.phase),o=We[e.phase],n=s[t].label,r=s.map((l,a)=>{let c=a===t,d=a<t,p=We[l.key],h=c?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:d?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",g=c?" hw-spi-dot-active":"",u=c?`color:${p};font-weight:700`:d?`color:${p}66`:"color:#2e4248",f=a<s.length-1?`<div class="hw-spi-arr">${d?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${g}" style="${h}"></div>
        <div class="hw-spi-txt" style="${u}">${l.label}</div>
      </div>${f}`}).join(""),i=[`Kp ${e.kp_current.toFixed(1)}`];return e.bz_nt!=null&&i.push(`Bz ${e.bz_nt>0?"+":""}${e.bz_nt.toFixed(1)} nT`),e.solar_wind_kms!=null&&i.push(`Wind ${Math.round(e.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${r}</div>
    <div class="hw-spi-params">${i.join(" \xB7 ")}</div>
  </div>`}function ls(e,s){let t=Ze(e),o=is(e),n=(()=>{var g;let c=(g=e.metrics.kp_forecast_3h)!=null?g:[],d=Date.now(),p=d+24*60*60*1e3,h=c.filter(u=>new Date(u.t_utc).getTime()<=p);return h.length?Math.max(...h.map(u=>u.kp)):null})(),i=[{key:"g1",label:"G1"},{key:"g2",label:"G2"},{key:"g3",label:"G3"}].map(({key:c,label:d})=>{let p=t[c],h=Ve[c];return`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${h};${p===0?" opacity:.35":""}">${d}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${p}%;background:${h}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${p>0?h:"#607880"}">${p}%</span>
    </div>`}).join(""),l=n!=null?`Max Kp forecast 24h: <b style="color:#b4c6cc">${n.toFixed(1)}</b>`:"";return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${rs(o)}
    <div class="hw-gstorm-header">Storm probability \xB7 next 24h</div>
    <div class="hw-gstorm-rows">${i}</div>
    ${l?`<div class="hw-gstorm-footer">${l} \xB7 derived from Kp forecast</div>`:""}
  </div>`}var ve={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},Je={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function cs(e){var $;let s=ve,t=($=Je[s.phase])!=null?$:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,r=52,i=10,l=r-6,a=r-18,c=.5,d=.19,p=k=>Math.exp(-Math.pow((k-c)/d,2)/2),h=k=>i+k*(n-2*i),g=k=>l-p(k)*a,u=80,f=[];for(let k=0;k<=u;k++){let H=k/u;f.push(`${k===0?"M":"L"}${h(H).toFixed(1)},${g(H).toFixed(1)}`)}let w=Math.round(s.progress_0_1*u),b=[];for(let k=0;k<=w;k++){let H=k/u;b.push(`${k===0?"M":"L"}${h(H).toFixed(1)},${g(H).toFixed(1)}`)}let x=h(s.progress_0_1),v=[`M${i},${l}`,...b.slice(1),`L${x.toFixed(1)},${l} Z`],y=g(s.progress_0_1),_=5,C=`M${x.toFixed(1)},${y.toFixed(1)} L${(x-_).toFixed(1)},${(y-_*1.8).toFixed(1)} L${(x+_).toFixed(1)},${(y-_*1.8).toFixed(1)} Z`,L=l+11;return`<div class="hw-impact-tip${e?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${m(s.cycle_name)}</div>
    <svg width="100%" height="${r+14}" viewBox="0 0 ${n} ${r+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${v.join(" ")}" fill="${t}" opacity="0.12"/>
      <path d="${f.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${b.join(" ")}" fill="none" stroke="${t}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${i}" y1="${l}" x2="${n-i}" y2="${l}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${C}" fill="${t}"/>
      <text x="${i+2}" y="${L}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${h(.5).toFixed(1)}" y="${L}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-i-2).toFixed(1)}" y="${L}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${t}">${m(o)}</b>${s.subtitle?` \xB7 ${m(s.subtitle)}`:""}</div>
  </div>`}function et(e){var a,c,d,p,h;let s=(c=(a=e.coronal_hole)==null?void 0:a.estimated_speed_kms)!=null?c:e.metrics.solar_wind_kms,t=(d=e.coronal_hole)==null?void 0:d.status,o=s!=null?s:0,n=t!=null?t:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",r={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},i={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},l={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:r[n],label:i[n],desc:(h=(p=e.coronal_hole)==null?void 0:p.note)!=null?h:l[n],speed:s}}function ds(e,s){var c;let t=et(e),o=(c=t.speed)!=null?c:0,n=t.speed!=null?`${Math.round(t.speed)} km/s`:"\u2014",r=s?" hw-impact-tip-open":"",i=o>=420,l=_e("coronal_hole",{hssState:t,uid:"hss"}),a=i?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${r}">
    ${l}
    <div class="hw-hss-meta">Solar wind: <b style="color:${t.color}">${m(n)}</b> \xB7 ${m(t.desc)}</div>
    ${a}
  </div>`}function tt(e){var n,r;let s=(n=e.scales.g_scale)!=null?n:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let i=(r=e.metrics.kp_forecast_3h)!=null?r:[],l=Date.now(),a=i.filter(c=>new Date(c.t_utc).getTime()<=l+3*60*60*1e3).sort((c,d)=>new Date(d.t_utc).getTime()-new Date(c.t_utc).getTime());a.length>0&&(o=a[0].kp)}return t>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:t>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function ps(e,s){let t=tt(e),o=s?" hw-impact-tip-open":"",r=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(a=>{let c=a.l===t.level,d=c?a.color:"#566068",p=c?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${d}">${a.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${a.width}%;background:${a.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${c?a.color:"transparent"}">${c?"\u25C0":""}</span>
    </div>`}).join(""),i=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",l={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${r}</div>
    <div class="hw-satdrag-meta">${i} \xB7 ${m(t.gScale)} \xB7 ${l[t.level]}</div>
  </div>`}function st(e){var c,d,p;let s=(c=e.scales.g_scale)!=null?c:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let h=(d=e.metrics.kp_forecast_3h)!=null?d:[],g=Date.now(),u=h.filter(f=>new Date(f.t_utc).getTime()<=g+3*60*60*1e3).sort((f,w)=>new Date(w.t_utc).getTime()-new Date(f.t_utc).getTime());u.length>0&&(o=u[0].kp)}let n=0;t>=2||o!=null&&o>=6?n=2:(t>=1||o!=null&&o>=4)&&(n=1);let r=parseInt(((p=e.scales.r_scale)!=null?p:"R0").slice(1),10),i=r>=2&&n<2;r>=2&&(n=Math.min(2,n+1));let l={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:l[n],label:a[n],kp:o,gScale:s,boostedByFlare:i}}function hs(e,s){var c;let t=st(e),o=s?" hw-impact-tip-open":"",r=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(d=>{let p=d.l===t.level,h=p?d.color:"#566068",g=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${h}">${d.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${d.width}%;background:${d.color};opacity:${g}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?d.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),i=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",l={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=t.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((c=e.scales.r_scale)!=null?c:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${r}</div>
    <div class="hw-gnss-meta">${i} \xB7 ${m(t.gScale)} \xB7 ${l[t.level]}</div>
    ${a}
  </div>`}function ot(e){var n;let s=e.metrics.pressure_npa,t=s!=null?s:null,o=(n=e.metrics.density)!=null?n:null;return t==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:t>=6?{pressure:t,color:"#e05c5c",label:"Extreme",density:o}:t>=4?{pressure:t,color:"#e0a84a",label:"Strong",density:o}:t>=2?{pressure:t,color:"#d4cc5c",label:"Elevated",density:o}:t>=1?{pressure:t,color:"#5cce8c",label:"Typical",density:o}:{pressure:t,color:"#7a9298",label:"Weak",density:o}}function ms(e,s){let t=ot(e),o=s?" hw-impact-tip-open":"",n=t.pressure,r=200,i=6,l=10,a=i+l,c=a+4,d=c+11,p=a+9,h=d+4,u=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map($=>`<rect x="${$.x}" y="${i}" width="${$.w}" height="${l}" fill="${$.color}" opacity="0.55" rx="0"/>`).join(""),f=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],w=f.map($=>`<line x1="${$.x}" y1="${a}" x2="${$.x}" y2="${c}" stroke="#3a5058" stroke-width="1"/>`).join(""),b=f.map($=>`<text x="${$.x}" y="${d}" class="hw-swdp-axlabel" text-anchor="${$.anchor}">${$.label}</text>`).join(""),x="";if(n!=null){let k=Math.min(Math.max(n,0),8)/8*r;x=`<polygon points="${`${k-5},${p} ${k+5},${p} ${k},${a}`}" fill="${t.color}" opacity="0.95"/>
    <line x1="${k}" y1="${i}" x2="${k}" y2="${a}" stroke="${t.color}" stroke-width="1.5" opacity="0.7"/>`}let v=`<rect x="0" y="${i}" width="${r}" height="${l}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,y=`<svg class="hw-swdp-gauge" viewBox="0 0 ${r} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${u}${v}${x}${w}${b}
  </svg>`,_=n!=null?`${n.toFixed(2)} nPa`:"\u2014",C=t.density!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",L=e.metrics.solar_wind_kms!=null?`${Math.round(e.metrics.solar_wind_kms)} km/s`:"\u2014",E=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${y}
    <div class="hw-swdp-meta"><b style="color:${t.color}">${m(_)}</b>${m(E)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${m(L)} \xB7 Density ${m(C)}</div>
  </div>`}function nt(e){var c,d;let s=(c=e.alerts_all)!=null?c:[],t=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=t!=null?t:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let r=((d=n.raw_body)!=null?d:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),i=r?parseInt(r[1],10):null,l=null;if(i&&n.t_utc){let p=1496e5/i*1e3;l=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let a=t?"impact":"watch";return{status:a,color:a==="impact"?"#e05c5c":"#d4cc5c",label:a==="impact"?"Active":"Watch",speed_kms:i,issued_utc:n.t_utc,arrival_utc:l}}function us(e,s){let t=nt(e),o=s?" hw-impact-tip-open":"",n="\u2014";if(t.arrival_utc){let a=new Date(t.arrival_utc),c=a.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),d=a.getUTCDate(),p=String(a.getUTCHours()).padStart(2,"0"),h=String(a.getUTCMinutes()).padStart(2,"0");n=`~${c}\xA0${d}\xA0${p}:${h}\u202FUTC`}let r=t.speed_kms?`${t.speed_kms}\u202Fkm/s`:"\u2014",i=t.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${m(r)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${m(n)}</b>`:"No Earth-directed CME in forecast window",l=_e("cme_cone",{cmeState:t,uid:"cme"});return`<div class="hw-impact-tip${o}">
    ${l}
    <div class="hw-cme-footer">${i}</div>
  </div>`}function gs(e,s,t,o,n,r,i,l,a){var ae,ie,de;let c=(ie=(ae=s==null?void 0:s.impacts)!=null?ae:e.observer_impacts)!=null?ie:[],d=c.map(A=>{var ze,Te;let pe=(ze=wt[A.level])!=null?ze:"#666",le=A.level==="none"?"None":A.level.charAt(0).toUpperCase()+A.level.slice(1),he=(Te=Vt[A.kind])!=null?Te:Zt,re=A.level==="none"?"#606870":pe,ce=A.kind==="solar_activity"?n:i.has(A.kind),Se=ce?" hw-impact-open":"",oe;if(A.kind==="solar_activity"){let xe=n?" hw-solar-open":"",Ce=Qe.map(q=>{let fe=r.has(q.id),Me=fe?q.color+"22":"transparent",Le=fe?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${q.id}" style="color:${q.color};border-color:${q.color};background:${Me};opacity:${Le}">${q.label}</button>`}).join("");oe=`<div class="hw-solar-tip${xe}">
          <div class="hw-solar-disk-wrap" id="solar">
            <img class="hw-solar-disk-img" src="${ts}" alt="Solar disk" loading="lazy" />
            ${t?Qt(t,ns,r):""}
          </div>
          <div class="hw-solar-layers">${Ce}</div>
          <span class="hw-solar-tip-text">${m(A.summary)}</span>
        </div>`}else if(A.kind==="aurora"){let xe=ce?" hw-aurora-tip-open":"",Ce=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,q=null;l&&a.lat!=null&&a.lon!=null&&(q=Xe(l.entries,a.lat,a.lon));let fe=a.lat!=null&&a.lon!=null,Me=q!=null?q>=30?"#5cce8c":q>=10?"#d4cc5c":"#9ab4bc":"#607880",Le=q!=null?`${q}%`:l?"n/a":"\u2026",rt=fe?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${a.locationName?m(a.locationName)+" \xB7 ":""}${a.lat.toFixed(1)}\xB0${a.lat>=0?"N":"S"} ${Math.abs(a.lon).toFixed(1)}\xB0${a.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${Me}">Aurora: ${Le}</span>
        </div>`:"";oe=`<div class="hw-aurora-tip${xe}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${N(Ce)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${Ke(a)}
          </div>
          ${rt}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else A.kind==="radio"?oe=as(e,ce):oe=`<div class="hw-impact-tip${ce?" hw-impact-tip-open":""}">${m(A.summary)}</div>`;let ne=A.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${N(A.kind)}"`,it=A.kind==="radio"?' id="radio"':A.kind==="solar_activity"?' id="radiation"':"";return`<div class="hw-impact-row${Se}"${it}${ne}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${re}">${he}<span style="color:#b4c6cc">${m(A.label)}</span></span>
      <span class="hw-impact-badge" style="background:${pe}22;color:${pe}">${m(le)}</span>
      ${oe}
    </div>`}).join(""),p=s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",h=c.length+8,g=o?"\u25BC":"\u25B6",u=h>0?`Observer Impacts (${h})`:"Observer Impacts",f=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${u}${p}</span>
    </div>`,w=i.has("geomag_storm"),b=Ze(e),x=b.g1,v=b.g1>=30?Ve.g1:b.g1>0?"#7a9298":"#607880",y=x>0?`G1 ${x}%`:"None",C=`<div class="hw-impact-row${w?" hw-impact-open":""}" id="geomagnetic" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${v}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span><span style="color:#607880;font-size:.85em;font-weight:normal"> \u2014 Next 24h</span></span>
      <span class="hw-impact-badge" style="background:${v}22;color:${v}">${y}</span>
      ${ls(e,w)}
    </div>`,L=i.has("solar_cycle"),E=(de=Je[ve.phase])!=null?de:"#96a8b8",$=ve.phase.charAt(0).toUpperCase()+ve.phase.slice(1),H=`<div class="hw-impact-row${L?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${E}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${E}22;color:${E}">${$}</span>
      ${cs(L)}
    </div>`,O=et(e),X=i.has("hss"),V=`<div class="hw-impact-row${X?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${O.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${O.color}22;color:${O.color}">${O.label}</span>
      ${ds(e,X)}
    </div>`,F=tt(e),W=i.has("sat_drag"),M=`<div class="hw-impact-row${W?" hw-impact-open":""}" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${F.color}22;color:${F.color}">${F.label}</span>
      ${ps(e,W)}
    </div>`,z=st(e),K=i.has("gnss"),T=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${z.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${z.color}22;color:${z.color}">${z.label}</span>
      ${hs(e,K)}
    </div>`,Z=ot(e),R=i.has("sw_pressure"),D=Z.pressure!=null?`${Z.pressure.toFixed(2)} nPa`:"\u2014",I=`<div class="hw-impact-row${R?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${Z.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${Z.color}22;color:${Z.color}">${D}</span>
      ${ms(e,R)}
    </div>`,G=nt(e),J=i.has("cme_cone"),Y=`<div class="hw-impact-row${J?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${G.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${G.color}22;color:${G.color}">${m(G.label)}</span>
      ${us(e,J)}
    </div>`,S=we(e),P=i.has("magnetosphere"),se=`<div class="hw-impact-row${P?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${S.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${S.color}22;color:${S.color}">${m(S.label)}</span>
      ${Ot(e,P)}
    </div>`;return`
    <div class="hw-impacts">
      ${f}
      ${o?d+C+se+H+V+M+T+I+Y:""}
    </div>`}var Ue={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function ws(e,s){var a,c;let t=(a=xt[e.level])!=null?a:"#666",o=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(c=Ue[e.kind])!=null?c:Ue.unknown,r=[vt(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),i=s&&e.raw_body?`<div class="hw-alert-body">${m(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${t}" data-alert-key="${N(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${t}">${n}</span>
      <span class="hw-alert-level" style="color:${t}">${m(o)}</span>
      <span class="hw-alert-title">${m(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${m(e.summary_short)}</div>
    <div class="hw-alert-meta">${m(r)}</div>
    ${i}
  </div>`}var xs={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},fs="#4ae0a4";function bs(e){let s=(t,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${t}</svg>`;switch(e){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function $s(e){var o;let s=(o=e.metadata)!=null?o:{},t=[];return s.source_code&&t.push(`Code: ${s.source_code}`),s.model&&t.push(`Model: ${String(s.model).toUpperCase()}`),t.length===0?"":`
${t.join(" \xB7 ")}`}function vs(e,s,t){var a;let o=e.is_active?fs:(a=xs[e.level])!=null?a:"#445c64",n=e.event_time===t,r=e.event_time.slice(11,16)+" UTC",i=e.source==="NASA_DONKI"?"DONKI":"SWPC",l=n?`<div class="hw-tl-detail">${m(e.description)}${m($s(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${N(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${r}</span>
          <span class="hw-tl-src">${i}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${bs(e.event_type)} ${m(e.event_title)}
        </div>
        ${l}
      </div>
    </div>`}function ys(e,s,t,o){var b,x;let n=(b=e.timeline)!=null?b:[],r=Date.now(),i=new Date(r).toISOString().slice(0,10),l=new Date(r-864e5).toISOString().slice(0,10),a=new Date(r-1728e5).toISOString().slice(0,10),c=new Set([i,l,a]),d=n.filter(v=>{var y;return c.has(((y=v.event_time)!=null?y:"").slice(0,10))}).slice().reverse(),p=d.length,h=t?"\u25BC":"\u25B6",g=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",u=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${h}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!t||p===0)return`<div class="hw-timeline">${u}</div>`;let f=new Map;for(let v of d){let y=((x=v.event_time)!=null?x:"").slice(0,10);f.has(y)||f.set(y,[]),f.get(y).push(v)}let w=[...f.entries()].map(([v,y])=>{let C=new Date(v+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),L=o.has(v),E=L?"\u25B6":"\u25BC",$=L?`<span class="hw-tl-day-count">${y.length} events</span>`:"",k=`
      <div class="hw-tl-day-row" data-tl-day="${N(v)}">
        <span class="hw-section-caret">${E}</span>
        <span class="hw-tl-date">${C}</span>
        ${$}
      </div>`,H=L?"":y.map((O,X)=>vs(O,X<y.length-1,s)).join("");return`<div class="hw-tl-group">${k}${H}</div>`}).join("");return`
    <div class="hw-timeline">
      ${u}
      ${w}
    </div>`}function ks(e,s,t){var c;let o=(c=e.alerts_all)!=null?c:[],n=o.length,r=s?"\u25BC":"\u25B6",i=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${r}</span>
        <span class="hw-alerts-label">${i}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${l}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=o.map(d=>ws(d,d.dedupe_key===t)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${a}
    </div>`}function _s(e,s){var Q,V,F;let t=e.cme_tracker;if(!t)return"";let o=(Q=ft[t.impact_level])!=null?Q:"#96a8b8",n=(V=bt[t.status])!=null?V:t.status,r=300,i=44,l=18,a=i/2,c=10,d=r-18,p=7,h=`<line x1="${l+c}" y1="${a}" x2="${d-p}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${l}" cy="${a}" r="${c}" fill="#f0c040" opacity="0.92"/>`,u=`
    <circle cx="${d}" cy="${a}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,f=`<text x="${l}" y="${a+c+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,w=`<text x="${d}" y="${a+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,b="";if(t.progress!=null){let W=l+c+4,ee=d-p-4,M=W+t.progress*(ee-W),z=5;t.status==="arrival_window"?b=`
        <g transform="translate(${M.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${z}" fill="${o}" opacity="0.92"/>
        </g>`:b=`<circle cx="${M.toFixed(1)}" cy="${a}" r="${z}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${r} ${i}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${h}
    ${g}${f}
    ${u}${w}
    ${b}
  </svg>`,v=Be(t.arrival_time_utc),y=Be(t.launch_time_utc),_=t.speed_kms!=null?`${Math.round(t.speed_kms)} km/s`:"\u2014",C=t.half_angle_deg!=null?`${t.half_angle_deg}\xB0`:"\u2014",L=(F=t.source_location)!=null?F:"\u2014",E=t.is_earth_direct?"Direct hit":"Glancing blow",$=t.progress!=null?`${Math.round(t.progress*100)}%`:"\u2014",k=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${m(v)}</span>
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
          <span class="hw-cme-stat-value">${m(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${m(y)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${m($)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${m(C)} \xB7 Source: ${m(L)} \xB7 ${m(E)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,H=s?"\u25BC":"\u25B6",O=t.impact_level==="unknown"?"Unrated":t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1),X=s?`${x}${k}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${H}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${m(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${m(O)} impact</span>
      </div>
      ${X}
    </div>`}function Ss(e,s,t,o,n,r,i,l,a,c,d,p,h,g,u,f,w,b,x,v,y=0){var H;let _=Gt(e,n),C=(H=e.metrics.kp_history_1h)!=null?H:[],L=C.length?me(C[C.length-1].t_utc):null,E=L?`Recent history \xB7 Last step ${L}`:"Recent history",$=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${N(E)}</span>
  </div></div>`,k=t?Bt(e):"";return`
    <div class="hw-root">
      ${Dt(e)}
      ${Pt(e,t,g,o,_,x,v,y)}
      ${gs(e,_,u,d,f,w,b,v,x)}
      ${$}
      ${k}
      ${Xt(e,n,_,h)}
      ${_s(e,p)}
      ${ys(e,l,a,c)}
      ${ks(e,r,i)}
    </div>`}function Cs(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${m(e)}</div>
    </div>
  </div>`}function Ms(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Ge="nc-helio-ui",Ae=class{constructor(s,t){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.solarChannelIdx=0;this.solarChannelAutoSet=!1;this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=t,this.loadUiState(),this.el.innerHTML=Ms(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(s){var d,p,h,g,u,f;let t=s.target,o=t.closest("[data-hero-scroll]");if(o){let w=o.dataset.heroScroll;if(w){let b=()=>{var x;(x=document.getElementById(w))==null||x.scrollIntoView({behavior:"smooth",block:"start"})};this.impactsOpen?b():(this.impactsOpen=!0,this.saveUiState(),this.render(),requestAnimationFrame(()=>requestAnimationFrame(b)))}return}if(t.closest("[data-solar-prev]")){this.solarChannelIdx=(this.solarChannelIdx-1+ue.length)%ue.length,this.solarChannelAutoSet=!0,this.saveUiState(),this.render();return}if(t.closest("[data-solar-next]")){this.solarChannelIdx=(this.solarChannelIdx+1)%ue.length,this.solarChannelAutoSet=!0,this.saveUiState(),this.render();return}if(t.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(t.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(t.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.saveUiState(),this.render();return}if(t.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}let n=t.closest("[data-impact-row]");if(n){let w=(d=n.dataset.impactRow)!=null?d:"";this.expandedImpacts.has(w)?this.expandedImpacts.delete(w):this.expandedImpacts.add(w),this.saveUiState(),this.render();return}let r=t.closest("[data-solar-layer]");if(r){let w=(p=r.dataset.solarLayer)!=null?p:"";this.solarLayers.has(w)?this.solarLayers.delete(w):this.solarLayers.add(w),this.saveUiState(),this.render();return}if(t.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let i=t.closest("[data-alert-key]");if(i){let w=(h=i.dataset.alertKey)!=null?h:null;this.expandedAlertKey=this.expandedAlertKey===w?null:w,this.render();return}if(t.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let w=Date.now();this.collapsedDays=new Set([new Date(w).toISOString().slice(0,10),new Date(w-864e5).toISOString().slice(0,10),new Date(w-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let l=t.closest("[data-tl-day]");if(l){let w=(g=l.dataset.tlDay)!=null?g:"";this.collapsedDays.has(w)?this.collapsedDays.delete(w):this.collapsedDays.add(w),this.saveUiState(),this.render();return}let a=t.closest("[data-timeline-key]");if(a){let w=(u=a.dataset.timelineKey)!=null?u:null;this.expandedTimelineKey=this.expandedTimelineKey===w?null:w,this.render();return}if(t.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let c=t.closest("[data-kpi]");if(c){let w=(f=c.dataset.kpi)!=null?f:null;this.activePopover=this.activePopover===w?null:w,this.render();return}if(t.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}t.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(s){let t=s.target;if(!t.matches("[data-scrub]"))return;let o=parseFloat(t.value);this.scrubOffset=o,t.style.setProperty("--pct",`${(o/parseFloat(t.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s,t,o,n;try{let r=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);if(this.data=await r.json(),!this.solarChannelAutoSet){let i={quiet:1,active:0,elevated:2,storm:3};this.solarChannelIdx=(o=i[(t=(s=this.data.summary)==null?void 0:s.status)!=null?t:"quiet"])!=null?o:0,this.solarChannelAutoSet=!0}this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(r){let i=r instanceof Error?r.message:String(r);this.el.innerHTML=Cs(`Space weather data unavailable (${i})`)}finally{this.timer=setTimeout(()=>this.fetch(),(n=this.opts.refreshMs)!=null?n:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let t=await s.json(),o=new Map;for(let n of t){let r=o.get(n.region),i=n.area!=null,l=(r==null?void 0:r.area)!=null;(!r||!l&&i||l===i&&n.observed_date>r.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,t,o,n,r,i;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let a=await l.json(),d=((o=(t=(s=a.coordinates)!=null?s:a.Data)!=null?t:a.data)!=null?o:[]).map(([p,h,g])=>({lon:p,lat:h,prob:g}));this.ovationData={entries:d,forecastTime:String((i=(r=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?r:a["Observation Time"])!=null?i:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=Ss(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData,this.solarChannelIdx))}saveUiState(){try{localStorage.setItem(Ge,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,indicatorsOpen:this.indicatorsOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],expandedImpacts:[...this.expandedImpacts]}))}catch(s){}}loadUiState(){try{let s=localStorage.getItem(Ge);if(!s)return;let t=JSON.parse(s);typeof t.expanded=="boolean"&&(this.expanded=t.expanded),typeof t.heroExpanded=="boolean"&&(this.heroExpanded=t.heroExpanded),typeof t.alertsExpanded=="boolean"&&(this.alertsExpanded=t.alertsExpanded),typeof t.timelineOpen=="boolean"&&(this.timelineOpen=t.timelineOpen),typeof t.impactsOpen=="boolean"&&(this.impactsOpen=t.impactsOpen),typeof t.cmeExpanded=="boolean"&&(this.cmeExpanded=t.cmeExpanded),typeof t.forecastOpen=="boolean"&&(this.forecastOpen=t.forecastOpen),typeof t.indicatorsOpen=="boolean"&&(this.indicatorsOpen=t.indicatorsOpen),typeof t.solarExpanded=="boolean"&&(this.solarExpanded=t.solarExpanded),Array.isArray(t.collapsedDays)&&(this.collapsedDays=new Set(t.collapsedDays)),Array.isArray(t.solarLayers)&&(this.solarLayers=new Set(t.solarLayers)),Array.isArray(t.expandedImpacts)&&(this.expandedImpacts=new Set(t.expandedImpacts))}catch(s){}}updateLocation(s,t,o){this.opts=Ne(Ie({},this.opts),{lat:s,lon:t,locationName:o}),this.render()}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},at={mount(e,s){return Ct(),new Ae(e,s)}};typeof window!="undefined"&&(window.HelioWidget=at);return gt(Ls);})();
