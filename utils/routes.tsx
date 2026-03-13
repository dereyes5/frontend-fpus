import { createBrowserRouter, Navigate } from "react-router";
import Login from "../components/Login";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import Benefactores from "../components/Benefactores";
import BenefactorDetail from "../components/BenefactorDetail";
import Social from "../components/Social";
import SocialSeguimiento from "../components/SocialSeguimiento";
import SocialAprobaciones from "../components/SocialAprobaciones";
import Cartera from "../components/Cartera";
import Configuracion from "../components/Configuracion";
import Aprobaciones from "../components/Aprobaciones";
import Perfil from "../components/Perfil";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "benefactores",
        element: <ProtectedRoute requiredPermissions={["benefactores_ingresar", "benefactores_administrar"]}><Benefactores /></ProtectedRoute>
      },
      {
        path: "benefactores/:id",
        element: <ProtectedRoute requiredPermissions={["benefactores_ingresar", "benefactores_administrar"]}><BenefactorDetail /></ProtectedRoute>
      },
      {
        path: "aprobaciones",
        element: <Navigate to="/aprobaciones/benefactores" replace />
      },
      {
        path: "aprobaciones/benefactores",
        element: <ProtectedRoute requiredPermissions={["aprobaciones"]}><Aprobaciones /></ProtectedRoute>
      },
      {
        path: "cartera",
        element: <ProtectedRoute requiredPermissions={["cartera_lectura"]}><Cartera /></ProtectedRoute>
      },
      {
        path: "social",
        element: <ProtectedRoute requiredPermissions={["social_ingresar", "social_administrar"]}><Social /></ProtectedRoute>
      },
      {
        path: "social/seguimiento",
        element: <ProtectedRoute requiredPermissions={["social_ingresar", "social_administrar"]}><SocialSeguimiento /></ProtectedRoute>
      },
      {
        path: "aprobaciones/social",
        element: <ProtectedRoute requiredPermissions={["aprobaciones_social"]}><SocialAprobaciones /></ProtectedRoute>
      },
      {
        path: "social/aprobaciones",
        element: <Navigate to="/aprobaciones/social" replace />
      },
      {
        path: "configuracion",
        element: <ProtectedRoute requiredPermissions={["configuraciones"]}><Configuracion /></ProtectedRoute>
      },
      {
        path: "perfil",
        element: <ProtectedRoute><Perfil /></ProtectedRoute>
      },
    ],
  },
]);
