import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { cobrosService } from "../services/cobros.service";
import { EstadoPago, Estadisticas } from "../types";
import { toast } from "sonner";

export default function Cartera() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [estadosPago, setEstadosPago] = useState<EstadoPago[]>([]);
  const [pagados, setPagados] = useState<EstadoPago[]>([]);
  const [parciales, setParciales] = useState<EstadoPago[]>([]);
  const [morosos, setMorosos] = useState<EstadoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, estadoRes, pagadosRes, parcialesRes, morososRes] = await Promise.all([
        cobrosService.getEstadisticas(),
        cobrosService.getEstadoActual(),
        cobrosService.getPagados(),
        cobrosService.getPagosParciales(),
        cobrosService.getMorosos(),
      ]);

      setEstadisticas(statsRes.data);
      setEstadosPago(estadoRes.data);
      setPagados(pagadosRes.data);
      setParciales(parcialesRes.data);
      setMorosos(morososRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      PAGADO: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      PAGO_PARCIAL: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      NO_PAGADO: { variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" },
    };
    const config = variants[estado as keyof typeof variants] || variants.NO_PAGADO;
    return <Badge className={config.color}>{estado.replace('_', ' ')}</Badge>;
  };

  const renderTable = (data: EstadoPago[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Benefactor</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead className="text-right">Monto a Pagar</TableHead>
            <TableHead className="text-right">Monto Pagado</TableHead>
            <TableHead className="text-right">Saldo Pendiente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última Fecha Pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No hay registros para mostrar
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id_benefactor}>
                <TableCell className="font-medium">{item.nombre_completo}</TableCell>
                <TableCell>{item.cedula}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.monto_a_pagar)}</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(item.monto_pagado)}
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(item.saldo_pendiente)}
                </TableCell>
                <TableCell>{getEstadoBadge(item.estado_pago)}</TableCell>
                <TableCell>{formatDate(item.ultima_fecha_pago)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b76b9] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos de cartera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Cartera y Cobros</h1>
        <p className="text-white/90">Estado de pagos y cobros de benefactores</p>
      </div>

      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Titulares</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.total_titulares}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Recaudado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estadisticas.total_recaudado)}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {formatCurrency(estadisticas.total_esperado)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">% Recaudación</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {estadisticas.porcentaje_recaudacion}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendiente</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(estadisticas.total_pendiente)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {estadisticas.no_pagados} sin pagar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pagados</span>
                <span className="text-2xl font-bold text-green-600">{estadisticas.pagados}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pagos Parciales</span>
                <span className="text-2xl font-bold text-yellow-600">{estadisticas.parciales}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Morosos</span>
                <span className="text-2xl font-bold text-red-600">{estadisticas.no_pagados}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="todos">Todos ({estadosPago.length})</TabsTrigger>
                <TabsTrigger value="pagados">Pagados ({pagados.length})</TabsTrigger>
                <TabsTrigger value="parciales">Parciales ({parciales.length})</TabsTrigger>
                <TabsTrigger value="morosos">Morosos ({morosos.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="todos" className="p-6 pt-4">
              {renderTable(estadosPago)}
            </TabsContent>

            <TabsContent value="pagados" className="p-6 pt-4">
              {renderTable(pagados)}
            </TabsContent>

            <TabsContent value="parciales" className="p-6 pt-4">
              {renderTable(parciales)}
            </TabsContent>

            <TabsContent value="morosos" className="p-6 pt-4">
              {renderTable(morosos)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
