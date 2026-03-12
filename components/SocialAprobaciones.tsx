import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Eye,
  Search,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import socialService from "../services/social.service";
import type { BeneficiarioSocial, CasoSocialPendiente } from "../types";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

function colorPrioridad(prioridad?: string) {
  if (prioridad === "Alta") return "bg-red-500 text-white";
  if (prioridad === "Media") return "bg-orange-500 text-white";
  if (prioridad === "Baja") return "bg-blue-500 text-white";
  return "bg-gray-500 text-white";
}

const API_BASE = "http://154.12.234.100:3000";

function buildCasoArchivoUrl(rutaArchivo?: string) {
  if (!rutaArchivo) return "";
  const normalized = rutaArchivo.split("/").map(encodeURIComponent).join("/");
  return `${API_BASE}/uploads/social/casos/${normalized}`;
}

export default function SocialAprobaciones() {
  const { permisos } = useAuth();
  const puedeAprobar = permisos?.aprobaciones_social ?? false;

  const [pendientes, setPendientes] = useState<CasoSocialPendiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [accion, setAccion] = useState<"aprobar" | "rechazar">("aprobar");
  const [comentario, setComentario] = useState("");
  const [casoSeleccionado, setCasoSeleccionado] = useState<CasoSocialPendiente | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCaso, setPreviewCaso] = useState<BeneficiarioSocial | null>(null);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const response = await socialService.obtenerCasosPendientes();
      setPendientes(Array.isArray(response?.pendientes) ? response.pendientes : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar aprobaciones sociales");
      setPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (puedeAprobar) cargarPendientes();
  }, [puedeAprobar]);

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, tipoFilter]);

  const abrirAccion = (caso: CasoSocialPendiente, tipo: "aprobar" | "rechazar") => {
    setCasoSeleccionado(caso);
    setAccion(tipo);
    setComentario("");
    setDialogOpen(true);
  };

  const abrirPreview = async (id: number) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewCaso(null);
      const data = await socialService.obtenerCasoSocialPorId(id);
      setPreviewCaso(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar detalle del caso");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmarAccion = async () => {
    if (!casoSeleccionado) return;
    if (accion === "rechazar" && !comentario.trim()) {
      toast.error("El comentario es obligatorio para rechazar");
      return;
    }

    try {
      setSubmitting(true);
      if (accion === "aprobar") {
        await socialService.aprobarCasoSocial(casoSeleccionado.id_beneficiario_social, comentario || undefined);
        toast.success("Caso social aprobado");
      } else {
        await socialService.rechazarCasoSocial(casoSeleccionado.id_beneficiario_social, comentario);
        toast.success("Caso social rechazado");
      }
      setDialogOpen(false);
      await cargarPendientes();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al procesar aprobacion");
    } finally {
      setSubmitting(false);
    }
  };

  const procesarMasivo = async (tipo: "aprobar" | "rechazar") => {
    if (pendientes.length === 0) return;
    const ok = confirm(
      `${tipo === "aprobar" ? "Aprobar" : "Rechazar"} todos los ${pendientes.length} casos pendientes?`
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      let exitos = 0;
      let errores = 0;

      for (const caso of pendientes) {
        try {
          if (tipo === "aprobar") {
            await socialService.aprobarCasoSocial(caso.id_beneficiario_social, "Aprobacion masiva");
          } else {
            await socialService.rechazarCasoSocial(caso.id_beneficiario_social, "Rechazo masivo");
          }
          exitos++;
        } catch {
          errores++;
        }
      }

      toast.success(
        `${exitos} caso(s) ${tipo === "aprobar" ? "aprobados" : "rechazados"}${errores ? `, ${errores} con error` : ""}`
      );
      await cargarPendientes();
    } finally {
      setSubmitting(false);
    }
  };

  const pendientesFiltrados = useMemo(() => {
    return pendientes.filter((caso) => {
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        caso.nombre_completo.toLowerCase().includes(term) ||
        (caso.cedula || "").includes(term) ||
        (caso.nombre_usuario_carga || "").toLowerCase().includes(term) ||
        (caso.tipo_caso || "").toLowerCase().includes(term);

      const matchTipo = tipoFilter === "todos" || caso.tipo_caso === tipoFilter;

      return matchSearch && matchTipo;
    });
  }, [pendientes, searchTerm, tipoFilter]);

  const tiposCaso = useMemo(
    () => Array.from(new Set(pendientes.map((p) => p.tipo_caso).filter(Boolean))).sort(),
    [pendientes]
  );

  const totalPages = Math.max(1, Math.ceil(pendientesFiltrados.length / pageSize));
  const pageSafe = Math.min(pageIndex, totalPages - 1);
  const paginated = pendientesFiltrados.slice(pageSafe * pageSize, pageSafe * pageSize + pageSize);
  const canPreviousPage = pageSafe > 0;
  const canNextPage = pageSafe < totalPages - 1;

  if (!puedeAprobar) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-xl text-gray-800 mb-2">Acceso denegado</h2>
        <p className="text-gray-600">No tienes permiso para aprobaciones sociales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Aprobaciones Social</h1>
            <p className="text-white/90">Gestion de aprobacion de casos sociales pendientes</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendientes.length > 0 && (
              <>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => procesarMasivo("aprobar")} disabled={submitting}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar Todos
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => procesarMasivo("rechazar")} disabled={submitting}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar Todos
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600">{pendientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendientes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por beneficiario, cedula, usuario o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposCaso.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || tipoFilter !== "todos") && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchTerm("");
                  setTipoFilter("todos");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Cargando pendientes...</p>
          </CardContent>
        </Card>
      ) : pendientesFiltrados.length === 0 && pendientes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay casos pendientes</h3>
            <p className="text-gray-600">Todos los casos sociales han sido revisados</p>
          </CardContent>
        </Card>
      ) : pendientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de busqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm [&_tr]:border-gray-200">
          <div className="overflow-x-auto">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[22%] text-center">Beneficiario</TableHead>
                  <TableHead className="w-[10%] text-center">Cedula</TableHead>
                  <TableHead className="w-[18%] text-center">Tipo</TableHead>
                  <TableHead className="w-[12%] text-center">Usuario</TableHead>
                  <TableHead className="w-[10%] text-center">Ciudad</TableHead>
                  <TableHead className="w-[10%] text-center">Fecha Registro</TableHead>
                  <TableHead className="w-[18%] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((caso) => (
                  <TableRow key={caso.id_beneficiario_social}>
                    <TableCell className="font-medium truncate text-center">{caso.nombre_completo}</TableCell>
                    <TableCell className="truncate text-center">{caso.cedula || "N/A"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{caso.tipo_caso}</span>
                        <Badge className={colorPrioridad(caso.prioridad)}>{caso.prioridad}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="truncate text-center">{caso.nombre_usuario_carga || `usuario_${caso.id_usuario_carga}`}</TableCell>
                    <TableCell className="truncate text-center">{caso.ciudad || "-"}</TableCell>
                    <TableCell className="truncate text-center">{caso.fecha_registro ? new Date(caso.fecha_registro).toLocaleDateString("es-EC") : "N/A"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center flex-nowrap">
                        <Button size="sm" variant="outline" className="whitespace-nowrap px-2" onClick={() => abrirPreview(caso.id_beneficiario_social)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap px-2" onClick={() => abrirAccion(caso, "aprobar")}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap px-2" onClick={() => abrirAccion(caso, "rechazar")}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {pageSafe * pageSize + 1} a {Math.min((pageSafe + 1) * pageSize, pendientesFiltrados.length)} de {pendientesFiltrados.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPageIndex(0)} disabled={!canPreviousPage}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPageIndex(pageSafe - 1)} disabled={!canPreviousPage}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">Pagina {pageSafe + 1} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPageIndex(pageSafe + 1)} disabled={!canNextPage}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPageIndex(totalPages - 1)} disabled={!canNextPage}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} por pagina
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {accion === "aprobar" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {accion === "aprobar" ? "Aprobar caso social" : "Rechazar caso social"}
            </DialogTitle>
          </DialogHeader>
          {casoSeleccionado && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50">
                <p className="text-sm text-gray-500">Caso</p>
                <p className="font-medium text-gray-900">{casoSeleccionado.nombre_completo}</p>
                <p className="text-sm text-gray-600">
                  {casoSeleccionado.tipo_caso} | {casoSeleccionado.ciudad || "-"} | {casoSeleccionado.nombre_usuario_carga || `usuario_${casoSeleccionado.id_usuario_carga}`}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Comentario {accion === "rechazar" ? "*" : "(opcional)"}</Label>
                <Textarea rows={4} value={comentario} onChange={(e) => setComentario(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button
              onClick={confirmarAccion}
              disabled={submitting}
              className={accion === "aprobar" ? "bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              variant={undefined}
            >
              {submitting ? "Procesando..." : accion === "aprobar" ? "Confirmar aprobacion" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Detalle del caso social</DialogTitle>
          </DialogHeader>
          {previewLoading && <p className="text-gray-500">Cargando detalle...</p>}
          {!previewLoading && previewCaso && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Beneficiario</p>
                  <p className="font-medium">{previewCaso.nombre_completo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Usuario</p>
                  <p className="font-medium">{previewCaso.nombre_usuario_carga || `usuario_${previewCaso.id_usuario_carga}`}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo de caso</p>
                  <p className="font-medium">{previewCaso.tipo_caso}</p>
                </div>
                <div>
                  <p className="text-gray-500">Prioridad / Estado</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={colorPrioridad(previewCaso.prioridad)}>{previewCaso.prioridad}</Badge>
                    <Badge className="bg-gray-700 text-white">{previewCaso.estado}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Ciudad</p>
                  <p className="font-medium">{previewCaso.ciudad || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefono</p>
                  <p className="font-medium">{previewCaso.telefono || "-"}</p>
                </div>
              </div>
              <Separator />
              {previewCaso.ficha_pdf_ruta && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-gray-700 mb-2">Ficha social adjunta</p>
                  <a
                    href={buildCasoArchivoUrl(previewCaso.ficha_pdf_ruta)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#1b76b9] hover:bg-[#155a8a] text-white text-sm"
                    download
                  >
                    Descargar PDF
                  </a>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-gray-500 text-sm mb-1">Descripcion</p>
                <p className="text-sm whitespace-pre-wrap text-gray-800">{previewCaso.descripcion_caso}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
