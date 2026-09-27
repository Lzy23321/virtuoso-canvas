import fs from 'node:fs/promises';
import {fixture} from '../tests/fixture.mjs';
import {convertDesign} from '../dist/packages/virtuoso-import/adapter/index.js';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=fixture();
for (const inst of source.instances) inst.library='unmappedDemo';
const result=await convertDesign(source,{version:1,devices:{}},{runtime:{root}});
const dir=new URL('../work/generic-box-conversion/',import.meta.url);
await fs.mkdir(dir,{recursive:true});
await fs.writeFile(new URL('project.icproj.json',dir),JSON.stringify(result.project,null,2));
await fs.writeFile(new URL('report.json',dir),JSON.stringify(result.report,null,2));
await fs.writeFile(new URL('preview.svg',dir),result.svg);
console.log(fileURLToPath(dir));
