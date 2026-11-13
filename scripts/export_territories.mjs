import fs from 'node:fs';
import {fromGrist} from '../lib/model.mjs';
import {summarizeTerritories,territoryTotals} from '../lib/territories.mjs';
const [sourcePath,communesPath,outPath]=process.argv.slice(2);
if(!outPath)throw Error('Usage: node scripts/export_territories.mjs source.json communes.json destination.json');
const raw=JSON.parse(fs.readFileSync(sourcePath));
const records=raw.map(r=>fromGrist({id:r.id,...r.fields}));
const communes=JSON.parse(fs.readFileSync(communesPath));
const centers={};
for(const dep of new Set(records.map(r=>r.department))){
 const code=dep.split(' - ')[0],cs=communes.filter(c=>c.codeDepartement===code&&c.centre);
 if(cs.length)centers[dep]={latitude:cs.reduce((s,c)=>s+c.centre.coordinates[1],0)/cs.length,longitude:cs.reduce((s,c)=>s+c.centre.coordinates[0],0)/cs.length};
}
const territories=summarizeTerritories(records,centers);
fs.writeFileSync(outPath,JSON.stringify({territories},null,2));
const csv=[['Departement','Region','Latitude','Longitude','Synthese_JSON'],...territories.map(t=>[t.department,t.region,t.latitude??'',t.longitude??'',JSON.stringify(t.summaries)])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
fs.writeFileSync(outPath.replace(/\.json$/,'.csv'),csv);
console.log(JSON.stringify({territories:territories.length,totals:territoryTotals(territories)}));
