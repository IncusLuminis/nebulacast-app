const cache = new Map();

async function loadJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const json = await res.json();
  cache.set(url, json);
  return json;
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
    return await loadJSON(`${baseUrl}/data/alerts_today.json`);
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

export const Data = {
  loadJSON,
  loadStars,
  loadConstellations,
  loadMilkyWay,
  loadObjectsToday,
  loadAlertsToday,
  loadSunMoon
};