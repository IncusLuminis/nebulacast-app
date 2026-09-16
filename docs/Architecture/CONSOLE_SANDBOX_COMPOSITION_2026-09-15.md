# Console Sandbox composition canvas

Story #119 adds an in-memory composition canvas to the Console Sandbox. The
canvas always exposes three labelled drop zones:

- `horizontal` — width greater than height;
- `vertical` — height greater than width;
- `square` — square-only widgets, currently Sky.

Registry metadata remains the source of truth. Oriented Registry entries may be
placed in either oriented zone. Sky may only be placed in the square zone and
is never coerced into an oriented layout.

## Placement behavior

Palette entries and existing cards are native draggable sources. The model also
exposes explicit zone actions so the same operation is available from the
keyboard and from touch-oriented controls:

- `Add <widget> here` creates a new instance in that zone;
- `Move selected here` moves the selected existing instance;
- a focused card accepts `Enter` to select and `Space` to start keyboard move;
- `Escape` cancels a keyboard move.

Moving an oriented card between horizontal and vertical zones swaps its width
and height deterministically. The resulting layout is validated before the
model mutates, and Runtime receives the matching `orientation` config. An
incompatible drop reports a readable reason and leaves the source card,
configuration, and mounted Runtime untouched.

## Runtime lifecycle

The existing Sandbox render queue compares widget identity, configuration,
layout, and root node. A successful move or inspector update disposes the old
Runtime instance and releases its stylesheet before mounting the new root. A
stale asynchronous mount is destroyed if the card was moved, updated, removed,
or reset while it was loading. Invalid drops do not emit a model change and
therefore do not tear down or remount Runtime.

## Local verification

```text
npm run typecheck                         PASS
npm run typecheck:test                    PASS
node --test tests/console-sandbox-model.test.mjs  PASS
npx playwright test tests/browser/console-sandbox.spec.mjs \
  --workers=1 --reporter=line --trace=off  PASS
```

The browser coverage includes desktop and mobile viewports, all existing
Sandbox regression scenarios, palette drag, existing-card drag, strict Sky
rejection, keyboard placement, and touch-compatible zone actions. No merge,
GitHub Projects operation, staging deployment, or production/shared widget CSS
change is part of this story.
