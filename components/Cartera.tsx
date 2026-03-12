import React, { useEffect, useState, useMemo, useRef } from "react";
import { DollarSign, TrendingUp, Users, Search, History, X, Check, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import moment from "moment-timezone";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { cobrosService } from "../services/cobros.service";
import { EstadoPago, Estadisticas } from "../types";
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
  const [mesDetectado, setMesDetectado] = useState<number | null>(null);
  const [anioDetectado, setAnioDetectado] = useState<number | null>(null);
  const [mostrarAdvertenciaFecha, setMostrarAdvertenciaFecha] = useState(false);
  const [datosPreview, setDatosPreview] = useState<any[] | null>(null);
  const [validacionesPreview, setValidacionesPreview] = useState<any[]>([]);
  const [totalRegistrosExcel, setTotalRegistrosExcel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hayCodigosDuplicados = useMemo(
    () => validacionesPreview.some(v =>
      Array.isArray(v?.errores) && v.errores.some((e: string) => e.includes('Código de tercero duplicado'))
    ),
    [validacionesPreview]
  );

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
    setMesDetectado(null);
    setAnioDetectado(null);
    setMostrarAdvertenciaFecha(false);
    setDatosPreview(null);
    setValidacionesPreview([]);
    setTotalRegistrosExcel(0);
  };

  const handleSeleccionarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      toast.error('No se seleccionó ningún archivo');
      return;
    }

    // Validar nombre del archivo (caracteres válidos)
    if (!/^[\w\s\-\.\(\)áéíóúñÁÉÍÓÚÑ]+\.(xlsx|xls)$/i.test(file.name)) {
      toast.error('El nombre del archivo contiene caracteres no válidos');
      return;
    }

    // Validar extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size === 0) {
      toast.error('El archivo está vacío. Selecciona un archivo con datos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 5MB');
      return;
    }

    // Validar tipo MIME (aunque el usuario puede cambiar extensión)
    const validMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (file.type && !validMimeTypes.includes(file.type)) {
      console.warn('Tipo MIME no reconocido:', file.type, '- continuando de todas formas');
    }

    // Leer el archivo Excel para detectar mes/año y preparar preview
    const reader = new FileReader();

    reader.onerror = () => {
      toast.error('Error al leer el archivo. Verifica que es un Excel válido');
      console.error('FileReader error:', reader.error);
    };

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;

        if (!data) {
          toast.error('No se pudo leer el contenido del archivo');
          return;
        }

        // Intentar leer como Excel
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, defval: '' });

        // Validar que hay al menos una hoja
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          toast.error('El archivo Excel no contiene ninguna hoja de datos');
          return;
        }

        const nombreHoja = workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];

        if (!hoja) {
          toast.error('No se pudo leer la hoja de datos del Excel');
          return;
        }

        const filas = XLSX.utils.sheet_to_json(hoja, { defval: null, blankrows: false });

        // Validar que hay datos
        if (!filas || filas.length === 0) {
          toast.error('El archivo Excel no contiene datos. Añade registros a la hoja');
          return;
        }

        // Validar que la primera fila no está completamente vacía
        const primeraFila = filas[0];
        const columnasValidas = Object.values(primeraFila).some(val => val !== null && val !== undefined && val !== '');
        if (!columnasValidas) {
          toast.error('La primera fila del Excel está vacía. Verifica los datos');
          return;
        }

        // Validar columnas requeridas
        const columnas = Object.keys(primeraFila);
        const tieneEstado = columnas.some(c => c.toLowerCase().includes('estado'));
        const tieneCodTercero = columnas.some(c => c.toLowerCase().includes('cod') && c.toLowerCase().includes('tercero'));
        const tieneFecha = columnas.some(c => c.toLowerCase().includes('fecha') && (c.toLowerCase().includes('transmision') || c.toLowerCase().includes('pago')));

        if (!tieneEstado || !tieneCodTercero || !tieneFecha) {
          toast.error('El Excel no tiene las columnas requeridas: Estado, cod_tercero, fecha_transmision/fecha_pago');
          return;
        }

        let mesesEncontrados = new Set<number>();
        let aniosEncontrados = new Set<number>();

        // Detectar columna de fecha (buscar variantes comunes)
        const colFecha = columnas.find(c =>
          c.toLowerCase().includes('fecha') &&
          (c.toLowerCase().includes('transmision') || c.toLowerCase().includes('pago'))
        );

        // Validar que hay datos con fechas válidas
        let filasConFechaValida = 0;

        // Función auxiliar para parsear fechas del Excel (DD/MM/YYYY o números de serie)
        const parsearFechaExcel = (valor: any): moment.Moment | null => {
          if (!valor) return null;

          let fecha: moment.Moment | null = null;

          // Si es número (serie de Excel)
          if (typeof valor === 'number') {
            fecha = moment.tz(new Date((valor - 25569) * 86400 * 1000), 'America/Guayaquil');
          }
          // Si es string, intentar varios formatos
          else if (typeof valor === 'string') {
            const s = valor.trim();
            // Intentar DD/MM/YYYY primero (formato bancario ecuatoriano)
            fecha = moment.tz(s, 'DD/MM/YYYY', true, 'America/Guayaquil');
            if (!fecha.isValid()) {
              // Si no funciona, intentar DD-MM-YYYY
              fecha = moment.tz(s, 'DD-MM-YYYY', true, 'America/Guayaquil');
            }
            if (!fecha.isValid()) {
              // Si tampoco, intentar YYYY-MM-DD
              fecha = moment.tz(s, 'YYYY-MM-DD', true, 'America/Guayaquil');
            }
            if (!fecha.isValid()) {
              // Último intento: dejar que moment intente adivinar
              fecha = moment.tz(s, 'America/Guayaquil');
            }
          }
          // Si ya es un Date
          else if (valor instanceof Date) {
            fecha = moment.tz(valor, 'America/Guayaquil');
          }

          return fecha && fecha.isValid() ? fecha : null;
        };

        if (colFecha) {
          // Extraer mes/año de las fechas
          filas.forEach((fila: any) => {
            const valorFecha = fila[colFecha];
            if (valorFecha !== null && valorFecha !== undefined && valorFecha !== '') {
              const fecha = parsearFechaExcel(valorFecha);
              if (fecha) {
                mesesEncontrados.add(fecha.month() + 1);
                aniosEncontrados.add(fecha.year());
                filasConFechaValida++;
              }
            }
          });

          // Validar que hay al menos una fecha válida
          if (filasConFechaValida === 0) {
            toast.error('No se encontraron fechas válidas en el archivo. Verifica el formato (DD/MM/YYYY)');
            return;
          }
        }

        // Verificar si hay múltiples meses
        if (mesesEncontrados.size > 1 || aniosEncontrados.size > 1) {
          toast.error('El archivo contiene registros de diferentes meses. Solo se permite un mes por archivo.');
          return;
        }

        // Validar que se detectó al menos un mes
        if (mesesEncontrados.size === 0) {
          toast.error('No se pudo detectar ningún período en las fechas del archivo');
          return;
        }

        // Comparar con el mes actual
        const mesActual = moment.tz('America/Guayaquil').month() + 1;
        const anioActual = moment.tz('America/Guayaquil').year();
        const mesDetectado = Array.from(mesesEncontrados)[0];
        const anioDetectado = Array.from(aniosEncontrados)[0];

        setMesDetectado(mesDetectado || null);
        setAnioDetectado(anioDetectado || null);
        setTotalRegistrosExcel(filas.length);

        // Preparar datos para el preview (primeras 5 filas)
        const columnasKey = Object.keys(filas[0]);
        const colEstado = columnasKey.find(c => c.toLowerCase().includes('estado'));
        const colCodTercero = columnasKey.find(c =>
          c.toLowerCase().includes('cod') && c.toLowerCase().includes('tercero')
        );
        const colFechaTrans = columnasKey.find(c =>
          c.toLowerCase().includes('fecha') && c.toLowerCase().includes('transmision')
        );

        const preview = filas.map((fila: any, idx: number) => ({
          fila_numero: idx + 2,
          estado: fila[colEstado] || '-',
          cod_tercero: fila[colCodTercero] || '-',
          fecha_transmision: fila[colFechaTrans]
            ? (parsearFechaExcel(fila[colFechaTrans])?.format('DD/MM/YYYY') || '-')
            : '-'
        }));

        // Validar cada fila para mostrar errores en preview
        const esEstadoProcesoOk = (estado: string) => /^PROCESO\s*O\.?K\.?$/i.test(estado.trim());
        const esEstadoError = (estado: string) => /^ERROR\s*:\s*.+$/i.test(estado.trim());

        // Detectar códigos de tercero duplicados entre filas (case-insensitive)
        const filasPorCodTercero = new Map<string, number[]>();
        filas.forEach((fila: any, idx: number) => {
          const cod = fila[colCodTercero]?.toString().trim();
          if (!cod) return;
          const codNormalizado = cod.toUpperCase();
          const filasActuales = filasPorCodTercero.get(codNormalizado) || [];
          filasActuales.push(idx + 2);
          filasPorCodTercero.set(codNormalizado, filasActuales);
        });

        const codigosPreview = filas
          .map((fila: any) => fila[colCodTercero]?.toString().trim())
          .filter(Boolean);

        let codigosYaAportados = new Map<string, { nombre_completo?: string; fecha_transmision?: string }>();
        try {
          const validacionRemota = await cobrosService.validarPreviewDebitos(
            codigosPreview,
            mesDetectado,
            anioDetectado
          );

          (validacionRemota.data || []).forEach((item: any) => {
            codigosYaAportados.set(item.cod_tercero?.toString().trim().toUpperCase(), {
              nombre_completo: item.nombre_completo,
              fecha_transmision: item.fecha_transmision,
            });
          });
        } catch (error) {
          console.error('Error validando preview contra datos existentes:', error);
        }

        const validacionesPorFila = filas.map((fila: any, idx: number) => {
          const errores: string[] = [];

          // Validar estado
          const estadoValor = fila[colEstado]?.toString().trim();
          if (!estadoValor) {
            errores.push('Estado vacío');
          } else if (!esEstadoProcesoOk(estadoValor) && !esEstadoError(estadoValor)) {
            errores.push(`Estado inválido: "${estadoValor}". Válidos: "Proceso O.K." o "Error: detalle"`);
          }

          // Validar código de tercero
          const codTerceroValor = fila[colCodTercero]?.toString().trim();
          if (!codTerceroValor) {
            errores.push('Código de tercero vacío');
          } else {
            const codNormalizado = codTerceroValor.toUpperCase();
            const filasDuplicadas = filasPorCodTercero.get(codNormalizado) || [];
            if (filasDuplicadas.length > 1) {
              errores.push(`Código de tercero duplicado en filas: ${filasDuplicadas.join(', ')}`);
            }

            const aportadoExistente = codigosYaAportados.get(codNormalizado);
            if (aportadoExistente) {
              errores.push(`Ya existe un débito aportado para este convenio en ${formatMesAnio(mesDetectado, anioDetectado)}`);
            }
          }

          // Validar fecha
          const fechaValor = fila[colFechaTrans];
          if (!fechaValor) {
            errores.push('Fecha de transmisión vacía');
          } else {
            const fechaParsed = parsearFechaExcel(fechaValor);
            if (!fechaParsed) {
              errores.push(`Fecha inválida: no se pudo parsear "${fechaValor}"`);
            }
          }

          return {
            fila_numero: idx + 2,
            valida: errores.length === 0,
            errores
          };
        });

        setValidacionesPreview(validacionesPorFila as any);
        setDatosPreview(preview);

        if (mesDetectado && anioDetectado) {
          if (mesDetectado !== mesActual || anioDetectado !== anioActual) {
            setMostrarAdvertenciaFecha(true);
          } else {
            setMostrarAdvertenciaFecha(false);
          }
        }

        setArchivoSeleccionado(file);
      } catch (error: any) {
        console.error('Error al procesar archivo Excel:', error);

        // Mensajes de error más específicos
        if (error instanceof TypeError) {
          toast.error('El archivo no es un Excel válido. Verifica que es .xlsx o .xls');
        } else if (error.message?.includes('zip')) {
          toast.error('El archivo Excel está corrupto o dañado');
        } else {
          toast.error('Error al procesar el archivo Excel. Verifica que es válido');
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportarExcel = async () => {
    if (!archivoSeleccionado) {
      toast.error('Debe seleccionar un archivo');
      return;
    }

    try {
      setImportando(true);

      const resultado = await cobrosService.importarExcelDebitos(
        archivoSeleccionado,
        mesDetectado || undefined,
        anioDetectado || undefined
      );

      // Mostrar resumen
      if (resultado.success) {
        const nombreArchivo = archivoSeleccionado.name;
        const erroresCarga = (resultado as any)?.errores || [];

        toast.success(`Exito al subir el archivo "${nombreArchivo}"`, { duration: 4000 });

        if (erroresCarga.length > 0) {
          toast.warning(`Se cargó con ${erroresCarga.length} advertencias. Revisa el historial del lote para el detalle.`, {
            duration: 6000,
          });
        }

        // Recargar datos
        loadData();
        handleCerrarModalImportacion();
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
    setMesDetectado(null);
    setAnioDetectado(null);
    setMostrarAdvertenciaFecha(false);
    setDatosPreview(null);
    setValidacionesPreview([]);
    setTotalRegistrosExcel(0);
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
      {/* Modal único de validación y confirmación */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#1b76b9]" />
              Importar Excel de Débitos Mensuales
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Instrucciones:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>El archivo debe ser formato Excel (.xlsx o .xls)</li>
                <li>Debe contener las columnas: Estado, cod_tercero, fecha_transmision</li>
                <li>Estados válidos: Proceso O.K. y Error: detalle</li>
                <li>Se permiten filas con errores, pero quedarán reportadas en la validación</li>
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
                      : 'Haz clic para seleccionar un archivo'}
                  </p>
                </div>
              </label>
            </div>

            {/* Información del archivo */}
            {archivoSeleccionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre del archivo</p>
                    <p className="font-semibold text-gray-900">{archivoSeleccionado.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tamaño</p>
                    <p className="font-semibold text-gray-900">
                      {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Período</p>
                    <p className="font-semibold text-gray-900">
                      {mesDetectado && anioDetectado
                        ? formatMesAnio(mesDetectado, anioDetectado)
                        : 'No detectado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de registros</p>
                    <p className="font-semibold text-gray-900">{totalRegistrosExcel}</p>
                  </div>
                </div>

                {/* Alerta de advertencia si el mes no es el actual */}
                {mostrarAdvertenciaFecha && mesDetectado && anioDetectado && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">Advertencia: Mes diferente</h4>
                      <p className="text-sm text-yellow-800">
                        El archivo contiene registros del período <strong>{formatMesAnio(mesDetectado, anioDetectado)}</strong>
                        , pero el mes actual es <strong>{formatMesAnio(moment.tz('America/Guayaquil').month() + 1, moment.tz('America/Guayaquil').year())}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-1">Advertencia de re-subida</h4>
                    <p className="text-sm text-amber-800">
                      Al subir este archivo, si luego intentas volver a cargarlo con el mismo nombre, el sistema puede rechazarlo por política de importación.
                    </p>
                  </div>
                </div>

                {hayCodigosDuplicados && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Duplicados detectados</h4>
                      <p className="text-sm text-red-800">
                        Existen códigos de tercero duplicados en el archivo. Al subir, esas filas duplicadas no se cargarán; solo se procesarán las demás.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vista previa de datos con validaciones */}
            {datosPreview && datosPreview.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Validaciones por fila ({totalRegistrosExcel} registros)
                </h4>
                <div className="border rounded-lg overflow-x-auto max-h-[40vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700 w-12">Fila</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Estado</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Código de Tercero</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Fecha Transmisión</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700 w-12">Validación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosPreview.map((fila, idx) => {
                        const validacion = validacionesPreview[idx];
                        const esValida = validacion?.valida ?? true;
                        const tieneErrores = validacion?.errores?.length > 0;

                        return (
                          <React.Fragment key={idx}>
                            <tr className={`border-b ${tieneErrores ? 'bg-red-50' : 'bg-white'}`}>
                              <td className="px-3 py-2 text-center text-gray-600 font-medium">{validacion?.fila_numero || fila.fila_numero || idx + 2}</td>
                              <td className="px-3 py-2 text-gray-900">{fila.estado || '-'}</td>
                              <td className="px-3 py-2 text-gray-900">{fila.cod_tercero || '-'}</td>
                              <td className="px-3 py-2 text-gray-900">{fila.fecha_transmision || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {esValida ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                                    <Check className="h-4 w-4 text-green-600" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                                    <X className="h-4 w-4 text-red-600" />
                                  </span>
                                )}
                              </td>
                            </tr>
                            {tieneErrores && (
                              <tr className="bg-red-50 border-b">
                                <td colSpan={5} className="px-3 py-2">
                                  <div className="text-sm text-red-700 space-y-1">
                                    {validacion.errores.map((error: string, errorIdx: number) => (
                                      <div key={errorIdx} className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCerrarModalImportacion}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportarExcel}
                disabled={!archivoSeleccionado || importando}
                className="bg-[#1b76b9] hover:bg-[#155a8a] text-white"
              >
                {importando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Aceptar y subir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
