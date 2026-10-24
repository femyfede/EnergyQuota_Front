import axios from 'axios';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://energyquota-f3vf.onrender.com' : 'http://localhost:5000');

const baseURL = `${API_URL}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Soft logout: let React handle the redirect instead of a hard page reload
      window.dispatchEvent(new Event('eq:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
