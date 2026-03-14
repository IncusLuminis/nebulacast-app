"use strict";var HelioWidgetModule=(()=>{var q=Object.defineProperty;var le=Object.getOwnPropertyDescriptor;var ce=Object.getOwnPropertyNames;var de=Object.prototype.hasOwnProperty;var pe=(e,t)=>{for(var r in t)q(e,r,{get:t[r],enumerable:!0})},he=(e,t,r,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of ce(t))!de.call(e,n)&&n!==r&&q(e,n,{get:()=>t[n],enumerable:!(o=le(t,n))||o.enumerable});return e};var ue=e=>he(q({},"__esModule",{value:!0}),e);var De={};pe(De,{HelioWidget:()=>ne});var Q={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},ge={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},me={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},oe={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"};function we(e){if(!e)return"Update time unavailable";try{let t=Math.round((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"Updated just now";if(t<60)return`Updated ${t} min ago`;let r=Math.floor(t/60);return r<24?`Updated ${r}h ago`:`Updated ${Math.floor(r/24)}d ago`}catch(t){return"Updated recently"}}function xe(e){if(!e)return"\u2014";try{return new Date(e).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(t){return e}}function J(e){if(!e)return"";try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e}}function z(e){try{return new Date(e).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(t){return e.slice(11,16)}}function G(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function p(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function be(e){return parseInt(e.slice(1),10)>0}var fe=`
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
.hw-aurora-img{display:block;width:100%;border-radius:3px;aspect-ratio:1;object-fit:cover;background:#0a1012}
.hw-aurora-caption{font-size:.65em;color:#607880;margin-top:4px;text-align:center}

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

/* States */
.hw-error{padding:16px;text-align:center;color:#607880}
.hw-error-title{font-size:.82em;font-weight:600;color:#b4c6cc;margin-bottom:4px}
.hw-error-body{font-size:.75em}
.hw-loading{padding:16px;text-align:center;color:#405058;font-size:.78em}
`,ee=!1;function ve(){if(ee)return;let e=document.createElement("style");e.id="helio-widget-css",e.textContent=fe,document.head.appendChild(e),ee=!0}function ke(e){if(!e.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,r=32,o=e.length,n=t/o,s=e.map((i,a)=>{let l=Math.max(2,Math.min(r,i.kp/9*r)),d=r-l,c=a*n,h=i.kp>=6?"#e05c5c":i.kp>=5?"#e0a84a":i.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${c.toFixed(1)}" y="${d.toFixed(1)}" width="${(n-1).toFixed(1)}" height="${l.toFixed(1)}" fill="${h}" rx="1"><title>Kp ${i.kp.toFixed(1)} \xB7 ${p(z(i.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${r}" style="width:100%;height:${r}px;display:block" preserveAspectRatio="none">${s}</svg>`}function I(e,t,r,o,n){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let s=200,i=Math.min(...e),a=Math.max(...e),l=a-i||1,d=g=>o-2-(g-i)/l*(o-4),c=e.map((g,x)=>`${(x/(e.length-1)*s).toFixed(1)},${d(g).toFixed(1)}`).join(" "),h="";if(n&&i<0&&a>0){let g=d(0);h=`<line x1="0" y1="${g.toFixed(1)}" x2="${s}" y2="${g.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let u=e.map((g,x)=>`<rect x="${(x/(e.length-1)*s-4).toFixed(1)}" y="0" width="8" height="${o}" fill="transparent"><title>${p(t[x]||"")} \xB7 ${g.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${s} ${o}" style="width:100%;height:${o}px;display:block" preserveAspectRatio="none">
    ${h}
    <polyline points="${c}" fill="none" stroke="${r}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${u}
  </svg>`}function ye(e){if(e.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let t=200,r=32,o=e.map(c=>Math.max(-9,Math.min(-3,Math.log10(c.flux)))),n=Math.min(...o),i=Math.max(...o)-n||1,a=c=>r-2-(c-n)/i*(r-4),l=o.map((c,h)=>`${(h/(o.length-1)*t).toFixed(1)},${a(c).toFixed(1)}`).join(" "),d=e.map((c,h)=>{let u=h/(o.length-1)*t,g=c.flux>=1e-4?"X":c.flux>=1e-5?"M":c.flux>=1e-6?"C":c.flux>=1e-7?"B":"A";return`<rect x="${(u-4).toFixed(1)}" y="0" width="8" height="${r}" fill="transparent"><title>${p(z(c.t_utc))} \xB7 ${g}-class (${c.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${t} ${r}" style="width:100%;height:${r}px;display:block" preserveAspectRatio="none">
    <polyline points="${l}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${d}
  </svg>`}function N(e){return`<div class="hw-kpi-popover-title">
    <span>${e}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function $e(e){var a;let t=(a=e.metrics.wind_history_1h)!=null?a:[],r=I(t.map(l=>{var d;return(d=l.kms)!=null?d:0}).filter(l=>l>0),t.map(l=>z(l.t_utc)),"#5cce8c",36,!1),o=t[t.length-1],n=(o==null?void 0:o.density)!=null?`${o.density.toFixed(2)} cm\u207B\xB3`:"\u2014",s=(o==null?void 0:o.temp_kk)!=null?`${o.temp_kk.toFixed(0)} kK`:"\u2014",i=(o==null?void 0:o.pressure_npa)!=null?`${o.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${N("Solar Wind \xB7 Last 24h")}
    <div class="hw-spark-wrap">${r}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${p(n)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${p(s)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${p(i)}</span>
      </div>
    </div>
  </div>`}function _e(e){var d,c,h;let t=(d=e.metrics.xray_history_1h)!=null?d:[],r=ye(t),o=(c=e.metrics.xray_class)!=null?c:"A",n=e.metrics.xray_flux_wm2,s=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",i=[{label:"A",color:"#888",start:1e-8,end:1e-7},{label:"B",color:"#5cce8c",start:1e-7,end:1e-6},{label:"C",color:"#aad47a",start:1e-6,end:1e-5},{label:"M",color:"#e0a84a",start:1e-5,end:1e-4},{label:"X",color:"#e05c5c",start:1e-4,end:.001}],a=i.map(u=>{let g=u.label===o,x=g?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${u.color}${g?"cc":"44"}">${x}</div>`}).join(""),l=i.map(u=>`<div class="hw-xray-scale-label" style="color:${u.label===o?"#c8d8dc":"#607880"}">${u.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${N("X-Ray Flux \xB7 Last 24h")}
    <div class="hw-spark-wrap">${r}</div>
    <div style="margin-top:8px">
      <div class="hw-xray-scale">${a}</div>
      <div class="hw-xray-scale-labels">${l}</div>
    </div>
    <div class="hw-kpi-hint">Current: <b style="color:${(h=oe[o])!=null?h:"#a0b4b8"}">${p(o)}-class</b> \xB7 ${p(s)}</div>
  </div>`}function Me(e){var i;let t=(i=e.metrics.bz_history_5m)!=null?i:[],r=I(t.map(a=>a.bz),t.map(a=>z(a.t_utc)),"#d4cc5c",36,!0),o=e.metrics.imf_bz_nt,n=o!=null?o<=-10?"#e05c5c":o<=-5?"#e0a84a":o>=5?"#5cce8c":"#a0b4b8":"#607880",s=o!=null?(o>=0?"+":"")+o.toFixed(1)+" nT":"\u2014";return`<div class="hw-kpi-popover">
    ${N("IMF Bz \xB7 Last 6h")}
    <div class="hw-spark-wrap">${r}</div>
    <div class="hw-kpi-hint">
      Current Bz: <b style="color:${n}">${p(s)}</b>
      <br>Negative Bz opens Earth's magnetosphere to solar wind and significantly improves aurora probability.
    </div>
  </div>`}function Le(){let e=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`;return`<div class="hw-kpi-popover">
    ${N("Aurora Oval \xB7 Northern Hemisphere")}
    <img class="hw-aurora-img" src="${G(e)}" alt="NOAA Aurora Oval" loading="lazy" />
    <div class="hw-aurora-caption">Source: NOAA OVATION Prime model \xB7 Updated every 5 min</div>
  </div>`}function He(e,t){switch(t){case"solar_wind":return $e(e);case"xray":return _e(e);case"imf_bz":return Me(e);case"aurora":return Le();default:return""}}function P(e,t){if(e.length<2)return"\u2192";let r=e[e.length-1],o=Math.max(0,e.length-4),n=e[o];if(!isFinite(r)||!isFinite(n))return"\u2192";let s=r-n;return s>t?"\u2191":s<-t?"\u2193":"\u2192"}function ze(e,t,r,o){var v,_,M,L,T,E,B;let{summary:n,scales:s,metrics:i,aurora_hint:a}=e,l=(v=Q[n.status])!=null?v:Q.quiet,d=o!=null?o.kp.toFixed(1):i.kp_latest!=null?i.kp_latest.toFixed(1):"\u2014",h=[o?o.gScale:s.g_scale,s.r_scale,s.s_scale].map(w=>{let H=be(w),D=H?`color:${l.accent};border-color:${l.accent}33`:"";return`<span class="hw-scale-chip${H?" hw-scale-active":""}" style="${D}">${p(w)}</span>`}).join(""),u=o?o.auroraLabel:a.aurora_label,g=u==="good"?"#5cce8c":u==="possible"?"#d4cc5c":"#607880",x=u.charAt(0).toUpperCase()+u.slice(1),b="#b4c6cc",j=i.solar_wind_kms!=null?`${Math.round(i.solar_wind_kms)} km/s`:"\u2014",f=i.imf_bz_nt,y=f!=null?f<=-10?"#e05c5c":f<=-5?"#e0a84a":f>=5?"#5cce8c":"#a0b4b8":"#607880",C=f!=null?(f>=0?"+":"")+f.toFixed(1)+" nT":"\u2014",k=i.xray_class,K=k?(_=oe[k])!=null?_:"#a0b4b8":"#607880",W=k?`${k}-class`:"\u2014",Z=P(((M=i.kp_history_1h)!=null?M:[]).map(w=>w.kp),.5),R=P(((L=i.wind_history_1h)!=null?L:[]).map(w=>w.kms),20),F=P(((T=i.bz_history_1h)!=null?T:[]).map(w=>w.bz),1.5),O=P(((E=i.xray_history_1h)!=null?E:[]).map(w=>Math.log10(w.flux+1e-9)),.15),U=t?"\u25BC Details":"\u25B6 Details",S=(B=i.kp_latest)!=null?B:0,A=S>=5,V=A?`linear-gradient(160deg, #0d2a1a 0%, ${l.bg}22 75%)`:`${l.bg}18`,$=(w,H,D,ae,Y)=>{let se=Y?`<span class="hw-trend">${Y}</span>`:"";return`<div class="hw-kpi-item${r===w?" hw-kpi-active":""}" data-kpi="${w}">
      <span class="hw-qd-label">${H}</span>
      <span class="hw-qd-value" style="color:${ae}">${D}${se}</span>
    </div>`},m=A?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${S.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${V}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${o?"color:#9acf60":""}">Kp <b>${p(d)}</b>${o?"":`<span class="hw-trend">${Z}</span>`}</div>
          <span class="hw-status-badge" style="background:${l.accent}22;color:${l.accent};display:block;text-align:center">${p(n.label)}</span>
          <div class="hw-scales-row">${h}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-summary-text">${p(n.text)}</div>
        </div>
      </div>
      <div class="hw-quick-details">
        ${$("aurora","Aurora",p(x),g)}
        ${$("solar_wind","Solar wind",p(j),b,R)}
        ${$("imf_bz","IMF Bz",p(C),y,F)}
        ${$("xray","X-ray",p(W),K,O)}
      </div>
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle details">${U}</button>
      ${m}
      ${r?He(e,r):""}
    </div>`}function Ce(e){var l,d,c;let{metrics:t}=e,r=(l=t.kp_history_1h)!=null?l:[],o=(d=t.wind_history_1h)!=null?d:[],n=(c=t.bz_history_1h)!=null?c:[],s=ke(r),i=I(o.map(h=>{var u;return(u=h.kms)!=null?u:0}).filter(h=>h>0),o.map(h=>z(h.t_utc)),"#5cce8c",28,!1),a=I(n.map(h=>h.bz),n.map(h=>z(h.t_utc)),"#d4cc5c",28,!0);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${s}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${a}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
    </div>`}function Fe(e){let t=we(e.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${p(t)}</span>
    </div>`}function Se(e){return e.map((t,r)=>r===0?(t+e[1])/2:r===e.length-1?(e[r-1]+t)/2:(e[r-1]+t+e[r+1])/3)}function Ae(e){return e>=9?"G5":e>=8?"G4":e>=7?"G3":e>=6?"G2":e>=5?"G1":"G0"}function Te(e){return e>=5?"good":e>=3?"possible":"none"}function ie(e){return e>=9?40:e>=8?45:e>=7?50:e>=6?55:e>=5?60:null}function Ee(e){let t=e>=7?"high":e>=5?"moderate":e>=3?"low":"none",r=ie(e),o=t==="none"?"No aurora expected at mid-latitudes":r!=null?`Aurora possible equatorward of ~${r}\xB0 lat`:"Minor aurora possible at high latitudes",n=e>=7?"moderate":e>=5?"low":"none",s=n==="none"?"No significant HF degradation expected":n==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",i=e>=8?"high":e>=6?"moderate":e>=4?"low":"none";return[{kind:"aurora",level:t,label:"Aurora",summary:o},{kind:"radio",level:n,label:"HF Radio",summary:s},{kind:"solar_activity",level:i,label:"Solar Activity",summary:i==="none"?"Quiet geomagnetic conditions expected":i==="low"?"Active geomagnetic conditions possible":i==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Be(e,t){var h;if(t<=0)return null;let r=(h=e.metrics.kp_forecast_3h)!=null?h:[];if(!r.length)return null;let o=Date.now()+t*36e5,n=r[0],s=1/0;for(let u of r){let g=Math.abs(new Date(u.t_utc).getTime()-o);g<s&&(s=g,n=u)}let i=n.kp,a=Ae(i),l=Te(i),d=ie(i),c=Ee(i);return{offsetH:t,kp:i,gScale:a,auroraLabel:l,auroraMinLat:d,impacts:c}}function Pe(e,t,r){var $;let{forecast:o,metrics:n}=e,{kp_max_next_24h:s,kp_max_at_utc:i,trend:a}=o,l=(($=n.kp_forecast_3h)!=null?$:[]).slice(0,16),d=l.length,c=d*3,h=c>0?`${(t/c*100).toFixed(0)}%`:"0%",u=t>0?`\u23F1 +${Math.round(t)}h`:"Timeline",g="Kp forecast unavailable";if(s!=null){let m=J(i),v=a==="rising"?"rising":a==="falling"?"falling":"steady";g=`Peak Kp ${s.toFixed(1)} next 24h${m?` at ${m}`:""} \xB7 ${v}`}if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      <div class="hw-forecast-text">${p(g)}</div>
    </div>`;let x=320,b=38,j=14,f=b+j,y=x/d,C=m=>b-Math.max(2,Math.min(b-2,m/9*(b-2))),k="",K=l.map(m=>m.kp),W=Se(K);l.forEach((m,v)=>{let _=C(m.kp),M=b-_,L=v*y,T=L+y/2,E=m.kp>=6?"#e05c5c":m.kp>=5?"#e0a84a":m.kp>=4?"#d4cc5c":"#5cce8c",B=`Kp ${m.kp.toFixed(1)} \xB7 ${J(m.t_utc)}`;if(k+=`<rect x="${L.toFixed(1)}" y="${_.toFixed(1)}" width="${(y-1.5).toFixed(1)}" height="${M.toFixed(1)}" fill="${E}" fill-opacity="0.85" rx="1.5"/>`,k+=`<rect x="${L.toFixed(1)}" y="0" width="${y.toFixed(1)}" height="${b}" fill="transparent"><title>${G(B)}</title></rect>`,d<=8||v%2===0){let H=new Date(m.t_utc).getHours();k+=`<text x="${T.toFixed(1)}" y="${(f-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${H.toString().padStart(2,"0")}</text>`}});let R=`<polyline points="${l.map((m,v)=>{let _=v*y+y/2,M=C(W[v]);return`${_.toFixed(1)},${M.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,F="";if(t>0&&d>0){let m=Math.min(x-1,t/(d*3)*x);F=`
      <line x1="${m.toFixed(1)}" y1="0" x2="${m.toFixed(1)}" y2="${b}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${m.toFixed(1)},${b} ${(m-4).toFixed(1)},${(b-7).toFixed(1)} ${(m+4).toFixed(1)},${(b-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let O=Math.round(c/4),U=Math.round(c/2),S=Math.round(c*3/4),A=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${p(u)}</span>
        ${t>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${c}" step="1" value="${t}" style="--pct:${h}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${O}h</span>
        <span class="hw-scrub-tick">+${U}h</span>
        <span class="hw-scrub-tick">+${S}h</span>
        <span class="hw-scrub-tick">+${c}h</span>
      </div>
    </div>`;return`
    <div class="hw-forecast">
      <div class="hw-section-label">Kp Forecast \xB7 Next 24h</div>
      ${r?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(r.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${r.kp.toFixed(1)} \xB7 ${r.gScale}</span>
    </div>`:""}
      <div class="hw-forecast-text">${p(g)}</div>
      <svg viewBox="0 0 ${x} ${f}" style="width:100%;height:${f}px;display:block" preserveAspectRatio="none">
        ${k}
        ${R}
        ${F}
      </svg>
      ${A}
    </div>`}var Ie={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},Ne='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>';function je(e,t){var s,i;let o=((i=(s=t==null?void 0:t.impacts)!=null?s:e.observer_impacts)!=null?i:[]).map(a=>{var u,g;let l=(u=ge[a.level])!=null?u:"#666",d=a.level==="none"?"None":a.level.charAt(0).toUpperCase()+a.level.slice(1),c=(g=Ie[a.kind])!=null?g:Ne;return`<div class="hw-impact-row">
      <span class="hw-impact-kind" style="color:${a.level==="none"?"#606870":l}">${c}<span style="color:#b4c6cc">${p(a.label)}</span></span>
      <span class="hw-impact-badge" style="background:${l}22;color:${l}">${p(d)}</span>
      <div class="hw-impact-tip">${p(a.summary)}</div>
    </div>`}).join("");return`
    <div class="hw-impacts">
      <div class="hw-section-label">Observer Impacts${t?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':""}</div>
      ${o}
    </div>`}var te={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function Ke(e,t){var l,d;let r=(l=me[e.level])!=null?l:"#666",o=e.level.charAt(0).toUpperCase()+e.level.slice(1),n=(d=te[e.kind])!=null?d:te.unknown,s=[xe(e.t_utc),e.source_code?`SWPC: ${e.source_code}`:""].filter(Boolean).join(" \xB7 "),i=t&&e.raw_body?`<div class="hw-alert-body">${p(e.raw_body)}</div>`:"";return`<div class="hw-alert-item${t?" hw-alert-open":""}" style="border-color:${r}" data-alert-key="${G(e.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${r}">${n}</span>
      <span class="hw-alert-level" style="color:${r}">${p(o)}</span>
      <span class="hw-alert-title">${p(e.title)}</span>
    </div>
    <div class="hw-alert-summary">${p(e.summary_short)}</div>
    <div class="hw-alert-meta">${p(s)}</div>
    ${i}
  </div>`}var re=3;function We(e,t,r){var d;let o=(d=e.alerts_all)!=null?d:[],n=o.length;if(n===0)return`
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts</span>
      </div>
      <div class="hw-empty-alerts">No significant recent SWPC alerts</div>
    </div>`;let s=t?o:o.slice(0,re),a=n-re>0?t?'<button class="hw-alerts-toggle hw-alerts-expand">\u25B2 Show less</button>':`<button class="hw-alerts-toggle hw-alerts-expand">\u25BC Show all ${n}</button>`:"",l=s.map(c=>Ke(c,c.dedupe_key===r)).join("");return`
    <div class="hw-alerts">
      <div class="hw-alerts-header">
        <span class="hw-alerts-label">SWPC Alerts (${n})</span>
        ${a}
      </div>
      ${l}
    </div>`}function Re(e,t,r,o,n,s,i){let a=Be(e,n);return`
    <div class="hw-root">
      ${Fe(e)}
      ${ze(e,r,o,a)}
      ${r?Ce(e):""}
      ${Pe(e,n,a)}
      ${je(e,a)}
      ${We(e,s,i)}
    </div>`}function Oe(e){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${p(e)}</div>
    </div>
  </div>`}function Ue(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var X=class{constructor(t,r){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.timer=null;this.data=null;this.el=t,this.opts=r,this.el.innerHTML=Ue(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(t){var s,i;let r=t.target;if(r.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(r.closest(".hw-alerts-expand")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let o=r.closest("[data-alert-key]");if(o){let a=(s=o.dataset.alertKey)!=null?s:null;this.expandedAlertKey=this.expandedAlertKey===a?null:a,this.render();return}if(r.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let n=r.closest("[data-kpi]");if(n){let a=(i=n.dataset.kpi)!=null?i:null;this.activePopover=this.activePopover===a?null:a,this.render();return}if(r.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}r.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(t){let r=t.target;if(!r.matches("[data-scrub]"))return;let o=parseFloat(r.value);this.scrubOffset=o,r.style.setProperty("--pct",`${(o/parseFloat(r.max)*100).toFixed(0)}%`);let n=this.el.querySelector(".hw-scrub-title");n&&(n.textContent=o>0?`\u23F1 +${Math.round(o)}h`:"Timeline")}onChange(t){t.target.matches("[data-scrub]")&&this.render()}async fetch(){var t;try{let r=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);this.data=await r.json(),this.render()}catch(r){let o=r instanceof Error?r.message:String(r);this.el.innerHTML=Oe(`Space weather data unavailable (${o})`)}finally{this.timer=setTimeout(()=>this.fetch(),(t=this.opts.refreshMs)!=null?t:6e5)}}render(){this.data&&(this.el.innerHTML=Re(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},ne={mount(e,t){return ve(),new X(e,t)}};typeof window!="undefined"&&(window.HelioWidget=ne);return ue(De);})();
