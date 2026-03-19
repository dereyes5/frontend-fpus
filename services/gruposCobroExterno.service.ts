import api from './api';
import { ApiResponse, GrupoCobroExterno } from '../types';

export interface GrupoCobroExternoCreateRequest {
  nombre_grupo: string;
  nombre_titular_externo: string;
  cedula_titular_externo?: string;
  banco_emisor?: string;
  tipo_cuenta?: string;
  num_cuenta?: string;
  n_convenio_cartera: string;
  observacion?: string;
  activo?: boolean;
}

export interface GrupoCobroExternoUpdateRequest extends Partial<GrupoCobroExternoCreateRequest> {
  activo?: boolean;
}

export const gruposCobroExternoService = {
  async getAll(incluirInactivos = false): Promise<ApiResponse<GrupoCobroExterno[]>> {
    const response = await api.get<ApiResponse<GrupoCobroExterno[]>>(
      `/grupos-cobro-externo?incluir_inactivos=${incluirInactivos}`
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<GrupoCobroExterno>> {
    const response = await api.get<ApiResponse<GrupoCobroExterno>>(`/grupos-cobro-externo/${id}`);
    return response.data;
  },

  async create(data: GrupoCobroExternoCreateRequest): Promise<ApiResponse<GrupoCobroExterno>> {
    const response = await api.post<ApiResponse<GrupoCobroExterno>>('/grupos-cobro-externo', data);
    return response.data;
  },

  async update(id: number, data: GrupoCobroExternoUpdateRequest): Promise<ApiResponse<GrupoCobroExterno>> {
    const response = await api.put<ApiResponse<GrupoCobroExterno>>(`/grupos-cobro-externo/${id}`, data);
    return response.data;
  },
};
