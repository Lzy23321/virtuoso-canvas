import {chromium} from '../analog-canvas/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
const projectFile=process.argv[2]??'work/sar-top-layout-omit/project.icproj.json';
const browser=await chromium.launch({headless:true});
try {
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',430,900]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5179/editor');
    await page.getByTestId('project-file').setInputFiles(projectFile);
    await page.getByTestId('status').filter({hasText:'Opened'}).waitFor();
    const count=await page.locator('[data-pin-name][transform*="rotate(-90"]').count();
    assert(count>0,'Rotated pin names must render in the actual editor');
    await page.evaluate(()=>document.fonts.ready);
    const overlaps=await page.getByTestId('schematic-canvas').locator('[data-pin-name]').evaluateAll(nodes=>{
      const boxes=nodes.map(n=>({name:n.getAttribute('data-pin-name'),r:n.getBoundingClientRect()}));
      return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>
        Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>0.5&&
        Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>0.5).map(b=>[a.name,b.name]));
    });
    assert.deepEqual(overlaps,[],'Pin name ink boxes must not overlap');
    await page.screenshot({path:path.join(path.dirname(projectFile),`editor-${name}.png`)});
    assert.deepEqual(errors,[]);
    console.log(name,{verticalNames:count});
    await page.close();
  }
} finally {await browser.close();}
