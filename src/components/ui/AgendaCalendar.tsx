import { useMemo } from "react";
import { Calendar as BigCalendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface AgendaCalendarProps {
  orders: Array<{
    id: string;
    order_number?: string;
    client_name: string;
    scheduled_date: string;
    scheduled_time?: string;
    service_type: string;
    status: string;
  }>;
}

export function AgendaCalendar({ orders }: AgendaCalendarProps) {
  const events = useMemo<Event[]>(() =>
    orders.map((order) => {
      const date = order.scheduled_date ? moment(order.scheduled_date) : moment();
      let start = date;
      let end = date;
      if (order.scheduled_time) {
        const [h, m] = order.scheduled_time.split(":");
        start = date.clone().hour(Number(h)).minute(Number(m));
        end = start.clone().add(2, "hours");
      }
      return {
        id: order.id,
        title: `${order.order_number || order.id} - ${order.client_name}`,
        start: start.toDate(),
        end: end.toDate(),
        resource: order,
      };
    }),
    [orders]
  );

  return (
    <div style={{ height: 600 }}>
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        views={["month", "week", "day"]}
        defaultView="month"
        popup
        style={{ height: 600 }}
        messages={{
          month: "Mês",
          week: "Semana",
          day: "Dia",
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
        }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.resource.status === "pending" ? "#fbbf24" : event.resource.status === "inProgress" ? "#38bdf8" : "#22c55e",
            color: "#222",
            borderRadius: 6,
            border: 0,
            fontWeight: 500,
          },
        })}
      />
    </div>
  );
}
