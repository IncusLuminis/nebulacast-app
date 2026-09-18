import assert from "node:assert/strict";

/**
 * Execute the common Runtime lifecycle contract against any adapter harness.
 *
 * The harness only needs the public Runtime surface (`mount`, `update`,
 * `resize`, `refresh`, `destroy`, `context`) and may wrap either deterministic
 * fixtures or real catalog adapters. Adapter-specific DOM/resource assertions
 * stay in hooks so this executor remains reusable as more widgets migrate.
 */
export async function runWidgetLifecycleContract({
  harness,
  type,
  roots,
  config = { orientation: "horizontal", theme: "dark", density: "compact" },
  remountConfig = { orientation: "vertical" },
  updatePatch = { orientation: "vertical" },
  contextPatch = { observer: { name: "Contract observer" } },
  assertMounted,
  assertUpdated,
  captureContext,
  assertContext,
  assertIsolation,
  assertResources,
} = {}) {
  if (!harness || typeof harness.mount !== "function") {
    throw new TypeError("Lifecycle contract requires a harness");
  }
  if (typeof type !== "string" || !type) throw new TypeError("Lifecycle contract requires a widget type");
  if (!roots?.first || !roots?.second) throw new TypeError(`Lifecycle contract for ${type} requires two roots`);

  let first;
  let remounted;
  let second;
  try {
    first = await harness.mount(roots.first, { widget: type, config });
    assert.equal(first.type, type);
    assertMounted?.({ harness, type, instance: first, root: roots.first });
    assertResources?.({ harness, type, phase: "mounted", instance: first });

    harness.update(first, updatePatch);
    assert.equal(first.config.orientation, updatePatch.orientation ?? config.orientation);
    assertUpdated?.({ harness, type, instance: first, root: roots.first });
    harness.resize(first, { width: 320, height: 180 });
    harness.refresh(first);

    const contextBefore = captureContext?.({ harness, type, instance: first, root: roots.first });
    harness.context.update(contextPatch);
    assertContext?.({ harness, type, instance: first, root: roots.first, before: contextBefore });

    await harness.destroy(first);
    await harness.destroy(first);
    assertResources?.({ harness, type, phase: "destroyed", instance: first });

    remounted = await harness.mount(roots.first, { widget: type, config: remountConfig });
    assert.notEqual(remounted.id, first.id);
    assertMounted?.({ harness, type, instance: remounted, root: roots.first, remount: true });
    await harness.destroy(remounted);
    await harness.destroy(remounted);
    assertResources?.({ harness, type, phase: "remount-destroyed", instance: remounted });

    first = await harness.mount(roots.first, { widget: type, config });
    second = await harness.mount(roots.second, {
      widget: type,
      config: { ...config, orientation: "vertical", theme: "light", density: "comfortable" },
    });
    assert.notEqual(first.id, second.id);
    assertIsolation?.({ harness, type, first, second, firstRoot: roots.first, secondRoot: roots.second });
    assertResources?.({ harness, type, phase: "two-mounted", first, second });

    await harness.destroy(first);
    await harness.destroy(first);
    assertResources?.({ harness, type, phase: "one-destroyed", first, second });
    await harness.destroy(second);
    await harness.destroy(second);
    assertResources?.({ harness, type, phase: "all-destroyed", first, second });
  } finally {
    if (first) await harness.destroy(first);
    if (remounted) await harness.destroy(remounted);
    if (second) await harness.destroy(second);
  }
}
