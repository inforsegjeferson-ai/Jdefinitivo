import { useMemo } from "react";
import { AgendaCalendar } from "@/components/ui/AgendaCalendar";
import { useOfflineServiceOrders } from "@/hooks/useOfflineServiceOrders";

export function DashboardAgenda() {
  const { orders } = useOfflineServiceOrders();
  const scheduledOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "inProgress"),
    [orders]
  );
  return (
    <div className="mb-8">
      <AgendaCalendar orders={scheduledOrders} />
    </div>
  );
}
