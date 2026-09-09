# Widget Platform baseline behavior and surface regression matrix

This is the baseline matrix for Issue #67. It is deliberately descriptive: it
captures the current behavior and test routes without changing runtime code.
The source-of-truth paths come from
[`WIDGET_INVENTORY.json`](WIDGET_INVENTORY.json) from Issue #66.

## Local execution

Run from the repository root in this isolated branch:

```bash
make server
python3 scripts/validate_widget_baseline.py
```

The server must serve `sites/staging/` on port `8080`. The runner performs the
local route/static-file smoke checks. The interaction cases below are manual
browser checks because they require viewport, input, and network controls.

The baseline is local-only. It does not build, deploy, write generated data, or
call a remote environment.

## Matrix

| Surface / route | Normal | Resize | Observer / time change | Loading / error states | Expected behavior and evidence |
|---|---|---|---|---|---|
| Console — `http://127.0.0.1:8080/` | Open the route and wait for the dashboard shell, Hero, feeds, and alert rails. | Check a desktop viewport, a narrow viewport, and horizontal overflow areas; verify the shell remains usable and no layout-breaking exception appears. | Use the dashboard location picker and time controls; verify location-aware Hero/observer data refreshes and Sky/Map adapters receive the change without a reload. | Observe initial `Loading…` placeholders. Temporarily block one feed/API in browser devtools; the remaining shell stays interactive and the affected panel shows its existing empty/error behavior. | The dashboard remains a single shell; Hero and alerts are inline production implementations per #66. Record screenshot/console errors if browser tooling is available. |
| Modular Weather — `http://127.0.0.1:8080/weather/` | Open the route; verify Location mounts and Weather is usable, then visit Sun, Map, Astro, and Sky tabs. | Resize while Weather, Sun, Map, Astro, and Sky tabs are visible; verify the existing responsive layout remains usable and Sky can resize without an exception. | Change Location and selected time through the existing controls; verify shared state updates the mounted widgets and Sky integration without a page reload. | Observe Weather loading. Block `/api/astro-weather` and verify the existing legacy JSON fallback or bounded error state. For a rate-limited empty-hours response, verify the degraded/rate-limit message is shown. | The modular app uses the #66 production widget paths; vertical weather paths are compatibility-only and are not part of this regression surface. |
| Standalone Sky — `http://127.0.0.1:8080/sky/` | Wait for the canvas, controls, stars/objects, and available data layers. | Resize the viewport and, where available, toggle fullscreen; verify the canvas/layout recalculates and no resize error appears. | Open `?lat=40.7128&lon=-74.0060&datetime=2026-09-09T21:00:00Z`; verify the configured observer/time is reflected in the rendered view. | Observe staged loading messages. Block one `/sky/data/*.json` request; verify the widget reaches its existing `Failed to load sky data` state without breaking the page shell. | `window.SKY_CONFIG` and `window.__skyWidget` are legacy bootstrap compatibility for the current standalone surface; no new runtime behavior is introduced by this baseline. |
| News — `http://127.0.0.1:8080/news/` | Wait for the News Radar list and filter controls; verify the RSS link is present. | Resize from wide to narrow; verify cards/list and filters remain readable and usable. | Change the News filter; observer/time changes are not applicable to this non-location-aware widget and must not be expected to alter the feed. | Observe `Loading...`. Block `/news/rss.xml` or return an invalid/empty response; verify the existing `RSS fetch failed`, timeout, or `No items found` message is scoped to News. | The runtime is `frontend/assets/js/widget_runtime.js`; `sites/staging/news/widget.js` is generated compatibility output, not a second source. |
| Calendar / Events — `http://127.0.0.1:8080/calendar/` | Wait for the Sky Alerts/Calendar list and category filters; verify JSON and RSS links are present. | Resize from wide to narrow; verify event rows and filters remain usable. | Change the event category filter; observer/time changes are not applicable to the current generated calendar data and must not be expected to alter it. | Observe `Loading...`. Block `/calendar/daily_signal.json` or return empty/invalid data; verify the existing `Failed to load calendar`, timeout, or `No items for this filter` message is scoped to Calendar. | The runtime is `frontend/assets/js/widget_runtime.js`; generated calendar artifacts and RSS remain owned by the existing calendar pipeline. |

## Execution record

Record each manual case as `PASS`, `FAIL`, or `BLOCKED` in the review. A case is
`BLOCKED` only when the local environment cannot perform the interaction (for
example, no browser automation or devtools network interception); it is not a
runtime failure.

| Case group | Local route smoke | Manual interaction | Result |
|---|---|---|---|
| Console | `validate_widget_baseline.py` | normal / resize / observer-time / loading-error | Pending local browser run |
| Weather | `validate_widget_baseline.py` | normal / resize / observer-time / loading-error | Pending local browser run |
| Sky | `validate_widget_baseline.py` | normal / resize / observer-time / loading-error | Pending local browser run |
| News | `validate_widget_baseline.py` | normal / resize / filter / loading-error | Pending local browser run |
| Calendar | `validate_widget_baseline.py` | normal / resize / filter / loading-error | Pending local browser run |

Screenshots are optional evidence for this story. None are committed by the
baseline artifact; the current checkout has no Playwright module available, so
visual evidence must be captured manually if needed.
