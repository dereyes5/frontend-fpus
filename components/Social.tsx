import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, AlertCircle, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedAction } from "./ProtectedAction";
import socialService from "../services/social.service";
import type { BeneficiarioSocial, SeguimientoSocial } from "../types";
import { toast } from "sonner";

type CasoSocialUI = {
  id: number;
  beneficiario: string;
  tipoCaso: BeneficiarioSocial["tipo_caso"];
  prioridad: BeneficiarioSocial["prioridad"];
  estado: BeneficiarioSocial["estado"];
  usuarioCarga: string;
  fechaInicio: string;
  descripcion: string;
  ciudad: string;
};

type HistorialItemUI = {
  id: number;
  fecha: string;
  accion: string;
  responsable: string;
  notas: string;
};

const TIPOS_CASO: BeneficiarioSocial["tipo_caso"][] = [
  "Apoyo alimentario",
  "Apoyo medico" as BeneficiarioSocial["tipo_caso"],
  "Vivienda",
  "Educacion" as BeneficiarioSocial["tipo_caso"],
  "Apoyo psicologico" as BeneficiarioSocial["tipo_caso"],
  "Otro",
];

const PRIORIDADES: BeneficiarioSocial["prioridad"][] = ["Alta", "Media", "Baja"];

function normalizeTipoCaso(tipo: string): BeneficiarioSocial["tipo_caso"] {
  const map: Record<string, BeneficiarioSocial["tipo_caso"]> = {
    "Apoyo alimentario": "Apoyo alimentario",
    "Apoyo medico": "Apoyo m\u00e9dico",
    "Apoyo m\u00e9dico": "Apoyo m\u00e9dico",
    "Vivienda": "Vivienda",
    "Educacion": "Educaci\u00f3n",
    "Educaci\u00f3n": "Educaci\u00f3n",
    "Apoyo psicologico": "Apoyo psicol\u00f3gico",
    "Apoyo psicol\u00f3gico": "Apoyo psicol\u00f3gico",
    "Otro": "Otro",
  };
  return map[tipo] || "Otro";
}

