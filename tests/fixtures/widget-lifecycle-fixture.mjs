import { createLifecycle } from "../../sites/staging/shared/lifecycle.mjs";

export const LIFECYCLE_FIXTURE_TYPE = "lifecycle-fixture";
export const LIFECYCLE_FOUNDATION_TYPE = "lifecycle-foundation";

export function createDeterministicWidgetDefinition({ ledger, events, type = LIFECYCLE_FIXTURE_TYPE }) {
  let sequence = 0;
  return {
    type,
    version: 1,
    defaults: { orientation: "auto", theme: "inherit", density: "normal" },
    capabilities: { observerAware: true, timeAware: true, multiInstance: true },
    loader: async () => ({
      mount(root, context, config, host) {
        const instanceId = `${type}-${++sequence}`;
        events.push({ type, phase: "mount", instanceId });
        if (config.failPhase === "mount") throw new Error("intentional mount failure");

        const lifecycle = createLifecycle({
          onError: ({ error, phase }) => {
            events.push({ type, phase: "cleanup-error", instanceId, error, lifecyclePhase: phase });
            throw error;
          },
        });
        const releaseResources = [
          ledger.acquire("timers", instanceId),
          ledger.acquire("observers", instanceId),
          ledger.acquire("listeners", instanceId),
          ledger.acquire("requests", instanceId),
        ];
        for (const release of releaseResources) lifecycle.add(release);
        lifecycle.add(context.subscribe(snapshot => events.push({
          type,
          phase: "context",
          instanceId,
          snapshot,
        })));
        lifecycle.add(ledger.acquire("subscriptions", instanceId));
        lifecycle.add(() => root.removeAttribute("data-fixture-instance"));
        root.setAttribute("data-fixture-instance", instanceId);

        return {
          update(patch = {}) {
            if (config.failPhase === "update" || patch.failPhase === "update") {
              throw new Error("intentional update failure");
            }
            if (patch.state !== undefined) host.setState(patch.state);
            events.push({ type, phase: "update", instanceId, patch });
          },
          resize(size) {
            if (config.failPhase === "resize") throw new Error("intentional resize failure");
            events.push({ type, phase: "resize", instanceId, size });
          },
          refresh() {
            events.push({ type, phase: "refresh", instanceId });
          },
          destroy() {
            events.push({ type, phase: "destroy", instanceId });
            lifecycle.dispose();
          },
        };
      },
    }),
  };
}
