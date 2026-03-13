import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { Link } from "react-router";
import { Plus, Search, Eye, Users, User, Upload, FileText, AlertCircle, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { benefactoresService } from "../services/benefactores.service";
import { bancosService } from "../services/bancos.service";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { Benefactor } from "../types";
import type { Banco } from "../services/bancos.service";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

/** ====== Provincias (cédula) ====== */
const provinciasEcuadorPorCodigo: Record<string, string> = {
  "01": "Azuay",
  "02": "Bolívar",
  "03": "Cañar",
  "04": "Carchi",
  "05": "Cotopaxi",
  "06": "Chimborazo",
  "07": "El Oro",
  "08": "Esmeraldas",
  "09": "Guayas",
  "10": "Imbabura",
  "11": "Loja",
  "12": "Los Ríos",
  "13": "Manabí",
  "14": "Morona Santiago",
  "15": "Napo",
  "16": "Pastaza",
  "17": "Pichincha",
  "18": "Tungurahua",
  "19": "Zamora Chinchipe",
  "20": "Galápagos",
  "21": "Sucumbíos",
  "22": "Orellana",
  "23": "Santo Domingo de los Tsáchilas",
  "24": "Santa Elena",
};

function getProvinciaNombreDesdeCedula(cedula: string): string | null {
  if (cedula.length < 2) return null;
  const code = cedula.slice(0, 2);
  return provinciasEcuadorPorCodigo[code] ?? null;
}

function validarProvincia(cedula: string): boolean {
  if (cedula.length < 2) return true;
  const code = cedula.slice(0, 2);
  return Boolean(provinciasEcuadorPorCodigo[code]);
}

/** ====== Validación cédula ecuatoriana ====== */
function validarCedulaEcuador(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = Number.parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = Number.parseInt(cedula[2], 10);
  if (tercerDigito >= 6) return false;

  const digitos = cedula.split("").map((d) => Number.parseInt(d, 10));
  const verificador = digitos[9];

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const coef = i % 2 === 0 ? 2 : 1;
    let prod = digitos[i] * coef;
    if (prod >= 10) prod -= 9;
    suma += prod;
  }

  const digitoCalculado = (10 - (suma % 10)) % 10;
  return digitoCalculado === verificador;
}

/** ====== Provincias → Ciudades ====== */
const ciudadesPorProvincia: Record<string, string[]> = {
  Pichincha: [
    "Quito",
    "Cayambe",
    "Mejía",
    "Pedro Moncayo",
    "Pedro Vicente Maldonado",
    "Puerto Quito",
    "Rumiñahui",
    "San Miguel de los Bancos",
  ],
  Guayas: ["Guayaquil", "Daule", "Durán", "Milagro", "Samborondón", "Playas", "Yaguachi", "Naranjal"],
  Azuay: ["Cuenca", "Gualaceo", "Paute", "Santa Isabel", "Sigsig"],
  Tungurahua: ["Ambato", "Baños", "Cevallos", "Mocha", "Patate", "Pelileo", "Píllaro", "Tisaleo"],
  Manabí: ["Portoviejo", "Manta", "Chone", "Jipijapa", "Montecristi", "Bahía de Caráquez"],
  "El Oro": ["Machala", "Pasaje", "Santa Rosa", "Huaquillas", "Arenillas", "El Guabo"],
  "Santo Domingo de los Tsáchilas": ["Santo Domingo", "La Concordia"],
};

const provinciasSelector = Object.keys(ciudadesPorProvincia);

