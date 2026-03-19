import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { Link } from "react-router";
import { Plus, Search, Eye, Users, User, Upload, FileText, AlertCircle, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { benefactoresService } from "../services/benefactores.service";
import { bancosService } from "../services/bancos.service";
import { gruposCobroExternoService } from "../services/gruposCobroExterno.service";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { Benefactor, GrupoCobroExterno, VinculacionCartera } from "../types";
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

/** ====== Provincias (cedula) ====== */
const provinciasEcuadorPorCodigo: Record<string, string> = {
  "01": "Azuay",
  "02": "Bolivar",
  "03": "Canar",
  "04": "Carchi",
  "05": "Cotopaxi",
  "06": "Chimborazo",
  "07": "El Oro",
  "08": "Esmeraldas",
  "09": "Guayas",
  "10": "Imbabura",
  "11": "Loja",
  "12": "Los Rios",
  "13": "Manabi",
  "14": "Morona Santiago",
  "15": "Napo",
  "16": "Pastaza",
  "17": "Pichincha",
  "18": "Tungurahua",
  "19": "Zamora Chinchipe",
  "20": "Galapagos",
  "21": "Sucumbios",
  "22": "Orellana",
  "23": "Santo Domingo de los Tsachilas",
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

/** ====== Validacion cedula ecuatoriana ====== */
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

/** ====== Provincias -> Ciudades ====== */
const ciudadesPorProvincia: Record<string, string[]> = {
  Pichincha: [
    "Quito",
    "Cayambe",
    "Mejia",
    "Pedro Moncayo",
    "Pedro Vicente Maldonado",
    "Puerto Quito",
    "Ruminahui",
    "San Miguel de los Bancos",
  ],
  Guayas: ["Guayaquil", "Daule", "Duran", "Milagro", "Samborondon", "Playas", "Yaguachi", "Naranjal"],
  Azuay: ["Cuenca", "Gualaceo", "Paute", "Santa Isabel", "Sigsig"],
  Tungurahua: ["Ambato", "Banos", "Cevallos", "Mocha", "Patate", "Pelileo", "Pillaro", "Tisaleo"],
  "Manabi": ["Portoviejo", "Manta", "Chone", "Jipijapa", "Montecristi", "Bahia de Caraquez"],
  "El Oro": ["Machala", "Pasaje", "Santa Rosa", "Huaquillas", "Arenillas", "El Guabo"],
  "Santo Domingo de los Tsachilas": ["Santo Domingo", "La Concordia"],
};

const provinciasSelector = Object.keys(ciudadesPorProvincia);

export default function Benefactores() {
  const { permisos } = useAuth();
  const puedeGestionar = (permisos?.benefactores_ingresar ?? false) || (permisos?.benefactores_administrar ?? false);
  const formSelectTriggerClass =
    "h-11 rounded-xl border-slate-300 bg-white text-slate-900 shadow-sm transition focus:ring-2 focus:ring-sky-100 hover:border-slate-400";

  const [benefactores, setBenefactores] = useState<Benefactor[]>([]);

  // Lista independiente solo de titulares (sin filtro por ejecutivo)
  const [titularesDB, setTitularesDB] = useState<Benefactor[]>([]);
  const [gruposCobroExterno, setGruposCobroExterno] = useState<GrupoCobroExterno[]>([]);
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
  const [vinculacionCartera, setVinculacionCartera] = useState<VinculacionCartera>("cuenta_propia");
  const esDependiente = vinculacionCartera === "dependiente_fundacion";
  const esGrupoExterno = vinculacionCartera === "grupo_externo";
  const descripcionVinculacion =
    vinculacionCartera === "dependiente_fundacion"
      ? "Este registro se crea como dependiente y siempre se cobra al titular de la fundacion."
      : vinculacionCartera === "grupo_externo"
        ? "Este registro se crea como titular vinculado a un grupo externo y no tendra cuenta propia."
        : "Este registro se crea como titular con cuenta propia.";

  const [titularSeleccionado, setTitularSeleccionado] = useState("");
  const [searchTitular, setSearchTitular] = useState("");
  const [titularBuscadorAbierto, setTitularBuscadorAbierto] = useState(false);
  const titularSearchInputRef = useRef<HTMLInputElement | null>(null);
  const titularDropdownRef = useRef<HTMLDivElement | null>(null);
  const [grupoCobroExternoSeleccionado, setGrupoCobroExternoSeleccionado] = useState("");
  const [mostrarCrearGrupoExterno, setMostrarCrearGrupoExterno] = useState(false);
  const [guardandoGrupoExterno, setGuardandoGrupoExterno] = useState(false);
  const [nuevoGrupoExterno, setNuevoGrupoExterno] = useState({
    nombre_grupo: "",
    nombre_titular_externo: "",
    cedula_titular_externo: "",
    banco_emisor: "",
    tipo_cuenta: "",
    num_cuenta: "",
    n_convenio_cartera: "",
    observacion: "",
  });

  /** =======================
   *  Contrato PDF obligatorio
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
    if (!isDialogOpen || !puedeGestionar) {
      return;
    }

    void loadSiguienteConvenio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, puedeGestionar]);

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

  const loadSiguienteConvenio = async () => {
    try {
      const response = await benefactoresService.getSiguienteConvenio();
      setConvenioSugerido(response.data.n_convenio || "");
    } catch {
      setConvenioSugerido("");
    }
  };

  const loadBenefactores = async () => {
    try {
      setLoading(true);

      // Cargar benefactores (filtrados segun permisos del usuario)
      const response = await benefactoresService.getBenefactores();
      const data: Benefactor[] = response.data;

      setBenefactores(data);

      // Cargar todos los titulares del sistema (para dropdown de dependientes)
      // Este endpoint devuelve todos los titulares sin importar el usuario
      const titularesResponse = await benefactoresService.getTodosTitulares();
      setTitularesDB(titularesResponse.data);

      const gruposResponse = await gruposCobroExternoService.getAll();
      setGruposCobroExterno(gruposResponse.data);

      // Cargar bancos
      const bancosResponse = await bancosService.getAll();
      setBancos(bancosResponse.data.data || []);

      if (puedeGestionar) {
        await loadSiguienteConvenio();
      }

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
    setVinculacionCartera("cuenta_propia");
    setTipoAfiliacion("individual");
    setTitularSeleccionado("");
    setSearchTitular("");
    setGrupoCobroExternoSeleccionado("");
    setMostrarCrearGrupoExterno(false);
    setNuevoGrupoExterno({
      nombre_grupo: "",
      nombre_titular_externo: "",
      cedula_titular_externo: "",
      banco_emisor: "",
      tipo_cuenta: "",
      num_cuenta: "",
      n_convenio_cartera: "",
      observacion: "",
    });
    limpiarContrato();
  };

  const handleCrearGrupoExterno = async () => {
    if (!nuevoGrupoExterno.nombre_grupo.trim()) {
      toast.error("El nombre del grupo es obligatorio");
      return;
    }

    if (!nuevoGrupoExterno.nombre_titular_externo.trim()) {
      toast.error("El titular externo es obligatorio");
      return;
    }

    if (!nuevoGrupoExterno.n_convenio_cartera.trim()) {
      toast.error("El convenio de cartera del grupo es obligatorio");
      return;
    }

    try {
      setGuardandoGrupoExterno(true);
      const response = await gruposCobroExternoService.create({
        nombre_grupo: nuevoGrupoExterno.nombre_grupo.trim().toUpperCase(),
        nombre_titular_externo: nuevoGrupoExterno.nombre_titular_externo.trim().toUpperCase(),
        cedula_titular_externo: nuevoGrupoExterno.cedula_titular_externo.trim() || undefined,
        banco_emisor: nuevoGrupoExterno.banco_emisor.trim().toUpperCase() || undefined,
        tipo_cuenta: nuevoGrupoExterno.tipo_cuenta || undefined,
        num_cuenta: nuevoGrupoExterno.num_cuenta.trim() || undefined,
        n_convenio_cartera: nuevoGrupoExterno.n_convenio_cartera.trim().toUpperCase(),
        observacion: nuevoGrupoExterno.observacion.trim() || undefined,
      });

      setGruposCobroExterno((prev) => [...prev, response.data].sort((a, b) => a.nombre_grupo.localeCompare(b.nombre_grupo)));
      setGrupoCobroExternoSeleccionado(String(response.data.id_grupo_cobro));
      setMostrarCrearGrupoExterno(false);
      setNuevoGrupoExterno({
        nombre_grupo: "",
        nombre_titular_externo: "",
        cedula_titular_externo: "",
        banco_emisor: "",
        tipo_cuenta: "",
        num_cuenta: "",
        n_convenio_cartera: "",
        observacion: "",
      });
      toast.success("Grupo externo creado exitosamente");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear grupo externo");
    } finally {
      setGuardandoGrupoExterno(false);
    }
  };

  const handleGuardarBenefactor = async () => {
    if (!nombreCompleto.trim()) {
      toast.error("El nombre completo es requerido");
      return;
    }

    const ced = cedula.trim();
    if (!ced || ced.length !== 10 || !validarCedulaEcuador(ced)) {
      setCedulaError("Cedula no valida");
      toast.error("Cedula no valida");
      return;
    }

    if (!direccion.trim()) {
      toast.error("La direccion es requerida");
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

    if (esDependiente && !titularSeleccionado) {
      toast.error("Seleccione un titular responsable");
      return;
    }

    if (esGrupoExterno && !grupoCobroExternoSeleccionado) {
      toast.error("Seleccione o cree un grupo externo");
      return;
    }

    if (tipoAfiliacion === "corporativo" && !corporacion.trim()) {
      toast.error("La corporacion es obligatoria para afiliacion corporativa");
      return;
    }

    // Contrato obligatorio
    if (!contratoFile) {
      setContratoError("Debe subir el contrato PDF (obligatorio)");
      toast.error("Debe subir el contrato PDF antes de guardar");
      return;
    }

    try {
      setGuardando(true);

      const payload: any = {
        tipo_benefactor: esDependiente ? "DEPENDIENTE" : "TITULAR",
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
        mes_prod: mesProduccion || undefined,
        tipo_afiliacion: tipoAfiliacion,
        corporacion: tipoAfiliacion === "corporativo" ? corporacion.trim() : undefined,
        cuenta: !esDependiente && !esGrupoExterno && tipoAfiliacion === "individual" ? (cuentaBancaria.trim() || undefined) : undefined,
        num_cuenta_tc: !esDependiente && !esGrupoExterno && tipoAfiliacion === "individual" ? (numCuentaTc.trim() || undefined) : undefined,
        tipo_cuenta: !esDependiente && !esGrupoExterno && tipoAfiliacion === "individual" ? (tipoCuenta || undefined) : undefined,
        banco_emisor: !esDependiente && !esGrupoExterno && tipoAfiliacion === "individual" ? (bancoEmisor.trim() || undefined) : undefined,
        id_grupo_cobro_externo: esGrupoExterno ? Number(grupoCobroExternoSeleccionado) : undefined,
        inscripcion: Number(inscripcion || 0),
        aporte: Number(aporte || 0),
        observacion: observacion.trim() || undefined,
        estado: "ACTIVO",
      };

      // 1) crear benefactor
      const created = await benefactoresService.createBenefactor(payload);

      // 2) subir contrato obligatorio (misma logica que usas en BenefactorDetail)
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

      // 3) asignacion dependiente (si aplica)
      if (esDependiente) {
        await benefactoresService.asignarDependiente({
          id_titular: Number(titularSeleccionado),
          id_dependiente: created.data.id_benefactor,
        });
      }

      toast.success("Benefactor creado y contrato cargado. Queda pendiente de aprobacion.");
      setIsDialogOpen(false);
      resetFormulario();
      await loadBenefactores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear benefactor");
    } finally {
      setGuardando(false);
    }
  };

  // Lista base de benefactores (sin filtrar por tipo aun)
  const benefactoresBase = useMemo(() => benefactores, [benefactores]);

  // Definicion de columnas unificada
  const columnasBenefactores: ColumnDef<Benefactor>[] = useMemo(
    () => [
      {
        accessorKey: "n_convenio",
        header: "Nro Convenio",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.n_convenio || row.original.cedula}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "cedula",
        header: "Cedula",
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

  // Obtener ciudades unicas de los benefactores cargados
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

  // Para el selector de titular usamos titularesDB (todos)
  const titularesFiltradosParaSelector = useMemo(() => {
    const base = titularesDB;
    if (!searchTitular.trim()) return base;

    const s = searchTitular.toLowerCase();
    return base.filter((t) => (t.nombre_completo || "").toLowerCase().includes(s) || (t.cedula || "").includes(s));
  }, [titularesDB, searchTitular]);

  const titularSeleccionadoData = useMemo(
    () => titularesDB.find((titular) => titular.id_benefactor.toString() === titularSeleccionado) || null,
    [titularesDB, titularSeleccionado]
  );

  const handleSeleccionTitular = (value: string) => {
    setTitularSeleccionado(value);
    const titular = titularesDB.find((item) => item.id_benefactor.toString() === value);
    if (titular) {
      setSearchTitular(`${titular.nombre_completo} - ${titular.cedula}`);
    }
    setTitularBuscadorAbierto(false);
  };

  useEffect(() => {
    if (!titularBuscadorAbierto) return;

    const timer = window.setTimeout(() => {
      titularSearchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [titularBuscadorAbierto]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!titularDropdownRef.current) return;
      if (titularDropdownRef.current.contains(event.target as Node)) return;
      setTitularBuscadorAbierto(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <p className="text-white/90">Gestion de benefactores titulares y dependientes</p>
        </div>

        {puedeGestionar ? (
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

            <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[920px] max-h-[92vh] overflow-y-auto border-slate-200 bg-white p-0">
              <DialogHeader>
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                  <DialogTitle className="text-2xl font-semibold text-slate-900">Registrar Nuevo Benefactor</DialogTitle>
                  <DialogDescription className="mt-2 text-sm text-slate-600">
                    Completa la informacion personal, administrativa y el contrato para dejar el registro listo para aprobacion.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">Datos Personales</h3>
                    <p className="mt-1 text-sm text-slate-500">Identificacion y datos basicos del benefactor.</p>
                  </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <Label htmlFor="cedula">Cedula</Label>
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
                          setCedulaError("Cedula no valida");
                          return;
                        }

                        if (val.length === 10) {
                          setCedulaError(validarCedulaEcuador(val) ? "" : "Cedula no valida");
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
                      <p className="text-xs text-red-600">Cedula no valida</p>
                    ) : cedula.length >= 2 && provinciaPorCedula ? (
                      <p className="text-xs text-gray-600">
                        Provincia detectada: <span className="font-medium">{provinciaPorCedula}</span>{" "}
                        <span className="text-gray-400">(codigo {cedula.slice(0, 2)})</span>
                        {cedula.length === 10 && validarCedulaEcuador(cedula) ? (
                          <span className="ml-2 text-green-600 font-medium">- cedula valida</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Los dos primeros digitos corresponden a la provincia (01-24).</p>
                    )}
                  </div>
                </div>

                {/* Campos adicionales: Nacionalidad, Estado Civil, Fecha Nacimiento */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nacionalidad">Nacionalidad</Label>
                    <Select value={nacionalidad} onValueChange={setNacionalidad} disabled={guardando || subiendoContrato}>
                      <SelectTrigger id="nacionalidad" className={formSelectTriggerClass}>
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
                      <SelectTrigger id="estadoCivil" className={formSelectTriggerClass}>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTERO/A">Soltero/a</SelectItem>
                        <SelectItem value="CASADO/A">Casado/a</SelectItem>
                        <SelectItem value="DIVORCIADO/A">Divorciado/a</SelectItem>
                        <SelectItem value="VIUDO/A">Viudo/a</SelectItem>
                        <SelectItem value="UNION LIBRE">Union Libre</SelectItem>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vinculacion">Vinculacion de Cartera</Label>
                    <Select
                      value={vinculacionCartera}
                      onValueChange={(val) => {
                        setVinculacionCartera(val as VinculacionCartera);
                        if (val !== "dependiente_fundacion") {
                          setTitularSeleccionado("");
                          setSearchTitular("");
                        }

                        if (val !== "grupo_externo") {
                          setGrupoCobroExternoSeleccionado("");
                          setMostrarCrearGrupoExterno(false);
                        }

                        if (val !== "cuenta_propia") {
                          setCuentaBancaria("");
                          setNumCuentaTc("");
                          setTipoCuenta("");
                          setBancoEmisor("");
                        }
                      }}
                      disabled={guardando || subiendoContrato}
                    >
                      <SelectTrigger id="vinculacion" className={formSelectTriggerClass}>
                        <SelectValue placeholder="Seleccione como se cobrara" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cuenta_propia">Titular con cuenta propia</SelectItem>
                        <SelectItem value="dependiente_fundacion">Dependiente de titular fundacion</SelectItem>
                        <SelectItem value="grupo_externo">Titular con grupo externo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convenio">Numero de Convenio</Label>
                    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 shadow-sm">
                      <span className="font-mono text-sm text-gray-600">
                        {convenioSugerido || "Se asigna al guardar"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {descripcionVinculacion}
                </div>

                {esDependiente && (
                  <div className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                    <Label htmlFor="titular">Titular Responsable</Label>

                    <div ref={titularDropdownRef} className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="titular"
                          ref={titularSearchInputRef}
                          placeholder="Buscar y seleccionar titular..."
                          value={searchTitular}
                          onFocus={() => setTitularBuscadorAbierto(true)}
                          onClick={() => setTitularBuscadorAbierto(true)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchTitular(value);
                            setTitularBuscadorAbierto(true);
                            if (titularSeleccionado && titularSeleccionadoData) {
                              const textoSeleccionado = `${titularSeleccionadoData.nombre_completo} - ${titularSeleccionadoData.cedula}`;
                              if (value !== textoSeleccionado) {
                                setTitularSeleccionado("");
                              }
                            }
                          }}
                          className="h-11 rounded-xl border-slate-300 bg-white pl-10 pr-10 text-slate-900 shadow-sm"
                          disabled={guardando || subiendoContrato}
                        />
                        {searchTitular && !guardando && !subiendoContrato ? (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => {
                              setSearchTitular("");
                              setTitularSeleccionado("");
                              setTitularBuscadorAbierto(true);
                              titularSearchInputRef.current?.focus();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      {titularBuscadorAbierto && (
                        <div className="absolute z-50 mt-2 max-h-[280px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Titulares disponibles
                          </div>
                          <div className="max-h-[228px] overflow-y-auto p-2">
                            {titularesFiltradosParaSelector.slice(0, 12).length > 0 ? (
                              <div className="space-y-1">
                                {titularesFiltradosParaSelector.slice(0, 12).map((titular) => {
                                  const isSelected = titular.id_benefactor.toString() === titularSeleccionado;
                                  return (
                                    <button
                                      key={titular.id_benefactor}
                                      type="button"
                                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                                        isSelected ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-100"
                                      }`}
                                      onClick={() => handleSeleccionTitular(titular.id_benefactor.toString())}
                                    >
                                      <span className="min-w-0">
                                        <span className="block truncate font-medium">{titular.nombre_completo}</span>
                                        <span className="block text-xs text-slate-500">{titular.cedula}</span>
                                      </span>
                                      {isSelected ? (
                                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                          Seleccionado
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="rounded-lg px-3 py-3 text-sm text-slate-500">
                                No se encontraron titulares con esa busqueda.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {titularSeleccionadoData ? (
                      <div className="rounded-xl border border-sky-200 bg-white/90 px-3 py-2 text-sm text-sky-900">
                        <span className="font-medium">Titular seleccionado:</span>{" "}
                        {titularSeleccionadoData.nombre_completo} - {titularSeleccionadoData.cedula}
                      </div>
                    ) : null}

                    {titularesDB.length === 0 && (
                      <p className="text-xs text-amber-600">No hay titulares disponibles en la base de datos.</p>
                    )}
                  </div>
                )}

                {esGrupoExterno && (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Label htmlFor="grupo-cobro-externo">Grupo Externo</Label>
                        <p className="mt-1 text-xs text-amber-800">
                          Este benefactor se cobrara con el convenio compartido de una cuenta externa.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-amber-300 text-amber-900"
                        onClick={() => setMostrarCrearGrupoExterno((prev) => !prev)}
                      >
                        {mostrarCrearGrupoExterno ? "Ocultar formulario" : "Crear grupo externo"}
                      </Button>
                    </div>

                    <Select
                      value={grupoCobroExternoSeleccionado}
                      onValueChange={setGrupoCobroExternoSeleccionado}
                      disabled={guardando || subiendoContrato}
                    >
                      <SelectTrigger id="grupo-cobro-externo" className={formSelectTriggerClass}>
                        <SelectValue placeholder="Seleccione un grupo externo" />
                      </SelectTrigger>
                      <SelectContent>
                        {gruposCobroExterno.map((grupo) => (
                          <SelectItem key={grupo.id_grupo_cobro} value={String(grupo.id_grupo_cobro)}>
                            {grupo.nombre_grupo} - {grupo.n_convenio_cartera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {mostrarCrearGrupoExterno && (
                      <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-200 bg-white p-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-grupo-nombre">Nombre del Grupo</Label>
                          <Input
                            id="nuevo-grupo-nombre"
                            value={nuevoGrupoExterno.nombre_grupo}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, nombre_grupo: e.target.value.toUpperCase() })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-grupo-convenio">Convenio de Cartera</Label>
                          <Input
                            id="nuevo-grupo-convenio"
                            value={nuevoGrupoExterno.n_convenio_cartera}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, n_convenio_cartera: e.target.value.toUpperCase() })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-titular-externo">Titular Externo</Label>
                          <Input
                            id="nuevo-titular-externo"
                            value={nuevoGrupoExterno.nombre_titular_externo}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, nombre_titular_externo: e.target.value.toUpperCase() })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-cedula-externa">Cedula Titular Externo</Label>
                          <Input
                            id="nuevo-cedula-externa"
                            value={nuevoGrupoExterno.cedula_titular_externo}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, cedula_titular_externo: e.target.value })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-banco-externo">Banco</Label>
                          <Input
                            id="nuevo-banco-externo"
                            value={nuevoGrupoExterno.banco_emisor}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, banco_emisor: e.target.value.toUpperCase() })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-num-cuenta-externo">Numero de Cuenta</Label>
                          <Input
                            id="nuevo-num-cuenta-externo"
                            value={nuevoGrupoExterno.num_cuenta}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, num_cuenta: e.target.value })}
                            disabled={guardandoGrupoExterno}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nuevo-tipo-cuenta-externo">Tipo de Cuenta</Label>
                          <Select
                            value={nuevoGrupoExterno.tipo_cuenta}
                            onValueChange={(value) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, tipo_cuenta: value })}
                            disabled={guardandoGrupoExterno}
                          >
                            <SelectTrigger id="nuevo-tipo-cuenta-externo" className={formSelectTriggerClass}>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CORRIENTE">Corriente</SelectItem>
                              <SelectItem value="AHORROS">Ahorros</SelectItem>
                              <SelectItem value="CREDITO">Credito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="nuevo-observacion-grupo">Observacion</Label>
                          <Textarea
                            id="nuevo-observacion-grupo"
                            value={nuevoGrupoExterno.observacion}
                            onChange={(e) => setNuevoGrupoExterno({ ...nuevoGrupoExterno, observacion: e.target.value })}
                            disabled={guardandoGrupoExterno}
                            rows={2}
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button
                            type="button"
                            className="bg-[#1b76b9] hover:bg-[#155a8a] text-white"
                            onClick={handleCrearGrupoExterno}
                            disabled={guardandoGrupoExterno}
                          >
                            Guardar grupo externo
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tipoAfiliacion">Tipo de Afiliacion</Label>
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
                    <SelectTrigger id="tipoAfiliacion" className={formSelectTriggerClass}>
                      <SelectValue placeholder="Seleccione tipo de afiliacion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipoAfiliacion === "individual" && !esDependiente && !esGrupoExterno && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cuenta">Numero de Cuenta Bancaria</Label>
                        <Input
                          id="cuenta"
                          placeholder="Ingrese numero de cuenta"
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
                          <SelectTrigger id="bancoEmisor" className={formSelectTriggerClass}>
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

                    {/* Campos de tarjeta de credito */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="numCuentaTc">Numero de Tarjeta (Opcional)</Label>
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
                          <SelectTrigger id="tipoCuenta" className={formSelectTriggerClass}>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CORRIENTE">Corriente</SelectItem>
                            <SelectItem value="AHORROS">Ahorros</SelectItem>
                            <SelectItem value="CREDITO">Credito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {tipoAfiliacion === "individual" && esDependiente && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Los dependientes usan el debito consolidado de su titular. Por eso no registran cuenta bancaria ni tarjeta propias.
                    </AlertDescription>
                  </Alert>
                )}

                {esGrupoExterno && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      Los benefactores vinculados a grupo externo usan el convenio compartido de esa cuenta y no registran datos bancarios propios para cartera.
                    </AlertDescription>
                  </Alert>
                )}

                {tipoAfiliacion === "corporativo" && (
                  <div className="space-y-2">
                    <Label htmlFor="corporacion">Corporacion</Label>
                    <div className="space-y-1">
                      <Input
                        id="corporacion"
                        list="corporaciones-sugeridas"
                        placeholder="Ingrese nombre de la corporacion"
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
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fechaCarga">Fecha de Carga</Label>
                    <Input id="fechaCarga" type="text" value={new Date().toLocaleDateString("es-EC")} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaSuscripcion">Fecha de Suscripcion</Label>
                    <Input
                      id="fechaSuscripcion"
                      type="date"
                      value={fechaSuscripcion}
                      onChange={(e) => setFechaSuscripcion(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mesProduccion">Mes de Produccion</Label>
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
                  <Label htmlFor="direccion">Direccion</Label>
                  <Input
                    id="direccion"
                    placeholder="Calle principal, numero, referencia"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value.toUpperCase())}
                    disabled={guardando || subiendoContrato}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <SelectTrigger id="provincia" className={formSelectTriggerClass}>
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
                      <SelectTrigger id="ciudad" className={formSelectTriggerClass}>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono</Label>
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
                    <Label htmlFor="email">Correo electronico</Label>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inscripcion">Inscripcion</Label>
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

                {/* Campo de observacion */}
                <div className="space-y-2">
                  <Label htmlFor="observacion">Observacion</Label>
                  <Textarea
                    id="observacion"
                    placeholder="Notas o comentarios adicionales sobre el benefactor..."
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value.toUpperCase())}
                    rows={3}
                    disabled={guardando || subiendoContrato}
                  />
                </div>

                {/* Contrato PDF (obligatorio) */}
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
                    <div className="flex flex-col gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
                      Obligatorio. Solo PDF (max. {MAX_PDF_MB}MB). Puede ser escaneado o foto convertida a PDF.
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
                    <strong>Proteccion de datos:</strong> La informacion de tarjetas de credito se maneja de forma segura segun la normativa ecuatoriana.
                    No se almacena CVV ni informacion sensible en texto plano. Los datos estan enmascarados como ****-****-****-1234.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
        ) : null}
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cedula o nro convenio..."
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
              className="w-full xl:w-10"
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

      {/* Tabla unica de benefactores */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <div className="flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-800">Listado de benefactores</p>
              <p>Consulta el detalle y filtra rapidamente por estado, ciudad o tipo.</p>
            </div>
            <Badge className="w-fit bg-sky-100 text-sky-800 hover:bg-sky-100">
              {benefactoresFiltrados.length} resultado{benefactoresFiltrados.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {/* Tabla desktop */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              {tablaBenefactores.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none rounded px-2 py-1 -mx-2 -my-1 hover:bg-slate-100"
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
                  <TableRow key={row.id} className="border-slate-200 transition-colors hover:bg-slate-50/80">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-4">
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

        {/* Vista movil - Cards */}
        <div className="md:hidden p-4 sm:p-6 space-y-4">
          {tablaBenefactores.getRowModel().rows.length > 0 ? (
            tablaBenefactores.getRowModel().rows.map((row) => {
              const benefactor = row.original;
              return (
                <Card key={benefactor.id_benefactor} className="overflow-hidden border border-slate-200 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-slate-900">{benefactor.nombre_completo}</p>
                        <p className="text-sm text-slate-600 font-mono">{benefactor.n_convenio || benefactor.cedula}</p>
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

                    <div className="grid grid-cols-1 gap-2 text-sm xs:grid-cols-2">
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
                      <Button variant="outline" size="sm" className="w-full border-slate-300 text-slate-700 hover:bg-slate-100">
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

        {/* Paginacion */}
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Mostrando {tablaBenefactores.getState().pagination.pageIndex * tablaBenefactores.getState().pagination.pageSize + 1} a{" "}
            {Math.min(
              (tablaBenefactores.getState().pagination.pageIndex + 1) * tablaBenefactores.getState().pagination.pageSize,
              benefactoresFiltrados.length
            )}{" "}
            de {benefactoresFiltrados.length} registros
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300"
              onClick={() => tablaBenefactores.setPageIndex(0)}
              disabled={!tablaBenefactores.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300"
              onClick={() => tablaBenefactores.previousPage()}
              disabled={!tablaBenefactores.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-slate-600">
              Pagina {tablaBenefactores.getState().pagination.pageIndex + 1} de {tablaBenefactores.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300"
              onClick={() => tablaBenefactores.nextPage()}
              disabled={!tablaBenefactores.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300"
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
            <SelectTrigger className="w-full sm:w-36 border-slate-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} por pagina
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
