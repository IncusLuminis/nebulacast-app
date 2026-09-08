// core/sky.render.js
import { UI } from "./sky.constants.js";

import { moonLimbRotation } from "./moon.orientation.mjs";

/* -----------------------------
   Label queue + simple collision resolver + DEDUP KEYS
   - All labels are queued during layer draw.
   - One flush at end draws labels with priorities and avoids overlaps.
   - Optional dedupKey keeps only one label per key (use for planets).
----------------------------- */

// -----------------------------
// Label helpers (MISSING IN YOUR FILE -> REQUIRED)
// -----------------------------
function _ensureLabelState(ctx) {
  if (!ctx.__skyLabels) {
    ctx.__skyLabels = { queue: [], placed: [], dedup: new Map() };
  }
  if (!Array.isArray(ctx.__skyLabels.queue)) ctx.__skyLabels.queue = [];
  if (!Array.isArray(ctx.__skyLabels.placed)) ctx.__skyLabels.placed = [];
  if (!(ctx.__skyLabels.dedup instanceof Map)) ctx.__skyLabels.dedup = new Map();
  return ctx.__skyLabels;
}

function _resetLabelState(ctx) {
  ctx.__skyLabels = { queue: [], placed: [], dedup: new Map() };
}

function _parseFontPx(font) {
  const m = String(font || "").match(/(\d+(?:\.\d+)?)px/);
  return m ? Number(m[1]) : 13;
}

function _measureLabel(ctx, text, font) {
  const prev = ctx.font;
  ctx.font = font;
  const w = ctx.measureText(text).width || 0;
  ctx.font = prev;

  const h = _parseFontPx(font) * 1.15;
  return { w, h };
}

function _rectsIntersect(a, b) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

function _isInsideDisk(vp, r) {
  const cx = (r.x1 + r.x2) * 0.5;
  const cy = (r.y1 + r.y2) * 0.5;
  const dx = cx - vp.cx;
  const dy = cy - vp.cy;
  const rr = Math.sqrt(dx * dx + dy * dy);
  return rr <= (vp.R - 6);
}

