# Versioned JavaScript embed API

The public JavaScript embed entry point is the static ES module:

```text
/widgets/runtime/index.mjs
```

It exposes the `v1` API contract through `apiVersion` and keeps the existing
named `mount` and `unmount` exports. The host supplies the placement element;
the Widget Runtime and the selected widget own the root metadata, internal DOM,
styles, data lifecycle, and cleanup.

## Usage

```html
<div id="nc-weather"></div>

<script type="module">
  import { apiVersion, mount } from
    "https://nebulacast.app/widgets/runtime/index.mjs";

  if (apiVersion !== 1) throw new Error("Unsupported Nebulacast embed API");

  const root = document.querySelector("#nc-weather");
  const weather = await mount(root, {
    widget: "weather",
    config: {
      orientation: "vertical",
      profile: "balanced",
      range: "7d",
    },
  });

  await weather.update({ profile: "visual" });
  await weather.destroy();
</script>
```

`mount(root, specification)` returns a widget instance with `update`,
`resize`, `refresh`, and `destroy` controls. A root can host one instance at a
time and can be mounted again after `destroy`. `unmount(root)` is the
backwards-compatible equivalent of destroying the instance at that root.

## Configuration boundary

Only widgets explicitly marked for JavaScript embedding in the catalog are
accepted. Configuration is checked against that definition's
`supportedOptions` and the common host options. Current Weather options are:

- `orientation`: `auto`, `horizontal`, `vertical`;
- `theme`: `inherit`, `auto`, `dark`, `light`;
- `density`: `compact`, `normal`, `comfortable`;
- `profile`: `balanced`, `visual`, `broadband`, `planetary`;
- `range`: `today`, `48h`, `7d`.

`baseUrl` is an optional safe same-origin or origin-only data/assets prefix.
It may rewrite catalog-declared data paths, but never selects a module or
loader. Unknown fields, invalid values, executable references, arbitrary
module URLs, HTML, and data/API URL overrides are rejected before mounting.
The same validation is applied to `instance.update()`.

## Versioning and compatibility

The entry point is the single documented public module and currently reports
`apiVersion === 1`. `widget-config.v1` and the catalog's integer widget
`version` identify configuration/definition contracts; they are separate from
the JavaScript API version.

Changes within `v1` are additive: new allow-listed widgets or configuration
fields may be introduced with defaults, while existing fields, defaults,
return controls, and lifecycle semantics remain compatible. Hosts should
ignore additional documented metadata and use the existing controls rather
than private DOM selectors.

A breaking change to the public mount shape, validation semantics, lifecycle,
or an existing widget field requires a new explicit API/configuration version.
The `v1` entry point must not silently reinterpret an existing configuration.
Legacy `mount`/`unmount` imports remain supported while `v1` is active.

## Ownership and failure behavior

The host owns the root element's placement and outer layout. It must not depend
on internal selectors. The widget owns only its descendants, runtime metadata,
styles, subscriptions, timers, and fetch cleanup. `destroy()` releases those
resources and removes Runtime-owned root metadata without removing the host
element itself.

Invalid specifications reject with an error and do not load a widget module.
Errors are isolated to the attempted mount; sibling roots managed by the same
API instance remain mountable.
