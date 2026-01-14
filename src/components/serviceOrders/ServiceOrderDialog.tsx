import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ServiceOrder } from "@/components/dashboard";

interface ServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: ServiceOrder | null;
  onSave: (order: Omit<ServiceOrder, "id"> & { id?: string }) => void;
}

const serviceTypes = [
  "Instalação Solar 3kW",
  "Instalação Solar 5kW",
  "Instalação Solar 10kW",
  "Instalação Solar 15kW",
  "Manutenção Preventiva",
  "Manutenção Corretiva",
  "Vistoria Técnica",
  "Limpeza de Painéis",
];

const teamMembers = [
  { id: "1", name: "Carlos Mendes" },
  { id: "2", name: "Ana Paula" },
  { id: "3", name: "Pedro Costa" },
  { id: "4", name: "Lucas Silva" },
];

const vehicles = [
  { id: "1", plate: "ABC-1234", model: "Fiorino Furgão" },
  { id: "2", plate: "DEF-5678", model: "Ducato" },
  { id: "3", plate: "GHI-9012", model: "Fiorino Furgão" },
  { id: "4", plate: "JKL-3456", model: "Sprinter" },
];

export function ServiceOrderDialog({
  open,
  onOpenChange,
  order,
  onSave,
}: ServiceOrderDialogProps) {
  const [formData, setFormData] = useState({
    client: "",
    address: "",
    type: "",
    team: "",
    vehicle: "",
    scheduledTime: "",
    status: "pending" as ServiceOrder["status"],
  });

  useEffect(() => {
    if (order) {
      setFormData({
        client: order.client,
        address: order.address,
        type: order.type,
        team: order.team,
        vehicle: order.vehicle,
        scheduledTime: order.scheduledTime,
        status: order.status,
      });
    } else {
      setFormData({
        client: "",
        address: "",
        type: "",
        team: "",
        vehicle: "",
        scheduledTime: "",
        status: "pending",
      });
    }
  }, [order, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client || !formData.address || !formData.type) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    onSave({
      ...formData,
      id: order?.id,
    });

    onOpenChange(false);
    toast.success(order ? "Ordem de serviço atualizada!" : "Ordem de serviço criada!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="service-order-description" className="fixed inset-0 z-50 flex flex-col bg-background p-0 m-0 max-w-none w-full h-full overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto my-4 bg-background rounded-lg shadow-lg p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <DialogHeader>
            <DialogTitle>{order ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
            <DialogDescription id="service-order-description">
              {order 
                ? "Edite os dados da ordem de serviço" 
                : "Preencha os dados para criar uma nova ordem de serviço"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="client">Cliente *</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              {/* ...existing code... */}
            </div>
            <div>
              <Label htmlFor="type">Tipo de Serviço</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ex: Instalação Solar 5kW, Manutenção Preventiva..."
              />
            </div>
            <div>
              <Label htmlFor="team">Responsável</Label>
              <Select
                value={formData.team}
                onValueChange={(value) => setFormData({ ...formData, team: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicle">Veículo</Label>
              <Select
                value={formData.vehicle}
                onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.plate}>
                      {vehicle.plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledTime">Horário Agendado</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>
            {order && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ServiceOrder["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="inProgress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="solar">
                {order ? "Salvar Alterações" : "Criar Ordem"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
