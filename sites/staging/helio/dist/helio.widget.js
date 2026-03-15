"use strict";var HelioWidgetModule=(()=>{var V=Object.defineProperty;var he=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var ge=Object.prototype.hasOwnProperty;var me=(e,t)=>{for(var n in t)V(e,n,{get:t[n],enumerable:!0})},xe=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of ue(t))!ge.call(e,o)&&o!==n&&V(e,o,{get:()=>t[o],enumerable:!(i=he(t,o))||i.enumerable});return e};var we=e=>xe(V({},"__esModule",{value:!0}),e);var lt={};me(lt,{HelioWidget:()=>ce});var te={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},fe={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},be={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},re={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"};function ve(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let n=Math.floor(t/60);return n<24?`Updated ${n}h ago`:`Updated ${Math.floor(n/24)}d ago`}catch(t){return"Updated recently"}}function $e(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function ne(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function j(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function R(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function g(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ye(e){return parseInt(e.slice(1),10)>0}var ke=`
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
.hw-impact-row:hover{background:#ffffff09}
.hw-impact-kind{font-size:.75em;font-weight:600;min-width:88px;color:#b4c6cc;display:flex;align-items:center;gap:5px}
.hw-impact-badge{font-size:.68em;font-weight:700;padding:1px 7px;border-radius:2px;text-transform:capitalize;min-width:52px;text-align:center;flex-shrink:0}
.hw-impact-tip{flex-basis:100%;font-size:.72em;color:#96a8b8;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px}
.hw-impact-row:hover .hw-impact-tip{display:block}
.hw-solar-tip{flex-basis:100%;display:none;flex-direction:row;align-items:center;gap:10px;margin-top:6px;padding:6px;background:#111b1e;border-radius:4px;border:1px solid #1e2c30}
.hw-impact-row:hover .hw-solar-tip{display:flex}
.hw-solar-disk-wrap{position:relative;flex-shrink:0;width:80px;height:80px}
.hw-solar-disk-img{position:absolute;top:0;left:0;width:80px;height:80px;border-radius:50%;object-fit:cover;background:#0a0a0a;border:1px solid #2a3c42}
.hw-solar-tip-text{font-size:.72em;color:#96a8b8;line-height:1.5}

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

/* States */
.hw-error{padding:16px;text-align:center;color:#96a8b8}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`,ie=!1;function _e(){if(ie)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=ke,document.head.appendChild(e),ie=!0}function Me(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.length,o=t/i,r=e.map((a,s)=>{let l=Math.max(2,Math.min(n,a.kp/9*n)),d=n-l,c=s*o,p=a.kp>=6?"#e05c5c":a.kp>=5?"#e0a84a":a.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${d.toFixed(1)}" width="${(o-1).toFixed(1)}" height="${l.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${a.kp.toFixed(1)} \xB7 ${g(j(a.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">${r}</svg>`}function q(e,t,n,i,o){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let r=200,a=Math.min(...e),s=Math.max(...e),l=s-a||1,d=h=>i-2-(h-a)/l*(i-4),c=e.map((h,u)=>`${(u/(e.length-1)*r).toFixed(1)},${d(h).toFixed(1)}`).join(" "),p="";if(o&&a<0&&s>0){let h=d(0);p=`<line x1="0" y1="${h.toFixed(1)}" x2="${r}" y2="${h.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let x=e.map((h,u)=>`<rect x="${(u/(e.length-1)*r-4).toFixed(1)}" y="0" width="8" height="${i}" fill="transparent"><title>${g(t[u]||"")} \xB7 ${h.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${r} ${i}" style="width:100%;height:${i}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${c}" fill="none" stroke="${n}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${x}
  </svg>`}function Le(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),o=Math.min(...i),a=Math.max(...i)-o||1,s=c=>n-2-(c-o)/a*(n-4),l=i.map((c,p)=>`${(p/(i.length-1)*t).toFixed(1)},${s(c).toFixed(1)}`).join(" "),d=e.map((c,p)=>{let x=p/(i.length-1)*t,h=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(x-4).toFixed(1)}" y="0" width="8" height="${n}" fill="transparent"><title>${g(j(c.t_utc))} \xB7 ${h}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">
    <polyline points="${l}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${d}
  </svg>`}function N(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Se(e){var s;let t=(s=e.metrics.wind_history_1h)!=null?s:[],n=q(t.map(l=>{var d;return(d=l.kms)!=null?d:0}).filter(l=>l>0),t.map(l=>j(l.t_utc)),"#5cce8c",36,!1),i=t[t.length-1],o=(i==null?void 0:i.density)!=null?`${i.density.toFixed(2)} cm\u207B\xB3`:"\u2014",r=(i==null?void 0:i.temp_kk)!=null?`${i.temp_kk.toFixed(0)} kK`:"\u2014",a=(i==null?void 0:i.pressure_npa)!=null?`${i.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${N("Solar Wind \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${g(o)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${g(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${g(a)}</span>
      </div>
    </div>
  </div>`}function Ce(e){var d,c,p;let t=(d=e.metrics.xray_history_1h)!=null?d:[],n=Le(t),i=(c=e.metrics.xray_class)!=null?c:"A",o=e.metrics.xray_flux_wm2,r=o!=null?o.toExponential(2)+" W/m\xB2":"\u2014",a=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],s=a.map(x=>{let h=x.label===i,u=h?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${x.color}${h?"cc":"44"}">${u}</div>`}).join(""),l=a.map(x=>`<div class="hw-xray-scale-label" style="color:${x.label===i?"#c8d8dc":"#607880"}">${x.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${N("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${s}</div>
      <div class="hw-xray-scale-labels">${l}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(p=re[i])!=null?p:"#a0b4b8"}">${g(i)}-class</b> \xB7 ${g(r)}</div>
  </div>`}function ze(e){var a;let t=(a=e.metrics.bz_history_5m)!=null?a:[],n=q(t.map(s=>s.bz),t.map(s=>j(s.t_utc)),"#d4cc5c",36,!0),i=e.metrics.imf_bz_nt,o=i!=null?i<=-10?"#e05c5c":i<=-5?"#e0a84a":i>=5?"#5cce8c":"#a0b4b8":"#607880",r=i!=null?(i>=0?"+":"")+i.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${N("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${o}">${g(r)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function ae(e){var l,d;let t=e.metrics.imf_bz_nt,n=(l=e.metrics.kp_latest)!=null?l:0,i=(d=e.metrics.solar_wind_kms)!=null?d:0,o,r,a;if(t!=null&&t<-5||n>=6)o="storm",r="#e05c5c",a="Storm conditions";else if(t!=null&&t<0||n>=4||i>=400){let c=t!=null&&t<0;o="active",r="#e0a84a",a=c?"Active coupling":"Elevated"}else o="stable",r="#5cce8c",a="Stable";let s;return t==null?s="Unknown":t>2?s="Closed":t>0?s="Minimal":t>-5?s="Moderate":t>-10?s="Strong":s="Very strong",{state:o,color:r,label:a,coupling:s}}function se(e,t,n,i){let o=i?"mc":"mf",r=e.color,a=n!=null?n:0,s=a>500,l=a<350,d=s?.9:l?1.8:1.3;if(i){let u=45-(e.state==="storm"?11:e.state==="active"?16:21),m=e.state==="storm"?12:e.state==="active"?10:8,$=50-m,b=76,y=[`M ${u},25`,`C ${u-2},15 41,${m} 45,${m}`,`C 53,${m} ${b-8},${m+4} ${b},20`,`C ${b+1},23 ${b+1},27 ${b},30`,`C ${b-8},${$-4} 53,${$} 45,${$}`,`C 41,${$} ${u-2},35 ${u},25`,"Z"].join(" "),w=s?3:2,f=[14,25,36],F=k=>`<path d="M 0,${k} L ${s?8:6},${k} M ${s?6:4},${k-2} L ${s?8:6},${k} L ${s?6:4},${k+2}" stroke="${r}bb" stroke-width="${s?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,_=f.map(k=>F(k)).join(""),S=Array.from({length:w},(k,z)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/w*z).toFixed(2)}s">${_}</g>`).join(""),C=t==null?"":t>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${o}-wclip)">${S}</g>
      <path d="${y}" fill="${r}14" stroke="${r}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${C}
    </svg>`}else{let h=e.state==="storm"?26:e.state==="active"?38:50,u=110-h,m=e.state==="storm"?28:e.state==="active"?22:18,$=120-m,b=188,y=[`M ${u},60`,`C ${u-5},38 100,${m} 110,${m}`,`C 128,${m} ${b-20},${m+10} ${b},48`,`C ${b+3},55 ${b+3},65 ${b},72`,`C ${b-20},${$-10} 128,${$} 110,${$}`,`C 100,${$} ${u-5},82 ${u},60`,"Z"].join(" "),w=`M ${u+2},60 C ${u+2},${60-h*.4} 106,52 100,60 C 106,68 ${u+2},${60+h*.4} ${u+2},60 Z`,f=s?4:3,F=[24,42,60,78,96],_=40,S=s?18:14,C=s?14:10,k=M=>`<path d="M ${_},${M} L ${_+S},${M} M ${_+C},${M-4} L ${_+S},${M} L ${_+C},${M+4}" stroke="${r}bb" stroke-width="${s?2:1.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,z=F.map(M=>k(M)).join(""),T=Array.from({length:f},(M,I)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/f*I).toFixed(2)}s">${z}</g>`).join(""),E=t==null?"":t>0?'<path d="M 110,65 L 110,55 M 107,58 L 110,55 L 113,58" stroke="#5cce8c" stroke-width="1.5" fill="none" stroke-linecap="round"/>':'<path d="M 110,55 L 110,65 M 107,62 L 110,65 L 113,62" stroke="#e05c5c" stroke-width="1.5" fill="none" stroke-linecap="round"/>',O=t==null?"":`<text x="123" y="62" font-size="7" fill="${t>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${t>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="0 0 200 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="38" y="0" width="46" height="120"/></clipPath></defs>
      <rect width="200" height="120" fill="#0a1014" rx="3"/>
      <circle cx="0" cy="60" r="36" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${o}-wclip)">${T}</g>
      <path d="${w}" fill="${r}08"/>
      <path d="${y}" fill="${r}12" stroke="${r}aa" stroke-width="1.2"/>
      <text x="${u+3}" y="${m-2}" font-size="7" fill="${r}" opacity=".75" font-family="sans-serif">${g(e.label)}</text>
      <circle cx="110" cy="60" r="10" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${E}
      ${O}
      <text x="2" y="113" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
    </svg>`}}function He(e){let t=ae(e),n=e.metrics.imf_bz_nt,i=e.metrics.solar_wind_kms,o=e.metrics.kp_latest,r=n!=null?(n>=0?"+":"")+n.toFixed(1)+" nT":"\u2014",a=i!=null?`${Math.round(i)} km/s`:"\u2014",s=o!=null?o.toFixed(1):"\u2014",l=n!=null?n<=-10?"#e05c5c":n<=-5?"#e0a84a":n>=5?"#5cce8c":"#a0b4b8":"#607880",d=n!=null&&n<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":n!=null&&n<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${N("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${se(t,n,i,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${l}">${g(r)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${g(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${g(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${g(d)}</div>
  </div>`}function Ae(e,t,n){if(!e.length)return null;let i=(n%360+360)%360,o=-1,r=1/0,a=Math.cos(t*Math.PI/180);for(let s of e){let l=s.lat-t,d=(s.lon-i+180+360)%360-180,c=l*l+d*a*(d*a);c<r&&(r=c,o=s.prob)}return o>=0?o:null}function Fe(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Te(e,t){let n=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,i=null;t&&e.lat!=null&&e.lon!=null&&(i=Ae(t.entries,e.lat,e.lon));let o=e.lat!=null&&e.lon!=null,r=i!=null?i>=30?"#5cce8c":i>=10?"#d4cc5c":"#9ab4bc":"#607880",a=i!=null?`${i}%`:t?"n/a":"\u2026",s=o?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?g(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${r}">Aurora: ${a}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${N("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${R(n)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Fe(e)}
    </div>
    ${s}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Ee(e,t,n,i){switch(t){case"solar_wind":return Se(e);case"xray":return Ce(e);case"imf_bz":return ze(e);case"aurora":return Te(n,i);case"magnetosphere":return He(e);default:return""}}function G(e,t){if(e.length<2)return"\u2192";let n=e[e.length-1],i=Math.max(0,e.length-4),o=e[i];if(!isFinite(n)||!isFinite(o))return"\u2192";let r=n-o;return r>t?"\u2191":r<-t?"\u2193":"\u2192"}function Oe(e,t,n,i,o,r){var P,D,K,W,Y,U,J;let{summary:a,scales:s,metrics:l,aurora_hint:d}=e,c=(P=te[a.status])!=null?P:te.quiet,p=i!=null?i.kp.toFixed(1):l.kp_latest!=null?l.kp_latest.toFixed(1):"\u2014",h=[i?i.gScale:s.g_scale,s.r_scale,s.s_scale].map(L=>{let X=ye(L),Z=X?`color:${c.accent};border-color:${c.accent}33`:"";return`<span class="hw-scale-chip${X?" hw-scale-active":""}" style="${Z}">${g(L)}</span>`}).join(""),u=i?i.auroraLabel:d.aurora_label,m=u==="good"?"#5cce8c":u==="possible"?"#d4cc5c":"#607880",$=u.charAt(0).toUpperCase()+u.slice(1),b="#b4c6cc",y=l.solar_wind_kms!=null?`${Math.round(l.solar_wind_kms)} km/s`:"\u2014",w=l.imf_bz_nt,f=w!=null?w<=-10?"#e05c5c":w<=-5?"#e0a84a":w>=5?"#5cce8c":"#a0b4b8":"#607880",F=w!=null?(w>=0?"+":"")+w.toFixed(1)+" nT":"\u2014",_=l.xray_class,S=_?(D=re[_])!=null?D:"#a0b4b8":"#607880",C=_?`${_}-class`:"\u2014",k=G(((K=l.kp_history_1h)!=null?K:[]).map(L=>L.kp),.5),z=G(((W=l.wind_history_1h)!=null?W:[]).map(L=>L.kms),20),T=G(((Y=l.bz_history_1h)!=null?Y:[]).map(L=>L.bz),1.5),E=G(((U=l.xray_history_1h)!=null?U:[]).map(L=>Math.log10(L.flux+1e-9)),.15),O=t?"\u25BC Details":"\u25B6 Details",M=ae(e),I=(J=l.kp_latest)!=null?J:0,v=I>=5,H=v?`linear-gradient(160deg, #0d2a1a 0%, ${c.bg}22 75%)`:`${c.bg}18`,A=(L,X,Z,de,ee)=>{let pe=ee?`<span class="hw-trend">${ee}</span>`:"";return`<div class="hw-kpi-item${n===L?" hw-kpi-active":""}" data-kpi="${L}">
      <span class="hw-qd-label">${X}</span>
      <span class="hw-qd-value" style="color:${de}">${Z}${pe}</span>
    </div>`},B=v?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${I.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${H}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${i?"color:#9acf60":""}">Kp <b>${g(p)}</b>${i?"":`<span class="hw-trend">${k}</span>`}</div>
          <span class="hw-status-badge" style="background:${c.accent}22;color:${c.accent};display:block;text-align:center">${g(a.label)}</span>
          <div class="hw-scales-row">${h}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${g(a.text)}</div>
            <div class="hw-magnet-mini${n==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${se(M,w,l.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${M.color}">${g(M.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${A("aurora","Aurora",g($),m)}
        ${A("solar_wind","Solar wind",g(y),b,z)}
        ${A("imf_bz","IMF Bz",g(F),f,T)}
        ${A("xray","X-ray",g(C),S,E)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${O}</button>
      ${B}
      ${n?Ee(e,n,o,r):""}
    </div>`}function Ie(e){var l,d,c;let{metrics:t}=e,n=(l=t.kp_history_1h)!=null?l:[],i=(d=t.wind_history_1h)!=null?d:[],o=(c=t.bz_history_1h)!=null?c:[],r=Me(n),a=q(i.map(p=>{var x;return(x=p.kms)!=null?x:0}).filter(p=>p>0),i.map(p=>j(p.t_utc)),"#5cce8c",28,!1),s=q(o.map(p=>p.bz),o.map(p=>j(p.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
    </div>`}function Pe(e){let t=ve(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${g(t)}</span>
    </div>`}function je(e){return e.map((t,n)=>n===0?(t+e[1])/2:n===e.length-1?(e[n-1]+t)/2:(e[n-1]+t+e[n+1])/3)}function Be(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Re(e){return e>=5?"good":e>=3?"possible":"none"}function le(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ne(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",n=le(e),i=t==="none"?"No aurora expected at mid-latitudes":n!=null?`Aurora possible equatorward of ~${n}\xB0 lat`:"Minor aurora possible at high latitudes",o=e>=7?"moderate":e>=5?"low":"none",r=o==="none"?"No significant HF degradation expected":o==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",a=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:i},{kind:"radio",level:o,label:"HF Radio",summary:r},{kind:"solar_activity",level:a,label:"Solar Activity",summary:a==="none"?"Quiet geomagnetic conditions expected":a==="low"?"Active geomagnetic conditions possible":a==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function De(e,t){var p;if(t<=0)return null;let n=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!n.length)return null;let i=Date.now()+t*36e5,o=n[0],r=1/0;for(let x of n){let h=Math.abs(new Date(x.t_utc).getTime()-i);h<r&&(r=h,o=x)}let a=o.kp,s=Be(a),l=Re(a),d=le(a),c=Ne(a);return{offsetH:t,kp:a,gScale:s,auroraLabel:l,auroraMinLat:d,impacts:c}}function Ke(e,t,n){var I;let{forecast:i,metrics:o}=e,{kp_max_next_24h:r,kp_max_at_utc:a,trend:s}=i,l=((I=o.kp_forecast_3h)!=null?I:[]).slice(0,16),d=l.length,c=d*3,p=c>0?`${(t/c*100).toFixed(0)}%`:"0%",x=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",h="Kp forecast unavailable";if(r!=null){let v=ne(a),H=s==="rising"?"rising":s==="falling"?"falling":"steady";h=`Peak Kp ${r.toFixed(1)} next 24h${v?` at ${v}`:""} \xB7 ${H}`}if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${g(h)}</div>
    </div>`;let u=320,m=38,$=14,b=m+$,y=u/d,w=v=>m-Math.max(2,Math.min(m-2,v/9*(m-2))),f="",F=l.map(v=>v.kp),_=je(F);l.forEach((v,H)=>{let A=w(v.kp),B=m-A,P=H*y,D=P+y/2,K=v.kp>=6?"#e05c5c":v.kp>=5?"#e0a84a":v.kp>=4?"#d4cc5c":"#5cce8c",W=`Kp ${v.kp.toFixed(1)} \xB7 ${ne(v.t_utc)}`;if(f+=`<rect x="${P.toFixed(1)}" y="${A.toFixed(1)}" width="${(y-1.5).toFixed(1)}" height="${B.toFixed(1)}" fill="${K}" fill-opacity="0.85" rx="1.5"/>`,f+=`<rect x="${P.toFixed(1)}" y="0" width="${y.toFixed(1)}" height="${m}" fill="transparent"><title>${R(W)}</title></rect>`,d<=8||H%2===0){let U=new Date(v.t_utc).getHours();f+=`<text x="${D.toFixed(1)}" y="${(b-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${U.toString().padStart(2,"0")}</text>`}});let C=`<polyline points="${l.map((v,H)=>{let A=H*y+y/2,B=w(_[H]);return`${A.toFixed(1)},${B.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,k="";if(t>0&&d>0){let v=Math.min(u-1,t/(d*3)*u);k=`
      <line x1="${v.toFixed(1)}" y1="0" x2="${v.toFixed(1)}" y2="${m}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${v.toFixed(1)},${m} ${(v-4).toFixed(1)},${(m-7).toFixed(1)} ${(v+4).toFixed(1)},${(m-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let z=Math.round(c/4),T=Math.round(c/2),E=Math.round(c*3/4),O=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${g(x)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${p}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${z}h</span>
        <span class="hw-scrub-tick">+${T}h</span>
        <span class="hw-scrub-tick">+${E}h</span>
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
      <div class="hw-forecast-text">${g(h)}</div>
      <svg viewBox="0 0 ${u} ${b}" style="width:100%;height:${b}px;display:block" preserveAspectRatio="none">
        ${f}
        ${C}
        ${k}
      </svg>
      ${O}
    </div>`}function We(e){let t=/([NS])(\d+)([EW])(\d+)/i.exec(e);return t?{lat:(t[1].toUpperCase()==="N"?1:-1)*parseInt(t[2],10),lon:(t[3].toUpperCase()==="E"?1:-1)*parseInt(t[4],10)}:null}function Ue(e,t){let n=t/2,i=n*.87,o=e.map(r=>{var h,u;let a=We(r.location);if(!a||Math.abs(a.lon)>88)return"";let s=a.lat*Math.PI/180,l=a.lon*Math.PI/180,d=(n+i*Math.cos(s)*Math.sin(l)).toFixed(1),c=(n-i*Math.sin(s)).toFixed(1),p=r.x_flare_probability>0?"#e05c5c":r.m_flare_probability>10?"#e0a84a":r.c_flare_probability>20?"#d4cc5c":"#c8d8e0",x=`AR ${r.region} \xB7 ${r.location}
Class: ${(h=r.spot_class)!=null?h:"\u2014"} / ${(u=r.mag_class)!=null?u:"\u2014"}
C: ${r.c_flare_probability}%  M: ${r.m_flare_probability}%  X: ${r.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${g(x)}</title>
      <circle cx="${d}" cy="${c}" r="3.5" fill="${p}" stroke="#000" stroke-width="0.6" opacity="0.88"/>
      <text x="${d}" y="${(parseFloat(c)-5).toFixed(1)}" font-size="5" fill="${p}" text-anchor="middle" font-family="monospace" opacity="0.95">${r.region}</text>
    </g>`}).join("");return`<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${o}</svg>`}var Xe={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ge='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',qe="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Ye=80;function Ze(e,t,n,i){var p,x;let o=(x=(p=t==null?void 0:t.impacts)!=null?p:e.observer_impacts)!=null?x:[],r=o.map(h=>{var w,f;let u=(w=fe[h.level])!=null?w:"#666",m=h.level==="none"?"None":h.level.charAt(0).toUpperCase()+h.level.slice(1),$=(f=Xe[h.kind])!=null?f:Ge,b=h.level==="none"?"#606870":u,y=h.kind==="solar_activity"?`<div class="hw-solar-tip">
           <div class="hw-solar-disk-wrap">
             <img class="hw-solar-disk-img" src="${qe}" alt="Solar disk" loading="lazy" />
             ${n?Ue(n,Ye):""}
           </div>
           <span class="hw-solar-tip-text">${g(h.summary)}</span>
         </div>`:`<div class="hw-impact-tip">${g(h.summary)}</div>`;return`<div class="hw-impact-row">
      <span class="hw-impact-kind" style="color:${b}">${$}<span style="color:#b4c6cc">${g(h.label)}</span></span>
      <span class="hw-impact-badge" style="background:${u}22;color:${u}">${g(m)}</span>
      ${y}
    </div>`}).join(""),a=t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",s=o.length,l=i?"\u25BC":"\u25B6",d=s>0?`Observer Impacts (${s})`:"Observer Impacts";return`
    <div class="hw-impacts">
      ${`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${l}</span>
      <span class="hw-section-label" style="margin-bottom:0">${d}${a}</span>
    </div>`}
      ${i?r:""}
    </div>`}var oe={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Ve(e,t){var l,d;let n=(l=be[e.level])!=null?l:"#666",i=e.level.charAt(0).toUpperCase()+e.level.slice(1),o=(d=oe[e.kind])!=null?d:oe.unknown,r=[$e(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),a=t&&e.raw_body?`<div class="hw-alert-body">${g(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${n}" data-alert-key="${R(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${n}">${o}</span>
      <span class="hw-alert-level" style="color:${n}">${g(i)}</span>
      <span class="hw-alert-title">${g(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${g(e.summary_short)}</div>
    <div class="hw-alert-meta">${g(r)}</div>
    ${a}
  </div>`}var Qe={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},Je="#4ae0a4";function et(e){let t=(n,i="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${i}>${n}</svg>`;switch(e){case"solar_flare":return t(`<circle cx="6.5" cy="6.5" r="2.5"/>
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
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function tt(e){var i;let t=(i=e.metadata)!=null?i:{},n=[];return t.source_code&&n.push(`Code: ${t.source_code}`),t.model&&n.push(`Model: ${String(t.model).toUpperCase()}`),n.length===0?"":`
${n.join(" \xB7 ")}`}function nt(e,t,n){var l;let i=e.is_active?Je:(l=Qe[e.level])!=null?l:"#445c64",o=e.event_time===n,r=e.event_time.slice(11,16)+" UTC",a=e.source==="NASA_DONKI"?"DONKI":"SWPC",s=o?`<div class="hw-tl-detail">${g(e.description)}${g(tt(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${R(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${i}"></div>
        ${t?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${r}</span>
          <span class="hw-tl-src">${a}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${et(e.event_type)} ${g(e.event_title)}
        </div>
        ${s}
      </div>
    </div>`}function it(e,t,n,i){var b,y;let o=(b=e.timeline)!=null?b:[],r=Date.now(),a=new Date(r).toISOString().slice(0,10),s=new Date(r-864e5).toISOString().slice(0,10),l=new Date(r-1728e5).toISOString().slice(0,10),d=new Set([a,s,l]),c=o.filter(w=>{var f;return d.has(((f=w.event_time)!=null?f:"").slice(0,10))}).slice().reverse(),p=c.length,x=n?"\u25BC":"\u25B6",h=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",u=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${x}</span>
      <span class="hw-section-label" style="margin-bottom:0">${h}</span>
    </div>`;if(!n||p===0)return`<div class="hw-timeline">${u}</div>`;let m=new Map;for(let w of c){let f=((y=w.event_time)!=null?y:"").slice(0,10);m.has(f)||m.set(f,[]),m.get(f).push(w)}let $=[...m.entries()].map(([w,f])=>{let _=new Date(w+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),S=i.has(w),C=S?"\u25B6":"\u25BC",k=S?`<span class="hw-tl-day-count">${f.length} events</span>`:"",z=`
      <div class="hw-tl-day-row" data-tl-day="${R(w)}">
        <span class="hw-section-caret">${C}</span>
        <span class="hw-tl-date">${_}</span>
        ${k}
      </div>`,T=S?"":f.map((E,O)=>nt(E,O<f.length-1,t)).join("");return`<div class="hw-tl-group">${z}${T}</div>`}).join("");return`
    <div class="hw-timeline">
      ${u}
      ${$}
    </div>`}function ot(e,t,n){var d;let i=(d=e.alerts_all)!=null?d:[],o=i.length,r=t?"\u25BC":"\u25B6",a=o>0?`SWPC Alerts (${o})`:"SWPC Alerts",s=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${r}</span>
        <span class="hw-alerts-label">${a}</span>
      </div>
    </div>`;if(!t||o===0)return`<div class="hw-alerts">${s}${t&&o===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let l=i.map(c=>Ve(c,c.dedupe_key===n)).join("");return`
    <div class="hw-alerts">
      ${s}
      ${l}
    </div>`}function rt(e,t,n,i,o,r,a,s,l,d,c,p,x,h){let u=De(e,o);return`
    <div class="hw-root">
      ${Pe(e)}
      ${Oe(e,n,i,u,x,h)}
      ${n?Ie(e):""}
      ${Ke(e,o,u)}
      ${Ze(e,u,p,c)}
      ${it(e,s,l,d)}
      ${ot(e,r,a)}
    </div>`}function at(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${g(e)}</div>
    </div>
  </div>`}function st(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Q=class{constructor(t,n){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.solarRegions=null;this.ovationData=null;this.timer=null;this.data=null;this.el=t,this.opts=n,this.el.innerHTML=st(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var s,l,d,c;let n=t.target;if(n.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(n.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}if(n.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let i=n.closest("[data-alert-key]");if(i){let p=(s=i.dataset.alertKey)!=null?s:null;this.expandedAlertKey=this.expandedAlertKey===p?null:p,this.render();return}if(n.closest("[data-tl-section]")){this.timelineOpen=!this.timelineOpen,this.render();return}let o=n.closest("[data-tl-day]");if(o){let p=(l=o.dataset.tlDay)!=null?l:"";this.collapsedDays.has(p)?this.collapsedDays.delete(p):this.collapsedDays.add(p),this.render();return}let r=n.closest("[data-timeline-key]");if(r){let p=(d=r.dataset.timelineKey)!=null?d:null;this.expandedTimelineKey=this.expandedTimelineKey===p?null:p,this.render();return}if(n.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let a=n.closest("[data-kpi]");if(a){let p=(c=a.dataset.kpi)!=null?c:null;this.activePopover=this.activePopover===p?null:p,this.render();return}if(n.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}n.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let n=t.target;if(!n.matches("[data-scrub]"))return;let i=parseFloat(n.value);this.scrubOffset=i,n.style.setProperty("--pct",`${(i/parseFloat(n.max)*100).toFixed(0)}%`);let o=this.el.querySelector(".hw-scrub-title");o&&(o.textContent=i>0?`\u23F1 +${Math.round(i)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let n=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(n){let i=n instanceof Error?n.message:String(n);this.el.innerHTML=at(`Space weather data unavailable (${i})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}async fetchSolarRegions(){try{let t=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!t.ok)return;let n=await t.json(),i=new Map;for(let o of n){let r=i.get(o.region);(!r||o.observed_date>r.observed_date)&&i.set(o.region,o)}this.solarRegions=[...i.values()],this.render()}catch(t){}}async fetchOvationData(){var t,n,i,o,r,a;if(!(this.opts.lat==null||this.opts.lon==null))try{let s=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!s.ok)return;let l=await s.json(),c=((i=(n=(t=l.coordinates)!=null?t:l.Data)!=null?n:l.data)!=null?i:[]).map(([p,x,h])=>({lon:p,lat:x,prob:h}));this.ovationData={entries:c,forecastTime:String((a=(r=(o=l["Forecast Time"])!=null?o:l.forecast_time)!=null?r:l["Observation Time"])!=null?a:"")},this.render()}catch(s){}}render(){this.data&&(this.el.innerHTML=rt(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.solarRegions,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},ce={mount(e,t){return _e(),new Q(e,t)}};typeof window!="undefined"&&(window.HelioWidget=ce);return we(lt);})();
