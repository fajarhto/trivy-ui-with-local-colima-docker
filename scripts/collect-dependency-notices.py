"""Collect installed npm notices and a Python metadata export without vendoring code."""
import json
import re
import shutil
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--python-export', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
output = root / 'LICENSES/dependencies'
output.mkdir(parents=True, exist_ok=True)

def safe(name): return re.sub(r'[^a-zA-Z0-9._-]', '_', name)

rows = []
for package_json in (root/'frontend/node_modules').rglob('package.json'):
    if package_json.parent.name == 'node_modules': continue
    try: package = json.loads(package_json.read_text())
    except (ValueError, OSError): continue
    if not package.get('name') or not package.get('version'): continue
    name, version = package['name'], package['version']
    target = output/'npm'/safe(name+'@'+version)
    copied = []
    candidates = list(package_json.parent.iterdir())
    for path in candidates:
        if path.is_file() and any(x in path.name.lower() for x in ['license','licence','notice','copying','copyright']):
            target.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target/path.name)
            copied.append(str((target/path.name).relative_to(root)))
    rows.append({'ecosystem':'npm','name':name,'version':version,'license':package.get('license','See package notices'),'homepage':package.get('homepage'),'notice_files':copied})
if args.python_export:
    for package in json.loads(args.python_export.read_text()):
        target=output/'python'/safe(package['name']+'@'+package['version'])
        copied=[]
        for name,text in package.get('notices',{}).items():
            target.mkdir(parents=True,exist_ok=True)
            path=target/safe(name)
            path.write_text(text)
            copied.append(str(path.relative_to(root)))
        rows.append({'ecosystem':'python','name':package['name'],'version':package['version'],'license':package['license'],'homepage':package.get('homepage'),'notice_files':copied})
unique={(r['ecosystem'],r['name'],r['version']):r for r in rows}
rows=sorted(unique.values(),key=lambda r:(r['ecosystem'],r['name'].lower(),r['version']))
(output/'inventory.json').write_text(json.dumps(rows,indent=2)+'\n')
lines=['# Installed dependency notice snapshot','','Generated from installed frontend packages and Python distribution metadata. Full bundled notice files are retained in the sibling directories. Build-only packages are included where installed. Dependencies are not relicensed by this inventory.','','| Ecosystem | Package | Version | Declared license |','|---|---|---|---|']
for r in rows:
    license_value=str(r['license']).replace('|','/').replace('\n',' ')
    if len(license_value)>160: license_value='See full notices and inventory.json'
    lines.append(f"| {r['ecosystem']} | {r['name']} | {r['version']} | {license_value} |")
(output/'README.md').write_text('\n'.join(lines)+'\n')
print('Collected notices for',len(rows),'installed distributions')
