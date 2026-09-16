# Widget Lab UX wireframe

Status: approved by Product Owner on 2026-09-16
Related issue: #101  
Parent epic: #93

This wireframe is the approval artifact for the Widget Lab. It defines the
host experience around the registered widgets; it does not redefine widget
configuration schemas or Runtime internals.

## Product intent

Showcase is a visual constructor for an external widget embed. The user can
select a registered widget, set its allow-listed parameters, choose a valid
container shape, preview the real Runtime instance, and copy an external
JavaScript `<div>` or iframe HTML output.

## Desktop layout

```text
+------------------------------------------------------------------------------+
| Widget Lab                                                     [Reset all]   |
+-------------------------------+----------------------------------------------+
| CATALOG                       | INSPECTOR                                    |
|                               |                                              |
| [Search widgets...........]    | Selected widget: Alerts                    |
|                               | Description                                  |
| [Alerts]                      |                                              |
|   Risk and event notices      | Widget parameters                           |
| [Events]                      | [density v] [theme v] [time range v]       |
| [Sky]                         |                                              |
|   Square-only                 | Container                                     |
| [Weather]                     | Mode: ( horizontal ) ( vertical )           |
|                               | Width: [ 640 ]   Height: [ 360 ]            |
|                               | [Create preview]                            |
|                               |                                              |
|                               | INSTANCES                                    |
|                               | +------------------------------------------+ |
|                               | | Alerts · sandbox-1 · ready               | |
|                               | | 640 × 360 horizontal      [Preview]     | |
|                               | +------------------------------------------+ |
|                               | | Empty state: create another preview      | |
|                               | +------------------------------------------+ |
+-------------------------------+----------------------------------------------+
```

The catalog owns widget selection. The inspector is split into two labelled
groups: **Widget parameters** are Registry-allow-listed values, while
**Container** contains only host-owned mode and dimensions. The distinction is
intentional and must remain visible.

## Preview Stage

`Preview` opens a same-document modal `<dialog>` labelled `Preview Stage`.
Browser pop-out is optional and is not part of the required flow.

```text
+------------------------------------------------------------------------------+
| Preview Stage                                                        [Close] |
| Alerts · sandbox-1   Mode [horizontal v]  W [640]  H [360] [Apply]           |
|                                                   [Retry] [Reset]            |
+------------------------------------------------------------------------------+
|                                 +----------------------------+               |
|                                 |                            |               |
|                                 |      real Runtime widget   |               |
|                                 |                            |               |
|                                 +----------------------------+               |
| State: ready                                                                    |
+------------------------------------------------------------------------------+
| OUTPUTS                                                                        |
| [JavaScript <div>] [iframe HTML]                                [Copy]        |
|                                                                              |
| <script type="module">                                                       |
|   import { mount } from "...";                                                |
|   mount(document.querySelector("#widget"), {...});                           |
| </script>                                                                     |
+------------------------------------------------------------------------------+
```

The Stage may contain multiple independently mounted instances. The selected
instance is highlighted and drives the output panel. Closing the dialog keeps
instances alive; `Reset` destroys the selected instance and `Reset all` clears
the lab.

## Narrow layout

At narrow widths the page becomes one logical sequence, preserving the same
order and labels:

```text
+-----------------------------+
| Widget Lab          [Reset] |
+-----------------------------+
| CATALOG                     |
| [Search..................]  |
| [Select widget         v]   |
+-----------------------------+
| INSPECTOR                   |
| Widget parameters           |
| [density v] [theme v]       |
| Container                   |
| Mode: [horizontal] [vertical]|
| Width [320]  Height [180]   |
| [Create preview]            |
+-----------------------------+
| INSTANCES                   |
| Alerts · sandbox-1          |
| 320 × 180 · ready           |
| [Preview]                   |
+-----------------------------+
```

The Preview Stage becomes a full-screen dialog. Its toolbar wraps into rows,
the preview container remains at the exact validated width and height, and the
output tabs remain available below the preview. No third orientation is inferred
from the viewport.

## Shape and validation rules

- Sky exposes `square` only; width and height must be equal.
- Every other oriented widget exposes exactly `horizontal` and `vertical`.
- Oriented mode requires width and height to be different; horizontal means
  width greater than height, vertical means height greater than width.
- Public dimensions are bounded to 160–1600 pixels.
- Invalid input keeps the instance out of Runtime mount, identifies the invalid
  field, and preserves the user's values for correction.
- Output panes are disabled or empty until the selected instance has a valid
  public configuration.

## Interaction and keyboard contract

1. On page load, focus lands on the widget selector or the first available
   actionable control.
2. `Create preview` creates a unique instance and focuses its `Preview` button.
3. Opening Preview Stage moves focus to the dialog heading or first invalid field.
4. While open, focus remains inside the labelled dialog; `Escape` closes it.
5. Closing returns focus to the originating instance's `Preview` control. If the
   instance was reset while the dialog was open, focus returns to the nearest
   remaining instance control or the catalog selector.
6. `Apply`, `Retry`, `Reset`, `Copy`, and tab controls have visible keyboard
   focus and accessible names. Copy reports success or failure in a live status
   region without moving focus unexpectedly.
7. Loading, ready, error, timeout, and reset states are exposed as readable text,
   not color alone. Errors include a recovery action where one is available.

## State wireframes

```text
empty     No preview yet. Choose a widget and select Create preview.
loading   Preview container + "Loading <widget>…" + busy indicator.
ready     Preview container + "Ready" + Apply/Retry/Reset actions.
error     Preview container fallback + error summary + Retry + Reset.
timeout   "Preview timed out" + Retry + Reset; no orphan Runtime mount.
invalid   Inline field error + explanation; Create/Apply unavailable.
```

## Approval checklist

- [x] Product Owner approves the catalog → inspector → Stage → output → reset
      flow.
- [x] UI/UX review confirms desktop and narrow layouts.
- [x] UI/UX review confirms the distinction between widget parameters and host
      container controls.
- [x] Accessibility review confirms dialog labelling, focus trap, Escape close,
      focus return, keyboard operation, live status, and non-color state text.
- [x] Product Owner confirms Sky square-only and other widgets' exact
      horizontal/vertical modes.
- [x] Product Owner records approval in issue #101.

## Ownership and hand-off

The Product Owner owns this wireframe and the product decision. Coder owns the
implementation and technical constraints. Validator owns the accessibility and
behavioral verification. The Product Owner approval recorded in issue #101 is
the approval signal for this artifact; implementation validation remains a
separate Validator hand-off.
