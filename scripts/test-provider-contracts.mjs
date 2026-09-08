import { build } from "esbuild";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

const output = "/tmp/nebulacast-provider-contracts.mjs";
await build({
  entryPoints: ["services/astro_weather/providers/contracts.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  outfile: output,
});

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ["--test", "tests/provider-contracts.test.mjs"], {
    stdio: "inherit",
    env: { ...process.env, PROVIDER_CONTRACTS_MODULE: `file://${output}` },
  });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`provider contract tests exited with ${code}`)));
});
await rm(output, { force: true });
