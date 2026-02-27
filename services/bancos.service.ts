import api from './api';

export interface Banco {
  id_banco: number;
  nombre: string;
}

export interface BancoCreate {
  nombre: string;
}

export interface BancoUpdate {
  nombre?: string;
}

interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export const bancosService = {
  /**
   * Obtener todos los bancos
   */
  getAll: async () => {
    return api.get<ApiResponse<Banco[]>>('/bancos');
  },

  /**
   * Obtener un banco por ID
   */
  getById: async (id: number) => {
    return api.get<ApiResponse<Banco>>(`/bancos/${id}`);
  },

  /**
   * Crear un nuevo banco
   */
  create: async (data: BancoCreate) => {
    return api.post<ApiResponse<Banco>>('/bancos', data);
  },

  /**
   * Actualizar un banco
   */
  update: async (id: number, data: BancoUpdate) => {
    return api.put<ApiResponse<Banco>>(`/bancos/${id}`, data);
  },

  /**
   * Eliminar un banco
   */
  delete: async (id: number) => {
    return api.delete<ApiResponse<void>>(`/bancos/${id}`);
  }
};
