import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export const useDbClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (client: ClientInput): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao adicionar cliente');
      return null;
    }

    toast.success('Cliente adicionado com sucesso!');
    await fetchClients();
    return data;
  };

  const updateClient = async (id: string, updates: Partial<ClientInput>): Promise<boolean> => {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
      return false;
    }

    toast.success('Cliente atualizado com sucesso!');
    await fetchClients();
    return true;
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    }

    toast.success('Cliente excluído com sucesso!');
    await fetchClients();
    return true;
  };

  const getActiveClients = () => clients.filter(c => c.is_active);

  return {
    clients,
    loading,
    fetchClients,
    addClient,
    updateClient,
    deleteClient,
    getActiveClients,
  };
};
