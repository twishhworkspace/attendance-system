import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('twishh_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    config.headers['X-Access-Token'] = token;
  }
  return config;
});

console.log('AXIOS INSTANCE INITIALIZED - BASEURL:', api.defaults.baseURL);

export default api;
