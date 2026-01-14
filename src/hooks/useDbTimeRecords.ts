import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type TimeRecordType = 'entry' | 'lunchOut' | 'lunchReturn' | 'exit';

export interface DbTimeRecord {
  id: string;
  user_id: string;
  record_type: TimeRecordType;
  recorded_at: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  is_validated: boolean;
  distance_from_main: number | null;
  created_at: string;
}

export interface TimeRecordInput {
  record_type: TimeRecordType;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  is_validated?: boolean;
  distance_from_main?: number;
}

export const useDbTimeRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<DbTimeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching time records:', error);
      toast.error('Erro ao carregar registros de ponto');
    } else {
      setRecords((data || []).map(d => ({
        ...d,
        record_type: d.record_type as TimeRecordType,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const addRecord = async (record: TimeRecordInput): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    const { data, error } = await supabase
      .from('time_records')
      .insert([{
        ...record,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding time record:', error);
      toast.error('Erro ao registrar ponto');
      return false;
    }

    setRecords(prev => [{
      ...data,
      record_type: data.record_type as TimeRecordType,
    }, ...prev]);
    return true;
  };

  const getTodayRecords = () => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => r.recorded_at.startsWith(today));
  };

  const getNextRecordType = (): TimeRecordType | null => {
    const todayRecords = getTodayRecords();
    const types: TimeRecordType[] = ['entry', 'lunchOut', 'lunchReturn', 'exit'];
    const recordedTypes = todayRecords.map(r => r.record_type);
    
    for (const type of types) {
      if (!recordedTypes.includes(type)) {
        return type;
      }
    }
    return null;
  };

  return {
    records,
    loading,
    addRecord,
    getTodayRecords,
    getNextRecordType,
    refetch: fetchRecords,
  };
};
