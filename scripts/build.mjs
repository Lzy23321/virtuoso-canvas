import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, symlinkSync } from "node:fs";
import { canvasUpstream, root } from './canvas_upstream.mjs';

if (Number(process.versions.node.split('.')[0]) < 24)
  throw new Error('Analog Canvas build requires Node.js 24 or newer');
const { checkout } = canvasUpstream();
const upstream = spawnSync('pnpm', ['build'], { cwd: checkout, stdio: 'inherit' });
if (upstream.error) throw upstream.error;
if (upstream.status !== 0) process.exit(upstream.status ?? 1);
mkdirSync(root + "dist", { recursive: true });
if (!existsSync(root + "dist/analog-canvas"))
  symlinkSync("../analog-canvas", root + "dist/analog-canvas");
const result = spawnSync(
  checkout + "/node_modules/.bin/tsc",
  ["-p", "tsconfig.json"],
  { cwd: root, stdio: "inherit" },
);
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
