import { useState } from "react";
import { Plus, Search, AlertCircle, Clock } from "lucide-react";
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

type CasoSocial = {
  id: string;
  beneficiario: string;
  tipoCaso: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: "Activo" | "En seguimiento" | "Cerrado";
  trabajadoraSocial: string;
  fechaInicio: string;
  descripcion: string;
  ciudad: string;
};

type HistorialItem = {
  fecha: string;
  accion: string;
  responsable: string;
  notas: string;
};

const mockCasos: CasoSocial[] = [
  { 
    id: "CS-001", 
    beneficiario: "Ana María Pérez Gómez", 
    tipoCaso: "Apoyo alimentario", 
    prioridad: "Alta", 
    estado: "Activo", 
    trabajadoraSocial: "Laura Patricia Gómez Torres", 
    fechaInicio: "10/11/2024",
    descripcion: "Familia en situación de vulnerabilidad que requiere apoyo alimentario urgente. Contacto: 0987654321, ana.perez@gmail.com",
    ciudad: "Quito"
  },
  { 
    id: "CS-002", 
    beneficiario: "Carlos Alberto Mendoza Ruiz", 
    tipoCaso: "Apoyo médico", 
    prioridad: "Alta", 
    estado: "En seguimiento", 
    trabajadoraSocial: "María Fernanda Torres Albán", 
    fechaInicio: "05/11/2024",
    descripcion: "Tratamiento médico especializado requerido. En seguimiento con Hospital Luis Vernaza. Contacto: 0998765432",
    ciudad: "Guayaquil"
  },
  { 
    id: "CS-003", 
    beneficiario: "Luis Eduardo González Castro", 
    tipoCaso: "Vivienda", 
    prioridad: "Media", 
    estado: "Activo", 
    trabajadoraSocial: "Laura Patricia Gómez Torres", 
    fechaInicio: "01/11/2024",
    descripcion: "Búsqueda de vivienda temporal mientras se resuelve situación habitacional. Dirección temporal: Av. Bolívar y Benigno Malo",
    ciudad: "Cuenca"
  },
  { 
    id: "CS-004", 
    beneficiario: "Rosa María Martínez Vega", 
    tipoCaso: "Educación", 
    prioridad: "Baja", 
    estado: "En seguimiento", 
    trabajadoraSocial: "Patricia Lucía Silva Morales", 
    fechaInicio: "28/10/2024",
    descripcion: "Apoyo para inscripción escolar y materiales educativos. Contacto: rosa.martinez@hotmail.com",
    ciudad: "Ambato"
  },
  { 
    id: "CS-005", 
    beneficiario: "Pedro José Ramírez López", 
    tipoCaso: "Apoyo psicológico", 
    prioridad: "Media", 
    estado: "Cerrado", 
    trabajadoraSocial: "María Fernanda Torres Albán", 
    fechaInicio: "15/10/2024",
    descripcion: "Completó el ciclo de sesiones psicológicas con centro de salud del IESS. Caso cerrado exitosamente.",
    ciudad: "Quito"
  },
];

const mockHistorial: Record<string, HistorialItem[]> = {
  "CS-001": [
    {
      fecha: "10/11/2024",
      accion: "Caso creado",
      responsable: "Laura Gómez Torres",
      notas: "Primera visita domiciliaria realizada. Se identificó necesidad urgente."
    },
    {
      fecha: "12/11/2024",
      accion: "Entrega de mercado",
      responsable: "Laura Gómez Torres",
      notas: "Entregado mercado para 15 días. Familia agradecida."
    },
    {
      fecha: "20/11/2024",
      accion: "Seguimiento telefónico",
      responsable: "Laura Gómez Torres",
      notas: "Contacto telefónico. Situación estable. Programada próxima entrega."
    },
  ],
  "CS-002": [
    {
      fecha: "05/11/2024",
      accion: "Caso creado",
      responsable: "María Torres Albán",
      notas: "Se requiere apoyo médico especializado. Coordinación con hospital del IESS."
    },
    {
      fecha: "12/11/2024",
      accion: "Coordinación médica",
      responsable: "María Torres Albán",
      notas: "Cita programada con especialista. Se gestionó transporte."
    },
  ],
};

