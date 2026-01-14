import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface SaleCreateInput {
  number: string;
  customer: string;
  customerPhone?: string;
  items: any[]; // keep generic for PDV items
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  installments?: number;
  status?: string;
  notes?: string;
}

export const useDbSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
      toast.error('Erro ao carregar vendas');
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const createSale = async (sale: SaleCreateInput): Promise<{ success: boolean; id?: string }> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return { success: false };
    }

    try {
      const resp: any = await supabase.rpc('create_sale_transaction', { sale_json: sale });
      if (resp?.error) {
        console.error('RPC error creating sale:', resp.error);
        toast.error('Erro ao criar venda');
        return { success: false };
      }

      // RPC returns the sale id
      const saleId = resp?.data ?? resp;
      await fetchSales();
      toast.success('Venda registrada com sucesso');
      return { success: true, id: saleId };
    } catch (err: any) {
      console.error('Unexpected error creating sale:', err);
      toast.error(err?.message ?? 'Erro inesperado ao criar venda');
      return { success: false };
    }
  };

  const cancelSale = async (saleId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp: any = await supabase.rpc('cancel_sale_transaction', { sale_id: saleId });
      if (resp?.error) {
        console.error('RPC error cancelling sale:', resp.error);
        toast.error('Erro ao cancelar venda');
        return false;
      }
      await fetchSales();
      toast.success('Venda cancelada com sucesso');
      return true;
    } catch (err: any) {
      console.error('Unexpected error cancelling sale:', err);
      toast.error('Erro inesperado ao cancelar venda');
      return false;
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    cancelSale,
  };
};

export default useDbSales;
