import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectMappings} from '../dist/packages/virtuoso-import/core/index.js';
import {loadCatalog} from '../dist/packages/virtuoso-import/adapter/index.js';
import {createGenericBoxes} from '../dist/packages/virtuoso-import/adapter/generic-box.js';
const root=process.cwd(),base=path.resolve(process.argv[2]),cell=process.argv[3];
const source=JSON.parse(await fs.readFile(path.join(base,cell+'.snapshot.json')));
const table=JSON.parse(await fs.readFile(path.join(base,cell+'.mappings.json')));
const catalog=await loadCatalog({root});
const {snapshot,mappings}=projectMappings(source,table,catalog,{disabledInstances:'keep'});
const boxes=createGenericBoxes(snapshot,mappings,160);
const rules=snapshot.instances.map(i=>{
  const m=mappings.get(i.id),spec=catalog.find(s=>s.id===m.symbol);
  return {instanceId:i.id,library:i.library,cell:i.cell,symbol:m.symbol,pins:m.pins,parameters:m.parameters,
    ...(spec?.deviceClass?{deviceClass:spec.deviceClass}:{}),
    ...(boxes.instances[i.id]?{externalDefinitionId:boxes.instances[i.id].definitionId}:{})};
});
const dir=path.join(base,cell+'-diagnostic');await fs.mkdir(dir);
await fs.writeFile(dir+'/snapshot.json',JSON.stringify(snapshot));
await fs.writeFile(dir+'/mapping.json',JSON.stringify({version:1,grid:10,scale:160,rules,customSymbols:boxes.symbols,externalDefinitions:boxes.definitions}));
const r=spawnSync('python3',['packages/virtuoso-import/engine/convert_canvas.py',dir+'/snapshot.json','--mapping',dir+'/mapping.json','--output',dir+'/result.icproj.json','--allow-label-overlap','--allow-symbol-overlap'],{encoding:'utf8'});
console.log(r.status,r.stderr);
