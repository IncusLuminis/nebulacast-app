/**
 * Map Widget - Integrated map-poc.html
 * Displays interactive map with terrain, clouds, radar, night mask, and moon info
 */

let mapIframe = null;
let mapInitialized = false;

/**
 * Mount map widget
 */
export function mountMap(rootEl, storeApi) {
  const state = storeApi.getState();
  
  // Create iframe to load map-poc.html
  rootEl.innerHTML = `
    <div class="widget-map-container">
      <iframe 
        id="mapIframe" 
        src="./map-poc.html" 
        class="widget-map-iframe"
        title="Weather Map"
      ></iframe>
    </div>
  `;
  
  mapIframe = rootEl.querySelector("#mapIframe");
  
  // Wait for iframe to load, then send initial location
  mapIframe.addEventListener("load", function() {
    mapInitialized = true;
    updateMapLocation(state);
    
    // Listen for location changes from iframe (if needed)
    window.addEventListener("message", function(event) {
      // Handle messages from iframe if needed
      if (event.data && event.data.type === "map-location-change") {
        // Could update state if user moves map, but for now we only sync one way
      }
    });
  });
  
  // Subscribe to state changes to update map location
  storeApi.subscribe((newState) => {
    if (mapInitialized && mapIframe && mapIframe.contentWindow) {
      updateMapLocation(newState);
    }
  });
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
