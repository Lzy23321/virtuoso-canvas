#!/usr/bin/env node
import {cp, mkdir, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,canvasUpstream} from './canvas_upstream.mjs';

const flag=process.argv.indexOf('--out');
if(flag<0||!process.argv[flag+1]||process.argv.length!==flag+2)
  throw Error('Usage: node scripts/package_standalone.mjs --out NEW_DIRECTORY');
const out=path.resolve(process.argv[flag+1]);
if(existsSync(out))throw Error(`Output already exists: ${out}`);
const {checkout,lock}=canvasUpstream();
if(execFileSync('git',['status','--porcelain'],{cwd:checkout,encoding:'utf8'}).trim())
  throw Error('Analog Canvas checkout is dirty; review it before packaging');
await mkdir(out,{recursive:true});
for(const name of ['package.json','tsconfig.json','upstream-lock.json','README.md',
  'packages','skill','rules','schemas','scripts','tests'])
  await cp(path.join(root,name),path.join(out,name),{recursive:true,filter:from=>
    !['dist','node_modules','__pycache__'].includes(path.basename(from))&&
    !from.endsWith('.pyc')&&!from.endsWith('.tsbuildinfo')});
await cp(checkout,path.join(out,'analog-canvas'),{recursive:true,filter:from=>
  !['.git','node_modules','dist','coverage','playwright-report','test-results'].includes(path.basename(from))&&
  !from.endsWith('.tsbuildinfo')});
await writeFile(path.join(out,'.gitignore'),
  'dist/\nwork/\npersonal/\nnode_modules/\n**/node_modules/\n**/dist/\n__pycache__/\n*.pyc\n');
await writeFile(path.join(out,'release-manifest.json'),JSON.stringify({
  kind:'source-bundle',analogCanvasCommit:lock.commit,
  note:'Canvas source is bundled; install pinned dependencies and build before use.'},null,2)+'\n');
process.stdout.write(`${out}\n`);
