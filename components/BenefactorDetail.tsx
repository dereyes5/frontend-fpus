import { useParams, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Users, DollarSign, FileText, AlertCircle, TrendingUp, Upload, Download, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { benefactoresService } from "../services/benefactores.service";
import { cobrosService } from "../services/cobros.service";
import { useAuth } from "../contexts/AuthContext";
import { Benefactor, HistorialPago, SaldoBenefactor } from "../types";
import { toast } from "sonner";

export default function BenefactorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const esAdmin = user?.roles?.some((r) => r.nombre === "ADMINISTRADOR") ?? false;
  const [benefactor, setBenefactor] = useState<Benefactor | null>(null);
  const [historialPagos, setHistorialPagos] = useState<HistorialPago[]>([]);
  const [saldo, setSaldo] = useState<SaldoBenefactor | null>(null);
  const [dependientes, setDependientes] = useState<Benefactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tieneContrato, setTieneContrato] = useState(false);
  const [subiendoContrato, setSubiendoContrato] = useState(false);
  const [dialogContratoOpen, setDialogContratoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadBenefactor();
      loadHistorialPagos();
      loadSaldo();
      verificarContrato();
    }
  }, [id]);

  useEffect(() => {
    if (benefactor?.tipo_benefactor === 'TITULAR') {
      loadDependientes();
    }
  }, [benefactor]);

  const loadBenefactor = async () => {
    try {
      setLoading(true);
      const response = await benefactoresService.getBenefactorById(Number(id));
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

  const verificarContrato = async () => {
    try {
      const existe = await benefactoresService.verificarContrato(Number(id));
      setTieneContrato(existe);
    } catch (error) {
      setTieneContrato(false);
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

  // Función para enmascarar número de cuenta/tarjeta (mostrar solo últimos 4 dígitos)
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return `${masked}${lastFour}`;
  };

  const handleDelete = () => {
    if (confirm("¿Está seguro de eliminar este benefactor?")) {
      navigate("/benefactores");
    }
  };

  return (
    <div className="space-y-6">
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
        <div>
          <h1 className="text-[#1D1D1D] mb-2">{benefactor.nombre_completo}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              className={
                benefactor.estado === "ACTIVO"
                  ? "bg-[#0F8F5B] hover:bg-[#0D7A4C]"
                  : "bg-gray-400 hover:bg-gray-500"
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
        <div className="flex gap-2">
          {!esAdmin && (
            <>
              <Button 
                variant="outline"
                className="text-[#4064E3] hover:text-[#3451B8] hover:bg-blue-50 border-[#4064E3]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pagos Realizados</p>
                <p className="text-3xl text-[#1D1D1D]">{historialPagos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Saldo Pendiente</p>
                <p className="text-3xl text-[#1D1D1D]">${saldo?.saldo_pendiente || "0.00"}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            <div className="grid grid-cols-2 gap-4">
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
            <Separator />
            <div className="grid grid-cols-2 gap-4">
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
            <div>
              <p className="text-sm text-gray-600 mb-2">Contrato</p>
              {tieneContrato ? (
                <p className="text-sm text-[#1D1D1D]">PDF cargado - Ver abajo</p>
              ) : (
                <p className="text-sm text-amber-800">Sin cargar</p>
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
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDescargarContrato}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              {!esAdmin && (
                <>
                  <Dialog open={dialogContratoOpen} onOpenChange={setDialogContratoOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Cambiar
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
                    <X className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
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
                {!esAdmin && (
                  <DialogTrigger asChild>
                    <Button>
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
              {esAdmin && (
                <p className="text-sm text-gray-600">
                  Modo administrador: solo lectura (no puedes subir/cambiar contratos)
                </p>
              )}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>N° Convenio</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Fecha Nacimiento</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Aporte</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dependientes.map((dep) => (
                    <TableRow key={dep.id_benefactor} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{dep.n_convenio || '-'}</TableCell>
                      <TableCell className="font-medium">{dep.nombre_completo}</TableCell>
                      <TableCell className="font-mono text-sm">{dep.cedula}</TableCell>
                      <TableCell className="text-sm">
                        {dep.fecha_nacimiento 
                          ? new Date(dep.fecha_nacimiento).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{dep.ciudad}</TableCell>
                      <TableCell>{dep.telefono || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {dep.num_cuenta_tc ? (
                            <>
                              <div className="font-mono">{maskAccountNumber(dep.num_cuenta_tc)}</div>
                              <div className="text-gray-500 text-xs">{dep.tipo_cuenta} - {dep.banco_emisor}</div>
                            </>
                          ) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${Number(dep.aporte || 0).toFixed(2)}</TableCell>
                      <TableCell>
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
          </CardContent>
        </Card>
      )}

      {/* Historial de Pagos */}
      {historialPagos.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D] flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead className="text-right">Monto a Pagar</TableHead>
                    <TableHead className="text-right">Monto Pagado</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Fecha Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialPagos.map((pago, index) => (
                    <TableRow key={index}>
                      <TableCell>{pago.mes}</TableCell>
                      <TableCell>{pago.anio}</TableCell>
                      <TableCell className="text-right">${pago.monto_a_pagar}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${pago.monto_pagado}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        ${pago.saldo_pendiente}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            pago.estado_pago === "PAGADO" 
                              ? "bg-green-100 text-green-800 border-green-200"
                              : pago.estado_pago === "PAGO_PARCIAL"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {pago.estado_pago.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pago.ultima_fecha_pago 
                          ? new Date(pago.ultima_fecha_pago).toLocaleDateString('es-EC')
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Saldo */}
      {saldo && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#1D1D1D] flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumen de Aportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Pagado</p>
                <p className="text-2xl text-[#0F8F5B] font-bold">${parseFloat(saldo.total_pagado).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{saldo.meses_pagados} meses pagados</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Esperado</p>
                <p className="text-2xl text-[#4064E3] font-bold">${parseFloat(saldo.total_esperado).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Saldo Pendiente</p>
                <p className="text-2xl text-red-600 font-bold">${parseFloat(saldo.saldo_pendiente).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{saldo.meses_pendientes} meses pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
