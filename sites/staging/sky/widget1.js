import { DEFAULTS } from "./core/sky.constants.js";
import { Data } from "./core/sky.data.js";
import { Layout } from "./core/sky.layout.js";
import { Prepare } from "./core/sky.prepare.js";
import { Render } from "./core/sky.render.js";

(function () {
  "use strict";

  function deepMerge(dst, src) {
    if (!src) return dst;
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v)) dst[k] = deepMerge(dst[k] || {}, v);
      else dst[k] = v;
    }
    return dst;
  }

  function makeRoot(container) {
    const root = document.createElement("div");
    root.className = "sky-root";
    root.innerHTML = `
      <div class="sky-canvas-wrap"><canvas class="sky-canvas"></canvas></div>
      <div class="sky-status" data-role="status">Loading…</div>
    `;
    container.appendChild(root);
    return {
      root,
      canvas: root.querySelector("canvas.sky-canvas"),
      status: root.querySelector('[data-role="status"]')
    };
  }

  function resolveMount(cfg) {
    if (!cfg || !cfg.mountId) {
      throw new Error("SKY_CONFIG.mountId is required (e.g. 'skyMount').");
    }
    const el = document.getElementById(cfg.mountId);
    if (!el) {
      throw new Error(`SKY mount element not found: #${cfg.mountId}`);
    }
    return el;
  }

  function makeStatusText(observer, starsCount, consLines, mwOn, objCount, alertsCount, gridEqOn) {
    const dt = observer.date;
    const pad2 = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
    return `lat ${(observer.latRad * 180 / Math.PI).toFixed(2)}°, lon ${(observer.lonRad * 180 / Math.PI).toFixed(2)}° | ${stamp} | stars ${starsCount} | cons ${consLines}${mwOn ? " | MW" : ""}${(objCount ? " | obj " + objCount : "")}${(alertsCount ? " | alerts " + alertsCount : "")}${gridEqOn ? " | EqGrid" : ""}`;
  }

  async function init(userCfg) {
    const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
    const mount = resolveMount(cfg);
    const { root, canvas, status } = makeRoot(mount);

    let ctx, viewport;
    ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));

    // --- Tooltip (lives inside widget root so it works in Fullscreen) ---
    let tooltipEl = null;

    const _esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
      c === "&" ? "&amp;" :
      c === "<" ? "&lt;" :
      c === ">" ? "&gt;" :
      c === '"' ? "&quot;" : "&#39;"
    ));

    const _fmtDeg = (v) => (typeof v === "number" && isFinite(v)) ? `${v.toFixed(0)}°` : "—";

    function ensureTooltipEl() {
      if (tooltipEl) return tooltipEl;
      tooltipEl = document.createElement("div");
      tooltipEl.className = "sky-tip";
      Object.assign(tooltipEl.style, {
        position: "absolute",
        display: "none",
        zIndex: "60",
        maxWidth: "280px",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "rgba(0,0,0,0.60)",
        border: "1px solid rgba(255,255,255,0.14)",
        color: "rgba(255,255,255,0.90)",
        font: "12px system-ui, -apple-system, Segoe UI, Roboto, Arial",
        pointerEvents: "none",
        backdropFilter: "blur(6px)",
      });
      root.appendChild(tooltipEl);
      return tooltipEl;
    }

    function tooltipHTML(t) {
      const kind = t?.kind || "item";

      if (kind === "object") {
        const title = (t.name && t.name.trim()) ? t.name.trim() : "Object";
        const mag = (typeof t.mag === "number" && isFinite(t.mag)) ? t.mag.toFixed(1) : "—";
        const sub = `${_esc(t.type || "obj")} • mag ${mag}`;
        const meta = `alt ${_fmtDeg(t.altDeg)}${t.azDeg != null ? " • az " + _fmtDeg(t.azDeg) : ""}`;
        return `<div class="sky-tip-title">${_esc(title)}</div><div class="sky-tip-sub">${sub}</div><div class="sky-tip-meta">${meta}</div>`;
      }

      if (kind === "alert") {
        const title = t.title || "Alert";
        const lvl = (t.level || "amateur").toLowerCase();
        const sub = `${_esc(lvl)} • severity ${_esc(t.severity ?? "?")}`;
        const meta = `alt ${_fmtDeg(t.altDeg)}${t.azDeg != null ? " • az " + _fmtDeg(t.azDeg) : ""}`;
        return `<div class="sky-tip-title">${_esc(title)}</div><div class="sky-tip-sub">${sub}</div><div class="sky-tip-meta">${meta}</div>`;
      }

      // star (default)
      const title = (t.name && t.name.trim()) ? t.name.trim()
        : (t.designation && t.designation.trim()) ? t.designation.trim()
        : (t.hip ? `HIP ${t.hip}` : (t.id ?? "Star"));

      const mag = (typeof t.mag === "number" && isFinite(t.mag)) ? t.mag.toFixed(2) : "—";

      const subParts = [];
      if (t.name && t.name.trim() && t.designation && t.designation.trim()) subParts.push(t.designation.trim());
      subParts.push(`mag ${mag}`);

      const meta = `alt ${_fmtDeg(t.altDeg)}${t.azDeg != null ? " • az " + _fmtDeg(t.azDeg) : ""}`;

      return `<div class="sky-tip-title">${_esc(title)}</div><div class="sky-tip-sub">${_esc(subParts.join(" • "))}</div><div class="sky-tip-meta">${meta}</div>`;
    }

    function showTip(hit, ev) {
      const el = ensureTooltipEl();
      if (!hit) { hideTip(); return; }

      el.innerHTML = tooltipHTML(hit);
      el.style.display = "block";

      const rootRect = root.getBoundingClientRect();
      const x0 = ev.clientX - rootRect.left;
      const y0 = ev.clientY - rootRect.top;

      const tw = el.offsetWidth || 260;
      const th = el.offsetHeight || 90;

      const margin = 10;
      const off = 14;

      let x = x0 + off;
      let y = y0 + off;

      const maxX = rootRect.width - margin - tw;
      const maxY = rootRect.height - margin - th;

      x = Math.max(margin, Math.min(maxX, x));
      y = Math.max(margin, Math.min(maxY, y));

      el.style.left = Math.round(x) + "px";
      el.style.top = Math.round(y) + "px";
    }

    function hideTip() {
      if (!tooltipEl) return;
      tooltipEl.style.display = "none";
    }

    // Mouse position in CSS pixels relative to canvas box
    function getMousePosCSS(canvasEl, ev) {
      const r = canvasEl.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    let starCatalog = null;
    let constellations = null;
    let milkyway = null;
    let objectsToday = null;
    let alertsToday = null;

    try {
      status.textContent = "Loading stars…";
      starCatalog = await Data.loadStars(cfg.baseUrl);

      status.textContent = "Loading constellations…";
      constellations = await Data.loadConstellations(cfg.baseUrl);

      status.textContent = "Loading Milky Way…";
      milkyway = await Data.loadMilkyWay(cfg.baseUrl);

      status.textContent = "Loading objects…";
      objectsToday = await Data.loadObjectsToday(cfg.baseUrl);

      status.textContent = "Loading alerts…";
      alertsToday = await Data.loadAlertsToday(cfg.baseUrl);
    } catch (e) {
      console.error(e);
      status.textContent = "Failed to load sky data";
      return makeHandle({ root });
    }

    let observer, starsPrepared, consPrepared;
    let meridianPts, equatorPts, eclipticPts;
    let mwPrepared;
    let objectsPrepared = [];
    let alertsPrepared = [];
    let eqGridPrepared = null;

    function recomputeAll() {
      observer = Prepare.makeObserver(cfg);

      starsPrepared = Prepare.prepareStars(starCatalog, observer, viewport, cfg.options || {});
      consPrepared = cfg.options.showConstellations
        ? Prepare.prepareConstellations(constellations, starCatalog, observer, viewport, cfg.options || {})
        : { lines: [], labels: [] };

      meridianPts = cfg.options.showMeridian ? Prepare.buildMeridianPolyline(viewport) : [];
      equatorPts = cfg.options.showEquator ? Prepare.buildEquatorPolyline(observer, viewport) : [];
      eclipticPts = cfg.options.showEcliptic ? Prepare.buildEclipticPolyline(observer, viewport) : [];

      mwPrepared = (cfg.options.showMilkyWay && milkyway)
        ? Prepare.buildMilkyWay(observer, viewport, milkyway)
        : null;

      objectsPrepared = (cfg.options.showObjects && objectsToday)
        ? Prepare.prepareObjects(objectsToday, observer, viewport, cfg.options || {})
        : [];

      alertsPrepared = (cfg.options.showAlerts && alertsToday)
        ? Prepare.prepareAlerts(alertsToday, observer, viewport, cfg.options || {})
        : [];

      // Eq grid optional
      eqGridPrepared = (cfg.options.showGridEq && typeof Prepare.buildEqGrid === "function")
        ? Prepare.buildEqGrid(observer, viewport, cfg.options?.eqGrid)
        : null;
    }

    function render() {
      Render.clear(ctx, viewport);
      Render.drawBackground(ctx, viewport);

      // clip to horizon circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(viewport.cx, viewport.cy, viewport.R, 0, Math.PI * 2);
      ctx.clip();

      if (cfg.options?.showGridAz) Render.drawGridAz(ctx, viewport);

      if (cfg.options?.showMeridian) Render.drawMeridian(ctx, viewport, meridianPts);
      if (cfg.options?.showEquator) Render.drawEquator(ctx, viewport, equatorPts);
      if (cfg.options?.showEcliptic) Render.drawEcliptic(ctx, viewport, eclipticPts);

      if (cfg.options?.showGridEq && eqGridPrepared) Render.drawGridEq(ctx, viewport, eqGridPrepared);

      if (cfg.options?.showMilkyWay && mwPrepared) Render.drawMilkyWay(ctx, viewport, mwPrepared);

      if (cfg.options?.showConstellations) Render.drawConstellations(ctx, viewport, consPrepared);

      if (cfg.options?.showAlerts && alertsPrepared.length) Render.drawAlerts(ctx, viewport, alertsPrepared);

      if (cfg.options?.showObjects && objectsPrepared.length) Render.drawObjects(ctx, viewport, objectsPrepared);

      Render.drawStars(ctx, viewport, starsPrepared);

      ctx.restore(); // end clip

      Render.drawHorizon(ctx, viewport);
      Render.drawCardinals(ctx, viewport);

      status.textContent = makeStatusText(
        observer,
        starsPrepared.length,
        (consPrepared.lines || []).length,
        !!mwPrepared,
        objectsPrepared.length,
        alertsPrepared.length,
        !!eqGridPrepared
      );
    }

    function resize() {
      ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));
      recomputeAll();
      render();
    }

    function update(patch) {
      deepMerge(cfg, patch || {});
      recomputeAll();
      render();
    }

    // --- Hover/Click interactions (tooltip + pin)
    let hoverTarget = null;
    let pinnedTarget = null;
    let pinnedPos = null;

    function hitRadiusForItem(t) {
      if (!t) return 6;
      if (t.kind === "star") return 8;
      if (t.kind === "object") return 9;
      if (t.kind === "alert") return 10;
      return 7;
    }

    function hitTest(cx, cy) {
      // search priority: pinned? objects/alerts then stars
      const list = []
        .concat(alertsPrepared || [])
        .concat(objectsPrepared || [])
        .concat(starsPrepared || []);

      let best = null;
      let bestD2 = Infinity;

      for (const t of list) {
        if (!t || t.x == null || t.y == null) continue;
        const r = hitRadiusForItem(t);
        const dx = cx - t.x;
        const dy = cy - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r * r && d2 < bestD2) {
          best = t;
          bestD2 = d2;
        }
      }
      return best;
    }

    function bindInteractionsOnce() {
      if (!canvas || canvas.__skyBound) return;
      canvas.__skyBound = true;

      canvas.addEventListener("mousemove", (ev) => {
        const p = getMousePosCSS(canvas, ev);
        const t = hitTest(p.x, p.y);

        if (pinnedTarget) {
          return; // keep pinned tooltip in place
        }

        if (t !== hoverTarget) hoverTarget = t;
        if (t) showTip(t, ev); else hideTip();
      });

      canvas.addEventListener("mouseleave", () => {
        hoverTarget = null;
        if (!pinnedTarget) hideTip();
      });

      canvas.addEventListener("click", (ev) => {
        const p = getMousePosCSS(canvas, ev);
        const t = hitTest(p.x, p.y);

        // toggle pin: click on same target unpins
        if (pinnedTarget && t && pinnedTarget === t) {
          pinnedTarget = null;
          pinnedPos = null;
          hideTip();
          return;
        }

        if (t) {
          pinnedTarget = t;
          pinnedPos = { clientX: ev.clientX, clientY: ev.clientY };
          showTip(t, ev);
        } else {
          // click on empty space -> clear pin
          pinnedTarget = null;
          pinnedPos = null;
          hideTip();
        }
      });

      // Touch: simple tap-to-pin
      canvas.addEventListener("touchstart", (ev) => {
        if (!ev.touches || !ev.touches.length) return;
        const t0 = ev.touches[0];
        const fakeEv = { clientX: t0.clientX, clientY: t0.clientY };
        const p = getMousePosCSS(canvas, fakeEv);
        const touchTarget = hitTest(p.x, p.y);
        if (touchTarget) showTip(touchTarget, fakeEv);
      }, { passive: true });
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(mount);

    recomputeAll();
    render();
    bindInteractionsOnce();

    return makeHandle({ root, update, resize, ro });
  }

  function makeHandle(parts) {
    return {
      update: parts.update || function () { },
      resize: parts.resize || function () { },
      destroy: function () {
        try { parts.ro && parts.ro.disconnect(); } catch (_) { }
        if (parts.root && parts.root.parentNode) parts.root.parentNode.removeChild(parts.root);
      }
    };
  }

  // ------------------------------------------------------------------
  // Bootstrap (robust against script order / async module loading)
  // ------------------------------------------------------------------
  function getCfgNow() {
    return (typeof window !== "undefined" && window.SKY_CONFIG) ? window.SKY_CONFIG : null;
  }

  function bootWhenReady() {
    const cfg = getCfgNow();

    // if config is ready -> init immediately
    if (cfg && cfg.mountId) {
      init(cfg)
        .then((handle) => { window.__skyWidget = handle; })
        .catch((err) => { console.error("SKY init failed:", err); });
      return;
    }

    // otherwise wait a bit for SKY_CONFIG to appear
    const startedAt = Date.now();
    const timeoutMs = 4000;

    const timer = setInterval(() => {
      const c = getCfgNow();
      if (c && c.mountId) {
        clearInterval(timer);
        init(c)
          .then((handle) => { window.__skyWidget = handle; })
          .catch((err) => { console.error("SKY init failed:", err); });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        console.error("SKY init failed: SKY_CONFIG.mountId is required (e.g. 'skyMount').",
          "Current SKY_CONFIG:", c);
      }
    }, 50);
  }

  bootWhenReady();

})();