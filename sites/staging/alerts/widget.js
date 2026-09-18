const DEFAULT_GROUPS = Object.freeze(["risk", "neo", "neocp", "transient", "nova", "grb"]);
const GROUP_LABELS = Object.freeze({
  risk: "RISK",
  neo: "NEO",
  neocp: "NEO?",
  transient: "TRAN",
  nova: "NOVA",
  grb: "GRB",
});
const GROUP_CLASSES = Object.freeze({
  risk: "is-risk",
  neo: "is-neo",
  neocp: "is-neo",
  transient: "is-transient",
  nova: "is-nova",
  grb: "is-grb",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function normalizeConfig(config = {}) {
  if (!isObject(config)) throw new TypeError("Alerts widget config must be an object");
  const orientation = config.orientation ?? "auto";
  const theme = config.theme ?? "inherit";
  const density = config.density ?? "normal";
  if (!["auto", "horizontal", "vertical"].includes(orientation)) {
    throw new TypeError("Alerts orientation must be auto, horizontal, or vertical");
  }
  if (!["inherit", "auto", "dark", "light"].includes(theme)) {
    throw new TypeError("Alerts theme must be inherit, auto, dark, or light");
  }
  if (!["compact", "normal", "comfortable"].includes(density)) {
    throw new TypeError("Alerts density must be compact, normal, or comfortable");
  }
  const groups = Array.isArray(config.groups)
    ? [...new Set(config.groups.map(group => String(group).toLowerCase()).filter(Boolean))]
    : [...DEFAULT_GROUPS];
  const maxItems = Number.isFinite(Number(config.maxItems))
    ? Math.max(0, Math.floor(Number(config.maxItems)))
    : 20;
  return {
    ...config,
    orientation,
    theme,
    density,
    dataUrl: String(config.dataUrl || "/sky/data/alerts_now.json"),
    groups,
    maxItems,
  };
}

function metricFor(item) {
  const group = String(item?.group || item?.type || "").toLowerCase();
  const meta = item?.meta || {};
  const parts = [];
  if (group === "grb") {
    return item?.note ? String(item.note).slice(0, 60) : "";
  }
  if (group === "neocp" && item?.mag != null) {
    parts.push(`Mag ${Number(item.mag).toFixed(1)}`);
  } else if (group === "transient") {
    if (item?.type) parts.push(String(item.type));
    if (item?.mag != null) parts.push(`Mag ${Number(item.mag).toFixed(1)}`);
  } else if (group === "neo") {
    if (meta.dist_ld != null) parts.push(`${Number(meta.dist_ld).toFixed(2)} LD`);
    else if (meta.dist_au != null) parts.push(`${Number(meta.dist_au).toFixed(3)} AU`);
    if (meta.diameter_est_km != null) parts.push(`⌀ ${meta.diameter_est_km} km`);
  } else if (group === "risk") {
    if (meta.ip != null) parts.push(`IP ${Number(meta.ip).toExponential(2)}`);
    if (meta.ps != null) parts.push(`PS ${Number(meta.ps).toFixed(2)}`);
  }
  return parts.join(" · ");
}

function ageText(iso, now = Date.now()) {
  if (!iso) return "";
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const diff = Math.max(0, (now - timestamp) / 1000);
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

function itemGroup(item) {
  return String(item?.group || item?.type || "other").toLowerCase();
}

function parsePayload(data) {
  if (!Array.isArray(data?.items)) return { items: [], degraded: false };
  const items = data.items.filter(isObject);
  return { items, degraded: items.length !== data.items.length };
}

/** Canonical root-scoped Sky Alerts implementation for the Widget Runtime. */
export function mountAlerts(root, _context, suppliedConfig = {}, host) {
  if (!isObject(root) || typeof root.querySelector !== "function") {
    throw new TypeError("Alerts widget requires a supplied root with querySelector");
  }

  let config = normalizeConfig(suppliedConfig);
  const documentRef = root.ownerDocument;
  let alive = true;
  let sequence = 0;
  let cachedItems = [];
  let hasData = false;
  let inFlight = null;
  let activeController = null;
  let activeTimer = null;

  root.innerHTML = `
    <div class="nc-alerts-root">
      <div class="nc-alerts-header" data-role="toggle" role="button" tabindex="0" aria-expanded="true">
        <span class="nc-alerts-chevron" aria-hidden="true">▾</span>
        <span class="nc-alerts-title">Sky Alerts</span>
        <span class="nc-alerts-count" data-role="count" aria-label="Alert count"></span>
      </div>
      <div class="nc-alerts-body" data-role="body">
        <div class="nc-alerts-status" data-role="status">Loading…</div>
        <div class="nc-alerts-list" data-role="list"></div>
      </div>
    </div>`;

  const widgetRoot = root.querySelector(".nc-alerts-root");
  const toggle = root.querySelector('[data-role="toggle"]');
  const body = root.querySelector('[data-role="body"]');
  const status = root.querySelector('[data-role="status"]');
  const list = root.querySelector('[data-role="list"]');
  const count = root.querySelector('[data-role="count"]');
  if (!widgetRoot || !toggle || !body || !status || !list || !count) {
    throw new TypeError("Alerts widget markup could not be mounted");
  }

  function setState(nextState) {
    try { host?.setState?.(nextState); } catch (_) {}
  }

  function applyDirectMetadata() {
    if (host || typeof root.setAttribute !== "function") return;
    root.setAttribute("data-nc-orientation", config.orientation);
    root.setAttribute("data-nc-theme", config.theme);
    root.setAttribute("data-nc-density", config.density);
  }

  function showStatus(message) {
    status.textContent = message;
    status.style.display = "";
  }

  function hideStatus() {
    status.textContent = "";
    status.style.display = "none";
  }

  function visibleItems() {
    const allowed = new Set(config.groups);
    return cachedItems.filter(item => allowed.has(itemGroup(item))).slice(0, config.maxItems);
  }

  function renderItems() {
    const items = visibleItems();
    count.textContent = items.length ? String(items.length) : "";
    count.style.display = items.length ? "" : "none";
    if (!items.length) {
      list.innerHTML = "";
      return false;
    }
    const now = Date.now();
    list.innerHTML = items.map(item => {
      const group = itemGroup(item);
      const label = GROUP_LABELS[group] || group.toUpperCase().slice(0, 4);
      const groupClass = GROUP_CLASSES[group] || "is-other";
      const title = item?.title || item?.id || "—";
      const note = item?.note ? String(item.note) : "";
      const metric = metricFor(item);
      const detail = [note, metric].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(" · ");
      const timestamp = item?.updated_utc || item?.ingested_utc || "";
      return `<div class="nc-alert-item ${groupClass}" data-role="item" data-group="${escapeText(group)}" data-id="${escapeText(item?.id || "")}" data-timestamp="${escapeText(timestamp)}">
        <span class="nc-alert-badge">${escapeText(label)}</span>
        <span class="nc-alert-info"><span class="nc-alert-item-title">${escapeText(title)}</span>${detail ? `<span class="nc-alert-detail">${escapeText(detail)}</span>` : ""}</span>
        ${ageText(timestamp, now) ? `<time class="nc-alert-time" datetime="${escapeText(timestamp)}">${escapeText(ageText(timestamp, now))}</time>` : ""}
      </div>`;
    }).join("");
    return true;
  }

  function toggleCollapsed() {
    const collapsed = body.style.display === "none";
    body.style.display = collapsed ? "" : "none";
    toggle.setAttribute("aria-expanded", String(collapsed));
    const chevron = toggle.querySelector(".nc-alerts-chevron");
    if (chevron) chevron.textContent = collapsed ? "▾" : "▸";
  }

  const onToggle = event => {
    if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
    if (event.type === "keydown") event.preventDefault();
    if (alive) toggleCollapsed();
  };
  toggle.addEventListener("click", onToggle);
  toggle.addEventListener("keydown", onToggle);

  function requestJson(url, requestSequence) {
    const Controller = config.AbortController || globalThis.AbortController;
    const controller = typeof Controller === "function" ? new Controller() : null;
    activeController = controller;
    const timeout = Number.isFinite(Number(config.fetchTimeout)) && Number(config.fetchTimeout) > 0
      ? Number(config.fetchTimeout) : 15000;
    const request = Promise.resolve().then(() => {
      const fetchRef = config.fetch || documentRef?.defaultView?.fetch || globalThis.fetch;
      if (typeof fetchRef !== "function") throw new Error("Fetch is unavailable");
      const options = { cache: "no-store" };
      if (controller) options.signal = controller.signal;
      return fetchRef(url, options);
    }).then(response => {
      if (!response?.ok || typeof response.json !== "function") {
        throw new Error(`HTTP ${response?.status || 0}`);
      }
      return response.json();
    });
    let timer;
    const timeoutRequest = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort?.();
        const error = new Error("Request timed out.");
        error.name = "TimeoutError";
        reject(error);
      }, timeout);
      activeTimer = timer;
    });
    return Promise.race([request, timeoutRequest]).finally(() => {
      if (timer) clearTimeout(timer);
      if (activeController === controller) {
        activeController = null;
        if (activeTimer === timer) activeTimer = null;
      }
      // A superseded request must never be allowed to render after a newer one.
      void requestSequence;
    });
  }

  function refresh(force = false) {
    if (!alive) return Promise.resolve();
    if (inFlight && !force) return inFlight;
    if (force && inFlight) {
      activeController?.abort?.();
      inFlight = null;
    }
    const current = ++sequence;
    setState("loading");
    showStatus("Loading…");
    const promise = requestJson(config.dataUrl, current)
      .then(data => {
        if (!alive || current !== sequence) return;
        const payload = parsePayload(data);
        cachedItems = payload.items;
        hasData = true;
        if (renderItems()) {
          hideStatus();
          setState(payload.degraded ? "degraded" : "ready");
        } else {
          showStatus("No active alerts.");
          setState(payload.degraded ? "degraded" : "empty");
        }
      })
      .catch(error => {
        if (!alive || current !== sequence) return;
        if (hasData) {
          renderItems();
          showStatus("Refresh failed; showing stale alerts.");
          setState("stale");
        } else {
          list.innerHTML = "";
          count.textContent = "";
          count.style.display = "none";
          showStatus(`Failed to load Sky Alerts${error?.message ? `: ${error.message}` : "."}`);
          setState("error");
        }
      })
      .finally(() => {
        if (inFlight === promise) inFlight = null;
      });
    inFlight = promise;
    return promise;
  }

  applyDirectMetadata();
  refresh();

  let destroyed = false;
  return {
    update(patch = {}) {
      if (!alive || destroyed) return undefined;
      if (isObject(patch)) {
        const sourceChanged = patch.dataUrl !== undefined || patch.fetch !== undefined || patch.fetchTimeout !== undefined || patch.AbortController !== undefined;
        config = normalizeConfig({ ...config, ...patch });
        applyDirectMetadata();
        if (sourceChanged) return refresh(true);
        if (hasData && !renderItems()) {
          showStatus("No active alerts.");
          setState("empty");
        } else if (hasData) {
          hideStatus();
          setState("ready");
        }
      }
      return undefined;
    },
    resize() { return undefined; },
    refresh() { return refresh(); },
    destroy() {
      if (destroyed) return undefined;
      destroyed = true;
      alive = false;
      ++sequence;
      activeController?.abort?.();
      if (activeTimer) clearTimeout(activeTimer);
      inFlight = null;
      toggle.removeEventListener("click", onToggle);
      toggle.removeEventListener("keydown", onToggle);
      return undefined;
    },
  };
}
