import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermisosGranulares } from '../types';

interface ProtectedActionProps {
  children: ReactNode;
  permiso: keyof PermisosGranulares; // Permiso específico requerido
  fallback?: ReactNode;
}

export const ProtectedAction = ({ 
  children, 
  permiso,
  fallback = null 
}: ProtectedActionProps) => {
  const { permisos } = useAuth();

  if (!permisos || !permisos[permiso]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
