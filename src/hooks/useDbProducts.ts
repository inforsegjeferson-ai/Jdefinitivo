import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Product, ProductInput } from '@/types/product';

export const useDbProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: ProductInput): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const resp = await supabase
        .from('products')
        .insert([{
          ...product,
          user_id: user.id,
        }])
        .select()
        .single();

      const { data, error, status } = resp as any;
      if (error) {
        console.error('Error adding product:', { error, status, resp });
        toast.error(`Erro ao adicionar produto: ${error.message || JSON.stringify(error)}`);
        return false;
      }

      setProducts(prev => [data, ...prev]);
      toast.success(`Produto '${product.name}' adicionado com sucesso!`);
      return true;
    } catch (err) {
      console.error('Unexpected error adding product:', err);
      toast.error('Erro inesperado ao adicionar produto');
      return false;
    }
  };

  const updateProduct = async (id: string, updates: Partial<ProductInput>): Promise<boolean> => {

    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        toast.error('Erro ao atualizar produto');
        return false;
      }

      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      toast.success('Produto atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Unexpected error updating product:', err);
      toast.error('Erro inesperado ao atualizar produto');
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao excluir produto');
        return false;
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto excluído com sucesso!');
      return true;
    } catch (err) {
      console.error('Unexpected error deleting product:', err);
      toast.error('Erro inesperado ao excluir produto');
      return false;
    }
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
};
