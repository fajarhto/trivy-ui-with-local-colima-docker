# Adapted from ColimaUI, Copyright (c) 2026 vnknowledge2014, MIT.
# See LICENSES/ColimaUI-MIT.txt and THIRD_PARTY_NOTICES.md.
"""L1 scoring ported from local ColimaUI security_score/security_rules, pack 1.0.0."""
import json
import math
from pathlib import Path
from datetime import datetime, timezone
PACK = json.loads(Path(__file__).with_name('colima_rules.json').read_text())

def summarize(report):
    counts = dict.fromkeys(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'], 0)
    for result in report.get('Results', []):
        for vuln in result.get('Vulnerabilities') or []:
            severity = vuln.get('Severity', 'UNKNOWN').upper()
            counts[severity if severity in counts else 'UNKNOWN'] += 1
    meta = report.get('_meta', {})
    return {'id': meta.get('id'), 'timestamp': meta.get('timestamp'), 'counts': counts, 'security': meta.get('security')}

def evaluate(report, info, name, scanner, db_date):
    config = info.get('Config') or {}
    user = (config.get('User') or '').strip()
    secret_names = []
    for entry in config.get('Env') or []:
        key, _, value = entry.partition('=')
        upper = key.upper()
        if value.strip() and upper not in ('TOKENIZERS_PARALLELISM', 'AUTH_METHOD', 'TOKEN_TYPE') and any(h in upper for h in ('SECRET','PASSWORD','PASSWD','TOKEN','APIKEY','API_KEY','PRIVATE_KEY','ACCESS_KEY','CREDENTIAL','AUTH_TOKEN','AUTHORIZATION')):
            secret_names.append(key)
    last = name.rsplit('/', 1)[-1]
    tag = last.partition(':')[2]
    mutable = '@sha256:' not in name and (not tag or tag in ('latest','stable','edge','main','master','dev','devel','nightly','current','unstable','rolling','beta','alpha') or (len(tag.split('.')) <= 2 and all(p.isdigit() for p in tag.split('.'))))
    try: age = (datetime.now(timezone.utc) - datetime.fromisoformat(info['Created'].replace('Z','+00:00'))).days
    except (KeyError, ValueError): age = 0
    failures = {'runs_as_root': user in ('','0','root') or user.startswith('0:'), 'secret_like_env': bool(secret_names), 'no_digest_pin': not info.get('RepoDigests'), 'mutable_tag': mutable}
    evidence = {'runs_as_root': f'USER {user}' if user else 'no USER instruction', 'secret_like_env': ', '.join(secret_names), 'no_digest_pin':'no repository digest', 'mutable_tag':name, 'older_than_days':f'built {age} days ago'}
    components = {key: {'earned': value, 'max': value} for key, value in PACK['componentMax'].items()}
    rules = []
    for rule in PACK['rules']:
        if rule['minLevel'] != 'l1': continue
        kind = rule['check']['kind']
        failed = age > rule['check']['days'] if kind == 'older_than_days' else failures[kind]
        rules.append({**rule, 'passed':not failed, 'evidence': evidence.get(kind) if failed else None})
        if failed: components[rule['component']]['earned'] = max(0, components[rule['component']]['earned'] - rule['weight'])
    counts = summarize(report)['counts']
    weighted = sum(counts[k] * w for k,w in {'CRITICAL':10,'HIGH':3,'MEDIUM':1,'LOW':.2,'UNKNOWN':1}.items())
    components['vulnerabilities'] = {'earned': math.floor(40 * (1-min(1,math.log1p(weighted)/math.log1p(1200)))+.5), 'max':40}
    return {'components':components,'total':sum(x['earned'] for x in components.values()),'rules':rules,'inputs':{'scanner':scanner,'database':db_date,'pack':PACK['packVersion'],'level':'L1','engine':'Trivy UI Colima-compatible L1'}}