// -----------------------------
// Label queue
// -----------------------------
function enqueueLabel(ctx, vp, spec) {
  const st = _ensureLabelState(ctx);

  const text = String(spec.text || "").trim();
  if (!text) return;

  const x = Number(spec.x);
  const y = Number(spec.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const item = {
    text,
    x,
    y,
    font: spec.font || "13px system-ui, -apple-system, Segoe UI, Roboto, Arial",
    align: spec.align || "left",
    baseline: spec.baseline || "middle",
    dx: Number.isFinite(spec.dx) ? spec.dx : 0,
    dy: Number.isFinite(spec.dy) ? spec.dy : 0,
    fillStyle: spec.fillStyle || "rgba(230,240,255,0.72)",
    strokeStyle: spec.strokeStyle || "rgba(0,0,0,0.35)",
    strokeWidth: Number.isFinite(spec.strokeWidth) ? spec.strokeWidth : 3.5,
    priority: Number.isFinite(spec.priority) ? spec.priority : 200,
    dedupKey: (spec.dedupKey != null) ? String(spec.dedupKey) : null,
  };

  if (item.dedupKey) {
    const prevIdx = st.dedup.get(item.dedupKey);
    if (prevIdx == null) {
      const idx = st.queue.length;
      st.queue.push(item);
      st.dedup.set(item.dedupKey, idx);
    } else {
      const prev = st.queue[prevIdx];
      if (!prev) {
        st.queue[prevIdx] = item;
        st.dedup.set(item.dedupKey, prevIdx);
      } else {
        if (item.priority >= (prev.priority || 0)) {
          st.queue[prevIdx] = item;
        }
      }
    }
    return;
  }

  st.queue.push(item);
}

function flushLabels(ctx, vp) {
  const st = _ensureLabelState(ctx);
  if (!st.queue.length) return;

  const queue = st.queue.slice().sort((a, b) => (b.priority - a.priority));
  st.placed = [];

  const OFFS = [
    [0, 0],
    [0, -12],
    [0, 12],
    [10, -14],
    [10, 14],
    [16, 0],
    [16, -16],
    [16, 16],
    [-16, 0],
    [-16, -16],
    [-16, 16],
    [0, -22],
    [0, 22],
  ];

  ctx.save();
  ctx.setLineDash([]);

  for (const it of queue) {
    const { w, h } = _measureLabel(ctx, it.text, it.font);

    const rectFor = (x, y) => {
      let x1 = x;
      let y1 = y;

      if (it.align === "center") x1 = x - w * 0.5;
      else if (it.align === "right") x1 = x - w;

      if (it.baseline === "middle") y1 = y - h * 0.5;
      else if (it.baseline === "bottom" || it.baseline === "ideographic") y1 = y - h;

      const pad = 2.0;
      return { x1: x1 - pad, y1: y1 - pad, x2: x1 + w + pad, y2: y1 + h + pad };
    };

    const anchorX = it.x + it.dx;
    const anchorY = it.y + it.dy;

    let placed = null;

    for (const [ox, oy] of OFFS) {
      const cx = anchorX + ox;
      const cy = anchorY + oy;

      const r = rectFor(cx, cy);
      if (!_isInsideDisk(vp, r)) continue;

      let collide = false;
      for (const pr of st.placed) {
        if (_rectsIntersect(r, pr)) { collide = true; break; }
      }
      if (collide) continue;

      placed = { x: cx, y: cy, rect: r };
      break;
    }

    if (!placed) continue;

    ctx.font = it.font;
    ctx.textAlign = it.align;
    ctx.textBaseline = it.baseline;

    if (it.strokeWidth > 0) {
      ctx.lineWidth = it.strokeWidth;
      ctx.strokeStyle = it.strokeStyle;
      ctx.strokeText(it.text, placed.x, placed.y);
    }

    ctx.fillStyle = it.fillStyle;
    ctx.fillText(it.text, placed.x, placed.y);

    st.placed.push(placed.rect);
  }

  ctx.restore();

  st.queue.length = 0;
  st.dedup.clear();
}

function clear(ctx, vp) {
  ctx.clearRect(0, 0, vp.w, vp.h);
  _resetLabelState(ctx);
}

// --- дальше файл 1:1 как у тебя (без изменений) ---

function drawBackground(ctx, vp, atmosphereFactor = 0) {
  const f = Math.max(0, Math.min(1, atmosphereFactor));

  // 1) Fill entire canvas with dark colour (corners outside the sky circle)
  ctx.fillStyle = "rgba(5, 8, 18, 1)";
  ctx.fillRect(0, 0, vp.w, vp.h);

  // 2) Fill the sky circle only — interpolates night navy → day sky-blue
  const ci = (night, day) => Math.round(night + (day - night) * f);
  const inner = `rgba(${ci(10,115)}, ${ci(20,165)}, ${ci(45,235)}, 1)`;
  const outer  = `rgba(${ci(5,55)},  ${ci(8,120)},  ${ci(18,200)}, 1)`;
  const g = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, vp.R);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(vp.cx, vp.cy, vp.R, 0, Math.PI * 2);
  ctx.fill();
}

