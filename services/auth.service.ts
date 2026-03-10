import api from './api';
import {
  LoginRequest,
  LoginResponse,
  Usuario,
  CambiarPasswordRequest,
  ApiResponse,
  PermisosGranulares,
} from '../types';

export interface UsuarioAdmin {
  id_usuario: number;
  nombre_usuario: string;
  cargo?: string;
  activo: boolean;
  fecha_inactivacion?: string | null;
  id_usuario_inactiva?: number | null;
  id_sucursal?: number;
  sucursal?: {
    id_sucursal: number;
    iniciales: string;
    nombre: string;
  } | null;
  roles?: Array<{ id_rol: number; nombre: string }>;
  permisos?: PermisosGranulares | null;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async getPerfil(): Promise<ApiResponse<Usuario>> {
    const response = await api.get<ApiResponse<Usuario>>('/auth/perfil');
    return response.data;
  },

  async cambiarPassword(data: CambiarPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>('/auth/cambiar-password', data);
    return response.data;
  },

  async crearUsuario(data: { nombre_usuario: string; password: string; cargo?: string }): Promise<ApiResponse<Usuario>> {
    const response = await api.post<ApiResponse<Usuario>>('/auth/usuarios', data);
    return response.data;
  },

  async asignarRol(data: { id_usuario: number; id_rol: number }): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/usuarios/asignar-rol', data);
    return response.data;
  },

  async actualizarPermisos(
    idUsuario: number,
    permisos: PermisosGranulares
  ): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(
      `/auth/usuarios/${idUsuario}/permisos`,
      permisos
    );
    return response.data;
  },

  async obtenerUsuarios(incluirInactivos = true): Promise<ApiResponse<UsuarioAdmin[]>> {
    const response = await api.get<ApiResponse<UsuarioAdmin[]>>('/auth/usuarios', {
      params: { incluir_inactivos: incluirInactivos },
    });
    return response.data;
  },

  async listarUsuarios(incluirInactivos = true): Promise<ApiResponse<UsuarioAdmin[]>> {
    return this.obtenerUsuarios(incluirInactivos);
  },

  async actualizarUsuarioAdmin(
    idUsuario: number,
    data: { nombre_usuario: string; cargo: string }
  ): Promise<ApiResponse<UsuarioAdmin>> {
    const response = await api.put<ApiResponse<UsuarioAdmin>>(`/auth/usuarios/${idUsuario}`, data);
    return response.data;
  },

  async cambiarPasswordUsuarioAdmin(
    idUsuario: number,
    data: { password_nueva: string }
  ): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>(`/auth/usuarios/${idUsuario}/password`, data);
    return response.data;
  },

  async cambiarEstadoUsuario(
    idUsuario: number,
    activo: boolean
  ): Promise<ApiResponse<UsuarioAdmin>> {
    const response = await api.patch<ApiResponse<UsuarioAdmin>>(`/auth/usuarios/${idUsuario}/estado`, { activo });
    return response.data;
  },

  async eliminarUsuarioSoft(idUsuario: number): Promise<ApiResponse<UsuarioAdmin>> {
    const response = await api.delete<ApiResponse<UsuarioAdmin>>(`/auth/usuarios/${idUsuario}`);
    return response.data;
  },

  saveAuth(token: string, usuario: Usuario): void {
    localStorage.setItem('fpus_token', token);
    localStorage.setItem('fpus_user', JSON.stringify(usuario));
  },

  clearAuth(): void {
    localStorage.removeItem('fpus_token');
    localStorage.removeItem('fpus_user');
    localStorage.removeItem('fpus_permisos');
  },

  getUser(): Usuario | null {
    const userStr = localStorage.getItem('fpus_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('fpus_token');
  },
};
