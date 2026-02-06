// sites/staging/sky/core/sky.map.js
export function bootSkyMapUI() {
  const locPill = document.getElementById("locPill");
  const framePill = document.getElementById("framePill");

  const btnLayers = document.getElementById("btnLayers");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const layersPanel = document.getElementById("layersPanel");

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

  const pad2 = (n) => String(n).padStart(2, "0");

  function fmtLocal(dt) {
    return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}, ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  }

  function toISOWithTZ(dt) {
    const off = -dt.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    const hh = pad2(Math.floor(Math.abs(off) / 60));
    const mm = pad2(Math.abs(off) % 60);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:00${sign}${hh}:${mm}`;
  }

  function safeUpdate(patch) {
    window.__skyWidget?.update?.(patch);
  }

  // -----------------------
  // Layers popover
  // -----------------------
  function toggleLayers(force) {
    if (!layersPanel) return;
    const next = (typeof force === "boolean") ? force : !!layersPanel.hidden;
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
  // Timeline model
  // -----------------------
  let stepHours = 6;
  let spanHours = 48;     // +/-24h
  let base = new Date();  // center time
  let playing = false;
  let timer = null;

  function sliderToDate() {
    const t = Number(tSlider.value) / 100; // 0..1
    const ms = base.getTime() + (t - 0.5) * spanHours * 3600 * 1000;
    return new Date(ms);
  }

  function applySlider() {
    const dt = sliderToDate();
    playerTime.textContent = fmtLocal(dt);
    playerHint.textContent = `t = ${fmtLocal(dt)} • step ${stepHours}h • range ±${spanHours / 2}h`;
    framePill.textContent = `🛰 Frame ${fmtLocal(dt)}`;
    safeUpdate({ datetimeISO: toISOWithTZ(dt) });
  }

  function bump(dir) {
    const v = Number(tSlider.value);
    const dv = (stepHours / spanHours) * 100;
    tSlider.value = String(Math.max(0, Math.min(100, v + dir * dv)));
    applySlider();
  }

  tSlider.addEventListener("input", applySlider);

  tPrev?.addEventListener("click", () => bump(-1));
  tNext?.addEventListener("click", () => bump(+1));
  tHome?.addEventListener("click", () => { tSlider.value = "0"; applySlider(); });
  tNow?.addEventListener("click", () => { base = new Date(); tSlider.value = "50"; applySlider(); });

  document.querySelectorAll("[data-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stepHours = Number(btn.getAttribute("data-step")) || 6;
      applySlider();
    });
  });

  tPlay?.addEventListener("click", () => {
    playing = !playing;
    tPlay.textContent = playing ? "⏸" : "▶";
    if (timer) { clearInterval(timer); timer = null; }
    if (playing) timer = setInterval(() => bump(+1), 700);
  });

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

    // keep Layers reachable
    if (btnLayers) btnLayers.style.display = "flex";
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
      if (locPill) locPill.textContent = `📍 Location ${name ? name + " " : ""}(${lat.toFixed(4)}, ${lon.toFixed(4)})`;
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