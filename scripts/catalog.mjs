import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadFullCatalog, catalogMarkdown} from '../dist/packages/virtuoso-import/adapter/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalog=await loadFullCatalog({root});
if(process.argv[2])await writeFile(process.argv[2],catalogMarkdown(catalog));
console.log(JSON.stringify({symbols:catalog.symbols.length, convertible:catalog.symbols.filter(s=>s.conversion==='supported').length}));
