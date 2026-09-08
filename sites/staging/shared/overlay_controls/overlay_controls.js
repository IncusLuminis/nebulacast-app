// overlay-controls.js
// Самодостаточный модуль: вешает 3 кнопки поверх "стейджа" и поповер слоёв.
// Никаких двойных addEventListener. Возвращает destroy().

export function mountOverlayControls(opts) {
    const {
      stageEl,           // обязательный: контейнер, где кнопки рисуются поверх (position:relative)
      fsTargetEl,        // optional: что разворачиваем (по умолчанию stageEl)
      layers = [],       // [{ key:"showGridAz", label:"Az grid", checked:true }, ...]
      onToggleLayer,     // (key:boolean) => void
      onHome,            // () => void
      onFullscreen,      // (isFs:boolean) => void
      getIsFullscreen,   // () => boolean   (optional)
    } = opts || {};
  
    if (!stageEl) throw new Error("[overlay-controls] stageEl is required");
  
    const target = fsTargetEl || stageEl;
  
    // inject HTML
    const root = document.createElement("div");
    root.innerHTML = TEMPLATE_HTML.trim();
    const ui = root.firstElementChild;
    stageEl.appendChild(ui);
  
    // refs
    const btnLayers = ui.querySelector("[data-ovl-layers]");
    const btnHome   = ui.querySelector("[data-ovl-home]");
    const btnFs     = ui.querySelector("[data-ovl-fs]");
    const popover   = ui.querySelector("[data-ovl-popover]");
    const body      = ui.querySelector("[data-ovl-popover-body]");
  
    // render layers list
    function renderLayers() {
      if (!body) return;
      body.innerHTML = "";
      for (const item of (layers || [])) {
        const row = document.createElement("label");
        row.className = "ovl-check";
        row.innerHTML = `
          <input type="checkbox" data-opt="${escapeAttr(item.key)}" ${item.checked ? "checked" : ""}>
          <span>${escapeHtml(item.label || item.key)}</span>
        `;
        body.appendChild(row);
      }
    }
  
    function isFsNow() {
      if (typeof getIsFullscreen === "function") return !!getIsFullscreen();
      return target.classList.contains("is-fs");
    }
  
    function setFs(next) {
      if (next) {
        document.body.classList.add("is-ovl-fs");
        target.classList.add("is-fs");
      } else {
        document.body.classList.remove("is-ovl-fs");
        target.classList.remove("is-fs");
      }
      onFullscreen?.(next);
    }
  
    function togglePopover(force) {
      if (!popover) return;
      const open = (typeof force === "boolean") ? force : popover.hidden;
      popover.hidden = !open;
    }
  
    // --- listeners (ONE each)
    function onDocClick(e) {
      if (!popover || popover.hidden) return;
      if (btnLayers && btnLayers.contains(e.target)) return;
      if (popover.contains(e.target)) return;
      togglePopover(false);
    }
  
    function onLayersClick(e) {
      e.stopPropagation();
      togglePopover();
    }
  
    function onHomeClick() {
      onHome?.();
    }
  
    function onFsClick() {
      setFs(!isFsNow());
    }
  
    function onPopoverChange(e) {
      const t = e.target;
      if (!t || t.tagName !== "INPUT") return;
      const key = t.getAttribute("data-opt");
      if (!key) return;
      onToggleLayer?.(key, !!t.checked);
    }
  
    // mount
    renderLayers();
  
    btnLayers?.addEventListener("click", onLayersClick);
    btnHome?.addEventListener("click", onHomeClick);
    btnFs?.addEventListener("click", onFsClick);
    popover?.addEventListener("change", onPopoverChange);
    document.addEventListener("click", onDocClick);
  
    // API
    return {
      setLayers(nextLayers) {
        // обновить список слоёв (и состояние checked)
        layers.splice(0, layers.length, ...(nextLayers || []));
        renderLayers();
      },
      openLayers() { togglePopover(true); },
      closeLayers() { togglePopover(false); },
      setFullscreen(v) { setFs(!!v); },
      destroy() {
        btnLayers?.removeEventListener("click", onLayersClick);
        btnHome?.removeEventListener("click", onHomeClick);
        btnFs?.removeEventListener("click", onFsClick);
        popover?.removeEventListener("change", onPopoverChange);
        document.removeEventListener("click", onDocClick);
        ui.remove();
      }
    };
  }
  
  // --- internal
  const TEMPLATE_HTML = `
  <div class="ovl-controls" data-ovl-root>
    <div class="ovl-controls-col">
      <button type="button" class="ovl-btn ovl-btn-primary" data-ovl-layers aria-label="Layers" title="Layers">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </button>
  
      <button type="button" class="ovl-btn" data-ovl-home aria-label="Home" title="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5"></path>
          <path d="M5 10v10h14V10"></path>
          <path d="M9.5 20v-6h5v6"></path>
        </svg>
      </button>
  
      <button type="button" class="ovl-btn" data-ovl-fs aria-label="Fullscreen" title="Fullscreen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M8 3H3v5"></path>
          <path d="M16 3h5v5"></path>
          <path d="M3 16v5h5"></path>
          <path d="M21 16v5h-5"></path>
        </svg>
      </button>
    </div>
  
    <div class="ovl-popover" data-ovl-popover hidden>
      <div class="ovl-popover-title">Layers</div>
      <div class="ovl-popover-body" data-ovl-popover-body></div>
    </div>
  </div>
  `;
  
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  
  function escapeAttr(s) {
    return escapeHtml(s).replaceAll(" ", "");
  }