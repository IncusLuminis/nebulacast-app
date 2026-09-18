# Sky Legacy Bootstrap Compatibility

## Boundary

`sites/staging/sky/widget.js` is the authoritative Sky implementation and
exports `mountSky(root, context, config)`. The platform Runtime reaches it via
`sites/staging/sky/platform-adapter.mjs`.

`sites/staging/sky/legacy-bootstrap.mjs` is the compatibility adapter for
standalone `/sky/` and for existing HTML callers that still provide an
explicit legacy config. It owns the only legacy global bridge:

| Legacy contract | Adapter behavior |
|---|---|
| `window.SKY_CONFIG` | Read when an existing caller supplies it; otherwise build the standalone config from the URL and publish it for compatibility. |
| `window.__skyWidget` | Publish the handle returned by `mountSky()`. |
| Sky implementation | Never reads or writes either global on the platform path. |

## Standalone URL mapping

For `/sky/`, `buildStandaloneSkyConfig(window.location.search)` maps:

| Query/input | Config value |
|---|---|
| `lat` in `[-90, 90]` | `lat` |
| `lon` in `[-180, 180]` | `lon` |
| invalid or missing `lat` | `52.2297` (Warsaw fallback) |
| invalid or missing `lon` | `21.0122` (Warsaw fallback) |
| `datetime` | `datetimeISO`, or `null` when empty/missing |
| fixed | `baseUrl: "/sky"`, `mountId: "skyMount"` |

The adapter imports `core/sky.ui.js` before `widget.js`, as required by the
standalone host. Existing dashboard and Weather callers may continue to set
an explicit `window.SKY_CONFIG` before importing this adapter.

## Preserved behavior

- Public route: `/sky/`.
- Existing `lat`, `lon`, and `datetime` query parameters remain supported.
- The returned legacy handle preserves `update`, `resize`, `refresh`, and
  `destroy`; `destroy` remains idempotent.
- Catalog/ranking data paths and Sky rendering remain owned by `widget.js`.
- Legacy globals are compatibility-only and are not part of a new Runtime
  mount or its instance-local state.

## Removal gates

The adapter and allowlisted global bridge may be removed only after all of the
following are true:

1. `/sky/` has a replacement host using the explicit Runtime API.
2. Dashboard and Weather callers no longer depend on `SKY_CONFIG` or
   `__skyWidget`.
3. Consumers of the legacy handle have migrated to explicit Runtime instance
   references and lifecycle methods.
4. Route/query compatibility has browser regression coverage and an approved
   migration/deprecation decision.
