/* sky.ui.js
 * Tooltip + Modal UI helpers for sky widget.
 * UI (templates + styles + behavior) lives ONLY here.
 */

let __stylesInjected = false;

function injectStyles() {
  if (__stylesInjected) return;
  __stylesInjected = true;

  const css = `
  /* SkyUI-specific styles - tooltip/modal only */
  
  .skyui-tooltip {
    position: absolute;
    left: 0; top: 0;
    transform: translate(-9999px, -9999px);
    display: none;
    z-index: 5;
    max-width: 280px;
    pointer-events: none;
    will-change: transform;
  }
  
  .skyui-card {
    background: rgba(0,0,0,0.55);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 10px;
    color: rgba(255,255,255,0.88);
    font: 12px system-ui, -apple-system, Segoe UI, Roboto, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial;
    backdrop-filter: blur(6px);
    padding: 8px 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
  }
  
  .skyui-card--modal {
    background: rgba(0,0,0,0.70);
    border-radius: 14px;
    padding: 12px 12px 14px 12px;
    font-size: 13px;
  }

  .skyui-modal {
    position: absolute;
    inset: 0;
    display: none;
    z-index: 20;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(2px);
  }
  
  .skyui-modal__panel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100% - 28px));
    max-height: min(70vh, 520px);
    overflow: auto;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.70);
    color: rgba(255,255,255,0.90);
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    font: 13px system-ui, -apple-system, Segoe UI, Roboto, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial;
  }
  
  .skyui-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 0 12px;
  }
  
  .skyui-modal__heading {
    font-weight: 650;
    opacity: 0.95;
  }
  
  .skyui-modal__close {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.85);
    cursor: pointer;
  }
  
  .skyui-modal__body {
    padding: 10px 12px 12px 12px;
  }
  `;

  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-skyui", "1");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function fmtDeg(x, digits = 0) {
  if (typeof x !== "number" || !isFinite(x)) return "—";
  return `${x.toFixed(digits)}°`;
}

