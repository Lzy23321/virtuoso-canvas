import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareMappings} from '../dist/packages/virtuoso-import/core/index.js';
import {convertDesign,loadCatalog} from '../dist/packages/virtuoso-import/adapter/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const directory=path.resolve(process.argv[2]);
const runtime={root}, catalog=await loadCatalog(runtime);
const builtin=JSON.parse(await fs.readFile(path.join(root,'rules/builtin/mappings.json')));
const personal=JSON.parse(await fs.readFile(path.join(root,'personal/mappings.json')).catch(()=>'{"version":1,"devices":{}}'));
for(const cell of ['L3_Bootstrap_tb_design','SAR_ADC_TOP']) {
  const source=JSON.parse(await fs.readFile(path.join(directory,cell+'.snapshot.json')));
  const mapping=prepareMappings(source,builtin,catalog,personal).settings;
  for(const mode of ['keep','omit']) {
    const out=path.join(directory,`${cell}-${mode}-${process.argv[3]??'diagnostics'}`);
    await fs.mkdir(out);
    await fs.writeFile(path.join(out,'mappings.json'),JSON.stringify(mapping,null,2));
    try {
      const result=await convertDesign(source,mapping,{runtime,busMode:'bundled',disabledInstances:mode,
        allowLabelOverlap:process.argv.includes('--allow-reviewed-visuals'),
        allowSymbolOverlap:process.argv.includes('--allow-reviewed-visuals')});
      await fs.writeFile(path.join(out,'project.icproj.json'),JSON.stringify(result.project,null,2));
      await fs.writeFile(path.join(out,'report.json'),JSON.stringify(result.report,null,2));
      await fs.writeFile(path.join(out,'preview.svg'),result.svg);
      console.log(cell,mode,'success',JSON.stringify(result.report.counts));
    } catch(error) {
      await fs.writeFile(path.join(out,'error.json'),JSON.stringify({code:error.code,message:error.message,details:error.details},null,2));
      const diagnostics=error.details?.diagnostics??{};
      const v=diagnostics['result.validation.json'];
      const count=items=>(items??[]).reduce((a,d)=>(a[d.code]=(a[d.code]??0)+1,a),{});
      console.log(cell,mode,JSON.stringify({code:error.code,stderr:error.details?.process?.stderr,visual:count(v?.blockingVisual),erc:count(v?.blockingErc??v?.erc)}));
    }
  }
}
