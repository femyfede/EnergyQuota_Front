import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/auth/me')
        .then(({ data }) => {
          if (!cancelled) {
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          }
        })
        .catch((err) => {
          if (!cancelled && err.response?.status === 401) {
            logout();
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('eq:unauthorized', onUnauthorized);
    return () => window.removeEventListener('eq:unauthorized', onUnauthorized);
  }, []);

  const login = (token, userData) => {
    if (!token || !userData) return;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
