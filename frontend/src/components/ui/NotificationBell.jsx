import { useState, useEffect } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const typeColors = {
  enrollment:       'bg-blue-100 text-blue-800',
  assignment_new:   'bg-purple-100 text-purple-800',
  assignment_graded:'bg-green-100 text-green-800',
  submission_new:   'bg-yellow-100 text-yellow-800',
  live_starting:    'bg-red-100 text-red-800',
  material_new:     'bg-indigo-100 text-indigo-800',
  general:          'bg-gray-100 text-gray-800',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown panel */}
          <div className="absolute right-0 z-50 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* List */}
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-400 text-sm">
                  No notifications yet
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[n.notif_type || n.type] || typeColors.general}`}>
                        {(n.notif_type || n.type || 'general').replace('_', ' ')}
                      </span>
                      {!n.is_read && (
                        <span className="ml-auto mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
