import { useState, useEffect } from "react";
import { User, Shield, UserCog, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { toast } from "sonner";

interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  roles: { id_rol: number; nombre: string }[];
}

interface Rol {
  id_rol: number;
  nombre: string;
}

const ROLES_DISPONIBLES: Rol[] = [
  { id_rol: 1, nombre: "EJECUTIVO" },
  { id_rol: 2, nombre: "ADMINISTRADOR" },
  { id_rol: 3, nombre: "EJECUTIVO_SOCIAL" },
  { id_rol: 4, nombre: "EJECUTIVO_CONTABLE" },
];

export default function Configuracion() {
  const { user } = useAuth();
  
  // Estados para administración de roles
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState<number | null>(null);

  // Estados para creación de usuarios
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoPasswordConfirmar, setNuevoPasswordConfirmar] = useState("");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const esAdministrador = user?.roles.some(rol => rol.nombre === "ADMINISTRADOR");

  useEffect(() => {
    if (esAdministrador) {
      cargarUsuarios();
    }
  }, [esAdministrador]);

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const response = await authService.listarUsuarios();
      setUsuarios(response.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const toggleRol = async (usuarioId: number, rolId: number, tieneRol: boolean) => {
    try {
      setUpdatingRoles(usuarioId);
      
      if (tieneRol) {
        // Remover rol - por ahora mostrar mensaje
        toast.info("Funcionalidad de eliminar rol pendiente de implementar");
      } else {
        // Asignar rol
        await authService.asignarRol({ id_usuario: usuarioId, id_rol: rolId });
        toast.success("Rol asignado exitosamente");
        await cargarUsuarios(); // Recargar lista
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar roles");
    } finally {
      setUpdatingRoles(null);
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
      await authService.crearUsuario(nuevoUsuario.trim(), nuevoPassword);
      toast.success("Usuario creado exitosamente");
      setNuevoUsuario("");
      setNuevoPassword("");
      setNuevoPasswordConfirmar("");
      if (esAdministrador) {
        await cargarUsuarios();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear usuario");
    } finally {
      setCreandoUsuario(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
        <p className="text-white/90">Configuración de cuenta y seguridad</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className={`grid w-full max-w-md ${esAdministrador ? 'grid-cols-4' : 'grid-cols-1'}`}>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
          {esAdministrador && <TabsTrigger value="roles">Administrar Roles</TabsTrigger>}
          {esAdministrador && <TabsTrigger value="crear-usuario">Crear Usuario</TabsTrigger>}
          {esAdministrador && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
        </TabsList>

        {/* Perfil Tab */}
        <TabsContent value="perfil" className="mt-6">
          <Card className="max-w-2xl bg-white border-gray-200">
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
                    {user?.roles && user.roles.length > 0 
                      ? user.roles[0].nombre 
                      : "Sin rol asignado"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Usuario</Label>
                  <Input 
                    value={user?.nombre_usuario || ""} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>

                {user?.roles && user.roles.length > 0 && (
                  <div>
                    <Label className="text-gray-600">Roles Asignados</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.roles.map((rol) => (
                        <div
                          key={rol.id_rol}
                          className="px-3 py-2 bg-[#0F8F5B] text-white rounded-lg text-sm font-medium"
                        >
                          {rol.nombre}
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

        {/* Roles Tab - Solo para administradores */}
        {esAdministrador && (
          <TabsContent value="roles" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Administrar Roles de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsuarios ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usuarios.map((usuario) => (
                      <div 
                        key={usuario.id_usuario}
                        className="p-4 border border-gray-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{usuario.nombre_usuario}</h3>
                          </div>
                          {updatingRoles === usuario.id_usuario && (
                            <span className="text-sm text-blue-600">Actualizando...</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Roles asignados:</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {ROLES_DISPONIBLES.map((rol) => {
                              const tieneRol = usuario.roles.some(r => r.id_rol === rol.id_rol);
                              return (
                                <div key={rol.id_rol} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`usuario-${usuario.id_usuario}-rol-${rol.id_rol}`}
                                    checked={tieneRol}
                                    onCheckedChange={() => toggleRol(usuario.id_usuario, rol.id_rol, tieneRol)}
                                    disabled={updatingRoles === usuario.id_usuario}
                                  />
                                  <label
                                    htmlFor={`usuario-${usuario.id_usuario}-rol-${rol.id_rol}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {rol.nombre}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Descripción de Roles
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li><strong>EJECUTIVO:</strong> Gestiona benefactores (crear, editar, ver)</li>
                        <li><strong>ADMINISTRADOR:</strong> Acceso completo, aprueba solicitudes y gestiona configuración</li>
                        <li><strong>EJECUTIVO_SOCIAL:</strong> Gestiona casos sociales</li>
                        <li><strong>EJECUTIVO_CONTABLE:</strong> Gestiona cartera y cobros</li>
                      </ul>
                      <p className="text-xs text-blue-700 mt-2">
                        Un usuario puede tener múltiples roles asignados
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Crear Usuario Tab - Solo para administradores */}
        {esAdministrador && (
          <TabsContent value="crear-usuario" className="mt-6">
            <Card className="max-w-2xl bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Crear Nuevo Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearUsuario} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nuevo-usuario">Nombre de usuario</Label>
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
                    <Label htmlFor="nuevo-password">Contraseña</Label>
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
                    <Label htmlFor="nuevo-password-confirmar">Confirmar contraseña</Label>
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
                    <Button type="submit" disabled={creandoUsuario}>
                      {creandoUsuario ? "Creando..." : "Crear usuario"}
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
        {esAdministrador && (
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios y Roles
                  </div>
                  <Button variant="outline" size="sm" onClick={cargarUsuarios} disabled={loadingUsuarios}>
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
                        className="p-4 border border-gray-200 rounded-lg flex items-start justify-between gap-4"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900">{usuario.nombre_usuario}</h3>
                          <p className="text-sm text-gray-600">{usuario.roles.length > 0 ? `${usuario.roles.length} rol(es)` : "Sin roles"}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {usuario.roles.length > 0 ? (
                            usuario.roles.map((rol) => (
                              <div
                                key={`${usuario.id_usuario}-${rol.id_rol}`}
                                className="px-3 py-2 bg-[#0F8F5B] text-white rounded-lg text-sm font-medium"
                              >
                                {rol.nombre}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                              Sin roles
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
      </Tabs>
    </div>
  );
}