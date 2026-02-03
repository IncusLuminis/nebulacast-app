/**
 * Controls widget: Profile + Time range
 * Single row (two rows on mobile). Updates shared state; Weather widget reacts via subscription.
 */

export function mountControls(rootEl, storeApi) {
  const state = storeApi.getState();
  rootEl.innerHTML = `
    <div class="controls-row">
      <div class="controls-group" aria-label="Weather profile">
        <button type="button" class="controls-btn" data-profile="default" ${state.profile === "default" ? 'data-active="true"' : ""}>Balanced</button>
        <button type="button" class="controls-btn" data-profile="visual" ${state.profile === "visual" ? 'data-active="true"' : ""}>Visual</button>
        <button type="button" class="controls-btn" data-profile="broadband" ${state.profile === "broadband" ? 'data-active="true"' : ""}>Photography</button>
        <button type="button" class="controls-btn" data-profile="planetary" ${state.profile === "planetary" ? 'data-active="true"' : ""}>Planetary</button>
      </div>
      <div class="controls-group" aria-label="Time range">
        <button type="button" class="controls-btn" data-range="today" ${state.range === "today" ? 'data-active="true"' : ""}>Tonight</button>
        <button type="button" class="controls-btn" data-range="48h" ${state.range === "48h" ? 'data-active="true"' : ""}>48h</button>
        <button type="button" class="controls-btn" data-range="7d" ${state.range === "7d" ? 'data-active="true"' : ""}>7d</button>
      </div>
    </div>
  `;

  rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(btn => {
    btn.addEventListener("click", () => {
      rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(b => b.removeAttribute("data-active"));
      btn.setAttribute("data-active", "true");
      storeApi.setState({ profile: btn.dataset.profile });
    });
  });

  rootEl.querySelectorAll(".controls-btn[data-range]").forEach(btn => {
    btn.addEventListener("click", () => {
      rootEl.querySelectorAll(".controls-btn[data-range]").forEach(b => b.removeAttribute("data-active"));
      btn.setAttribute("data-active", "true");
      storeApi.setState({ range: btn.dataset.range });
    });
  });

  storeApi.subscribe((newState) => {
    rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(b => {
      b.setAttribute("data-active", b.dataset.profile === newState.profile ? "true" : "false");
    });
    rootEl.querySelectorAll(".controls-btn[data-range]").forEach(b => {
      b.setAttribute("data-active", b.dataset.range === newState.range ? "true" : "false");
    });
  });
}
