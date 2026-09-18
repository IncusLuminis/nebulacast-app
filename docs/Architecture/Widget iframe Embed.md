# Generic iframe embed contract

The Showcase Builder generates iframe markup for catalog definitions explicitly
marked `standaloneHost: true`. The iframe always loads the generic host:

```html
<iframe
  src="https://nebulacast.app/widgets/widget.html?widget=weather&orientation=vertical&theme=inherit&density=normal"
  title="Weather"
  width="100%"
  height="600"
  loading="lazy"
  style="border:0;display:block">
</iframe>
```

## Configuration

The URL query is limited to the generic host allow-list:

- `widget` — a catalog definition with `standaloneHost: true`;
- `orientation` — `auto`, `horizontal`, or `vertical` when supported by that definition;
- `theme` — `inherit`, `auto`, `dark`, or `light` when supported;
- `density` — `compact`, `normal`, or `comfortable` when supported.

Widget-specific catalog options remain in the versioned configuration output,
but are not silently converted into executable or undocumented URL parameters.
Unknown, duplicate, unsafe, or HTML-looking query values produce a visible
host error and the widget is not mounted.

## Sizing and loading

The generated baseline is a responsive `width="100%"` iframe with
`height="600"`, `loading="lazy"`, and a borderless block presentation. The
embedding page owns the outer width, height, placement, and visibility; it may
override the baseline dimensions with its own CSS. `loading="lazy"` is the
browser's load hint and is not a widget configuration field.

## Observer and API behavior

The current generic host initializes its standalone context with the default
Warsaw observer. This iframe contract does not accept observer coordinates,
location names, API URLs, or parent `postMessage` configuration. Weather API
requests continue to use the iframe document's same-origin `/api/...` paths,
so an external parent does not need direct DOM or API access. Observer URL
configuration and parent messaging remain future extensions and must not be
added to copied snippets until explicitly allow-listed.
