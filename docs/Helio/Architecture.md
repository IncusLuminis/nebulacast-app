Frontend architecture decision

The widget will be a compiled standalone bundle with a clean mount API:

sites/staging/helio/            ← top-level domain dir (mirrors sites/staging/sky/)
  src/
    helio.types.ts              ← enums, interfaces
    helio.model.ts              ← helio_now.json → HelioCardModel mapper
    helio.interpret.ts          ← event classification helpers, wording catalog
    helio.render.ts             ← DOM rendering, all 7 sections
    helio.widget.ts             ← entry point, exports mount()
  dist/
    helio.widget.js             ← compiled bundle (committed, ready to serve)
    helio.widget.css            ← styles

Mount API:

HelioWidget.mount(element, { dataUrl: '/data/helio_now.json' })

Build step added to package.json:

"build:helio": "esbuild sites/staging/helio/src/helio.widget.ts --bundle --outfile=sites/staging/helio/dist/helio.widget.js"


