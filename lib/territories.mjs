import {filterRecords} from './model.mjs';
import {aggregateImpact} from './impact.mjs';

// Only aggregate figures are exported. No source record, identifier or history.
export function summarizeTerritories(records, centers={}) {
 const groups=new Map();
 for(const r of records){
  const abroad=!/^\d{2,3}\s*-|^2[AB]\s*-/.test(r.department);
  const department=abroad?'Hors de France':r.department;
  if(!groups.has(department))groups.set(department,[]);
  groups.get(department).push(r);
 }
 return [...groups].map(([department,rs])=>{
  const years=['',...new Set(rs.flatMap(r=>r.years))];
  const programs=['',...new Set(rs.flatMap(r=>r.programs))];
  const summaries=[];
  for(const year of years)for(const program of programs){
   const subset=filterRecords(rs,{year,program});if(!subset.length)continue;
   for(const mode of ['school','annual']){
    const t=aggregateImpact(subset,{year,program},mode);
    summaries.push({year,program,mode,establishments:subset.length,classes:t.classes,pupils:t.pupils,teachers:t.teachers,training:t.training,support:t.support});
   }
  }
  return {department,region:department==='Hors de France'?'Hors de France':rs[0].region,latitude:centers[department]?.latitude??null,longitude:centers[department]?.longitude??null,summaries};
 }).sort((a,b)=>a.department.localeCompare(b.department,'fr',{numeric:true}));
}
export function territoryTotals(records,filters={},mode='school'){
 const total={establishments:0,classes:0,pupils:0,teachers:0,training:0,support:0};
 for(const r of records){const s=r.summaries.find(s=>s.year===(filters.year||'')&&s.program===(filters.program||'')&&s.mode===mode);if(s)for(const k of Object.keys(total))total[k]+=s[k];}
 return total;
}
