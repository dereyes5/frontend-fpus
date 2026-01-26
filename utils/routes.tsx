import { createBrowserRouter } from "react-router";
import Login from "../components/Login";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import Benefactores from "../components/Benefactores";
import BenefactorDetail from "../components/BenefactorDetail";
import Social from "../components/Social";
import Cartera from "../components/Cartera";
import Configuracion from "../components/Configuracion";
import Aprobaciones from "../components/Aprobaciones";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, Component: Dashboard },
      { 
        path: "benefactores", 
        element: <ProtectedRoute requiredRoles={["EJECUTIVO", "ADMINISTRADOR"]}><Benefactores /></ProtectedRoute>
      },
      { 
        path: "benefactores/:id", 
        element: <ProtectedRoute requiredRoles={["EJECUTIVO", "ADMINISTRADOR"]}><BenefactorDetail /></ProtectedRoute>
      },
      { 
        path: "aprobaciones", 
        element: <ProtectedRoute requiredRoles={["ADMINISTRADOR"]}><Aprobaciones /></ProtectedRoute>
      },
      { 
        path: "cartera", 
        element: <ProtectedRoute requiredRoles={["EJECUTIVO_CONTABLE", "ADMINISTRADOR"]}><Cartera /></ProtectedRoute>
      },
      { 
        path: "social", 
        element: <ProtectedRoute requiredRoles={["EJECUTIVO_SOCIAL", "ADMINISTRADOR"]}><Social /></ProtectedRoute>
      },
      { 
        path: "configuracion", 
        Component: Configuracion 
      },
    ],
  },
]);