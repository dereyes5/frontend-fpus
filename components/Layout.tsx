import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Heart,
  CheckSquare,
  LogOut,
  Settings,
  Key,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { fotoPerfilService } from "../services/fotoPerfil.service";
import { toast } from "sonner";
import logo from "../assets/img/FUNDACASDION.png";
import Notificaciones from "./Notificaciones";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permisos, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogPasswordOpen, setDialogPasswordOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [keyFoto, setKeyFoto] = useState(Date.now());
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Aprobaciones"]); // Menús expandidos

  // Cargar foto de perfil
  useEffect(() => {
    if (user?.id_usuario) {
      setFotoPerfilUrl(fotoPerfilService.obtenerUrl(user.id_usuario));
    }
  }, [user]);

  // Escuchar cambios en la foto de perfil
  useEffect(() => {
    const handleFotoActualizada = () => {
      setKeyFoto(Date.now());
      if (user?.id_usuario) {
        setFotoPerfilUrl(fotoPerfilService.obtenerUrl(user.id_usuario));
      }
    };

    window.addEventListener('fotoPerfilActualizada', handleFotoActualizada);
    return () => window.removeEventListener('fotoPerfilActualizada', handleFotoActualizada);
  }, [user]);

  // Auto-expandir menú según la ruta actual
  useEffect(() => {
    if (location.pathname.startsWith('/aprobaciones')) {
      setExpandedMenus(prev => {
        if (!prev.includes('Aprobaciones')) {
          return [...prev, 'Aprobaciones'];
        }
        return prev;
      });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordNueva !== passwordConfirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordNueva.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setSubmitting(true);
      await authService.cambiarPassword({
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });
      toast.success("Contraseña actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setDialogPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, requiredPermission: null },
    {
      path: "/benefactores",
      label: "Benefactores",
      icon: Users,
      requiredPermission: "benefactores_lectura"
    },
    {
      path: "/aprobaciones",
      label: "Aprobaciones",
      icon: CheckSquare,
      requiredPermission: "aprobaciones",
      submenu: [
        { path: "/aprobaciones/benefactores", label: "Aprobaciones Benefactores", requiredPermission: "aprobaciones" },
        { path: "/aprobaciones/social", label: "Aprobaciones Social", requiredPermission: "aprobaciones_social" },
      ]
    },
    { path: "/cartera", label: "Cartera", icon: Wallet, requiredPermission: "cartera_lectura" },
    {
      path: "/social",
      label: "Social",
      icon: Heart,
      requiredPermission: "social_lectura",
      submenu: [
        { path: "/social", label: "Gestión de Casos", requiredPermission: "social_lectura" },
        { path: "/social/seguimiento", label: "Seguimiento", requiredPermission: "social_lectura" },
      ]
    },
    { path: "/configuracion", label: "Configuración", icon: Settings, requiredPermission: "configuraciones" },
  ];

  // Filtrar elementos del menú según permisos del usuario
  const visibleMenuItems = menuItems.filter(item => {
    // Dashboard siempre visible
    if (!item.requiredPermission) return true;

    // Si no hay permisos, no mostrar nada
    if (!permisos) return false;

    // Si tiene submenú, verificar si al menos uno de los subitems es visible
    if (item.submenu) {
      return item.submenu.some((subitem: any) =>
        permisos[subitem.requiredPermission as keyof typeof permisos] === true
      );
    }

    // Verificar si el usuario tiene el permiso requerido
    return permisos[item.requiredPermission as keyof typeof permisos] === true;
  });

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    // Exact match to avoid /social matching /social/seguimiento
    return location.pathname === path;
  };

  const isGroupActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] border-b border-[#1b76b9]/20 sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-6 py-4 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Fundación FPUS"
                className="h-12 w-auto drop-shadow-lg"
              />

            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white drop-shadow">{user.nombre_usuario}</p>
              <p className="text-xs text-white/80">
                {user.cargo || 'AGENTE'}
              </p>
            </div>

            {/* Notificaciones */}
            <Notificaciones />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-12 h-12 bg-gradient-to-br from-white to-white/80 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30 hover:ring-white/50 transition-all cursor-pointer overflow-hidden">
                  {fotoPerfilUrl ? (
                    <img
                      key={keyFoto}
                      src={`${fotoPerfilUrl}&t=${keyFoto}`}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={() => setFotoPerfilUrl(null)}
                    />
                  ) : (
                    <span className="text-[#1b76b9] text-base font-bold">
                      {user.nombre_usuario.charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.nombre_usuario}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.cargo || 'AGENTE'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialogPasswordOpen(true)} className="cursor-pointer">
                  <Key className="mr-2 h-4 w-4" />
                  <span>Cambiar contraseña</span>
                </DropdownMenuItem>
                {permisos?.configuraciones && (
                  <DropdownMenuItem onClick={() => navigate("/configuracion")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[73px] left-0 z-30 h-[calc(100vh-73px)]
          w-64 bg-white border-r border-gray-200
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-1 h-[calc(100%-73px)] overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus.includes(item.label);

              // Filtrar subitems visibles según permisos
              const visibleSubitems = hasSubmenu
                ? item.submenu.filter((subitem: any) =>
                  !permisos || permisos[subitem.requiredPermission as keyof typeof permisos] === true
                )
                : [];

              const active = hasSubmenu
                ? isGroupActive(item.path)
                : item.path === "/benefactores"
                  ? isGroupActive(item.path)
                  : isActive(item.path);

              return (
                <div key={item.path}>
                  {hasSubmenu ? (
                    <>
                      {/* Item con submenú - solo toggle, no navegación */}
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                          ${active
                            ? 'bg-[#1b76b9] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {/* Submenú */}
                      {isExpanded && (
                        <div className="mt-1 ml-4 space-y-1">
                          {visibleSubitems.map((subitem: any) => {
                            const subActive = isActive(subitem.path);
                            return (
                              <Link
                                key={subitem.path}
                                to={subitem.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                                  ${subActive
                                    ? 'bg-[#1b76b9] text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <span>{subitem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    // Item sin submenú - navegación normal
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${active
                          ? 'bg-[#1b76b9] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Dialog para cambiar contraseña */}
      <Dialog open={dialogPasswordOpen} onOpenChange={setDialogPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Cambiar Contraseña
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCambiarPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="password-actual">Contraseña Actual</Label>
              <Input
                id="password-actual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingrese su contraseña actual"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-nueva">Nueva Contraseña</Label>
              <Input
                id="password-nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Ingrese su nueva contraseña"
                required
                minLength={6}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirmar">Confirmar Nueva Contraseña</Label>
              <Input
                id="password-confirmar"
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                placeholder="Confirme su nueva contraseña"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogPasswordOpen(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#4064E3] hover:bg-[#3451C2] flex-1"
                disabled={submitting}
              >
                {submitting ? "Actualizando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
