import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import { 
  StatCard, 
  ServiceOrderCard, 
  TimeRecordsList, 
  TeamOverview,
  ServiceOrdersMap,
  ServiceOrder,
  TimeRecord
} from "@/components/dashboard";
import { DashboardAgenda } from "@/components/dashboard/DashboardAgenda";
import { ServiceOrderDialog } from "@/components/serviceOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ClipboardList, 
  Users, 
  Truck, 
  Sun, 
  Plus, 
  TrendingUp,
  Calendar,
  ChevronRight,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useDbServiceOrders, StartOrderData } from "@/hooks/useDbServiceOrders";
import { useDbTeam } from "@/hooks/useDbTeam";
import { useDbVehicles } from "@/hooks/useDbVehicles";
import { useDbTimeRecords } from "@/hooks/useDbTimeRecords";

const Index = () => {
  const { orders: dbOrders, loading: ordersLoading, addOrder, startOrder, finishOrder, refetch } = useDbServiceOrders();
  const { members, loading: teamLoading } = useDbTeam();
  const { vehicles, loading: vehiclesLoading } = useDbVehicles();
  const { records: timeRecords, loading: recordsLoading } = useDbTimeRecords();
  
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
    const todayStr = today.toISOString().split('T')[0];

    // Mapear ordens do banco para o formato do componente
  const orders: ServiceOrder[] = useMemo(() => {
    const filteredOrders = (dbOrders || [])
      .filter(o => o.scheduled_date === todayStr)
      .map(o => ({
        id: o.order_number,
        dbId: o.id,
        client: o.client_name,
        address: o.client_address,
        status: o.status as ServiceOrder['status'],
        team: o.team_lead_id || '-',
        vehicle: o.vehicle_id || '-',
        scheduledTime: o.scheduled_time || '-',
        type: o.service_type,
        checklistTemplateId: (o as any).checklist_template_id || undefined,
      }));
    return filteredOrders;
  }, [dbOrders, todayStr]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const todayOrders = dbOrders.filter(o => o.scheduled_date === todayStr);
    const inProgressOrders = todayOrders.filter(o => o.status === 'inProgress').length;
    const completedOrders = todayOrders.filter(o => o.status === 'completed').length;
    const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;

    const activeMembers = members.filter(m => m.is_active).length;
    const vehiclesInUse = vehicles.filter(v => v.status === 'inUse').length;

    return {
      totalOrders: todayOrders.length,
      inProgress: inProgressOrders,
      completed: completedOrders,
      pending: pendingOrders,
      activeMembers,
      vehiclesInUse,
      vehiclesTotal: vehicles.length,
    };
  }, [dbOrders, members, vehicles, todayStr]);

  // Mapear registros de ponto
  const mappedTimeRecords: TimeRecord[] = useMemo(() => {
    return timeRecords.slice(0, 5).map(r => ({
      id: r.id,
      user: r.user_id,
      type: r.record_type as TimeRecord['type'],
      time: r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
      location: r.location_name || 'Desconhecido',
      validated: r.is_validated || false,
    }));
  }, [timeRecords]);

  // Mapear equipe
  const mappedTeam = useMemo(() => {
    return members.filter(m => m.is_active).slice(0, 4).map(m => ({
      id: m.id,
      name: m.name,
      role: 'installer' as const, // TODO: buscar role real
      status: 'available' as const,
    }));
  }, [members]);

  // Mapear veículos
  const mappedVehicles = useMemo(() => {
    return vehicles.slice(0, 4).map(v => ({
      id: v.id,
      plate: v.plate,
      model: v.model,
      status: v.status as 'available' | 'inUse' | 'maintenance',
    }));
  }, [vehicles]);

  const handleSaveOrder = async (orderData: Omit<ServiceOrder, "id"> & { id?: string }) => {
    await addOrder({
      client_name: orderData.client,
      client_address: orderData.address,
      service_type: orderData.type,
      status: orderData.status,
      scheduled_time: orderData.scheduledTime,
      scheduled_date: todayStr,
    });
  };

  const handleStartOrder = async (orderId: string, notes?: string, startData?: StartOrderData): Promise<boolean> => {
    // orderId já é o dbId quando vem do ServiceOrderActions
    // Mas pode ser order_number em alguns casos, então verificamos ambos
    const order = orders.find(o => o.dbId === orderId || o.id === orderId);
    const dbId = order?.dbId || orderId;
    
    try {
      const result = await startOrder(dbId, notes, startData);
      if (result) {
        await refetch();
      }
      return result;
    } catch (error) {
      console.error('Error starting order:', error);
      return false;
    }
  };

  const handleFinishOrder = async (orderId: string, notes?: string): Promise<boolean> => {
    // orderId já é o dbId quando vem do ServiceOrderActions
    const order = orders.find(o => o.dbId === orderId || o.id === orderId);
    const dbId = order?.dbId || orderId;
    
    try {
      const result = await finishOrder(dbId, notes);
      if (result) {
        await refetch();
      }
      return result;
    } catch (error) {
      console.error('Error finishing order:', error);
      return false;
    }
  };

  const isLoading = ordersLoading || teamLoading || vehiclesLoading || recordsLoading;

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Ordens Hoje"
          value={isLoading ? '...' : stats.totalOrders}
          change={stats.completed > 0 ? { value: Math.round((stats.completed / stats.totalOrders) * 100), type: "increase" } : undefined}
          icon={ClipboardList}
          variant="solar"
          delay={0}
        />
        <StatCard
          title="Em Andamento"
          value={isLoading ? '...' : stats.inProgress}
          icon={Users}
          variant="success"
          delay={0.1}
        />
        <StatCard
          title="Veículos em Uso"
          value={isLoading ? '...' : `${stats.vehiclesInUse}/${stats.vehiclesTotal}`}
          icon={Truck}
          variant="info"
          delay={0.2}
        />
        <StatCard
          title="Concluídas"
          value={isLoading ? '...' : stats.completed}
          change={stats.completed > 0 ? { value: stats.completed, type: "increase" } : undefined}
          icon={Sun}
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Service Orders Column */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center"
          >
            <h2 className="text-lg font-semibold">Ordens de Serviço de Hoje</h2>
          </motion.div>
          
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma ordem de serviço para hoje</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order, index) => (
                <ServiceOrderCard 
                  key={order.dbId || order.id} 
                  order={order} 
                  delay={0.3 + index * 0.1}
                  onStartOrder={handleStartOrder}
                  onFinishOrder={handleFinishOrder}
                />
              ))
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/ordens">
              <Button variant="outline" className="w-full">
                Ver todas as ordens
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {/* Removido botão Nova OS */}
                <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                  <Calendar className="h-5 w-5 text-info" />
                  <span className="text-xs">Agendar</span>
                </Button>
                <Link to="/equipe" className="contents">
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                    <Users className="h-5 w-5 text-success" />
                    <span className="text-xs">Equipe</span>
                  </Button>
                </Link>
                <Link to="/frota" className="contents">
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1">
                    <Truck className="h-5 w-5 text-warning" />
                    <span className="text-xs">Frota</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Time Records */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TimeRecordsList records={mappedTimeRecords} />
          </motion.div>
        </div>
      </div>

      {/* Service Orders Map */}
      {(Array.isArray(orders) && orders.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <ServiceOrdersMap orders={orders} height="500px" />
        </motion.div>
      )}

      {/* Team & Fleet Overview */}
      <div className="mt-6">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-lg font-semibold mb-4"
        >
          Visão Geral
        </motion.h2>
        <TeamOverview members={mappedTeam} vehicles={mappedVehicles} />
      </div>

      {/* Dialog removido, criação de OS apenas em OrdensServico */}
    </DashboardLayout>
  );
};

export default Index;