function drawHorizon(ctx, vp) {
  ctx.save();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(vp.cx, vp.cy, vp.R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(vp.cx, vp.cy, vp.R + 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(120,160,255,0.10)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawGridAz(ctx, vp) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1;

  const altCircles = [0, 30, 60];
  for (const alt of altCircles) {
    const z = (Math.PI / 2) - (alt * Math.PI / 180);
    const rr = vp.R * Math.tan(z / 2);
    ctx.beginPath();
    ctx.arc(vp.cx, vp.cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let az = 0; az < 360; az += 30) {
    const rad = (az * Math.PI) / 180;
    const x = vp.cx - vp.R * Math.sin(rad); // ✅ mirror
    const y = vp.cy - vp.R * Math.cos(rad);
    ctx.beginPath();
    ctx.moveTo(vp.cx, vp.cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  function labelAlt(alt) {
    const z = (Math.PI / 2) - (alt * Math.PI / 180);
    const rr = vp.R * Math.tan(z / 2);
    ctx.fillText(`${alt}°`, vp.cx + rr + 6, vp.cy);
  }
  labelAlt(30);
  labelAlt(60);

  ctx.restore();
}

function drawCardinals(ctx, vp) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const pad = 18;
  ctx.fillText("N", vp.cx, vp.cy - vp.R - pad);
  ctx.fillText("S", vp.cx, vp.cy + vp.R + pad);

  // ✅ After mirroring projection: W is on the right, E is on the left
  ctx.fillText("W", vp.cx + vp.R + pad, vp.cy);
  ctx.fillText("E", vp.cx - vp.R - pad, vp.cy);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let az = 0; az < 360; az += 45) {
    const rad = (az * Math.PI) / 180;
    // ✅ mirror tick marks too
    const x1 = vp.cx - (vp.R - 6) * Math.sin(rad);
    const y1 = vp.cy - (vp.R - 6) * Math.cos(rad);
    const x2 = vp.cx - (vp.R + 2) * Math.sin(rad);
    const y2 = vp.cy - (vp.R + 2) * Math.cos(rad);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPolylineWithBreaks(ctx, pts) {
  ctx.beginPath();
  let penDown = false;
  for (const p of pts) {
    if (!p) { penDown = false; continue; }
    if (!penDown) { ctx.moveTo(p.x, p.y); penDown = true; }
    else { ctx.lineTo(p.x, p.y); }
  }
  ctx.stroke();
}

function drawMeridian(ctx, vp, meridianPts) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawPolylineWithBreaks(ctx, meridianPts);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawEquator(ctx, vp, equatorPts) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(140,200,255,0.22)";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawPolylineWithBreaks(ctx, equatorPts);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawEcliptic(ctx, vp, eclPts) {
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(255,210,140,0.24)";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawPolylineWithBreaks(ctx, eclPts);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawMilkyWay(ctx, vp, mw) {
  if (!mw) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "rgba(220,230,255,0.10)";
  ctx.lineWidth = 14;
  drawPolylineWithBreaks(ctx, mw.mid);

  ctx.strokeStyle = "rgba(220,230,255,0.11)";
  ctx.lineWidth = 6;
  drawPolylineWithBreaks(ctx, mw.top);
  drawPolylineWithBreaks(ctx, mw.bot);

  ctx.strokeStyle = "rgba(220,230,255,0.16)";
  ctx.lineWidth = 2;
  drawPolylineWithBreaks(ctx, mw.mid);

  ctx.restore();
}

function drawConstellations(ctx, vp, consPrepared) {
  if (!consPrepared) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(160,190,255,0.28)";
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const ln of consPrepared.lines || []) {
    ctx.beginPath();
    ctx.moveTo(ln.ax, ln.ay);
    ctx.lineTo(ln.bx, ln.by);
    ctx.stroke();
  }

  if (consPrepared.labels && consPrepared.labels.length) {
    for (const lab of consPrepared.labels) {
      enqueueLabel(ctx, vp, {
        text: lab.name,
        x: lab.x,
        y: lab.y,
        font: "13px system-ui, -apple-system, Segoe UI, Roboto, Arial",
        align: "center",
        baseline: "middle",
        fillStyle: "rgba(190,210,255,0.55)",
        strokeStyle: "rgba(0,0,0,0.28)",
        strokeWidth: 3.2,
        priority: 100,
      });
    }
  }

  ctx.restore();
}

// -----------------------
// Highlight helpers
// -----------------------
function _highlightAlphaNow() {
  const t = performance.now();
  const omega = 0.0052; // ~1.2s period
  const s = 0.5 + 0.5 * Math.sin(t * omega);
  return 0.10 + 0.80 * s;
}

function drawHighlightedObject(ctx, drawFn) {
  const alpha = _highlightAlphaNow();

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.shadowColor = "rgba(255,215,120,0.95)";
  ctx.shadowBlur = 28;
  drawFn();
  ctx.restore();

  return { alpha };
}

function drawObjects(ctx, vp, objectsPrepared) {
  if (!objectsPrepared || !objectsPrepared.length) return;

  // Tune here
  const OBJECTS_ALPHA = 0.55; // overall opacity for non-highlighted object markers
  const LABELS_ALPHA = 0.65;  // overall opacity for non-highlighted labels

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rPlanet = 4.2;
  const rDS = 4.0;

  // ✅ Fix: do not draw planet markers from Objects layer to avoid "oval" double-draw.
  // Planets still stay in objectsPrepared for search/recommendations/highlight.
  const HIDE_PLANET_MARKERS_IN_OBJECTS = true;

  for (const o of objectsPrepared) {
    if (!o) continue;

    const ox = Number(o.x);
    const oy = Number(o.y);
    if (!Number.isFinite(ox) || !Number.isFinite(oy)) continue;

    const isPlanet = (o.type === "planet");
    const highlighted =
      typeof window !== "undefined" &&
      window.__skyIsHighlighted &&
      window.__skyIsHighlighted(o);

    const r = isPlanet ? rPlanet : rDS;
    const rr = highlighted ? r * 1.8 : r;

    // -------------------------
    // Marker drawing
    // -------------------------
    if (isPlanet) {
      // ✅ Skip planet body marker from Objects layer to avoid mismatch with Planets layer.
      // We still allow highlight ring/crosshair later (below) so search/highlight remains visible.
      if (!HIDE_PLANET_MARKERS_IN_OBJECTS) {
        if (highlighted) {
          drawHighlightedObject(ctx, () => {
            ctx.beginPath();
            ctx.arc(ox, oy, rr, 0, Math.PI * 2);
            ctx.fillStyle = o.color || "rgba(255,230,180,0.95)";
            ctx.fill();
          });
        } else {
          // dim non-highlighted planet marker (if enabled)
          ctx.save();
          ctx.globalAlpha *= OBJECTS_ALPHA;

          ctx.beginPath();
          ctx.arc(ox, oy, r, 0, Math.PI * 2);
          ctx.fillStyle = o.color || "rgba(255,230,180,0.95)";
          ctx.fill();

          ctx.restore();
        }
      }
    } else {
      // DSO marker (diamond)
      ctx.save();
      if (!highlighted) ctx.globalAlpha *= OBJECTS_ALPHA;

      ctx.beginPath();
      ctx.moveTo(ox, oy - rr);
      ctx.lineTo(ox + rr, oy);
      ctx.lineTo(ox, oy + rr);
      ctx.lineTo(ox - rr, oy);
      ctx.closePath();

      ctx.strokeStyle = "rgba(210,230,255,0.65)";
      ctx.lineWidth = highlighted ? 2.4 : 1.4;
      ctx.stroke();

      ctx.fillStyle = "rgba(210,230,255,0.12)";
      ctx.fill();

      ctx.restore();
    }

    // -------------------------
    // Highlight overlay (keep for both DSOs and planets)
    // -------------------------
    if (highlighted) {
      const alpha = _highlightAlphaNow();

      ctx.save();
      ctx.globalAlpha *= alpha;

      ctx.beginPath();
      ctx.arc(ox, oy, rr + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,180,0.95)";
      ctx.lineWidth = 3.2;
      ctx.stroke();

      const gap = rr + 2;
      const len = rr + 18;

      ctx.beginPath();
      ctx.moveTo(ox - len, oy);
      ctx.lineTo(ox - gap, oy);
      ctx.moveTo(ox + gap, oy);
      ctx.lineTo(ox + len, oy);
      ctx.moveTo(ox, oy - len);
      ctx.lineTo(ox, oy - gap);
      ctx.moveTo(ox, oy + gap);
      ctx.lineTo(ox, oy + len);

      ctx.strokeStyle = "rgba(255,215,120,0.95)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.restore();
    }

    // -------------------------
    // Labels (keep; dedupKey already collapses planet duplicates)
    // -------------------------
    const showLabel =
      highlighted ||
      (typeof o.altDeg === "number" && o.altDeg >= UI.LABEL_ALT_MIN_DEG);

    if (showLabel && o.name) {
      const font = highlighted ? "bold 14px system-ui" : "13px system-ui";
      const baseFillStyle = highlighted
        ? "rgba(255,255,200,0.45)"
        : "rgba(230,240,255,0.35)";

      const dedupKey = isPlanet
        ? `planet:${o.name}`
        : (o.id != null ? `obj:${o.id}` : `obj:${o.name}`);

      // Dim non-highlighted labels via alpha (don’t rewrite colors everywhere)
      const labelAlpha = highlighted ? 1.0 : LABELS_ALPHA;

      enqueueLabel(ctx, vp, {
        text: o.name,
        x: ox,
        y: oy,
        dx: rr + 8,
        dy: 0,
        font,
        align: "left",
        baseline: "middle",
        fillStyle: baseFillStyle,
        fillAlpha: labelAlpha, // <-- requires support in enqueueLabel/flushLabels (see note below)
        strokeStyle: "rgba(0,0,0,0.45)",
        strokeWidth: 4,
        priority: highlighted ? 900 : 240,
        dedupKey,
      });
    }
  }

  ctx.restore();
}


/**
 * Draws a geometrically correct moon phase at the canvas origin (0, 0).
 * The lit limb is always on the RIGHT — caller applies ctx.rotate() first.
 * k = illumination fraction 0..1 (0 = new moon, 1 = full moon).
 *
 * Technique: the day/night terminator projects as a vertical ellipse whose
 * horizontal semi-axis is r·|1−2k|.  For a crescent (k < 0.5) we fill the
 * disk dark and overdraw a bright region bounded by the right disk-arc and
 * the right limb of that ellipse.  For a gibbous (k > 0.5) we do the
 * inverse: fill bright and overdraw a dark crescent on the left.
 */
function drawMoonPhaseShape(ctx, r, k, brightColor, shadowColor) {
  k = Math.max(0, Math.min(1, k));
  const sx = r * Math.abs(1 - 2 * k); // terminator ellipse horizontal semi-axis

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip(); // confine all drawing to the disk

  if (k < 0.5) {
    // ── Crescent: dark disk, bright sliver on the right ──────────────────
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);          // right arc CW
    ctx.ellipse(0, 0, sx, r, 0, Math.PI / 2, -Math.PI / 2, true); // right ellipse limb CCW
    ctx.closePath();
    ctx.fillStyle = brightColor;
    ctx.fill();
  } else {
    // ── Gibbous: bright disk, dark sliver on the left ────────────────────
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = brightColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);               // left arc CCW
    ctx.ellipse(0, 0, sx, r, 0, Math.PI / 2, 3 * Math.PI / 2, false); // left ellipse limb CW
    ctx.closePath();
    ctx.fillStyle = shadowColor;
    ctx.fill();
  }

  ctx.restore();
}

function drawSunMoon(ctx, vp, sunMoonPrepared) {
  if (!sunMoonPrepared || !sunMoonPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const LABEL_ALT_MIN_SM = 0;

  // Pre-locate the sun so the moon can be rotated to face it
  const sunObj = sunMoonPrepared.find(o => o && o.type === "sun" && o.x != null && o.y != null) || null;

  for (const o of sunMoonPrepared) {
    if (!o || o.x == null || o.y == null) continue;
    if (o.visible === false || (typeof o.altDeg === "number" && o.altDeg < 0)) continue;

    const isSun = (o.type === "sun");
    const isMoon = (o.type === "moon");

    if (isSun) {
      const r = (typeof o.r === "number") ? o.r : 6.0;

      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 7.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,220,140,0.12)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 3.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,235,170,0.16)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
      ctx.fillStyle = o.color || "rgba(255,235,185,0.95)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (isMoon) {
      const r = (typeof o.r === "number") ? o.r : 6.0;

      // Illumination fraction 0..1
      let k = null;
      if (typeof o.illum_pct === "number" && isFinite(o.illum_pct)) {
        k = Math.max(0, Math.min(1, o.illum_pct / 100));
      }
      if (k === null) k = 0.5;

      // Glow halos (same proportions as the Sun)
      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 7.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210,230,255,0.08)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 3.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,240,255,0.10)";
      ctx.fill();

      ctx.save();
      ctx.translate(o.x, o.y);

      if (sunObj) ctx.rotate(moonLimbRotation(o, sunObj));

      drawMoonPhaseShape(
        ctx, r, k,
        o.color || "rgba(220,235,255,0.88)",
        "rgba(15,20,40,0.90)"
      );

      ctx.restore();

      // Thin outline ring
      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (typeof o.altDeg === "number" && o.altDeg >= LABEL_ALT_MIN_SM && o.name) {
      const r = (typeof o.r === "number") ? o.r : 6.0;
      const labelOffsetX = r + 4;
      const x0 = o.x + labelOffsetX;
      const y0 = o.y;

      enqueueLabel(ctx, vp, {
        text: o.name,
        x: x0,
        y: y0,
        font: "13px system-ui, -apple-system, Segoe UI, Roboto, Arial",
        align: "left",
        baseline: "middle",
        fillStyle: isSun ? "rgba(255,245,220,0.78)" : "rgba(230,240,255,0.72)",
        strokeStyle: "rgba(0,0,0,0.35)",
        strokeWidth: 3.5,
        priority: 300,
      });

      if (isMoon) {
        let pct = null;
        if (typeof o.illum_pct === "number" && isFinite(o.illum_pct)) {
          pct = Math.max(0, Math.min(100, o.illum_pct));
        }

        if (pct != null) {
          const phaseText = `Illum. ${Math.round(pct)}%${o.waxing === false ? " · waning" : " · waxing"}`;
          enqueueLabel(ctx, vp, {
            text: phaseText,
            x: x0,
            y: y0 + 14,
            font: "12px system-ui, -apple-system, Segoe UI, Roboto, Arial",
            align: "left",
            baseline: "middle",
            fillStyle: "rgba(230,240,255,0.58)",
            strokeStyle: "rgba(0,0,0,0.32)",
            strokeWidth: 3.2,
            priority: 295,
            dedupKey: "moon_phase",
          });
        }
      }
    }
  }

  ctx.restore();
}

