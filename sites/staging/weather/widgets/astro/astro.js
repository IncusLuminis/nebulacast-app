/**
 * Astro Widget - Stub implementation
 * Displays astronomical conditions (coming soon)
 */

/**
 * Mount astro widget
 */
export function mountAstro(rootEl, storeApi) {
  const state = storeApi.getState();
  
  rootEl.innerHTML = `
    <div class="widget-card">
      <h3 class="widget-title">Astronomical Conditions</h3>
      <div class="widget-content">
        <p class="widget-stub">Astro panel (coming soon)</p>
        <p class="widget-location-info">
          Location: ${state.location.name || `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)}`}
        </p>
        <p class="widget-profile-info">
          Profile: ${state.profile || "default"}
        </p>
      </div>
    </div>
  `;
  
  // Subscribe to state changes
  const unsubscribe = storeApi.subscribe((state) => {
    const locInfoEl = rootEl.querySelector(".widget-location-info");
    const profileInfoEl = rootEl.querySelector(".widget-profile-info");
    
    if (locInfoEl) {
      locInfoEl.textContent = `Location: ${state.location.name || `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)}`}`;
    }
    
    if (profileInfoEl) {
      profileInfoEl.textContent = `Profile: ${state.profile || "default"}`;
    }
  });
  return () => unsubscribe?.();
}
