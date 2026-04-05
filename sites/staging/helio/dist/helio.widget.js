"use strict";var HelioWidgetModule=(()=>{var ge=Object.defineProperty,ut=Object.defineProperties,gt=Object.getOwnPropertyDescriptor,wt=Object.getOwnPropertyDescriptors,xt=Object.getOwnPropertyNames,ze=Object.getOwnPropertySymbols;var Ne=Object.prototype.hasOwnProperty,ft=Object.prototype.propertyIsEnumerable;var Te=(e,s,t)=>s in e?ge(e,s,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[s]=t,Pe=(e,s)=>{for(var t in s||(s={}))Ne.call(s,t)&&Te(e,t,s[t]);if(ze)for(var t of ze(s))ft.call(s,t)&&Te(e,t,s[t]);return e},Be=(e,s)=>ut(e,wt(s));var bt=(e,s)=>{for(var t in s)ge(e,t,{get:s[t],enumerable:!0})},$t=(e,s,t,o)=>{if(s&&typeof s=="object"||typeof s=="function")for(let n of xt(s))!Ne.call(e,n)&&n!==t&&ge(e,n,{get:()=>s[n],enumerable:!(o=gt(s,n))||o.enumerable});return e};var vt=e=>$t(ge({},"__esModule",{value:!0}),e);var Ys={};bt(Ys,{HelioWidget:()=>ht});var fe={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},Qe={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},yt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},$e={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},kt={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},_t={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function St(e){if(!e)return"Update time unavailable";try{let s=Math.round((Date.now()-new Date(e).getTime())/6e4);if(s<1)return"Updated just now";if(s<60)return`Updated ${s} min ago`;let t=Math.floor(s/60);return t<24?`Updated ${t}h ago`:`Updated ${Math.floor(t/24)}d ago`}catch(s){return"Updated recently"}}function Mt(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function we(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e}}function be(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(s){return e.slice(11,16)}}function Ge(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(s){return e}}function z(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var De={G:["aurora","storm_risk"],R:["radio"],S:["satellite_drag","gnss"],X:["xray","solar"]},Ct=2400;function Ve(){var e,s;try{let t=(s=(e=globalThis.location)==null?void 0:e.hostname)!=null?s:"";return t==="localhost"||t==="127.0.0.1"||t.endsWith(".local")}catch(t){return!1}}function Ht(e){let s=[],t=null;for(let o of e){let n=document.getElementById(o);n instanceof HTMLElement?(t||(t=n),s.push(n)):Ve()&&console.warn(`[Helio] Hero chip nav: missing element #${o}`)}t&&t.scrollIntoView({behavior:"smooth",block:"start"});for(let o of s)o.classList.add("section-flash"),window.setTimeout(()=>o.classList.remove("section-flash"),Ct)}function Ye(e){let s=e.trim();return s.toUpperCase().startsWith("X:")?s.slice(2).trim()||"\u2014":s||"\u2014"}function Me(e,s){let t=e.trim().toUpperCase();if(t.length<2||t[0]!==s)return 0;let o=parseInt(t.slice(1),10);return!isFinite(o)||o<0?0:Math.min(5,o)}function Ce(e){return e<=0?{color:"#96a8b8",background:"#1e2830",borderColor:"#2a3c42"}:e===1?{color:"#d4cc5c",background:"#2a2616",borderColor:"#5a5028"}:e===2?{color:"#e0a84a",background:"#2c2214",borderColor:"#6a5018"}:e===3?{color:"#e8a060",background:"#301810",borderColor:"#744018"}:e===4?{color:"#e07058",background:"#2c1412",borderColor:"#762820"}:{color:"#e05c5c",background:"#2e1214",borderColor:"#7a2828"}}function Lt(e){var c,r,i;let s=e.trim().toUpperCase();if(s==="\u2014"||s===""||s==="-")return{color:"#607880",background:"#1e2830",borderColor:"#2a3c42"};let t=(c=$e[s])!=null?c:"#a0b4b8",o={A:"#242628",B:"#15221c",C:"#1a2215",M:"#221a10",X:"#281416"},n={A:"#404448",B:"#2a5a40",C:"#3e6a30",M:"#6a5018",X:"#7a2828"};return{color:t,background:(r=o[s])!=null?r:"#1e2830",borderColor:(i=n[s])!=null?i:"#3a4c52"}}function Et(e,s){var c,r,i,a,l,d;let t=e.metrics.xray_class!=null?String(e.metrics.xray_class):"\u2014",o={g:(c=s==null?void 0:s.gScale)!=null?c:e.scales.g_scale,r:e.scales.r_scale,s:e.scales.s_scale,x:Ye(t)},n=(r=e.hero)==null?void 0:r.scales;return n?{g:(i=n.g)!=null?i:o.g,r:(a=n.r)!=null?a:o.r,s:(l=n.s)!=null?l:o.s,x:Ye((d=n.x)!=null?d:o.x)}:o}var Rt=`
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
/* Storm Risk: NOW | FORECAST 24h */
.hw-storm-risk-head{font-size:.62em;color:#607880;letter-spacing:.06em;text-transform:uppercase;margin:6px 0 5px}
.hw-storm-risk-head span{color:#3a4c52;padding:0 5px;font-weight:400;letter-spacing:0}
.hw-storm-risk-cols{display:grid;grid-template-columns:minmax(5rem,6.2rem) minmax(0,1fr);gap:6px 10px;align-items:start}
.hw-storm-risk-now{padding:0 4px 0 0;min-width:0}
.hw-storm-risk-now-num{font-size:48px;font-weight:700;line-height:1;color:#b4c6cc;letter-spacing:-.05em}
.hw-storm-risk-now-lbl{font-size:clamp(.88rem,2.35vw,1.02rem);font-weight:500;color:#a8bac4;margin-top:5px;line-height:1.22;word-wrap:break-word}
.hw-storm-risk-fc{border-left:1px solid #1e2c30;padding-left:10px;margin-left:0;min-width:0}
.hw-storm-severe{border:1px solid #e05c5c66;background:linear-gradient(165deg,#e05c5c14,#1a1216);border-radius:4px;padding:9px 10px}
.hw-storm-severe-title{font-size:.65em;font-weight:700;color:#e07a7a;letter-spacing:.08em;text-transform:uppercase}
.hw-storm-severe-g{font-size:.85em;color:#e8c8c8;margin-top:6px;font-weight:600}
.hw-storm-severe-p{font-size:.74em;color:#96a8b8;margin-top:5px}
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
`,We=!1;function Ft(){if(We)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=Rt,document.head.appendChild(e),We=!0}function It(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.length,n=s/o,c=e.map((r,i)=>{let a=Math.max(2,Math.min(t,r.kp/9*t)),l=t-a,d=i*n,p=r.kp>=6?"#e05c5c":r.kp>=5?"#e0a84a":r.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${l.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${r.kp.toFixed(1)} \xB7 ${u(be(r.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">${c}</svg>`}function je(e,s,t,o,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let c=200,r=Math.min(...e),i=Math.max(...e),a=i-r||1,l=g=>o-2-(g-r)/a*(o-4),d=e.map((g,h)=>`${(h/(e.length-1)*c).toFixed(1)},${l(g).toFixed(1)}`).join(" "),p="";if(n&&r<0&&i>0){let g=l(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${c}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let m=e.map((g,h)=>`<rect x="${(h/(e.length-1)*c-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${u(s[h]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${c} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${m}
  </svg>`}function Ot(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,t=32,o=e.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),n=Math.min(...o),r=Math.max(...o)-n||1,i=d=>t-2-(d-n)/r*(t-4),a=o.map((d,p)=>`${(p/(o.length-1)*s).toFixed(1)},${i(d).toFixed(1)}`).join(" "),l=e.map((d,p)=>{let m=p/(o.length-1)*s,g=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(m-4).toFixed(1)}" y="0" width="8" height="${t}" fill="transparent"><title>${u(be(d.t_utc))} \xB7 ${g}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${s} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function ce(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function At(e){var l;let s=(l=e.metrics.wind_history_1h)!=null?l:[],t=s[s.length-1],o=e.metrics.solar_wind_kms,n=o!=null?`${Math.round(o)} km/s`:"\u2014",c=o!=null?o>=700?"#e05c5c":o>=500?"#e0a84a":o>=400?"#d4cc5c":"#5cce8c":"#607880",r=(t==null?void 0:t.density)!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",i=(t==null?void 0:t.temp_kk)!=null?`${t.temp_kk.toFixed(0)} kK`:"\u2014",a=(t==null?void 0:t.pressure_npa)!=null?`${t.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ce("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${u(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${u(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${u(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function zt(e){var i,a;let s=(i=e.metrics.xray_class)!=null?i:"A",t=e.metrics.xray_flux_wm2,o=t!=null?t.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],c=n.map(l=>{let d=l.label===s,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${d?"cc":"44"}">${p}</div>`}).join(""),r=n.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===s?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ce("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${c}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=$e[s])!=null?a:"#a0b4b8"}">${u(s)}-class</b> \xB7 ${u(o)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Tt(e){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(S=>{let y=100+S/20*100;return`<line x1="${y.toFixed(1)}" y1="16" x2="${y.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(e==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${l}${d}</svg>`;let p=e<=-10?"#e05c5c":e<=-5?"#e0a84a":e<0?"#d4b84a":e>=5?"#5cce8c":"#7acca8",m=Math.max(-20,Math.min(20,e)),g=100+m/20*100,h=3,w=m<0?g-h:100-h,v=Math.max(2*h,Math.abs(g-100)+2*h),f=`<rect x="${w.toFixed(1)}" y="16" width="${v.toFixed(1)}" height="6" rx="${h}" fill="${p}" opacity="0.82"/>`,x=5,b=15,$=b-x*1.1,_=`<polygon points="${g.toFixed(1)},${b.toFixed(1)} ${(g-x).toFixed(1)},${$.toFixed(1)} ${(g+x).toFixed(1)},${$.toFixed(1)}" fill="${p}"/>`,M=`<line x1="${g.toFixed(1)}" y1="${b.toFixed(1)}" x2="${g.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,H=`<text x="${g.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${e>=0?"+":""}${e.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${l}${d}${f}${_}${M}${H}
  </svg>`}function Nt(e){var m;let s=e.metrics.imf_bz_nt,t=e.metrics.imf_bt_nt,o=e.metrics.solar_wind_kms,n=(m=e.metrics.pressure_npa)!=null?m:null,c=s!=null?s<=-10?"#e05c5c":s<=-5?"#e0a84a":s>=5?"#5cce8c":"#a0b4b8":"#607880",r=s!=null?(s>=0?"+":"")+s.toFixed(1)+" nT":"\u2014",i=t!=null?t.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=n!=null?`${n.toFixed(2)} nPa`:"\u2014",d=ve(e),p=s!=null&&s<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:s!=null&&s<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ce("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${Tt(s)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${u(i)}</span>
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
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${u(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${u(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function ve(e){var a,l;let s=e.metrics.imf_bz_nt,t=(a=e.metrics.kp_latest)!=null?a:0,o=(l=e.metrics.solar_wind_kms)!=null?l:0,n,c,r;if(s!=null&&s<-5||t>=6)n="storm",c="#e05c5c",r="Storm conditions";else if(s!=null&&s<0||t>=4||o>=400){let d=s!=null&&s<0;n="active",c="#e0a84a",r=d?"Active coupling":"Elevated"}else n="stable",c="#5cce8c",r="Stable";let i;return s==null?i="Unknown":s>2?i="Closed":s>0?i="Minimal":s>-5?i="Moderate":s>-10?i="Strong":i="Very strong",{state:n,color:c,label:r,coupling:i}}function Pt(e,s,t,o){let n=o?"mc":"mf",c=e.color,r=t!=null?t:0,i=r>500,a=r<350,l=i?.9:a?1.8:1.3;if(o){let h=45-(e.state==="storm"?11:e.state==="active"?16:21),w=e.state==="storm"?12:e.state==="active"?10:8,v=50-w,f=76,x=[`M ${h},25`,`C ${h-2},15 41,${w} 45,${w}`,`C 53,${w} ${f-8},${w+4} ${f},20`,`C ${f+1},23 ${f+1},27 ${f},30`,`C ${f-8},${v-4} 53,${v} 45,${v}`,`C 41,${v} ${h-2},35 ${h},25`,"Z"].join(" "),b=i?3:2,$=[14,25,36],_=S=>`<path d="M 0,${S} L ${i?8:6},${S} M ${i?6:4},${S-2} L ${i?8:6},${S} L ${i?6:4},${S+2}" stroke="${c}bb" stroke-width="${i?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,M=$.map(S=>_(S)).join(""),k=Array.from({length:b},(S,y)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/b*y).toFixed(2)}s">${M}</g>`).join(""),H=s==null?"":s>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${k}</g>
      <path d="${x}" fill="${c}14" stroke="${c}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${H}
    </svg>`}else{let f=e.state==="storm"?16:e.state==="active"?26:38,x=155-f,b=e.state==="storm"?22:e.state==="active"?30:40,$=120-b,_=240,M=[`M ${x},60`,`C ${x-4},42 150,${b} 155,${b}`,`C 173,${b} ${_-5},${b+18} ${_},60`,`C ${_-5},${$-18} 173,${$} 155,${$}`,`C 150,${$} ${x-4},78 ${x},60`,"Z"].join(" "),k=`M ${x+2},60 C ${x+2},${60-f*.4} 152,54 150,60 C 152,66 ${x+2},${60+f*.4} ${x+2},60 Z`,H=r>700?"#e05c5c":r>500?"#e0a84a":r>350?"#d4c840":"#5cce8c",S=r>700?.4:r>500?.65:r>350?1.1:1.8,y=r>500?[10,24,40,57,74,90,106]:r>350?[14,34,57,82,104]:[20,50,82,108],L=16,T=22,Y=x-6,W=Math.ceil((Y-T)/L)+2,X=Array.from({length:W},(O,R)=>T-L+R*L),N=12,B=8,j=X.flatMap(O=>y.map(R=>`<path d="M ${O},${R} L ${O+N},${R} M ${O+B},${R-3} L ${O+N},${R} L ${O+B},${R+3}" stroke="${H}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),C=`<g class="hw-wg-full" style="animation-duration:${S}s">${j}</g>`,F=s==null?"":s>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',Q=s==null?"":`<text x="163" y="62" font-size="6" fill="${s>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${s>0?"\u2191":"\u2193"}</text>`;return ye("magnetosphere",{magnetInfo:e,bz:s,windKms:t,uid:n})}}function ye(e,s={}){var C,F,Q,O,R,J;let c=(C=s.uid)!=null?C:"hse",r=0,i=160,a=800,l=17,d=a-l,p=s.magnetInfo,m=(F=p==null?void 0:p.state)!=null?F:"stable",g=(Q=p==null?void 0:p.color)!=null?Q:"#e0a84a",w=a-(m==="storm"?55:m==="active"?80:110),v=m==="storm"?58:m==="active"?76:95,f=1120,x=20,b=[`M ${w},130`,`C ${w-8},${130-v*.55} ${a-18},${130-v} ${a},${130-v}`,`C ${a+120},${130-v} ${f-180},${130-x} ${f},${130-x}`,`L ${f},${130+x}`,`C ${f-180},${130+x} ${a+120},${130+v} ${a},${130+v}`,`C ${a-18},${130+v} ${w-8},${130+v*.55} ${w},130`,"Z"].join(" "),$=e==="magnetosphere",_=$?m==="storm"?"0.12":"0.08":"0.04",M=$?"0.75":"0.28",k=`<g id="${c}-base-sun">
    <circle cx="${r}" cy="130" r="${i+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${r}" cy="130" r="${i}" fill="#f0c040" opacity="0.88"/>
  </g>`,H=`
    <ellipse cx="${a}" cy="130" rx="${l}" ry="${(l*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${a}" y1="${130-l}" x2="${a}" y2="${130+l}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${d}" y1="130" x2="${a+l}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,S=`<g id="${c}-base-earth">
    <circle cx="${a}" cy="130" r="${l}" fill="#1a4a6e" opacity="0.92"/>
    ${H}
  </g>`,y=`<g id="${c}-base-magnetosphere">
    <path d="${b}" fill="${g}" fill-opacity="${_}"
          stroke="${g}" stroke-opacity="${M}" stroke-width="1.8"/>
    ${p?`<text x="${w+5}" y="${130-v-7}" font-size="12" fill="${g}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,L=`<g id="${c}-base-axis">
    <line x1="${i}" y1="130" x2="${w}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,T="";if(e==="magnetosphere"){let A=(O=s.windKms)!=null?O:0,G=A>500,P=A<350,E=(G?.5:P?1.4:.9)*1.3,K=A>700?"#e05c5c":A>500?"#e0a84a":A>350?"#d4c840":"#5cce8c",te=i+8,ee=w-14,I=8,D=6,U=(ee-te)/(I-1),se=260/(D+1),V=38,ae=24,ke=2,_e=Array.from({length:I},(ne,pe)=>{let oe=te+pe*U,re=Array.from({length:D},(he,me)=>{let Z=se*(me+1);return`<path d="M ${oe.toFixed(1)},${Z.toFixed(1)} L ${(oe+V).toFixed(1)},${Z.toFixed(1)} M ${(oe+ae).toFixed(1)},${(Z-6).toFixed(1)} L ${(oe+V).toFixed(1)},${Z.toFixed(1)} L ${(oe+ae).toFixed(1)},${(Z+6).toFixed(1)}"
          stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:ke},(he,me)=>{let Z=-((I-pe)/I*E)-me*E/ke;return`<g style="opacity:.12;animation:hw-arrow-chase ${E}s linear ${Z.toFixed(3)}s infinite">${re}</g>`}).join("")}).join(""),q=(R=s.bz)!=null?R:null,de=q==null?"":(()=>{let ne=q>0?"#5cce8c":"#e05c5c";return`${q>0?`<path d="M ${a},137 L ${a},123 M ${a-3},126 L ${a},123 L ${a+3},126"
           stroke="${ne}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${a},123 L ${a},137 M ${a-3},134 L ${a},137 L ${a+3},134"
           stroke="${ne}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${a+22}" y="135" font-size="13"
        fill="${ne}" font-family="monospace">Bz${q>0?"\u2191":"\u2193"}</text>`})();T=`${_e}${de}`}let Y=`<g id="${c}-overlay-solar-wind">${T}</g>`,W="";if(e==="coronal_hole"&&s.hssState){let A=s.hssState,G=(J=A.speed)!=null?J:0,P=G>=420,E=A.color,K=P?"0.85":"0.25",te=G>=500?"0.18":P?"0.10":"0.04",ee=i+8,I=d-16,D=60,U=`${ee},130 ${I},${130-D} ${I},${130+D}`,se=I+6,V=`${se},120 ${se+18},130 ${se},140`;W=`
    <polygon points="${U}" fill="${E}" opacity="${te}"/>
    <line x1="${ee}" y1="130" x2="${I-5}" y2="130"
          stroke="${E}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${K}"/>
    <polygon points="${V}" fill="${E}" opacity="${P?"0.9":"0.25"}"/>`}let X=`<g id="${c}-overlay-coronal-hole">${W}</g>`,N="";if(e==="cme_cone"&&s.cmeState){let A=s.cmeState,G=i,P=d-10,E=P-G,K=U=>Math.tan(U*Math.PI/180),te=Math.round(K(9)*E),ee=Math.round(K(6)*E),I=Math.round(K(3)*E),D=U=>`${G},130 ${P},${130-U} ${P},${130+U}`;if(A.status!=="quiet"){let U=A.status==="impact"?"#e05c5c":"#d4cc5c";N=`
    <polygon points="${D(te)}" fill="#253238" opacity="0.85"/>
    <polygon points="${D(ee)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${D(I)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${G+14}" y1="130" x2="${P-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${a}" cy="130" r="${l+8}" fill="none"
            stroke="${U}" stroke-width="7" opacity="0.16"/>`}else N=`
    <line x1="${G+14}" y1="130" x2="${d-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let B=`<g id="${c}-overlay-cme-cone">${N}</g>`,j=`<g id="${c}-overlay-labels">
    <text x="18" y="250" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${a}" y="252" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;return`<svg class="hw-solar-earth-scene" viewBox="0 0 1000 260"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="260" fill="#0a1014"/>
    ${L}
    ${Y}
    ${X}
    ${B}
    ${k}
    ${y}
    ${S}
    ${j}
  </svg>`}function Bt(e){let s=ve(e),t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=e.metrics.kp_latest,c=e.metrics.density,r=e.metrics.pressure_npa,i=t!=null?(t>=0?"+":"")+t.toFixed(1)+" nT":"\u2014",a=o!=null?`${Math.round(o)} km/s`:"\u2014",l=c!=null?`${c.toFixed(1)} p/cm\xB3`:"\u2014",d=r!=null?`${r.toFixed(2)} nPa`:"\u2014",p=t!=null?t<=-10?"#e05c5c":t<=-5?"#e0a84a":t>=5?"#5cce8c":"#a0b4b8":"#607880",m=o!=null?o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c":"#607880",g=t!=null&&t<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":t!=null&&t<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ce("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Pt(s,t,o,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${m}">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${u(i)}</span>
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
        <span class="hw-kpi-stat-value">${u(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(g)}</div>
  </div>`}function Gt(e,s){if(!s)return"";let t=ve(e),o=e.metrics.imf_bz_nt,n=e.metrics.solar_wind_kms,c=e.metrics.density,r=e.metrics.pressure_npa,i=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",a=n!=null?`${Math.round(n)} km/s`:"\u2014",l=c!=null?`${c.toFixed(1)} p/cm\xB3`:"\u2014",d=r!=null?`${r.toFixed(2)} nPa`:"\u2014",p=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",m=n!=null?n>700?"#e05c5c":n>500?"#e0a84a":n>350?"#d4c840":"#5cce8c":"#607880",g=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:6px">${ye("magnetosphere",{windKms:n!=null?n:void 0,bz:o!=null?o:void 0})}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${m}">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${u(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${u(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${u(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(g)}</div>
  </div>`}function Ze(e,s,t){if(!e.length)return null;let o=(t%360+360)%360,n=-1,c=1/0,r=Math.cos(s*Math.PI/180);for(let i of e){let a=i.lat-s,l=(i.lon-o+180+360)%360-180,d=a*a+l*r*(l*r);d<c&&(c=d,n=i.prob)}return n>=0?n:null}function Je(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Dt(e,s){let t=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,o=null;s&&e.lat!=null&&e.lon!=null&&(o=Ze(s.entries,e.lat,e.lon));let n=e.lat!=null&&e.lon!=null,c=o!=null?o>=30?"#5cce8c":o>=10?"#d4cc5c":"#9ab4bc":"#607880",r=o!=null?`${o}%`:s?"n/a":"\u2026",i=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?u(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${c}">Aurora: ${r}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ce("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${z(t)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Je(e)}
    </div>
    ${i}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Yt(e,s,t,o){switch(s){case"solar_wind":return At(e);case"xray":return zt(e);case"imf_bz":return Nt(e);case"aurora":return Dt(t,o);case"magnetosphere":return Bt(e);default:return""}}function Wt(e,s){if(e.length<2)return"\u2192";let t=e[e.length-1],o=Math.max(0,e.length-4),n=e[o];if(!isFinite(t)||!isFinite(n))return"\u2192";let c=t-n;return c>s?"\u2191":c<-s?"\u2193":"\u2192"}var jt={quiet:"171",active:"195",elevated:"284",storm:"304"};function Ut(e,s){var o,n,c;if(s==null)return(n=(o=e.summary)==null?void 0:o.status)!=null?n:"quiet";let t=parseInt(((c=s.gScale)!=null?c:"G0").replace(/\D/g,""),10)||0;return t>=3?"storm":t>=1?"elevated":s.kp>=4?"active":"quiet"}function Xt(e,s){var l,d;let t=(l=jt[e])!=null?l:"171",o=`/assets/gifs/current_eit_${t}.gif`,n=ps(o,s),c=ms,r=(d=fe[e])!=null?d:fe.quiet,i=`${r.accent}44`,a=`0 0 10px ${r.accent}55,0 0 24px ${r.accent}22`;return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner" style="border-color:${i};box-shadow:${a}">
      <img class="hw-solar-mini-img" src="${z(n)}" alt="Sun EIT ${z(t)}"
        onerror="if(this.src!=='${z(c)}')this.src='${z(c)}'" />
    </div>
  </div>`}function Kt(e,s,t,o,n){var b,$,_;let{summary:c,metrics:r}=e,i=(b=fe[c.status])!=null?b:fe.quiet,a=t!=null?t.kp.toFixed(1):r.kp_latest!=null?r.kp_latest.toFixed(1):"\u2014",l=Et(e,t),p=[{key:"G",text:l.g,title:"Geomagnetic storm level. Based on Kp index.",aria:"Geomagnetic storm level"},{key:"R",text:l.r,title:"Radio blackout level. Based on solar X-ray flux.",aria:"Radio blackout level"},{key:"S",text:l.s,title:"Solar radiation storm level. Based on energetic proton flux.",aria:"Solar radiation storm level"},{key:"X",text:`X:${l.x}`,title:"Current solar X-ray activity class.",aria:"Solar X-ray activity"}].map(M=>{let k;return M.key==="G"?k=Ce(Me(l.g,"G")):M.key==="R"?k=Ce(Me(l.r,"R")):M.key==="S"?k=Ce(Me(l.s,"S")):k=Lt(l.x),`<button type="button" class="hw-scale-chip hw-hero-scale-chip"
      style="${`color:${k.color};background:${k.background};border-color:${k.borderColor}`}" data-hero-chip="${M.key}" title="${z(M.title)}" aria-label="${z(M.aria)}">${u(M.text)}</button>`}).join(""),m=Wt((($=r.kp_history_1h)!=null?$:[]).map(M=>M.kp),.5),g=(_=r.kp_latest)!=null?_:0,h=g>=5,w=h?`linear-gradient(160deg, #0d2a1a 0%, ${i.bg}22 75%)`:`${i.bg}18`,v=Ut(e,t),x=h?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${g.toFixed(1)}</span>
      <a class="hw-aurora-map-btn" href="${z("https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg")}" target="_blank" rel="noopener noreferrer">View aurora map \u2192</a>
    </div>`:"";return`
    <div class="hw-hero" style="background:${w}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${t?"color:#9acf60":""}">Kp <b>${u(a)}</b>${t?"":`<span class="hw-trend">${m}</span>`}</div>
          <span class="hw-status-badge" style="background:${i.accent}22;color:${i.accent};display:block;text-align:center">${u(c.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${p}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${u(c.text)}</div>
            ${Xt(v,o.baseUrl)}
          </div>
        </div>
      </div>
      ${x}
    </div>`}function qt(e){var d,p,m,g;let{metrics:s}=e,t=(d=s.kp_history_1h)!=null?d:[],o=(p=s.wind_history_1h)!=null?p:[],n=(m=s.bz_history_1h)!=null?m:[],c=(g=s.xray_history_1h)!=null?g:[],r=It(t),i=je(o.map(h=>{var w;return(w=h.kms)!=null?w:0}).filter(h=>h>0),o.map(h=>be(h.t_utc)),"#5cce8c",28,!1),a=je(n.map(h=>h.bz),n.map(h=>be(h.t_utc)),"#d4cc5c",28,!0),l=Ot(c);return`
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
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
    </div>`}function Qt(e){let s=St(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${u(s)}</span>
    </div>`}function Vt(e){return e.map((s,t)=>t===0?(s+e[1])/2:t===e.length-1?(e[t-1]+s)/2:(e[t-1]+s+e[t+1])/3)}function Zt(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Jt(e){return e>=5?"good":e>=3?"possible":"none"}function et(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function es(e){let s=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",t=et(e),o=s==="none"?"No aurora expected at mid-latitudes":t!=null?`Aurora possible equatorward of ~${t}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",c=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",r=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:s,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:c},{kind:"solar_activity",level:r,label:"Solar Activity",summary:r==="none"?"Quiet geomagnetic conditions expected":r==="low"?"Active geomagnetic conditions possible":r==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function ts(e,s){var p;if(s<=0)return null;let t=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!t.length)return null;let o=Date.now()+s*36e5,n=t[0],c=1/0;for(let m of t){let g=Math.abs(new Date(m.t_utc).getTime()-o);g<c&&(c=g,n=m)}let r=n.kp,i=Zt(r),a=Jt(r),l=et(r),d=es(r);return{offsetH:s,kp:r,gScale:i,auroraLabel:a,auroraMinLat:l,impacts:d}}function ss(e,s,t,o){var j;let{forecast:n,metrics:c}=e,{kp_max_next_24h:r,kp_max_at_utc:i,trend:a}=n,l=((j=c.kp_forecast_3h)!=null?j:[]).slice(0,16),d=l.length,p=d*3,m=p>0?`${(s/p*100).toFixed(0)}%`:"0%",g=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline",h="Kp forecast unavailable";if(r!=null){let C=we(i),F=a==="rising"?"rising":a==="falling"?"falling":"steady";h=`Peak Kp ${r.toFixed(1)} next 24h${C?` at ${C}`:""} \xB7 ${F}`}let w=l.length?we(l[0].t_utc):null,v=w?`Forecast \xB7 Next step ${w}`:"Forecast";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${u(v)}</span>
      </div>
      ${o?`<div class="hw-forecast-text">${u(h)}</div>`:""}
    </div>`;let f=320,x=38,b=14,$=x+b,_=f/d,M=C=>x-Math.max(2,Math.min(x-2,C/9*(x-2))),k="",H=l.map(C=>C.kp),S=Vt(H);l.forEach((C,F)=>{let Q=M(C.kp),O=x-Q,R=F*_,J=R+_/2,A=C.kp>=6?"#e05c5c":C.kp>=5?"#e0a84a":C.kp>=4?"#d4cc5c":"#5cce8c",G=`Kp ${C.kp.toFixed(1)} \xB7 ${we(C.t_utc)}`;if(k+=`<rect x="${R.toFixed(1)}" y="${Q.toFixed(1)}" width="${(_-1.5).toFixed(1)}" height="${O.toFixed(1)}" fill="${A}" fill-opacity="0.85" rx="1.5"/>`,k+=`<rect x="${R.toFixed(1)}" y="0" width="${_.toFixed(1)}" height="${x}" fill="transparent"><title>${z(G)}</title></rect>`,d<=8||F%2===0){let E=new Date(C.t_utc).getHours();k+=`<text x="${J.toFixed(1)}" y="${($-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${E.toString().padStart(2,"0")}</text>`}});let L=`<polyline points="${l.map((C,F)=>{let Q=F*_+_/2,O=M(S[F]);return`${Q.toFixed(1)},${O.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,T="";if(s>0&&d>0){let C=Math.min(f-1,s/(d*3)*f);T=`
      <line x1="${C.toFixed(1)}" y1="0" x2="${C.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${C.toFixed(1)},${x} ${(C-4).toFixed(1)},${(x-7).toFixed(1)} ${(C+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let Y=Math.round(p/4),W=Math.round(p/2),X=Math.round(p*3/4),N=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${u(g)}</span>
        ${s>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${s}" style="--pct:${m}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${Y}h</span>
        <span class="hw-scrub-tick">+${W}h</span>
        <span class="hw-scrub-tick">+${X}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,B=t?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(t.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${t.kp.toFixed(1)} \xB7 ${t.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${u(v)}</span>
      </div>
      ${o?`
      ${B}
      <div class="hw-forecast-text">${u(h)}</div>
      <svg viewBox="0 0 ${f} ${$}" style="width:100%;height:${$}px;display:block" preserveAspectRatio="none">
        ${k}
        ${L}
        ${T}
      </svg>
      ${N}`:""}
    </div>`}function os(e){let s=/([NS])(\d+)([EW])(\d+)/i.exec(e);return s?{lat:(s[1].toUpperCase()==="N"?1:-1)*parseInt(s[2],10),lon:(s[3].toUpperCase()==="E"?1:-1)*parseInt(s[4],10)}:null}var tt=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function ns(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function rs(e,s,t){let o=s/2,n=o*.87,c=s*.03,r=s*.009,i=e.map(a=>{var f,x;let l=os(a.location);if(!l||Math.abs(l.lon)>88||a.location.includes("*"))return"";let d=ns(a);if(!t.has(d))return"";let p=tt.find(b=>b.id===d).color,m=l.lat*Math.PI/180,g=l.lon*Math.PI/180,h=(o+n*Math.cos(m)*Math.sin(g)).toFixed(1),w=(o-n*Math.sin(m)).toFixed(1),v=`AR ${a.region} \xB7 ${a.location}
Class: ${(f=a.spot_class)!=null?f:"\u2014"} / ${(x=a.mag_class)!=null?x:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${u(v)}</title>
      <circle cx="${h}" cy="${w}" r="${(c+r+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(r*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${h}" cy="${w}" r="${c.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${r.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${i}</svg>`}var Ee={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},st='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',as=Ee.solar_activity,is='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><path d="M2 6 Q2 2.5 6 2.5 Q10 2.5 10 6 Q10 9.5 6 9.5 Q2 9.5 2 6"/><ellipse cx="6" cy="6" rx="2.2" ry="1.9"/><circle cx="6" cy="6" r="0.65" fill="currentColor" stroke="none"/></svg>',ls='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><circle cx="3.2" cy="6" r="2.2"/><line x1="5.8" y1="6" x2="11" y2="6"/><polyline points="9.2,4.3 11,6 9.2,7.7" fill="currentColor" stroke="none"/></svg>',cs=14,ds="https://staging.nebulacast.app";function ps(e,s){return!e||/^https?:\/\//.test(e)||e.startsWith("//")?e:(s!=null?s:ds).replace(/\/$/,"")+(e.startsWith("/")?e:"/"+e)}var hs="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ms="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",us=240;function gs(e,s){var l,d,p;let t=parseInt(((l=e.scales.r_scale)!=null?l:"R0").slice(1),10),o=(d=e.metrics.xray_class)!=null?d:"A",n=e.metrics.xray_flux_wm2,c=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",i=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(m=>{let g=m.r===t,h=m.r<=t,w=h?m.color:"#1e2c30",v=g?"1":h?"0.5":"1",f=g?m.color:h?m.color+"99":"#566068",x=g?m.color:h?m.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${f}">R${m.r}</span>
      <div class="hw-radio-bbar" style="background:${w};opacity:${v}"></div>
      <span class="hw-radio-bdesc" style="color:${x}">${m.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${i}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=$e[o])!=null?p:"#a0b4b8"}">${u(o)}-class</b> \xB7 ${u(c)}</div>
  </div>`}var ie={g1:"#d4cc5c",g2:"#e0a84a",g3:"#e05c5c",g4:"#e05050",g5:"#c04070"},ot={0:"Quiet",1:"Minor Storm",2:"Moderate Storm",3:"Strong Storm",4:"Severe Storm",5:"Extreme Storm"};function ws(e){return e>=9?5:e>=8?4:e>=7?3:e>=6?2:e>=5?1:0}function le(e,s){if(e<s-.7)return 0;if(e>s+1)return .9;let t=(e-(s-.7))/1.7;return Math.round(Math.pow(Math.max(0,t),.7)*90)/100}function xs(e){var l,d,p;let s=parseInt(((l=e.scales.g_scale)!=null?l:"G0").replace(/\D/g,""),10),t=Math.max(0,Math.min(5,Number.isFinite(s)?s:0)),o=(d=e.metrics.kp_forecast_3h)!=null?d:[],n=Date.now(),c=n+24*60*60*1e3,r=o.filter(m=>{let g=new Date(m.t_utc).getTime();return g>=n-3*60*60*1e3&&g<=c}),i=r.length===0?0:Math.max(...r.map(m=>m.kp)),a={G1:le(i,5),G2:le(i,6),G3:le(i,7),G4:le(i,8),G5:le(i,9),max_expected:ws(i)};return{now:{g_level:t,label:(p=ot[t])!=null?p:"Quiet"},forecast_24h:a}}function fs(e){if(!e||typeof e!="object")return null;let s=e,t=s.now,o=s.forecast_24h;if(!t||!o)return null;let n=typeof t.g_level=="number"?t.g_level:parseInt(String(t.g_level),10),c=typeof t.label=="string"?t.label:"Quiet";if(!Number.isFinite(n))return null;let r=l=>{let d=typeof l=="number"?l:parseFloat(String(l));return Number.isFinite(d)?Math.max(0,Math.min(1,d)):0},i=o.max_expected,a=typeof i=="number"&&Number.isFinite(i)?Math.max(0,Math.min(5,Math.round(i))):0;return{now:{g_level:Math.max(0,Math.min(5,Math.round(n))),label:c},forecast_24h:{G1:r(o.G1),G2:r(o.G2),G3:r(o.G3),G4:r(o.G4),G5:r(o.G5),max_expected:a}}}function nt(e){var s;return(s=fs(e.storm_risk))!=null?s:xs(e)}function rt(e){return e>=4?"#e05c5c":e>=3?"#e0a84a":e>=1?"#d4cc5c":"#607880"}var Ue={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function bs(e){var l,d,p;let s=(l=e.metrics.kp_latest)!=null?l:0,t=e.metrics.imf_bz_nt,o=e.metrics.solar_wind_kms,n=parseInt(((d=e.scales.g_scale)!=null?d:"G0").replace("G",""),10)||0,c=s>=5||n>=1,r=(p=e.metrics.kp_history_1h)!=null?p:[],i=0;if(r.length>=2&&(i=r[r.length-1].kp-r[r.length-2].kp),!c)return{active:!1,phase:"quiet",kp_current:s,kp_trend:i,bz_nt:t,solar_wind_kms:o};let a;return i>.3&&(t==null||t<-5)?a="rising":i<-.5?a="decline":a="peak",{active:!0,phase:a,kp_current:s,kp_trend:i,bz_nt:t,solar_wind_kms:o}}function $s(e){if(!e.active)return"";let s=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],t=s.findIndex(i=>i.key===e.phase),o=Ue[e.phase],n=s[t].label,c=s.map((i,a)=>{let l=a===t,d=a<t,p=Ue[i.key],m=l?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:d?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",g=l?" hw-spi-dot-active":"",h=l?`color:${p};font-weight:700`:d?`color:${p}66`:"color:#2e4248",w=a<s.length-1?`<div class="hw-spi-arr">${d?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${g}" style="${m}"></div>
        <div class="hw-spi-txt" style="${h}">${i.label}</div>
      </div>${w}`}).join(""),r=[`Kp ${e.kp_current.toFixed(1)}`];return e.bz_nt!=null&&r.push(`Bz ${e.bz_nt>0?"+":""}${e.bz_nt.toFixed(1)} nT`),e.solar_wind_kms!=null&&r.push(`Wind ${Math.round(e.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${o};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${c}</div>
    <div class="hw-spi-params">${r.join(" \xB7 ")}</div>
  </div>`}function vs(e,s){var v;let t=nt(e),o=bs(e),n=t.forecast_24h,c=n.G4>1e-6||n.G5>1e-6,r=n.G5>1e-6,i=r?5:4,a=r?n.G5:n.G4,l=r?"G5":"G4",d=(v=ot[i])!=null?v:"Severe Storm",m=`
    <div class="hw-storm-risk-now">
      <div class="hw-storm-risk-now-num" style="color:${rt(t.now.g_level)}">G${t.now.g_level}</div>
      <div class="hw-storm-risk-now-lbl">${u(t.now.label)}</div>
    </div>`,g=(f,x,b)=>{let $=n[f],_=Math.round($*100),M=Math.round($*100);return b&&$<1e-6?`<div class="hw-gstorm-slot" data-storm-prob="${f}" aria-hidden="true"></div>`:`<div class="hw-gstorm-row">
      <span class="hw-gstorm-lbl" style="color:${x};min-width:22px${_===0?" opacity:.4":""}">${f}</span>
      <div class="hw-gstorm-track">
        <div class="hw-gstorm-fill" style="width:${M}%;background:${x}"></div>
      </div>
      <span class="hw-gstorm-pct" style="color:${_>0?x:"#607880"}">${_}%</span>
    </div>`},h;if(c){let f=Math.round(a*100);h=`
      <div class="hw-storm-risk-fc">
        <div class="hw-storm-severe" role="alert">
          <div class="hw-storm-severe-title">Severe storm risk</div>
          <div class="hw-storm-severe-g">${l} expected \xB7 ${u(d)}</div>
          <div class="hw-storm-severe-p">Probability: <b style="color:#e8c4c4">${f}%</b></div>
        </div>
      </div>`}else h=`
      <div class="hw-storm-risk-fc">
        <div class="hw-gstorm-rows">${[g("G1",ie.g1,!1),g("G2",ie.g2,!1),g("G3",ie.g3,!1),g("G4",ie.g4,!0),g("G5",ie.g5,!0)].join("")}</div>
        <div class="hw-gstorm-footer" style="margin-top:6px">From Kp forecast \xB7 max implied G${n.max_expected}</div>
      </div>`;return`<div class="hw-impact-tip${s?" hw-impact-tip-open":""}">
    ${$s(o)}
    <div class="hw-storm-risk-head">Now <span>|</span> Forecast 24h</div>
    <div class="hw-storm-risk-cols">
      ${m}
      ${h}
    </div>
  </div>`}var xe={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},at={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function ys(e){var S;let s=xe,t=(S=at[s.phase])!=null?S:"#96a8b8",o=s.phase.charAt(0).toUpperCase()+s.phase.slice(1),n=280,c=52,r=10,i=c-6,a=c-18,l=.5,d=.19,p=y=>Math.exp(-Math.pow((y-l)/d,2)/2),m=y=>r+y*(n-2*r),g=y=>i-p(y)*a,h=80,w=[];for(let y=0;y<=h;y++){let L=y/h;w.push(`${y===0?"M":"L"}${m(L).toFixed(1)},${g(L).toFixed(1)}`)}let v=Math.round(s.progress_0_1*h),f=[];for(let y=0;y<=v;y++){let L=y/h;f.push(`${y===0?"M":"L"}${m(L).toFixed(1)},${g(L).toFixed(1)}`)}let x=m(s.progress_0_1),b=[`M${r},${i}`,...f.slice(1),`L${x.toFixed(1)},${i} Z`],$=g(s.progress_0_1),_=5,M=`M${x.toFixed(1)},${$.toFixed(1)} L${(x-_).toFixed(1)},${($-_*1.8).toFixed(1)} L${(x+_).toFixed(1)},${($-_*1.8).toFixed(1)} Z`,k=i+11;return`<div class="hw-impact-tip${e?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${u(s.cycle_name)}</div>
    <svg width="100%" height="${c+14}" viewBox="0 0 ${n} ${c+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${b.join(" ")}" fill="${t}" opacity="0.12"/>
      <path d="${w.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${f.join(" ")}" fill="none" stroke="${t}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${r}" y1="${i}" x2="${n-r}" y2="${i}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${M}" fill="${t}"/>
      <text x="${r+2}" y="${k}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${m(.5).toFixed(1)}" y="${k}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-r-2).toFixed(1)}" y="${k}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${t}">${u(o)}</b>${s.subtitle?` \xB7 ${u(s.subtitle)}`:""}</div>
  </div>`}function it(e){var a,l,d,p,m;let s=(l=(a=e.coronal_hole)==null?void 0:a.estimated_speed_kms)!=null?l:e.metrics.solar_wind_kms,t=(d=e.coronal_hole)==null?void 0:d.status,o=s!=null?s:0,n=t!=null?t:o>=600?"strong":o>=500?"active":o>=420?"watch":"quiet",c={strong:"#e05c5c",active:"#e0a84a",watch:"#d4cc5c",quiet:"#5cce8c"},r={strong:"Strong",active:"Active",watch:"Watch",quiet:"None"},i={strong:"Strong high-speed stream",active:"High-speed stream active",watch:"Elevated solar wind",quiet:"Background solar wind"};return{status:n,color:c[n],label:r[n],desc:(m=(p=e.coronal_hole)==null?void 0:p.note)!=null?m:i[n],speed:s}}function ks(e,s){var l;let t=it(e),o=(l=t.speed)!=null?l:0,n=t.speed!=null?`${Math.round(t.speed)} km/s`:"\u2014",c=s?" hw-impact-tip-open":"",r=o>=420,i=ye("coronal_hole",{hssState:t,uid:"hss"}),a=r?'<div class="hw-hss-meta" style="font-size:.72em">Elevated speed may indicate Earth-facing coronal hole stream</div>':'<div class="hw-hss-meta" style="font-size:.72em">Background solar wind \xB7 no HSS detected</div>';return`<div class="hw-impact-tip${c}">
    ${i}
    <div class="hw-hss-meta">Solar wind: <b style="color:${t.color}">${u(n)}</b> \xB7 ${u(t.desc)}</div>
    ${a}
  </div>`}function lt(e){var n,c;let s=(n=e.scales.g_scale)!=null?n:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let r=(c=e.metrics.kp_forecast_3h)!=null?c:[],i=Date.now(),a=r.filter(l=>new Date(l.t_utc).getTime()<=i+3*60*60*1e3).sort((l,d)=>new Date(d.t_utc).getTime()-new Date(l.t_utc).getTime());a.length>0&&(o=a[0].kp)}return t>=2||o!=null&&o>=6?{level:2,color:"#e05c5c",label:"High",kp:o,gScale:s}:t>=1||o!=null&&o>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:o,gScale:s}:{level:0,color:"#5cce8c",label:"Low",kp:o,gScale:s}}function _s(e,s){let t=lt(e),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33,desc:"Normal density"},{l:1,label:"Moderate",color:"#d4cc5c",width:64,desc:"Elevated density"},{l:2,label:"High",color:"#e05c5c",width:100,desc:"Strong expansion"}].map(a=>{let l=a.l===t.level,d=l?a.color:"#566068",p=l?"0.88":"0.16";return`<div class="hw-satdrag-rung">
      <span class="hw-satdrag-label" style="color:${d}">${a.label}</span>
      <div class="hw-satdrag-bar-track">
        <div class="hw-satdrag-bar-fill" style="width:${a.width}%;background:${a.color};opacity:${p}"></div>
      </div>
      <span class="hw-satdrag-mark" style="color:${l?a.color:"transparent"}">${l?"\u25C0":""}</span>
    </div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",i={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${o}">
    <div class="hw-satdrag-ladder">${c}</div>
    <div class="hw-satdrag-meta">${r} \xB7 ${u(t.gScale)} \xB7 ${i[t.level]}</div>
  </div>`}function ct(e){var l,d,p;let s=(l=e.scales.g_scale)!=null?l:"G0",t=parseInt(s.slice(1),10),o=e.metrics.kp_latest;if(o==null){let m=(d=e.metrics.kp_forecast_3h)!=null?d:[],g=Date.now(),h=m.filter(w=>new Date(w.t_utc).getTime()<=g+3*60*60*1e3).sort((w,v)=>new Date(v.t_utc).getTime()-new Date(w.t_utc).getTime());h.length>0&&(o=h[0].kp)}let n=0;t>=2||o!=null&&o>=6?n=2:(t>=1||o!=null&&o>=4)&&(n=1);let c=parseInt(((p=e.scales.r_scale)!=null?p:"R0").slice(1),10),r=c>=2&&n<2;c>=2&&(n=Math.min(2,n+1));let i={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:i[n],label:a[n],kp:o,gScale:s,boostedByFlare:r}}function Ss(e,s){var l;let t=ct(e),o=s?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c",width:33},{l:1,label:"Moderate",color:"#d4cc5c",width:64},{l:2,label:"High",color:"#e05c5c",width:100}].map(d=>{let p=d.l===t.level,m=p?d.color:"#566068",g=p?"0.88":"0.16";return`<div class="hw-gnss-rung">
      <span class="hw-gnss-label" style="color:${m}">${d.label}</span>
      <div class="hw-gnss-bar-track">
        <div class="hw-gnss-bar-fill" style="width:${d.width}%;background:${d.color};opacity:${g}"></div>
      </div>
      <span class="hw-gnss-mark" style="color:${p?d.color:"transparent"}">${p?"\u25C0":""}</span>
    </div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",i={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=t.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((l=e.scales.r_scale)!=null?l:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${o}">
    <div class="hw-gnss-ladder">${c}</div>
    <div class="hw-gnss-meta">${r} \xB7 ${u(t.gScale)} \xB7 ${i[t.level]}</div>
    ${a}
  </div>`}function dt(e){var n;let s=e.metrics.pressure_npa,t=s!=null?s:null,o=(n=e.metrics.density)!=null?n:null;return t==null?{pressure:null,color:"#607880",label:"\u2014",density:o}:t>=6?{pressure:t,color:"#e05c5c",label:"Extreme",density:o}:t>=4?{pressure:t,color:"#e0a84a",label:"Strong",density:o}:t>=2?{pressure:t,color:"#d4cc5c",label:"Elevated",density:o}:t>=1?{pressure:t,color:"#5cce8c",label:"Typical",density:o}:{pressure:t,color:"#7a9298",label:"Weak",density:o}}function Ms(e,s){let t=dt(e),o=s?" hw-impact-tip-open":"",n=t.pressure,c=200,r=6,i=10,a=r+i,l=a+4,d=l+11,p=a+9,m=d+4,h=[{x:0,w:50,color:"#5cce8c"},{x:50,w:50,color:"#d4cc5c"},{x:100,w:50,color:"#e0a84a"},{x:150,w:50,color:"#e05c5c"}].map(S=>`<rect x="${S.x}" y="${r}" width="${S.w}" height="${i}" fill="${S.color}" opacity="0.55" rx="0"/>`).join(""),w=[{x:0,label:"0",anchor:"start"},{x:50,label:"2",anchor:"middle"},{x:100,label:"4",anchor:"middle"},{x:150,label:"6",anchor:"middle"},{x:200,label:"8+",anchor:"end"}],v=w.map(S=>`<line x1="${S.x}" y1="${a}" x2="${S.x}" y2="${l}" stroke="#3a5058" stroke-width="1"/>`).join(""),f=w.map(S=>`<text x="${S.x}" y="${d}" class="hw-swdp-axlabel" text-anchor="${S.anchor}">${S.label}</text>`).join(""),x="";if(n!=null){let y=Math.min(Math.max(n,0),8)/8*c;x=`<polygon points="${`${y-5},${p} ${y+5},${p} ${y},${a}`}" fill="${t.color}" opacity="0.95"/>
    <line x1="${y}" y1="${r}" x2="${y}" y2="${a}" stroke="${t.color}" stroke-width="1.5" opacity="0.7"/>`}let b=`<rect x="0" y="${r}" width="${c}" height="${i}" fill="none" stroke="#2a3c42" stroke-width="0.8" rx="0"/>`,$=`<svg class="hw-swdp-gauge" viewBox="0 0 ${c} ${m}" preserveAspectRatio="none" aria-hidden="true">
    ${h}${b}${x}${v}${f}
  </svg>`,_=n!=null?`${n.toFixed(2)} nPa`:"\u2014",M=t.density!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",k=e.metrics.solar_wind_kms!=null?`${Math.round(e.metrics.solar_wind_kms)} km/s`:"\u2014",H=n==null?"":n>=4?" \xB7 Magnetosphere compressed":n>=2?" \xB7 Moderate compression":"";return`<div class="hw-impact-tip${o}">
    ${$}
    <div class="hw-swdp-meta"><b style="color:${t.color}">${u(_)}</b>${u(H)}</div>
    <div class="hw-swdp-meta" style="font-size:.72em">Speed ${u(k)} \xB7 Density ${u(M)}</div>
  </div>`}function pt(e){var l,d;let s=(l=e.alerts_all)!=null?l:[],t=s.find(p=>p.kind==="cme_impact"),o=s.find(p=>p.kind==="cme_watch"),n=t!=null?t:o;if(!n)return{status:"quiet",color:"#5cce8c",label:"None",speed_kms:null,issued_utc:null,arrival_utc:null};let c=((d=n.raw_body)!=null?d:"").match(/Estimated Velocity[:\s]+(\d+)\s*km\/s/i),r=c?parseInt(c[1],10):null,i=null;if(r&&n.t_utc){let p=1496e5/r*1e3;i=new Date(new Date(n.t_utc).getTime()+p).toISOString().replace(".000Z","Z")}let a=t?"impact":"watch";return{status:a,color:a==="impact"?"#e05c5c":"#d4cc5c",label:a==="impact"?"Active":"Watch",speed_kms:r,issued_utc:n.t_utc,arrival_utc:i}}function Cs(e,s){let t=pt(e),o=s?" hw-impact-tip-open":"",n="\u2014";if(t.arrival_utc){let a=new Date(t.arrival_utc),l=a.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),d=a.getUTCDate(),p=String(a.getUTCHours()).padStart(2,"0"),m=String(a.getUTCMinutes()).padStart(2,"0");n=`~${l}\xA0${d}\xA0${p}:${m}\u202FUTC`}let c=t.speed_kms?`${t.speed_kms}\u202Fkm/s`:"\u2014",r=t.status!=="quiet"?`Velocity: <b style="color:#b4c6cc">${u(c)}</b>&ensp;Arrival: <b style="color:#b4c6cc">${u(n)}</b>`:"No Earth-directed CME in forecast window",i=ye("cme_cone",{cmeState:t,uid:"cme"});return`<div class="hw-impact-tip${o}">
    ${i}
    <div class="hw-cme-footer">${r}</div>
  </div>`}function He(e,s,t,o,n,c,r,i,a){let l=c.has(e),d=l?" hw-impact-open":"",p=l?" hw-impact-tip-open":"";return`<div class="hw-impact-row${d}" id="${e}" data-impact-row="${e}">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${n}">${t}<span style="color:#b4c6cc">${u(s)}</span></span>
      <span class="hw-impact-badge" style="background:${n}22;color:${n}">${u(o)}</span>
      <div class="hw-impact-tip${p}">${Yt(r,e,i,a)}</div>
    </div>`}function Hs(e,s){let t=e.find(c=>c.kind==="aurora");if(t)return t;let o=s.aurora_hint;return{kind:"aurora",level:o.aurora_label==="good"?"moderate":o.aurora_label==="possible"?"low":"none",label:"Aurora",summary:o.summary}}function Ls(e,s,t,o){var x,b;let n=(x=Qe[e.level])!=null?x:"#666",c=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),r=(b=Ee[e.kind])!=null?b:st,i=e.level==="none"?"#606870":n,a=s.has("aurora"),l=a?" hw-impact-open":"",d=a?" hw-aurora-tip-open":"",p=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,m=null;t&&o.lat!=null&&o.lon!=null&&(m=Ze(t.entries,o.lat,o.lon));let g=o.lat!=null&&o.lon!=null,h=m!=null?m>=30?"#5cce8c":m>=10?"#d4cc5c":"#9ab4bc":"#607880",w=m!=null?`${m}%`:t?"n/a":"\u2026",v=g?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${o.locationName?u(o.locationName)+" \xB7 ":""}${o.lat.toFixed(1)}\xB0${o.lat>=0?"N":"S"} ${Math.abs(o.lon).toFixed(1)}\xB0${o.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${h}">Aurora: ${w}</span>
    </div>`:"",f=`<div class="hw-aurora-tip${d}">
      <div class="hw-aurora-map-wrap">
        <img class="hw-aurora-img" src="${z(p)}" alt="NOAA Aurora Oval" loading="lazy" />
        ${Je(o)}
      </div>
      ${v}
      <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
    </div>`;return`<div class="hw-impact-row${l}" id="aurora" data-impact-row="aurora">
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${i}">${r}<span style="color:#b4c6cc">${u(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${n}22;color:${n}">${u(c)}</span>
    ${f}
  </div>`}function Xe(e,s,t,o,n,c){var w,v;let r=(w=Qe[e.level])!=null?w:"#666",i=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),a=(v=Ee[e.kind])!=null?v:st,l=e.level==="none"?"#606870":r,d=e.kind==="solar_activity"?t:c,p=d?" hw-impact-open":"",m;if(e.kind==="solar_activity"){let f=t?" hw-solar-open":"",x=tt.map(b=>{let $=o.has(b.id),_=$?b.color+"22":"transparent",M=$?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${b.id}" style="color:${b.color};border-color:${b.color};background:${_};opacity:${M}">${b.label}</button>`}).join("");m=`<div class="hw-solar-tip${f}">
        <div class="hw-solar-disk-wrap" id="solar">
          <img class="hw-solar-disk-img" src="${hs}" alt="Solar disk" loading="lazy" />
          ${s?rs(s,us,o):""}
        </div>
        <div class="hw-solar-layers">${x}</div>
        <span class="hw-solar-tip-text">${u(e.summary)}</span>
      </div>`}else m=gs(n,d);let g=e.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${z(e.kind)}"`,h=e.kind==="radio"?' id="radio"':"";return`<div class="hw-impact-row${p}"${h}${g}>
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${l}">${a}<span style="color:#b4c6cc">${u(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${r}22;color:${r}">${u(i)}</span>
    ${m}
  </div>`}function Es(e,s,t,o,n,c,r,i,a){var Fe,Ie,Oe,Ae;let l=(Ie=(Fe=s==null?void 0:s.impacts)!=null?Fe:e.observer_impacts)!=null?Ie:[],d=Hs(l,e),p=Ls(d,r,i,a),m=l.find(Se=>Se.kind==="radio"),g=l.find(Se=>Se.kind==="solar_activity"),h=m?Xe(m,t,n,c,e,r.has("radio")):"",w=g?Xe(g,t,n,c,e,!1):"",x=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${o?"\u25BC":"\u25B6"}</span>
      <span class="hw-section-label" style="margin-bottom:0">Indicators (${cs})${s?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':""}</span>
    </div>`,{metrics:b}=e,$=b.xray_class,_=$?(Oe=$e[$])!=null?Oe:"#a0b4b8":"#607880",M=$?`${$}-class`:"\u2014",k=b.imf_bz_nt,H=k!=null?k<=-10?"#e05c5c":k<=-5?"#e0a84a":k>=5?"#5cce8c":"#a0b4b8":"#607880",S=k!=null?(k>=0?"+":"")+k.toFixed(1)+" nT":"\u2014",y=b.solar_wind_kms,L=y!=null?`${Math.round(y)} km/s`:"\u2014",T=y!=null?y>700?"#e05c5c":y>500?"#e0a84a":y>400?"#d4cc5c":"#5cce8c":"#607880",Y=He("xray","X-Ray",as,M,_,r,e,a,i),W=He("imf_bz","IMF Bz",is,S,H,r,e,a,i),X=He("solar_wind","Solar Wind",ls,L,T,r,e,a,i),N='<div class="hw-indicators-sep" role="separator" aria-hidden="true"></div>',B=r.has("geomag_storm"),j=nt(e),C=rt(j.now.g_level),F=`G${j.now.g_level}`,O=`<div class="hw-impact-row${B?" hw-impact-open":""}" id="storm_risk" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${C}22;color:${C}">${F}</span>
      ${vs(e,B)}
    </div>`,R=r.has("solar_cycle"),J=(Ae=at[xe.phase])!=null?Ae:"#96a8b8",A=xe.phase.charAt(0).toUpperCase()+xe.phase.slice(1),P=`<div class="hw-impact-row${R?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${J}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${J}22;color:${J}">${A}</span>
      ${ys(R)}
    </div>`,E=it(e),K=r.has("hss"),ee=`<div class="hw-impact-row${K?" hw-impact-open":""}" data-impact-row="hss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${E.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="3.5" cy="6.5" r="2.5"/><line x1="6.2" y1="6.5" x2="11.5" y2="6.5"/><polyline points="9.5,4.5 11.5,6.5 9.5,8.5" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Coronal Hole</span></span>
      <span class="hw-impact-badge" style="background:${E.color}22;color:${E.color}">${E.label}</span>
      ${ks(e,K)}
    </div>`,I=lt(e),D=r.has("sat_drag"),se=`<div class="hw-impact-row${D?" hw-impact-open":""}" id="satellite_drag" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${I.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${I.color}22;color:${I.color}">${I.label}</span>
      ${_s(e,D)}
    </div>`,V=ct(e),ae=r.has("gnss"),_e=`<div class="hw-impact-row${ae?" hw-impact-open":""}" id="gnss" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${V.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${V.color}22;color:${V.color}">${V.label}</span>
      ${Ss(e,ae)}
    </div>`,q=dt(e),de=r.has("sw_pressure"),ne=q.pressure!=null?`${q.pressure.toFixed(2)} nPa`:"\u2014",oe=`<div class="hw-impact-row${de?" hw-impact-open":""}" data-impact-row="sw_pressure">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${q.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 9 Q6.5 3 11 9"/><path d="M4 9 Q6.5 5 9 9"/><line x1="6.5" y1="9" x2="6.5" y2="11"/></svg><span style="color:#b4c6cc">SW Pressure</span></span>
      <span class="hw-impact-badge" style="background:${q.color}22;color:${q.color}">${ne}</span>
      ${Ms(e,de)}
    </div>`,re=pt(e),he=r.has("cme_cone"),Z=`<div class="hw-impact-row${he?" hw-impact-open":""}" data-impact-row="cme_cone">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${re.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="2.5" cy="6.5" r="2" fill="currentColor" stroke="none"/><line x1="5" y1="6.5" x2="12" y2="6.5"/><polyline points="10,4.5 12,6.5 10,8.5" fill="none"/><line x1="4.2" y1="4.2" x2="5.5" y2="5.5" stroke-width="1"/><line x1="4.2" y1="8.8" x2="5.5" y2="7.5" stroke-width="1"/></svg><span style="color:#b4c6cc">CME Cone</span></span>
      <span class="hw-impact-badge" style="background:${re.color}22;color:${re.color}">${u(re.label)}</span>
      ${Cs(e,he)}
    </div>`,ue=ve(e),Re=r.has("magnetosphere"),mt=`<div class="hw-impact-row${Re?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${ue.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Magnetosphere</span></span>
      <span class="hw-impact-badge" style="background:${ue.color}22;color:${ue.color}">${u(ue.label)}</span>
      ${Gt(e,Re)}
    </div>`;return`
    <div class="hw-impacts">
      ${x}
      ${o?[p,O,h,se,_e,Y,w,N,W,mt,X,ee,oe,Z,P].join(""):""}
    </div>`}var Ke={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Rs(e,s){var a,l;let t=(a=yt[e.level])!=null?a:"#666",o=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(l=Ke[e.kind])!=null?l:Ke.unknown,c=[Mt(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),r=s&&e.raw_body?`<div class="hw-alert-body">${u(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${s?" hw-alert-open":""}" style="border-color:${t}" data-alert-key="${z(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${t}">${n}</span>
      <span class="hw-alert-level" style="color:${t}">${u(o)}</span>
      <span class="hw-alert-title">${u(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${u(e.summary_short)}</div>
    <div class="hw-alert-meta">${u(c)}</div>
    ${r}
  </div>`}var Fs={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Is="#4ae0a4";function Os(e){let s=(t,o="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${o}>${t}</svg>`;switch(e){case"solar_flare":return s(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
${t.join(" \xB7 ")}`}function zs(e,s,t){var a;let o=e.is_active?Is:(a=Fs[e.level])!=null?a:"#445c64",n=e.event_time===t,c=e.event_time.slice(11,16)+" UTC",r=e.source==="NASA_DONKI"?"DONKI":"SWPC",i=n?`<div class="hw-tl-detail">${u(e.description)}${u(As(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${z(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${o}"></div>
        ${s?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${c}</span>
          <span class="hw-tl-src">${r}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${Os(e.event_type)} ${u(e.event_title)}
        </div>
        ${i}
      </div>
    </div>`}function Ts(e,s,t,o){var f,x;let n=(f=e.timeline)!=null?f:[],c=Date.now(),r=new Date(c).toISOString().slice(0,10),i=new Date(c-864e5).toISOString().slice(0,10),a=new Date(c-1728e5).toISOString().slice(0,10),l=new Set([r,i,a]),d=n.filter(b=>{var $;return l.has((($=b.event_time)!=null?$:"").slice(0,10))}).slice().reverse(),p=d.length,m=t?"\u25BC":"\u25B6",g=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",h=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!t||p===0)return`<div class="hw-timeline">${h}</div>`;let w=new Map;for(let b of d){let $=((x=b.event_time)!=null?x:"").slice(0,10);w.has($)||w.set($,[]),w.get($).push(b)}let v=[...w.entries()].map(([b,$])=>{let M=new Date(b+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),k=o.has(b),H=k?"\u25B6":"\u25BC",S=k?`<span class="hw-tl-day-count">${$.length} events</span>`:"",y=`
      <div class="hw-tl-day-row" data-tl-day="${z(b)}">
        <span class="hw-section-caret">${H}</span>
        <span class="hw-tl-date">${M}</span>
        ${S}
      </div>`,L=k?"":$.map((T,Y)=>zs(T,Y<$.length-1,s)).join("");return`<div class="hw-tl-group">${y}${L}</div>`}).join("");return`
    <div class="hw-timeline">
      ${h}
      ${v}
    </div>`}function Ns(e,s,t){var l;let o=(l=e.alerts_all)!=null?l:[],n=o.length,c=s?"\u25BC":"\u25B6",r=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",i=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${c}</span>
        <span class="hw-alerts-label">${r}</span>
      </div>
    </div>`;if(!s||n===0)return`<div class="hw-alerts">${i}${s&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=o.map(d=>Rs(d,d.dedupe_key===t)).join("");return`
    <div class="hw-alerts">
      ${i}
      ${a}
    </div>`}function Ps(e,s){var W,X,N;let t=e.cme_tracker;if(!t)return"";let o=(W=kt[t.impact_level])!=null?W:"#96a8b8",n=(X=_t[t.status])!=null?X:t.status,c=300,r=44,i=18,a=r/2,l=10,d=c-18,p=7,m=`<line x1="${i+l}" y1="${a}" x2="${d-p}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${i}" cy="${a}" r="${l}" fill="#f0c040" opacity="0.92"/>`,h=`
    <circle cx="${d}" cy="${a}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,w=`<text x="${i}" y="${a+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,v=`<text x="${d}" y="${a+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,f="";if(t.progress!=null){let B=i+l+4,j=d-p-4,C=B+t.progress*(j-B),F=5;t.status==="arrival_window"?f=`
        <g transform="translate(${C.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${F}" fill="${o}" opacity="0.92"/>
        </g>`:f=`<circle cx="${C.toFixed(1)}" cy="${a}" r="${F}" fill="${o}" opacity="0.85"/>`}let x=`<svg class="hw-cme-svg" viewBox="0 0 ${c} ${r}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${m}
    ${g}${w}
    ${h}${v}
    ${f}
  </svg>`,b=Ge(t.arrival_time_utc),$=Ge(t.launch_time_utc),_=t.speed_kms!=null?`${Math.round(t.speed_kms)} km/s`:"\u2014",M=t.half_angle_deg!=null?`${t.half_angle_deg}\xB0`:"\u2014",k=(N=t.source_location)!=null?N:"\u2014",H=t.is_earth_direct?"Direct hit":"Glancing blow",S=t.progress!=null?`${Math.round(t.progress*100)}%`:"\u2014",y=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${u(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${o}">${u(_)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${o}">${u(t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${u(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${u($)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${u(S)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${u(M)} \xB7 Source: ${u(k)} \xB7 ${u(H)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,L=s?"\u25BC":"\u25B6",T=t.impact_level==="unknown"?"Unrated":t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1),Y=s?`${x}${y}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${L}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${o}22;color:${o};margin-left:auto">${u(n)}</span>
        <span class="hw-cme-badge" style="background:${o}15;color:${o};margin-left:4px">${u(T)} impact</span>
      </div>
      ${Y}
    </div>`}function Bs(e,s,t,o,n,c,r,i,a,l,d,p,m,g,h,w,v,f){var H;let x=ts(e,o),b=(H=e.metrics.kp_history_1h)!=null?H:[],$=b.length?we(b[b.length-1].t_utc):null,_=$?`Recent history \xB7 Last step ${$}`:"Recent history",M=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${z(_)}</span>
  </div></div>`,k=t?qt(e):"";return`
    <div class="hw-root">
      ${Qt(e)}
      ${Kt(e,t,x,v,f)}
      ${Es(e,x,m,l,g,h,w,f,v)}
      ${M}
      ${k}
      ${ss(e,o,x,p)}
      ${Ps(e,d)}
      ${Ts(e,r,i,a)}
      ${Ns(e,n,c)}
    </div>`}function Gs(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${u(e)}</div>
    </div>
  </div>`}function Ds(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var qe="nc-helio-ui",Le=class{constructor(s,t){this.expanded=!1;this.heroExpanded=!1;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=s,this.opts=t,this.loadUiState(),this.el.innerHTML=Ds(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}expandHeroLinkedPanels(s){for(let t of s)switch(t){case"storm_risk":this.expandedImpacts.add("geomag_storm");break;case"radio":this.expandedImpacts.add("radio");break;case"satellite_drag":this.expandedImpacts.add("sat_drag");break;case"gnss":this.expandedImpacts.add("gnss");break;case"aurora":this.expandedImpacts.add("aurora");break;case"xray":this.expandedImpacts.add("xray");break;case"solar":this.solarExpanded=!0;break;default:Ve()&&console.warn(`[Helio] Hero chip nav: unknown section id "${t}"`)}}collapseHeroLinkedPanels(s){for(let t of s)switch(t){case"storm_risk":this.expandedImpacts.delete("geomag_storm");break;case"radio":this.expandedImpacts.delete("radio");break;case"satellite_drag":this.expandedImpacts.delete("sat_drag");break;case"gnss":this.expandedImpacts.delete("gnss");break;case"aurora":this.expandedImpacts.delete("aurora");break;case"xray":this.expandedImpacts.delete("xray");break;case"solar":this.solarExpanded=!1;break;default:break}}heroDomIdExpanded(s){switch(s){case"storm_risk":return this.expandedImpacts.has("geomag_storm");case"radio":return this.expandedImpacts.has("radio");case"satellite_drag":return this.expandedImpacts.has("sat_drag");case"gnss":return this.expandedImpacts.has("gnss");case"aurora":return this.expandedImpacts.has("aurora");case"xray":return this.expandedImpacts.has("xray");case"solar":return this.solarExpanded;default:return!1}}heroChipLinkedAllOpen(s){if(!this.impactsOpen)return!1;for(let t of De[s])if(!this.heroDomIdExpanded(t))return!1;return!0}onClick(s){var l,d,p,m,g;let t=s.target,o=t.closest("[data-hero-chip]");if(o){let h=o.dataset.heroChip;if(h==="G"||h==="R"||h==="S"||h==="X"){let w=De[h];if(this.heroChipLinkedAllOpen(h)){this.collapseHeroLinkedPanels(w),this.saveUiState(),this.render();return}this.impactsOpen=!0,this.expandHeroLinkedPanels(w),this.saveUiState(),this.render(),requestAnimationFrame(()=>requestAnimationFrame(()=>Ht(w)))}return}if(t.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(t.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(t.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}let n=t.closest("[data-impact-row]");if(n){let h=(l=n.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(h)?this.expandedImpacts.delete(h):this.expandedImpacts.add(h),this.saveUiState(),this.render();return}let c=t.closest("[data-solar-layer]");if(c){let h=(d=c.dataset.solarLayer)!=null?d:"";this.solarLayers.has(h)?this.solarLayers.delete(h):this.solarLayers.add(h),this.saveUiState(),this.render();return}if(t.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let r=t.closest("[data-alert-key]");if(r){let h=(p=r.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===h?null:h,this.render();return}if(t.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let h=Date.now();this.collapsedDays=new Set([new Date(h).toISOString().slice(0,10),new Date(h-864e5).toISOString().slice(0,10),new Date(h-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let i=t.closest("[data-tl-day]");if(i){let h=(m=i.dataset.tlDay)!=null?m:"";this.collapsedDays.has(h)?this.collapsedDays.delete(h):this.collapsedDays.add(h),this.saveUiState(),this.render();return}let a=t.closest("[data-timeline-key]");if(a){let h=(g=a.dataset.timelineKey)!=null?g:null;this.expandedTimelineKey=this.expandedTimelineKey===h?null:h,this.render();return}if(t.closest(".hw-kpi-close")){let h=t.closest("[data-impact-row]"),w=h==null?void 0:h.dataset.impactRow;w&&this.expandedImpacts.delete(w),this.saveUiState(),this.render();return}if(t.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}t.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(s){let t=s.target;if(!t.matches("[data-scrub]"))return;let o=parseFloat(t.value);this.scrubOffset=o,t.style.setProperty("--pct",`${(o/parseFloat(t.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(s){s.target.matches("[data-scrub]")&&this.render()}async fetch(){var s;try{let t=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!t.ok)throw new Error(`HTTP ${t.status}`);this.data=await t.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(t){let o=t instanceof Error?t.message:String(t);this.el.innerHTML=Gs(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(s=this.opts.refreshMs)!=null?s:6e5)}}async fetchSolarRegions(){try{let s=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!s.ok)return;let t=await s.json(),o=new Map;for(let n of t){let c=o.get(n.region),r=n.area!=null,i=(c==null?void 0:c.area)!=null;(!c||!i&&r||i===r&&n.observed_date>c.observed_date)&&o.set(n.region,n)}this.solarRegions=[...o.values()],this.render()}catch(s){}}async fetchOvationData(){var s,t,o,n,c,r;if(!(this.opts.lat==null||this.opts.lon==null))try{let i=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!i.ok)return;let a=await i.json(),d=((o=(t=(s=a.coordinates)!=null?s:a.Data)!=null?t:a.data)!=null?o:[]).map(([p,m,g])=>({lon:p,lat:m,prob:g}));this.ovationData={entries:d,forecastTime:String((r=(c=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?c:a["Observation Time"])!=null?r:"")},this.render()}catch(i){}}render(){this.data&&(this.el.innerHTML=Bs(this.data,this.expanded,this.heroExpanded,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}saveUiState(){try{localStorage.setItem(qe,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],expandedImpacts:[...this.expandedImpacts]}))}catch(s){}}loadUiState(){try{let s=localStorage.getItem(qe);if(!s)return;let t=JSON.parse(s);typeof t.expanded=="boolean"&&(this.expanded=t.expanded),typeof t.heroExpanded=="boolean"&&(this.heroExpanded=t.heroExpanded),typeof t.alertsExpanded=="boolean"&&(this.alertsExpanded=t.alertsExpanded),typeof t.timelineOpen=="boolean"&&(this.timelineOpen=t.timelineOpen),typeof t.impactsOpen=="boolean"&&(this.impactsOpen=t.impactsOpen),typeof t.cmeExpanded=="boolean"&&(this.cmeExpanded=t.cmeExpanded),typeof t.forecastOpen=="boolean"&&(this.forecastOpen=t.forecastOpen),typeof t.solarExpanded=="boolean"&&(this.solarExpanded=t.solarExpanded),Array.isArray(t.collapsedDays)&&(this.collapsedDays=new Set(t.collapsedDays)),Array.isArray(t.solarLayers)&&(this.solarLayers=new Set(t.solarLayers)),Array.isArray(t.expandedImpacts)&&(this.expandedImpacts=new Set(t.expandedImpacts))}catch(s){}}updateLocation(s,t,o){this.opts=Be(Pe({},this.opts),{lat:s,lon:t,locationName:o}),this.render()}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},ht={mount(e,s){return Ft(),new Le(e,s)}};typeof window!="undefined"&&(window.HelioWidget=ht);return vt(Ys);})();
