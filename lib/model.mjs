export const normalize = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function list(v) { if (Array.isArray(v)) return v[0] === 'L' ? v.slice(1) : v; return String(v ?? '').split(/\s*;\s*/).filter(Boolean); }
export function coordinate(v) { if (v === null || v === undefined || String(v).trim() === '') return null; const n=Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; }
export function located(r) { return r.latitude !== null && r.longitude !== null && Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && Math.abs(r.latitude)<=90 && Math.abs(r.longitude)<=180 && !(r.latitude===0 && r.longitude===0); }
export const palette = ['#245d7a','#457b9d','#4f8462','#9a701f','#b45732','#a14d67','#72558c','#247e83','#955729','#576c3c'];
export function colorFor(year) { return year ? palette[Math.abs(Number(year)-2018)%palette.length] : '#78838b'; }
export function filterRecords(records, f) {
 return records.filter(r => (!f.region || (r.region || 'Non renseignée')===f.region) && (!f.department || (r.department || 'Non renseigné')===f.department) && (!f.year || r.years.includes(f.year)) && (!f.program || r.programs.includes(f.program)) && (!(f.year&&f.program)||r.participations.some(p=>p.year===f.year&&p.program===f.program)) && (!f.query || normalize([r.name,r.city,r.department,r.region].join(' ')).includes(normalize(f.query))));
}
export function participationCount(records,f={}) { return records.reduce((sum,r)=>sum+r.participations.filter(p=>(!f.year||p.year===f.year)&&(!f.program||p.program===f.program)).length,0); }
export function fromGrist(rec) {
 const value=(...keys)=>{for(const k of keys) if(rec[k] !== undefined && rec[k] !== null && rec[k] !== '')return rec[k];return '';};
 let participations=[];try{participations=JSON.parse(value('Participations','Participations_JSON')||'[]');}catch{}
 if(!Array.isArray(participations))participations=[];
 let impactObservations=[];try{impactObservations=JSON.parse(value("Impact","Indicateurs_JSON")||"[]");}catch{}
 if(!Array.isArray(impactObservations))impactObservations=[];
 const years=list(value('Years','Annees_scolaires','Années_scolaires'));
 const acquisition=String(value('Acquisition','Année_acquisition')).match(/20\d{2}/g)||[];
 const given=Number(value('FirstYear','Premiere_annee_connue'));
 const known=[...acquisition.map(Number),...years.map(v=>Number(String(v).slice(0,4)))].filter(y=>Number.isFinite(y)&&y>=2010&&y<=2100);
 return {impactObservations,rowId:rec.id,id:String(value('Identifier','Etablissement_ID')||rec.id),name:String(value('Name','Nom')),city:String(value('City','Commune')),department:String(value('Department','Departement','Département')),region:String(value('Region','Région')),country:String(value('Country','Pays')),address:String(value('Address','Adresse_cartographie')),latitude:coordinate(value('Latitude')),longitude:coordinate(value('Longitude')),firstYear:given>=2010&&given<=2100?given:(known.length?Math.min(...known):null),years,programs:list(value('Programs','Dispositifs')),participations:participations.filter(p=>p&&typeof p.year==='string'&&typeof p.program==='string'),precision:normalize(value('Precision','Localisation')).includes('commune')?'commune':'adresse',type:String(value('Type','Type_établissement'))};
}
