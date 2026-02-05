/**
 * Location Widget - Controller for location selection
 * Manages location input, geolocation, and share functionality
 */

import { parseCoords, clampLatLon, formatCoord, escapeHtml, debounce, showToast } from "../../core/utils.js";

const API_BASE = "";
const API_GEOCODE = API_BASE + "/api/geocode";
const API_REVGEO = API_BASE + "/api/revgeo";
const API_TIMEZONE = API_BASE + "/api/timezone";

let storeApi = null;
let searchDebounceTimer = null;
let geoRequestId = null;
let apiAvailable = null;

/**
 * Lookup timezone for coordinates
 */
async function lookupTimezone(lat, lon, country) {
  try {
    const url = API_TIMEZONE + "?lat=" + lat + "&lon=" + lon;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.timezone) {
        return data.timezone;
      }
    }
  } catch (e) {
    console.warn("Timezone API failed:", e);
  }
  
  // Fallback: simple guessing
  if (country === "United Kingdom" || country === "UK" || 
      (lat > 50.0 && lat < 56.0 && lon > -6.0 && lon < 2.0)) {
    return "Europe/London";
  }
  if (country === "Belgium" || (lat > 50.5 && lat < 51.5 && lon > 2.5 && lon < 6.5)) {
    return "Europe/Brussels";
  }
  if (country === "Germany" || (lat > 47.0 && lat < 55.0 && lon > 5.0 && lon < 15.0)) {
    return "Europe/Berlin";
  }
  if (country === "Poland" || (lat > 49.0 && lat < 55.0 && lon > 14.0 && lon < 25.0)) {
    return "Europe/Warsaw";
  }
  if (country === "Czech Republic" || (lat > 48.5 && lat < 51.0 && lon > 12.0 && lon < 19.0)) {
    return "Europe/Prague";
  }
  if (country === "France" || (lat > 42.0 && lat < 51.0 && lon > -5.0 && lon < 10.0)) {
    return "Europe/Paris";
  }
  
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch (e) {
    return "UTC";
  }
}

/**
 * Search for cities via geocode API
 */
async function searchGeocode(q) {
  try {
    const res = await fetch(API_GEOCODE + "?q=" + encodeURIComponent(q));
    if (res.ok) {
      const data = await res.json();
      apiAvailable = true;
      const results = Array.isArray(data.results || data) ? (data.results || data) : [];
      return results.map(item => ({
        name: item.name || item.display_name?.split(',')[0] || 'Unknown',
        country: item.country || item.country_code || item.address?.country || '',
        admin1: item.admin1 || item.address?.state || '',
        lat: item.lat || item.latitude || parseFloat(item.lat) || 0,
        lon: item.lon || item.longitude || parseFloat(item.lon) || 0,
        tz: item.tz || item.timezone || ''
      })).filter(item => item.lat !== 0 && item.lon !== 0).slice(0, 6);
    }
    if (res.status === 404) {
      apiAvailable = false;
      return [];
    }
    throw new Error("HTTP " + res.status);
  } catch (e) {
    console.warn("Geocode failed:", e);
    apiAvailable = false;
    return [];
  }
}

/**
 * Update status line display
 */
