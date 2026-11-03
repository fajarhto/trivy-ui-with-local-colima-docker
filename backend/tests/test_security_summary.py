import unittest
from datetime import datetime, timezone, timedelta
from app.api.security_summary import evaluate

class SecurityScoringTests(unittest.TestCase):
    def facts(self):
        return {'Config': {'User':'fajarhartanto','Env':[]},'RepoDigests':['demo@sha256:abc'],'Created':datetime.now(timezone.utc).isoformat()}

    def test_clean_image_scores_100(self):
        self.assertEqual(evaluate({'Results':[]},self.facts(),'demo:1.2.3','0.76.1','today')['total'],100)

    def test_root_mutable_and_no_digest_lose_correct_points(self):
        facts=self.facts();facts['Config']['User']='';facts['RepoDigests']=[]
        self.assertEqual(evaluate({'Results':[]},facts,'demo:latest','','')['total'],76)

    def test_secret_value_is_never_in_result(self):
        facts=self.facts();facts['Config']['Env']=['API_TOKEN=do-not-disclose']
        result=evaluate({'Results':[]},facts,'demo:1.2.3','','')
        self.assertEqual(result['total'],93)
        self.assertNotIn('do-not-disclose',str(result))

    def test_old_image_age_penalties_accumulate(self):
        facts=self.facts();facts['Created']=(datetime.now(timezone.utc)-timedelta(days=400)).isoformat()
        self.assertEqual(evaluate({'Results':[]},facts,'demo:1.2.3','','')['total'],85)

    def test_unknown_findings_reduce_score(self):
        report={'Results':[{'Vulnerabilities':[{'Severity':'UNKNOWN'}]}]}
        self.assertEqual(evaluate(report,self.facts(),'demo:1.2.3','','')['components']['vulnerabilities']['earned'],36)
