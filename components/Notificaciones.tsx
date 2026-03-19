import { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import * as notificacionesService from '../services/notificaciones.service';
import type { Notificacion } from '../types';

export default function Notificaciones() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [open, setOpen] = useState(false);

  const cargarNotificaciones = async () => {
    try {
      console.log('[Notificaciones] Cargando notificaciones...');
      const [dataNotif, dataCount] = await Promise.all([
        notificacionesService.obtenerNotificaciones(false),
        notificacionesService.contarNoLeidas(),
      ]);

      console.log('[Notificaciones] Datos recibidos:', {
        notificaciones: dataNotif.notificaciones?.length || 0,
        noLeidas: dataCount.total || 0,
      });

      setNotificaciones(dataNotif.notificaciones || []);
      setNoLeidas(dataCount.total || 0);
    } catch (error) {
      console.error('[Notificaciones] Error al cargar notificaciones:', error);
      toast.error('Error al cargar notificaciones');
    }
  };

  useEffect(() => {
    cargarNotificaciones();

    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClickNotificacion = async (notificacion: Notificacion) => {
    try {
      console.log('[Notificaciones] Click en notificacion:', notificacion.id_notificacion);
      if (!notificacion.leida) {
        await notificacionesService.marcarComoLeida(notificacion.id_notificacion);
        console.log('[Notificaciones] Notificacion marcada como leida');
      }

      setOpen(false);

      if (notificacion.link) {
        console.log('[Notificaciones] Navegando a:', notificacion.link);
        navigate(notificacion.link);
      }

      await cargarNotificaciones();
    } catch (error) {
      console.error('[Notificaciones] Error al marcar notificacion:', error);
      toast.error('Error al procesar notificacion');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      setCargando(true);
      await notificacionesService.marcarTodasComoLeidas();
      await cargarNotificaciones();
      toast.success('Todas las notificaciones marcadas como leidas');
    } catch (error) {
      console.error('Error al marcar todas:', error);
      toast.error('Error al marcar notificaciones');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await notificacionesService.eliminarNotificacion(id);
      await cargarNotificaciones();
      toast.success('Notificacion eliminada');
    } catch (error) {
      console.error('Error al eliminar notificacion:', error);
      toast.error('Error al eliminar notificacion');
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CUMPLEAÑOS':
        return '🎂';
      case 'APROBACION_BENEFACTOR':
      case 'APROBACION_SOCIAL':
        return '📋';
      case 'SISTEMA':
        return '⚙️';
      default:
        return '📣';
    }
  };

  const formatearFecha = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;

    return fechaNotif.toLocaleDateString('es-EC');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          style={{
            position: 'relative',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell style={{ width: '20px', height: '20px', color: 'white', stroke: 'white' }} />
          {noLeidas > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                minWidth: '18px',
                height: '18px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
              }}
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-base">Notificaciones</span>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarcarTodasLeidas}
              disabled={cargando}
              className="h-7 text-xs"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="mb-2 h-12 w-12 text-gray-300" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notificaciones.map((notif) => (
                <DropdownMenuItem
                  key={notif.id_notificacion}
                  className={`cursor-pointer p-3 ${!notif.leida ? 'bg-blue-50' : ''}`}
                  onClick={() => handleClickNotificacion(notif)}
                >
                  <div className="flex w-full items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 text-xl">
                      {getTipoIcon(notif.tipo)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight text-gray-900 ${!notif.leida ? 'font-semibold' : 'font-medium'}`}>
                          {notif.titulo}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEliminar(notif.id_notificacion, e)}
                          className="h-6 w-6 flex-shrink-0 p-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {notif.mensaje}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatearFecha(notif.fecha_creacion)}
                        </span>

                        {notif.link && (
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {!notif.leida && (
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
