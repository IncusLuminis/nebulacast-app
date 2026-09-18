# Widget stylesheet manifest local gate

Date: 2026-09-15  
Branch: `codex/widget-platform-planning`  
Story: #116 — Define Registry stylesheet manifest and Sandbox loading contract

## Implemented contract

- all 13 Registry definitions expose an explicit frozen `stylesheets` array;
- each path is a same-origin root-relative `.css` file from `sites/staging`;
- the shared loader rejects external URLs, query strings, markup, non-CSS paths,
  percent-encoded paths, and path traversal;
- Sandbox waits for manifest stylesheets before Runtime mount;
- links are deduplicated by path and released after the last owning preview;
- standalone and JavaScript embed hosts use the same manifest without changing
  their immediate mount behavior;
- empty manifests document widgets whose presentation is injected by their
  Runtime/component code.

## Checks passed

```text
npm run typecheck
npm run typecheck:test
git diff --check

node --test \
  tests/widget-stylesheet-loader.test.mjs \
  tests/standalone-widget-host.test.mjs \
  tests/javascript-embed.test.mjs \
  tests/widget-runtime.test.mjs \
  tests/console-sandbox-model.test.mjs \
  tests/widget-css-scope.test.mjs
38 tests passed

npx playwright test tests/browser/console-sandbox.spec.mjs \
  --workers=1 --reporter=line --trace=off
3 passed
```

No merge, staging deployment, or Project status change to `Done` is included
in this gate. Validator and Product Owner acceptance remain required.
