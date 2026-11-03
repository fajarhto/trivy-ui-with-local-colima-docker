import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import ReportsList from './ReportsList';
import UploadForm from './UploadForm';
import {makeGroupResolver, groupItems} from '../lib/dockerGroups';

type Summary = {id: string; timestamp: string; counts: Record<string, number>; security?: {total: number}};
type DockerItem = {Labels?: string; summary?: Summary; ImageID?: string;ID: string; Repository?: string; Tag?: string; Size?: string; Names?: string; Image?: string; State?: string; Status?: string};
type Inventory = {images: DockerItem[]; containers: DockerItem[]};
type Job = {id: string; status: string; target?: string; report_id?: string; error?: string};
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/docker/${path}`, init);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Integrasi Docker lokal belum diaktifkan. Upload file tetap dapat digunakan.');
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Tidak dapat mengakses Docker lokal.');
  }
  return response.json();
}
export default function ScanSources({onReport}: {onReport: () => void}) {
  const [source, setSource] = useState<'docker' | 'file'>('docker');
  const [kind, setKind] = useState<'image' | 'container'>('image');
  const [data, setData] = useState<Inventory>({images: [], containers: []});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [activeTarget, setActiveTarget] = useState('');
  const [grouped, setGrouped] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const busy = job?.status === 'queued' || job?.status === 'running';
  async function refresh() {
    setLoading(true); setError('');
    try {setData(await api<Inventory>('inventory'));}
    catch (err) {setError((err as Error).message);}
    finally {setLoading(false);}
  }
  useEffect(() => {void refresh();}, []);
  useEffect(() => {
    if (!busy || !job?.id) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const next = await api<Job>(`scans/${job.id}`);
        if (cancelled) return;
        setJob(next);
        if (next.status === 'complete' && next.report_id) {onReport(); void refresh();}
        if (next.status === 'failed') setError(next.error || 'Scan gagal. Silakan coba lagi.');
      } catch (err) {if (!cancelled) {setError((err as Error).message); setJob(null);}}
    }, 2000);
    return () => {cancelled = true; window.clearInterval(timer);};
  }, [busy, job?.id, onReport]);
  async function scan(item: DockerItem) {
    setError(''); setActiveTarget(item.ID); setJob({id: '', status: 'queued'});
    try {setJob(await api<Job>('scans', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({kind, id: item.ID})}));}
    catch (err) {setError((err as Error).message); setJob(null);}
  }
  const items = (kind === 'image' ? data.images : data.containers).filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (kind === 'image' || statusFilter === 'all' || (statusFilter === 'running' ? item.State === 'running' : item.State !== 'running')));
  const groups = grouped ? groupItems(items, makeGroupResolver(data)) : [{name: '', items}];
  const groupKey = (name: string) => `${kind}:${name}`;
  const button = 'rounded-lg px-4 py-2 border disabled:opacity-50';
  return <section aria-label="Sumber laporan" className="border rounded-xl p-4 sm:p-6">
    <div className="flex gap-2 mb-5" role="tablist" aria-label="Sumber scan">
      <button role="tab" aria-selected={source === 'docker'} className={`${button} ${source === 'docker' ? 'bg-purple-700 text-white' : ''}`} onClick={() => setSource('docker')}>Docker Lokal</button>
      <button role="tab" aria-selected={source === 'file'} className={`${button} ${source === 'file' ? 'bg-purple-700 text-white' : ''}`} onClick={() => setSource('file')}>Upload File</button>
    </div>
    {source === 'file' ? <><UploadForm onUploadSuccess={onReport} /><div className="mt-6"><ReportsList /></div></> : <div>
      <h2 className="text-xl font-semibold">Scan image Docker lokal</h2>
      <p className="text-sm text-gray-500 dark:text-gray-300 mt-2 mb-4">Pilih image atau container berjalan maupun berhenti. Scan container memeriksa image yang digunakannya, termasuk kerentanan paket OS dan aplikasi.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button className={`${button} ${kind === 'image' ? 'bg-purple-700 text-white' : ''}`} onClick={() => setKind('image')}>Images ({data.images.length})</button>
        <button className={`${button} ${kind === 'container' ? 'bg-purple-700 text-white' : ''}`} onClick={() => setKind('container')}>Containers ({data.containers.length})</button>
        <button className={button} disabled={loading} onClick={() => void refresh()}>{loading ? 'Memuat…' : 'Muat ulang'}</button>
      </div>
      <button className={`${button} mb-4 ${grouped ? 'bg-slate-100 text-slate-900' : ''}`} aria-pressed={grouped} onClick={() => setGrouped(value => !value)}>Group by project</button>
      <input aria-label="Cari image atau container" placeholder="Cari nama, tag, atau status…" value={query} onChange={e => {setQuery(e.target.value); setCollapsed({});}} className="w-full border rounded-lg p-3 mb-4 bg-transparent" />
      {error && <p role="alert" className="p-3 mb-4 rounded bg-amber-50 text-amber-900">{error}</p>}
      {busy && <p role="status" className="p-3 mb-4 rounded bg-purple-50 text-purple-900">{job?.status === 'queued' ? 'Menyiapkan scan' : 'Scan berjalan'}{job?.target ? `: ${job.target}` : ''}. Pengunduhan database pertama dapat memerlukan beberapa menit.</p>}
      {kind === 'container' && <div className="flex gap-2 mb-4" aria-label="Filter status">{['all','running','stopped'].map(value => <button key={value} className={`${button} ${statusFilter === value ? 'bg-slate-100 text-slate-900' : ''}`} onClick={() => setStatusFilter(value)}>{value === 'all' ? 'All' : value === 'running' ? 'Running' : 'Stopped'}</button>)}</div>}
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-gray-900 text-xs uppercase text-slate-500"><tr><th className="p-2">{kind === 'image' ? 'Image' : 'Container'}</th><th className="p-2">{kind === 'image' ? 'Size' : 'Status'}</th><th className="p-2">Scan</th><th className="p-2">Score</th><th className="p-2 text-center">C / H / M / L</th><th className="p-2">Details</th></tr></thead>
        {groups.map(group => <tbody key={group.name} className="divide-y">
        {grouped && <tr className="bg-slate-50 dark:bg-gray-900"><th colSpan={6} scope="rowgroup" className="p-0 text-left"><button className="w-full flex flex-wrap items-center gap-2 px-3 py-3 text-left" aria-expanded={!collapsed[groupKey(group.name)]} onClick={() => setCollapsed(previous => ({...previous,[groupKey(group.name)]: !previous[groupKey(group.name)]}))}><span aria-hidden="true">{collapsed[groupKey(group.name)] ? '▸' : '▾'}</span><span>{group.name}</span><span className="text-xs font-normal text-slate-500">{kind === 'container' ? `${group.items.filter(item => item.State === 'running').length}/${group.items.length} running` : `${group.items.length} images`}</span></button></th></tr>}
        {!collapsed[groupKey(group.name)] && group.items.map(item => <tr key={`${item.ID}-${item.Repository}-${item.Tag}`} className="hover:bg-slate-50 dark:hover:bg-gray-700">
          <td className="p-2 max-w-[180px]"><div className="font-semibold truncate" title={kind === 'image' ? `${item.Repository}:${item.Tag}` : item.Names}>{kind === 'image' ? `${item.Repository}:${item.Tag}` : item.Names}</div><div className="text-xs text-slate-500 truncate" title={item.Image || item.ID}>{kind === 'image' ? item.ID.slice(0,19) : item.Image}</div><div className="text-xs text-slate-500 mt-1">{item.summary?.timestamp ? new Date(item.summary.timestamp).toLocaleString('id-ID') : 'Belum dipindai'}</div></td>
          <td className="p-2">{kind === 'image' ? item.Size : <span className={`rounded-full px-2 py-1 text-xs ${item.State === 'running' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>● {item.State || item.Status}</span>}</td>
          <td className="p-2"><button className="border rounded-md px-3 py-1.5 text-blue-700 bg-white disabled:opacity-50" disabled={busy || loading} onClick={() => void scan(item)}>{busy && activeTarget === item.ID ? 'Scanning…' : item.summary ? 'Scan again' : 'Scan'}</button></td>
          <td className="p-2 font-semibold whitespace-nowrap">{item.summary?.security ? `${item.summary.security.total}/100` : '—'}</td>
          <td className="p-2"><div className="flex gap-1 justify-center">{['CRITICAL','HIGH','MEDIUM','LOW'].map((sev,i) => item.summary ? <span key={sev} title={sev} className={`inline-block min-w-6 text-center px-1 rounded text-xs font-semibold ${['bg-red-600 text-white','bg-orange-500 text-white','bg-yellow-400 text-black','bg-blue-400 text-white'][i]}`}>{item.summary.counts[sev] || 0}</span> : <span key={sev} className="text-slate-400 px-1">—</span>)}</div></td>
          <td className="p-2">{item.summary ? <Link className="text-blue-600 hover:underline" to={`/report/${item.summary.id}`}>Security →</Link> : '—'}</td>
        </tr>)}</tbody>)}
      </table></div>
      {!loading && !error && !items.length && <p className="text-gray-500 py-4">Tidak ada {kind === 'image' ? 'image' : 'container'} yang cocok.</p>}
    </div>}
  </section>;
}
