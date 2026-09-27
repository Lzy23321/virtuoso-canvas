import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function canvasUpstream() {
  const lock = JSON.parse(readFileSync(path.join(root, 'upstream-lock.json'), 'utf8'));
  if (lock.checkoutPath !== 'analog-canvas')
    throw new Error('checkoutPath must be analog-canvas: adapter imports use this stable path');
  const checkout = path.join(root, lock.checkoutPath);
  const actual = existsSync(path.join(checkout,'.git'))
    ? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim()
    : JSON.parse(readFileSync(path.join(root,'release-manifest.json'),'utf8')).analogCanvasCommit;
  if (actual !== lock.commit)
    throw new Error(`Analog Canvas revision mismatch: expected ${lock.commit}, found ${actual}`);
  return { checkout, lock };
}
