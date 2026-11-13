"""Export explicite des seuls champs de cartographie, sans contacts ni commentaires."""
import argparse,collections,csv,json,pathlib,re,xml.etree.ElementTree as E,zipfile
N={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def read_sheet(z,name):
 rel={r.get('Id'):r.get('Target') for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
 sh=next(s for s in E.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',N) if s.get('name')==name)
 target=rel[sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')];target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
 ss=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',N)]
 rows=[]
 for r in E.fromstring(z.read(target)).findall('m:sheetData/m:row',N):
  cells={}
  for c in r.findall('m:c',N):
   v=c.find('m:v',N);val=v.text if v is not None else '';val=ss[int(val)] if c.get('t')=='s' and val else val
   cells[re.sub(r'\d','',c.get('r'))]=val
  rows.append(cells)
 headers=rows[0];return [{label:r.get(col,'') for col,label in headers.items()} for r in rows[1:]]
def parts(v):return [x.strip() for x in str(v).split(' ; ') if x.strip()]
REGIONS={
 'Auvergne-Rhône-Alpes':'01 03 07 15 26 38 42 43 63 69 73 74',
 'Bourgogne-Franche-Comté':'21 25 39 58 70 71 89 90',
 'Bretagne':'22 29 35 56','Centre-Val de Loire':'18 28 36 37 41 45',
 'Corse':'2A 2B','Grand Est':'08 10 51 52 54 55 57 67 68 88',
 'Hauts-de-France':'02 59 60 62 80','Île-de-France':'75 77 78 91 92 93 94 95',
 'Normandie':'14 27 50 61 76','Nouvelle-Aquitaine':'16 17 19 23 24 33 40 47 64 79 86 87',
 'Occitanie':'09 11 12 30 31 32 34 46 48 65 66 81 82','Pays de la Loire':'44 49 53 72 85',
 'Provence-Alpes-Côte d’Azur':'04 05 06 13 83 84','Guadeloupe':'971','Martinique':'972','Guyane':'973','La Réunion':'974','Mayotte':'976'}
def geography(r,labels):
 dep=r['Département'];match=re.match(r'^(\d{1,3}|2[AB])(?:\s*-|$)',dep,re.I);code=match[1].zfill(2) if match else ''
 cp=r['Code_postal'];country=r['Pays'].strip().lower()
 if country=='france' and re.fullmatch(r'\d{5}',cp) and not cp.startswith('20'):code=cp[:3] if cp.startswith('97') else cp[:2]
 if code in labels:dep=code+' - '+labels[code]
 region=next((region for region,codes in REGIONS.items() if code in codes.split()),r['Région'])
 return dep,region
def main():
 p=argparse.ArgumentParser();p.add_argument('workbook');p.add_argument('--output',default='data');a=p.parse_args()
 z=zipfile.ZipFile(a.workbook);rows=read_sheet(z,'Etablissements');events=read_sheet(z,'Participations');by=collections.defaultdict(list)
 counts=collections.defaultdict(collections.Counter)
 for r in rows:
  m=re.match(r'^(\d{2,3}|2[AB]) - (.+)$',r['Département'])
  if m:counts[m[1]][m[2]]+=1
 labels={code:counter.most_common(1)[0][0] for code,counter in counts.items()};labels.update({'24':'Dordogne','63':'Puy-de-Dôme','68':'Haut-Rhin'})
 for e in events:by[e['Etablissement_ID']].append({'year':e['Année_scolaire'],'program':e['Dispositif']})
 records=[]
 for r in rows:
  first=[int(y) for y in re.findall(r'\b20\d\d\b',r['Année_acquisition']+' '+r['Années_scolaires'])]
  def number(k):
   try:return float(r[k]) if r[k] else None
   except ValueError:return None
  department,region=geography(r,labels)
  records.append(dict(id=r['Etablissement_ID'],name=r['Nom'],city=r['Commune'],department=department,region=region,country=r['Pays'],address=r['Adresse_cartographie'],latitude=number('Latitude'),longitude=number('Longitude'),firstYear=min(first) if first else None,years=parts(r['Années_scolaires']),programs=parts(r['Dispositifs']),participations=by[r['Etablissement_ID']],precision='commune' if 'approximative' in r['Localisation'].lower() else 'adresse',type=r['Type_établissement']))
 out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
 payload={'title':"Fablab à l’école",'description':'Les établissements participants, de 2018 à 2027','updated':'2026-11-13','records':records}
 (out/'public.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
 with (out/'carte-grist.csv').open('w',newline='',encoding='utf-8-sig') as f:
  keys=['Etablissement_ID','Nom','Commune','Departement','Region','Pays','Adresse_cartographie','Latitude','Longitude','Premiere_annee_connue','Annees_scolaires','Dispositifs','Precision','Participations_JSON'];w=csv.DictWriter(f,fieldnames=keys);w.writeheader()
  for r in records:w.writerow(dict(zip(keys,[r['id'],r['name'],r['city'],r['department'],r['region'],r['country'],r['address'],r['latitude'],r['longitude'],r['firstYear'],' ; '.join(r['years']),' ; '.join(r['programs']),r['precision'],json.dumps(r['participations'],ensure_ascii=False)])))
 print(json.dumps({'records':len(records),'located':sum(r['latitude'] is not None and r['longitude'] is not None for r in records),'participations':sum(len(r['participations']) for r in records)}))
if __name__=='__main__':main()
