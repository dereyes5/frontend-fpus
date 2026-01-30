import api from './api';
import {
  MisPermisosResponse,
  Recurso,
  Permisos,
  ApiResponse,
} from '../types';

export const permisosService = {
  // Obtener mis permisos (usuario actual)
  async getMisPermisos(): Promise<MisPermisosResponse> {
    const response = await api.get<MisPermisosResponse>('/permisos/mis-permisos');
    return response.data;
  },

  // Obtener recursos disponibles
  async getRecursos(): Promise<ApiResponse<Recurso[]>> {
    const response = await api.get<ApiResponse<Recurso[]>>('/permisos/recursos');
    return response.data;
  },

  // Obtener permisos de un rol específico
  async getPermisosPorRol(id_rol: number): Promise<ApiResponse<{ rol: Rol; permisos: Permisos }>> {
    const response = await api.get<ApiResponse<{ rol: Rol; permisos: Permisos }>>(`/permisos/roles/${id_rol}`);
    return response.data;
  },

  // Actualizar permisos de un rol
  async actualizarPermisos(id_rol: number, permisos: Permisos): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/permisos/roles/${id_rol}`, { permisos });
    return response.data;
  },

  // Guardar permisos en localStorage
  savePermisos(permisos: Permisos): void {
    localStorage.setItem('fpus_permisos', JSON.stringify(permisos));
  },

  // Obtener permisos del localStorage
  getPermisos(): Permisos | null {
    const permisosStr = localStorage.getItem('fpus_permisos');
    if (permisosStr) {
      try {
        return JSON.parse(permisosStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};
