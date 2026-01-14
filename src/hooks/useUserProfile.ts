import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'installer' | 'auxiliary';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchProfileAndRoles = async () => {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }

      setLoading(false);
    };

    fetchProfileAndRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isInstaller = (): boolean => hasRole('installer');
  const isAuxiliary = (): boolean => hasRole('auxiliary');

  return {
    profile,
    roles,
    loading,
    hasRole,
    isAdmin,
    isInstaller,
    isAuxiliary,
  };
};