function fmtMag(x, digits = 1) {
  if (typeof x !== "number" || !isFinite(x)) return "—";
  return x.toFixed(digits);
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeDesignation(des) {
  const s0 = String(des ?? "").trim();
  if (!s0) return "";

  // если уже есть греческая буква — оставляем как есть
  if (/[αβγδεζηθικλμνξοπρστυφχψω]/.test(s0)) return s0;

  const map3 = {
    Alp: "α", Bet: "β", Gam: "γ", Del: "δ", Eps: "ε",
    Zet: "ζ", Eta: "η", The: "θ", Iot: "ι", Kap: "κ",
    Lam: "λ", Mu: "μ", Nu: "ν", Xi: "ξ", Omic: "ο",
    Pi: "π", Rho: "ρ", Sig: "σ", Tau: "τ", Ups: "υ",
    Phi: "φ", Chi: "χ", Psi: "ψ", Ome: "ω",
  };

  const mapFull = {
    Alpha: "α", Beta: "β", Gamma: "γ", Delta: "δ", Epsilon: "ε",
    Zeta: "ζ", Eta: "η", Theta: "θ", Iota: "ι", Kappa: "κ",
    Lambda: "λ", Mu: "μ", Nu: "ν", Xi: "ξ", Omicron: "ο",
    Pi: "π", Rho: "ρ", Sigma: "σ", Tau: "τ", Upsilon: "υ",
    Phi: "φ", Chi: "χ", Psi: "ψ", Omega: "ω",
  };

  const parts = s0.split(/\s+/);
  const headRaw = parts[0];
  const head = headRaw[0]?.toUpperCase() + headRaw.slice(1).toLowerCase(); // alp -> Alp
  const greek = map3[head] || mapFull[headRaw] || mapFull[head];
  if (!greek) return s0;

  return [greek, ...parts.slice(1)].join(" ");
}

function prepareStars(starCatalog, observer, viewport, options) {
  // ...
  for (const s of starCatalog?.stars || []) {
    // ...
    const designationRaw =
      s.designation ??
      s.desig ??
      s.bayer ??
      s.bayer_designation ??
      s.bayerDes ??
      s.bayer_name ??
      "";

    const designation = normalizeDesignation(designationRaw);

    stars.push({
      id: s.id,
      name: s.name || "",
      designation,          // <-- ВАЖНО: теперь тултип/модал смогут это показать
      mag: s.mag,
      x, y, r,
      altDeg,
      azDeg
    });
  }
  return stars;
}


/**
 * True HTML templates (classes + predictable DOM structure).
 * hit: { kind: "star"|"object"|"alert", data: {...} }
 */
function buildInfoCardHTML(hit, mode = "tooltip") {
  if (!hit) return "";

  const d = hit.data || {};
  const isModal = mode === "modal";

  // Determine emoji/image based on type
  let iconHTML = "";
  
  // Check if it's a planet/sun/moon with image
  if (d.type === "sun") {
    iconHTML = '<img src="/sky/assets/images/Sun.png" style="width:20px;height:20px;display:block;" alt="Sun">';
  } else if (d.type === "moon") {
    iconHTML = '<img src="/sky/assets/images/Moon.png" style="width:20px;height:20px;display:block;" alt="Moon">';
  } else if (d.type === "planet" && d.name) {
    // Planet name to filename: "Jupiter" -> "Jupiter.png"
    const planetName = d.name.charAt(0).toUpperCase() + d.name.slice(1).toLowerCase();
    iconHTML = `<img src="/sky/assets/images/${planetName}.png" style="width:20px;height:20px;display:block;" alt="${planetName}">`;
  } else {
    // Fall back to emoji
    let emoji = "⭐";  // default for stars
    if (hit.kind === "alert") {
      emoji = "💥";
    } else if (hit.kind === "object" || d.type === "dso") {
      emoji = "🌀";
    } else if (hit.kind === "star") {
      emoji = "⭐";
    } else {
      emoji = "🔵";  // other
    }
    iconHTML = `<span style="font-size:20px;line-height:1;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;">${emoji}</span>`;
  }

  let title = "—";
  let note = "";
  const raDec = [];
  const metaParts = [];

  // Helper to format RA in hours/minutes
  const fmtRA = (ra) => {
    const v = Number(ra);
    if (!Number.isFinite(v)) return null;
    const totalSec = (v / 15) * 3600;
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hh)}h${pad(mm)}m`;
  };

  // Helper to format DEC in degrees/arcminutes
  const fmtDEC = (dec) => {
    const v = Number(dec);
    if (!Number.isFinite(v)) return null;
    const sign = v >= 0 ? "+" : "−";
    const a = Math.abs(v);
    const dd = Math.floor(a);
    const mm = Math.floor((a - dd) * 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${sign}${dd}°${pad(mm)}′`;
  };

  if (hit.kind === "alert") {
    title = d.title || "Alert";
    note = d.note || "";
    
    // RA/DEC line
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);
    
    // Meta line
    if (d.mag != null) metaParts.push(`mag ${fmtMag(d.mag, 1)}`);
    if (d.altDeg != null) metaParts.push(`alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`az ${fmtDeg(d.azDeg, 0)}`);
    const lvl = (d.level || "amateur").toLowerCase();
    if (lvl) metaParts.push(lvl);
    if (d.severity != null) metaParts.push(`severity ${d.severity}`);

  } else if (hit.kind === "object") {
    title = d.name || "Object";
    note = d.note || "";
    
    // RA/DEC line
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);
    
    // Meta line
    // Skip showing "planet" type for planets (redundant with image)
    if (d.type && d.type !== "planet" && d.type !== "sun" && d.type !== "moon") metaParts.push(d.type);
    if (d.mag != null) metaParts.push(`mag ${fmtMag(d.mag, 1)}`);
    if (d.altDeg != null) metaParts.push(`alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`az ${fmtDeg(d.azDeg, 0)}`);
    if (d.constellation) metaParts.push(d.constellation);
    if (d.distance) metaParts.push(d.distance);

  } else {
    // STAR — title priority: "Name · α Con" > "α Con" > "HIP N" > "Star"
    // Never show a bare numeric ID.
    const proper = (d.name || "").trim();
    const bayer  = normalizeDesignation(d.designation || "");
    const hipLabel = Number.isFinite(Number(d.hip)) ? `HIP ${d.hip}`
                   : Number.isFinite(Number(d.id))  ? `HIP ${d.id}`
                   : null;
    title = (proper && bayer) ? `${proper} · ${bayer}`
          : proper || bayer || hipLabel || "Star";
    note = "";

    // RA/DEC line
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);

    // Meta line
    if (d.mag != null) metaParts.push(`mag ${fmtMag(d.mag, 2)}`);
    if (d.altDeg != null) metaParts.push(`alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`az ${fmtDeg(d.azDeg, 0)}`);
    if (d.constellation) metaParts.push(d.constellation);
  }

  const raDecText = raDec.join(" · ");
  const metaText = metaParts.join(" · ");

  return `
    <div class="skyui-card ${isModal ? "skyui-card--modal" : ""}" style="display:flex;flex-direction:column;gap:4px;min-width:180px;max-width:320px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:20px;height:20px;">${iconHTML}</span>
        <span style="font-size:14px;font-weight:700;line-height:1.2;">${esc(title)}</span>
      </div>
      ${note ? `<div style="font-size:12px;line-height:1.3;opacity:0.85;word-wrap:break-word;margin-top:-2px;">${esc(note)}</div>` : ""}
      ${raDecText ? `<div style="font-size:9px;line-height:1.3;opacity:0.70;font-variant-numeric:tabular-nums;">${raDecText}</div>` : ""}
      ${metaText ? `<div style="font-size:9px;line-height:1.3;opacity:0.65;word-wrap:break-word;">${metaText}</div>` : ""}
    </div>
  `;
}

/**
 * Compatibility wrapper (existing name).
 */
function tooltipHTML(hit) {
  return buildInfoCardHTML(hit, "tooltip");
}

/**
 * Tooltip controller (positioning via transform).
 * rootX/rootY: CSS px relative to rootEl.
 */
function createTooltip(rootEl, tooltipEl) {
  injectStyles();

  // Ensure tooltip element has correct class (layout + visibility)
  tooltipEl.classList.add("skyui-tooltip");

  let lastHTML = "";
  let lastW = 240, lastH = 80;
  let raf = 0;
  let pending = null;

  function hide() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    pending = null;
    tooltipEl.style.display = "none";
    tooltipEl.style.transform = "translate(-9999px, -9999px)";
  }

  function computeAndPlace(rootX, rootY) {
    const rootRect = rootEl.getBoundingClientRect();
    const margin = 10;

    const tw = tooltipEl.offsetWidth || lastW;
    const th = tooltipEl.offsetHeight || lastH;
    lastW = tw; lastH = th;

    let x = rootX + 14;
    let y = rootY + 14;

    const maxX = rootRect.width - margin - tw;
    const maxY = rootRect.height - margin - th;

    x = clamp(x, margin, Math.max(margin, maxX));
    y = clamp(y, margin, Math.max(margin, maxY));

    tooltipEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function show(rootX, rootY, html) {
    pending = { rootX, rootY, html };
    if (raf) return;

    raf = requestAnimationFrame(() => {
      raf = 0;
      const p = pending;
      pending = null;
      if (!p) return;

      if (p.html !== lastHTML) {
        tooltipEl.innerHTML = p.html;
        lastHTML = p.html;
      }

      if (tooltipEl.style.display !== "block") tooltipEl.style.display = "block";
      computeAndPlace(p.rootX, p.rootY);
    });
  }

  return { show, hide };
}

/**
 * Modal controller (HTML content — same card template for now).
 */
function createModal(rootEl) {
  injectStyles();

  const overlay = document.createElement("div");
  overlay.className = "skyui-modal";

  const panel = document.createElement("div");
  panel.className = "skyui-modal__panel";

  const header = document.createElement("div");
  header.className = "skyui-modal__header";

  const heading = document.createElement("div");
  heading.className = "skyui-modal__heading";
  heading.textContent = "Details";

  const closeBtn = document.createElement("button");
  closeBtn.className = "skyui-modal__close";
  closeBtn.type = "button";
  closeBtn.textContent = "×";

  const body = document.createElement("div");
  body.className = "skyui-modal__body";

  header.appendChild(heading);
  header.appendChild(closeBtn);
  panel.appendChild(header);
  panel.appendChild(body);
  overlay.appendChild(panel);
  rootEl.appendChild(overlay);

  function hide() {
    overlay.style.display = "none";
  }

  function show(html, title = "Details") {
    heading.textContent = title;
    body.innerHTML = html;
    overlay.style.display = "block";
  }

  function showFromHit(hit) {
    const title = hit?.kind ? (hit.kind[0].toUpperCase() + hit.kind.slice(1)) : "Details";
    show(buildInfoCardHTML(hit, "modal"), title);
  }

  closeBtn.addEventListener("click", hide);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });

  return { show, hide, showFromHit };
}

/**
 * Details panel helpers (kept for compatibility with existing wiring).
 */
function makeDetailsPayloadFromHit(hit) {
  if (!hit) return null;
  const d = hit.data || {};
  return {
    kind: hit.kind || "unknown",
    title: d.title || d.name || d.id || "—",
    subtitle: d.type || d.kind || "",
    mag: d.mag,
    altDeg: d.altDeg,
    azDeg: d.azDeg
  };
}

function buildBestTodayPopover(objects, onPick) {
  const el = document.createElement("div");
  el.className = "sky-best-popover";

  (objects || []).forEach(obj => {
    const item = document.createElement("div");
    item.className = "sky-best-item";

    const name = document.createElement("div");
    name.className = "sky-best-name";
    name.textContent = obj.name || obj.id || "—";
    item.appendChild(name);

    if (obj.note) {
      const note = document.createElement("div");
      note.className = "sky-best-note";
      note.textContent = obj.note;
      item.appendChild(note);
    }

    item.addEventListener("click", () => {
      if (typeof onPick === "function") onPick(obj);
    });

    el.appendChild(item);
  });

  return el;
}


function setDetails(rootEl, payload) {
  void rootEl; void payload;
}

function clearDetails(rootEl) {
  void rootEl;
}

export const SkyUI = {
  fmtDeg,
  setDetails,
  clearDetails,
  makeDetailsPayloadFromHit,

  // templates
  buildInfoCardHTML,
  tooltipHTML,

  // controllers
  createTooltip,
  createModal,
  buildBestTodayPopover
};

/**
 * Prepare data for sky-card component
 * Returns: { iconHTML, title, note, raDecText, metaText }
 */
export function buildCardData(hit) {
  if (!hit) return null;
  
  const d = hit.data || {};
  
  // Determine icon (same logic as tooltip)
  let iconHTML = "";

  if (d.type === "sun") {
    iconHTML = '<img src="/sky/assets/images/Sun.png" alt="Sun">';
  } else if (d.type === "moon") {
    iconHTML = '<img src="/sky/assets/images/Moon.png" alt="Moon">';
  } else if (d.type === "planet" && d.name) {
    const planetName = d.name.charAt(0).toUpperCase() + d.name.slice(1).toLowerCase();
    iconHTML = `<img src="/sky/assets/images/${planetName}.png" alt="${planetName}">`;
  } else if (hit.kind === "alert") {
    // ── Alert group icons ────────────────────────────────────────────────────
    // sky/core/sky.ui.js → buildCardData → ALERT_GROUP_ICONS
    // Add / edit entries here to change the 32×32 icon in the sky-card header.
    // Key = d.group (lowercase).  Groups not listed fall back to the 💥 emoji.
    const ALERT_GROUP_ICONS = {
      neo:       "/sky/assets/images/Asteroid.png",
      neocp:     "/sky/assets/images/Asteroid.png",
      grb:       "/sky/assets/images/Quasar.png",
      transient: "/sky/assets/images/Transient.png",
      pha:       "/sky/assets/images/Asteroid.png",
      gcn:       "/sky/assets/images/Gravity.png",
    };
    const _grp = String(d.group || "").toLowerCase();
    const _src = ALERT_GROUP_ICONS[_grp];
    iconHTML = _src
      ? `<img src="${_src}" alt="${_grp}" width="32" height="32">`
      : `<span>💥</span>`;
  } else {
    let emoji = "⭐";
    if (hit.kind === "object" || d.type === "dso") emoji = "🌀";
    else if (hit.kind === "star") emoji = "⭐";
    else emoji = "🔵";
    iconHTML = `<span>${emoji}</span>`;
  }
  
  // Build title, note, coords, meta (same logic as tooltip)
  let title = "—";
  let note = "";
  const raDec = [];
  const metaParts = [];
  
  const fmtRA = (ra) => {
    const v = Number(ra);
    if (!Number.isFinite(v)) return null;
    const totalSec = (v / 15) * 3600;
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hh)}h${pad(mm)}m`;
  };
  
  const fmtDEC = (dec) => {
    const v = Number(dec);
    if (!Number.isFinite(v)) return null;
    const sign = v >= 0 ? "+" : "−";
    const a = Math.abs(v);
    const dd = Math.floor(a);
    const mm = Math.floor((a - dd) * 60);
    const pad = (n) => String(n).padStart(2, "0");
    return `${sign}${dd}°${pad(mm)}′`;
  };
  
  const fmtMag = (mag, decimals = 1) => {
    const v = Number(mag);
    if (!Number.isFinite(v)) return "—";
    return v.toFixed(decimals);
  };
  
  const fmtDeg = (deg, decimals = 0) => {
    const v = Number(deg);
    if (!Number.isFinite(v)) return "—";
    return v.toFixed(decimals) + "°";
  };

  // Never-rises display string (passed via hit.neverRisesLat from the observer context)
  const _nrl = hit.neverRisesLat != null ? Number(hit.neverRisesLat) : null;
  const _nrlStr = Number.isFinite(_nrl)
    ? `Never rises at this latitude (${Math.abs(_nrl).toFixed(2)}°${_nrl >= 0 ? "N" : "S"})`
    : null;

  if (hit.kind === "alert") {
    title = d.title || d.meta?.title || d.id || "Alert";
    // For GCN: prepend ui_type to the note line in the card header so the type
    // is always visible without opening a tab (e.g. "GW alert · H1,L1 · FAR 9e-14")
    const _gcnUiType = String(d.group || "").toLowerCase() === "gcn"
      ? (d.ui_type || d.meta?.ui_type || "")
      : "";
    const _rawNote = d.note || "";
    note = _gcnUiType
      ? (_rawNote ? `${_gcnUiType} · ${_rawNote}` : _gcnUiType)
      : _rawNote;
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);
    if (d.mag != null) metaParts.push(`Mag ${fmtMag(d.mag, 1)}`);
    if (d.altDeg != null) metaParts.push(`Alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`Az ${fmtDeg(d.azDeg, 0)}`);
  } else if (hit.kind === "object") {
    // (alert tab data built below)
    title = d.name || "Object";
    note = d.note || "";
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);
    if (d.type && d.type !== "planet" && d.type !== "sun" && d.type !== "moon") metaParts.push(d.type);
    if (d.mag != null) metaParts.push(`Mag ${fmtMag(d.mag, 1)}`);
    if (d.altDeg != null) metaParts.push(`Alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`Az ${fmtDeg(d.azDeg, 0)}`);
    if (d.constellation) metaParts.push(d.constellation);
    if (_nrlStr) metaParts.push(_nrlStr);
  } else {
    // STAR — title priority: "Name · α Con" > "α Con" > "HIP N" > "Star"
    // Never show a bare numeric ID.
    const proper = (d.name || "").trim();
    const bayer  = normalizeDesignation(d.designation || "");
    const hipLabel = Number.isFinite(Number(d.hip)) ? `HIP ${d.hip}`
                   : Number.isFinite(Number(d.id))  ? `HIP ${d.id}`
                   : null;
    title = (proper && bayer) ? `${proper} · ${bayer}`
          : proper || bayer || hipLabel || "Star";
    note = "";
    if (d.ra_deg != null) raDec.push(`RA ${fmtRA(d.ra_deg) || d.ra_deg.toFixed(2)}`);
    if (d.dec_deg != null) raDec.push(`DEC ${fmtDEC(d.dec_deg) || d.dec_deg.toFixed(2)}`);
    if (d.mag != null) metaParts.push(`Mag ${fmtMag(d.mag, 2)}`);
    if (d.altDeg != null) metaParts.push(`Alt ${fmtDeg(d.altDeg, 0)}`);
    if (d.azDeg != null) metaParts.push(`Az ${fmtDeg(d.azDeg, 0)}`);
    if (d.constellation) metaParts.push(d.constellation);
  }
  
  // ── Alert tab data (kind === "alert") ──────────────────────────────────────
  let alertTabs = null;
  if (hit.kind === "alert") {
    const meta   = d.meta   || {};
    const ssum   = meta.sentry_summary        || {};
    const srawS  = meta.sentry_object_raw?.summary || {};
    const group  = String(d.group || "").toLowerCase();
    const isRisk = group === "risk";

    // ── helpers ──
    const fmtIso = (iso) => {
      if (!iso) return null;
      return String(iso).replace("T", " ").replace(/\.\d+Z?$/, "").replace("Z", "") + " UTC";
    };
    const fmtN   = (v, dec = 2) => Number.isFinite(Number(v)) ? Number(v).toFixed(dec) : null;
    const fmtSci = (v) => (v != null && Number.isFinite(Number(v))) ? Number(v).toExponential(2) : null;
    const str    = (v) => (v != null && v !== "") ? String(v) : null;
    // row item: [label, value] — null values are filtered out by the card renderer
    const row    = (label, value, opts) => (value != null && value !== "") ? [label, value, opts] : null;

    alertTabs = [];

    // ── SUMMARY ──
    const _isGcnEarly = group === "gcn";
    const sumRows = isRisk ? [
      row("Note",               str(d.note)),
      row("Impact Probability", meta.ip != null ? Number(meta.ip).toExponential(2) : null),
      row("Palermo Scale",      fmtN(meta.ps || ssum.ps_max, 2)),
      row("Torino Scale",       str(meta.ts ?? ssum.ts_max ?? 0)),
      row("Monitoring Status",  meta.sentry_object_ok ? "Active" : "Inactive"),
      row("Last Observation",   str(ssum.last_obs || srawS.last_obs)),
      row("Diameter",           ssum.diameter ? `${ssum.diameter} km` : null),
      row("Impact Range",       str(ssum.range)),
      row("N Scenarios",        ssum.n_imp != null ? String(ssum.n_imp) : null),
      row("Ingested",           fmtIso(d.ingested_utc)),
    ] : _isGcnEarly ? [
      // GCN-specific summary: event type + human description + timing
      row("Event Type",   str(d.ui_type || meta.ui_type)),
      row("Description",  str(meta.ui_type_html || meta.ui_type_hint), { html: true, wrap: true }),
      row("Note",         str(d.note)),
      row("Topic",        str(meta.topic), { mono: true }),
      row("Event Time",   fmtIso((meta.gw || {}).event_time_utc || d.updated_utc)),
      row("Ingested",     fmtIso(d.ingested_utc)),
      row("Coordinates",  fmtRA(d.ra_deg) && fmtDEC(d.dec_deg)
                            ? `RA ${fmtRA(d.ra_deg)}  DEC ${fmtDEC(d.dec_deg)}` : null),
    ] : [
      row("Event Time",   fmtIso(meta.t_utc_iso || meta.t_utc || d.updated_utc)),
      row("Ingested",     fmtIso(d.ingested_utc)),
      row("Note",         str(d.note)),
      row("Coordinates",  fmtRA(d.ra_deg) && fmtDEC(d.dec_deg)
                            ? `RA ${fmtRA(d.ra_deg)}  DEC ${fmtDEC(d.dec_deg)}` : null),
      row("Magnitude",    d.mag    != null ? fmtMag(d.mag, 1) : null),
      row("Altitude",     d.altDeg != null ? fmtDeg(d.altDeg, 0) : null),
      row("Azimuth",      d.azDeg  != null ? fmtDeg(d.azDeg,  0) : null),
      row("Distance",     meta.dist_au != null
                            ? `${Number(meta.dist_au).toFixed(5)} AU  /  ${Number(meta.dist_ld).toFixed(2)} LD`
                            : null),
      row("Close approach bucket", str(meta.bucket)),
      row("Discovery",    d.discovery
                            ? `${d.discovery.year}-${d.discovery.month}-${Math.floor(Number(d.discovery.day))}`
                            : null),
      row("Status",       str(meta.action)),
    ].filter(Boolean);
    if (_nrlStr) sumRows.push(["Visibility", _nrlStr]);
    alertTabs.push({ id: "summary", label: "Summary", rows: sumRows });

    // ── GCN DETAILS (gcn group only) ──────────────────────────────────────────
    if (_isGcnEarly) {
      const gw    = meta.gw    || {};
      const urls  = meta.urls  || {};

      // Classification breakdown: sort by probability desc
      const classMap = gw.classification || {};
      const classSorted = Object.entries(classMap)
        .filter(([, v]) => typeof v === "number" && v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `${k} ${(v * 100).toFixed(3)}%`)
        .join("  ·  ");

      const gcnRows = [
        row("Event Type",    str(d.ui_type || meta.ui_type)),
        row("Description",   str(meta.ui_type_html || meta.ui_type_hint), { html: true, wrap: true }),
        "GCN Stream",
        row("Topic",         str(meta.topic), { mono: true }),
        row("Kafka Offset",  meta.offset != null ? String(meta.offset) : null, { mono: true }),
        row("Event Time",    fmtIso(gw.event_time_utc || meta.t_utc_iso)),
        row("Created",       fmtIso(gw.time_created_utc)),
      ];

      // GW-specific fields (present only for igwn.gwalert)
      if (gw.superevent_id) {
        gcnRows.push("Gravitational Wave");
        gcnRows.push(row("Alert Type",    str(gw.alert_type)));
        gcnRows.push(row("Superevent",    str(gw.superevent_id), { mono: true }));
        gcnRows.push(row("Instruments",   Array.isArray(gw.instruments) ? gw.instruments.join(", ") : str(gw.instruments)));
        gcnRows.push(row("FAR",           fmtSci(gw.far) ? `${fmtSci(gw.far)} Hz` : null));
        gcnRows.push(row("Significant",   gw.significant != null ? (gw.significant ? "Yes" : "No") : null));
        gcnRows.push(row("Top Class",     str(gw.classification_top)));
        if (classSorted) gcnRows.push(row("Classification", classSorted, { wrap: true }));
        gcnRows.push(row("Pipeline",      str(gw.pipeline)));
        gcnRows.push(row("Search",        str(gw.search)));
        gcnRows.push(row("Group",         str(gw.group)));

        const props = gw.properties || {};
        if (Object.keys(props).length) {
          gcnRows.push("Source Properties");
          for (const [pk, pv] of Object.entries(props)) {
            gcnRows.push(row(pk, typeof pv === "number" ? pv.toFixed(3) : str(pv)));
          }
        }

        if (urls.gracedb) {
          gcnRows.push("Links");
          gcnRows.push(row("GraceDB", urls.gracedb, { link: true, linkText: "View in GraceDB ↗" }));
        }
      }

      alertTabs.push({ id: "gcn", label: "GCN Event", rows: gcnRows.filter(r => r !== null && r !== undefined) });
    }

    // ── ORBIT & PHYSICS (non-risk) / IMPACT SCENARIOS + ORBIT (risk) ──
    if (isRisk) {
      alertTabs.push({ id: "impact", label: "Impact Scenarios", rows: [
        row("N Scenarios",   ssum.n_imp != null ? String(ssum.n_imp) : null),
        row("Impact Range",  str(ssum.range)),
        row("Best V_imp",    meta.sentry_object_raw?.summary?.v_imp
                               ? `${Number(meta.sentry_object_raw.summary.v_imp).toFixed(2)} km/s` : null),
        row("V_inf",         ssum.v_inf ? `${Number(ssum.v_inf).toFixed(2)} km/s` : null),
        row("ps_cum",        fmtN(ssum.ps_cum, 2)),
      ].filter(Boolean) });
      alertTabs.push({ id: "orbit", label: "Orbit", rows: [
        row("H (abs mag)",   fmtN(meta.sb_h || ssum.h, 2)),
        row("Diameter",      ssum.diameter ? `${ssum.diameter} km` : null),
        row("V_inf",         ssum.v_inf ? `${Number(ssum.v_inf).toFixed(2)} km/s` : null),
      ].filter(Boolean) });
    } else if (!_isGcnEarly) {
      const orbitRows = [
        row("Distance",     meta.dist_au != null
                              ? `${Number(meta.dist_au).toFixed(5)} AU` : null),
        row("Distance LD",  meta.dist_ld != null
                              ? `${Number(meta.dist_ld).toFixed(3)} LD` : null),
        row("V_rel",        meta.v_rel_km_s != null
                              ? `${Number(meta.v_rel_km_s).toFixed(2)} km/s` : null),
        row("H (abs mag)",  fmtN(meta.h_cad || ssum.h, 1)),
        row("Diameter_est", ssum.diameter ? `${ssum.diameter} km` : null),
      ].filter(Boolean);
      if (orbitRows.length) alertTabs.push({ id: "orbit", label: "Orbit & Physics", rows: orbitRows });
    }

    // ── SCORING — bar-chart data + text rows ──
    // Each bar: { label, norm (0-1 fill), display (string), breakdown? }
    // Threat colour: norm=0 → blue (safe), norm=1 → orange-red (dangerous)
    const scoreChart = [];
    const _addBar = (label, rawVal, max, min, fmtFn) => {
      const v = Number(rawVal);
      if (!Number.isFinite(v)) return;
      const norm = max === min ? 0 : Math.max(0, Math.min(1, (v - min) / (max - min)));
      scoreChart.push({ label, norm, display: fmtFn ? fmtFn(v) : v.toFixed(3) });
    };

    const _sc      = meta.scoring  || null;
    const _glob    = _sc?.global   || null;
    const _ext     = _sc?.external || null;
    const _hazard  = _sc?.hazard   || null;
    const _urgency = _sc?.urgency  || null;

    // 1. Global Score — uses meta.scoring.global value (same as external_v1);
    //    the external model's feature breakdown is attached so the user can
    //    expand it without a separate redundant "External" bar.
    const _globalNorm = _glob?.score_norm ?? d.score_norm;
    if (_globalNorm != null) {
      _addBar("Global Score", _globalNorm, 1, 0, v => v.toFixed(3));
      if (_ext?.features) {
        scoreChart[scoreChart.length - 1].breakdown = {
          model:    _ext.model   || "external_v1",
          features: _ext.features,
          weights:  _ext.weights || {},
        };
      }
    }

    // 3. Hazard model bar + breakdown (components × weights)
    // Hazard is only meaningful for orbital objects (NEO/PHA/risk).
    // GCN, GRB and transient events have no orbital hazard context.
    const _noHazard = ['gcn', 'grb', 'transient'].includes(group);
    if (!_noHazard && _hazard?.score_norm != null) {
      _addBar("Hazard", _hazard.score_norm, 1, 0, v => v.toFixed(3));
      if (_hazard.components && Object.keys(_hazard.components).length > 0) {
        scoreChart[scoreChart.length - 1].breakdown = {
          model:    _hazard.model  || "hazard_v1",
          features: _hazard.components,
          weights:  _hazard.weights || {},
        };
      }
    }

    // 4. Urgency model bar + breakdown (components × weights)
    if (_urgency?.score_norm != null) {
      _addBar("Urgency", _urgency.score_norm, 1, 0, v => v.toFixed(3));
      if (_urgency.components && Object.keys(_urgency.components).length > 0) {
        scoreChart[scoreChart.length - 1].breakdown = {
          model:    _urgency.model  || "urgency_v1",
          features: _urgency.components,
          weights:  _urgency.weights || {},
        };
      }
    }

    // 5. Legacy: Torino / Palermo bars (risk group raw data)
    const _tsVal = parseFloat(ssum.ts_max ?? meta.ts ?? '');
    if (Number.isFinite(_tsVal) && _tsVal > 0)
      _addBar("Torino Scale",  _tsVal,  10, 0, v => `${v} / 10`);
    const _psMax = parseFloat(ssum.ps_max ?? meta.ps ?? '');
    if (Number.isFinite(_psMax))
      _addBar("Palermo (max)", _psMax,   2, -8, v => v.toFixed(2));
    const _psCum = parseFloat(ssum.ps_cum ?? '');
    if (Number.isFinite(_psCum) && ssum.ps_cum !== undefined)
      _addBar("Palermo (cum)", _psCum,   2, -8, v => v.toFixed(2));

    alertTabs.push({ id: "scoring", label: "Scoring", scoreChart, rows: [] });

    // ── PROVENANCE ──
    const _provRows = [
      row("Source",        str(d.source)),
      row("CAD (10 LD)",   str(meta.cad_url_10ld),  { link: true, linkText: "JPL CAD 10LD" }),
      row("CAD (PHA)",     str(meta.cad_url_pha),    { link: true, linkText: "JPL CAD PHA"  }),
    ];
    if (_isGcnEarly) {
      const _gwUrls = (meta.urls || {});
      if (_gwUrls.gracedb) _provRows.push(row("GraceDB", _gwUrls.gracedb, { link: true, linkText: "GraceDB ↗" }));
      _provRows.push(row("Kafka Topic", str(meta.topic), { mono: true }));
      _provRows.push(row("Offset",      meta.offset != null ? String(meta.offset) : null, { mono: true }));
    }
    alertTabs.push({ id: "provenance", label: "Provenance", rows: _provRows.filter(Boolean) });

    // ── RAW JSON ──
    alertTabs.push({ id: "raw", label: "Raw JSON", json: JSON.stringify(d, null, 2) });
  }

  return {
    iconHTML,
    title,
    note,
    raDecText: raDec.join(" · "),
    metaText:  metaParts.join(" · "),
    // alert-specific extras
    kind:       hit.kind,
    group:      String((hit.data || {}).group || "").toLowerCase(),
    score:      hit.kind === "alert" && hit.data?.score_norm != null
                  ? Number(hit.data.score_norm).toFixed(2) : null,
    alertTabs,
  };
}