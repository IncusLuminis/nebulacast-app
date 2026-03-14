"use strict";var HelioWidgetModule=(()=>{var Z=Object.defineProperty;var ge=Object.getOwnPropertyDescriptor;var me=Object.getOwnPropertyNames;var xe=Object.prototype.hasOwnProperty;var we=(e,t)=>{for(var o in t)Z(e,o,{get:t[o],enumerable:!0})},fe=(e,t,o,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of me(t))!xe.call(e,n)&&n!==o&&Z(e,n,{get:()=>t[n],enumerable:!(r=ge(t,n))||r.enumerable});return e};var be=e=>fe(Z({},"__esModule",{value:!0}),e);var it={};we(it,{HelioWidget:()=>pe});var te={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},ve={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},$e={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},ae={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"};function ye(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let o=Math.floor(t/60);return o<24?`Updated ${o}h ago`:`Updated ${Math.floor(o/24)}d ago`}catch(t){return"Updated recently"}}function ke(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function oe(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function E(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function Q(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function _e(e){return parseInt(e.slice(1),10)>0}var Me=`
.hw-root{font-family:inherit;color:#e0e0e0;background:#161c1e;border-radius:6px;overflow:hidden}
.hw-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#1a2428;border-bottom:1px solid #2a3438}
.hw-header-title{font-size:.78em;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b4c4cc}
.hw-freshness{font-size:.72em;color:#7a9098}

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
.hw-scale-chip{font-size:.72em;font-weight:600;padding:1px 6px;border-radius:2px;background:#222e32;color:#7a9098;border:1px solid #2a3c42}
.hw-scale-chip.hw-scale-active{color:#e0a84a;border-color:#5a4020}
.hw-summary-text{font-size:.78em;color:#96a8b8;line-height:1.4}

/* Hero toggle (bottom-left, 2 font steps up) */
.hw-hero-toggle-btn{font-size:.78em;color:#607880;background:none;border:none;cursor:pointer;padding:0;white-space:nowrap;margin-top:8px;display:block;transition:color .15s}
.hw-hero-toggle-btn:hover{color:#b4c6cc}

/* Hero quick details \u2014 KPI items are clickable */
.hw-quick-details{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-kpi-item{display:flex;align-items:baseline;gap:5px;cursor:pointer;border-radius:4px;padding:3px 5px;margin:-3px -5px;transition:background .12s}
.hw-kpi-item:hover{background:#ffffff0d}
.hw-kpi-item.hw-kpi-active{background:#ffffff12}
.hw-qd-label{font-size:.68em;color:#7a9098;flex-shrink:0}
.hw-qd-value{font-size:.82em;font-weight:600}
.hw-trend{font-size:.8em;opacity:.72;margin-left:2px;font-weight:400;letter-spacing:0}

/* KPI popover */
.hw-kpi-popover{background:#0e1517;border-radius:4px;padding:10px 12px;margin-top:10px;border:1px solid #1e2c30}
.hw-kpi-popover-title{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.hw-kpi-popover-close{background:none;border:none;color:#607880;cursor:pointer;font-size:.9em;padding:0;line-height:1;transition:color .15s}
.hw-kpi-popover-close:hover{color:#b4c6cc}
.hw-kpi-stat-row{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #1a2428}
.hw-kpi-stat{display:flex;flex-direction:column;gap:2px;flex:1}
.hw-kpi-stat-label{font-size:.63em;color:#607880;text-transform:uppercase;letter-spacing:.05em}
.hw-kpi-stat-value{font-size:.78em;font-weight:600;color:#b4c6cc}
.hw-kpi-hint{font-size:.72em;color:#7a9098;margin-top:8px;padding:6px 8px;background:#131a1c;border-radius:3px;border-left:2px solid #2a3c42;line-height:1.4}
.hw-xray-scale{display:flex;gap:0;height:6px;border-radius:3px;overflow:hidden;margin-top:8px}
.hw-xray-scale-band{flex:1;position:relative}
.hw-xray-scale-marker{position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid #fff}
.hw-xray-scale-labels{display:flex;margin-top:3px}
.hw-xray-scale-label{flex:1;font-size:.63em;color:#607880;text-align:center}
.hw-aurora-map-wrap{position:relative;border-radius:3px;overflow:hidden;background:#0a1012}
.hw-aurora-img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
.hw-aurora-caption{font-size:.65em;color:#607880;margin-top:5px;text-align:center}
.hw-aurora-obs-panel{display:flex;align-items:center;gap:5px;padding:5px 0 1px;font-size:.72em;color:#9ab4bc}
.hw-aurora-prob{font-weight:600;margin-left:auto}

/* Hero detail panel */
.hw-hero-detail{border-bottom:1px solid #1e2c30;padding:10px 14px;background:#131a1c}
.hw-spark-row{margin-bottom:10px}
.hw-spark-row:last-child{margin-bottom:0}
.hw-spark-label{font-size:.65em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.hw-spark-wrap{border-radius:3px;overflow:hidden;background:#0e1517}

/* Forecast */
.hw-forecast{padding:10px 14px;border-bottom:1px solid #1e2c30}
.hw-section-label{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
.hw-forecast-text{font-size:.78em;color:#b4c6cc;margin-bottom:8px}
.hw-forecast-bars{display:flex;align-items:flex-end;gap:2px;height:40px}
.hw-bar-col{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1}
.hw-bar{width:100%;border-radius:2px 2px 0 0;min-height:2px}

/* Timeline scrubber */
.hw-scrub-wrap{margin-top:10px;padding-top:8px;border-top:1px solid #1e2c30}
.hw-scrub-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.hw-scrub-title{font-size:.65em;color:#607880;letter-spacing:.04em}
.hw-scrub-reset{font-size:.65em;color:#607880;background:none;border:none;cursor:pointer;padding:0 2px;line-height:1.2;transition:color .15s}
.hw-scrub-reset:hover{color:#b4c6cc}
.hw-scrub-slider{width:100%;cursor:pointer;margin:2px 0 0;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:linear-gradient(to right,#5cce8c var(--pct,0%),#2a3c42 var(--pct,0%));outline:none;display:block}
.hw-scrub-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;margin-top:-4.5px}
.hw-scrub-slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#5cce8c;cursor:pointer;border:none}
.hw-scrub-tick-row{display:flex;justify-content:space-between;margin-top:3px}
.hw-scrub-tick{font-size:.62em;color:#607880}
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
.hw-impact-tip{flex-basis:100%;font-size:.72em;color:#7a9098;line-height:1.45;padding:5px 6px;background:#111b1e;border-radius:2px;border-left:2px solid #2a3c42;display:none;margin-top:4px}
.hw-impact-row:hover .hw-impact-tip{display:block}
.hw-solar-tip{flex-basis:100%;display:none;flex-direction:row;align-items:center;gap:10px;margin-top:6px;padding:6px;background:#111b1e;border-radius:4px;border:1px solid #1e2c30}
.hw-impact-row:hover .hw-solar-tip{display:flex}
.hw-solar-disk-wrap{position:relative;flex-shrink:0;width:80px;height:80px}
.hw-solar-disk-img{position:absolute;top:0;left:0;width:80px;height:80px;border-radius:50%;object-fit:cover;background:#0a0a0a;border:1px solid #2a3c42}
.hw-solar-tip-text{font-size:.72em;color:#7a9098;line-height:1.5}

/* Alerts */
.hw-alerts{padding:10px 14px}
.hw-alerts-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.hw-alerts-label{font-size:.68em;color:#7a9098;letter-spacing:.06em;text-transform:uppercase}
.hw-alerts-toggle{font-size:.68em;color:#607880;background:none;border:none;cursor:pointer;padding:0;transition:color .15s;letter-spacing:.03em}
.hw-alerts-toggle:hover{color:#b4c6cc}
.hw-alert-item{border-left:2px solid;padding:7px 10px;margin-bottom:6px;border-radius:0 3px 3px 0;background:#1a2428;cursor:pointer;transition:background .12s}
.hw-alert-item:last-child{margin-bottom:0}
.hw-alert-item:hover{background:#1e2c32}
.hw-alert-item.hw-alert-open{background:#1e2c32}
.hw-alert-top{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.hw-alert-icon{flex-shrink:0;opacity:.85}
.hw-alert-level{font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.hw-alert-title{font-size:.8em;font-weight:600;color:#ccdade}
.hw-alert-summary{font-size:.75em;color:#7a9098;line-height:1.3;margin-bottom:3px}
.hw-alert-meta{font-size:.68em;color:#607880}
.hw-alert-body{margin-top:8px;padding:7px 8px;background:#111b1e;border-radius:2px;font-size:.7em;color:#96a8b8;line-height:1.55;white-space:pre-wrap;font-family:monospace;word-break:break-word;border-top:1px solid #2a3c42}
.hw-empty-alerts{font-size:.78em;color:#607880;font-style:italic;padding:4px 0}

/* Magnetosphere */
.hw-info-top-row{display:flex;gap:8px;align-items:flex-start}
.hw-magnet-mini{flex-shrink:0;cursor:pointer;border-radius:4px;border:1px solid #1e2c30;padding:1px;transition:background .12s;display:flex;flex-direction:column;align-items:center;width:80px}
.hw-magnet-mini:hover,.hw-magnet-mini.hw-kpi-active{background:#ffffff0d;border-color:#2a3c42}
.hw-magnet-state{font-size:.64em;text-align:center;margin-top:2px;font-weight:600;letter-spacing:.03em}
@keyframes hw-wind{0%{transform:translateX(0);opacity:.85}100%{transform:translateX(14px);opacity:0}}
.hw-wg{animation:hw-wind 1.5s linear infinite}

/* States */
.hw-error{padding:16px;text-align:center;color:#607880}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`,re=!1;function Le(){if(re)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=Me,document.head.appendChild(e),re=!0}function Ce(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,o=32,r=e.length,n=t/r,i=e.map((a,s)=>{let l=Math.max(2,Math.min(o,a.kp/9*o)),d=o-l,c=s*n,p=a.kp>=6?"#e05c5c":a.kp>=5?"#e0a84a":a.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${d.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${l.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${a.kp.toFixed(1)} \xB7 ${u(E(a.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">${i}</svg>`}function G(e,t,o,r,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let i=200,a=Math.min(...e),s=Math.max(...e),l=s-a||1,d=g=>r-2-(g-a)/l*(r-4),c=e.map((g,h)=>`${(h/(e.length-1)*i).toFixed(1)},${d(g).toFixed(1)}`).join(" "),p="";if(n&&a<0&&s>0){let g=d(0);p=`<line x1="0" y1="${g.toFixed(1)}" x2="${i}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let x=e.map((g,h)=>`<rect x="${(h/(e.length-1)*i-4).toFixed(1)}" y="0" width="8" height="${r}" fill="transparent"><title>${u(t[h]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${i} ${r}" style="width:100%;height:${r}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${c}" fill="none" stroke="${o}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${x}
  </svg>`}function Se(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,o=32,r=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),n=Math.min(...r),a=Math.max(...r)-n||1,s=c=>o-2-(c-n)/a*(o-4),l=r.map((c,p)=>`${(p/(r.length-1)*t).toFixed(1)},${s(c).toFixed(1)}`).join(" "),d=e.map((c,p)=>{let x=p/(r.length-1)*t,g=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(x-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${u(E(c.t_utc))} \xB7 ${g}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    <polyline points="${l}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${d}
  </svg>`}function B(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function ze(e){var s;let t=(s=e.metrics.wind_history_1h)!=null?s:[],o=G(t.map(l=>{var d;return(d=l.kms)!=null?d:0}).filter(l=>l>0),t.map(l=>E(l.t_utc)),"#5cce8c",36,!1),r=t[t.length-1],n=(r==null?void 0:r.density)!=null?`${r.density.toFixed(2)} cm\u207B\xB3`:"\u2014",i=(r==null?void 0:r.temp_kk)!=null?`${r.temp_kk.toFixed(0)} kK`:"\u2014",a=(r==null?void 0:r.pressure_npa)!=null?`${r.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${N("Solar Wind \xB7 Last 24h")}
    <div class="hw-spark-wrap">${o}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${u(n)}</span>
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
  </div>`}function Fe(e){var d,c,p;let t=(d=e.metrics.xray_history_1h)!=null?d:[],o=Se(t),r=(c=e.metrics.xray_class)!=null?c:"A",n=e.metrics.xray_flux_wm2,i=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",a=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],s=a.map(x=>{let g=x.label===r,h=g?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${x.color}${g?"cc":"44"}">${h}</div>`}).join(""),l=a.map(x=>`<div class="hw-xray-scale-label" style="color:${x.label===r?"#c8d8dc":"#607880"}">${x.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${N("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${o}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${s}</div>
      <div class="hw-xray-scale-labels">${l}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(p=ae[r])!=null?p:"#a0b4b8"}">${u(r)}-class</b> \xB7 ${u(i)}</div>
  </div>`}function He(e){var a;let t=(a=e.metrics.bz_history_5m)!=null?a:[],o=G(t.map(s=>s.bz),t.map(s=>E(s.t_utc)),"#d4cc5c",36,!0),r=e.metrics.imf_bz_nt,n=r!=null?r<=-10?"#e05c5c":r<=-5?"#e0a84a":r>=5?"#5cce8c":"#a0b4b8":"#607880",i=r!=null?(r>=0?"+":"")+r.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${N("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${o}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${n}">${u(i)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function se(e){var l,d;let t=e.metrics.imf_bz_nt,o=(l=e.metrics.kp_latest)!=null?l:0,r=(d=e.metrics.solar_wind_kms)!=null?d:0,n,i,a;if(t!=null&&t<-5||o>=6)n="storm",i="#e05c5c",a="Storm conditions";else if(t!=null&&t<0||o>=4||r>=400){let c=t!=null&&t<0;n="active",i="#e0a84a",a=c?"Active coupling":"Elevated"}else n="stable",i="#5cce8c",a="Stable";let s;return t==null?s="Unknown":t>2?s="Closed":t>0?s="Minimal":t>-5?s="Moderate":t>-10?s="Strong":s="Very strong",{state:n,color:i,label:a,coupling:s}}function le(e,t,o,r){let n=r?"mc":"mf",i=e.color,a=o!=null?o:0,s=a>500,l=a<350,d=s?.9:l?1.8:1.3;if(r){let h=45-(e.state==="storm"?11:e.state==="active"?16:21),m=e.state==="storm"?12:e.state==="active"?10:8,v=50-m,f=76,y=[`M ${h},25`,`C ${h-2},15 41,${m} 45,${m}`,`C 53,${m} ${f-8},${m+4} ${f},20`,`C ${f+1},23 ${f+1},27 ${f},30`,`C ${f-8},${v-4} 53,${v} 45,${v}`,`C 41,${v} ${h-2},35 ${h},25`,"Z"].join(" "),b=s?3:2,_=[14,25,36],z=k=>`<path d="M 0,${k} L ${s?8:6},${k} M ${s?6:4},${k-2} L ${s?8:6},${k} L ${s?6:4},${k+2}" stroke="${i}bb" stroke-width="${s?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,$=_.map(k=>z(k)).join(""),H=Array.from({length:b},(k,A)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/b*A).toFixed(2)}s">${$}</g>`).join(""),F=t==null?"":t>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${H}</g>
      <path d="${y}" fill="${i}14" stroke="${i}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${F}
    </svg>`}else{let g=e.state==="storm"?26:e.state==="active"?38:50,h=110-g,m=e.state==="storm"?28:e.state==="active"?22:18,v=120-m,f=188,y=[`M ${h},60`,`C ${h-5},38 100,${m} 110,${m}`,`C 128,${m} ${f-20},${m+10} ${f},48`,`C ${f+3},55 ${f+3},65 ${f},72`,`C ${f-20},${v-10} 128,${v} 110,${v}`,`C 100,${v} ${h-5},82 ${h},60`,"Z"].join(" "),b=`M ${h+2},60 C ${h+2},${60-g*.4} 106,52 100,60 C 106,68 ${h+2},${60+g*.4} ${h+2},60 Z`,_=s?4:3,z=[24,42,60,78,96],$=40,H=s?18:14,F=s?14:10,k=M=>`<path d="M ${$},${M} L ${$+H},${M} M ${$+F},${M-4} L ${$+H},${M} L ${$+F},${M+4}" stroke="${i}bb" stroke-width="${s?2:1.5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,A=z.map(M=>k(M)).join(""),I=Array.from({length:_},(M,T)=>`<g class="hw-wg" style="animation-duration:${d}s;animation-delay:${(d/_*T).toFixed(2)}s">${A}</g>`).join(""),P=t==null?"":t>0?'<path d="M 110,65 L 110,55 M 107,58 L 110,55 L 113,58" stroke="#5cce8c" stroke-width="1.5" fill="none" stroke-linecap="round"/>':'<path d="M 110,55 L 110,65 M 107,62 L 110,65 L 113,62" stroke="#e05c5c" stroke-width="1.5" fill="none" stroke-linecap="round"/>',B=t==null?"":`<text x="123" y="62" font-size="7" fill="${t>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${t>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="0 0 200 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${n}-wclip"><rect x="38" y="0" width="46" height="120"/></clipPath></defs>
      <rect width="200" height="120" fill="#0a1014" rx="3"/>
      <circle cx="0" cy="60" r="36" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${n}-wclip)">${I}</g>
      <path d="${b}" fill="${i}08"/>
      <path d="${y}" fill="${i}12" stroke="${i}aa" stroke-width="1.2"/>
      <text x="${h+3}" y="${m-2}" font-size="7" fill="${i}" opacity=".75" font-family="sans-serif">${u(e.label)}</text>
      <circle cx="110" cy="60" r="10" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${P}
      ${B}
      <text x="2" y="113" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
    </svg>`}}function Ae(e){let t=se(e),o=e.metrics.imf_bz_nt,r=e.metrics.solar_wind_kms,n=e.metrics.kp_latest,i=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014",a=r!=null?`${Math.round(r)} km/s`:"\u2014",s=n!=null?n.toFixed(1):"\u2014",l=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",d=o!=null&&o<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":o!=null&&o<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${N("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${le(t,o,r,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${l}">${u(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${u(a)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${t.color}">${u(t.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${u(d)}</div>
  </div>`}var ce=60;function Te(e,t,o,r,n){let i=n*(90-e)/ce,a=t*Math.PI/180;return{x:o+i*Math.sin(a),y:r-i*Math.cos(a)}}function Re(e,t,o){if(!e.length)return null;let r=(o%360+360)%360,n=-1,i=1/0,a=Math.cos(t*Math.PI/180);for(let s of e){let l=s.lat-t,d=(s.lon-r+180+360)%360-180,c=l*l+d*a*(d*a);c<i&&(i=c,n=s.prob)}return n>=0?n:null}function Ee(e){var l;let i=[40,50,60,70,80].map(d=>{let c=(46*(90-d)/ce).toFixed(1),p=(50+parseFloat(c)+1).toFixed(1);return`<circle cx="50" cy="50" r="${c}" fill="none" stroke="#fff" stroke-width=".3" stroke-dasharray="1.5 2" opacity=".3"/><text x="${p}" y="50" font-size="2.8" fill="#7c9ca8" font-family="monospace" dominant-baseline="middle" opacity=".7">${d}\xB0</text>`}).join(""),a=['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>'].join(""),s="";if(e.lat!=null&&e.lon!=null){let d=Te(e.lat,e.lon,50,50,46),c=d.x-50,p=d.y-50,x=Math.sqrt(c*c+p*p),g=x<=46?d.x:50+c/x*46,h=x<=46?d.y:50+p/x*46,m=g.toFixed(1),v=h.toFixed(1),f=(l=e.locationName)!=null?l:"",y=g<72,b=y?(g+2.8).toFixed(1):(g-2.8).toFixed(1),_=(h-2.2).toFixed(1),$=f?`<text x="${b}" y="${_}" font-size="3" fill="#e8f0f2" font-family="system-ui,sans-serif"
           text-anchor="${y?"start":"end"}" opacity=".82"
           style="text-shadow:0 0 2px #000">${u(f)}</text>`:"";s=`<circle cx="${m}" cy="${v}" r="2.6" fill="none" stroke="#fff" stroke-width=".5" opacity=".55" stroke-dasharray=".9 .6"/><circle cx="${m}" cy="${v}" r="1.4" fill="#fff" stroke="#000" stroke-width=".35" opacity=".92"/>`+$}return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${i}${a}${s}</svg>`}function Ie(e,t){let o=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,r=null;t&&e.lat!=null&&e.lon!=null&&(r=Re(t.entries,e.lat,e.lon));let n=e.lat!=null&&e.lon!=null,i=r!=null?r>=30?"#5cce8c":r>=10?"#d4cc5c":"#9ab4bc":"#607880",a=r!=null?`${r}%`:t?"n/a":"\u2026",s=n?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${e.locationName?u(e.locationName)+" \xB7 ":""}${e.lat.toFixed(1)}\xB0${e.lat>=0?"N":"S"} ${Math.abs(e.lon).toFixed(1)}\xB0${e.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${i}">Aurora: ${a}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${N("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${Q(o)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${Ee(e)}
    </div>
    ${s}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Pe(e,t,o,r){switch(t){case"solar_wind":return ze(e);case"xray":return Fe(e);case"imf_bz":return He(e);case"aurora":return Ie(o,r);case"magnetosphere":return Ae(e);default:return""}}function U(e,t){if(e.length<2)return"\u2192";let o=e[e.length-1],r=Math.max(0,e.length-4),n=e[r];if(!isFinite(o)||!isFinite(n))return"\u2192";let i=o-n;return i>t?"\u2191":i<-t?"\u2193":"\u2192"}function Be(e,t,o,r,n,i){var R,O,W,D,q,K,J;let{summary:a,scales:s,metrics:l,aurora_hint:d}=e,c=(R=te[a.status])!=null?R:te.quiet,p=r!=null?r.kp.toFixed(1):l.kp_latest!=null?l.kp_latest.toFixed(1):"\u2014",g=[r?r.gScale:s.g_scale,s.r_scale,s.s_scale].map(L=>{let X=_e(L),Y=X?`color:${c.accent};border-color:${c.accent}33`:"";return`<span class="hw-scale-chip${X?" hw-scale-active":""}" style="${Y}">${u(L)}</span>`}).join(""),h=r?r.auroraLabel:d.aurora_label,m=h==="good"?"#5cce8c":h==="possible"?"#d4cc5c":"#607880",v=h.charAt(0).toUpperCase()+h.slice(1),f="#b4c6cc",y=l.solar_wind_kms!=null?`${Math.round(l.solar_wind_kms)} km/s`:"\u2014",b=l.imf_bz_nt,_=b!=null?b<=-10?"#e05c5c":b<=-5?"#e0a84a":b>=5?"#5cce8c":"#a0b4b8":"#607880",z=b!=null?(b>=0?"+":"")+b.toFixed(1)+" nT":"\u2014",$=l.xray_class,H=$?(O=ae[$])!=null?O:"#a0b4b8":"#607880",F=$?`${$}-class`:"\u2014",k=U(((W=l.kp_history_1h)!=null?W:[]).map(L=>L.kp),.5),A=U(((D=l.wind_history_1h)!=null?D:[]).map(L=>L.kms),20),I=U(((q=l.bz_history_1h)!=null?q:[]).map(L=>L.bz),1.5),P=U(((K=l.xray_history_1h)!=null?K:[]).map(L=>Math.log10(L.flux+1e-9)),.15),B=t?"\u25BC Details":"\u25B6 Details",M=se(e),T=(J=l.kp_latest)!=null?J:0,w=T>=5,C=w?`linear-gradient(160deg, #0d2a1a 0%, ${c.bg}22 75%)`:`${c.bg}18`,S=(L,X,Y,he,ee)=>{let ue=ee?`<span class="hw-trend">${ee}</span>`:"";return`<div class="hw-kpi-item${o===L?" hw-kpi-active":""}" data-kpi="${L}">
      <span class="hw-qd-label">${X}</span>
      <span class="hw-qd-value" style="color:${he}">${Y}${ue}</span>
    </div>`},j=w?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${T.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${C}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${r?"color:#9acf60":""}">Kp <b>${u(p)}</b>${r?"":`<span class="hw-trend">${k}</span>`}</div>
          <span class="hw-status-badge" style="background:${c.accent}22;color:${c.accent};display:block;text-align:center">${u(a.label)}</span>
          <div class="hw-scales-row">${g}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${u(a.text)}</div>
            <div class="hw-magnet-mini${o==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${le(M,b,l.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${M.color}">${u(M.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${S("aurora","Aurora",u(v),m)}
        ${S("solar_wind","Solar wind",u(y),f,A)}
        ${S("imf_bz","IMF Bz",u(z),_,I)}
        ${S("xray","X-ray",u(F),H,P)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${B}</button>
      ${j}
      ${o?Pe(e,o,n,i):""}
    </div>`}function je(e){var l,d,c;let{metrics:t}=e,o=(l=t.kp_history_1h)!=null?l:[],r=(d=t.wind_history_1h)!=null?d:[],n=(c=t.bz_history_1h)!=null?c:[],i=Ce(o),a=G(r.map(p=>{var x;return(x=p.kms)!=null?x:0}).filter(p=>p>0),r.map(p=>E(p.t_utc)),"#5cce8c",28,!1),s=G(n.map(p=>p.bz),n.map(p=>E(p.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
    </div>`}function Ne(e){let t=ye(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${u(t)}</span>
    </div>`}function Oe(e){return e.map((t,o)=>o===0?(t+e[1])/2:o===e.length-1?(e[o-1]+t)/2:(e[o-1]+t+e[o+1])/3)}function We(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function De(e){return e>=5?"good":e>=3?"possible":"none"}function de(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ke(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",o=de(e),r=t==="none"?"No aurora expected at mid-latitudes":o!=null?`Aurora possible equatorward of ~${o}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",i=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",a=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:r},{kind:"radio",level:n,label:"HF Radio",summary:i},{kind:"solar_activity",level:a,label:"Solar Activity",summary:a==="none"?"Quiet geomagnetic conditions expected":a==="low"?"Active geomagnetic conditions possible":a==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Xe(e,t){var p;if(t<=0)return null;let o=(p=e.metrics.kp_forecast_3h)!=null?p:[];if(!o.length)return null;let r=Date.now()+t*36e5,n=o[0],i=1/0;for(let x of o){let g=Math.abs(new Date(x.t_utc).getTime()-r);g<i&&(i=g,n=x)}let a=n.kp,s=We(a),l=De(a),d=de(a),c=Ke(a);return{offsetH:t,kp:a,gScale:s,auroraLabel:l,auroraMinLat:d,impacts:c}}function Ue(e,t,o){var T;let{forecast:r,metrics:n}=e,{kp_max_next_24h:i,kp_max_at_utc:a,trend:s}=r,l=((T=n.kp_forecast_3h)!=null?T:[]).slice(0,16),d=l.length,c=d*3,p=c>0?`${(t/c*100).toFixed(0)}%`:"0%",x=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",g="Kp forecast unavailable";if(i!=null){let w=oe(a),C=s==="rising"?"rising":s==="falling"?"falling":"steady";g=`Peak Kp ${i.toFixed(1)} next 24h${w?` at ${w}`:""} \xB7 ${C}`}if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${u(g)}</div>
    </div>`;let h=320,m=38,v=14,f=m+v,y=h/d,b=w=>m-Math.max(2,Math.min(m-2,w/9*(m-2))),_="",z=l.map(w=>w.kp),$=Oe(z);l.forEach((w,C)=>{let S=b(w.kp),j=m-S,R=C*y,O=R+y/2,W=w.kp>=6?"#e05c5c":w.kp>=5?"#e0a84a":w.kp>=4?"#d4cc5c":"#5cce8c",D=`Kp ${w.kp.toFixed(1)} \xB7 ${oe(w.t_utc)}`;if(_+=`<rect x="${R.toFixed(1)}" y="${S.toFixed(1)}" width="${(y-1.5).toFixed(1)}" height="${j.toFixed(1)}" fill="${W}" fill-opacity="0.85" rx="1.5"/>`,_+=`<rect x="${R.toFixed(1)}" y="0" width="${y.toFixed(1)}" height="${m}" fill="transparent"><title>${Q(D)}</title></rect>`,d<=8||C%2===0){let K=new Date(w.t_utc).getHours();_+=`<text x="${O.toFixed(1)}" y="${(f-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${K.toString().padStart(2,"0")}</text>`}});let F=`<polyline points="${l.map((w,C)=>{let S=C*y+y/2,j=b($[C]);return`${S.toFixed(1)},${j.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,k="";if(t>0&&d>0){let w=Math.min(h-1,t/(d*3)*h);k=`
      <line x1="${w.toFixed(1)}" y1="0" x2="${w.toFixed(1)}" y2="${m}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${w.toFixed(1)},${m} ${(w-4).toFixed(1)},${(m-7).toFixed(1)} ${(w+4).toFixed(1)},${(m-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let A=Math.round(c/4),I=Math.round(c/2),P=Math.round(c*3/4),B=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${u(x)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${p}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${A}h</span>
        <span class="hw-scrub-tick">+${I}h</span>
        <span class="hw-scrub-tick">+${P}h</span>
        <span class="hw-scrub-tick">+${c}h</span>
      </div>
    </div>`;return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      ${o?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(o.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${o.kp.toFixed(1)} \xB7 ${o.gScale}</span>
    </div>`:""}
      <div class="hw-forecast-text">${u(g)}</div>
      <svg viewBox="0 0 ${h} ${f}" style="width:100%;height:${f}px;display:block" preserveAspectRatio="none">
        ${_}
        ${F}
        ${k}
      </svg>
      ${B}
    </div>`}function Ge(e){let t=/([NS])(\d+)([EW])(\d+)/i.exec(e);return t?{lat:(t[1].toUpperCase()==="N"?1:-1)*parseInt(t[2],10),lon:(t[3].toUpperCase()==="E"?1:-1)*parseInt(t[4],10)}:null}function qe(e,t){let o=t/2,r=o*.87,n=e.map(i=>{var g,h;let a=Ge(i.location);if(!a||Math.abs(a.lon)>88)return"";let s=a.lat*Math.PI/180,l=a.lon*Math.PI/180,d=(o+r*Math.cos(s)*Math.sin(l)).toFixed(1),c=(o-r*Math.sin(s)).toFixed(1),p=i.x_flare_probability>0?"#e05c5c":i.m_flare_probability>10?"#e0a84a":i.c_flare_probability>20?"#d4cc5c":"#c8d8e0",x=`AR ${i.region} \xB7 ${i.location}
Class: ${(g=i.spot_class)!=null?g:"\u2014"} / ${(h=i.mag_class)!=null?h:"\u2014"}
C: ${i.c_flare_probability}%  M: ${i.m_flare_probability}%  X: ${i.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${u(x)}</title>
      <circle cx="${d}" cy="${c}" r="3.5" fill="${p}" stroke="#000" stroke-width="0.6" opacity="0.88"/>
      <text x="${d}" y="${(parseFloat(c)-5).toFixed(1)}" font-size="5" fill="${p}" text-anchor="middle" font-family="monospace" opacity="0.95">${i.region}</text>
    </g>`}).join("");return`<svg width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${n}</svg>`}var Ye={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ze='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',Ve="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",Qe=80;function Je(e,t,o){var a,s;let n=((s=(a=t==null?void 0:t.impacts)!=null?a:e.observer_impacts)!=null?s:[]).map(l=>{var h,m;let d=(h=ve[l.level])!=null?h:"#666",c=l.level==="none"?"None":l.level.charAt(0).toUpperCase()+l.level.slice(1),p=(m=Ye[l.kind])!=null?m:Ze,x=l.level==="none"?"#606870":d,g=l.kind==="solar_activity"?`<div class="hw-solar-tip">
           <div class="hw-solar-disk-wrap">
             <img class="hw-solar-disk-img" src="${Ve}" alt="Solar disk" loading="lazy" />
             ${o?qe(o,Qe):""}
           </div>
           <span class="hw-solar-tip-text">${u(l.summary)}</span>
         </div>`:`<div class="hw-impact-tip">${u(l.summary)}</div>`;return`<div class="hw-impact-row">
      <span class="hw-impact-kind" style="color:${x}">${p}<span style="color:#b4c6cc">${u(l.label)}</span></span>
      <span class="hw-impact-badge" style="background:${d}22;color:${d}">${u(c)}</span>
      ${g}
    </div>`}).join("");return`
    <div class="hw-impacts">
      <div class="hw-section-label">Observer Impacts${t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':""}</div>
      ${n}
    </div>`}var ne={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function et(e,t){var l,d;let o=(l=$e[e.level])!=null?l:"#666",r=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(d=ne[e.kind])!=null?d:ne.unknown,i=[ke(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),a=t&&e.raw_body?`<div class="hw-alert-body">${u(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${o}" data-alert-key="${Q(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${o}">${n}</span>
      <span class="hw-alert-level" style="color:${o}">${u(r)}</span>
      <span class="hw-alert-title">${u(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${u(e.summary_short)}</div>
    <div class="hw-alert-meta">${u(i)}</div>
    ${a}
  </div>`}var ie=3;function tt(e,t,o){var d;let r=(d=e.alerts_all)!=null?d:[],n=r.length;if(n===0)return`
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts</span>
      </div>
      <div class="hw-empty-alerts">No significant recent SWPC alerts</div>
    </div>`;let i=t?r:r.slice(0,ie),s=n-ie>0?t?'<button class="hw-alerts-toggle hw-alerts-expand">\u25B2 Show less</button>':`<button class="hw-alerts-toggle hw-alerts-expand">\u25BC Show all ${n}</button>`:"",l=i.map(c=>et(c,c.dedupe_key===o)).join("");return`
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts (${n})</span>
        ${s}
      </div>
      ${l}
    </div>`}function ot(e,t,o,r,n,i,a,s,l,d){let c=Xe(e,n);return`
    <div class="hw-root">
      ${Ne(e)}
      ${Be(e,o,r,c,l,d)}
      ${o?je(e):""}
      ${Ue(e,n,c)}
      ${Je(e,c,s)}
      ${tt(e,i,a)}
    </div>`}function rt(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${u(e)}</div>
    </div>
  </div>`}function nt(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var V=class{constructor(t,o){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.solarRegions=null;this.ovationData=null;this.timer=null;this.data=null;this.el=t,this.opts=o,this.el.innerHTML=nt(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var i,a;let o=t.target;if(o.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(o.closest(".hw-alerts-expand")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let r=o.closest("[data-alert-key]");if(r){let s=(i=r.dataset.alertKey)!=null?i:null;this.expandedAlertKey=this.expandedAlertKey===s?null:s,this.render();return}if(o.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let n=o.closest("[data-kpi]");if(n){let s=(a=n.dataset.kpi)!=null?a:null;this.activePopover=this.activePopover===s?null:s,this.render();return}if(o.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}o.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let o=t.target;if(!o.matches("[data-scrub]"))return;let r=parseFloat(o.value);this.scrubOffset=r,o.style.setProperty("--pct",`${(r/parseFloat(o.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=r>0?`\u23F1 +${Math.round(r)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let o=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!o.ok)throw new Error(`HTTP ${o.status}`);this.data=await o.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(o){let r=o instanceof Error?o.message:String(o);this.el.innerHTML=rt(`Space weather data unavailable (${r})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}async fetchSolarRegions(){try{let t=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!t.ok)return;let o=await t.json(),r=new Map;for(let n of o){let i=r.get(n.region);(!i||n.observed_date>i.observed_date)&&r.set(n.region,n)}this.solarRegions=[...r.values()],this.render()}catch(t){}}async fetchOvationData(){var t,o,r,n,i,a;if(!(this.opts.lat==null||this.opts.lon==null))try{let s=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!s.ok)return;let l=await s.json(),c=((r=(o=(t=l.coordinates)!=null?t:l.Data)!=null?o:l.data)!=null?r:[]).map(([p,x,g])=>({lon:p,lat:x,prob:g}));this.ovationData={entries:c,forecastTime:String((a=(i=(n=l["Forecast Time"])!=null?n:l.forecast_time)!=null?i:l["Observation Time"])!=null?a:"")},this.render()}catch(s){}}render(){this.data&&(this.el.innerHTML=ot(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.solarRegions,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},pe={mount(e,t){return Le(),new V(e,t)}};typeof window!="undefined"&&(window.HelioWidget=pe);return be(it);})();
