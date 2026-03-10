import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useLiveChat(sessionId) {
  const [messages,  setMessages]  = useState([]);
  const [connected, setConnected] = useState(false);

  const token = localStorage.getItem('access_token');
  const wsUrl = token && sessionId
    ? `${WS_BASE}/ws/live/${sessionId}/chat/?token=${token}`
    : null;

  const onMessage = useCallback((data) => {
    if (data.type === 'message' || data.type === 'system') {
      setMessages(prev => [...prev, data]);
    }
  }, []);

  const { send } = useWebSocket(wsUrl, {
    onOpen:  () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage,
  });

  const sendMessage = useCallback((text) => {
    send({ message: text });
  }, [send]);

  return { messages, connected, sendMessage };
}
