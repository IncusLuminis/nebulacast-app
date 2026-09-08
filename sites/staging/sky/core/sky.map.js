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
  // (we keep it, but we do not assume any API on it)
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
  // ✅ Minimal "Full list" modal (self-contained, no SkyUI deps)
  // -----------------------
  let _recModal = null;

  function ensureRecModal() {
    if (_recModal) return _recModal;

    const host = skyStage || document.body;
    if (host === skyStage) {
      const cs = getComputedStyle(host);
      if (cs.position === "static") host.style.position = "relative";
    }

    const overlay = document.createElement("div");
    overlay.className = "sky-rec-modal";
    overlay.hidden = true;

    // hidden -> no blocking; visible -> blocks inside overlay only
    overlay.style.position = (host === document.body) ? "fixed" : "absolute";
    overlay.style.inset = "0";
    overlay.style.zIndex = "6000";
    overlay.style.display = "none"; // IMPORTANT: do not block clicks when hidden
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.55)";
    overlay.style.padding = "18px";

    const panel = document.createElement("div");
    panel.style.width = "min(980px, 96vw)";
    panel.style.maxHeight = "min(80vh, 860px)";
    panel.style.overflow = "auto";
    panel.style.background = "rgba(12,16,28,0.96)";
    panel.style.border = "1px solid rgba(255,255,255,0.14)";
    panel.style.borderRadius = "14px";
    panel.style.boxShadow = "0 20px 60px rgba(0,0,0,0.55)";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.justifyContent = "space-between";
    head.style.gap = "12px";
    head.style.padding = "14px 14px 10px 14px";
    head.style.borderBottom = "1px solid rgba(255,255,255,0.10)";

    const titleEl = document.createElement("div");
    titleEl.style.font = "600 15px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    titleEl.style.color = "rgba(240,245,255,0.92)";
    titleEl.textContent = "All recommendations";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "sky-btn";
    closeBtn.textContent = "✕";
    closeBtn.style.width = "36px";
    closeBtn.style.height = "32px";
    closeBtn.style.display = "grid";
    closeBtn.style.placeItems = "center";

    const body = document.createElement("div");
    body.style.padding = "12px 14px 14px 14px";
    body.style.color = "rgba(230,240,255,0.88)";
    body.style.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    head.appendChild(titleEl);
    head.appendChild(closeBtn);
    panel.appendChild(head);
    panel.appendChild(body);
    overlay.appendChild(panel);
    host.appendChild(overlay);

    function open(opts) {
      titleEl.textContent = (opts && opts.title) ? String(opts.title) : "All recommendations";
      body.innerHTML = "";
      if (opts && opts.contentEl) body.appendChild(opts.contentEl);
      else if (opts && typeof opts.html === "string") body.innerHTML = opts.html;
      else body.textContent = "…";

      overlay.hidden = false;
      overlay.style.display = "flex";
    }

    function close() {
      overlay.hidden = true;
      overlay.style.display = "none";
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });

    _recModal = { open, close, overlay, body, titleEl };
    return _recModal;
  }

  let _objectsCache = null;
  let _objectsLoading = false;

  async function loadObjectsJSON() {
    if (_objectsCache) return _objectsCache;
    if (_objectsLoading) return null;
    _objectsLoading = true;

    try {
      const baseUrl = (window.SKY_CONFIG && window.SKY_CONFIG.baseUrl) ? window.SKY_CONFIG.baseUrl : "/sky";
      const url = `${baseUrl}/data/objects_today.json`;
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _objectsCache = json;
      return _objectsCache;
    } catch (e) {
      console.warn("[sky.map] objects load failed:", e);
      return null;
    } finally {
      _objectsLoading = false;
    }
  }

  function pickBestISO(obj) {
    return obj?.vis?.best_time_local_quality || obj?.vis?.best_time_local || obj?.best_time_local || "";
  }

  // -----------------------
  // ✅ Full list sorting + quality helpers
  // -----------------------
  function scoreOfObj(obj) {
    const s =
      (typeof obj?.score === "number" ? obj.score : null) ??
      (typeof obj?.score_total === "number" ? obj.score_total : null) ??
      (typeof obj?.rank_score === "number" ? obj.rank_score : null);
    return (typeof s === "number" && isFinite(s)) ? s : 0.0;
  }

  function normGroupForUI(g) {
    const gg = String(g || "").trim().toLowerCase();
    // backend uses "calendar"; UI icon set expects "events"
    if (gg === "calendar") return "events";
    return gg || "";
  }

  function groupRank(obj) {
    const g0 = String(obj?.group || obj?.type || "").trim().toLowerCase();
    const g = normGroupForUI(g0);
    if (g === "alerts") return 0;
    if (g === "events") return 1;
    if (g === "planets") return 2;
    if (g === "dso") return 3;
    return 9;
  }

  function qualityFromScore(score) {
    if (score >= 1000) return { label: "Excellent", dot: "rgba(90,220,140,0.95)", text: "rgba(190,255,215,0.92)" };
    if (score >= 600) return { label: "Good", dot: "rgba(109, 181, 226, 0.95)", text: "rgba(109, 181, 226, 0.92)" };
    if (score >= 300) return { label: "Fair", dot: "rgba(245,215,90,0.95)", text: "rgba(255,240,190,0.90)" };
    return { label: "Poor", dot: "rgba(255,110,110,0.95)", text: "rgba(255,205,205,0.88)" };
  }

  function sortObjectsForPopover(items) {
    const arr = (items || []).slice();
    arr.sort((a, b) => {
      const ga = groupRank(a);
      const gb = groupRank(b);
      if (ga !== gb) return ga - gb;

      const sa = scoreOfObj(a);
      const sb = scoreOfObj(b);
      if (sb !== sa) return sb - sa;

      const na = String(a?.name || a?.id || "").toLowerCase();
      const nb = String(b?.name || b?.id || "").toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    });
    return arr;
  }

  function buildObjectsTable(items) {
    const wrap = document.createElement("div");

    const top = document.createElement("div");
    top.style.display = "flex";
    top.style.alignItems = "baseline";
    top.style.justifyContent = "space-between";
    top.style.gap = "12px";
    top.style.marginBottom = "10px";

    const left = document.createElement("div");
    left.style.opacity = "0.88";
    left.textContent = `Total: ${items.length}`;

    const right = document.createElement("div");
    right.style.opacity = "0.70";
    right.style.fontSize = "12px";
    right.textContent = "JSON: objects_today.json";

    top.appendChild(left);
    top.appendChild(right);
    wrap.appendChild(top);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.font = "12.5px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");

    const cols = [
      { key: "ico", label: "" , align: "center", w: "28px" },
      { key: "name", label: "Object", align: "left" },
      { key: "qDot", label: "" , align: "center", w: "22px" },      // ✅ NEW
      { key: "qTxt", label: "Quality", align: "left", w: "86px" },  // ✅ NEW
      { key: "maxAlt", label: "Max alt", align: "right", w: "86px" },
      { key: "best", label: "Best", align: "right", w: "76px" },
      { key: "mag", label: "Mag", align: "right", w: "66px" },
      { key: "score", label: "Score", align: "right", w: "72px" },
    ];

    for (const c of cols) {
      const th = document.createElement("th");
      th.textContent = c.label;
      th.style.textAlign = c.align;
      th.style.padding = "8px 8px";
      th.style.borderBottom = "1px solid rgba(255,255,255,0.10)";
      th.style.color = "rgba(220,235,255,0.75)";
      th.style.fontWeight = "600";
      if (c.w) th.style.width = c.w;
      trh.appendChild(th);
    }

    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (const obj of items) {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid rgba(255,255,255,0.06)";

      const group = obj.group || obj.type || "";
      const groupUI = normGroupForUI(group);

      const s = scoreOfObj(obj);
      const q = qualityFromScore(s);

      const tdIco = document.createElement("td");
      tdIco.style.padding = "7px 8px";
      tdIco.style.textAlign = "center";
      tdIco.textContent = iconForGroup(groupUI);

      const tdName = document.createElement("td");
      tdName.style.padding = "7px 8px";
      tdName.style.textAlign = "left";
      tdName.style.color = "rgba(245,248,255,0.92)";
      tdName.textContent = obj.name || obj.id || "Object";

      // ✅ Quality dot
      const tdQDot = document.createElement("td");
      tdQDot.style.padding = "7px 8px";
      tdQDot.style.textAlign = "center";
      const dot = document.createElement("span");
      dot.style.display = "inline-block";
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "999px";
      dot.style.background = q.dot;
      dot.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.25)";
      tdQDot.appendChild(dot);

      // ✅ Quality text
      const tdQTxt = document.createElement("td");
      tdQTxt.style.padding = "7px 8px";
      tdQTxt.style.textAlign = "left";
      tdQTxt.style.color = q.text;
      tdQTxt.textContent = q.label;

      const tdAlt = document.createElement("td");
      tdAlt.style.padding = "7px 8px";
      tdAlt.style.textAlign = "right";
      tdAlt.style.color = "rgba(230,240,255,0.85)";
      const maxAlt = obj?.vis?.max_alt_deg;
      tdAlt.textContent = (typeof maxAlt === "number") ? `${Math.round(maxAlt)}°` : "";

      const tdBest = document.createElement("td");
      tdBest.style.padding = "7px 8px";
      tdBest.style.textAlign = "right";
      tdBest.style.color = "rgba(230,240,255,0.80)";
      tdBest.textContent = fmtHHMM(pickBestISO(obj));

      const tdMag = document.createElement("td");
      tdMag.style.padding = "7px 8px";
      tdMag.style.textAlign = "right";
      tdMag.style.color = "rgba(230,240,255,0.78)";
      tdMag.textContent = (typeof obj.mag === "number") ? obj.mag.toFixed(1) : "";

      const tdScore = document.createElement("td");
      tdScore.style.padding = "7px 8px";
      tdScore.style.textAlign = "right";
      tdScore.style.color = "rgba(230,240,255,0.78)";
      tdScore.textContent = (typeof s === "number") ? s.toFixed(2) : "";

      tr.appendChild(tdIco);
      tr.appendChild(tdName);
      tr.appendChild(tdQDot);  // ✅ NEW
      tr.appendChild(tdQTxt);  // ✅ NEW
      tr.appendChild(tdAlt);
      tr.appendChild(tdBest);
      tr.appendChild(tdMag);
      tr.appendChild(tdScore);

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  // -----------------------
  // IMPORTANT: prevent echo-loop from postMessage(datetimeISO)
  // -----------------------
  let _lastSentDatetimeISO = null;
  let _suppressEchoUntilMs = 0;

  function safeUpdate(patch) {
    if (patch && typeof patch.datetimeISO === "string") {
      _lastSentDatetimeISO = patch.datetimeISO;
      _suppressEchoUntilMs = Date.now() + 1500;
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
    const gg = String(g || "").trim().toLowerCase();
    if (gg === "planets") return "🪐";
    if (gg === "dso") return "🌀";
    if (gg === "alerts") return "⚠️";
    if (gg === "events" || gg === "calendar") return "📅";
    return "🌟";
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
      ico.textContent = iconForGroup(normGroupForUI(obj.group));

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

    // ✅ footer link -> modal with full recommendations (objects_today.json)
    const footer = document.createElement("div");
    footer.style.marginTop = "10px";
    footer.style.paddingTop = "10px";
    footer.style.borderTop = "1px solid rgba(255,255,255,0.10)";

    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "Show full list →";
    link.style.color = "rgba(180,210,255,0.92)";
    link.style.textDecoration = "none";
    link.style.font = "600 13px system-ui, -apple-system, Segoe UI, Roboto, Arial";

    link.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const m = ensureRecModal();
      m.open({ title: "Best objects today", html: `<div style="opacity:.88">Modal is alive ✅</div>` });

      // optional: try to load and render the table
      m.open({ title: "Best objects today", html: "Loading…" });

      const json = await loadObjectsJSON();
      const arr =
        Array.isArray(json?.items) ? json.items :
        Array.isArray(json?.objects) ? json.objects :
        Array.isArray(json) ? json :
        null;

      if (!arr || !arr.length) {
        m.open({
          title: "Best objects today",
          html: `<div style="opacity:.88">objects_today.json not found (or unknown schema). Modal is alive ✅</div>`,
        });
        return;
      }

      // ✅ required ordering: alerts -> events -> planets -> dso, then score desc
      const items2 = sortObjectsForPopover(arr);

      const tableEl = buildObjectsTable(items2);
      m.open({ title: "Best objects today", contentEl: tableEl });
    });

    footer.appendChild(link);
    bestPanel.appendChild(footer);
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

  try {
    tSlider.min = "0";
    tSlider.max = "100";
    if (!tSlider.step || tSlider.step === "1") tSlider.step = "0.1";
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
      playerHint.textContent = humanizeISO(iso);
    }

    safeUpdate({ datetimeISO: iso });
  }

  function stepDir(dir) {
    const cur = sliderToDt(Number(tSlider.value) / 100);
    const next = new Date(cur.getTime() + dir * stepHours * 3600 * 1000);
    const next01 = dtToSlider(next);

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

  // NOTE: keep your existing focus behavior (defined elsewhere in your codebase)
  function focusOnRankingItem(obj) {
    const dt = pickBestLocalDate(obj);
    if (!dt) return;

    base = dt;
    setSliderToBase();
    applySlider();

    safeUpdate({
      ui: {
        highlightId: obj.id ?? `${obj.group}:${obj.name}`,
        highlightMs: 5000,
        highlightMode: "Focus"
      }
    });
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
    setSliderToBase();
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