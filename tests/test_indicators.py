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
if __name__=='__main__':unittest.main()
