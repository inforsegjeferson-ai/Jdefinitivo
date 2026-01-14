import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Clock } from 'lucide-react';

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
}

interface ServiceOrderAuditLogProps {
  serviceOrderId: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  inProgress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const actionLabels: Record<string, string> = {
  created: 'Criou a OS',
  started: 'Iniciou a OS',
  finished: 'Finalizou a OS',
  updated: 'Atualizou a OS',
  cancelled: 'Cancelou a OS',
};

export function ServiceOrderAuditLog({ serviceOrderId }: ServiceOrderAuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLog = async () => {
      const { data: auditData, error } = await supabase
        .from('service_order_audit')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit log:', error);
        setLoading(false);
        return;
      }

      // Fetch user names
      const userIds = [...new Set(auditData?.map(e => e.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      const entriesWithNames = auditData?.map(entry => ({
        ...entry,
        user_name: profileMap.get(entry.user_id) || 'Usuário desconhecido',
      })) || [];

      setEntries(entriesWithNames);
      setLoading(false);
    };

    fetchAuditLog();
  }, [serviceOrderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro de auditoria encontrado.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="relative pl-6 pb-4 border-l-2 border-border last:pb-0"
          >
            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {actionLabels[entry.action] || entry.action}
                </span>
                {entry.old_status && entry.new_status && (
                  <div className="flex items-center gap-1 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[entry.old_status] || entry.old_status}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[entry.new_status] || entry.new_status}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{entry.user_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {entry.notes && (
                (() => {
                  try {
                    const parsed = JSON.parse(entry.notes);
                    if (parsed && parsed.type === 'reassign') {
                      return (
                        <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                          <p className="font-medium">{parsed.message}</p>
                          <div className="text-xs mt-1">
                            <div>Anterior: {parsed.prev.team_lead_name || '—'} (Técnico), {parsed.prev.auxiliary_name || '—'} (Auxiliar)</div>
                            <div>Novo: {parsed.next.team_lead_name || '—'} (Técnico), {parsed.next.auxiliary_name || '—'} (Auxiliar)</div>
                            {parsed.reason && <div className="mt-1">Motivo: {parsed.reason}</div>}
                          </div>
                        </div>
                      );
                    }
                    // If not recognized JSON, fallthrough to show raw notes
                    return (
                      <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded">{entry.notes}</p>
                    );
                  } catch (e) {
                    return (
                      <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded">{entry.notes}</p>
                    );
                  }
                })()
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
