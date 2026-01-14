import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'installer' | 'auxiliary';

export interface DbProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithRole extends DbProfile {
  roles: AppRole[];
}

export const useDbTeam = () => {
  const [members, setMembers] = useState<TeamMemberWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast.error('Erro ao carregar equipe');
      setLoading(false);
      return;
    }

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Combine profiles with roles
    const membersWithRoles: TeamMemberWithRole[] = (profiles || []).map(profile => ({
      ...profile,
      roles: (roles || [])
        .filter(r => r.user_id === profile.id)
        .map(r => r.role as AppRole),
    }));

    setMembers(membersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const updateProfile = async (id: string, updates: Partial<DbProfile>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
      return false;
    }

    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    toast.success('Perfil atualizado com sucesso!');
    return true;
  };

  const addRole = async (userId: string, role: AppRole): Promise<boolean> => {
    const { error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role }]);

    if (error) {
      console.error('Error adding role:', error);
      if (error.code === '23505') {
        toast.error('Usuário já possui esta função');
      } else {
        toast.error('Erro ao adicionar função');
      }
      return false;
    }

    setMembers(prev => prev.map(m => 
      m.id === userId ? { ...m, roles: [...m.roles, role] } : m
    ));
    toast.success('Função adicionada com sucesso!');
    return true;
  };

  const removeRole = async (userId: string, role: AppRole): Promise<boolean> => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error removing role:', error);
      toast.error('Erro ao remover função');
      return false;
    }

    setMembers(prev => prev.map(m => 
      m.id === userId ? { ...m, roles: m.roles.filter(r => r !== role) } : m
    ));
    toast.success('Função removida com sucesso!');
    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    // First, delete all roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
      toast.error('Erro ao excluir funções do usuário');
      return false;
    }

    // Then delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      toast.error('Erro ao excluir perfil do usuário');
      return false;
    }

    setMembers(prev => prev.filter(m => m.id !== userId));
    toast.success('Usuário excluído permanentemente!');
    return true;
  };

  const getInstallers = () => {
    return members.filter(m => m.roles.includes('installer'));
  };

  const getAuxiliaries = () => {
    return members.filter(m => m.roles.includes('auxiliary'));
  };

  const getAdmins = () => {
    return members.filter(m => m.roles.includes('admin'));
  };

  return {
    members,
    loading,
    updateProfile,
    addRole,
    removeRole,
    deleteUser,
    getInstallers,
    getAuxiliaries,
    getAdmins,
    refetch: fetchTeam,
  };
};
