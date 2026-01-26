import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedActionProps {
  children: ReactNode;
  recurso: string;
  accion?: 'ver' | 'editar';
  fallback?: ReactNode;
}

export const ProtectedAction = ({ 
  children, 
  recurso, 
  accion = 'editar',
  fallback = null 
}: ProtectedActionProps) => {
  const { permisos } = useAuth();

  if (!permisos || !permisos[recurso]) {
    return <>{fallback}</>;
  }

  const tienePermiso = accion === 'ver' 
    ? permisos[recurso].ver 
    : permisos[recurso].editar;

  if (!tienePermiso) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
