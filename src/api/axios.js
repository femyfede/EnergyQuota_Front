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
  (res) => {
    // If the server sends back an HTML page (e.g. backend down or suspended) instead of JSON,
    // treat it as an error so pages show a message instead of crashing on bad data.
    const type = res.headers?.['content-type'] || '';
    if (typeof res.data === 'string' && !type.includes('application/json')) {
      const err = new Error('Server unavailable');
      err.response = { status: 503, data: { message: 'Server is unavailable right now. Please try again later.' } };
      return Promise.reject(err);
    }
    return res;
  },
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
