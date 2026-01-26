import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { permisosService } from '../services/permisos.service';
import { Usuario, Permisos } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: Usuario | null;
  permisos: Permisos | null;
  loading: boolean;
  login: (nombre_usuario: string, password: string) => Promise<void>;
  logout: () => void;
  refreshPermisos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [permisos, setPermisos] = useState<Permisos | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario y permisos al iniciar
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        const savedUser = authService.getUser();
        const savedPermisos = permisosService.getPermisos();
        
        if (savedUser && savedPermisos) {
          setUser(savedUser);
          setPermisos(savedPermisos);
        } else {
          // Si no hay permisos guardados, obtenerlos del servidor
          try {
            const response = await permisosService.getMisPermisos();
            setPermisos(response.data.permisos);
            permisosService.savePermisos(response.data.permisos);
          } catch (error) {
            console.error('Error al cargar permisos:', error);
            authService.clearAuth();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (nombre_usuario: string, password: string) => {
    try {
      setLoading(true);
      const loginResponse = await authService.login({ nombre_usuario, password });
      
      // Guardar token y usuario
      authService.saveAuth(loginResponse.data.token, loginResponse.data.usuario);
      setUser(loginResponse.data.usuario);

      // Obtener permisos
      const permisosResponse = await permisosService.getMisPermisos();
      setPermisos(permisosResponse.data.permisos);
      permisosService.savePermisos(permisosResponse.data.permisos);

      toast.success('Sesión iniciada correctamente');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.clearAuth();
    setUser(null);
    setPermisos(null);
    toast.info('Sesión cerrada');
  };

  const refreshPermisos = async () => {
    try {
      const response = await permisosService.getMisPermisos();
      setPermisos(response.data.permisos);
      permisosService.savePermisos(response.data.permisos);
    } catch (error) {
      console.error('Error al refrescar permisos:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, permisos, loading, login, logout, refreshPermisos }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