function drawPlanets(ctx, vp, planetsPrepared) {
  if (!planetsPrepared || !planetsPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rDefault = 4.2;

  for (const p of planetsPrepared) {
    if (!p || p.x == null || p.y == null) continue;
    if (p.visible === false || (typeof p.altDeg === "number" && p.altDeg < 0)) continue;

    const r = (typeof p.r === "number") ? p.r : rDefault;

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.color || "rgba(255,230,180,0.90)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();

    if (typeof p.altDeg === "number" && p.altDeg >= UI.LABEL_ALT_MIN_DEG && p.name) {
      enqueueLabel(ctx, vp, {
        text: p.name,
        x: p.x,
        y: p.y,
        dx: 8,
        dy: 0,
        font: "13px system-ui, -apple-system, Segoe UI, Roboto, Arial",
        align: "left",
        baseline: "middle",
        fillStyle: "rgba(230,240,255,0.72)",
        strokeStyle: "rgba(0,0,0,0.35)",
        strokeWidth: 3.5,
        priority: 260,
        dedupKey: `planet:${p.name}`,
      });
    }
  }

  ctx.restore();
}

function drawStars(ctx, vp, starsPrepared) {
  ctx.save();
  ctx.setLineDash([]);

  for (const s of starsPrepared || []) {
    if (!s || s.x == null || s.y == null || s.r == null) continue;

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

    if (s.mag <= 0.2) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + 2.0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180,200,255,0.08)";
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fill();
    }
  }

  ctx.restore();
}

