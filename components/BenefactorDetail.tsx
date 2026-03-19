import { useParams, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Users, DollarSign, FileText, AlertCircle, TrendingUp, Upload, Download, X, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { benefactoresService } from "../services/benefactores.service";
import { cobrosService } from "../services/cobros.service";
import { gruposCobroExternoService } from "../services/gruposCobroExterno.service";
import { useAuth } from "../contexts/AuthContext";
import { Benefactor, GrupoCobroExterno, HistorialPago, SaldoBenefactor, VinculacionCartera } from "../types";
import { toast } from "sonner";

export default function BenefactorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permisos } = useAuth();
  const puedeEditar = (permisos?.benefactores_ingresar ?? false) || (permisos?.benefactores_administrar ?? false);
  const formSelectTriggerClass =
    "h-11 rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm transition focus:ring-2 focus:ring-sky-100 hover:border-slate-400";
  const [benefactor, setBenefactor] = useState<Benefactor | null>(null);
  const [historialPagos, setHistorialPagos] = useState<HistorialPago[]>([]);
  const [saldo, setSaldo] = useState<SaldoBenefactor | null>(null);
  const [dependientes, setDependientes] = useState<Benefactor[]>([]);
  const [titular, setTitular] = useState<Benefactor | null>(null);
  const [gruposCobroExterno, setGruposCobroExterno] = useState<GrupoCobroExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [tieneContrato, setTieneContrato] = useState(false);
  const [subiendoContrato, setSubiendoContrato] = useState(false);
  const [dialogContratoOpen, setDialogContratoOpen] = useState(false);
  const [tieneCancelacion, setTieneCancelacion] = useState(false);
  const [dialogCancelacionOpen, setDialogCancelacionOpen] = useState(false);
  const [subiendoCancelacion, setSubiendoCancelacion] = useState(false);
  const [cancelacionFile, setCancelacionFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelacionInputRef = useRef<HTMLInputElement>(null);

  // Estados para edición
  const [dialogEditarOpen, setDialogEditarOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({
    nombre_completo: "",
    cedula: "",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    nacionalidad: "",
    estado_civil: "",
    fecha_nacimiento: "",
    fecha_suscripcion: "",
    tipo_afiliacion: "individual",
    corporacion: "",
    cuenta: "",
    num_cuenta_tc: "",
    tipo_cuenta: "",
    banco_emisor: "",
    mes_prod: "",
    inscripcion: "0.00",
    aporte: "0.00",
    observacion: "",
    id_grupo_cobro_externo: "",
  });
  const [vinculacionCarteraEdit, setVinculacionCarteraEdit] = useState<VinculacionCartera>("cuenta_propia");

  useEffect(() => {
    if (id) {
      loadBenefactor();
      loadHistorialPagos();
      loadSaldo();
      verificarContrato();
      verificarCancelacion();
      loadGruposCobroExterno();
    }
  }, [id]);

  useEffect(() => {
    console.log('🔍 Benefactor cargado:', {
      tipo: benefactor?.tipo_benefactor,
      id_titular: benefactor?.id_titular,
      nombre: benefactor?.nombre_completo
    });

    if (benefactor?.tipo_benefactor === 'TITULAR') {
      console.log('✅ Es TITULAR - cargando dependientes...');
      loadDependientes();
    } else if (benefactor?.tipo_benefactor === 'DEPENDIENTE' && benefactor?.id_titular) {
      console.log('✅ Es DEPENDIENTE - cargando titular con id:', benefactor.id_titular);
      loadTitular(benefactor.id_titular);
    } else {
      console.log('⚠️ No se cumple ninguna condición');
    }
  }, [benefactor]);

  const loadGruposCobroExterno = async () => {
    if (!esDependienteActual && vinculacionCarteraEdit === "grupo_externo" && !formEdit.id_grupo_cobro_externo) {
      toast.error("Seleccione un grupo externo para este benefactor");
      return;
    }

    try {
      const response = await gruposCobroExternoService.getAll();
      setGruposCobroExterno(response.data);
    } catch (error) {
      console.error("Error al cargar grupos externos:", error);
    }
  };

  const loadBenefactor = async () => {
    try {
      setLoading(true);
      const response = await benefactoresService.getBenefactorById(Number(id));
      console.log('🏦 Benefactor completo desde API:', response.data);
      console.log('🔑 Campos financieros:', {
        tipo_afiliacion: response.data.tipo_afiliacion,
        cuenta: response.data.cuenta,
        banco_emisor: response.data.banco_emisor,
        num_cuenta_tc: response.data.num_cuenta_tc,
        tipo_cuenta: response.data.tipo_cuenta,
      });
      setBenefactor(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar benefactor");
      navigate("/benefactores");
    } finally {
      setLoading(false);
    }
  };

  const loadHistorialPagos = async () => {
    try {
      const response = await cobrosService.getHistorialBenefactor(Number(id));
      setHistorialPagos(response.data);
    } catch (error) {
    }
  };

  const loadSaldo = async () => {
    try {
      const response = await cobrosService.getSaldoBenefactor(Number(id));
      setSaldo(response.data);
    } catch (error) {
    }
  };

  const loadDependientes = async () => {
    try {
      const response = await benefactoresService.getDependientes(Number(id));
      setDependientes(response.data);
    } catch (error) {
    }
  };

  const loadTitular = async (idTitular: number) => {
    try {
      console.log('📡 Cargando titular con ID:', idTitular);
      const response = await benefactoresService.getBenefactorById(idTitular);
      console.log('✅ Titular cargado:', response.data);
      setTitular(response.data);
    } catch (error) {
      console.error('❌ Error al cargar titular:', error);
    }
  };

  const verificarContrato = async () => {
    try {
      const existe = await benefactoresService.verificarContrato(Number(id));
      setTieneContrato(existe);
    } catch (error) {
      setTieneContrato(false);
    }
  };

  const verificarCancelacion = async () => {
    try {
      const existe = await benefactoresService.verificarCancelacion(Number(id));
      setTieneCancelacion(existe);
    } catch (error) {
      setTieneCancelacion(false);
    }
  };

  const handleSubirContrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    try {
      setSubiendoContrato(true);
      await benefactoresService.subirContrato(Number(id), file);
      toast.success('Contrato subido exitosamente');
      setTieneContrato(true);
      setDialogContratoOpen(false);
      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir el contrato');
    } finally {
      setSubiendoContrato(false);
    }
  };

  const handleDescargarContrato = () => {
    const url = benefactoresService.getContratoUrl(Number(id));
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrato-${benefactor?.nombre_completo}.pdf`;
    link.click();
  };

  const handleEliminarContrato = async () => {
    if (!confirm('¿Está seguro de eliminar el contrato?')) return;

    try {
      await benefactoresService.eliminarContrato(Number(id));
      toast.success('Contrato eliminado exitosamente');
      setTieneContrato(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar el contrato');
    }
  };

  const handleSubirCancelacion = async () => {
    if (!cancelacionFile) {
      toast.error('Debe seleccionar el PDF de cancelacion');
      return;
    }

    if (cancelacionFile.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    if (cancelacionFile.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    try {
      setSubiendoCancelacion(true);
      await benefactoresService.subirCancelacion(Number(id), cancelacionFile);
      toast.success('Benefactor cancelado exitosamente');
      setDialogCancelacionOpen(false);
      setCancelacionFile(null);
      if (cancelacionInputRef.current) {
        cancelacionInputRef.current.value = '';
      }
      await Promise.all([loadBenefactor(), verificarCancelacion()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar benefactor');
    } finally {
      setSubiendoCancelacion(false);
    }
  };

  const handleDescargarCancelacion = () => {
    const url = benefactoresService.getCancelacionUrl(Number(id));
    const link = document.createElement('a');
    link.href = url;
    link.download = `cancelacion-${benefactor?.nombre_completo}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4064E3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando benefactor...</p>
        </div>
      </div>
    );
  }

  if (!benefactor) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Benefactor no encontrado</h3>
        <Button onClick={() => navigate("/benefactores")}>Volver a benefactores</Button>
      </div>
    );
  }

  // Calcular total aportado desde el saldo
  const totalAportado = saldo?.total_pagado ? parseFloat(saldo.total_pagado) : 0;
  const esDependienteActual = benefactor.tipo_benefactor === 'DEPENDIENTE';
  const esGrupoExternoActual = Boolean(benefactor.id_grupo_cobro_externo);
  const esAprobado = benefactor.estado_registro === 'APROBADO';

  // Función para enmascarar número de cuenta/tarjeta (mostrar solo últimos 4 dígitos)
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return `${masked}${lastFour}`;
  };

  const handleAbrirEdicion = () => {
    if (benefactor) {
      setFormEdit({
        nombre_completo: benefactor.nombre_completo || "",
        cedula: benefactor.cedula || "",
        telefono: benefactor.telefono || "",
        email: benefactor.email || "",
        direccion: benefactor.direccion || "",
        ciudad: benefactor.ciudad || "",
        provincia: benefactor.provincia || "",
        nacionalidad: benefactor.nacionalidad || "",
        estado_civil: benefactor.estado_civil || "",
        fecha_nacimiento: benefactor.fecha_nacimiento ? String(benefactor.fecha_nacimiento).slice(0, 10) : "",
        fecha_suscripcion: benefactor.fecha_suscripcion ? String(benefactor.fecha_suscripcion).slice(0, 10) : "",
        tipo_afiliacion: benefactor.tipo_afiliacion || "individual",
        corporacion: benefactor.corporacion || "",
        cuenta: benefactor.cuenta || "",
        num_cuenta_tc: benefactor.num_cuenta_tc || "",
        tipo_cuenta: benefactor.tipo_cuenta || "",
        banco_emisor: benefactor.banco_emisor || "",
        mes_prod: benefactor.mes_prod || "",
        inscripcion: benefactor.inscripcion !== undefined ? String(benefactor.inscripcion) : "0.00",
        aporte: benefactor.aporte !== undefined ? String(benefactor.aporte) : "0.00",
        observacion: benefactor.observacion || "",
        id_grupo_cobro_externo: benefactor.id_grupo_cobro_externo ? String(benefactor.id_grupo_cobro_externo) : "",
      });
      setVinculacionCarteraEdit(
        benefactor.tipo_benefactor === "DEPENDIENTE"
          ? "dependiente_fundacion"
          : benefactor.id_grupo_cobro_externo
            ? "grupo_externo"
            : "cuenta_propia"
      );
      setDialogEditarOpen(true);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!id) return;

    if (!formEdit.nombre_completo.trim()) {
      toast.error("El nombre completo es obligatorio");
      return;
    }

    if (!formEdit.cedula.trim()) {
      toast.error("La cédula es obligatoria");
      return;
    }

    if (!formEdit.direccion.trim()) {
      toast.error("La dirección es obligatoria");
      return;
    }

    if (!formEdit.ciudad.trim() || !formEdit.provincia.trim()) {
      toast.error("Ciudad y provincia son obligatorias");
      return;
    }

    if (formEdit.tipo_afiliacion === "corporativo" && !formEdit.corporacion.trim()) {
      toast.error("La corporación es obligatoria para afiliación corporativa");
      return;
    }

    try {
      setEditando(true);
      const payload = {
        nombre_completo: formEdit.nombre_completo.trim(),
        cedula: formEdit.cedula.trim(),
        telefono: formEdit.telefono.trim() || undefined,
        email: formEdit.email.trim() || undefined,
        direccion: formEdit.direccion.trim(),
        ciudad: formEdit.ciudad.trim(),
        provincia: formEdit.provincia.trim(),
        nacionalidad: formEdit.nacionalidad || undefined,
        estado_civil: formEdit.estado_civil || undefined,
        fecha_nacimiento: formEdit.fecha_nacimiento || undefined,
        fecha_suscripcion: formEdit.fecha_suscripcion || undefined,
        tipo_afiliacion: formEdit.tipo_afiliacion as "individual" | "corporativo",
        corporacion: formEdit.tipo_afiliacion === "corporativo" ? formEdit.corporacion.trim() : "",
        cuenta: !esDependienteActual && !formEdit.id_grupo_cobro_externo && formEdit.tipo_afiliacion === "individual" ? (formEdit.cuenta.trim() || undefined) : undefined,
        num_cuenta_tc: !esDependienteActual && !formEdit.id_grupo_cobro_externo && formEdit.tipo_afiliacion === "individual" ? (formEdit.num_cuenta_tc.trim() || undefined) : undefined,
        tipo_cuenta: !esDependienteActual && !formEdit.id_grupo_cobro_externo && formEdit.tipo_afiliacion === "individual" ? (formEdit.tipo_cuenta || undefined) : undefined,
        banco_emisor: !esDependienteActual && !formEdit.id_grupo_cobro_externo && formEdit.tipo_afiliacion === "individual" ? (formEdit.banco_emisor.trim() || undefined) : undefined,
        mes_prod: formEdit.mes_prod.trim() || undefined,
        inscripcion: Number(formEdit.inscripcion || 0),
        aporte: Number(formEdit.aporte || 0),
        observacion: formEdit.observacion.trim() || undefined,
        id_grupo_cobro_externo: formEdit.id_grupo_cobro_externo ? Number(formEdit.id_grupo_cobro_externo) : null,
      };

      await benefactoresService.updateBenefactor(Number(id), payload);
      toast.success("Benefactor actualizado exitosamente");
      setDialogEditarOpen(false);
      await loadBenefactor(); // Recargar datos
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar benefactor");
    } finally {
      setEditando(false);
    }
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/benefactores")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[#1D1D1D] mb-2 break-words">
            {benefactor.nombre_completo}
          </h1>
          <div className="inline-flex items-center gap-1 mb-3 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-sm">
            <span className="font-semibold text-[#1b76b9]">Cargado por:</span>
            <span className="text-[#1D1D1D] font-medium break-all">
              {benefactor.nombre_usuario_carga || 'No disponible'}
            </span>
          </div>
          {benefactor.tipo_benefactor === 'DEPENDIENTE' && titular && (
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <span>Dependiente de:</span>
              <span className="font-medium text-[#4064E3]">{titular.nombre_completo}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className={
                benefactor.estado === "ACTIVO"
                  ? "bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white"
                  : benefactor.estado === "CANCELADO"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-400 hover:bg-gray-500 text-white"
              }
            >
              {benefactor.estado}
            </Badge>
            <Badge
              variant="outline"
              className="border-[#4064E3] text-[#4064E3]"
            >
              {benefactor.tipo_benefactor}
            </Badge>
            {benefactor.n_convenio && (
              <span className="text-sm text-gray-600 font-mono">{benefactor.n_convenio}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeEditar && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-[#4064E3] hover:text-[#3451B8] hover:bg-blue-50 border-[#4064E3]"
                onClick={handleAbrirEdicion}
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              {benefactor.estado !== "CANCELADO" && (
                <Dialog open={dialogCancelacionOpen} onOpenChange={setDialogCancelacionOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <FileText className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cancelar benefactor</DialogTitle>
                      <DialogDescription>
                        La cancelacion requiere subir obligatoriamente el PDF de cancelacion. Este documento no podra reemplazarse despues.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        El PDF de contrato se conserva como documento independiente y no sera reemplazado.
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cancelacion-pdf">PDF de cancelacion</Label>
                        <Input
                          id="cancelacion-pdf"
                          ref={cancelacionInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setCancelacionFile(e.target.files?.[0] || null)}
                          disabled={subiendoCancelacion}
                        />
                        <p className="text-xs text-slate-500">Archivo obligatorio en formato PDF, maximo 10MB.</p>
                      </div>
                    </div>
                    <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogCancelacionOpen(false);
                          setCancelacionFile(null);
                          if (cancelacionInputRef.current) {
                            cancelacionInputRef.current.value = '';
                          }
                        }}
                        disabled={subiendoCancelacion}
                      >
                        Cerrar
                      </Button>
                      <Button
                        onClick={handleSubirCancelacion}
                        disabled={subiendoCancelacion || !cancelacionFile}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {subiendoCancelacion ? "Cancelando..." : "Confirmar cancelacion"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aportes Realizados</p>
                <p className="text-3xl text-[#1D1D1D]">{historialPagos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        {benefactor.tipo_benefactor === 'TITULAR' && (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dependientes</p>
                  <p className="text-3xl text-[#1D1D1D]">{dependientes.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Aportado</p>
                <p className="text-2xl text-[#0F8F5B]">${totalAportado.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D]">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cédula de Identidad</p>
              <p className="text-[#1D1D1D]">{benefactor.cedula}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nacionalidad</p>
                <p className="text-[#1D1D1D]">{benefactor.nacionalidad || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Estado Civil</p>
                <p className="text-[#1D1D1D]">{benefactor.estado_civil || 'No especificado'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Correo electrónico</p>
                <p className="text-[#1D1D1D]">{benefactor.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                <p className="text-[#1D1D1D]">{benefactor.telefono}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Dirección</p>
                <p className="text-[#1D1D1D]">{benefactor.direccion}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ciudad</p>
                <p className="text-[#1D1D1D]">{benefactor.ciudad}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Provincia</p>
                <p className="text-[#1D1D1D]">{benefactor.provincia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Administrative Information */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D]">Información Administrativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de Nacimiento</p>
              <p className="text-[#1D1D1D]">
                {benefactor.fecha_nacimiento
                  ? new Date(benefactor.fecha_nacimiento).toLocaleDateString('es-EC')
                  : 'No disponible'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha de Suscripción</p>
              <p className="text-[#1D1D1D]">
                {benefactor.fecha_suscripcion
                  ? new Date(benefactor.fecha_suscripcion).toLocaleDateString('es-EC')
                  : 'No disponible'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo de Afiliación</p>
              <p className="text-[#1D1D1D]">{benefactor.tipo_afiliacion || 'No especificado'}</p>
            </div>
            {benefactor.tipo_afiliacion?.toLowerCase() === 'corporativo' && benefactor.corporacion && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Corporación</p>
                  <p className="text-[#1D1D1D]">{benefactor.corporacion}</p>
                </div>
              </>
            )}
            {esGrupoExternoActual && (
              <>
                <Separator />
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-900">Grupo externo de cobro</p>
                  <p className="mt-1 text-sm text-sky-900">
                    {benefactor.nombre_grupo_cobro_externo || "Grupo sin nombre"}
                  </p>
                  <p className="mt-1 text-xs text-sky-800">
                    Convenio de cartera: {benefactor.n_convenio_cartera || "No disponible"}
                  </p>
                  {benefactor.nombre_titular_externo && (
                    <p className="mt-1 text-xs text-sky-800">
                      Titular externo: {benefactor.nombre_titular_externo}
                      {benefactor.cedula_titular_externo ? ` · ${benefactor.cedula_titular_externo}` : ""}
                    </p>
                  )}
                </div>
              </>
            )}
            {(benefactor.cuenta || benefactor.banco_emisor) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cuenta Bancaria</p>
                  <p className="text-[#1D1D1D] font-mono">
                    {benefactor.cuenta ? maskAccountNumber(benefactor.cuenta) : 'No especificado'}
                  </p>
                  {benefactor.banco_emisor && (
                    <p className="text-xs text-gray-500 mt-1">
                      {benefactor.banco_emisor}
                    </p>
                  )}
                </div>
                {benefactor.num_cuenta_tc && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tarjeta de Crédito</p>
                      <p className="text-[#1D1D1D] font-mono">{maskAccountNumber(benefactor.num_cuenta_tc)}</p>
                      {benefactor.tipo_cuenta && (
                        <p className="text-xs text-gray-500 mt-1">
                          {benefactor.tipo_cuenta}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inscripción</p>
                <p className="text-[#1D1D1D]">${benefactor.inscripcion || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Aporte</p>
                <p className="text-[#1D1D1D]">${benefactor.aporte || 0}</p>
              </div>
            </div>
            <Separator />
            {benefactor.observacion && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Observación</p>
                  <p className="text-[#1D1D1D] text-sm">{benefactor.observacion}</p>
                </div>
                <Separator />
              </>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-2">Contrato</p>
              {tieneContrato ? (
                <p className="text-sm text-[#1D1D1D]">PDF cargado - Ver abajo</p>
              ) : (
                <p className="text-sm text-amber-800">Sin cargar</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-600 mb-2">Cancelacion</p>
              {tieneCancelacion ? (
                <p className="text-sm text-red-700">PDF de cancelacion registrado</p>
              ) : (
                <p className="text-sm text-slate-600">Sin registrar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visor de Contrato PDF */}
      {tieneContrato ? (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato del Benefactor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visor PDF */}
            <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                src={benefactoresService.getContratoUrl(Number(id))}
                className="w-full h-[600px]"
                title="Contrato PDF"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDescargarContrato}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
              {puedeEditar && !esAprobado && (
                <>
                  <Dialog open={dialogContratoOpen} onOpenChange={setDialogContratoOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Cambiar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cambiar Contrato</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="contrato-cambiar">Seleccionar nuevo PDF (máx. 10MB)</Label>
                          <Input
                            id="contrato-cambiar"
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleSubirContrato}
                            disabled={subiendoContrato}
                          />
                        </div>
                        {subiendoContrato && (
                          <p className="text-sm text-gray-600">Subiendo archivo...</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEliminarContrato}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </>
              )}
            </div>
            {esAprobado && (
              <p className="text-sm text-slate-500">
                El contrato queda bloqueado una vez que el benefactor ha sido aprobado.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato del Benefactor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  No se ha cargado ningún contrato. Por favor, suba el contrato PDF del benefactor.
                </p>
              </div>
              <Dialog open={dialogContratoOpen} onOpenChange={setDialogContratoOpen}>
                {puedeEditar && !esAprobado && (
                  <DialogTrigger asChild>
                    <Button className="bg-[#1b76b9] hover:bg-[#155a8a] text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Contrato PDF
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Contrato</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="contrato">Seleccionar archivo PDF (máx. 10MB)</Label>
                      <Input
                        id="contrato"
                        type="file"
                        accept=".pdf"
                        onChange={handleSubirContrato}
                        disabled={subiendoContrato}
                      />
                    </div>
                    {subiendoContrato && (
                      <p className="text-sm text-gray-600">Subiendo archivo...</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {!puedeEditar && (
                <p className="text-sm text-gray-600">
                  No tienes permisos para subir o cambiar contratos en este registro.
                </p>
              )}
              {puedeEditar && esAprobado && (
                <p className="text-sm text-slate-500">
                  El contrato ya no puede cargarse o modificarse despues de la aprobacion.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tieneCancelacion && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF de Cancelacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Este documento deja constancia de la cancelacion y no reemplaza al contrato original del benefactor.
            </div>
            <div className="w-full overflow-hidden rounded-lg border border-red-200 bg-gray-50">
              <iframe
                src={benefactoresService.getCancelacionUrl(Number(id))}
                className="h-[520px] w-full"
                title="PDF de cancelacion"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDescargarCancelacion}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Descargar cancelacion</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependientes Asociados */}
      {benefactor.tipo_benefactor === "TITULAR" && dependientes.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dependientes Asociados ({dependientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vista desktop - Tabla */}
            <div className="hidden xl:block overflow-x-auto rounded-xl border border-slate-200">
              <Table className="min-w-[1080px]">
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">N° Convenio</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Nombre completo</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Cedula</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Fecha nacimiento</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Ciudad</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Telefono</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Cuenta</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Aporte</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dependientes.map((dep) => (
                    <TableRow key={dep.id_benefactor} className="border-slate-200 transition-colors hover:bg-slate-50/80">
                      <TableCell className="px-4 py-4 font-mono text-sm text-slate-700">{dep.n_convenio || '-'}</TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-slate-900">{dep.nombre_completo}</TableCell>
                      <TableCell className="px-4 py-4 font-mono text-sm text-slate-600">{dep.cedula}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-600">
                        {dep.fecha_nacimiento
                          ? new Date(dep.fecha_nacimiento).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-600">{dep.ciudad}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-600">{dep.telefono || '-'}</TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="text-sm text-slate-700">
                          {dep.cuenta ? (
                            <>
                              <div className="font-mono">{maskAccountNumber(dep.cuenta)}</div>
                              {dep.banco_emisor && <div className="text-gray-500 text-xs">{dep.banco_emisor}</div>}
                            </>
                          ) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 font-semibold text-slate-900">${Number(dep.aporte || 0).toFixed(2)}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          className={
                            dep.estado === "ACTIVO"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-gray-400 hover:bg-gray-500 text-white"
                          }
                        >
                          {dep.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="xl:hidden space-y-4">
              {dependientes.map((dep) => (
                <Card key={dep.id_benefactor} className="overflow-hidden border border-slate-200 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-lg font-semibold text-slate-900">{dep.nombre_completo}</p>
                        <p className="break-all font-mono text-sm text-slate-600">{dep.n_convenio || dep.cedula}</p>
                      </div>
                      <Badge
                        className={
                          dep.estado === "ACTIVO"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }
                      >
                        {dep.estado}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Cédula</p>
                        <p className="font-mono break-all">{dep.cedula}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Ciudad</p>
                        <p className="break-words">{dep.ciudad}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="break-words">{dep.telefono || '-'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Aporte</p>
                        <p className="font-semibold">${Number(dep.aporte || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    {dep.fecha_nacimiento && (
                      <div className="pt-2 border-t min-w-0">
                        <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                        <p className="text-sm font-medium">
                          {new Date(dep.fecha_nacimiento).toLocaleDateString('es-EC', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                    )}

                    {dep.cuenta && (
                      <div className="pt-2 border-t min-w-0">
                        <p className="text-xs text-gray-500">Cuenta Bancaria</p>
                        <p className="text-sm font-mono break-all">{maskAccountNumber(dep.cuenta)}</p>
                        {dep.banco_emisor && <p className="text-xs text-gray-500 break-words">{dep.banco_emisor}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Aportes */}
      {historialPagos.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D] flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Historial de Aportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vista desktop - Tabla */}
            <div className="hidden xl:block overflow-x-auto rounded-xl border border-slate-200">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Mes</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Año</TableHead>
                    <TableHead className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Monto esperado</TableHead>
                    <TableHead className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Monto aportado</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Estado</TableHead>
                    <TableHead className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Ultima fecha aporte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialPagos.map((pago, index) => (
                    <TableRow key={index} className="border-slate-200 transition-colors hover:bg-slate-50/80">
                      <TableCell className="px-4 py-4 text-slate-700">{pago.mes}</TableCell>
                      <TableCell className="px-4 py-4 text-slate-700">{pago.anio}</TableCell>
                      <TableCell className="px-4 py-4 text-right text-slate-700">${pago.monto_esperado}</TableCell>
                      <TableCell className="px-4 py-4 text-right font-semibold text-green-600">
                        ${pago.monto_aportado}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          className={
                            pago.estado_aporte === "APORTADO"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {pago.estado_aporte?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-slate-600">
                        {pago.ultima_fecha_aporte
                          ? new Date(pago.ultima_fecha_aporte).toLocaleDateString('es-EC')
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista móvil - Cards */}
            <div className="xl:hidden space-y-4">
              {historialPagos.map((pago, index) => (
                <Card key={index} className="overflow-hidden border border-slate-200 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-lg font-semibold text-slate-900">{pago.mes} {pago.anio}</p>
                      </div>
                      <Badge
                        className={
                          pago.estado_aporte === "APORTADO"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {pago.estado_aporte?.replace('_', ' ') || 'N/A'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Monto Esperado</p>
                        <p className="font-semibold text-blue-600 break-words">${pago.monto_esperado}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Monto Aportado</p>
                        <p className="font-semibold text-green-600 break-words">${pago.monto_aportado}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t min-w-0">
                      <p className="text-xs text-gray-500">Última Fecha Aporte</p>
                      <p className="text-sm font-medium break-words">
                        {pago.ultima_fecha_aporte
                          ? new Date(pago.ultima_fecha_aporte).toLocaleDateString('es-EC')
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Modal de Edición */}
      <Dialog open={dialogEditarOpen} onOpenChange={setDialogEditarOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[900px] max-h-[92vh] overflow-y-auto border-slate-200 bg-white p-0">
          <DialogHeader>
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
              <DialogTitle className="text-2xl font-semibold text-slate-900">Editar Benefactor</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-600">
                Actualiza la información personal, la afiliación y los datos administrativos del registro.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <Input
                id="edit-nombre"
                value={formEdit.nombre_completo}
                onChange={(e) => setFormEdit({ ...formEdit, nombre_completo: e.target.value.toUpperCase() })}
                disabled={editando}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-cedula">Cédula</Label>
                <Input
                  id="edit-cedula"
                  value={formEdit.cedula}
                  onChange={(e) => setFormEdit({ ...formEdit, cedula: e.target.value.replace(/\D/g, "") })}
                  maxLength={10}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  value={formEdit.telefono}
                  onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value.replace(/\D/g, "") })}
                  maxLength={10}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formEdit.email}
                  onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                  disabled={editando}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                value={formEdit.direccion}
                onChange={(e) => setFormEdit({ ...formEdit, direccion: e.target.value.toUpperCase() })}
                disabled={editando}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-ciudad">Ciudad</Label>
                <Input
                  id="edit-ciudad"
                  value={formEdit.ciudad}
                  onChange={(e) => setFormEdit({ ...formEdit, ciudad: e.target.value.toUpperCase() })}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-provincia">Provincia</Label>
                <Input
                  id="edit-provincia"
                  value={formEdit.provincia}
                  onChange={(e) => setFormEdit({ ...formEdit, provincia: e.target.value.toUpperCase() })}
                  disabled={editando}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-nacionalidad">Nacionalidad</Label>
                <Select
                  value={formEdit.nacionalidad}
                  onValueChange={(value) => setFormEdit({ ...formEdit, nacionalidad: value })}
                  disabled={editando}
                >
                  <SelectTrigger id="edit-nacionalidad" className={formSelectTriggerClass}>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECUATORIANA">Ecuatoriana</SelectItem>
                    <SelectItem value="COLOMBIANA">Colombiana</SelectItem>
                    <SelectItem value="VENEZOLANA">Venezolana</SelectItem>
                    <SelectItem value="PERUANA">Peruana</SelectItem>
                    <SelectItem value="OTRA">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado-civil">Estado Civil</Label>
                <Select
                  value={formEdit.estado_civil}
                  onValueChange={(value) => setFormEdit({ ...formEdit, estado_civil: value })}
                  disabled={editando}
                >
                  <SelectTrigger id="edit-estado-civil" className={formSelectTriggerClass}>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLTERO/A">Soltero/a</SelectItem>
                    <SelectItem value="CASADO/A">Casado/a</SelectItem>
                    <SelectItem value="DIVORCIADO/A">Divorciado/a</SelectItem>
                    <SelectItem value="VIUDO/A">Viudo/a</SelectItem>
                    <SelectItem value="UNION LIBRE">Unión Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-fecha-nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="edit-fecha-nacimiento"
                  type="date"
                  value={formEdit.fecha_nacimiento}
                  onChange={(e) => setFormEdit({ ...formEdit, fecha_nacimiento: e.target.value })}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fecha-suscripcion">Fecha de Suscripción</Label>
                <Input
                  id="edit-fecha-suscripcion"
                  type="date"
                  value={formEdit.fecha_suscripcion}
                  onChange={(e) => setFormEdit({ ...formEdit, fecha_suscripcion: e.target.value })}
                  disabled={editando}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo-afiliacion">Tipo de Afiliación</Label>
              <Select
                value={formEdit.tipo_afiliacion}
                onValueChange={(value) => setFormEdit({
                  ...formEdit,
                  tipo_afiliacion: value,
                  corporacion: value === "individual" ? "" : formEdit.corporacion,
                })}
                disabled={editando}
              >
                <SelectTrigger id="edit-tipo-afiliacion" className={formSelectTriggerClass}>
                  <SelectValue placeholder="Seleccione tipo de afiliación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!esDependienteActual && (
              <div className="space-y-2">
                <Label htmlFor="edit-vinculacion-cartera">Vinculacion de Cartera</Label>
                <Select
                  value={vinculacionCarteraEdit}
                  onValueChange={(value) => {
                    const siguiente = value as VinculacionCartera;
                    setVinculacionCarteraEdit(siguiente);
                    setFormEdit((prev) => ({
                      ...prev,
                      id_grupo_cobro_externo: siguiente === "grupo_externo" ? prev.id_grupo_cobro_externo : "",
                      cuenta: siguiente === "grupo_externo" ? "" : prev.cuenta,
                      num_cuenta_tc: siguiente === "grupo_externo" ? "" : prev.num_cuenta_tc,
                      tipo_cuenta: siguiente === "grupo_externo" ? "" : prev.tipo_cuenta,
                      banco_emisor: siguiente === "grupo_externo" ? "" : prev.banco_emisor,
                    }));
                  }}
                  disabled={editando}
                >
                  <SelectTrigger id="edit-vinculacion-cartera" className={formSelectTriggerClass}>
                    <SelectValue placeholder="Seleccione la vinculacion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuenta_propia">Titular con cuenta propia</SelectItem>
                    <SelectItem value="grupo_externo">Titular con grupo externo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {vinculacionCarteraEdit === "grupo_externo"
                    ? "Este titular se cobra por el convenio de un grupo externo y no guarda cuenta propia."
                    : "Este titular se cobra con su propia cuenta bancaria."}
                </p>
              </div>
            )}

            {esDependienteActual && (
              <div className="space-y-2">
                <Label>Vinculacion de Cartera</Label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Dependiente de titular fundacion
                </div>
                <p className="text-xs text-slate-500">
                  Los dependientes nunca tienen cuenta propia y siempre se cobran al titular de la fundacion.
                </p>
              </div>
            )}

            {!esDependienteActual && vinculacionCarteraEdit === "grupo_externo" && (
              <div className="space-y-2">
                <Label htmlFor="edit-grupo-cobro">Grupo Externo</Label>
                <Select
                  value={formEdit.id_grupo_cobro_externo}
                  onValueChange={(value) => setFormEdit({ ...formEdit, id_grupo_cobro_externo: value })}
                  disabled={editando}
                >
                  <SelectTrigger id="edit-grupo-cobro" className={formSelectTriggerClass}>
                    <SelectValue placeholder="Seleccione un grupo externo" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposCobroExterno.map((grupo) => (
                      <SelectItem key={grupo.id_grupo_cobro} value={String(grupo.id_grupo_cobro)}>
                        {grupo.nombre_grupo} · {grupo.n_convenio_cartera}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Este registro compartira el convenio de cartera del grupo externo seleccionado y no guardara datos bancarios propios.
                </div>
              </div>
            )}

            {formEdit.tipo_afiliacion === "individual" && !esDependienteActual && vinculacionCarteraEdit !== "grupo_externo" ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-cuenta">Número de Cuenta Bancaria</Label>
                    <Input
                      id="edit-cuenta"
                      value={formEdit.cuenta}
                      onChange={(e) => setFormEdit({ ...formEdit, cuenta: e.target.value.toUpperCase() })}
                      disabled={editando}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-banco-emisor">Banco Emisor</Label>
                    <Input
                      id="edit-banco-emisor"
                      value={formEdit.banco_emisor}
                      onChange={(e) => setFormEdit({ ...formEdit, banco_emisor: e.target.value.toUpperCase() })}
                      disabled={editando}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-num-cuenta-tc">Número de Tarjeta</Label>
                    <Input
                      id="edit-num-cuenta-tc"
                      value={formEdit.num_cuenta_tc}
                      onChange={(e) => setFormEdit({ ...formEdit, num_cuenta_tc: e.target.value.replace(/\s/g, "") })}
                      disabled={editando}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tipo-cuenta">Tipo de Cuenta</Label>
                    <Select
                      value={formEdit.tipo_cuenta}
                      onValueChange={(value) => setFormEdit({ ...formEdit, tipo_cuenta: value })}
                      disabled={editando}
                    >
                      <SelectTrigger id="edit-tipo-cuenta" className={formSelectTriggerClass}>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRIENTE">Corriente</SelectItem>
                        <SelectItem value="AHORROS">Ahorros</SelectItem>
                        <SelectItem value="CREDITO">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : formEdit.tipo_afiliacion === "corporativo" ? (
              <div className="space-y-2">
                <Label htmlFor="edit-corporacion">Corporación</Label>
                <Input
                  id="edit-corporacion"
                  value={formEdit.corporacion}
                  onChange={(e) => setFormEdit({ ...formEdit, corporacion: e.target.value.toUpperCase() })}
                  disabled={editando}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Los dependientes usan el debito consolidado de su titular y no registran cuenta bancaria ni tarjeta propias.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-mes-prod">Mes Producción</Label>
                <Input
                  id="edit-mes-prod"
                  value={formEdit.mes_prod}
                  onChange={(e) => setFormEdit({ ...formEdit, mes_prod: e.target.value.toUpperCase() })}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-inscripcion">Inscripción</Label>
                <Input
                  id="edit-inscripcion"
                  type="number"
                  step="0.01"
                  value={formEdit.inscripcion}
                  onChange={(e) => setFormEdit({ ...formEdit, inscripcion: e.target.value })}
                  disabled={editando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-aporte">Aporte</Label>
                <Input
                  id="edit-aporte"
                  type="number"
                  step="0.01"
                  value={formEdit.aporte}
                  onChange={(e) => setFormEdit({ ...formEdit, aporte: e.target.value })}
                  disabled={editando}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observacion">Observación</Label>
              <Textarea
                id="edit-observacion"
                value={formEdit.observacion}
                onChange={(e) => setFormEdit({ ...formEdit, observacion: e.target.value.toUpperCase() })}
                rows={3}
                disabled={editando}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogEditarOpen(false)}
              disabled={editando}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white"
              onClick={handleGuardarEdicion}
              disabled={editando}
            >
              {editando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
