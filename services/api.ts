import axios from 'axios';
import moment from 'moment-timezone';

// Configurar timezone por defecto para la aplicación frontend
moment.tz.setDefault('America/Guayaquil');

const api = axios.create({
  baseURL: 'http://154.12.234.100:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fpus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si se está enviando FormData, eliminar el Content-Type para que axios lo configure automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('fpus_token');
      localStorage.removeItem('fpus_user');
      localStorage.removeItem('fpus_permisos');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