// ADD near other layer functions (e.g. after drawObjects)

function drawMessier(ctx, vp, messierPrepared) {
  if (!messierPrepared || !messierPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // policy: show labels only for highlighted or bright ones
  const LABEL_ALT_MIN = UI.LABEL_ALT_MIN_DEG;
  const LABEL_MAG_MAX = 6.5;

  for (const m of messierPrepared) {
    if (!m) continue;
    if (m.visible === false) continue;

    const x = Number(m.x);
    const y = Number(m.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    const highlighted =
      typeof window !== "undefined" &&
      window.__skyIsHighlighted &&
      window.__skyIsHighlighted(m);

    const magVal = (typeof m.mag === "number" && Number.isFinite(m.mag)) ? m.mag : 9.5;

    // size + alpha by magnitude (roughly)
    const r = highlighted ? 5.0 : Math.max(2.4, Math.min(4.0, 4.2 - 0.18 * magVal));
    const a = highlighted ? 0.95 : Math.max(0.20, Math.min(0.65, 0.70 - 0.04 * magVal));

    // marker: small square + inner dot (distinct from generic DSO diamond)
    ctx.save();
    ctx.globalAlpha *= a;

    ctx.beginPath();
    ctx.rect(x - r, y - r, 2 * r, 2 * r);
    ctx.strokeStyle = "rgba(210,230,255,0.70)";
    ctx.lineWidth = highlighted ? 2.2 : 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.2, r * 0.35), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(210,230,255,0.22)";
    ctx.fill();

    ctx.restore();

    // highlight overlay (reuse same style as objects)
    if (highlighted) {
      const alpha = _highlightAlphaNow();

      ctx.save();
      ctx.globalAlpha *= alpha;

      ctx.beginPath();
      ctx.arc(x, y, r + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,180,0.95)";
      ctx.lineWidth = 3.0;
      ctx.stroke();

      ctx.restore();
    }

    // labels (very conservative)
    const altOk = (typeof m.altDeg === "number") ? (m.altDeg >= LABEL_ALT_MIN) : true;
    const magOk = (typeof m.mag === "number" && Number.isFinite(m.mag)) ? (m.mag <= LABEL_MAG_MAX) : false;
    const showLabel = highlighted || (altOk && magOk);

    if (showLabel && m.name) {
      const rawId = (m.id != null ? m.id : m.name);
      const normId = String(rawId || "").trim().toUpperCase();

      // IMPORTANT: use the same dedupKey namespace as Objects labels if you want cross-layer dedup.
      // In your drawObjects you use `obj:${o.id}` or `obj:${o.name}` — so we align with that.
      const dedupKey = normId ? `obj:${normId}` : `obj:${String(m.name).trim().toUpperCase()}`;

      enqueueLabel(ctx, vp, {
        text: m.name, // "M31"
        x,
        y,
        dx: r + 8,
        dy: 0,
        font: highlighted ? "bold 14px system-ui" : "12px system-ui",
        align: "left",
        baseline: "middle",
        fillStyle: highlighted ? "rgba(255,255,200,0.95)" : "rgba(230,240,255,0.60)",
        strokeStyle: "rgba(0,0,0,0.45)",
        strokeWidth: 4,
        priority: highlighted ? 880 : 180,
        dedupKey,
      });
    }
  }

  ctx.restore();
}

// --- add near other helpers (before drawAlerts) ---
function _alertStyle(a) {
  const g = String(a?.group || a?.source || "").toLowerCase();

  // defaults (fallback)
  let shape = "triangle";
  let stroke = "rgba(120,255,200,0.65)";
  let fill = "rgba(120,255,200,0.12)";
  let labelFill = "rgba(190,255,230,0.70)";

  if (g === "grb") {
    // GRB: "danger"/urgent
    shape = "cross";
    stroke = "rgba(255,140,140,0.78)";
    fill = "rgba(255,120,120,0.10)";
    labelFill = "rgba(255,190,190,0.82)";
  } else if (g === "neocp") {
    // NEOCP: "action" (follow-up)
    shape = "triangle";
    stroke = "rgba(120,255,200,0.68)";
    fill = "rgba(120,255,200,0.12)";
    labelFill = "rgba(190,255,230,0.70)";
  } else if (g === "transient" || g === "tocp") {
    // TOCP/Transient: distinct from NEOs
    shape = "diamond";
    stroke = "rgba(255,210,140,0.70)";
    fill = "rgba(255,210,140,0.12)";
    labelFill = "rgba(255,230,185,0.74)";
  }

  return { shape, stroke, fill, labelFill };
}


function drawAlerts(ctx, vp, alertsPrepared) {
  if (!alertsPrepared || !alertsPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const LABEL_ALT_MIN = UI.LABEL_ALT_MIN_DEG;

  // hard dedup per frame (independent from enqueueLabel internals)
  const seenLabelKeys = new Set();

  function roundN(x, n) {
    const p = Math.pow(10, n);
    return Math.round(x * p) / p;
  }

  for (const a of alertsPrepared) {
    if (!a || a.x == null || a.y == null) continue;

    const ax = Number(a.x);
    const ay = Number(a.y);
    if (!Number.isFinite(ax) || !Number.isFinite(ay)) continue;

    const sev = (typeof a.severity === "number" && isFinite(a.severity)) ? a.severity : 2;
    const s0 = 2.6 + sev; // base size
    const s = Math.max(3.6, Math.min(8.6, s0));

    const { shape, stroke, fill, labelFill } = _alertStyle(a);

    const highlighted =
      typeof window !== "undefined" &&
      window.__skyIsHighlighted &&
      window.__skyIsHighlighted(a);

    // marker
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.lineWidth = highlighted ? 2.4 : 1.6;

    if (shape === "cross") {
      ctx.beginPath();
      ctx.moveTo(ax - s, ay);
      ctx.lineTo(ax + s, ay);
      ctx.moveTo(ax, ay - s);
      ctx.lineTo(ax, ay + s);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ax, ay, s * 0.95, 0, Math.PI * 2);
      ctx.strokeStyle = stroke.replace(/0\.\d+\)$/, "0.30)");
      ctx.lineWidth = highlighted ? 2.0 : 1.3;
      ctx.stroke();
    } else if (shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(ax, ay - s);
      ctx.lineTo(ax + s, ay);
      ctx.lineTo(ax, ay + s);
      ctx.lineTo(ax - s, ay);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(ax, ay - s);
      ctx.lineTo(ax + s, ay + s);
      ctx.lineTo(ax - s, ay + s);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    ctx.restore();

    // highlight overlay
    if (highlighted) {
      const alpha = _highlightAlphaNow();

      ctx.save();
      ctx.globalAlpha *= alpha;

      ctx.beginPath();
      ctx.arc(ax, ay, s + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,180,0.95)";
      ctx.lineWidth = 3.0;
      ctx.stroke();

      ctx.restore();
    }

    // label
    const src = String(a.source || "").toLowerCase().trim();

    // normalize alert family so TOCP doesn't split into transient/tocp variants
    let fam = src;
    if (fam === "tocp" || String(a.group || "").toLowerCase().trim() === "transient") {
      fam = "tocp";
    } else if (!fam) {
      fam = "alerts";
    }
    
    const ra = (typeof a.ra_deg === "number" && Number.isFinite(a.ra_deg)) ? a.ra_deg : null;
    const dec = (typeof a.dec_deg === "number" && Number.isFinite(a.dec_deg)) ? a.dec_deg : null;
    
    let dedupKey = "";
    if (ra != null && dec != null) {
      const rra = roundN(ra, 6);
      const rdec = roundN(dec, 6);
      // IMPORTANT: do NOT include group; use normalized family/source
      dedupKey = `alert:${fam}:${rra}:${rdec}`;
    } else {
      dedupKey = `alert:${fam}:xy:${Math.round(ax)}:${Math.round(ay)}:${String(a.title).trim()}`;
    }
    
    if (seenLabelKeys.has(dedupKey)) continue;
    seenLabelKeys.add(dedupKey);

      enqueueLabel(ctx, vp, {
        text: a.title,
        x: ax,
        y: ay,
        dx: 9,
        dy: 0,
        font: highlighted ? "bold 12px system-ui, -apple-system, Segoe UI, Roboto, Arial"
                          : "12px system-ui, -apple-system, Segoe UI, Roboto, Arial",
        align: "left",
        baseline: "middle",
        fillStyle: highlighted ? "rgba(255,255,200,0.92)" : labelFill,
        strokeStyle: "rgba(0,0,0,0.35)",
        strokeWidth: 3.5,
        priority: highlighted ? 820 : (420 + sev * 10),
        dedupKey,
      });
    }


  ctx.restore();
}

function drawGridEq(ctx, vp, eqGrid) {
  if (!eqGrid) return;

  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = "rgba(7, 149, 54, 0.6)";
  ctx.lineWidth = 1;

  for (const ln of eqGrid.decLines || []) {
    ctx.beginPath();
    drawPolylineWithBreaks(ctx, ln.pts);
    ctx.stroke();
  }

  for (const ln of eqGrid.raLines || []) {
    ctx.beginPath();
    drawPolylineWithBreaks(ctx, ln.pts);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

function drawZenith(ctx, vp) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.beginPath();
  ctx.arc(vp.cx, vp.cy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.fillText("Z", vp.cx + 7, vp.cy);
  ctx.restore();
}

export const Render = {
  clear,
  drawBackground,
  drawHorizon,
  drawGridAz,
  drawCardinals,
  drawMeridian,
  drawEquator,
  drawEcliptic,
  drawMilkyWay,
  drawConstellations,
  drawObjects,
  drawSunMoon,
  drawStars,
  drawAlerts,
  drawGridEq,
  drawZenith,
  drawPlanets,
  flushLabels,
  drawMessier
};

export default Render;
