import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const MAX_RECONNECT_ATTEMPTS = 5;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setIsConnected(false);
      reconnectAttempts.current = 0;
      return;
    }

    const s = io(import.meta.env.VITE_API_URL || '/', {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: { token: localStorage.getItem('token') },
    });

    s.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      s.emit('join', { userId: user.id, role: user.role });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', () => {
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        s.disconnect();
      }
    });

    s.io.on('reconnect_attempt', () => {
      reconnectAttempts.current += 1;
    });

    s.io.on('reconnect_failed', () => {
      s.disconnect();
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
