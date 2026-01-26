import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { User, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

// Imágenes
import logo from "../assets/img/FUNDACASDION.png";
import img1 from "../assets/img/1 - copia.jpg";
import img2 from "../assets/img/2.jpg";
import img3 from "../assets/img/3.jpg";
import img5 from "../assets/img/5.jpg";
import img6 from "../assets/img/6.jpg";

const galleryImages = [img1, img2, img3, img5, img6];

export default function Login() {
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (user && !loading) navigate("/");
  }, [user, loading, navigate]);

  // Carrusel de fondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreUsuario || !password) {
      toast.error("Por favor ingrese usuario y contraseña");
      return;
    }

    try {
      setSubmitting(true);
      await login(nombreUsuario, password);
      navigate("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo con carrusel */}
      <div className="absolute inset-0">
        {galleryImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Fondo ${index + 1}`}
              className="w-full h-full object-cover animate-[kenburns_12s_ease-in-out_infinite]"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-[#0a4a6e]/25 mix-blend-multiply" />
      </div>

      {/* Spotlight */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="w-[520px] h-[520px] bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Contenido */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <img
          src={logo}
          alt="Logo Fundación FPUS"
          className="
            h-24 mb-8 drop-shadow-2xl
            transition-all duration-300
            hover:-translate-y-1 hover:scale-[1.05]
            hover:drop-shadow-[0_20px_30px_rgba(27,118,185,0.6)]
          "
        />

        {/* Card */}
        <div
          className="
            w-full max-w-md bg-white/90 backdrop-blur-xl
            rounded-3xl p-8
            border border-white/20 hover:border-[#1b76b9]/40
            shadow-2xl
            transition-all duration-300
            hover:-translate-y-2 hover:scale-[1.015]
            hover:shadow-[0_25px_50px_-12px_rgba(27,118,185,0.45)]
          "
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#1b76b9] mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Usuario */}
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">Usuario</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Ingrese su usuario"
                  disabled={submitting}
                  className="h-14 pl-12 rounded-xl border-2 focus:border-[#1b76b9]"
                />
              </div>
            </div>

            {/* Contraseña con OJO */}
            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="h-14 pl-12 pr-12 rounded-xl border-2 focus:border-[#1b76b9]"
                />

                {/* Botón ojo */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-4 top-1/2 -translate-y-1/2
                    text-gray-400 hover:text-[#1b76b9]
                    transition-colors
                  "
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón */}
            <Button
              type="submit"
              disabled={submitting}
              className="
                w-full h-14 rounded-xl
                bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4]
                transition-all duration-300
                hover:scale-[1.02] hover:shadow-xl
              "
            >
              {submitting ? (
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  Iniciar sesión
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            Sistema de Gestión de Benefactores
          </div>
        </div>

        <p className="text-white/80 text-sm mt-6 text-center">
          © 2026 Fundación FPUS. Todos los derechos reservados.
        </p>
      </div>

      {/* Ken Burns */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1.02); }
          50% { transform: scale(1.08) translate(-10px, -6px); }
          100% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
