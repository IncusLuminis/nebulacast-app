// sites/staging/sky/core/sky.ui.js

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function fmtDeg(x) {
  if (typeof x !== "number" || !isFinite(x)) return "—";
  return x.toFixed(1) + "°";
}

function setDetails(payload) {
  try {
    if (window.SKY_UI && typeof window.SKY_UI.setDetails === "function") {
      window.SKY_UI.setDetails(payload);
    }
  } catch (_) {}
}

function normalizeDesignation(des) {
  const s0 = String(des ?? "").trim();
  if (!s0) return "";

  // если уже есть греческая буква — оставляем как есть
  if (/[αβγδεζηθικλμνξοπρστυφχψω]/.test(s0)) return s0;

  // Stellarium/HYG часто дают Alp/Bet/Gam..., иногда Alpha/Beta...
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

  // "Alp Gem" / "Alpha Lyr" / "Bet 1 Sco" — меняем только лидирующее слово
  const parts = s0.split(/\s+/);
  const head = parts[0];
  const greek = map3[head] || mapFull[head];
  if (!greek) return s0;

  return [greek, ...parts.slice(1)].join(" ");
}


function clearDetails() { setDetails(null); }

function makeDetailsPayloadFromHit(hit) {
  if (!hit) return null;
  const d = hit.data;

  if (hit.kind === "alert") {
    return {
      type: "Alert",
      name: d.title || "Alert",
      alt: fmtDeg(d.altDeg),
      az: (d.azDeg != null ? fmtDeg(d.azDeg) : "—"),
      info: `${(d.level || "amateur")} • severity ${d.severity ?? "?"}${d.kind ? " • " + d.kind : ""}`
    };
  }

  if (hit.kind === "object") {
    const mag = (typeof d.mag === "number") ? (" • mag " + d.mag.toFixed(1)) : "";
    return {
      type: "Object",
      name: d.name || "Object",
      alt: fmtDeg(d.altDeg),
      az: (d.azDeg != null ? fmtDeg(d.azDeg) : "—"),
      info: `${d.type || "obj"}${mag}`
    };
  }

  // star
  return {
    type: "Star",
    name: d.name || d.id || "Star",
    alt: fmtDeg(d.altDeg),
    az: fmtDeg(d.azDeg),
    info: (typeof d.mag === "number") ? ("mag " + d.mag.toFixed(2)) : "—"
  };
}

function tooltipHTML(hit) {
  const d = hit.data || {};

  const mag2 = (typeof d.mag === "number" && isFinite(d.mag)) ? d.mag.toFixed(2) : "—";
  const mag1 = (typeof d.mag === "number" && isFinite(d.mag)) ? d.mag.toFixed(1) : "—";

  // helpers
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === '"' ? "&quot;" : "&#39;"
  ));

  if (hit.kind === "alert") {
    const lvl = (d.level || "amateur").toLowerCase();
    return `
      <div class="sky-tip-title">${esc(d.title || "Alert")}</div>
      <div class="sky-tip-sub">${esc(lvl)} • severity ${esc(d.severity ?? "?")}</div>
      <div class="sky-tip-meta">alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}</div>
    `;
  }

  if (hit.kind === "object") {
    const title =
      (d.name && d.name.trim()) ? d.name.trim()
      : (d.designation && d.designation.trim()) ? d.designation.trim()
      : "Object";
  
    const subParts = [];
    subParts.push(d.type || "obj");
    subParts.push(`mag ${mag1}`);
  
    return `
      <div class="sky-tip-title">${esc(title)}</div>
      <div class="sky-tip-sub">${esc(subParts.join(" • "))}</div>
      <div class="sky-tip-meta">alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}</div>
    `;
  }

    // star
    const name = (d.name && d.name.trim()) ? d.name.trim() : "";
    const desRaw = (d.designation && d.designation.trim()) ? d.designation.trim() : "";
    const des = normalizeDesignation(desRaw);

    const title =
      name ? name
      : des ? des
      : "Star";

    // Строки (как ты просишь):
    // 1) title
    // 2) designation (если title=name и designation есть)
    // 3) mag
    // 4) HIP (если есть) — тоже отдельной строкой, чтобы не мешалось
    const lines = [];

    if (name && des) lines.push(des);           // отдельная строка
    lines.push(`mag ${mag2}`);                  // отдельная строка
    if (d.hip != null) lines.push(`HIP ${d.hip}`);

    return `
      <div class="sky-tip-title">${esc(title)}</div>
      <div class="sky-tip-sub">${esc(lines.join("\n"))}</div>
      <div class="sky-tip-meta">alt ${fmtDeg(d.altDeg)} • az ${fmtDeg(d.azDeg)}</div>
    `;
    
}

// Tooltip controller bound to the widget root
function createTooltip(rootEl, tooltipEl) {
  // minimal local styling (can be moved to CSS later)
  tooltipEl.style.position = "absolute";
  tooltipEl.style.display = "none";
  tooltipEl.style.zIndex = "5";
  tooltipEl.style.maxWidth = "260px";
  tooltipEl.style.padding = "8px 10px";
  tooltipEl.style.borderRadius = "10px";
  tooltipEl.style.background = "rgba(0,0,0,0.55)";
  tooltipEl.style.border = "1px solid rgba(255,255,255,0.14)";
  tooltipEl.style.color = "rgba(255,255,255,0.86)";
  tooltipEl.style.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  tooltipEl.style.pointerEvents = "none";
  tooltipEl.style.backdropFilter = "blur(6px)";

  function hide() { tooltipEl.style.display = "none"; }

  // IMPORTANT: x/y are CSS px relative to rootEl (not canvas)
  function show(rootX, rootY, html) {
    tooltipEl.innerHTML = html;
    tooltipEl.style.display = "block";

    const tw = tooltipEl.offsetWidth || 240;
    const th = tooltipEl.offsetHeight || 80;

    const rootRect = rootEl.getBoundingClientRect();
    const margin = 10;

    let x = rootX + 14;
    let y = rootY + 14;

    const maxX = rootRect.width - margin - tw;
    const maxY = rootRect.height - margin - th;

    x = clamp(x, margin, Math.max(margin, maxX));
    y = clamp(y, margin, Math.max(margin, maxY));

    tooltipEl.style.left = Math.round(x) + "px";
    tooltipEl.style.top = Math.round(y) + "px";
  }

  return { show, hide };
}

export const SkyUI = {
  fmtDeg,
  setDetails,
  clearDetails,
  makeDetailsPayloadFromHit,
  tooltipHTML,
  createTooltip
};