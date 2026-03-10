import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Panel, JsonBlock, MethodBadge, Btn } from './CMSLayout';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function CMSDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [raw,     setRaw]     = useState(false);

  const load = () => {
    setLoading(true); setError('');
    api.get('/cms/stats/')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to fetch. Are you logged in as admin?'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <Link to="/cms" className="text-[#337ab7] hover:underline">api</Link>
        <span>/</span>
        <span className="text-gray-700">cms</span>
        <span>/</span>
        <span className="text-gray-700">stats</span>
      </div>

      {/* Endpoint header */}
      <Panel title={null} className="border-l-4 border-l-[#337ab7]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MethodBadge method="GET" />
              <span className="font-mono text-sm text-gray-700">/api/cms/stats/</span>
            </div>
            <p className="text-sm text-gray-500">Platform statistics — requires admin authentication.</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="default" onClick={() => setRaw(r => !r)}>{raw ? 'Table View' : 'JSON View'}</Btn>
            <Btn variant="primary" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : <RefreshCw className="h-3.5 w-3.5 inline" />}
              {' '}Refresh
            </Btn>
          </div>
        </div>
      </Panel>

      {error && (
        <div className="border border-red-300 bg-red-50 rounded px-4 py-3 text-sm text-red-700 font-mono">
          HTTP 403 — {error}
        </div>
      )}

      {loading && !data && (
        <Panel title="Response">
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Fetching…</div>
        </Panel>
      )}

      {data && (
        <>
          {/* HTTP 200 badge */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="bg-[#49cc90] text-white px-2 py-0.5 rounded">200 OK</span>
            <span className="text-gray-400">Content-Type: application/json</span>
          </div>

          {raw ? (
            <Panel title="Response Body">
              <JsonBlock data={data} />
            </Panel>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {data.stats && Object.entries(data.stats).map(([k, v]) => (
                  <div key={k} className="bg-white border border-gray-300 rounded p-3 text-center">
                    <p className="text-2xl font-bold text-[#337ab7]">{v}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{k}</p>
                  </div>
                ))}
              </div>

              {/* Recent users table */}
              <Panel title="recent_users" actions={<Link to="/cms/users" className="text-xs text-[#337ab7] hover:underline">View all →</Link>}>
                <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      {['id','name','email','role','created_at'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border-b border-gray-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(data.recent_users || []).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{u.id}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-800">{u.name}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 font-mono">{u.email}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded border
                            ${ u.role==='teacher' ? 'border-blue-300 bg-blue-50 text-blue-700'
                             : u.role==='admin'   ? 'border-purple-300 bg-purple-50 text-purple-700'
                             : 'border-green-300 bg-green-50 text-green-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {!data.recent_users?.length && (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-400 font-mono">[]  // empty</td></tr>
                    )}
                  </tbody>
                </table>
              </Panel>

              {/* Quick nav */}
              <Panel title="Available Endpoints">
                <div className="space-y-2">
                  {[
                    { method:'GET',    url:'/api/cms/users/',    desc:'List all users',    to:'/cms/users' },
                    { method:'POST',   url:'/api/cms/users/',    desc:'Create a user',     to:'/cms/users' },
                    { method:'GET',    url:'/api/cms/courses/',  desc:'List all courses',  to:'/cms/courses' },
                    { method:'GET',    url:'/api/cms/stats/',    desc:'Platform stats',    to:'/cms' },
                    { method:'GET',    url:'/api/cms/analytics/',desc:'Analytics view',    to:'/cms/analytics' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <MethodBadge method={e.method} />
                      <Link to={e.to} className="font-mono text-xs text-[#337ab7] hover:underline flex-1">{e.url}</Link>
                      <span className="text-xs text-gray-500">{e.desc}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
