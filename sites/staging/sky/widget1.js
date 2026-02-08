import { DEFAULTS } from "./core/sky.constants.js";
import { Data } from "./core/sky.data.js";
import { Layout } from "./core/sky.layout.js";
import { Prepare } from "./core/sky.prepare.js";
import { Render } from "./core/sky.render.js";
import { SkyUI } from "./core/sky.ui.js";

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
      status: root.querySelector('[data-role="status"]'),
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
    const stamp = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}`;
    return `lat ${(observer.latRad * 180 / Math.PI).toFixed(2)}°, lon ${(observer.lonRad * 180 / Math.PI).toFixed(
      2
    )}° | ${stamp} | stars ${starsCount} | cons ${consLines}${mwOn ? " | MW" : ""}${
      objCount ? " | obj " + objCount : ""
    }${alertsCount ? " | alerts " + alertsCount : ""}${gridEqOn ? " | EqGrid" : ""}`;
  }

  // Mouse position in CSS pixels relative to canvas box
  function getMousePosCSS(canvasEl, ev) {
    const r = canvasEl.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  // Build a SkyUI hit object from prepared item
  function toUIHit(preparedItem) {
    if (!preparedItem) return null;

    // prefer explicit kind, else infer
    let kind = preparedItem.kind;
    if (!kind) {
      if (preparedItem.title || preparedItem.severity != null) kind = "alert";
      else if (preparedItem.type && preparedItem.name) kind = "object";
      else kind = "star";
    }
    return { kind, data: preparedItem };
  }

  async function init(userCfg) {
    const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
    const mount = resolveMount(cfg);
    const { root, canvas, status } = makeRoot(mount);

    let ctx, viewport;
    ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));

    // --- UI: Tooltip + Modal live ONLY through SkyUI ---
    const tooltipEl = document.createElement("div");
    root.appendChild(tooltipEl);
    const tooltip = SkyUI.createTooltip(root, tooltipEl);
    const modal = SkyUI.createModal(root);

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

      // Prepared arrays (keep as-is; we wrap them for UI when needed)
      starsPrepared = Prepare.prepareStars(starCatalog, observer, viewport, cfg.options || {});

      consPrepared = cfg.options.showConstellations
        ? Prepare.prepareConstellations(constellations, starCatalog, observer, viewport, cfg.options || {})
        : { lines: [], labels: [] };

      meridianPts = cfg.options.showMeridian ? Prepare.buildMeridianPolyline(viewport) : [];
      equatorPts = cfg.options.showEquator ? Prepare.buildEquatorPolyline(observer, viewport) : [];
      eclipticPts = cfg.options.showEcliptic ? Prepare.buildEclipticPolyline(observer, viewport) : [];

      mwPrepared =
        cfg.options.showMilkyWay && milkyway ? Prepare.buildMilkyWay(observer, viewport, milkyway) : null;

      objectsPrepared =
        cfg.options.showObjects && objectsToday ? Prepare.prepareObjects(objectsToday, observer, viewport, cfg.options || {}) : [];

      alertsPrepared =
        cfg.options.showAlerts && alertsToday ? Prepare.prepareAlerts(alertsToday, observer, viewport, cfg.options || {}) : [];

      // Eq grid optional:
      // IMPORTANT: builder expects options.eqGrid.* (so pass cfg.options, not cfg.options.eqGrid)
      eqGridPrepared =
        cfg.options.showGridEq && typeof Prepare.buildEqGrid === "function"
          ? Prepare.buildEqGrid(observer, viewport, cfg.options || {})
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

    // --- Hover/Click interactions ---
    let hoverTarget = null;

    function hitRadiusForItem(t) {
      if (!t) return 6;
      const k = t.kind || (t.title ? "alert" : (t.type && t.name ? "object" : "star"));
      if (k === "star") return 8;
      if (k === "object") return 9;
      if (k === "alert") return 10;
      return 7;
    }

    function hitTest(cx, cy) {
      // priority: alerts > objects > stars
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

      // Hover tooltip
      canvas.addEventListener("mousemove", (ev) => {
        const p = getMousePosCSS(canvas, ev);
        const t = hitTest(p.x, p.y);

        if (t !== hoverTarget) hoverTarget = t;

        if (t) {
          const rootRect = root.getBoundingClientRect();
          const x = ev.clientX - rootRect.left;
          const y = ev.clientY - rootRect.top;
          tooltip.show(x, y, SkyUI.tooltipHTML(toUIHit(t)));
        } else {
          tooltip.hide();
        }
      });

      canvas.addEventListener("mouseleave", () => {
        hoverTarget = null;
        tooltip.hide();
      });

      // Click => open modal (same content as tooltip for now)
      canvas.addEventListener("click", (ev) => {
        const p = getMousePosCSS(canvas, ev);
        const t = hitTest(p.x, p.y);

        if (t) {
          tooltip.hide(); // avoid overlap
          modal.showFromHit(toUIHit(t));
        }
      });

      // Touch => tap opens modal (simple)
      canvas.addEventListener(
        "touchstart",
        (ev) => {
          if (!ev.touches || !ev.touches.length) return;
          const t0 = ev.touches[0];
          const fakeEv = { clientX: t0.clientX, clientY: t0.clientY };
          const p = getMousePosCSS(canvas, fakeEv);
          const t = hitTest(p.x, p.y);
          if (t) {
            tooltip.hide();
            modal.showFromHit(toUIHit(t));
          }
        },
        { passive: true }
      );
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
      update: parts.update || function () {},
      resize: parts.resize || function () {},
      destroy: function () {
        try {
          parts.ro && parts.ro.disconnect();
        } catch (_) {}
        if (parts.root && parts.root.parentNode) parts.root.parentNode.removeChild(parts.root);
      },
    };
  }

  // ------------------------------------------------------------------
  // Bootstrap (robust against script order / async module loading)
  // ------------------------------------------------------------------
  function getCfgNow() {
    return typeof window !== "undefined" && window.SKY_CONFIG ? window.SKY_CONFIG : null;
  }

  function bootWhenReady() {
    const cfg = getCfgNow();

    // if config is ready -> init immediately
    if (cfg && cfg.mountId) {
      init(cfg)
        .then((handle) => {
          window.__skyWidget = handle;
        })
        .catch((err) => {
          console.error("SKY init failed:", err);
        });
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
          .then((handle) => {
            window.__skyWidget = handle;
          })
          .catch((err) => {
            console.error("SKY init failed:", err);
          });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        console.error(
          "SKY init failed: SKY_CONFIG.mountId is required (e.g. 'skyMount').",
          "Current SKY_CONFIG:",
          c
        );
      }
    }, 50);
  }

  bootWhenReady();
})();