"use strict";var HelioWidgetModule=(()=>{var de=Object.defineProperty,lt=Object.defineProperties,dt=Object.getOwnPropertyDescriptor,pt=Object.getOwnPropertyDescriptors,ht=Object.getOwnPropertyNames,He=Object.getOwnPropertySymbols;var Ee=Object.prototype.hasOwnProperty,mt=Object.prototype.propertyIsEnumerable;var Le=(e,o,t)=>o in e?de(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t,pe=(e,o)=>{for(var t in o||(o={}))Ee.call(o,t)&&Le(e,t,o[t]);if(He)for(var t of He(o))mt.call(o,t)&&Le(e,t,o[t]);return e},he=(e,o)=>lt(e,pt(o));var gt=(e,o)=>{for(var t in o)de(e,t,{get:o[t],enumerable:!0})},ut=(e,o,t,s)=>{if(o&&typeof o=="object"||typeof o=="function")for(let n of ht(o))!Ee.call(e,n)&&n!==t&&de(e,n,{get:()=>o[n],enumerable:!(s=dt(o,n))||s.enumerable});return e};var wt=e=>ut(de({},"__esModule",{value:!0}),e);var Po={};gt(Po,{HelioWidget:()=>it});var ue={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},je={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},xt={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},fe={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},ft={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},$t={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function bt(e){if(!e)return"Update time unavailable";try{let o=Math.round((Date.now()-new Date(e).getTime())/6e4);if(o<1)return"Updated just now";if(o<60)return`Updated ${o} min ago`;let t=Math.floor(o/60);return t<24?`Updated ${t}h ago`:`Updated ${Math.floor(t/24)}d ago`}catch(o){return"Updated recently"}}function vt(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(o){return e}}function me(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(o){return e}}function we(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(o){return e.slice(11,16)}}function Fe(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(o){return e}}function F(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function w(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var Ie={G:["magnetosphere"],R:["radio"],S:["satellite_drag","gnss"],X:["xray","solar"]},yt=2400;function We(){var e,o;try{let t=(o=(e=globalThis.location)==null?void 0:e.hostname)!=null?o:"";return t==="localhost"||t==="127.0.0.1"||t.endsWith(".local")}catch(t){return!1}}function kt(e){let o=[],t=null;for(let s of e){let n=document.getElementById(s);n instanceof HTMLElement?(t||(t=n),o.push(n)):We()&&console.warn(`[Helio] Hero chip nav: missing element #${s}`)}t&&t.scrollIntoView({behavior:"smooth",block:"start"});for(let s of o)s.classList.add("section-flash"),window.setTimeout(()=>s.classList.remove("section-flash"),yt)}function Ae(e){let o=e.trim();return o.toUpperCase().startsWith("X:")?o.slice(2).trim()||"\u2014":o||"\u2014"}function ye(e,o){let t=e.trim().toUpperCase();if(t.length<2||t[0]!==o)return 0;let s=parseInt(t.slice(1),10);return!isFinite(s)||s<0?0:Math.min(5,s)}function ke(e){return e<=0?{color:"#96a8b8",background:"#1e2830",borderColor:"#2a3c42"}:e===1?{color:"#d4cc5c",background:"#2a2616",borderColor:"#5a5028"}:e===2?{color:"#e0a84a",background:"#2c2214",borderColor:"#6a5018"}:e===3?{color:"#e8a060",background:"#301810",borderColor:"#744018"}:e===4?{color:"#e07058",background:"#2c1412",borderColor:"#762820"}:{color:"#e05c5c",background:"#2e1214",borderColor:"#7a2828"}}function _t(e){var c,r,i;let o=e.trim().toUpperCase();if(o==="\u2014"||o===""||o==="-")return{color:"#607880",background:"#1e2830",borderColor:"#2a3c42"};let t=(c=fe[o])!=null?c:"#a0b4b8",s={A:"#242628",B:"#15221c",C:"#1a2215",M:"#221a10",X:"#281416"},n={A:"#404448",B:"#2a5a40",C:"#3e6a30",M:"#6a5018",X:"#7a2828"};return{color:t,background:(r=s[o])!=null?r:"#1e2830",borderColor:(i=n[o])!=null?i:"#3a4c52"}}function St(e,o){var c,r,i,a,l,d;let t=e.metrics.xray_class!=null?String(e.metrics.xray_class):"\u2014",s={g:(c=o==null?void 0:o.gScale)!=null?c:e.scales.g_scale,r:e.scales.r_scale,s:e.scales.s_scale,x:Ae(t)},n=(r=e.hero)==null?void 0:r.scales;return n?{g:(i=n.g)!=null?i:s.g,r:(a=n.r)!=null?a:s.r,s:(l=n.s)!=null?l:s.s,x:Ae((d=n.x)!=null?d:s.x)}:s}var Mt=`
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
/* Space Weather Chain panel */
.hw-chain{padding:10px 12px 8px;border-top:1px solid #1a2b30}
.hw-chain-title{font-size:.62em;letter-spacing:.09em;color:#4a6068;text-transform:uppercase;font-weight:600;margin-bottom:8px}
.hw-chain-cols{display:flex;align-items:flex-start}
.hw-chain-col{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:4px 2px;min-width:0}
.hw-chain-arrow{display:flex;align-items:center;color:#253540;font-size:.8em;padding:0 2px;margin-top:18px;flex-shrink:0}
.hw-chain-head{font-size:.58em;letter-spacing:.07em;text-transform:uppercase;color:#4a6068;font-weight:600;margin-bottom:4px}
.hw-chain-alarm{display:block;width:100%;max-width:72px;height:auto;margin:0 auto 5px;border-radius:3px}
.hw-chain-state{font-size:.82em;font-weight:700;line-height:1.1;margin-bottom:4px}
.hw-chain-msgs{font-size:.67em;color:#7a9298;line-height:1.45}
.hw-chain-msg{display:block}
.hw-chain-col-earth{cursor:pointer;border-radius:4px;transition:background .15s}.hw-chain-col-earth:hover{background:#1e2c3044}
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
`,Re=!1;function Ct(){if(Re)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=Mt,document.head.appendChild(e),Re=!0}function Ht(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let o=200,t=32,s=e.length,n=o/s,c=e.map((r,i)=>{let a=Math.max(2,Math.min(t,r.kp/9*t)),l=t-a,d=i*n,p=r.kp>=6?"#e05c5c":r.kp>=5?"#e0a84a":r.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${l.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${a.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${r.kp.toFixed(1)} \xB7 ${w(we(r.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${o} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">${c}</svg>`}function Oe(e,o,t,s,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let c=200,r=Math.min(...e),i=Math.max(...e),a=i-r||1,l=m=>s-2-(m-r)/a*(s-4),d=e.map((m,h)=>`${(h/(e.length-1)*c).toFixed(1)},${l(m).toFixed(1)}`).join(" "),p="";if(n&&r<0&&i>0){let m=l(0);p=`<line x1="0" y1="${m.toFixed(1)}" x2="${c}" y2="${m.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let g=e.map((m,h)=>`<rect x="${(h/(e.length-1)*c-4).toFixed(1)}" y="0" width="8" height="${s}" fill="transparent"><title>${w(o[h]||"")} \xB7 ${m.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${c} ${s}" style="width:100%;height:${s}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${t}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${g}
  </svg>`}function Lt(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let o=200,t=32,s=e.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),n=Math.min(...s),r=Math.max(...s)-n||1,i=d=>t-2-(d-n)/r*(t-4),a=s.map((d,p)=>`${(p/(s.length-1)*o).toFixed(1)},${i(d).toFixed(1)}`).join(" "),l=e.map((d,p)=>{let g=p/(s.length-1)*o,m=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(g-4).toFixed(1)}" y="0" width="8" height="${t}" fill="transparent"><title>${w(we(d.t_utc))} \xB7 ${m}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${o} ${t}" style="width:100%;height:${t}px;display:block" preserveAspectRatio="none">
    <polyline points="${a}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function ce(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Et(e){var l;let o=(l=e.metrics.wind_history_1h)!=null?l:[],t=o[o.length-1],s=e.metrics.solar_wind_kms,n=s!=null?`${Math.round(s)} km/s`:"\u2014",c=s!=null?s>=700?"#e05c5c":s>=500?"#e0a84a":s>=400?"#d4cc5c":"#5cce8c":"#607880",r=(t==null?void 0:t.density)!=null?`${t.density.toFixed(2)} cm\u207B\xB3`:"\u2014",i=(t==null?void 0:t.temp_kk)!=null?`${t.temp_kk.toFixed(0)} kK`:"\u2014",a=(t==null?void 0:t.pressure_npa)!=null?`${t.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${ce("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${c}">${w(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${w(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${w(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${w(a)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Ft(e){var i,a;let o=(i=e.metrics.xray_class)!=null?i:"A",t=e.metrics.xray_flux_wm2,s=t!=null?t.toExponential(2)+" W/m\xB2":"\u2014",n=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],c=n.map(l=>{let d=l.label===o,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${d?"cc":"44"}">${p}</div>`}).join(""),r=n.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===o?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${ce("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${c}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(a=fe[o])!=null?a:"#a0b4b8"}">${w(o)}-class</b> \xB7 ${w(s)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function It(e){let a='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(C=>{let _=100+C/20*100;return`<line x1="${_.toFixed(1)}" y1="16" x2="${_.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(e==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${a}${l}${d}</svg>`;let p=e<=-10?"#e05c5c":e<=-5?"#e0a84a":e<0?"#d4b84a":e>=5?"#5cce8c":"#7acca8",g=Math.max(-20,Math.min(20,e)),m=100+g/20*100,h=3,x=g<0?m-h:100-h,v=Math.max(2*h,Math.abs(m-100)+2*h),$=`<rect x="${x.toFixed(1)}" y="16" width="${v.toFixed(1)}" height="6" rx="${h}" fill="${p}" opacity="0.82"/>`,u=5,f=15,b=f-u*1.1,y=`<polygon points="${m.toFixed(1)},${f.toFixed(1)} ${(m-u).toFixed(1)},${b.toFixed(1)} ${(m+u).toFixed(1)},${b.toFixed(1)}" fill="${p}"/>`,S=`<line x1="${m.toFixed(1)}" y1="${f.toFixed(1)}" x2="${m.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,M=`<text x="${m.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${e>=0?"+":""}${e.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${a}${l}${d}${$}${y}${S}${M}
  </svg>`}function At(e){let o=e.metrics.imf_bz_nt,t=e.metrics.imf_bt_nt,s=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",n=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",c=t!=null?t.toFixed(1)+" nT":"\u2014",r=Me(e),i=o!=null&&o<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:o!=null&&o<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${ce("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${It(o)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${s}">${w(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${w(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${r.color};font-weight:600">${w(r.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${i.color};font-weight:600;margin-bottom:0">${w(i.msg)}</div>
  </div>`}function Me(e){var a,l;let o=e.metrics.imf_bz_nt,t=(a=e.metrics.kp_latest)!=null?a:0,s=(l=e.metrics.solar_wind_kms)!=null?l:0,n,c,r;if(o!=null&&o<-5||t>=6)n="storm",c="#e05c5c",r="Storm conditions";else if(o!=null&&o<0||t>=4||s>=400){let d=o!=null&&o<0;n="active",c="#e0a84a",r=d?"Active coupling":"Elevated"}else n="stable",c="#5cce8c",r="Stable";let i;return o==null?i="Unknown":o>2?i="Closed":o>0?i="Minimal":o>-5?i="Moderate":o>-10?i="Strong":i="Very strong",{state:n,color:c,label:r,coupling:i}}function Rt(e,o,t,s){let n=s?"mc":"mf",c=e.color,r=t!=null?t:0,i=r>500,a=r<350,l=i?.9:a?1.8:1.3;if(s){let h=45-(e.state==="storm"?11:e.state==="active"?16:21),x=e.state==="storm"?12:e.state==="active"?10:8,v=50-x,$=76,u=[`M ${h},25`,`C ${h-2},15 41,${x} 45,${x}`,`C 53,${x} ${$-8},${x+4} ${$},20`,`C ${$+1},23 ${$+1},27 ${$},30`,`C ${$-8},${v-4} 53,${v} 45,${v}`,`C 41,${v} ${h-2},35 ${h},25`,"Z"].join(" "),f=i?3:2,b=[14,25,36],y=C=>`<path d="M 0,${C} L ${i?8:6},${C} M ${i?6:4},${C-2} L ${i?8:6},${C} L ${i?6:4},${C+2}" stroke="${c}bb" stroke-width="${i?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,S=b.map(C=>y(C)).join(""),k=Array.from({length:f},(C,_)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/f*_).toFixed(2)}s">${S}</g>`).join(""),M=o==null?"":o>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${k}</g>
      <path d="${u}" fill="${c}14" stroke="${c}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${M}
    </svg>`}else{let $=e.state==="storm"?16:e.state==="active"?26:38,u=155-$,f=e.state==="storm"?22:e.state==="active"?30:40,b=120-f,y=240,S=[`M ${u},60`,`C ${u-4},42 150,${f} 155,${f}`,`C 173,${f} ${y-5},${f+18} ${y},60`,`C ${y-5},${b-18} 173,${b} 155,${b}`,`C 150,${b} ${u-4},78 ${u},60`,"Z"].join(" "),k=`M ${u+2},60 C ${u+2},${60-$*.4} 152,54 150,60 C 152,66 ${u+2},${60+$*.4} ${u+2},60 Z`,M=r>700?"#e05c5c":r>500?"#e0a84a":r>350?"#d4c840":"#5cce8c",C=r>700?.4:r>500?.65:r>350?1.1:1.8,_=r>500?[10,24,40,57,74,90,106]:r>350?[14,34,57,82,104]:[20,50,82,108],L=16,A=22,N=u-6,P=Math.ceil((N-A)/L)+2,X=Array.from({length:P},(T,I)=>A-L+I*L),B=12,G=8,W=X.flatMap(T=>_.map(I=>`<path d="M ${T},${I} L ${T+B},${I} M ${T+G},${I-3} L ${T+B},${I} L ${T+G},${I+3}" stroke="${M}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),H=`<g class="hw-wg-full" style="animation-duration:${C}s">${W}</g>`,R=o==null?"":o>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',q=o==null?"":`<text x="163" y="62" font-size="6" fill="${o>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${o>0?"\u2191":"\u2193"}</text>`;return Ue("magnetosphere",{magnetInfo:e,bz:o,windKms:t,uid:n})}}function Ue(e,o={}){var H,R,q,T,I,Z;let c=(H=o.uid)!=null?H:"hse",r=0,i=160,a=800,l=17,d=a-l,p=o.magnetInfo,g=(R=p==null?void 0:p.state)!=null?R:"stable",m=(q=p==null?void 0:p.color)!=null?q:"#e0a84a",x=a-(g==="storm"?55:g==="active"?80:110),v=g==="storm"?58:g==="active"?76:95,$=1120,u=20,f=[`M ${x},130`,`C ${x-8},${130-v*.55} ${a-18},${130-v} ${a},${130-v}`,`C ${a+120},${130-v} ${$-180},${130-u} ${$},${130-u}`,`L ${$},${130+u}`,`C ${$-180},${130+u} ${a+120},${130+v} ${a},${130+v}`,`C ${a-18},${130+v} ${x-8},${130+v*.55} ${x},130`,"Z"].join(" "),b=e==="magnetosphere",y=b?g==="storm"?"0.12":"0.08":"0.04",S=b?"0.75":"0.28",k=`<g id="${c}-base-sun">
    <circle cx="${r}" cy="130" r="${i+18}" fill="none"
            stroke="#f0c040" stroke-width="2.5" opacity="0.12"/>
    <circle cx="${r}" cy="130" r="${i}" fill="#f0c040" opacity="0.88"/>
  </g>`,M=`
    <ellipse cx="${a}" cy="130" rx="${l}" ry="${(l*.42).toFixed(1)}"
             fill="none" stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${a}" y1="${130-l}" x2="${a}" y2="${130+l}"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.6"/>
    <line x1="${d}" y1="130" x2="${a+l}" y2="130"
          stroke="#4a8ab0" stroke-width="1.2" opacity="0.35"/>`,C=`<g id="${c}-base-earth">
    <circle cx="${a}" cy="130" r="${l}" fill="#1a4a6e" opacity="0.92"/>
    ${M}
  </g>`,_=`<g id="${c}-base-magnetosphere">
    <path d="${f}" fill="${m}" fill-opacity="${y}"
          stroke="${m}" stroke-opacity="${S}" stroke-width="1.8"/>
    ${p?`<text x="${x+5}" y="${130-v-7}" font-size="12" fill="${m}"
          opacity="0.85" font-family="sans-serif">${p.label}</text>`:""}
  </g>`,L=`<g id="${c}-base-axis">
    <line x1="${i}" y1="130" x2="${x}" y2="130"
          stroke="rgba(255,255,255,0.10)" stroke-width="1.5" stroke-dasharray="8 5"/>
  </g>`,A="";if(e==="magnetosphere"){let z=(T=o.windKms)!=null?T:0,Y=z>500,D=z<350,E=(Y?.5:D?1.4:.9)*1.3,K=z>700?"#e05c5c":z>500?"#e0a84a":z>350?"#d4c840":"#5cce8c",ee=i+8,J=x-14,O=8,j=6,U=(J-ee)/(O-1),te=260/(j+1),Q=38,ie=24,$e=2,be=Array.from({length:O},(se,re)=>{let V=ee+re*U,at=Array.from({length:j},(ct,ve)=>{let ne=te*(ve+1);return`<path d="M ${V.toFixed(1)},${ne.toFixed(1)} L ${(V+Q).toFixed(1)},${ne.toFixed(1)} M ${(V+ie).toFixed(1)},${(ne-6).toFixed(1)} L ${(V+Q).toFixed(1)},${ne.toFixed(1)} L ${(V+ie).toFixed(1)},${(ne+6).toFixed(1)}"
          stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`}).join("");return Array.from({length:$e},(ct,ve)=>{let ne=-((O-re)/O*E)-ve*E/$e;return`<g style="opacity:.12;animation:hw-arrow-chase ${E}s linear ${ne.toFixed(3)}s infinite">${at}</g>`}).join("")}).join(""),oe=(I=o.bz)!=null?I:null,le=oe==null?"":(()=>{let se=oe>0?"#5cce8c":"#e05c5c";return`${oe>0?`<path d="M ${a},137 L ${a},123 M ${a-3},126 L ${a},123 L ${a+3},126"
           stroke="${se}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M ${a},123 L ${a},137 M ${a-3},134 L ${a},137 L ${a+3},134"
           stroke="${se}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}<text x="${a+22}" y="135" font-size="13"
        fill="${se}" font-family="monospace">Bz${oe>0?"\u2191":"\u2193"}</text>`})();A=`${be}${le}`}let N=`<g id="${c}-overlay-solar-wind">${A}</g>`,P="";if(e==="coronal_hole"&&o.hssState){let z=o.hssState,Y=(Z=z.speed)!=null?Z:0,D=Y>=420,E=z.color,K=D?"0.85":"0.25",ee=Y>=500?"0.18":D?"0.10":"0.04",J=i+8,O=d-16,j=60,U=`${J},130 ${O},${130-j} ${O},${130+j}`,te=O+6,Q=`${te},120 ${te+18},130 ${te},140`;P=`
    <polygon points="${U}" fill="${E}" opacity="${ee}"/>
    <line x1="${J}" y1="130" x2="${O-5}" y2="130"
          stroke="${E}" stroke-width="3.5" stroke-dasharray="10 6"
          stroke-linecap="round" opacity="${K}"/>
    <polygon points="${Q}" fill="${E}" opacity="${D?"0.9":"0.25"}"/>`}let X=`<g id="${c}-overlay-coronal-hole">${P}</g>`,B="";if(e==="cme_cone"&&o.cmeState){let z=o.cmeState,Y=i,D=d-10,E=D-Y,K=U=>Math.tan(U*Math.PI/180),ee=Math.round(K(9)*E),J=Math.round(K(6)*E),O=Math.round(K(3)*E),j=U=>`${Y},130 ${D},${130-U} ${D},${130+U}`;if(z.status!=="quiet"){let U=z.status==="impact"?"#e05c5c":"#d4cc5c";B=`
    <polygon points="${j(ee)}" fill="#253238" opacity="0.85"/>
    <polygon points="${j(J)}"   fill="#d4cc5c" opacity="0.14"/>
    <polygon points="${j(O)}" fill="#e0a84a" opacity="0.28"/>
    <line x1="${Y+14}" y1="130" x2="${D-5}" y2="130"
          stroke="#3a5058" stroke-dasharray="6 5" stroke-width="2"/>
    <circle cx="${a}" cy="130" r="${l+8}" fill="none"
            stroke="${U}" stroke-width="7" opacity="0.16"/>`}else B=`
    <line x1="${Y+14}" y1="130" x2="${d-14}" y2="130"
          stroke="#1e2c30" stroke-dasharray="7 5" stroke-width="2"/>`}let G=`<g id="${c}-overlay-cme-cone">${B}</g>`,W=`<g id="${c}-overlay-labels">
    <text x="18" y="250" font-size="13" fill="#f0c04055"
          font-family="sans-serif">Sun</text>
    <text x="${a}" y="252" font-size="13" fill="#4a709055"
          text-anchor="middle" font-family="sans-serif">Earth</text>
  </g>`;return`<svg class="hw-solar-earth-scene" viewBox="0 0 1000 260"
      style="width:100%;height:80px;display:block" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="260" fill="#0a1014"/>
    ${L}
    ${N}
    ${X}
    ${G}
    ${k}
    ${_}
    ${C}
    ${W}
  </svg>`}function Ot(e){let o=Me(e),t=e.metrics.imf_bz_nt,s=e.metrics.solar_wind_kms,n=t!=null&&t<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":t!=null&&t<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${ce("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${Rt(o,t,s,!1)}</div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${w(n)}</div>
  </div>`}function Tt(e,o,t){if(!o)return"";let s=e.metrics.imf_bz_nt,n=e.metrics.solar_wind_kms,c=s!=null&&s<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":s!=null&&s<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-impact-tip hw-impact-tip-open">
    <div style="border-radius:3px;overflow:hidden;margin-bottom:2px">${Ue("magnetosphere",{windKms:n!=null?n:void 0,bz:s!=null?s:void 0})}</div>
    ${vo(e,t)}
    <div class="hw-kpi-hint" style="margin-top:6px;margin-bottom:0">${w(c)}</div>
  </div>`}function Xe(e,o,t){if(!e.length)return null;let s=(t%360+360)%360,n=-1,c=1/0,r=Math.cos(o*Math.PI/180);for(let i of e){let a=i.lat-o,l=(i.lon-s+180+360)%360-180,d=a*a+l*r*(l*r);d<c&&(c=d,n=i.prob)}return n>=0?n:null}function Ke(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function zt(e,o){let t=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,s=null;o&&e.lat!=null&&e.lon!=null&&(s=Xe(o.entries,e.lat,e.lon));let n=e.lat!=null&&e.lon!=null,c=s!=null?s>=30?"#5cce8c":s>=10?"#d4cc5c":"#9ab4bc":"#607880",r=s!=null?`${s}%`:o?"n/a":"\u2026",i=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?w(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${c}">Aurora: ${r}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${ce("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${F(t)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Ke(e)}
    </div>
    ${i}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Nt(e,o,t,s){switch(o){case"solar_wind":return Et(e);case"xray":return Ft(e);case"imf_bz":return At(e);case"aurora":return zt(t,s);case"magnetosphere":return Ot(e);default:return""}}function Pt(e,o){if(e.length<2)return"\u2192";let t=e[e.length-1],s=Math.max(0,e.length-4),n=e[s];if(!isFinite(t)||!isFinite(n))return"\u2192";let c=t-n;return c>o?"\u2191":c<-o?"\u2193":"\u2192"}var Bt={quiet:"171",active:"195",elevated:"284",storm:"304"};function Dt(e,o){var s,n,c;if(o==null)return(n=(s=e.summary)==null?void 0:s.status)!=null?n:"quiet";let t=parseInt(((c=o.gScale)!=null?c:"G0").replace(/\D/g,""),10)||0;return t>=3?"storm":t>=1?"elevated":o.kp>=4?"active":"quiet"}function Gt(e,o){var l,d;let t=(l=Bt[e])!=null?l:"171",s=`/assets/gifs/current_eit_${t}.gif`,n=Je(s,o),c=io,r=(d=ue[e])!=null?d:ue.quiet,i=`${r.accent}44`,a=`0 0 10px ${r.accent}55,0 0 24px ${r.accent}22`;return`<div class="hw-solar-mini-wrap" style="cursor:default">
    <div class="hw-solar-mini-inner" style="border-color:${i};box-shadow:${a}">
      <img class="hw-solar-mini-img" src="${F(n)}" alt="Sun EIT ${F(t)}"
        onerror="if(this.src!=='${F(c)}')this.src='${F(c)}'" />
    </div>
  </div>`}function Yt(e,o,t,s,n){var f,b,y;let{summary:c,metrics:r}=e,i=(f=ue[c.status])!=null?f:ue.quiet,a=t!=null?t.kp.toFixed(1):r.kp_latest!=null?r.kp_latest.toFixed(1):"\u2014",l=St(e,t),p=[{key:"G",text:l.g,title:"Geomagnetic storm level. Based on Kp index.",aria:"Geomagnetic storm level"},{key:"R",text:l.r,title:"Radio blackout level. Based on solar X-ray flux.",aria:"Radio blackout level"},{key:"S",text:l.s,title:"Solar radiation storm level. Based on energetic proton flux.",aria:"Solar radiation storm level"},{key:"X",text:`X:${l.x}`,title:"Current solar X-ray activity class.",aria:"Solar X-ray activity"}].map(S=>{let k;return S.key==="G"?k=ke(ye(l.g,"G")):S.key==="R"?k=ke(ye(l.r,"R")):S.key==="S"?k=ke(ye(l.s,"S")):k=_t(l.x),`<button type="button" class="hw-scale-chip hw-hero-scale-chip"
      style="${`color:${k.color};background:${k.background};border-color:${k.borderColor}`}" data-hero-chip="${S.key}" title="${F(S.title)}" aria-label="${F(S.aria)}">${w(S.text)}</button>`}).join(""),g=Pt(((b=r.kp_history_1h)!=null?b:[]).map(S=>S.kp),.5),m=(y=r.kp_latest)!=null?y:0,h=m>=5,x=h?`linear-gradient(160deg, #0d2a1a 0%, ${i.bg}22 75%)`:`${i.bg}18`,v=Dt(e,t),u=h?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${m.toFixed(1)}</span>
      <a class="hw-aurora-map-btn" href="${F("https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg")}" target="_blank" rel="noopener noreferrer">View aurora map \u2192</a>
    </div>`:"";return`
    <div class="hw-hero" style="background:${x}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${t?"color:#9acf60":""}">Kp <b>${w(a)}</b>${t?"":`<span class="hw-trend">${g}</span>`}</div>
          <span class="hw-status-badge" style="background:${i.accent}22;color:${i.accent};display:block;text-align:center">${w(c.label)}</span>
          <div style="font-size:.62em;color:#607880;text-align:center;margin-top:1px;letter-spacing:.03em">Current conditions</div>
          <div class="hw-scales-row">${p}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${w(c.text)}</div>
            ${Gt(v,et(s))}
          </div>
        </div>
      </div>
      ${u}
    </div>`}function jt(e){var d,p,g,m;let{metrics:o}=e,t=(d=o.kp_history_1h)!=null?d:[],s=(p=o.wind_history_1h)!=null?p:[],n=(g=o.bz_history_1h)!=null?g:[],c=(m=o.xray_history_1h)!=null?m:[],r=Ht(t),i=Oe(s.map(h=>{var x;return(x=h.kms)!=null?x:0}).filter(h=>h>0),s.map(h=>we(h.t_utc)),"#5cce8c",28,!1),a=Oe(n.map(h=>h.bz),n.map(h=>we(h.t_utc)),"#d4cc5c",28,!0),l=Lt(c);return`
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
    </div>`}function Wt(e){let o=bt(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${w(o)}</span>
    </div>`}function Ut(e){return e.map((o,t)=>t===0?(o+e[1])/2:t===e.length-1?(e[t-1]+o)/2:(e[t-1]+o+e[t+1])/3)}function Xt(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Kt(e){return e>=5?"good":e>=3?"possible":"none"}function qe(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function qt(e){let o=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",t=qe(e),s=o==="none"?"No aurora expected at mid-latitudes":t!=null?`Aurora possible equatorward of ~${t}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",c=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",r=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:o,label:"Aurora",summary:s},{kind:"radio",level:n,label:"HF Radio",summary:c},{kind:"solar_activity",level:r,label:"Solar Activity",summary:r==="none"?"Quiet geomagnetic conditions expected":r==="low"?"Active geomagnetic conditions possible":r==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Qt(e,o){var p;if(o<=0)return null;let t=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!t.length)return null;let s=Date.now()+o*36e5,n=t[0],c=1/0;for(let g of t){let m=Math.abs(new Date(g.t_utc).getTime()-s);m<c&&(c=m,n=g)}let r=n.kp,i=Xt(r),a=Kt(r),l=qe(r),d=qt(r);return{offsetH:o,kp:r,gScale:i,auroraLabel:a,auroraMinLat:l,impacts:d}}function Vt(e,o,t,s){var W;let{forecast:n,metrics:c}=e,{kp_max_next_24h:r,kp_max_at_utc:i,trend:a}=n,l=((W=c.kp_forecast_3h)!=null?W:[]).slice(0,16),d=l.length,p=d*3,g=p>0?`${(o/p*100).toFixed(0)}%`:"0%",m=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline",h="Kp forecast unavailable";if(r!=null){let H=me(i),R=a==="rising"?"rising":a==="falling"?"falling":"steady";h=`Peak Kp ${r.toFixed(1)} next 24h${H?` at ${H}`:""} \xB7 ${R}`}let x=l.length?me(l[0].t_utc):null,v=x?`Forecast \xB7 Next step ${x}`:"Forecast";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${w(v)}</span>
      </div>
      ${s?`<div class="hw-forecast-text">${w(h)}</div>`:""}
    </div>`;let $=320,u=38,f=14,b=u+f,y=$/d,S=H=>u-Math.max(2,Math.min(u-2,H/9*(u-2))),k="",M=l.map(H=>H.kp),C=Ut(M);l.forEach((H,R)=>{let q=S(H.kp),T=u-q,I=R*y,Z=I+y/2,z=H.kp>=6?"#e05c5c":H.kp>=5?"#e0a84a":H.kp>=4?"#d4cc5c":"#5cce8c",Y=`Kp ${H.kp.toFixed(1)} \xB7 ${me(H.t_utc)}`;if(k+=`<rect x="${I.toFixed(1)}" y="${q.toFixed(1)}" width="${(y-1.5).toFixed(1)}" height="${T.toFixed(1)}" fill="${z}" fill-opacity="0.85" rx="1.5"/>`,k+=`<rect x="${I.toFixed(1)}" y="0" width="${y.toFixed(1)}" height="${u}" fill="transparent"><title>${F(Y)}</title></rect>`,d<=8||R%2===0){let E=new Date(H.t_utc).getHours();k+=`<text x="${Z.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${E.toString().padStart(2,"0")}</text>`}});let L=`<polyline points="${l.map((H,R)=>{let q=R*y+y/2,T=S(C[R]);return`${q.toFixed(1)},${T.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,A="";if(o>0&&d>0){let H=Math.min($-1,o/(d*3)*$);A=`
      <line x1="${H.toFixed(1)}" y1="0" x2="${H.toFixed(1)}" y2="${u}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${H.toFixed(1)},${u} ${(H-4).toFixed(1)},${(u-7).toFixed(1)} ${(H+4).toFixed(1)},${(u-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let N=Math.round(p/4),P=Math.round(p/2),X=Math.round(p*3/4),B=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${w(m)}</span>
        ${o>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${o}" style="--pct:${g}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${N}h</span>
        <span class="hw-scrub-tick">+${P}h</span>
        <span class="hw-scrub-tick">+${X}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,G=t?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(t.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${t.kp.toFixed(1)} \xB7 ${t.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">${w(v)}</span>
      </div>
      ${s?`
      ${G}
      <div class="hw-forecast-text">${w(h)}</div>
      <svg viewBox="0 0 ${$} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${k}
        ${L}
        ${A}
      </svg>
      ${B}`:""}
    </div>`}function Zt(e){let o=/([NS])(\d+)([EW])(\d+)/i.exec(e);return o?{lat:(o[1].toUpperCase()==="N"?1:-1)*parseInt(o[2],10),lon:(o[3].toUpperCase()==="E"?1:-1)*parseInt(o[4],10)}:null}var Qe=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Jt(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function eo(e,o,t){let s=o/2,n=s*.87,c=o*.03,r=o*.009,i=e.map(a=>{var $,u;let l=Zt(a.location);if(!l||Math.abs(l.lon)>88||a.location.includes("*"))return"";let d=Jt(a);if(!t.has(d))return"";let p=Qe.find(f=>f.id===d).color,g=l.lat*Math.PI/180,m=l.lon*Math.PI/180,h=(s+n*Math.cos(g)*Math.sin(m)).toFixed(1),x=(s-n*Math.sin(g)).toFixed(1),v=`AR ${a.region} \xB7 ${a.location}
Class: ${($=a.spot_class)!=null?$:"\u2014"} / ${(u=a.mag_class)!=null?u:"\u2014"}
C: ${a.c_flare_probability}%  M: ${a.m_flare_probability}%  X: ${a.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${w(v)}</title>
      <circle cx="${h}" cy="${x}" r="${(c+r+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(r*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${h}" cy="${x}" r="${c.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${r.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${o}" height="${o}" viewBox="0 0 ${o} ${o}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${i}</svg>`}var Ce={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ve='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',to=Ce.solar_activity,oo='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><path d="M2 6 Q2 2.5 6 2.5 Q10 2.5 10 6 Q10 9.5 6 9.5 Q2 9.5 2 6"/><ellipse cx="6" cy="6" rx="2.2" ry="1.9"/><circle cx="6" cy="6" r="0.65" fill="currentColor" stroke="none"/></svg>',so='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.2" style="flex-shrink:0"><circle cx="3.2" cy="6" r="2.2"/><line x1="5.8" y1="6" x2="11" y2="6"/><polyline points="9.2,4.3 11,6 9.2,7.7" fill="currentColor" stroke="none"/></svg>',no=14,Ze="https://staging.nebulacast.app";function Je(e,o){return!e||/^https?:\/\//.test(e)||e.startsWith("//")?e:(o!=null?o:Ze).replace(/\/$/,"")+(e.startsWith("/")?e:"/"+e)}function et(e){var s,n,c;let o=(s=e.baseUrl)==null?void 0:s.trim();if(o)return o.replace(/\/$/,"");let t=(c=(n=e.dataUrl)==null?void 0:n.trim())!=null?c:"";if(/^https?:\/\//i.test(t))try{return new URL(t).origin}catch(r){}return Ze}var ro="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",io="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ao=240;function co(e,o){var l,d,p;let t=parseInt(((l=e.scales.r_scale)!=null?l:"R0").slice(1),10),s=(d=e.metrics.xray_class)!=null?d:"A",n=e.metrics.xray_flux_wm2,c=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",i=[{r:0,color:"#5cce8c",desc:"Quiet"},{r:1,color:"#d4cc5c",desc:"Minor"},{r:2,color:"#e0a84a",desc:"Moderate"},{r:3,color:"#e05c5c",desc:"Strong"},{r:4,color:"#c0407a",desc:"Severe"},{r:5,color:"#8c3cc0",desc:"Extreme"}].map(g=>{let m=g.r===t,h=g.r<=t,x=h?g.color:"#1e2c30",v=m?"1":h?"0.5":"1",$=m?g.color:h?g.color+"99":"#566068",u=m?g.color:h?g.color+"88":"#566068";return`<div class="hw-radio-block">
      <span class="hw-radio-blabel" style="color:${$}">R${g.r}</span>
      <div class="hw-radio-bbar" style="background:${x};opacity:${v}"></div>
      <span class="hw-radio-bdesc" style="color:${u}">${g.desc}</span>
    </div>`}).join("");return`<div class="hw-impact-tip${o?" hw-impact-tip-open":""}">
    <div class="hw-radio-scale">${i}</div>
    <div class="hw-radio-meta">X-ray: <b style="color:${(p=fe[s])!=null?p:"#a0b4b8"}">${w(s)}-class</b> \xB7 ${w(c)}</div>
  </div>`}var lo={0:"Quiet",1:"Minor Storm",2:"Moderate Storm",3:"Strong Storm",4:"Severe Storm",5:"Extreme Storm"};function po(e){return e>=9?5:e>=8?4:e>=7?3:e>=6?2:e>=5?1:0}function ae(e,o){if(e<o-.7)return 0;if(e>o+1)return .9;let t=(e-(o-.7))/1.7;return Math.round(Math.pow(Math.max(0,t),.7)*90)/100}function ho(e){var l,d,p;let o=parseInt(((l=e.scales.g_scale)!=null?l:"G0").replace(/\D/g,""),10),t=Math.max(0,Math.min(5,Number.isFinite(o)?o:0)),s=(d=e.metrics.kp_forecast_3h)!=null?d:[],n=Date.now(),c=n+1440*60*1e3,r=s.filter(g=>{let m=new Date(g.t_utc).getTime();return m>=n-10800*1e3&&m<=c}),i=r.length===0?0:Math.max(...r.map(g=>g.kp)),a={G1:ae(i,5),G2:ae(i,6),G3:ae(i,7),G4:ae(i,8),G5:ae(i,9),max_expected:po(i)};return{now:{g_level:t,label:(p=lo[t])!=null?p:"Quiet"},forecast_24h:a}}function mo(e){if(!e||typeof e!="object")return null;let o=e,t=o.now,s=o.forecast_24h;if(!t||!s)return null;let n=typeof t.g_level=="number"?t.g_level:parseInt(String(t.g_level),10),c=typeof t.label=="string"?t.label:"Quiet";if(!Number.isFinite(n))return null;let r=l=>{let d=typeof l=="number"?l:parseFloat(String(l));return Number.isFinite(d)?Math.max(0,Math.min(1,d)):0},i=s.max_expected,a=typeof i=="number"&&Number.isFinite(i)?Math.max(0,Math.min(5,Math.round(i))):0;return{now:{g_level:Math.max(0,Math.min(5,Math.round(n))),label:c},forecast_24h:{G1:r(s.G1),G2:r(s.G2),G3:r(s.G3),G4:r(s.G4),G5:r(s.G5),max_expected:a}}}function tt(e){let o=ho(e),t=mo(e.storm_risk);if(!t)return o;let s=e.storm_risk,n=s&&typeof s.forecast_24h=="object"&&s.forecast_24h!==null?s.forecast_24h:void 0,c=n==null?void 0:n.max_expected;return typeof c=="number"&&Number.isFinite(c)?t:he(pe({},t),{forecast_24h:he(pe({},t.forecast_24h),{max_expected:o.forecast_24h.max_expected})})}function go(e){return e>=4?"#e05c5c":e>=3?"#e0a84a":e>=1?"#d4cc5c":"#607880"}var Te={rising:"#e0884a",peak:"#e05c5c",decline:"#d4cc5c"};function uo(e){var l,d,p;let o=(l=e.metrics.kp_latest)!=null?l:0,t=e.metrics.imf_bz_nt,s=e.metrics.solar_wind_kms,n=parseInt(((d=e.scales.g_scale)!=null?d:"G0").replace("G",""),10)||0,c=o>=5||n>=1,r=(p=e.metrics.kp_history_1h)!=null?p:[],i=0;if(r.length>=2&&(i=r[r.length-1].kp-r[r.length-2].kp),!c)return{active:!1,phase:"quiet",kp_current:o,kp_trend:i,bz_nt:t,solar_wind_kms:s};let a;return i>.3&&(t==null||t<-5)?a="rising":i<-.5?a="decline":a="peak",{active:!0,phase:a,kp_current:o,kp_trend:i,bz_nt:t,solar_wind_kms:s}}function wo(e){if(!e.active)return"";let o=[{key:"rising",label:"Rising"},{key:"peak",label:"Peak"},{key:"decline",label:"Decline"}],t=o.findIndex(i=>i.key===e.phase),s=Te[e.phase],n=o[t].label,c=o.map((i,a)=>{let l=a===t,d=a<t,p=Te[i.key],g=l?`background:${p};border-color:${p};box-shadow:0 0 6px ${p}88`:d?`background:${p}44;border-color:${p}66`:"background:#111b1e;border-color:#1e2c30",m=l?" hw-spi-dot-active":"",h=l?`color:${p};font-weight:700`:d?`color:${p}66`:"color:#2e4248",x=a<o.length-1?`<div class="hw-spi-arr">${d?`<span style="color:${p}55">\u2192</span>`:"\u2192"}</div>`:"";return`<div class="hw-spi-node">
        <div class="hw-spi-dot${m}" style="${g}"></div>
        <div class="hw-spi-txt" style="${h}">${i.label}</div>
      </div>${x}`}).join(""),r=[`Kp ${e.kp_current.toFixed(1)}`];return e.bz_nt!=null&&r.push(`Bz ${e.bz_nt>0?"+":""}${e.bz_nt.toFixed(1)} nT`),e.solar_wind_kms!=null&&r.push(`Wind ${Math.round(e.solar_wind_kms)} km/s`),`<div class="hw-spi-wrap">
    <div class="hw-spi-hdr">Geomagnetic Storm \xB7 <span style="color:${s};font-weight:700">${n}</span></div>
    <div class="hw-spi-track">${c}</div>
    <div class="hw-spi-params">${r.join(" \xB7 ")}</div>
  </div>`}function ze(e,o,t){let s=Math.max(0,Math.min(5,Math.round(e))),n=(t==null?void 0:t.showDialCode)!==!1,c=70,r=76,i=48,l=i-9,d=Math.PI,p=y=>d*(1-y/5),g=p(s),m=(y,S)=>({x:c+S*Math.cos(y),y:r-S*Math.sin(y)}),h=(y,S,k)=>{let M=m(y,i),C=m(S,i),_=m(y,l),L=m(S,l);return`<path d="M ${_.x.toFixed(2)} ${_.y.toFixed(2)} L ${M.x.toFixed(2)} ${M.y.toFixed(2)} A ${i} ${i} 0 0 1 ${C.x.toFixed(2)} ${C.y.toFixed(2)} L ${L.x.toFixed(2)} ${L.y.toFixed(2)} A ${l} ${l} 0 0 0 ${_.x.toFixed(2)} ${_.y.toFixed(2)} Z" fill="${k}"/>`},x=y=>{let S=p(y),k=m(S,i+1),M=m(S,i-5);return`<line x1="${k.x.toFixed(2)}" y1="${k.y.toFixed(2)}" x2="${M.x.toFixed(2)}" y2="${M.y.toFixed(2)}" stroke="#2a3a40" stroke-width="1" stroke-linecap="round"/>`},v=m(g,i-2),$=`<line x1="${c}" y1="${r}" x2="${v.x.toFixed(2)}" y2="${v.y.toFixed(2)}" stroke="#c8d6dc" stroke-width="2" stroke-linecap="round"/>`,u=`<circle cx="${c}" cy="${r}" r="3.5" fill="#3a4c52" stroke="#1e2c30" stroke-width="1"/>`,f=h(p(0),p(2),"#3d8f62")+h(p(2),p(4),"#b8982a")+h(p(4),p(5),"#b04048"),b=[0,1,2,3,4,5].map(x).join("");return`<div class="hw-storm-risk-gauge" role="img" aria-label="${F(o)} G${s}">
    <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="140" height="88" fill="none"/>
      <path d="M ${m(d,i).x.toFixed(2)} ${m(d,i).y.toFixed(2)} A ${i} ${i} 0 0 1 ${m(0,i).x.toFixed(2)} ${m(0,i).y.toFixed(2)}" fill="none" stroke="#1a2428" stroke-width="2" stroke-linecap="round"/>
      ${f}
      ${b}
      ${$}
      ${u}
      ${n?`<text x="${c}" y="84" text-anchor="middle" fill="#8a9ca8" font-size="11" font-family="inherit" font-weight="600">G${s}</text>`:""}
    </svg>
  </div>`}function xo(e,o){let t=tt(e),s=uo(e),n=t.forecast_24h,c=Math.max(0,Math.min(5,Math.round(n.max_expected))),r=`<div class="hw-storm-risk-now-gauge">${ze(t.now.g_level,"Current observed geomagnetic storm level",{showDialCode:!0})}</div>`,i=`<div class="hw-storm-risk-fc-gauge">${ze(c,"Max expected geomagnetic level in next 24 hours",{showDialCode:!1})}</div>`,a=`
        <div class="hw-gstorm-footer" style="margin-top:2px;line-height:1.35">Max expected in next 24h</div>
        <div class="hw-gstorm-footer" style="margin-top:2px">From Kp forecast: G${c}</div>`;return`<div class="hw-impact-tip${o?" hw-impact-tip-open":""}">
    ${wo(s)}
    <div class="hw-storm-risk-grid">
      <div class="hw-storm-risk-head-now">Now</div>
      <div class="hw-storm-risk-head-fc hw-storm-risk-rail-edge">Forecast 24h</div>
      <div class="hw-storm-risk-now-gauge-cell">${r}</div>
      <div class="hw-storm-risk-fc-gauge-cell hw-storm-risk-rail-edge">${i}</div>
      <div class="hw-storm-risk-now-only">
        <div class="hw-storm-risk-now-lbl">${w(t.now.label)}</div>
      </div>
      <div class="hw-storm-risk-fc-foot hw-storm-risk-rail-edge">${a}</div>
    </div>
  </div>`}var ge={cycle_name:"Solar Cycle 25",phase:"declining",progress_0_1:.57,cycle_start_year:2019,expected_peak_year:2025,expected_end_year:2030,subtitle:"Activity remains elevated"},ot={minimum:"#607880",rising:"#d4cc5c",maximum:"#e0a84a",declining:"#96a8c8"};function fo(e){var C;let o=ge,t=(C=ot[o.phase])!=null?C:"#96a8b8",s=o.phase.charAt(0).toUpperCase()+o.phase.slice(1),n=280,c=52,r=10,i=c-6,a=c-18,l=.5,d=.19,p=_=>Math.exp(-Math.pow((_-l)/d,2)/2),g=_=>r+_*(n-2*r),m=_=>i-p(_)*a,h=80,x=[];for(let _=0;_<=h;_++){let L=_/h;x.push(`${_===0?"M":"L"}${g(L).toFixed(1)},${m(L).toFixed(1)}`)}let v=Math.round(o.progress_0_1*h),$=[];for(let _=0;_<=v;_++){let L=_/h;$.push(`${_===0?"M":"L"}${g(L).toFixed(1)},${m(L).toFixed(1)}`)}let u=g(o.progress_0_1),f=[`M${r},${i}`,...$.slice(1),`L${u.toFixed(1)},${i} Z`],b=m(o.progress_0_1),y=5,S=`M${u.toFixed(1)},${b.toFixed(1)} L${(u-y).toFixed(1)},${(b-y*1.8).toFixed(1)} L${(u+y).toFixed(1)},${(b-y*1.8).toFixed(1)} Z`,k=i+11;return`<div class="hw-impact-tip${e?" hw-impact-tip-open":""}" style="padding:8px 6px 6px">
    <div class="hw-sc-name">${w(o.cycle_name)}</div>
    <svg width="100%" height="${c+14}" viewBox="0 0 ${n} ${c+14}" class="hw-sc-svg" preserveAspectRatio="none">
      <path d="${f.join(" ")}" fill="${t}" opacity="0.12"/>
      <path d="${x.join(" ")}" fill="none" stroke="#2a4048" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${$.join(" ")}" fill="none" stroke="${t}" stroke-width="1.5" opacity="0.7" vector-effect="non-scaling-stroke"/>
      <line x1="${r}" y1="${i}" x2="${n-r}" y2="${i}" stroke="#1e2c30" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path d="${S}" fill="${t}"/>
      <text x="${r+2}" y="${k}" class="hw-sc-axlabel" text-anchor="start">min</text>
      <text x="${g(.5).toFixed(1)}" y="${k}" class="hw-sc-axlabel" text-anchor="middle">max</text>
      <text x="${(n-r-2).toFixed(1)}" y="${k}" class="hw-sc-axlabel" text-anchor="end">min</text>
    </svg>
    <div class="hw-sc-footer">Phase: <b style="color:${t}">${w(s)}</b>${o.subtitle?` \xB7 ${w(o.subtitle)}`:""}</div>
  </div>`}var Ne="/assets/gifs",Pe={none:"off_green_quiet.gif",low:"steady_green_normal.gif",moderate:"blink_fast_yellow_watch.gif",strong:"breathe_slow_red_alert.gif",severe:"breathe_slow_red_alert.gif"};function $o(e,o){var t;return e==="earth"&&(o==="strong"||o==="severe")?`${Ne}/beacon_red_storm.gif`:`${Ne}/${(t=Pe[o])!=null?t:Pe.none}`}function st(e,o,t){return Je($o(e,o),t)}var xe={none:"#3a5060",low:"#5cce8c",moderate:"#d4cc5c",strong:"#e0a84a",severe:"#e05c5c"};function bo(e){var b,y,S,k;let o=(b=e.metrics.xray_class)!=null?b:"A",t=e.observer_impacts.find(M=>M.kind==="solar_activity"),s=(y=t==null?void 0:t.level)!=null?y:"none",n=e.coronal_hole,c=(S=n==null?void 0:n.status)!=null?S:"quiet",r=[];o==="X"?(r.push("Solar flare: X-class"),r.push("Elevated X-ray activity")):o==="M"?(r.push("Solar flare: M-class"),r.push("Elevated X-ray activity")):o==="C"&&r.push("Minor C-class flare activity"),(c==="strong"||c==="active")&&(r.push(`Coronal hole: ${c==="strong"?"Strong":"Active"}`),(n==null?void 0:n.estimated_speed_kms)!=null&&r.push(`Fast solar wind: ~${Math.round(n.estimated_speed_kms)} km/s`)),r.length===0&&r.push("No significant solar source activity");let i,a;o==="X"||s==="high"?(i="Strong",a="strong"):o==="M"||s==="moderate"||c==="strong"?(i="Active",a="moderate"):o==="C"||s==="low"||c==="active"?(i="Elevated",a="low"):(i="Quiet",a="none");let l=e.cme_tracker,d=e.metrics.solar_wind_kms,p=[],g="Clear",m="none";if(l){let M=l.status,C=l.impact_level;if(M==="arrived"||M==="arrival_window")g="Impacting",m=C==="high"?"strong":"moderate",p.push("CME impact underway"),l.speed_kms!=null&&p.push(`Speed: ~${Math.round(l.speed_kms)} km/s`);else if(M==="inbound"||M==="detected"){if(g="Incoming",m=C==="high"?"moderate":"low",p.push("Earth-directed CME detected"),l.arrival_time_utc){let _=new Date(l.arrival_time_utc),L=_.getUTCDate().toString().padStart(2,"0"),A=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][_.getUTCMonth()],N=_.getUTCHours().toString().padStart(2,"0"),P=_.getUTCMinutes().toString().padStart(2,"0");p.push(`ETA: ${L} ${A} ${N}:${P} UTC`)}p.push(`Expected impact: ${C.charAt(0).toUpperCase()+C.slice(1)}`)}}p.length===0&&(d!=null&&d>500?(g="Active",m="low",p.push(`High-speed solar wind: ${Math.round(d)} km/s`),p.push("No Earth-directed CME tracked")):p.push("No Earth-directed events"));let h=parseInt(((k=e.scales.g_scale)!=null?k:"G0").slice(1),10),x=e.metrics.kp_latest,v=x!=null?`Kp ${x.toFixed(1)}`:"Kp \u2014",$=[`G${h}`],u,f;return h>=4?(u="Severe",f="severe",$.push("Severe geomagnetic storm")):h===3?(u="Storm",f="strong",$.push("Strong geomagnetic storm")):h===2?(u="Storm",f="moderate",$.push("Moderate geomagnetic storm")):h===1?(u="Active",f="low",$.push("Minor geomagnetic storm")):(u="Quiet",f="none",$.push("Quiet conditions")),$.push(v),{sun:{state:i,severity:a,label:i,messages:r},space:{state:g,severity:m,label:g,messages:p},earth:{state:u,severity:f,label:u,messages:$}}}function Be(e,o,t,s){var i;let n=(i=xe[e.severity])!=null?i:xe.none,c=st(t,e.severity,s),r=e.messages.slice(0,3).map(a=>`<span class="hw-chain-msg">${w(a)}</span>`).join("");return`<div class="hw-chain-col">
    <div class="hw-chain-head">${w(o)}</div>
    <img class="hw-chain-alarm" src="${F(c)}" alt="" aria-hidden="true">
    <div class="hw-chain-state" style="color:${n}">${w(e.label)}</div>
    <div class="hw-chain-msgs">${r}</div>
  </div>`}function vo(e,o){var a,l;let t=(a=e.chain_panel)!=null?a:bo(e),s='<div class="hw-chain-arrow">\u203A</div>',n=(l=xe[t.earth.severity])!=null?l:xe.none,c=st("earth",t.earth.severity,o),r=t.earth.messages.slice(0,3).map(d=>`<span class="hw-chain-msg">${w(d)}</span>`).join(""),i=`<div class="hw-chain-col hw-chain-col-earth" data-chain-col="earth" title="Click to expand Aurora &amp; Storm Risk">
    <div class="hw-chain-head">Earth</div>
    <img class="hw-chain-alarm" src="${F(c)}" alt="" aria-hidden="true">
    <div class="hw-chain-state" style="color:${n}">${w(t.earth.label)}</div>
    <div class="hw-chain-msgs">${r}</div>
  </div>`;return`<div class="hw-chain-cols" style="margin:8px 0 4px">
    ${Be(t.sun,"Sun","sun",o)}
    ${s}
    ${Be(t.space,"Space","space",o)}
    ${s}
    ${i}
  </div>`}function nt(e){var n,c;let o=(n=e.scales.g_scale)!=null?n:"G0",t=parseInt(o.slice(1),10),s=e.metrics.kp_latest;if(s==null){let r=(c=e.metrics.kp_forecast_3h)!=null?c:[],i=Date.now(),a=r.filter(l=>new Date(l.t_utc).getTime()<=i+10800*1e3).sort((l,d)=>new Date(d.t_utc).getTime()-new Date(l.t_utc).getTime());a.length>0&&(s=a[0].kp)}return t>=2||s!=null&&s>=6?{level:2,color:"#e05c5c",label:"High",kp:s,gScale:o}:t>=1||s!=null&&s>=4?{level:1,color:"#d4cc5c",label:"Moderate",kp:s,gScale:o}:{level:0,color:"#5cce8c",label:"Low",kp:s,gScale:o}}function yo(e,o){let t=nt(e),s=o?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c"},{l:1,label:"Moderate",color:"#d4cc5c"},{l:2,label:"High",color:"#e05c5c"}].map(a=>{let l=a.l===t.level,d=l?`${a.color}2e`:"#1b2a2e",p=l?a.color:"#3d5058",g=l?`1px solid ${a.color}66`:"1px solid #253035";return`<div class="hw-level-cell" style="background:${d};color:${p};border:${g}">${a.label}</div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",i={0:"Near-normal thermospheric density",1:"Elevated drag \u2014 minor orbit correction may be needed",2:"Strong thermospheric expansion \u2014 significant drag increase"};return`<div class="hw-impact-tip${s}">
    <div class="hw-level-strip">${c}</div>
    <div class="hw-satdrag-meta">${r} \xB7 ${w(t.gScale)} \xB7 ${i[t.level]}</div>
  </div>`}function rt(e){var l,d,p;let o=(l=e.scales.g_scale)!=null?l:"G0",t=parseInt(o.slice(1),10),s=e.metrics.kp_latest;if(s==null){let g=(d=e.metrics.kp_forecast_3h)!=null?d:[],m=Date.now(),h=g.filter(x=>new Date(x.t_utc).getTime()<=m+10800*1e3).sort((x,v)=>new Date(v.t_utc).getTime()-new Date(x.t_utc).getTime());h.length>0&&(s=h[0].kp)}let n=0;t>=2||s!=null&&s>=6?n=2:(t>=1||s!=null&&s>=4)&&(n=1);let c=parseInt(((p=e.scales.r_scale)!=null?p:"R0").slice(1),10),r=c>=2&&n<2;c>=2&&(n=Math.min(2,n+1));let i={0:"#5cce8c",1:"#d4cc5c",2:"#e05c5c"},a={0:"Low",1:"Moderate",2:"High"};return{level:n,color:i[n],label:a[n],kp:s,gScale:o,boostedByFlare:r}}function ko(e,o){var l;let t=rt(e),s=o?" hw-impact-tip-open":"",c=[{l:0,label:"Low",color:"#5cce8c"},{l:1,label:"Moderate",color:"#d4cc5c"},{l:2,label:"High",color:"#e05c5c"}].map(d=>{let p=d.l===t.level,g=p?`${d.color}2e`:"#1b2a2e",m=p?d.color:"#3d5058",h=p?`1px solid ${d.color}66`:"1px solid #253035";return`<div class="hw-level-cell" style="background:${g};color:${m};border:${h}">${d.label}</div>`}).join(""),r=t.kp!=null?`Kp ${t.kp.toFixed(1)}`:"Kp \u2014",i={0:"Stable ionosphere \xB7 normal positioning accuracy",1:"Possible signal delay or scintillation",2:"Significant positioning errors \xB7 possible signal loss"},a=t.boostedByFlare?`<div class="hw-gnss-meta" style="font-size:.72em">Risk elevated by solar flare activity (R${parseInt(((l=e.scales.r_scale)!=null?l:"R0").slice(1),10)})</div>`:"";return`<div class="hw-impact-tip${s}">
    <div class="hw-level-strip">${c}</div>
    <div class="hw-gnss-meta">${r} \xB7 ${w(t.gScale)} \xB7 ${i[t.level]}</div>
    ${a}
  </div>`}function _e(e,o,t,s,n,c,r,i,a){let l=c.has(e),d=l?" hw-impact-open":"",p=l?" hw-impact-tip-open":"";return`<div class="hw-impact-row${d}" id="${e}" data-impact-row="${e}">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${n}">${t}<span style="color:#b4c6cc">${w(o)}</span></span>
      <span class="hw-impact-badge" style="background:${n}22;color:${n}">${w(s)}</span>
      <div class="hw-impact-tip${p}">${Nt(r,e,i,a)}</div>
    </div>`}function _o(e,o){let t=e.find(c=>c.kind==="aurora");if(t)return t;let s=o.aurora_hint;return{kind:"aurora",level:s.aurora_label==="good"?"moderate":s.aurora_label==="possible"?"low":"none",label:"Aurora",summary:s.summary}}function So(e,o,t,s){var u,f;let n=(u=je[e.level])!=null?u:"#666",c=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),r=(f=Ce[e.kind])!=null?f:Ve,i=e.level==="none"?"#606870":n,a=o.has("aurora"),l=a?" hw-impact-open":"",d=a?" hw-aurora-tip-open":"",p=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,g=null;t&&s.lat!=null&&s.lon!=null&&(g=Xe(t.entries,s.lat,s.lon));let m=s.lat!=null&&s.lon!=null,h=g!=null?g>=30?"#5cce8c":g>=10?"#d4cc5c":"#9ab4bc":"#607880",x=g!=null?`${g}%`:t?"n/a":"\u2026",v=m?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${s.locationName?w(s.locationName)+" \xB7 ":""}${s.lat.toFixed(1)}\xB0${s.lat>=0?"N":"S"} ${Math.abs(s.lon).toFixed(1)}\xB0${s.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${h}">Aurora: ${x}</span>
    </div>`:"",$=`<div class="hw-aurora-tip${d}">
      <div class="hw-aurora-map-wrap">
        <img class="hw-aurora-img" src="${F(p)}" alt="NOAA Aurora Oval" loading="lazy" />
        ${Ke(s)}
      </div>
      ${v}
      <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
    </div>`;return`<div class="hw-impact-row${l}" id="aurora" data-impact-row="aurora">
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${i}">${r}<span style="color:#b4c6cc">${w(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${n}22;color:${n}">${w(c)}</span>
    ${$}
  </div>`}function De(e,o,t,s,n,c){var x,v;let r=(x=je[e.level])!=null?x:"#666",i=e.level==="none"?"None":e.level.charAt(0).toUpperCase()+e.level.slice(1),a=(v=Ce[e.kind])!=null?v:Ve,l=e.level==="none"?"#606870":r,d=e.kind==="solar_activity"?t:c,p=d?" hw-impact-open":"",g;if(e.kind==="solar_activity"){let $=t?" hw-solar-open":"",u=Qe.map(f=>{let b=s.has(f.id),y=b?f.color+"22":"transparent",S=b?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${f.id}" style="color:${f.color};border-color:${f.color};background:${y};opacity:${S}">${f.label}</button>`}).join("");g=`<div class="hw-solar-tip${$}">
        <div class="hw-solar-disk-wrap" id="solar">
          <img class="hw-solar-disk-img" src="${ro}" alt="Solar disk" loading="lazy" />
          ${o?eo(o,ao,s):""}
        </div>
        <div class="hw-solar-layers">${u}</div>
        <span class="hw-solar-tip-text">${w(e.summary)}</span>
      </div>`}else g=co(n,d);let m=e.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${F(e.kind)}"`,h=e.kind==="radio"?' id="radio"':"";return`<div class="hw-impact-row${p}"${h}${m}>
    <span class="hw-impact-caret">\u25B6</span>
    <span class="hw-impact-kind" style="color:${l}">${a}<span style="color:#b4c6cc">${w(e.label)}</span></span>
    <span class="hw-impact-badge" style="background:${r}22;color:${r}">${w(i)}</span>
    ${g}
  </div>`}function Mo(e,o,t,s,n,c,r,i,a){var oe,le,se,re;let l=(le=(oe=o==null?void 0:o.impacts)!=null?oe:e.observer_impacts)!=null?le:[],d=_o(l,e),p=So(d,r,i,a),g=l.find(V=>V.kind==="radio"),m=l.find(V=>V.kind==="solar_activity"),h=g?De(g,t,n,c,e,r.has("radio")):"",x=m?De(m,t,n,c,e,!1):"",u=`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${s?"\u25BC":"\u25B6"}</span>
      <span class="hw-section-label" style="margin-bottom:0">Indicators (${no})${o?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':""}</span>
    </div>`,{metrics:f}=e,b=f.xray_class,y=b?(se=fe[b])!=null?se:"#a0b4b8":"#607880",S=b?`${b}-class`:"\u2014",k=f.imf_bz_nt,M=k!=null?k<=-10?"#e05c5c":k<=-5?"#e0a84a":k>=5?"#5cce8c":"#a0b4b8":"#607880",C=k!=null?(k>=0?"+":"")+k.toFixed(1)+" nT":"\u2014",_=f.solar_wind_kms,L=_!=null?`${Math.round(_)} km/s`:"\u2014",A=_!=null?_>700?"#e05c5c":_>500?"#e0a84a":_>400?"#d4cc5c":"#5cce8c":"#607880",N=_e("xray","X-Ray",to,S,y,r,e,a,i),P=_e("imf_bz","IMF Bz",oo,C,M,r,e,a,i),X=_e("solar_wind","Solar Wind",so,L,A,r,e,a,i),B='<div class="hw-indicators-sep" role="separator" aria-hidden="true"></div>',G=r.has("geomag_storm"),W=tt(e),H=go(W.now.g_level),R=`G${W.now.g_level}`,T=`<div class="hw-impact-row${G?" hw-impact-open":""}" id="storm_risk" data-impact-row="geomag_storm">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${H}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 2 L6.5 5"/><path d="M6.5 5 Q2 5 2 8.5 Q2 11 6.5 11 Q11 11 11 8.5 Q11 5 6.5 5"/><path d="M4.5 7.5 Q6.5 6 8.5 7.5"/></svg><span style="color:#b4c6cc">Storm Risk</span></span>
      <span class="hw-impact-badge" style="background:${H}22;color:${H}">${R}</span>
      ${xo(e,G)}
    </div>`,I=r.has("solar_cycle"),Z=(re=ot[ge.phase])!=null?re:"#96a8b8",z=ge.phase.charAt(0).toUpperCase()+ge.phase.slice(1),D=`<div class="hw-impact-row${I?" hw-impact-open":""}" data-impact-row="solar_cycle">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${Z}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M1 9 Q3 4 6.5 4 Q10 4 12 9"/><circle cx="6.5" cy="4" r="1.3" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Solar Cycle</span></span>
      <span class="hw-impact-badge" style="background:${Z}22;color:${Z}">${z}</span>
      ${fo(I)}
    </div>`,E=nt(e),K=r.has("sat_drag"),J=`<div class="hw-impact-row${K?" hw-impact-open":""}" id="satellite_drag" data-impact-row="sat_drag">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${E.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><rect x="4.5" y="5" width="4" height="3" rx="0.4"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="8.5" y1="6.5" x2="12" y2="6.5"/><line x1="6.5" y1="5" x2="6.5" y2="3"/><circle cx="6.5" cy="2.5" r="0.6" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Satellite Drag</span></span>
      <span class="hw-impact-badge" style="background:${E.color}22;color:${E.color}">${E.label}</span>
      ${yo(e,K)}
    </div>`,O=rt(e),j=r.has("gnss"),te=`<div class="hw-impact-row${j?" hw-impact-open":""}" id="gnss" data-impact-row="gnss">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${O.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M3 5.5 Q6.5 2.5 10 5.5"/><path d="M4.5 7.5 Q6.5 5.5 8.5 7.5"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/><line x1="6.5" y1="10.7" x2="6.5" y2="12"/></svg><span style="color:#b4c6cc">GNSS Risk</span></span>
      <span class="hw-impact-badge" style="background:${O.color}22;color:${O.color}">${O.label}</span>
      ${ko(e,j)}
    </div>`,Q=Me(e),ie=r.has("magnetosphere"),be=`<div class="hw-impact-row${ie?" hw-impact-open":""}" data-impact-row="magnetosphere">
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${Q.color}"><svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 Q2 2 6.5 2 Q11 2 11 6.5 Q11 11 6.5 11 Q2 11 2 6.5"/><path d="M4.5 6.5 Q4.5 4 6.5 4 Q8.5 4 8.5 6.5"/><circle cx="6.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg><span style="color:#b4c6cc">Sun-Earth interaction</span></span>
      <span class="hw-impact-badge" style="background:${Q.color}22;color:${Q.color}">${w(Q.label)}</span>
      ${Tt(e,ie,et(a))}
    </div>`;return`
    <div class="hw-impacts">
      ${u}
      ${s?[be,p,T,h,J,te,N,x,B,X,P,D].join(""):""}
    </div>`}var Ge={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Co(e,o){var a,l;let t=(a=xt[e.level])!=null?a:"#666",s=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(l=Ge[e.kind])!=null?l:Ge.unknown,c=[vt(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),r=o&&e.raw_body?`<div class="hw-alert-body">${w(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${o?" hw-alert-open":""}" style="border-color:${t}" data-alert-key="${F(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${t}">${n}</span>
      <span class="hw-alert-level" style="color:${t}">${w(s)}</span>
      <span class="hw-alert-title">${w(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${w(e.summary_short)}</div>
    <div class="hw-alert-meta">${w(c)}</div>
    ${r}
  </div>`}var Ho={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Lo="#4ae0a4";function Eo(e){let o=(t,s="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${s}>${t}</svg>`;switch(e){case"solar_flare":return o(`<circle cx="6.5" cy="6.5" r="2.5"/>
        <line x1="6.5" y1="1" x2="6.5" y2="3"/>
        <line x1="6.5" y1="10" x2="6.5" y2="12"/>
        <line x1="1" y1="6.5" x2="3" y2="6.5"/>
        <line x1="10" y1="6.5" x2="12" y2="6.5"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="8.9" y1="8.9" x2="10.3" y2="10.3"/>
        <line x1="10.3" y1="2.7" x2="8.9" y2="4.1"/>
        <line x1="4.1" y1="8.9" x2="2.7" y2="10.3"/>`);case"cme_launch":return o(`<line x1="1" y1="6.5" x2="10" y2="6.5"/>
        <polyline points="7,3.5 10,6.5 7,9.5"/>
        <line x1="1" y1="4.5" x2="6" y2="4.5" stroke-opacity=".5"/>
        <line x1="1" y1="8.5" x2="6" y2="8.5" stroke-opacity=".5"/>`);case"cme_arrival":return o(`<path d="M11,6.5 A4.5,4.5 0 0,1 2,6.5" stroke-opacity=".4"/>
        <path d="M9.5,6.5 A3,3 0 0,1 3.5,6.5" stroke-opacity=".7"/>
        <path d="M8,6.5 A1.5,1.5 0 0,1 5,6.5"/>
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>`);case"geomagnetic_storm":return o('<polyline points="8,1.5 5,6.5 7.5,6.5 5,11.5"/>');case"geomagnetic_watch":return o(`<circle cx="6.5" cy="6.5" r="5"/>
        <line x1="6.5" y1="3.5" x2="6.5" y2="6.5"/>
        <line x1="6.5" y1="6.5" x2="9" y2="7.5"/>`);case"radio_blackout":return o(`<path d="M3,3.5 Q6.5,6.5 10,9.5" stroke-opacity=".5"/>
        <path d="M10,3.5 Q6.5,6.5 3,9.5"/>
        <line x1="5" y1="1" x2="8" y2="12" stroke-opacity=".3"/>`);case"radiation_storm":return o(`<path d="M6.5,1.5 L12,11 L1,11 Z"/>
        <line x1="6.5" y1="5" x2="6.5" y2="8"/>
        <circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/>`);default:return o(`<circle cx="6.5" cy="6.5" r="5.5"/>
        <line x1="6.5" y1="5.5" x2="6.5" y2="9"/>
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function Fo(e){var s;let o=(s=e.metadata)!=null?s:{},t=[];return o.source_code&&t.push(`Code: ${o.source_code}`),o.model&&t.push(`Model: ${String(o.model).toUpperCase()}`),t.length===0?"":`
${t.join(" \xB7 ")}`}function Io(e,o,t){var a;let s=e.is_active?Lo:(a=Ho[e.level])!=null?a:"#445c64",n=e.event_time===t,c=e.event_time.slice(11,16)+" UTC",r=e.source==="NASA_DONKI"?"DONKI":"SWPC",i=n?`<div class="hw-tl-detail">${w(e.description)}${w(Fo(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${F(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${s}"></div>
        ${o?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${c}</span>
          <span class="hw-tl-src">${r}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${Eo(e.event_type)} ${w(e.event_title)}
        </div>
        ${i}
      </div>
    </div>`}function Ao(e,o,t,s){var $,u;let n=($=e.timeline)!=null?$:[],c=Date.now(),r=new Date(c).toISOString().slice(0,10),i=new Date(c-864e5).toISOString().slice(0,10),a=new Date(c-1728e5).toISOString().slice(0,10),l=new Set([r,i,a]),d=n.filter(f=>{var b;return l.has(((b=f.event_time)!=null?b:"").slice(0,10))}).slice().reverse(),p=d.length,g=t?"\u25BC":"\u25B6",m=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",h=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${m}</span>
    </div>`;if(!t||p===0)return`<div class="hw-timeline">${h}</div>`;let x=new Map;for(let f of d){let b=((u=f.event_time)!=null?u:"").slice(0,10);x.has(b)||x.set(b,[]),x.get(b).push(f)}let v=[...x.entries()].map(([f,b])=>{let S=new Date(f+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),k=s.has(f),M=k?"\u25B6":"\u25BC",C=k?`<span class="hw-tl-day-count">${b.length} events</span>`:"",_=`
      <div class="hw-tl-day-row" data-tl-day="${F(f)}">
        <span class="hw-section-caret">${M}</span>
        <span class="hw-tl-date">${S}</span>
        ${C}
      </div>`,L=k?"":b.map((A,N)=>Io(A,N<b.length-1,o)).join("");return`<div class="hw-tl-group">${_}${L}</div>`}).join("");return`
    <div class="hw-timeline">
      ${h}
      ${v}
    </div>`}function Ro(e,o,t){var l;let s=(l=e.alerts_all)!=null?l:[],n=s.length,c=o?"\u25BC":"\u25B6",r=n>0?`SWPC Alerts (${n})`:"SWPC Alerts",i=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${c}</span>
        <span class="hw-alerts-label">${r}</span>
      </div>
    </div>`;if(!o||n===0)return`<div class="hw-alerts">${i}${o&&n===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let a=s.map(d=>Co(d,d.dedupe_key===t)).join("");return`
    <div class="hw-alerts">
      ${i}
      ${a}
    </div>`}function Oo(e,o){var P,X,B;let t=e.cme_tracker;if(!t)return"";let s=(P=ft[t.impact_level])!=null?P:"#96a8b8",n=(X=$t[t.status])!=null?X:t.status,c=300,r=44,i=18,a=r/2,l=10,d=c-18,p=7,g=`<line x1="${i+l}" y1="${a}" x2="${d-p}" y2="${a}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,m=`<circle cx="${i}" cy="${a}" r="${l}" fill="#f0c040" opacity="0.92"/>`,h=`
    <circle cx="${d}" cy="${a}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${a}" r="2.5" fill="#fff" opacity="0.7"/>`,x=`<text x="${i}" y="${a+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,v=`<text x="${d}" y="${a+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,$="";if(t.progress!=null){let G=i+l+4,W=d-p-4,H=G+t.progress*(W-G),R=5;t.status==="arrival_window"?$=`
        <g transform="translate(${H.toFixed(1)},${a})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${R}" fill="${s}" opacity="0.92"/>
        </g>`:$=`<circle cx="${H.toFixed(1)}" cy="${a}" r="${R}" fill="${s}" opacity="0.85"/>`}let u=`<svg class="hw-cme-svg" viewBox="0 0 ${c} ${r}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${g}
    ${m}${x}
    ${h}${v}
    ${$}
  </svg>`,f=Fe(t.arrival_time_utc),b=Fe(t.launch_time_utc),y=t.speed_kms!=null?`${Math.round(t.speed_kms)} km/s`:"\u2014",S=t.half_angle_deg!=null?`${t.half_angle_deg}\xB0`:"\u2014",k=(B=t.source_location)!=null?B:"\u2014",M=t.is_earth_direct?"Direct hit":"Glancing blow",C=t.progress!=null?`${Math.round(t.progress*100)}%`:"\u2014",_=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${w(f)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${s}">${w(y)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${s}">${w(t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${w(n)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${w(b)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${w(C)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${w(S)} \xB7 Source: ${w(k)} \xB7 ${w(M)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,L=o?"\u25BC":"\u25B6",A=t.impact_level==="unknown"?"Unrated":t.impact_level.charAt(0).toUpperCase()+t.impact_level.slice(1),N=o?`${u}${_}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${L}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${s}22;color:${s};margin-left:auto">${w(n)}</span>
        <span class="hw-cme-badge" style="background:${s}15;color:${s};margin-left:4px">${w(A)} impact</span>
      </div>
      ${N}
    </div>`}function To(e,o,t,s,n,c,r,i,a,l,d,p,g,m,h,x,v,$){var M;let u=Qt(e,s),f=(M=e.metrics.kp_history_1h)!=null?M:[],b=f.length?me(f[f.length-1].t_utc):null,y=b?`Recent history \xB7 Last step ${b}`:"Recent history",S=`<div style="padding:10px 14px;border-bottom:1px solid #1e2c30"><div class="hw-section-row" data-hero-toggle style="margin-bottom:0">
    <span class="hw-section-caret">${t?"\u25BC":"\u25B6"}</span>
    <span class="hw-section-label" style="margin-bottom:0">${F(y)}</span>
  </div></div>`,k=t?jt(e):"";return`
    <div class="hw-root">
      ${Wt(e)}
      ${Yt(e,t,u,v,$)}
      ${Mo(e,u,g,l,m,h,x,$,v)}
      ${S}
      ${k}
      ${Vt(e,s,u,p)}
      ${Oo(e,d)}
      ${Ao(e,r,i,a)}
      ${Ro(e,n,c)}
    </div>`}function zo(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${w(e)}</div>
    </div>
  </div>`}function No(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Ye="nc-helio-ui",Se=class{constructor(o,t){this.expanded=!1;this.heroExpanded=!1;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.abortController=new AbortController;this.destroyed=!1;this.clickHandler=o=>this.onClick(o);this.inputHandler=o=>this.onInput(o);this.changeHandler=o=>this.onChange(o);this.el=o,this.opts=t,this.loadUiState(),this.el.innerHTML=No(),this.el.addEventListener("click",this.clickHandler),this.el.addEventListener("input",this.inputHandler),this.el.addEventListener("change",this.changeHandler),this.fetch()}expandHeroLinkedPanels(o){for(let t of o)switch(t){case"storm_risk":this.expandedImpacts.add("geomag_storm");break;case"radio":this.expandedImpacts.add("radio");break;case"satellite_drag":this.expandedImpacts.add("sat_drag");break;case"gnss":this.expandedImpacts.add("gnss");break;case"aurora":this.expandedImpacts.add("aurora");break;case"xray":this.expandedImpacts.add("xray");break;case"solar":this.solarExpanded=!0;break;case"magnetosphere":this.expandedImpacts.add("magnetosphere");break;default:We()&&console.warn(`[Helio] Hero chip nav: unknown section id "${t}"`)}}collapseHeroLinkedPanels(o){for(let t of o)switch(t){case"storm_risk":this.expandedImpacts.delete("geomag_storm");break;case"radio":this.expandedImpacts.delete("radio");break;case"satellite_drag":this.expandedImpacts.delete("sat_drag");break;case"gnss":this.expandedImpacts.delete("gnss");break;case"aurora":this.expandedImpacts.delete("aurora");break;case"xray":this.expandedImpacts.delete("xray");break;case"solar":this.solarExpanded=!1;break;case"magnetosphere":this.expandedImpacts.delete("magnetosphere");break;default:break}}heroDomIdExpanded(o){switch(o){case"storm_risk":return this.expandedImpacts.has("geomag_storm");case"radio":return this.expandedImpacts.has("radio");case"satellite_drag":return this.expandedImpacts.has("sat_drag");case"gnss":return this.expandedImpacts.has("gnss");case"aurora":return this.expandedImpacts.has("aurora");case"xray":return this.expandedImpacts.has("xray");case"solar":return this.solarExpanded;case"magnetosphere":return this.expandedImpacts.has("magnetosphere");default:return!1}}heroChipLinkedAllOpen(o){if(!this.impactsOpen)return!1;for(let t of Ie[o])if(!this.heroDomIdExpanded(t))return!1;return!0}onClick(o){var l,d,p,g,m;let t=o.target,s=t.closest("[data-hero-chip]");if(s){let h=s.dataset.heroChip;if(h==="G"||h==="R"||h==="S"||h==="X"){let x=Ie[h];if(this.heroChipLinkedAllOpen(h)){this.collapseHeroLinkedPanels(x),this.saveUiState(),this.render();return}this.impactsOpen=!0,this.expandHeroLinkedPanels(x),this.saveUiState(),this.render(),requestAnimationFrame(()=>requestAnimationFrame(()=>kt(x)))}return}if(t.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(t.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.saveUiState(),this.render();return}if(t.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.saveUiState(),this.render();return}if(t.closest("[data-chain-col='earth']")){this.impactsOpen=!0,this.expandedImpacts.has("aurora")&&this.expandedImpacts.has("geomag_storm")?(this.expandedImpacts.delete("aurora"),this.expandedImpacts.delete("geomag_storm")):(this.expandedImpacts.add("aurora"),this.expandedImpacts.add("geomag_storm")),this.saveUiState(),this.render();return}let n=t.closest("[data-impact-row]");if(n){let h=(l=n.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(h)?this.expandedImpacts.delete(h):this.expandedImpacts.add(h),this.saveUiState(),this.render();return}let c=t.closest("[data-solar-layer]");if(c){let h=(d=c.dataset.solarLayer)!=null?d:"";this.solarLayers.has(h)?this.solarLayers.delete(h):this.solarLayers.add(h),this.saveUiState(),this.render();return}if(t.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.saveUiState(),this.render();return}if(t.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.saveUiState(),this.render();return}let r=t.closest("[data-alert-key]");if(r){let h=(p=r.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===h?null:h,this.render();return}if(t.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let h=Date.now();this.collapsedDays=new Set([new Date(h).toISOString().slice(0,10),new Date(h-864e5).toISOString().slice(0,10),new Date(h-1728e5).toISOString().slice(0,10)])}this.saveUiState(),this.render();return}let i=t.closest("[data-tl-day]");if(i){let h=(g=i.dataset.tlDay)!=null?g:"";this.collapsedDays.has(h)?this.collapsedDays.delete(h):this.collapsedDays.add(h),this.saveUiState(),this.render();return}let a=t.closest("[data-timeline-key]");if(a){let h=(m=a.dataset.timelineKey)!=null?m:null;this.expandedTimelineKey=this.expandedTimelineKey===h?null:h,this.render();return}if(t.closest(".hw-kpi-close")){let h=t.closest("[data-impact-row]"),x=h==null?void 0:h.dataset.impactRow;x&&this.expandedImpacts.delete(x),this.saveUiState(),this.render();return}if(t.closest(".hw-toggle")){this.expanded=!this.expanded,this.saveUiState(),this.render();return}t.closest("[data-hero-toggle]")&&(this.heroExpanded=!this.heroExpanded,this.saveUiState(),this.render())}onInput(o){let t=o.target;if(!t.matches("[data-scrub]"))return;let s=parseFloat(t.value);this.scrubOffset=s,t.style.setProperty("--pct",`${(s/parseFloat(t.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=s>0?`\u23F1 +${Math.round(s)}h`:"Timeline")}onChange(o){o.target.matches("[data-scrub]")&&this.render()}async fetch(){var o;try{let t=this.opts.dataUrl.includes("?")?"&":"?",s=`${this.opts.dataUrl}${t}_t=${Date.now()}`,n=await fetch(s,{signal:this.abortController.signal});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(t){if(this.abortController.signal.aborted||this.destroyed)return;let s=t instanceof Error?t.message:String(t);this.el.innerHTML=zo(`Space weather data unavailable (${s})`)}finally{this.destroyed||(this.timer=setTimeout(()=>this.fetch(),(o=this.opts.refreshMs)!=null?o:6e5))}}async fetchSolarRegions(){try{let o=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json",{signal:this.abortController.signal});if(!o.ok)return;let t=await o.json(),s=new Map;for(let n of t){let c=s.get(n.region),r=n.area!=null,i=(c==null?void 0:c.area)!=null;(!c||!i&&r||i===r&&n.observed_date>c.observed_date)&&s.set(n.region,n)}this.solarRegions=[...s.values()],this.render()}catch(o){}}async fetchOvationData(){var o,t,s,n,c,r;if(!(this.opts.lat==null||this.opts.lon==null))try{let i=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",{signal:this.abortController.signal});if(!i.ok)return;let a=await i.json(),d=((s=(t=(o=a.coordinates)!=null?o:a.Data)!=null?t:a.data)!=null?s:[]).map(([p,g,m])=>({lon:p,lat:g,prob:m}));this.ovationData={entries:d,forecastTime:String((r=(c=(n=a["Forecast Time"])!=null?n:a.forecast_time)!=null?c:a["Observation Time"])!=null?r:"")},this.render()}catch(i){}}render(){this.data&&(this.el.innerHTML=To(this.data,this.expanded,this.heroExpanded,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}saveUiState(){try{localStorage.setItem(Ye,JSON.stringify({expanded:this.expanded,heroExpanded:this.heroExpanded,alertsExpanded:this.alertsExpanded,timelineOpen:this.timelineOpen,collapsedDays:[...this.collapsedDays],impactsOpen:this.impactsOpen,cmeExpanded:this.cmeExpanded,forecastOpen:this.forecastOpen,solarExpanded:this.solarExpanded,solarLayers:[...this.solarLayers],expandedImpacts:[...this.expandedImpacts]}))}catch(o){}}loadUiState(){try{let o=localStorage.getItem(Ye);if(!o)return;let t=JSON.parse(o);typeof t.expanded=="boolean"&&(this.expanded=t.expanded),typeof t.heroExpanded=="boolean"&&(this.heroExpanded=t.heroExpanded),typeof t.alertsExpanded=="boolean"&&(this.alertsExpanded=t.alertsExpanded),typeof t.timelineOpen=="boolean"&&(this.timelineOpen=t.timelineOpen),typeof t.impactsOpen=="boolean"&&(this.impactsOpen=t.impactsOpen),typeof t.cmeExpanded=="boolean"&&(this.cmeExpanded=t.cmeExpanded),typeof t.forecastOpen=="boolean"&&(this.forecastOpen=t.forecastOpen),typeof t.solarExpanded=="boolean"&&(this.solarExpanded=t.solarExpanded),Array.isArray(t.collapsedDays)&&(this.collapsedDays=new Set(t.collapsedDays)),Array.isArray(t.solarLayers)&&(this.solarLayers=new Set(t.solarLayers)),Array.isArray(t.expandedImpacts)&&(this.expandedImpacts=new Set(t.expandedImpacts))}catch(o){}}updateLocation(o,t,s){this.opts=he(pe({},this.opts),{lat:o,lon:t,locationName:s}),this.render()}destroy(){this.destroyed||(this.destroyed=!0,this.timer&&clearTimeout(this.timer),this.abortController.abort(),this.el.removeEventListener("click",this.clickHandler),this.el.removeEventListener("input",this.inputHandler),this.el.removeEventListener("change",this.changeHandler))}},it={mount(e,o){return Ct(),new Se(e,o)}};typeof window!="undefined"&&(window.HelioWidget=it);return wt(Po);})();
