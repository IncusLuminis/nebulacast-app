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

  function safeUpdate(patch) {
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
  // ✅ Best Today popover
  // -----------------------
  let _bestCache = null;
  let _bestLoading = false;

  function toggleBest(force) {
    if (!bestPanel) return;
    const next = typeof force === "boolean" ? force : !!bestPanel.hidden;
    bestPanel.hidden = !next;
  }

  async function loadBestTodayJSON() {
    if (_bestCache) return _bestCache;
    if (_bestLoading) return null;
    _bestLoading = true;

    try {
      const baseUrl = (window.SKY_CONFIG && window.SKY_CONFIG.baseUrl) ? window.SKY_CONFIG.baseUrl : "/sky";
      const url = `${baseUrl}/data/objects_today.json`;
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _bestCache = json;
      return _bestCache;
    } catch (e) {
      console.warn("[sky.map] BestToday load failed:", e);
      return null;
    } finally {
      _bestLoading = false;
    }
  }

  function renderBestPanel(objects) {
    if (!bestPanel) return;

    bestPanel.innerHTML = ""; // reset
    const title = document.createElement("div");
    title.className = "sky-popover-title";
    title.textContent = "Best Today";
    bestPanel.appendChild(title);

    const list = document.createElement("div");
    list.className = "sky-best-list";

    if (!objects || !objects.length) {
      const empty = document.createElement("div");
      empty.className = "sky-best-empty";
      empty.textContent = "No objects for today.";
      list.appendChild(empty);
      bestPanel.appendChild(list);
      return;
    }

    for (const obj of objects) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "sky-best-row";

      const name = document.createElement("div");
      name.className = "sky-best-name";
      name.textContent = obj.name || obj.id || "Object";

      const note = document.createElement("div");
      note.className = "sky-best-note";
      note.textContent = obj.note || "";

      row.appendChild(name);
      if (obj.note) row.appendChild(note);

      row.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (modal) {
          modal.showFromHit({
            kind: "object",
            data: {
              id: obj.id,
              name: obj.name,
              type: obj.type,
              mag: obj.mag,
              altDeg: obj.altDeg,
              azDeg: obj.azDeg,
              note: obj.note
            }
          });
        }
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

    bestPanel.innerHTML = `<div class="sky-popover-title">Best Today</div><div class="sky-best-empty">Loading…</div>`;

    const json = await loadBestTodayJSON();
    const items = Array.isArray(json?.items) ? json.items : (Array.isArray(json) ? json : []);
    renderBestPanel(items);
  });

  document.addEventListener("click", (e) => {
    if (!bestPanel || bestPanel.hidden) return;
    if (btnBestToday && btnBestToday.contains(e.target)) return;
    if (bestPanel.contains(e.target)) return;
    toggleBest(false);
  });

  // -----------------------
  // Timeline model
  // -----------------------
  let stepHours = 1;      // ✅ DEFAULT: 1h
  let spanHours = 48;     // +/-24h
  let base = new Date();  // center time
  let playing = false;
  let timer = null;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function sliderToDt(val01) {
    const ms = spanHours * 3600 * 1000;
    const t0 = base.getTime() - ms / 2;
    return new Date(t0 + clamp(val01, 0, 1) * ms);
  }

  function dtToSlider(dt) {
    const ms = spanHours * 3600 * 1000;
    const t0 = base.getTime() - ms / 2;
    return clamp((dt.getTime() - t0) / ms, 0, 1);
  }

  function applySlider() {
    const v = Number(tSlider.value) / 100;
    const dt = sliderToDt(v);
    framePill.textContent = `🛰 Frame ${fmtLocal(dt)}`;

    if (playerTime) playerTime.textContent = fmtLocal(dt);

    if (playerHint) {
      const iso = toISOWithTZ(dt);
      playerHint.textContent = iso;
    }

    safeUpdate({ datetimeISO: toISOWithTZ(dt) });
  }

  function stepDir(dir) {
    const cur = sliderToDt(Number(tSlider.value) / 100);
    const next = new Date(cur.getTime() + dir * stepHours * 3600 * 1000);
    tSlider.value = String(Math.round(dtToSlider(next) * 100));
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
    timer = setInterval(() => {
      stepDir(+1);
    }, 650);
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
    tSlider.value = "50";
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
    tSlider.value = "0";
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

  // ✅ Ensure UI reflects default stepHours=1, even if HTML has some other active button
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
      const dt = new Date(msg.datetimeISO);
      if (!isNaN(dt.getTime())) {
        base = dt;
        tSlider.value = "50";
        applySlider();
      }
    }
  });

  // -----------------------
  // Init
  // -----------------------
  if (locPill && locPill.textContent.trim() === "") locPill.textContent = "📍 Location —";
  tSlider.value = "50";
  applySlider();

  window.parent?.postMessage?.({ type: "sky-ready" }, "*");
}