"use strict";var HelioWidgetModule=(()=>{var Z=Object.defineProperty;var me=Object.getOwnPropertyDescriptor;var we=Object.getOwnPropertyNames;var xe=Object.prototype.hasOwnProperty;var fe=(e,t)=>{for(var n in t)Z(e,n,{get:t[n],enumerable:!0})},be=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of we(t))!xe.call(e,o)&&o!==n&&Z(e,o,{get:()=>t[o],enumerable:!(i=me(t,o))||i.enumerable});return e};var ve=e=>be(Z({},"__esModule",{value:!0}),e);var dt={};fe(dt,{HelioWidget:()=>he});var te={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},$e={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},ye={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},oe={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"};function ke(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let n=Math.floor(t/60);return n<24?`Updated ${n}h ago`:`Updated ${Math.floor(n/24)}d ago`}catch(t){return"Updated recently"}}function _e(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function ne(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function W(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function B(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Me(e){return parseInt(e.slice(1),10)>0}var Le=`
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

/* States */
.hw-error{padding:16px;text-align:center;color:#96a8b8}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`,ie=!1;function Se(){if(ie)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=Le,document.head.appendChild(e),ie=!0}function Ce(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.length,o=t/i,s=e.map((a,l)=>{let r=Math.max(2,Math.min(n,a.kp/9*n)),d=n-r,c=l*o,h=a.kp>=6?"#e05c5c":a.kp>=5?"#e0a84a":a.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${d.toFixed(1)}" width="${(o-1).toFixed(1)}" height="${r.toFixed(1)}" fill="${h}" rx="1"><title>Kp ${a.kp.toFixed(1)} \xB7 ${u(W(a.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">${s}</svg>`}function G(e,t,n,i,o){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,a=Math.min(...e),l=Math.max(...e),r=l-a||1,d=m=>i-2-(m-a)/r*(i-4),c=e.map((m,f)=>`${(f/(e.length-1)*s).toFixed(1)},${d(m).toFixed(1)}`).join(" "),h="";if(o&&a<0&&l>0){let m=d(0);h=`<line x1="0" y1="${m.toFixed(1)}" x2="${s}" y2="${m.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let w=e.map((m,f)=>`<rect x="${(f/(e.length-1)*s-4).toFixed(1)}" y="0" width="8" height="${i}" fill="transparent"><title>${u(t[f]||"")} \xB7 ${m.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${s} ${i}" style="width:100%;height:${i}px;display:block" preserveAspectRatio="none">
    ${h}
    <polyline points="${c}" fill="none" stroke="${n}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${w}
  </svg>`}function He(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),o=Math.min(...i),a=Math.max(...i)-o||1,l=c=>n-2-(c-o)/a*(n-4),r=i.map((c,h)=>`${(h/(i.length-1)*t).toFixed(1)},${l(c).toFixed(1)}`).join(" "),d=e.map((c,h)=>{let w=h/(i.length-1)*t,m=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(w-4).toFixed(1)}" y="0" width="8" height="${n}" fill="transparent"><title>${u(W(c.t_utc))} \xB7 ${m}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">
    <polyline points="${r}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${d}
  </svg>`}function K(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ze(e){var l;let t=(l=e.metrics.wind_history_1h)!=null?l:[],n=G(t.map(r=>{var d;return(d=r.kms)!=null?d:0}).filter(r=>r>0),t.map(r=>W(r.t_utc)),"#5cce8c",36,!1),i=t[t.length-1],o=(i==null?void 0:i.density)!=null?`${i.density.toFixed(2)} cm\u207B\xB3`:"\u2014",s=(i==null?void 0:i.temp_kk)!=null?`${i.temp_kk.toFixed(0)} kK`:"\u2014",a=(i==null?void 0:i.pressure_npa)!=null?`${i.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${K("Solar Wind \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(o)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${u(s)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${u(a)}</span>
      </div>
    </div>
  </div>`}function Ae(e){var d,c,h;let t=(d=e.metrics.xray_history_1h)!=null?d:[],n=He(t),i=(c=e.metrics.xray_class)!=null?c:"A",o=e.metrics.xray_flux_wm2,s=o!=null?o.toExponential(2)+" W/m\xB2":"\u2014",a=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],l=a.map(w=>{let m=w.label===i,f=m?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${w.color}${m?"cc":"44"}">${f}</div>`}).join(""),r=a.map(w=>`<div class="hw-xray-scale-label" style="color:${w.label===i?"#c8d8dc":"#607880"}">${w.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${K("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${l}</div>
      <div class="hw-xray-scale-labels">${r}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(h=oe[i])!=null?h:"#a0b4b8"}">${u(i)}-class</b> \xB7 ${u(s)}</div>
  </div>`}function Fe(e){var a;let t=(a=e.metrics.bz_history_5m)!=null?a:[],n=G(t.map(l=>l.bz),t.map(l=>W(l.t_utc)),"#d4cc5c",36,!0),i=e.metrics.imf_bz_nt,o=i!=null?i<=-10?"#e05c5c":i<=-5?"#e0a84a":i>=5?"#5cce8c":"#a0b4b8":"#607880",s=i!=null?(i>=0?"+":"")+i.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${K("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${o}">${u(s)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function ae(e){var r,d;let t=e.metrics.imf_bz_nt,n=(r=e.metrics.kp_latest)!=null?r:0,i=(d=e.metrics.solar_wind_kms)!=null?d:0,o,s,a;if(t!=null&&t<-5||n>=6)o="storm",s="#e05c5c",a="Storm conditions";else if(t!=null&&t<0||n>=4||i>=400){let c=t!=null&&t<0;o="active",s="#e0a84a",a=c?"Active coupling":"Elevated"}else o="stable",s="#5cce8c",a="Stable";let l;return t==null?l="Unknown":t>2?l="Closed":t>0?l="Minimal":t>-5?l="Moderate":t>-10?l="Strong":l="Very strong",{state:o,color:s,label:a,coupling:l}}function se(e,t,n,i){let o=i?"mc":"mf",s=e.color,a=n!=null?n:0,l=a>500,r=a<350,d=l?.9:r?1.8:1.3;if(i){let f=45-(e.state==="storm"?11:e.state==="active"?16:21),p=e.state==="storm"?12:e.state==="active"?10:8,_=50-p,v=76,g=[`M ${f},25`,`C ${f-2},15 41,${p} 45,${p}`,`C 53,${p} ${v-8},${p+4} ${v},20`,`C ${v+1},23 ${v+1},27 ${v},30`,`C ${v-8},${_-4} 53,${_} 45,${_}`,`C 41,${_} ${f-2},35 ${f},25`,"Z"].join(" "),x=l?3:2,$=[14,25,36],F=y=>`<path d="M 0,${y} L ${l?8:6},${y} M ${l?6:4},${y-2} L ${l?8:6},${y} L ${l?6:4},${y+2}" stroke="${s}bb" stroke-width="${l?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,S=$.map(y=>F(y)).join(""),C=Array.from({length:x},(y,I)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/x*I).toFixed(2)}s">${S}</g>`).join(""),E=t==null?"":t>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${o}-wclip)">${C}</g>
      <path d="${g}" fill="${s}14" stroke="${s}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${E}
    </svg>`}else{let v=e.state==="storm"?16:e.state==="active"?26:38,g=155-v,x=e.state==="storm"?22:e.state==="active"?30:40,$=120-x,F=240,S=[`M ${g},60`,`C ${g-4},42 150,${x} 155,${x}`,`C 173,${x} ${F-5},${x+18} ${F},60`,`C ${F-5},${$-18} 173,${$} 155,${$}`,`C 150,${$} ${g-4},78 ${g},60`,"Z"].join(" "),C=`M ${g+2},60 C ${g+2},${60-v*.4} 152,54 150,60 C 152,66 ${g+2},${60+v*.4} ${g+2},60 Z`,E=a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c",y=a>700?.4:a>500?.65:a>350?1.1:1.8,I=a>500?[10,24,40,57,74,90,106]:a>350?[14,34,57,82,104]:[20,50,82,108],T=16,H=22,z=g-6,P=Math.ceil((z-H)/T)+2,k=Array.from({length:P},(R,O)=>H-T+O*T),b=12,M=8,L=k.flatMap(R=>I.map(O=>`<path d="M ${R},${O} L ${R+b},${O} M ${R+M},${O-3} L ${R+b},${O} L ${R+M},${O+3}" stroke="${E}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),N=`<g class="hw-wg-full" style="animation-duration:${y}s">${L}</g>`,j=t==null?"":t>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',D=t==null?"":`<text x="163" y="62" font-size="6" fill="${t>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${t>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="${H}" y="0" width="${z-H}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${o}-wclip)">${N}</g>
      <path d="${C}" fill="${s}08"/>
      <path d="${S}" fill="${s}12" stroke="${s}aa" stroke-width="1.2"/>
      <text x="${g+2}" y="${x-2}" font-size="7" fill="${s}" opacity=".8" font-family="sans-serif">${u(e.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${j}
      ${D}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function Te(e){let t=ae(e),n=e.metrics.imf_bz_nt,i=e.metrics.solar_wind_kms,o=e.metrics.kp_latest,s=e.metrics.density,a=e.metrics.pressure_npa,l=n!=null?(n>=0?"+":"")+n.toFixed(1)+" nT":"\u2014",r=i!=null?`${Math.round(i)} km/s`:"\u2014",d=s!=null?`${s.toFixed(1)} p/cm\xB3`:"\u2014",c=a!=null?`${a.toFixed(2)} nPa`:"\u2014",h=n!=null?n<=-10?"#e05c5c":n<=-5?"#e0a84a":n>=5?"#5cce8c":"#a0b4b8":"#607880",w=i!=null?i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c":"#607880",m=n!=null&&n<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":n!=null&&n<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${K("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${se(t,n,i,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${w}">${u(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${h}">${u(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${u(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(d)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${u(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(m)}</div>
  </div>`}function le(e,t,n){if(!e.length)return null;let i=(n%360+360)%360,o=-1,s=1/0,a=Math.cos(t*Math.PI/180);for(let l of e){let r=l.lat-t,d=(l.lon-i+180+360)%360-180,c=r*r+d*a*(d*a);c<s&&(s=c,o=l.prob)}return o>=0?o:null}function ce(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Oe(e,t){let n=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,i=null;t&&e.lat!=null&&e.lon!=null&&(i=le(t.entries,e.lat,e.lon));let o=e.lat!=null&&e.lon!=null,s=i!=null?i>=30?"#5cce8c":i>=10?"#d4cc5c":"#9ab4bc":"#607880",a=i!=null?`${i}%`:t?"n/a":"\u2026",l=o?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?u(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${s}">Aurora: ${a}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${K("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${B(n)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${ce(e)}
    </div>
    ${l}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Ee(e,t,n,i){switch(t){case"solar_wind":return ze(e);case"xray":return Ae(e);case"imf_bz":return Fe(e);case"aurora":return Oe(n,i);case"magnetosphere":return Te(e);default:return""}}function q(e,t){if(e.length<2)return"\u2192";let n=e[e.length-1],i=Math.max(0,e.length-4),o=e[i];if(!isFinite(n)||!isFinite(o))return"\u2192";let s=n-o;return s>t?"\u2191":s<-t?"\u2193":"\u2192"}function Ie(e,t,n,i,o,s){var j,D,R,O,V,X,J;let{summary:a,scales:l,metrics:r,aurora_hint:d}=e,c=(j=te[a.status])!=null?j:te.quiet,h=i!=null?i.kp.toFixed(1):r.kp_latest!=null?r.kp_latest.toFixed(1):"\u2014",m=[i?i.gScale:l.g_scale,l.r_scale,l.s_scale].map(A=>{let U=Me(A),Y=U?`color:${c.accent};border-color:${c.accent}33`:"";return`<span class="hw-scale-chip${U?" hw-scale-active":""}" style="${Y}">${u(A)}</span>`}).join(""),f=i?i.auroraLabel:d.aurora_label,p=f==="good"?"#5cce8c":f==="possible"?"#d4cc5c":"#607880",_=f.charAt(0).toUpperCase()+f.slice(1),v="#b4c6cc",g=r.solar_wind_kms!=null?`${Math.round(r.solar_wind_kms)} km/s`:"\u2014",x=r.imf_bz_nt,$=x!=null?x<=-10?"#e05c5c":x<=-5?"#e0a84a":x>=5?"#5cce8c":"#a0b4b8":"#607880",F=x!=null?(x>=0?"+":"")+x.toFixed(1)+" nT":"\u2014",S=r.xray_class,C=S?(D=oe[S])!=null?D:"#a0b4b8":"#607880",E=S?`${S}-class`:"\u2014",y=q(((R=r.kp_history_1h)!=null?R:[]).map(A=>A.kp),.5),I=q(((O=r.wind_history_1h)!=null?O:[]).map(A=>A.kms),20),T=q(((V=r.bz_history_1h)!=null?V:[]).map(A=>A.bz),1.5),H=q(((X=r.xray_history_1h)!=null?X:[]).map(A=>Math.log10(A.flux+1e-9)),.15),z=t?"\u25BC Details":"\u25B6 Details",P=ae(e),k=(J=r.kp_latest)!=null?J:0,b=k>=5,M=b?`linear-gradient(160deg, #0d2a1a 0%, ${c.bg}22 75%)`:`${c.bg}18`,L=(A,U,Y,ue,ee)=>{let ge=ee?`<span class="hw-trend">${ee}</span>`:"";return`<div class="hw-kpi-item${n===A?" hw-kpi-active":""}" data-kpi="${A}">
      <span class="hw-qd-label">${U}</span>
      <span class="hw-qd-value" style="color:${ue}">${Y}${ge}</span>
    </div>`},N=b?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${k.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${M}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${i?"color:#9acf60":""}">Kp <b>${u(h)}</b>${i?"":`<span class="hw-trend">${y}</span>`}</div>
          <span class="hw-status-badge" style="background:${c.accent}22;color:${c.accent};display:block;text-align:center">${u(a.label)}</span>
          <div class="hw-scales-row">${m}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${u(a.text)}</div>
            <div class="hw-magnet-mini${n==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${se(P,x,r.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${P.color}">${u(P.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${L("aurora","Aurora",u(_),p)}
        ${L("solar_wind","Solar wind",u(g),v,I)}
        ${L("imf_bz","IMF Bz",u(F),$,T)}
        ${L("xray","X-ray",u(E),C,H)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${z}</button>
      ${N}
      ${n?Ee(e,n,o,s):""}
    </div>`}function Re(e){var r,d,c;let{metrics:t}=e,n=(r=t.kp_history_1h)!=null?r:[],i=(d=t.wind_history_1h)!=null?d:[],o=(c=t.bz_history_1h)!=null?c:[],s=Ce(n),a=G(i.map(h=>{var w;return(w=h.kms)!=null?w:0}).filter(h=>h>0),i.map(h=>W(h.t_utc)),"#5cce8c",28,!1),l=G(o.map(h=>h.bz),o.map(h=>W(h.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
    </div>`}function Pe(e){let t=ke(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${u(t)}</span>
    </div>`}function Ne(e){return e.map((t,n)=>n===0?(t+e[1])/2:n===e.length-1?(e[n-1]+t)/2:(e[n-1]+t+e[n+1])/3)}function je(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Be(e){return e>=5?"good":e>=3?"possible":"none"}function de(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function De(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",n=de(e),i=t==="none"?"No aurora expected at mid-latitudes":n!=null?`Aurora possible equatorward of ~${n}\xB0 lat`:"Minor aurora possible at high latitudes",o=e>=7?"moderate":e>=5?"low":"none",s=o==="none"?"No significant HF degradation expected":o==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",a=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:i},{kind:"radio",level:o,label:"HF Radio",summary:s},{kind:"solar_activity",level:a,label:"Solar Activity",summary:a==="none"?"Quiet geomagnetic conditions expected":a==="low"?"Active geomagnetic conditions possible":a==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function We(e,t){var h;if(t<=0)return null;let n=(h=e.metrics.kp_forecast_3h)!=null?h:[];if(!n.length)return null;let i=Date.now()+t*36e5,o=n[0],s=1/0;for(let w of n){let m=Math.abs(new Date(w.t_utc).getTime()-i);m<s&&(s=m,o=w)}let a=o.kp,l=je(a),r=Be(a),d=de(a),c=De(a);return{offsetH:t,kp:a,gScale:l,auroraLabel:r,auroraMinLat:d,impacts:c}}function Ke(e,t,n){var k;let{forecast:i,metrics:o}=e,{kp_max_next_24h:s,kp_max_at_utc:a,trend:l}=i,r=((k=o.kp_forecast_3h)!=null?k:[]).slice(0,16),d=r.length,c=d*3,h=c>0?`${(t/c*100).toFixed(0)}%`:"0%",w=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",m="Kp forecast unavailable";if(s!=null){let b=ne(a),M=l==="rising"?"rising":l==="falling"?"falling":"steady";m=`Peak Kp ${s.toFixed(1)} next 24h${b?` at ${b}`:""} \xB7 ${M}`}if(!r.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${u(m)}</div>
    </div>`;let f=320,p=38,_=14,v=p+_,g=f/d,x=b=>p-Math.max(2,Math.min(p-2,b/9*(p-2))),$="",F=r.map(b=>b.kp),S=Ne(F);r.forEach((b,M)=>{let L=x(b.kp),N=p-L,j=M*g,D=j+g/2,R=b.kp>=6?"#e05c5c":b.kp>=5?"#e0a84a":b.kp>=4?"#d4cc5c":"#5cce8c",O=`Kp ${b.kp.toFixed(1)} \xB7 ${ne(b.t_utc)}`;if($+=`<rect x="${j.toFixed(1)}" y="${L.toFixed(1)}" width="${(g-1.5).toFixed(1)}" height="${N.toFixed(1)}" fill="${R}" fill-opacity="0.85" rx="1.5"/>`,$+=`<rect x="${j.toFixed(1)}" y="0" width="${g.toFixed(1)}" height="${p}" fill="transparent"><title>${B(O)}</title></rect>`,d<=8||M%2===0){let X=new Date(b.t_utc).getHours();$+=`<text x="${D.toFixed(1)}" y="${(v-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${X.toString().padStart(2,"0")}</text>`}});let E=`<polyline points="${r.map((b,M)=>{let L=M*g+g/2,N=x(S[M]);return`${L.toFixed(1)},${N.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,y="";if(t>0&&d>0){let b=Math.min(f-1,t/(d*3)*f);y=`
      <line x1="${b.toFixed(1)}" y1="0" x2="${b.toFixed(1)}" y2="${p}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${b.toFixed(1)},${p} ${(b-4).toFixed(1)},${(p-7).toFixed(1)} ${(b+4).toFixed(1)},${(p-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let I=Math.round(c/4),T=Math.round(c/2),H=Math.round(c*3/4),z=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${u(w)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${I}h</span>
        <span class="hw-scrub-tick">+${T}h</span>
        <span class="hw-scrub-tick">+${H}h</span>
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
      <div class="hw-forecast-text">${u(m)}</div>
      <svg viewBox="0 0 ${f} ${v}" style="width:100%;height:${v}px;display:block" preserveAspectRatio="none">
        ${$}
        ${E}
        ${y}
      </svg>
      ${z}
    </div>`}function Xe(e){let t=/([NS])(\d+)([EW])(\d+)/i.exec(e);return t?{lat:(t[1].toUpperCase()==="N"?1:-1)*parseInt(t[2],10),lon:(t[3].toUpperCase()==="E"?1:-1)*parseInt(t[4],10)}:null}var pe=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Ue(e){return e.x_flare_probability>0?"X":e.m_flare_probability>0?"M":e.c_flare_probability>0?"C":"quiet"}function qe(e,t,n){let i=t/2,o=i*.87,s=t*.03,a=t*.009,l=e.map(r=>{var v,g;let d=Xe(r.location);if(!d||Math.abs(d.lon)>88||r.location.includes("*"))return"";let c=Ue(r);if(!n.has(c))return"";let h=pe.find(x=>x.id===c).color,w=d.lat*Math.PI/180,m=d.lon*Math.PI/180,f=(i+o*Math.cos(w)*Math.sin(m)).toFixed(1),p=(i-o*Math.sin(w)).toFixed(1),_=`AR ${r.region} \xB7 ${r.location}
Class: ${(v=r.spot_class)!=null?v:"\u2014"} / ${(g=r.mag_class)!=null?g:"\u2014"}
C: ${r.c_flare_probability}%  M: ${r.m_flare_probability}%  X: ${r.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${u(_)}</title>
      <circle cx="${f}" cy="${p}" r="${(s+a+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(a*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${f}" cy="${p}" r="${s.toFixed(1)}" fill="none" stroke="${h}" stroke-width="${a.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${l}</svg>`}var Ge={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ve='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Ye="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Ze=240;function Qe(e,t,n,i,o,s,a,l,r){var _,v;let d=(v=(_=t==null?void 0:t.impacts)!=null?_:e.observer_impacts)!=null?v:[],c=d.map(g=>{var T,H;let x=(T=$e[g.level])!=null?T:"#666",$=g.level==="none"?"None":g.level.charAt(0).toUpperCase()+g.level.slice(1),F=(H=Ge[g.kind])!=null?H:Ve,S=g.level==="none"?"#606870":x,C=g.kind==="solar_activity"?o:a.has(g.kind),E=C?" hw-impact-open":"",y;if(g.kind==="solar_activity"){let z=o?" hw-solar-open":"",P=pe.map(k=>{let b=s.has(k.id),M=b?k.color+"22":"transparent",L=b?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${k.id}" style="color:${k.color};border-color:${k.color};background:${M};opacity:${L}">${k.label}</button>`}).join("");y=`<div class="hw-solar-tip${z}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${Ye}" alt="Solar disk" loading="lazy" />
            ${n?qe(n,Ze,s):""}
          </div>
          <div class="hw-solar-layers">${P}</div>
          <span class="hw-solar-tip-text">${u(g.summary)}</span>
        </div>`}else if(g.kind==="aurora"){let z=C?" hw-aurora-tip-open":"",P=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,k=null;l&&r.lat!=null&&r.lon!=null&&(k=le(l.entries,r.lat,r.lon));let b=r.lat!=null&&r.lon!=null,M=k!=null?k>=30?"#5cce8c":k>=10?"#d4cc5c":"#9ab4bc":"#607880",L=k!=null?`${k}%`:l?"n/a":"\u2026",N=b?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${r.locationName?u(r.locationName)+" \xB7 ":""}${r.lat.toFixed(1)}\xB0${r.lat>=0?"N":"S"} ${Math.abs(r.lon).toFixed(1)}\xB0${r.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${M}">Aurora: ${L}</span>
        </div>`:"";y=`<div class="hw-aurora-tip${z}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${B(P)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${ce(r)}
          </div>
          ${N}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else y=`<div class="hw-impact-tip${C?" hw-impact-tip-open":""}">${u(g.summary)}</div>`;let I=g.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${B(g.kind)}"`;return`<div class="hw-impact-row${E}"${I}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${S}">${F}<span style="color:#b4c6cc">${u(g.label)}</span></span>
      <span class="hw-impact-badge" style="background:${x}22;color:${x}">${u($)}</span>
      ${y}
    </div>`}).join(""),h=t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",w=d.length,m=i?"\u25BC":"\u25B6",f=w>0?`Observer Impacts (${w})`:"Observer Impacts";return`
    <div class="hw-impacts">
      ${`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${f}${h}</span>
    </div>`}
      ${i?c:""}
    </div>`}var re={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Je(e,t){var r,d;let n=(r=ye[e.level])!=null?r:"#666",i=e.level.charAt(0).toUpperCase()+e.level.slice(1),o=(d=re[e.kind])!=null?d:re.unknown,s=[_e(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),a=t&&e.raw_body?`<div class="hw-alert-body">${u(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${n}" data-alert-key="${B(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${n}">${o}</span>
      <span class="hw-alert-level" style="color:${n}">${u(i)}</span>
      <span class="hw-alert-title">${u(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${u(e.summary_short)}</div>
    <div class="hw-alert-meta">${u(s)}</div>
    ${a}
  </div>`}var et={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},tt="#4ae0a4";function nt(e){let t=(n,i="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${i}>${n}</svg>`;switch(e){case"solar_flare":return t(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function it(e){var i;let t=(i=e.metadata)!=null?i:{},n=[];return t.source_code&&n.push(`Code: ${t.source_code}`),t.model&&n.push(`Model: ${String(t.model).toUpperCase()}`),n.length===0?"":`
${n.join(" \xB7 ")}`}function rt(e,t,n){var r;let i=e.is_active?tt:(r=et[e.level])!=null?r:"#445c64",o=e.event_time===n,s=e.event_time.slice(11,16)+" UTC",a=e.source==="NASA_DONKI"?"DONKI":"SWPC",l=o?`<div class="hw-tl-detail">${u(e.description)}${u(it(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${B(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${i}"></div>
        ${t?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${s}</span>
          <span class="hw-tl-src">${a}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${nt(e.event_type)} ${u(e.event_title)}
        </div>
        ${l}
      </div>
    </div>`}function ot(e,t,n,i){var v,g;let o=(v=e.timeline)!=null?v:[],s=Date.now(),a=new Date(s).toISOString().slice(0,10),l=new Date(s-864e5).toISOString().slice(0,10),r=new Date(s-1728e5).toISOString().slice(0,10),d=new Set([a,l,r]),c=o.filter(x=>{var $;return d.has((($=x.event_time)!=null?$:"").slice(0,10))}).slice().reverse(),h=c.length,w=n?"\u25BC":"\u25B6",m=h>0?`Solar Activity Timeline (${h})`:"Solar Activity Timeline",f=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${w}</span>
      <span class="hw-section-label" style="margin-bottom:0">${m}</span>
    </div>`;if(!n||h===0)return`<div class="hw-timeline">${f}</div>`;let p=new Map;for(let x of c){let $=((g=x.event_time)!=null?g:"").slice(0,10);p.has($)||p.set($,[]),p.get($).push(x)}let _=[...p.entries()].map(([x,$])=>{let S=new Date(x+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),C=i.has(x),E=C?"\u25B6":"\u25BC",y=C?`<span class="hw-tl-day-count">${$.length} events</span>`:"",I=`
      <div class="hw-tl-day-row" data-tl-day="${B(x)}">
        <span class="hw-section-caret">${E}</span>
        <span class="hw-tl-date">${S}</span>
        ${y}
      </div>`,T=C?"":$.map((H,z)=>rt(H,z<$.length-1,t)).join("");return`<div class="hw-tl-group">${I}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${f}
      ${_}
    </div>`}function at(e,t,n){var d;let i=(d=e.alerts_all)!=null?d:[],o=i.length,s=t?"\u25BC":"\u25B6",a=o>0?`SWPC Alerts (${o})`:"SWPC Alerts",l=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${s}</span>
        <span class="hw-alerts-label">${a}</span>
      </div>
    </div>`;if(!t||o===0)return`<div class="hw-alerts">${l}${t&&o===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let r=i.map(c=>Je(c,c.dedupe_key===n)).join("");return`
    <div class="hw-alerts">
      ${l}
      ${r}
    </div>`}function st(e,t,n,i,o,s,a,l,r,d,c,h,w,m,f,p,_){let v=We(e,o);return`
    <div class="hw-root">
      ${Pe(e)}
      ${Ie(e,n,i,v,p,_)}
      ${n?Re(e):""}
      ${Ke(e,o,v)}
      ${Qe(e,v,h,c,w,m,f,_,p)}
      ${ot(e,l,r,d)}
      ${at(e,s,a)}
    </div>`}function lt(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${u(e)}</div>
    </div>
  </div>`}function ct(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Q=class{constructor(t,n){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=t,this.opts=n,this.el.innerHTML=ct(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var d,c,h,w,m,f;let n=t.target;if(n.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(n.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let i=n.closest("[data-impact-row]");if(i){let p=(d=i.dataset.impactRow)!=null?d:"";this.expandedImpacts.has(p)?this.expandedImpacts.delete(p):this.expandedImpacts.add(p),this.render();return}let o=n.closest("[data-solar-layer]");if(o){let p=(c=o.dataset.solarLayer)!=null?c:"";this.solarLayers.has(p)?this.solarLayers.delete(p):this.solarLayers.add(p),this.render();return}if(n.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(n.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let s=n.closest("[data-alert-key]");if(s){let p=(h=s.dataset.alertKey)!=null?h:null;this.expandedAlertKey=this.expandedAlertKey===p?null:p,this.render();return}if(n.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let p=Date.now();this.collapsedDays=new Set([new Date(p).toISOString().slice(0,10),new Date(p-864e5).toISOString().slice(0,10),new Date(p-1728e5).toISOString().slice(0,10)])}this.render();return}let a=n.closest("[data-tl-day]");if(a){let p=(w=a.dataset.tlDay)!=null?w:"";this.collapsedDays.has(p)?this.collapsedDays.delete(p):this.collapsedDays.add(p),this.render();return}let l=n.closest("[data-timeline-key]");if(l){let p=(m=l.dataset.timelineKey)!=null?m:null;this.expandedTimelineKey=this.expandedTimelineKey===p?null:p,this.render();return}if(n.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let r=n.closest("[data-kpi]");if(r){let p=(f=r.dataset.kpi)!=null?f:null;this.activePopover=this.activePopover===p?null:p,this.render();return}if(n.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}n.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let n=t.target;if(!n.matches("[data-scrub]"))return;let i=parseFloat(n.value);this.scrubOffset=i,n.style.setProperty("--pct",`${(i/parseFloat(n.max)*100).toFixed(0)}%`);let o=this.el.querySelector(".hw-scrub-title");o&&(o.textContent=i>0?`\u23F1 +${Math.round(i)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let n=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(n){let i=n instanceof Error?n.message:String(n);this.el.innerHTML=lt(`Space weather data unavailable (${i})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}async fetchSolarRegions(){try{let t=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!t.ok)return;let n=await t.json(),i=new Map;for(let o of n){let s=i.get(o.region),a=o.area!=null,l=(s==null?void 0:s.area)!=null;(!s||!l&&a||l===a&&o.observed_date>s.observed_date)&&i.set(o.region,o)}this.solarRegions=[...i.values()],this.render()}catch(t){}}async fetchOvationData(){var t,n,i,o,s,a;if(!(this.opts.lat==null||this.opts.lon==null))try{let l=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!l.ok)return;let r=await l.json(),c=((i=(n=(t=r.coordinates)!=null?t:r.Data)!=null?n:r.data)!=null?i:[]).map(([h,w,m])=>({lon:h,lat:w,prob:m}));this.ovationData={entries:c,forecastTime:String((a=(s=(o=r["Forecast Time"])!=null?o:r.forecast_time)!=null?s:r["Observation Time"])!=null?a:"")},this.render()}catch(l){}}render(){this.data&&(this.el.innerHTML=st(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},he={mount(e,t){return Se(),new Q(e,t)}};typeof window!="undefined"&&(window.HelioWidget=he);return ve(dt);})();
