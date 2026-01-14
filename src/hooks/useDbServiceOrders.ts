import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type ServiceOrderStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled';

export interface DbServiceOrder {
  id: string;
  order_number: string;
  client_name: string;
  client_address: string;
  service_type: string;
  status: ServiceOrderStatus;
  scheduled_time: string | null;
  scheduled_date: string | null;
  team_lead_id: string | null;
  auxiliary_id: string | null;
  vehicle_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderInput {
  client_name: string;
  client_address: string;
  service_type: string;
  status?: ServiceOrderStatus;
  scheduled_time?: string;
  scheduled_date?: string;
  team_lead_id?: string;
  auxiliary_id?: string;
  vehicle_id?: string;
  notes?: string;
}

export interface StartOrderData {
  vehicleId: string;
  auxiliaryId?: string;
  mileage: number;
}

export const useDbServiceOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DbServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const generateOrderNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true });
    
    const nextNumber = (count || 0) + 1;
    return `OS-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addAuditLog = async (
    serviceOrderId: string,
    action: string,
    oldStatus?: ServiceOrderStatus,
    newStatus?: ServiceOrderStatus,
    notes?: string
  ) => {
    if (!user) return;

    await supabase.from('service_order_audit').insert({
      service_order_id: serviceOrderId,
      user_id: user.id,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      notes,
    });
  };

  const addOrder = async (order: ServiceOrderInput): Promise<boolean> => {
    const orderNumber = await generateOrderNumber();
    
    const { data, error } = await supabase
      .from('service_orders')
      .insert([{
        ...order,
        order_number: orderNumber,
        created_by: user?.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding order:', error);
      toast.error('Erro ao criar ordem de serviço');
      return false;
    }

    // Registrar auditoria
    await addAuditLog(data.id, 'created', undefined, data.status as ServiceOrderStatus);

    setOrders(prev => [data, ...prev]);
    toast.success(`Ordem ${orderNumber} criada com sucesso!`);
    return true;
  };

  const updateOrder = async (id: string, updates: Partial<ServiceOrderInput>): Promise<boolean> => {
    // Buscar status atual para auditoria
    const currentOrder = orders.find(o => o.id === id);
    
    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem de serviço');
      return false;
    }

    // Registrar auditoria se status mudou
    if (updates.status && currentOrder?.status !== updates.status) {
      await addAuditLog(
        id, 
        'updated', 
        currentOrder?.status, 
        updates.status as ServiceOrderStatus
      );
    }

    setOrders(prev => prev.map(o => o.id === id ? data : o));
    toast.success('Ordem de serviço atualizada!');
    return true;
  };

  const startOrder = async (id: string, notes?: string, startData?: StartOrderData): Promise<boolean> => {
    const currentOrder = orders.find(o => o.id === id);
    if (!currentOrder || currentOrder.status !== 'pending') {
      toast.error('Esta ordem não pode ser iniciada');
      return false;
    }

    const updateData: any = {
      status: 'inProgress',
    };

    if (startData) {
      updateData.vehicle_id = startData.vehicleId;
      updateData.start_mileage = startData.mileage;
      if (startData.auxiliaryId) {
        updateData.auxiliary_id = startData.auxiliaryId;
      }
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error starting order:', error);
      toast.error('Erro ao iniciar ordem de serviço');
      return false;
    }

    await addAuditLog(id, 'started', 'pending', 'inProgress', notes);

    setOrders(prev => prev.map(o => o.id === id ? data : o));
    toast.success('Ordem de serviço iniciada!');
    return true;
  };

  const finishOrder = async (id: string, notes?: string): Promise<boolean> => {
    const currentOrder = orders.find(o => o.id === id);
    if (!currentOrder || currentOrder.status !== 'inProgress') {
      toast.error('Esta ordem não pode ser finalizada');
      return false;
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error finishing order:', error);
      toast.error('Erro ao finalizar ordem de serviço');
      return false;
    }

    await addAuditLog(id, 'finished', 'inProgress', 'completed', notes);

    setOrders(prev => prev.map(o => o.id === id ? data : o));
    toast.success('Ordem de serviço finalizada!');
    return true;
  };

  const deleteOrder = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir ordem de serviço');
      return false;
    }

    setOrders(prev => prev.filter(o => o.id !== id));
    toast.success('Ordem de serviço excluída!');
    return true;
  };

  const reassignOrder = async (
    id: string,
    teamLeadId?: string | null,
    auxiliaryId?: string | null,
    notes?: string
  ): Promise<boolean> => {
    const currentOrder = orders.find(o => o.id === id);

    const { data, error } = await supabase
      .from('service_orders')
      .update({ team_lead_id: teamLeadId ?? currentOrder?.team_lead_id, auxiliary_id: auxiliaryId ?? currentOrder?.auxiliary_id })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error reassigning order:', error);
      toast.error('Erro ao reatribuir ordem de serviço');
      return false;
    }

    // Registrar auditoria com informação das alterações de responsáveis (nomes legíveis + estrutura JSON)
    const prevLead = currentOrder?.team_lead_id || null;
    const prevAux = currentOrder?.auxiliary_id || null;

    // Buscar nomes dos perfis envolvidos para uma nota legível
    const idsToFetch = [prevLead, prevAux, teamLeadId, auxiliaryId].filter(Boolean) as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', idsToFetch || []);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

    const prevLeadName = prevLead ? profileMap.get(prevLead) || prevLead : null;
    const prevAuxName = prevAux ? profileMap.get(prevAux) || prevAux : null;
    const nextLeadName = teamLeadId ? profileMap.get(teamLeadId) || teamLeadId : null;
    const nextAuxName = auxiliaryId ? profileMap.get(auxiliaryId) || auxiliaryId : null;

    const noteObj = {
      type: 'reassign',
      message: `Reatribuída: ${prevLeadName || '—'} → ${nextLeadName || '—'}; ${prevAuxName || '—'} → ${nextAuxName || '—'}`,
      prev: { team_lead_id: prevLead, team_lead_name: prevLeadName, auxiliary_id: prevAux, auxiliary_name: prevAuxName },
      next: { team_lead_id: teamLeadId || null, team_lead_name: nextLeadName, auxiliary_id: auxiliaryId || null, auxiliary_name: nextAuxName },
      reason: notes || null,
    };

    await addAuditLog(id, 'reassigned', undefined, undefined, JSON.stringify(noteObj));

    setOrders(prev => prev.map(o => o.id === id ? data : o));
    toast.success('Ordem de serviço reatribuída!');
    return true;
  };

  const getOrdersByStatus = (status: ServiceOrderStatus) => {
    return orders.filter(o => o.status === status);
  };

  const getTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(o => o.scheduled_date === today);
  };

  return {
    orders,
    loading,
    addOrder,
    updateOrder,
    startOrder,
    finishOrder,
    deleteOrder,
    getOrdersByStatus,
    getTodayOrders,
    refetch: fetchOrders,
    reassignOrder,
  };
};
