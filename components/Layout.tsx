import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  User,
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
import { aparienciaService } from "../services/apariencia.service";
import { toast } from "sonner";
import { DEFAULT_LOGIN_LOGO } from "../config/aparienciaDefaults";
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
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGIN_LOGO);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Aprobaciones"]); // Menus expandidos

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

  // Auto-expandir menu segun la ruta actual
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

  useEffect(() => {
    const cargarApariencia = async () => {
      try {
        const response = await aparienciaService.obtenerPublica();
        const logoRemoto = aparienciaService.resolverUrl(response.data?.logo?.url);
        if (logoRemoto) {
          setLogoUrl(logoRemoto);
        }
      } catch {
        // Fallback local
      }
    };

    cargarApariencia();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordNueva !== passwordConfirmar) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    if (passwordNueva.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    try {
      setSubmitting(true);
      await authService.cambiarPassword({
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });
      toast.success("Contrasena actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setDialogPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contrasena");
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
      requiredPermissions: ["benefactores_ingresar", "benefactores_administrar"]
    },
    {
      path: "/aprobaciones",
      label: "Aprobaciones",
      icon: CheckSquare,
      requiredPermissions: ["aprobaciones", "aprobaciones_social"],
      submenu: [
        { path: "/aprobaciones/benefactores", label: "Aprobaciones Benefactores", requiredPermissions: ["aprobaciones"] },
        { path: "/aprobaciones/social", label: "Aprobaciones Social", requiredPermissions: ["aprobaciones_social"] },
      ]
    },
    { path: "/cartera", label: "Cartera", icon: Wallet, requiredPermissions: ["cartera_lectura"] },
    {
      path: "/social",
      label: "Social",
      icon: Heart,
      requiredPermissions: ["social_ingresar", "social_administrar"],
      submenu: [
        { path: "/social", label: "Gestion de Casos", requiredPermissions: ["social_ingresar", "social_administrar"] },
        { path: "/social/seguimiento", label: "Seguimiento", requiredPermissions: ["social_ingresar", "social_administrar"] },
      ]
    },
    { path: "/configuracion", label: "Configuracion", icon: Settings, requiredPermissions: ["configuraciones"] },
  ];

  // Filtrar elementos del menu segun permisos del usuario
  const visibleMenuItems = menuItems.filter(item => {
    // Dashboard siempre visible
    if (!item.requiredPermissions) return true;

    // Si no hay permisos, no mostrar nada
    if (!permisos) return false;

    // Si tiene submenu, verificar si al menos uno de los subitems es visible
    if (item.submenu) {
      return item.submenu.some((subitem: any) =>
        subitem.requiredPermissions.some((permission: string) => permisos[permission as keyof typeof permisos] === true)
      );
    }

    return item.requiredPermissions.some((permission: string) => permisos[permission as keyof typeof permisos] === true);
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
        <div className="flex items-center justify-between px-3 py-3 sm:px-4 lg:px-6 lg:py-4 relative gap-3">
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
                src={logoUrl}
                onError={() => setLogoUrl(DEFAULT_LOGIN_LOGO)}
                alt="Fundacion FPUS"
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
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogPasswordOpen(true)} className="cursor-pointer">
                  <Key className="mr-2 h-4 w-4" />
                  <span>Cambiar contrasena</span>
                </DropdownMenuItem>
                {permisos?.configuraciones && (
                  <DropdownMenuItem onClick={() => navigate("/configuracion")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuracion</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesion</span>
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
          w-[85vw] max-w-64 bg-white border-r border-gray-200
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-1 h-[calc(100%-73px)] overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus.includes(item.label);

              // Filtrar subitems visibles segun permisos
              const visibleSubitems = hasSubmenu
                ? item.submenu.filter((subitem: any) =>
                  !permisos || subitem.requiredPermissions.some((permission: string) => permisos[permission as keyof typeof permisos] === true)
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
                      {/* Item con submenu - solo toggle, no navegacion */}
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

                      {/* Submenu */}
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
                    // Item sin submenu - navegacion normal
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
        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Dialog para cambiar contrasena */}
      <Dialog open={dialogPasswordOpen} onOpenChange={setDialogPasswordOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Cambiar Contrasena
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCambiarPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="password-actual">Contrasena Actual</Label>
              <Input
                id="password-actual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingrese su contrasena actual"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-nueva">Nueva Contrasena</Label>
              <Input
                id="password-nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Ingrese su nueva contrasena"
                required
                minLength={6}
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                Minimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirmar">Confirmar Nueva Contrasena</Label>
              <Input
                id="password-confirmar"
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                placeholder="Confirme su nueva contrasena"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
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
                className="bg-[#4064E3] hover:bg-[#3451C2] text-white flex-1"
                disabled={submitting}
              >
                {submitting ? "Actualizando..." : "Cambiar Contrasena"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

