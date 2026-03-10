import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import api from '../services/api';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [connected,     setConnected]     = useState(false);

  const token = localStorage.getItem('access_token');
  const wsUrl = token ? `${WS_BASE}/ws/notifications/?token=${token}` : null;

  const onMessage = useCallback((data) => {
    if (data.type === 'unread_count') {
      setUnreadCount(data.count);
    } else if (data.type === 'notification') {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const { send } = useWebSocket(wsUrl, {
    onOpen:  () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage,
  });

  const markRead = useCallback(async (id) => {
    await api.post(`/notifications/${id}/read/`).catch(() => {});
    send({ action: 'mark_read', id });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [send]);

  const markAllRead = useCallback(async () => {
    await api.post('/notifications/mark-all-read/').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || res.data);
    } catch { /* silent */ }
  }, []);

  return { notifications, unreadCount, connected, markRead, markAllRead, fetchNotifications };
}
