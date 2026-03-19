import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, FileText, AlertCircle, MapPin, Mail, Phone, User, Search, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { aprobacionesService } from "../services/aprobaciones.service";
import { benefactoresService } from "../services/benefactores.service";
import { Benefactor, EstadoAprobacion } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function Aprobaciones() {
  const { permisos } = useAuth();

  const [pendientes, setPendientes] = useState<Benefactor[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog aprobar/rechazar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBenefactor, setSelectedBenefactor] = useState<Benefactor | null>(null);
  const [accion, setAccion] = useState<EstadoAprobacion>("APROBADO");
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Dialog preview detalles
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBenefactor, setPreviewBenefactor] = useState<Benefactor | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tieneContratoPreview, setTieneContratoPreview] = useState(false);

  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [sortField, setSortField] = useState<'n_convenio' | 'nombre_completo' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Paginación
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const puedeAprobar = permisos?.aprobaciones ?? false;

  useEffect(() => {
    loadPendientes();
  }, []);

  // Resetear paginación cuando cambian filtros
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, tipoFilter]);

  const loadPendientes = async () => {
    try {
      setLoading(true);
      const response = await aprobacionesService.getPendientes(1, 100);
      setPendientes(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (benefactor: Benefactor, estado: EstadoAprobacion) => {
    setSelectedBenefactor(benefactor);
    setAccion(estado);
    setComentario("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBenefactor) return;

    try {
      setSubmitting(true);
      await aprobacionesService.aprobarRechazar({
        id_benefactor: selectedBenefactor.id_benefactor,
        estado_aprobacion: accion,
        comentario: comentario || undefined,
      });

      toast.success(`Registro ${accion === "APROBADO" ? "aprobado" : "rechazado"} correctamente`);
      setDialogOpen(false);
      loadPendientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al procesar aprobación");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAprobarTodos = async () => {
    if (!confirm(`¿Está seguro de aprobar todos los ${pendientes.length} registros pendientes?`)) return;

    try {
      setSubmitting(true);
      let aprobados = 0;
      let errores = 0;

      for (const benefactor of pendientes) {
        try {
          await aprobacionesService.aprobarRechazar({
            id_benefactor: benefactor.id_benefactor,
            estado_aprobacion: "APROBADO",
            comentario: "Aprobación masiva",
          });
          aprobados++;
        } catch {
          errores++;
        }
      }

      toast.success(`${aprobados} registros aprobados correctamente${errores > 0 ? `. ${errores} errores` : ""}`);
      loadPendientes();
    } catch {
      toast.error("Error al aprobar registros");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazarTodos = async () => {
    if (!confirm(`¿Está seguro de rechazar todos los ${pendientes.length} registros pendientes?`)) return;

    try {
      setSubmitting(true);
      let rechazados = 0;
      let errores = 0;

      for (const benefactor of pendientes) {
        try {
          await aprobacionesService.aprobarRechazar({
            id_benefactor: benefactor.id_benefactor,
            estado_aprobacion: "RECHAZADO",
            comentario: "Rechazo masivo",
          });
          rechazados++;
        } catch {
          errores++;
        }
      }

      toast.success(`${rechazados} registros rechazados correctamente${errores > 0 ? `. ${errores} errores` : ""}`);
      loadPendientes();
    } catch {
      toast.error("Error al rechazar registros");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ✅ abrir preview: traemos detalle por ID + verificamos contrato
  const handleOpenPreview = async (id_benefactor: number) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      setTieneContratoPreview(false);
      setPreviewBenefactor(null);

      // 1) detalle (para mostrar TODO lo ingresado)
      const resp = await benefactoresService.getBenefactorById(id_benefactor);
      setPreviewBenefactor(resp.data);

      // 2) verificar contrato (para saber si mostramos iframe)
      try {
        const existe = await benefactoresService.verificarContrato(id_benefactor);
        setTieneContratoPreview(Boolean(existe));
      } catch {
        setTieneContratoPreview(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar detalles del benefactor");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewContratoUrl = useMemo(() => {
    if (!previewBenefactor?.id_benefactor) return "";
    return benefactoresService.getContratoUrl(previewBenefactor.id_benefactor);
  }, [previewBenefactor?.id_benefactor]);

  // Ordenamiento
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  // Filtrado y ordenamiento
  const pendientesFiltrados = useMemo(() => {
    let filtered = pendientes.filter((item) => {
      const matchSearch =
        item.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cedula || "").includes(searchTerm) ||
        (item.n_convenio || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipo = tipoFilter === "todos" || item.tipo_benefactor === tipoFilter;

      return matchSearch && matchTipo;
    });

    // Ordenar
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';

        if (sortField === 'n_convenio') {
          aValue = (a.n_convenio || a.cedula || '').toLowerCase();
          bValue = (b.n_convenio || b.cedula || '').toLowerCase();
        } else if (sortField === 'nombre_completo') {
          aValue = a.nombre_completo.toLowerCase();
          bValue = b.nombre_completo.toLowerCase();
        }

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [pendientes, searchTerm, tipoFilter, sortField, sortDirection]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return pendientesFiltrados.slice(startIndex, endIndex);
  }, [pendientesFiltrados, pageIndex, pageSize]);

  const totalPages = Math.ceil(pendientesFiltrados.length / pageSize);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F8F5B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Aprobaciones</h1>
            <p className="text-white/90">Gestión de aprobación de registros pendientes</p>
          </div>
          {pendientes.length > 0 && puedeAprobar && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAprobarTodos} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar Todos
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRechazarTodos} disabled={submitting}>
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar Todos
            </Button>
          </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      {pendientes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, cédula o N° convenio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="TITULAR">Titular</SelectItem>
                <SelectItem value="DEPENDIENTE">Dependiente</SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || tipoFilter !== "todos") && (
              <Button
                variant="outline"
                size="icon"
                className="w-full xl:w-10"
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

      {/* Lista */}
      {pendientesFiltrados.length === 0 && pendientes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay registros pendientes</h3>
            <p className="text-gray-600">Todos los benefactores han sido revisados</p>
          </CardContent>
        </Card>
      ) : pendientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-800">Registros pendientes de revisión</p>
                <p>Revisa la información antes de aprobar o rechazar cada solicitud.</p>
              </div>
              <Badge className="w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
                {pendientesFiltrados.length} pendiente{pendientesFiltrados.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          {/* Vista desktop - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[1080px] table-fixed">
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead
                      className="w-[11%] cursor-pointer select-none px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-100"
                      onClick={() => handleSort('n_convenio')}
                    >
                      <div className="flex items-center justify-center">
                        N° Convenio
                        {renderSortIcon('n_convenio')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="w-[17%] cursor-pointer select-none px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-100"
                      onClick={() => handleSort('nombre_completo')}
                    >
                      <div className="flex items-center justify-center">
                        Benefactor
                        {renderSortIcon('nombre_completo')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[12%] text-center">Cédula</TableHead>
                    <TableHead className="w-[9%] text-center">Tipo</TableHead>
                    <TableHead className="w-[11%] text-center">Ejecutivo</TableHead>
                    <TableHead className="w-[11%] text-center">Fecha Registro</TableHead>
                    <TableHead className="w-[29%] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.map((benefactor) => (
                    <TableRow key={benefactor.id_benefactor} className="border-slate-200 transition-colors hover:bg-slate-50/80">
                      <TableCell className="px-4 py-4 text-center font-mono text-sm font-semibold text-slate-700">{benefactor.n_convenio || "N/A"}</TableCell>
                      <TableCell className="px-4 py-4 text-center font-semibold text-slate-900">{benefactor.nombre_completo}</TableCell>
                      <TableCell className="px-4 py-4 text-center font-mono text-sm text-slate-600">{benefactor.cedula}</TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <Badge className="mx-auto min-w-[96px] justify-center" variant={benefactor.tipo_benefactor === "TITULAR" ? "default" : "secondary"}>
                          {benefactor.tipo_benefactor}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{benefactor.ejecutivo || "N/A"}</TableCell>
                      <TableCell className="px-4 py-4 text-center text-sm text-slate-600">{benefactor.fecha_suscripcion ? formatDate(benefactor.fecha_suscripcion) : "N/A"}</TableCell>

                      <TableCell className="px-4 py-4 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          {/* ✅ Preview en Dialog (no redirección) */}
                          <Button size="sm" variant="outline" className="rounded-full border-slate-300 px-3 text-slate-700 hover:bg-slate-100" onClick={() => handleOpenPreview(benefactor.id_benefactor)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalles
                          </Button>

                          {puedeAprobar ? (
                            <>
                              <Button
                                size="sm"
                                className="rounded-full bg-green-600 px-3 text-white hover:bg-green-700"
                                onClick={() => handleOpenDialog(benefactor, "APROBADO")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-full bg-red-600 px-3 text-white hover:bg-red-700"
                                onClick={() => handleOpenDialog(benefactor, "RECHAZADO")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary">Solo lectura</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="md:hidden p-4 sm:p-6 space-y-4">
              {paginatedData.map((benefactor) => (
                <Card key={benefactor.id_benefactor} className="overflow-hidden border border-slate-200 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-slate-900">{benefactor.nombre_completo}</p>
                        <p className="text-sm text-slate-600">{benefactor.cedula}</p>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        PENDIENTE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">N° Convenio</p>
                        <p className="font-medium">{benefactor.n_convenio || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tipo</p>
                        <Badge variant={benefactor.tipo_benefactor === "TITULAR" ? "default" : "secondary"}>
                          {benefactor.tipo_benefactor}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Ejecutivo</p>
                        <p className="font-medium">{benefactor.ejecutivo || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha Registro</p>
                        <p className="text-sm">{benefactor.fecha_suscripcion ? formatDate(benefactor.fecha_suscripcion) : "N/A"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleOpenPreview(benefactor.id_benefactor)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalles
                      </Button>

                      {puedeAprobar ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            onClick={() => handleOpenDialog(benefactor, "APROBADO")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white flex-1"
                            onClick={() => handleOpenDialog(benefactor, "RECHAZADO")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="w-full justify-center">Solo lectura</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          {/* Paginación */}
          {pendientesFiltrados.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Mostrando {pageIndex * pageSize + 1} a{" "}
                {Math.min((pageIndex + 1) * pageSize, pendientesFiltrados.length)} de {pendientesFiltrados.length} registros
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300"
                  onClick={() => setPageIndex(0)}
                  disabled={!canPreviousPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300"
                  onClick={() => setPageIndex(pageIndex - 1)}
                  disabled={!canPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm font-medium text-slate-600">
                  Página {pageIndex + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300"
                  onClick={() => setPageIndex(pageIndex + 1)}
                  disabled={!canNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300"
                  onClick={() => setPageIndex(totalPages - 1)}
                  disabled={!canNextPage}
                >
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
                <SelectTrigger className="w-full sm:w-36 border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Dialog aprobar/rechazar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accion === "APROBADO" ? "Aprobar" : "Rechazar"} Registro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Benefactor</p>
              <p className="font-semibold">{selectedBenefactor?.nombre_completo}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Cédula</p>
              <p className="font-semibold">{selectedBenefactor?.cedula}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentario">Comentario {accion === "RECHAZADO" && "(Requerido)"}</Label>
              <Textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value.toUpperCase())}
                placeholder="Ingrese un comentario sobre la decisión..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              className={accion === "APROBADO" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              variant={accion === "RECHAZADO" ? "destructive" : "default"}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Procesando..." : accion === "APROBADO" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Dialog preview detalles (pop-out) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Vista previa del Benefactor
            </DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4064E3] mx-auto"></div>
              <p className="mt-3 text-gray-600">Cargando detalles...</p>
            </div>
          ) : !previewBenefactor ? (
            <div className="py-10 text-center text-gray-600">No se pudo cargar la información.</div>
          ) : (
            <div className="space-y-6">
              {/* Header info */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1D]">{previewBenefactor.nombre_completo}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      className={
                        previewBenefactor.estado === "ACTIVO"
                          ? "bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white"
                          : "bg-gray-400 hover:bg-gray-500 text-white"
                      }
                    >
                      {previewBenefactor.estado}
                    </Badge>
                    <Badge variant="outline" className="border-[#4064E3] text-[#4064E3]">
                      {previewBenefactor.tipo_benefactor}
                    </Badge>
                    {previewBenefactor.n_convenio && (
                      <span className="text-sm text-gray-600 font-mono">{previewBenefactor.n_convenio}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                      <User className="h-4 w-4" />
                      Información personal
                    </div>
                    <Separator />

                    <div>
                      <p className="text-sm text-gray-600">Cédula</p>
                      <p className="font-medium">{previewBenefactor.cedula}</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Correo</p>
                        <p className="font-medium">{previewBenefactor.email || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-medium">{previewBenefactor.telefono || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-medium">{previewBenefactor.direccion || "-"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Ciudad</p>
                        <p className="font-medium">{previewBenefactor.ciudad || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Provincia</p>
                        <p className="font-medium">{previewBenefactor.provincia || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                      <FileText className="h-4 w-4" />
                      Información administrativa
                    </div>
                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Inscripción</p>
                        <p className="font-semibold">
                          ${Number(previewBenefactor.inscripcion || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Aporte</p>
                        <p className="font-semibold">
                          ${Number(previewBenefactor.aporte || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Tipo de afiliación</p>
                      <p className="font-medium">{previewBenefactor.tipo_afiliacion || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Mes de producción</p>
                      <p className="font-medium">{previewBenefactor.mes_prod || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Fecha registro</p>
                      <p className="font-medium">
                        {previewBenefactor.fecha_suscripcion ? formatDate(previewBenefactor.fecha_suscripcion) : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Contrato</p>
                      {tieneContratoPreview ? (
                        <Badge className="bg-green-500 text-white">PDF cargado</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin contrato
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PDF preview */}
              <Card className="border-gray-200">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <FileText className="h-4 w-4" />
                    Contrato del Benefactor
                  </div>

                  {tieneContratoPreview ? (
                    <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <iframe
                        src={previewContratoUrl}
                        className="w-full h-[520px]"
                        title="Contrato PDF"
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        Este registro no tiene contrato PDF cargado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
