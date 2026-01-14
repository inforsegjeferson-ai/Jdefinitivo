import { DashboardLayout } from "@/components/layout";
import { ServiceOrderCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useOfflineServiceOrders, ServiceOrderStatus } from "@/hooks/useOfflineServiceOrders";
import { useDbTeam } from "@/hooks/useDbTeam";
import { useDbVehicles } from "@/hooks/useDbVehicles";
import { useDbClients } from "@/hooks/useDbClients";
import { toast } from "sonner";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ClientDialog } from "@/components/clients";

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

import { useDbChecklistTemplates } from "@/hooks/useDbChecklistTemplates";

const OrdensServico = () => {
    const { templates: checklistTemplates, loading: loadingTemplates } = useDbChecklistTemplates();
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();
  const { 
    orders, 
    loading, 
    syncing,
    isOnline,
    pendingCount,
    lastSync,
    startOrder, 
    finishOrder,
    syncPendingActions,
    refetch,
  } = useOfflineServiceOrders();
  const { members } = useDbTeam();
  const { vehicles } = useDbVehicles();
  const { clients, addClient } = useDbClients();
  
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<typeof orders[0] | null>(null);
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    client_address: "",
    service_type: "",
    team_lead_id: "",
    vehicle_id: "",
    scheduled_time: "",
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: "",
    checklist_template_id: "",
  });

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch =
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "inProgress").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      client_name: "",
      client_address: "",
      service_type: "",
      team_lead_id: "",
      vehicle_id: "",
      scheduled_time: "",
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: "",
      checklist_template_id: "",
    });
    setEditingOrder(null);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        client_id: clientId,
        client_name: client.name,
        client_address: `${client.address}, ${client.city}${client.state ? ` - ${client.state}` : ''}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_address || !formData.service_type) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (!isOnline) {
      toast.error("Não é possível salvar offline. Conecte-se à internet.");
      return;
    }

    if (editingOrder) {
      // Atualizar ordem existente
      const { error } = await supabase
        .from('service_orders')
        .update({
          client_id: formData.client_id || null,
          client_name: formData.client_name,
          client_address: formData.client_address,
          service_type: formData.service_type,
          team_lead_id: formData.team_lead_id || null,
          vehicle_id: formData.vehicle_id || null,
          scheduled_time: formData.scheduled_time || null,
          scheduled_date: formData.scheduled_date,
          notes: formData.notes || null,
          checklist_template_id: formData.checklist_template_id || null,
        })
        .eq('id', editingOrder.id);

      if (error) {
        toast.error("Erro ao atualizar ordem de serviço");
        return;
      }

      toast.success("Ordem de serviço atualizada!");
    } else {
      // Criar nova ordem
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });
      
      const nextNumber = (count || 0) + 1;
      const orderNumber = `OS-${year}-${String(nextNumber).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('service_orders')
        .insert([{
          order_number: orderNumber,
          client_id: formData.client_id || null,
          client_name: formData.client_name,
          client_address: formData.client_address,
          service_type: formData.service_type,
          team_lead_id: formData.team_lead_id || null,
          vehicle_id: formData.vehicle_id || null,
          scheduled_time: formData.scheduled_time || null,
          scheduled_date: formData.scheduled_date,
          notes: formData.notes || null,
          created_by: user?.id,
          checklist_template_id: formData.checklist_template_id || null,
        }])
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar ordem de serviço");
        return;
      }

      // Registrar auditoria
      if (data && user) {
        await supabase.from('service_order_audit').insert({
          service_order_id: data.id,
          user_id: user.id,
          action: 'created',
          new_status: 'pending',
        });
      }

      toast.success(`Ordem ${orderNumber} criada com sucesso!`);
    }

    setDialogOpen(false);
    resetForm();
    refetch();
  };

  const handleEdit = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setEditingOrder(order);
      setFormData({
        client_id: (order as any).client_id || "",
        client_name: order.client_name,
        client_address: order.client_address,
        service_type: order.service_type,
        team_lead_id: order.team_lead_id || "",
        vehicle_id: order.vehicle_id || "",
        scheduled_time: order.scheduled_time || "",
        scheduled_date: order.scheduled_date || new Date().toISOString().split('T')[0],
        notes: order.notes || "",
        checklist_template_id: (order as any).checklist_template_id || "",
      });
      setDialogOpen(true);
    }
  };

  const handleDelete = async (orderId: string): Promise<boolean> => {
    if (!isOnline) {
      toast.error("Não é possível excluir offline. Conecte-se à internet.");
      return false;
    }

    // Verificar permissão de admin
    if (!isAdmin()) {
      toast.error("Apenas administradores podem excluir ordens de serviço.");
      return false;
    }

    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      toast.error("Erro ao excluir ordem de serviço");
      return false;
    }

    toast.success("Ordem de serviço excluída!");
    refetch();
    return true;
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Convert DB order to frontend format for ServiceOrderCard
  const convertOrder = (order: typeof orders[0]) => ({
    id: order.order_number,
    dbId: order.id, // ID real do banco para ações
    client: order.client_name,
    address: order.client_address,
    status: order.status as "pending" | "inProgress" | "completed" | "cancelled",
    team: members.find(m => m.id === order.team_lead_id)?.name || "-",
    vehicle: vehicles.find(v => v.id === order.vehicle_id)?.plate || "-",
    scheduledTime: order.scheduled_time || "-",
    type: order.service_type,
    checklistTemplateId: (order as any).checklist_template_id,
  });

  if (loading) {
    return (
      <DashboardLayout title="Ordens de Serviço" subtitle="Gerencie suas ordens de serviço">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ordens de Serviço" subtitle="Gerencie suas ordens de serviço">
      {/* Offline Status Indicator */}
      <div className="flex justify-end mb-4">
        <OfflineIndicator
          isOnline={isOnline}
          pendingCount={pendingCount}
          syncing={syncing}
          lastSync={lastSync}
          onSync={syncPendingActions}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("all")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("pending")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("inProgress")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <AlertCircle className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter("completed")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, OS ou endereço..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="inProgress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setClientDialogOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
        <Button variant="solar" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </motion.div>

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order, index) => {
          const converted = convertOrder(order);
          return (
            <ServiceOrderCard 
              key={order.id} 
              order={{ ...converted, dbId: order.id }}
              delay={0.5 + index * 0.05}
              onStartOrder={(_, notes) => startOrder(order.id, notes)}
              onFinishOrder={(_, notes) => finishOrder(order.id, notes)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canDelete={isAdmin()}
            />
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhuma OS encontrada</h3>
          <p className="text-muted-foreground">Clique em "Nova OS" para criar uma ordem de serviço.</p>
        </motion.div>
      )}

      {/* Dialog Nova/Editar OS */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Cliente</Label>
                <Select value={formData.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente cadastrado" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} - {c.city}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Nome do Cliente *</Label>
                <Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div className="col-span-2">
                <Label>Endereço *</Label>
                <Textarea value={formData.client_address} onChange={(e) => setFormData({ ...formData, client_address: e.target.value })} placeholder="Endereço completo" rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Tipo de Serviço *</Label>
                <Input 
                  value={formData.service_type} 
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })} 
                  placeholder="Ex: Instalação Solar 5kW, Manutenção Preventiva..." 
                />
              </div>
              <div className="col-span-2">
                <Label>Checklist Obrigatório</Label>
                <Select value={formData.checklist_template_id} onValueChange={(v) => setFormData({ ...formData, checklist_template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um checklist (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {checklistTemplates.map((tpl) => (<SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select value={formData.team_lead_id} onValueChange={(v) => setFormData({ ...formData, team_lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veículo</Label>
                <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (<SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações adicionais" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancelar</Button>
              <Button type="submit" variant="solar">{editingOrder ? 'Salvar Alterações' : 'Criar Ordem'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Cliente */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSave={addClient}
      />
    </DashboardLayout>
  );
};

export default OrdensServico;
