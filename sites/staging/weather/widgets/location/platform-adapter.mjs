import { clampLatLon, formatCoord, parseCoords } from "../../core/utils.js";

const API_GEOCODE = "/api/geocode";
const API_REVGEO = "/api/revgeo";
const API_TIMEZONE = "/api/timezone";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
}

function fallbackTimezone(lat, lon, country = "") {
  if (country === "Poland" || (lat > 49 && lat < 55 && lon > 14 && lon < 25)) return "Europe/Warsaw";
  if (country === "Czech Republic" || (lat > 48.5 && lat < 51 && lon > 12 && lon < 19)) return "Europe/Prague";
  if (country === "United Kingdom" || country === "UK" || (lat > 50 && lat < 56 && lon > -6 && lon < 2)) return "Europe/London";
  if (country === "Germany" || (lat > 47 && lat < 55 && lon > 5 && lon < 15)) return "Europe/Berlin";
  return "UTC";
}

function normalizeResults(data) {
  const results = Array.isArray(data?.results || data) ? (data.results || data) : [];
  return results.map(item => ({
    name: item.name || item.display_name?.split(",")[0] || "Unknown",
    country: item.country || item.address?.country || "",
    admin1: item.admin1 || item.address?.state || "",
    lat: Number(item.lat ?? item.latitude) || 0,
    lon: Number(item.lon ?? item.longitude) || 0,
    tz: item.tz || item.timezone || "",
  })).filter(item => item.lat !== 0 && item.lon !== 0).slice(0, 6);
}

function requireContext(context) {
  if (!isObject(context) || typeof context.get !== "function" ||
      typeof context.subscribe !== "function" || typeof context.update !== "function") {
    throw new TypeError("Location platform adapter requires Platform Context");
  }
}

/**
 * Instance-scoped Location controller for the Platform Context runtime.
 * The legacy mountLocation(root, storeApi) facade remains in location.js.
 */
