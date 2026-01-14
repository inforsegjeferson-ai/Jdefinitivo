import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { ChecklistExecution } from '@/types/checklist';

export const useDbChecklists = (serviceOrderId?: string) => {
  const [executions, setExecutions] = useState<ChecklistExecution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutions = async () => {
    setLoading(true);
    let query = supabase.from('checklist_executions').select('*');
    if (serviceOrderId) {
      query = query.eq('service_order_id', serviceOrderId);
    }
    const { data, error } = await query.order('started_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar checklists');
      setExecutions([]);
    } else {
      // Mapear campos do banco para o tipo ChecklistExecution
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        templateId: row.template_id,
        templateName: row.template_name,
        serviceOrderId: row.service_order_id,
        executedBy: row.executed_by,
        responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses,
        status: row.status as 'pending' | 'in_progress' | 'completed',
        startedAt: new Date(row.started_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      }));
      setExecutions(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExecutions();
  }, [serviceOrderId]);

  const addExecution = async (execution: Omit<ChecklistExecution, 'id'>) => {
    // Mapear para formato do banco
    const dbExecution = {
      template_id: execution.templateId,
      template_name: execution.templateName,
      service_order_id: execution.serviceOrderId,
      executed_by: execution.executedBy,
      responses: JSON.stringify(execution.responses),
      status: execution.status,
      started_at: execution.startedAt instanceof Date ? execution.startedAt.toISOString() : execution.startedAt,
      completed_at: execution.completedAt instanceof Date ? execution.completedAt.toISOString() : execution.completedAt,
    };
    const { data, error } = await supabase
      .from('checklist_executions')
      .insert([dbExecution])
      .select()
      .single();
    if (error) {
      toast.error('Erro ao salvar checklist');
      return null;
    }
    // Mapear retorno para ChecklistExecution
    const mapped = {
      id: data.id,
      templateId: data.template_id,
      templateName: data.template_name,
      serviceOrderId: data.service_order_id,
      executedBy: data.executed_by,
      responses: typeof data.responses === 'string' ? JSON.parse(data.responses) : data.responses,
      status: data.status as 'pending' | 'in_progress' | 'completed',
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
    setExecutions(prev => [mapped, ...prev]);
    toast.success('Checklist salvo com sucesso!');
    return mapped;
  };

  return {
    executions,
    loading,
    addExecution,
    refetch: fetchExecutions,
  };
};
