import api from './api';
import {
  Aprobacion,
  AprobacionRequest,
  ApiResponse,
  Benefactor,
} from '../types';

export const aprobacionesService = {
  // Listar aprobaciones con filtros
  async getAprobaciones(filters?: {
    estado_aprobacion?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Aprobacion[]>> {
    const params = new URLSearchParams();
    if (filters?.estado_aprobacion) params.append('estado_aprobacion', filters.estado_aprobacion);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<ApiResponse<Aprobacion[]>>(`/aprobaciones?${params.toString()}`);
    return response.data;
  },

  // Obtener registros pendientes
  async getPendientes(page?: number, limit?: number): Promise<ApiResponse<Benefactor[]>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get<ApiResponse<Benefactor[]>>(`/aprobaciones/pendientes?${params.toString()}`);
    return response.data;
  },

  // Aprobar o rechazar registro
  async aprobarRechazar(data: AprobacionRequest): Promise<ApiResponse<Aprobacion>> {
    const response = await api.post<ApiResponse<Aprobacion>>('/aprobaciones', data);
    return response.data;
  },

  // Obtener historial de aprobaciones de un benefactor
  async getHistorialBenefactor(id_benefactor: number): Promise<ApiResponse<Aprobacion[]>> {
    const response = await api.get<ApiResponse<Aprobacion[]>>(`/aprobaciones/benefactor/${id_benefactor}`);
    return response.data;
  },
};
