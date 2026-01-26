import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { Link } from "react-router";
import { Plus, Search, Eye, Users, User, Upload, FileText, AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { benefactoresService } from "../services/benefactores.service";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { Benefactor } from "../types";

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
  const { user } = useAuth();
  const esAdmin = user?.roles?.some((r) => r.nombre === "ADMINISTRADOR") ?? false;

  const [benefactores, setBenefactores] = useState<Benefactor[]>([]);

  // ✅ lista independiente SOLO de TITULARES (sin filtro por ejecutivo)
  const [titularesDB, setTitularesDB] = useState<Benefactor[]>([]);

  const [convenio, setConvenio] = useState("");
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

  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [ciudadFilter, setCiudadFilter] = useState("todos");

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
      const response = await benefactoresService.getBenefactores();
      const data: Benefactor[] = response.data;

      setConvenioSugerido(sugerirSiguienteConvenio(data));

      // ✅ TODOS los TITULARES para el selector del dependiente
      const todosTitulares = data.filter((b) => b.tipo_benefactor === "TITULAR");
      setTitularesDB(todosTitulares);

      // Vista de tabla: ADMIN ve todo; EJECUTIVO ve los suyos aprobados
      const benefactoresVisibles = esAdmin
        ? data
        : data.filter((b) => b.id_usuario === user?.id_usuario && b.estado_registro === "APROBADO");

      setBenefactores(benefactoresVisibles);
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
    setTipoBenefactor("TITULAR");
    setTipoAfiliacion("individual");
    setTitularSeleccionado("");
    setSearchTitular("");
    setConvenio("");
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
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim(),
        ciudad,
        provincia,
        n_convenio: convenio.trim() || undefined,
        mes_prod: mesProduccion || undefined,
        tipo_afiliacion: tipoAfiliacion,
        cuenta: tipoAfiliacion === "individual" ? (cuentaBancaria.trim() || undefined) : undefined,
        inscripcion: Number(inscripcion || 0),
        aporte: Number(aporte || 0),
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

  const titularesVisiblesEnTabla = benefactores.filter((b) => b.tipo_benefactor === "TITULAR");
  const dependientesVisiblesEnTabla = benefactores.filter((b) => b.tipo_benefactor === "DEPENDIENTE");

  const filteredBenefactores = benefactores.filter((benefactor) => {
    const matchesSearch =
      benefactor.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (benefactor.cedula || "").includes(searchTerm) ||
      (benefactor.n_convenio || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = tipoFilter === "todos" || benefactor.tipo_benefactor === tipoFilter;
    const matchesEstado = estadoFilter === "todos" || benefactor.estado === estadoFilter;
    const matchesCiudad = ciudadFilter === "todos" || benefactor.ciudad === ciudadFilter;

    return matchesSearch && matchesTipo && matchesEstado && matchesCiudad;
  });

  const filteredTitulares = filteredBenefactores.filter((b) => b.tipo_benefactor === "TITULAR");
  const filteredDependientes = filteredBenefactores.filter((b) => b.tipo_benefactor === "DEPENDIENTE");

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

        {!esAdmin ? (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);

              if (open) {
                if (!convenio.trim() && convenioSugerido) setConvenio(convenioSugerido);
              } else {
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
                      onChange={(e) => setNombreCompleto(e.target.value)}
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
                    <Input
                      id="convenio"
                      placeholder="CONV-2024-001"
                      value={convenio}
                      onChange={(e) => setConvenio(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                    {convenioSugerido && (
                      <p className="text-xs text-gray-500">
                        Sugerido automáticamente: <span className="font-mono">{convenioSugerido}</span>
                      </p>
                    )}
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
                    onValueChange={setTipoAfiliacion}
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
                  <div className="space-y-2">
                    <Label htmlFor="cuenta">Número de Cuenta Bancaria</Label>
                    <Input
                      id="cuenta"
                      placeholder="Ingrese número de cuenta"
                      value={cuentaBancaria}
                      onChange={(e) => setCuentaBancaria(e.target.value)}
                      disabled={guardando || subiendoContrato}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaCarga">Fecha de Carga</Label>
                    <Input id="fechaCarga" type="text" value={new Date().toLocaleDateString("es-EC")} disabled />
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
                    onChange={(e) => setDireccion(e.target.value)}
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
                  className="bg-[#0F8F5B] hover:bg-[#0D7A4C]"
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
                <p className="text-3xl font-bold text-gray-900">{titularesVisiblesEnTabla.length}</p>
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
                <p className="text-3xl font-bold text-gray-900">{dependientesVisiblesEnTabla.length}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, cédula o convenio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="TITULAR">Titular</SelectItem>
              <SelectItem value="DEPENDIENTE">Dependiente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las ciudades</SelectItem>
              {Object.values(ciudadesPorProvincia)
                .flat()
                .map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="titulares" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="titulares">Titulares ({filteredTitulares.length})</TabsTrigger>
          <TabsTrigger value="dependientes">Dependientes ({filteredDependientes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="titulares" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold">N° Convenio</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Nombre Completo</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Tipo</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Ciudad</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Estado</TableHead>
                  <TableHead className="text-center text-gray-700 font-semibold">Meses Pagados</TableHead>
                  <TableHead className="text-right text-gray-700 font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTitulares.map((benefactor) => (
                  <TableRow key={benefactor.id_benefactor} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{benefactor.n_convenio || benefactor.cedula}</TableCell>
                    <TableCell>{benefactor.nombre_completo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-500 text-blue-700">
                        {benefactor.tipo_benefactor}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{benefactor.ciudad}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          benefactor.estado === "ACTIVO"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }
                      >
                        {benefactor.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full">
                        -
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/benefactores/${benefactor.id_benefactor}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTitulares.length === 0 && (
              <div className="text-center py-12 text-gray-500">No se encontraron titulares con los filtros aplicados</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dependientes" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-semibold">N° Convenio</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Nombre Completo</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Tipo</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Ciudad</TableHead>
                  <TableHead className="text-gray-700 font-semibold">Estado</TableHead>
                  <TableHead className="text-center text-gray-700 font-semibold">Meses Pagados</TableHead>
                  <TableHead className="text-right text-gray-700 font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDependientes.map((benefactor) => (
                  <TableRow key={benefactor.id_benefactor} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{benefactor.n_convenio || benefactor.cedula}</TableCell>
                    <TableCell>{benefactor.nombre_completo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-purple-500 text-purple-700">
                        {benefactor.tipo_benefactor}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{benefactor.ciudad}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          benefactor.estado === "ACTIVO"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-400 hover:bg-gray-500 text-white"
                        }
                      >
                        {benefactor.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-700 rounded-full">
                        -
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/benefactores/${benefactor.id_benefactor}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredDependientes.length === 0 && (
              <div className="text-center py-12 text-gray-500">No se encontraron dependientes con los filtros aplicados</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-gray-600 bg-white rounded-lg p-4 border border-gray-200">
        Mostrando {filteredBenefactores.length} de {benefactores.length} benefactores
      </div>
    </div>
  );
}