async function updateStatusLine(state, elements) {
  const { locStatusLine, locStatusContent } = elements;
  if (!locStatusLine || !locStatusContent) return;
  
  const loc = state.location;
  if (!loc || !loc.lat || !loc.lon) {
    locStatusLine.style.display = "none";
    return;
  }
  
  // Get timezone display name
  let tzDisplay = loc.tz || "UTC";
  const tzPromise = (async () => {
    try {
      const res = await fetch(API_TIMEZONE + "?lat=" + loc.lat + "&lon=" + loc.lon);
      if (res.ok) {
        const tzData = await res.json();
        if (tzData.display) {
          return tzData.display;
        }
      }
    } catch (e) {}
    return tzDisplay;
  })();
  
  // Profile display names
  const profileNames = {
    "default": "Balanced",
    "balanced": "Balanced",
    "visual": "Visual",
    "photo": "Photography",
    "photography": "Photography",
    "broadband": "Photography",
    "planetary": "Planetary"
  };
  const profileDisplay = profileNames[state.profile?.toLowerCase()] || "Balanced";
  
  // Format place name
  const placeName = loc.name && loc.name !== formatCoord(loc.lat, loc.lon) 
    ? loc.name 
    : formatCoord(loc.lat, loc.lon);
  
  // API status
  const apiStatusClass = apiAvailable === true ? "online" : (apiAvailable === false ? "offline" : "");
  const apiStatusText = apiAvailable === true ? "API online" : (apiAvailable === false ? "API unavailable" : "");
  
  // Build status content (static text only: location, coords, timezone, profile, API status)
  locStatusContent.innerHTML = `
    <span>📍 ${escapeHtml(placeName)} (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)})</span>
    <span>·</span>
    <span>🕒 ${escapeHtml(tzDisplay)}</span>
    <span>·</span>
    <span>🧠 ${escapeHtml(profileDisplay)}</span>
    <span>·</span>
    <span class="loc-status-api ${apiStatusClass}">${apiStatusText}</span>
  `;
  
  locStatusLine.style.display = "block";
  
  // Update timezone display if API responds
  tzPromise.then(displayTz => {
    if (displayTz !== tzDisplay && locStatusContent) {
      const apiStatusClass = apiAvailable === true ? "online" : (apiAvailable === false ? "offline" : "");
      const apiStatusText = apiAvailable === true ? "API online" : (apiAvailable === false ? "API unavailable" : "");
      locStatusContent.innerHTML = `
        <span>📍 ${escapeHtml(placeName)} (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)})</span>
        <span>·</span>
        <span>🕒 ${escapeHtml(displayTz)}</span>
        <span>·</span>
        <span>🧠 ${escapeHtml(profileDisplay)}</span>
        <span>·</span>
        <span class="loc-status-api ${apiStatusClass}">${apiStatusText}</span>
      `;
    }
  });
}

/**
 * Show/hide dropdown
 */
function openDropdown(items, dropdown) {
  if (!dropdown) return;
  closeDropdown(dropdown);
  if (!items || items.length === 0) return;
  
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "loc-dd-item";
    const label = item.name + (item.admin1 ? ", " + item.admin1 : "") + (item.country ? ", " + item.country : "");
    div.innerHTML = `
      <div class="loc-dd-item-name">${escapeHtml(item.name)}</div>
      <div class="loc-dd-item-details">${escapeHtml(label)} · ${item.lat?.toFixed(2) || ""}, ${item.lon?.toFixed(2) || ""}</div>
    `;
    div.addEventListener("click", () => selectLocation(item));
    dropdown.appendChild(div);
  });
  dropdown.classList.add("show");
}

function closeDropdown(dropdown) {
  if (!dropdown) return;
  dropdown.classList.remove("show");
  dropdown.innerHTML = "";
}

/**
 * Select location from dropdown
 */
async function selectLocation(item) {
  closeDropdown(document.getElementById("locDropdown"));
  
  geoRequestId = null;
  
  // Determine timezone
  const tzPromise = item.tz 
    ? Promise.resolve(item.tz)
    : lookupTimezone(item.lat, item.lon, item.country).catch(() => "UTC");
  
  const tz = await Promise.race([
    tzPromise,
    new Promise(resolve => setTimeout(() => resolve("UTC"), 1000))
  ]);
  
  // Update store
  if (storeApi) {
    storeApi.setState({
      location: {
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        tz: tz || "UTC"
      },
      source: "user"
    });
  }
  
  // Update input
  const input = document.getElementById("locInput");
  if (input) input.value = item.name;
}

/**
 * Handle input: parse coordinates or search cities
 */
