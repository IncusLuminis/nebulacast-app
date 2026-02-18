// sky/widget.js
import { DEFAULTS } from "./core/sky.constants.js";
import { Data } from "./core/sky.data.js";
import { Layout } from "./core/sky.layout.js";
import { Prepare } from "./core/sky.prepare.js";
import { Render } from "./core/sky.render.js";
import { SkyUI } from "./core/sky.ui.js";

// New modular UI (one component per file)
import "../ui/components/side_toolbar.js";
import "../ui/components/bottom_toolbar.js";
import "../ui/components/popover.js";
import "../ui/components/modal.js";
import "../ui/components/player.js";

import { UI_ICONS } from "../ui/shared/icons.js";

import {
  deepMerge,
  loadRankingJson,
  pickTitle,
  fmtMaybeNumber,
  normLower,
  makeHighlightIdFromRaw,
  emojiForItem,
} from "./widgets/widget.utils.js";
import { el, toHTML } from "./widgets/widget.dom.js";
import {
  applyUIHighlight,
  setHighlightById,
  installHighlightMatcher,
} from "./widgets/widget.highlight.js";
import * as Popovers from "./widgets/widget.popovers.js";

(function () {
  "use strict";


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
    status.style.left = "50%";
    status.style.transform = "translateX(-50%)";
    status.style.bottom = "10px";
    status.style.zIndex = "5";
    status.style.pointerEvents = "none";
    status.style.whiteSpace = "nowrap";
    status.style.textAlign = "center";
    status.style.padding = "5px 14px";
    status.style.borderRadius = "10px";
    status.style.background = "var(--ui-surface, rgba(20,24,36,0.72))";
    status.style.border = "1px solid rgba(255,255,255,0.08)";
    status.style.backdropFilter = "blur(6px)";
    status.style.fontSize = "11px";

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

  // Highlight helper (global) used by Render.drawObjects()
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
      group && id ? `${group}:${id}` : null,
      group && name ? `${group}:${name}` : null,
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
      )
        kind = "object";
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

  function bestTimeISO(o) {
    return (
      o?.vis?.best_time_local_quality ||
      o?.vis?.best_time_local ||
      o?.best_time_local ||
      o?.best_time ||
      o?.time ||
      o?.datetime ||
      ""
    );
  }

  function scoreOf(o) {
    const v = Number(o?.score ?? o?.rank ?? o?.weight ?? o?.priority ?? 0);
    return Number.isFinite(v) ? v : 0;
  }
  
  function gradeOf(score) {
    if (score >= 800) return "Excellent";
    if (score >= 500) return "Good";
    if (score >= 300) return "Fair";
    return "Bad";
  }

  // ---- helpers for popover content (safe DOM -> html) ----


  async function init(userCfg) {
    const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), userCfg || {});
    installHighlightMatcher();
    cfg.options = cfg.options || {};

    // preserve old behavior: cardinals ON unless explicitly false
    if (cfg.options.showCardinals == null) cfg.options.showCardinals = true;

    // UI component toggles (config-driven)
    cfg.ui = cfg.ui || {};
    cfg.ui.components = cfg.ui.components || {};
    const UI_DEFAULTS = {
      sideToolbar: true,
      bottomToolbar: true,
      popover: true,
      modal: true,
      player: true,
    };
    function uiEnabled(name) {
      const v = cfg.ui?.components?.[name];
      return v == null ? UI_DEFAULTS[name] : !!v;
    }

    const mount = resolveMount(cfg);
    const { root, wrap, canvas, status } = makeRoot(mount);

    let ctx, viewport;
    ({ ctx, viewport } = Layout.setupCanvas(canvas, mount));

    // Keep existing tooltip for now (follows mouse)
    const tooltipEl = document.createElement("div");
    root.appendChild(tooltipEl);
    const tooltip = SkyUI.createTooltip(root, tooltipEl);

    // Modular UI components (custom elements) - optional
    const sideFs  = uiEnabled("sideToolbar") ? document.createElement("ui-side-toolbar") : null;
    const sidePop = uiEnabled("sideToolbar") ? document.createElement("ui-side-toolbar") : null;
    const bottom = uiEnabled("bottomToolbar") ? document.createElement("ui-bottom-toolbar") : null;

    // Three popovers (Ranking / Objects / Alerts)
    const popRanking = uiEnabled("popover") ? document.createElement("ui-popover") : null;
    const popObjects = uiEnabled("popover") ? document.createElement("ui-popover") : null;
    const popAlerts = uiEnabled("popover") ? document.createElement("ui-popover") : null;


    // NEW: position popovers inside widget root (canvas area), not viewport
    for (const p of [popRanking, popObjects, popAlerts].filter(Boolean)) {
      p.style.position = "absolute";   // overrides :host{position:fixed}
      p.style.left = "0px";
      p.style.top = "0px";
      p.style.zIndex = "1000";
    }

    const modalWC = uiEnabled("modal") ? document.createElement("ui-modal") : null;
    const player = uiEnabled("player") ? document.createElement("ui-player") : null;

    // Positioning (host level)
    if (sideFs) {
      sideFs.style.position = "absolute";
      sideFs.style.right = "14px";
      sideFs.style.top = "14px";
      sideFs.style.zIndex = "20";
    }

    if (sidePop) {
      sidePop.style.position = "absolute";
      sidePop.style.left = "14px";
      sidePop.style.top = "14px";
      sidePop.style.zIndex = "20";
    }

    // bottom aligned to bottom-right corner of canvas
    if (bottom) {
      bottom.style.position = "absolute";
      bottom.style.right = "14px";
      bottom.style.bottom = "14px";
      bottom.style.left = "auto";
      bottom.style.zIndex = "20";
    }

    if (player) {
      player.style.position = "absolute";
      player.style.left = "14px";
      player.style.bottom = "14px";
      player.style.zIndex = "20";
      player.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      // hidden from start
      player.style.opacity = "0";
      player.style.transform = "translateY(12px)";
      player.style.pointerEvents = "none";
    }

    if (bottom) {
      bottom.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      // hidden from start
      bottom.style.opacity = "0";
      bottom.style.transform = "translateY(12px)";
      bottom.style.pointerEvents = "none";
    }

    // ── Toggle-player button (bottom-left, just above player) ──
    const SVG_PLAYER_SHOW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>`;
    const SVG_PLAYER_HIDE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>`;

    // Player toggle — surface wrap + inner button styled like sidebar
    const wrapTogglePlayer = document.createElement("div");
    Object.assign(wrapTogglePlayer.style, {
      position: "absolute", left: "14px", bottom: "14px", zIndex: "21",
      padding: "10px", borderRadius: "12px",
      background: "var(--ui-surface, rgba(20,24,36,0.72))",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(6px)",
      transition: "bottom 0.25s ease",
      display: "flex", alignItems: "center", justifyContent: "center",
    });
    const btnTogglePlayer = document.createElement("div");
    btnTogglePlayer.title = "Show/hide player";
    btnTogglePlayer.innerHTML = SVG_PLAYER_HIDE;
    Object.assign(btnTogglePlayer.style, {
      width: "20px", height: "20px", borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "var(--ui-surface)", color: "var(--ui-fg)",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0",
    });
    btnTogglePlayer.querySelector("svg") && (btnTogglePlayer.querySelector("svg").style.width = "16px");
    wrapTogglePlayer.appendChild(btnTogglePlayer);

    // ── Toggle-bottom button (bottom-right, just above bottom toolbar) ──
    const SVG_LAYERS_SHOW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
    const SVG_LAYERS_HIDE = SVG_LAYERS_SHOW;

    // Bottom toolbar toggle — surface wrap + inner button styled like sidebar
    const wrapToggleBottom = document.createElement("div");
    Object.assign(wrapToggleBottom.style, {
      position: "absolute", right: "14px", bottom: "14px", zIndex: "21",
      padding: "10px", borderRadius: "12px",
      background: "var(--ui-surface, rgba(20,24,36,0.72))",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(6px)",
      transition: "bottom 0.25s ease",
      display: "flex", alignItems: "center", justifyContent: "center",
    });
    const btnToggleBottom = document.createElement("div");
    btnToggleBottom.title = "Show/hide layers";
    btnToggleBottom.innerHTML = SVG_LAYERS_SHOW;
    Object.assign(btnToggleBottom.style, {
      width: "20px", height: "20px", borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.10)",
      background: "var(--ui-surface)", color: "var(--ui-fg)",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0",
    });
    wrapToggleBottom.appendChild(btnToggleBottom);

    // Append only enabled ones
    root.append(...[sideFs, sidePop, bottom, popRanking, popObjects, popAlerts, modalWC, player].filter(Boolean));
    root.append(wrapTogglePlayer, wrapToggleBottom);

    // Right toolbar items (Ranking / Objects / Alerts)
    if (sideFs) {
      sideFs.items = [
        { id: "fullscreen", label: "Fullscreen", icon: UI_ICONS.fullscreen ?? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`, kind: "toggle", pressed: false },
      ];
    }

    if (sidePop) {
      sidePop.baseUrl = cfg.baseUrl;
      sidePop.items = [
        { id: "ranking", label: "Ranking", icon: UI_ICONS.ranking, kind: "action" },
        { id: "alerts",  label: "Alerts",  icon: UI_ICONS.alerts,  kind: "action" },
      ];
    }

    function closePopovers() {
      try { if (popRanking && typeof popRanking.close === "function") popRanking.close(); } catch (_) {}
      try { if (popAlerts && typeof popAlerts.close === "function") popAlerts.close(); } catch (_) {}
    }

    function syncUIFromCfg() {
      // bottom owns ALL visibility toggles
      if (!bottom) return;

      const showSunMoon = cfg.options.showSunMoon === false ? false : true;
      const showPlanets = cfg.options.showPlanets === false ? false : true;

      bottom.setPressed("showObjects", !!cfg.options.showObjects);
      bottom.setPressed("showAlerts", !!cfg.options.showAlerts);
      bottom.setPressed("showMessier", !!cfg.options.showMessier);
      bottom.setPressed("showSunMoon", showSunMoon);
      bottom.setPressed("showPlanets", showPlanets);
      bottom.setPressed("showConstellations", !!cfg.options.showConstellations);

      bottom.setPressed("showGridAz", !!cfg.options.showGridAz);
      bottom.setPressed("showGridEq", !!cfg.options.showGridEq);
      bottom.setPressed("showMeridian", !!cfg.options.showMeridian);
      bottom.setPressed("showEquator", !!cfg.options.showEquator);
      bottom.setPressed("showEcliptic", !!cfg.options.showEcliptic);
      bottom.setPressed("showMilkyWay", !!cfg.options.showMilkyWay);
      bottom.setPressed("showCardinals", cfg.options.showCardinals !== false);
    }

    // Bottom toolbar: ALL VISIBILITY toggles (layers + overlays)
    if (bottom) {
      bottom.setAttribute("dense", "");
      bottom.items = [
        // layers visibility
        { id: "showObjects", title: "Objects", kind: "toggle", pressed: !!cfg.options.showObjects, icon: UI_ICONS.objects },
        { id: "showAlerts", title: "Alerts", kind: "toggle", pressed: !!cfg.options.showAlerts, icon: UI_ICONS.alerts },
        { id: "showMessier", title: "Messier", kind: "toggle", pressed: !!cfg.options.showMessier, icon: UI_ICONS.messier },
        { id: "showSunMoon", title: "Sun/Moon", kind: "toggle", pressed: cfg.options.showSunMoon !== false, icon: UI_ICONS.sun_moon },
        { id: "showPlanets", title: "Planets", kind: "toggle", pressed: cfg.options.showPlanets !== false, icon: UI_ICONS.planets },
        { id: "showConstellations", title: "Constellations", kind: "toggle", pressed: !!cfg.options.showConstellations, icon: UI_ICONS.constellations },

        // overlays / guides
        { id: "showGridAz", title: "Az grid", kind: "toggle", pressed: !!cfg.options.showGridAz, icon: UI_ICONS.grid_az },
        { id: "showGridEq", title: "Eq grid", kind: "toggle", pressed: !!cfg.options.showGridEq, icon: UI_ICONS.grid_eq },
        { id: "showMeridian", title: "Meridian", kind: "toggle", pressed: !!cfg.options.showMeridian, icon: UI_ICONS.meridian },
        { id: "showEquator", title: "Equator", kind: "toggle", pressed: !!cfg.options.showEquator, icon: UI_ICONS.equator },
        { id: "showEcliptic", title: "Ecliptic", kind: "toggle", pressed: !!cfg.options.showEcliptic, icon: UI_ICONS.ecliptic },
        { id: "showMilkyWay", title: "Milky Way", kind: "toggle", pressed: !!cfg.options.showMilkyWay, icon: UI_ICONS.milkyway },
        { id: "showCardinals", title: "Cardinals", kind: "toggle", pressed: cfg.options.showCardinals !== false, icon: UI_ICONS.cardinals },
      ];
    }

    function setOpt(key, val) {
      cfg.options = cfg.options || {};
      cfg.options[key] = val;
      recomputeAll();
      render();
    }

    function setTimeISO(datetimeISO) {
      if (!datetimeISO) return;
      cfg.datetimeISO = String(datetimeISO);
      recomputeAll();
      render();
    }

    // Bottom toolbar events: toggles for everything
    if (sideFs) {
      sideFs.addEventListener("toolbar:toggle", (e) => {
        const { id } = e.detail || {};
        if (id === "fullscreen") toggleFullscreen();
      });
    }

    if (bottom) {
      bottom.addEventListener("toolbar:toggle", (e) => {
        const { id, pressed } = e.detail || {};
        if (!id) return;

        if (id === "showSunMoon") { setOpt("showSunMoon", pressed ? true : false); return; }
        if (id === "showPlanets") { setOpt("showPlanets", pressed ? true : false); return; }
        if (id === "showCardinals") { setOpt("showCardinals", pressed ? true : false); return; }

        setOpt(id, !!pressed);
      });
    }

    // ---- DATA LOAD ----
    let starCatalog = null;
    let constellations = null;
    let milkyway = null;
    let objectsToday = null;
    let alertsToday = null;
    let sunMoon = null;
    let planets = null;
    let messierJson = null;
    let rankingJson = null;

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

      status.textContent = "Loading ranking…";
      rankingJson = await loadRankingJson(cfg.baseUrl);
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
        typeof window !== "undefined" && window.__skyHighlight && window.__skyHighlight.id != null
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

      if (
        cfg.options?.showMessier &&
        typeof Render.drawMessier === "function" &&
        messierPrepared &&
        messierPrepared.length
      ) {
        Render.drawMessier(ctx, viewport, messierPrepared);
      }

      if (cfg.options?.showObjects && objectsPrepared.length) Render.drawObjects(ctx, viewport, objectsPrepared);

      Render.flushLabels(ctx, viewport);

      ctx.restore();

      Render.drawHorizon(ctx, viewport);

      if (cfg.options?.showCardinals !== false) {
        Render.drawCardinals(ctx, viewport);
      }

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

    // Animation loop (only while highlight is active)
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
          render();
          return;
        }
        render();
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    }

    function setHighlightById(hid, ms = 3200) {
      const id = String(hid || "").trim();
      if (!id) return;

      window.__skyHighlight = { id, until: Date.now() + ms };
      recomputeAll();
      render();
      startAnim();
    }

    function update(patch) {
      if (!patch) return;

      deepMerge(cfg, patch);
      cfg.options = cfg.options || {};
      if (cfg.options.showCardinals == null) cfg.options.showCardinals = true;

      cfg.ui = cfg.ui || {};
      cfg.ui.components = cfg.ui.components || {};

      applyUIHighlight(patch);

      recomputeAll();
      render();
      syncUIFromCfg();

      if (isHighlightActive()) startAnim();
    }


    // ---------- MODAL: all objects — table layout ----------
    function buildAllObjectsModalContent() {
      const src = Array.isArray(objectsToday)
        ? objectsToday
        : (objectsToday?.items || objectsToday?.objects || []);
      const arr = Array.isArray(src) ? src.slice() : [];

      if (!arr.length) {
        const wrap = el("div", { style: "padding:24px;opacity:0.5;text-align:center", text: "No objects." });
        return toHTML(wrap);
      }

      // Group + sort
      const groupOf = (o) => {
        const t = normLower(o?.group || o?.type || o?.kind || o?.subtype || "");
        if (t.includes("calendar")) return "calendar";
        if (t.includes("planet") || t.includes("sun") || t.includes("moon")) return "planets";
        if (normLower(o?.meta?.planet_key || "").length) return "planets";
        return "dso";
      };
      const byScoreDesc = (a, b) => scoreOf(b) - scoreOf(a);
      const calendar = [], planetsList = [], dso = [];
      for (const o of arr) {
        const g = groupOf(o);
        if (g === "calendar") calendar.push(o);
        else if (g === "planets") planetsList.push(o);
        else dso.push(o);
      }
      calendar.sort(byScoreDesc);
      planetsList.sort(byScoreDesc);
      dso.sort(byScoreDesc);
      const sorted = [...calendar, ...planetsList, ...dso];

      // Formatters
      const fmtTimeLocal = (x) => {
        if (!x) return "—";
        const m = String(x).match(/T(\d{2}:\d{2})/);
        return m ? m[1] : String(x);
      };
      const fmtMagVal  = (o) => { const v = fmtMaybeNumber(o?.mag ?? o?.vmag ?? o?.magnitude, 1); return v != null ? String(v) : "—"; };
      const fmtAltVal  = (o) => {
        const v = fmtMaybeNumber(o?.vis?.max_alt_deg ?? o?.vis?.max_alt_deg_quality ?? o?.max_alt_deg ?? o?.altDeg ?? o?.alt ?? o?.altitude, 0);
        return v != null ? `${v}°` : "—";
      };
      const gradeColor = (g) => ({ Excellent: "#4caf50", Good: "#2196f3", Fair: "#ffc107", Bad: "#9e9e9e" }[g] || "#9e9e9e");

      // Shared cell style
      const C  = "border:1px solid rgba(255,255,255,0.10);border-radius:8px;padding:6px 10px;";
      const CH = C + "opacity:0.45;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;text-align:center;";

      // Table wrapper — build as HTML string, toHTML wraps it in a node
      const GRID = "display:grid;grid-template-columns:44px 1fr 72px 56px 56px 100px;gap:5px;";
      const C2   = "border:1px solid rgba(255,255,255,0.10);border-radius:8px;padding:6px 10px;";
      const CH2  = C2 + "opacity:0.45;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;text-align:center;";

      let html = `<div style="padding:4px 2px;">`;

      // Header
      html += `<div style="${GRID}gap:5px;margin-bottom:5px;padding:0 2px;">`;
      for (const label of ["Group", "Object", "Time", "Mag", "Alt", "Conditions"]) {
        html += `<div style="${CH2}">${label}</div>`;
      }
      html += `</div>`;

      // Rows
      for (const o of sorted) {
        const hid   = (makeHighlightIdFromRaw(o) || "").replace(/"/g, "&quot;");
        const tISO  = (bestTimeISO(o) || "").replace(/"/g, "&quot;");
        const name  = ((o?.name || o?.target_name) ? String(o.name || o.target_name) : pickTitle(o)).replace(/</g,"&lt;");
        const time  = fmtTimeLocal(tISO);
        const mag   = fmtMagVal(o);
        const alt   = fmtAltVal(o);
        const grade = gradeOf(scoreOf(o));
        const color = gradeColor(grade);
        const emoji = emojiForItem(o);

        const cellStyle = (extra = "") => `${C2}${extra}`;

        html += `<div style="${GRID}gap:5px;margin-bottom:4px;padding:0 2px;cursor:pointer;" data-hid="${hid}" data-time="${tISO}">`;
        html += `<div style="${cellStyle("text-align:center;font-size:18px;line-height:1;")}">${emoji}</div>`;
        html += `<div style="${cellStyle("font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}">${name}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;")}">${time}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;")}">${mag}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;")}">${alt}</div>`;
        html += `<div style="${cellStyle("display:flex;align-items:center;gap:7px;font-size:12px;")}">`;
        html += `<span style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>`;
        html += `<span>${grade}</span></div>`;
        html += `</div>`;
      }

      html += `</div>`;

      const wrap = el("div", {});
      wrap.innerHTML = html;

      // Wire hover on rows after DOM is built
      wrap.querySelectorAll("[data-hid]").forEach(row => {
        row.addEventListener("mouseenter", () => row.style.filter = "brightness(1.25)");
        row.addEventListener("mouseleave", () => row.style.filter = "");
      });

      return toHTML(wrap);
    }

    function buildAllAlertsModalContent() {
      const src = Array.isArray(alertsToday)
        ? alertsToday
        : (alertsToday?.items || alertsToday?.alerts || []);
      const arr = Array.isArray(src) ? src.slice() : [];

      if (!arr.length) {
        const wrap = el("div", { style: "padding:24px;opacity:0.5;text-align:center", text: "No alerts." });
        return toHTML(wrap);
      }

      // Sort: score desc, then updated_utc desc
      arr.sort((a, b) => {
        const sa = Number(a?.score_norm ?? a?.score_raw ?? 0);
        const sb = Number(b?.score_norm ?? b?.score_raw ?? 0);
        if (sa !== sb) return sb - sa;
        const ta = Date.parse(a?.updated_utc || "");
        const tb = Date.parse(b?.updated_utc || "");
        if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
        return 0;
      });

      // Formatters
      const pad2 = (n) => String(n).padStart(2, "0");
      const fmtRA = (ra) => {
        const v = Number(ra);
        if (!Number.isFinite(v)) return "—";
        const totalSec = (v / 15) * 3600;
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        return `${pad2(hh)}h${pad2(mm)}m`;
      };
      const fmtDEC = (dec) => {
        const v = Number(dec);
        if (!Number.isFinite(v)) return "—";
        const sign = v >= 0 ? "+" : "−";
        const a = Math.abs(v);
        const dd = Math.floor(a);
        const mm = Math.floor((a - dd) * 60);
        return `${sign}${dd}°${pad2(mm)}′`;
      };
      const fmtScore = (a) => {
        const s = Number(a?.score_norm ?? a?.score_raw);
        return Number.isFinite(s) ? s.toFixed(2) : "—";
      };
      const categoryFromSource = (src) => {
        if (!src) return "Unknown";
        const s = String(src).toLowerCase();
        if (s.includes("tocp")) return "Transient";
        if (s.includes("grb_fermi")) return "GRB";
        if (s.includes("neocp")) return "Minor Planet";
        return src.toUpperCase();
      };

      // Table
      const GRID = "display:grid;grid-template-columns:56px 1fr 80px 80px 120px 80px;gap:5px;";
      const C2   = "border:1px solid rgba(255,255,255,0.10);border-radius:8px;padding:6px 10px;";
      const CH2  = C2 + "opacity:0.45;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;text-align:center;";

      let html = `<div style="padding:4px 2px;">`;
      html += `<div style="${GRID}gap:5px;margin-bottom:5px;padding:0 2px;">`;
      for (const label of ["Type", "Object", "RA", "DEC", "Category", "Score"]) {
        html += `<div style="${CH2}">${label}</div>`;
      }
      html += `</div>`;

      for (const a of arr) {
        const hid   = (makeHighlightIdFromRaw(a) || "").replace(/"/g, "&quot;");
        const title = ((a?.meta?.title || a?.id || "Alert")).replace(/</g,"&lt;");
        const emoji = emojiForAlert(a);
        const ra    = fmtRA(a?.ra_deg);
        const dec   = fmtDEC(a?.dec_deg);
        const cat   = categoryFromSource(a?.source);
        const score = fmtScore(a);

        const cellStyle = (extra = "") => `${C2}${extra}`;

        html += `<div style="${GRID}gap:5px;margin-bottom:4px;padding:0 2px;cursor:pointer;" data-hid="${hid}">`;
        html += `<div style="${cellStyle("text-align:center;font-size:18px;line-height:1;")}">${emoji}</div>`;
        html += `<div style="${cellStyle("font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}">${title}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;")}">${ra}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;")}">${dec}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:11px;")}">${cat}</div>`;
        html += `<div style="${cellStyle("text-align:center;font-size:12px;font-variant-numeric:tabular-nums;font-weight:600;")}">${score}</div>`;
        html += `</div>`;
      }

      html += `</div>`;

      const wrap = el("div", {});
      wrap.innerHTML = html;

      wrap.querySelectorAll("[data-hid]").forEach(row => {
        row.addEventListener("mouseenter", () => row.style.filter = "brightness(1.25)");
        row.addEventListener("mouseleave", () => row.style.filter = "");
      });

      return toHTML(wrap);
    }

        function wireAllObjectsModalClicks() {
      if (!modalWC || !modalWC.shadowRoot) return;
      const host = modalWC.shadowRoot.querySelector(".body");
      if (!host) return;

      host.onclick = (e) => {
        const row = e.target && e.target.closest ? e.target.closest("[data-hid]") : null;
        if (!row) return;

        const hid = row.getAttribute("data-hid");
        if (!hid) return;

        try { if (modalWC && typeof modalWC.close === "function") modalWC.close(); } catch (_) {}

        const tISO = row.getAttribute("data-time");
        if (tISO) setTimeISO(tISO);

        setHighlightById(hid, 3600);
      };
    }

    function openAllObjectsModal() {
      if (!modalWC) return;
      modalWC.open({
        title: "Best Objects this night",
        content: buildAllObjectsModalContent(),
      });
      requestAnimationFrame(() => wireAllObjectsModalClicks());
    }

    // --------- POPOVER: Ranking (TOP 7) ----------
    function openAllAlertsModal() {
      if (!modalWC) return;
      modalWC.open({
        title: "All Alerts",
        content: buildAllAlertsModalContent(),
      });
      requestAnimationFrame(() => wireAllObjectsModalClicks());
    }

        function buildRankingContent7() {
      const items =
        Array.isArray(rankingJson?.items) ? rankingJson.items :
        Array.isArray(rankingJson) ? rankingJson :
        [];

      const top = items.slice(0, 7);

      const calendar = [];
      const planetsRank = [];
      const dsoRank = [];

      for (const o of top) {
        const t = normLower(o?.group || o?.type || o?.kind || "");
        if (t.includes("calendar")) calendar.push(o);
        else if (t.includes("planet") || t.includes("sun") || t.includes("moon")) planetsRank.push(o);
        else dsoRank.push(o);
      }

      const root = el("div", { class: "sky-pop-ranking" });

      root.appendChild(
        el(
          "div",
          { class: "sky-pop-header" },
          el("div", { class: "sky-pop-title", text: "TOP 7 objects of the night" }),
          el("button", { class: "sky-pop-showall-btn", type: "button" }, "Show All")
        )
      );

      if (!top.length) {
        root.appendChild(el("div", { class: "sky-pop-empty", text: "No ranking data." }));
        return { html: toHTML(root), hasFooterBtn: false };
      }

      function fmtTimeLocal(x) {
        if (!x) return "—";
        const s = String(x);
        const m = s.match(/T(\d{2}:\d{2})/);
        return m ? m[1] : s;
      }

      function fmtMag(o) {
        const v = fmtMaybeNumber(o?.mag, 2);
        return v != null ? `mag ${v}` : "mag —";
      }

      function fmtAlt(o) {
        const v = fmtMaybeNumber(o?.vis?.max_alt_deg ?? o?.vis?.max_alt_deg_quality ?? o?.altDeg ?? o?.alt, 0);
        return v != null ? `alt ${v}°` : "alt —";
      }

      function fmtRA(o) {
        const ra = Number(o?.ra_deg);
        if (!Number.isFinite(ra)) return "RA —";
        const totalSec = (ra / 15) * 3600;
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = Math.floor(totalSec % 60);
        const pad2 = (n) => String(n).padStart(2, "0");
        return `RA ${pad2(hh)}h${pad2(mm)}m${pad2(ss)}s`;
      }

      function fmtDEC(o) {
        const dec = Number(o?.dec_deg);
        if (!Number.isFinite(dec)) return "DEC —";
        const sign = dec >= 0 ? "+" : "−";
        const a = Math.abs(dec);
        const dd = Math.floor(a);
        const mm = Math.floor((a - dd) * 60);
        const ss = Math.floor((((a - dd) * 60) - mm) * 60);
        const pad2 = (n) => String(n).padStart(2, "0");
        return `DEC ${sign}${dd}°${pad2(mm)}′${pad2(ss)}″`;
      }

      function fmtScore(o) {
        const v = fmtMaybeNumber(scoreOf(o), 2);
        return v != null ? `score ${v}` : "score —";
      }

      function buildRow(o) {
        const hid = makeHighlightIdFromRaw(o);
        const name = (o && (o.name || o.target_name)) ? String(o.name || o.target_name) : pickTitle(o);

        const note = String(o?.note || "").trim();
        const tISO = bestTimeISO(o);
        const best = fmtTimeLocal(tISO);

        const grp = normLower(o?.group || o?.type || o?.kind || "");
        const emoji = grp.includes("calendar") ? "📅" : emojiForItem(o);

        const row = el(
          "div",
          { class: "sky-pop-item--ranking", "data-hid": hid || "", "data-time": tISO || "" },

          el(
            "div",
            { class: "sky-pop-line1" },
            el("span", { class: "sky-pop-emoji", text: emoji }),
            el("span", { class: "sky-pop-name", text: name })
          ),

          note ? el("div", { class: "sky-pop-note", text: note }) : null,

          el(
            "div",
            { class: "sky-pop-meta2" },
            el("span", { class: "sky-pop-chip", text: `Culmination ${best !== "—" ? best : "—"}` }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtMag(o) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtAlt(o) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtRA(o) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtDEC(o) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip sky-pop-chip--score", text: fmtScore(o) })
          )
        );

        row.replaceChildren(...Array.from(row.childNodes).filter(Boolean));
        return row;
      }

      // no "Calendar/Planets/DSO" headers — just order
      for (const o of calendar) root.appendChild(buildRow(o));
      for (const o of planetsRank) root.appendChild(buildRow(o));
      for (const o of dsoRank) root.appendChild(buildRow(o));

      return { html: toHTML(root), hasFooterBtn: true };
    }

    function wireModalClicks() {
      if (!modalWC || !modalWC.shadowRoot) return;
      // В modal.css.js контент живёт в .body
      const host = modalWC.shadowRoot.querySelector(".body");
      if (!host) return;

      host.onclick = (e) => {
        const row = e.target && e.target.closest ? e.target.closest("[data-hid]") : null;
        if (!row) return;

        const hid = row.getAttribute("data-hid");
        if (!hid) return;

        // 1) закрыть модал
        try { if (modalWC && typeof modalWC.close === "function") modalWC.close(); } catch (_) {}

        // 2) повернуть время (если есть)
        const tISO = row.getAttribute("data-time");
        if (tISO) setTimeISO(tISO);

        // 3) подсветить
        setHighlightById(hid, 3600);
      };
    }

    function buildObjectsRankingContent() {
      const src = Array.isArray(objectsToday)
        ? objectsToday
        : (objectsToday?.items || objectsToday?.objects || []);
      const arr = Array.isArray(src) ? src.slice() : [];

      // heuristic sorting: score/rank/weight/priority if present
      arr.sort((a, b) => {
        const ka = (a?.rank ?? a?.score ?? a?.weight ?? a?.priority);
        const kb = (b?.rank ?? b?.score ?? b?.weight ?? b?.priority);
        const na = Number(ka);
        const nb = Number(kb);
        if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
        if (Number.isFinite(na)) return -1;
        if (Number.isFinite(nb)) return 1;
        return 0;
      });

      const root = el("div", { class: "sky-pop-list" });

      if (!arr.length) {
        root.appendChild(el("div", { class: "sky-pop-empty", text: "No objects." }));
        return toHTML(root);
      }

      const list = el("div", { class: "sky-pop-items" });
      const limit = Math.min(arr.length, 100);

      for (let i = 0; i < limit; i++) {
        const o = arr[i];
        const title = pickTitle(o);
        const score = fmtMaybeNumber(o?.rank ?? o?.score ?? o?.weight ?? o?.priority, 2);

        const mag = fmtMaybeNumber(o?.mag ?? o?.vmag ?? o?.magnitude, 1);
        const alt = fmtMaybeNumber(o?.alt ?? o?.altDeg ?? o?.altitude, 0);

        const hid = makeHighlightIdFromRaw(o);

        const line = el(
          "div",
          { class: "sky-pop-item", "data-hid": hid || "" },
          el("div", { class: "sky-pop-item-left" },
            el("span", { class: "sky-pop-emoji", text: "⭐" }),
            el("div", { class: "sky-pop-item-title", text: `${i + 1}. ${title}` })
          ),
          el("div", { class: "sky-pop-item-meta" },
            el("span", { class: "sky-pop-badge", text: score != null ? `score ${score}` : "score —" }),
            el("span", { class: "sky-pop-sep", text: (mag != null || alt != null) ? " · " : "" }),
            el("span", { class: "sky-pop-meta", text: mag != null ? `mag ${mag}` : "" }),
            el("span", { class: "sky-pop-sep", text: (mag != null && alt != null) ? " · " : "" }),
            el("span", { class: "sky-pop-meta", text: alt != null ? `alt ${alt}°` : "" })
          )
        );

        list.appendChild(line);
      }

      root.appendChild(list);
      return toHTML(root);
    }


    function emojiForAlert(a) {
      const g = String(a?.group || a?.type || "").toLowerCase();
      const s = String(a?.source || "").toLowerCase();
    
      // ---- group/type first (most "semantic") ----
      if (g.includes("transient")) return "💥";
      if (g.includes("supernova") || g.includes("sn")) return "💫";
      if (g.includes("nova")) return "✨";
      if (g.includes("variable") || g.includes("var")) return "📈";
      if (g.includes("comet")) return "☄️";
      if (g.includes("asteroid") || g.includes("minor")) return "🪨";
      if (g.includes("occult")) return "🌘";
      if (g.includes("meteor")) return "🌠";
      if (g.includes("satellite") || g.includes("iss")) return "🛰️";
      if (g.includes("conjunction")) return "🪐";
      if (g.includes("eclipse")) return "🌑";
      if (g.includes("storm") || g.includes("geomag") || g.includes("aurora")) return "🧲";
    
      // ---- source second (data provenance) ----
      if (s.includes("tocp")) return "💥";      // TOCP often = transient candidates
      if (s.includes("aavso")) return "📈";     // variable star network
      if (s.includes("mpc")) return "🪨";       // Minor Planet Center
      if (s.includes("gcn") || s.includes("fermi") || s.includes("swift")) return "🚨";
      if (s.includes("gaia")) return "🛰️";
      if (s.includes("tess") || s.includes("kepler")) return "🪐";
    
      // ---- fallback ----
      return "⚠️";
    }


    function buildAlertsListContent() {
      const src = Array.isArray(alertsToday)
        ? alertsToday
        : (alertsToday?.items || alertsToday?.alerts || []);
      const arr = Array.isArray(src) ? src.slice() : [];
    
      const root = el("div", { class: "sky-pop-ranking" });
    
      root.appendChild(
        el(
          "div",
          { class: "sky-pop-header" },
          el("div", { class: "sky-pop-title", text: "Alerts" }),
          el("button", { class: "sky-pop-showall-btn", type: "button" }, "Show All")
        )
      );
    
      if (!arr.length) {
        root.appendChild(el("div", { class: "sky-pop-empty", text: "No alerts." }));
        return toHTML(root);
      }
    
      // сортировка: score_norm desc, затем updated
      arr.sort((a, b) => {
        const sa = Number(a?.score_norm ?? a?.score_raw ?? 0);
        const sb = Number(b?.score_norm ?? b?.score_raw ?? 0);
        if (sa !== sb) return sb - sa;
    
        const ta = Date.parse(a?.updated_utc || "");
        const tb = Date.parse(b?.updated_utc || "");
        if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
        return 0;
      });
    
      const pad2 = (n) => String(n).padStart(2, "0");
    
      function fmtRA(ra) {
        const v = Number(ra);
        if (!Number.isFinite(v)) return "RA —";
        const totalSec = (v / 15) * 3600;
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = Math.floor(totalSec % 60);
        return `RA ${pad2(hh)}h${pad2(mm)}m${pad2(ss)}s`;
      }
    
      function fmtDEC(dec) {
        const v = Number(dec);
        if (!Number.isFinite(v)) return "DEC —";
        const sign = v >= 0 ? "+" : "−";
        const a = Math.abs(v);
        const dd = Math.floor(a);
        const mm = Math.floor((a - dd) * 60);
        const ss = Math.floor((((a - dd) * 60) - mm) * 60);
        return `DEC ${sign}${dd}°${pad2(mm)}′${pad2(ss)}″`;
      }
    
      function fmtScore(a) {
        const s = Number(a?.score_norm ?? a?.score_raw);
        return Number.isFinite(s) ? `score ${s.toFixed(2)}` : "score —";
      }
    
      function fmtObsDate(a) {
        return a?.meta?.observation_date
          ? `Obs ${a.meta.observation_date}`
          : "Obs —";
      }
    
      function categoryFromSource(src) {
        if (!src) return "unknown";
        const s = String(src).toLowerCase();
        if (s.includes("tocp")) return "Transient (TOCP)";
        if (s.includes("grb_fermi")) return "Gamma Ray Burst (FERMI)";
        if (s.includes("neocp")) return "Minor Planet (NEOCP)";
        return s.toUpperCase();
      }
    
      function buildRow(a) {
        const hid = makeHighlightIdFromRaw(a);
        const title = a?.meta?.title || a?.id || "Alert";
    
        const note = String(a?.note || "").trim();
        const emoji = emojiForAlert(a);

        return el(
          "div",
          {
            class: "sky-pop-item--ranking",
            "data-hid": hid || "",
          },
    
          // line 1
          el(
            "div",
            { class: "sky-pop-line1" },
            el("span", { class: "sky-pop-emoji", text: emoji }),
            el("span", { class: "sky-pop-name", text: title }),
            el("span", { class: "sky-pop-name", text: "   " }),
            el("span", { class: "sky-pop-chip", text: categoryFromSource(a?.source) }),
          ),
    
          // optional note
          note ? el("div", { class: "sky-pop-note", text: note }) : null,
    
          // meta
          el(
            "div",
            { class: "sky-pop-meta2" },
            el("span", { class: "sky-pop-chip", text: fmtRA(a?.ra_deg) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtDEC(a?.dec_deg) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip", text: fmtObsDate(a) }),
            el("span", { class: "sky-pop-dot", text: "·" }),
            el("span", { class: "sky-pop-chip sky-pop-chip--score", text: fmtScore(a) })
          )
        );
      }
    
      const LIMIT = 5;
      for (let i = 0; i < Math.min(arr.length, LIMIT); i++) {
        root.appendChild(buildRow(arr[i]));
      }
    
      return toHTML(root);
    }


    function wirePopoverClicks(pop, { onShowAll } = {}) {
      if (!pop) return;
      const sr = pop.shadowRoot;
      if (!sr) return;

      // .content is the direct parent of the injected innerHTML — always present
      const container = sr.querySelector(".content") || sr.querySelector(".panel") || sr;

      if (pop._skyClickHandler) {
        container.removeEventListener("click", pop._skyClickHandler);
      }

      pop._skyClickHandler = (e) => {
        const btn = e.target?.closest?.(".sky-pop-showall-btn");
        if (btn) {
          try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
          if (typeof onShowAll === "function") onShowAll();
          return;
        }

        const row = e.target?.closest?.("[data-hid]");
        if (!row) return;

        const hid = row.getAttribute("data-hid");
        if (!hid) return;

        try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
        const tISO = row.getAttribute("data-time");
        if (tISO) setTimeISO(tISO);
        setHighlightById(hid, 3600);
      };

      container.addEventListener("click", pop._skyClickHandler);
    }


    function openRankingPopover(anchorEl) {
      if (!popRanking || typeof popRanking.open !== "function") return;
      try { if (popObjects && typeof popObjects.close === "function") popObjects.close(); } catch (_) {}
      try { if (popAlerts && typeof popAlerts.close === "function") popAlerts.close(); } catch (_) {}

      const res = buildRankingContent7();
      popRanking.content = res.html;
      popRanking.open(anchorEl, { placement: "left", offset: 10, boundaryEl: root });
      requestAnimationFrame(() => {
        wirePopoverClicks(popRanking, { onShowAll: () => openAllObjectsModal() });
      });
    }

    function openObjectsPopover(anchorEl) {
      if (!popObjects || typeof popObjects.open !== "function") return;
      try { if (popRanking && typeof popRanking.close === "function") popRanking.close(); } catch (_) {}
      try { if (popAlerts && typeof popAlerts.close === "function") popAlerts.close(); } catch (_) {}

      popObjects.content = buildObjectsRankingContent();
      popObjects.open(anchorEl, { placement: "left", offset: 10, boundaryEl: root });
      requestAnimationFrame(() => {
        wirePopoverClicks(popObjects, { onShowAll: () => openAllObjectsModal() });
      });
    }

    function openAlertsPopover(anchorEl) {
      if (!popAlerts || typeof popAlerts.open !== "function") return;
      try { if (popRanking && typeof popRanking.close === "function") popRanking.close(); } catch (_) {}
      try { if (popObjects && typeof popObjects.close === "function") popObjects.close(); } catch (_) {}

      popAlerts.content = buildAlertsListContent();
      popAlerts.open(anchorEl, { placement: "left", offset: 10, boundaryEl: root });
      requestAnimationFrame(() => {
        wirePopoverClicks(popAlerts, { onShowAll: () => openAllAlertsModal() });
      });
    }

    if (sidePop) {
      sidePop.addEventListener("toolbar:action", (e) => {
        const { id, anchorEl } = e.detail || {};
        if (!id || !anchorEl) return;
        if (id === "ranking") openRankingPopover(anchorEl);
        if (id === "alerts")  openAlertsPopover(anchorEl);
      });
    }

    function _fsTarget() {
      return document.getElementById("skyStage") || root;
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        _fsTarget().requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    document.addEventListener("fullscreenchange", () => {
      const isFs = !!document.fullscreenElement;
      if (sideFs) sideFs.setPressed("fullscreen", isFs);
    });

    // ── Player visibility toggle ──
    // Player height: ~84px. Button stays fixed at EDGE, player slides up from below.
    const PLAYER_H = 84;
    const EDGE = 14;
    // Button stays at EDGE always
    wrapTogglePlayer.style.bottom = EDGE + "px";
    
    let _playerVisible = false;
    btnTogglePlayer.innerHTML = SVG_PLAYER_SHOW;
    btnTogglePlayer.style.background = "var(--ui-accent, #4a6fa5)";
    btnTogglePlayer.addEventListener("click", () => {
      _playerVisible = !_playerVisible;
      if (player) {
        player.style.opacity = _playerVisible ? "1" : "0";
        // Slide up from below, visible position is -32px to clear the button
        player.style.transform = _playerVisible ? "translateY(-32px)" : "translateY(100px)";
        player.style.pointerEvents = _playerVisible ? "" : "none";
      }
      btnTogglePlayer.innerHTML = _playerVisible ? SVG_PLAYER_HIDE : SVG_PLAYER_SHOW;
      btnTogglePlayer.style.background = _playerVisible ? "var(--ui-surface)" : "var(--ui-accent, #4a6fa5)";
    });

    // ── Bottom toolbar visibility toggle ──
    // Bottom toolbar height: ~48px. Button stays fixed at EDGE, toolbar slides up from below.
    const BOTTOM_H = 48;
    // Button stays at EDGE always
    wrapToggleBottom.style.bottom = EDGE + "px";
    
    let _bottomVisible = false;
    btnToggleBottom.style.background = "var(--ui-accent, #4a6fa5)";
    btnToggleBottom.addEventListener("click", () => {
      _bottomVisible = !_bottomVisible;
      if (bottom) {
        bottom.style.opacity = _bottomVisible ? "1" : "0";
        // Slide up from below, visible position is -32px to clear the button
        bottom.style.transform = _bottomVisible ? "translateY(-32px)" : "translateY(100px)";
        bottom.style.pointerEvents = _bottomVisible ? "" : "none";
      }
      btnToggleBottom.style.background = _bottomVisible ? "var(--ui-surface)" : "var(--ui-accent, #4a6fa5)";
    });

    function openHitModal(hit) {
      if (!hit) return;
      const html = SkyUI.tooltipHTML(hit);
      if (modalWC) {
        modalWC.open({ title: "Details", content: html });
        requestAnimationFrame(() => wireModalClicks());
      } else {
        console.log("Hit:", hit);
      }
    }

    // ---- PLAYER: time engine ----
    // The window is fixed once at init from the data range (9 days).
    // It never shifts — scrubber position is always relative to this fixed window.
    let _playerPlaying = false;
    let _playerRafId = 0;
    // Speed: 1 real second of playback = 30 sky minutes
    const PLAYER_SPEED_MIN_PER_SEC = 30;
    const STEP_MINUTES = 60;

    // Fixed window: computed once from data. Falls back to now ± 4.5 days.
    function buildDataWindow() {
      // Try to derive range from loaded data timestamps
      let earliest = Infinity;
      let latest = -Infinity;

      const sources = [
        objectsToday, alertsToday, rankingJson?.items ?? rankingJson
      ];
      for (const src of sources) {
        const arr = Array.isArray(src) ? src : (src?.items || src?.objects || src?.alerts || []);
        for (const o of (Array.isArray(arr) ? arr : [])) {
          const iso = bestTimeISO(o);
          if (iso) {
            const t = Date.parse(iso);
            if (Number.isFinite(t)) {
              if (t < earliest) earliest = t;
              if (t > latest) latest = t;
            }
          }
        }
      }

      // If we found a real range, expand it to include: now -2 days to now +7 days
      if (Number.isFinite(earliest) && Number.isFinite(latest) && latest > earliest) {
        const now = Date.now();
        const expandedStart = Math.min(earliest - 3600_000, now - 2 * 24 * 3600_000);
        const expandedEnd = Math.max(latest + 3600_000, now + 7 * 24 * 3600_000);
        return { start: expandedStart, end: expandedEnd };
      }

      // Fallback: now -2 days to now +7 days (9 days total)
      const now = Date.now();
      return { 
        start: now - 2 * 24 * 3600_000, 
        end: now + 7 * 24 * 3600_000 
      };
    }

    // Fixed once — never recomputed
    const _dataWindow = buildDataWindow();
    console.log("[Player] Data window:", new Date(_dataWindow.start), "to", new Date(_dataWindow.end));
    console.log("[Player] Current time:", new Date());

    function playerCurrentMs() {
      const d = cfg.datetimeISO ? new Date(cfg.datetimeISO) : new Date();
      return d.getTime();
    }

    function playerSetTimeMs(ms) {
      // Clamp to window
      const clamped = Math.max(_dataWindow.start, Math.min(_dataWindow.end, ms));
      setTimeISO(new Date(clamped).toISOString());
      playerSyncUI();
    }

    function playerSyncUI() {
      if (!player) return;
      const dur = (_dataWindow.end - _dataWindow.start) / 1000;  // seconds
      const elapsed = (playerCurrentMs() - _dataWindow.start) / 1000;
      player.setTime(Math.max(0, elapsed), dur);
      player.setPlaying(_playerPlaying);
    }

    function playerStop() {
      _playerPlaying = false;
      if (_playerRafId) { cancelAnimationFrame(_playerRafId); _playerRafId = 0; }
      if (player) player.setPlaying(false);
    }

    function playerPlay() {
      _playerPlaying = true;
      if (player) player.setPlaying(true);
      let lastTs = null;

      const tick = (ts) => {
        if (!_playerPlaying) return;
        if (lastTs !== null) {
          const dtSec = (ts - lastTs) / 1000;
          const addMs = dtSec * PLAYER_SPEED_MIN_PER_SEC * 60 * 1000;
          const next = playerCurrentMs() + addMs;
          if (next >= _dataWindow.end) {
            playerSetTimeMs(_dataWindow.end);
            playerStop();
            return;
          }
          playerSetTimeMs(next);
        }
        lastTs = ts;
        _playerRafId = requestAnimationFrame(tick);
      };

      _playerRafId = requestAnimationFrame(tick);
    }

    if (player) {
      // Play / Pause toggle
      player.addEventListener("player:toggle", (e) => {
        if (e.detail?.playing) playerPlay(); else playerStop();
      });

      // Scrubber drag — maps position01 across the fixed data window
      player.addEventListener("player:seek", (e) => {
        playerStop();
        const pos = e.detail?.position01 ?? 0;
        playerSetTimeMs(_dataWindow.start + pos * (_dataWindow.end - _dataWindow.start));
      });

      // |◀  Jump to start of data window
      player.addEventListener("player:seek-first", () => {
        playerStop();
        playerSetTimeMs(_dataWindow.start);
      });

      // ◀◀  Step back one hour
      player.addEventListener("player:seek-back", () => {
        playerStop();
        playerSetTimeMs(playerCurrentMs() - STEP_MINUTES * 60 * 1000);
      });

      // ▶▶  Step forward one hour
      player.addEventListener("player:seek-forward", () => {
        playerStop();
        playerSetTimeMs(playerCurrentMs() + STEP_MINUTES * 60 * 1000);
      });

      // Now — jump to current real wall-clock time (clamped to window)
      player.addEventListener("player:seek-now", () => {
        console.log("[Player] Now button clicked, Date.now():", new Date(Date.now()));
        console.log("[Player] Data window start:", new Date(_dataWindow.start), "end:", new Date(_dataWindow.end));
        playerStop();
        playerSetTimeMs(Date.now());
      });

      // Set initial time to "now" and sync UI
      const initialTime = Math.max(_dataWindow.start, Math.min(_dataWindow.end, Date.now()));
      console.log("[Player] Setting initial time:", new Date(initialTime), "from Date.now():", new Date(Date.now()));
      setTimeISO(new Date(initialTime).toISOString());
      requestAnimationFrame(() => playerSyncUI());
    }

    // --------- HIT TEST / INTERACTIONS ----------
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
          openHitModal(toUIHit(t));
        } else {
          // click on empty space: close popovers
          closePopovers();
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
            openHitModal(toUIHit(t));
          } else {
            closePopovers();
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

    // initial UI sync
    syncUIFromCfg();

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