import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createProjectSymbolResolver,builtInSymbols} from '../analog-canvas/packages/symbols/dist/index.js';
import {resolveRouteGeometry} from '../analog-canvas/packages/derived/dist/index.js';
import {segmentIntersectsRect} from '../packages/virtuoso-import/engine/segment_geometry.mjs';
const dir=path.resolve(process.argv[2]);
const read=async p=>JSON.parse(await fs.readFile(path.join(dir,p),'utf8'));
const extraction=await read('extraction.json'),conversion=await read('conversion.json'),browser=await read('browser.json');
const project=await read('strongarm-keep/project.icproj.json'),validation=await read('strongarm-keep/validation.json');
const doc=project.documents[0],resolver=createProjectSymbolResolver(project,builtInSymbols);
const segmentReview=validation.visual.filter(d=>d.code==='VISUAL_WIRE_THROUGH_SYMBOL').map(d=>{
  const segment=resolveRouteGeometry(doc,resolver,doc.routes.find(r=>r.id===d.objectIds[0])).segments[d.parameters.segmentIndex];
  return {routeId:d.objectIds[0],bounds:d.bounds,segment,actualIntersection:segmentIntersectsRect(segment.from,segment.to,d.bounds)};
});
await fs.writeFile(path.join(dir,'strongarm-segment-review.json'),JSON.stringify(segmentReview,null,2));
const fmt=n=>Number(n).toFixed(3),kib=n=>(n/1024).toFixed(1);
const lines=['# 四个原理图最终测试报告','',`测试开始：${extraction.startedAt}`,`Virtuoso：${extraction.virtuosoVersion}`,'',
'## 测试口径','',
'- 用户列出四个路径，均按库路径核对后，只读导出 schematic。没有运行 Check and Save，没有修改源原理图、个人映射或转换器逻辑。',
'- 提取每个设计测量一次；秒数是 TCP 请求开始到成功响应结束，包含排队、SKILL 打开/读取、JSON 写盘和通信，不是纯 SKILL CPU 时间。排除 exporter load 和库路径核对。',
`- exporter load：${fmt(extraction.exporterLoadSeconds)} 秒，仅执行一次。Virtuoso 已经运行，存在缓存影响；这些单次测量不能视为冷启动基准、平均值或 P95。`,
'- 转换分别测试 keep（保留禁用实例）和 omit（忽略禁用实例），按 keep 后 omit 的顺序串行运行。转换时间包含 API 内的扫描、过滤、Python/Node 进程、路由和原生校验，不包含返回结果后的报告/截图写盘。映射 prepare 时间另记。',
'- 使用当前内置规则与个人映射；scale=160、grid=10；busMode=bundled。标签重叠和穿符号区域观察允许记录后导出，其余校验仍拦截。',
'- 浏览器为本机 Chromium 无头模式，1440×1000，Vite 开发服务。导入耗时从选择工程到出现 Opened 状态，不含页面启动、字体就绪及截图时间；不是拖拽延迟或交互帧率测试。','',
'## 提取结果','',
'| 电路 | 提取秒 | 快照 KiB | 实例 | 网络 | 顶层端口 | 图形 | symbol 记录 |',
'|---|---:|---:|---:|---:|---:|---:|---:|'];
for(const e of extraction.designs)lines.push(`| ${e.cell} | ${fmt(e.extractSeconds)} | ${kib(e.bytes)} | ${e.counts.instances} | ${e.counts.nets} | ${e.counts.terminals} | ${e.counts.shapes} | ${e.counts.symbols} |`);
lines.push('',`提取阶段仅由 SKILL 生成 **4 个 *.snapshot.json 文件**，合计 ${extraction.designs.reduce((s,e)=>s+e.bytes,0)} 字节。extraction.json 是测试脚本额外写的计时记录，不是 SKILL 的第二种导出格式。symbol 记录按实例存储，不能当作不同 master 的数量。`,'',
'## 转换结果','',
'| 电路 | 模式 | 转换秒 | 结果 | 工程实例/网络/路线 | 通用方框数量 | 浏览器导入秒 |',
'|---|---|---:|---|---|---:|---:|');
for(const row of conversion)for(const r of row.runs){const b=browser.find(b=>b.cell===row.cell&&b.mode===r.mode);lines.push(`| ${row.cell} | ${r.mode} | ${fmt(r.convertSeconds)} | ${r.status==='success'?'成功':'失败'} | ${r.counts?[r.counts.instances,r.counts.nets,r.counts.routes].join('/'):'未发布工程'} | ${r.genericBoxes?.length??'-'} | ${b?fmt(b.importSeconds):'-'} |`);}
lines.push('','成功 6 次、失败 2 次。成功工程全部通过格式、端点解析及连接校验，ERC 无报错；6 次浏览器导入均成功，均有可见绘图对象且无页面脚本错误。目标实例数量包含自动补充的电源/地标记，因此不等于源实例数。','',
'## 各电路说明','');
for(const row of conversion){const e=extraction.designs.find(e=>e.cell===row.cell);lines.push(`### ${row.cell}`,'',`- 源路径：${e.actualLibraryPath}/${row.cell}/schematic`, `- 不同 master：${row.masters.length}；缺失 symbol：${row.missingSymbols.length}；映射准备 ${fmt(row.prepareSeconds)} 秒。`,`- 禁用实例：${row.disabled.join('、')||'无'}。`,`- 总线：${row.buses.map(b=>`${b.name}（${b.width} 位）`).join('、')||'无'}。`);for(const r of row.runs)lines.push(`- ${r.mode}：视觉诊断 ${JSON.stringify(r.visual)}；阻止导出的诊断 ${JSON.stringify(r.blockingVisual)}；ERC ${JSON.stringify(r.erc)}。`);lines.push('');}
lines.push(
'### 需要关注的问题','',
'1. L2_cdac_12b_CS 的 W0 为 voltage-controlled-switch。CP（源 NC+，CLKS）在画布 (160,0) 应先向左出线，CN（源 NC-，GND）在 (200,0) 应先向右出线，当前两条路线却先向下。源符号与目标符号的控制脚几何不同；当前主要几何拟合/补线没有满足该器件的出线方向，而 refineBoxRoutes 在没有通用方框时直接返回，未修复本例。需要后续针对普通器件的引脚出线约束处理。本次未修改。',
'2. CDAC 另有 9 项标签重叠和 1 项穿符号区域提示。标签重叠在截图中确实可见，尤其相邻级的 VBOT/DCTRL 名称；不是本次失败的直接门槛，但应由用户评估。失败预览仅供诊断，不冒充成功工程。',
'3. strongarm 的 4 项穿符号区域记录在本次允许观察的策略下不拦截。另用实际线段与矩形求交复核，4 项均不相交，属于斜线包围框误报；详见 strongarm-segment-review.json。先前共享电源节点问题没有复现。',
'4. SAR_ADC_TOP_new 的 I2、I3 被标记为禁用，keep 保留为普通方框，omit 删除这些实例及专用末端；W0、W2 不属于此次禁用实例。',
'5. L2 CDAC 的 C31 被标记为禁用，两种模式均因 W0 出线方向失败，不能将失败归因于 C31。四个设计此次均未发现缺失 symbol；旧测试中 std_zyli 缺失的结论不能直接套到这个不同 cell。','',
'## 文件用途','',
'| 文件 | 用途 | 是否为最终工程 |','|---|---|---|',
'| <cell>.snapshot.json | SKILL 提取的原始设计、参数、symbol 图形和连接信息 | 否 |',
'| <cell>.mappings.json | 本次准备的器件映射输入 | 否 |',
'| <cell>-<mode>/project.icproj.json | 可导入 Analog Canvas 的工程 | 是 |',
'| filtered.snapshot.json | 转换 API 返回的精简快照；实际投影/禁用处理详见 report | 否 |',
'| report.json | 参数来源、映射、源/目标检查、总线和禁用实例策略 | 否 |',
'| validation.json | 格式、端点、ERC、视觉观察及阻断项 | 否 |',
'| refinement.json | 路由、共享电源、标签处理记录及内部阶段计时 | 否 |',
'| preview.svg | 原生渲染预览，不是可编辑工程 | 否 |',
'| editor-desktop.png | 实际编辑器导入后的截图 | 否 |',
'| error.json | 失败原因及保存下来的诊断 | 否 |',
'| extraction.json / conversion.json / browser.json | 测试阶段原始测量数据 | 否 |',
'| files.json | 全部测试产物的相对路径、大小和 SHA-256 | 否 |',
'',
'成功模式各写出 6 个转换文件和 1 个浏览器截图；失败模式仅写 error.json。CDAC 另跑一次未计入主表的诊断转换，放在 L2_cdac_12b_CS-diagnostic，保留输入、失败 SVG/诊断及 PNG，不生成最终工程。转换器私有 /tmp 工作目录会清理，不能把错误消息中的临时路径当成长期输出位置。','',
'## 验收边界与建议','',
'- 已覆盖：库路径一致性、只读提取、两种禁用模式、单线总线策略、原生/通用符号映射、文件校验、连线端点与网络成员检查、视觉诊断、真实编辑器导入。',
'- TOP 和 CDAC 的 bundled 总线不验证逐位连接、位序、子总线拆分或仿真等价性。通用方框仅保留模块外部接口，不展开内部电路或证明其仿真行为。',
'- 未覆盖：源图未 Check and Save 时的连接正确性、层次展开、真实仿真、宿主机原版网页兼容性、长时间编辑/保存重开、拖拽延迟/帧率、多次性能统计。不能因 ERC 为空就宣称全部通过。',
'- 最终建议：先修复 CDAC 的 W0 出线方向，再评估其相邻标签拥挤；正式发布前另做保存/重开和交互性能测试。',
'- work/latest 未覆盖。所有新结果在本测试目录，可按需要人工挑选通过的工程。','',
'## 快速入口','');
for(const row of conversion)for(const r of row.runs.filter(r=>r.status==='success'))lines.push(`- [${row.cell} (${r.mode})](${row.cell}-${r.mode}/project.icproj.json) · [截图](${row.cell}-${r.mode}/editor-desktop.png)`);
lines.push('- [CDAC 失败预览](L2_cdac_12b_CS-diagnostic/preview.png)');
await fs.writeFile(path.join(dir,'测试报告.md'),lines.join('\n')+'\n');
async function inventory(base){const a=[];for(const e of await fs.readdir(base,{withFileTypes:true})){const p=path.join(base,e.name);if(e.isDirectory())a.push(...await inventory(p));else if(p!==path.join(dir,'files.json')){const b=await fs.readFile(p);a.push({path:path.relative(dir,p),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}return a;}
const files=await inventory(dir);await fs.writeFile(path.join(dir,'files.json'),JSON.stringify(files,null,2));
console.log(JSON.stringify({filesExcludingManifest:files.length,bytesExcludingManifest:files.reduce((s,f)=>s+f.bytes,0),report:path.join(dir,'测试报告.md')}));
