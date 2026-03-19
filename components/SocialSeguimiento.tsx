import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, FileText, RefreshCw, Trash2, Upload, User2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import socialService from "../services/social.service";
import type { BeneficiarioSocial, SeguimientoSocial } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { ProtectedAction } from "./ProtectedAction";

const TIPOS_EVENTO = [
  "Visita domiciliaria",
  "Entrega de apoyo",
  "Llamada telefonica",
  "Coordinacion externa",
  "Actualizacion de caso",
  "Cierre de caso",
  "Otro",
];

function normalizarTipoEvento(v: string) {
  const map: Record<string, string> = {
    "Llamada telefonica": "Llamada telefónica",
    "Coordinacion externa": "Coordinación externa",
    "Actualizacion de caso": "Actualización de caso",
  };
  return map[v] || v;
}

function badgeEstado(estado?: string) {
  if (estado === "Activo") return "bg-green-600 text-white";
  if (estado === "Cerrado") return "bg-gray-500 text-white";
  return "bg-gray-400 text-white";
}

const API_BASE = "http://154.12.234.100:3000";

function buildSeguimientoFileUrl(rutaArchivo?: string) {
  if (!rutaArchivo) return "";
  const normalized = rutaArchivo.split("/").map(encodeURIComponent).join("/");
  return `${API_BASE}/uploads/seguimiento/${normalized}`;
}

function isPdf(nombre?: string) {
  return (nombre || "").toLowerCase().endsWith(".pdf");
}

