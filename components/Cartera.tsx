import { useEffect, useState, useMemo, useRef } from "react";
import { DollarSign, TrendingUp, Users, Search, History, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { cobrosService } from "../services/cobros.service";
import { EstadoPago, Estadisticas, ResultadoImportacion } from "../types";
import { toast } from "sonner";

interface HistorialAporte {
  anio: number;
  mes: number;
  periodo: string;
  monto_esperado: string;
  monto_aportado: string;
  aportes_exitosos: number;
  aportes_fallidos: number;
  ultima_fecha_aporte: string | null;
  estado_aporte: string;
}

type SortField = 'n_convenio' | 'nombre_completo' | null;
type SortDirection = 'asc' | 'desc';

export default function Cartera() {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [estadosPago, setEstadosPago] = useState<EstadoPago[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Paginación
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal historial
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialData, setHistorialData] = useState<HistorialAporte[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [benefactorSeleccionado, setBenefactorSeleccionado] = useState<string>("");

  // Modal importación de Excel
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Resetear paginación cuando cambian filtros
  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, estadoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, estadoRes] = await Promise.all([
        cobrosService.getEstadisticas(),
        cobrosService.getEstadoAportesMensualesActual(),
      ]);

      setEstadisticas(statsRes.data);
      setEstadosPago(estadoRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMesAnio = (mes: number, anio: number) => {
    if (!mes || !anio) return "N/A";
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[mes - 1]} ${anio}`;
  };

  const getEstadoCobroBadge = (estadoCobro?: string) => {
    if (!estadoCobro) return null;

    const config = {
      DEBITADO: { color: "bg-green-100 text-green-800 border-green-200" },
      APORTADO: { color: "bg-green-100 text-green-800 border-green-200" },
      NO_APORTADO: { color: "bg-red-100 text-red-800 border-red-200" },
    };

    const style = config[estadoCobro as keyof typeof config] || config.NO_APORTADO;
    return <Badge className={style.color}>{estadoCobro.replace(/_/g, ' ')}</Badge>;
  };

  const handleVerHistorial = async (idBenefactor: number, nombreBenefactor: string) => {
    try {
      setLoadingHistorial(true);
      setHistorialOpen(true);
      setBenefactorSeleccionado(nombreBenefactor);

      const response = await cobrosService.getHistorialBenefactor(idBenefactor);
      // Filtrar registros con mes/anio válidos
      const dataFiltrada = (response.data || []).filter(
        (item: HistorialAporte) => item.mes != null && item.anio != null
      );
      setHistorialData(dataFiltrada);
    } catch (error: any) {
      toast.error("Error al cargar historial");
      console.error(error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Funciones de importación de Excel
  const handleAbrirModalImportacion = () => {
    setImportModalOpen(true);
    setArchivoSeleccionado(null);
    setResultadoImportacion(null);
  };

  const handleSeleccionarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== 'xlsx' && extension !== 'xls') {
        toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar los 5MB');
        return;
      }

      setArchivoSeleccionado(file);
      setResultadoImportacion(null);
    }
  };

  const handleImportarExcel = async () => {
    if (!archivoSeleccionado) {
      toast.error('Debe seleccionar un archivo');
      return;
    }

    try {
      setImportando(true);

      const resultado = await cobrosService.importarExcelDebitos(archivoSeleccionado);

      setResultadoImportacion(resultado as any);

      // Mostrar resumen
      if (resultado.success) {
        const totalRegistros = (resultado as any)?.lote?.total_registros ?? (resultado as any)?.data?.lote?.total_registros ?? 0;
        toast.success(
          `Importación exitosa: ${totalRegistros} registros procesados`,
          { duration: 5000 }
        );

        // Recargar datos
        loadData();
      } else {
        toast.error('Error en la importación');
      }

    } catch (error: any) {
      console.error('Error al importar:', error);
      toast.error(error.response?.data?.error || 'Error al importar el archivo Excel');
    } finally {
      setImportando(false);
    }
  };

  const handleCerrarModalImportacion = () => {
    setImportModalOpen(false);
    setArchivoSeleccionado(null);
    setResultadoImportacion(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Manejar ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cambiar dirección si es el mismo campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, ordenar ascendente por defecto
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtrado y ordenamiento
  const filteredData = useMemo(() => {
    // Filtrar
    let filtered = estadosPago.filter((item) => {
      const matchSearch =
        item.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cedula || "").includes(searchTerm) ||
        (item.n_convenio || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = estadoFilter === "todos" ||
        (item.estado_cobro || item.estado_aporte) === estadoFilter;

      return matchSearch && matchEstado;
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
  }, [estadosPago, searchTerm, estadoFilter, sortField, sortDirection]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pageIndex, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  // Renderizar icono de ordenamiento
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      DEBITADO: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
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
            <TableRow className="bg-gray-50">
              <TableHead
                className="text-center cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('n_convenio')}
              >
                <div className="flex items-center justify-center">
                  N° Convenio
                  {renderSortIcon('n_convenio')}
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('nombre_completo')}
              >
                <div className="flex items-center justify-center">
                  Benefactor
                  {renderSortIcon('nombre_completo')}
                </div>
              </TableHead>
              <TableHead className="text-center">Cédula</TableHead>
              <TableHead className="text-center">Corporación</TableHead>
              <TableHead className="text-center">Monto Esperado</TableHead>
              <TableHead className="text-center">Monto Aportado</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-center">Última Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No hay registros para mostrar
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id_benefactor}>
                  <TableCell className="text-center">
                    <Button
                      variant="link"
                      className="font-mono text-sm p-0 h-auto text-blue-600 hover:text-blue-800"
                      onClick={() => handleVerHistorial(item.id_benefactor, item.nombre_completo)}
                    >
                      {item.n_convenio || item.cedula}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center font-medium">{item.nombre_completo}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{item.cedula}</TableCell>
                  <TableCell className="text-center">{item.corporacion || "N/A"}</TableCell>
                  <TableCell className="text-center">{formatCurrency(item.monto_esperado)}</TableCell>
                  <TableCell className="text-center font-semibold text-green-600">
                    {formatCurrency(item.monto_aportado)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.estado_cobro ? getEstadoCobroBadge(item.estado_cobro) : getEstadoBadge(item.estado_aporte)}
                  </TableCell>
                  <TableCell className="text-center">{formatDate(item.ultima_fecha_aporte)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista móvil - Cards */}
      <div className="xl:hidden space-y-4 p-6">
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
                    <Button
                      variant="link"
                      className="font-mono text-sm p-0 h-auto text-blue-600"
                      onClick={() => handleVerHistorial(item.id_benefactor, item.nombre_completo)}
                    >
                      <History className="h-3 w-3 mr-1" />
                      {item.n_convenio || item.cedula}
                    </Button>
                    <p className="font-semibold text-lg break-words mt-1">{item.nombre_completo}</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{item.cedula}</p>
                  </div>
                  {item.estado_cobro ? getEstadoCobroBadge(item.estado_cobro) : getEstadoBadge(item.estado_aporte)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Monto Esperado</p>
                    <p className="font-semibold">{formatCurrency(item.monto_esperado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monto Aportado</p>
                    <p className="font-semibold text-green-600">{formatCurrency(item.monto_aportado)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Corporación</p>
                    <p className="text-sm">{item.corporacion || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Última Fecha</p>
                    <p className="text-sm">{formatDate(item.ultima_fecha_aporte)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {pageIndex * pageSize + 1} a{" "}
            {Math.min((pageIndex + 1) * pageSize, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(0)}
              disabled={!canPreviousPage}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(pageIndex - 1)}
              disabled={!canPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Página {pageIndex + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={!canNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
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
            <SelectTrigger className="w-32">
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cartera de Aportes</h1>
            <p className="text-white/90">Estado de aportes mensuales de benefactores</p>
          </div>
          <Button
            onClick={handleAbrirModalImportacion}
            className="bg-white text-[#1b76b9] hover:bg-gray-100"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Débitos
          </Button>
        </div>
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
                  <p className="text-sm text-gray-600 font-medium">Total Benefactores</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.total_benefactores}</p>
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

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o N° convenio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="APORTADO">Aportado</SelectItem>
              <SelectItem value="NO_APORTADO">No aportado</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || estadoFilter !== "todos") && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setEstadoFilter("todos");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de cartera */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm [&_tr]:border-gray-200">
        {renderTable(paginatedData)}
      </div>

      {/* Modal Historial de Aportes */}
      <Dialog open={historialOpen} onOpenChange={setHistorialOpen}>
        <DialogContent className="w-[96vw] sm:max-w-[96vw] xl:max-w-[1400px] max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Aportes - {benefactorSeleccionado}
            </DialogTitle>
          </DialogHeader>

          {loadingHistorial ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1b76b9]"></div>
            </div>
          ) : historialData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay historial de aportes registrado
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Periodos</p>
                    <p className="text-2xl font-bold text-gray-900">{historialData.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Total esperado</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(String(historialData.reduce((acc, r) => acc + Number(r.monto_esperado || 0), 0)))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Total aportado</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(String(historialData.reduce((acc, r) => acc + Number(r.monto_aportado || 0), 0)))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">Ultimo estado</p>
                    <div className="mt-1">{getEstadoBadge(historialData[0].estado_aporte)}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[52vh]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Esperado</TableHead>
                      <TableHead className="text-right">Aportado</TableHead>
                      <TableHead className="text-center">Exitosos</TableHead>
                      <TableHead className="text-center">Fallidos</TableHead>
                      <TableHead>Ultima Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialData.map((registro, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {formatMesAnio(registro.mes, registro.anio)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(registro.monto_esperado)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(registro.monto_aportado)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 min-w-10 justify-center">
                            {registro.aportes_exitosos}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 min-w-10 justify-center">
                            {registro.aportes_fallidos}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(registro.ultima_fecha_aporte)}</TableCell>
                        <TableCell>{getEstadoBadge(registro.estado_aporte)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de Importación de Débitos */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#1b76b9]" />
              Importar Excel de Débitos Mensuales
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!resultadoImportacion ? (
              <>
                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Instrucciones:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>El archivo debe ser formato Excel (.xlsx o .xls)</li>
                    <li>Debe contener las columnas: Estado, cod_tercero, fecha_transmision</li>
                    <li>El sistema identificará automáticamente el mes/año del lote</li>
                    <li>El Excel debe cargarse por titular (convenio titular)</li>
                    <li>Si llega convenio de dependiente, la fila se rechaza</li>
                    <li>El estado del titular se propaga a sus dependientes del grupo</li>
                  </ul>
                </div>

                {/* Selector de archivo */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleSeleccionarArchivo}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar archivo Excel'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {archivoSeleccionado
                          ? `${(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB`
                          : 'Haz clic o arrastra un archivo aquí'
                        }
                      </p>
                    </div>
                    {archivoSeleccionado && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Archivo listo
                      </Badge>
                    )}
                  </label>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCerrarModalImportacion}
                    disabled={importando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImportarExcel}
                    disabled={!archivoSeleccionado || importando}
                    className="bg-[#1b76b9] hover:bg-[#155a8a]"
                  >
                    {importando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Resultado de la importación */}
                <div className={`rounded-lg p-6 ${resultadoImportacion.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-start gap-3">
                    {resultadoImportacion.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg mb-2 ${resultadoImportacion.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                        {resultadoImportacion.success
                          ? '✓ Importación Exitosa'
                          : '✗ Error en la Importación'
                        }
                      </h4>

                      {resultadoImportacion.success && (
                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded p-3">
                              <p className="text-gray-600">Archivo</p>
                              <p className="font-semibold text-gray-900">
                                {resultadoImportacion.lote?.nombre_archivo}
                              </p>
                            </div>
                            <div className="bg-white rounded p-3">
                              <p className="text-gray-600">Periodo</p>
                              <p className="font-semibold text-gray-900">
                                {formatMesAnio(
                                  resultadoImportacion.lote?.mes || 0,
                                  resultadoImportacion.lote?.anio || 0
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded p-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Registros Importados:</h5>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">
                                  {resultadoImportacion.lote?.total_registros}
                                </p>
                                <p className="text-xs text-gray-600">Total</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">
                                  {resultadoImportacion.lote?.insertados_exitosos}
                                </p>
                                <p className="text-xs text-gray-600">Exitosos</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-red-600">
                                  {resultadoImportacion.lote?.insertados_fallidos || 0}
                                </p>
                                <p className="text-xs text-gray-600">Fallidos</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded p-4">
                            <h5 className="font-semibold text-gray-900 mb-2">Procesamiento:</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm">
                                  <strong>{resultadoImportacion.procesamiento?.titulares_aportados}</strong> Aportados
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-sm">
                                  <strong>{resultadoImportacion.procesamiento?.titulares_no_aportados}</strong> No Aportados
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">
                                  <strong>{resultadoImportacion.procesamiento?.dependientes_actualizados}</strong> Dependientes actualizados
                                </span>
                              </div>
                            </div>
                          </div>

                          {resultadoImportacion.errores && resultadoImportacion.errores.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <h6 className="font-semibold text-yellow-900">
                                  Advertencias ({resultadoImportacion.errores.length})
                                </h6>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                                {resultadoImportacion.errores.slice(0, 10).map((error, idx) => (
                                  <div key={idx} className="text-yellow-800">
                                    Fila {error.fila}: {error.error} (Convenio: {error.cod_tercero})
                                  </div>
                                ))}
                                {resultadoImportacion.errores.length > 10 && (
                                  <div className="text-yellow-700 font-medium">
                                    ... y {resultadoImportacion.errores.length - 10} más
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón cerrar */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleCerrarModalImportacion}
                    className="bg-[#1b76b9] hover:bg-[#155a8a]"
                  >
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>    </div>
  );
}
