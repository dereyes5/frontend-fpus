import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { Usuario, PermisosGranulares } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: Usuario | null;
  permisos: PermisosGranulares | null;
  loading: boolean;
  login: (nombre_usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [permisos, setPermisos] = useState<PermisosGranulares | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario y permisos al iniciar
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        const savedUser = authService.getUser();
        
        if (savedUser && savedUser.permisos) {
          setUser(savedUser);
          setPermisos(savedUser.permisos);
        } else {
          authService.clearAuth();
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
      
      // Guardar token y usuario (que incluye permisos)
      authService.saveAuth(loginResponse.data.token, loginResponse.data.usuario);
      setUser(loginResponse.data.usuario);
      setPermisos(loginResponse.data.usuario.permisos);

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

  return (
    <AuthContext.Provider value={{ user, permisos, loading, login, logout }}>
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
