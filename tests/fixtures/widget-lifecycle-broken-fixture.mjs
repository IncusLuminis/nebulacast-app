import { createLifecycle } from "../../sites/staging/shared/lifecycle.mjs";

export const BROKEN_FIXTURE_TYPE = "lifecycle-broken";

export function createBrokenWidgetDefinition({ ledger, events }) {
  return {
    type: BROKEN_FIXTURE_TYPE,
    version: 1,
    defaults: { orientation: "auto", theme: "inherit", density: "normal" },
    capabilities: { observerAware: false, timeAware: false, multiInstance: true },
    loader: async () => ({
      mount(_root, _context, _config, _host) {
        const lifecycle = createLifecycle({
          // This is deliberately strict: the child-process test must fail.
          onError: ({ error, phase }) => {
            events.push({ type: BROKEN_FIXTURE_TYPE, phase: "cleanup-error", lifecyclePhase: phase });
            throw new Error(`${BROKEN_FIXTURE_TYPE} ${phase}: ${error.message}`);
          },
        });
        lifecycle.add(ledger.acquire("timers", BROKEN_FIXTURE_TYPE));
        lifecycle.add(() => { throw new Error("intentional cleanup failure"); });
        return { destroy: () => lifecycle.dispose() };
      },
    }),
  };
}
