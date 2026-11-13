export const assumptions=Object.freeze({minimumClasses:2,minimumTeachers:2,pupilsPerClass:22,trainingHours:6,supportHours:9});
export function retained(value){if(value===null||value===undefined||value==='')return {declared:null,value:2,assumed:true};const n=Number(value);const valid=Number.isInteger(n)&&n>=0&&n!==999;return {declared:valid?n:null,value:valid?Math.max(2,n):2,assumed:!valid||n<2};}
export function estimateImpact(counts={}){const classes=retained(counts?.classes?.declared),teachers=retained(counts?.teachingTeam?.declared);return {classes:classes.value,teachers:teachers.value,pupils:classes.value*22,training:teachers.value*6,support:teachers.value*9,classMinimum:classes.assumed?1:0,teacherMinimum:teachers.assumed?1:0,warnings:Array.isArray(counts?.warnings)?counts.warnings:[]};}
export function impactFor(record,filters={},mode='school'){
 const observations=(Array.isArray(record.impactObservations)?record.impactObservations:[]).filter(o=>(!filters.year||o.year===filters.year)&&(!filters.program||(Array.isArray(o.programs)&&o.programs.includes(filters.program)))).sort((a,b)=>String(a.year||'').localeCompare(String(b.year||'')));
 const chosen=mode==='annual'?observations:observations.slice(-1);
 const safe=chosen.length?chosen:[{counts:{},byProgram:{}}];
 return safe.map(o=>({...estimateImpact(filters.program?o.byProgram?.[filters.program]:o.counts),year:o.year||null}));
}
export function aggregateImpact(records,filters={},mode='school'){
 const total={classes:0,teachers:0,pupils:0,training:0,support:0,classMinimum:0,teacherMinimum:0,observations:0,warningObservations:0};
 for(const record of records)for(const item of impactFor(record,filters,mode)){for(const k of ['classes','teachers','pupils','training','support','classMinimum','teacherMinimum'])total[k]+=item[k];total.observations++;if(item.warnings.length)total.warningObservations++;}
 return total;
}
