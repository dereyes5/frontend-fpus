import api from './api';

/**
 * Servicio para gestion de notificaciones
 */

export const obtenerNotificaciones = async (soloNoLeidas = false) => {
  const response = await api.get('/notificaciones', {
    params: { no_leidas: soloNoLeidas },
  });
  return response.data;
};

export const contarNoLeidas = async () => {
  const response = await api.get('/notificaciones/no-leidas');
  return response.data;
};

export const marcarComoLeida = async (id: number) => {
  const response = await api.put(`/notificaciones/${id}/leer`);
  return response.data;
};

export const marcarTodasComoLeidas = async () => {
  const response = await api.put('/notificaciones/leer-todas');
  return response.data;
};

export const eliminarNotificacion = async (id: number) => {
  const response = await api.delete(`/notificaciones/${id}`);
  return response.data;
};

export const obtenerEstadisticas = async () => {
  const response = await api.get('/notificaciones/estadisticas');
  return response.data;
};

export const generarNotificacionesCumpleanos = async () => {
  const response = await api.post('/notificaciones/cumpleanos/generar');
  return response.data;
};

export const enviarNotificacion = async (data: {
  id_usuario: number;
  titulo: string;
  mensaje: string;
  tipo?: string;
  link?: string;
}) => {
  const response = await api.post('/notificaciones/enviar', data);
  return response.data;
};

export const enviarBroadcast = async (data: {
  recurso: string;
  permiso: string;
  titulo: string;
  mensaje: string;
  link?: string;
}) => {
  const response = await api.post('/notificaciones/broadcast', data);
  return response.data;
};

export default {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  obtenerEstadisticas,
  generarNotificacionesCumpleanos,
  enviarNotificacion,
  enviarBroadcast,
};
