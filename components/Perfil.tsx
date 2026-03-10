import { useState, useEffect } from "react";
import { User, Shield, Camera, Upload, Trash2, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/AuthContext";
import { fotoPerfilService } from "../services/fotoPerfil.service";
import { authService } from "../services/auth.service";
import { toast } from "sonner";

export default function Perfil() {
  const { user } = useAuth();
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [keyFoto, setKeyFoto] = useState(Date.now());
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    if (user?.id_usuario) {
      setFotoPerfilUrl(fotoPerfilService.obtenerUrl(user.id_usuario));
    }
  }, [user, keyFoto]);

  const handleSubirFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se permiten imagenes JPG, PNG o WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    try {
      setSubiendoFoto(true);
      await fotoPerfilService.subirFoto(file);
      toast.success("Foto de perfil actualizada exitosamente");
      setKeyFoto(Date.now());
      window.dispatchEvent(new Event("fotoPerfilActualizada"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al subir la foto");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminarFoto = async () => {
    if (!confirm("Estas seguro de eliminar tu foto de perfil?")) return;
    try {
      await fotoPerfilService.eliminarFoto();
      toast.success("Foto de perfil eliminada exitosamente");
      setKeyFoto(Date.now());
      window.dispatchEvent(new Event("fotoPerfilActualizada"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar la foto");
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNueva.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      toast.error("Las contrasenas no coinciden");
      return;
    }
    try {
      setGuardandoPassword(true);
      await authService.cambiarPassword({
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });
      toast.success("Contrasena actualizada correctamente");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar contrasena");
    } finally {
      setGuardandoPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1b76b9] to-[#2d8cc4] rounded-xl p-6 shadow-md">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-white/90">Configuracion de perfil y seguridad</p>
      </div>

      <Card className="w-full max-w-3xl bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            Informacion del usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#1b76b9] flex items-center justify-center border-4 border-gray-200 shadow-lg">
                {fotoPerfilUrl ? (
                  <img
                    key={keyFoto}
                    src={`${fotoPerfilUrl}&t=${keyFoto}`}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    onError={() => setFotoPerfilUrl(null)}
                  />
                ) : (
                  <span className="text-white text-5xl font-bold">
                    {user?.nombre_usuario?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="foto-perfil-input"
                className="absolute bottom-0 right-0 bg-[#0F8F5B] hover:bg-[#0d7a4d] text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors"
              >
                <Camera className="h-5 w-5" />
                <input
                  id="foto-perfil-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleSubirFoto}
                  disabled={subiendoFoto}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-semibold text-gray-900">{user?.nombre_usuario}</h3>
              <p className="text-gray-600 mt-1">{user?.cargo || "AGENTE"}</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={subiendoFoto}
                  className="gap-2"
                  onClick={() => document.getElementById("foto-perfil-input")?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {fotoPerfilUrl ? "Cambiar foto" : "Subir foto"}
                </Button>
                {fotoPerfilUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEliminarFoto}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar foto
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuario
              </Label>
              <Input value={user?.nombre_usuario || ""} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label className="text-gray-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Cargo
              </Label>
              <Input value={user?.cargo || "AGENTE"} disabled className="bg-gray-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-3xl bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar contrasena
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <Label htmlFor="password-actual">Contrasena actual</Label>
              <Input
                id="password-actual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password-nueva">Nueva contrasena</Label>
              <Input
                id="password-nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password-confirmar">Confirmar nueva contrasena</Label>
              <Input
                id="password-confirmar"
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={guardandoPassword} className="bg-[#0F8F5B] hover:bg-[#0d7a4d] text-white">
                {guardandoPassword ? "Guardando..." : "Actualizar contrasena"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
