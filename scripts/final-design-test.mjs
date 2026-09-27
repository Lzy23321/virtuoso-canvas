import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareMappings} from '../dist/packages/virtuoso-import/core/index.js';
import {loadCatalog,convertDesign} from '../dist/packages/virtuoso-import/adapter/index.js';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=path.resolve(process.argv[2]);
const runtime={root},catalog=await loadCatalog(runtime);
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const write=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2));
const extraction=await read(path.join(dir,'extraction.json'));
const builtin=await read(path.join(root,'rules/builtin/mappings.json'));
const personal=await read(path.join(root,'personal/mappings.json')).catch(e=>{if(e.code!=='ENOENT')throw e;return {version:1,devices:{}};});
const results=[];
const counts=a=>(a??[]).reduce((m,x)=>(m[x.code]=(m[x.code]??0)+1,m),{});
for(const entry of extraction.designs) {
  if(entry.status!=='success')continue;
  const source=await read(path.join(dir,entry.snapshot));
  const row={cell:entry.cell,disabled:source.instances.filter(i=>i.properties.some(p=>p.name==='nlAction'&&p.value==='ignore')).map(i=>i.name),
    buses:source.nets.filter(n=>Number(n.numBits)>1).map(n=>({name:n.name,width:n.numBits})),
    masters:[...new Set(source.instances.map(i=>i.library+'/'+i.cell))],
    missingSymbols:source.instances.filter(i=>!source.symbols.find(s=>s.id===i.symbolId)?.terminals.length).map(i=>({instance:i.name,master:i.library+'/'+i.cell})),runs:[]};
  const start=performance.now();
  let table;
  try {table=prepareMappings(source,builtin,catalog,personal).settings;}
  catch(e){row.prepareError={code:e.code,message:e.message};results.push(row);continue;}
  row.prepareSeconds=(performance.now()-start)/1000;
  await write(path.join(dir,entry.cell+'.mappings.json'),table);
  for(const disabledInstances of ['keep','omit']) {
    const out=path.join(dir,entry.cell+'-'+disabledInstances);await fs.mkdir(out);
    const run={mode:disabledInstances};const t=performance.now();
    try {
      const r=await convertDesign(source,table,{runtime,busMode:'bundled',disabledInstances,allowLabelOverlap:true,allowSymbolOverlap:true});
      run.convertSeconds=(performance.now()-t)/1000;
      for(const [name,value] of Object.entries({'project.icproj.json':r.project,'filtered.snapshot.json':r.filteredSnapshot,'report.json':r.report,'validation.json':r.validation,'refinement.json':r.refinement}))await write(path.join(out,name),value);
      await fs.writeFile(path.join(out,'preview.svg'),r.svg);
      Object.assign(run,{status:'success',counts:r.report.counts,genericBoxes:r.report.genericBoxes,visual:counts(r.validation.visual),blockingVisual:counts(r.validation.blockingVisual),erc:counts(r.validation.erc),blockingErc:counts(r.validation.blockingErc),sourceConnectivityVerified:r.report.sourceConnectivityVerified,retainedConnectivityVerified:r.report.retainedConnectivityVerified,bitConnectivityVerified:r.report.bitConnectivityVerified,refinementTimingsMs:r.refinement.timings});
    } catch(e) {
      Object.assign(run,{status:'failed',convertSeconds:(performance.now()-t)/1000,code:e.code,message:e.message});
      await write(path.join(out,'error.json'),{code:e.code,message:e.message,details:e.details});
      const v=e.details?.diagnostics?.['result.validation.json'];
      Object.assign(run,{visual:counts(v?.visual),blockingVisual:counts(v?.blockingVisual),erc:counts(v?.erc),stderr:e.details?.process?.stderr});
    }
    row.runs.push(run);console.log(entry.cell,JSON.stringify(run));
  }
  results.push(row);await write(path.join(dir,'conversion.json'),results);
}
await write(path.join(dir,'conversion.json'),results);
async function files(base) {
  const out=[];for(const e of await fs.readdir(base,{withFileTypes:true})) {
    const p=path.join(base,e.name);if(e.isDirectory())out.push(...await files(p));
    else out.push({path:path.relative(dir,p),bytes:(await fs.stat(p)).size});
  }return out;
}
await write(path.join(dir,'files.json'),await files(dir));
