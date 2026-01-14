import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import {
  cacheServiceOrders,
  getCachedOrders,
  updateCachedOrder,
  addPendingAction,
  getPendingActions,
  removePendingAction,
  getPendingActionsCount,
  getLastSyncTime,
} from '@/lib/offlineDb';

export type ServiceOrderStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled';

export interface StartOrderData {
  vehicleId: string;
  auxiliaryId?: string;
  mileage: number;
}

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
  start_mileage?: number | null;
  end_mileage?: number | null;
  checklist_template_id?: string | null;
}

export const useOfflineServiceOrders = () => {
  const { user } = useAuth();
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus();
  const [orders, setOrders] = useState<DbServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Atualizar contagem de ações pendentes
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingActionsCount();
    setPendingCount(count);
  }, []);

  // Carregar ordens (online ou cache)
  const fetchOrders = useCallback(async () => {
    setLoading(true);

    if (isOnline) {
      // Buscar do servidor
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        // Fallback para cache
        const cached = await getCachedOrders();
        setOrders(cached);
        toast.error('Erro ao carregar. Usando dados em cache.');
      } else {
        const ordersData = data || [];
        setOrders(ordersData);
        // Atualizar cache
        await cacheServiceOrders(ordersData);
        setLastSync(new Date());
      }
    } else {
      // Offline - usar cache
      const cached = await getCachedOrders();
      setOrders(cached);
      const syncTime = await getLastSyncTime();
      if (syncTime) setLastSync(new Date(syncTime));
    }

    await updatePendingCount();
    setLoading(false);
  }, [isOnline, updatePendingCount]);

  // Sincronizar ações pendentes
  const syncPendingActions = useCallback(async (): Promise<boolean> => {
    if (!isOnline || !user) return false;

    setSyncing(true);
    const actions = await getPendingActions();

    if (actions.length === 0) {
      setSyncing(false);
      return true;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const action of actions) {
      try {
        let success = false;

        if (action.type === 'start') {
          const { error } = await supabase
            .from('service_orders')
            .update({ status: 'inProgress' })
            .eq('id', action.orderId);

          if (!error) {
            // Registrar auditoria
            await supabase.from('service_order_audit').insert({
              service_order_id: action.orderId,
              user_id: user.id,
              action: 'started',
              old_status: 'pending',
              new_status: 'inProgress',
              notes: action.notes,
            });
            success = true;
          }
        } else if (action.type === 'finish') {
          const { error } = await supabase
            .from('service_orders')
            .update({ status: 'completed' })
            .eq('id', action.orderId);

          if (!error) {
            await supabase.from('service_order_audit').insert({
              service_order_id: action.orderId,
              user_id: user.id,
              action: 'finished',
              old_status: 'inProgress',
              new_status: 'completed',
              notes: action.notes,
            });
            success = true;
          }
        } else if (action.type === 'update' && action.data) {
          const { error } = await supabase
            .from('service_orders')
            .update(action.data)
            .eq('id', action.orderId);

          success = !error;
        }

        if (success) {
          await removePendingAction(action.id);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error('Sync error:', err);
        errorCount++;
      }
    }

    await updatePendingCount();
    setSyncing(false);

    if (successCount > 0) {
      toast.success(`${successCount} ação(ões) sincronizada(s)!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} ação(ões) falharam na sincronização.`);
    }

    // Recarregar dados do servidor
    await fetchOrders();

    return errorCount === 0;
  }, [isOnline, user, updatePendingCount, fetchOrders]);

  // Efeito para sincronizar quando voltar online
  useEffect(() => {
    if (wasOffline && isOnline) {
      syncPendingActions().then(() => {
        clearWasOffline();
      });
    }
  }, [wasOffline, isOnline, syncPendingActions, clearWasOffline]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchOrders();
  }, []);

  // Recarregar quando status de conexão mudar
  useEffect(() => {
    if (isOnline) {
      fetchOrders();
    }
  }, [isOnline]);

  // Adicionar auditoria local
  const addAuditLog = async (
    serviceOrderId: string,
    action: string,
    oldStatus?: ServiceOrderStatus,
    newStatus?: ServiceOrderStatus,
    notes?: string
  ) => {
    if (!user || !isOnline) return;

    await supabase.from('service_order_audit').insert({
      service_order_id: serviceOrderId,
      user_id: user.id,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      notes,
    });
  };

  // Iniciar OS (com suporte offline e dados extras)
  const startOrder = async (id: string, notes?: string, startData?: StartOrderData): Promise<boolean> => {
    const currentOrder = orders.find(o => o.id === id);
    if (!currentOrder || currentOrder.status !== 'pending') {
      toast.error('Esta ordem não pode ser iniciada');
      return false;
    }

    // Dados da atualização
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

    // Atualização otimista local
    const updatedOrder = { 
      ...currentOrder, 
      ...updateData,
      status: 'inProgress' as ServiceOrderStatus 
    };
    setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    await updateCachedOrder(updatedOrder);

    if (isOnline) {
      const { error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id);

      if (error) {
        // Reverter e salvar para sincronização posterior
        setOrders(prev => prev.map(o => o.id === id ? currentOrder : o));
        await updateCachedOrder(currentOrder);
        await addPendingAction('start', id, updateData, notes);
        await updatePendingCount();
        toast.warning('Salvo offline. Será sincronizado quando houver conexão.');
        return true;
      }

      await addAuditLog(id, 'started', 'pending', 'inProgress', notes);
      toast.success('Ordem de serviço iniciada!');
    } else {
      // Offline - salvar ação pendente
      await addPendingAction('start', id, updateData, notes);
      await updatePendingCount();
      toast.info('Salvo offline. Será sincronizado automaticamente.');
    }

    return true;
  };

  // Finalizar OS (com suporte offline)
  const finishOrder = async (id: string, notes?: string): Promise<boolean> => {
    const currentOrder = orders.find(o => o.id === id);
    if (!currentOrder || currentOrder.status !== 'inProgress') {
      toast.error('Esta ordem não pode ser finalizada');
      return false;
    }

    // Atualização otimista local
    const updatedOrder = { ...currentOrder, status: 'completed' as ServiceOrderStatus };
    setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    await updateCachedOrder(updatedOrder);

    if (isOnline) {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) {
        setOrders(prev => prev.map(o => o.id === id ? currentOrder : o));
        await updateCachedOrder(currentOrder);
        await addPendingAction('finish', id, undefined, notes);
        await updatePendingCount();
        toast.warning('Salvo offline. Será sincronizado quando houver conexão.');
        return true;
      }

      await addAuditLog(id, 'finished', 'inProgress', 'completed', notes);
      toast.success('Ordem de serviço finalizada!');
    } else {
      await addPendingAction('finish', id, undefined, notes);
      await updatePendingCount();
      toast.info('Salvo offline. Será sincronizado automaticamente.');
    }

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
    syncing,
    isOnline,
    pendingCount,
    lastSync,
    startOrder,
    finishOrder,
    getOrdersByStatus,
    getTodayOrders,
    syncPendingActions,
    refetch: fetchOrders,
  };
};
