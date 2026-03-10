import { useState } from 'react';
import { Panel, MethodBadge, Btn } from './CMSLayout';
import { CheckCircle } from 'lucide-react';

const SCHEMA = {
  general: [
    {field:'site_name',        type:'string',  default:'eLMS – E-Learning Platform'},
    {field:'site_url',         type:'string',  default:'https://elms.example.com'},
    {field:'tagline',          type:'string',  default:'Learn Anything, Teach Everyone'},
    {field:'maintenance_mode', type:'boolean', default:false},
    {field:'registration_open',type:'boolean', default:true},
    {field:'email_verification',type:'boolean',default:false},
  ],
  email: [
    {field:'smtp_host',   type:'string',  default:'smtp.gmail.com'},
    {field:'smtp_port',   type:'integer', default:'587'},
    {field:'smtp_user',   type:'string',  default:'noreply@elms.com'},
    {field:'smtp_pass',   type:'password',default:''},
    {field:'from_name',   type:'string',  default:'eLMS Platform'},
    {field:'enrollment_email', type:'boolean', default:true},
    {field:'grade_email',      type:'boolean', default:true},
  ],
  security: [
    {field:'jwt_expiry_minutes',   type:'integer', default:'60'},
    {field:'password_min_length',  type:'integer', default:'8'},
    {field:'max_login_attempts',   type:'integer', default:'5'},
    {field:'two_factor_admin',     type:'boolean', default:true},
    {field:'two_factor_teacher',   type:'boolean', default:false},
    {field:'allow_social_login',   type:'boolean', default:false},
  ],
};

const TYPE_COLORS = {
  string: 'text-[#61affe]', integer: 'text-[#fca130]',
  boolean: 'text-[#49cc90]', password: 'text-[#f93e3e]',
};

export default function CMSSettings() {
  const [section, setSection] = useState('general');
  const fields = SCHEMA[section];
  const [vals, setVals] = useState(() => {
    const init = {};
    Object.values(SCHEMA).flat().forEach(f => { init[f.field] = f.default; });
    return init;
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const set = (k, v) => setVals(p => ({...p, [k]:v}));

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1 font-mono">
        <a href="/cms" className="text-[#337ab7] hover:underline">api</a>
        <span>/</span><span>cms</span><span>/</span><span className="text-gray-700">settings</span>
      </div>

      {/* Header */}
      <Panel className="border-l-4 border-l-[#50e3c2]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MethodBadge method="PUT" />
            <span className="font-mono text-sm text-gray-700">/api/cms/settings/</span>
            <span className="text-xs text-gray-400">— Site configuration (frontend-managed)</span>
          </div>
          <Btn variant={saved?'success':'primary'} onClick={handleSave}>
            {saved ? <><CheckCircle className="h-3.5 w-3.5 inline mr-1" />Saved</> : 'PUT  /  Save'}
          </Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-4 gap-4">
        {/* Section tabs */}
        <div className="col-span-1 space-y-1">
          {Object.keys(SCHEMA).map(s => (
            <button key={s} onClick={() => setSection(s)}
              className={`w-full text-left px-3 py-2 rounded border text-sm font-mono transition-colors
                ${section===s ? 'bg-[#337ab7] border-[#2e6da4] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
          <div className="mt-4 border border-gray-200 rounded bg-gray-50 p-3">
            <p className="text-xs font-mono text-gray-400 leading-relaxed">
              // These settings are<br/>
              // stored client-side.<br/>
              // Connect a backend<br/>
              // /api/cms/settings/<br/>
              // endpoint to persist.
            </p>
          </div>
        </div>

        {/* Fields panel */}
        <div className="col-span-3">
          <Panel title={`${section}  ·  object  ·  ${fields.length} fields`}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border border-gray-300">
                  {['field','type','value'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-mono text-gray-600 border border-gray-300">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(f => (
                  <tr key={f.field} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-[#337ab7] w-40">{f.field}</td>
                    <td className={`px-3 py-2.5 font-mono text-xs w-20 ${TYPE_COLORS[f.type]||'text-gray-500'}`}>{f.type}</td>
                    <td className="px-3 py-2.5">
                      {f.type === 'boolean' ? (
                        <div className="flex items-center gap-2">
                          <select value={String(vals[f.field])} onChange={e => set(f.field, e.target.value==='true')}
                            className="px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-[#337ab7]">
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                          <span className={`text-xs font-mono ${vals[f.field] ? 'text-[#49cc90]' : 'text-[#f93e3e]'}`}>
                            {String(vals[f.field])}
                          </span>
                        </div>
                      ) : (
                        <input
                          type={f.type==='password' ? 'password' : f.type==='integer' ? 'number' : 'text'}
                          value={vals[f.field]}
                          onChange={e => set(f.field, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-[#337ab7]"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Preview as JSON */}
            <div className="mt-4">
              <p className="text-xs font-mono text-gray-400 mb-2">// Request body preview:</p>
              <pre className="bg-[#272822] text-[#f8f8f2] text-xs rounded p-3 font-mono overflow-x-auto">
                {JSON.stringify(
                  Object.fromEntries(fields.map(f => [f.field, vals[f.field]])),
                  null, 2
                )}
              </pre>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
