import { useEffect, useMemo, useState } from "react";
import { Users, Wallet, TrendingUp, CheckSquare } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { benefactoresService } from "../services/benefactores.service";
import { cobrosService } from "../services/cobros.service";
import { aprobacionesService } from "../services/aprobaciones.service";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { permisos } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    benefactoresTotal: 0,
    totalRecaudado: "0",
    totalEsperado: "0",
    porcentajeRecaudacion: "0",
    pendientesAprobacion: 0,
  });
  const [estadoAportes, setEstadoAportes] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [permisos?.benefactores_ingresar, permisos?.benefactores_administrar, permisos?.cartera_lectura, permisos?.aprobaciones]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos según permisos granulares
      const promises: Promise<any>[] = [];

      // Siempre cargar benefactores si tiene permiso de lectura
      if (permisos?.benefactores_ingresar || permisos?.benefactores_administrar) {
        promises.push(
          benefactoresService.getBenefactores({ page: 1, limit: 1 })
            .then(res => ({ type: 'benefactores', data: res.pagination?.total || 0 }))
        );
      }

      // Cargar cobros si tiene permiso de lectura
      if (permisos?.cartera_lectura) {
        promises.push(
          cobrosService.getEstadisticas()
            .then(res => ({ type: 'cobros', data: res.data }))
        );
        promises.push(
          cobrosService.getEstadoAportesMensualesActual()
            .then(res => ({ type: 'estadoAportes', data: res.data || [] }))
        );
      }

      // Cargar aprobaciones si tiene permiso
      if (permisos?.aprobaciones) {
        promises.push(
          aprobacionesService.getPendientes(1, 1)
            .then(res => ({ type: 'aprobaciones', data: res.pagination?.total || 0 }))
        );
      }

      const results = await Promise.all(promises);
      
      const newStats = {
        benefactoresTotal: 0,
        totalRecaudado: "0",
        totalEsperado: "0",
        porcentajeRecaudacion: "0",
        pendientesAprobacion: 0,
      };
      results.forEach(result => {
        if (result.type === 'benefactores') {
          newStats.benefactoresTotal = result.data;
        } else if (result.type === 'cobros') {
          newStats.totalRecaudado = result.data.total_recaudado;
          newStats.totalEsperado = result.data.total_esperado;
          newStats.porcentajeRecaudacion = result.data.porcentaje_recaudacion;
        } else if (result.type === 'aprobaciones') {
          newStats.pendientesAprobacion = result.data;
        } else if (result.type === 'estadoAportes') {
          setEstadoAportes(result.data);
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const chartEstadoAportes = useMemo(() => {
    const aportados = estadoAportes.filter((item) => item.estado_cobro === "APORTADO" || item.estado_aporte === "APORTADO").length;
    const noAportados = Math.max(estadoAportes.length - aportados, 0);
    return [
      { name: "Aportado", value: aportados, color: "#16a34a" },
      { name: "No aportado", value: noAportados, color: "#dc2626" },
    ];
  }, [estadoAportes]);

  const chartTipoBenefactor = useMemo(() => {
    const base = {
      TITULAR: { tipo: "Titular", aportado: 0, noAportado: 0 },
      DEPENDIENTE: { tipo: "Dependiente", aportado: 0, noAportado: 0 },
    } as const;
    const mutable = {
      TITULAR: { ...base.TITULAR },
      DEPENDIENTE: { ...base.DEPENDIENTE },
    };

    estadoAportes.forEach((item) => {
      const key = item.es_titular ? "TITULAR" : "DEPENDIENTE";
      const estado = item.estado_cobro || item.estado_aporte;
      if (estado === "APORTADO") {
        mutable[key].aportado += 1;
      } else {
        mutable[key].noAportado += 1;
      }
    });

    return [mutable.TITULAR, mutable.DEPENDIENTE];
  }, [estadoAportes]);

  const dashboardCards = [
    {
      title: "Total Benefactores",
      value: loading ? "..." : stats.benefactoresTotal.toString(),
      change: "Registros activos en el sistema",
      icon: Users,
      color: "bg-blue-500",
      show: permisos?.benefactores_ingresar || permisos?.benefactores_administrar,
    },
    {
      title: "Recaudado Este Mes",
      value: loading ? "..." : formatCurrency(stats.totalRecaudado),
      change: `${stats.porcentajeRecaudacion}% de recaudación de ${formatCurrency(stats.totalEsperado)}`,
      icon: Wallet,
      color: "bg-green-500",
      show: permisos?.cartera_lectura,
    },
    {
      title: "Pendientes Aprobación",
      value: loading ? "..." : stats.pendientesAprobacion.toString(),
      change: "Registros esperando revisión",
      icon: CheckSquare,
      color: "bg-orange-500",
      show: permisos?.aprobaciones,
    },
    {
      title: "Sistema Operativo",
      value: "100%",
      change: "Todos los módulos funcionando",
      icon: TrendingUp,
      color: "bg-purple-500",
      show: true,
    },
  ];

  const quickActions = [
    {
      label: "Registrar nuevo benefactor",
      icon: Users,
      color: "bg-[#4064E3] hover:bg-[#3451C2]",
      path: "/benefactores",
      show: permisos?.benefactores_ingresar || permisos?.benefactores_administrar,
    },
    {
      label: "Revisar aprobaciones",
      icon: CheckSquare,
      color: "bg-[#0F8F5B] hover:bg-[#0D7A4C]",
      path: "/aprobaciones",
      show: permisos?.aprobaciones,
    },
    {
      label: "Ver estado de cartera",
      icon: Wallet,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/cartera",
      show: permisos?.cartera_lectura,
    },
  ];

  const visibleStats = dashboardCards.filter(stat => stat.show);
  const visibleActions = quickActions.filter(action => action.show);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/90">Bienvenido al sistema administrativo de FPUS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {permisos?.cartera_lectura && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Card className="xl:col-span-2 border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Distribución de aportes</h3>
              <p className="text-xs text-gray-500 mb-4">Estado actual de aportado vs no aportado</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartEstadoAportes} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={4}>
                      {chartEstadoAportes.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {chartEstadoAportes.map((item) => (
                  <div key={item.name} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-3 border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Aportes por tipo de benefactor</h3>
              <p className="text-xs text-gray-500 mb-4">Comparativo entre titulares y dependientes</p>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartTipoBenefactor} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="aportado" name="Aportado" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="noAportado" name="No aportado" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información del sistema */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1b76b9] rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Sistema de Gestión de Benefactores
              </h3>
              <p className="text-sm text-gray-600">
                Gestión integral de benefactores, aprobaciones, cobros y cartera. 
                Accede a los diferentes módulos según tus permisos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button 
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`${action.color} text-white rounded-lg text-left transition-all hover:scale-105 p-6 flex flex-col gap-3 shadow-md`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
