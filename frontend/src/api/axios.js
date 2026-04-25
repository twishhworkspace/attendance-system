import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

console.log('AXIOS INSTANCE INITIALIZED - BASEURL:', api.defaults.baseURL);

export default api;
