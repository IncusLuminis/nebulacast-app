/**
 * Map Widget - Integrated map-poc.html
 * Displays interactive map with terrain, clouds, radar, night mask, and moon info
 */

let mapIframe = null;
let mapInitialized = false;

/**
 * Mount map widget
 */
export function mountMap(rootEl, storeApi, config = {}) {
  let disposed = false;
  const state = storeApi.getState();
  const mapUrl = typeof config.mapUrl === "string" && config.mapUrl
    ? config.mapUrl
    : "./map-poc.html";
  
  // Create iframe to load map-poc.html
  rootEl.innerHTML = `
    <div class="widget-map-container">
      <iframe 
        id="mapIframe" 
        class="widget-map-iframe"
        title="Weather Map"
      ></iframe>
    </div>
  `;
  
  mapIframe = rootEl.querySelector("#mapIframe");
  mapIframe?.setAttribute("src", mapUrl);
  
  // Wait for iframe to load, then send initial location
  const onLoad = function() {
    if (disposed) return;
    mapInitialized = true;
    updateMapLocation(state);
    
    // Listen for location changes from iframe (if needed)
    window.addEventListener("message", onMessage);
  };
  const onMessage = function(event) {
    if (event.data && event.data.type === "map-location-change") {}
  };
  mapIframe.addEventListener("load", onLoad);
  
  // Subscribe to state changes to update map location
  const unsubscribe = storeApi.subscribe((newState) => {
    if (mapInitialized && mapIframe && mapIframe.contentWindow) {
      updateMapLocation(newState);
    }
  });
  return () => {
    if (disposed) return;
    disposed = true;
    mapIframe?.removeEventListener("load", onLoad);
    window.removeEventListener("message", onMessage);
    unsubscribe?.();
    if (mapIframe === rootEl.querySelector("#mapIframe")) mapIframe = null;
    mapInitialized = false;
  };
}

/**
 * Update map location in iframe
 */
function updateMapLocation(state) {
  if (!mapIframe || !mapIframe.contentWindow) return;
  
  const location = {
    name: state.location.name || `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)}`,
    lat: state.location.lat,
    lon: state.location.lon
  };
  
  // Send message to iframe to update location
  mapIframe.contentWindow.postMessage({
    type: "update-location",
    location: location
  }, "*");
}