async function handleInput(elements) {
  const { locInput, locDropdown } = elements;
  if (!locInput) return;
  
  const text = locInput.value.trim();
  geoRequestId = null;
  
  if (!text) {
    closeDropdown(locDropdown);
    return;
  }
  
  // Try to parse coordinates
  const coords = parseCoords(text);
  if (coords) {
    closeDropdown(locDropdown);
    const clamped = clampLatLon(coords.lat, coords.lon);
    
    const tzPromise = lookupTimezone(clamped.lat, clamped.lon, "").catch(() => "UTC");
    const tz = await Promise.race([
      tzPromise,
      new Promise(resolve => setTimeout(() => resolve("UTC"), 1000))
    ]);
    
    if (storeApi) {
      storeApi.setState({
        location: {
          name: formatCoord(clamped.lat, clamped.lon),
          lat: clamped.lat,
          lon: clamped.lon,
          tz: tz || "UTC"
        },
        source: "user"
      });
    }
    
    return;
  }
  
  // City search
  if (text.length < 2) {
    closeDropdown(locDropdown);
    return;
  }
  
  // Debounced search
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(async () => {
    const results = await searchGeocode(text);
    if (results.length > 0) {
      openDropdown(results, locDropdown);
    } else {
      closeDropdown(locDropdown);
    }
  }, 400);
}

/**
 * Use browser geolocation
 */
async function useMyLocation(elements) {
  const { locGeoBtn, locInput } = elements;
  
  if (!navigator.geolocation) {
    showToast("Geolocation not supported", 2000);
    return;
  }
  
  if (locGeoBtn) locGeoBtn.disabled = true;
  
  const currentGeoRequestId = Date.now();
  geoRequestId = currentGeoRequestId;
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      if (geoRequestId !== currentGeoRequestId) return;
      
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      let name = "My location";
      let tz = "UTC";
      
      try {
        const revGeoPromise = fetch(API_REVGEO + "?lat=" + lat + "&lon=" + lon)
          .then(res => res.ok ? res.json() : null)
          .then(data => data?.name || null)
          .catch(() => null);
        
        const tzPromise = lookupTimezone(lat, lon, "").catch(() => "UTC");
        
        const [revGeoName, resolvedTz] = await Promise.all([
          Promise.race([revGeoPromise, new Promise(resolve => setTimeout(() => resolve(null), 2000))]),
          tzPromise
        ]);
        
        if (revGeoName) name = revGeoName;
        tz = resolvedTz;
      } catch (e) {
        console.warn("Location lookup failed:", e);
      }
      
      if (geoRequestId !== currentGeoRequestId) {
        if (locGeoBtn) locGeoBtn.disabled = false;
        return;
      }
      
      if (storeApi) {
        storeApi.setState({
          location: { name, lat, lon, tz },
          source: "geolocate"
        });
      }
      
      if (locInput) locInput.value = name;
      if (locGeoBtn) locGeoBtn.disabled = false;
    },
    (err) => {
      if (geoRequestId === currentGeoRequestId) {
        showToast("Location permission denied", 2000);
        if (locGeoBtn) locGeoBtn.disabled = false;
      }
    }
  );
}

/**
 * Copy permalink to clipboard
 */
async function shareLocation() {
  if (!storeApi) return;
  const state = storeApi.getState();
  const loc = state.location;
  
  if (!loc || !loc.lat || !loc.lon) return;
  
  // Build URL with query params
  const params = new URLSearchParams();
  if (loc.lat && loc.lon) {
    params.set("lat", loc.lat.toFixed(4));
    params.set("lon", loc.lon.toFixed(4));
  }
  if (loc.name && loc.name !== formatCoord(loc.lat, loc.lon)) {
    params.set("name", loc.name);
  }
  if (loc.tz && loc.tz !== "UTC") {
    params.set("tz", loc.tz);
  }
  if (state.profile && state.profile !== "default") {
    params.set("profile", state.profile);
  }
  if (state.range && state.range !== "today") {
    params.set("range", state.range);
  }
  
  const url = window.location.origin + window.location.pathname + "?" + params.toString();
  
  try {
    await navigator.clipboard.writeText(url);
    showToast("Copied");
  } catch (e) {
    console.warn("Failed to copy:", e);
    showToast("Failed to copy", 2000);
  }
}

/**
 * Check API availability
 */
