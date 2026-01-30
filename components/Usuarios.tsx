import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { rolesService } from '../services/roles.service';
import sucursalesService, { Sucursal } from '../services/sucursales.service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { AlertCircle, Plus, UserPlus, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  roles: Array<{ id_rol: number; nombre: string }>;
  id_sucursal?: number;
  sucursal?: {
    id_sucursal: number;
    iniciales: string;
    nombre: string;
  };
}

interface Rol {
  id_rol: number;
  nombre: string;
}

export default function Usuarios() {
  const { user: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para crear usuario
  const [openCrearUsuario, setOpenCrearUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre_usuario: '',
    password: '',
  });

  // Estados para asignar rol
  const [openAsignarRol, setOpenAsignarRol] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState('');

  // Estados para asignar sucursal
  const [openAsignarSucursal, setOpenAsignarSucursal] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes, sucursalesRes] = await Promise.all([
        authService.obtenerUsuarios(),
        rolesService.listarRoles(),
        sucursalesService.listarSucursales(),
      ]);

      setUsuarios(usuariosRes.data || []);
      setRoles(rolesRes.data || []);
      setSucursales(sucursalesRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.crearUsuario(nuevoUsuario);
      setSuccess('Usuario creado exitosamente');
      setOpenCrearUsuario(false);
      setNuevoUsuario({ nombre_usuario: '', password: '' });
      cargarDatos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear usuario');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAsignarRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado || !rolSeleccionado) return;

    try {
      await authService.asignarRol({
        id_usuario: usuarioSeleccionado,
        id_rol: parseInt(rolSeleccionado),
      });
      setSuccess('Rol asignado exitosamente');
      setOpenAsignarRol(false);
      setRolSeleccionado('');
      cargarDatos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar rol');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAsignarSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado || !sucursalSeleccionada) return;

    try {
      await sucursalesService.asignarSucursalUsuario({
        id_usuario: usuarioSeleccionado,
        id_sucursal: parseInt(sucursalSeleccionada),
      });
      setSuccess('Sucursal asignada exitosamente');
      setOpenAsignarSucursal(false);
      setSucursalSeleccionada('');
      cargarDatos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar sucursal');
      setTimeout(() => setError(''), 3000);
    }
  };

  const abrirDialogoAsignarRol = (idUsuario: number) => {
    setUsuarioSeleccionado(idUsuario);
    setOpenAsignarRol(true);
  };

  const abrirDialogoAsignarSucursal = (idUsuario: number) => {
    setUsuarioSeleccionado(idUsuario);
    setOpenAsignarSucursal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y sucursales
          </p>
        </div>
        <Dialog open={openCrearUsuario} onOpenChange={setOpenCrearUsuario}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_usuario">Nombre de Usuario</Label>
                <Input
                  id="nombre_usuario"
                  value={nuevoUsuario.nombre_usuario}
                  onChange={(e) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      nombre_usuario: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      password: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit">Crear Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Total de usuarios: {usuarios.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Vista desktop - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id_usuario}>
                    <TableCell>{usuario.id_usuario}</TableCell>
                    <TableCell className="font-medium">
                      {usuario.nombre_usuario}
                    </TableCell>
                    <TableCell>
                      {usuario.roles && usuario.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usuario.roles.map((rol) => (
                            <Badge key={rol.id_rol} variant="secondary">
                              {rol.nombre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sin rol</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {usuario.sucursal ? (
                        <Badge variant="outline">
                          <Building2 className="mr-1 h-3 w-3" />
                          {usuario.sucursal.iniciales} - {usuario.sucursal.nombre}
                        </Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin sucursal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirDialogoAsignarRol(usuario.id_usuario)}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Rol
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirDialogoAsignarSucursal(usuario.id_usuario)}
                      >
                        <Building2 className="mr-1 h-3 w-3" />
                        Sucursal
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
            {usuarios.map((usuario) => (
              <Card key={usuario.id_usuario} className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500">ID: {usuario.id_usuario}</p>
                      <p className="font-semibold text-lg">{usuario.nombre_usuario}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Roles</p>
                    {usuario.roles && usuario.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map((rol) => (
                          <Badge key={rol.id_rol} variant="secondary">
                            {rol.nombre}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin rol</span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sucursal</p>
                    {usuario.sucursal ? (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {usuario.sucursal.iniciales} - {usuario.sucursal.nombre}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin sucursal</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => abrirDialogoAsignarRol(usuario.id_usuario)}
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      Rol
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => abrirDialogoAsignarSucursal(usuario.id_usuario)}
                    >
                      <Building2 className="mr-1 h-3 w-3" />
                      Sucursal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para asignar rol */}
      <Dialog open={openAsignarRol} onOpenChange={setOpenAsignarRol}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Rol</DialogTitle>
            <DialogDescription>
              Selecciona un rol para asignar al usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAsignarRol} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id_rol} value={rol.id_rol.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Asignar Rol</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para asignar sucursal */}
      <Dialog open={openAsignarSucursal} onOpenChange={setOpenAsignarSucursal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Sucursal</DialogTitle>
            <DialogDescription>
              Selecciona una sucursal para asignar al usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAsignarSucursal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Select
                value={sucursalSeleccionada}
                onValueChange={setSucursalSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales
                    .filter((s) => s.activo)
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
            <DialogFooter>
              <Button type="submit">Asignar Sucursal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
