import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'security_admin' | 'security_delivery' | 'security_mentor' | 'security_user';

export const useUserRoles = (userId: string | undefined) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } else {
        setRoles(data.map(r => r.role as AppRole));
      }
      setLoading(false);
    };

    fetchRoles();

    // Subscribe to role changes
    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('security_admin');
  const isDelivery = hasRole('security_delivery');
  const isMentor = hasRole('security_mentor');

  return { roles, loading, hasRole, isAdmin, isDelivery, isMentor };
};
