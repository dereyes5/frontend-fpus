import { useEffect, useState } from "react";
import { Users, Wallet, TrendingUp, CheckSquare } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { benefactoresService } from "../services/benefactores.service";
import { cobrosService } from "../services/cobros.service";
import { aprobacionesService } from "../services/aprobaciones.service";

export default function Dashboard() {
  const navigate = useNavigate();
  const { permisos } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    benefactoresTotal: 0,
    totalRecaudado: "0",
    porcentajeRecaudacion: "0",
    pendientesAprobacion: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos según permisos
      const promises: Promise<any>[] = [];

      // Siempre cargar benefactores si tiene permiso
      if (permisos?.benefactores?.ver) {
        promises.push(
          benefactoresService.getBenefactores({ page: 1, limit: 1 })
            .then(res => ({ type: 'benefactores', data: res.pagination?.total || 0 }))
        );
      }

      // Cargar cobros si tiene permiso
      if (permisos?.cobros?.ver) {
        promises.push(
          cobrosService.getEstadisticas()
            .then(res => ({ type: 'cobros', data: res.data }))
        );
      }

      // Cargar aprobaciones si tiene permiso
      if (permisos?.aprobaciones?.ver) {
        promises.push(
          aprobacionesService.getPendientes(1, 1)
            .then(res => ({ type: 'aprobaciones', data: res.pagination?.total || 0 }))
        );
      }

      const results = await Promise.all(promises);
      
      const newStats = { ...stats };
      results.forEach(result => {
        if (result.type === 'benefactores') {
          newStats.benefactoresTotal = result.data;
        } else if (result.type === 'cobros') {
          newStats.totalRecaudado = result.data.total_recaudado;
          newStats.porcentajeRecaudacion = result.data.porcentaje_recaudacion;
        } else if (result.type === 'aprobaciones') {
          newStats.pendientesAprobacion = result.data;
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

  const dashboardCards = [
    {
      title: "Total Benefactores",
      value: loading ? "..." : stats.benefactoresTotal.toString(),
      change: "Registros activos en el sistema",
      icon: Users,
      color: "bg-blue-500",
      show: permisos?.benefactores?.ver,
    },
    {
      title: "Recaudado Este Mes",
      value: loading ? "..." : formatCurrency(stats.totalRecaudado),
      change: `${stats.porcentajeRecaudacion}% de recaudación`,
      icon: Wallet,
      color: "bg-green-500",
      show: permisos?.cobros?.ver,
    },
    {
      title: "Pendientes Aprobación",
      value: loading ? "..." : stats.pendientesAprobacion.toString(),
      change: "Registros esperando revisión",
      icon: CheckSquare,
      color: "bg-orange-500",
      show: permisos?.aprobaciones?.ver,
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
      show: permisos?.benefactores?.ver,
    },
    {
      label: "Revisar aprobaciones",
      icon: CheckSquare,
      color: "bg-[#0F8F5B] hover:bg-[#0D7A4C]",
      path: "/aprobaciones",
      show: permisos?.aprobaciones?.ver,
    },
    {
      label: "Ver estado de cartera",
      icon: Wallet,
      color: "bg-purple-500 hover:bg-purple-600",
      path: "/cartera",
      show: permisos?.cobros?.ver,
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