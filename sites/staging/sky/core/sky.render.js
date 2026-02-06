// core/sky.render.js
import { UI } from "./sky.constants.js";

function clear(ctx, vp) {
  ctx.clearRect(0, 0, vp.w, vp.h);
}

function drawBackground(ctx, vp) {
  const g = ctx.createRadialGradient(vp.cx, vp.cy, 0, vp.cx, vp.cy, vp.R * 1.2);
  g.addColorStop(0, "rgba(10, 20, 45, 1)");
  g.addColorStop(1, "rgba(5, 8, 18, 1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vp.w, vp.h);
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
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;

  // altitude circles (stereographic): 0/30/60
  const altCircles = [0, 30, 60];
  for (const alt of altCircles) {
    const z = (Math.PI / 2) - (alt * Math.PI / 180);
    const rr = vp.R * Math.tan(z / 2);
    ctx.beginPath();
    ctx.arc(vp.cx, vp.cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // az rays
  for (let az = 0; az < 360; az += 30) {
    const rad = (az * Math.PI) / 180;
    const x = vp.cx + vp.R * Math.sin(rad);
    const y = vp.cy - vp.R * Math.cos(rad);
    ctx.beginPath();
    ctx.moveTo(vp.cx, vp.cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // labels
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
  ctx.fillText("E", vp.cx + vp.R + pad, vp.cy);
  ctx.fillText("W", vp.cx - vp.R - pad, vp.cy);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let az = 0; az < 360; az += 45) {
    const rad = (az * Math.PI) / 180;
    const x1 = vp.cx + (vp.R - 6) * Math.sin(rad);
    const y1 = vp.cy - (vp.R - 6) * Math.cos(rad);
    const x2 = vp.cx + (vp.R + 2) * Math.sin(rad);
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
  ctx.setLineDash([]); // solid
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
  ctx.setLineDash([6, 6]); // dashed
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
    ctx.fillStyle = "rgba(190,210,255,0.55)";
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of consPrepared.labels) ctx.fillText(lab.name, lab.x, lab.y);
  }

  ctx.restore();
}

function drawObjects(ctx, vp, objectsPrepared) {
  if (!objectsPrepared || !objectsPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const rPlanet = 4.2;
  const rDS = 4.0;

  for (const o of objectsPrepared) {
    const isPlanet = (o.type === "planet");

    if (isPlanet) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, rPlanet, 0, Math.PI * 2);
      ctx.fillStyle = o.color || "rgba(255,230,180,0.90)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(o.x, o.y, rPlanet + 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
    } else {
      const r = rDS;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - r);
      ctx.lineTo(o.x + r, o.y);
      ctx.lineTo(o.x, o.y + r);
      ctx.lineTo(o.x - r, o.y);
      ctx.closePath();

      ctx.strokeStyle = "rgba(210,230,255,0.55)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = "rgba(210,230,255,0.10)";
      ctx.fill();
    }

    if (o.altDeg >= UI.LABEL_ALT_MIN_DEG && o.name) {
      ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeText(o.name, o.x + 8, o.y);

      ctx.fillStyle = "rgba(230,240,255,0.72)";
      ctx.fillText(o.name, o.x + 8, o.y);
    }
  }

  ctx.restore();
}

function drawStars(ctx, vp, starsPrepared) {
  ctx.save();
  ctx.setLineDash([]);

  for (const s of starsPrepared) {
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

function drawAlerts(ctx, vp, alertsPrepared) {
  if (!alertsPrepared || !alertsPrepared.length) return;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const LABEL_ALT_MIN = UI.LABEL_ALT_MIN_DEG;

  for (const a of alertsPrepared) {
    const isProfi = (a.level === "profi");

    // marker size by severity (1..5)
    const s = Math.max(3.5, Math.min(7.5, 2.5 + (a.severity || 2)));

    if (isProfi) {
      // "burst" cross
      ctx.strokeStyle = "rgba(255,120,120,0.70)";
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(a.x - s, a.y);
      ctx.lineTo(a.x + s, a.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a.x, a.y - s);
      ctx.lineTo(a.x, a.y + s);
      ctx.stroke();

      // small ring
      ctx.beginPath();
      ctx.arc(a.x, a.y, s * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,120,120,0.25)";
      ctx.stroke();
    } else {
      // amateur triangle
      ctx.strokeStyle = "rgba(120,255,200,0.65)";
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y - s);
      ctx.lineTo(a.x + s, a.y + s);
      ctx.lineTo(a.x - s, a.y + s);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = "rgba(120,255,200,0.12)";
      ctx.fill();
    }

    // label only if high enough
    if (a.altDeg >= LABEL_ALT_MIN && a.title) {
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeText(a.title, a.x + 9, a.y);

      ctx.fillStyle = isProfi ? "rgba(255,170,170,0.80)" : "rgba(190,255,230,0.70)";
      ctx.fillText(a.title, a.x + 9, a.y);
    }
  }

  ctx.restore();
}

function drawGridEq(ctx, vp, eqGrid) {
  if (!eqGrid) return;

  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  // Dec lines
  for (const ln of eqGrid.decLines || []) {
    drawPolylineWithBreaks(ctx, ln.pts);
  }

  // RA lines
  for (const ln of eqGrid.raLines || []) {
    drawPolylineWithBreaks(ctx, ln.pts);
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
  drawStars,
  drawAlerts,
  drawGridEq,
  drawZenith
};

export default Render;