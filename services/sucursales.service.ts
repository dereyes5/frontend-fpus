import api from './api';

export interface Sucursal {
  id_sucursal: number;
  iniciales: string;
  nombre: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
  total_usuarios?: number;
}

export interface CrearSucursalDto {
  iniciales: string;
  nombre: string;
  activo?: boolean;
}

export interface ActualizarSucursalDto {
  iniciales?: string;
  nombre?: string;
  activo?: boolean;
}

export interface AsignarSucursalUsuarioDto {
  id_usuario: number;
  id_sucursal: number;
}

class SucursalesService {
  
  // Listar todas las sucursales
  async listarSucursales() {
    const response = await api.get<{
      success: boolean;
      data: Sucursal[];
      total: number;
    }>('/sucursales');
    return response.data;
  }

  // Obtener sucursal por ID
  async obtenerSucursalPorId(id: number) {
    const response = await api.get<{
      success: boolean;
      data: Sucursal;
    }>(`/sucursales/${id}`);
    return response.data;
  }

  // Obtener usuarios de una sucursal
  async obtenerUsuariosSucursal(id: number) {
    const response = await api.get<{
      success: boolean;
      data: any[];
      total: number;
    }>(`/sucursales/${id}/usuarios`);
    return response.data;
  }

  // Crear nueva sucursal
  async crearSucursal(data: CrearSucursalDto) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: Sucursal;
    }>('/sucursales', data);
    return response.data;
  }

  // Actualizar sucursal
  async actualizarSucursal(id: number, data: ActualizarSucursalDto) {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Sucursal;
    }>(`/sucursales/${id}`, data);
    return response.data;
  }

  // Eliminar sucursal (soft delete)
  async eliminarSucursal(id: number) {
    const response = await api.delete<{
      success: boolean;
      message: string;
    }>(`/sucursales/${id}`);
    return response.data;
  }

  // Asignar sucursal a usuario
  async asignarSucursalUsuario(data: AsignarSucursalUsuarioDto) {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        id_usuario: number;
        sucursal: Sucursal;
      };
    }>('/sucursales/asignar-usuario', data);
    return response.data;
  }
}

export default new SucursalesService();
