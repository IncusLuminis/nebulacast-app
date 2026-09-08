import { build } from "esbuild";
import { spawn } from "node:child_process";
const output = "/tmp/nebulacast-ephemeris-contract.mjs";
await build({ entryPoints: ["services/astro_weather/ephemeris_contract.ts"], bundle: true, format: "esm", platform: "node", target: "es2022", outfile: output });
const child = spawn(process.execPath, ["--test", "tests/ephemeris-contract.test.mjs"], { stdio: "inherit", env: { ...process.env, EPHEMERIS_CONTRACT_MODULE: `file://${output}` } });
child.on("exit", (code) => process.exit(code ?? 1));
