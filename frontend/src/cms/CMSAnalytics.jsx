import { useState, useEffect } from 'react';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { Loader2, RefreshCw } from 'lucide-react';

export default function CMSAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoad]    = useState(true);
  const [raw,     setRaw]     = useState(false);

  const load = () => {
    setLoad(true);
    api.get('/cms/stats/')
      .then(r => setData(r.data))
      .finally(() => setLoad(false));
  };
  useEffect(load, []);

  const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Now'];
  const TREND  = [320,480,620,540,780,920, data?.stats?.total_enrollments ?? 0];
  const maxBar = Math.max(...TREND, 1);

  const rows = data ? [
    { field:'total_users',        value: data.stats.total_users,        type:'integer' },
    { field:'total_students',     value: data.stats.total_students,     type:'integer' },
    { field:'total_teachers',     value: data.stats.total_teachers,     type:'integer' },
    { field:'total_courses',      value: data.stats.total_courses,      type:'integer' },
    { field:'published_courses',  value: data.stats.published_courses,  type:'integer' },
    { field:'total_enrollments',  value: data.stats.total_enrollments,  type:'integer' },
  ] : [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <a href="/cms" className="text-[#337ab7] hover:underline">api</a>
        <span>/</span><span>cms</span><span>/</span><span className="text-gray-700">analytics</span>
      </div>

      {/* Endpoint header */}
      <Panel className="border-l-4 border-l-[#61affe]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/stats/</span>
              <span className="text-xs text-gray-400">— Platform analytics (live)</span>
            </div>
            <p className="text-xs text-gray-400 pl-1">Permission: IsAdminUser · Auth: JWT Bearer token</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="default" onClick={() => setRaw(r=>!r)}>{raw ? 'Table View' : 'JSON View'}</Btn>
            <Btn variant="primary" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <RefreshCw className="h-3 w-3 inline" />}{' '}GET
            </Btn>
          </div>
        </div>
      </Panel>

      {/* HTTP status */}
      {!loading && data && (
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="bg-[#49cc90] text-white px-2 py-0.5 rounded">200 OK</span>
          <span className="text-gray-400">Content-Type: application/json</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">Vary: Accept</span>
        </div>
      )}

      {loading && (
        <Panel title="Response">
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4 font-mono">
            <Loader2 className="h-4 w-4 animate-spin" />Fetching /api/cms/stats/…
          </div>
        </Panel>
      )}

      {data && (raw ? (
        <Panel title="Response Body (raw JSON)">
          <JsonBlock data={data} />
        </Panel>
      ) : (
        <>
          {/* Field table */}
          <Panel title="stats  ·  object">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['field','type','value','bar'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const pct = r.field.includes('student') ? (data.stats.total_users ? Math.round(r.value/data.stats.total_users*100) : 0)
                            : r.field.includes('teacher') ? (data.stats.total_users ? Math.round(r.value/data.stats.total_users*100) : 0)
                            : r.field.includes('published') ? (data.stats.total_courses ? Math.round((r.value||0)/data.stats.total_courses*100) : 0)
                            : 100;
                  return (
                    <tr key={r.field} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-xs text-[#337ab7]">{r.field}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-[#8b5cf6]">{r.type}</td>
                      <td className="px-3 py-2.5 font-bold text-sm text-gray-800">{r.value}</td>
                      <td className="px-3 py-2.5 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                            <div className="h-full bg-[#337ab7] rounded" style={{ width:`${Math.min(pct,100)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-gray-400 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          {/* Trend chart — DRF-style bordered panel */}
          <Panel title="enrollment_trend  ·  array  ·  (historical demo + live 'Now' bar)">
            <div className="flex items-end gap-2" style={{ height:'120px' }}>
              {TREND.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-mono text-gray-400 leading-none">{v||''}</span>
                  <div className="w-full bg-gray-200 relative rounded-sm" style={{ height:'80px' }}>
                    <div
                      className={`w-full absolute bottom-0 rounded-sm ${i===TREND.length-1 ? 'bg-[#49cc90]' : 'bg-[#337ab7]'}`}
                      style={{ height:`${(v/maxBar)*100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-mono text-gray-400 mt-3 border-t border-gray-100 pt-2">
              // green bar = live DB value · blue bars = historical estimates
            </p>
          </Panel>

          {/* recent_users */}
          <Panel title="recent_users  ·  array">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['id','name','email','role','created_at'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.recent_users || []).map(u => (
                  <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{u.id}</td>
                    <td className="px-3 py-2 text-sm text-gray-800">{u.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{u.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <span className={`px-2 py-0.5 rounded border text-xs
                        ${u.role==='teacher'?'border-blue-300 bg-blue-50 text-blue-700':'border-green-300 bg-green-50 text-green-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
                {!data.recent_users?.length && (
                  <tr><td colSpan={5} className="px-4 py-4 text-center text-xs font-mono text-gray-400">[]</td></tr>
                )}
              </tbody>
            </table>
          </Panel>
        </>
      ))}
    </div>
  );
}
