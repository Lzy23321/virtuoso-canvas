import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createEmptyProject, CircuitProjectSchema, createRoutePath} from '../analog-canvas/packages/model/dist/index.js';
import {builtInSymbols, createProjectSymbolResolver, externalSubcircuitSymbolId} from '../analog-canvas/packages/symbols/dist/index.js';
import {serializeProject, tryParseProjectWithMetadata} from '../analog-canvas/packages/project-protocol/dist/index.js';
import {resolveEndpointPoint} from '../analog-canvas/packages/derived/dist/index.js';
import {renderDocumentSvg} from '../analog-canvas/packages/render-svg/dist/index.js';
const project=createEmptyProject('generic-box-probe','Generic box feasibility');
project.externalSubcircuitDefinitions.push({id:'external-probe',name:'Comparator',interfaceStatus:'declared',formalParameters:[],
  terminals:['INP','INN','OUT'].map((name,i)=>({id:'pin-'+i,name,direction:i===2?'output':'input'})),
  presentation:{pinPlacements:[{terminalId:'pin-0',side:'west',offset:-20},{terminalId:'pin-1',side:'west',offset:20},{terminalId:'pin-2',side:'east',offset:0}]}});
const doc=project.documents[0];
doc.instances.push({id:'block',reference:'X1',symbolId:externalSubcircuitSymbolId('external-probe'),placement:{position:{x:200,y:200},rotation:0,mirror:'none'},netlist:{parameters:{},binding:{kind:'external-subcircuit',definitionId:'external-probe'}}});
let resolver=createProjectSymbolResolver(project,builtInSymbols);
for (const [i,name] of ['INP','INN','OUT'].entries()) {
  const endpoint={kind:'terminal',instanceId:'block',pinName:name};
  const p=resolveEndpointPoint(doc,resolver,endpoint); assert(p);
  doc.nets.push({id:'net-'+i,terminals:[{instanceId:'block',pinName:name}]});
  doc.junctions.push({id:'end-'+i,netId:'net-'+i,position:{x:p.x+(i===2?60:-60),y:p.y},role:'route-anchor'});
  doc.routes.push(createRoutePath({id:'wire-'+i,netId:'net-'+i,start:endpoint,end:{kind:'junction',junctionId:'end-'+i},bends:[],modes:['manual']}));
}
CircuitProjectSchema.parse(project);
const serialized=serializeProject(project), parsed=tryParseProjectWithMetadata(serialized);assert(parsed.ok);
resolver=createProjectSymbolResolver(parsed.project,builtInSymbols);
const moved=parsed.project.documents[0],endpoint={kind:'terminal',instanceId:'block',pinName:'OUT'};
const before=resolveEndpointPoint(moved,resolver,endpoint);
moved.instances[0].placement.position.x+=100;
assert.equal(resolveEndpointPoint(moved,resolver,endpoint).x,before.x+100);
const dir=new URL('../work/generic-box-probe/',import.meta.url);await fs.mkdir(dir,{recursive:true});
await fs.writeFile(new URL('project.icproj.json',dir),serialized);
await fs.writeFile(new URL('preview.svg',dir),renderDocumentSvg(doc,createProjectSymbolResolver(project,builtInSymbols),{title:project.name}));
console.log(JSON.stringify({schema:true,roundtrip:true,pins:3,movable:true,terminalBoundRoutes:true}));
