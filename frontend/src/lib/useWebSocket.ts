import { useEffect, useState, useCallback } from 'react';
import { Party, Word } from '@/lib/api';

interface WebSocketMessage {
  type: 'init' | 'word_added' | 'status_changed' | 'pong';
  party?: Party;
  word?: Word;
  status?: 'add' | 'display';
}

export function usePartyWebSocket(partyId: number, wsUrl: string) {
  const [party, setParty] = useState<Party | null>(null);
  const [connected, setConnected] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message: WebSocketMessage = JSON.parse(event.data);

    switch (message.type) {
      case 'init':
        if (message.party) {
          setParty(message.party);
        }
        break;
      case 'word_added':
        if (message.word) {
          setParty((prev: Party | null) => {
            if (!prev) return prev;
            return {
              ...prev,
              words: [...prev.words, message.word!],
            };
          });
        }
        break;
      case 'status_changed':
        if (message.status) {
          setParty((prev: Party | null) => {
            if (!prev) return prev;
            return { ...prev, status: message.status! };
          });
        }
        break;
    }
  }, []);

  useEffect(() => {
    if (!wsUrl) return;
    
    let ws: WebSocket | null = null;
    let interval: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setConnected(false);
      };

      ws.onerror = () => {
        setConnected(false);
      };

      // Keepalive ping every 30 seconds
      interval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 30000);
    };

    connect();

    return () => {
      if (interval) clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [wsUrl, handleMessage]);

  return { party, connected };
}
