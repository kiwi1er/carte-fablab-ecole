import test from 'node:test';import assert from 'node:assert/strict';
import {summarizeTerritories,territoryTotals} from '../lib/territories.mjs';
const r=(id,years)=>({id,name:'Nom privé '+id,address:'Adresse privée',department:'56 - Morbihan',region:'Bretagne',years,programs:['A'],participations:years.map(year=>({year,program:'A'})),impactObservations:years.map(year=>({year,programs:['A'],counts:{classes:{declared:3},teachingTeam:{declared:4}},byProgram:{A:{classes:{declared:3},teachingTeam:{declared:4}}}}))});
test('territorial export excludes identities and avoids double counting renewals',()=>{
 const ts=summarizeTerritories([r('secret1',['2024-2025','2025-2026']),r('secret2',['2025-2026'])]);
 const text=JSON.stringify(ts);assert.ok(!text.includes('secret'));assert.ok(!text.includes('privé'));assert.ok(!text.includes('privée'));
 assert.equal(territoryTotals(ts).establishments,2);assert.equal(territoryTotals(ts).pupils,132);
 assert.equal(territoryTotals(ts,{},'annual').pupils,198);assert.equal(territoryTotals(ts,{year:'2024-2025'}).establishments,1);
});
