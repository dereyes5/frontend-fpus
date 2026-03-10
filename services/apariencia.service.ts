import api from './api';
import type { ApiResponse } from '../types';

export interface AparienciaItem {
  index: number;
  filename: string | null;
  url: string | null;
}

export interface AparienciaData {
  logo: {
    filename: string | null;
    url: string | null;
  };
  carousel: AparienciaItem[];
  carousel_urls: string[];
  updated_at: string;
}

const API_BASE_URL = 'http://154.12.234.100:3000/api';

export const aparienciaService = {
  async obtenerPublica(): Promise<ApiResponse<AparienciaData>> {
    const response = await api.get<ApiResponse<AparienciaData>>('/apariencia/publico');
    return response.data;
  },

  async subirLogo(file: File): Promise<ApiResponse<AparienciaData>> {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post<ApiResponse<AparienciaData>>('/apariencia/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarLogo(): Promise<ApiResponse<AparienciaData>> {
    const response = await api.delete<ApiResponse<AparienciaData>>('/apariencia/logo');
    return response.data;
  },

  async subirCarrusel(index: number, file: File): Promise<ApiResponse<AparienciaData>> {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post<ApiResponse<AparienciaData>>(`/apariencia/carrusel/${index}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async agregarCarrusel(file: File): Promise<ApiResponse<AparienciaData>> {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post<ApiResponse<AparienciaData>>('/apariencia/carrusel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarCarrusel(index: number): Promise<ApiResponse<AparienciaData>> {
    const response = await api.delete<ApiResponse<AparienciaData>>(`/apariencia/carrusel/${index}`);
    return response.data;
  },

  resolverUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${API_BASE_URL.replace(/\/api$/, '')}${url}`;
    return `${API_BASE_URL}/${url}`;
  },
};
