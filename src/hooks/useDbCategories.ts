import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useDbCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name');
    if (error) {
      console.error('fetch categories', error);
      toast.error('Erro ao carregar categorias');
    } else {
      setCategories((data || []).map((r: any) => r.name));
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const addCategory = async (name: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('categories')
      .insert([{ name, user_id: user.id }]);
    if (error) {
      console.error('addCategory', error);
      toast.error('Erro ao criar categoria');
      return false;
    }
    await fetch();
    toast.success('Categoria criada');
    return true;
  };

  const updateCategory = async (oldName: string, newName: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('name', oldName);
    if (error) { console.error(error); toast.error('Erro ao atualizar'); return false; }
    await fetch();
    toast.success('Categoria atualizada');
    return true;
  };

  const deleteCategory = async (name: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('name', name);
    if (error) { console.error(error); toast.error('Erro ao excluir'); return false; }
    await fetch();
    toast.success('Categoria excluída');
    return true;
  };

  return { categories, loading, fetch, addCategory, updateCategory, deleteCategory };
};

export default useDbCategories;
