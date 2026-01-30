import api from './api';
import {
  Benefactor,
  BenefactorCreateRequest,
  BenefactorUpdateRequest,
  AsignarDependienteRequest,
  ApiResponse,
  TipoBenefactor,
  EstadoRegistro,
} from '../types';

export const benefactoresService = {
  // Listar benefactores con filtros
  async getBenefactores(
    filters?: {
      tipo_benefactor?: TipoBenefactor;
      estado_registro?: EstadoRegistro;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<Benefactor[]>> {
    const params = new URLSearchParams();
    if (filters?.tipo_benefactor) params.append('tipo_benefactor', filters.tipo_benefactor);
    if (filters?.estado_registro) params.append('estado_registro', filters.estado_registro);
    if (filters?.page) params.append('page', filters.page.toString());
    // Si no se especifica limit, pedir un número alto para obtener todos
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    } else {
      params.append('limit', '1000'); // Límite alto para obtener todos los registros
    }

    const response = await api.get<ApiResponse<Benefactor[]>>(`/benefactores?${params.toString()}`);
    return response.data;
  },

  // Obtener benefactor por ID
  async getBenefactorById(id: number): Promise<ApiResponse<Benefactor>> {
    const response = await api.get<ApiResponse<Benefactor>>(`/benefactores/${id}`);
    return response.data;
  },

  // Crear benefactor
  async createBenefactor(data: BenefactorCreateRequest): Promise<ApiResponse<Benefactor>> {
    const response = await api.post<ApiResponse<Benefactor>>('/benefactores', data);
    return response.data;
  },

  // Actualizar benefactor
  async updateBenefactor(id: number, data: BenefactorUpdateRequest): Promise<ApiResponse<Benefactor>> {
    const response = await api.put<ApiResponse<Benefactor>>(`/benefactores/${id}`, data);
    return response.data;
  },

  // Eliminar benefactor
  async deleteBenefactor(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/benefactores/${id}`);
    return response.data;
  },

  // Asignar dependiente a titular
  async asignarDependiente(data: AsignarDependienteRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/benefactores/asignar-dependiente', data);
    return response.data;
  },

  // Obtener dependientes de un titular
  async getDependientes(id_titular: number): Promise<ApiResponse<Benefactor[]>> {
    const response = await api.get<ApiResponse<Benefactor[]>>(`/benefactores/${id_titular}/dependientes`);
    return response.data;
  },

  // Subir contrato PDF
  async subirContrato(id: number, file: File): Promise<ApiResponse<{ filename: string; path: string }>> {
    const formData = new FormData();
    formData.append('contrato', file);
    // No especificar Content-Type, axios lo configura automáticamente con el boundary correcto
    const response = await api.post<ApiResponse<{ filename: string; path: string }>>(
      `/benefactores/${id}/contrato`,
      formData
    );
    return response.data;
  },

  // Obtener URL del contrato con token
  getContratoUrl(id: number): string {
    const token = localStorage.getItem('fpus_token');
    return `${api.defaults.baseURL}/benefactores/${id}/contrato?token=${token}`;
  },

  // Verificar si existe contrato
  async verificarContrato(id: number): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<{ existe: boolean }>>(`/benefactores/${id}/contrato?verificar=true`);
      return response.data.data.existe;
    } catch (error) {
      return false;
    }
  },

  // Eliminar contrato
  async eliminarContrato(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/benefactores/${id}/contrato`);
    return response.data;
  },
};
