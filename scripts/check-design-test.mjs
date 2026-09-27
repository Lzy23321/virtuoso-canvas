import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '../analog-canvas/node_modules/@playwright/test/index.mjs';
const dir=path.resolve(process.argv[2]);
const rows=JSON.parse(await fs.readFile(path.join(dir,'conversion.json')));
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const row of rows)for(const run of row.runs.filter(r=>r.status==='success')) {
    const out=path.join(dir,row.cell+'-'+run.mode),errors=[];
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror',e=>errors.push(e.message));
    const result={cell:row.cell,mode:run.mode};
    try {
      await page.goto('http://127.0.0.1:5183/editor',{timeout:120000});
      const input=page.getByTestId('project-file');await input.waitFor({state:'attached',timeout:120000});
      const start=performance.now();await input.setInputFiles(path.join(out,'project.icproj.json'));
      await page.getByTestId('status').filter({hasText:'Opened'}).waitFor({timeout:60000});
      result.importSeconds=(performance.now()-start)/1000;
      await page.evaluate(()=>document.fonts.ready);
      result.visibleObjects=await page.getByTestId('schematic-canvas').locator('[data-object-id]').count();
      await page.screenshot({path:path.join(out,'editor-desktop.png')});
      result.status=result.visibleObjects>0&&errors.length===0?'success':'failed';
    } catch(e){result.status='failed';result.error=e.message;}
    result.pageErrors=errors;results.push(result);console.log(JSON.stringify(result));await page.close();
  }
} finally {await browser.close();await fs.writeFile(path.join(dir,'browser.json'),JSON.stringify(results,null,2));}
