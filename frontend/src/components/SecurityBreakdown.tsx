import {useEffect, useState} from 'react';
type Rule = {id:string; title:string; passed:boolean; weight:number; evidence?:string; rationale:string; remediation:string; standardRefs:{standard:string; version?:string; id:string}[]};
type Security = {total:number; components:Record<string,{earned:number; max:number}>; rules:Rule[]; inputs:{scanner:string; database?:string; pack:string; level:string; engine:string}};
export default function SecurityBreakdown({id}: {id?:string}) {
 const [security,setSecurity] = useState<Security|null>(null);
 const [passed,setPassed] = useState(false);
 useEffect(() => {let active=true; setSecurity(null); fetch(`/api/docker/reports/${id}/security`).then(r => r.ok ? r.json() : null).then(r => {if(active)setSecurity(r?.security || null);}).catch(() => {}); return () => {active=false;};},[id]);
 if (!security) return <p className="text-sm text-slate-500 mb-4">Skor konfigurasi belum tersedia untuk laporan ini. Jalankan scan ulang dari Docker Lokal.</p>;
 const failed=security.rules.filter(r => !r.passed);
 return <div className="space-y-5 mb-8">
  <section className="border rounded-xl p-5"><div className="flex items-end gap-2 mb-5"><strong className={`text-5xl ${security.total >= 90 ? 'text-emerald-700' : 'text-amber-800'}`}>{security.total}</strong><span className="text-slate-500">/100</span><p className="text-xs text-slate-500 ml-3">For sorting a list. The four numbers below are the answer.</p></div>
   {['vulnerabilities','hardening','provenance','freshness'].map(key => {const value=security.components[key]; return <div key={key} className="flex gap-4 items-center my-3 text-sm"><span className="w-28 capitalize shrink-0">{key}</span><div className="h-2 rounded-full bg-slate-100 flex-1"><div className={`h-full rounded-full ${value.earned === value.max ? 'bg-emerald-600' : 'bg-amber-800'}`} style={{width:`${100*value.earned/value.max}%`}} /></div><span className="w-14 text-right">{value.earned}/{value.max}</span></div>;})}
   <div className="border-t pt-3 mt-5 text-xs text-slate-500 flex flex-wrap gap-4"><span>Scanner trivy {security.inputs.scanner}</span><span>Vulnerability DB {security.inputs.database?.slice(0,10) || 'unknown'}</span><span>Rule pack {security.inputs.pack}</span><span>Level {security.inputs.level}</span></div>
  </section>
  <section className="border rounded-xl p-5"><h2 className="font-semibold mb-4">Configuration</h2>{!failed.length && <p className="text-emerald-700">Every configuration rule at this level passes.</p>}
   {security.rules.filter(r => !r.passed || passed).map(rule => <article key={rule.id} className={`border-l-2 pl-3 py-2 mb-4 ${rule.passed ? 'border-emerald-500' : 'border-amber-700'}`}><div className="flex justify-between gap-3"><h3 className="font-semibold text-sm">{rule.passed ? '✓' : '×'} {rule.title}</h3>{!rule.passed && <span className="text-xs text-slate-500">−{rule.weight}</span>}</div>{!rule.passed && <><p className="font-mono text-xs text-slate-500 mt-2">{rule.evidence}</p><p className="text-sm mt-2">{rule.rationale}</p><p className="text-sm mt-2">{rule.remediation}</p>{rule.standardRefs.length > 0 && <p className="text-xs text-slate-500 mt-2">References: {rule.standardRefs.map(r => `${r.standard} v${r.version} §${r.id}`).join(', ')}</p>}</>}</article>)}
   <button className="text-blue-600 text-sm mt-3" onClick={() => setPassed(!passed)}>{passed ? 'Hide passing rules' : `Show ${security.rules.length-failed.length} passing rules`}</button>
  </section>
 </div>;
}
