import api from './api';
import {
  Rol,
  ApiResponse,
} from '../types';

export const rolesService = {
  // Listar roles
  async getRoles(): Promise<ApiResponse<Rol[]>> {
    const response = await api.get<ApiResponse<Rol[]>>('/roles');
    return response.data;
  },

  // Crear rol
  async createRol(nombre: string): Promise<ApiResponse<Rol>> {
    const response = await api.post<ApiResponse<Rol>>('/roles', { nombre });
    return response.data;
  },

  // Actualizar rol
  async updateRol(id: number, nombre: string): Promise<ApiResponse<Rol>> {
    const response = await api.put<ApiResponse<Rol>>(`/roles/${id}`, { nombre });
    return response.data;
  },

  // Eliminar rol
  async deleteRol(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/roles/${id}`);
    return response.data;
  },
};
