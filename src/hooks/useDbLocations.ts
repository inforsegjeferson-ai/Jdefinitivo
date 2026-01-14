import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LocationType = 'main' | 'branch' | 'warehouse';

export interface DbLocation {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  latitude: number;
  longitude: number;
  tolerance_radius: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  name: string;
  type: LocationType;
  address: string;
  latitude: number;
  longitude: number;
  tolerance_radius?: number;
  is_active?: boolean;
}

export const useDbLocations = () => {
  const [locations, setLocations] = useState<DbLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      toast.error('Erro ao carregar locais');
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const getMainLocation = (): DbLocation | null => {
    return locations.find(loc => loc.type === 'main' && loc.is_active) || null;
  };

  const addLocation = async (location: LocationInput): Promise<boolean> => {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single();

    if (error) {
      console.error('Error adding location:', error);
      toast.error('Erro ao adicionar local');
      return false;
    }

    setLocations(prev => [data, ...prev]);
    toast.success('Local adicionado com sucesso!');
    return true;
  };

  const updateLocation = async (id: string, updates: Partial<LocationInput>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      toast.error('Erro ao atualizar local');
      return false;
    }

    setLocations(prev => prev.map(loc => loc.id === id ? data : loc));
    toast.success('Local atualizado com sucesso!');
    return true;
  };

  const deleteLocation = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
      toast.error('Erro ao excluir local');
      return false;
    }

    setLocations(prev => prev.filter(loc => loc.id !== id));
    toast.success('Local excluído com sucesso!');
    return true;
  };

  const calculateDistance = (
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const validateGPSAgainstMain = (
    userLat: number, 
    userLng: number
  ): { isValid: boolean; distance: number; mainLocation: DbLocation | null } => {
    const mainLocation = getMainLocation();
    
    if (!mainLocation) {
      return { isValid: false, distance: 0, mainLocation: null };
    }

    const distance = calculateDistance(
      userLat,
      userLng,
      mainLocation.latitude,
      mainLocation.longitude
    );

    return {
      isValid: distance <= mainLocation.tolerance_radius,
      distance: Math.round(distance),
      mainLocation,
    };
  };

  return {
    locations,
    loading,
    getMainLocation,
    addLocation,
    updateLocation,
    deleteLocation,
    validateGPSAgainstMain,
    calculateDistance,
    refetch: fetchLocations,
  };
};
