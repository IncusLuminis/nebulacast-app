"use strict";var HelioWidgetModule=(()=>{var Z=Object.defineProperty;var we=Object.getOwnPropertyDescriptor;var xe=Object.getOwnPropertyNames;var fe=Object.prototype.hasOwnProperty;var be=(e,t)=>{for(var n in t)Z(e,n,{get:t[n],enumerable:!0})},ve=(e,t,n,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of xe(t))!fe.call(e,i)&&i!==n&&Z(e,i,{get:()=>t[i],enumerable:!(a=we(t,i))||a.enumerable});return e};var $e=e=>ve(Z({},"__esModule",{value:!0}),e);var mt={};be(mt,{HelioWidget:()=>ue});var te={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},ye={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},ke={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},se={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},_e={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},Me={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function Le(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let n=Math.floor(t/60);return n<24?`Updated ${n}h ago`:`Updated ${Math.floor(n/24)}d ago`}catch(t){return"Updated recently"}}function Se(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function ne(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function W(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function ae(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function B(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ce(e){return parseInt(e.slice(1),10)>0}var ze=`
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
.hw-impact-tip{flex-basis:100%;font-size:.72em;color:#96a8b8;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px}
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
`,re=!1;function He(){if(re)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=ze,document.head.appendChild(e),re=!0}function Ae(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,a=e.length,i=t/a,o=e.map((s,l)=>{let r=Math.max(2,Math.min(n,s.kp/9*n)),d=n-r,c=l*i,u=s.kp>=6?"#e05c5c":s.kp>=5?"#e0a84a":s.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${d.toFixed(1)}" width="${(i-1).toFixed(1)}" height="${r.toFixed(1)}" fill="${u}" rx="1"><title>Kp ${s.kp.toFixed(1)} \xB7 ${h(W(s.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">${o}</svg>`}function G(e,t,n,a,i){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let o=200,s=Math.min(...e),l=Math.max(...e),r=l-s||1,d=g=>a-2-(g-s)/r*(a-4),c=e.map((g,f)=>`${(f/(e.length-1)*o).toFixed(1)},${d(g).toFixed(1)}`).join(" "),u="";if(i&&s<0&&l>0){let g=d(0);u=`<line x1="0" y1="${g.toFixed(1)}" x2="${o}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let w=e.map((g,f)=>`<rect x="${(f/(e.length-1)*o-4).toFixed(1)}" y="0" width="8" height="${a}" fill="transparent"><title>${h(t[f]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${o} ${a}" style="width:100%;height:${a}px;display:block" preserveAspectRatio="none">
    ${u}
    <polyline points="${c}" fill="none" stroke="${n}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${w}
  </svg>`}function Te(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,a=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),i=Math.min(...a),s=Math.max(...a)-i||1,l=c=>n-2-(c-i)/s*(n-4),r=a.map((c,u)=>`${(u/(a.length-1)*t).toFixed(1)},${l(c).toFixed(1)}`).join(" "),d=e.map((c,u)=>{let w=u/(a.length-1)*t,g=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(w-4).toFixed(1)}" y="0" width="8" height="${n}" fill="transparent"><title>${h(W(c.t_utc))} \xB7 ${g}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">
    <polyline points="${r}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${d}
  </svg>`}function K(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Ee(e){var l;let t=(l=e.metrics.wind_history_1h)!=null?l:[],n=G(t.map(r=>{var d;return(d=r.kms)!=null?d:0}).filter(r=>r>0),t.map(r=>W(r.t_utc)),"#5cce8c",36,!1),a=t[t.length-1],i=(a==null?void 0:a.density)!=null?`${a.density.toFixed(2)} cm\u207B\xB3`:"\u2014",o=(a==null?void 0:a.temp_kk)!=null?`${a.temp_kk.toFixed(0)} kK`:"\u2014",s=(a==null?void 0:a.pressure_npa)!=null?`${a.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${K("Solar Wind \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${h(o)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${h(s)}</span>
      </div>
    </div>
  </div>`}function Fe(e){var d,c,u;let t=(d=e.metrics.xray_history_1h)!=null?d:[],n=Te(t),a=(c=e.metrics.xray_class)!=null?c:"A",i=e.metrics.xray_flux_wm2,o=i!=null?i.toExponential(2)+" W/m\xB2":"\u2014",s=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],l=s.map(w=>{let g=w.label===a,f=g?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${w.color}${g?"cc":"44"}">${f}</div>`}).join(""),r=s.map(w=>`<div class="hw-xray-scale-label" style="color:${w.label===a?"#c8d8dc":"#607880"}">${w.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${K("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${l}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(u=se[a])!=null?u:"#a0b4b8"}">${h(a)}-class</b> \xB7 ${h(o)}</div>
  </div>`}function Oe(e){var s;let t=(s=e.metrics.bz_history_5m)!=null?s:[],n=G(t.map(l=>l.bz),t.map(l=>W(l.t_utc)),"#d4cc5c",36,!0),a=e.metrics.imf_bz_nt,i=a!=null?a<=-10?"#e05c5c":a<=-5?"#e0a84a":a>=5?"#5cce8c":"#a0b4b8":"#607880",o=a!=null?(a>=0?"+":"")+a.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${K("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${i}">${h(o)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function oe(e){var r,d;let t=e.metrics.imf_bz_nt,n=(r=e.metrics.kp_latest)!=null?r:0,a=(d=e.metrics.solar_wind_kms)!=null?d:0,i,o,s;if(t!=null&&t<-5||n>=6)i="storm",o="#e05c5c",s="Storm conditions";else if(t!=null&&t<0||n>=4||a>=400){let c=t!=null&&t<0;i="active",o="#e0a84a",s=c?"Active coupling":"Elevated"}else i="stable",o="#5cce8c",s="Stable";let l;return t==null?l="Unknown":t>2?l="Closed":t>0?l="Minimal":t>-5?l="Moderate":t>-10?l="Strong":l="Very strong",{state:i,color:o,label:s,coupling:l}}function le(e,t,n,a){let i=a?"mc":"mf",o=e.color,s=n!=null?n:0,l=s>500,r=s<350,d=l?.9:r?1.8:1.3;if(a){let f=45-(e.state==="storm"?11:e.state==="active"?16:21),p=e.state==="storm"?12:e.state==="active"?10:8,_=50-p,v=76,m=[`M ${f},25`,`C ${f-2},15 41,${p} 45,${p}`,`C 53,${p} ${v-8},${p+4} ${v},20`,`C ${v+1},23 ${v+1},27 ${v},30`,`C ${v-8},${_-4} 53,${_} 45,${_}`,`C 41,${_} ${f-2},35 ${f},25`,"Z"].join(" "),x=l?3:2,$=[14,25,36],A=y=>`<path d="M 0,${y} L ${l?8:6},${y} M ${l?6:4},${y-2} L ${l?8:6},${y} L ${l?6:4},${y+2}" stroke="${o}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,S=$.map(y=>A(y)).join(""),C=Array.from({length:x},(y,F)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/x*F).toFixed(2)}s">${S}</g>`).join(""),E=t==null?"":t>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${i}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${i}-wclip)">${C}</g>
      <path d="${m}" fill="${o}14" stroke="${o}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${E}
    </svg>`}else{let v=e.state==="storm"?16:e.state==="active"?26:38,m=155-v,x=e.state==="storm"?22:e.state==="active"?30:40,$=120-x,A=240,S=[`M ${m},60`,`C ${m-4},42 150,${x} 155,${x}`,`C 173,${x} ${A-5},${x+18} ${A},60`,`C ${A-5},${$-18} 173,${$} 155,${$}`,`C 150,${$} ${m-4},78 ${m},60`,"Z"].join(" "),C=`M ${m+2},60 C ${m+2},${60-v*.4} 152,54 150,60 C 152,66 ${m+2},${60+v*.4} ${m+2},60 Z`,E=s>700?"#e05c5c":s>500?"#e0a84a":s>350?"#d4c840":"#5cce8c",y=s>700?.4:s>500?.65:s>350?1.1:1.8,F=s>500?[10,24,40,57,74,90,106]:s>350?[14,34,57,82,104]:[20,50,82,108],T=16,z=22,H=m-6,O=Math.ceil((H-z)/T)+2,k=Array.from({length:O},(N,P)=>z-T+P*T),b=12,M=8,L=k.flatMap(N=>F.map(P=>`<path d="M ${N},${P} L ${N+b},${P} M ${N+M},${P-3} L ${N+b},${P} L ${N+M},${P+3}" stroke="${E}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),R=`<g class="hw-wg-full" style="animation-duration:${y}s">${L}</g>`,D=t==null?"":t>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',j=t==null?"":`<text x="163" y="62" font-size="6" fill="${t>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${t>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${i}-wclip"><rect x="${z}" y="0" width="${H-z}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${i}-wclip)">${R}</g>
      <path d="${C}" fill="${o}08"/>
      <path d="${S}" fill="${o}12" stroke="${o}aa" stroke-width="1.2"/>
      <text x="${m+2}" y="${x-2}" font-size="7" fill="${o}" opacity=".8" font-family="sans-serif">${h(e.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${D}
      ${j}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function Ie(e){let t=oe(e),n=e.metrics.imf_bz_nt,a=e.metrics.solar_wind_kms,i=e.metrics.kp_latest,o=e.metrics.density,s=e.metrics.pressure_npa,l=n!=null?(n>=0?"+":"")+n.toFixed(1)+" nT":"\u2014",r=a!=null?`${Math.round(a)} km/s`:"\u2014",d=o!=null?`${o.toFixed(1)} p/cm\xB3`:"\u2014",c=s!=null?`${s.toFixed(2)} nPa`:"\u2014",u=n!=null?n<=-10?"#e05c5c":n<=-5?"#e0a84a":n>=5?"#5cce8c":"#a0b4b8":"#607880",w=a!=null?a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c":"#607880",g=n!=null&&n<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":n!=null&&n<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${K("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${le(t,n,a,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${w}">${h(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${u}">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${h(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(d)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${h(g)}</div>
  </div>`}function ce(e,t,n){if(!e.length)return null;let a=(n%360+360)%360,i=-1,o=1/0,s=Math.cos(t*Math.PI/180);for(let l of e){let r=l.lat-t,d=(l.lon-a+180+360)%360-180,c=r*r+d*s*(d*s);c<o&&(o=c,i=l.prob)}return i>=0?i:null}function de(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Re(e,t){let n=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,a=null;t&&e.lat!=null&&e.lon!=null&&(a=ce(t.entries,e.lat,e.lon));let i=e.lat!=null&&e.lon!=null,o=a!=null?a>=30?"#5cce8c":a>=10?"#d4cc5c":"#9ab4bc":"#607880",s=a!=null?`${a}%`:t?"n/a":"\u2026",l=i?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?h(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${o}">Aurora: ${s}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${K("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${B(n)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${de(e)}
    </div>
    ${l}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Pe(e,t,n,a){switch(t){case"solar_wind":return Ee(e);case"xray":return Fe(e);case"imf_bz":return Oe(e);case"aurora":return Re(n,a);case"magnetosphere":return Ie(e);default:return""}}function q(e,t){if(e.length<2)return"\u2192";let n=e[e.length-1],a=Math.max(0,e.length-4),i=e[a];if(!isFinite(n)||!isFinite(i))return"\u2192";let o=n-i;return o>t?"\u2191":o<-t?"\u2193":"\u2192"}function De(e,t,n,a,i,o){var D,j,N,P,V,U,J;let{summary:s,scales:l,metrics:r,aurora_hint:d}=e,c=(D=te[s.status])!=null?D:te.quiet,u=a!=null?a.kp.toFixed(1):r.kp_latest!=null?r.kp_latest.toFixed(1):"\u2014",g=[a?a.gScale:l.g_scale,l.r_scale,l.s_scale].map(I=>{let X=Ce(I),Y=X?`color:${c.accent};border-color:${c.accent}33`:"";return`<span class="hw-scale-chip${X?" hw-scale-active":""}" style="${Y}">${h(I)}</span>`}).join(""),f=a?a.auroraLabel:d.aurora_label,p=f==="good"?"#5cce8c":f==="possible"?"#d4cc5c":"#607880",_=f.charAt(0).toUpperCase()+f.slice(1),v="#b4c6cc",m=r.solar_wind_kms!=null?`${Math.round(r.solar_wind_kms)} km/s`:"\u2014",x=r.imf_bz_nt,$=x!=null?x<=-10?"#e05c5c":x<=-5?"#e0a84a":x>=5?"#5cce8c":"#a0b4b8":"#607880",A=x!=null?(x>=0?"+":"")+x.toFixed(1)+" nT":"\u2014",S=r.xray_class,C=S?(j=se[S])!=null?j:"#a0b4b8":"#607880",E=S?`${S}-class`:"\u2014",y=q(((N=r.kp_history_1h)!=null?N:[]).map(I=>I.kp),.5),F=q(((P=r.wind_history_1h)!=null?P:[]).map(I=>I.kms),20),T=q(((V=r.bz_history_1h)!=null?V:[]).map(I=>I.bz),1.5),z=q(((U=r.xray_history_1h)!=null?U:[]).map(I=>Math.log10(I.flux+1e-9)),.15),H=t?"\u25BC Details":"\u25B6 Details",O=oe(e),k=(J=r.kp_latest)!=null?J:0,b=k>=5,M=b?`linear-gradient(160deg, #0d2a1a 0%, ${c.bg}22 75%)`:`${c.bg}18`,L=(I,X,Y,me,ee)=>{let ge=ee?`<span class="hw-trend">${ee}</span>`:"";return`<div class="hw-kpi-item${n===I?" hw-kpi-active":""}" data-kpi="${I}">
      <span class="hw-qd-label">${X}</span>
      <span class="hw-qd-value" style="color:${me}">${Y}${ge}</span>
    </div>`},R=b?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${k.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${M}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${a?"color:#9acf60":""}">Kp <b>${h(u)}</b>${a?"":`<span class="hw-trend">${y}</span>`}</div>
          <span class="hw-status-badge" style="background:${c.accent}22;color:${c.accent};display:block;text-align:center">${h(s.label)}</span>
          <div class="hw-scales-row">${g}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${h(s.text)}</div>
            <div class="hw-magnet-mini${n==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${le(O,x,r.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${O.color}">${h(O.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${L("aurora","Aurora",h(_),p)}
        ${L("solar_wind","Solar wind",h(m),v,F)}
        ${L("imf_bz","IMF Bz",h(A),$,T)}
        ${L("xray","X-ray",h(E),C,z)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${H}</button>
      ${R}
      ${n?Pe(e,n,i,o):""}
    </div>`}function Ne(e){var r,d,c;let{metrics:t}=e,n=(r=t.kp_history_1h)!=null?r:[],a=(d=t.wind_history_1h)!=null?d:[],i=(c=t.bz_history_1h)!=null?c:[],o=Ae(n),s=G(a.map(u=>{var w;return(w=u.kms)!=null?w:0}).filter(u=>u>0),a.map(u=>W(u.t_utc)),"#5cce8c",28,!1),l=G(i.map(u=>u.bz),i.map(u=>W(u.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${o}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
    </div>`}function Be(e){let t=Le(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${h(t)}</span>
    </div>`}function je(e){return e.map((t,n)=>n===0?(t+e[1])/2:n===e.length-1?(e[n-1]+t)/2:(e[n-1]+t+e[n+1])/3)}function We(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Ke(e){return e>=5?"good":e>=3?"possible":"none"}function pe(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ue(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",n=pe(e),a=t==="none"?"No aurora expected at mid-latitudes":n!=null?`Aurora possible equatorward of ~${n}\xB0 lat`:"Minor aurora possible at high latitudes",i=e>=7?"moderate":e>=5?"low":"none",o=i==="none"?"No significant HF degradation expected":i==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",s=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:a},{kind:"radio",level:i,label:"HF Radio",summary:o},{kind:"solar_activity",level:s,label:"Solar Activity",summary:s==="none"?"Quiet geomagnetic conditions expected":s==="low"?"Active geomagnetic conditions possible":s==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Xe(e,t){var u;if(t<=0)return null;let n=(u=e.metrics.kp_forecast_3h)!=null?u:[];if(!n.length)return null;let a=Date.now()+t*36e5,i=n[0],o=1/0;for(let w of n){let g=Math.abs(new Date(w.t_utc).getTime()-a);g<o&&(o=g,i=w)}let s=i.kp,l=We(s),r=Ke(s),d=pe(s),c=Ue(s);return{offsetH:t,kp:s,gScale:l,auroraLabel:r,auroraMinLat:d,impacts:c}}function qe(e,t,n){var k;let{forecast:a,metrics:i}=e,{kp_max_next_24h:o,kp_max_at_utc:s,trend:l}=a,r=((k=i.kp_forecast_3h)!=null?k:[]).slice(0,16),d=r.length,c=d*3,u=c>0?`${(t/c*100).toFixed(0)}%`:"0%",w=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",g="Kp forecast unavailable";if(o!=null){let b=ne(s),M=l==="rising"?"rising":l==="falling"?"falling":"steady";g=`Peak Kp ${o.toFixed(1)} next 24h${b?` at ${b}`:""} \xB7 ${M}`}if(!r.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${h(g)}</div>
    </div>`;let f=320,p=38,_=14,v=p+_,m=f/d,x=b=>p-Math.max(2,Math.min(p-2,b/9*(p-2))),$="",A=r.map(b=>b.kp),S=je(A);r.forEach((b,M)=>{let L=x(b.kp),R=p-L,D=M*m,j=D+m/2,N=b.kp>=6?"#e05c5c":b.kp>=5?"#e0a84a":b.kp>=4?"#d4cc5c":"#5cce8c",P=`Kp ${b.kp.toFixed(1)} \xB7 ${ne(b.t_utc)}`;if($+=`<rect x="${D.toFixed(1)}" y="${L.toFixed(1)}" width="${(m-1.5).toFixed(1)}" height="${R.toFixed(1)}" fill="${N}" fill-opacity="0.85" rx="1.5"/>`,$+=`<rect x="${D.toFixed(1)}" y="0" width="${m.toFixed(1)}" height="${p}" fill="transparent"><title>${B(P)}</title></rect>`,d<=8||M%2===0){let U=new Date(b.t_utc).getHours();$+=`<text x="${j.toFixed(1)}" y="${(v-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${U.toString().padStart(2,"0")}</text>`}});let E=`<polyline points="${r.map((b,M)=>{let L=M*m+m/2,R=x(S[M]);return`${L.toFixed(1)},${R.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,y="";if(t>0&&d>0){let b=Math.min(f-1,t/(d*3)*f);y=`
      <line x1="${b.toFixed(1)}" y1="0" x2="${b.toFixed(1)}" y2="${p}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${b.toFixed(1)},${p} ${(b-4).toFixed(1)},${(p-7).toFixed(1)} ${(b+4).toFixed(1)},${(p-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let F=Math.round(c/4),T=Math.round(c/2),z=Math.round(c*3/4),H=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${h(w)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${u}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${F}h</span>
        <span class="hw-scrub-tick">+${T}h</span>
        <span class="hw-scrub-tick">+${z}h</span>
        <span class="hw-scrub-tick">+${c}h</span>
      </div>
    </div>`;return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      ${n?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(n.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${n.kp.toFixed(1)} \xB7 ${n.gScale}</span>
    </div>`:""}
      <div class="hw-forecast-text">${h(g)}</div>
      <svg viewBox="0 0 ${f} ${v}" style="width:100%;height:${v}px;display:block" preserveAspectRatio="none">
        ${$}
        ${E}
        ${y}
      </svg>
      ${H}
    </div>`}function Ge(e){let t=/([NS])(\d+)([EW])(\d+)/i.exec(e);return t?{lat:(t[1].toUpperCase()==="N"?1:-1)*parseInt(t[2],10),lon:(t[3].toUpperCase()==="E"?1:-1)*parseInt(t[4],10)}:null}var he=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Ve(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function Ye(e,t,n){let a=t/2,i=a*.87,o=t*.03,s=t*.009,l=e.map(r=>{var v,m;let d=Ge(r.location);if(!d||Math.abs(d.lon)>88||r.location.includes("*"))return"";let c=Ve(r);if(!n.has(c))return"";let u=he.find(x=>x.id===c).color,w=d.lat*Math.PI/180,g=d.lon*Math.PI/180,f=(a+i*Math.cos(w)*Math.sin(g)).toFixed(1),p=(a-i*Math.sin(w)).toFixed(1),_=`AR ${r.region} \xB7 ${r.location}
Class: ${(v=r.spot_class)!=null?v:"\u2014"} / ${(m=r.mag_class)!=null?m:"\u2014"}
C: ${r.c_flare_probability}%  M: ${r.m_flare_probability}%  X: ${r.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${h(_)}</title>
      <circle cx="${f}" cy="${p}" r="${(o+s+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(s*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${f}" cy="${p}" r="${o.toFixed(1)}" fill="none" stroke="${u}" stroke-width="${s.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Ze={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Qe='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Je="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",et=240;function tt(e,t,n,a,i,o,s,l,r){var _,v;let d=(v=(_=t==null?void 0:t.impacts)!=null?_:e.observer_impacts)!=null?v:[],c=d.map(m=>{var T,z;let x=(T=ye[m.level])!=null?T:"#666",$=m.level==="none"?"None":m.level.charAt(0).toUpperCase()+m.level.slice(1),A=(z=Ze[m.kind])!=null?z:Qe,S=m.level==="none"?"#606870":x,C=m.kind==="solar_activity"?i:s.has(m.kind),E=C?" hw-impact-open":"",y;if(m.kind==="solar_activity"){let H=i?" hw-solar-open":"",O=he.map(k=>{let b=o.has(k.id),M=b?k.color+"22":"transparent",L=b?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${k.id}" style="color:${k.color};border-color:${k.color};background:${M};opacity:${L}">${k.label}</button>`}).join("");y=`<div class="hw-solar-tip${H}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Je}" alt="Solar disk" loading="lazy" />
            ${n?Ye(n,et,o):""}
          </div>
          <div class="hw-solar-layers">${O}</div>
          <span class="hw-solar-tip-text">${h(m.summary)}</span>
        </div>`}else if(m.kind==="aurora"){let H=C?" hw-aurora-tip-open":"",O=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,k=null;l&&r.lat!=null&&r.lon!=null&&(k=ce(l.entries,r.lat,r.lon));let b=r.lat!=null&&r.lon!=null,M=k!=null?k>=30?"#5cce8c":k>=10?"#d4cc5c":"#9ab4bc":"#607880",L=k!=null?`${k}%`:l?"n/a":"\u2026",R=b?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${r.locationName?h(r.locationName)+" \xB7 ":""}${r.lat.toFixed(1)}\xB0${r.lat>=0?"N":"S"} ${Math.abs(r.lon).toFixed(1)}\xB0${r.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${M}">Aurora: ${L}</span>
        </div>`:"";y=`<div class="hw-aurora-tip${H}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${B(O)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${de(r)}
          </div>
          ${R}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else y=`<div class="hw-impact-tip${C?" hw-impact-tip-open":""}">${h(m.summary)}</div>`;let F=m.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${B(m.kind)}"`;return`<div class="hw-impact-row${E}"${F}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${S}">${A}<span style="color:#b4c6cc">${h(m.label)}</span></span>
      <span class="hw-impact-badge" style="background:${x}22;color:${x}">${h($)}</span>
      ${y}
    </div>`}).join(""),u=t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",w=d.length,g=a?"\u25BC":"\u25B6",f=w>0?`Observer Impacts (${w})`:"Observer Impacts";return`
    <div class="hw-impacts">
      ${`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${g}</span>
      <span class="hw-section-label" style="margin-bottom:0">${f}${u}</span>
    </div>`}
      ${a?c:""}
    </div>`}var ie={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function nt(e,t){var r,d;let n=(r=ke[e.level])!=null?r:"#666",a=e.level.charAt(0).toUpperCase()+e.level.slice(1),i=(d=ie[e.kind])!=null?d:ie.unknown,o=[Se(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),s=t&&e.raw_body?`<div class="hw-alert-body">${h(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${n}" data-alert-key="${B(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${n}">${i}</span>
      <span class="hw-alert-level" style="color:${n}">${h(a)}</span>
      <span class="hw-alert-title">${h(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${h(e.summary_short)}</div>
    <div class="hw-alert-meta">${h(o)}</div>
    ${s}
  </div>`}var at={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},rt="#4ae0a4";function it(e){let t=(n,a="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${a}>${n}</svg>`;switch(e){case"solar_flare":return t(`<circle cx="6.5" cy="6.5" r="2.5"/>
        <line x1="6.5" y1="1" x2="6.5" y2="3"/>
        <line x1="6.5" y1="10" x2="6.5" y2="12"/>
        <line x1="1" y1="6.5" x2="3" y2="6.5"/>
        <line x1="10" y1="6.5" x2="12" y2="6.5"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="8.9" y1="8.9" x2="10.3" y2="10.3"/>
        <line x1="10.3" y1="2.7" x2="8.9" y2="4.1"/>
        <line x1="4.1" y1="8.9" x2="2.7" y2="10.3"/>`);case"cme_launch":return t(`<line x1="1" y1="6.5" x2="10" y2="6.5"/>
        <polyline points="7,3.5 10,6.5 7,9.5"/>
        <line x1="1" y1="4.5" x2="6" y2="4.5" stroke-opacity=".5"/>
        <line x1="1" y1="8.5" x2="6" y2="8.5" stroke-opacity=".5"/>`);case"cme_arrival":return t(`<path d="M11,6.5 A4.5,4.5 0 0,1 2,6.5" stroke-opacity=".4"/>
        <path d="M9.5,6.5 A3,3 0 0,1 3.5,6.5" stroke-opacity=".7"/>
        <path d="M8,6.5 A1.5,1.5 0 0,1 5,6.5"/>
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>`);case"geomagnetic_storm":return t('<polyline points="8,1.5 5,6.5 7.5,6.5 5,11.5"/>');case"geomagnetic_watch":return t(`<circle cx="6.5" cy="6.5" r="5"/>
        <line x1="6.5" y1="3.5" x2="6.5" y2="6.5"/>
        <line x1="6.5" y1="6.5" x2="9" y2="7.5"/>`);case"radio_blackout":return t(`<path d="M3,3.5 Q6.5,6.5 10,9.5" stroke-opacity=".5"/>
        <path d="M10,3.5 Q6.5,6.5 3,9.5"/>
        <line x1="5" y1="1" x2="8" y2="12" stroke-opacity=".3"/>`);case"radiation_storm":return t(`<path d="M6.5,1.5 L12,11 L1,11 Z"/>
        <line x1="6.5" y1="5" x2="6.5" y2="8"/>
        <circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/>`);default:return t(`<circle cx="6.5" cy="6.5" r="5.5"/>
        <line x1="6.5" y1="5.5" x2="6.5" y2="9"/>
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function st(e){var a;let t=(a=e.metadata)!=null?a:{},n=[];return t.source_code&&n.push(`Code: ${t.source_code}`),t.model&&n.push(`Model: ${String(t.model).toUpperCase()}`),n.length===0?"":`
${n.join(" \xB7 ")}`}function ot(e,t,n){var r;let a=e.is_active?rt:(r=at[e.level])!=null?r:"#445c64",i=e.event_time===n,o=e.event_time.slice(11,16)+" UTC",s=e.source==="NASA_DONKI"?"DONKI":"SWPC",l=i?`<div class="hw-tl-detail">${h(e.description)}${h(st(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${B(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${a}"></div>
        ${t?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${o}</span>
          <span class="hw-tl-src">${s}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${it(e.event_type)} ${h(e.event_title)}
        </div>
        ${l}
      </div>
    </div>`}function lt(e,t,n,a){var v,m;let i=(v=e.timeline)!=null?v:[],o=Date.now(),s=new Date(o).toISOString().slice(0,10),l=new Date(o-864e5).toISOString().slice(0,10),r=new Date(o-1728e5).toISOString().slice(0,10),d=new Set([s,l,r]),c=i.filter(x=>{var $;return d.has((($=x.event_time)!=null?$:"").slice(0,10))}).slice().reverse(),u=c.length,w=n?"\u25BC":"\u25B6",g=u>0?`Solar Activity Timeline (${u})`:"Solar Activity Timeline",f=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${w}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}</span>
    </div>`;if(!n||u===0)return`<div class="hw-timeline">${f}</div>`;let p=new Map;for(let x of c){let $=((m=x.event_time)!=null?m:"").slice(0,10);p.has($)||p.set($,[]),p.get($).push(x)}let _=[...p.entries()].map(([x,$])=>{let S=new Date(x+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),C=a.has(x),E=C?"\u25B6":"\u25BC",y=C?`<span class="hw-tl-day-count">${$.length} events</span>`:"",F=`
      <div class="hw-tl-day-row" data-tl-day="${B(x)}">
        <span class="hw-section-caret">${E}</span>
        <span class="hw-tl-date">${S}</span>
        ${y}
      </div>`,T=C?"":$.map((z,H)=>ot(z,H<$.length-1,t)).join("");return`<div class="hw-tl-group">${F}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${f}
      ${_}
    </div>`}function ct(e,t,n){var d;let a=(d=e.alerts_all)!=null?d:[],i=a.length,o=t?"\u25BC":"\u25B6",s=i>0?`SWPC Alerts (${i})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${o}</span>
        <span class="hw-alerts-label">${s}</span>
      </div>
    </div>`;if(!t||i===0)return`<div class="hw-alerts">${l}${t&&i===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let r=a.map(c=>nt(c,c.dedupe_key===n)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${r}
    </div>`}function dt(e,t){var O,k,b;let n=e.cme_tracker;if(!n)return"";let a=(O=_e[n.impact_level])!=null?O:"#96a8b8",i=(k=Me[n.status])!=null?k:n.status,o=300,s=44,l=18,r=s/2,d=10,c=o-18,u=7,w=`<line x1="${l+d}" y1="${r}" x2="${c-u}" y2="${r}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,g=`<circle cx="${l}" cy="${r}" r="${d}" fill="#f0c040" opacity="0.92"/>`,f=`
    <circle cx="${c}" cy="${r}" r="${u}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${c}" cy="${r}" r="2.5" fill="#fff" opacity="0.7"/>`,p=`<text x="${l}" y="${r+d+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,_=`<text x="${c}" y="${r+u+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,v="";if(n.progress!=null){let M=l+d+4,L=c-u-4,R=M+n.progress*(L-M),D=5;n.status==="arrival_window"?v=`
        <g transform="translate(${R.toFixed(1)},${r})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${D}" fill="${a}" opacity="0.92"/>
        </g>`:v=`<circle cx="${R.toFixed(1)}" cy="${r}" r="${D}" fill="${a}" opacity="0.85"/>`}let m=`<svg class="hw-cme-svg" viewBox="0 0 ${o} ${s}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${w}
    ${g}${p}
    ${f}${_}
    ${v}
  </svg>`,x=ae(n.arrival_time_utc),$=ae(n.launch_time_utc),A=n.speed_kms!=null?`${Math.round(n.speed_kms)} km/s`:"\u2014",S=n.half_angle_deg!=null?`${n.half_angle_deg}\xB0`:"\u2014",C=(b=n.source_location)!=null?b:"\u2014",E=n.is_earth_direct?"Direct hit":"Glancing blow",y=n.progress!=null?`${Math.round(n.progress*100)}%`:"\u2014",F=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${h(x)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${a}">${h(A)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${a}">${h(n.impact_level.charAt(0).toUpperCase()+n.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${h(i)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${h($)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${h(y)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${h(S)} \xB7 Source: ${h(C)} \xB7 ${h(E)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,T=t?"\u25BC":"\u25B6",z=n.impact_level==="unknown"?"Unrated":n.impact_level.charAt(0).toUpperCase()+n.impact_level.slice(1),H=t?`${m}${F}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${T}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${a}22;color:${a};margin-left:auto">${h(i)}</span>
        <span class="hw-cme-badge" style="background:${a}15;color:${a};margin-left:4px">${h(z)} impact</span>
      </div>
      ${H}
    </div>`}function pt(e,t,n,a,i,o,s,l,r,d,c,u,w,g,f,p,_,v){let m=Xe(e,i);return`
    <div class="hw-root">
      ${Be(e)}
      ${De(e,n,a,m,_,v)}
      ${n?Ne(e):""}
      ${qe(e,i,m)}
      ${dt(e,u)}
      ${tt(e,m,w,c,g,f,p,v,_)}
      ${lt(e,l,r,d)}
      ${ct(e,o,s)}
    </div>`}function ht(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${h(e)}</div>
    </div>
  </div>`}function ut(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Q=class{constructor(t,n){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=t,this.opts=n,this.el.innerHTML=ut(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var d,c,u,w,g,f;let n=t.target;if(n.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(n.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(n.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let a=n.closest("[data-impact-row]");if(a){let p=(d=a.dataset.impactRow)!=null?d:"";this.expandedImpacts.has(p)?this.expandedImpacts.delete(p):this.expandedImpacts.add(p),this.render();return}let i=n.closest("[data-solar-layer]");if(i){let p=(c=i.dataset.solarLayer)!=null?c:"";this.solarLayers.has(p)?this.solarLayers.delete(p):this.solarLayers.add(p),this.render();return}if(n.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(n.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let o=n.closest("[data-alert-key]");if(o){let p=(u=o.dataset.alertKey)!=null?u:null;this.expandedAlertKey=this.expandedAlertKey===p?null:p,this.render();return}if(n.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let p=Date.now();this.collapsedDays=new Set([new Date(p).toISOString().slice(0,10),new Date(p-864e5).toISOString().slice(0,10),new Date(p-1728e5).toISOString().slice(0,10)])}this.render();return}let s=n.closest("[data-tl-day]");if(s){let p=(w=s.dataset.tlDay)!=null?w:"";this.collapsedDays.has(p)?this.collapsedDays.delete(p):this.collapsedDays.add(p),this.render();return}let l=n.closest("[data-timeline-key]");if(l){let p=(g=l.dataset.timelineKey)!=null?g:null;this.expandedTimelineKey=this.expandedTimelineKey===p?null:p,this.render();return}if(n.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let r=n.closest("[data-kpi]");if(r){let p=(f=r.dataset.kpi)!=null?f:null;this.activePopover=this.activePopover===p?null:p,this.render();return}if(n.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}n.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let n=t.target;if(!n.matches("[data-scrub]"))return;let a=parseFloat(n.value);this.scrubOffset=a,n.style.setProperty("--pct",`${(a/parseFloat(n.max)*100).toFixed(0)}%`);let i=this.el.querySelector(".hw-scrub-title");i&&(i.textContent=a>0?`\u23F1 +${Math.round(a)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let n=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(n){let a=n instanceof Error?n.message:String(n);this.el.innerHTML=ht(`Space weather data unavailable (${a})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}async fetchSolarRegions(){try{let t=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!t.ok)return;let n=await t.json(),a=new Map;for(let i of n){let o=a.get(i.region),s=i.area!=null,l=(o==null?void 0:o.area)!=null;(!o||!l&&s||l===s&&i.observed_date>o.observed_date)&&a.set(i.region,i)}this.solarRegions=[...a.values()],this.render()}catch(t){}}async fetchOvationData(){var t,n,a,i,o,s;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let r=await l.json(),c=((a=(n=(t=r.coordinates)!=null?t:r.Data)!=null?n:r.data)!=null?a:[]).map(([u,w,g])=>({lon:u,lat:w,prob:g}));this.ovationData={entries:c,forecastTime:String((s=(o=(i=r["Forecast Time"])!=null?i:r.forecast_time)!=null?o:r["Observation Time"])!=null?s:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=pt(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},ue={mount(e,t){return He(),new Q(e,t)}};typeof window!="undefined"&&(window.HelioWidget=ue);return $e(mt);})();
