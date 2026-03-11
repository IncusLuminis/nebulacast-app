/**
 * Central state management with Event Bus and URL synchronization
 */

const DEBUG = false; // Set to true for console logging
const STORAGE_KEY_LOCATION = "nc-weather-location";

const DEFAULT_STATE = {
  location: {
    name: "Warsaw",
    lat: 52.2297,
    lon: 21.0122,
    tz: "Europe/Warsaw"
  },
  profile: "default", // default|visual|broadband|planetary
  range: "today",     // today|48h|7d (TONIGHT|48H|7D in UI)
  source: "url"      // url|user|geolocate
};

let state = { ...DEFAULT_STATE };
const subscribers = new Set();

/**
 * Get current state (immutable copy)
 */
export function getState() {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Set state (merge partial update)
 */
export function setState(partial, meta = {}) {
  const prevState = { ...state };
  
  // Merge partial update
  if (partial.location) {
    state.location = { ...state.location, ...partial.location };
  }
  if (partial.profile !== undefined) {
    state.profile = partial.profile;
  }
  if (partial.range !== undefined) {
    state.range = partial.range;
  }
  if (partial.source !== undefined) {
    state.source = partial.source;
  }
  
  // Validate
  if (state.location.lat < -90 || state.location.lat > 90) {
    console.warn("Invalid lat:", state.location.lat);
    state.location.lat = Math.max(-90, Math.min(90, state.location.lat));
  }
  if (state.location.lon < -180 || state.location.lon > 180) {
    console.warn("Invalid lon:", state.location.lon);
    state.location.lon = Math.max(-180, Math.min(180, state.location.lon));
  }
  
  if (DEBUG) {
    console.log("[state] setState:", { partial, meta, newState: state });
  }
  
  // Persist location to localStorage
  try {
    if (state.location && typeof state.location.lat === "number" && typeof state.location.lon === "number") {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify({
        lat: state.location.lat,
        lon: state.location.lon,
        tz: state.location.tz || "Europe/Warsaw",
        name: state.location.name || ""
      }));
    }
  } catch (e) {
    if (DEBUG) console.warn("[state] localStorage save failed:", e);
  }

  // Notify subscribers
  emit();
  
  // Sync to URL (but not on every keystroke - debounce in URL sync)
  syncToUrl(state);
}

/**
 * Subscribe to state changes
 * @param {Function} fn - Callback function(state)
 * @returns {Function} Unsubscribe function
 */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * Emit state change event
 */
function emit() {
  const currentState = getState();
  
  // Notify all subscribers
  subscribers.forEach(fn => {
    try {
      fn(currentState);
    } catch (e) {
      console.error("Subscriber error:", e);
    }
  });
  
  // Dispatch custom event for external listeners
  window.dispatchEvent(new CustomEvent("nc:state", { detail: currentState }));
  
  if (DEBUG) {
    console.log("[state] emitted:", currentState);
  }
}

/**
 * Initialize state from URL query parameters
 */
export function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  
  const lat = params.get("lat");
  const lon = params.get("lon");
  const name = params.get("name");
  const tz = params.get("tz");
  const profile = params.get("profile");
  
  if (lat && lon) {
    const location = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      name: name || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
      tz: tz || state.location.tz
    };
    
    // Validate coordinates
    if (!isNaN(location.lat) && !isNaN(location.lon)) {
      state.location = location;
      state.source = "url";
    }
  } else if (name) {
    // City name in URL - will be resolved by location widget
    state.location.name = name;
    state.source = "url";
  }
  
  if (profile && ["default", "visual", "broadband", "planetary"].includes(profile)) {
    state.profile = profile;
  }
  const rangeParam = params.get("range");
  if (rangeParam && ["today", "48h", "7d"].includes(rangeParam)) {
    state.range = rangeParam;
  }
  
  if (DEBUG) {
    console.log("[state] initFromUrl:", state);
  }
  
  return state;
}

/**
 * Sync state to URL (without pushing to history)
 */
let urlSyncTimer = null;
export function syncToUrl(currentState) {
  // Debounce URL updates
  if (urlSyncTimer) {
    clearTimeout(urlSyncTimer);
  }
  
  urlSyncTimer = setTimeout(() => {
    const params = new URLSearchParams();
    
    if (currentState.location.lat && currentState.location.lon) {
      params.set("lat", currentState.location.lat.toFixed(4));
      params.set("lon", currentState.location.lon.toFixed(4));
    }
    
    if (currentState.location.name && 
        currentState.location.name !== `${currentState.location.lat.toFixed(4)}, ${currentState.location.lon.toFixed(4)}`) {
      params.set("name", currentState.location.name);
    }
    
    if (currentState.location.tz && currentState.location.tz !== "UTC") {
      params.set("tz", currentState.location.tz);
    }
    
    if (currentState.profile && currentState.profile !== "default") {
      params.set("profile", currentState.profile);
    }
    if (currentState.range && currentState.range !== "today") {
      params.set("range", currentState.range);
    }
    
    const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    
    if (newUrl !== window.location.pathname + window.location.search) {
      history.replaceState(null, "", newUrl);
      
      if (DEBUG) {
        console.log("[state] synced to URL:", newUrl);
      }
    }
  }, 300); // 300ms debounce
}

/**
 * Listen to browser back/forward navigation
 */
export function listenPopState() {
  window.addEventListener("popstate", () => {
    const prevState = { ...state };
    initFromUrl();
    
    // Only emit if state actually changed
    if (JSON.stringify(prevState) !== JSON.stringify(state)) {
      emit();
    }
  });
}

/**
 * Initialize state store
 */
export function initState() {
  // Initialize from URL or use defaults
  initFromUrl();
  
  // If URL was empty, try localStorage, then defaults
  if (!window.location.search) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (stored) {
        const loc = JSON.parse(stored);
        if (loc && typeof loc.lat === "number" && typeof loc.lon === "number" &&
            loc.lat >= -90 && loc.lat <= 90 && loc.lon >= -180 && loc.lon <= 180) {
          state.location = {
            ...DEFAULT_STATE.location,
            lat: loc.lat,
            lon: loc.lon,
            tz: loc.tz || DEFAULT_STATE.location.tz,
            name: loc.name || DEFAULT_STATE.location.name
          };
          state.source = "user";
        }
      }
    } catch (e) {
      if (DEBUG) console.warn("[state] localStorage restore failed:", e);
    }
    if (!state.location.lat || !state.location.lon) {
      state = { ...DEFAULT_STATE };
    }
  }
  
  // Listen to browser navigation
  listenPopState();
  
  if (DEBUG) {
    console.log("[state] initialized:", state);
  }
  
  return state;
}