async function checkAPIStatus() {
  try {
    const res = await fetch(API_BASE + "/api/astro-weather?lat=52.2297&lon=21.0122&tz=Europe/Warsaw&hours=1&profile=default");
    apiAvailable = res.ok;
  } catch (e) {
    apiAvailable = false;
  }
}

/**
 * Mount location widget
 */
export function mountLocation(rootEl, api) {
  storeApi = api;
  
  // Create HTML structure
  rootEl.innerHTML = `
    <div class="loc-action-bar">
      <span class="loc-action-label">Location</span>
      <div class="loc-input-wrapper">
        <input type="text" class="loc-input" id="locInput" placeholder='City or "lat, lon"' autocomplete="off">
        <div class="loc-dd" id="locDropdown"></div>
      </div>
      <button type="button" class="loc-btn-secondary" id="locGeoBtn" title="Use my location">📍 My location</button>
      <button type="button" class="loc-btn-icon" id="locShareBtn" title="Share Location">🔗</button>
    </div>
    <div class="loc-status-line" id="locStatusLine" style="display:none">
      <span class="loc-status-content" id="locStatusContent"></span>
    </div>
  `;
  
  // Get elements
  const elements = {
    locInput: document.getElementById("locInput"),
    locGeoBtn: document.getElementById("locGeoBtn"),
    locShareBtn: document.getElementById("locShareBtn"),
    locDropdown: document.getElementById("locDropdown"),
    locStatusLine: document.getElementById("locStatusLine"),
    locStatusContent: document.getElementById("locStatusContent")
  };
  
  // Initial state
  const initialState = storeApi.getState();
  if (elements.locInput) {
    elements.locInput.value = initialState.location.name || formatCoord(initialState.location.lat, initialState.location.lon);
  }
  updateStatusLine(initialState, elements);
  
  // Event listeners
  if (elements.locInput) {
    const debouncedHandleInput = debounce(() => handleInput(elements), 500);
    let isProcessingEnter = false;
    elements.locInput.addEventListener("input", debouncedHandleInput);
    
    elements.locInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isProcessingEnter) return; // Prevent duplicate Enter handling
        isProcessingEnter = true;
        const text = elements.locInput.value.trim();
        if (!text) {
          isProcessingEnter = false;
          return;
        }
        const coords = parseCoords(text);
        if (coords) {
          await handleInput(elements);
          isProcessingEnter = false;
          return;
        }
        const firstItem = elements.locDropdown?.querySelector(".loc-dd-item");
        if (firstItem) {
          firstItem.click();
          isProcessingEnter = false;
          return;
        }
        // City name: trigger fetch and select first result if any
        const results = await searchGeocode(text);
        if (results.length > 0) {
          openDropdown(results, elements.locDropdown);
          const first = elements.locDropdown?.querySelector(".loc-dd-item");
          if (first) first.click();
        } else {
          await handleInput(elements);
        }
        isProcessingEnter = false;
      } else if (e.key === "Escape") {
        closeDropdown(elements.locDropdown);
      }
    });
  }
  
  if (elements.locGeoBtn) {
    elements.locGeoBtn.addEventListener("click", () => useMyLocation(elements));
  }
  
  if (elements.locShareBtn) {
    elements.locShareBtn.addEventListener("click", shareLocation);
  }
  
  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (elements.locDropdown && 
        !elements.locInput?.contains(e.target) && 
        !elements.locDropdown.contains(e.target)) {
      closeDropdown(elements.locDropdown);
    }
  });
  
  // Subscribe to state changes
  storeApi.subscribe((state) => {
    if (elements.locInput && state.location.name) {
      const currentValue = elements.locInput.value;
      const newValue = state.location.name;
      // Only update if different (avoid cursor jumping)
      if (currentValue !== newValue && !currentValue.includes(",")) {
        elements.locInput.value = newValue;
      }
    }
    updateStatusLine(state, elements);
  });
  
  // Check API status
  checkAPIStatus().then(() => {
    updateStatusLine(storeApi.getState(), elements);
  });
  
  return elements;
}
