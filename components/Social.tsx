import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, AlertCircle, Clock } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedAction } from "./ProtectedAction";
import socialService from "../services/social.service";
import type { BeneficiarioSocial, SeguimientoSocial } from "../types";
import { toast } from "sonner";

type CasoSocialUI = {
  id: number;
  beneficiario: string;
  tipoCaso: BeneficiarioSocial["tipo_caso"];
  prioridad: BeneficiarioSocial["prioridad"];
  estado: BeneficiarioSocial["estado"];
  usuarioCarga: string;
  fechaInicio: string;
  descripcion: string;
  ciudad: string;
};

type HistorialItemUI = {
  id: number;
  fecha: string;
  accion: string;
  responsable: string;
  notas: string;
};

const TIPOS_CASO: BeneficiarioSocial["tipo_caso"][] = [
  "Apoyo alimentario",
  "Apoyo medico" as BeneficiarioSocial["tipo_caso"],
  "Vivienda",
  "Educacion" as BeneficiarioSocial["tipo_caso"],
  "Apoyo psicologico" as BeneficiarioSocial["tipo_caso"],
  "Otro",
];

const PRIORIDADES: BeneficiarioSocial["prioridad"][] = ["Alta", "Media", "Baja"];

function normalizeTipoCaso(tipo: string): BeneficiarioSocial["tipo_caso"] {
  const map: Record<string, BeneficiarioSocial["tipo_caso"]> = {
    "Apoyo alimentario": "Apoyo alimentario",
    "Apoyo medico": "Apoyo m\u00e9dico",
    "Apoyo m\u00e9dico": "Apoyo m\u00e9dico",
    "Vivienda": "Vivienda",
    "Educacion": "Educaci\u00f3n",
    "Educaci\u00f3n": "Educaci\u00f3n",
    "Apoyo psicologico": "Apoyo psicol\u00f3gico",
    "Apoyo psicol\u00f3gico": "Apoyo psicol\u00f3gico",
    "Otro": "Otro",
  };
  return map[tipo] || "Otro";
}

function normalizeUpperAsciiText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

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

const TABS_CASO = [
  "informacion_personal",
  "familiar_convivencia",
  "vivienda",
  "salud",
  "nutricion",
  "recursos",
  "red_apoyo",
  "coordenadas",
  "levantamiento",
] as const;

type TabCaso = typeof TABS_CASO[number];

const INITIAL_RELACIONES = [
  { nombre_familiar: "", forma_convivencia: "OCASIONAL", edad: "", cedula: "", telefono: "" },
  { nombre_familiar: "", forma_convivencia: "OCASIONAL", edad: "", cedula: "", telefono: "" },
  { nombre_familiar: "", forma_convivencia: "OCASIONAL", edad: "", cedula: "", telefono: "" },
];

const initialCasoForm = () => ({
  tipo_caso: "Otro",
  prioridad: "Media",
  nombres: "",
  apellidos: "",
  sexo: "",
  edad: "",
  cedula: "",
  nacionalidad: "",
  estado_civil: "",
  tipo_sangre: "",
  direccion: "",
  fecha_nacimiento: "",
  ciudad: "",
  provincia: "",
  pais: "ECUADOR",
  telefono: "",
  referencia: "",
  discapacidad: "NO",
  discapacidad_detalle: "",
  con_quien_vive: "",
  con_quien_vive_detalle: "",
  relaciones_familiares: INITIAL_RELACIONES,
  vivienda_reside: "",
  vivienda_barreras: "",
  vivienda_estado: "",
  vivienda_paredes: "",
  vivienda_piso: "",
  vivienda_techo: "",
  vivienda_servicios: "",
  salud_estado_general: "",
  enfermedad_catastrofica: "NO",
  toma_medicacion_constante: "NO",
  alergia_medicamentos: "NO",
  alergia_medicamentos_detalle: "",
  nutricion_num_comidas: "",
  nutricion_desayuno: "NO",
  nutricion_almuerzo: "NO",
  nutricion_merienda: "NO",
  nutricion_consume_frutas: "NO",
  recibe_pension: "NO",
  pension_monto: "",
  pension_tipo: "",
  pension_indique_cual: "",
  pension_quien_cobra_1: "",
  pension_quien_cobra_2: "",
  pension_quien_cobra_3: "",
  red_actividades: "NO",
  red_actividades_cuales: "",
  red_sale_domicilio: "NO",
  red_sale_donde: "",
  red_pertenece_org: "NO",
  red_nombre_org: "",
  red_actividad_org: "",
  red_info_fuentes: "",
  red_habla_con_quien: "",
  latitud: "",
  longitud: "",
  se_siente_acompanado: "NO",
  perdida_familiar_reciente: "NO",
  perdida_familiar_detalle: "",
  observaciones_conclusiones: "",
  fecha_generacion_ficha: new Date().toISOString().slice(0, 10),
});

