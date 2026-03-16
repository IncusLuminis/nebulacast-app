"use strict";var HelioWidgetModule=(()=>{var Q=Object.defineProperty;var xt=Object.getOwnPropertyDescriptor;var ft=Object.getOwnPropertyNames;var bt=Object.prototype.hasOwnProperty;var $t=(t,e)=>{for(var n in e)Q(t,n,{get:e[n],enumerable:!0})},vt=(t,e,n,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of ft(e))!bt.call(t,s)&&s!==n&&Q(t,s,{get:()=>e[s],enumerable:!(a=xt(e,s))||a.enumerable});return t};var yt=t=>vt(Q({},"__esModule",{value:!0}),t);var we={};$t(we,{HelioWidget:()=>mt});var nt={quiet:{bg:"#1a2e22",accent:"#5cce8c"},active:{bg:"#2e2a1a",accent:"#d4cc5c"},elevated:{bg:"#2e1f10",accent:"#e0a84a"},storm:{bg:"#2e1212",accent:"#e05c5c"}},kt={none:"#666",low:"#5cce8c",moderate:"#e0a84a",high:"#e05c5c"},_t={info:"#666",watch:"#d4cc5c",warning:"#e05c5c"},lt={A:"#888",B:"#5cce8c",C:"#aad47a",M:"#e0a84a",X:"#e05c5c"},Mt={low:"#5cce8c",moderate:"#d4cc5c",high:"#e05c5c",unknown:"#96a8b8"},St={detected:"Detected",inbound:"Inbound",arrival_window:"Arriving",arrived:"Arrived"};function Ct(t){if(!t)return"Update time unavailable";try{let e=Math.round((Date.now()-new Date(t).getTime())/6e4);if(e<1)return"Updated just now";if(e<60)return`Updated ${e} min ago`;let n=Math.floor(e/60);return n<24?`Updated ${n}h ago`:`Updated ${Math.floor(n/24)}d ago`}catch(e){return"Updated recently"}}function Lt(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(e){return t}}function at(t){if(!t)return"";try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(e){return t}}function q(t){try{return new Date(t).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1})}catch(e){return t.slice(11,16)}}function st(t){if(!t)return"\u2014";try{return new Date(t).toLocaleString("en-GB",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"UTC",hour12:!1})+" UTC"}catch(e){return t}}function j(t){return t.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Ht(t){return parseInt(t.slice(1),10)>0}var Tt=`
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
.hw-section-toggle{font-size:.78em;color:#96a8b8;background:none;border:none;cursor:pointer;padding:8px 14px;white-space:nowrap;display:block;width:100%;text-align:left;transition:color .15s}
.hw-section-toggle:hover{color:#b4c6cc}

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
`,it=!1;function At(){if(it)return;let t=document.createElement("style");t.id="helio-widget-css",t.textContent=Tt,document.head.appendChild(t),it=!0}function Ft(t){if(!t.length)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let e=200,n=32,a=t.length,s=e/a,r=t.map((o,c)=>{let i=Math.max(2,Math.min(n,o.kp/9*n)),l=n-i,d=c*s,p=o.kp>=6?"#e05c5c":o.kp>=5?"#e0a84a":o.kp>=4?"#d4cc5c":"#5cce8c";return`<rect x="${d.toFixed(1)}" y="${l.toFixed(1)}" width="${(s-1).toFixed(1)}" height="${i.toFixed(1)}" fill="${p}" rx="1"><title>Kp ${o.kp.toFixed(1)} \xB7 ${h(q(o.t_utc))} UTC</title></rect>`}).join("");return`<svg viewBox="0 0 ${e} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">${r}</svg>`}function ot(t,e,n,a,s){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let r=200,o=Math.min(...t),c=Math.max(...t),i=c-o||1,l=m=>a-2-(m-o)/i*(a-4),d=t.map((m,g)=>`${(g/(t.length-1)*r).toFixed(1)},${l(m).toFixed(1)}`).join(" "),p="";if(s&&o<0&&c>0){let m=l(0);p=`<line x1="0" y1="${m.toFixed(1)}" x2="${r}" y2="${m.toFixed(1)}" stroke="#2a3438" stroke-width="0.8" stroke-dasharray="3,2"/>`}let f=t.map((m,g)=>`<rect x="${(g/(t.length-1)*r-4).toFixed(1)}" y="0" width="8" height="${a}" fill="transparent"><title>${h(e[g]||"")} \xB7 ${m.toFixed(1)}</title></rect>`).join("");return`<svg viewBox="0 0 ${r} ${a}" style="width:100%;height:${a}px;display:block" preserveAspectRatio="none">
    ${p}
    <polyline points="${d}" fill="none" stroke="${n}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${f}
  </svg>`}function zt(t){if(t.length<2)return'<div style="color:#405058;font-size:.72em;padding:4px">No data</div>';let e=200,n=32,a=t.map(d=>Math.max(-9,Math.min(-3,Math.log10(d.flux)))),s=Math.min(...a),o=Math.max(...a)-s||1,c=d=>n-2-(d-s)/o*(n-4),i=a.map((d,p)=>`${(p/(a.length-1)*e).toFixed(1)},${c(d).toFixed(1)}`).join(" "),l=t.map((d,p)=>{let f=p/(a.length-1)*e,m=d.flux>=1e-4?"X":d.flux>=1e-5?"M":d.flux>=1e-6?"C":d.flux>=1e-7?"B":"A";return`<rect x="${(f-4).toFixed(1)}" y="0" width="8" height="${n}" fill="transparent"><title>${h(q(d.t_utc))} \xB7 ${m}-class (${d.flux.toExponential(2)})</title></rect>`}).join("");return`<svg viewBox="0 0 ${e} ${n}" style="width:100%;height:${n}px;display:block" preserveAspectRatio="none">
    <polyline points="${i}" fill="none" stroke="#e0a84a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${l}
  </svg>`}function W(t){return`<div class="hw-kpi-popover-title">
    <span>${t}</span>
    <button class="hw-kpi-popover-close hw-kpi-close" aria-label="Close">\u2715</button>
  </div>`}function Et(t){var l;let e=(l=t.metrics.wind_history_1h)!=null?l:[],n=e[e.length-1],a=t.metrics.solar_wind_kms,s=a!=null?`${Math.round(a)} km/s`:"\u2014",r=a!=null?a>=700?"#e05c5c":a>=500?"#e0a84a":a>=400?"#d4cc5c":"#5cce8c":"#607880",o=(n==null?void 0:n.density)!=null?`${n.density.toFixed(2)} cm\u207B\xB3`:"\u2014",c=(n==null?void 0:n.temp_kk)!=null?`${n.temp_kk.toFixed(0)} kK`:"\u2014",i=(n==null?void 0:n.pressure_npa)!=null?`${n.pressure_npa.toFixed(2)} nPa`:"\u2014";return`<div class="hw-kpi-popover">
    ${W("Solar Wind \xB7 Current")}
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Speed</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${h(s)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(o)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Temperature</span>
        <span class="hw-kpi-stat-value">${h(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Dyn. pressure</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function Ot(t){var c,i;let e=(c=t.metrics.xray_class)!=null?c:"A",n=t.metrics.xray_flux_wm2,a=n!=null?n.toExponential(2)+" W/m\xB2":"\u2014",s=[{label:"A",color:"#888"},{label:"B",color:"#5cce8c"},{label:"C",color:"#aad47a"},{label:"M",color:"#e0a84a"},{label:"X",color:"#e05c5c"}],r=s.map(l=>{let d=l.label===e,p=d?'<div class="hw-xray-scale-marker"></div>':"";return`<div class="hw-xray-scale-band" style="background:${l.color}${d?"cc":"44"}">${p}</div>`}).join(""),o=s.map(l=>`<div class="hw-xray-scale-label" style="color:${l.label===e?"#c8d8dc":"#607880"}">${l.label}</div>`).join("");return`<div class="hw-kpi-popover">
    ${W("X-Ray \xB7 Current")}
    <div style="margin-bottom:8px">
      <div class="hw-xray-scale">${r}</div>
      <div class="hw-xray-scale-labels">${o}</div>
    </div>
    <div class="hw-kpi-hint">Class: <b style="color:${(i=lt[e])!=null?i:"#a0b4b8"}">${h(e)}-class</b> \xB7 ${h(a)}</div>
    <div class="hw-kpi-hint" style="margin-top:4px">Trend history: \u25B6 HISTORY</div>
  </div>`}function It(t){let i='<rect x="0" y="16" width="200" height="6" rx="3" fill="#1e2c30"/>',l=[-10,-5,5,10].map(k=>{let H=100+k/20*100;return`<line x1="${H.toFixed(1)}" y1="16" x2="${H.toFixed(1)}" y2="22" stroke="#2a3c42" stroke-width="1"/>`}).join(""),d='<line x1="100" y1="14" x2="100" y2="24" stroke="#3a4c52" stroke-width="1.5"/>';if(t==null)return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">${i}${l}${d}</svg>`;let p=t<=-10?"#e05c5c":t<=-5?"#e0a84a":t<0?"#d4b84a":t>=5?"#5cce8c":"#7acca8",f=Math.max(-20,Math.min(20,t)),m=100+f/20*100,g=3,u=f<0?m-g:100-g,y=Math.max(2*g,Math.abs(m-100)+2*g),b=`<rect x="${u.toFixed(1)}" y="16" width="${y.toFixed(1)}" height="6" rx="${g}" fill="${p}" opacity="0.82"/>`,w=5,$=15,x=$-w*1.1,L=`<polygon points="${m.toFixed(1)},${$.toFixed(1)} ${(m-w).toFixed(1)},${x.toFixed(1)} ${(m+w).toFixed(1)},${x.toFixed(1)}" fill="${p}"/>`,C=`<line x1="${m.toFixed(1)}" y1="${$.toFixed(1)}" x2="${m.toFixed(1)}" y2="${19 .toFixed(1)}" stroke="${p}" stroke-width="1" opacity="0.6"/>`,T=`<text x="${m.toFixed(1)}" y="31" text-anchor="middle" font-size="8" fill="${p}" font-weight="600">${t>=0?"+":""}${t.toFixed(1)}</text>`;return`<svg viewBox="0 0 200 36" style="width:100%;height:36px;display:block">
    ${i}${l}${d}${b}${L}${C}${T}
  </svg>`}function Rt(t){var f;let e=t.metrics.imf_bz_nt,n=t.metrics.imf_bt_nt,a=t.metrics.solar_wind_kms,s=(f=t.metrics.pressure_npa)!=null?f:null,r=e!=null?e<=-10?"#e05c5c":e<=-5?"#e0a84a":e>=5?"#5cce8c":"#a0b4b8":"#607880",o=e!=null?(e>=0?"+":"")+e.toFixed(1)+" nT":"\u2014",c=n!=null?n.toFixed(1)+" nT":"\u2014",i=a!=null?`${Math.round(a)} km/s`:"\u2014",l=s!=null?`${s.toFixed(2)} nPa`:"\u2014",d=tt(t),p=e!=null&&e<-5?{msg:"Southward IMF \xB7 Aurora favorable",color:"#5cce8c"}:e!=null&&e<0?{msg:"Weakly southward \xB7 Conditions may improve",color:"#d4cc5c"}:{msg:"Northward IMF \xB7 Stable magnetosphere",color:"#96a8b8"};return`<div class="hw-kpi-popover">
    ${W("IMF Bz \xB7 Coupling")}
    <div class="hw-bz-gauge-wrap">
      ${It(e)}
      <div class="hw-bz-gauge-labels"><span>\u221220 nT</span><span>\u221210</span><span>0</span><span>+10</span><span>+20 nT</span></div>
    </div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bz</span>
        <span class="hw-kpi-stat-value" style="color:${r}">${h(o)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Bt total</span>
        <span class="hw-kpi-stat-value">${h(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value">${h(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="color:${p.color};font-weight:600;margin-bottom:4px">${h(p.msg)}</div>
    <div style="font-size:.65em;color:#607880">Coupling: <span style="color:${d.color};font-weight:600">${h(d.coupling)}</span> \xB7 Trend history: \u25B6 Details</div>
  </div>`}function tt(t){var i,l;let e=t.metrics.imf_bz_nt,n=(i=t.metrics.kp_latest)!=null?i:0,a=(l=t.metrics.solar_wind_kms)!=null?l:0,s,r,o;if(e!=null&&e<-5||n>=6)s="storm",r="#e05c5c",o="Storm conditions";else if(e!=null&&e<0||n>=4||a>=400){let d=e!=null&&e<0;s="active",r="#e0a84a",o=d?"Active coupling":"Elevated"}else s="stable",r="#5cce8c",o="Stable";let c;return e==null?c="Unknown":e>2?c="Closed":e>0?c="Minimal":e>-5?c="Moderate":e>-10?c="Strong":c="Very strong",{state:s,color:r,label:o,coupling:c}}function ct(t,e,n,a){let s=a?"mc":"mf",r=t.color,o=n!=null?n:0,c=o>500,i=o<350,l=c?.9:i?1.8:1.3;if(a){let g=45-(t.state==="storm"?11:t.state==="active"?16:21),u=t.state==="storm"?12:t.state==="active"?10:8,y=50-u,b=76,w=[`M ${g},25`,`C ${g-2},15 41,${u} 45,${u}`,`C 53,${u} ${b-8},${u+4} ${b},20`,`C ${b+1},23 ${b+1},27 ${b},30`,`C ${b-8},${y-4} 53,${y} 45,${y}`,`C 41,${y} ${g-2},35 ${g},25`,"Z"].join(" "),$=c?3:2,x=[14,25,36],L=k=>`<path d="M 0,${k} L ${c?8:6},${k} M ${c?6:4},${k-2} L ${c?8:6},${k} L ${c?6:4},${k+2}" stroke="${r}bb" stroke-width="${c?1.4:1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,C=x.map(k=>L(k)).join(""),M=Array.from({length:$},(k,H)=>`<g class="hw-wg" style="animation-duration:${l}s;animation-delay:${(l/$*H).toFixed(2)}s">${C}</g>`).join(""),T=e==null?"":e>0?`<path d="M 45,27 L 45,23 M ${45-1.5},${25-.5} L 45,23 L ${45+1.5},${25-.5}" stroke="#5cce8c" stroke-width="1" fill="none" stroke-linecap="round"/>`:`<path d="M 45,23 L 45,27 M ${45-1.5},${25+.5} L 45,27 L ${45+1.5},${25+.5}" stroke="#e05c5c" stroke-width="1" fill="none" stroke-linecap="round"/>`;return`<svg viewBox="0 0 80 50" style="width:78px;height:49px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${s}-wclip"><rect x="0" y="0" width="26" height="50"/></clipPath></defs>
      <circle cx="2" cy="25" r="5" fill="#f0c040" opacity=".7"/>
      <g clip-path="url(#${s}-wclip)">${M}</g>
      <path d="${w}" fill="${r}14" stroke="${r}b0" stroke-width="0.9"/>
      <circle cx="45" cy="25" r="${4.5}" fill="#2a4a6a" stroke="#4a7090" stroke-width="0.8"/>
      ${T}
    </svg>`}else{let b=t.state==="storm"?16:t.state==="active"?26:38,w=155-b,$=t.state==="storm"?22:t.state==="active"?30:40,x=120-$,L=240,C=[`M ${w},60`,`C ${w-4},42 150,${$} 155,${$}`,`C 173,${$} ${L-5},${$+18} ${L},60`,`C ${L-5},${x-18} 173,${x} 155,${x}`,`C 150,${x} ${w-4},78 ${w},60`,"Z"].join(" "),M=`M ${w+2},60 C ${w+2},${60-b*.4} 152,54 150,60 C 152,66 ${w+2},${60+b*.4} ${w+2},60 Z`,T=o>700?"#e05c5c":o>500?"#e0a84a":o>350?"#d4c840":"#5cce8c",k=o>700?.4:o>500?.65:o>350?1.1:1.8,H=o>500?[10,24,40,57,74,90,106]:o>350?[14,34,57,82,104]:[20,50,82,108],A=16,F=22,z=w-6,P=Math.ceil((z-F)/A)+2,_=Array.from({length:P},(I,B)=>F-A+B*A),E=12,O=8,v=_.flatMap(I=>H.map(B=>`<path d="M ${I},${B} L ${I+E},${B} M ${I+O},${B-3} L ${I+E},${B} L ${I+O},${B+3}" stroke="${T}cc" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)).join(""),S=`<g class="hw-wg-full" style="animation-duration:${k}s">${v}</g>`,D=e==null?"":e>0?'<path d="M 155,64 L 155,56 M 153,58 L 155,56 L 157,58" stroke="#5cce8c" stroke-width="1.3" fill="none" stroke-linecap="round"/>':'<path d="M 155,56 L 155,64 M 153,62 L 155,64 L 157,62" stroke="#e05c5c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',N=e==null?"":`<text x="163" y="62" font-size="6" fill="${e>0?"#5cce8c":"#e05c5c"}" font-family="monospace">Bz${e>0?"\u2191":"\u2193"}</text>`;return`<svg viewBox="-60 0 280 120" style="width:100%;height:80px;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${s}-wclip"><rect x="${F}" y="0" width="${z-F}" height="120"/></clipPath></defs>
      <rect x="-60" width="280" height="120" fill="#0a1014" rx="3"/>
      <circle cx="-60" cy="60" r="80" fill="#f0c040" opacity=".85"/>
      <g clip-path="url(#${s}-wclip)">${S}</g>
      <path d="${M}" fill="${r}08"/>
      <path d="${C}" fill="${r}12" stroke="${r}aa" stroke-width="1.2"/>
      <text x="${w+2}" y="${$-2}" font-size="7" fill="${r}" opacity=".8" font-family="sans-serif">${h(t.label)}</text>
      <circle cx="155" cy="60" r="5" fill="#2a4a6a" stroke="#4a7090" stroke-width="1"/>
      ${D}
      ${N}
      <text x="2" y="115" font-size="6" fill="#f0c04088" font-family="sans-serif">Sun</text>
      <text x="148" y="75" font-size="6" fill="#4a709088" font-family="sans-serif">Earth</text>
    </svg>`}}function Pt(t){let e=tt(t),n=t.metrics.imf_bz_nt,a=t.metrics.solar_wind_kms,s=t.metrics.kp_latest,r=t.metrics.density,o=t.metrics.pressure_npa,c=n!=null?(n>=0?"+":"")+n.toFixed(1)+" nT":"\u2014",i=a!=null?`${Math.round(a)} km/s`:"\u2014",l=r!=null?`${r.toFixed(1)} p/cm\xB3`:"\u2014",d=o!=null?`${o.toFixed(2)} nPa`:"\u2014",p=n!=null?n<=-10?"#e05c5c":n<=-5?"#e0a84a":n>=5?"#5cce8c":"#a0b4b8":"#607880",f=a!=null?a>700?"#e05c5c":a>500?"#e0a84a":a>350?"#d4c840":"#5cce8c":"#607880",m=n!=null&&n<-5?"Southward IMF Bz is strongly coupling energy into the magnetosphere. Geomagnetic storm conditions likely.":n!=null&&n<0?"Southward IMF Bz is partially opening the magnetosphere. Enhanced aurora activity possible.":"Northward IMF Bz keeps the magnetosphere closed. Solar wind energy transfer is minimal.";return`<div class="hw-kpi-popover">
    ${W("Magnetosphere")}
    <div class="hw-spark-wrap" style="border-radius:3px;overflow:hidden">${ct(e,n,a,!1)}</div>
    <div class="hw-kpi-stat-row">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Solar wind</span>
        <span class="hw-kpi-stat-value" style="color:${f}">${h(i)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">IMF Bz</span>
        <span class="hw-kpi-stat-value" style="color:${p}">${h(c)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Coupling</span>
        <span class="hw-kpi-stat-value" style="color:${e.color}">${h(e.coupling)}</span>
      </div>
    </div>
    <div class="hw-kpi-stat-row" style="margin-top:4px">
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Density</span>
        <span class="hw-kpi-stat-value">${h(l)}</span>
      </div>
      <div class="hw-kpi-stat">
        <span class="hw-kpi-stat-label">Pressure</span>
        <span class="hw-kpi-stat-value">${h(d)}</span>
      </div>
    </div>
    <div class="hw-kpi-hint" style="margin-bottom:0">${h(m)}</div>
  </div>`}function dt(t,e,n){if(!t.length)return null;let a=(n%360+360)%360,s=-1,r=1/0,o=Math.cos(e*Math.PI/180);for(let c of t){let i=c.lat-e,l=(c.lon-a+180+360)%360-180,d=i*i+l*o*(l*o);d<r&&(r=d,s=c.prob)}return s>=0?s:null}function pt(t){return`<svg viewBox="0 0 100 100" width="100%" height="100%"
    style="position:absolute;top:0;left:0;pointer-events:none">${['<text x="50" y="4"   font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">N</text>','<text x="96"  y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">W</text>','<text x="50" y="97"  font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">S</text>','<text x="4"   y="51" font-size="3.2" fill="#6a8a98" text-anchor="middle" font-family="monospace" opacity=".6">E</text>'].join("")}</svg>`}function Bt(t,e){let n=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,a=null;e&&t.lat!=null&&t.lon!=null&&(a=dt(e.entries,t.lat,t.lon));let s=t.lat!=null&&t.lon!=null,r=a!=null?a>=30?"#5cce8c":a>=10?"#d4cc5c":"#9ab4bc":"#607880",o=a!=null?`${a}%`:e?"n/a":"\u2026",c=s?`
    <div class="hw-aurora-obs-panel">
      <span>\u{1F4CD}</span>
      <span>${t.locationName?h(t.locationName)+" \xB7 ":""}${t.lat.toFixed(1)}\xB0${t.lat>=0?"N":"S"} ${Math.abs(t.lon).toFixed(1)}\xB0${t.lon>=0?"E":"W"}</span>
      <span class="hw-aurora-prob" style="color:${r}">Aurora: ${o}</span>
    </div>`:"";return`<div class="hw-kpi-popover">
    ${W("Aurora Oval \xB7 Northern Hemisphere")}
    <div class="hw-aurora-map-wrap">
      <img class="hw-aurora-img" src="${j(n)}" alt="NOAA Aurora Oval" loading="lazy" />
      ${pt(t)}
    </div>
    ${c}
    <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
  </div>`}function Dt(t,e,n,a){switch(e){case"solar_wind":return Et(t);case"xray":return Ot(t);case"imf_bz":return Rt(t);case"aurora":return Bt(n,a);case"magnetosphere":return Pt(t);default:return""}}function G(t,e){if(t.length<2)return"\u2192";let n=t[t.length-1],a=Math.max(0,t.length-4),s=t[a];if(!isFinite(n)||!isFinite(s))return"\u2192";let r=n-s;return r>e?"\u2191":r<-e?"\u2193":"\u2192"}function Nt(t,e,n,a,s,r,o){var N,I,B,X,K,V,U;let{summary:c,scales:i,metrics:l,aurora_hint:d}=t,p=(N=nt[c.status])!=null?N:nt.quiet,f=s!=null?s.kp.toFixed(1):l.kp_latest!=null?l.kp_latest.toFixed(1):"\u2014",g=[s?s.gScale:i.g_scale,i.r_scale,i.s_scale].map(R=>{let Y=Ht(R),Z=Y?`color:${p.accent};border-color:${p.accent}33`:"";return`<span class="hw-scale-chip${Y?" hw-scale-active":""}" style="${Z}">${h(R)}</span>`}).join(""),u=s?s.auroraLabel:d.aurora_label,y=u==="good"?"#5cce8c":u==="possible"?"#d4cc5c":"#607880",b=u.charAt(0).toUpperCase()+u.slice(1),w="#b4c6cc",$=l.solar_wind_kms!=null?`${Math.round(l.solar_wind_kms)} km/s`:"\u2014",x=l.imf_bz_nt,L=x!=null?x<=-10?"#e05c5c":x<=-5?"#e0a84a":x>=5?"#5cce8c":"#a0b4b8":"#607880",C=x!=null?(x>=0?"+":"")+x.toFixed(1)+" nT":"\u2014",M=l.xray_class,T=M?(I=lt[M])!=null?I:"#a0b4b8":"#607880",k=M?`${M}-class`:"\u2014",H=G(((B=l.kp_history_1h)!=null?B:[]).map(R=>R.kp),.5),A=G(((X=l.wind_history_1h)!=null?X:[]).map(R=>R.kms),20),F=G(((K=l.bz_history_1h)!=null?K:[]).map(R=>R.bz),1.5),z=G(((V=l.xray_history_1h)!=null?V:[]).map(R=>Math.log10(R.flux+1e-9)),.15),P=e?"\u25BC HISTORY":"\u25B6 HISTORY",_=tt(t),E=(U=l.kp_latest)!=null?U:0,O=E>=5,v=O?`linear-gradient(160deg, #0d2a1a 0%, ${p.bg}22 75%)`:`${p.bg}18`,S=(R,Y,Z,gt,et)=>{let wt=et?`<span class="hw-trend">${et}</span>`:"";return`<div class="hw-kpi-item${a===R?" hw-kpi-active":""}" data-kpi="${R}">
      <span class="hw-qd-label">${Y}</span>
      <span class="hw-qd-value" style="color:${gt}">${Z}${wt}</span>
    </div>`},D=O?`
    <div class="hw-aurora-banner">
      <span class="hw-aurora-banner-text">\u2726 Aurora alert \xB7 Kp ${E.toFixed(1)}</span>
      <button class="hw-aurora-map-btn" data-kpi="aurora">View aurora map \u2192</button>
    </div>`:"";return`
    <div class="hw-hero" style="background:${v}">
      <div class="hw-hero-main">
        <div class="hw-kp-col">
          <div class="hw-kp-big" style="${s?"color:#9acf60":""}">Kp <b>${h(f)}</b>${s?"":`<span class="hw-trend">${H}</span>`}</div>
          <span class="hw-status-badge" style="background:${p.accent}22;color:${p.accent};display:block;text-align:center">${h(c.label)}</span>
          <div class="hw-scales-row">${g}</div>
        </div>
        <div class="hw-info-col">
          <div class="hw-info-top-row">
            <div class="hw-summary-text" style="flex:1">${h(c.text)}</div>
            <div class="hw-magnet-mini${a==="magnetosphere"?" hw-kpi-active":""}" data-kpi="magnetosphere" title="Magnetosphere status">
              ${ct(_,x,l.solar_wind_kms,!0)}
              <div class="hw-magnet-state" style="color:${_.color}">${h(_.label)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="hw-section-row" data-indicators-toggle style="margin-top:8px;margin-bottom:${n?"0":"4px"}">
        <span class="hw-section-caret">${n?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">INDICATORS</span>
      </div>
      ${n?`
      <div class="hw-quick-details">
        ${S("aurora","Aurora",h(b),y)}
        ${S("solar_wind","Solar wind",h($),w,A)}
        ${S("imf_bz","IMF Bz",h(C),L,F)}
        ${S("xray","X-ray",h(k),T,z)}
      </div>
      ${a?Dt(t,a,r,o):""}
      <button class="hw-hero-toggle-btn hw-hero-click" aria-label="Toggle history">${P}</button>`:""}
      ${D}
    </div>`}function jt(t){var d,p,f,m;let{metrics:e}=t,n=(d=e.kp_history_1h)!=null?d:[],a=(p=e.wind_history_1h)!=null?p:[],s=(f=e.bz_history_1h)!=null?f:[],r=(m=e.xray_history_1h)!=null?m:[],o=Ft(n),c=ot(a.map(g=>{var u;return(u=g.kms)!=null?u:0}).filter(g=>g>0),a.map(g=>q(g.t_utc)),"#5cce8c",28,!1),i=ot(s.map(g=>g.bz),s.map(g=>q(g.t_utc)),"#d4cc5c",28,!0),l=zt(r);return`
    <div class="hw-hero-detail">
      <div class="hw-spark-row">
        <div class="hw-spark-label">Kp \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${o}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">IMF Bz \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${i}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">Solar wind \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${c}</div>
      </div>
      <div class="hw-spark-row">
        <div class="hw-spark-label">X-Ray \xB7 Last 24h</div>
        <div class="hw-spark-wrap">${l}</div>
      </div>
    </div>`}function Wt(t){let e=Ct(t.updated_utc);return`
    <div class="hw-header">
      <span class="hw-header-title">Space Weather</span>
      <span class="hw-freshness">${h(e)}</span>
    </div>`}function Xt(t){return t.map((e,n)=>n===0?(e+t[1])/2:n===t.length-1?(t[n-1]+e)/2:(t[n-1]+e+t[n+1])/3)}function Kt(t){return t>=9?"G5":t>=8?"G4":t>=7?"G3":t>=6?"G2":t>=5?"G1":"G0"}function Ut(t){return t>=5?"good":t>=3?"possible":"none"}function ht(t){return t>=9?40:t>=8?45:t>=7?50:t>=6?55:t>=5?60:null}function Yt(t){let e=t>=7?"high":t>=5?"moderate":t>=3?"low":"none",n=ht(t),a=e==="none"?"No aurora expected at mid-latitudes":n!=null?`Aurora possible equatorward of ~${n}\xB0 lat`:"Minor aurora possible at high latitudes",s=t>=7?"moderate":t>=5?"low":"none",r=s==="none"?"No significant HF degradation expected":s==="low"?"Minor HF degradation at high latitudes":"Moderate HF degradation, possible blackouts at high latitudes",o=t>=8?"high":t>=6?"moderate":t>=4?"low":"none";return[{kind:"aurora",level:e,label:"Aurora",summary:a},{kind:"radio",level:s,label:"HF Radio",summary:r},{kind:"solar_activity",level:o,label:"Solar Activity",summary:o==="none"?"Quiet geomagnetic conditions expected":o==="low"?"Active geomagnetic conditions possible":o==="moderate"?"Minor to moderate storm conditions":"Major geomagnetic storm conditions"}]}function Gt(t,e){var p;if(e<=0)return null;let n=(p=t.metrics.kp_forecast_3h)!=null?p:[];if(!n.length)return null;let a=Date.now()+e*36e5,s=n[0],r=1/0;for(let f of n){let m=Math.abs(new Date(f.t_utc).getTime()-a);m<r&&(r=m,s=f)}let o=s.kp,c=Kt(o),i=Ut(o),l=ht(o),d=Yt(o);return{offsetH:e,kp:o,gScale:c,auroraLabel:i,auroraMinLat:l,impacts:d}}function qt(t,e,n,a){var O;let{forecast:s,metrics:r}=t,{kp_max_next_24h:o,kp_max_at_utc:c,trend:i}=s,l=((O=r.kp_forecast_3h)!=null?O:[]).slice(0,16),d=l.length,p=d*3,f=p>0?`${(e/p*100).toFixed(0)}%`:"0%",m=e>0?`\u23F1 +${Math.round(e)}h`:"Timeline",g="Kp forecast unavailable";if(o!=null){let v=at(c),S=i==="rising"?"rising":i==="falling"?"falling":"steady";g=`Peak Kp ${o.toFixed(1)} next 24h${v?` at ${v}`:""} \xB7 ${S}`}let u=a?"\u25BC FORECAST":"\u25B6 FORECAST";if(!l.length)return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${a?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${a?`<div class="hw-forecast-text">${h(g)}</div>`:""}
    </div>`;let y=320,b=38,w=14,$=b+w,x=y/d,L=v=>b-Math.max(2,Math.min(b-2,v/9*(b-2))),C="",M=l.map(v=>v.kp),T=Xt(M);l.forEach((v,S)=>{let D=L(v.kp),N=b-D,I=S*x,B=I+x/2,X=v.kp>=6?"#e05c5c":v.kp>=5?"#e0a84a":v.kp>=4?"#d4cc5c":"#5cce8c",K=`Kp ${v.kp.toFixed(1)} \xB7 ${at(v.t_utc)}`;if(C+=`<rect x="${I.toFixed(1)}" y="${D.toFixed(1)}" width="${(x-1.5).toFixed(1)}" height="${N.toFixed(1)}" fill="${X}" fill-opacity="0.85" rx="1.5"/>`,C+=`<rect x="${I.toFixed(1)}" y="0" width="${x.toFixed(1)}" height="${b}" fill="transparent"><title>${j(K)}</title></rect>`,d<=8||S%2===0){let U=new Date(v.t_utc).getHours();C+=`<text x="${B.toFixed(1)}" y="${($-3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#7a9098">${U.toString().padStart(2,"0")}</text>`}});let H=`<polyline points="${l.map((v,S)=>{let D=S*x+x/2,N=L(T[S]);return`${D.toFixed(1)},${N.toFixed(1)}`}).join(" ")}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,A="";if(e>0&&d>0){let v=Math.min(y-1,e/(d*3)*y);A=`
      <line x1="${v.toFixed(1)}" y1="0" x2="${v.toFixed(1)}" y2="${b}" stroke="rgba(255,255,255,0.75)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <polygon points="${v.toFixed(1)},${b} ${(v-4).toFixed(1)},${(b-7).toFixed(1)} ${(v+4).toFixed(1)},${(b-7).toFixed(1)}" fill="rgba(255,255,255,0.75)"/>`}let F=Math.round(p/4),z=Math.round(p/2),P=Math.round(p*3/4),_=`
    <div class="hw-scrub-wrap">
      <div class="hw-scrub-header">
        <span class="hw-scrub-title">${h(m)}</span>
        ${e>0?'<button class="hw-scrub-reset">\u21BA Live</button>':""}
      </div>
      <input type="range" class="hw-scrub-slider" data-scrub min="0" max="${p}" step="1" value="${e}" style="--pct:${f}">
      <div class="hw-scrub-tick-row">
        <span class="hw-scrub-tick">Now</span>
        <span class="hw-scrub-tick">+${F}h</span>
        <span class="hw-scrub-tick">+${z}h</span>
        <span class="hw-scrub-tick">+${P}h</span>
        <span class="hw-scrub-tick">+${p}h</span>
      </div>
    </div>`,E=n?`
    <div class="hw-sim-banner">
      <span class="hw-sim-badge">\u23F1 +${Math.round(n.offsetH)}h forecast</span>
      <span class="hw-sim-kp">Kp ${n.kp.toFixed(1)} \xB7 ${n.gScale}</span>
    </div>`:"";return`
    <div class="hw-forecast">
      <div class="hw-section-row" data-forecast-toggle>
        <span class="hw-section-caret">${a?"\u25BC":"\u25B6"}</span>
        <span class="hw-section-label" style="margin-bottom:0">FORECAST</span>
      </div>
      ${a?`
      ${E}
      <div class="hw-forecast-text">${h(g)}</div>
      <svg viewBox="0 0 ${y} ${$}" style="width:100%;height:${$}px;display:block" preserveAspectRatio="none">
        ${C}
        ${H}
        ${A}
      </svg>
      ${_}`:""}
    </div>`}function Vt(t){let e=/([NS])(\d+)([EW])(\d+)/i.exec(t);return e?{lat:(e[1].toUpperCase()==="N"?1:-1)*parseInt(e[2],10),lon:(e[3].toUpperCase()==="E"?1:-1)*parseInt(e[4],10)}:null}var ut=[{id:"X",label:"X-risk",color:"#e05c5c"},{id:"M",label:"M-risk",color:"#e0a84a"},{id:"C",label:"C-risk",color:"#d4cc5c"},{id:"quiet",label:"Quiet",color:"#5cce8c"}];function Zt(t){return t.x_flare_probability>0?"X":t.m_flare_probability>0?"M":t.c_flare_probability>0?"C":"quiet"}function Qt(t,e,n){let a=e/2,s=a*.87,r=e*.03,o=e*.009,c=t.map(i=>{var b,w;let l=Vt(i.location);if(!l||Math.abs(l.lon)>88||i.location.includes("*"))return"";let d=Zt(i);if(!n.has(d))return"";let p=ut.find($=>$.id===d).color,f=l.lat*Math.PI/180,m=l.lon*Math.PI/180,g=(a+s*Math.cos(f)*Math.sin(m)).toFixed(1),u=(a-s*Math.sin(f)).toFixed(1),y=`AR ${i.region} \xB7 ${i.location}
Class: ${(b=i.spot_class)!=null?b:"\u2014"} / ${(w=i.mag_class)!=null?w:"\u2014"}
C: ${i.c_flare_probability}%  M: ${i.m_flare_probability}%  X: ${i.x_flare_probability}%`;return`<g style="pointer-events:all">
      <title>${h(y)}</title>
      <circle cx="${g}" cy="${u}" r="${(r+o+1).toFixed(1)}" fill="none" stroke="#000000" stroke-width="${(o*2.5).toFixed(1)}" opacity="0.45"/>
      <circle cx="${g}" cy="${u}" r="${r.toFixed(1)}" fill="none" stroke="${p}" stroke-width="${o.toFixed(1)}"/>
    </g>`}).join("");return`<svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}"
    style="position:absolute;top:0;left:0;border-radius:50%;pointer-events:none">${c}</svg>`}var Jt={aurora:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><path d="M6 1L6.8 5.2L11 6L6.8 6.8L6 11L5.2 6.8L1 6L5.2 5.2Z" fill="currentColor" opacity=".85"/></svg>',radio:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.35" style="flex-shrink:0"><path d="M3.8 9.8 a3.1 3.1 0 0 1 4.4 0"/><path d="M1.5 7.4 A6 6 0 0 1 10.5 7.4"/><circle cx="6" cy="11.2" r="1" fill="currentColor" stroke="none"/></svg>',solar_activity:'<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.25" style="flex-shrink:0"><circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.6 2.6l1.1 1.1M8.3 8.3l1.1 1.1M9.4 2.6l-1.1 1.1M3.7 8.3l-1.1 1.1"/></svg>'},te='<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style="flex-shrink:0"><circle cx="6" cy="6" r="2.5" fill="currentColor" opacity=".7"/></svg>',ee="https://soho.nascom.nasa.gov/data/realtime/hmi_igr/512/latest.jpg",ne=240;function ae(t,e,n,a,s,r,o,c,i){var y,b;let l=(b=(y=e==null?void 0:e.impacts)!=null?y:t.observer_impacts)!=null?b:[],d=l.map(w=>{var A,F;let $=(A=kt[w.level])!=null?A:"#666",x=w.level==="none"?"None":w.level.charAt(0).toUpperCase()+w.level.slice(1),L=(F=Jt[w.kind])!=null?F:te,C=w.level==="none"?"#606870":$,M=w.kind==="solar_activity"?s:o.has(w.kind),T=M?" hw-impact-open":"",k;if(w.kind==="solar_activity"){let z=s?" hw-solar-open":"",P=ut.map(_=>{let E=r.has(_.id),O=E?_.color+"22":"transparent",v=E?"1":"0.32";return`<button class="hw-sl-btn" data-solar-layer="${_.id}" style="color:${_.color};border-color:${_.color};background:${O};opacity:${v}">${_.label}</button>`}).join("");k=`<div class="hw-solar-tip${z}">
          <div class="hw-solar-disk-wrap">
            <img class="hw-solar-disk-img" src="${ee}" alt="Solar disk" loading="lazy" />
            ${n?Qt(n,ne,r):""}
          </div>
          <div class="hw-solar-layers">${P}</div>
          <span class="hw-solar-tip-text">${h(w.summary)}</span>
        </div>`}else if(w.kind==="aurora"){let z=M?" hw-aurora-tip-open":"",P=`https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg?_=${Date.now()}`,_=null;c&&i.lat!=null&&i.lon!=null&&(_=dt(c.entries,i.lat,i.lon));let E=i.lat!=null&&i.lon!=null,O=_!=null?_>=30?"#5cce8c":_>=10?"#d4cc5c":"#9ab4bc":"#607880",v=_!=null?`${_}%`:c?"n/a":"\u2026",S=E?`
        <div class="hw-aurora-obs-panel">
          <span>\u{1F4CD}</span>
          <span>${i.locationName?h(i.locationName)+" \xB7 ":""}${i.lat.toFixed(1)}\xB0${i.lat>=0?"N":"S"} ${Math.abs(i.lon).toFixed(1)}\xB0${i.lon>=0?"E":"W"}</span>
          <span class="hw-aurora-prob" style="color:${O}">Aurora: ${v}</span>
        </div>`:"";k=`<div class="hw-aurora-tip${z}">
          <div class="hw-aurora-map-wrap">
            <img class="hw-aurora-img" src="${j(P)}" alt="NOAA Aurora Oval" loading="lazy" />
            ${pt(i)}
          </div>
          ${S}
          <div class="hw-aurora-caption">NOAA OVATION Prime model \xB7 updates every 5 min</div>
        </div>`}else k=`<div class="hw-impact-tip${M?" hw-impact-tip-open":""}">${h(w.summary)}</div>`;let H=w.kind==="solar_activity"?" data-solar-toggle":` data-impact-row="${j(w.kind)}"`;return`<div class="hw-impact-row${T}"${H}>
      <span class="hw-impact-caret">\u25B6</span>
      <span class="hw-impact-kind" style="color:${C}">${L}<span style="color:#b4c6cc">${h(w.label)}</span></span>
      <span class="hw-impact-badge" style="background:${$}22;color:${$}">${h(x)}</span>
      ${k}
    </div>`}).join(""),p=e?'<span style="font-size:.65em;color:#7a9870;font-weight:normal;text-transform:none;letter-spacing:0"> \xB7 simulated</span>':"",f=l.length,m=a?"\u25BC":"\u25B6",g=f>0?`Observer Impacts (${f})`:"Observer Impacts";return`
    <div class="hw-impacts">
      ${`
    <div class="hw-section-row" data-impacts-toggle>
      <span class="hw-section-caret">${m}</span>
      <span class="hw-section-label" style="margin-bottom:0">${g}${p}</span>
    </div>`}
      ${a?d:""}
    </div>`}var rt={geomagnetic_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 2.5v1.5M6.5 9v1.5M2.5 6.5H4M9 6.5h1.5M4.1 4.1l1.1 1.1M7.8 7.8l1.1 1.1M4.1 8.9l1.1-1.1M7.8 5.2l1.1-1.1"/></svg>',geomagnetic_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="4"/><path d="M6.5 4v3l2 1.2"/></svg>',radio_blackout:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M4 10.5a3.5 3.5 0 0 1 5 0"/><path d="M1.8 8.3A6.5 6.5 0 0 1 11.2 8.3"/><circle cx="6.5" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',radiation_storm:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M6.5 1.5L8 5H5L6.5 1.5z" fill="currentColor" opacity=".7" stroke="none"/><path d="M3 11l2-3.5h3L10 11"/><line x1="6.5" y1="7" x2="6.5" y2="11"/></svg>',cme_arrival:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2"/><path d="M1.5 6.5h2M9.5 6.5h2M6.5 1.5v2M6.5 9.5v2"/><path d="M3.5 3.5l1.4 1.4M8.1 8.1l1.4 1.4M8.1 3.5L6.7 4.9M4.9 8.1L3.5 9.5"/></svg>',cme_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><path d="M2 6.5 C2 4 4 2 6.5 2 C9 2 11 4 11 6.5"/><path d="M4 6.5 C4 5 5.1 4 6.5 4 C7.9 4 9 5 9 6.5"/><circle cx="6.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>',aurora_watch:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true"><path d="M6.5 1L7.5 5.5L12 6.5L7.5 7.5L6.5 12L5.5 7.5L1 6.5L5.5 5.5Z" fill="currentColor" opacity=".85"/></svg>',solar_flare:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none"/><path d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.8 2.8l1.1 1.1M9 9l1.1 1.1M9 2.8l-1.1 1.1M4 9l-1.1 1.1"/></svg>',space_weather_info:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M6.5 6v4"/><circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/></svg>',unknown:'<svg viewBox="0 0 13 13" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3"><circle cx="6.5" cy="6.5" r="5"/><path d="M4.8 4.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8c0 .9-.6 1.4-1.2 1.8-.6.4-.8.7-.8 1.2"/><circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/></svg>'};function se(t,e){var i,l;let n=(i=_t[t.level])!=null?i:"#666",a=t.level.charAt(0).toUpperCase()+t.level.slice(1),s=(l=rt[t.kind])!=null?l:rt.unknown,r=[Lt(t.t_utc),t.source_code?`SWPC: ${t.source_code}`:""].filter(Boolean).join(" \xB7 "),o=e&&t.raw_body?`<div class="hw-alert-body">${h(t.raw_body)}</div>`:"";return`<div class="hw-alert-item${e?" hw-alert-open":""}" style="border-color:${n}" data-alert-key="${j(t.dedupe_key)}">
    <div class="hw-alert-top">
      <span class="hw-alert-icon" style="color:${n}">${s}</span>
      <span class="hw-alert-level" style="color:${n}">${h(a)}</span>
      <span class="hw-alert-title">${h(t.title)}</span>
    </div>
    <div class="hw-alert-summary">${h(t.summary_short)}</div>
    <div class="hw-alert-meta">${h(r)}</div>
    ${o}
  </div>`}var ie={info:"#445c64",watch:"#e0a84a",warning:"#e05c5c"},oe="#4ae0a4";function re(t){let e=(n,a="")=>`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" ${a}>${n}</svg>`;switch(t){case"solar_flare":return e(`<circle cx="6.5" cy="6.5" r="2.5"/>
        <line x1="6.5" y1="1" x2="6.5" y2="3"/>
        <line x1="6.5" y1="10" x2="6.5" y2="12"/>
        <line x1="1" y1="6.5" x2="3" y2="6.5"/>
        <line x1="10" y1="6.5" x2="12" y2="6.5"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="8.9" y1="8.9" x2="10.3" y2="10.3"/>
        <line x1="10.3" y1="2.7" x2="8.9" y2="4.1"/>
        <line x1="4.1" y1="8.9" x2="2.7" y2="10.3"/>`);case"cme_launch":return e(`<line x1="1" y1="6.5" x2="10" y2="6.5"/>
        <polyline points="7,3.5 10,6.5 7,9.5"/>
        <line x1="1" y1="4.5" x2="6" y2="4.5" stroke-opacity=".5"/>
        <line x1="1" y1="8.5" x2="6" y2="8.5" stroke-opacity=".5"/>`);case"cme_arrival":return e(`<path d="M11,6.5 A4.5,4.5 0 0,1 2,6.5" stroke-opacity=".4"/>
        <path d="M9.5,6.5 A3,3 0 0,1 3.5,6.5" stroke-opacity=".7"/>
        <path d="M8,6.5 A1.5,1.5 0 0,1 5,6.5"/>
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>`);case"geomagnetic_storm":return e('<polyline points="8,1.5 5,6.5 7.5,6.5 5,11.5"/>');case"geomagnetic_watch":return e(`<circle cx="6.5" cy="6.5" r="5"/>
        <line x1="6.5" y1="3.5" x2="6.5" y2="6.5"/>
        <line x1="6.5" y1="6.5" x2="9" y2="7.5"/>`);case"radio_blackout":return e(`<path d="M3,3.5 Q6.5,6.5 10,9.5" stroke-opacity=".5"/>
        <path d="M10,3.5 Q6.5,6.5 3,9.5"/>
        <line x1="5" y1="1" x2="8" y2="12" stroke-opacity=".3"/>`);case"radiation_storm":return e(`<path d="M6.5,1.5 L12,11 L1,11 Z"/>
        <line x1="6.5" y1="5" x2="6.5" y2="8"/>
        <circle cx="6.5" cy="9.5" r=".6" fill="currentColor" stroke="none"/>`);default:return e(`<circle cx="6.5" cy="6.5" r="5.5"/>
        <line x1="6.5" y1="5.5" x2="6.5" y2="9"/>
        <circle cx="6.5" cy="3.8" r=".6" fill="currentColor" stroke="none"/>`)}}function le(t){var a;let e=(a=t.metadata)!=null?a:{},n=[];return e.source_code&&n.push(`Code: ${e.source_code}`),e.model&&n.push(`Model: ${String(e.model).toUpperCase()}`),n.length===0?"":`
${n.join(" \xB7 ")}`}function ce(t,e,n){var i;let a=t.is_active?oe:(i=ie[t.level])!=null?i:"#445c64",s=t.event_time===n,r=t.event_time.slice(11,16)+" UTC",o=t.source==="NASA_DONKI"?"DONKI":"SWPC",c=s?`<div class="hw-tl-detail">${h(t.description)}${h(le(t))}</div>`:"";return`
    <div class="hw-tl-item" data-timeline-key="${j(t.event_time)}">
      <div class="hw-tl-chain">
        <div class="hw-tl-dot" style="background:${a}"></div>
        ${e?'<div class="hw-tl-line"></div>':""}
      </div>
      <div class="hw-tl-body">
        <div class="hw-tl-meta">
          <span class="hw-tl-time">${r}</span>
          <span class="hw-tl-src">${o}</span>
        </div>
        <div class="hw-tl-title${t.is_active?" hw-tl-active":""}">
          ${re(t.event_type)} ${h(t.event_title)}
        </div>
        ${c}
      </div>
    </div>`}function de(t,e,n,a){var b,w;let s=(b=t.timeline)!=null?b:[],r=Date.now(),o=new Date(r).toISOString().slice(0,10),c=new Date(r-864e5).toISOString().slice(0,10),i=new Date(r-1728e5).toISOString().slice(0,10),l=new Set([o,c,i]),d=s.filter($=>{var x;return l.has(((x=$.event_time)!=null?x:"").slice(0,10))}).slice().reverse(),p=d.length,f=n?"\u25BC":"\u25B6",m=p>0?`Solar Activity Timeline (${p})`:"Solar Activity Timeline",g=`
    <div class="hw-section-row" data-tl-section>
      <span class="hw-section-caret">${f}</span>
      <span class="hw-section-label" style="margin-bottom:0">${m}</span>
    </div>`;if(!n||p===0)return`<div class="hw-timeline">${g}</div>`;let u=new Map;for(let $ of d){let x=((w=$.event_time)!=null?w:"").slice(0,10);u.has(x)||u.set(x,[]),u.get(x).push($)}let y=[...u.entries()].map(([$,x])=>{let C=new Date($+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),M=a.has($),T=M?"\u25B6":"\u25BC",k=M?`<span class="hw-tl-day-count">${x.length} events</span>`:"",H=`
      <div class="hw-tl-day-row" data-tl-day="${j($)}">
        <span class="hw-section-caret">${T}</span>
        <span class="hw-tl-date">${C}</span>
        ${k}
      </div>`,A=M?"":x.map((F,z)=>ce(F,z<x.length-1,e)).join("");return`<div class="hw-tl-group">${H}${A}</div>`}).join("");return`
    <div class="hw-timeline">
      ${g}
      ${y}
    </div>`}function pe(t,e,n){var l;let a=(l=t.alerts_all)!=null?l:[],s=a.length,r=e?"\u25BC":"\u25B6",o=s>0?`SWPC Alerts (${s})`:"SWPC Alerts",c=`
    <div class="hw-alerts-header">
      <div class="hw-section-row" data-alerts-toggle style="margin-bottom:0">
        <span class="hw-section-caret">${r}</span>
        <span class="hw-alerts-label">${o}</span>
      </div>
    </div>`;if(!e||s===0)return`<div class="hw-alerts">${c}${e&&s===0?'<div class="hw-empty-alerts">No significant recent SWPC alerts</div>':""}</div>`;let i=a.map(d=>se(d,d.dedupe_key===n)).join("");return`
    <div class="hw-alerts">
      ${c}
      ${i}
    </div>`}function he(t,e){var P,_,E;let n=t.cme_tracker;if(!n)return"";let a=(P=Mt[n.impact_level])!=null?P:"#96a8b8",s=(_=St[n.status])!=null?_:n.status,r=300,o=44,c=18,i=o/2,l=10,d=r-18,p=7,f=`<line x1="${c+l}" y1="${i}" x2="${d-p}" y2="${i}" stroke="#2a3c42" stroke-width="1.5" stroke-dasharray="5,4"/>`,m=`<circle cx="${c}" cy="${i}" r="${l}" fill="#f0c040" opacity="0.92"/>`,g=`
    <circle cx="${d}" cy="${i}" r="${p}" fill="#4a90c4" opacity="0.88"/>
    <circle cx="${d}" cy="${i}" r="2.5" fill="#fff" opacity="0.7"/>`,u=`<text x="${c}" y="${i+l+9}" text-anchor="middle" font-size="9" fill="#c8aa60">Sun</text>`,y=`<text x="${d}" y="${i+p+9}" text-anchor="middle" font-size="9" fill="#7ab0d4">Earth</text>`,b="";if(n.progress!=null){let O=c+l+4,v=d-p-4,S=O+n.progress*(v-O),D=5;n.status==="arrival_window"?b=`
        <g transform="translate(${S.toFixed(1)},${i})" class="hw-cme-pulse-dot" style="transform-box:fill-box;transform-origin:center">
          <circle cx="0" cy="0" r="${D}" fill="${a}" opacity="0.92"/>
        </g>`:b=`<circle cx="${S.toFixed(1)}" cy="${i}" r="${D}" fill="${a}" opacity="0.85"/>`}let w=`<svg class="hw-cme-svg" viewBox="0 0 ${r} ${o}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${f}
    ${m}${u}
    ${g}${y}
    ${b}
  </svg>`,$=st(n.arrival_time_utc),x=st(n.launch_time_utc),L=n.speed_kms!=null?`${Math.round(n.speed_kms)} km/s`:"\u2014",C=n.half_angle_deg!=null?`${n.half_angle_deg}\xB0`:"\u2014",M=(E=n.source_location)!=null?E:"\u2014",T=n.is_earth_direct?"Direct hit":"Glancing blow",k=n.progress!=null?`${Math.round(n.progress*100)}%`:"\u2014",H=`
    <div class="hw-cme-detail">
      <div class="hw-cme-stat-grid">
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Arrival estimate</span>
          <span class="hw-cme-stat-value">${h($)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Speed</span>
          <span class="hw-cme-stat-value" style="color:${a}">${h(L)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Impact</span>
          <span class="hw-cme-stat-value" style="color:${a}">${h(n.impact_level.charAt(0).toUpperCase()+n.impact_level.slice(1))}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Status</span>
          <span class="hw-cme-stat-value">${h(s)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Launch</span>
          <span class="hw-cme-stat-value">${h(x)}</span>
        </div>
        <div class="hw-cme-stat">
          <span class="hw-cme-stat-label">Progress</span>
          <span class="hw-cme-stat-value">${h(k)}</span>
        </div>
      </div>
      <div class="hw-cme-note">Half-angle: ${h(C)} \xB7 Source: ${h(M)} \xB7 ${h(T)} \xB7 Model: Enlil (NASA DONKI)</div>
    </div>`,A=e?"\u25BC":"\u25B6",F=n.impact_level==="unknown"?"Unrated":n.impact_level.charAt(0).toUpperCase()+n.impact_level.slice(1),z=e?`${w}${H}`:"";return`
    <div class="hw-cme">
      <div class="hw-cme-row" data-cme-toggle>
        <span class="hw-section-caret">${A}</span>
        <span class="hw-section-label" style="margin-bottom:0">CME Tracker</span>
        <span class="hw-cme-badge" style="background:${a}22;color:${a};margin-left:auto">${h(s)}</span>
        <span class="hw-cme-badge" style="background:${a}15;color:${a};margin-left:4px">${h(F)} impact</span>
      </div>
      ${z}
    </div>`}function ue(t,e,n,a,s,r,o,c,i,l,d,p,f,m,g,u,y,b,w,$){let x=Gt(t,s);return`
    <div class="hw-root">
      ${Wt(t)}
      ${Nt(t,n,m,a,x,w,$)}
      ${n?jt(t):""}
      ${qt(t,s,x,f)}
      ${he(t,p)}
      ${ae(t,x,g,d,u,y,b,$,w)}
      ${de(t,c,i,l)}
      ${pe(t,r,o)}
    </div>`}function me(t){return`<div class="hw-root">
    <div class="hw-header"><span class="hw-header-title">Space Weather</span></div>
    <div class="hw-error">
      <div class="hw-error-title">Space Weather</div>
      <div class="hw-error-body">${h(t)}</div>
    </div>
  </div>`}function ge(){return'<div class="hw-root"><div class="hw-loading">Loading space weather data\u2026</div></div>'}var J=class{constructor(e,n){this.expanded=!1;this.heroExpanded=!1;this.activePopover=null;this.scrubOffset=0;this.alertsExpanded=!1;this.expandedAlertKey=null;this.expandedTimelineKey=null;this.timelineOpen=!1;this.collapsedDays=new Set;this.impactsOpen=!1;this.cmeExpanded=!1;this.forecastOpen=!1;this.indicatorsOpen=!0;this.solarRegions=null;this.solarExpanded=!1;this.solarLayers=new Set(["X","M","C","quiet"]);this.expandedImpacts=new Set;this.ovationData=null;this.timer=null;this.data=null;this.el=e,this.opts=n,this.el.innerHTML=ge(),this.el.addEventListener("click",this.onClick.bind(this)),this.el.addEventListener("input",this.onInput.bind(this)),this.el.addEventListener("change",this.onChange.bind(this)),this.fetch()}onClick(e){var l,d,p,f,m,g;let n=e.target;if(n.closest(".hw-scrub-reset")){this.scrubOffset=0,this.render();return}if(n.closest("[data-cme-toggle]")){this.cmeExpanded=!this.cmeExpanded,this.render();return}if(n.closest("[data-forecast-toggle]")){this.forecastOpen=!this.forecastOpen,this.render();return}if(n.closest("[data-indicators-toggle]")){this.indicatorsOpen=!this.indicatorsOpen,this.render();return}if(n.closest("[data-impacts-toggle]")){this.impactsOpen=!this.impactsOpen,this.render();return}let a=n.closest("[data-impact-row]");if(a){let u=(l=a.dataset.impactRow)!=null?l:"";this.expandedImpacts.has(u)?this.expandedImpacts.delete(u):this.expandedImpacts.add(u),this.render();return}let s=n.closest("[data-solar-layer]");if(s){let u=(d=s.dataset.solarLayer)!=null?d:"";this.solarLayers.has(u)?this.solarLayers.delete(u):this.solarLayers.add(u),this.render();return}if(n.closest("[data-solar-toggle]")){this.solarExpanded=!this.solarExpanded,this.render();return}if(n.closest("[data-alerts-toggle]")){this.alertsExpanded=!this.alertsExpanded,this.render();return}let r=n.closest("[data-alert-key]");if(r){let u=(p=r.dataset.alertKey)!=null?p:null;this.expandedAlertKey=this.expandedAlertKey===u?null:u,this.render();return}if(n.closest("[data-tl-section]")){if(this.timelineOpen=!this.timelineOpen,this.timelineOpen){let u=Date.now();this.collapsedDays=new Set([new Date(u).toISOString().slice(0,10),new Date(u-864e5).toISOString().slice(0,10),new Date(u-1728e5).toISOString().slice(0,10)])}this.render();return}let o=n.closest("[data-tl-day]");if(o){let u=(f=o.dataset.tlDay)!=null?f:"";this.collapsedDays.has(u)?this.collapsedDays.delete(u):this.collapsedDays.add(u),this.render();return}let c=n.closest("[data-timeline-key]");if(c){let u=(m=c.dataset.timelineKey)!=null?m:null;this.expandedTimelineKey=this.expandedTimelineKey===u?null:u,this.render();return}if(n.closest(".hw-kpi-close")){this.activePopover=null,this.render();return}let i=n.closest("[data-kpi]");if(i){let u=(g=i.dataset.kpi)!=null?g:null;this.activePopover=this.activePopover===u?null:u,this.render();return}if(n.closest(".hw-toggle")){this.expanded=!this.expanded,this.render();return}n.closest(".hw-hero-click")&&(this.heroExpanded=!this.heroExpanded,this.render())}onInput(e){let n=e.target;if(!n.matches("[data-scrub]"))return;let a=parseFloat(n.value);this.scrubOffset=a,n.style.setProperty("--pct",`${(a/parseFloat(n.max)*100).toFixed(0)}%`);let s=this.el.querySelector(".hw-scrub-title");s&&(s.textContent=a>0?`\u23F1 +${Math.round(a)}h`:"Timeline")}onChange(e){e.target.matches("[data-scrub]")&&this.render()}async fetch(){var e;try{let n=await fetch(this.opts.dataUrl,{cache:"no-store"});if(!n.ok)throw new Error(`HTTP ${n.status}`);this.data=await n.json(),this.render(),this.fetchSolarRegions(),this.fetchOvationData()}catch(n){let a=n instanceof Error?n.message:String(n);this.el.innerHTML=me(`Space weather data unavailable (${a})`)}finally{this.timer=setTimeout(()=>this.fetch(),(e=this.opts.refreshMs)!=null?e:6e5)}}async fetchSolarRegions(){try{let e=await fetch("https://services.swpc.noaa.gov/json/solar_regions.json");if(!e.ok)return;let n=await e.json(),a=new Map;for(let s of n){let r=a.get(s.region),o=s.area!=null,c=(r==null?void 0:r.area)!=null;(!r||!c&&o||c===o&&s.observed_date>r.observed_date)&&a.set(s.region,s)}this.solarRegions=[...a.values()],this.render()}catch(e){}}async fetchOvationData(){var e,n,a,s,r,o;if(!(this.opts.lat==null||this.opts.lon==null))try{let c=await fetch("https://services.swpc.noaa.gov/json/ovation_aurora_latest.json");if(!c.ok)return;let i=await c.json(),d=((a=(n=(e=i.coordinates)!=null?e:i.Data)!=null?n:i.data)!=null?a:[]).map(([p,f,m])=>({lon:p,lat:f,prob:m}));this.ovationData={entries:d,forecastTime:String((o=(r=(s=i["Forecast Time"])!=null?s:i.forecast_time)!=null?r:i["Observation Time"])!=null?o:"")},this.render()}catch(c){}}render(){this.data&&(this.el.innerHTML=ue(this.data,this.expanded,this.heroExpanded,this.activePopover,this.scrubOffset,this.alertsExpanded,this.expandedAlertKey,this.expandedTimelineKey,this.timelineOpen,this.collapsedDays,this.impactsOpen,this.cmeExpanded,this.forecastOpen,this.indicatorsOpen,this.solarRegions,this.solarExpanded,this.solarLayers,this.expandedImpacts,this.opts,this.ovationData))}destroy(){this.timer&&clearTimeout(this.timer),this.el.removeEventListener("click",this.onClick.bind(this))}},mt={mount(t,e){return At(),new J(t,e)}};typeof window!="undefined"&&(window.HelioWidget=mt);return yt(we);})();