export function createLocationController(root, context, config = {}, host) {
  if (!isObject(root) || typeof root.querySelector !== "function") {
    throw new TypeError("Location platform adapter requires a root with querySelector");
  }
  requireContext(context);

  const view = config.window || root.ownerDocument?.defaultView || globalThis.window;
  const documentRef = root.ownerDocument || view?.document || globalThis.document;
  const navigatorRef = config.navigator || view?.navigator || globalThis.navigator;
  const fetchRef = config.fetch || globalThis.fetch;
  const notify = config.notify || (message => console.warn(`[location] ${message}`));
  const timers = new Set();
  const controllers = new Set();
  const listenerDisposers = new Set();
  const dropdownDisposers = new Set();
  let alive = true;
  let searchSequence = 0;
  let geoSequence = 0;
  let apiAvailable = null;
  let unsubscribe = null;
  let elements;

  const schedule = (callback, delay) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (alive) callback();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };

  async function requestJson(url) {
    if (typeof fetchRef !== "function" || !alive) return null;
    const AbortControllerRef = config.AbortController || globalThis.AbortController;
    const controller = typeof AbortControllerRef === "function" ? new AbortControllerRef() : null;
    if (controller) controllers.add(controller);
    try {
      const response = await fetchRef(url, controller ? { signal: controller.signal } : undefined);
      if (!alive || !response?.ok || typeof response.json !== "function") return null;
      return await response.json();
    } catch (error) {
      if (alive && error?.name !== "AbortError") console.warn(`[location] request failed: ${url}`, error);
      return null;
    } finally {
      if (controller) controllers.delete(controller);
    }
  }

  async function lookupTimezone(lat, lon, country) {
    const data = await requestJson(`${API_TIMEZONE}?lat=${lat}&lon=${lon}`);
    return data?.timezone || fallbackTimezone(lat, lon, country);
  }

  function snapshot() {
    const value = context.get() || {};
    return value.observer || {};
  }

  function renderSnapshot() {
    if (!elements) return;
    const observer = snapshot();
    const hasCoordinates = Number.isFinite(observer.lat) && Number.isFinite(observer.lon);
    if (elements.input && observer.name) {
      const current = elements.input.value || "";
      if (!current.includes(",") || current === elements.input.dataset.contextValue) {
        elements.input.value = observer.name;
      }
      elements.input.dataset.contextValue = observer.name;
    }
    if (elements.status) {
      elements.status.textContent = hasCoordinates
        ? `${observer.name || formatCoord(observer.lat, observer.lon)} · ${observer.lat}, ${observer.lon} · ${observer.timezone || "UTC"}`
        : "No location selected";
    }
  }

  function closeDropdown() {
    if (!elements?.dropdown) return;
    for (const dispose of dropdownDisposers) dispose();
    dropdownDisposers.clear();
    elements.dropdown.textContent = "";
    elements.dropdown.classList.remove("show");
  }

  function openDropdown(results) {
    closeDropdown();
    if (!elements?.dropdown || !documentRef || !results.length) return;
    for (const item of results) {
      const option = documentRef.createElement("button");
      option.type = "button";
      option.className = "loc-dd-item";
      option.setAttribute("role", "option");
      option.innerHTML = `<span class="loc-dd-item-name">${escapeText(item.name)}</span><span class="loc-dd-item-details">${escapeText(item.country)} · ${item.lat.toFixed(2)}, ${item.lon.toFixed(2)}</span>`;
      const onClick = () => { void selectLocation(item); };
      option.addEventListener("click", onClick);
      dropdownDisposers.add(() => option.removeEventListener("click", onClick));
      elements.dropdown.appendChild(option);
    }
    elements.dropdown.classList.add("show");
  }

  async function selectLocation(item) {
    if (!alive) return;
    closeDropdown();
    const timezone = item.tz || await lookupTimezone(item.lat, item.lon, item.country);
    if (!alive) return;
    context.update({ observer: {
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      timezone: timezone || "UTC",
      source: "user",
    } });
    if (elements?.input) elements.input.value = item.name;
  }

  async function search(query, sequence) {
    const data = await requestJson(`${API_GEOCODE}?q=${encodeURIComponent(query)}`);
    if (!alive || sequence !== searchSequence) return;
    apiAvailable = data !== null;
    openDropdown(normalizeResults(data || []));
  }

  async function handleInput() {
    if (!elements?.input || !alive) return;
    const value = elements.input.value.trim();
    closeDropdown();
    ++searchSequence;
    if (!value) return;
    const coords = parseCoords(value);
    if (coords) {
      const { lat, lon } = clampLatLon(coords.lat, coords.lon);
      const timezone = await lookupTimezone(lat, lon, "");
      if (!alive) return;
      context.update({ observer: {
        name: formatCoord(lat, lon), lat, lon, timezone, source: "user",
      } });
      return;
    }
    if (value.length < 2) return;
    const sequence = searchSequence;
    schedule(() => { void search(value, sequence); }, Number(config.searchDebounceMs ?? 400));
  }

  async function useGeolocation() {
    if (!alive || !navigatorRef?.geolocation?.getCurrentPosition) {
      notify("Geolocation not supported");
      return;
    }
    const sequence = ++geoSequence;
    if (elements?.geoButton) elements.geoButton.disabled = true;
    navigatorRef.geolocation.getCurrentPosition(async position => {
      if (!alive || sequence !== geoSequence) return;
      const { latitude: lat, longitude: lon } = position.coords;
      const reverse = await requestJson(`${API_REVGEO}?lat=${lat}&lon=${lon}`);
      const timezone = await lookupTimezone(lat, lon, "");
      if (!alive || sequence !== geoSequence) return;
      const name = reverse?.name || reverse?.address?.city || "My location";
      context.update({ observer: { name, lat, lon, timezone, source: "geolocate" } });
      if (elements?.input) elements.input.value = name;
      if (elements?.geoButton) elements.geoButton.disabled = false;
    }, () => {
      if (alive && elements?.geoButton) elements.geoButton.disabled = false;
      if (alive) notify("Location permission denied");
    });
  }

  async function share() {
    const observer = snapshot();
    if (!Number.isFinite(observer.lat) || !Number.isFinite(observer.lon)) return;
    const params = new URLSearchParams({ lat: observer.lat.toFixed(4), lon: observer.lon.toFixed(4) });
    if (observer.name && observer.name !== formatCoord(observer.lat, observer.lon)) params.set("name", observer.name);
    if (observer.timezone && observer.timezone !== "UTC") params.set("tz", observer.timezone);
    const extras = typeof config.urlParams === "function" ? config.urlParams() : config.urlParams;
    for (const [key, value] of Object.entries(extras || {})) if (value !== undefined && value !== null) params.set(key, value);
    const location = view?.location;
    const url = `${location?.origin || ""}${location?.pathname || "/"}?${params}`;
    try {
      await (config.clipboard || navigatorRef?.clipboard)?.writeText(url);
      notify("Copied");
    } catch (error) {
      if (alive) notify("Failed to copy");
      if (alive) console.warn("[location] share failed", error);
    }
  }

  async function checkAPIStatus() {
    const data = await requestJson("/api/astro-weather?lat=52.2297&lon=21.0122&tz=Europe/Warsaw&hours=1&profile=balanced");
    apiAvailable = data !== null;
    return apiAvailable;
  }

  function mount() {
    root.classList.add("nc-location-platform");
    root.innerHTML = `
      <div class="loc-action-bar">
        <span class="loc-action-label">Location</span>
        <div class="loc-input-wrapper">
          <input type="text" class="loc-input" placeholder='City or "lat, lon"' autocomplete="off">
          <div class="loc-dd" role="listbox"></div>
        </div>
        <button type="button" class="loc-btn-secondary loc-geo-button">📍 My location</button>
        <button type="button" class="loc-btn-icon loc-share-button">🔗</button>
      </div>
      <div class="loc-status-line"><span class="loc-status-content"></span></div>
    `;
    elements = {
      input: root.querySelector(".loc-input"),
      dropdown: root.querySelector(".loc-dd"),
      geoButton: root.querySelector(".loc-geo-button"),
      shareButton: root.querySelector(".loc-share-button"),
      status: root.querySelector(".loc-status-content"),
    };
    renderSnapshot();
    const onInput = () => { void handleInput(); };
    const onGeo = () => { void useGeolocation(); };
    const onShare = () => { void share(); };
    elements.input?.addEventListener("input", onInput);
    elements.geoButton?.addEventListener("click", onGeo);
    elements.shareButton?.addEventListener("click", onShare);
    if (elements.input) lifecycleAdd(elements.input, "input", onInput);
    if (elements.geoButton) lifecycleAdd(elements.geoButton, "click", onGeo);
    if (elements.shareButton) lifecycleAdd(elements.shareButton, "click", onShare);
    unsubscribe = context.subscribe(() => { if (alive) renderSnapshot(); });
    if (config.checkAPIStatus !== false) void checkAPIStatus();
    return controls;
  }

  function lifecycleAdd(target, event, listener) {
    // Store listener cleanup in the controller's local disposer list.
    listenerDisposers.add(() => target.removeEventListener(event, listener));
  }

  function update(patch = {}) {
    if (!alive) return undefined;
    if (isObject(patch.observer) || isObject(patch.time)) context.update(patch);
    renderSnapshot();
    return context.get();
  }

  function resize() {
    if (!alive) return undefined;
    return root;
  }

  function refresh() {
    if (!alive) return undefined;
    return checkAPIStatus();
  }

  function destroy() {
    if (!alive) return;
    alive = false;
    ++searchSequence;
    ++geoSequence;
    clearTimers();
    for (const controller of controllers) controller.abort();
    controllers.clear();
    closeDropdown();
    for (const dispose of listenerDisposers) dispose();
    listenerDisposers.clear();
    if (typeof unsubscribe === "function") unsubscribe();
    unsubscribe = null;
    root.classList.remove("nc-location-platform");
  }

  const controls = { update, resize, refresh, destroy };
  return { mount, controls };
}

export function mountLocationPlatform(root, context, config = {}, host) {
  return createLocationController(root, context, config, host).mount();
}
