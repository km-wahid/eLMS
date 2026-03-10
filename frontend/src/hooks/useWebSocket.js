import { useEffect, useRef, useCallback } from 'react';

/**
 * Reusable WebSocket hook.
 * @param {string|null} url   – Full ws:// or wss:// URL. Pass null to disable.
 * @param {object}      handlers – { onMessage, onOpen, onClose, onError }
 * @returns {{ send }}
 */
export function useWebSocket(url, { onMessage, onOpen, onClose, onError } = {}) {
  const wsRef      = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!url) return;
    const ws = new WebSocket(url);

    ws.onopen    = (e) => onOpen  && onOpen(e);
    ws.onclose   = (e) => {
      if (onClose) onClose(e);
      // Auto-reconnect after 3s if still mounted
      if (mountedRef.current) {
        setTimeout(connect, 3000);
      }
    };
    ws.onerror   = (e) => onError && onError(e);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage && onMessage(data);
      } catch {
        onMessage && onMessage({ type: 'raw', payload: e.data });
      }
    };

    wsRef.current = ws;
  }, [url, onMessage, onOpen, onClose, onError]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }, []);

  return { send };
}
