import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));

test('release layouts share one source and exclude personal data',async()=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'vc-release-layout-'));
  try {
    for(const [script,name] of [['stage_upstream_pr.mjs','upstream'],['package_standalone.mjs','standalone']]) {
      const out=path.join(temporary,name);
      const run=spawnSync(process.execPath,[path.join(root,'scripts',script),'--out',out],{cwd:root,encoding:'utf8'});
      assert.equal(run.status,0,run.stderr);
      await stat(path.join(out,'packages/virtuoso-import/engine/convert_canvas.py'));
      await assert.rejects(stat(path.join(out,'personal')));
      await assert.rejects(stat(path.join(out,'work')));
      const files=await readdir(path.join(out,'packages'));
      assert.ok(!files.includes('core')&&!files.includes('canvas-adapter'));
      if(name==='upstream') {
        const adapter=await readFile(path.join(out,'packages/virtuoso-import/adapter/index.ts'),'utf8');
        const engine=await readFile(path.join(out,'packages/virtuoso-import/engine/refine_canvas.mjs'),'utf8');
        assert.match(adapter,/from ['"]@icm\/model['"]/);
        assert.doesNotMatch(adapter,/analog-canvas\/packages/);
        assert.match(engine,/\.\.\/\.\.\/edit-engine\/dist/);
      } else {
        await stat(path.join(out,'analog-canvas/package.json'));
        await stat(path.join(out,'skill/virtuoso_canvas_ui.il'));
        await stat(path.join(out,'README.md'));
        for(const guide of ['README.en.md','UI使用说明.md','UI-Guide.en.md','CLI使用说明.md','CLI-Guide.en.md'])
          await stat(path.join(out,guide));
        await assert.rejects(stat(path.join(out,'docs')));
        await assert.rejects(stat(path.join(out,'analog-canvas/.git')));
        await assert.rejects(stat(path.join(out,'analog-canvas/node_modules')));
      }
    }
  } finally { await rm(temporary,{recursive:true,force:true}); }
});
