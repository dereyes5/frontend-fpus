export type Sede = {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  email: string;
  responsable: string;
  estado: "Activa" | "Inactiva";
};

export const sedesEcuador: Sede[] = [
  {
    id: "sede-001",
    nombre: "Quito - Matriz",
    ciudad: "Quito",
    direccion: "Av. Amazonas N45-67 y Naciones Unidas, Edificio Financorp, Piso 8",
    telefono: "02-2987654",
    email: "quito.matriz@fpus.org.ec",
    responsable: "María Fernanda García López",
    estado: "Activa"
  },
  {
    id: "sede-002",
    nombre: "Guayaquil - Sucursal Norte",
    ciudad: "Guayaquil",
    direccion: "C.C. Albán Borja, Local 204, Av. Constitución",
    telefono: "04-2345678",
    email: "guayaquil.norte@fpus.org.ec",
    responsable: "Carlos Alberto Mendoza Ruiz",
    estado: "Activa"
  },
  {
    id: "sede-003",
    nombre: "Cuenca - Sucursal Centro",
    ciudad: "Cuenca",
    direccion: "Av. Bolívar 8-45 y Benigno Malo, Edificio Torre Central",
    telefono: "07-2876543",
    email: "cuenca.centro@fpus.org.ec",
    responsable: "Ana Patricia Vega Morales",
    estado: "Activa"
  },
  {
    id: "sede-004",
    nombre: "Santo Domingo - Sucursal Principal",
    ciudad: "Santo Domingo",
    direccion: "Av. 10 de Agosto y Colombia, Centro Comercial Plaza Santo Domingo",
    telefono: "02-2765432",
    email: "santodomingo.principal@fpus.org.ec",
    responsable: "Luis Eduardo Torres Castro",
    estado: "Activa"
  },
  {
    id: "sede-005",
    nombre: "Ambato - Sucursal Huachi",
    ciudad: "Ambato",
    direccion: "Av. Los Guaytambos 03-55 y Rodrigo Pachano, Sector Huachi Chico",
    telefono: "03-2456789",
    email: "ambato.huachi@fpus.org.ec",
    responsable: "Rosa María Álvarez Sánchez",
    estado: "Activa"
  },
  {
    id: "sede-006",
    nombre: "Manta - Sucursal Tarqui",
    ciudad: "Manta",
    direccion: "Av. 4 de Noviembre y Calle 15, Edificio Marítimo, Tarqui",
    telefono: "05-2345678",
    email: "manta.tarqui@fpus.org.ec",
    responsable: "Pedro José Ramírez Flores",
    estado: "Activa"
  },
  {
    id: "sede-007",
    nombre: "Machala - Sucursal 25 de Junio",
    ciudad: "Machala",
    direccion: "Av. 25 de Junio y Rocafuerte, Edificio El Oro Plaza",
    telefono: "07-2934567",
    email: "machala.junio@fpus.org.ec",
    responsable: "Carmen Lucía Silva Gómez",
    estado: "Activa"
  }
];

export const getSedeById = (id: string): Sede | undefined => {
  return sedesEcuador.find(sede => sede.id === id);
};

export const getSedesByCity = (ciudad: string): Sede[] => {
  return sedesEcuador.filter(sede => sede.ciudad === ciudad);
};

export const getActiveSedes = (): Sede[] => {
  return sedesEcuador.filter(sede => sede.estado === "Activa");
};

export const ciudadesEcuador = [
  "Quito",
  "Guayaquil", 
  "Cuenca",
  "Santo Domingo",
  "Ambato",
  "Manta",
  "Portoviejo",
  "Machala",
  "Loja",
  "Riobamba",
  "Ibarra",
  "Esmeraldas",
  "Latacunga"
];