export default function Benefactores() {
  const { permisos } = useAuth();
  const puedeEditar = permisos?.benefactores_escritura ?? false;

  const [benefactores, setBenefactores] = useState<Benefactor[]>([]);

  // ✅ lista independiente SOLO de TITULARES (sin filtro por ejecutivo)
  const [titularesDB, setTitularesDB] = useState<Benefactor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);

  const [convenioSugerido, setConvenioSugerido] = useState<string>("");

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedula, setCedula] = useState("");
  const [cedulaError, setCedulaError] = useState("");
  const [direccion, setDireccion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cuentaBancaria, setCuentaBancaria] = useState("");
  const [mesProduccion, setMesProduccion] = useState("");
  const [inscripcion, setInscripcion] = useState("0.00");
  const [aporte, setAporte] = useState("0.00");

  // Campos adicionales
  const [nacionalidad, setNacionalidad] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [fechaSuscripcion, setFechaSuscripcion] = useState("");
  const [numCuentaTc, setNumCuentaTc] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [bancoEmisor, setBancoEmisor] = useState("");
  const [corporacion, setCorporacion] = useState("");
  const [corporacionesSugeridas, setCorporacionesSugeridas] = useState<string[]>([]);
  const [cargandoCorporaciones, setCargandoCorporaciones] = useState(false);
  const [observacion, setObservacion] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [ciudadFilter, setCiudadFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [globalFilter, setGlobalFilter] = useState("");

  // Estado para react-table (una sola tabla ahora)
  const [sorting, setSorting] = useState<SortingState>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tipoAfiliacion, setTipoAfiliacion] = useState("individual");
  const [tipoBenefactor, setTipoBenefactor] = useState("TITULAR");

  const [titularSeleccionado, setTitularSeleccionado] = useState("");
  const [searchTitular, setSearchTitular] = useState("");

  /** =======================
   *  ✅ Contrato PDF obligatorio
   *  ======================= */
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  const [contratoPreviewUrl, setContratoPreviewUrl] = useState<string>("");
  const [contratoError, setContratoError] = useState<string>("");
  const [subiendoContrato, setSubiendoContrato] = useState(false);
  const fileInputContratoRef = useRef<HTMLInputElement>(null);
  const busquedaCorporacionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_PDF_MB = 10;

  const limpiarContrato = () => {
    setContratoFile(null);
    setContratoError("");
    if (contratoPreviewUrl) URL.revokeObjectURL(contratoPreviewUrl);
    setContratoPreviewUrl("");
    if (fileInputContratoRef.current) fileInputContratoRef.current.value = "";
  };

  const handleSeleccionarContrato = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      limpiarContrato();
      return;
    }

    if (file.type !== "application/pdf") {
      setContratoError("Solo se permiten archivos PDF");
      setContratoFile(null);
      if (contratoPreviewUrl) URL.revokeObjectURL(contratoPreviewUrl);
      setContratoPreviewUrl("");
      return;
    }

    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      setContratoError(`El archivo no debe superar los ${MAX_PDF_MB}MB`);
      setContratoFile(null);
      if (contratoPreviewUrl) URL.revokeObjectURL(contratoPreviewUrl);
      setContratoPreviewUrl("");
      return;
    }

    setContratoError("");
    setContratoFile(file);

    // preview
    if (contratoPreviewUrl) URL.revokeObjectURL(contratoPreviewUrl);
    const url = URL.createObjectURL(file);
    setContratoPreviewUrl(url);
  };

  // Limpieza del objectURL si el componente se desmonta
  useEffect(() => {
    return () => {
      if (contratoPreviewUrl) URL.revokeObjectURL(contratoPreviewUrl);
    };
  }, [contratoPreviewUrl]);

  useEffect(() => {
    loadBenefactores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (busquedaCorporacionRef.current) {
      clearTimeout(busquedaCorporacionRef.current);
    }

    if (tipoAfiliacion !== "corporativo") {
      setCorporacionesSugeridas([]);
      setCargandoCorporaciones(false);
      return;
    }

    const termino = corporacion.trim();
    if (termino.length < 2) {
      setCorporacionesSugeridas([]);
      setCargandoCorporaciones(false);
      return;
    }

    busquedaCorporacionRef.current = setTimeout(async () => {
      try {
        setCargandoCorporaciones(true);
        const response = await benefactoresService.getCorporacionesSugeridas(termino);
        setCorporacionesSugeridas(response.data);
      } catch {
        setCorporacionesSugeridas([]);
      } finally {
        setCargandoCorporaciones(false);
      }
    }, 250);

    return () => {
      if (busquedaCorporacionRef.current) {
        clearTimeout(busquedaCorporacionRef.current);
      }
    };
  }, [corporacion, tipoAfiliacion]);

  const sugerirSiguienteConvenio = (lista: Benefactor[]): string => {
    const ultimo = lista.find((b) => typeof b.n_convenio === "string" && /\d/.test(b.n_convenio));
    const base = ultimo?.n_convenio?.trim();
    if (!base) return "";

    const match = base.match(/^(.*?)(\d+)(\D*)$/);
    if (!match) return "";

    const [, prefijo, numeroStr, sufijo] = match;
    const numero = Number.parseInt(numeroStr, 10);
    if (Number.isNaN(numero)) return "";

    const siguiente = (numero + 1).toString().padStart(numeroStr.length, "0");
    return `${prefijo}${siguiente}${sufijo}`;
  };

  const loadBenefactores = async () => {
    try {
      setLoading(true);

      // Cargar benefactores (filtrados según permisos del usuario)
      const response = await benefactoresService.getBenefactores();
      const data: Benefactor[] = response.data;

      setConvenioSugerido(sugerirSiguienteConvenio(data));
      setBenefactores(data);

      // ✅ Cargar TODOS los TITULARES del sistema (para dropdown de dependientes)
      // Este endpoint devuelve todos los titulares sin importar el usuario
      const titularesResponse = await benefactoresService.getTodosTitulares();
      setTitularesDB(titularesResponse.data);

      // Cargar bancos
      const bancosResponse = await bancosService.getAll();
      setBancos(bancosResponse.data.data || []);

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar benefactores");
    } finally {
      setLoading(false);
    }
  };

  const resetFormulario = () => {
    setNombreCompleto("");
    setCedula("");
    setCedulaError("");
    setDireccion("");
    setProvincia("");
    setCiudad("");
    setTelefono("");
    setEmail("");
    setCuentaBancaria("");
    setMesProduccion("");
    setInscripcion("0.00");
    setAporte("0.00");
    setNacionalidad("");
    setEstadoCivil("");
    setFechaNacimiento("");
    setFechaSuscripcion("");
    setNumCuentaTc("");
    setTipoCuenta("");
    setBancoEmisor("");
    setCorporacion("");
    setCorporacionesSugeridas([]);
    setCargandoCorporaciones(false);
    setObservacion("");
    setTipoBenefactor("TITULAR");
    setTipoAfiliacion("individual");
    setTitularSeleccionado("");
    setSearchTitular("");
    limpiarContrato();
  };

  const handleGuardarBenefactor = async () => {
    if (!nombreCompleto.trim()) {
      toast.error("El nombre completo es requerido");
      return;
    }

    const ced = cedula.trim();
    if (!ced || ced.length !== 10 || !validarCedulaEcuador(ced)) {
      setCedulaError("Cédula no válida");
      toast.error("Cédula no válida");
      return;
    }

    if (!direccion.trim()) {
      toast.error("La dirección es requerida");
      return;
    }

    if (!provincia) {
      toast.error("Seleccione una provincia");
      return;
    }

    if (!ciudad) {
      toast.error("Seleccione una ciudad");
      return;
    }

    if (tipoBenefactor === "DEPENDIENTE" && !titularSeleccionado) {
      toast.error("Seleccione un titular responsable");
      return;
    }

    if (tipoAfiliacion === "corporativo" && !corporacion.trim()) {
      toast.error("La corporación es obligatoria para afiliación corporativa");
      return;
    }

    // ✅ Contrato obligatorio
    if (!contratoFile) {
      setContratoError("Debe subir el contrato PDF (obligatorio)");
      toast.error("Debe subir el contrato PDF antes de guardar");
      return;
    }

    try {
      setGuardando(true);

      const payload: any = {
        tipo_benefactor: tipoBenefactor,
        nombre_completo: nombreCompleto.trim(),
        cedula: ced,
        nacionalidad: nacionalidad || undefined,
        estado_civil: estadoCivil || undefined,
        fecha_nacimiento: fechaNacimiento || undefined,
        fecha_suscripcion: fechaSuscripcion || undefined,
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim(),
        ciudad,
        provincia,
        n_convenio: convenioSugerido || undefined,
        mes_prod: mesProduccion || undefined,
        tipo_afiliacion: tipoAfiliacion,
        corporacion: tipoAfiliacion === "corporativo" ? corporacion.trim() : undefined,
        cuenta: tipoAfiliacion === "individual" ? (cuentaBancaria.trim() || undefined) : undefined,
        num_cuenta_tc: tipoAfiliacion === "individual" ? (numCuentaTc.trim() || undefined) : undefined,
        tipo_cuenta: tipoAfiliacion === "individual" ? (tipoCuenta || undefined) : undefined,
        banco_emisor: tipoAfiliacion === "individual" ? (bancoEmisor.trim() || undefined) : undefined,
        inscripcion: Number(inscripcion || 0),
        aporte: Number(aporte || 0),
        observacion: observacion.trim() || undefined,
        estado: "ACTIVO",
      };

      // 1) crear benefactor
      const created = await benefactoresService.createBenefactor(payload);

      // 2) subir contrato obligatorio (misma lógica que usas en BenefactorDetail)
      try {
        setSubiendoContrato(true);
        await benefactoresService.subirContrato(created.data.id_benefactor, contratoFile);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Error al subir el contrato. Intente nuevamente.");
        // Mantener el modal abierto y NO resetear
        return;
      } finally {
        setSubiendoContrato(false);
      }

      // 3) asignación dependiente (si aplica)
      if (tipoBenefactor === "DEPENDIENTE") {
        await benefactoresService.asignarDependiente({
          id_titular: Number(titularSeleccionado),
          id_dependiente: created.data.id_benefactor,
        });
      }

      toast.success("Benefactor creado y contrato cargado. Queda pendiente de aprobación.");
      setIsDialogOpen(false);
      resetFormulario();
      await loadBenefactores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear benefactor");
    } finally {
      setGuardando(false);
    }
  };

  // Lista base de benefactores (sin filtrar por tipo aún)
  const benefactoresBase = useMemo(() => benefactores, [benefactores]);

  // Definición de columnas unificada
  const columnasBenefactores: ColumnDef<Benefactor>[] = useMemo(
    () => [
      {
        accessorKey: "n_convenio",
        header: "N° Convenio",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.n_convenio || row.original.cedula}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "cedula",
        header: "Cédula",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.cedula}</span>,
        enableSorting: true,
      },
      {
        accessorKey: "nombre_completo",
        header: "Benefactor",
        cell: ({ row }) => <span className="font-medium">{row.original.nombre_completo}</span>,
        enableSorting: true,
      },
      {
        accessorKey: "tipo_benefactor",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant={row.original.tipo_benefactor === "TITULAR" ? "default" : "secondary"}>
            {row.original.tipo_benefactor}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.estado === "ACTIVO"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-400 hover:bg-gray-500 text-white"
            }
          >
            {row.original.estado}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "ciudad",
        header: "Ciudad",
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.ciudad}</span>,
        enableSorting: true,
      },
      {
        id: "acciones",
        header: () => <div className="text-center">Acciones</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <Link to={`/benefactores/${row.original.id_benefactor}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ver detalles</span>
                <span className="sm:hidden">Ver</span>
              </Button>
            </Link>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  // Aplicar filtros unificados
  const benefactoresFiltrados = useMemo(() => {
    return benefactoresBase.filter((benefactor) => {
      const matchesSearch =
        benefactor.nombre_completo.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (benefactor.cedula || "").includes(globalFilter) ||
        (benefactor.n_convenio || "").toLowerCase().includes(globalFilter.toLowerCase());

      const matchesEstado = estadoFilter === "todos" || benefactor.estado === estadoFilter;
      const matchesCiudad =
        ciudadFilter === "todos" ||
        (benefactor.ciudad || "").toLowerCase() === ciudadFilter.toLowerCase();
      const matchesTipo = tipoFilter === "todos" || benefactor.tipo_benefactor === tipoFilter;

      return matchesSearch && matchesEstado && matchesCiudad && matchesTipo;
    });
  }, [benefactoresBase, globalFilter, estadoFilter, ciudadFilter, tipoFilter]);

  // Obtener ciudades únicas de los benefactores cargados
  const ciudadesUnicas = useMemo(() => {
    const ciudades = new Set<string>();
    benefactoresBase.forEach((b) => {
      if (b.ciudad && b.ciudad.trim()) {
        ciudades.add(b.ciudad);
      }
    });
    return Array.from(ciudades).sort();
  }, [benefactoresBase]);

  // Tabla unificada
  const tablaBenefactores = useReactTable({
    data: benefactoresFiltrados,
    columns: columnasBenefactores,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting: sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const ciudadesDisponibles = useMemo(() => (provincia ? ciudadesPorProvincia[provincia] ?? [] : []), [provincia]);
  const provinciaPorCedula = useMemo(() => getProvinciaNombreDesdeCedula(cedula), [cedula]);

  // ✅ Para el selector de titular: usamos titularesDB (TODOS)
  const titularesFiltradosParaSelector = useMemo(() => {
    const base = titularesDB;
    if (!searchTitular.trim()) return base;

    const s = searchTitular.toLowerCase();
    return base.filter((t) => (t.nombre_completo || "").toLowerCase().includes(s) || (t.cedula || "").includes(s));
  }, [titularesDB, searchTitular]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4064E3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando benefactores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Benefactores</h1>
          <p className="text-white/90">Gestión de benefactores titulares y dependientes</p>
        </div>

        {puedeEditar ? (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);

              if (!open) {
                resetFormulario();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-white hover:bg-gray-100 text-[#1b76b9] shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo benefactor
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Benefactor</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      placeholder="Ingrese nombre completo"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value.toUpperCase())}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula</Label>
                    <Input
                      id="cedula"
                      placeholder="Ej: 1712345678"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedula}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setCedula(val);

                        if (val.length >= 2 && !validarProvincia(val)) {
                          setCedulaError("Cédula no válida");
                          return;
                        }

                        if (val.length === 10) {
                          setCedulaError(validarCedulaEcuador(val) ? "" : "Cédula no válida");
                          return;
                        }

                        setCedulaError("");
                      }}
                      disabled={guardando || subiendoContrato}
                      className={
                        cedulaError
                          ? "border-red-500 focus:border-red-500"
                          : cedula.length === 10 && validarCedulaEcuador(cedula)
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      }
                    />

                    {cedulaError ? (
                      <p className="text-xs text-red-600">Cédula no válida</p>
                    ) : cedula.length >= 2 && provinciaPorCedula ? (
                      <p className="text-xs text-gray-600">
                        Provincia detectada: <span className="font-medium">{provinciaPorCedula}</span>{" "}
                        <span className="text-gray-400">(código {cedula.slice(0, 2)})</span>
                        {cedula.length === 10 && validarCedulaEcuador(cedula) ? (
                          <span className="ml-2 text-green-600 font-medium">— cédula válida ✅</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Los dos primeros dígitos corresponden a la provincia (01–24).</p>
                    )}
                  </div>
                </div>

                {/* Campos adicionales: Nacionalidad, Estado Civil, Fecha Nacimiento */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Select value={nacionalidad} onValueChange={setNacionalidad} disabled={guardando || subiendoContrato}>
                      <SelectTrigger id="nacionalidad">
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
                    <Label htmlFor="estadoCivil">Estado Civil</Label>
                    <Select value={estadoCivil} onValueChange={setEstadoCivil} disabled={guardando || subiendoContrato}>
                      <SelectTrigger id="estadoCivil">
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
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={tipoBenefactor}
                      onValueChange={(val) => {
                        setTipoBenefactor(val);

                        // si cambia a TITULAR, limpiamos selección de titular
                        if (val !== "DEPENDIENTE") {
                          setTitularSeleccionado("");
                          setSearchTitular("");
                        }
                      }}
                      disabled={guardando || subiendoContrato}
                    >
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TITULAR">Titular</SelectItem>
                        <SelectItem value="DEPENDIENTE">Dependiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convenio">Número de Convenio</Label>
                    <div className="h-10 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md flex items-center">
                      <span className="font-mono text-sm text-gray-600">
                        {convenioSugerido || "Generando..."}
                      </span>
                    </div>
                  </div>
                </div>

                {tipoBenefactor === "DEPENDIENTE" && (
                  <div className="space-y-2">
                    <Label htmlFor="titular">Titular Responsable</Label>

                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar titular..."
                          value={searchTitular}
                          onChange={(e) => setSearchTitular(e.target.value)}
                          className="pl-10 bg-white text-gray-900 border-gray-300"
                          disabled={guardando || subiendoContrato}
                        />
                      </div>

                      <Select
                        value={titularSeleccionado}
                        onValueChange={setTitularSeleccionado}
                        disabled={guardando || subiendoContrato}
                      >
                        <SelectTrigger id="titular" className="bg-white text-gray-900">
                          <SelectValue placeholder="Seleccione el titular" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-[250px]">
                          {titularesFiltradosParaSelector.map((titular) => (
                            <SelectItem
                              key={titular.id_benefactor}
                              value={titular.id_benefactor.toString()}
                              className="text-gray-900"
                            >
                              {titular.nombre_completo} - {titular.cedula}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {titularesDB.length === 0 && (
                      <p className="text-xs text-amber-600">No hay titulares disponibles en la base de datos.</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tipoAfiliacion">Tipo de Afiliación</Label>
                  <Select
                    value={tipoAfiliacion}
                    onValueChange={(value) => {
                      setTipoAfiliacion(value);
                      if (value === "individual") {
                        setCorporacion("");
                        setCorporacionesSugeridas([]);
                      }
                    }}
                    disabled={guardando || subiendoContrato}
                  >
                    <SelectTrigger id="tipoAfiliacion">
                      <SelectValue placeholder="Seleccione tipo de afiliación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipoAfiliacion === "individual" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cuenta">Número de Cuenta Bancaria</Label>
                        <Input
                          id="cuenta"
                          placeholder="Ingrese número de cuenta"
                          value={cuentaBancaria}
                          onChange={(e) => setCuentaBancaria(e.target.value.toUpperCase())}
                          disabled={guardando || subiendoContrato}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bancoEmisor">Banco</Label>
                        <Select
                          value={bancoEmisor}
                          onValueChange={setBancoEmisor}
                          disabled={guardando || subiendoContrato}
                        >
                          <SelectTrigger id="bancoEmisor">
                            <SelectValue placeholder="Seleccione un banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {bancos.map((banco) => (
                              <SelectItem key={banco.id_banco} value={banco.nombre}>
                                {banco.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Campos de Tarjeta de Crédito */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numCuentaTc">Número de Tarjeta (Opcional)</Label>
                        <Input
                          id="numCuentaTc"
                          placeholder="XXXX XXXX XXXX XXXX"
                          value={numCuentaTc}
                          onChange={(e) => setNumCuentaTc(e.target.value.replace(/\s/g, ''))}
                          maxLength={19}
                          disabled={guardando || subiendoContrato}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipoCuenta">Tipo de Cuenta</Label>
                        <Select value={tipoCuenta} onValueChange={setTipoCuenta} disabled={guardando || subiendoContrato}>
                          <SelectTrigger id="tipoCuenta">
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
                )}

                {tipoAfiliacion === "corporativo" && (
                  <div className="space-y-2">
                    <Label htmlFor="corporacion">Corporación</Label>
                    <div className="space-y-1">
                      <Input
                        id="corporacion"
                        list="corporaciones-sugeridas"
                        placeholder="Ingrese nombre de la corporación"
                        value={corporacion}
                        onChange={(e) => setCorporacion(e.target.value.toUpperCase())}
                        disabled={guardando || subiendoContrato}
                        autoComplete="off"
                      />
                      <datalist id="corporaciones-sugeridas">
                        {corporacionesSugeridas.map((opcion) => (
                          <option key={opcion} value={opcion} />
                        ))}
                      </datalist>
                      {corporacion.trim().length >= 2 && (
                        <p className="text-xs text-gray-500">
                          {cargandoCorporaciones
                            ? "Buscando corporaciones parecidas..."
                            : corporacionesSugeridas.length > 0
                              ? `Sugerencias encontradas: ${corporacionesSugeridas.join(", ")}`
                              : "No hay coincidencias guardadas todavia."}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaCarga">Fecha de Carga</Label>
                    <Input id="fechaCarga" type="text" value={new Date().toLocaleDateString("es-EC")} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaSuscripcion">Fecha de Suscripción</Label>
                    <Input
                      id="fechaSuscripcion"
                      type="date"
                      value={fechaSuscripcion}
                      onChange={(e) => setFechaSuscripcion(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mesProduccion">Mes de Producción</Label>
                    <Input
                      id="mesProduccion"
                      type="month"
                      value={mesProduccion}
                      onChange={(e) => setMesProduccion(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    placeholder="Calle principal, número, referencia"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                    disabled={guardando || subiendoContrato}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select
                      value={provincia}
                      onValueChange={(value) => {
                        setProvincia(value);
                        setCiudad("");
                      }}
                      disabled={guardando || subiendoContrato}
                    >
                      <SelectTrigger id="provincia">
                        <SelectValue placeholder="Seleccione provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinciasSelector.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Select
                      value={ciudad}
                      onValueChange={setCiudad}
                      disabled={guardando || subiendoContrato || !provincia || ciudadesDisponibles.length === 0}
                    >
                      <SelectTrigger id="ciudad">
                        <SelectValue placeholder={provincia ? "Seleccione ciudad" : "Primero seleccione provincia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ciudadesDisponibles.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      placeholder="Ej: 0987654321"
                      maxLength={10}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@gmail.com o ejemplo@hotmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inscripcion">Inscripción</Label>
                    <Input
                      id="inscripcion"
                      type="number"
                      step="0.01"
                      value={inscripcion}
                      onChange={(e) => setInscripcion(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aporte">Aporte</Label>
                    <Input
                      id="aporte"
                      type="number"
                      step="0.01"
                      value={aporte}
                      onChange={(e) => setAporte(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                </div>

                {/* Campo de Observación */}
                <div className="space-y-2">
                  <Label htmlFor="observacion">Observación</Label>
                  <Textarea
                    id="observacion"
                    placeholder="Notas o comentarios adicionales sobre el benefactor..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                    rows={3}
                    disabled={guardando || subiendoContrato}
                  />
                </div>

                {/* ✅ Contrato PDF (OBLIGATORIO) */}
                <div className="space-y-2">
                  <Label htmlFor="contratoPdf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contrato del Benefactor (PDF) <span className="text-red-600">*</span>
                  </Label>

                  <Input
                    id="contratoPdf"
                    ref={fileInputContratoRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleSeleccionarContrato}
                    disabled={guardando || subiendoContrato}
                  />

                  {contratoError ? (
                    <p className="text-xs text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {contratoError}
                    </p>
                  ) : contratoFile ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-800">
                        PDF cargado: <span className="font-medium">{contratoFile.name}</span>
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={limpiarContrato}
                        className="text-red-600 hover:text-red-700"
                        disabled={guardando || subiendoContrato}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Obligatorio. Solo PDF (máx. {MAX_PDF_MB}MB). Puede ser escaneado o foto convertida a PDF.
                    </p>
                  )}

                  {/* Preview opcional */}
                  {contratoPreviewUrl && (
                    <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50 mt-2">
                      <iframe src={contratoPreviewUrl} className="w-full h-[320px]" title="Preview Contrato PDF" />
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Protección de datos:</strong> La información de tarjetas de crédito se maneja de forma segura según la normativa ecuatoriana.
                    No se almacena CVV ni información sensible en texto plano. Los datos están enmascarados como ****-****-****-1234.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={guardando || subiendoContrato}
                >
                  Cancelar
                </Button>

                <Button
                  className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white"
                  onClick={handleGuardarBenefactor}
                  disabled={guardando || subiendoContrato || !contratoFile}
                >
                  {subiendoContrato ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subiendo contrato...
                    </>
                  ) : guardando ? (
                    "Guardando..."
                  ) : (
                    "Guardar benefactor"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-white/90 text-sm">Modo administrador: solo lectura</div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Total Benefactores</p>
                <p className="text-3xl font-bold text-gray-900">{benefactores.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Titulares</p>
                <p className="text-3xl font-bold text-gray-900">{benefactores.filter(b => b.tipo_benefactor === "TITULAR").length}</p>
              </div>
              <User className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-medium">Dependientes</p>
                <p className="text-3xl font-bold text-gray-900">{benefactores.filter(b => b.tipo_benefactor === "DEPENDIENTE").length}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o N° convenio..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las ciudades</SelectItem>
              {ciudadesUnicas.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          {(globalFilter || estadoFilter !== "todos" || ciudadFilter !== "todos" || tipoFilter !== "todos") && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setGlobalFilter("");
                setEstadoFilter("todos");
                setCiudadFilter("todos");
                setTipoFilter("todos");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabla única de benefactores */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm [&_tr]:border-gray-200">
        {/* Tabla desktop */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              {tablaBenefactores.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-gray-700 font-semibold">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                          onClick={(e) => {
                            e.preventDefault();
                            const toggleSorting = header.column.getToggleSortingHandler();
                            toggleSorting?.(e);
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {tablaBenefactores.getRowModel().rows.length > 0 ? (
                tablaBenefactores.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columnasBenefactores.length} className="text-center py-12 text-gray-500">
                    No se encontraron benefactores con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Vista móvil - Cards */}
        <div className="md:hidden p-6 space-y-4">
          {tablaBenefactores.getRowModel().rows.length > 0 ? (
            tablaBenefactores.getRowModel().rows.map((row) => {
              const benefactor = row.original;
              return (
                <Card key={benefactor.id_benefactor} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{benefactor.nombre_completo}</p>
                        <p className="text-sm text-gray-600 font-mono">{benefactor.n_convenio || benefactor.cedula}</p>
                      </div>
                      <Badge
                        className={
                          benefactor.estado === "ACTIVO"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }
                      >
                        {benefactor.estado}
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

                    <Link to={`/benefactores/${benefactor.id_benefactor}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No se encontraron benefactores con los filtros aplicados
            </div>
          )}
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-gray-600">
            Mostrando {tablaBenefactores.getState().pagination.pageIndex * tablaBenefactores.getState().pagination.pageSize + 1} a{" "}
            {Math.min(
              (tablaBenefactores.getState().pagination.pageIndex + 1) * tablaBenefactores.getState().pagination.pageSize,
              benefactoresFiltrados.length
            )}{" "}
            de {benefactoresFiltrados.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => tablaBenefactores.setPageIndex(0)}
              disabled={!tablaBenefactores.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tablaBenefactores.previousPage()}
              disabled={!tablaBenefactores.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Página {tablaBenefactores.getState().pagination.pageIndex + 1} de {tablaBenefactores.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tablaBenefactores.nextPage()}
              disabled={!tablaBenefactores.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tablaBenefactores.setPageIndex(tablaBenefactores.getPageCount() - 1)}
              disabled={!tablaBenefactores.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={tablaBenefactores.getState().pagination.pageSize.toString()}
            onValueChange={(value) => tablaBenefactores.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
