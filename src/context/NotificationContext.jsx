import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../api/axios';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);

  const isAdmin = user?.role === 'admin';

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) { setNotifications([]); return; }
    fetchNotifications();
  }, [fetchNotifications, isAdmin]);

  useEffect(() => {
    if (!socket || !isAdmin) return;
    const handler = (notif) => {
      setNotifications(prev => [{
        id: `tmp_${Date.now()}`,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        read: false,
        createdAt: notif.createdAt || new Date(),
      }, ...prev]);
    };
    socket.on('adminNotification', handler);
    return () => socket.off('adminNotification', handler);
  }, [socket, isAdmin]);

  const markRead = async (id) => {
    if (id.startsWith('tmp_')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err.message);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/admin/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clearAll, refresh: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);



