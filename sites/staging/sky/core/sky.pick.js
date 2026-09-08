// sites/staging/sky/core/sky.pick.js

function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }
  
  function findNearest(cssX, cssY, items, maxRpx) {
    if (!items || !items.length) return null;
    const maxR2 = maxRpx * maxRpx;
    let best = null;
    let bestD2 = maxR2;
  
    for (const it of items) {
      if (!it || typeof it.x !== "number" || typeof it.y !== "number") continue;
      const d2 = dist2(cssX, cssY, it.x, it.y);
      if (d2 <= bestD2) {
        bestD2 = d2;
        best = it;
      }
    }
    return best;
  }
  
  function pickAt(canvasCssX, canvasCssY, prepared, options) {
    const opts = options || {};
    const alertsPrepared = prepared.alertsPrepared || [];
    const objectsPrepared = prepared.objectsPrepared || [];
    const starsPrepared = prepared.starsPrepared || [];
  
    // priority: alerts -> objects -> stars
    if (opts.showAlerts) {
      const a = findNearest(canvasCssX, canvasCssY, alertsPrepared, 11);
      if (a) return { kind: "alert", data: a };
    }
  
    if (opts.showObjects) {
      const o = findNearest(canvasCssX, canvasCssY, objectsPrepared, 11);
      if (o) return { kind: "object", data: o };
    }
  
    const s = findNearest(canvasCssX, canvasCssY, starsPrepared, 8);
    if (s) return { kind: "star", data: s };
  
    return null;
  }
  
  function rebindById(kind, id, prepared) {
    if (!kind || !id) return null;
  
    const alertsPrepared = prepared.alertsPrepared || [];
    const objectsPrepared = prepared.objectsPrepared || [];
    const starsPrepared = prepared.starsPrepared || [];
  
    if (kind === "object") {
      const o = objectsPrepared.find(x => (x.id === id) || (x.name === id));
      return o ? { kind: "object", data: o, _pinText: "" } : null;
    }
  
    if (kind === "alert") {
      const a = alertsPrepared.find(x => (x.id === id) || (x.title === id));
      return a ? { kind: "alert", data: a, _pinText: "" } : null;
    }
  
    if (kind === "star") {
      const s = starsPrepared.find(x => (x.id === id) || (x.name === id));
      return s ? { kind: "star", data: s, _pinText: "" } : null;
    }
  
    return null;
  }
  
  function makePinText(hit, fmtDeg) {
    if (!hit) return "";
    const d = hit.data;
  
    if (hit.kind === "alert") return `PIN: ${d.title || "Alert"} (alt ${fmtDeg(d.altDeg)})`;
    if (hit.kind === "object") return `PIN: ${d.name || "Object"} (alt ${fmtDeg(d.altDeg)})`;
    return `PIN: ${d.name || d.id || "Star"} (mag ${d.mag ?? "—"})`;
  }
  
  export const Pick = {
    findNearest,
    pickAt,
    rebindById,
    makePinText
  };