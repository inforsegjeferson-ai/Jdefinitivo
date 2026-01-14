import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

interface TimeRecord {
  id: string;
  user_id: string;
  user_name: string;
  record_type: string;
  recorded_at: string;
  location_name: string | null;
  is_validated: boolean;
}

export default function RelatorioPonto() {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("id, name");
    if (!error && data) setProfiles(data);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRecords();
  }, [profiles, userId, startDate, endDate]);

  const fetchUsers = async () => {
    // Busca usuários distintos da tabela de registros
    const { data, error } = await supabase
      .from("time_records")
      .select("user_id")
      .not("user_id", "is", null);
    if (!error && data) {
      const uniqueIds = Array.from(new Set(data.map((r: any) => r.user_id)));
      // Tenta cruzar com profiles
      setUsers(uniqueIds.map(id => {
        const profile = profiles.find(p => p.id === id);
        return { id, name: profile ? profile.name : id };
      }));
    }
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("id, name");
      if (!error && data) setProfiles(data);
    };
  };

  const fetchRecords = async () => {
    setLoading(true);
    let query = supabase.from("time_records").select("id, user_id, record_type, recorded_at, location_name, is_validated").order("recorded_at", { ascending: false });
    if (userId && userId !== "all") query = query.eq("user_id", userId);
    if (startDate) query = query.gte("recorded_at", startDate);
    if (endDate) query = query.lte("recorded_at", endDate + "T23:59:59");
    const { data, error } = await query;
    if (!error && data) {
      setRecords(data.map((r: any) => {
        const profile = profiles.find(p => p.id === r.user_id);
        return { ...r, user_name: profile ? profile.name : r.user_id };
      }));
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Ponto Eletrônico", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Funcionário", "Tipo", "Data/Hora", "Local", "Validado"]],
      body: records.map(r => [
        r.user_name,
        tipoLabel(r.record_type),
        format(new Date(r.recorded_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        r.location_name || "-",
        r.is_validated ? "Sim" : "Não"
      ]),
    });
    doc.save("relatorio-ponto.pdf");
  };

  function tipoLabel(tipo: string) {
    switch (tipo) {
      case "entry": return "Entrada";
      case "lunchOut": return "Saída Almoço";
      case "lunchReturn": return "Retorno Almoço";
      case "exit": return "Saída";
      default: return tipo;
    }
  }

  return (
    <DashboardLayout title="Relatório de Ponto" subtitle="Registros de ponto de todos os funcionários">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <label>Funcionário</label>
            <Select value={userId || "all"} onValueChange={setUserId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label>Data inicial</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>Data final</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button onClick={fetchRecords} disabled={loading}>Filtrar</Button>
          <Button onClick={handleExportPDF} variant="outline" disabled={records.length === 0}>Exportar PDF</Button>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Funcionário</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Data/Hora</th>
                  <th className="p-2 text-left">Local</th>
                  <th className="p-2 text-left">Validado</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.user_name}</td>
                    <td className="p-2">{tipoLabel(r.record_type)}</td>
                    <td className="p-2">{format(new Date(r.recorded_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                    <td className="p-2">{r.location_name || "-"}</td>
                    <td className="p-2">{r.is_validated ? "Sim" : "Não"}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum registro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
