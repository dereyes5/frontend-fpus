import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermisosGranulares } from '../types';

interface ProtectedActionProps {
  children: ReactNode;
  permiso: keyof PermisosGranulares | Array<keyof PermisosGranulares>;
  fallback?: ReactNode;
}

export const ProtectedAction = ({
  children,
  permiso,
  fallback = null
}: ProtectedActionProps) => {
  const { permisos } = useAuth();
  const permisosRequeridos = Array.isArray(permiso) ? permiso : [permiso];

  if (!permisos || !permisosRequeridos.some((permisoActual) => permisos[permisoActual])) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
