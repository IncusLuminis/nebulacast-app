import { LAYOUT } from "./sky.constants.js";

function computeViewport(container, dpr) {
  const rect = container.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.max(10, Math.floor(0.5 * Math.min(w, h) - LAYOUT.PADDING));
  return { w, h, dpr, cx, cy, R, padding: LAYOUT.PADDING };
}

function setupCanvas(canvas, container) {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const vp = computeViewport(container, dpr);

  canvas.style.width = vp.w + "px";
  canvas.style.height = vp.h + "px";
  canvas.width = vp.w * vp.dpr;
  canvas.height = vp.h * vp.dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);

  return { ctx, viewport: vp };
}

export const Layout = { setupCanvas, computeViewport };