#!/usr/bin/env node
import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {root,canvasUpstream} from './canvas_upstream.mjs';

const flag=process.argv.indexOf('--out');
if(flag<0||!process.argv[flag+1]||process.argv.length!==flag+2)
  throw Error('Usage: node scripts/stage_upstream_pr.mjs --out NEW_DIRECTORY');
const out=path.resolve(process.argv[flag+1]);
if(existsSync(out))throw Error(`Output already exists: ${out}`);
const {lock}=canvasUpstream();
const source=path.join(root,'packages/virtuoso-import');
const target=path.join(out,'packages/virtuoso-import');
await mkdir(path.dirname(target),{recursive:true});
const files=[];
await cp(source,target,{recursive:true,filter:from=>
  !['dist','node_modules','__pycache__'].includes(path.basename(from))&&
  !from.endsWith('.pyc')&&!from.endsWith('.tsbuildinfo')});
async function rewrite(directory) {
  const {readdir}=await import('node:fs/promises');
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()){await rewrite(file);continue;}
    if(!/\.(ts|mjs)$/.test(entry.name))continue;
    const original=await readFile(file,'utf8');
    const staged=entry.name.endsWith('.ts')
      ? original.replace(/\.\.\/\.\.\/\.\.\/analog-canvas\/packages\/([^/]+)\/dist\/index\.js/g,'@icm/$1')
        .replaceAll('../../../analog-canvas/packages/model/node_modules/zod/index.js','zod')
      : original.replaceAll('../../../analog-canvas/packages/','../../');
    if(staged!==original)await writeFile(file,staged);
    files.push({path:path.relative(out,file),sha256:createHash('sha256').update(staged).digest('hex')});
  }
}
await rewrite(target);
await writeFile(path.join(out,'STAGING.md'),
  '# Analog Canvas upstream PR staging\n\n'+
  `Generated from the standalone converter against Analog Canvas ${lock.commit}.\n`+
  'Copy `packages/virtuoso-import/` into an Analog Canvas worktree, install workspace dependencies, and run its build/tests.\n'+
  'This directory is generated; edit the standalone source and regenerate instead of maintaining two algorithms.\n');
await writeFile(path.join(out,'staging-manifest.json'),JSON.stringify({
  upstreamCommit:lock.commit,files:files.sort((a,b)=>a.path.localeCompare(b.path))},null,2)+'\n');
process.stdout.write(`${out}\n`);
