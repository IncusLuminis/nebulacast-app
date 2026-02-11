// widget.js
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

  function applyUIHighlight(patch) {
    const hid = patch?.ui?.highlightId;
    if (!hid) return;

    window.__skyHighlight = {
      id: String(hid),
      until: Date.now() + (patch.ui.highlightMs ?? 3000),
    };
  }

  function makeRoot(container) {
    const root = document.createElement("div");
    root.className = "sky-root";
    root.innerHTML = `
      <div class="sky-canvas-wrap"><canvas class="sky-canvas"></canvas></div>
      <div class="sky-status" data-role="status">Loading…</div>
    `;
    container.appendChild(root);

    const wrap = root.querySelector(".sky-canvas-wrap");
    const canvas = root.querySelector("canvas.sky-canvas");
    const status = root.querySelector('[data-role="status"]');

    root.style.position = "relative";
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.overflow = "visible";

    wrap.style.position = "relative";
    wrap.style.width = "100%";
    wrap.style.height = "100%";
    wrap.style.overflow = "visible";

    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    status.style.position = "absolute";
    status.style.left = "10px";
    status.style.right = "10px";
    status.style.bottom = "10px";
    status.style.zIndex = "5";
    status.style.pointerEvents = "none";

    return { root, wrap, canvas, status };
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

  function makeStatusText(
    observer,
    starsCount,
    consLines,
    mwOn,
    objCount,
    alertsCount,
    gridEqOn,
    sunMoonOn,
    planetsOn
  ) {
    const dt = observer.date;
    const pad2 = (n) => String(n).padStart(2, "0");
    const stamp = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())} ${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}`;

    return `lat ${((observer.latRad * 180) / Math.PI).toFixed(2)}°, lon ${(
      (observer.lonRad * 180) /
      Math.PI
    ).toFixed(2)}° | ${stamp} | stars ${starsCount} | cons ${consLines}${mwOn ? " | MW" : ""}${
      objCount ? " | obj " + objCount : ""
    }${alertsCount ? " | alerts " + alertsCount : ""}${gridEqOn ? " | EqGrid" : ""}${
      sunMoonOn ? " | SunMoon" : ""
    }${planetsOn ? " | Planets" : ""}`;
  }

  // -----------------------
  // Highlight helper (global) used by Render.drawObjects()
  // -----------------------
  window.__skyIsHighlighted = function (obj) {
    const h = window.__skyHighlight;
    if (!h) return false;
    if (Date.now() > h.until) return false;
    if (!obj) return false;
  
    const hid = String(h.id || "").trim().toLowerCase();
    if (!hid) return false;
  
    const group = obj.group ? String(obj.group).trim().toLowerCase() : "";
    const id = obj.id ? String(obj.id).trim().toLowerCase() : "";
    const name = obj.name ? String(obj.name).trim().toLowerCase() : "";
  
    const candidates = [
      id,
      name,
      (group && id) ? `${group}:${id}` : null,
      (group && name) ? `${group}:${name}` : null,
      obj.meta?.planet_key ? String(obj.meta.planet_key).trim().toLowerCase() : null,
    ].filter(Boolean);
  
    return candidates.includes(hid);
  };

  function getMousePosCSS(canvasEl, ev) {
    const r = canvasEl.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function toUIHit(preparedItem) {
    if (!preparedItem) return null;

    let kind = preparedItem.kind;
    if (!kind) {
      if (
        preparedItem.type === "sun" ||
        preparedItem.type === "moon" ||
        preparedItem.type === "planet"
      ) kind = "object";
      else if (preparedItem.title || preparedItem.severity != null) kind = "alert";
      else if (preparedItem.type && preparedItem.name) kind = "object";
      else kind = "star";
    }

    const data = preparedItem;

    if ((preparedItem.type === "sun" || preparedItem.type === "moon") && data && data.subtype == null) {
      data.subtype = preparedItem.type;
    }
    if (preparedItem.type === "planet" && data && data.subtype == null) {
      data.subtype = "planet";
    }

    return { kind, data };
  }

  async function init(userCfg) {
    const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
    const mount = resolveMount(cfg);
    const { root, wrap, canvas, status } = makeRoot(mount);

    let ctx, viewport;
    ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));

    const tooltipEl = document.createElement("div");
    root.appendChild(tooltipEl);
    const tooltip = SkyUI.createTooltip(root, tooltipEl);
    const modal = SkyUI.createModal(root);

    let starCatalog = null;
    let constellations = null;
    let milkyway = null;
    let objectsToday = null;
    let alertsToday = null;
    let sunMoon = null;
    let planets = null;
    let messierJson = null;
    
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

      status.textContent = "Loading Sun/Moon…";
      if (typeof Data.loadSunMoon === "function") sunMoon = await Data.loadSunMoon(cfg.baseUrl);
      else sunMoon = null;

      status.textContent = "Loading Messier…";
      if (typeof Data.loadMessier === "function") messierJson = await Data.loadMessier(cfg.baseUrl);
      else messierJson = null;

      status.textContent = "Loading planets…";
      if (typeof Data.loadPlanets === "function") planets = await Data.loadPlanets(cfg.baseUrl);
      else planets = null;
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
    let sunMoonPrepared = [];
    let planetsPrepared = [];
    let messierPrepared = [];

    function recomputeAll() {
      observer = Prepare.makeObserver(cfg);

      starsPrepared = Prepare.prepareStars(starCatalog, observer, viewport, cfg.options || {});

      consPrepared = cfg.options.showConstellations
        ? Prepare.prepareConstellations(constellations, starCatalog, observer, viewport, cfg.options || {})
        : { lines: [], labels: [] };

      meridianPts = cfg.options.showMeridian ? Prepare.buildMeridianPolyline(viewport) : [];
      equatorPts = cfg.options.showEquator ? Prepare.buildEquatorPolyline(observer, viewport) : [];
      eclipticPts = cfg.options.showEcliptic ? Prepare.buildEclipticPolyline(observer, viewport) : [];

      mwPrepared =
        cfg.options.showMilkyWay && milkyway ? Prepare.buildMilkyWay(observer, viewport, milkyway) : null;

      const uiHighlightId =
        (typeof window !== "undefined" && window.__skyHighlight && window.__skyHighlight.id != null)
         ? String(window.__skyHighlight.id)
         : null;
      
      objectsPrepared =
        cfg.options.showObjects && objectsToday
          ? Prepare.prepareObjects(objectsToday, observer, viewport, { ...(cfg.options || {}), uiHighlightId })
          : [];
      
      alertsPrepared =
        cfg.options.showAlerts && alertsToday
          ? Prepare.prepareAlerts(alertsToday, observer, viewport, { ...(cfg.options || {}), uiHighlightId })
          : [];

      eqGridPrepared =
        cfg.options.showGridEq && typeof Prepare.buildEqGrid === "function"
          ? Prepare.buildEqGrid(observer, viewport, cfg.options || {})
          : null;

      messierPrepared =
        cfg.options?.showMessier && messierJson && typeof Prepare.prepareMessier === "function"
          ? Prepare.prepareMessier(messierJson, observer, viewport, cfg.options || {})
          : [];

      const showSunMoon = cfg.options && cfg.options.showSunMoon === false ? false : true;
      sunMoonPrepared =
        showSunMoon && sunMoon && typeof Prepare.prepareSunMoon === "function"
          ? Prepare.prepareSunMoon(sunMoon, observer, viewport)
          : [];

      const showPlanets = cfg.options && cfg.options.showPlanets === false ? false : true;
      planetsPrepared =
        showPlanets && planets && typeof Prepare.preparePlanets === "function"
          ? Prepare.preparePlanets(planets, observer, viewport)
          : [];
    }

    function render() {
      Render.clear(ctx, viewport);
      Render.drawBackground(ctx, viewport);
    
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
    
      // stars background
      Render.drawStars(ctx, viewport, starsPrepared);
    
      if (cfg.options?.showAlerts && alertsPrepared.length) Render.drawAlerts(ctx, viewport, alertsPrepared);
    
      if (sunMoonPrepared && sunMoonPrepared.length) {
        if (typeof Render.drawSunMoon === "function") Render.drawSunMoon(ctx, viewport, sunMoonPrepared);
        else if (typeof Render.drawObjects === "function") Render.drawObjects(ctx, viewport, sunMoonPrepared);
      }
    
      if (planetsPrepared && planetsPrepared.length) {
        if (typeof Render.drawPlanets === "function") Render.drawPlanets(ctx, viewport, planetsPrepared);
        else if (typeof Render.drawObjects === "function") Render.drawObjects(ctx, viewport, planetsPrepared);
      }
    
      // --- NEW: Messier layer (draw markers + optionally labels via enqueueLabel) ---
      if (cfg.options?.showMessier && typeof Render.drawMessier === "function" && messierPrepared && messierPrepared.length) {
        Render.drawMessier(ctx, viewport, messierPrepared);
      }
    
      // curated objects (recommended / best)
      if (cfg.options?.showObjects && objectsPrepared.length) Render.drawObjects(ctx, viewport, objectsPrepared);
    
      Render.flushLabels(ctx, viewport);
    
      ctx.restore();
    
      Render.drawHorizon(ctx, viewport);
      Render.drawCardinals(ctx, viewport);
    
      status.textContent = makeStatusText(
        observer,
        starsPrepared.length,
        (consPrepared.lines || []).length,
        !!mwPrepared,
        objectsPrepared.length,
        alertsPrepared.length,
        !!eqGridPrepared,
        !!(sunMoonPrepared && sunMoonPrepared.length),
        !!(planetsPrepared && planetsPrepared.length)
      );
    }

    function resize() {
      const r = mount.getBoundingClientRect();
      if (!r || r.width < 2 || r.height < 2) return;

      ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));
      recomputeAll();
      render();
    }

    // -----------------------
    // Animation loop (only while highlight is active)
    // -----------------------
    let rafId = 0;

    function isHighlightActive() {
      const h = typeof window !== "undefined" ? window.__skyHighlight : null;
      return !!(h && Date.now() <= h.until && h.id != null && String(h.id).length > 0);
    }

    function stopAnim() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function startAnim() {
      if (rafId) return;

      const tick = () => {
        if (!isHighlightActive()) {
          stopAnim();
          render(); // финальный кадр
          return;
        }
        render();
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    }

    function update(patch) {
      if (!patch) return;

      deepMerge(cfg, patch);
      applyUIHighlight(patch);

      recomputeAll();
      render();

      // if highlight was applied -> animate breathing
      if (isHighlightActive()) startAnim();
    }

    let hoverTarget = null;

    function hitRadiusForItem(t) {
      if (!t) return 6;
      if (t.type === "sun") return 14;
      if (t.type === "moon") return 13;
      if (t.type === "planet") return 12;

      const k = t.kind || (t.title ? "alert" : t.type && t.name ? "object" : "star");
      if (k === "star") return 8;
      if (k === "object") return 9;
      if (k === "alert") return 10;
      return 7;
    }

    function hitTest(cx, cy) {
      const list = []
        .concat(alertsPrepared || [])
        .concat(sunMoonPrepared || [])
        .concat(planetsPrepared || [])
        .concat(objectsPrepared || [])
        .concat(messierPrepared || [])
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

      canvas.addEventListener("click", (ev) => {
        const p = getMousePosCSS(canvas, ev);
        const t = hitTest(p.x, p.y);
        if (t) {
          tooltip.hide();
          modal.showFromHit(toUIHit(t));
        }
      });

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

    const onWinResize = () => {
      clearTimeout(onWinResize.__t);
      onWinResize.__t = setTimeout(() => resize(), 50);
    };
    window.addEventListener("resize", onWinResize);

    recomputeAll();
    render();
    bindInteractionsOnce();

    // if highlight already exists on boot
    if (isHighlightActive()) startAnim();

    setTimeout(() => resize(), 0);

    return makeHandle({ root, update, resize, onWinResize, stopAnim });
  }

  function makeHandle(parts) {
    return {
      update: parts.update || function () {},
      resize: parts.resize || function () {},
      destroy: function () {
        try {
          if (parts.stopAnim) parts.stopAnim();
          if (parts.onWinResize) window.removeEventListener("resize", parts.onWinResize);
        } catch (_) {}
        if (parts.root && parts.root.parentNode) parts.root.parentNode.removeChild(parts.root);
      },
    };
  }

  function getCfgNow() {
    return typeof window !== "undefined" && window.SKY_CONFIG ? window.SKY_CONFIG : null;
  }

  function bootWhenReady() {
    const cfg = getCfgNow();

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