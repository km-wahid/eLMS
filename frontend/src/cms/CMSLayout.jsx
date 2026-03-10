import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const NAV_LINKS = [
  { label: 'Dashboard',  path: '/cms' },
  { label: 'Users',      path: '/cms/users' },
  { label: 'Courses',    path: '/cms/courses' },
  { label: 'Analytics',  path: '/cms/analytics' },
  { label: 'Settings',   path: '/cms/settings' },
];

// DRF-style method badge
export function MethodBadge({ method }) {
  const COLORS = {
    GET:    'bg-[#61affe] text-white',
    POST:   'bg-[#49cc90] text-white',
    PUT:    'bg-[#fca130] text-white',
    PATCH:  'bg-[#50e3c2] text-white',
    DELETE: 'bg-[#f93e3e] text-white',
  };
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded font-mono uppercase ${COLORS[method] || 'bg-gray-400 text-white'}`}>
      {method}
    </span>
  );
}

// DRF-style JSON pre-block
export function JsonBlock({ data }) {
  return (
    <pre className="bg-[#272822] text-[#f8f8f2] text-xs rounded border border-gray-700 p-4 overflow-x-auto font-mono leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// DRF panel (bordered card)
export function Panel({ title, children, actions, className='' }) {
  return (
    <div className={`border border-gray-300 rounded bg-white ${className}`}>
      {title && (
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-700">{title}</span>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// DRF-style button
export function Btn({ children, onClick, variant='default', size='sm', disabled, className='' }) {
  const V = {
    default: 'bg-white border-gray-400 text-gray-700 hover:bg-gray-50',
    primary: 'bg-[#337ab7] border-[#2e6da4] text-white hover:bg-[#286090]',
    success: 'bg-[#5cb85c] border-[#4cae4c] text-white hover:bg-[#449d44]',
    danger:  'bg-[#d9534f] border-[#d43f3a] text-white hover:bg-[#c9302c]',
    warning: 'bg-[#f0ad4e] border-[#eea236] text-white hover:bg-[#ec971f]',
    info:    'bg-[#5bc0de] border-[#46b8da] text-white hover:bg-[#31b0d5]',
  };
  const S = { sm: 'px-3 py-1 text-xs', md: 'px-4 py-1.5 text-sm', lg: 'px-5 py-2 text-base' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`border rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${V[variant]} ${S[size]} ${className}`}>
      {children}
    </button>
  );
}

export default function CMSLayout({ children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      {/* DRF-style top navbar */}
      <nav className="bg-[#222] border-b border-[#080808] shadow">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-12 gap-0">
          {/* Brand */}
          <Link to="/cms" className="text-white font-bold text-sm mr-6 flex items-center gap-2 hover:text-gray-300 whitespace-nowrap">
            <span className="bg-[#337ab7] text-white text-xs px-2 py-0.5 rounded font-mono">API</span>
            eLMS Admin
          </Link>

          {/* Nav links */}
          <div className="flex items-center">
            {NAV_LINKS.map(n => {
              const active = n.path === '/cms' ? location.pathname === '/cms' : location.pathname.startsWith(n.path);
              return (
                <Link key={n.path} to={n.path}
                  className={`text-sm px-3 py-3 border-b-2 transition-colors ${
                    active
                      ? 'text-white border-[#337ab7]'
                      : 'text-[#9d9d9d] border-transparent hover:text-white hover:bg-[#333]'
                  }`}>
                  {n.label}
                </Link>
              );
            })}
          </div>

          {/* Right: back to site + user */}
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="text-[#9d9d9d] hover:text-white text-xs px-3 py-1 border border-[#555] rounded hover:bg-[#333] transition-colors">
              ← Back to Site
            </Link>
            <span className="text-[#9d9d9d] text-xs px-3 py-1 border border-[#555] rounded">
              {user?.name ?? 'Admin'}
            </span>
            <button onClick={handleLogout}
              className="text-[#9d9d9d] hover:text-red-400 text-xs px-3 py-1 border border-[#555] rounded hover:bg-[#333] transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
