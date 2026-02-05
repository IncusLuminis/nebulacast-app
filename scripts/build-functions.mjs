#!/usr/bin/env node
/**
 * Bundle Cloudflare Pages Functions so that services/astro_weather is inlined.
 * Output: functions/api/*.js (ESM, so CF can run them).
 */
import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const entryPoints = [
  join(repoRoot, "functions/api/astro-weather.ts"),
  join(repoRoot, "functions/api/geocode.ts"),
  join(repoRoot, "functions/api/revgeo.ts"),
];

async function main() {
  await esbuild.build({
    entryPoints,
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2020",
    outdir: join(repoRoot, "functions/api"),
    outbase: join(repoRoot, "functions/api"),
    outExtension: { ".js": ".js" },
    // All imports (including services/astro_weather) are bundled; no externals
  });
  console.log("Functions built: functions/api/*.js");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
