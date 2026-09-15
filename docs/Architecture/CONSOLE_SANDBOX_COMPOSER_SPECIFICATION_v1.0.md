# Nebulacast Console Sandbox Composer Specification v1.0

Status: approved by Product Owner/UI/UX review on 2026-09-15; implementation in progress
Related request: assemble a temporary Console from registered widgets in a dedicated HTML page  
Parent area: HUD Platform / Widget Runtime

## 1. Purpose

Add a dedicated local Console Sandbox page where a user can compose a temporary
console from the registered HUD Platform widgets, inspect the result in the
browser, and reset it without changing the production Dashboard configuration.

The Sandbox is a composition playground. It is separate from Showcase Widget
Lab, which remains focused on configuring and previewing individual widgets and
their external embed outputs.

## 2. Boundaries

### In scope

- a standalone HTML route at `/console-sandbox/`;
- one Registry-driven widget palette;
- a host-owned composition canvas with multiple independent Runtime instances;
- adding, selecting, reordering, resizing, and removing widget cards;
- Registry-allow-listed widget configuration;
- host-owned horizontal, vertical, and Sky square layout constraints;
- desktop and narrow responsive canvas previews;
- readable loading, ready, empty, error, timeout, and validation states;
- keyboard-accessible controls and deterministic reset behavior;
- local-only composition for the current browser session.

### Out of scope

- changing the production Dashboard or its default `console-config.mjs`;
- server persistence, authentication, saved projects, share links, or accounts;
- drag-and-drop layout editing for the production Console;
- arbitrary HTML, CSS, JavaScript, module URLs, data endpoints, or callbacks;
- inventing widget configuration outside the Registry;
- a second widget catalog or a second Runtime implementation;
- external embed output for the whole assembled console (can be a follow-up).

## 3. User flow

1. Open `/console-sandbox/`.
2. Choose a widget from the Registry-driven palette.
3. Add it to the composition canvas.
4. Select the new card and set its allow-listed widget parameters plus its
   host-owned layout mode and dimensions.
5. Apply the card configuration; the real Runtime mounts inside that card.
6. Add more widgets, select a card, move it within the canvas, resize it, or
   remove it. Each card has an independent instance identity and lifecycle.
7. Switch between desktop and narrow canvas previews. The preview changes the
   canvas viewport, not the stored widget dimensions or public orientation rules.
8. Reset one card or the whole Sandbox. Reset destroys Runtime instances and
   leaves the page usable for a new composition.

## 4. Product UX wireframe

### Desktop

```text
+--------------------------------------------------------------------------------+
| Console Sandbox                                                     [Reset all]|
+----------------------------+---------------------------------------------------+
| WIDGET PALETTE              | COMPOSITION CANVAS                               |
|                            | viewport: [ Desktop v ]                         |
| [Search widgets.........]  |                                                   |
|                            | +------------------+  +------------------------+ |
| [Weather]       [Add]     | | Weather          |  | Sky                    | |
| [Sky]           [Add]     | | sandbox-1        |  | sandbox-2              | |
| [Events]        [Add]     | | horizontal      |  | square                 | |
| [Alerts]        [Add]     | | [Runtime state]  |  | [Runtime state]        | |
| ...                        | | [Select] [Remove]|  | [Select] [Remove]      | |
|                            | +------------------+  +------------------------+ |
|                            |                                                   |
|                            | +------------------------------------------------+|
|                            | | Empty canvas area / selected card preview      ||
|                            | +------------------------------------------------+|
+----------------------------+---------------------------------------------------+
| INSPECTOR                                                                          |
| Selected: Weather · sandbox-1     Widget parameters: [profile v] [range v]       |
| Container: Mode [horizontal] [vertical]  Width [640] Height [360] [Apply]        |
| [Move left] [Move right] [Reset card]                                             |
| Validation/status: Ready                                                           |
+------------------------------------------------------------------------------------+
```

The palette owns selection of a Registry definition. The canvas owns placement
and instance selection. The inspector visibly separates widget parameters from
host container controls. The canvas is not an iframe and does not execute user
code; every preview is a registered Runtime adapter mounted into a host-owned
root.

### Narrow

```text
+-----------------------------+
| Console Sandbox     [Reset] |
+-----------------------------+
| WIDGET PALETTE              |
| [Search..................]  |
| [Select widget         v]   |
| [Add to canvas]             |
+-----------------------------+
| CANVAS [Desktop v]          |
| +-------------------------+ |
| | selected widget card    | |
| | Runtime state           | |
| | [Select] [Remove]       | |
| +-------------------------+ |
+-----------------------------+
| INSPECTOR                   |
| Widget parameters           |
| Container                   |
| Mode [horizontal] [vertical]|
| Width [320] Height [180]   |
| [Apply] [Reset card]       |
+-----------------------------+
```

