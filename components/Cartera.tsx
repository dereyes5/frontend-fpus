import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users } from "lucide-react";
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
  const [aportados, setAportados] = useState<EstadoPago[]>([]);
  const [noAportados, setNoAportados] = useState<EstadoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, estadoRes, aportadosRes, noAportadosRes] = await Promise.all([
        cobrosService.getEstadisticas(),
        cobrosService.getEstadoActual(),
        cobrosService.getAportados(),
        cobrosService.getNoAportados(),
      ]);

      setEstadisticas(statsRes.data);
      setEstadosPago(estadoRes.data);
      setAportados(aportadosRes.data);
      setNoAportados(noAportadosRes.data);
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
      APORTADO: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
      NO_APORTADO: { variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" },
    };
    const config = variants[estado as keyof typeof variants] || variants.NO_APORTADO;
    return <Badge className={config.color}>{estado.replace('_', ' ')}</Badge>;
  };

  const renderTable = (data: EstadoPago[]) => (
    <>
      {/* Vista desktop - Tabla */}
      <div className="hidden xl:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benefactor</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead className="text-right">Monto Esperado</TableHead>
              <TableHead className="text-right">Monto Aportado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Fecha Aporte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No hay registros para mostrar
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id_benefactor}>
                  <TableCell className="font-medium">{item.nombre_completo}</TableCell>
                  <TableCell>{item.cedula}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.monto_esperado)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.monto_aportado)}
                  </TableCell>
                  <TableCell>{getEstadoBadge(item.estado_aporte)}</TableCell>
                  <TableCell>{formatDate(item.ultima_fecha_aporte)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista móvil - Cards */}
      <div className="xl:hidden space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay registros para mostrar
          </div>
        ) : (
          data.map((item) => (
            <Card key={item.id_benefactor} className="border-2 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg break-words">{item.nombre_completo}</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{item.cedula}</p>
                  </div>
                  {getEstadoBadge(item.estado_aporte)}
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Monto Esperado</p>
                    <p className="font-semibold break-words">{formatCurrency(item.monto_esperado)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Monto Aportado</p>
                    <p className="font-semibold text-green-600 break-words">{formatCurrency(item.monto_aportado)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Última Fecha Aporte</p>
                    <p className="text-sm break-words">{formatDate(item.ultima_fecha_aporte)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1b76b9] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos de aportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Cartera de Aportes</h1>
        <p className="text-white/90">Estado de aportes mensuales de benefactores</p>
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
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Esperado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estadisticas.total_esperado)}
                  </p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">% Recaudación</p>
                  <p className="text-3xl font-bold text-indigo-700">
                    {estadisticas.porcentaje_recaudacion}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="todos">Todos ({estadosPago.length})</TabsTrigger>
                <TabsTrigger value="aportados">Aportados ({aportados.length})</TabsTrigger>
                <TabsTrigger value="no-aportados">No Aportados ({noAportados.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="todos" className="p-6 pt-4">
              {renderTable(estadosPago)}
            </TabsContent>

            <TabsContent value="aportados" className="p-6 pt-4">
              {renderTable(aportados)}
            </TabsContent>

            <TabsContent value="no-aportados" className="p-6 pt-4">
              {renderTable(noAportados)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
