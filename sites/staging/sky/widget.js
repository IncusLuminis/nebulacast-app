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
    const side = uiEnabled("sideToolbar") ? document.createElement("ui-side-toolbar") : null;
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
    if (side) {
      side.style.position = "absolute";
      side.style.right = "14px";
      side.style.top = "60px";
      side.style.zIndex = "20";
    }

    // bottom aligned to bottom-right corner of canvas
    if (bottom) {
      bottom.style.position = "absolute";
      bottom.style.right = "14px";
      bottom.style.bottom = "78px";
      bottom.style.left = "auto";
      bottom.style.transform = "none";
      bottom.style.zIndex = "20";
    }

    if (player) {
      player.style.position = "absolute";
      player.style.right = "14px";
      player.style.bottom = "78px";
      player.style.zIndex = "20";
      player.style.width = "min(520px, calc(100% - 28px))";
    }

    // Append only enabled ones
    root.append(...[side, bottom, popRanking, popObjects, popAlerts, modalWC, player].filter(Boolean));

    // Right toolbar items (Ranking / Objects / Alerts)
    if (side) {
      side.baseUrl = cfg.baseUrl;
      side.items = [
        { id: "ranking", label: "Ranking", icon: UI_ICONS.ranking, kind: "action" },
        { id: "alerts", label: "Alerts", icon: UI_ICONS.alerts, kind: "action" },
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


    // ---------- MODAL: all objects (objects_today.json) ----------
    function buildAllObjectsModalContent() {
      const src = Array.isArray(objectsToday)
        ? objectsToday
        : (objectsToday?.items || objectsToday?.objects || []);
      const arr = Array.isArray(src) ? src.slice() : [];

      const root = el("div", { class: "sky-modal-ranking" });

      if (!arr.length) {
        root.appendChild(el("div", { text: "No objects." }));
        return toHTML(root);
      }

      // group/sort (same approach as before)
      const groupOf = (o) => {
        const t = normLower(o?.group || o?.type || o?.kind || o?.subtype || "");
        if (t.includes("calendar")) return "calendar";
        if (t.includes("planet") || t.includes("sun") || t.includes("moon")) return "planets";
        if (normLower(o?.meta?.planet_key || "").length) return "planets";
        return "dso";
      };

      const byScoreDesc = (a, b) => scoreOf(b) - scoreOf(a);

      const calendar = [];
      const planetsList = [];
      const dso = [];

      for (const o of arr) {
        const g = groupOf(o);
        if (g === "calendar") calendar.push(o);
        else if (g === "planets") planetsList.push(o);
        else dso.push(o);
      }

      calendar.sort(byScoreDesc);
      planetsList.sort(byScoreDesc);
      dso.sort(byScoreDesc);

      const fmtTimeLocal = (x) => {
        if (!x) return "—";
        const s = String(x);
        const m = s.match(/T(\d{2}:\d{2})/);
        return m ? m[1] : s;
      };

      const fmtMag = (o) => {
        const v = fmtMaybeNumber(o?.mag ?? o?.vmag ?? o?.magnitude, 2);
        return v != null ? `mag ${v}` : "mag —";
      };

      const fmtAlt = (o) => {
        // max altitude (fallback chain)
        const v = fmtMaybeNumber(
          o?.vis?.max_alt_deg ??
            o?.vis?.max_alt_deg_quality ??
            o?.max_alt_deg ??
            o?.altDeg ??
            o?.alt ??
            o?.altitude,
          0
        );
        return v != null ? `alt ${v}°` : "alt —";
      };

      const fmtRA = (o) => {
        const ra = Number(o?.ra_deg ?? o?.raDeg ?? o?.ra);
        if (!Number.isFinite(ra)) return "RA —";
        const totalSec = (ra / 15) * 3600;
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = Math.floor(totalSec % 60);
        const pad2 = (n) => String(n).padStart(2, "0");
        return `RA ${pad2(hh)}h${pad2(mm)}m${pad2(ss)}s`;
      };

      const fmtDEC = (o) => {
        const dec = Number(o?.dec_deg ?? o?.decDeg ?? o?.dec);
        if (!Number.isFinite(dec)) return "DEC —";
        const sign = dec >= 0 ? "+" : "−";
        const a = Math.abs(dec);
        const dd = Math.floor(a);
        const mm = Math.floor((a - dd) * 60);
        const ss = Math.floor((((a - dd) * 60) - mm) * 60);
        const pad2 = (n) => String(n).padStart(2, "0");
        return `DEC ${sign}${dd}°${pad2(mm)}′${pad2(ss)}″`;
      };

      function buildRow(o) {
        const hid = makeHighlightIdFromRaw(o);
        const name =
          (o && (o.name || o.target_name)) ? String(o.name || o.target_name) : pickTitle(o);

        const note = String(o?.note || "").trim();
        const tISO = bestTimeISO(o);
        const best = fmtTimeLocal(tISO);

        const grade = gradeOf(scoreOf(o));

        return el(
          "div",
          { class: "sky-modal-row", "data-hid": hid || "", "data-time": tISO || "" },

          el(
            "div",
            { class: "sky-modal-left" },
            el(
              "div",
              { class: "sky-modal-r1" },
              el("span", { class: "sky-modal-emoji", text: emojiForItem(o) }),
              el("span", { class: "sky-modal-name", text: name })
            ),
            note ? el("div", { class: "sky-modal-note", text: note }) : null,
            el(
              "div",
              { class: "sky-modal-meta" },
              el("span", { class: "sky-modal-chip", text: `Culmination ${best !== "—" ? best : "—"}` }),
              el("span", { class: "sky-modal-dot", text: "·" }),
              el("span", { class: "sky-modal-chip", text: fmtMag(o) }),
              el("span", { class: "sky-modal-dot", text: "·" }),
              el("span", { class: "sky-modal-chip", text: fmtAlt(o) }),
              el("span", { class: "sky-modal-dot", text: "·" }),
              el("span", { class: "sky-modal-chip", text: fmtRA(o) }),
              el("span", { class: "sky-modal-dot", text: "·" }),
              el("span", { class: "sky-modal-chip", text: fmtDEC(o) })
            )
          ),

          el(
            "div",
            { class: "sky-modal-right", "data-grade": grade },
            el("span", { class: "sky-modal-dotcircle", "data-grade": grade }),
            el("span", { class: "sky-modal-grade", "data-grade": grade, text: grade })
          )
        );
      }

      // no section titles — just ordered blocks
      for (const o of calendar) root.appendChild(buildRow(o));
      for (const o of planetsList) root.appendChild(buildRow(o));
      for (const o of dso) root.appendChild(buildRow(o));

      return toHTML(root);
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

    
    function openAllObjectsModal() {
      if (!modalWC) return;
      modalWC.open({
        title: "Best Objects this night",
        content: buildAllObjectsModalContent(),
      });
      requestAnimationFrame(() => wireModalClicks());
    }

    // --------- POPOVERS (Ranking / Objects / Alerts) ----------
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
    
      const LIMIT = 30;
      for (let i = 0; i < Math.min(arr.length, LIMIT); i++) {
        root.appendChild(buildRow(arr[i]));
      }
    
      return toHTML(root);
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
    
      // header: title + compact Show All button
      root.appendChild(
        el(
          "div",
          { class: "sky-pop-header" },
          el("div", { class: "sky-pop-title", text: "TOP 7 objects of the night" }),
          el(
            "button",
            { class: "sky-pop-btn sky-pop-btn--small sky-pop-showall-btn", type: "button" },
            "Show All"
          )
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
        const v = fmtMaybeNumber(
          o?.vis?.max_alt_deg ?? o?.vis?.max_alt_deg_quality ?? o?.altDeg ?? o?.alt,
          0
        );
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
    
        const name =
          (o && (o.name || o.target_name)) ? String(o.name || o.target_name) :
          pickTitle(o);
    
        const note = String(o?.note || "").trim();
        const tISO = bestTimeISO(o);
        const best = fmtTimeLocal(tISO);
    
        // grade computed but NOT shown here (popover already has score in meta2)
        // left for possible future use
        // const sc = scoreOf(o);
        // const grade = gradeOf(sc);
    
        const row = el(
          "div",
          { class: "sky-pop-item sky-pop-item--ranking", "data-hid": hid || "", "data-time": tISO || "" },
    
          // line 1: emoji + big bold name (same line!)
          el(
            "div",
            { class: "sky-pop-line1" },
            el("span", { class: "sky-pop-emoji", text: emojiForItem(o) }),
            el("span", { class: "sky-pop-name", text: name }),
            el("span", { class: "sky-pop-spacer", text: "" })
          ),
    
          // note (wrap)
          note ? el("div", { class: "sky-pop-note", text: note }) : null,
    
          // line 2: compact meta
          el(
            "div",
            { class: "sky-pop-meta2" },
            el("span", { class: "sky-pop-chip", text: best }),
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
    
        // drop nulls (when note empty)
        row.replaceChildren(...Array.from(row.childNodes).filter(Boolean));
        return row;
      }
    
      function section(title, arr) {
        if (!arr.length) return;
        // use existing popover section header styling
        root.appendChild(el("div", { class: "sky-pop-section-h", text: title }));
        for (const o of arr) root.appendChild(buildRow(o));
      }
    
      for (const o of calendar) root.appendChild(buildRow(o));
      for (const o of planetsRank) root.appendChild(buildRow(o));
      for (const o of dsoRank) root.appendChild(buildRow(o));

      return { html: toHTML(root), hasFooterBtn: true };
    }

    function wirePopoverClicks(pop, { onShowAll } = {}) {
      if (!pop) return;
    
      // ui-popover is a web component; its markup lives in shadowRoot
      const sr = pop.shadowRoot;
      if (!sr) return;
    
      // Try to find the clickable container inside the popover
      const host =
        sr.querySelector(".content") ||
        sr.querySelector(".panel") ||
        sr;
    
      // Avoid stacking handlers on repeated open()
      host.onclick = null;
    
      host.onclick = (e) => {
        // "Show All" button (sticky header)
        const btn = e.target && e.target.closest ? e.target.closest(".sky-pop-showall-btn") : null;
        if (btn) {
          try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
          if (typeof onShowAll === "function") onShowAll();
          return;
        }
    
        // Click on a ranking/object row
        const row = e.target && e.target.closest ? e.target.closest("[data-hid]") : null;
        if (!row) return;
    
        const hid = row.getAttribute("data-hid");
        if (!hid) return;
    
        // close popover
        try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
    
        // rotate sky to best time (if present)
        const tISO = row.getAttribute("data-time");
        if (tISO) setTimeISO(tISO);
    
        // highlight (existing behavior)
        setHighlightById(hid, 3600);
      };
    }

    // NOTE: UIPopover API:
    //   pop.content = "<html...>"
    //   pop.open(anchorEl, { placement, offset })
    function openRankingPopover(anchorEl) {
      if (!popRanking || typeof popRanking.open !== "function") return;
      try { if (popObjects && typeof popObjects.close === "function") popObjects.close(); } catch (_) {}
      try { if (popAlerts && typeof popAlerts.close === "function") popAlerts.close(); } catch (_) {}
    
      const res = buildRankingContent7();
      popRanking.content = res.html;
    
      // NEW: boundaryEl: root
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
    
      // NEW: boundaryEl: root
      popObjects.open(anchorEl, { placement: "left", offset: 10, boundaryEl: root });
    
      requestAnimationFrame(() => {
        wirePopoverClicks(popObjects);
      });
    }
    
    function openAlertsPopover(anchorEl) {
      if (!popAlerts || typeof popAlerts.open !== "function") return;
      try { if (popRanking && typeof popRanking.close === "function") popRanking.close(); } catch (_) {}
      try { if (popObjects && typeof popObjects.close === "function") popObjects.close(); } catch (_) {}
    
      popAlerts.content = buildAlertsListContent();
    
      // NEW: boundaryEl: root
      popAlerts.open(anchorEl, { placement: "left", offset: 10, boundaryEl: root });
    
      requestAnimationFrame(() => {
        wirePopoverClicks(popAlerts);
      });
    }
    

    // Right toolbar events: open popovers
    if (side) {
      // Contract: side_toolbar dispatches `toolbar:action` with detail { id, anchorEl }
      side.addEventListener("toolbar:action", (e) => {
        console.log("[side action]", e.detail);
        const { id, anchorEl } = e.detail || {};
        if (!id) return;
        if (!anchorEl) return;

        if (id === "ranking") openRankingPopover(anchorEl);
        if (id === "alerts") openAlertsPopover(anchorEl);
      });
    }

    // Modal remains for clicking on canvas objects
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

    // Player events (wire to engine later)
    if (player) {
      player.addEventListener("player:toggle", (_e) => {});
      player.addEventListener("player:seek", (_e) => {});
      player.addEventListener("player:mute", (_e) => {});
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