On narrow screens the regions become one logical sequence: palette, canvas,
inspector. The canvas can scroll horizontally when a selected fixed-size card
is wider than the viewport; the host must not silently change the requested
mode or dimensions.

## 5. Composition model

The Sandbox owns the composition document only in memory:

```js
{
  viewport: "desktop" | "narrow",
  selectedId: "sandbox-2" | null,
  instances: [
    {
      id: "sandbox-1",
      widget: "weather",
      config: { /* normalized Registry-allow-listed values */ },
      layout: { mode: "horizontal", width: 640, height: 360 },
      position: 0,
      state: "idle" | "loading" | "ready" | "error" | "timeout" | "destroyed"
    }
  ]
}
```

The model must keep widget type, instance identity, configuration, layout,
position, and lifecycle state separate. Two instances of the same widget type
must not share mutable DOM or Runtime state.

## 6. Layout and safety rules

- Sky is square-only: `width === height`, public mode `square`.
- Every other widget exposes exactly `horizontal` and `vertical`.
- Horizontal requires `width > height`; vertical requires `height > width`.
- Public dimensions are bounded to 160–1600 pixels.
- Invalid layouts never invoke Runtime and identify the fields to correct.
- Widget parameters are normalized through the existing Registry/configuration
  path. The Sandbox never accepts loaders, module paths, scripts, HTML,
  callbacks, arbitrary endpoints, or executable values.
- Reset and remove destroy the corresponding Runtime instance and remove its
  owned root. Resetting the whole Sandbox destroys all instances.

### Stylesheet loading contract

- Every Registry definition declares a frozen `stylesheets` array. Entries are
  root-relative `.css` paths on the same origin; an empty array explicitly
  means that the widget owns its presentation through its Runtime/component
  styles.
- The shared stylesheet loader rejects external URLs, query strings, markup,
  non-CSS paths, and path traversal. It deduplicates links by path and removes
  them after the last owning preview is released.
- Sandbox previews wait for every manifest stylesheet to load before invoking
  the Runtime adapter. Standalone and JavaScript embed hosts acquire the same
  manifest without blocking their existing mount contract.

## 7. Accessibility and recovery

- Use landmarks and headings for Palette, Composition Canvas, and Inspector.
- Every card has an accessible name containing widget type and sandbox id.
- Add, select, move, apply, reset, and remove controls are keyboard reachable
  with visible focus.
- Selection is represented by more than color and is announced to assistive
  technology.
- Loading, ready, error, timeout, empty, and invalid states are readable text.
- Failed mounts expose Retry where recovery is possible; Reset card always
  remains available.
- Removing a selected card returns focus to the next card, previous card, or
  the palette Add control.
- Reset all returns focus to the palette and leaves an explicit empty state.

## 8. Acceptance checklist

- [ ] `/console-sandbox/` is a separate HTML host and does not alter Dashboard
      configuration or production route ownership.
- [ ] Palette and widget options are derived from the single Registry/catalog.
- [ ] Multiple instances, including repeated widget types, remain independent.
- [ ] Canvas supports add, select, reorder, resize, apply, remove, and reset.
- [ ] Sky square and oriented horizontal/vertical rules are enforced.
- [ ] Desktop and narrow canvas previews preserve the composition semantics.
- [ ] Real Runtime adapters mount inside caller-owned card roots.
- [ ] Registry stylesheet manifests load before Sandbox Runtime mounts and are
      released after the last corresponding preview is removed.
- [ ] Empty/loading/ready/error/timeout/invalid states are visible and recoverable.
- [ ] Keyboard and focus behavior passes the accessibility checklist.
- [ ] No arbitrary code or untrusted markup is evaluated by the Sandbox.
- [ ] Local unit, static, and browser acceptance checks pass.

## 9. Delivery decomposition

### Epic C — Build the Console Sandbox composer

Outcome: a user can assemble and inspect a temporary multi-widget Console in a
dedicated HTML page using the existing Registry and Runtime without changing
production Dashboard behavior.

- **C1 / #110** — Approve the Console Sandbox UX flow and responsive wireframe.
- **C2 / #111** — Implement the in-memory composition model and Registry palette.
- **C3 / #112** — Build the standalone Console Sandbox HTML host and canvas.
- **C4 / #113** — Mount independent Runtime widgets and host-owned controls.
- **C5 / #114** — Add validation, accessibility, recovery, and acceptance gate.

Implementation stories must not introduce persistence or production Dashboard
layout changes without a separate product decision.
