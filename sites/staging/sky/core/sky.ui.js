/* sky.ui.js
 * Tooltip + Modal UI helpers for sky widget.
 * UI (templates + styles + behavior) lives ONLY here.
 */

let __stylesInjected = false;

function injectStyles() {
  if (__stylesInjected) return;
  __stylesInjected = true;

  const css = `
  /* Root-scope classes to avoid collisions */
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
    font: 12px system-ui, -apple-system, Segoe UI, Roboto, Arial;
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
  .skyui-card__title {
    font-weight: 650;
    font-size: 12px;
    margin-bottom: 6px;
    color: rgba(255,255,255,0.94);
  }
  .skyui-card--modal .skyui-card__title {
    font-size: 14px;
  }
  .skyui-card__subtitle {
    opacity: 0.88;
    line-height: 1.25;
  }
  .skyui-card__meta {
    opacity: 0.70;
    margin-top: 6px;
  }
  .skyui-card__type {
    opacity: 0.65;
    margin-top: 6px;
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
    font: 13px system-ui, -apple-system, Segoe UI, Roboto, Arial;
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

    .skyui-card__note {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.12);
    opacity: 0.92;
    line-height: 1.25;
  }

  /* Best Today UI */
  .sky-best-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.86);
    cursor: pointer;
    user-select: none;
    font: 12px system-ui, -apple-system, Segoe UI, Roboto, Arial;
  }
  .sky-best-btn:hover { background: rgba(255,255,255,0.09); }

  .sky-best-popover {
    position: absolute;
    z-index: 30;
    right: 12px;
    bottom: 46px;
    width: min(420px, calc(100% - 24px));
    max-height: min(56vh, 420px);
    overflow: auto;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(0,0,0,0.70);
    backdrop-filter: blur(6px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    padding: 8px;
    display: none;
  }

  .sky-best-item {
    padding: 8px 10px;
    border-radius: 12px;
    cursor: pointer;
  }
  .sky-best-item:hover { background: rgba(255,255,255,0.06); }

  .sky-best-name {
    font-weight: 650;
    color: rgba(255,255,255,0.92);
    margin-bottom: 4px;
    font-size: 12px;
  }
  .sky-best-note {
    color: rgba(255,255,255,0.80);
    font-size: 12px;
    line-height: 1.25;
  }

    .skyui-card__note {
    margin-top: 8px;
    opacity: 0.92;
    line-height: 1.25;
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
  const noteLine = d.note
  ? `<div class="skyui-card__note">${esc(d.note)}</div>`
  : "";

  const typeLine = isModal
    ? `<div class="skyui-card__type">Type: ${esc(hit.kind || "—")}</div>`
    : "";


  let title = "—";
  let subtitle = "—";
  let meta = "";


  if (hit.kind === "alert") {
    title = d.title || "Alert";
    const lvl = (d.level || "amateur").toLowerCase();
    subtitle = `${lvl} • severity ${d.severity ?? "?"}${d.kind ? " • " + d.kind : ""}`;
    meta = `alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}`;

  } else if (hit.kind === "object") {
    title = d.name || "Object";

    const typeStr = d.type || "obj";
    const magStr = (typeof d.mag === "number" && isFinite(d.mag)) ? ` • mag ${fmtMag(d.mag, 1)}` : "";
    subtitle = `${typeStr}${magStr}`;

    meta = `alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}`;

  } else {
    // STAR
    const proper = (d.name || "").trim();
    const bayer = normalizeDesignation(d.designation || "");

    title = proper || bayer || d.id || "Star";

    if (proper && bayer) subtitle = `${esc(bayer)}<br/>mag ${fmtMag(d.mag, 2)}`;
    else subtitle = `mag ${fmtMag(d.mag, 2)}`;

    meta = `alt ${fmtDeg(d.altDeg)} • az ${fmtDeg(d.azDeg)}`;
  }

  return `
    <div class="skyui-card ${isModal ? "skyui-card--modal" : ""}">
      <div class="skyui-card__title">${esc(title)}</div>
      <div class="skyui-card__subtitle">${subtitle}</div>
      <div class="skyui-card__meta">${esc(meta)}</div>
      ${noteLine}
      ${typeLine}
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