function MapaSelector({
  lat,
  lng,
  onSelect,
}: {
  lat: number;
  lng: number;
  onSelect: (latitud: number, longitud: number) => void;
}) {
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "320px", width: "100%", borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: "#1b76b9", fillColor: "#1b76b9", fillOpacity: 0.7 }} />
      <MapClickHandler />
    </MapContainer>
  );
}

export default function Social() {
  const navigate = useNavigate();
  const { permisos } = useAuth();
  const puedeLeer = permisos?.social_lectura ?? false;
  const puedeEscribir = permisos?.social_escritura ?? false;

  const [casos, setCasos] = useState<CasoSocialUI[]>([]);
  const [loadingCasos, setLoadingCasos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [prioridadFilter, setPrioridadFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<CasoSocialUI | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const [historial, setHistorial] = useState<HistorialItemUI[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [savingCaso, setSavingCaso] = useState(false);
  const [nuevoCaso, setNuevoCaso] = useState(initialCasoForm());
  const [tabCaso, setTabCaso] = useState<TabCaso>("informacion_personal");
  const [fichaPdf, setFichaPdf] = useState<File | null>(null);
  const [firmaImagen, setFirmaImagen] = useState<File | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);

  const countryOptions = useState(() => {
    const regionCodes: string[] = typeof (Intl as any).supportedValuesOf === "function"
      ? (Intl as any).supportedValuesOf("region")
      : ["EC", "CO", "PE", "CL", "AR", "UY", "PY", "BO", "MX", "US", "ES", "IT", "FR", "DE"];
    const regionNames = new Intl.DisplayNames(["es"], { type: "region" });
    return regionCodes
      .map((code) => ({
        code,
        name: normalizeUpperAsciiText(regionNames.of(code) || code),
      }))
      .filter((item) => item.name && item.name.length > 1)
      .sort((a, b) => a.name.localeCompare(b.name));
  })[0];

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "-";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString("es-EC");
  };

  const mapCaso = (item: BeneficiarioSocial): CasoSocialUI => ({
    id: item.id_beneficiario_social,
    beneficiario: item.nombre_completo,
    tipoCaso: item.tipo_caso,
    prioridad: item.prioridad,
    estado: item.estado,
    usuarioCarga: item.nombre_usuario_carga || `usuario_${item.id_usuario_carga}`,
    fechaInicio: formatearFecha(item.fecha_inicio),
    descripcion: item.descripcion_caso,
    ciudad: item.ciudad || "-",
  });

  const cargarCasos = async () => {
    try {
      setLoadingCasos(true);
      const response = await socialService.obtenerCasosSociales();
      const lista = Array.isArray(response?.beneficiarios) ? response.beneficiarios : [];
      setCasos(lista.map(mapCaso));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Error al cargar casos sociales");
      setCasos([]);
    } finally {
      setLoadingCasos(false);
    }
  };

  useEffect(() => {
    if (!puedeLeer) return;
    cargarCasos();
  }, [puedeLeer]);

  useEffect(() => {
    if (!showHistorial || !selectedCaso) return;

    const cargarHistorial = async () => {
      try {
        setLoadingHistorial(true);
        const response = await socialService.obtenerSeguimiento(selectedCaso.id);
        const lista: SeguimientoSocial[] = Array.isArray(response?.seguimientos) ? response.seguimientos : [];
        setHistorial(
          lista.map((item) => ({
            id: item.id_seguimiento,
            fecha: formatearFecha(item.fecha_evento),
            accion: item.tipo_evento,
            responsable: item.responsable || `usuario_${item.id_usuario}`,
            notas: item.descripcion,
          }))
        );
      } catch (error: any) {
        toast.error(error?.response?.data?.error || "Error al cargar historial");
        setHistorial([]);
      } finally {
        setLoadingHistorial(false);
      }
    };

    cargarHistorial();
  }, [showHistorial, selectedCaso]);

  const handleFormValue = (field: string, value: string) => {
    setNuevoCaso((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpperFormValue = (field: string, value: string) => {
    handleFormValue(field, normalizeUpperAsciiText(value));
  };

  const updateRelacion = (idx: number, field: string, value: string) => {
    setNuevoCaso((prev: any) => {
      const relaciones = [...prev.relaciones_familiares];
      relaciones[idx] = {
        ...relaciones[idx],
        [field]: field === "forma_convivencia" ? value : normalizeUpperAsciiText(value),
      };
      return { ...prev, relaciones_familiares: relaciones };
    });
  };

  const handleCapturarUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error("El navegador no soporta geolocalizacion");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNuevoCaso((prev: any) => ({
          ...prev,
          latitud: String(position.coords.latitude.toFixed(7)),
          longitud: String(position.coords.longitude.toFixed(7)),
        }));
      },
      () => {
        toast.error("No fue posible obtener la ubicacion");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCrearCaso = async () => {
    if (!nuevoCaso.nombres || !nuevoCaso.apellidos || !nuevoCaso.sexo || !nuevoCaso.cedula) {
      toast.error("Completa los datos obligatorios de informacion personal");
      setTabCaso("informacion_personal");
      return;
    }

    if (!validarCedulaEcuador(nuevoCaso.cedula)) {
      toast.error("La cedula ingresada no es valida");
      setTabCaso("informacion_personal");
      return;
    }

    if (!fichaPdf) {
      toast.error("Debes adjuntar el PDF de ficha social");
      setTabCaso("levantamiento");
      return;
    }

    const payload = {
      tipo_caso: normalizeTipoCaso(nuevoCaso.tipo_caso || "Otro"),
      prioridad: (nuevoCaso.prioridad || "Media") as BeneficiarioSocial["prioridad"],
      nombres: nuevoCaso.nombres,
      apellidos: nuevoCaso.apellidos,
      sexo: nuevoCaso.sexo,
      edad: nuevoCaso.edad ? Number(nuevoCaso.edad) : undefined,
      cedula: nuevoCaso.cedula,
      nacionalidad: nuevoCaso.nacionalidad || undefined,
      estado_civil: nuevoCaso.estado_civil || undefined,
      tipo_sangre: nuevoCaso.tipo_sangre || undefined,
      direccion: nuevoCaso.direccion || undefined,
      fecha_nacimiento: nuevoCaso.fecha_nacimiento || undefined,
      ciudad: nuevoCaso.ciudad || undefined,
      provincia: nuevoCaso.provincia || undefined,
      pais: nuevoCaso.pais || undefined,
      telefono: nuevoCaso.telefono || undefined,
      referencia: nuevoCaso.referencia || undefined,
      discapacidad: nuevoCaso.discapacidad === "SI",
      discapacidad_detalle: nuevoCaso.discapacidad === "SI" ? (nuevoCaso.discapacidad_detalle || undefined) : undefined,
      con_quien_vive: nuevoCaso.con_quien_vive || undefined,
      con_quien_vive_detalle: nuevoCaso.con_quien_vive_detalle || undefined,
      relaciones_familiares: nuevoCaso.relaciones_familiares.filter((r: any) => r.nombre_familiar?.trim().length > 0),
      situacion_vivienda: {
        vivienda_reside: nuevoCaso.vivienda_reside,
        barreras: nuevoCaso.vivienda_barreras,
        estado: nuevoCaso.vivienda_estado,
        paredes: nuevoCaso.vivienda_paredes,
        piso: nuevoCaso.vivienda_piso,
        techo: nuevoCaso.vivienda_techo,
        servicios: nuevoCaso.vivienda_servicios,
      },
      salud_estado_general: nuevoCaso.salud_estado_general || undefined,
      enfermedad_catastrofica: nuevoCaso.enfermedad_catastrofica === "SI",
      toma_medicacion_constante: nuevoCaso.toma_medicacion_constante === "SI",
      alergia_medicamentos: nuevoCaso.alergia_medicamentos === "SI",
      alergia_medicamentos_detalle: nuevoCaso.alergia_medicamentos === "SI" ? (nuevoCaso.alergia_medicamentos_detalle || undefined) : undefined,
      nutricion_num_comidas: nuevoCaso.nutricion_num_comidas ? Number(nuevoCaso.nutricion_num_comidas) : undefined,
      nutricion_desayuno: nuevoCaso.nutricion_desayuno === "SI",
      nutricion_almuerzo: nuevoCaso.nutricion_almuerzo === "SI",
      nutricion_merienda: nuevoCaso.nutricion_merienda === "SI",
      nutricion_consume_frutas: nuevoCaso.nutricion_consume_frutas === "SI",
      recursos_economicos: {
        recibe_pension: nuevoCaso.recibe_pension === "SI",
        monto: nuevoCaso.pension_monto || undefined,
        tipo_pension: nuevoCaso.pension_tipo || undefined,
        indique_cual: nuevoCaso.pension_indique_cual || undefined,
        quien_cobra: [nuevoCaso.pension_quien_cobra_1, nuevoCaso.pension_quien_cobra_2, nuevoCaso.pension_quien_cobra_3].filter(Boolean),
      },
      red_social_apoyo: {
        actividades_tiempo_libre: nuevoCaso.red_actividades === "SI",
        cuales_actividades: nuevoCaso.red_actividades_cuales || undefined,
        sale_domicilio: nuevoCaso.red_sale_domicilio === "SI",
        donde_sale: nuevoCaso.red_sale_donde || undefined,
        pertenece_organizacion: nuevoCaso.red_pertenece_org === "SI",
        nombre_organizacion: nuevoCaso.red_nombre_org || undefined,
        actividad_organizacion: nuevoCaso.red_actividad_org || undefined,
        info_fuentes: nuevoCaso.red_info_fuentes || undefined,
        habla_con_quien: nuevoCaso.red_habla_con_quien || undefined,
      },
      latitud: nuevoCaso.latitud ? Number(nuevoCaso.latitud) : undefined,
      longitud: nuevoCaso.longitud ? Number(nuevoCaso.longitud) : undefined,
      se_siente_acompanado: nuevoCaso.se_siente_acompanado === "SI",
      perdida_familiar_reciente: nuevoCaso.perdida_familiar_reciente === "SI",
      perdida_familiar_detalle: nuevoCaso.perdida_familiar_reciente === "SI" ? (nuevoCaso.perdida_familiar_detalle || undefined) : undefined,
      observaciones_conclusiones: nuevoCaso.observaciones_conclusiones || undefined,
      fecha_generacion_ficha: nuevoCaso.fecha_generacion_ficha || undefined,
      descripcion_caso: "FICHA SOCIAL ADULTO MAYOR",
    };

    try {
      setSavingCaso(true);
      await socialService.crearCasoSocial(payload, {
        fichaPdf,
        firma: firmaImagen,
      });
      toast.success("Caso social registrado");
      setIsDialogOpen(false);
      setNuevoCaso(initialCasoForm());
      setTabCaso("informacion_personal");
      setFichaPdf(null);
      setFirmaImagen(null);
      await cargarCasos();
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || "Error al registrar caso social";
      toast.error(msg);
    } finally {
      setSavingCaso(false);
    }
  };

  const filteredCasos = casos.filter((caso) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      caso.beneficiario.toLowerCase().includes(term) ||
      caso.tipoCaso.toLowerCase().includes(term) ||
      caso.usuarioCarga.toLowerCase().includes(term);
    const matchesEstado = estadoFilter === "todos" || caso.estado === estadoFilter;
    const matchesPrioridad = prioridadFilter === "todos" || caso.prioridad === prioridadFilter;
    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      "Activo": "bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white",
      "En seguimiento": "bg-yellow-500 hover:bg-yellow-600 text-white",
      "Cerrado": "bg-gray-400 hover:bg-gray-500 text-white",
    };
    return colors[estado] || "bg-gray-400 text-white";
  };

  const getPrioridadBadge = (prioridad: string) => {
    const colors: Record<string, string> = {
      "Alta": "bg-red-500 hover:bg-red-600 text-white",
      "Media": "bg-orange-500 hover:bg-orange-600 text-white",
      "Baja": "bg-blue-500 hover:bg-blue-600 text-white",
    };
    return colors[prioridad] || "bg-gray-400 text-white";
  };

  const casosActivos = casos.filter((c) => c.estado === "Activo").length;
  const casosEnSeguimiento = casos.filter((c) => c.estado === "En seguimiento").length;
  const casosCerrados = casos.filter((c) => c.estado === "Cerrado").length;

  if (!puedeLeer) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-xl text-gray-800 mb-2">Acceso denegado</h2>
        <p className="text-gray-600">No tienes permiso para visualizar casos sociales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1D1D1D] mb-2">Gestion de Casos Sociales</h1>
          <p className="text-gray-600">Gestion de casos sociales y seguimiento</p>
        </div>
        <div className="flex gap-2">
          <ProtectedAction permiso="social_escritura">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar caso social
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Caso Social</DialogTitle>
                </DialogHeader>

                <Tabs value={tabCaso} onValueChange={(v) => setTabCaso(v as TabCaso)} className="w-full">
                  <TabsList className="grid grid-cols-3 lg:grid-cols-9 h-auto gap-1 bg-gray-100 p-1">
                    <TabsTrigger value="informacion_personal">Personal</TabsTrigger>
                    <TabsTrigger value="familiar_convivencia">Familiar</TabsTrigger>
                    <TabsTrigger value="vivienda">Vivienda</TabsTrigger>
                    <TabsTrigger value="salud">Salud</TabsTrigger>
                    <TabsTrigger value="nutricion">Nutricion</TabsTrigger>
                    <TabsTrigger value="recursos">Recursos</TabsTrigger>
                    <TabsTrigger value="red_apoyo">Red apoyo</TabsTrigger>
                    <TabsTrigger value="coordenadas">Coordenadas</TabsTrigger>
                    <TabsTrigger value="levantamiento">Levantamiento</TabsTrigger>
                  </TabsList>

                  <TabsContent value="informacion_personal" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nombres *</Label>
                        <Input value={nuevoCaso.nombres} onChange={(e) => handleUpperFormValue("nombres", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Apellidos *</Label>
                        <Input value={nuevoCaso.apellidos} onChange={(e) => handleUpperFormValue("apellidos", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Sexo *</Label>
                        <Select value={nuevoCaso.sexo} onValueChange={(v) => handleFormValue("sexo", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Edad</Label>
                        <Input type="number" value={nuevoCaso.edad} onChange={(e) => handleFormValue("edad", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>N Cedula *</Label>
                        <Input value={nuevoCaso.cedula} onChange={(e) => handleFormValue("cedula", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de nacimiento</Label>
                        <Input type="date" value={nuevoCaso.fecha_nacimiento} onChange={(e) => handleFormValue("fecha_nacimiento", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de sangre</Label>
                        <Input value={nuevoCaso.tipo_sangre} onChange={(e) => handleUpperFormValue("tipo_sangre", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nacionalidad</Label>
                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              {nuevoCaso.nacionalidad || "Seleccione pais"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-[320px]">
                            <Command>
                              <CommandInput placeholder="Buscar pais..." />
                              <CommandList>
                                <CommandEmpty>Sin resultados</CommandEmpty>
                                <CommandGroup>
                                  {countryOptions.map((country: any) => (
                                    <CommandItem
                                      key={country.code}
                                      value={country.name}
                                      onSelect={() => {
                                        handleFormValue("nacionalidad", country.name);
                                        handleFormValue("pais", country.name);
                                        setCountryOpen(false);
                                      }}
                                    >
                                      {country.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Estado civil</Label>
                        <Select value={nuevoCaso.estado_civil} onValueChange={(v) => handleFormValue("estado_civil", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SOLTERO">SOLTERO</SelectItem>
                            <SelectItem value="CASADO">CASADO</SelectItem>
                            <SelectItem value="DIVORCIADO">DIVORCIADO</SelectItem>
                            <SelectItem value="VIUDO">VIUDO</SelectItem>
                            <SelectItem value="UNION LIBRE">UNION LIBRE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pais</Label>
                        <Input value={nuevoCaso.pais} onChange={(e) => handleUpperFormValue("pais", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Direccion</Label>
                        <Input value={nuevoCaso.direccion} onChange={(e) => handleUpperFormValue("direccion", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Referencia</Label>
                        <Input value={nuevoCaso.referencia} onChange={(e) => handleUpperFormValue("referencia", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Ciudad</Label>
                        <Input value={nuevoCaso.ciudad} onChange={(e) => handleUpperFormValue("ciudad", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Provincia</Label>
                        <Input value={nuevoCaso.provincia} onChange={(e) => handleUpperFormValue("provincia", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefono</Label>
                        <Input value={nuevoCaso.telefono} onChange={(e) => handleUpperFormValue("telefono", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Discapacidad</Label>
                        <Select value={nuevoCaso.discapacidad} onValueChange={(v) => handleFormValue("discapacidad", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SI">SI</SelectItem>
                            <SelectItem value="NO">NO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {nuevoCaso.discapacidad === "SI" && (
                      <div className="space-y-2">
                        <Label>Especifique discapacidad</Label>
                        <Input value={nuevoCaso.discapacidad_detalle} onChange={(e) => handleUpperFormValue("discapacidad_detalle", e.target.value)} />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="familiar_convivencia" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Con quien vive</Label>
                        <Select value={nuevoCaso.con_quien_vive} onValueChange={(v) => handleFormValue("con_quien_vive", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SOLO">SOLO</SelectItem>
                            <SelectItem value="CONYUGE/PAREJA">CONYUGE/PAREJA</SelectItem>
                            <SelectItem value="FAMILIARES">FAMILIARES/QUIEN</SelectItem>
                            <SelectItem value="OTROS">OTROS/QUIEN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Detalle</Label>
                        <Input value={nuevoCaso.con_quien_vive_detalle} onChange={(e) => handleUpperFormValue("con_quien_vive_detalle", e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Relaciones familiares mas importantes (maximo 3)</Label>
                      <div className="space-y-2">
                        {nuevoCaso.relaciones_familiares.map((rel: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <Input placeholder="Nombre" value={rel.nombre_familiar} onChange={(e) => updateRelacion(idx, "nombre_familiar", e.target.value)} />
                            <Select value={rel.forma_convivencia} onValueChange={(v) => updateRelacion(idx, "forma_convivencia", v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OCASIONAL">OCASIONAL</SelectItem>
                                <SelectItem value="PERMANENTE">PERMANENTE</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Edad" type="number" value={rel.edad} onChange={(e) => updateRelacion(idx, "edad", e.target.value)} />
                            <Input placeholder="Cedula" value={rel.cedula} onChange={(e) => updateRelacion(idx, "cedula", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            <Input placeholder="Telefono" value={rel.telefono} onChange={(e) => updateRelacion(idx, "telefono", e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vivienda" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Vivienda en la que reside</Label>
                        <Select value={nuevoCaso.vivienda_reside} onValueChange={(v) => handleFormValue("vivienda_reside", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROPIA">PROPIA</SelectItem>
                            <SelectItem value="ALQUILADA">ALQUILADA</SelectItem>
                            <SelectItem value="FAMILIAR">FAMILIAR</SelectItem>
                            <SelectItem value="PRESTADA">PRESTADA</SelectItem>
                            <SelectItem value="OTRO">OTRO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Barreras arquitectonicas</Label>
                        <Input value={nuevoCaso.vivienda_barreras} onChange={(e) => handleUpperFormValue("vivienda_barreras", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado vivienda</Label>
                        <Input value={nuevoCaso.vivienda_estado} onChange={(e) => handleUpperFormValue("vivienda_estado", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2"><Label>Paredes</Label><Input value={nuevoCaso.vivienda_paredes} onChange={(e) => handleUpperFormValue("vivienda_paredes", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Piso</Label><Input value={nuevoCaso.vivienda_piso} onChange={(e) => handleUpperFormValue("vivienda_piso", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Techo</Label><Input value={nuevoCaso.vivienda_techo} onChange={(e) => handleUpperFormValue("vivienda_techo", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Servicios basicos</Label><Input value={nuevoCaso.vivienda_servicios} onChange={(e) => handleUpperFormValue("vivienda_servicios", e.target.value)} /></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="salud" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estado de salud general</Label>
                        <Select value={nuevoCaso.salud_estado_general} onValueChange={(v) => handleFormValue("salud_estado_general", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUENA">BUENA</SelectItem>
                            <SelectItem value="REGULAR">REGULAR</SelectItem>
                            <SelectItem value="MALA">MALA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Enfermedad catastrofica</Label><Select value={nuevoCaso.enfermedad_catastrofica} onValueChange={(v) => handleFormValue("enfermedad_catastrofica", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Toma medicacion constante</Label><Select value={nuevoCaso.toma_medicacion_constante} onValueChange={(v) => handleFormValue("toma_medicacion_constante", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Alergia a medicamentos</Label><Select value={nuevoCaso.alergia_medicamentos} onValueChange={(v) => handleFormValue("alergia_medicamentos", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                    </div>
                    {nuevoCaso.alergia_medicamentos === "SI" && (
                      <div className="space-y-2">
                        <Label>Especifique alergia</Label>
                        <Input value={nuevoCaso.alergia_medicamentos_detalle} onChange={(e) => handleUpperFormValue("alergia_medicamentos_detalle", e.target.value)} />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="nutricion" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Numero comidas diarias</Label><Input type="number" value={nuevoCaso.nutricion_num_comidas} onChange={(e) => handleFormValue("nutricion_num_comidas", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Consume frutas</Label><Select value={nuevoCaso.nutricion_consume_frutas} onValueChange={(v) => handleFormValue("nutricion_consume_frutas", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Desayuno</Label><Select value={nuevoCaso.nutricion_desayuno} onValueChange={(v) => handleFormValue("nutricion_desayuno", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Almuerzo</Label><Select value={nuevoCaso.nutricion_almuerzo} onValueChange={(v) => handleFormValue("nutricion_almuerzo", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Merienda</Label><Select value={nuevoCaso.nutricion_merienda} onValueChange={(v) => handleFormValue("nutricion_merienda", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recursos" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2"><Label>Recibe pension</Label><Select value={nuevoCaso.recibe_pension} onValueChange={(v) => handleFormValue("recibe_pension", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Monto</Label><Input value={nuevoCaso.pension_monto} onChange={(e) => handleFormValue("pension_monto", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Tipo pension</Label><Input value={nuevoCaso.pension_tipo} onChange={(e) => handleUpperFormValue("pension_tipo", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Indique cual</Label><Input value={nuevoCaso.pension_indique_cual} onChange={(e) => handleUpperFormValue("pension_indique_cual", e.target.value)} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Quien cobra estos ingresos (hasta 3 filas)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input value={nuevoCaso.pension_quien_cobra_1} onChange={(e) => handleUpperFormValue("pension_quien_cobra_1", e.target.value)} placeholder="Fila 1" />
                        <Input value={nuevoCaso.pension_quien_cobra_2} onChange={(e) => handleUpperFormValue("pension_quien_cobra_2", e.target.value)} placeholder="Fila 2" />
                        <Input value={nuevoCaso.pension_quien_cobra_3} onChange={(e) => handleUpperFormValue("pension_quien_cobra_3", e.target.value)} placeholder="Fila 3" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="red_apoyo" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Ocupa tiempo libre en actividades</Label><Select value={nuevoCaso.red_actividades} onValueChange={(v) => handleFormValue("red_actividades", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Cuales</Label><Input value={nuevoCaso.red_actividades_cuales} onChange={(e) => handleUpperFormValue("red_actividades_cuales", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Sale de su domicilio</Label><Select value={nuevoCaso.red_sale_domicilio} onValueChange={(v) => handleFormValue("red_sale_domicilio", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Donde</Label><Input value={nuevoCaso.red_sale_donde} onChange={(e) => handleUpperFormValue("red_sale_donde", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Pertenece a organizacion</Label><Select value={nuevoCaso.red_pertenece_org} onValueChange={(v) => handleFormValue("red_pertenece_org", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Nombre organizacion</Label><Input value={nuevoCaso.red_nombre_org} onChange={(e) => handleUpperFormValue("red_nombre_org", e.target.value)} /></div>
                    </div>
                    <div className="space-y-2"><Label>Actividad en la organizacion</Label><Input value={nuevoCaso.red_actividad_org} onChange={(e) => handleUpperFormValue("red_actividad_org", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Fuentes de informacion</Label><Textarea rows={2} value={nuevoCaso.red_info_fuentes} onChange={(e) => handleUpperFormValue("red_info_fuentes", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Cuando necesita hablar con alguien, con quien</Label><Textarea rows={2} value={nuevoCaso.red_habla_con_quien} onChange={(e) => handleUpperFormValue("red_habla_con_quien", e.target.value)} /></div>
                  </TabsContent>

                  <TabsContent value="coordenadas" className="space-y-4 mt-4">
                    <p className="text-sm text-gray-600">Si es posible, puedes capturar coordenadas automaticamente o ingresarlas manualmente.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Latitud</Label><Input value={nuevoCaso.latitud} onChange={(e) => handleFormValue("latitud", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Longitud</Label><Input value={nuevoCaso.longitud} onChange={(e) => handleFormValue("longitud", e.target.value)} /></div>
                      <div className="flex items-end">
                        <Button className="w-full bg-[#1b76b9] hover:bg-[#155a8a] text-white" onClick={handleCapturarUbicacion} type="button">
                          Usar ubicacion actual
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mapa interactivo (click para guardar ubicacion)</Label>
                      <MapaSelector
                        lat={Number(nuevoCaso.latitud) || -0.180653}
                        lng={Number(nuevoCaso.longitud) || -78.467834}
                        onSelect={(latitud, longitud) => {
                          setNuevoCaso((prev: any) => ({
                            ...prev,
                            latitud: latitud.toFixed(7),
                            longitud: longitud.toFixed(7),
                          }));
                        }}
                      />
                      <p className="text-xs text-gray-500">Tip: el marcador se posiciona en las coordenadas actuales del formulario.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="levantamiento" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Se siente acompanado</Label><Select value={nuevoCaso.se_siente_acompanado} onValueChange={(v) => handleFormValue("se_siente_acompanado", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Ha perdido familiar/amigo cercano en ultimo ano</Label><Select value={nuevoCaso.perdida_familiar_reciente} onValueChange={(v) => handleFormValue("perdida_familiar_reciente", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SI">SI</SelectItem><SelectItem value="NO">NO</SelectItem></SelectContent></Select></div>
                    </div>
                    {nuevoCaso.perdida_familiar_reciente === "SI" && (
                      <div className="space-y-2">
                        <Label>Especifique</Label>
                        <Input value={nuevoCaso.perdida_familiar_detalle} onChange={(e) => handleUpperFormValue("perdida_familiar_detalle", e.target.value)} />
                      </div>
                    )}
                    <div className="space-y-2"><Label>Observaciones y conclusiones</Label><Textarea rows={4} value={nuevoCaso.observaciones_conclusiones} onChange={(e) => handleUpperFormValue("observaciones_conclusiones", e.target.value)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Fecha generacion ficha</Label><Input type="date" value={nuevoCaso.fecha_generacion_ficha} onChange={(e) => handleFormValue("fecha_generacion_ficha", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Ficha social PDF *</Label><Input type="file" accept=".pdf" onChange={(e) => setFichaPdf(e.target.files?.[0] || null)} /></div>
                      <div className="space-y-2"><Label>Firma (imagen)</Label><Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setFirmaImagen(e.target.files?.[0] || null)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de caso</Label>
                        <Select value={nuevoCaso.tipo_caso} onValueChange={(v) => handleFormValue("tipo_caso", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                          <SelectContent>
                            {TIPOS_CASO.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select value={nuevoCaso.prioridad} onValueChange={(v) => handleFormValue("prioridad", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccione prioridad" /></SelectTrigger>
                          <SelectContent>
                            {PRIORIDADES.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      disabled={TABS_CASO.indexOf(tabCaso) === 0}
                      onClick={() => setTabCaso(TABS_CASO[Math.max(TABS_CASO.indexOf(tabCaso) - 1, 0)])}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={TABS_CASO.indexOf(tabCaso) === TABS_CASO.length - 1}
                      onClick={() => setTabCaso(TABS_CASO[Math.min(TABS_CASO.indexOf(tabCaso) + 1, TABS_CASO.length - 1)])}
                    >
                      Siguiente
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={savingCaso}>Cancelar</Button>
                    <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C] text-white" onClick={handleCrearCaso} disabled={savingCaso}>
                      {savingCaso ? "Guardando..." : "Registrar caso"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ProtectedAction>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">Casos Activos</p><p className="text-3xl text-[#1D1D1D]">{casosActivos}</p></div><div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">En Seguimiento</p><p className="text-3xl text-[#1D1D1D]">{casosEnSeguimiento}</p></div><div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 mb-1">Casos Cerrados</p><p className="text-3xl text-[#1D1D1D]">{casosCerrados}</p></div><div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center"><AlertCircle className="h-6 w-6 text-white" /></div></div></CardContent></Card>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por beneficiario, tipo o usuario" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las prioridades</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Beneficiario</TableHead>
                <TableHead>Tipo de Caso</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCasos.map((caso) => (
                <TableRow key={caso.id}>
                  <TableCell>{caso.beneficiario}</TableCell>
                  <TableCell>{caso.tipoCaso}</TableCell>
                  <TableCell><Badge className={getPrioridadBadge(caso.prioridad)}>{caso.prioridad}</Badge></TableCell>
                  <TableCell><Badge className={getEstadoBadge(caso.estado)}>{caso.estado}</Badge></TableCell>
                  <TableCell>{caso.usuarioCarga}</TableCell>
                  <TableCell><span className="text-sm text-gray-600">{caso.ciudad}</span></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCaso(caso); setShowHistorial(true); }}>Ver detalle</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {!loadingCasos && filteredCasos.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron casos con los filtros aplicados</div>}
        {loadingCasos && <div className="text-center py-12 text-gray-500">Cargando casos sociales...</div>}
      </div>

      <div className="text-sm text-gray-600">Mostrando {filteredCasos.length} de {casos.length} casos</div>

      {selectedCaso && (
        <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Detalle del Caso Social</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-600">Beneficiario</p><p className="text-lg text-[#1D1D1D]">{selectedCaso.beneficiario}</p></div>
                <div className="flex gap-2"><Badge className={getPrioridadBadge(selectedCaso.prioridad)}>{selectedCaso.prioridad}</Badge><Badge className={getEstadoBadge(selectedCaso.estado)}>{selectedCaso.estado}</Badge></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600 mb-1">Tipo de caso</p><p className="text-[#1D1D1D]">{selectedCaso.tipoCaso}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Ciudad</p><p className="text-[#1D1D1D]">{selectedCaso.ciudad}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Fecha de inicio</p><p className="text-[#1D1D1D]">{selectedCaso.fechaInicio}</p></div>
                <div><p className="text-sm text-gray-600 mb-1">Usuario</p><p className="text-[#1D1D1D]">{selectedCaso.usuarioCarga}</p></div>
              </div>
              <div><p className="text-sm text-gray-600 mb-2">Descripcion</p><p className="text-[#1D1D1D] text-sm p-4 bg-gray-50 rounded-lg">{selectedCaso.descripcion}</p></div>
              <Separator />
              <div>
                <h3 className="text-[#1D1D1D] mb-4 flex items-center gap-2"><Clock className="h-5 w-5" />Historial de Seguimiento</h3>
                {!puedeEscribir && <p className="text-xs text-gray-500 mb-3">Modo solo lectura: no puedes agregar seguimiento.</p>}
                <div className="space-y-4">
                  {loadingHistorial && <p className="text-sm text-gray-500 text-center py-4">Cargando historial...</p>}
                  {!loadingHistorial && historial.map((item) => (
                    <div key={item.id} className="relative pl-8 pb-4 border-l-2 border-[#0F8F5B] last:border-transparent">
                      <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-[#0F8F5B] border-2 border-white" />
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div><p className="text-sm text-[#1D1D1D]">{item.accion}</p><p className="text-xs text-gray-600">Por: {item.responsable}</p></div>
                          <span className="text-xs text-gray-500">{item.fecha}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{item.notas}</p>
                      </div>
                    </div>
                  ))}
                  {!loadingHistorial && historial.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay historial de seguimiento disponible</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistorial(false)}>Cerrar</Button>
              {puedeEscribir && <Button className="bg-[#4064E3] hover:bg-[#3451C2] text-white" onClick={() => navigate("/social/seguimiento")}>Agregar seguimiento</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
