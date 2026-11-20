import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('indicators',pathlib.Path(__file__).parents[1]/'scripts/indicators.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Rules(unittest.TestCase):
 def test_missing_zero_one_use_minimum(self):
  for value in [None,'','0','1','non renseigné']:
   r=m.retained_count(value);self.assertEqual(r['retained'],2);self.assertEqual(r['basis'],'minimum_assumed')
 def test_declared_values_preserved(self):
  for value in ['2','3','12','25']:
   r=m.retained_count(value);self.assertEqual(r['retained'],int(value));self.assertEqual(r['basis'],'declared')
 def test_independent_counts(self):
  r=m.estimate('1','5');self.assertEqual(r['estimatedPupils'],44);self.assertEqual(r['plannedTrainingParticipantHours'],30);self.assertEqual(r['plannedSupportParticipantHours'],45);self.assertEqual(r['classes']['declared'],1)
 def test_duplicate_responses_and_programs_not_summed(self):
  def row(c,t,p='A'):return {'Année_scolaire':'2026-2027','Dispositif':p,'Classes_impliquées':c,'Personnes_équipe_pédagogique':t}
  obs=m.observations([row('4','3'),row('6','5'),row('2','2','B')]);self.assertEqual(len(obs),1);self.assertEqual(obs[0]['counts']['classes']['retained'],2);self.assertEqual(obs[0]['byProgram']['A']['classes']['retained'],6)
 def test_sentinel_999_is_not_counted(self):
  obs=m.observations([{'Année_scolaire':'2026-2027','Dispositif':'A','Classes_impliquées':'999','Personnes_équipe_pédagogique':'4'}]);self.assertEqual(obs[0]['counts']['classes']['retained'],2);self.assertTrue(obs[0]['counts']['warnings'])
if __name__=='__main__':unittest.main()
