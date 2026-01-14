import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from "@/components/layout";
import { ServiceOrdersMap, ServiceOrder } from "@/components/dashboard";
import { useDbServiceOrders } from "@/hooks/useDbServiceOrders";
import { Loader2 } from 'lucide-react';

const ServiceOrdersMapPage: React.FC = () => {
  const { orders: dbOrders, loading: ordersLoading, refetch } = useDbServiceOrders();
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    if (dbOrders) {
      // Aqui você pode adicionar lógica para filtrar por status se o ServiceOrdersMap não lidar com isso
      // Por enquanto, vamos passar todas as ordens do dbOrders
      const mappedOrders: ServiceOrder[] = dbOrders.map(o => ({
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
      setFilteredOrders(mappedOrders);
    }
  }, [dbOrders]);

  if (ordersLoading) {
    return (
      <DashboardLayout title="Mapa de Ordens de Serviço" subtitle="Carregando...">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mapa de Ordens de Serviço" subtitle="Visualize todas as ordens">
      {filteredOrders.length > 0 ? (
        <ServiceOrdersMap orders={filteredOrders} height="calc(100vh - 120px)" />
      ) : (
        <div className="text-center text-muted-foreground py-10">
          Nenhuma ordem de serviço encontrada.
        </div>
      )}
    </DashboardLayout>
  );
};

export default ServiceOrdersMapPage;
