import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { toast } from "sonner";
import { bancosService, Banco, BancoCreate } from "../services/bancos.service";

export default function Bancos() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Banco | null>(null);
  const [nombre, setNombre] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog eliminar
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bancoToDelete, setBancoToDelete] = useState<Banco | null>(null);

  useEffect(() => {
    loadBancos();
  }, []);

  const loadBancos = async () => {
    try {
      setLoading(true);
      const response = await bancosService.getAll();
      setBancos(response.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar bancos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditando(null);
    setNombre("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (banco: Banco) => {
    setEditando(banco);
    setNombre(banco.nombre);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditando(null);
    setNombre("");
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre del banco es requerido");
      return;
    }

    try {
      setSubmitting(true);
      
      if (editando) {
        // Actualizar
        await bancosService.update(editando.id_banco, { nombre });
        toast.success("Banco actualizado exitosamente");
      } else {
        // Crear
        const data: BancoCreate = { nombre };
        await bancosService.create(data);
        toast.success("Banco creado exitosamente");
      }

      handleCloseDialog();
      loadBancos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al guardar el banco");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (banco: Banco) => {
    setBancoToDelete(banco);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bancoToDelete) return;

    try {
      await bancosService.delete(bancoToDelete.id_banco);
      toast.success("Banco eliminado exitosamente");
      setDeleteDialogOpen(false);
      setBancoToDelete(null);
      loadBancos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar el banco");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F8F5B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando bancos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Bancos</h2>
          <p className="text-gray-600 mt-1">Administra el catálogo de bancos</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#0F8F5B] hover:bg-[#0d7a4d] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Banco
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm [&_tr]:border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No hay bancos registrados
                  </TableCell>
                </TableRow>
              ) : (
                bancos.map((banco) => (
                  <TableRow key={banco.id_banco}>
                    <TableCell className="font-medium">{banco.id_banco}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {banco.nombre}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(banco)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDelete(banco)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Banco" : "Nuevo Banco"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Banco*</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Banco Pichincha"
                maxLength={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !nombre.trim()}
              className="bg-[#0F8F5B] hover:bg-[#0d7a4d] text-white"
            >
              {submitting ? "Guardando..." : editando ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar banco?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el banco <strong>{bancoToDelete?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
