import {colorFor,coordinate,filterRecords,fromGrist,located,normalize} from './lib/model.mjs';
import {aggregateImpact} from './lib/impact.mjs';

// Adapté du widget Map de gristlabs/grist-widget (Apache-2.0).
// Mêmes principes : Leaflet, markercluster, marqueur sélectionné et curseur Grist.
const $=id=>document.getElementById(id);
const mode=new URLSearchParams(location.search).get('mode')==='grist'?'grist':'public';
const state={records:[],visible:[],markers:new Map(),selected:null,limit:50,firstFit:true,grist:null};
let map,clusters;let customColors={};
try{customColors=JSON.parse(localStorage.getItem('fablab-colors')||'{}');}catch{}
const color=y=>/^#[0-9a-f]{6}$/i.test(customColors[y])?customColors[y]:colorFor(y);
const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;};
const filters=()=>({query:$('search').value.trim(),region:$('region').value,department:$('department').value,year:$('year').value,program:$('program').value});
function options(id,values){const select=$(id),value=select.value,first=select.options[0].cloneNode(true);select.replaceChildren(first);for(const v of [...new Set(values)].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true})))select.add(new Option(v,v));if([...select.options].some(o=>o.value===value))select.value=value;}
function setupFilters(){const rs=state.records;options('region',rs.map(r=>r.region||'Non renseignée'));options('year',rs.flatMap(r=>r.years));options('program',rs.flatMap(r=>r.programs));setupDepartments();}
function setupDepartments(){const region=$('region').value;options('department',state.records.filter(r=>!region||(r.region||'Non renseignée')===region).map(r=>r.department||'Non renseigné'));}
function clusterIcon(cluster){
 // Adaptation de selectedRowClusterIconFactory : met en évidence le groupe sélectionné.
 const selected=state.markers.get(state.selected);
 const hasSelected=selected&&cluster.getAllChildMarkers().includes(selected);
 return L.divIcon({html:`<span>${cluster.getChildCount()}</span>`,className:'cluster'+(hasSelected?' selected-cluster':''),iconSize:L.point(42,42)});
}
function icon(r){const el=document.createElement('div');el.className='map-dot'+(r.precision==='commune'?' approximate':'')+(state.selected===r.id?' selected':'');el.style.backgroundColor=color(r.firstYear);return L.divIcon({html:el,className:'',iconSize:[16,16],iconAnchor:[8,8]});}
function initializeMap(){
 if(!globalThis.L||!L.markerClusterGroup){const e=text('div','Le fond de carte n’a pas pu être chargé. Vérifiez votre connexion, puis rechargez la page. La liste des établissements reste disponible.','map-error');$('map').append(e);return;}
 map=L.map('map',{wheelPxPerZoomLevel:90}).setView([46.6,2.4],6);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
 map.createPane('clusters').style.zIndex=610;map.createPane('otherMarkers').style.zIndex=600;
 clusters=L.markerClusterGroup({maxClusterRadius:35,showCoverageOnHover:false,spiderfyOnMaxZoom:true,clusterPane:'clusters',iconCreateFunction:clusterIcon}).addTo(map);
 new ResizeObserver(()=>map.invalidateSize()).observe($('map'));
}
function fit(){if(!map)return;const points=state.visible.filter(located).map(r=>[r.latitude,r.longitude]);if(points.length)map.fitBounds(points,{padding:[65,90],maxZoom:13});else map.setView([46.6,2.4],6);}
function drawMarkers(){
 if(!map)return;clusters.clearLayers();state.markers.clear();
 for(const r of state.visible.filter(located)){
  const marker=L.marker([r.latitude,r.longitude],{title:r.name,icon:icon(r),pane:'otherMarkers'});
  const popup=text('div',r.name);marker.bindPopup(popup);marker.on('click',()=>select(r.id,false));
  state.markers.set(r.id,marker);clusters.addLayer(marker);
 }
}
function legend(){
 const box=$('legend-years');box.replaceChildren();const years=[...new Set(state.visible.map(r=>r.firstYear))].sort((a,b)=>(a??9999)-(b??9999));
 for(const year of years){const label=document.createElement('label');label.className='legend-item';const picker=document.createElement('input');picker.type='color';picker.value=color(year);picker.title='Changer la couleur : '+(year||'année inconnue');picker.setAttribute('aria-label',picker.title);picker.style.cssText='width:15px;height:15px;min-height:0;padding:0;border:0;background:none;';picker.addEventListener('input',()=>{customColors[year]=picker.value;try{localStorage.setItem('fablab-colors',JSON.stringify(customColors));}catch{}drawMarkers();renderResults();});label.append(picker,text('span',year||'Non connue'));box.append(label);}
}
function renderResults(){
 const box=$('results');box.replaceChildren();const rs=state.visible.slice(0,state.limit);
 for(const r of rs){const li=document.createElement('li'),btn=document.createElement('button');btn.type='button';btn.className='result';const dot=text('span','','result-dot');dot.style.backgroundColor=color(r.firstYear);const content=document.createElement('span');content.append(text('strong',r.name),text('small',[r.city,r.department].filter(Boolean).join(' · ')));if(!located(r))content.append(text('small','Coordonnées à compléter','tag'));else if(r.precision==='commune')content.append(text('small','Position approximative dans la commune','tag'));btn.append(dot,content);btn.addEventListener('click',()=>select(r.id,true));li.append(btn);box.append(li);}
 $('results-empty').hidden=state.visible.length>0;$('more').hidden=state.limit>=state.visible.length;$('result-total').textContent=state.visible.length.toLocaleString('fr-FR');
}
function closeDetails(){$('details').hidden=true;state.selected=null;drawMarkers();}
const format=n=>n.toLocaleString('fr-FR');
function renderImpact(){
 const annual=$('impact-mode').value==='annual';const total=aggregateImpact(state.visible,filters(),annual?'annual':'school');
 for(const [id,key] of [['impact-pupils','pupils'],['impact-teachers','teachers'],['impact-training','training'],['impact-support','support']])$(id).textContent=format(total[key]);
}
function select(id,focus){
 const r=state.records.find(r=>r.id===id);if(!r)return;state.selected=id;
 for(const rr of state.visible){const m=state.markers.get(rr.id);if(m)m.setIcon(icon(rr));}if(clusters)clusters.refreshClusters();
 const d=$('details');d.replaceChildren();d.hidden=false;
 const close=text('button','×','close');close.type='button';close.setAttribute('aria-label','Fermer la fiche');close.addEventListener('click',closeDetails);d.append(close,text('h2',r.name),text('p',[r.city,r.department].filter(Boolean).join(' · ')));
 const field=(label,value)=>{if(!value)return;d.append(text('p',label,'detail-label'),text('p',value));};
 field('Localisation',r.address);field('Première année connue',r.firstYear?String(r.firstYear):'Non renseignée');
 if(r.years.length){d.append(text('p','Participations documentées','detail-label'));const chips=document.createElement('div');chips.className='chips';for(const y of r.years)chips.append(text('span',y,'chip'));d.append(chips);}else field('Historique','Établissement recensé dans le tableau général ; périodes de participation non précisées.');
 field('Dispositif',r.programs.join(' · '));
 const impact=aggregateImpact([r],filters(),$('impact-mode').value);
 field('Élèves estimés',`${format(impact.pupils)} (${format(impact.classes)} classes × 22)`);
 field('Enseignants / équipe pédagogique estimés',format(impact.teachers));
 field('Formation prévue',`${format(impact.training)} heures-participants`);
 field('Accompagnement prévu',`${format(impact.support)} heures-participants`);
 field('Base du calcul',($('impact-mode').value==='annual'?'Cumul des années documentées. ':'Dernière année renseignée, ou minimum historique. ')+`Minimum appliqué pour ${impact.classMinimum} effectif(s) de classes et ${impact.teacherMinimum} effectif(s) de personnes.`+(impact.warningObservations?' Données à vérifier ou attribution des effectifs à confirmer.':''));
 if(!located(r))field('Position sur la carte','Coordonnées à compléter. Cet établissement est recensé dans la liste.');else if(r.precision==='commune')field('Précision','Point approximatif au niveau de la commune.');
 const marker=state.markers.get(id);if(focus&&marker)clusters.zoomToShowLayer(marker,()=>{map.panTo(marker.getLatLng());marker.openPopup();});
 if(state.grist&&r.rowId)state.grist.setCursorPos({rowId:r.rowId}).catch(()=>{});
}
function render(){
 const f=filters();state.visible=filterRecords(state.records,f).sort((a,b)=>a.name.localeCompare(b.name,'fr'));state.limit=50;
 $('count').textContent=state.visible.length.toLocaleString('fr-FR');
 const n=state.visible.filter(located).length,missing=state.visible.length-n;
 $('status').textContent=`${n.toLocaleString('fr-FR')} établissement${n===1?'':'s'} sur la carte`+(missing?` · ${missing.toLocaleString('fr-FR')} à localiser`:'');
 if(state.selected&&!state.visible.some(r=>r.id===state.selected)){$('details').hidden=true;state.selected=null;}
 drawMarkers();legend();renderResults();renderImpact();if(state.selected)select(state.selected,false);if(state.firstFit&&n){fit();state.firstFit=false;}
}
function loadRecords(records){state.records=records.map(r=>({...r,latitude:coordinate(r.latitude),longitude:coordinate(r.longitude)}));setupFilters();render();}
async function connectGrist(){
 $('status').textContent='Associez les colonnes Nom, Latitude et Longitude dans les options du widget.';
 const script=document.createElement('script');script.src='https://docs.getgrist.com/grist-plugin-api.js';document.head.append(script);
 await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;});const grist=globalThis.grist;state.grist=grist;
 const optional=true;
 grist.ready({requiredAccess:'read table',allowSelectBy:true,columns:[{name:'Name',title:'Nom'},{name:'Latitude',type:'Numeric'},{name:'Longitude',type:'Numeric'},{name:'Identifier',title:'Identifiant établissement',optional},{name:'City',title:'Commune',optional},{name:'Department',title:'Département',optional},{name:'Region',title:'Région',optional},{name:'Country',title:'Pays',optional},{name:'Address',title:'Adresse cartographie',optional},{name:'FirstYear',title:'Première année connue',optional},{name:'Years',title:'Années scolaires',optional},{name:'Acquisition',title:'Année acquisition',optional},{name:'Programs',title:'Dispositifs',optional},{name:'Precision',title:'Précision localisation',optional},{name:'Participations',title:'Participations JSON',optional},{name:'Impact',title:'Indicateurs JSON',optional}]});
 grist.onRecords((records,mappings)=>{const mapped=grist.mapColumnNames(records);if(!mapped&&mappings){$('status').textContent='Complétez les associations de colonnes dans les options du widget.';return;}loadRecords((mapped||records).map(fromGrist));});
 grist.onRecord(record=>{const r=state.records.find(r=>r.rowId===record?.id);if(r&&r.id!==state.selected)select(r.id,true);});
}
initializeMap();
$('filters').addEventListener('submit',e=>e.preventDefault());
$('search').addEventListener('input',render);
$('impact-mode').addEventListener('change',()=>{renderImpact();if(state.selected)select(state.selected,false);});
for(const id of ['region','department','year','program'])$(id).addEventListener('change',()=>{if(id==='region')setupDepartments();render();fit();});
$('filters').addEventListener('reset',()=>setTimeout(()=>{setupDepartments();render();fit();},0));
$('more').addEventListener('click',()=>{state.limit+=50;renderResults();});$('fit').addEventListener('click',fit);
$('fullscreen').addEventListener('click',async()=>{const presenting=document.body.classList.toggle('presentation');$('fullscreen').textContent=presenting?'Quitter la présentation ↙':'Plein écran ↗';if(presenting&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen();}catch{}}else if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}if(map)setTimeout(()=>map.invalidateSize(),100);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('details').hidden)closeDetails();}});
try{
 if(mode==='grist'){$('local-loader').hidden=true;await connectGrist();}else{
  loadRecords([]);$('status').textContent='Ouvrez votre fichier de données pour afficher la carte.';
  $('local-data').addEventListener('change',async event=>{
   const file=event.target.files[0];if(!file)return;
   try{const payload=JSON.parse(await file.text());if(!payload||!Array.isArray(payload.records)||payload.records.some(r=>!r||typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.years)||!Array.isArray(r.programs)||!Array.isArray(r.participations)))throw Error('Format invalide');
    $('local-error').hidden=true;state.firstFit=true;loadRecords(payload.records);
   }catch{loadRecords([]);$('local-error').hidden=false;$('local-error').textContent='Fichier invalide. Choisissez le fichier JSON préparé pour la carte.';$('status').textContent='Aucune donnée chargée.';}
  });
 }
}catch(error){console.error(error);$('status').textContent=mode==='grist'?'Connexion à Grist indisponible. Rechargez le widget.':'Les données n’ont pas pu être chargées. Rechargez la page.';}
