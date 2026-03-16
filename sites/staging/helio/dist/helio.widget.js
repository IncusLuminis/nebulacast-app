"use strict";var HelioWidgetModule=(()=>{var Z=Object.defineProperty;var he=Object.getOwnPropertyDescriptor;var ue=Object.getOwnPropertyNames;var ge=Object.prototype.hasOwnProperty;var me=(e,t)=>{for(var n in t)Z(e,n,{get:t[n],enumerable:!0})},we=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of ue(t))!ge.call(e,o)&&o!==n&&Z(e,o,{get:()=>t[o],enumerable:!(i=he(t,o))||i.enumerable});return e};var xe=e=>we(Z({},"__esModule",{value:!0}),e);var lt={};me(lt,{HelioWidget:()=>ce});var te={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},fe={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},be={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},re={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"};function ve(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let n=Math.floor(t/60);return n<24?`Updated ${n}h ago`:`Updated ${Math.floor(n/24)}d ago`}catch(t){return"Updated recently"}}function $e(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function ne(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function D(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function W(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function ye(e){return parseInt(e.slice(1),10)>0}var ke=`
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
@keyframes hw-wind-full{from{transform:translateX(0)}to{transform:translateX(16px)}}
.hw-wg-full{animation:hw-wind-full linear infinite}

/* States */
.hw-error{padding:16px;text-align:center;color:#96a8b8}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`,ie=!1;function _e(){if(ie)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=ke,document.head.appendChild(e),ie=!0}function Me(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.length,o=t/i,s=e.map((r,a)=>{let l=Math.max(2,Math.min(n,r.kp/9*n)),p=n-l,c=a*o,d=r.kp>=6?"#e05c5c":r.kp>=5?"#e0a84a":r.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${p.toFixed(1)}" width="${(o-1).toFixed(1)}" height="${l.toFixed(1)}" fill="${d}" rx="1"><title>Kp ${r.kp.toFixed(1)} \xB7 ${u(D(r.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">${s}</svg>`}function G(e,t,n,i,o){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,r=Math.min(...e),a=Math.max(...e),l=a-r||1,p=h=>i-2-(h-r)/l*(i-4),c=e.map((h,g)=>`${(g/(e.length-1)*s).toFixed(1)},${p(h).toFixed(1)}`).join(" "),d="";if(o&&r<0&&a>0){let h=p(0);d=`<line x1="0" y1="${h.toFixed(1)}" x2="${s}" y2="${h.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let m=e.map((h,g)=>`<rect x="${(g/(e.length-1)*s-4).toFixed(1)}" y="0" width="8" height="${i}" fill="transparent"><title>${u(t[g]||"")} \xB7 ${h.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${s} ${i}" style="width:100%;height:${i}px;display:block" preserveAspectRatio="none">
    ${d}
    <polyline points="${c}" fill="none" stroke="${n}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${m}
  </svg>`}function Le(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,n=32,i=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),o=Math.min(...i),r=Math.max(...i)-o||1,a=c=>n-2-(c-o)/r*(n-4),l=i.map((c,d)=>`${(d/(i.length-1)*t).toFixed(1)},${a(c).toFixed(1)}`).join(" "),p=e.map((c,d)=>{let m=d/(i.length-1)*t,h=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(m-4).toFixed(1)}" y="0" width="8" height="${n}" fill="transparent"><title>${u(D(c.t_utc))} \xB7 ${h}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">
    <polyline points="${l}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${p}
  </svg>`}function K(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Se(e){var a;let t=(a=e.metrics.wind_history_1h)!=null?a:[],n=G(t.map(l=>{var p;return(p=l.kms)!=null?p:0}).filter(l=>l>0),t.map(l=>D(l.t_utc)),"#5cce8c",36,!1),i=t[t.length-1],o=(i==null?void 0:i.density)!=null?`${i.density.toFixed(2)} cm\u207B\xB3`:"\u2014",s=(i==null?void 0:i.temp_kk)!=null?`${i.temp_kk.toFixed(0)} kK`:"\u2014",r=(i==null?void 0:i.pressure_npa)!=null?`${i.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
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
        <span class="hw-kpi-stat-value">${u(r)}</span>
      </div>
    </div>
  </div>`}function Ce(e){var p,c,d;let t=(p=e.metrics.xray_history_1h)!=null?p:[],n=Le(t),i=(c=e.metrics.xray_class)!=null?c:"A",o=e.metrics.xray_flux_wm2,s=o!=null?o.toExponential(2)+" W/m\xB2":"\u2014",r=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],a=r.map(m=>{let h=m.label===i,g=h?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${m.color}${h?"cc":"44"}">${g}</div>`}).join(""),l=r.map(m=>`<div class="hw-xray-scale-label" style="color:${m.label===i?"#c8d8dc":"#607880"}">${m.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${K("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${n}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${a}</div>
      <div class="hw-xray-scale-labels">${l}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(d=re[i])!=null?d:"#a0b4b8"}">${u(i)}-class</b> \xB7 ${u(s)}</div>
  </div>`}function ze(e){var r;let t=(r=e.metrics.bz_history_5m)!=null?r:[],n=G(t.map(a=>a.bz),t.map(a=>D(a.t_utc)),"#d4cc5c",36,!0),i=e.metrics.imf_bz_nt,o=i!=null?i<=-10?"#e05c5c":i<=-5?"#e0a84a":i>=5?"#5cce8c":"#a0b4b8":"#607880",s=i!=null?(i>=0?"+":"")+i.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${K("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${n}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${o}">${u(s)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function se(e){var l,p;let t=e.metrics.imf_bz_nt,n=(l=e.metrics.kp_latest)!=null?l:0,i=(p=e.metrics.solar_wind_kms)!=null?p:0,o,s,r;if(t!=null&&t<-5||n>=6)o="storm",s="#e05c5c",r="Storm conditions";else if(t!=null&&t<0||n>=4||i>=400){let c=t!=null&&t<0;o="active",s="#e0a84a",r=c?"Active coupling":"Elevated"}else o="stable",s="#5cce8c",r="Stable";let a;return t==null?a="Unknown":t>2?a="Closed":t>0?a="Minimal":t>-5?a="Moderate":t>-10?a="Strong":a="Very strong",{state:o,color:s,label:r,coupling:a}}function ae(e,t,n,i){let o=i?"mc":"mf",s=e.color,r=n!=null?n:0,a=r>500,l=r<350,p=a?.9:l?1.8:1.3;if(i){let g=45-(e.state==="storm"?11:e.state==="active"?16:21),x=e.state==="storm"?12:e.state==="active"?10:8,k=50-x,$=76,v=[`M ${g},25`,`C ${g-2},15 41,${x} 45,${x}`,`C 53,${x} ${$-8},${x+4} ${$},20`,`C ${$+1},23 ${$+1},27 ${$},30`,`C ${$-8},${k-4} 53,${k} 45,${k}`,`C 41,${k} ${g-2},35 ${g},25`,"Z"].join(" "),w=a?3:2,f=[14,25,36],H=y=>`<path d="M 0,${y} L ${a?8:6},${y} M ${a?6:4},${y-2} L ${a?8:6},${y} L ${a?6:4},${y+2}" stroke="${s}bb" stroke-width="${a?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,M=f.map(y=>H(y)).join(""),A=Array.from({length:w},(y,E)=>`<g class="hw-wg" style="animation-duration:${p}s;animation-delay:${(p/w*E).toFixed(2)}s">${M}</g>`).join(""),T=t==null?"":t>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${o}-wclip)">${A}</g>
      <path d="${v}" fill="${s}14" stroke="${s}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${T}
    </svg>`}else{let $=e.state==="storm"?16:e.state==="active"?26:38,v=155-$,w=e.state==="storm"?22:e.state==="active"?30:40,f=120-w,H=240,M=[`M ${v},60`,`C ${v-4},42 150,${w} 155,${w}`,`C 173,${w} ${H-5},${w+18} ${H},60`,`C ${H-5},${f-18} 173,${f} 155,${f}`,`C 150,${f} ${v-4},78 ${v},60`,"Z"].join(" "),A=`M ${v+2},60 C ${v+2},${60-$*.4} 152,54 150,60 C 152,66 ${v+2},${60+$*.4} ${v+2},60 Z`,T=r>700?"#e05c5c":r>500?"#e0a84a":r>350?"#d4c840":"#5cce8c",y=r>700?.4:r>500?.65:r>350?1.1:1.8,E=r>500?[10,24,40,57,74,90,106]:r>350?[14,34,57,82,104]:[20,50,82,108],I=16,F=22,O=v-6,j=Math.ceil((O-F)/I)+2,B=Array.from({length:j},(z,S)=>F-I+S*I),b=12,L=8,C=B.flatMap(z=>E.map(S=>`<path d="M ${z},${S} L ${z+b},${S} M ${z+L},${S-3} L ${z+b},${S} L ${z+L},${S+3}" stroke="${T}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),R=`<g class="hw-wg-full" style="animation-duration:${y}s">${C}</g>`,P=t==null?"":t>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',N=t==null?"":`<text x="163" y="62" font-size="6" fill="${t>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${t>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${o}-wclip"><rect x="${F}" y="0" width="${O-F}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${o}-wclip)">${R}</g>
      <path d="${A}" fill="${s}08"/>
      <path d="${M}" fill="${s}12" stroke="${s}aa" stroke-width="1.2"/>
      <text x="${v+2}" y="${w-2}" font-size="7" fill="${s}" opacity=".8" font-family="sans-serif">${u(e.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${P}
      ${N}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function He(e){let t=se(e),n=e.metrics.imf_bz_nt,i=e.metrics.solar_wind_kms,o=e.metrics.kp_latest,s=e.metrics.density,r=e.metrics.pressure_npa,a=n!=null?(n>=0?"+":"")+n.toFixed(1)+" nT":"\u2014",l=i!=null?`${Math.round(i)} km/s`:"\u2014",p=s!=null?`${s.toFixed(1)} p/cm\xB3`:"\u2014",c=r!=null?`${r.toFixed(2)} nPa`:"\u2014",d=n!=null?n<=-10?"#e05c5c":n<=-5?"#e0a84a":n>=5?"#5cce8c":"#a0b4b8":"#607880",m=i!=null?i>700?"#e05c5c":i>500?"#e0a84a":i>350?"#d4c840":"#5cce8c":"#607880",h=n!=null&&n<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":n!=null&&n<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${K("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${ae(t,n,i,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${m}">${u(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${d}">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${u(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(p)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${u(c)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(h)}</div>
  </div>`}function Ae(e,t,n){if(!e.length)return null;let i=(n%360+360)%360,o=-1,s=1/0,r=Math.cos(t*Math.PI/180);for(let a of e){let l=a.lat-t,p=(a.lon-i+180+360)%360-180,c=l*l+p*r*(p*r);c<s&&(s=c,o=a.prob)}return o>=0?o:null}function Fe(e){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Te(e,t){let n=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,i=null;t&&e.lat!=null&&e.lon!=null&&(i=Ae(t.entries,e.lat,e.lon));let o=e.lat!=null&&e.lon!=null,s=i!=null?i>=30?"#5cce8c":i>=10?"#d4cc5c":"#9ab4bc":"#607880",r=i!=null?`${i}%`:t?"n/a":"\u2026",a=o?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?u(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${s}">Aurora: ${r}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${K("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${W(n)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Fe(e)}
    </div>
    ${s}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Ee(e,t,n,i){switch(t){case"solar_wind":return Se(e);case"xray":return Ce(e);case"imf_bz":return ze(e);case"aurora":return Te(n,i);case"magnetosphere":return He(e);default:return""}}function q(e,t){if(e.length<2)return"\u2192";let n=e[e.length-1],i=Math.max(0,e.length-4),o=e[i];if(!isFinite(n)||!isFinite(o))return"\u2192";let s=n-o;return s>t?"\u2191":s<-t?"\u2193":"\u2192"}function Ie(e,t,n,i,o,s){var P,N,z,S,V,X,J;let{summary:r,scales:a,metrics:l,aurora_hint:p}=e,c=(P=te[r.status])!=null?P:te.quiet,d=i!=null?i.kp.toFixed(1):l.kp_latest!=null?l.kp_latest.toFixed(1):"\u2014",h=[i?i.gScale:a.g_scale,a.r_scale,a.s_scale].map(_=>{let U=ye(_),Y=U?`color:${c.accent};border-color:${c.accent}33`:"";return`<span class="hw-scale-chip${U?" hw-scale-active":""}" style="${Y}">${u(_)}</span>`}).join(""),g=i?i.auroraLabel:p.aurora_label,x=g==="good"?"#5cce8c":g==="possible"?"#d4cc5c":"#607880",k=g.charAt(0).toUpperCase()+g.slice(1),$="#b4c6cc",v=l.solar_wind_kms!=null?`${Math.round(l.solar_wind_kms)} km/s`:"\u2014",w=l.imf_bz_nt,f=w!=null?w<=-10?"#e05c5c":w<=-5?"#e0a84a":w>=5?"#5cce8c":"#a0b4b8":"#607880",H=w!=null?(w>=0?"+":"")+w.toFixed(1)+" nT":"\u2014",M=l.xray_class,A=M?(N=re[M])!=null?N:"#a0b4b8":"#607880",T=M?`${M}-class`:"\u2014",y=q(((z=l.kp_history_1h)!=null?z:[]).map(_=>_.kp),.5),E=q(((S=l.wind_history_1h)!=null?S:[]).map(_=>_.kms),20),I=q(((V=l.bz_history_1h)!=null?V:[]).map(_=>_.bz),1.5),F=q(((X=l.xray_history_1h)!=null?X:[]).map(_=>Math.log10(_.flux+1e-9)),.15),O=t?"\u25BC Details":"\u25B6 Details",j=se(e),B=(J=l.kp_latest)!=null?J:0,b=B>=5,L=b?`linear-gradient(160deg, #0d2a1a 0%, ${c.bg}22 75%)`:`${c.bg}18`,C=(_,U,Y,de,ee)=>{let pe=ee?`<span class="hw-trend">${ee}</span>`:"";return`<div class="hw-kpi-item${n===_?" hw-kpi-active":""}" data-kpi="${_}">
      <span class="hw-qd-label">${U}</span>
      <span class="hw-qd-value" style="color:${de}">${Y}${pe}</span>
    </div>`},R=b?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${B.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${L}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${i?"color:#9acf60":""}">Kp <b>${u(d)}</b>${i?"":`<span class="hw-trend">${y}</span>`}</div>
          <span class="hw-status-badge" style="background:${c.accent}22;color:${c.accent};display:block;text-align:center">${u(r.label)}</span>
          <div class="hw-scales-row">${h}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${u(r.text)}</div>
            <div class="hw-magnet-mini${n==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${ae(j,w,l.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${j.color}">${u(j.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${C("aurora","Aurora",u(k),x)}
        ${C("solar_wind","Solar wind",u(v),$,E)}
        ${C("imf_bz","IMF Bz",u(H),f,I)}
        ${C("xray","X-ray",u(T),A,F)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${O}</button>
      ${R}
      ${n?Ee(e,n,o,s):""}
    </div>`}function Oe(e){var l,p,c;let{metrics:t}=e,n=(l=t.kp_history_1h)!=null?l:[],i=(p=t.wind_history_1h)!=null?p:[],o=(c=t.bz_history_1h)!=null?c:[],s=Me(n),r=G(i.map(d=>{var m;return(m=d.kms)!=null?m:0}).filter(d=>d>0),i.map(d=>D(d.t_utc)),"#5cce8c",28,!1),a=G(o.map(d=>d.bz),o.map(d=>D(d.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${r}</div>
      </div>
    </div>`}function Pe(e){let t=ve(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${u(t)}</span>
    </div>`}function Be(e){return e.map((t,n)=>n===0?(t+e[1])/2:n===e.length-1?(e[n-1]+t)/2:(e[n-1]+t+e[n+1])/3)}function Re(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function je(e){return e>=5?"good":e>=3?"possible":"none"}function le(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ne(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",n=le(e),i=t==="none"?"No aurora expected at mid-latitudes":n!=null?`Aurora possible equatorward of ~${n}\xB0 lat`:"Minor aurora possible at high latitudes",o=e>=7?"moderate":e>=5?"low":"none",s=o==="none"?"No significant HF degradation expected":o==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",r=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:i},{kind:"radio",level:o,label:"HF Radio",summary:s},{kind:"solar_activity",level:r,label:"Solar Activity",summary:r==="none"?"Quiet geomagnetic conditions expected":r==="low"?"Active geomagnetic conditions possible":r==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function De(e,t){var d;if(t<=0)return null;let n=(d=e.metrics.kp_forecast_3h)!=null?d:[];if(!n.length)return null;let i=Date.now()+t*36e5,o=n[0],s=1/0;for(let m of n){let h=Math.abs(new Date(m.t_utc).getTime()-i);h<s&&(s=h,o=m)}let r=o.kp,a=Re(r),l=je(r),p=le(r),c=Ne(r);return{offsetH:t,kp:r,gScale:a,auroraLabel:l,auroraMinLat:p,impacts:c}}function We(e,t,n){var B;let{forecast:i,metrics:o}=e,{kp_max_next_24h:s,kp_max_at_utc:r,trend:a}=i,l=((B=o.kp_forecast_3h)!=null?B:[]).slice(0,16),p=l.length,c=p*3,d=c>0?`${(t/c*100).toFixed(0)}%`:"0%",m=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",h="Kp forecast unavailable";if(s!=null){let b=ne(r),L=a==="rising"?"rising":a==="falling"?"falling":"steady";h=`Peak Kp ${s.toFixed(1)} next 24h${b?` at ${b}`:""} \xB7 ${L}`}if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${u(h)}</div>
    </div>`;let g=320,x=38,k=14,$=x+k,v=g/p,w=b=>x-Math.max(2,Math.min(x-2,b/9*(x-2))),f="",H=l.map(b=>b.kp),M=Be(H);l.forEach((b,L)=>{let C=w(b.kp),R=x-C,P=L*v,N=P+v/2,z=b.kp>=6?"#e05c5c":b.kp>=5?"#e0a84a":b.kp>=4?"#d4cc5c":"#5cce8c",S=`Kp ${b.kp.toFixed(1)} \xB7 ${ne(b.t_utc)}`;if(f+=`<rect x="${P.toFixed(1)}" y="${C.toFixed(1)}" width="${(v-1.5).toFixed(1)}" height="${R.toFixed(1)}" fill="${z}" fill-opacity="0.85" rx="1.5"/>`,f+=`<rect x="${P.toFixed(1)}" y="0" width="${v.toFixed(1)}" height="${x}" fill="transparent"><title>${W(S)}</title></rect>`,p<=8||L%2===0){let X=new Date(b.t_utc).getHours();f+=`<text x="${N.toFixed(1)}" y="${($-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${X.toString().padStart(2,"0")}</text>`}});let T=`<polyline points="${l.map((b,L)=>{let C=L*v+v/2,R=w(M[L]);return`${C.toFixed(1)},${R.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,y="";if(t>0&&p>0){let b=Math.min(g-1,t/(p*3)*g);y=`
      <line x1="${b.toFixed(1)}" y1="0" x2="${b.toFixed(1)}" y2="${x}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${b.toFixed(1)},${x} ${(b-4).toFixed(1)},${(x-7).toFixed(1)} ${(b+4).toFixed(1)},${(x-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let E=Math.round(c/4),I=Math.round(c/2),F=Math.round(c*3/4),O=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${u(m)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${d}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${E}h</span>
        <span class="hw-scrub-tick">+${I}h</span>
        <span class="hw-scrub-tick">+${F}h</span>
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
      <div class="hw-forecast-text">${u(h)}</div>
      <svg viewBox="0 0 ${g} ${$}" style="width:100%;height:${$}px;display:block" preserveAspectRatio="none">
        ${f}
        ${T}
        ${y}
      </svg>
      ${O}
    </div>`}function Ke(e){let t=/([NS])(\d+)([EW])(\d+)/i.exec(e);return t?{lat:(t[1].toUpperCase()==="N"?1:-1)*parseInt(t[2],10),lon:(t[3].toUpperCase()==="E"?1:-1)*parseInt(t[4],10)}:null}function Xe(e,t){let n=t/2,i=n*.87,o=e.map(s=>{var h,g;let r=Ke(s.location);if(!r||Math.abs(r.lon)>88)return"";let a=r.lat*Math.PI/180,l=r.lon*Math.PI/180,p=(n+i*Math.cos(a)*Math.sin(l)).toFixed(1),c=(n-i*Math.sin(a)).toFixed(1),d=s.x_flare_probability>0?"#e05c5c":s.m_flare_probability>10?"#e0a84a":s.c_flare_probability>20?"#d4cc5c":"#c8d8e0",m=`AR ${s.region} \xB7 ${s.location}
Class: ${(h=s.spot_class)!=null?h:"\u2014"} / ${(g=s.mag_class)!=null?g:"\u2014"}
C: ${s.c_flare_probability}%  M: ${s.m_flare_probability}%  X: ${s.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${u(m)}</title>
      <circle cx="${p}" cy="${c}" r="3.5" fill="${d}" stroke="#000" stroke-width="0.6" opacity="0.88"/>
      <text x="${p}" y="${(parseFloat(c)-5).toFixed(1)}" font-size="5" fill="${d}" text-anchor="middle" font-family="monospace" opacity="0.95">${s.region}</text>
    </g>`}).join("");return`<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${o}</svg>`}var Ue={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},qe='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Ge="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Ve=80;function Ye(e,t,n,i){var d,m;let o=(m=(d=t==null?void 0:t.impacts)!=null?d:e.observer_impacts)!=null?m:[],s=o.map(h=>{var w,f;let g=(w=fe[h.level])!=null?w:"#666",x=h.level==="none"?"None":h.level.charAt(0).toUpperCase()+h.level.slice(1),k=(f=Ue[h.kind])!=null?f:qe,$=h.level==="none"?"#606870":g,v=h.kind==="solar_activity"?`<div class="hw-solar-tip">
           <div class="hw-solar-disk-wrap">
             <img class="hw-solar-disk-img" src="${Ge}" alt="Solar disk" loading="lazy" />
             ${n?Xe(n,Ve):""}
           </div>
           <span class="hw-solar-tip-text">${u(h.summary)}</span>
         </div>`:`<div class="hw-impact-tip">${u(h.summary)}</div>`;return`<div class="hw-impact-row">
      <span class="hw-impact-kind" style="color:${$}">${k}<span style="color:#b4c6cc">${u(h.label)}</span></span>
      <span class="hw-impact-badge" style="background:${g}22;color:${g}">${u(x)}</span>
      ${v}
    </div>`}).join(""),r=t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",a=o.length,l=i?"\u25BC":"\u25B6",p=a>0?`Observer Impacts (${a})`:"Observer Impacts";return`
    <div class="hw-impacts">
      ${`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${l}</span>
      <span class="hw-section-label" style="margin-bottom:0">${p}${r}</span>
    </div>`}
      ${i?s:""}
    </div>`}var oe={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Ze(e,t){var l,p;let n=(l=be[e.level])!=null?l:"#666",i=e.level.charAt(0).toUpperCase()+e.level.slice(1),o=(p=oe[e.kind])!=null?p:oe.unknown,s=[$e(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),r=t&&e.raw_body?`<div class="hw-alert-body">${u(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${n}" data-alert-key="${W(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${n}">${o}</span>
      <span class="hw-alert-level" style="color:${n}">${u(i)}</span>
      <span class="hw-alert-title">${u(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${u(e.summary_short)}</div>
    <div class="hw-alert-meta">${u(s)}</div>
    ${r}
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
${n.join(" \xB7 ")}`}function nt(e,t,n){var l;let i=e.is_active?Je:(l=Qe[e.level])!=null?l:"#445c64",o=e.event_time===n,s=e.event_time.slice(11,16)+" UTC",r=e.source==="NASA_DONKI"?"DONKI":"SWPC",a=o?`<div class="hw-tl-detail">${u(e.description)}${u(tt(e))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${W(e.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${i}"></div>
        ${t?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${s}</span>
          <span class="hw-tl-src">${r}</span>
        </div>
        <div class="hw-tl-title${e.is_active?" hw-tl-active":""}">
          ${et(e.event_type)} ${u(e.event_title)}
        </div>
        ${a}
      </div>
    </div>`}function it(e,t,n,i){var $,v;let o=($=e.timeline)!=null?$:[],s=Date.now(),r=new Date(s).toISOString().slice(0,10),a=new Date(s-864e5).toISOString().slice(0,10),l=new Date(s-1728e5).toISOString().slice(0,10),p=new Set([r,a,l]),c=o.filter(w=>{var f;return p.has(((f=w.event_time)!=null?f:"").slice(0,10))}).slice().reverse(),d=c.length,m=n?"\u25BC":"\u25B6",h=d>0?`Solar Activity Timeline (${d})`:"Solar Activity Timeline",g=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${h}</span>
    </div>`;if(!n||d===0)return`<div class="hw-timeline">${g}</div>`;let x=new Map;for(let w of c){let f=((v=w.event_time)!=null?v:"").slice(0,10);x.has(f)||x.set(f,[]),x.get(f).push(w)}let k=[...x.entries()].map(([w,f])=>{let M=new Date(w+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),A=i.has(w),T=A?"\u25B6":"\u25BC",y=A?`<span class="hw-tl-day-count">${f.length} events</span>`:"",E=`
      <div class="hw-tl-day-row" data-tl-day="${W(w)}">
        <span class="hw-section-caret">${T}</span>
        <span class="hw-tl-date">${M}</span>
        ${y}
      </div>`,I=A?"":f.map((F,O)=>nt(F,O<f.length-1,t)).join("");return`<div class="hw-tl-group">${E}${I}</div>`}).join("");return`
    <div class="hw-timeline">
      ${g}
      ${k}
    </div>`}function ot(e,t,n){var p;let i=(p=e.alerts_all)!=null?p:[],o=i.length,s=t?"\u25BC":"\u25B6",r=o>0?`SWPC Alerts (${o})`:"SWPC Alerts",a=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${s}</span>
        <span class="hw-alerts-label">${r}</span>
      </div>
    </div>`;if(!t||o===0)return`<div class="hw-alerts">${a}${t&&o===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let l=i.map(c=>Ze(c,c.dedupe_key===n)).join("");return`
    <div class="hw-alerts">
      ${a}
      ${l}
    </div>`}function rt(e,t,n,i,o,s,r,a,l,p,c,d,m,h){let g=De(e,o);return`
    <div class="hw-root">
      ${Pe(e)}
      ${Ie(e,n,i,g,m,h)}
      ${n?Oe(e):""}
      ${We(e,o,g)}
      ${Ye(e,g,d,c)}
      ${it(e,a,l,p)}
      ${ot(e,s,r)}
    </div>`}function st(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${u(e)}</div>
    </div>
  </div>`}function at(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var Q=class{constructor(t,n){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.solarRegions=null;this.ovationData=null;this.timer=null;this.data=null;this.el=t,this.opts=n,this.el.innerHTML=at(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var a,l,p,c;let n=t.target;if(n.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(n.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}if(n.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let i=n.closest("[data-alert-key]");if(i){let d=(a=i.dataset.alertKey)!=null?a:null;this.expandedAlertKey=this.expandedAlertKey===d?null:d,this.render();return}if(n.closest("[data-tl-section]")){this.timelineOpen=!this.timelineOpen,this.render();return}let o=n.closest("[data-tl-day]");if(o){let d=(l=o.dataset.tlDay)!=null?l:"";this.collapsedDays.has(d)?this.collapsedDays.delete(d):this.collapsedDays.add(d),this.render();return}let s=n.closest("[data-timeline-key]");if(s){let d=(p=s.dataset.timelineKey)!=null?p:null;this.expandedTimelineKey=this.expandedTimelineKey===d?null:d,this.render();return}if(n.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let r=n.closest("[data-kpi]");if(r){let d=(c=r.dataset.kpi)!=null?c:null;this.activePopover=this.activePopover===d?null:d,this.render();return}if(n.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}n.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let n=t.target;if(!n.matches("[data-scrub]"))return;let i=parseFloat(n.value);this.scrubOffset=i,n.style.setProperty("--pct",`${(i/parseFloat(n.max)*100).toFixed(0)}%`);let o=this.el.querySelector(".hw-scrub-title");o&&(o.textContent=i>0?`\u23F1 +${Math.round(i)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let n=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(n){let i=n instanceof Error?n.message:String(n);this.el.innerHTML=st(`Space weather data unavailable (${i})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}async fetchSolarRegions(){try{let t=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!t.ok)return;let n=await t.json(),i=new Map;for(let o of n){let s=i.get(o.region);(!s||o.observed_date>s.observed_date)&&i.set(o.region,o)}this.solarRegions=[...i.values()],this.render()}catch(t){}}async fetchOvationData(){var t,n,i,o,s,r;if(!(this.opts.lat==null||this.opts.lon==null))try{let a=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!a.ok)return;let l=await a.json(),c=((i=(n=(t=l.coordinates)!=null?t:l.Data)!=null?n:l.data)!=null?i:[]).map(([d,m,h])=>({lon:d,lat:m,prob:h}));this.ovationData={entries:c,forecastTime:String((r=(s=(o=l["Forecast Time"])!=null?o:l.forecast_time)!=null?s:l["Observation Time"])!=null?r:"")},this.render()}catch(a){}}render(){this.data&&(this.el.innerHTML=rt(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.solarRegions,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},ce={mount(e,t){return _e(),new Q(e,t)}};typeof window!="undefined"&&(window.HelioWidget=ce);return xe(lt);})();
