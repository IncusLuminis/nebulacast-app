/**
 * Map Widget - Stub implementation
 * Displays current location on a map (coming soon)
 */

/**
 * Mount map widget
 */
export function mountMap(rootEl, storeApi) {
  const state = storeApi.getState();
  
  rootEl.innerHTML = `
    <div class="widget-card">
      <h3 class="widget-title">Map</h3>
      <div class="widget-content">
        <p class="widget-stub">Map panel (coming soon)</p>
        <p class="widget-location-info">
          Current location: ${state.location.name || `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)}`}
        </p>
      </div>
    </div>
  `;
  
  // Subscribe to state changes
  storeApi.subscribe((state) => {
    const infoEl = rootEl.querySelector(".widget-location-info");
    if (infoEl) {
      infoEl.textContent = `Current location: ${state.location.name || `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)}`}`;
    }
  });
}
