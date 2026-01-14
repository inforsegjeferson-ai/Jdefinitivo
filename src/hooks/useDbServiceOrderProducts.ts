import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface ServiceOrderProductInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit?: string;
}

export const useDbServiceOrderProducts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const fetchProducts = async (serviceOrderId: string) => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('service_order_products')
      .select('*')
      .eq('service_order_id', serviceOrderId)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Erro ao buscar produtos usados');
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const useProducts = async (serviceOrderId: string, items: ServiceOrderProductInput[]): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any).rpc('use_service_order_products', {
        service_order_id: serviceOrderId,
        products: items,
      });
      if (error) {
        toast.error('Erro ao registrar produtos usados');
        return false;
      }
      toast.success('Produtos usados registrados e estoque atualizado');
      await fetchProducts(serviceOrderId);
      return true;
    } catch (err: any) {
      toast.error('Erro inesperado ao registrar produtos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    useProducts,
  };
};

export default useDbServiceOrderProducts;
