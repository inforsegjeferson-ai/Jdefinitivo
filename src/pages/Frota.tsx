import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Truck, 
  Search, 
  Plus, 
  MoreHorizontal,
  Fuel,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDbVehicles, VehicleStatus } from "@/hooks/useDbVehicles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusConfig: Record<VehicleStatus, { label: string; variant: "success" | "inProgress" | "warning" }> = {
  available: { label: "Disponível", variant: "success" },
  inUse: { label: "Em Uso", variant: "inProgress" },
  maintenance: { label: "Manutenção", variant: "warning" },
};

const Frota = () => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useDbVehicles();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<null | string>(null); // vehicle id or null
  const [formData, setFormData] = useState({
    plate: "",
    model: "",
    year: "",
    status: "available" as VehicleStatus,
    fuel_level: 100,
  });

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    inUse: vehicles.filter((v) => v.status === "inUse").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };

  const getFuelColor = (level: number) => {
    if (level > 60) return "bg-success";
    if (level > 30) return "bg-warning";
    return "bg-destructive";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate || !formData.model) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    let success = false;
    if (editMode) {
      // Editar veículo existente
      success = await updateVehicle(editMode, {
        plate: formData.plate.toUpperCase(),
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        status: formData.status,
        fuel_level: formData.fuel_level,
      });
    } else {
      // Adicionar novo veículo
      success = await addVehicle({
        plate: formData.plate.toUpperCase(),
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        status: formData.status,
        fuel_level: formData.fuel_level,
      });
    }
    if (success) {
      setDialogOpen(false);
      setEditMode(null);
      setFormData({ plate: "", model: "", year: "", status: "available", fuel_level: 100 });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Frota" subtitle="Gestão de veículos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Frota" subtitle="Gestão de veículos">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Truck className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inUse}</p>
                <p className="text-sm text-muted-foreground">Em Uso</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-sm text-muted-foreground">Manutenção</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa ou modelo..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="solar" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Última Manutenção</TableHead>
                  <TableHead>Próxima Manutenção</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                          <Truck className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <p className="font-medium">{vehicle.plate}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[vehicle.status].variant}>
                        {statusConfig[vehicle.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-muted-foreground" />
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getFuelColor(vehicle.fuel_level)} transition-all`}
                            style={{ width: `${vehicle.fuel_level}%` }}
                          />
                        </div>
                        <span className="text-sm">{vehicle.fuel_level}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.last_maintenance ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(vehicle.last_maintenance).toLocaleDateString("pt-BR")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.next_maintenance ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(vehicle.next_maintenance).toLocaleDateString("pt-BR")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setDialogOpen(true);
                        setEditMode(vehicle.id);
                        setFormData({
                          plate: vehicle.plate,
                          model: vehicle.model,
                          year: vehicle.year ? vehicle.year.toString() : "",
                          status: vehicle.status,
                          fuel_level: vehicle.fuel_level,
                        });
                      }}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (window.confirm(`Deseja realmente excluir o veículo ${vehicle.plate}?`)) {
                          deleteVehicle(vehicle.id);
                        }
                      }}>
                        Excluir
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditMode(null);
          setFormData({ plate: "", model: "", year: "", status: "available", fuel_level: 100 });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plate">Placa *</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Fiat Fiorino"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as VehicleStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="inUse">Em Uso</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false);
                setEditMode(null);
                setFormData({ plate: "", model: "", year: "", status: "available", fuel_level: 100 });
              }}>Cancelar</Button>
              <Button type="submit" variant="solar">{editMode ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Frota;
