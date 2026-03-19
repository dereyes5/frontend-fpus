import { useState, useEffect } from "react";
import { User, Shield, UserCog, Users, Building2, Plus, Pencil, Trash2, Lock, RefreshCw, CheckCircle2, XCircle, MapPin, Landmark, Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Bancos from "./Bancos";
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
import { fotoPerfilService } from "../services/fotoPerfil.service";
import { aparienciaService, type AparienciaData } from "../services/apariencia.service";
import { DEFAULT_LOGIN_CAROUSEL, DEFAULT_LOGIN_LOGO } from "../config/aparienciaDefaults";
import { toast } from "sonner";
import { PermisosGranulares } from "../types";

interface UsuarioConPermisos {
  id_usuario: number;
  nombre_usuario: string;
  cargo?: string;
  activo?: boolean;
  fecha_inactivacion?: string | null;
  permisos?: PermisosGranulares | null;
  id_sucursal?: number;
  sucursal?: {
    id_sucursal: number;
    iniciales: string;
    nombre: string;
  } | null;
}

export default function Configuracion() {
  const { user, permisos } = useAuth();

  // Estados para administracion de usuarios y permisos
  const [usuarios, setUsuarios] = useState<UsuarioConPermisos[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [updatingPermisos, setUpdatingPermisos] = useState<number | null>(null);

  // Estados para creacion de usuarios
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoPasswordConfirmar, setNuevoPasswordConfirmar] = useState("");
  const [nuevoCargo, setNuevoCargo] = useState("AGENTE");
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(true);

  // Estados para sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [openCrearSucursal, setOpenCrearSucursal] = useState(false);
  const [openEditarSucursal, setOpenEditarSucursal] = useState(false);
  const [openAsignarSucursal, setOpenAsignarSucursal] = useState(false);
  const [openConfirmarDeshabilitarUsuario, setOpenConfirmarDeshabilitarUsuario] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState<number | null>(null);
  const [usuarioPendienteDeshabilitar, setUsuarioPendienteDeshabilitar] = useState<UsuarioConPermisos | null>(null);
  const [sucursalIdAsignar, setSucursalIdAsignar] = useState("");
  const [formSucursal, setFormSucursal] = useState<CrearSucursalDto>({
    iniciales: "",
    nombre: "",
    activo: true,
  });

  // Estados para foto de perfil
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [keyFoto, setKeyFoto] = useState(Date.now()); // Para forzar refresh de la imagen
  const [apariencia, setApariencia] = useState<AparienciaData | null>(null);
  const [cargandoApariencia, setCargandoApariencia] = useState(false);
  const [guardandoApariencia, setGuardandoApariencia] = useState(false);
  const [logoArchivo, setLogoArchivo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [carruselArchivos, setCarruselArchivos] = useState<Array<File | null>>([]);
  const [carruselPreviews, setCarruselPreviews] = useState<Array<string | null>>([]);
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
      const response = await authService.obtenerUsuarios(incluirInactivos);
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

  const limpiarObjectUrl = (url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  const validarImagen = (file: File): boolean => {
    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      toast.error("Solo se permiten imagenes JPG, PNG o WEBP");
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 8MB");
      return false;
    }
    return true;
  };

  const cargarApariencia = async () => {
    try {
      setCargandoApariencia(true);
      const response = await aparienciaService.obtenerPublica();
      const data = response.data;
      setApariencia(data);
      setCarruselArchivos(Array.from({ length: data.carousel.length }, () => null));
      setCarruselPreviews(Array.from({ length: data.carousel.length }, () => null));
    } catch {
      toast.error("No se pudo cargar la configuracion de apariencia");
    } finally {
      setCargandoApariencia(false);
    }
  };

  useEffect(() => {
    if (puedeConfigurar) {
      cargarApariencia();
    }
  }, [puedeConfigurar]);

  useEffect(() => {
    return () => {
      limpiarObjectUrl(logoPreview);
      carruselPreviews.forEach((preview) => limpiarObjectUrl(preview));
    };
  }, [logoPreview, carruselPreviews]);

  const seleccionarLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !validarImagen(file)) return;

    limpiarObjectUrl(logoPreview);
    setLogoArchivo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const seleccionarCarrusel = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !validarImagen(file)) return;

    setCarruselArchivos((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
    setCarruselPreviews((prev) => {
      const next = [...prev];
      limpiarObjectUrl(next[index]);
      next[index] = URL.createObjectURL(file);
      return next;
    });
  };

  const agregarSlotCarrusel = () => {
    setCarruselArchivos((prev) => [...prev, null]);
    setCarruselPreviews((prev) => [...prev, null]);
  };

  const guardarLogo = async () => {
    if (!logoArchivo) {
      toast.error("Selecciona un logo primero");
      return;
    }

    try {
      setGuardandoApariencia(true);
      const response = await aparienciaService.subirLogo(logoArchivo);
      setApariencia(response.data);
      setLogoArchivo(null);
      limpiarObjectUrl(logoPreview);
      setLogoPreview(null);
      toast.success("Logo actualizado exitosamente");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar logo");
    } finally {
      setGuardandoApariencia(false);
    }
  };

  const eliminarLogoApariencia = async () => {
    if (!confirm("¿Deseas eliminar el logo configurado?")) return;
    try {
      setGuardandoApariencia(true);
      const response = await aparienciaService.eliminarLogo();
      setApariencia(response.data);
      setLogoArchivo(null);
      limpiarObjectUrl(logoPreview);
      setLogoPreview(null);
      toast.success("Logo eliminado");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar logo");
    } finally {
      setGuardandoApariencia(false);
    }
  };

  const guardarImagenCarrusel = async (index: number) => {
    const file = carruselArchivos[index];
    if (!file) {
      toast.error("Selecciona una imagen primero");
      return;
    }

    try {
      setGuardandoApariencia(true);
      const tieneRemota = index < (apariencia?.carousel?.length || 0);
      const response = tieneRemota
        ? await aparienciaService.subirCarrusel(index, file)
        : await aparienciaService.agregarCarrusel(file);

      const data = response.data;
      setApariencia(data);
      setCarruselArchivos(Array.from({ length: data.carousel.length }, () => null));
      setCarruselPreviews((prev) => {
        prev.forEach((preview) => limpiarObjectUrl(preview));
        return Array.from({ length: data.carousel.length }, () => null);
      });
      toast.success(tieneRemota ? `Imagen ${index + 1} actualizada` : "Imagen agregada al carrusel");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar carrusel");
    } finally {
      setGuardandoApariencia(false);
    }
  };

  const eliminarImagenCarrusel = async (index: number) => {
    const tieneRemota = index < (apariencia?.carousel?.length || 0);
    if (!confirm(`Deseas eliminar la imagen ${index + 1} del carrusel?`)) return;

    if (!tieneRemota) {
      setCarruselArchivos((prev) => prev.filter((_, i) => i !== index));
      setCarruselPreviews((prev) => {
        const preview = prev[index];
        limpiarObjectUrl(preview || null);
        return prev.filter((_, i) => i !== index);
      });
      return;
    }

    try {
      setGuardandoApariencia(true);
      const response = await aparienciaService.eliminarCarrusel(index);
      const data = response.data;
      setApariencia(data);
      setCarruselArchivos(Array.from({ length: data.carousel.length }, () => null));
      setCarruselPreviews((prev) => {
        prev.forEach((preview) => limpiarObjectUrl(preview));
        return Array.from({ length: data.carousel.length }, () => null);
      });
      toast.success(`Imagen ${index + 1} eliminada`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar imagen");
    } finally {
      setGuardandoApariencia(false);
    }
  };

  // Funcion para actualizar un permiso individual
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
        benefactores_ingresar: false,
        benefactores_administrar: false,
        social_ingresar: false,
        social_administrar: false,
        configuraciones: false,
        aprobaciones: false,
        aprobaciones_social: false,
      };

      // Crear objeto con todos los permisos, cambiando solo el que se esta toggling
      const permisosActualizados = {
        cartera_lectura: permisosBase.cartera_lectura ?? false,
        cartera_escritura: permisosBase.cartera_escritura ?? false,
        benefactores_ingresar: permisosBase.benefactores_ingresar ?? false,
        benefactores_administrar: permisosBase.benefactores_administrar ?? false,
        social_ingresar: permisosBase.social_ingresar ?? false,
        social_administrar: permisosBase.social_administrar ?? false,
        configuraciones: permisosBase.configuraciones ?? false,
        aprobaciones: permisosBase.aprobaciones ?? false,
        aprobaciones_social: permisosBase.aprobaciones_social ?? false,
        [permiso]: !valorActual, // Toggle el permiso especifico
      };

      if (permiso === "benefactores_administrar" && !valorActual) {
        permisosActualizados.benefactores_ingresar = true;
      }

      if (permiso === "benefactores_ingresar" && valorActual) {
        permisosActualizados.benefactores_administrar = false;
      }

      if (permiso === "social_administrar" && !valorActual) {
        permisosActualizados.social_ingresar = true;
      }

      if (permiso === "social_ingresar" && valorActual) {
        permisosActualizados.social_administrar = false;
      }

      await authService.actualizarPermisos(usuarioId, permisosActualizados);

      // Actualizar solo el usuario especifico en el estado local (sin recargar toda la lista)
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
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (nuevoPassword !== nuevoPasswordConfirmar) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    try {
      setCreandoUsuario(true);
      await authService.crearUsuario({
        nombre_usuario: nuevoUsuario.trim(),
        password: nuevoPassword,
        cargo: (nuevoCargo || "AGENTE").toUpperCase().trim(),
      });
      toast.success("Usuario creado exitosamente");
      setNuevoUsuario("");
      setNuevoPassword("");
      setNuevoPasswordConfirmar("");
      setNuevoCargo("AGENTE");
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
    if (!confirm("¿Estas seguro de desactivar esta sucursal?")) return;

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

  // Funciones de foto de perfil
  useEffect(() => {
    if (user?.id_usuario) {
      setFotoPerfilUrl(fotoPerfilService.obtenerUrl(user.id_usuario));
    }
  }, [user, keyFoto]);

  useEffect(() => {
    if (puedeConfigurar) {
      cargarUsuarios();
    }
  }, [incluirInactivos]);

  const handleSubirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imagenes JPG, PNG o WEBP');
      return;
    }

    // Validar tamano (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      await fotoPerfilService.subirFoto(file);
      toast.success('Foto de perfil actualizada exitosamente');
      setKeyFoto(Date.now()); // Forzar refresh
      // Disparar evento para actualizar en Layout
      window.dispatchEvent(new Event('fotoPerfilActualizada'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!confirm('¿Estas seguro de eliminar tu foto de perfil?')) return;

    try {
      await fotoPerfilService.eliminarFoto();
      toast.success('Foto de perfil eliminada exitosamente');
      setKeyFoto(Date.now()); // Forzar refresh
      // Disparar evento para actualizar en Layout
      window.dispatchEvent(new Event('fotoPerfilActualizada'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar la foto');
    }
  };

  const handleEditarUsuarioAdmin = async (usuario: UsuarioConPermisos) => {
    const nombre_usuario = prompt("Nuevo nombre de usuario:", usuario.nombre_usuario)?.trim();
    if (!nombre_usuario) return;

    const cargo = prompt("Cargo del usuario:", (usuario.cargo || "AGENTE").toUpperCase())?.trim().toUpperCase();
    if (!cargo) return;

    try {
      await authService.actualizarUsuarioAdmin(usuario.id_usuario, { nombre_usuario, cargo });
      toast.success("Usuario actualizado");
      await cargarUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar usuario");
    }
  };

  const handleResetPasswordAdmin = async (usuario: UsuarioConPermisos) => {
    const password_nueva = prompt(`Nueva contrasena para ${usuario.nombre_usuario}:`) || "";
    if (!password_nueva) return;
    if (password_nueva.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    try {
      await authService.cambiarPasswordUsuarioAdmin(usuario.id_usuario, { password_nueva });
      toast.success("Contrasena actualizada");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar contrasena");
    }
  };

  const handleCambiarEstadoUsuario = async (usuario: UsuarioConPermisos, activo: boolean) => {
    if (!activo) {
      setUsuarioPendienteDeshabilitar(usuario);
      setOpenConfirmarDeshabilitarUsuario(true);
      return;
    }

    try {
      await authService.cambiarEstadoUsuario(usuario.id_usuario, activo);
      toast.success(`Usuario ${activo ? "activado" : "deshabilitado"} correctamente`);
      await cargarUsuarios();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al cambiar estado del usuario"
      );
    }
  };

  const confirmarDeshabilitarUsuario = async () => {
    if (!usuarioPendienteDeshabilitar) return;

    try {
      await authService.cambiarEstadoUsuario(usuarioPendienteDeshabilitar.id_usuario, false);
      toast.success("Usuario deshabilitado correctamente");
      setOpenConfirmarDeshabilitarUsuario(false);
      setUsuarioPendienteDeshabilitar(null);
      await cargarUsuarios();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al cambiar estado del usuario"
      );
    }
  };

  const handleEliminarUsuarioSoft = async (usuario: UsuarioConPermisos) => {
    if (!confirm(`Deseas inactivar (eliminacion logica) al usuario ${usuario.nombre_usuario}?`)) return;
    try {
      await authService.eliminarUsuarioSoft(usuario.id_usuario);
      toast.success("Usuario inactivado correctamente");
      await cargarUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar usuario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Configuracion</h1>
        <p className="text-white/90">Configuracion de cuenta y seguridad</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className={`flex h-auto min-w-max flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm ${puedeConfigurar ? 'w-full' : 'max-w-md'}`}>
          <TabsTrigger value="perfil" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
            <User className="h-4 w-4" />
            Mi Perfil
          </TabsTrigger>
          {puedeConfigurar && (
            <TabsTrigger value="roles" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Administrar Roles</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="crear-usuario" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Crear Usuario</span>
              <span className="sm:hidden">Crear</span>
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="usuarios" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="sucursales" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <Building2 className="h-4 w-4" />
              Sucursales
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="bancos" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <Landmark className="h-4 w-4" />
              Bancos
            </TabsTrigger>
          )}
          {puedeConfigurar && (
            <TabsTrigger value="apariencia" className="min-w-[140px] flex-1 text-xs sm:text-sm py-2.5 px-3 gap-2 xl:flex-none">
              <ImageIcon className="h-4 w-4" />
              Apariencia
            </TabsTrigger>
          )}
          </TabsList>
        </div>

        {/* Perfil Tab */}
        <TabsContent value="perfil" className="mt-6">
          <Card className="w-full max-w-2xl bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacion del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[#1b76b9] flex items-center justify-center border-4 border-gray-200 shadow-lg">
                    {fotoPerfilUrl ? (
                      <img
                        key={keyFoto}
                        src={`${fotoPerfilUrl}&t=${keyFoto}`}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                        onError={() => setFotoPerfilUrl(null)}
                      />
                    ) : (
                      <span className="text-white text-5xl font-bold">
                        {user?.nombre_usuario.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="foto-perfil-input"
                    className="absolute bottom-0 right-0 bg-[#0F8F5B] hover:bg-[#0d7a4d] text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    <input
                      id="foto-perfil-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleSubirFoto}
                      disabled={subiendoFoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-semibold text-gray-900">{user?.nombre_usuario}</h3>
                  <p className="text-gray-600 mt-1">{user?.cargo || "AGENTE"}</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    <label htmlFor="foto-perfil-input-btn">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={subiendoFoto}
                        className="gap-2 cursor-pointer"
                        onClick={() => document.getElementById('foto-perfil-input')?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {fotoPerfilUrl ? 'Cambiar foto' : 'Subir foto'}
                      </Button>
                    </label>
                    {fotoPerfilUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEliminarFoto}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar foto
                      </Button>
                    )}
                  </div>
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

                <div>
                  <Label className="text-gray-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Cargo
                  </Label>
                  <Input
                    value={(user?.cargo || "AGENTE").toUpperCase()}
                    disabled
                    className="bg-gray-50 mt-1"
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
                  El cargo es administrado solo por usuarios con permisos de configuracion.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permisos Tab - Gestion de permisos granulares */}
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
                    {/* Descripcion del sistema */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">
                            Sistema de Permisos Granulares
                          </h4>
                          <p className="text-sm text-blue-800">
                            Controla el acceso de cada usuario a modulos especificos.
                            Los cambios se aplican inmediatamente pero requieren que el usuario vuelva a iniciar sesion.
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
                                  Ver informacion de cartera y aportes
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

                            {/* Benefactores Ingresar */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-benefactores_ingresar`}
                                checked={usuario.permisos?.benefactores_ingresar ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario,
                                  'benefactores_ingresar',
                                  usuario.permisos?.benefactores_ingresar ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-benefactores_ingresar`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Benefactores (Ingresar)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver, crear y editar solo los benefactores propios
                                </p>
                              </div>
                            </div>

                            {/* Benefactores Administrar */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-benefactores_administrar`}
                                checked={usuario.permisos?.benefactores_administrar ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario,
                                  'benefactores_administrar',
                                  usuario.permisos?.benefactores_administrar ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-benefactores_administrar`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Benefactores (Administrar)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver, crear y editar todos los benefactores del sistema
                                </p>
                              </div>
                            </div>

                            {/* Social Ingresar */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-social_ingresar`}
                                checked={usuario.permisos?.social_ingresar ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario,
                                  'social_ingresar',
                                  usuario.permisos?.social_ingresar ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-social_ingresar`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Social (Ingresar)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver, crear y editar solo los casos y seguimientos propios
                                </p>
                              </div>
                            </div>

                            {/* Social Administrar */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-social_administrar`}
                                checked={usuario.permisos?.social_administrar ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario,
                                  'social_administrar',
                                  usuario.permisos?.social_administrar ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-social_administrar`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Social (Administrar)
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ver, crear y editar todos los casos y seguimientos del sistema
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
                                  Acceso completo al modulo de configuracion
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

                            {/* Aprobaciones Social */}
                            <div className="flex items-start space-x-3 p-3 bg-white rounded border border-gray-200">
                              <Checkbox
                                id={`usuario-${usuario.id_usuario}-aprobaciones_social`}
                                checked={usuario.permisos?.aprobaciones_social ?? false}
                                onCheckedChange={() => togglePermiso(
                                  usuario.id_usuario,
                                  'aprobaciones_social',
                                  usuario.permisos?.aprobaciones_social ?? false
                                )}
                                disabled={updatingPermisos === usuario.id_usuario}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`usuario-${usuario.id_usuario}-aprobaciones_social`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  Aprobaciones Social
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Aprobar o rechazar casos sociales
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
                    <Label htmlFor="nuevo-cargo" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Cargo
                    </Label>
                    <Input
                      id="nuevo-cargo"
                      value={nuevoCargo}
                      onChange={(e) => setNuevoCargo(e.target.value.toUpperCase())}
                      placeholder="AGENTE"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Contrasena
                    </Label>
                    <Input
                      id="nuevo-password"
                      type="password"
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nuevo-password-confirmar" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirmar contrasena
                    </Label>
                    <Input
                      id="nuevo-password-confirmar"
                      type="password"
                      value={nuevoPasswordConfirmar}
                      onChange={(e) => setNuevoPasswordConfirmar(e.target.value)}
                      placeholder="Repite la contrasena"
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
                        Despues de crear el usuario, asignale roles en la pestana SAdministrar Rolesâ¬.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Usuarios Tab - Solo para administradores */}
        {puedeConfigurar && (
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion de Usuarios
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={incluirInactivos ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncluirInactivos((prev) => !prev)}
                    >
                      {incluirInactivos ? "Mostrando inactivos" : "Ocultando inactivos"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={cargarUsuarios} disabled={loadingUsuarios} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                      {loadingUsuarios ? "Actualizando..." : "Actualizar"}
                    </Button>
                  </div>
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
                        className="p-4 border border-gray-200 rounded-lg flex flex-col gap-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{usuario.nombre_usuario}</h3>
                            <p className="text-sm text-gray-600">
                              Cargo: {(usuario.cargo || "AGENTE").toUpperCase()}
                            </p>
                          </div>
                          <div>
                            {usuario.activo !== false ? (
                              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">ACTIVO</span>
                            ) : (
                              <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">INACTIVO</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditarUsuarioAdmin(usuario)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => handleResetPasswordAdmin(usuario)}>
                            <Lock className="h-4 w-4" />
                            Reset password
                          </Button>
                          {usuario.activo !== false ? (
                            <Button variant="outline" size="sm" className="gap-2 text-orange-700" onClick={() => handleCambiarEstadoUsuario(usuario, false)}>
                              <XCircle className="h-4 w-4" />
                              Deshabilitar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-2 text-green-700" onClick={() => handleCambiarEstadoUsuario(usuario, true)}>
                              <CheckCircle2 className="h-4 w-4" />
                              Reactivar
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleEliminarUsuarioSoft(usuario)}
                            disabled={usuario.activo === false}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar (soft)
                          </Button>
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
              {/* Card para gestion de sucursales */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Gestion de Sucursales
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
                                  <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${sucursal.activo
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

                      {/* Vista movil - Cards */}
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
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${sucursal.activo
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

                      {/* Vista movil - Cards */}
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
                    Ingresa los datos de la nueva sucursal. Las iniciales deben ser unicas.
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
                        onChange={(e) => setFormSucursal({ ...formSucursal, nombre: e.target.value.toUpperCase() })}
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
                        onChange={(e) => setFormSucursal({ ...formSucursal, nombre: e.target.value.toUpperCase() })}
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

        {/* Apariencia Tab */}
        {puedeConfigurar && (
          <TabsContent value="apariencia" className="mt-6">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#0f5f96] to-[#2d8cc4] text-white">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Apariencia de login
                  </CardTitle>
                  <p className="text-sm text-white/90">
                    Administra logo y carrusel con vista previa en tiempo real.
                  </p>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                  <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-800">Logo institucional</p>
                      <div className="rounded-xl border border-slate-200 shadow-sm p-3 bg-[linear-gradient(45deg,#eef2f7_25%,#ffffff_25%,#ffffff_50%,#eef2f7_50%,#eef2f7_75%,#ffffff_75%,#ffffff_100%)] bg-[length:20px_20px]">
                        <div className="h-32 rounded-lg bg-slate-900/85 flex items-center justify-center overflow-hidden">
                          <img
                            src={logoPreview || aparienciaService.resolverUrl(apariencia?.logo?.url) || DEFAULT_LOGIN_LOGO}
                            alt="Preview logo"
                            className="max-h-full max-w-full object-contain p-3 drop-shadow-[0_8px_20px_rgba(255,255,255,0.25)]"
                          />
                        </div>
                      </div>
                      <Input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={seleccionarLogo} />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={guardarLogo} disabled={!logoArchivo || guardandoApariencia} className="gap-2">
                          <Upload className="h-4 w-4" />
                          Guardar logo
                        </Button>
                        <Button type="button" variant="outline" onClick={eliminarLogoApariencia} disabled={!apariencia?.logo?.filename || guardandoApariencia}>
                          Eliminar
                        </Button>
                        <Button type="button" variant="outline" onClick={cargarApariencia} disabled={cargandoApariencia}>
                          {cargandoApariencia ? "Actualizando..." : "Recargar"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">Carrusel del login</p>
                        <Button type="button" variant="outline" className="gap-2" onClick={agregarSlotCarrusel}>
                          <Plus className="h-4 w-4" />
                          Agregar imagen
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Puedes agregar todas las imagenes que necesites. Se muestran en el orden listado.
                      </p>
                      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                        {Array.from({
                          length: Math.max(
                            carruselArchivos.length,
                            apariencia?.carousel?.length || 0,
                            (apariencia?.carousel?.length || 0) === 0 ? DEFAULT_LOGIN_CAROUSEL.length : 0
                          )
                        }, (_, index) => {
                          const urlRemota = aparienciaService.resolverUrl(apariencia?.carousel?.[index]?.url);
                          const urlBase = urlRemota || ((apariencia?.carousel?.length || 0) === 0 ? DEFAULT_LOGIN_CAROUSEL[index] : null);
                          const preview = carruselPreviews[index] || urlBase;
                          const tieneArchivoLocal = Boolean(carruselArchivos[index]);
                          const tieneRemota = Boolean(apariencia?.carousel?.[index]?.filename);
                          const puedeEliminar = tieneRemota || tieneArchivoLocal;

                          return (
                            <Card key={index} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-sm text-slate-800">Slide {index + 1}</p>
                                  {!tieneRemota && !tieneArchivoLocal && (apariencia?.carousel?.length || 0) === 0 && DEFAULT_LOGIN_CAROUSEL[index] && (
                                    <span className="text-[11px] px-2 py-1 rounded bg-sky-100 text-sky-800">Predeterminada</span>
                                  )}
                                </div>
                                <div className="h-36 rounded-lg overflow-hidden bg-slate-100 border">
                                  {preview ? (
                                    <img src={preview} alt={`Preview carrusel ${index + 1}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Sin imagen</div>
                                  )}
                                </div>
                                <Input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={(event) => seleccionarCarrusel(index, event)} />
                                <div className="flex gap-2">
                                  <Button type="button" size="sm" onClick={() => guardarImagenCarrusel(index)} disabled={!tieneArchivoLocal || guardandoApariencia} className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Guardar
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => eliminarImagenCarrusel(index)} disabled={!puedeEliminar || guardandoApariencia}>
                                    Eliminar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Bancos Tab */}
        {puedeConfigurar && (
          <TabsContent value="bancos" className="mt-6">
            <Bancos />
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={openConfirmarDeshabilitarUsuario}
        onOpenChange={(open) => {
          setOpenConfirmarDeshabilitarUsuario(open);
          if (!open) {
            setUsuarioPendienteDeshabilitar(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Deshabilitar usuario</DialogTitle>
            <DialogDescription>
              {usuarioPendienteDeshabilitar
                ? `Estas a punto de deshabilitar a ${usuarioPendienteDeshabilitar.nombre_usuario}. El usuario no podra volver a iniciar sesion mientras permanezca inactivo.`
                : "Confirma la deshabilitacion del usuario."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Antes de continuar, verifica que el usuario no tenga benefactores activos ni casos sociales abiertos.
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenConfirmarDeshabilitarUsuario(false);
                setUsuarioPendienteDeshabilitar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#B42318] hover:bg-[#912018] text-white"
              onClick={confirmarDeshabilitarUsuario}
            >
              Deshabilitar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






