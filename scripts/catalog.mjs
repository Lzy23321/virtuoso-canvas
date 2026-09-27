import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadFullCatalog, catalogMarkdown} from '../dist/packages/virtuoso-import/adapter/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalog=await loadFullCatalog({root});
await writeFile(new URL('../docs/analog-canvas-catalog.zh-CN.md',import.meta.url),catalogMarkdown(catalog));
console.log(JSON.stringify({symbols:catalog.symbols.length, convertible:catalog.symbols.filter(s=>s.conversion==='supported').length}));
