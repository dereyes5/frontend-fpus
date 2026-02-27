import api from './api';

export const fotoPerfilService = {
  /**
   * Subir o actualizar foto de perfil del usuario actual
   */
  subirFoto: async (file: File) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api.post('/auth/foto-perfil', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Obtener URL de foto de perfil de un usuario
   */
  obtenerUrl: (idUsuario: number): string => {
    const baseURL = 'http://154.12.234.100:3000/api';
    const token = localStorage.getItem('fpus_token');
    return `${baseURL}/auth/foto-perfil/${idUsuario}?token=${token}`;
  },

  /**
   * Eliminar foto de perfil del usuario actual
   */
  eliminarFoto: async () => {
    return api.delete('/auth/foto-perfil');
  },

  /**
   * Verificar si un usuario tiene foto de perfil
   */
  tieneFoto: async (idUsuario: number): Promise<boolean> => {
    try {
      const url = fotoPerfilService.obtenerUrl(idUsuario);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },
};
