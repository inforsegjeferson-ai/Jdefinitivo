import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VehicleStatus = 'available' | 'inUse' | 'maintenance';

export interface DbVehicle {
  id: string;
  plate: string;
  model: string;
  year: number | null;
  status: VehicleStatus;
  fuel_level: number;
  last_maintenance: string | null;
  next_maintenance: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleInput {
  plate: string;
  model: string;
  year?: number;
  status?: VehicleStatus;
  fuel_level?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  assigned_to?: string;
}

export const useDbVehicles = () => {
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Erro ao carregar veículos');
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const addVehicle = async (vehicle: VehicleInput): Promise<boolean> => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single();

    if (error) {
      console.error('Error adding vehicle:', error);
      if (error.code === '23505') {
        toast.error('Já existe um veículo com esta placa');
      } else {
        toast.error('Erro ao adicionar veículo');
      }
      return false;
    }

    setVehicles(prev => [data, ...prev]);
    toast.success('Veículo adicionado com sucesso!');
    return true;
  };

  const updateVehicle = async (id: string, updates: Partial<VehicleInput>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Erro ao atualizar veículo');
      return false;
    }

    setVehicles(prev => prev.map(v => v.id === id ? data : v));
    toast.success('Veículo atualizado com sucesso!');
    return true;
  };

  const deleteVehicle = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Erro ao excluir veículo');
      return false;
    }

    setVehicles(prev => prev.filter(v => v.id !== id));
    toast.success('Veículo excluído com sucesso!');
    return true;
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(v => v.status === 'available');
  };

  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getAvailableVehicles,
    refetch: fetchVehicles,
  };
};
