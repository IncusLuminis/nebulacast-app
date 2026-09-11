const cache = new Map();

// Keep the parsed payload cached, but never expose that cached object to a
// widget instance. Sky rendering prepares and annotates data locally; a
// defensive clone preserves cache/network efficiency without allowing one
// mounted instance to mutate another instance's input.
function clonePayload(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

async function loadJSON(url) {
  if (cache.has(url)) return clonePayload(cache.get(url));
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const json = await res.json();
  cache.set(url, json);
  return clonePayload(json);
}

function loadStars(baseUrl) { return loadJSON(`${baseUrl}/data/stars.json`); }
function loadConstellations(baseUrl) { return loadJSON(`${baseUrl}/data/constellations.json`); }

async function loadMilkyWay(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/milkyway.json`);
  } catch (e) {
    console.warn("[SKY] Milky Way not loaded:", e.message);
    return null;
  }
}

async function loadObjectsToday(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/objects_today.json`);
  } catch (e) {
    console.warn("[SKY] objects_today.json not loaded:", e.message);
    return null;
  }
}

async function loadAlertsToday(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/alerts_now.json`);
  } catch (e) {
    console.warn("[SKY] alerts_today.json not loaded:", e.message);
    return null;
  }
}

// +++ add
async function loadSunMoon(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/sun_moon.json`);
  } catch (e) {
    console.warn("[SKY] sun_moon.json not loaded:", e.message);
    return null;
  }
}

// +++ Planets
async function loadPlanets(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/planets.json`);
  } catch (e) {
    console.warn("[SKY] planets.json not loaded:", e.message);
    return null;
  }
}

async function loadMessier(baseUrl) {
  try {
    return await loadJSON(`${baseUrl}/data/dso_messier.json`);
  } catch (e) {
    console.warn("[SKY] messier.json not loaded:", e.message);
    return null;
  }
}

export const Data = {
  loadJSON,
  loadStars,
  loadConstellations,
  loadMilkyWay,
  loadObjectsToday,
  loadAlertsToday,
  loadSunMoon,
  loadPlanets,
  loadMessier
};