export default function Social() {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [prioridadFilter, setPrioridadFilter] = useState("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<CasoSocial | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);

  const filteredCasos = mockCasos.filter((caso) => {
    const matchesSearch = 
      caso.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.tipoCaso.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = estadoFilter === "todos" || caso.estado === estadoFilter;
    const matchesPrioridad = prioridadFilter === "todos" || caso.prioridad === prioridadFilter;

    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const getEstadoBadge = (estado: string) => {
    const colors = {
      "Activo": "bg-[#0F8F5B] hover:bg-[#0D7A4C]",
      "En seguimiento": "bg-yellow-500 hover:bg-yellow-600",
      "Cerrado": "bg-gray-400 hover:bg-gray-500",
    };
    return colors[estado as keyof typeof colors] || "bg-gray-400";
  };

  const getPrioridadBadge = (prioridad: string) => {
    const colors = {
      "Alta": "bg-red-500 hover:bg-red-600",
      "Media": "bg-orange-500 hover:bg-orange-600",
      "Baja": "bg-blue-500 hover:bg-blue-600",
    };
    return colors[prioridad as keyof typeof colors] || "bg-gray-400";
  };

  const casosActivos = mockCasos.filter(c => c.estado === "Activo").length;
  const casosEnSeguimiento = mockCasos.filter(c => c.estado === "En seguimiento").length;
  const casosCerrados = mockCasos.filter(c => c.estado === "Cerrado").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[#1D1D1D] mb-2">Módulo Social</h1>
          <p className="text-gray-600">Gestión de casos sociales y seguimiento</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C]">
              <Plus className="h-4 w-4 mr-2" />
              Registrar caso social
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Caso Social</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beneficiario">Beneficiario</Label>
                  <Select>
                    <SelectTrigger id="beneficiario">
                      <SelectValue placeholder="Seleccione beneficiario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ana">Ana María Pérez Gómez</SelectItem>
                      <SelectItem value="carlos">Carlos Mendoza Ruiz</SelectItem>
                      <SelectItem value="luis">Luis González Castro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoCaso">Tipo de caso</Label>
                  <Select>
                    <SelectTrigger id="tipoCaso">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alimentario">Apoyo alimentario</SelectItem>
                      <SelectItem value="medico">Apoyo médico</SelectItem>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="educacion">Educación</SelectItem>
                      <SelectItem value="psicologico">Apoyo psicológico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select>
                    <SelectTrigger id="prioridad">
                      <SelectValue placeholder="Seleccione prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trabajadora">Trabajadora social</Label>
                  <Select>
                    <SelectTrigger id="trabajadora">
                      <SelectValue placeholder="Asignar trabajadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laura">Laura Gómez Torres</SelectItem>
                      <SelectItem value="maria">María Torres Albán</SelectItem>
                      <SelectItem value="patricia">Patricia Silva Morales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción del caso</Label>
                <Textarea 
                  id="descripcion" 
                  placeholder="Describa la situación y necesidades del beneficiario..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-[#0F8F5B] hover:bg-[#0D7A4C]" onClick={() => setIsDialogOpen(false)}>
                Registrar caso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Casos Activos</p>
                <p className="text-3xl text-[#1D1D1D]">{casosActivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Seguimiento</p>
                <p className="text-3xl text-[#1D1D1D]">{casosEnSeguimiento}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Casos Cerrados</p>
                <p className="text-3xl text-[#1D1D1D]">{casosCerrados}</p>
              </div>
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por beneficiario o tipo de caso"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="En seguimiento">En seguimiento</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las prioridades</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Beneficiario</TableHead>
                <TableHead>Tipo de Caso</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Trabajadora Social</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredCasos.map((caso) => (
              <TableRow key={caso.id}>
                <TableCell>{caso.beneficiario}</TableCell>
                <TableCell>{caso.tipoCaso}</TableCell>
                <TableCell>
                  <Badge className={getPrioridadBadge(caso.prioridad)}>
                    {caso.prioridad}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getEstadoBadge(caso.estado)}>
                    {caso.estado}
                  </Badge>
                </TableCell>
                <TableCell>{caso.trabajadoraSocial}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{caso.ciudad}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedCaso(caso);
                      setShowHistorial(true);
                    }}
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {filteredCasos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron casos con los filtros aplicados
          </div>
        )}
      </div>

      {/* Detail with History Modal */}
      {selectedCaso && (
        <Dialog open={showHistorial} onOpenChange={setShowHistorial}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Caso Social</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Beneficiario</p>
                  <p className="text-lg text-[#1D1D1D]">{selectedCaso.beneficiario}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPrioridadBadge(selectedCaso.prioridad)}>
                    {selectedCaso.prioridad}
                  </Badge>
                  <Badge className={getEstadoBadge(selectedCaso.estado)}>
                    {selectedCaso.estado}
                  </Badge>
                </div>
              </div>
              
              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo de caso</p>
                  <p className="text-[#1D1D1D]">{selectedCaso.tipoCaso}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ciudad</p>
                  <p className="text-[#1D1D1D]">{selectedCaso.ciudad}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de inicio</p>
                  <p className="text-[#1D1D1D]">{selectedCaso.fechaInicio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trabajadora Social</p>
                  <p className="text-[#1D1D1D]">{selectedCaso.trabajadoraSocial}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Descripción</p>
                <p className="text-[#1D1D1D] text-sm p-4 bg-gray-50 rounded-lg">
                  {selectedCaso.descripcion}
                </p>
              </div>

              <Separator />

              {/* Historial */}
              <div>
                <h3 className="text-[#1D1D1D] mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Historial de Seguimiento
                </h3>
                
                <div className="space-y-4">
                  {(mockHistorial[selectedCaso.id] || []).map((item, index) => (
                    <div key={index} className="relative pl-8 pb-4 border-l-2 border-[#0F8F5B] last:border-transparent">
                      <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full bg-[#0F8F5B] border-2 border-white" />
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm text-[#1D1D1D]">{item.accion}</p>
                            <p className="text-xs text-gray-600">Por: {item.responsable}</p>
                          </div>
                          <span className="text-xs text-gray-500">{item.fecha}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{item.notas}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(!mockHistorial[selectedCaso.id] || mockHistorial[selectedCaso.id].length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay historial de seguimiento disponible
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistorial(false)}>
                Cerrar
              </Button>
              <Button className="bg-[#4064E3] hover:bg-[#3451C2]">
                Agregar seguimiento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="text-sm text-gray-600">
        Mostrando {filteredCasos.length} de {mockCasos.length} casos
      </div>
    </div>
  );
}
