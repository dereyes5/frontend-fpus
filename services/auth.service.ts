import api from './api';
import {
  LoginRequest,
  LoginResponse,
  Usuario,
  CambiarPasswordRequest,
  ApiResponse,
} from '../types';

export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Obtener perfil del usuario actual
  async getPerfil(): Promise<ApiResponse<Usuario>> {
    const response = await api.get<ApiResponse<Usuario>>('/auth/perfil');
    return response.data;
  },

  // Cambiar contraseña
  async cambiarPassword(data: CambiarPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.put<ApiResponse<void>>('/auth/cambiar-password', data);
    return response.data;
  },

  // Crear usuario (público)
  async crearUsuario(nombre_usuario: string, password: string): Promise<ApiResponse<Usuario>> {
    const response = await api.post<ApiResponse<Usuario>>('/auth/usuarios', {
      nombre_usuario,
      password,
    });
    return response.data;
  },

  // Asignar rol a usuario
  async asignarRol(data: { id_usuario: number; id_rol: number }): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/usuarios/asignar-rol', data);
    return response.data;
  },

  // Listar todos los usuarios con sus roles
  async listarUsuarios(): Promise<ApiResponse<Array<{
    id_usuario: number;
    nombre_usuario: string;
    roles: Array<{ id_rol: number; nombre: string }>;
  }>>> {
    const response = await api.get<ApiResponse<Array<{
      id_usuario: number;
      nombre_usuario: string;
      roles: Array<{ id_rol: number; nombre: string }>;
    }>>>('/auth/usuarios');
    return response.data;
  },

  // Guardar token y usuario en localStorage
  saveAuth(token: string, usuario: Usuario): void {
    localStorage.setItem('fpus_token', token);
    localStorage.setItem('fpus_user', JSON.stringify(usuario));
  },

  // Limpiar autenticación
  clearAuth(): void {
    localStorage.removeItem('fpus_token');
    localStorage.removeItem('fpus_user');
    localStorage.removeItem('fpus_permisos');
  },

  // Obtener usuario del localStorage
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

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('fpus_token');
  },
};