function normalizeUpperAsciiText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export default function Social() {
  const navigate = useNavigate();
  const { permisos } = useAuth();
  const puedeLeer = permisos?.social_lectura ?? false;
  const puedeEscribir = permisos?.social_escritura ?? false;

  const [casos, setCasos] = useState<CasoSocialUI[]>([]);
  const [loadingCasos, setLoadingCasos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [prioridadFilter, setPrioridadFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<CasoSocialUI | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historial, setHistorial] = useState<HistorialItemUI[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [savingCaso, setSavingCaso] = useState(false);
  const [nuevoCaso, setNuevoCaso] = useState({
    nombre_completo: "",
    tipo_caso: "",
    prioridad: "",
    descripcion_caso: "",
    ciudad: "",
    telefono: "",
    email: "",
    direccion: "",
    provincia: "",
  });

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString("es-EC");
  };

  const mapCaso = (item: BeneficiarioSocial): CasoSocialUI => ({
    id: item.id_beneficiario_social,
    beneficiario: item.nombre_completo,
    tipoCaso: item.tipo_caso,
    prioridad: item.prioridad,
    estado: item.estado,
    usuarioCarga: item.nombre_usuario_carga || `usuario_${item.id_usuario_carga}`,
    fechaInicio: formatearFecha(item.fecha_inicio),
    descripcion: item.descripcion_caso,
    ciudad: item.ciudad || "-",
  });

  const cargarCasos = async () => {
    try {
      setLoadingCasos(true);
      const response = await socialService.obtenerCasosSociales();
      const lista = Array.isArray(response?.beneficiarios) ? response.beneficiarios : [];
      setCasos(lista.map(mapCaso));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar casos sociales");
      setCasos([]);
    } finally {
      setLoadingCasos(false);
    }
  };

  useEffect(() => {
    if (!puedeLeer) return;
    cargarCasos();
  }, [puedeLeer]);

  useEffect(() => {
    if (!showHistorial || !selectedCaso) return;

    const cargarHistorial = async () => {
      try {
        setLoadingHistorial(true);
        const response = await socialService.obtenerSeguimiento(selectedCaso.id);
        const lista: SeguimientoSocial[] = Array.isArray(response?.seguimientos) ? response.seguimientos : [];
        setHistorial(
          lista.map((item) => ({
            id: item.id_seguimiento,
            fecha: formatearFecha(item.fecha_evento),
            accion: item.tipo_evento,
            responsable: item.responsable || `usuario_${item.id_usuario}`,
            notas: item.descripcion,
          }))
        );
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Error al cargar historial");
        setHistorial([]);
      } finally {
        setLoadingHistorial(false);
      }
    };

    cargarHistorial();
  }, [showHistorial, selectedCaso]);

  const handleCrearCaso = async () => {
    if (!nuevoCaso.nombre_completo || !nuevoCaso.tipo_caso || !nuevoCaso.prioridad || !nuevoCaso.descripcion_caso) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    try {
      setSavingCaso(true);
      await socialService.crearCasoSocial({
        nombre_completo: normalizeUpperAsciiText(nuevoCaso.nombre_completo).trim(),
        tipo_caso: normalizeTipoCaso(nuevoCaso.tipo_caso),
        prioridad: nuevoCaso.prioridad as BeneficiarioSocial["prioridad"],
        descripcion_caso: nuevoCaso.descripcion_caso,
        ciudad: nuevoCaso.ciudad || undefined,
        telefono: nuevoCaso.telefono || undefined,
        email: nuevoCaso.email || undefined,
        direccion: nuevoCaso.direccion || undefined,
        provincia: nuevoCaso.provincia || undefined,
      });
      toast.success("Caso social registrado");
      setIsDialogOpen(false);
      setNuevoCaso({
        nombre_completo: "",
        tipo_caso: "",
        prioridad: "",
        descripcion_caso: "",
        ciudad: "",
        telefono: "",
        email: "",
        direccion: "",
        provincia: "",
      });
      await cargarCasos();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || "Error al registrar caso social";
      toast.error(msg);
    } finally {
      setSavingCaso(false);
    }
  };

  const filteredCasos = casos.filter((caso) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      caso.beneficiario.toLowerCase().includes(term) ||
      caso.tipoCaso.toLowerCase().includes(term) ||
      caso.usuarioCarga.toLowerCase().includes(term);
    const matchesEstado = estadoFilter === "todos" || caso.estado === estadoFilter;
    const matchesPrioridad = prioridadFilter === "todos" || caso.prioridad === prioridadFilter;
    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      "Activo": "bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white",
      "En seguimiento": "bg-yellow-500 hover:bg-yellow-600 text-white",
      "Cerrado": "bg-gray-400 hover:bg-gray-500 text-white",
    };
    return colors[estado] || "bg-gray-400 text-white";
  };

  const getPrioridadBadge = (prioridad: string) => {
    const colors: Record<string, string> = {
      "Alta": "bg-red-500 hover:bg-red-600 text-white",
      "Media": "bg-orange-500 hover:bg-orange-600 text-white",
      "Baja": "bg-blue-500 hover:bg-blue-600 text-white",
    };
    return colors[prioridad] || "bg-gray-400 text-white";
  };

  const casosActivos = casos.filter((c) => c.estado === "Activo").length;
  const casosEnSeguimiento = casos.filter((c) => c.estado === "En seguimiento").length;
  const casosCerrados = casos.filter((c) => c.estado === "Cerrado").length;

  if (!puedeLeer) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-xl text-gray-800 mb-2">Acceso denegado</h2>
        <p className="text-gray-600">No tienes permiso para visualizar casos sociales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1D1D1D] mb-2">Gestion de Casos Sociales</h1>
          <p className="text-gray-600">Gestion de casos sociales y seguimiento</p>
        </div>
        <div className="flex gap-2">
          <ProtectedAction permiso="social_escritura">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar caso social
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Caso Social</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre completo *</Label>
                      <Input
                        value={nuevoCaso.nombre_completo}
                        onChange={(e) =>
                          setNuevoCaso((p) => ({
                            ...p,
                            nombre_completo: normalizeUpperAsciiText(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefono</Label>
                      <Input value={nuevoCaso.telefono} onChange={(e) => setNuevoCaso((p) => ({ ...p, telefono: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de caso *</Label>
                      <Select value={nuevoCaso.tipo_caso} onValueChange={(v) => setNuevoCaso((p) => ({ ...p, tipo_caso: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_CASO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad *</Label>
                      <Select value={nuevoCaso.prioridad} onValueChange={(v) => setNuevoCaso((p) => ({ ...p, prioridad: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccione prioridad" /></SelectTrigger>
                        <SelectContent>
                          {PRIORIDADES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input value={nuevoCaso.ciudad} onChange={(e) => setNuevoCaso((p) => ({ ...p, ciudad: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Provincia</Label>
                      <Input value={nuevoCaso.provincia} onChange={(e) => setNuevoCaso((p) => ({ ...p, provincia: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={nuevoCaso.email} onChange={(e) => setNuevoCaso((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Direccion</Label>
                    <Input value={nuevoCaso.direccion} onChange={(e) => setNuevoCaso((p) => ({ ...p, direccion: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripcion del caso *</Label>
                    <Textarea rows={4} value={nuevoCaso.descripcion_caso} onChange={(e) => setNuevoCaso((p) => ({ ...p, descripcion_caso: e.target.value }))} />
                  </div>
                  <p className="text-xs text-gray-500">El usuario creador se asigna automaticamente con tu sesion.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={savingCaso}>Cancelar</Button>
                  <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white" onClick={handleCrearCaso} disabled={savingCaso}>
                    {savingCaso ? "Guardando..." : "Registrar caso"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ProtectedAction>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">Casos Activos</p><p className="text-3xl text-[#1D1D1D]">{casosActivos}</p></div><div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">En Seguimiento</p><p className="text-3xl text-[#1D1D1D]">{casosEnSeguimiento}</p></div><div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">Casos Cerrados</p><p className="text-3xl text-[#1D1D1D]">{casosCerrados}</p></div><div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por beneficiario, tipo o usuario" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las prioridades</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Beneficiario</TableHead>
                <TableHead>Tipo de Caso</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCasos.map((caso) => (
                <TableRow key={caso.id}>
                  <TableCell>{caso.beneficiario}</TableCell>
                  <TableCell>{caso.tipoCaso}</TableCell>
                  <TableCell><Badge className={getPrioridadBadge(caso.prioridad)}>{caso.prioridad}</Badge></TableCell>
                  <TableCell><Badge className={getEstadoBadge(caso.estado)}>{caso.estado}</Badge></TableCell>
                  <TableCell>{caso.usuarioCarga}</TableCell>
                  <TableCell><span className="text-sm text-gray-600">{caso.ciudad}</span></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCaso(caso); setShowHistorial(true); }}>Ver detalle</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!loadingCasos && filteredCasos.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron casos con los filtros aplicados</div>}
        {loadingCasos && <div className="text-center py-12 text-gray-500">Cargando casos sociales...</div>}
      </div>

      <div className="text-sm text-gray-600">Mostrando {filteredCasos.length} de {casos.length} casos</div>

      {selectedCaso && (
        <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Detalle del Caso Social</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-600">Beneficiario</p><p className="text-lg text-[#1D1D1D]">{selectedCaso.beneficiario}</p></div>
                <div className="flex gap-2"><Badge className={getPrioridadBadge(selectedCaso.prioridad)}>{selectedCaso.prioridad}</Badge><Badge className={getEstadoBadge(selectedCaso.estado)}>{selectedCaso.estado}</Badge></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600 mb-1">Tipo de caso</p><p className="text-[#1D1D1D]">{selectedCaso.tipoCaso}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Ciudad</p><p className="text-[#1D1D1D]">{selectedCaso.ciudad}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Fecha de inicio</p><p className="text-[#1D1D1D]">{selectedCaso.fechaInicio}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Usuario</p><p className="text-[#1D1D1D]">{selectedCaso.usuarioCarga}</p></div>
              </div>
              <div><p className="text-sm text-gray-600 mb-2">Descripcion</p><p className="text-[#1D1D1D] text-sm p-4 bg-gray-50 rounded-lg">{selectedCaso.descripcion}</p></div>
              <Separator />
              <div>
                <h3 className="text-[#1D1D1D] mb-4 flex items-center gap-2"><Clock className="h-5 w-5" />Historial de Seguimiento</h3>
                {!puedeEscribir && <p className="text-xs text-gray-500 mb-3">Modo solo lectura: no puedes agregar seguimiento.</p>}
                <div className="space-y-4">
                  {loadingHistorial && <p className="text-sm text-gray-500 text-center py-4">Cargando historial...</p>}
                  {!loadingHistorial && historial.map((item) => (
                    <div key={item.id} className="relative pl-8 pb-4 border-l-2 border-[#0F8F5B] last:border-transparent">
                      <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-[#0F8F5B] border-2 border-white" />
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div><p className="text-sm text-[#1D1D1D]">{item.accion}</p><p className="text-xs text-gray-600">Por: {item.responsable}</p></div>
                          <span className="text-xs text-gray-500">{item.fecha}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{item.notas}</p>
                      </div>
                    </div>
                  ))}
                  {!loadingHistorial && historial.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay historial de seguimiento disponible</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistorial(false)}>Cerrar</Button>
              {puedeEscribir && <Button className="bg-[#4064E3] hover:bg-[#3451C2] text-white" onClick={() => navigate("/social/seguimiento")}>Agregar seguimiento</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