export default function SocialSeguimiento() {
  const { permisos } = useAuth();
  const puedeLeer = (permisos?.social_ingresar ?? false) || (permisos?.social_administrar ?? false);
  const puedeEscribir = puedeLeer;

  const [casos, setCasos] = useState<BeneficiarioSocial[]>([]);
  const [loadingCasos, setLoadingCasos] = useState(false);
  const [casoSeleccionado, setCasoSeleccionado] = useState<string>("");
  const [seguimientos, setSeguimientos] = useState<SeguimientoSocial[]>([]);
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [nuevo, setNuevo] = useState({
    tipo_evento: "",
    descripcion: "",
    fecha_evento: new Date().toISOString().slice(0, 10),
  });

  const cargarCasos = async () => {
    try {
      setLoadingCasos(true);
      const response = await socialService.obtenerCasosSociales();
      const lista: BeneficiarioSocial[] = Array.isArray(response?.beneficiarios)
        ? response.beneficiarios.map((caso: BeneficiarioSocial) => ({
            ...caso,
            estado: String(caso.estado) === "En seguimiento" ? "Activo" : caso.estado,
          }))
        : [];
      setCasos(lista);
      if (!casoSeleccionado && lista.length > 0) {
        setCasoSeleccionado(String(lista[0].id_beneficiario_social));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar casos");
      setCasos([]);
    } finally {
      setLoadingCasos(false);
    }
  };

  const cargarSeguimientos = async (idCaso: number) => {
    try {
      setLoadingSeguimientos(true);
      const response = await socialService.obtenerSeguimiento(idCaso);
      setSeguimientos(Array.isArray(response?.seguimientos) ? response.seguimientos : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar seguimientos");
      setSeguimientos([]);
    } finally {
      setLoadingSeguimientos(false);
    }
  };

  useEffect(() => {
    if (!puedeLeer) return;
    cargarCasos();
  }, [puedeLeer]);

  useEffect(() => {
    if (!casoSeleccionado) return;
    cargarSeguimientos(Number(casoSeleccionado));
  }, [casoSeleccionado]);

  const handleAgregar = async () => {
    if (!casoSeleccionado || !nuevo.tipo_evento || !nuevo.descripcion.trim()) {
      toast.error("Completa tipo de evento y descripcion");
      return;
    }
    try {
      setSaving(true);
      await socialService.agregarSeguimiento(
        Number(casoSeleccionado),
        normalizarTipoEvento(nuevo.tipo_evento),
        nuevo.descripcion,
        nuevo.fecha_evento,
        fotos
      );
      toast.success("Seguimiento agregado");
      setNuevo((prev) => ({ ...prev, descripcion: "", tipo_evento: "" }));
      setFotos([]);
      await cargarSeguimientos(Number(casoSeleccionado));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al agregar seguimiento");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (idSeguimiento: number) => {
    if (!confirm("Eliminar este seguimiento?")) return;
    try {
      await socialService.eliminarSeguimiento(idSeguimiento);
      toast.success("Seguimiento eliminado");
      if (casoSeleccionado) await cargarSeguimientos(Number(casoSeleccionado));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al eliminar seguimiento");
    }
  };

  const casoActual = casos.find((c) => String(c.id_beneficiario_social) === casoSeleccionado);

  const seguimientosFiltrados = useMemo(() => {
    const term = filtroTexto.trim().toLowerCase();
    if (!term) return seguimientos;
    return seguimientos.filter((seg) =>
      (seg.tipo_evento || "").toLowerCase().includes(term) ||
      (seg.descripcion || "").toLowerCase().includes(term) ||
      (seg.responsable || "").toLowerCase().includes(term)
    );
  }, [seguimientos, filtroTexto]);

  const totalAdjuntos = useMemo(
    () => seguimientos.reduce((acc, seg) => acc + (Array.isArray(seg.fotos) ? seg.fotos.length : 0), 0),
    [seguimientos]
  );

  if (!puedeLeer) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-xl text-gray-800 mb-2">Acceso denegado</h2>
        <p className="text-gray-600">No tienes permiso para seguimiento social.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Seguimiento de Casos</h1>
            <p className="text-white/90">Bitacora de seguimiento y evidencias de casos sociales</p>
          </div>
          <Button variant="outline" className="w-full bg-white text-[#1D1D1D] sm:w-auto" onClick={() => casoSeleccionado && cargarSeguimientos(Number(casoSeleccionado))} disabled={loadingSeguimientos || !casoSeleccionado}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingSeguimientos ? "animate-spin" : ""}`} />
            Recargar historial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Casos disponibles</p>
            <p className="text-3xl font-bold text-blue-600">{casos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Seguimientos del caso</p>
            <p className="text-3xl font-bold text-orange-600">{seguimientos.length}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Adjuntos</p>
            <p className="text-3xl font-bold text-gray-800">{totalAdjuntos}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label>Caso social</Label>
              <Select value={casoSeleccionado} onValueChange={setCasoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCasos ? "Cargando casos..." : "Seleccione un caso"} />
                </SelectTrigger>
                <SelectContent>
                  {casos.map((caso) => (
                    <SelectItem key={caso.id_beneficiario_social} value={String(caso.id_beneficiario_social)}>
                      {caso.nombre_completo} ({caso.nombre_usuario_carga || `usuario_${caso.id_usuario_carga}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buscar en historial</Label>
              <Input
                placeholder="Tipo, descripcion o responsable"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                disabled={!casoSeleccionado}
              />
            </div>
          </div>

          {casoActual && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Caso seleccionado</p>
                  <p className="text-lg font-semibold text-gray-900">{casoActual.nombre_completo}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <User2 className="h-4 w-4" />
                    {casoActual.nombre_usuario_carga || `usuario_${casoActual.id_usuario_carga}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{casoActual.ciudad || "-"} · {casoActual.provincia || "-"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={badgeEstado(casoActual.estado)}>{casoActual.estado}</Badge>
                  <Badge className="bg-[#4064E3] text-white">{casoActual.tipo_caso}</Badge>
                </div>
              </div>
              {casoActual.descripcion_caso && (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{casoActual.descripcion_caso}</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ProtectedAction permiso={["social_ingresar", "social_administrar"]}>
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Agregar seguimiento</h2>
                <p className="text-sm text-gray-600">Registra eventos, avances y evidencias del caso</p>
              </div>
              {!puedeEscribir && <Badge className="bg-gray-500 text-white">Solo lectura</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de evento</Label>
                <Select value={nuevo.tipo_evento} onValueChange={(v) => setNuevo((p) => ({ ...p, tipo_evento: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccione evento" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_EVENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha del evento</Label>
                <input
                  type="date"
                  value={nuevo.fecha_evento}
                  onChange={(e) => setNuevo((p) => ({ ...p, fecha_evento: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                rows={4}
                value={nuevo.descripcion}
                onChange={(e) => setNuevo((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Describe la accion realizada, resultado, acuerdos y proximos pasos..."
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos / PDF (opcional)</Label>
              <div className="rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFotos(Array.from(e.target.files || []))}
                  className="w-full text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">Maximo 10 archivos. JPG, PNG o PDF.</p>
                {fotos.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {fotos.map((f) => (
                      <p key={`${f.name}-${f.size}`} className="text-xs text-gray-700 flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5" />
                        {f.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAgregar} disabled={saving || !casoSeleccionado} className="bg-[#4064E3] hover:bg-[#3451C2] text-white">
                {saving ? "Guardando..." : "Agregar seguimiento"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProtectedAction>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Historial</h2>
              <Badge className="bg-gray-200 text-gray-800">{seguimientosFiltrados.length}</Badge>
            </div>
          </div>

          {loadingSeguimientos && <p className="text-gray-500">Cargando seguimientos...</p>}
          {!loadingSeguimientos && casoSeleccionado && seguimientosFiltrados.length === 0 && (
            <div className="py-10 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay seguimientos para este caso.</p>
            </div>
          )}
          {!loadingSeguimientos && !casoSeleccionado && (
            <p className="text-gray-500">Selecciona un caso para ver el historial.</p>
          )}

          <div className="space-y-4">
            {!loadingSeguimientos && seguimientosFiltrados.map((seg) => (
              <div key={seg.id_seguimiento} className="relative border border-gray-200 rounded-xl p-4 bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className="bg-[#1b76b9] text-white">{seg.tipo_evento}</Badge>
                      {seg.tiene_fotos ? <Badge className="bg-purple-600 text-white">Con adjuntos</Badge> : null}
                    </div>
                    <p className="text-sm text-gray-600">
                      Por: <span className="font-medium text-gray-800">{seg.responsable || `usuario_${seg.id_usuario}`}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(seg.fecha_evento).toLocaleDateString("es-EC")}
                    </span>
                    {puedeEscribir && (
                      <Button variant="ghost" size="sm" onClick={() => handleEliminar(seg.id_seguimiento)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{seg.descripcion}</p>

                {Array.isArray(seg.fotos) && seg.fotos.length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Adjuntos ({seg.fotos.length})</p>
                    <div className="space-y-3">
                      {seg.fotos.map((foto) => (
                        <div key={foto.id_foto} className="rounded-md border border-gray-200 bg-white p-2">
                          <p className="text-xs text-gray-700 truncate mb-2">{foto.nombre_archivo}</p>
                          {isPdf(foto.nombre_archivo) ? (
                            <a
                              href={buildSeguimientoFileUrl(foto.ruta_archivo)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#1b76b9] hover:bg-[#155a8a] text-white text-xs"
                              download
                            >
                              Descargar PDF
                            </a>
                          ) : (
                            <a
                              href={buildSeguimientoFileUrl(foto.ruta_archivo)}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={buildSeguimientoFileUrl(foto.ruta_archivo)}
                                alt={foto.nombre_archivo}
                                className="w-full max-w-full sm:max-w-[280px] rounded border border-gray-200 object-cover"
                                loading="lazy"
                              />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
