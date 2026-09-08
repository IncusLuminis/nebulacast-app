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
const cfg = {
  entryPoints: [entry],
  bundle:      true,
  format:      "iife",
  globalName:  "HelioWidgetModule",
  platform:    "browser",
  target:      "es2017",
  outdir,
  outExtension: { ".js": ".js" },
  minify:       !watchMode,
  sourcemap:    watchMode ? "inline" : false,
};

if (watchMode) {
  const ctx = await esbuild.context(cfg);
  await ctx.watch();
  console.log("[helio.build] Watching for changes…");
} else {
  await esbuild.build(cfg);
  console.log("[helio.build] Built: sites/staging/helio/dist/helio.widget.js");
}
