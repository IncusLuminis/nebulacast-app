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
  const d = hit.data;

  if (hit.kind === "alert") {
    const lvl = (d.level || "amateur").toLowerCase();
    return `
      <div style="font-weight:650; margin-bottom:4px;">${d.title || "Alert"}</div>
      <div style="opacity:.85;">${lvl} • severity ${d.severity ?? "?"}</div>
      <div style="opacity:.70; margin-top:4px;">alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}</div>
    `;
  }

  if (hit.kind === "object") {
    const mag = (typeof d.mag === "number") ? d.mag.toFixed(1) : "—";
    return `
      <div style="font-weight:650; margin-bottom:4px;">${d.name || "Object"}</div>
      <div style="opacity:.85;">${d.type || "obj"} • mag ${mag}</div>
      <div style="opacity:.70; margin-top:4px;">alt ${fmtDeg(d.altDeg)}${d.azDeg != null ? " • az " + fmtDeg(d.azDeg) : ""}</div>
    `;
  }

  const mag = (typeof d.mag === "number") ? d.mag.toFixed(2) : "—";
  return `
    <div style="font-weight:650; margin-bottom:4px;">${d.name || d.id || "Star"}</div>
    <div style="opacity:.85;">mag ${mag}</div>
    <div style="opacity:.70; margin-top:4px;">alt ${fmtDeg(d.altDeg)} • az ${fmtDeg(d.azDeg)}</div>
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