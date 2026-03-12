import api from './api';
import type {
  BeneficiarioSocial
} from '../types';

/**
 * Servicio para gestión de casos sociales
 */

// ==========================================
// BENEFICIARIOS SOCIALES
// ==========================================

export const crearCasoSocial = async (
  data: Partial<BeneficiarioSocial>,
  archivos?: {
    fichaPdf?: File | null;
    firma?: File | null;
  }
) => {
  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  if (archivos?.fichaPdf) {
    formData.append('ficha_pdf', archivos.fichaPdf);
  }

  if (archivos?.firma) {
    formData.append('firma', archivos.firma);
  }

  const response = await api.post('/social/beneficiarios', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const obtenerCasosSociales = async (filtros?: {
  estado?: string;
  estado_registro?: string;
  prioridad?: string;
  ciudad?: string;
  tipo_caso?: string;
  id_usuario_carga?: number;
  busqueda?: string;
}) => {
  const response = await api.get('/social/beneficiarios', { params: filtros });
  return response.data;
};

export const obtenerCasoSocialPorId = async (id: number) => {
  const response = await api.get(`/social/beneficiarios/${id}`);
  return response.data;
};

export const actualizarCasoSocial = async (id: number, data: Partial<BeneficiarioSocial>) => {
  const response = await api.put(`/social/beneficiarios/${id}`, data);
  return response.data;
};

export const cambiarEstadoCaso = async (id: number, estado: string, observaciones?: string) => {
  const response = await api.put(`/social/beneficiarios/${id}/estado`, {
    estado,
    observaciones
  });
  return response.data;
};

// ==========================================
// SEGUIMIENTO
// ==========================================

export const agregarSeguimiento = async (
  idBeneficiarioSocial: number,
  tipoEvento: string,
  descripcion: string,
  fechaEvento: string,
  fotos?: File[]
) => {
  const formData = new FormData();
  formData.append('id_beneficiario_social', idBeneficiarioSocial.toString());
  formData.append('tipo_evento', tipoEvento);
  formData.append('descripcion', descripcion);
  formData.append('fecha_evento', fechaEvento);

  if (fotos && fotos.length > 0) {
    fotos.forEach(foto => {
      formData.append('fotos', foto);
    });
  }

  const response = await api.post('/social/seguimiento', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const obtenerSeguimiento = async (idBeneficiario: number) => {
  const response = await api.get(`/social/seguimiento/${idBeneficiario}`);
  return response.data;
};

export const eliminarSeguimiento = async (id: number) => {
  const response = await api.delete(`/social/seguimiento/${id}`);
  return response.data;
};

// ==========================================
// ESTADÍSTICAS
// ==========================================

export const obtenerEstadisticasSociales = async (filtros?: {
  id_usuario_carga?: number;
}) => {
  const response = await api.get('/social/estadisticas', { params: filtros });
  return response.data;
};

// ==========================================
// APROBACIONES
// ==========================================

export const obtenerCasosPendientes = async () => {
  const response = await api.get('/social/aprobaciones/pendientes');
  return response.data;
};

export const aprobarCasoSocial = async (id: number, comentario?: string) => {
  const response = await api.post(`/social/aprobaciones/${id}/aprobar`, { comentario });
  return response.data;
};

export const rechazarCasoSocial = async (id: number, comentario: string) => {
  const response = await api.post(`/social/aprobaciones/${id}/rechazar`, { comentario });
  return response.data;
};

export default {
  crearCasoSocial,
  obtenerCasosSociales,
  obtenerCasoSocialPorId,
  actualizarCasoSocial,
  cambiarEstadoCaso,
  agregarSeguimiento,
  obtenerSeguimiento,
  eliminarSeguimiento,
  obtenerEstadisticasSociales,
  obtenerCasosPendientes,
  aprobarCasoSocial,
  rechazarCasoSocial
};
