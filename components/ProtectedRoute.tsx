import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[]; // Array de permisos requeridos (cualquiera)
}

export const ProtectedRoute = ({ children, requiredPermissions }: ProtectedRouteProps) => {
  const { user, permisos, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F8F5B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !permisos) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican permisos requeridos, verificar que el usuario tenga al menos uno
  if (requiredPermissions && requiredPermissions.length > 0) {
    const tienePermiso = requiredPermissions.some(permiso => 
      permisos[permiso as keyof typeof permisos] === true
    );
    
    if (!tienePermiso) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos para acceder a este módulo</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
