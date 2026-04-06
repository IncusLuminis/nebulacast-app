"use strict";var HelioWidgetModule=(()=>{var ue=Object.defineProperty,ht=Object.defineProperties,mt=Object.getOwnPropertyDescriptor,ut=Object.getOwnPropertyDescriptors,gt=Object.getOwnPropertyNames,ze=Object.getOwnPropertySymbols;var Be=Object.prototype.hasOwnProperty,wt=Object.prototype.propertyIsEnumerable;var Ne=(e,s,t)=>s in e?ue(e,s,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[s]=t,ge=(e,s)=>{for(var t in s||(s={}))Be.call(s,t)&&Ne(e,t,s[t]);if(ze)for(var t of ze(s))wt.call(s,t)&&Ne(e,t,s[t]);return e},we=(e,s)=>ht(e,ut(s));var xt=(e,s)=>{for(var t in s)ue(e,t,{get:s[t],enumerable:!0})},ft=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of gt(s))!Be.call(e,n)&&n!==t&&ue(e,n,{get:()=>s[n],enumerable:!(o=mt(s,n))||o.enumerable});return e};var $t=e=>ft(ue({},"__esModule",{value:!0}),e);var Ys={};xt(Ys,{HelioWidget:()=>dt});var $e={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Qe={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},bt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},ve={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},vt={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},yt={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function kt(e){if(!e)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(e).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let t=Math.floor(s/60);return t<24?`Updated ${t}h ago`:`Updated ${Math.floor(t/24)}d ago`}catch(s){return"Updated recently"}}function _t(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function xe(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e}}function be(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e.slice(11,16)}}function Pe(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function O(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function g(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var De={G:["aurora","storm_risk"],R:["radio"],S:["satellite_drag","gnss"],X:["xray","solar"]},St=2400;function Ve(){var e,s;try{let t=(s=(e=globalThis.location)==null?void 0:e.hostname)!=null?s:"";return t==="localhost"||t==="127.0.0.1"||t.endsWith(".local")}catch(t){return!1}}function Mt(e){let s=[],t=null;for(let o of e){let n=document.getElementById(o);n instanceof HTMLElement?(t||(t=n),s.push(n)):Ve()&&console.warn(`[Helio] Hero chip nav: missing element #${o}`)}t&&t.scrollIntoView({behavior:"smooth",block:"start"});for(let o of s)o.classList.add("section-flash"),window.setTimeout(()=>o.classList.remove("section-flash"),St)}function Ge(e){let s=e.trim();return s.toUpperCase().startsWith("X:")?s.slice(2).trim()||"\u2014":s||"\u2014"}function Ce(e,s){let t=e.trim().toUpperCase();if(t.length<2||t[0]!==s)return 0;let o=parseInt(t.slice(1),10);return!isFinite(o)||o<0?0:Math.min(5,o)}function He(e){return e<=0?{color:"#96a8b8",background:"#1e2830",borderColor:"#2a3c42"}:e===1?{color:"#d4cc5c",background:"#2a2616",borderColor:"#5a5028"}:e===2?{color:"#e0a84a",background:"#2c2214",borderColor:"#6a5018"}:e===3?{color:"#e8a060",background:"#301810",borderColor:"#744018"}:e===4?{color:"#e07058",background:"#2c1412",borderColor:"#762820"}:{color:"#e05c5c",background:"#2e1214",borderColor:"#7a2828"}}function Ct(e){var l,r,a;let s=e.trim().toUpperCase();if(s==="\u2014"||s===""||s==="-")return{color:"#607880",background:"#1e2830",borderColor:"#2a3c42"};let t=(l=ve[s])!=null?l:"#a0b4b8",o={A:"#242628",B:"#15221c",C:"#1a2215",M:"#221a10",X:"#281416"},n={A:"#404448",B:"#2a5a40",C:"#3e6a30",M:"#6a5018",X:"#7a2828"};return{color:t,background:(r=o[s])!=null?r:"#1e2830",borderColor:(a=n[s])!=null?a:"#3a4c52"}}function Ht(e,s){var l,r,a,i,c,d;let t=e.metrics.xray_class!=null?String(e.metrics.xray_class):"\u2014",o={g:(l=s==null?void 0:s.gScale)!=null?l:e.scales.g_scale,r:e.scales.r_scale,s:e.scales.s_scale,x:Ge(t)},n=(r=e.hero)==null?void 0:r.scales;return n?{g:(a=n.g)!=null?a:o.g,r:(i=n.r)!=null?i:o.r,s:(c=n.s)!=null?c:o.s,x:Ge((d=n.x)!=null?d:o.x)}:o}var Lt=`
.hw-root{font-family:inherit;color:#e0e0e0;background:#161c1e;border-radius:6px;overflow:hidden}
/* Hero chip deep-links: keep targets clear of sticky page chrome */
.hw-root #aurora,.hw-root #storm_risk,.hw-root #radio,.hw-root #satellite_drag,.hw-root #gnss,.hw-root #xray,.hw-root #solar{scroll-margin-top:14px}
/* Brief highlight when navigating from hero scale chips */
@keyframes hw-section-flash-kf{
  0%{box-shadow:inset 0 0 0 0 rgba(90,168,200,0)}
  18%{box-shadow:inset 0 0 0 2px rgba(90,168,200,0.75),0 0 14px rgba(90,168,200,0.22)}
  100%{box-shadow:inset 0 0 0 0 rgba(90,168,200,0)}
}
.hw-root .section-flash{animation:hw-section-flash-kf 2.4s ease-out}
.hw-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#1a2428;border-bottom:1px solid #2a3438}
.hw-header-title{font-size:.78em;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b4c4cc}
.hw-freshness{font-size:.72em;color:#96a8b8}

/* Hero */
.hw-hero{padding:12px 14px 10px;border-bottom:1px solid #1e2c30}
.hw-aurora-banner{display:flex;align-items:center;justify-content:space-between;margin:10px -14px -10px;padding:7px 14px;background:#0f2d1c;border-top:1px solid #1e4a2e}
.hw-aurora-banner-text{font-size:.75em;font-weight:600;color:#5cce8c;letter-spacing:.02em}
.hw-aurora-map-btn{font-size:.7em;color:#5cce8c;background:none;border:1px solid #2a5a3a;border-radius:3px;padding:2px 9px;cursor:pointer;transition:background .15s;white-space:nowrap;text-decoration:none;display:inline-block}
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
/* Storm Risk: NOW | FORECAST 24h (3-row grid: titles | gauges aligned | captions) */
.hw-storm-risk-grid{display:grid;grid-template-columns:minmax(120px,168px) minmax(0,1fr);column-gap:8px;row-gap:5px;align-items:start;margin:6px 0 0}
.hw-storm-risk-head-now{grid-column:1;grid-row:1;font-size:.80em;font-weight:600;color:#a8bac6;letter-spacing:.055em;text-transform:uppercase;padding:0 2px;text-align:center;justify-self:stretch}
.hw-storm-risk-head-fc{grid-column:2;grid-row:1;font-size:.80em;font-weight:600;color:#a8bac6;letter-spacing:.055em;text-transform:uppercase;width:100%;text-align:center;justify-self:stretch;min-width:0}
.hw-storm-risk-rail-edge{border-left:1px solid #1e2c30;padding-left:10px;min-width:0}
.hw-storm-risk-now-gauge-cell{grid-column:1;grid-row:2;display:flex;justify-content:center;padding:0 2px;min-width:0}
.hw-storm-risk-fc-gauge-cell{grid-column:2;grid-row:2;display:flex;justify-content:center;min-width:0}
.hw-storm-risk-now-only{grid-column:1;grid-row:3;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 2px;min-width:0}
.hw-storm-risk-fc-foot{grid-column:2;grid-row:3;min-width:0}
.hw-storm-risk-gauge{display:block;width:100%;max-width:168px;height:auto;margin:0 auto;flex-shrink:0}
.hw-storm-risk-gauge svg{display:block;width:100%;height:auto}
.hw-storm-risk-now-gauge{margin:0;width:100%;max-width:168px}
.hw-storm-risk-fc-gauge{margin:0;width:100%;max-width:168px}
.hw-storm-risk-now-lbl{font-size:clamp(.88rem,2.35vw,1.02rem);font-weight:500;color:#a8bac4;margin-top:0;line-height:1.2;word-wrap:break-word;max-width:100%}
.hw-gstorm-slot{display:none}
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
/* Satellite Drag / GNSS Risk \u2014 shared level strip */
.hw-level-strip{display:flex;gap:5px;margin:6px 0 8px}
.hw-level-cell{flex:1;text-align:center;padding:5px 0;border-radius:4px;font-size:.78em;font-weight:700;border:1px solid transparent}
.hw-satdrag-meta{font-size:.75em;color:#7a9298;margin-top:2px}
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

/* Impacts / unified Indicators panel */
.hw-impacts{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-indicators-sep{height:1px;margin:10px 0 12px;background:linear-gradient(90deg,transparent,rgba(42,60,66,.95),transparent);border:none;flex-shrink:0}
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
/* Solar disk mini \u2014 single GIF (sites/staging/index.html sunGifMap + current_eit_*.gif) */
.hw-solar-mini-wrap{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default;border-radius:4px;border:1px solid #1e2c30;padding:1px}
.hw-solar-mini-inner{position:relative;width:86px;height:86px;border-radius:50%;overflow:hidden;border:1px solid #2a3c42;background:#0a0a0a;flex-shrink:0}
.hw-solar-mini-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;object-position:center}
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
`,Ye=!1;function Ft(){if(Ye)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=Lt,document.head.appendChild(e),Ye=!0}function Rt(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.length,n=s/o,l=e.map((r,a)=>{let i=Math.max(2,Math.min(t,r.kp/9*t)),c=t-i,d=a*n,p=r.kp>=6?"#e05c5c":r.kp>=5?"#e0a84a":r.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${c.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${i.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${r.kp.toFixed(1)} \xB7 ${g(be(r.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">${l}</svg>`}function je(e,s,t,o,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let l=200,r=Math.min(...e),a=Math.max(...e),i=a-r||1,c=u=>o-2-(u-r)/i*(o-4),d=e.map((u,h)=>`${(h/(e.length-1)*l).toFixed(1)},${c(u).toFixed(1)}`).join(" "),p="";if(n&&r<0&&a>0){let u=c(0);p=`<line x1="0" y1="${u.toFixed(1)}" x2="${l}" y2="${u.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let m=e.map((u,h)=>`<rect x="${(h/(e.length-1)*l-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${g(s[h]||"")} \xB7 ${u.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${l} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${m}
  </svg>`}function Et(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),n=Math.min(...o),r=Math.max(...o)-n||1,a=d=>t-2-(d-n)/r*(t-4),i=o.map((d,p)=>`${(p/(o.length-1)*s).toFixed(1)},${a(d).toFixed(1)}`).join(" "),c=e.map((d,p)=>{let m=p/(o.length-1)*s,u=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(m-4).toFixed(1)}" y="0" width="8" height="${t}" fill="transparent"><title>${g(be(d.t_utc))} \xB7 ${u}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">
    <polyline points="${i}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${c}
  </svg>`}function le(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function It(e){var c;let s=(c=e.metrics.wind_history_1h)!=null?c:[],t=s[s.length-1],o=e.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",l=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",r=(t==null?void 0:t.density)!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",a=(t==null?void 0:t.temp_kk)!=null?`${t.temp_kk.toFixed(0)} kK`:"\u2014",i=(t==null?void 0:t.pressure_npa)!=null?`${t.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${le("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${l}">${g(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${g(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${g(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${g(i)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Ot(e){var a,i;let s=(a=e.metrics.xray_class)!=null?a:"A",t=e.metrics.xray_flux_wm2,o=t!=null?t.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],l=n.map(c=>{let d=c.label===s,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${c.color}${d?"cc":"44"}">${p}</div>`}).join(""),r=n.map(c=>`<div class="hw-xray-scale-label" style="color:${c.label===s?"#c8d8dc":"#607880"}">${c.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${le("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${l}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(i=ve[s])!=null?i:"#a0b4b8"}">${g(s)}-class</b> \xB7 ${g(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function At(e){let i='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',c=[-10,-5,5,10].map(M=>{let y=100+M/20*100;return`<line x1="${y.toFixed(1)}" y1="16" x2="${y.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(e==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${i}${c}${d}</svg>`;let p=e<=-10?"#e05c5c":e<=-5?"#e0a84a":e<0?"#d4b84a":e>=5?"#5cce8c":"#7acca8",m=Math.max(-20,Math.min(20,e)),u=100+m/20*100,h=3,w=m<0?u-h:100-h,v=Math.max(2*h,Math.abs(u-100)+2*h),$=`<rect x="${w.toFixed(1)}" y="16" width="${v.toFixed(1)}" height="6" rx="${h}" fill="${p}" opacity="0.82"/>`,x=5,f=15,b=f-x*1.1,k=`<polygon points="${u.toFixed(1)},${f.toFixed(1)} ${(u-x).toFixed(1)},${b.toFixed(1)} ${(u+x).toFixed(1)},${b.toFixed(1)}" fill="${p}"/>`,S=`<line x1="${u.toFixed(1)}" y1="${f.toFixed(1)}" x2="${u.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,H=`<text x="${u.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${e>=0?"+":""}${e.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${i}${c}${d}${$}${k}${S}${H}
  </svg>`}function Tt(e){var m;let s=e.metrics.imf_bz_nt,t=e.metrics.imf_bt_nt,o=e.metrics.solar_wind_kms,n=(m=e.metrics.pressure_npa)!=null?m:null,l=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",r=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",a=t!=null?t.toFixed(1)+" nT":"\u2014",i=o!=null?`${Math.round(o)} km/s`:"\u2014",c=n!=null?`${n.toFixed(2)} nPa`:"\u2014",d=ye(e),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${le("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${At(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${l}">${g(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${g(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${g(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${g(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${g(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${g(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function ye(e){var i,c;let s=e.metrics.imf_bz_nt,t=(i=e.metrics.kp_latest)!=null?i:0,o=(c=e.metrics.solar_wind_kms)!=null?c:0,n,l,r;if(s!=null&&s<-5||t>=6)n="storm",l="#e05c5c",r="Storm conditions";else if(s!=null&&s<0||t>=4||o>=400){let d=s!=null&&s<0;n="active",l="#e0a84a",r=d?"Active coupling":"Elevated"}else n="stable",l="#5cce8c",r="Stable";let a;return s==null?a="Unknown":s>2?a="Closed":s>0?a="Minimal":s>-5?a="Moderate":s>-10?a="Strong":a="Very strong",{state:n,color:l,label:r,coupling:a}}function zt(e,s,t,o){let n=o?"mc":"mf",l=e.color,r=t!=null?t:0,a=r>500,i=r<350,c=a?.9:i?1.8:1.3;if(o){let h=45-(e.state==="storm"?11:e.state==="active"?16:21),w=e.state==="storm"?12:e.state==="active"?10:8,v=50-w,$=76,x=[`M ${h},25`,`C ${h-2},15 41,${w} 45,${w}`,`C 53,${w} ${$-8},${w+4} ${$},20`,`C ${$+1},23 ${$+1},27 ${$},30`,`C ${$-8},${v-4} 53,${v} 45,${v}`,`C 41,${v} ${h-2},35 ${h},25`,"Z"].join(" "),f=a?3:2,b=[14,25,36],k=M=>`<path d="M 0,${M} L ${a?8:6},${M} M ${a?6:4},${M-2} L ${a?8:6},${M} L ${a?6:4},${M+2}" stroke="${l}bb" stroke-width="${a?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,S=b.map(M=>k(M)).join(""),_=Array.from({length:f},(M,y)=>`<g class="hw-wg" style="animation-duration:${c}s;animation-delay:${(c/f*y).toFixed(2)}s">${S}</g>`).join(""),H=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${_}</g>
      <path d="${x}" fill="${l}14" stroke="${l}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${H}
    </svg>`}else{let $=e.state==="storm"?16:e.state==="active"?26:38,x=155-$,f=e.state==="storm"?22:e.state==="active"?30:40,b=120-f,k=240,S=[`M ${x},60`,`C ${x-4},42 150,${f} 155,${f}`,`C 173,${f} ${k-5},${f+18} ${k},60`,`C ${k-5},${b-18} 173,${b} 155,${b}`,`C 150,${b} ${x-4},78 ${x},60`,"Z"].join(" "),_=`M ${x+2},60 C ${x+2},${60-$*.4} 152,54 150,60 C 152,66 ${x+2},${60+$*.4} ${x+2},60 Z`,H=r>700?"#e05c5c":r>500?"#e0a84a":r>350?"#d4c840":"#5cce8c",M=r>700?.4:r>500?.65:r>350?1.1:1.8,y=r>500?[10,24,40,57,74,90,106]:r>350?[14,34,57,82,104]:[20,50,82,108],L=16,z=22,Y=x-6,j=Math.ceil((Y-z)/L)+2,X=Array.from({length:j},(A,R)=>z-L+R*L),N=12,P=8,W=X.flatMap(A=>y.map(R=>`<path d="M ${A},${R} L ${A+N},${R} M ${A+P},${R-3} L ${A+N},${R} L ${A+P},${R+3}" stroke="${H}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),C=`<g class="hw-wg-full" style="animation-duration:${M}s">${W}</g>`,E=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',Q=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return ke("magnetosphere",{magnetInfo:e,bz:s,windKms:t,uid:n})}}function ke(e,s={}){var C,E,Q,A,R,J;let l=(C=s.uid)!=null?C:"hse",r=0,a=160,i=800,c=17,d=i-c,p=s.magnetInfo,m=(E=p==null?void 0:p.state)!=null?E:"stable",u=(Q=p==null?void 0:p.color)!=null?Q:"#e0a84a",w=i-(m==="storm"?55:m==="active"?80:110),v=m==="storm"?58:m==="active"?76:95,$=1120,x=20,f=[`M ${w},130`,`C ${w-8},${130-v*.55} ${i-18},${130-v} ${i},${130-v}`,`C ${i+120},${130-v} ${$-180},${130-x} ${$},${130-x}`,`L ${$},${130+x}`,`C ${$-180},${130+x} ${i+120},${130+v} ${i},${130+v}`,`C ${i-18},${130+v} ${w-8},${130+v*.55} ${w},130`,"Z"].join(" "),b=e==="magnetosphere",k=b?m==="storm"?"0.12":"0.08":"0.04",S=b?"0.75":"0.28",_=`<g id="${l}-base-sun">
    <circle cx="${r}" cy="130" r="${a+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${r}" cy="130" r="${a}" fill="#f0c040" opacity="0.88"/>
  </g>`,H=`
    <ellipse cx="${i}" cy="130" rx="${c}" ry="${(c*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${i}" y1="${130-c}" x2="${i}" y2="${130+c}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${d}" y1="130" x2="${i+c}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,M=`<g id="${l}-base-earth">
    <circle cx="${i}" cy="130" r="${c}" fill="#1a4a6e" opacity="0.92"/>
    ${H}
  </g>`,y=`<g id="${l}-base-magnetosphere">
    <path d="${f}" fill="${u}" fill-opacity="${k}"
          stroke="${u}" stroke-opacity="${S}" stroke-width="1.8"/>
    ${p?`<text x="${w+5}" y="${130-v-7}" font-size="12" fill="${u}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,L=`<g id="${l}-base-axis">
    <line x1="${a}" y1="130" x2="${w}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,z="";if(e==="magnetosphere"){let T=(A=s.windKms)!=null?A:0,D=T>500,B=T<350,F=(D?.5:B?1.4:.9)*1.3,K=T>700?"#e05c5c":T>500?"#e0a84a":T>350?"#d4c840":"#5cce8c",te=a+8,ee=w-14,I=8,G=6,U=(ee-te)/(I-1),se=260/(G+1),V=38,ie=24,_e=2,Se=Array.from({length:I},(ne,de)=>{let oe=te+de*U,re=Array.from({length:G},(pe,he)=>{let Z=se*(he+1);return`<path d="M ${oe.toFixed(1)},${Z.toFixed(1)} L ${(oe+V).toFixed(1)},${Z.toFixed(1)} M ${(oe+ie).toFixed(1)},${(Z-6).toFixed(1)} L ${(oe+V).toFixed(1)},${Z.toFixed(1)} L ${(oe+ie).toFixed(1)},${(Z+6).toFixed(1)}"
          stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:_e},(pe,he)=>{let Z=-((I-de)/I*F)-he*F/_e;return`<g style="opacity:.12;animation:hw-arrow-chase ${F}s linear ${Z.toFixed(3)}s infinite">${re}</g>`}).join("")}).join(""),q=(R=s.bz)!=null?R:null,ce=q==null?"":(()=>{let ne=q>0?"#5cce8c":"#e05c5c";return`${q>0?`<path d="M ${i},137 L ${i},123 M ${i-3},126 L ${i},123 L ${i+3},126"
           stroke="${ne}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${i},123 L ${i},137 M ${i-3},134 L ${i},137 L ${i+3},134"
           stroke="${ne}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${i+22}" y="135" font-size="13"
        fill="${ne}" font-family="monospace">Bz${q>0?"\u2191":"\u2193"}</text>`})();z=`${Se}${ce}`}let Y=`<g id="${l}-overlay-solar-wind">${z}</g>`,j="";if(e==="coronal_hole"&&s.hssState){let T=s.hssState,D=(J=T.speed)!=null?J:0,B=D>=420,F=T.color,K=B?"0.85":"0.25",te=D>=500?"0.18":B?"0.10":"0.04",ee=a+8,I=d-16,G=60,U=`${ee},130 ${I},${130-G} ${I},${130+G}`,se=I+6,V=`${se},120 ${se+18},130 ${se},140`;j=`
    <polygon points="${U}" fill="${F}" opacity="${te}"/>
    <line x1="${ee}" y1="130" x2="${I-5}" y2="130"
          stroke="${F}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${K}"/>
    <polygon points="${V}" fill="${F}" opacity="${B?"0.9":"0.25"}"/>`}let X=`<g id="${l}-overlay-coronal-hole">${j}</g>`,N="";if(e==="cme_cone"&&s.cmeState){let T=s.cmeState,D=a,B=d-10,F=B-D,K=U=>Math.tan(U*Math.PI/180),te=Math.round(K(9)*F),ee=Math.round(K(6)*F),I=Math.round(K(3)*F),G=U=>`${D},130 ${B},${130-U} ${B},${130+U}`;if(T.status!=="quiet"){let U=T.status==="impact"?"#e05c5c":"#d4cc5c";N=`
    <polygon points="${G(te)}" fill="#253238" opacity="0.85"/>
    <polygon points="${G(ee)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${G(I)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${D+14}" y1="130" x2="${B-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${i}" cy="130" r="${c+8}" fill="none"
            stroke="${U}" stroke-width="7" opacity="0.16"/>`}else N=`
    <line x1="${D+14}" y1="130" x2="${d-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let P=`<g id="${l}-overlay-cme-cone">${N}</g>`,W=`<g id="${l}-overlay-labels">
    <text x="18" y="250" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${i}" y="252" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;return`<svg class="hw-solar-earth-scene" viewBox="0 0 1000 260"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="260" fill="#0a1014"/>
    ${L}
    ${Y}
    ${X}
    ${P}
    ${_}
    ${y}
    ${M}
    ${W}
  </svg>`}function Nt(e){let s=ye(e),t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=e.metrics.kp_latest,l=e.metrics.density,r=e.metrics.pressure_npa,a=t!=null?(t>=0?"+":"")+t.toFixed(1)+" nT":"\u2014",i=o!=null?`${Math.round(o)} km/s`:"\u2014",c=l!=null?`${l.toFixed(1)} p/cm\xB3`:"\u2014",d=r!=null?`${r.toFixed(2)} nPa`:"\u2014",p=t!=null?t<=-10?"#e05c5c":t<=-5?"#e0a84a":t>=5?"#5cce8c":"#a0b4b8":"#607880",m=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",u=t!=null&&t<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":t!=null&&t<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${le("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${zt(s,t,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${m}">${g(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${g(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${s.color}">${g(s.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${g(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${g(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${g(u)}</div>
  </div>`}function Bt(e,s){if(!s)return"";let t=ye(e),o=e.metrics.imf_bz_nt,n=e.metrics.solar_wind_kms,l=e.metrics.density,r=e.metrics.pressure_npa,a=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",i=n!=null?`${Math.round(n)} km/s`:"\u2014",c=l!=null?`${l.toFixed(1)} p/cm\xB3`:"\u2014",d=r!=null?`${r.toFixed(2)} nPa`:"\u2014",p=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",m=n!=null?n>700?"#e05c5c":n>500?"#e0a84a":n>350?"#d4c840":"#5cce8c":"#607880",u=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${ke("magnetosphere",{windKms:n!=null?n:void 0,bz:o!=null?o:void 0})}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${m}">${g(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${g(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${g(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${g(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${g(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${g(u)}</div>
  </div>`}function Ze(e,s,t){if(!e.length)return null;let o=(t%360+360)%360,n=-1,l=1/0,r=Math.cos(s*Math.PI/180);for(let a of e){let i=a.lat-s,c=(a.lon-o+180+360)%360-180,d=i*i+c*r*(c*r);d<l&&(l=d,n=a.prob)}return n>=0?n:null}function Je(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Pt(e,s){let t=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&e.lat!=null&&e.lon!=null&&(o=Ze(s.entries,e.lat,e.lon));let n=e.lat!=null&&e.lon!=null,l=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",r=o!=null?`${o}%`:s?"n/a":"\u2026",a=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?g(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${l}">Aurora: ${r}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${le("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${O(t)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Je(e)}
    </div>
    ${a}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Dt(e,s,t,o){switch(s){case"solar_wind":return It(e);case"xray":return Ot(e);case"imf_bz":return Tt(e);case"aurora":return Pt(t,o);case"magnetosphere":return Nt(e);default:return""}}function Gt(e,s){if(e.length<2)return"\u2192";let t=e[e.length-1],o=Math.max(0,e.length-4),n=e[o];if(!isFinite(t)||!isFinite(n))return"\u2192";let l=t-n;return l>s?"\u2191":l<-s?"\u2193":"\u2192"}var Yt={quiet:"171",active:"195",elevated:"284",storm:"304"};function jt(e,s){var o,n,l;if(s==null)return(n=(o=e.summary)==null?void 0:o.status)!=null?n:"quiet";let t=parseInt(((l=s.gScale)!=null?l:"G0").replace(/\D/g,""),10)||0;return t>=3?"storm":t>=1?"elevated":s.kp>=4?"active":"quiet"}function Wt(e,s){var c,d;let t=(c=Yt[e])!=null?c:"171",o=`/assets/gifs/current_eit_${t}.gif`,n=cs(o,s),l=ps,r=(d=$e[e])!=null?d:$e.quiet,a=`${r.accent}44`,i=`0 0 10px ${r.accent}55,0 0 24px ${r.accent}22`;return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner" style="border-color:${a};box-shadow:${i}">
      <img class="hw-solar-mini-img" src="${O(n)}" alt="Sun EIT ${O(t)}"
        onerror="if(this.src!=='${O(l)}')this.src='${O(l)}'" />
    </div>
  </div>`}function Ut(e,s,t,o,n){var f,b,k;let{summary:l,metrics:r}=e,a=(f=$e[l.status])!=null?f:$e.quiet,i=t!=null?t.kp.toFixed(1):r.kp_latest!=null?r.kp_latest.toFixed(1):"\u2014",c=Ht(e,t),p=[{key:"G",text:c.g,title:"Geomagnetic storm level. Based on Kp index.",aria:"Geomagnetic storm level"},{key:"R",text:c.r,title:"Radio blackout level. Based on solar X-ray flux.",aria:"Radio blackout level"},{key:"S",text:c.s,title:"Solar radiation storm level. Based on energetic proton flux.",aria:"Solar radiation storm level"},{key:"X",text:`X:${c.x}`,title:"Current solar X-ray activity class.",aria:"Solar X-ray activity"}].map(S=>{let _;return S.key==="G"?_=He(Ce(c.g,"G")):S.key==="R"?_=He(Ce(c.r,"R")):S.key==="S"?_=He(Ce(c.s,"S")):_=Ct(c.x),`<button type="button" class="hw-scale-chip hw-hero-scale-chip"
      style="${`color:${_.color};background:${_.background};border-color:${_.borderColor}`}" data-hero-chip="${S.key}" title="${O(S.title)}" aria-label="${O(S.aria)}">${g(S.text)}</button>`}).join(""),m=Gt(((b=r.kp_history_1h)!=null?b:[]).map(S=>S.kp),.5),u=(k=r.kp_latest)!=null?k:0,h=u>=5,w=h?`linear-gradient(160deg, #0d2a1a 0%, ${a.bg}22 75%)`:`${a.bg}18`,v=jt(e,t),x=h?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${u.toFixed(1)}</span>
      <a class="hw-aurora-map-btn" href="${O("https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg")}" target="_blank" rel="noopener noreferrer">View aurora map \u2192</a>
    </div>`:"";return`
    <div class="hw-hero" style="background:${w}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${t?"color:#9acf60":""}">Kp <b>${g(i)}</b>${t?"":`<span class="hw-trend">${m}</span>`}</div>
          <span class="hw-status-badge" style="background:${a.accent}22;color:${a.accent};display:block;text-align:center">${g(l.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${p}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${g(l.text)}</div>
            ${Wt(v,o.baseUrl)}
          </div>
        </div>
      </div>
      ${x}
    </div>`}function Xt(e){var d,p,m,u;let{metrics:s}=e,t=(d=s.kp_history_1h)!=null?d:[],o=(p=s.wind_history_1h)!=null?p:[],n=(m=s.bz_history_1h)!=null?m:[],l=(u=s.xray_history_1h)!=null?u:[],r=Rt(t),a=je(o.map(h=>{var w;return(w=h.kms)!=null?w:0}).filter(h=>h>0),o.map(h=>be(h.t_utc)),"#5cce8c",28,!1),i=je(n.map(h=>h.bz),n.map(h=>be(h.t_utc)),"#d4cc5c",28,!0),c=Et(l);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${c}</div>
      </div>
    </div>`}function Kt(e){let s=kt(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${g(s)}</span>
    </div>`}function qt(e){return e.map((s,t)=>t===0?(s+e[1])/2:t===e.length-1?(e[t-1]+s)/2:(e[t-1]+s+e[t+1])/3)}function Qt(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Vt(e){return e>=5?"good":e>=3?"possible":"none"}function et(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Zt(e){let s=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",t=et(e),o=s==="none"?"No aurora expected at mid-latitudes":t!=null?`Aurora possible equatorward of ~${t}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",l=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",r=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:l},{kind:"solar_activity",level:r,label:"Solar Activity",summary:r==="none"?"Quiet geomagnetic conditions expected":r==="low"?"Active geomagnetic conditions possible":r==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Jt(e,s){var p;if(s<=0)return null;let t=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!t.length)return null;let o=Date.now()+s*36e5,n=t[0],l=1/0;for(let m of t){let u=Math.abs(new Date(m.t_utc).getTime()-o);u<l&&(l=u,n=m)}let r=n.kp,a=Qt(r),i=Vt(r),c=et(r),d=Zt(r);return{offsetH:s,kp:r,gScale:a,auroraLabel:i,auroraMinLat:c,impacts:d}}function es(e,s,t,o){var W;let{forecast:n,metrics:l}=e,{kp_max_next_24h:r,kp_max_at_utc:a,trend:i}=n,c=((W=l.kp_forecast_3h)!=null?W:[]).slice(0,16),d=c.length,p=d*3,m=p>0?`${(s/p*100).toFixed(0)}%`:"0%",u=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",h="Kp forecast unavailable";if(r!=null){let C=xe(a),E=i==="rising"?"rising":i==="falling"?"falling":"steady";h=`Peak Kp ${r.toFixed(1)} next 24h${C?` at ${C}`:""} \xB7 ${E}`}let w=c.length?xe(c[0].t_utc):null,v=w?`Forecast \xB7 Next step ${w}`:"Forecast";if(!c.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${g(v)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${g(h)}</div>`:""}
    </div>`;let $=320,x=38,f=14,b=x+f,k=$/d,S=C=>x-Math.max(2,Math.min(x-2,C/9*(x-2))),_="",H=c.map(C=>C.kp),M=qt(H);c.forEach((C,E)=>{let Q=S(C.kp),A=x-Q,R=E*k,J=R+k/2,T=C.kp>=6?"#e05c5c":C.kp>=5?"#e0a84a":C.kp>=4?"#d4cc5c":"#5cce8c",D=`Kp ${C.kp.toFixed(1)} \xB7 ${xe(C.t_utc)}`;if(_+=`<rect x="${R.toFixed(1)}" y="${Q.toFixed(1)}" width="${(k-1.5).toFixed(1)}" height="${A.toFixed(1)}" fill="${T}" fill-opacity="0.85" rx="1.5"/>`,_+=`<rect x="${R.toFixed(1)}" y="0" width="${k.toFixed(1)}" height="${x}" fill="transparent"><title>${O(D)}</title></rect>`,d<=8||E%2===0){let F=new Date(C.t_utc).getHours();_+=`<text x="${J.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${F.toString().padStart(2,"0")}</text>`}});let L=`<polyline points="${c.map((C,E)=>{let Q=E*k+k/2,A=S(M[E]);return`${Q.toFixed(1)},${A.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,z="";if(s>0&&d>0){let C=Math.min($-1,s/(d*3)*$);z=`
      <line x1="${C.toFixed(1)}" y1="0" x2="${C.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${C.toFixed(1)},${x} ${(C-4).toFixed(1)},${(x-7).toFixed(1)} ${(C+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let Y=Math.round(p/4),j=Math.round(p/2),X=Math.round(p*3/4),N=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${g(u)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${m}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${Y}h</span>
        <span class="hw-scrub-tick">+${j}h</span>
        <span class="hw-scrub-tick">+${X}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,P=t?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(t.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${t.kp.toFixed(1)} \xB7 ${t.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${g(v)}</span>
      </div>
      ${o?`
      ${P}
      <div class="hw-forecast-text">${g(h)}</div>
      <svg viewBox="0 0 ${$} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${_}
        ${L}
        ${z}
      </svg>
      ${N}`:""}
    </div>`}function ts(e){let s=/([NS])(\d+)([EW])(\d+)/i.exec(e);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var tt=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function ss(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function os(e,s,t){let o=s/2,n=o*.87,l=s*.03,r=s*.009,a=e.map(i=>{var $,x;let c=ts(i.location);if(!c||Math.abs(c.lon)>88||i.location.includes("*"))return"";let d=ss(i);if(!t.has(d))return"";let p=tt.find(f=>f.id===d).color,m=c.lat*Math.PI/180,u=c.lon*Math.PI/180,h=(o+n*Math.cos(m)*Math.sin(u)).toFixed(1),w=(o-n*Math.sin(m)).toFixed(1),v=`AR ${i.region} \xB7 ${i.location}
Class: ${($=i.spot_class)!=null?$:"\u2014"} / ${(x=i.mag_class)!=null?x:"\u2014"}
C: ${i.c_flare_probability}%  M: ${i.m_flare_probability}%  X: ${i.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${g(v)}</title>
      <circle cx="${h}" cy="${w}" r="${(l+r+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(r*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${h}" cy="${w}" r="${l.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${r.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${a}</svg>`}var Re={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},st='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',ns=Re.solar_activity,rs='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><path d="M2 6 Q2 2.5 6 2.5 Q10 2.5 10 6 Q10 9.5 6 9.5 Q2 9.5 2 6"/><ellipse cx="6" cy="6" rx="2.2" ry="1.9"/><circle cx="6" cy="6" r="0.65" fill="currentColor" stroke="none"/></svg>',is='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><circle cx="3.2" cy="6" r="2.2"/><line x1="5.8" y1="6" x2="11" y2="6"/><polyline points="9.2,4.3 11,6 9.2,7.7" fill="currentColor" stroke="none"/></svg>',as=14,ls="https://staging.nebulacast.app";function cs(e,s){return!e||/^https?:\/\//.test(e)||e.startsWith("//")?e:(s!=null?s:ls).replace(/\/$/,"")+(e.startsWith("/")?e:"/"+e)}var ds="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ps="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",hs=240;function ms(e,s){var c,d,p;let t=parseInt(((c=e.scales.r_scale)!=null?c:"R0").slice(1),10),o=(d=e.metrics.xray_class)!=null?d:"A",n=e.metrics.xray_flux_wm2,l=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",a=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(m=>{let u=m.r===t,h=m.r<=t,w=h?m.color:"#1e2c30",v=u?"1":h?"0.5":"1",$=u?m.color:h?m.color+"99":"#566068",x=u?m.color:h?m.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${$}">R${m.r}</span>
      <div class="hw-radio-bbar" style="background:${w};opacity:${v}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${m.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${a}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=ve[o])!=null?p:"#a0b4b8"}">${g(o)}-class</b> \xB7 ${g(l)}</div>
  </div>`}var us={0:"Quiet",1:"Minor Storm",2:"Moderate Storm",3:"Strong Storm",4:"Severe Storm",5:"Extreme Storm"};function gs(e){return e>=9?5:e>=8?4:e>=7?3:e>=6?2:e>=5?1:0}function ae(e,s){if(e<s-.7)return 0;if(e>s+1)return .9;let t=(e-(s-.7))/1.7;return Math.round(Math.pow(Math.max(0,t),.7)*90)/100}function ws(e){var c,d,p;let s=parseInt(((c=e.scales.g_scale)!=null?c:"G0").replace(/\D/g,""),10),t=Math.max(0,Math.min(5,Number.isFinite(s)?s:0)),o=(d=e.metrics.kp_forecast_3h)!=null?d:[],n=Date.now(),l=n+24*60*60*1e3,r=o.filter(m=>{let u=new Date(m.t_utc).getTime();return u>=n-3*60*60*1e3&&u<=l}),a=r.length===0?0:Math.max(...r.map(m=>m.kp)),i={G1:ae(a,5),G2:ae(a,6),G3:ae(a,7),G4:ae(a,8),G5:ae(a,9),max_expected:gs(a)};return{now:{g_level:t,label:(p=us[t])!=null?p:"Quiet"},forecast_24h:i}}function xs(e){if(!e||typeof e!="object")return null;let s=e,t=s.now,o=s.forecast_24h;if(!t||!o)return null;let n=typeof t.g_level=="number"?t.g_level:parseInt(String(t.g_level),10),l=typeof t.label=="string"?t.label:"Quiet";if(!Number.isFinite(n))return null;let r=c=>{let d=typeof c=="number"?c:parseFloat(String(c));return Number.isFinite(d)?Math.max(0,Math.min(1,d)):0},a=o.max_expected,i=typeof a=="number"&&Number.isFinite(a)?Math.max(0,Math.min(5,Math.round(a))):0;return{now:{g_level:Math.max(0,Math.min(5,Math.round(n))),label:l},forecast_24h:{G1:r(o.G1),G2:r(o.G2),G3:r(o.G3),G4:r(o.G4),G5:r(o.G5),max_expected:i}}}function ot(e){let s=ws(e),t=xs(e.storm_risk);if(!t)return s;let o=e.storm_risk,n=o&&typeof o.forecast_24h=="object"&&o.forecast_24h!==null?o.forecast_24h:void 0,l=n==null?void 0:n.max_expected;return typeof l=="number"&&Number.isFinite(l)?t:we(ge({},t),{forecast_24h:we(ge({},t.forecast_24h),{max_expected:s.forecast_24h.max_expected})})}function fs(e){return e>=4?"#e05c5c":e>=3?"#e0a84a":e>=1?"#d4cc5c":"#607880"}var We={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function $s(e){var c,d,p;let s=(c=e.metrics.kp_latest)!=null?c:0,t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=parseInt(((d=e.scales.g_scale)!=null?d:"G0").replace("G",""),10)||0,l=s>=5||n>=1,r=(p=e.metrics.kp_history_1h)!=null?p:[],a=0;if(r.length>=2&&(a=r[r.length-1].kp-r[r.length-2].kp),!l)return{active:!1,phase:"quiet",kp_current:s,kp_trend:a,bz_nt:t,solar_wind_kms:o};let i;return a>.3&&(t==null||t<-5)?i="rising":a<-.5?i="decline":i="peak",{active:!0,phase:i,kp_current:s,kp_trend:a,bz_nt:t,solar_wind_kms:o}}function bs(e){if(!e.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],t=s.findIndex(a=>a.key===e.phase),o=We[e.phase],n=s[t].label,l=s.map((a,i)=>{let c=i===t,d=i<t,p=We[a.key],m=c?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:d?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",u=c?" hw-spi-dot-active":"",h=c?`color:${p};font-weight:700`:d?`color:${p}66`:"color:#2e4248",w=i<s.length-1?`<div class="hw-spi-arr">${d?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${u}" style="${m}"></div>
        <div class="hw-spi-txt" style="${h}">${a.label}</div>
      </div>${w}`}).join(""),r=[`Kp ${e.kp_current.toFixed(1)}`];return e.bz_nt!=null&&r.push(`Bz ${e.bz_nt>0?"+":""}${e.bz_nt.toFixed(1)} nT`),e.solar_wind_kms!=null&&r.push(`Wind ${Math.round(e.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${l}</div>
    <div class="hw-spi-params">${r.join(" \xB7 ")}</div>
  </div>`}function Ue(e,s,t){let o=Math.max(0,Math.min(5,Math.round(e))),n=(t==null?void 0:t.showDialCode)!==!1,l=70,r=76,a=48,c=a-9,d=Math.PI,p=k=>d*(1-k/5),m=p(o),u=(k,S)=>({x:l+S*Math.cos(k),y:r-S*Math.sin(k)}),h=(k,S,_)=>{let H=u(k,a),M=u(S,a),y=u(k,c),L=u(S,c);return`<path d="M ${y.x.toFixed(2)} ${y.y.toFixed(2)} L ${H.x.toFixed(2)} ${H.y.toFixed(2)} A ${a} ${a} 0 0 1 ${M.x.toFixed(2)} ${M.y.toFixed(2)} L ${L.x.toFixed(2)} ${L.y.toFixed(2)} A ${c} ${c} 0 0 0 ${y.x.toFixed(2)} ${y.y.toFixed(2)} Z" fill="${_}"/>`},w=k=>{let S=p(k),_=u(S,a+1),H=u(S,a-5);return`<line x1="${_.x.toFixed(2)}" y1="${_.y.toFixed(2)}" x2="${H.x.toFixed(2)}" y2="${H.y.toFixed(2)}" stroke="#2a3a40" stroke-width="1" stroke-linecap="round"/>`},v=u(m,a-2),$=`<line x1="${l}" y1="${r}" x2="${v.x.toFixed(2)}" y2="${v.y.toFixed(2)}" stroke="#c8d6dc" stroke-width="2" stroke-linecap="round"/>`,x=`<circle cx="${l}" cy="${r}" r="3.5" fill="#3a4c52" stroke="#1e2c30" stroke-width="1"/>`,f=h(p(0),p(2),"#3d8f62")+h(p(2),p(4),"#b8982a")+h(p(4),p(5),"#b04048"),b=[0,1,2,3,4,5].map(w).join("");return`<div class="hw-storm-risk-gauge" role="img" aria-label="${O(s)} G${o}">
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="140" height="88" fill="none"/>
      <path d="M ${u(d,a).x.toFixed(2)} ${u(d,a).y.toFixed(2)} A ${a} ${a} 0 0 1 ${u(0,a).x.toFixed(2)} ${u(0,a).y.toFixed(2)}" fill="none" stroke="#1a2428" stroke-width="2" stroke-linecap="round"/>
      ${f}
      ${b}
      ${$}
      ${x}
      ${n?`<text x="${l}" y="84" text-anchor="middle" fill="#8a9ca8" font-size="11" font-family="inherit" font-weight="600">G${o}</text>`:""}
    </svg>
  </div>`}function vs(e,s){let t=ot(e),o=$s(e),n=t.forecast_24h,l=Math.max(0,Math.min(5,Math.round(n.max_expected))),r=`<div class="hw-storm-risk-now-gauge">${Ue(t.now.g_level,"Current observed geomagnetic storm level",{showDialCode:!0})}</div>`,a=`<div class="hw-storm-risk-fc-gauge">${Ue(l,"Max expected geomagnetic level in next 24 hours",{showDialCode:!1})}</div>`,i=`
        <div class="hw-gstorm-footer" style="margin-top:2px;line-height:1.35">Max expected in next 24h</div>
        <div class="hw-gstorm-footer" style="margin-top:2px">From Kp forecast: G${l}</div>`;return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${bs(o)}
    <div class="hw-storm-risk-grid">
      <div class="hw-storm-risk-head-now">Now</div>
      <div class="hw-storm-risk-head-fc hw-storm-risk-rail-edge">Forecast 24h</div>
      <div class="hw-storm-risk-now-gauge-cell">${r}</div>
      <div class="hw-storm-risk-fc-gauge-cell hw-storm-risk-rail-edge">${a}</div>
      <div class="hw-storm-risk-now-only">
        <div class="hw-storm-risk-now-lbl">${g(t.now.label)}</div>
      </div>
      <div class="hw-storm-risk-fc-foot hw-storm-risk-rail-edge">${i}</div>
    </div>
  </div>`}var fe={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},nt={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function ys(e){var M;let s=fe,t=(M=nt[s.phase])!=null?M:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,l=52,r=10,a=l-6,i=l-18,c=.5,d=.19,p=y=>Math.exp(-Math.pow((y-c)/d,2)/2),m=y=>r+y*(n-2*r),u=y=>a-p(y)*i,h=80,w=[];for(let y=0;y<=h;y++){let L=y/h;w.push(`${y===0?"M":"L"}${m(L).toFixed(1)},${u(L).toFixed(1)}`)}let v=Math.round(s.progress_0_1*h),$=[];for(let y=0;y<=v;y++){let L=y/h;$.push(`${y===0?"M":"L"}${m(L).toFixed(1)},${u(L).toFixed(1)}`)}let x=m(s.progress_0_1),f=[`M${r},${a}`,...$.slice(1),`L${x.toFixed(1)},${a} Z`],b=u(s.progress_0_1),k=5,S=`M${x.toFixed(1)},${b.toFixed(1)} L${(x-k).toFixed(1)},${(b-k*1.8).toFixed(1)} L${(x+k).toFixed(1)},${(b-k*1.8).toFixed(1)} Z`,_=a+11;return`<div class="hw-impact-tip${e?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${g(s.cycle_name)}</div>
    <svg width="100%" height="${l+14}" viewBox="0 0 ${n} ${l+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${f.join(" ")}" fill="${t}" opacity="0.12"/>
      <path d="${w.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${$.join(" ")}" fill="none" stroke="${t}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${r}" y1="${a}" x2="${n-r}" y2="${a}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${S}" fill="${t}"/>
      <text x="${r+2}" y="${_}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${m(.5).toFixed(1)}" y="${_}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-r-2).toFixed(1)}" y="${_}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${t}">${g(o)}</b>${s.subtitle?` \xB7 ${g(s.subtitle)}`:""}</div>
  </div>`}function rt(e){var i,c,d,p,m;let s=(c=(i=e.coronal_hole)==null?void 0:i.estimated_speed_kms)!=null?c:e.metrics.solar_wind_kms,t=(d=e.coronal_hole)==null?void 0:d.status,o=s!=null?s:0,n=t!=null?t:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",l={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},r={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},a={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:l[n],label:r[n],desc:(m=(p=e.coronal_hole)==null?void 0:p.note)!=null?m:a[n],speed:s}}function ks(e,s){var c;let t=rt(e),o=(c=t.speed)!=null?c:0,n=t.speed!=null?`${Math.round(t.speed)} km/s`:"\u2014",l=s?" hw-impact-tip-open":"",r=o>=420,a=ke("coronal_hole",{hssState:t,uid:"hss"}),i=r?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${l}">
    ${a}
    <div class="hw-hss-meta">Solar wind: <b style="color:${t.color}">${g(n)}</b> \xB7 ${g(t.desc)}</div>
    ${i}
  </div>`}function it(e){var n,l;let s=(n=e.scales.g_scale)!=null?n:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let r=(l=e.metrics.kp_forecast_3h)!=null?l:[],a=Date.now(),i=r.filter(c=>new Date(c.t_utc).getTime()<=a+3*60*60*1e3).sort((c,d)=>new Date(d.t_utc).getTime()-new Date(c.t_utc).getTime());i.length>0&&(o=i[0].kp)}return t>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:t>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function _s(e,s){let t=it(e),o=s?" hw-impact-tip-open":"",l=[{l:0,label:"Low",color:"#5cce8c"},{l:1,label:"Moderate",color:"#d4cc5c"},{l:2,label:"High",color:"#e05c5c"}].map(i=>{let c=i.l===t.level,d=c?`${i.color}2e`:"#1b2a2e",p=c?i.color:"#3d5058",m=c?`1px solid ${i.color}66`:"1px solid #253035";return`<div class="hw-level-cell" style="background:${d};color:${p};border:${m}">${i.label}</div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",a={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-level-strip">${l}</div>
    <div class="hw-satdrag-meta">${r} \xB7 ${g(t.gScale)} \xB7 ${a[t.level]}</div>
  </div>`}function at(e){var c,d,p;let s=(c=e.scales.g_scale)!=null?c:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let m=(d=e.metrics.kp_forecast_3h)!=null?d:[],u=Date.now(),h=m.filter(w=>new Date(w.t_utc).getTime()<=u+3*60*60*1e3).sort((w,v)=>new Date(v.t_utc).getTime()-new Date(w.t_utc).getTime());h.length>0&&(o=h[0].kp)}let n=0;t>=2||o!=null&&o>=6?n=2:(t>=1||o!=null&&o>=4)&&(n=1);let l=parseInt(((p=e.scales.r_scale)!=null?p:"R0").slice(1),10),r=l>=2&&n<2;l>=2&&(n=Math.min(2,n+1));let a={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},i={0:"Low",1:"Moderate",2:"High"};return{level:n,color:a[n],label:i[n],kp:o,gScale:s,boostedByFlare:r}}function Ss(e,s){var c;let t=at(e),o=s?" hw-impact-tip-open":"",l=[{l:0,label:"Low",color:"#5cce8c"},{l:1,label:"Moderate",color:"#d4cc5c"},{l:2,label:"High",color:"#e05c5c"}].map(d=>{let p=d.l===t.level,m=p?`${d.color}2e`:"#1b2a2e",u=p?d.color:"#3d5058",h=p?`1px solid ${d.color}66`:"1px solid #253035";return`<div class="hw-level-cell" style="background:${m};color:${u};border:${h}">${d.label}</div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",a={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},i=t.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((c=e.scales.r_scale)!=null?c:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-level-strip">${l}</div>
    <div class="hw-gnss-meta">${r} \xB7 ${g(t.gScale)} \xB7 ${a[t.level]}</div>
    ${i}
  </div>`}function lt(e){var n;let s=e.metrics.pressure_npa,t=s!=null?s:null,o=(n=e.metrics.density)!=null?n:null;return t==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:t>=6?{pressure:t,color:"#e05c5c",label:"Extreme",density:o}:t>=4?{pressure:t,color:"#e0a84a",label:"Strong",density:o}:t>=2?{pressure:t,color:"#d4cc5c",label:"Elevated",density:o}:t>=1?{pressure:t,color:"#5cce8c",label:"Typical",density:o}:{pressure:t,color:"#7a9298",label:"Weak",density:o}}function Ms(e,s){let t=lt(e),o=s?" hw-impact-tip-open":"",n=t.pressure,l=200,r=6,a=10,i=r+a,c=i+4,d=c+11,p=i+9,m=d+4,h=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(M=>`<rect x="${M.x}" y="${r}" width="${M.w}" height="${a}" fill="${M.color}" opacity="0.55" rx="0"/>`).join(""),w=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],v=w.map(M=>`<line x1="${M.x}" y1="${i}" x2="${M.x}" y2="${c}" stroke="#3a5058" stroke-width="1"/>`).join(""),$=w.map(M=>`<text x="${M.x}" y="${d}" class="hw-swdp-axlabel" text-anchor="${M.anchor}">${M.label}</text>`).join(""),x="";if(n!=null){let y=Math.min(Math.max(n,0),8)/8*l;x=`<polygon points="${`${y-5},${p} ${y+5},${p} ${y},${i}`}" fill="${t.color}" opacity="0.95"/>
    <line x1="${y}" y1="${r}" x2="${y}" y2="${i}" stroke="${t.color}" stroke-width="1.5" opacity="0.7"/>`}let f=`<rect x="0" y="${r}" width="${l}" height="${a}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,b=`<svg class="hw-swdp-gauge" viewBox="0 0 ${l} ${m}" preserveAspectRatio="none" aria-hidden="true">
    ${h}${f}${x}${v}${$}
  </svg>`,k=n!=null?`${n.toFixed(2)} nPa`:"\u2014",S=t.density!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",_=e.metrics.solar_wind_kms!=null?`${Math.round(e.metrics.solar_wind_kms)} km/s`:"\u2014",H=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${b}
    <div class="hw-swdp-meta"><b style="color:${t.color}">${g(k)}</b>${g(H)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${g(_)} \xB7 Density ${g(S)}</div>
  </div>`}function ct(e){var c,d;let s=(c=e.alerts_all)!=null?c:[],t=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=t!=null?t:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let l=((d=n.raw_body)!=null?d:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),r=l?parseInt(l[1],10):null,a=null;if(r&&n.t_utc){let p=1496e5/r*1e3;a=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let i=t?"impact":"watch";return{status:i,color:i==="impact"?"#e05c5c":"#d4cc5c",label:i==="impact"?"Active":"Watch",speed_kms:r,issued_utc:n.t_utc,arrival_utc:a}}function Cs(e,s){let t=ct(e),o=s?" hw-impact-tip-open":"",n="\u2014";if(t.arrival_utc){let i=new Date(t.arrival_utc),c=i.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),d=i.getUTCDate(),p=String(i.getUTCHours()).padStart(2,"0"),m=String(i.getUTCMinutes()).padStart(2,"0");n=`~${c}\xA0${d}\xA0${p}:${m}\u202FUTC`}let l=t.speed_kms?`${t.speed_kms}\u202Fkm/s`:"\u2014",r=t.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${g(l)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${g(n)}</b>`:"No Earth-directed CME in forecast window",a=ke("cme_cone",{cmeState:t,uid:"cme"});return`<div class="hw-impact-tip${o}">
    ${a}
    <div class="hw-cme-footer">${r}</div>
  </div>`}function Le(e,s,t,o,n,l,r,a,i){let c=l.has(e),d=c?" hw-impact-open":"",p=c?" hw-impact-tip-open":"";return`<div class="hw-impact-row${d}" id="${e}" data-impact-row="${e}">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${n}">${t}<span style="color:#b4c6cc">${g(s)}</span></span>
      <span class="hw-impact-badge" style="background:${n}22;color:${n}">${g(o)}</span>
      <div class="hw-impact-tip${p}">${Dt(r,e,a,i)}</div>
    </div>`}function Hs(e,s){let t=e.find(l=>l.kind==="aurora");if(t)return t;let o=s.aurora_hint;return{kind:"aurora",level:o.aurora_label==="good"?"moderate":o.aurora_label==="possible"?"low":"none",label:"Aurora",summary:o.summary}}function Ls(e,s,t,o){var x,f;let n=(x=Qe[e.level])!=null?x:"#666",l=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),r=(f=Re[e.kind])!=null?f:st,a=e.level==="none"?"#606870":n,i=s.has("aurora"),c=i?" hw-impact-open":"",d=i?" hw-aurora-tip-open":"",p=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,m=null;t&&o.lat!=null&&o.lon!=null&&(m=Ze(t.entries,o.lat,o.lon));let u=o.lat!=null&&o.lon!=null,h=m!=null?m>=30?"#5cce8c":m>=10?"#d4cc5c":"#9ab4bc":"#607880",w=m!=null?`${m}%`:t?"n/a":"\u2026",v=u?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${o.locationName?g(o.locationName)+" \xB7 ":""}${o.lat.toFixed(1)}\xB0${o.lat>=0?"N":"S"} ${Math.abs(o.lon).toFixed(1)}\xB0${o.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${h}">Aurora: ${w}</span>
    </div>`:"",$=`<div class="hw-aurora-tip${d}">
      <div class="hw-aurora-map-wrap">
        <img class="hw-aurora-img" src="${O(p)}" alt="NOAA Aurora Oval" loading="lazy" />
        ${Je(o)}
      </div>
      ${v}
      <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
    </div>`;return`<div class="hw-impact-row${c}" id="aurora" data-impact-row="aurora">
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${a}">${r}<span style="color:#b4c6cc">${g(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${n}22;color:${n}">${g(l)}</span>
    ${$}
  </div>`}function Xe(e,s,t,o,n,l){var w,v;let r=(w=Qe[e.level])!=null?w:"#666",a=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),i=(v=Re[e.kind])!=null?v:st,c=e.level==="none"?"#606870":r,d=e.kind==="solar_activity"?t:l,p=d?" hw-impact-open":"",m;if(e.kind==="solar_activity"){let $=t?" hw-solar-open":"",x=tt.map(f=>{let b=o.has(f.id),k=b?f.color+"22":"transparent",S=b?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${f.id}" style="color:${f.color};border-color:${f.color};background:${k};opacity:${S}">${f.label}</button>`}).join("");m=`<div class="hw-solar-tip${$}">
        <div class="hw-solar-disk-wrap" id="solar">
          <img class="hw-solar-disk-img" src="${ds}" alt="Solar disk" loading="lazy" />
          ${s?os(s,hs,o):""}
        </div>
        <div class="hw-solar-layers">${x}</div>
        <span class="hw-solar-tip-text">${g(e.summary)}</span>
      </div>`}else m=ms(n,d);let u=e.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${O(e.kind)}"`,h=e.kind==="radio"?' id="radio"':"";return`<div class="hw-impact-row${p}"${h}${u}>
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${c}">${i}<span style="color:#b4c6cc">${g(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${r}22;color:${r}">${g(a)}</span>
    ${m}
  </div>`}function Fs(e,s,t,o,n,l,r,a,i){var Ie,Oe,Ae,Te;let c=(Oe=(Ie=s==null?void 0:s.impacts)!=null?Ie:e.observer_impacts)!=null?Oe:[],d=Hs(c,e),p=Ls(d,r,a,i),m=c.find(Me=>Me.kind==="radio"),u=c.find(Me=>Me.kind==="solar_activity"),h=m?Xe(m,t,n,l,e,r.has("radio")):"",w=u?Xe(u,t,n,l,e,!1):"",x=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
      <span class="hw-section-label" style="margin-bottom:0">Indicators (${as})${s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':""}</span>
    </div>`,{metrics:f}=e,b=f.xray_class,k=b?(Ae=ve[b])!=null?Ae:"#a0b4b8":"#607880",S=b?`${b}-class`:"\u2014",_=f.imf_bz_nt,H=_!=null?_<=-10?"#e05c5c":_<=-5?"#e0a84a":_>=5?"#5cce8c":"#a0b4b8":"#607880",M=_!=null?(_>=0?"+":"")+_.toFixed(1)+" nT":"\u2014",y=f.solar_wind_kms,L=y!=null?`${Math.round(y)} km/s`:"\u2014",z=y!=null?y>700?"#e05c5c":y>500?"#e0a84a":y>400?"#d4cc5c":"#5cce8c":"#607880",Y=Le("xray","X-Ray",ns,S,k,r,e,i,a),j=Le("imf_bz","IMF Bz",rs,M,H,r,e,i,a),X=Le("solar_wind","Solar Wind",is,L,z,r,e,i,a),N='<div class="hw-indicators-sep" role="separator" aria-hidden="true"></div>',P=r.has("geomag_storm"),W=ot(e),C=fs(W.now.g_level),E=`G${W.now.g_level}`,A=`<div class="hw-impact-row${P?" hw-impact-open":""}" id="storm_risk" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${C}22;color:${C}">${E}</span>
      ${vs(e,P)}
    </div>`,R=r.has("solar_cycle"),J=(Te=nt[fe.phase])!=null?Te:"#96a8b8",T=fe.phase.charAt(0).toUpperCase()+fe.phase.slice(1),B=`<div class="hw-impact-row${R?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${J}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${J}22;color:${J}">${T}</span>
      ${ys(R)}
    </div>`,F=rt(e),K=r.has("hss"),ee=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${F.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${F.color}22;color:${F.color}">${F.label}</span>
      ${ks(e,K)}
    </div>`,I=it(e),G=r.has("sat_drag"),se=`<div class="hw-impact-row${G?" hw-impact-open":""}" id="satellite_drag" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${I.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${I.color}22;color:${I.color}">${I.label}</span>
      ${_s(e,G)}
    </div>`,V=at(e),ie=r.has("gnss"),Se=`<div class="hw-impact-row${ie?" hw-impact-open":""}" id="gnss" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${V.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${V.color}22;color:${V.color}">${V.label}</span>
      ${Ss(e,ie)}
    </div>`,q=lt(e),ce=r.has("sw_pressure"),ne=q.pressure!=null?`${q.pressure.toFixed(2)} nPa`:"\u2014",oe=`<div class="hw-impact-row${ce?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${q.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${q.color}22;color:${q.color}">${ne}</span>
      ${Ms(e,ce)}
    </div>`,re=ct(e),pe=r.has("cme_cone"),Z=`<div class="hw-impact-row${pe?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${re.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${re.color}22;color:${re.color}">${g(re.label)}</span>
      ${Cs(e,pe)}
    </div>`,me=ye(e),Ee=r.has("magnetosphere"),pt=`<div class="hw-impact-row${Ee?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${me.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${me.color}22;color:${me.color}">${g(me.label)}</span>
      ${Bt(e,Ee)}
    </div>`;return`
    <div class="hw-impacts">
      ${x}
      ${o?[p,A,h,se,Se,Y,w,N,j,pt,X,ee,oe,Z,B].join(""):""}
    </div>`}var Ke={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Rs(e,s){var i,c;let t=(i=bt[e.level])!=null?i:"#666",o=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(c=Ke[e.kind])!=null?c:Ke.unknown,l=[_t(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),r=s&&e.raw_body?`<div class="hw-alert-body">${g(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${t}" data-alert-key="${O(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${t}">${n}</span>
      <span class="hw-alert-level" style="color:${t}">${g(o)}</span>
      <span class="hw-alert-title">${g(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${g(e.summary_short)}</div>
    <div class="hw-alert-meta">${g(l)}</div>
    ${r}
  </div>`}var Es={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Is="#4ae0a4";function Os(e){let s=(t,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${t}</svg>`;switch(e){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function As(e){var o;let s=(o=e.metadata)!=null?o:{},t=[];return s.source_code&&t.push(`Code: ${s.source_code}`),s.model&&t.push(`Model: ${String(s.model).toUpperCase()}`),t.length===0?"":`
${t.join(" \xB7 ")}`}function Ts(e,s,t){var i;let o=e.is_active?Is:(i=Es[e.level])!=null?i:"#445c64",n=e.event_time===t,l=e.event_time.slice(11,16)+" UTC",r=e.source==="NASA_DONKI"?"DONKI":"SWPC",a=n?`<div class="hw-tl-detail">${g(e.description)}${g(As(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${O(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${l}</span>
          <span class="hw-tl-src">${r}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${Os(e.event_type)} ${g(e.event_title)}
        </div>
        ${a}
      </div>
    </div>`}function zs(e,s,t,o){var $,x;let n=($=e.timeline)!=null?$:[],l=Date.now(),r=new Date(l).toISOString().slice(0,10),a=new Date(l-864e5).toISOString().slice(0,10),i=new Date(l-1728e5).toISOString().slice(0,10),c=new Set([r,a,i]),d=n.filter(f=>{var b;return c.has(((b=f.event_time)!=null?b:"").slice(0,10))}).slice().reverse(),p=d.length,m=t?"\u25BC":"\u25B6",u=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",h=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${u}</span>
    </div>`;if(!t||p===0)return`<div class="hw-timeline">${h}</div>`;let w=new Map;for(let f of d){let b=((x=f.event_time)!=null?x:"").slice(0,10);w.has(b)||w.set(b,[]),w.get(b).push(f)}let v=[...w.entries()].map(([f,b])=>{let S=new Date(f+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),_=o.has(f),H=_?"\u25B6":"\u25BC",M=_?`<span class="hw-tl-day-count">${b.length} events</span>`:"",y=`
      <div class="hw-tl-day-row" data-tl-day="${O(f)}">
        <span class="hw-section-caret">${H}</span>
        <span class="hw-tl-date">${S}</span>
        ${M}
      </div>`,L=_?"":b.map((z,Y)=>Ts(z,Y<b.length-1,s)).join("");return`<div class="hw-tl-group">${y}${L}</div>`}).join("");return`
    <div class="hw-timeline">
      ${h}
      ${v}
    </div>`}function Ns(e,s,t){var c;let o=(c=e.alerts_all)!=null?c:[],n=o.length,l=s?"\u25BC":"\u25B6",r=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",a=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${l}</span>
        <span class="hw-alerts-label">${r}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${a}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let i=o.map(d=>Rs(d,d.dedupe_key===t)).join("");return`
    <div class="hw-alerts">
      ${a}
      ${i}
    </div>`}function Bs(e,s){var j,X,N;let t=e.cme_tracker;if(!t)return"";let o=(j=vt[t.impact_level])!=null?j:"#96a8b8",n=(X=yt[t.status])!=null?X:t.status,l=300,r=44,a=18,i=r/2,c=10,d=l-18,p=7,m=`<line x1="${a+c}" y1="${i}" x2="${d-p}" y2="${i}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,u=`<circle cx="${a}" cy="${i}" r="${c}" fill="#f0c040" opacity="0.92"/>`,h=`
    <circle cx="${d}" cy="${i}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${i}" r="2.5" fill="#fff" opacity="0.7"/>`,w=`<text x="${a}" y="${i+c+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,v=`<text x="${d}" y="${i+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,$="";if(t.progress!=null){let P=a+c+4,W=d-p-4,C=P+t.progress*(W-P),E=5;t.status==="arrival_window"?$=`
        <g transform="translate(${C.toFixed(1)},${i})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${E}" fill="${o}" opacity="0.92"/>
        </g>`:$=`<circle cx="${C.toFixed(1)}" cy="${i}" r="${E}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${l} ${r}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${m}
    ${u}${w}
    ${h}${v}
    ${$}
  </svg>`,f=Pe(t.arrival_time_utc),b=Pe(t.launch_time_utc),k=t.speed_kms!=null?`${Math.round(t.speed_kms)} km/s`:"\u2014",S=t.half_angle_deg!=null?`${t.half_angle_deg}\xB0`:"\u2014",_=(N=t.source_location)!=null?N:"\u2014",H=t.is_earth_direct?"Direct hit":"Glancing blow",M=t.progress!=null?`${Math.round(t.progress*100)}%`:"\u2014",y=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${g(f)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${g(k)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${g(t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${g(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${g(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${g(M)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${g(S)} \xB7 Source: ${g(_)} \xB7 ${g(H)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,L=s?"\u25BC":"\u25B6",z=t.impact_level==="unknown"?"Unrated":t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1),Y=s?`${x}${y}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${L}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${g(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${g(z)} impact</span>
      </div>
      ${Y}
    </div>`}function Ps(e,s,t,o,n,l,r,a,i,c,d,p,m,u,h,w,v,$){var H;let x=Jt(e,o),f=(H=e.metrics.kp_history_1h)!=null?H:[],b=f.length?xe(f[f.length-1].t_utc):null,k=b?`Recent history \xB7 Last step ${b}`:"Recent history",S=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${O(k)}</span>
  </div></div>`,_=t?Xt(e):"";return`
    <div class="hw-root">
      ${Kt(e)}
      ${Ut(e,t,x,v,$)}
      ${Fs(e,x,m,c,u,h,w,$,v)}
      ${S}
      ${_}
      ${es(e,o,x,p)}
      ${Bs(e,d)}
      ${zs(e,r,a,i)}
      ${Ns(e,n,l)}
    </div>`}function Ds(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${g(e)}</div>
    </div>
  </div>`}function Gs(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var qe="nc-helio-ui",Fe=class{constructor(s,t){this.expanded=!1;this.heroExpanded=!1;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=t,this.loadUiState(),this.el.innerHTML=Gs(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}expandHeroLinkedPanels(s){for(let t of s)switch(t){case"storm_risk":this.expandedImpacts.add("geomag_storm");break;case"radio":this.expandedImpacts.add("radio");break;case"satellite_drag":this.expandedImpacts.add("sat_drag");break;case"gnss":this.expandedImpacts.add("gnss");break;case"aurora":this.expandedImpacts.add("aurora");break;case"xray":this.expandedImpacts.add("xray");break;case"solar":this.solarExpanded=!0;break;default:Ve()&&console.warn(`[Helio] Hero chip nav: unknown section id "${t}"`)}}collapseHeroLinkedPanels(s){for(let t of s)switch(t){case"storm_risk":this.expandedImpacts.delete("geomag_storm");break;case"radio":this.expandedImpacts.delete("radio");break;case"satellite_drag":this.expandedImpacts.delete("sat_drag");break;case"gnss":this.expandedImpacts.delete("gnss");break;case"aurora":this.expandedImpacts.delete("aurora");break;case"xray":this.expandedImpacts.delete("xray");break;case"solar":this.solarExpanded=!1;break;default:break}}heroDomIdExpanded(s){switch(s){case"storm_risk":return this.expandedImpacts.has("geomag_storm");case"radio":return this.expandedImpacts.has("radio");case"satellite_drag":return this.expandedImpacts.has("sat_drag");case"gnss":return this.expandedImpacts.has("gnss");case"aurora":return this.expandedImpacts.has("aurora");case"xray":return this.expandedImpacts.has("xray");case"solar":return this.solarExpanded;default:return!1}}heroChipLinkedAllOpen(s){if(!this.impactsOpen)return!1;for(let t of De[s])if(!this.heroDomIdExpanded(t))return!1;return!0}onClick(s){var c,d,p,m,u;let t=s.target,o=t.closest("[data-hero-chip]");if(o){let h=o.dataset.heroChip;if(h==="G"||h==="R"||h==="S"||h==="X"){let w=De[h];if(this.heroChipLinkedAllOpen(h)){this.collapseHeroLinkedPanels(w),this.saveUiState(),this.render();return}this.impactsOpen=!0,this.expandHeroLinkedPanels(w),this.saveUiState(),this.render(),requestAnimationFrame(()=>requestAnimationFrame(()=>Mt(w)))}return}if(t.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(t.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(t.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}let n=t.closest("[data-impact-row]");if(n){let h=(c=n.dataset.impactRow)!=null?c:"";this.expandedImpacts.has(h)?this.expandedImpacts.delete(h):this.expandedImpacts.add(h),this.saveUiState(),this.render();return}let l=t.closest("[data-solar-layer]");if(l){let h=(d=l.dataset.solarLayer)!=null?d:"";this.solarLayers.has(h)?this.solarLayers.delete(h):this.solarLayers.add(h),this.saveUiState(),this.render();return}if(t.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let r=t.closest("[data-alert-key]");if(r){let h=(p=r.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===h?null:h,this.render();return}if(t.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let h=Date.now();this.collapsedDays=new Set([new Date(h).toISOString().slice(0,10),new Date(h-864e5).toISOString().slice(0,10),new Date(h-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let a=t.closest("[data-tl-day]");if(a){let h=(m=a.dataset.tlDay)!=null?m:"";this.collapsedDays.has(h)?this.collapsedDays.delete(h):this.collapsedDays.add(h),this.saveUiState(),this.render();return}let i=t.closest("[data-timeline-key]");if(i){let h=(u=i.dataset.timelineKey)!=null?u:null;this.expandedTimelineKey=this.expandedTimelineKey===h?null:h,this.render();return}if(t.closest(".hw-kpi-close")){let h=t.closest("[data-impact-row]"),w=h==null?void 0:h.dataset.impactRow;w&&this.expandedImpacts.delete(w),this.saveUiState(),this.render();return}if(t.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}t.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(s){let t=s.target;if(!t.matches("[data-scrub]"))return;let o=parseFloat(t.value);this.scrubOffset=o,t.style.setProperty("--pct",`${(o/parseFloat(t.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let t=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!t.ok)throw new Error(`HTTP ${t.status}`);this.data=await t.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(t){let o=t instanceof Error?t.message:String(t);this.el.innerHTML=Ds(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let t=await s.json(),o=new Map;for(let n of t){let l=o.get(n.region),r=n.area!=null,a=(l==null?void 0:l.area)!=null;(!l||!a&&r||a===r&&n.observed_date>l.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,t,o,n,l,r;if(!(this.opts.lat==null||this.opts.lon==null))try{let a=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!a.ok)return;let i=await a.json(),d=((o=(t=(s=i.coordinates)!=null?s:i.Data)!=null?t:i.data)!=null?o:[]).map(([p,m,u])=>({lon:p,lat:m,prob:u}));this.ovationData={entries:d,forecastTime:String((r=(l=(n=i["Forecast Time"])!=null?n:i.forecast_time)!=null?l:i["Observation Time"])!=null?r:"")},this.render()}catch(a){}}render(){this.data&&(this.el.innerHTML=Ps(this.data,this.expanded,this.heroExpanded,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}saveUiState(){try{localStorage.setItem(qe,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],expandedImpacts:[...this.expandedImpacts]}))}catch(s){}}loadUiState(){try{let s=localStorage.getItem(qe);if(!s)return;let t=JSON.parse(s);typeof t.expanded=="boolean"&&(this.expanded=t.expanded),typeof t.heroExpanded=="boolean"&&(this.heroExpanded=t.heroExpanded),typeof t.alertsExpanded=="boolean"&&(this.alertsExpanded=t.alertsExpanded),typeof t.timelineOpen=="boolean"&&(this.timelineOpen=t.timelineOpen),typeof t.impactsOpen=="boolean"&&(this.impactsOpen=t.impactsOpen),typeof t.cmeExpanded=="boolean"&&(this.cmeExpanded=t.cmeExpanded),typeof t.forecastOpen=="boolean"&&(this.forecastOpen=t.forecastOpen),typeof t.solarExpanded=="boolean"&&(this.solarExpanded=t.solarExpanded),Array.isArray(t.collapsedDays)&&(this.collapsedDays=new Set(t.collapsedDays)),Array.isArray(t.solarLayers)&&(this.solarLayers=new Set(t.solarLayers)),Array.isArray(t.expandedImpacts)&&(this.expandedImpacts=new Set(t.expandedImpacts))}catch(s){}}updateLocation(s,t,o){this.opts=we(ge({},this.opts),{lat:s,lon:t,locationName:o}),this.render()}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},dt={mount(e,s){return Ft(),new Fe(e,s)}};typeof window!="undefined"&&(window.HelioWidget=dt);return $t(Ys);})();
