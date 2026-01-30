import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, FileText, AlertCircle, MapPin, Mail, Phone, User } from "lucide-react";
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
  const { permisos, user } = useAuth();

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

  const puedeAprobar = permisos?.aprobaciones ?? false;

  useEffect(() => {
    loadPendientes();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1D1D1D] mb-2">Aprobaciones</h1>
          <p className="text-gray-600">Gestión de aprobación de registros pendientes</p>
        </div>
        {pendientes.length > 0 && puedeAprobar && (
          <div className="flex gap-2">
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

      {/* Stats */}
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

      {/* Lista */}
      {pendientes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay registros pendientes</h3>
            <p className="text-gray-600">Todos los benefactores han sido revisados</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Vista desktop - Tabla */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Benefactor</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendientes.map((benefactor) => (
                    <TableRow key={benefactor.id_benefactor}>
                      <TableCell className="font-medium">{benefactor.nombre_completo}</TableCell>
                      <TableCell>{benefactor.cedula}</TableCell>
                      <TableCell>
                        <Badge variant={benefactor.tipo_benefactor === "TITULAR" ? "default" : "secondary"}>
                          {benefactor.tipo_benefactor}
                        </Badge>
                      </TableCell>
                      <TableCell>{benefactor.ciudad}</TableCell>
                      <TableCell>{benefactor.fecha_registro ? formatDate(benefactor.fecha_registro) : "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          PENDIENTE
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end flex-wrap">
                          {/* ✅ Preview en Dialog (no redirección) */}
                          <Button size="sm" variant="outline" onClick={() => handleOpenPreview(benefactor.id_benefactor)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>

                          {puedeAprobar ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleOpenDialog(benefactor, "APROBADO")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
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
            <div className="md:hidden p-4 space-y-4">
              {pendientes.map((benefactor) => (
                <Card key={benefactor.id_benefactor} className="border-2 border-orange-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{benefactor.nombre_completo}</p>
                        <p className="text-sm text-gray-600">{benefactor.cedula}</p>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        PENDIENTE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Tipo</p>
                        <Badge variant={benefactor.tipo_benefactor === "TITULAR" ? "default" : "secondary"}>
                          {benefactor.tipo_benefactor}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Ciudad</p>
                        <p className="font-medium">{benefactor.ciudad}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Fecha Registro</p>
                      <p className="text-sm">{benefactor.fecha_registro ? formatDate(benefactor.fecha_registro) : "N/A"}</p>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleOpenPreview(benefactor.id_benefactor)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalles
                      </Button>

                      {puedeAprobar ? (
                        <div className="flex gap-2">
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
          </CardContent>
        </Card>
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
                onChange={(e) => setComentario(e.target.value)}
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
              className={accion === "APROBADO" ? "bg-green-600 hover:bg-green-700" : ""}
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
        <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
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
                          ? "bg-[#0F8F5B] hover:bg-[#0D7A4C]"
                          : "bg-gray-400 hover:bg-gray-500"
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
                        {previewBenefactor.fecha_registro ? formatDate(previewBenefactor.fecha_registro) : "-"}
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
