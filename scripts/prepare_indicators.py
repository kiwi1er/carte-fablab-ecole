"""Préparer les observations calculées sans additionner des réponses répétées."""
import argparse,csv,json,pathlib,zipfile
from export_public import read_sheet
from indicators import estimate

def main():
 p=argparse.ArgumentParser();p.add_argument('workbook');p.add_argument('--output',default='data/indicateurs-sources.csv');a=p.parse_args()
 rows=read_sheet(zipfile.ZipFile(a.workbook),'Sources');out=pathlib.Path(a.output)
 keys=['Source_ID','Etablissement_ID','Annee_scolaire','Dispositif','Classes_declarees','Classes_retenues','Origine_classes','Personnes_declarees','Personnes_retenues','Origine_personnes','Champ_personnes_utilise','Eleves_estimes','Heures_participants_formation_prevues','Heures_participants_accompagnement_prevues']
 with out.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys);w.writeheader()
  for r in rows:
   key='Personnes_équipe_pédagogique' if r.get('Personnes_équipe_pédagogique','').strip() else 'Enseignants_bénéficiaires'
   v=estimate(r.get('Classes_impliquées'),r.get(key));c=v['classes'];t=v['teachingTeam']
   w.writerow(dict(zip(keys,[r['Source_ID'],r['Etablissement_ID'],r['Année_scolaire'],r['Dispositif'],r.get('Classes_impliquées',''),c['retained'],c['basis'],r.get(key,''),t['retained'],t['basis'],key,v['estimatedPupils'],v['plannedTrainingParticipantHours'],v['plannedSupportParticipantHours']])))
 print(json.dumps({'source_observations':len(rows),'output':str(out),'rule':'minimum 2 classes et 2 personnes ; 22 élèves/classe ; 6 h formation et 9 h accompagnement/personne','aggregation':'Aucune somme : les lignes comprennent des réponses répétées et des observations de dates différentes.'},ensure_ascii=False))
if __name__=='__main__':main()
