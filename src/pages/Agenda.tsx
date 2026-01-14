import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaCalendar } from "@/components/ui/AgendaCalendar";
import { Calendar, Clock, ClipboardList, User, MapPin } from "lucide-react";
import { useOfflineServiceOrders } from "@/hooks/useOfflineServiceOrders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Agenda() {
  const { orders, loading } = useOfflineServiceOrders();
  const [scheduledOrders, setScheduledOrders] = useState([]);

  useEffect(() => {
    // Filtra apenas ordens agendadas (status pending ou inProgress)
    setScheduledOrders(
      orders.filter(
        (o) => o.status === "pending" || o.status === "inProgress"
      )
    );
  }, [orders]);

  return (
    <DashboardLayout title="Agenda" subtitle="Ordens de serviço agendadas">
      <div className="mb-8">
        <AgendaCalendar orders={scheduledOrders} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scheduledOrders.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma OS agendada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Não há ordens de serviço agendadas para os próximos dias.
              </p>
            </CardContent>
          </Card>
        )}
        {scheduledOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {order.order_number || order.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {order.client_name}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {order.client_address}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {order.scheduled_date ? format(new Date(order.scheduled_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                <Clock className="h-4 w-4 ml-4" />
                {order.scheduled_time || "-"}
              </div>
              <div className="text-muted-foreground text-sm">
                <b>Serviço:</b> {order.service_type}
              </div>
              <div className="text-muted-foreground text-sm">
                <b>Status:</b> {order.status === "pending" ? "Agendada" : order.status === "inProgress" ? "Em andamento" : order.status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
