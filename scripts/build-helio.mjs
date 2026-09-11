#!/usr/bin/env node
/**
 * Bundle the Helio widget TypeScript source into a self-contained JS file.
 * Output: sites/staging/helio/dist/helio.widget.js
 *
 * Usage:
 *   node scripts/build-helio.mjs          (production)
 *   node scripts/build-helio.mjs --watch  (dev watch mode)
 */
import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot  = join(__dirname, "..");

const entry  = join(repoRoot, "sites/staging/helio/src/helio.widget.ts");
const outdir = join(repoRoot, "sites/staging/helio/dist");

const watchMode = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const common = {
  entryPoints: [entry],
  bundle:      true,
  platform:    "browser",
  target:      "es2017",
  minify:      !watchMode,
  sourcemap:   watchMode ? "inline" : false,
};

const builds = [
  {
    ...common,
    format:     "iife",
    globalName: "HelioWidgetModule",
    outfile:    join(outdir, "helio.widget.js"),
    define:     { HELIO_LEGACY_GLOBAL: "true" },
  },
  {
    ...common,
    format:  "esm",
    outfile: join(outdir, "helio.widget.mjs"),
    define:  { HELIO_LEGACY_GLOBAL: "false" },
  },
];

if (watchMode) {
  const contexts = await Promise.all(builds.map(build => esbuild.context(build)));
  await Promise.all(contexts.map(ctx => ctx.watch()));
  console.log("[helio.build] Watching for changes…");
} else {
  await Promise.all(builds.map(build => esbuild.build(build)));
  console.log("[helio.build] Built: IIFE and ESM Helio bundles");
}
