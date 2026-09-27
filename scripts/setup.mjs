#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { root, canvasUpstream } from './canvas_upstream.mjs';

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const skipTests = args.has('--skip-tests');
const usage = 'Usage: node scripts/setup.mjs [--offline] [--skip-tests]';
if ([...args].some(arg => !['--offline', '--skip-tests'].includes(arg))) {
  console.error(usage);
  process.exit(2);
}

function run(command, commandArgs, cwd = root) {
  console.log(`\n> ${command} ${commandArgs.join(' ')}`);
  execFileSync(command, commandArgs, { cwd, stdio: 'inherit' });
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 24) throw new Error('Node.js 24 or newer is required.');
if (!existsSync(path.join(root, 'analog-canvas'))) {
  throw new Error('analog-canvas is missing. Run git submodule update --init --recursive first.');
}
let upstream;
try {
  upstream = canvasUpstream();
} catch (error) {
  throw new Error(`${error.message}\nThe upstream checkout must match upstream-lock.json.`);
}

try {
  execFileSync('python3', ['--version'], { stdio: 'inherit' });
} catch {
  throw new Error('Python 3 is required. Set VC_PYTHON only for the Virtuoso runtime; install Python separately.');
}

const installArgs = ['install', '--frozen-lockfile'];
if (offline) installArgs.push('--offline');
run('pnpm', installArgs, upstream.checkout);
run('npm', ['run', 'build']);
if (!skipTests) run('npm', ['test']);
console.log('\nVirtuoso Canvas is ready. Set VC_ROOT to this directory before starting Virtuoso.');
