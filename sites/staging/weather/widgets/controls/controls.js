/**
 * Controls widget: Profile + Time range
 * Single row (two rows on mobile). Updates shared state; Weather widget reacts via subscription.
 */

export function mountControls(rootEl, storeApi) {
  const cleanups = [];
  const listen = (element, event, handler) => {
    element.addEventListener(event, handler);
    cleanups.push(() => element.removeEventListener(event, handler));
  };
  const state = storeApi.getState();
  rootEl.innerHTML = `
    <div class="controls-row">
      <div class="controls-group" role="group" aria-label="Weather profile">
        <button type="button" class="controls-btn" data-profile="default" aria-pressed="${state.profile === "default"}" ${state.profile === "default" ? 'data-active="true"' : ""}>Balanced</button>
        <button type="button" class="controls-btn" data-profile="visual" aria-pressed="${state.profile === "visual"}" ${state.profile === "visual" ? 'data-active="true"' : ""}>Visual</button>
        <button type="button" class="controls-btn" data-profile="broadband" aria-pressed="${state.profile === "broadband"}" ${state.profile === "broadband" ? 'data-active="true"' : ""}>Photography</button>
        <button type="button" class="controls-btn" data-profile="planetary" aria-pressed="${state.profile === "planetary"}" ${state.profile === "planetary" ? 'data-active="true"' : ""}>Planetary</button>
      </div>
      <div class="controls-group" role="group" aria-label="Time range">
        <button type="button" class="controls-btn" data-range="today" aria-pressed="${state.range === "today"}" ${state.range === "today" ? 'data-active="true"' : ""}>Tonight</button>
        <button type="button" class="controls-btn" data-range="48h" aria-pressed="${state.range === "48h"}" ${state.range === "48h" ? 'data-active="true"' : ""}>48h</button>
        <button type="button" class="controls-btn" data-range="7d" aria-pressed="${state.range === "7d"}" ${state.range === "7d" ? 'data-active="true"' : ""}>7d</button>
      </div>
    </div>
  `;

  rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(btn => {
    const onClick = () => {
      rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(b => b.removeAttribute("data-active"));
      btn.setAttribute("data-active", "true");
      storeApi.setState({ profile: btn.dataset.profile });
    };
    listen(btn, "click", onClick);
  });

  rootEl.querySelectorAll(".controls-btn[data-range]").forEach(btn => {
    const onClick = () => {
      rootEl.querySelectorAll(".controls-btn[data-range]").forEach(b => b.removeAttribute("data-active"));
      btn.setAttribute("data-active", "true");
      storeApi.setState({ range: btn.dataset.range });
    };
    listen(btn, "click", onClick);
  });

  const unsubscribe = storeApi.subscribe((newState) => {
      rootEl.querySelectorAll(".controls-btn[data-profile]").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.profile === newState.profile));
      b.setAttribute("data-active", b.dataset.profile === newState.profile ? "true" : "false");
    });
      rootEl.querySelectorAll(".controls-btn[data-range]").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.range === newState.range));
      b.setAttribute("data-active", b.dataset.range === newState.range ? "true" : "false");
    });
  });
  return () => { unsubscribe?.(); cleanups.splice(0).forEach(fn => fn()); };
}
