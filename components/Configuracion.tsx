import { useState, useEffect } from "react";
import { User, Shield, UserCog, Users, Building2, Plus, Pencil, Trash2, Lock, RefreshCw, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import sucursalesService, { Sucursal, CrearSucursalDto } from "../services/sucursales.service";
import { toast } from "sonner";
import { PermisosGranulares } from "../types";

interface UsuarioConPermisos {
  id_usuario: number;
  nombre_usuario: string;
  permisos?: PermisosGranulares | null;
  id_sucursal?: number;
  sucursal?: {
    id_sucursal: number;
    iniciales: string;
    nombre: string;
  };
}

export default function Configuracion() {
  const { user, permisos } = useAuth();
  
  // Estados para administración de usuarios y permisos
  const [usuarios, setUsuarios] = useState<UsuarioConPermisos[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [updatingPermisos, setUpdatingPermisos] = useState<number | null>(null);

  // Estados para creación de usuarios
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoPasswordConfirmar, setNuevoPasswordConfirmar] = useState("");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Estados para sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [openCrearSucursal, setOpenCrearSucursal] = useState(false);
  const [openEditarSucursal, setOpenEditarSucursal] = useState(false);
  const [openAsignarSucursal, setOpenAsignarSucursal] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState<number | null>(null);
  const [sucursalIdAsignar, setSucursalIdAsignar] = useState("");
  const [formSucursal, setFormSucursal] = useState<CrearSucursalDto>({
    iniciales: "",
    nombre: "",
    activo: true,
  });

  const puedeConfigurar = permisos?.configuraciones ?? false;

  useEffect(() => {
    if (puedeConfigurar) {
      cargarUsuarios();
      cargarSucursales();
    }
  }, [puedeConfigurar]);

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await authService.obtenerUsuarios();
      setUsuarios(response.data || []);
    } catch (error: any) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      setLoadingSucursales(true);
      const response = await sucursalesService.listarSucursales();
      setSucursales(response.data || []);
    } catch (error: any) {
      toast.error("Error al cargar sucursales");
    } finally {
      setLoadingSucursales(false);
    }
  };

  // Función para actualizar un permiso individual
  const togglePermiso = async (
    usuarioId: number, 
    permiso: keyof PermisosGranulares, 
    valorActual: boolean
  ) => {
    try {
      setUpdatingPermisos(usuarioId);
      
      // Obtener permisos actuales del usuario
      const usuario = usuarios.find(u => u.id_usuario === usuarioId);
      if (!usuario) {
        toast.error("Usuario no encontrado");
        return;
      }

      // Si el usuario no tiene permisos, inicializar todos en false
      const permisosBase = usuario.permisos || {
        cartera_lectura: false,
        cartera_escritura: false,
        benefactores_lectura: false,
        benefactores_escritura: false,
        social_lectura: false,
        social_escritura: false,
        configuraciones: false,
        aprobaciones: false,
      };

      // Crear objeto con todos los permisos, cambiando solo el que se está toggling
      const permisosActualizados = {
        cartera_lectura: permisosBase.cartera_lectura ?? false,
        cartera_escritura: permisosBase.cartera_escritura ?? false,
        benefactores_lectura: permisosBase.benefactores_lectura ?? false,
        benefactores_escritura: permisosBase.benefactores_escritura ?? false,
        social_lectura: permisosBase.social_lectura ?? false,
        social_escritura: permisosBase.social_escritura ?? false,
        configuraciones: permisosBase.configuraciones ?? false,
        aprobaciones: permisosBase.aprobaciones ?? false,
        [permiso]: !valorActual, // Toggle el permiso específico
      };

      await authService.actualizarPermisos(usuarioId, permisosActualizados);
      
      // Actualizar solo el usuario específico en el estado local (sin recargar toda la lista)
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(u => 
          u.id_usuario === usuarioId 
            ? { ...u, permisos: permisosActualizados }
            : u
        )
      );
      
      toast.success("Permiso actualizado exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar permisos:", error);
      toast.error(error.response?.data?.message || "Error al actualizar permisos");
    } finally {
      setUpdatingPermisos(null);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoUsuario.trim()) {
      toast.error("Ingresa un nombre de usuario");
      return;
    }

    if (nuevoPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (nuevoPassword !== nuevoPasswordConfirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setCreandoUsuario(true);
      await authService.crearUsuario({ nombre_usuario: nuevoUsuario.trim(), password: nuevoPassword });
      toast.success("Usuario creado exitosamente");
      setNuevoUsuario("");
      setNuevoPassword("");
      setNuevoPasswordConfirmar("");
      if (puedeConfigurar) {
        await cargarUsuarios();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear usuario");
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Funciones para sucursales
  const handleCrearSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sucursalesService.crearSucursal(formSucursal);
      toast.success("Sucursal creada exitosamente");
      setOpenCrearSucursal(false);
      setFormSucursal({ iniciales: "", nombre: "", activo: true });
      await cargarSucursales();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear sucursal");
    }
  };

  const handleEditarSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sucursalSeleccionada) return;
    
    try {
      await sucursalesService.actualizarSucursal(sucursalSeleccionada.id_sucursal, formSucursal);
      toast.success("Sucursal actualizada exitosamente");
      setOpenEditarSucursal(false);
      setSucursalSeleccionada(null);
      setFormSucursal({ iniciales: "", nombre: "", activo: true });
      await cargarSucursales();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar sucursal");
    }
  };

  const handleEliminarSucursal = async (id: number) => {
    if (!confirm("¿Estás seguro de desactivar esta sucursal?")) return;
    
    try {
      await sucursalesService.eliminarSucursal(id);
      toast.success("Sucursal desactivada exitosamente");
      await cargarSucursales();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar sucursal");
    }
  };

  const handleAsignarSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaAsignar || !sucursalIdAsignar) return;

    try {
      await sucursalesService.asignarSucursalUsuario({
        id_usuario: usuarioParaAsignar,
        id_sucursal: parseInt(sucursalIdAsignar),
      });
      toast.success("Sucursal asignada exitosamente");
      setOpenAsignarSucursal(false);
      setUsuarioParaAsignar(null);
      setSucursalIdAsignar("");
      await cargarUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al asignar sucursal");
    }
  };

  const abrirDialogoEditarSucursal = (sucursal: Sucursal) => {
    setSucursalSeleccionada(sucursal);
    setFormSucursal({
      iniciales: sucursal.iniciales,
      nombre: sucursal.nombre,
      activo: sucursal.activo,
    });
    setOpenEditarSucursal(true);
  };

  const abrirDialogoAsignarSucursal = (idUsuario: number) => {
    setUsuarioParaAsignar(idUsuario);
    setOpenAsignarSucursal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
        <p className="text-white/90">Configuración de cuenta y seguridad</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className={`grid w-full h-auto gap-2 p-2 ${puedeConfigurar ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 max-w-md'}`}>
          <TabsTrigger value="perfil" className="text-sm sm:text-base py-3 px-4 gap-2">
            <User className="h-4 w-4" />
            Mi Perfil
          </TabsTrigger>
          {puedeConfigurar && (
            <TabsTrigger value="roles" className="text-sm sm:text-base py-3 px-4 gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Administrar Roles</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="crear-usuario" className="text-sm sm:text-base py-3 px-4 gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Crear Usuario</span>
              <span className="sm:hidden">Crear</span>
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="usuarios" className="text-sm sm:text-base py-3 px-4 gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="sucursales" className="text-sm sm:text-base py-3 px-4 gap-2">
              <Building2 className="h-4 w-4" />
              Sucursales
            </TabsTrigger>
          )}
        </TabsList>

        {/* Perfil Tab */}
        <TabsContent value="perfil" className="mt-6">
          <Card className="w-full max-w-2xl bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#1b76b9] rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user?.nombre_usuario.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{user?.nombre_usuario}</h3>
                  <p className="text-gray-600">
                    Usuario del Sistema
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuario
                  </Label>
                  <Input 
                    value={user?.nombre_usuario || ""} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>

                {permisos && (
                  <div>
                    <Label className="text-gray-600 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permisos Asignados
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(permisos).map(([key, value]) => value && (
                        <div
                          key={key}
                          className="px-3 py-2 bg-[#0F8F5B] text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Para actualizar tu información de perfil, contacta al administrador del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permisos Tab - Gestión de permisos granulares */}
        {puedeConfigurar && (
          <TabsContent value="roles" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Administrar Permisos de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Descripción del sistema */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">
                            Sistema de Permisos Granulares
                          </h4>
                          <p className="text-sm text-blue-800">
                            Controla el acceso de cada usuario a módulos específicos. 
                            Los cambios se aplican inmediatamente pero requieren que el usuario vuelva a iniciar sesión.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de usuarios con sus permisos */}
                    {usuarios.map((usuario) => (
                      <div 
                        key={usuario.id_usuario}
                        className="p-5 border border-gray-200 rounded-lg space-y-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {usuario.nombre_usuario}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {usuario.id_usuario}
                            </p>
                          </div>
                          {updatingPermisos === usuario.id_usuario && (
                            <span className="text-sm text-blue-600 flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Actualizando...
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">
                            Permisos asignados:
                          </Label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Cartera Lectura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-cartera_lectura`}
                                checked={usuario.permisos?.cartera_lectura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'cartera_lectura', 
                                  usuario.permisos?.cartera_lectura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-cartera_lectura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Cartera (Lectura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver información de cartera y aportes
                                </p>
                              </div>
                            </div>

                            {/* Cartera Escritura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-cartera_escritura`}
                                checked={usuario.permisos?.cartera_escritura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'cartera_escritura', 
                                  usuario.permisos?.cartera_escritura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-cartera_escritura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Cartera (Escritura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Registrar cobros y modificar cartera
                                </p>
                              </div>
                            </div>

                            {/* Benefactores Lectura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-benefactores_lectura`}
                                checked={usuario.permisos?.benefactores_lectura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'benefactores_lectura', 
                                  usuario.permisos?.benefactores_lectura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-benefactores_lectura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Benefactores (Lectura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver información de benefactores
                                </p>
                              </div>
                            </div>

                            {/* Benefactores Escritura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-benefactores_escritura`}
                                checked={usuario.permisos?.benefactores_escritura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'benefactores_escritura', 
                                  usuario.permisos?.benefactores_escritura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-benefactores_escritura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Benefactores (Escritura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Crear y editar benefactores
                                </p>
                              </div>
                            </div>

                            {/* Social Lectura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-social_lectura`}
                                checked={usuario.permisos?.social_lectura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'social_lectura', 
                                  usuario.permisos?.social_lectura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-social_lectura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Social (Lectura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver información del módulo social
                                </p>
                              </div>
                            </div>

                            {/* Social Escritura */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-social_escritura`}
                                checked={usuario.permisos?.social_escritura ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'social_escritura', 
                                  usuario.permisos?.social_escritura ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-social_escritura`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Social (Escritura)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Editar información del módulo social
                                </p>
                              </div>
                            </div>

                            {/* Configuraciones */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-configuraciones`}
                                checked={usuario.permisos?.configuraciones ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'configuraciones', 
                                  usuario.permisos?.configuraciones ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-configuraciones`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Configuraciones
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Acceso completo al módulo de configuración
                                </p>
                              </div>
                            </div>

                            {/* Aprobaciones */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-aprobaciones`}
                                checked={usuario.permisos?.aprobaciones ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario, 
                                  'aprobaciones', 
                                  usuario.permisos?.aprobaciones ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-aprobaciones`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Aprobaciones
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Aprobar o rechazar benefactores
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {usuarios.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No hay usuarios registrados
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}


        {/* Crear Usuario Tab - Solo para administradores */}
        {puedeConfigurar && (
          <TabsContent value="crear-usuario" className="mt-6">
            <Card className="w-full max-w-2xl bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Crear Nuevo Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearUsuario} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-usuario" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre de usuario
                    </Label>
                    <Input
                      id="nuevo-usuario"
                      value={nuevoUsuario}
                      onChange={(e) => setNuevoUsuario(e.target.value)}
                      placeholder="Ej: JGONZALEZ"
                      autoComplete="off"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Contraseña
                    </Label>
                    <Input
                      id="nuevo-password"
                      type="password"
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password-confirmar" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="nuevo-password-confirmar"
                      type="password"
                      value={nuevoPasswordConfirmar}
                      onChange={(e) => setNuevoPasswordConfirmar(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={creandoUsuario} className="gap-2">
                      {creandoUsuario ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Crear usuario
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Siguiente paso</h4>
                      <p className="text-sm text-blue-800">
                        Después de crear el usuario, asígnale roles en la pestaña “Administrar Roles”.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Usuarios Tab - Solo para administradores (solo lectura) */}
        {puedeConfigurar && (
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios y Roles
                  </div>
                  <Button variant="outline" size="sm" onClick={cargarUsuarios} disabled={loadingUsuarios} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                    {loadingUsuarios ? "Actualizando..." : "Actualizar"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Cargando usuarios...</p>
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No hay usuarios para mostrar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usuarios.map((usuario) => (
                      <div
                        key={usuario.id_usuario}
                        className="p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-start sm:justify-between gap-4"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{usuario.nombre_usuario}</h3>
                          <p className="text-sm text-gray-600">
                            {usuario.permisos ? 'Permisos asignados' : 'Sin permisos'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end w-full sm:w-auto">
                          {usuario.permisos ? (
                            Object.entries(usuario.permisos)
                              .filter(([_, value]) => value === true)
                              .map(([key]) => (
                                <div
                                  key={`${usuario.id_usuario}-${key}`}
                                  className="px-3 py-2 bg-[#0F8F5B] text-white rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                              ))
                          ) : (
                            <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2">
                              <XCircle className="h-3 w-3" />
                              Sin permisos
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Sucursales Tab - Solo para administradores */}
        {puedeConfigurar && (
          <TabsContent value="sucursales" className="mt-6">
            <div className="space-y-6">
              {/* Card para gestión de sucursales */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Gestión de Sucursales
                    </div>
                    <Button 
                      onClick={() => setOpenCrearSucursal(true)} 
                      size="sm"
                      className="gap-2 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Nueva Sucursal</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSucursales ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Cargando sucursales...</p>
                    </div>
                  ) : sucursales.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No hay sucursales registradas.</p>
                    </div>
                  ) : (
                    <>
                      {/* Vista desktop - Tabla */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Iniciales</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Total Usuarios</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sucursales.map((sucursal) => (
                              <TableRow key={sucursal.id_sucursal}>
                                <TableCell className="font-medium">{sucursal.iniciales}</TableCell>
                                <TableCell>{sucursal.nombre}</TableCell>
                                <TableCell>{sucursal.total_usuarios || 0}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                                    sucursal.activo 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {sucursal.activo ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    {sucursal.activo ? 'Activa' : 'Inactiva'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => abrirDialogoEditarSucursal(sucursal)}
                                      className="gap-2"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleEliminarSucursal(sucursal.id_sucursal)}
                                      className="gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Eliminar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Vista móvil - Cards */}
                      <div className="md:hidden space-y-4">
                        {sucursales.map((sucursal) => (
                          <Card key={sucursal.id_sucursal} className="border-2">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                    <p className="font-bold text-lg">{sucursal.iniciales}</p>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{sucursal.nombre}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                                  sucursal.activo 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {sucursal.activo ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  {sucursal.activo ? 'Activa' : 'Inactiva'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-600" />
                                <span className="text-gray-600">Total usuarios:</span>
                                <span className="font-semibold">{sucursal.total_usuarios || 0}</span>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirDialogoEditarSucursal(sucursal)}
                                  className="gap-2 flex-1"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleEliminarSucursal(sucursal.id_sucursal)}
                                  className="gap-2 flex-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card para asignar sucursales a usuarios */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Usuarios y Roles
                    </div>
                    <Button variant="outline" size="sm" onClick={cargarUsuarios} disabled={loadingUsuarios} className="w-full sm:w-auto gap-2">
                      <RefreshCw className={`h-4 w-4 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                      {loadingUsuarios ? "Actualizando..." : "Actualizar"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingUsuarios ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Cargando usuarios...</p>
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No hay usuarios registrados.</p>
                    </div>
                  ) : (
                    <>
                      {/* Vista desktop - Tabla */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Sucursal Asignada</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {usuarios.map((usuario) => (
                              <TableRow key={usuario.id_usuario}>
                                <TableCell className="font-medium">{usuario.nombre_usuario}</TableCell>
                                <TableCell>
                                  {usuario.sucursal ? (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-2 w-fit">
                                      <MapPin className="h-3 w-3" />
                                      {usuario.sucursal.iniciales} - {usuario.sucursal.nombre}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-sm flex items-center gap-2">
                                      <XCircle className="h-3 w-3" />
                                      Sin sucursal asignada
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => abrirDialogoAsignarSucursal(usuario.id_usuario)}
                                    className="gap-2"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    {usuario.sucursal ? 'Cambiar Sucursal' : 'Asignar Sucursal'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Vista móvil - Cards */}
                      <div className="md:hidden space-y-4">
                        {usuarios.map((usuario) => (
                          <Card key={usuario.id_usuario} className="border-2">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <p className="font-semibold text-lg">{usuario.nombre_usuario}</p>
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs text-gray-500">Sucursal asignada:</p>
                                {usuario.sucursal ? (
                                  <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center gap-2 w-fit">
                                    <MapPin className="h-4 w-4" />
                                    {usuario.sucursal.iniciales} - {usuario.sucursal.nombre}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Sin sucursal asignada
                                  </span>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirDialogoAsignarSucursal(usuario.id_usuario)}
                                className="w-full gap-2"
                              >
                                <MapPin className="h-4 w-4" />
                                {usuario.sucursal ? 'Cambiar Sucursal' : 'Asignar Sucursal'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dialog para crear sucursal */}
            <Dialog open={openCrearSucursal} onOpenChange={setOpenCrearSucursal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Sucursal</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos de la nueva sucursal. Las iniciales deben ser únicas.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCrearSucursal}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="crear-iniciales" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Iniciales
                      </Label>
                      <Input
                        id="crear-iniciales"
                        value={formSucursal.iniciales}
                        onChange={(e) => setFormSucursal({ ...formSucursal, iniciales: e.target.value.toUpperCase() })}
                        placeholder="Ej: SD"
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crear-nombre" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Nombre
                      </Label>
                      <Input
                        id="crear-nombre"
                        value={formSucursal.nombre}
                        onChange={(e) => setFormSucursal({ ...formSucursal, nombre: e.target.value })}
                        placeholder="Ej: Santo Domingo"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="crear-activo"
                        checked={formSucursal.activo}
                        onCheckedChange={(checked) => setFormSucursal({ ...formSucursal, activo: !!checked })}
                      />
                      <Label htmlFor="crear-activo" className="cursor-pointer">
                        Sucursal activa
                      </Label>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => {
                      setOpenCrearSucursal(false);
                      setFormSucursal({ iniciales: "", nombre: "", activo: true });
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Sucursal
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog para editar sucursal */}
            <Dialog open={openEditarSucursal} onOpenChange={setOpenEditarSucursal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Sucursal</DialogTitle>
                  <DialogDescription>
                    Modifica los datos de la sucursal seleccionada.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditarSucursal}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editar-iniciales" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Iniciales
                      </Label>
                      <Input
                        id="editar-iniciales"
                        value={formSucursal.iniciales}
                        onChange={(e) => setFormSucursal({ ...formSucursal, iniciales: e.target.value.toUpperCase() })}
                        placeholder="Ej: SD"
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editar-nombre" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Nombre
                      </Label>
                      <Input
                        id="editar-nombre"
                        value={formSucursal.nombre}
                        onChange={(e) => setFormSucursal({ ...formSucursal, nombre: e.target.value })}
                        placeholder="Ej: Santo Domingo"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="editar-activo"
                        checked={formSucursal.activo}
                        onCheckedChange={(checked) => setFormSucursal({ ...formSucursal, activo: !!checked })}
                      />
                      <Label htmlFor="editar-activo" className="cursor-pointer">
                        Sucursal activa
                      </Label>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => {
                      setOpenEditarSucursal(false);
                      setSucursalSeleccionada(null);
                      setFormSucursal({ iniciales: "", nombre: "", activo: true });
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog para asignar sucursal a usuario */}
            <Dialog open={openAsignarSucursal} onOpenChange={setOpenAsignarSucursal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Sucursal</DialogTitle>
                  <DialogDescription>
                    Selecciona la sucursal que deseas asignar a este usuario.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAsignarSucursal}>
                  <div className="space-y-4">
                    {usuarioParaAsignar && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Usuario seleccionado:</p>
                        <p className="font-semibold">
                          {usuarios.find(u => u.id_usuario === usuarioParaAsignar)?.nombre_usuario}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="asignar-sucursal" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Sucursal
                      </Label>
                      <Select value={sucursalIdAsignar} onValueChange={setSucursalIdAsignar} required>
                        <SelectTrigger id="asignar-sucursal">
                          <SelectValue placeholder="Selecciona una sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          {sucursales
                            .filter(s => s.activo)
                            .map((sucursal) => (
                              <SelectItem 
                                key={sucursal.id_sucursal} 
                                value={sucursal.id_sucursal.toString()}
                              >
                                {sucursal.iniciales} - {sucursal.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => {
                      setOpenAsignarSucursal(false);
                      setUsuarioParaAsignar(null);
                      setSucursalIdAsignar("");
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Asignar Sucursal
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}