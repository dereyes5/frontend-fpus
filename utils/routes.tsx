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
        element: <ProtectedRoute requiredPermissions={["benefactores_lectura"]}><Benefactores /></ProtectedRoute>
      },
      { 
        path: "benefactores/:id", 
        element: <ProtectedRoute requiredPermissions={["benefactores_lectura"]}><BenefactorDetail /></ProtectedRoute>
      },
      { 
        path: "aprobaciones", 
        element: <ProtectedRoute requiredPermissions={["aprobaciones"]}><Aprobaciones /></ProtectedRoute>
      },
      { 
        path: "cartera", 
        element: <ProtectedRoute requiredPermissions={["cartera_lectura"]}><Cartera /></ProtectedRoute>
      },
      { 
        path: "social", 
        element: <ProtectedRoute requiredPermissions={["social_lectura"]}><Social /></ProtectedRoute>
      },
      { 
        path: "configuracion", 
        element: <ProtectedRoute requiredPermissions={["configuraciones"]}><Configuracion /></ProtectedRoute>
      },
    ],
  },
]);