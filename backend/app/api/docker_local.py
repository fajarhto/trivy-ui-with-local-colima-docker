import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.storage.factory import get_storage
from app.api.security_summary import summarize, evaluate

router = APIRouter(prefix='/docker', tags=['docker'])
jobs: dict = {}
lock = asyncio.Lock()

async def command(*args, timeout=30):
    proc = await asyncio.create_subprocess_exec(*args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    try:
        out, err = await asyncio.wait_for(proc.communicate(), timeout)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.communicate()
        raise RuntimeError('Proses melewati batas waktu. Silakan coba lagi.')
    if proc.returncode:
        raise RuntimeError(err.decode(errors='replace')[-1500:] or 'Docker tidak tersedia')
    return out.decode()

@router.get('/inventory')
async def inventory():
    try:
        images, containers = await asyncio.gather(
            command('docker', 'image', 'ls', '--no-trunc', '--format', '{{json .}}'),
            command('docker', 'container', 'ls', '-a', '--no-trunc', '--format', '{{json .}}'))
        image_rows = [json.loads(x) for x in images.splitlines() if x]
        container_rows = [json.loads(x) for x in containers.splitlines() if x]
        if container_rows:
            inspected = json.loads(await command('docker', 'container', 'inspect', *[c['ID'] for c in container_rows]))
            ids = {c['Id']: c['Image'] for c in inspected}
            for c in container_rows: c['ImageID'] = ids.get(c['ID'])
        reports = sorted(await get_storage().list_reports(), key=lambda r:r.get('_meta',{}).get('timestamp',''), reverse=True)
        latest = {}
        for r in reports:
            image_id = r.get('_meta',{}).get('image_id') or r.get('Metadata',{}).get('ImageID')
            if image_id and image_id not in latest: latest[image_id] = summarize(r)
        for item in image_rows: item['summary'] = latest.get(item['ID'])
        for item in container_rows: item['summary'] = latest.get(item.get('ImageID'))
        return {'images':image_rows, 'containers':container_rows}
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

class ScanRequest(BaseModel):
    kind: str
    id: str

async def run_scan(job_id, image_id, name):
    try:
        jobs[job_id]['status'] = 'running'
        raw = await command('trivy', 'image', '--image-src', 'docker', '--scanners', 'vuln', '--format', 'json', '--timeout', '10m', image_id, timeout=660)
        report = json.loads(raw)
        report_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        report['ArtifactName'] = name
        info = json.loads(await command('docker', 'image', 'inspect', image_id))[0]
        version = json.loads(await command('trivy', 'version', '--format', 'json'))
        security = evaluate(report, info, name, version.get('Version','unknown'), (version.get('VulnerabilityDB') or {}).get('UpdatedAt'))
        report['_meta'] = {'id': report_id, 'timestamp': now, 'uploaded_at': now, 'image_id': image_id, 'security': security}
        await get_storage().save_report(report_id, report)
        jobs[job_id].update(status='complete', report_id=report_id)
    except Exception as exc:
        jobs[job_id].update(status='failed', error=str(exc))

@router.post('/scans', status_code=202)
async def start_scan(body: ScanRequest, tasks: BackgroundTasks):
    if body.kind not in ('image', 'container') or not re.fullmatch(r'(sha256:)?[a-f0-9]{64}', body.id):
        raise HTTPException(400, 'Target Docker tidak valid')
    async with lock:
        if any(j['status'] in ('queued', 'running') for j in jobs.values()):
            raise HTTPException(409, 'Scan masih berjalan. Tunggu hingga selesai.')
        try:
            if body.kind == 'container':
                info = json.loads(await command('docker', 'container', 'inspect', body.id))[0]
                image_id, name = info['Image'], info['Config']['Image']
            else:
                info = json.loads(await command('docker', 'image', 'inspect', body.id))[0]
                image_id = info['Id']
                name = (info.get('RepoTags') or [image_id])[0]
        except RuntimeError as exc:
            raise HTTPException(404, str(exc))
        job_id = str(uuid.uuid4())
        if len(jobs) > 100:
            jobs.clear()
        jobs[job_id] = {'id': job_id, 'status': 'queued', 'target': name}
        tasks.add_task(run_scan, job_id, image_id, name)
        return jobs[job_id]

@router.get('/scans/{job_id}')
async def scan_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, 'Scan tidak ditemukan; muat ulang daftar laporan.')
    return jobs[job_id]

@router.get('/reports/{report_id}/security')
async def report_security(report_id: str):
    try:
        report = await get_storage().get_report(report_id)
    except FileNotFoundError:
        raise HTTPException(404, 'Report not found')
    return summarize(report)
