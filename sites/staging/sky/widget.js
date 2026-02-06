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
    const mountId = cfg?.mountId || "skyMount";
    const el = document.getElementById(mountId);
    if (!el) {
      console.error(`[sky] mount not found: #${mountId}`);
      throw new Error(`SKY_CONFIG.mountId is required (e.g. 'skyMount') and must exist in DOM.`);
    }
    return el;
  }

  function makeStatusText(observer, starsCount, consLines, mwOn, objCount, alertsCount, eqGridOn) {
    const dt = observer.date;
    const pad2 = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
    return `lat ${(observer.latRad * 180 / Math.PI).toFixed(2)}°, lon ${(observer.lonRad * 180 / Math.PI).toFixed(2)}° | ${stamp} | stars ${starsCount} | cons ${consLines}${mwOn ? " | MW" : ""}${eqGridOn ? " | EqGrid" : ""}${(objCount ? " | obj " + objCount : "")}${(alertsCount ? " | alerts " + alertsCount : "")}`;
  }

  async function init(userCfg) {
    const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
    const mount = resolveMount(cfg);
    const { root, canvas, status } = makeRoot(mount);

    let ctx, viewport;
    ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));

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
      alertsToday = await Data.loadAlertsToday?.(cfg.baseUrl);
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

    // -----------------------------
    // Hover / Click (pin) — on canvas
    // -----------------------------
    let interactionsBound = false;
    let hoverTarget = null;
    let pinnedTarget = null;
    let tooltipEl = null;

    function ensureTooltipEl() {
      let el = document.getElementById("skyTooltip");
      if (!el) {
        el = document.createElement("div");
        el.id = "skyTooltip";
        el.className = "sky-tooltip";
        // If CSS class doesn't exist yet — still usable
        el.style.position = "fixed";
        el.style.zIndex = "20000";
        el.style.pointerEvents = "none";
        el.style.background = "rgba(10,14,22,0.92)";
        el.style.border = "1px solid rgba(255,255,255,0.14)";
        el.style.color = "rgba(255,255,255,0.90)";
        el.style.padding = "8px 10px";
        el.style.borderRadius = "12px";
        el.style.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        el.style.maxWidth = "260px";
        el.style.transform = "translate(12px, 12px)";
        el.style.display = "none";
        document.body.appendChild(el);
      }
      return el;
    }

    function showTip(text, clientX, clientY) {
      if (!tooltipEl) tooltipEl = ensureTooltipEl();
      if (!text) { hideTip(); return; }
      tooltipEl.textContent = String(text);
      tooltipEl.style.left = clientX + "px";
      tooltipEl.style.top = clientY + "px";
      tooltipEl.style.display = "block";
    }

    function hideTip() {
      if (!tooltipEl) return;
      tooltipEl.style.display = "none";
    }

    function getMousePosCSS(canvasEl, ev) {
      const r = canvasEl.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    function hitRadiusForItem(it) {
      // a bit forgiving
      if (!it) return 0;
      if (it.kind === "alert") return 12;
      if (it.kind === "object" && it.type === "planet") return 12;
      if (it.kind === "object") return 11;
      return 10;
    }

    function hitTest(list, x, y) {
      if (!list || !list.length) return null;
      let best = null;
      let bestD2 = Infinity;
      for (const it of list) {
        if (!it) continue;
        if (typeof it.x !== "number" || typeof it.y !== "number") continue;
        const rr = hitRadiusForItem(it);
        const dx = it.x - x;
        const dy = it.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= rr * rr && d2 < bestD2) {
          best = it;
          bestD2 = d2;
        }
      }
      return best;
    }

    function getHitCandidates() {
      // priority: objects/alerts first, then stars (so star field doesn't steal hover)
      return [
        ...(objectsPrepared || []),
        ...(alertsPrepared || []),
        ...(starsPrepared || [])
      ];
    }

    function hitRadiusForItem(it) {
      if (!it) return 0;
    
      if (it.kind === "alert") return 12;
      if (it.kind === "object" && it.type === "planet") return 12;
      if (it.kind === "object") return 11;
    
      // stars: make it easier to hit than their drawn radius
      if (it.kind === "star") return Math.max(7, (it.r || 2) + 6);
    
      return 10;
    }

    function targetLabel(t) {
      if (!t) return "";
    
      if (t.kind === "object") return t.name || "Object";
      if (t.kind === "alert") return t.title || "Alert";
    
      if (t.kind === "star") {
        const nm = (t.name && String(t.name).trim()) ? String(t.name).trim() : "";
        const mag = (typeof t.mag === "number") ? `mag ${t.mag.toFixed(2)}` : "";
        const hip = (typeof t.hip === "number") ? `HIP ${t.hip}` : "";
        const id  = (typeof t.id === "number") ? `id ${t.id}` : "";
    
        const head = nm || hip || id || "Star";
        const tail = [mag].filter(Boolean).join(" • ");
        return tail ? `${head} • ${tail}` : head;
      }
    
      return t.name || t.title || "Item";
    }

    function bindInteractionsOnce() {
      if (interactionsBound) return;
      interactionsBound = true;

      canvas.addEventListener("mousemove", (ev) => {
        const { x, y } = getMousePosCSS(canvas, ev);

        // keep pinned tooltip stable
        if (pinnedTarget) {
          showTip(targetLabel(pinnedTarget), ev.clientX, ev.clientY);
          return;
        }

        const t = hitTest(getHitCandidates(), x, y);
        hoverTarget = t;

        if (t) showTip(targetLabel(t), ev.clientX, ev.clientY);
        else hideTip();
      });

      canvas.addEventListener("mouseleave", () => {
        hoverTarget = null;
        if (!pinnedTarget) hideTip();
      });

      canvas.addEventListener("click", (ev) => {
        const { x, y } = getMousePosCSS(canvas, ev);
        const t = hitTest(getHitCandidates(), x, y);

        if (t) {
          pinnedTarget = t;
          showTip(targetLabel(t), ev.clientX, ev.clientY);

          // hook for future details/pin integrations
          window.dispatchEvent(new CustomEvent("sky:pick", { detail: { item: t } }));
          return;
        }

        // click on empty space => unpin
        pinnedTarget = null;
        hideTip();
        window.dispatchEvent(new CustomEvent("sky:unpick", {}));
      });
    }

    function recomputeAll() {
      observer = Prepare.makeObserver(cfg);

      // Enrich stars for interactions (keep render-compatible shape)
      starsPrepared = (Prepare.prepareStars(starCatalog, observer, viewport, cfg.options || {}) || []).map((s) => ({
        ...s,
        kind: "star",
        // keep whatever prepare already outputs (x,y,r,mag,name,id)
      }));
      consPrepared = cfg.options.showConstellations
        ? Prepare.prepareConstellations(constellations, starCatalog, observer, viewport, cfg.options || {})
        : { lines: [], labels: [] };

      meridianPts = cfg.options.showMeridian ? Prepare.buildMeridianPolyline(viewport) : [];
      equatorPts = cfg.options.showEquator ? Prepare.buildEquatorPolyline(observer, viewport) : [];
      eclipticPts = cfg.options.showEcliptic ? Prepare.buildEclipticPolyline(observer, viewport) : [];

      mwPrepared = (cfg.options.showMilkyWay && milkyway)
        ? Prepare.buildMilkyWay(observer, viewport, milkyway)
        : null;

      // IMPORTANT: add kind tags here (no changes needed in Prepare)
      objectsPrepared = (cfg.options.showObjects && objectsToday)
        ? (Prepare.prepareObjects(objectsToday, observer, viewport, cfg.options || {}) || []).map(o => ({ ...o, kind: "object" }))
        : [];

      alertsPrepared = (cfg.options.showAlerts && alertsToday && typeof Prepare.prepareAlerts === "function")
        ? (Prepare.prepareAlerts(alertsToday, observer, viewport, cfg.options || {}) || []).map(a => ({ ...a, kind: "alert" }))
        : [];

      // Eq grid optional
      eqGridPrepared = (cfg.options.showGridEq && typeof Prepare.buildEqGrid === "function")
        ? Prepare.buildEqGrid(observer, viewport, cfg.options?.eqGrid)
        : null;

      // if pinned item disappeared (layer off / below horizon), unpin
      if (pinnedTarget) {
          const stillThere = hitTest(getHitCandidates(), pinnedTarget.x, pinnedTarget.y);
          if (!stillThere) {
          pinnedTarget = null;
          hideTip();
        }
      }
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
      if (cfg.options?.showGridEq && eqGridPrepared) Render.drawGridEq(ctx, viewport, eqGridPrepared);

      if (cfg.options?.showMeridian) Render.drawMeridian(ctx, viewport, meridianPts);
      if (cfg.options?.showEquator) Render.drawEquator(ctx, viewport, equatorPts);
      if (cfg.options?.showEcliptic) Render.drawEcliptic(ctx, viewport, eclipticPts);

      if (cfg.options?.showMilkyWay && mwPrepared) Render.drawMilkyWay(ctx, viewport, mwPrepared);

      if (cfg.options?.showConstellations) Render.drawConstellations(ctx, viewport, consPrepared);

      if (cfg.options?.showObjects && objectsPrepared.length) Render.drawObjects(ctx, viewport, objectsPrepared);
      if (cfg.options?.showAlerts && alertsPrepared.length) Render.drawAlerts(ctx, viewport, alertsPrepared);

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

    const ro = new ResizeObserver(() => resize());
    ro.observe(mount);

    recomputeAll();
    bindInteractionsOnce();
    render();

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

  // Bootstrap
  const userCfg = (typeof window !== "undefined" && window.SKY_CONFIG) ? window.SKY_CONFIG : null;

  init(userCfg || {})
    .then((handle) => { window.__skyWidget = handle; })
    .catch((err) => { console.error("SKY init failed:", err); });

})();