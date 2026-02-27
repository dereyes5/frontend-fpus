import api from './api';
import {
  EstadoPago,
  Estadisticas,
  Cobro,
  RegistrarCobrosRequest,
  HistorialPago,
  SaldoBenefactor,
  ApiResponse,
  Benefactor,
} from '../types';

export const cobrosService = {
  // Obtener lista de benefactores (para cobros)
  async getBenefactoresParaCobros(): Promise<ApiResponse<Benefactor[]>> {
    const response = await api.get<ApiResponse<Benefactor[]>>('/cobros/benefactores', {
      params: { limit: 1000 } // Cargar todos los registros
    });
    return response.data;
  },

  // Obtener estado de aportes del mes actual
  async getEstadoActual(): Promise<ApiResponse<EstadoPago[]>> {
    const response = await api.get<ApiResponse<EstadoPago[]>>('/cobros/estado/actual', {
      params: { limit: 1000 } // Cargar todos los registros
    });
    return response.data;
  },

  // Obtener no aportados
  async getNoAportados(): Promise<ApiResponse<EstadoPago[]>> {
    const response = await api.get<ApiResponse<EstadoPago[]>>('/cobros/no-aportados', {
      params: { limit: 1000 } // Cargar todos los registros
    });
    return response.data;
  },

  // Obtener aportados
  async getAportados(): Promise<ApiResponse<EstadoPago[]>> {
    const response = await api.get<ApiResponse<EstadoPago[]>>('/cobros/aportados', {
      params: { limit: 1000 } // Cargar todos los registros
    });
    return response.data;
  },

  // Obtener estadísticas del mes
  async getEstadisticas(): Promise<ApiResponse<Estadisticas>> {
    const response = await api.get<ApiResponse<Estadisticas>>('/cobros/estadisticas');
    return response.data;
  },

  // Registrar cobros desde archivo del banco
  async registrarCobros(data: RegistrarCobrosRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/cobros/cobros', data);
    return response.data;
  },

  // Obtener cobros registrados
  async getCobros(filters?: {
    id_benefactor?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Cobro[]>> {
    const params = new URLSearchParams();
    if (filters?.id_benefactor) params.append('id_benefactor', filters.id_benefactor.toString());
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<ApiResponse<Cobro[]>>(`/cobros/cobros?${params.toString()}`);
    return response.data;
  },

  // Obtener historial de un benefactor
  async getHistorialBenefactor(id_benefactor: number): Promise<ApiResponse<HistorialPago[]>> {
    const response = await api.get<ApiResponse<HistorialPago[]>>(`/cobros/benefactores/${id_benefactor}/historial`);
    return response.data;
  },

  // Obtener saldo actual de un benefactor
  async getSaldoBenefactor(id_benefactor: number): Promise<ApiResponse<SaldoBenefactor>> {
    const response = await api.get<ApiResponse<SaldoBenefactor>>(`/cobros/benefactores/${id_benefactor}/saldo`);
    return response.data;
  },

  // ========================================
  // DÉBITOS MENSUALES
  // ========================================

  /**
   * Importar archivo Excel de débitos mensuales
   */
  async importarExcelDebitos(archivo: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await api.post<ApiResponse<any>>('/cobros/debitos/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtener lista de lotes importados
   */
  async getLotesImportados(filtros?: {
    mes?: number;
    anio?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>('/cobros/debitos/lotes', {
      params: filtros
    });
    return response.data;
  },

  /**
   * Obtener detalle de un lote específico
   */
  async getDetalleLote(idLote: number): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>(`/cobros/debitos/lotes/${idLote}`);
    return response.data;
  },

  /**
   * Obtener estado actual de aportes mensuales (nuevo módulo)
   */
  async getEstadoAportesMensualesActual(): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>('/cobros/debitos/estado-actual');
    return response.data;
  },

  /**
   * Obtener historial completo de aportes mensuales
   */
  async getHistorialAportesMensuales(filtros?: {
    mes?: number;
    anio?: number;
    idBenefactor?: number;
  }): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>('/cobros/debitos/historial', {
      params: filtros
    });
    return response.data;
  },
};
