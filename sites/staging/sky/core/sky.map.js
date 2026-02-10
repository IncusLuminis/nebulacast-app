// sites/staging/sky/core/sky.map.js
import { SkyUI } from "./sky.ui.js";

export function bootSkyMapUI() {
  const locPill = document.getElementById("locPill");
  const framePill = document.getElementById("framePill");

  const btnLayers = document.getElementById("btnLayers");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const layersPanel = document.getElementById("layersPanel");

  // ✅ Best Today
  const btnBestToday = document.getElementById("btnBestToday");
  const bestPanel = document.getElementById("bestPanel");

  const skyStage = document.getElementById("skyStage");

  const tSlider = document.getElementById("tSlider");
  const tPlay = document.getElementById("tPlay");
  const tNow = document.getElementById("tNow");
  const tPrev = document.getElementById("tPrev");
  const tNext = document.getElementById("tNext");
  const tHome = document.getElementById("tHome");
  const playerTime = document.getElementById("playerTime");
  const playerHint = document.getElementById("playerHint");

  // guard: UI must exist
  if (!tSlider || !playerTime || !playerHint || !framePill) {
    console.warn("[sky.map] Missing UI elements; boot aborted.");
    return;
  }

  // Optional: make player floating everywhere (won't break if CSS not present)
  const player = document.querySelector(".sky-player");
  if (player) {
    player.classList.add("is-float");
    document.body.classList.add("has-sky-player");
  }

  // ✅ Modal for Best Today (attached to stage so it works over canvas)
  const modal = (skyStage ? SkyUI.createModal(skyStage) : null);

  const pad2 = (n) => String(n).padStart(2, "0");

  function fmtLocal(dt) {
    return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}, ${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}`;
  }

  function toISOWithTZ(dt) {
    const off = -dt.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    const hh = pad2(Math.floor(Math.abs(off) / 60));
    const mm = pad2(Math.abs(off) % 60);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}:00${sign}${hh}:${mm}`;
  }

  function humanizeISO(iso) {
    if (!iso) return "";
    return String(iso).replace("T", " ");
  }

  // -----------------------
  // IMPORTANT: prevent echo-loop from postMessage(datetimeISO)
  // -----------------------
  let _lastSentDatetimeISO = null;
  let _suppressEchoUntilMs = 0;

  function safeUpdate(patch) {
    // If we're sending datetimeISO, remember it so we can ignore echoed messages.
    if (patch && typeof patch.datetimeISO === "string") {
      _lastSentDatetimeISO = patch.datetimeISO;
      _suppressEchoUntilMs = Date.now() + 1500; // enough to pass through one redraw / postMessage roundtrip
    }
    window.__skyWidget?.update?.(patch);
  }

  // -----------------------
  // Layers popover
  // -----------------------
  function toggleLayers(force) {
    if (!layersPanel) return;
    const next = typeof force === "boolean" ? force : !!layersPanel.hidden;
    layersPanel.hidden = !next;
  }

  btnLayers?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLayers();
  });

  document.addEventListener("click", (e) => {
    if (!layersPanel || layersPanel.hidden) return;
    if (btnLayers && btnLayers.contains(e.target)) return;
    if (layersPanel.contains(e.target)) return;
    toggleLayers(false);
  });

  layersPanel?.addEventListener("change", (e) => {
    const inp = e.target;
    if (!inp || inp.tagName !== "INPUT") return;
    const opt = inp.getAttribute("data-opt");
    if (!opt) return;
    safeUpdate({ options: { [opt]: !!inp.checked } });
  });

  // -----------------------
  // ✅ Ranking popover
  // -----------------------
  let _rankingCache = null;
  let _rankingLoading = false;

  function toggleBest(force) {
    if (!bestPanel) return;
    const next = typeof force === "boolean" ? force : !!bestPanel.hidden;
    bestPanel.hidden = !next;
  }

  async function loadRankingJSON() {
    if (_rankingCache) return _rankingCache;
    if (_rankingLoading) return null;
    _rankingLoading = true;

    try {
      const baseUrl = (window.SKY_CONFIG && window.SKY_CONFIG.baseUrl) ? window.SKY_CONFIG.baseUrl : "/sky";
      const url = `${baseUrl}/data/ranking.json`;
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _rankingCache = json;
      return _rankingCache;
    } catch (e) {
      console.warn("[sky.map] ranking load failed:", e);
      return null;
    } finally {
      _rankingLoading = false;
    }
  }

  function iconForGroup(g) {
    if (g === "planets") return "🪐";
    if (g === "dso") return "✦";
    if (g === "alerts") return "⚠️";
    if (g === "events") return "📅";
    return "★";
  }

  function fmtHHMM(isoLocal) {
    if (!isoLocal || typeof isoLocal !== "string") return "";
    const m = isoLocal.match(/T(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "";
  }

  function renderBestPanelRanking(items, meta) {
    if (!bestPanel) return;

    bestPanel.innerHTML = "";

    const totalTop = meta?.total_top ?? (Array.isArray(items) ? items.length : 0);

    const title = document.createElement("div");
    title.className = "sky-popover-title";
    title.textContent = "Top objects";
    bestPanel.appendChild(title);

    const sub = document.createElement("div");
    sub.className = "sky-popover-sub";
    sub.textContent = `Ranking: top ${totalTop}`;
    bestPanel.appendChild(sub);

    const list = document.createElement("div");
    list.className = "sky-best-list";

    if (!items || !items.length) {
      const empty = document.createElement("div");
      empty.className = "sky-best-empty";
      empty.textContent = "No ranked objects for today.";
      list.appendChild(empty);
      bestPanel.appendChild(list);
      return;
    }

    for (const obj of items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "sky-best-row";

      const head = document.createElement("div");
      head.className = "sky-best-head";

      const ico = document.createElement("div");
      ico.className = "sky-best-ico";
      ico.textContent = iconForGroup(obj.group);

      const name = document.createElement("div");
      name.className = "sky-best-name";
      name.textContent = obj.name || obj.id || "Object";

      head.appendChild(ico);
      head.appendChild(name);

      const note = document.createElement("div");
      note.className = "sky-best-note";

      const maxAlt = typeof obj?.vis?.max_alt_deg === "number"
        ? Math.round(obj.vis.max_alt_deg)
        : null;
      const bestT = fmtHHMM(obj?.vis?.best_time_local_quality || obj?.vis?.best_time_local);
      const mag = typeof obj.mag === "number" ? obj.mag.toFixed(1) : null;

      const parts = [];
      if (maxAlt != null) parts.push(`${maxAlt}°`);
      if (bestT) parts.push(bestT);
      if (mag != null) parts.push(`mag ${mag}`);
      note.textContent = parts.join(" • ");

      row.appendChild(head);
      if (note.textContent) row.appendChild(note);

      row.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        focusOnRankingItem(obj);
      });

      list.appendChild(row);
    }

    bestPanel.appendChild(list);
  }

  btnBestToday?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (layersPanel && !layersPanel.hidden) toggleLayers(false);

    toggleBest();
    if (!bestPanel || bestPanel.hidden) return;

    bestPanel.innerHTML =
      `<div class="sky-popover-title">Best Today</div><div class="sky-best-empty">Loading…</div>`;

    const json = await loadRankingJSON();
    const items = Array.isArray(json?.items) ? json.items : [];
    renderBestPanelRanking(items, json?.meta);
  });

  document.addEventListener("click", (e) => {
    if (!bestPanel || bestPanel.hidden) return;
    if (btnBestToday && btnBestToday.contains(e.target)) return;
    if (bestPanel.contains(e.target)) return;
    toggleBest(false);
  });

  function pickBestLocalDate(obj) {
    const iso =
      obj?.vis?.best_time_local_quality ||
      obj?.vis?.best_time_local;

    if (!iso) return null;

    const dt = new Date(iso); // local time
    return isNaN(dt.getTime()) ? null : dt;
  }

  // -----------------------
  // Timeline model (asymmetric window)
  //  - start: now - 48h
  //  - end:   now + 7d
  //  - slider value uses FRACTIONS (no rounding), otherwise 1h steps may not move at all.
  // -----------------------
  let stepHours = 1;          // default: 1h
  let pastHours = 48;         // now - 48h
  let futureHours = 24 * 7;   // now + 7d
  let base = new Date();      // anchor ("now")
  let playing = false;
  let timer = null;

  // IMPORTANT: allow fractional slider values
  // (range supports it; if your HTML has step=1, override it here)
  try {
    tSlider.min = "0";
    tSlider.max = "100";
    if (!tSlider.step || tSlider.step === "1") tSlider.step = "0.1"; // 0.1% ~ 13 min for 9 days window
  } catch (_) {}

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function windowBoundsMs() {
    const t0 = base.getTime() - pastHours * 3600 * 1000;
    const t1 = base.getTime() + futureHours * 3600 * 1000;
    return { t0, t1 };
  }

  function baseSliderPos01() {
    const denom = pastHours + futureHours;
    return denom > 0 ? (pastHours / denom) : 0.5;
  }

  function setSliderToBase() {
    // DON'T round; keep fractions so buttons can step smoothly
    tSlider.value = String(baseSliderPos01() * 100);
  }

  function sliderToDt(val01) {
    const { t0, t1 } = windowBoundsMs();
    const v = clamp(val01, 0, 1);
    return new Date(t0 + (t1 - t0) * v);
  }

  function dtToSlider(dt) {
    const { t0, t1 } = windowBoundsMs();
    if (t1 <= t0) return 0.5;
    return clamp((dt.getTime() - t0) / (t1 - t0), 0, 1);
  }

  function applySlider() {
    const v = Number(tSlider.value) / 100;
    const dt = sliderToDt(v);

    framePill.textContent = `🛰 Frame ${fmtLocal(dt)}`;
    if (playerTime) playerTime.textContent = fmtLocal(dt);

    const iso = toISOWithTZ(dt);

    if (playerHint) {
      // UI only: replace T with space for readability
      playerHint.textContent = humanizeISO(iso);
    }

    // engine expects real ISO with 'T'
    safeUpdate({ datetimeISO: iso });
  }

  function stepDir(dir) {
    const cur = sliderToDt(Number(tSlider.value) / 100);
    const next = new Date(cur.getTime() + dir * stepHours * 3600 * 1000);
    const next01 = dtToSlider(next);

    // DON'T round to int percent, иначе при больших окнах 1h не меняет value
    tSlider.value = String(next01 * 100);
    applySlider();
  }

  function stopPlay() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = null;
    if (tPlay) tPlay.textContent = "▶";
    if (tPlay) tPlay.classList.remove("is-on");
  }

  function startPlay() {
    playing = true;
    if (tPlay) tPlay.textContent = "⏸";
    if (tPlay) tPlay.classList.add("is-on");

    if (timer) clearInterval(timer);
    timer = setInterval(() => stepDir(+1), 650);
  }

  tSlider?.addEventListener("input", applySlider);

  tPlay?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!playing) startPlay();
    else stopPlay();
  });

  tNow?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    base = new Date();
    setSliderToBase(); // "Now" should not be center=50; it should be at base position in asymmetric window
    applySlider();
  });

  tPrev?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    stepDir(-1);
  });

  tNext?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    stepDir(+1);
  });

  tHome?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    tSlider.value = "0"; // start of window = base - pastHours
    applySlider();
  });
  
  // step buttons
  document.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const h = Number(btn.getAttribute("data-step"));
      if (!isNaN(h) && h > 0) {
        stepHours = h;
        document.querySelectorAll("[data-step]").forEach((b) => b.classList.remove("sky-btn-active"));
        btn.classList.add("sky-btn-active");
      }
    });
  });

  // Ensure UI reflects default stepHours=1
  (function syncStepButtonsToDefault() {
    const btn = document.querySelector('[data-step="1"]');
    if (!btn) return;
    document.querySelectorAll("[data-step]").forEach((b) => b.classList.remove("sky-btn-active"));
    btn.classList.add("sky-btn-active");
  })();

  // -----------------------
  // Fullscreen (stage only)
  // -----------------------
  function setFsUI(isFs) {
    if (skyStage) skyStage.classList.toggle("is-fs", isFs);
    document.body.classList.toggle("is-sky-fs", isFs);

    if (btnFullscreen) {
      btnFullscreen.textContent = isFs ? "⤡" : "⤢";
      btnFullscreen.title = isFs ? "Exit fullscreen" : "Fullscreen";
    }

    if (btnLayers) btnLayers.style.display = "flex";
    if (btnBestToday) btnBestToday.style.display = "flex";
  }

  async function toggleFullscreen() {
    if (!skyStage) return;

    try {
      if (!document.fullscreenElement) {
        await skyStage.requestFullscreen({ navigationUI: "hide" });
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("[sky.map] fullscreen failed:", e);
      const isFs = !skyStage.classList.contains("is-fs");
      setFsUI(isFs);
    }
  }

  btnFullscreen?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  });

  document.addEventListener("fullscreenchange", () => {
    const isFs = !!document.fullscreenElement;
    setFsUI(isFs);
  });

  // -----------------------
  // External messages (optional)
  // -----------------------
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "sky-state") return;

    if (msg.location && typeof msg.location.lat === "number" && typeof msg.location.lon === "number") {
      const { name, lat, lon } = msg.location;
      if (locPill)
        locPill.textContent = `📍 Location ${name ? name + " " : ""}(${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      safeUpdate({ lat, lon });
    }

    if (msg.datetimeISO) {
      // 🔒 ignore echo from our own safeUpdate(datetimeISO)
      if (_lastSentDatetimeISO && msg.datetimeISO === _lastSentDatetimeISO && Date.now() < _suppressEchoUntilMs) {
        return;
      }

      const dt = new Date(msg.datetimeISO);
      if (!isNaN(dt.getTime())) {
        base = dt;
        setSliderToBase();
        applySlider();
      }
    }
  });

  // -----------------------
  // Init
  // -----------------------
  if (locPill && locPill.textContent.trim() === "") locPill.textContent = "📍 Location —";
  setSliderToBase();
  applySlider();

  window.parent?.postMessage?.({ type: "sky-ready" }, "*");
}