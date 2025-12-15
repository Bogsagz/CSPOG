import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCanCreateProjects = (userId: string | null) => {
  const [canCreate, setCanCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkPermission();
    } else {
      setCanCreate(false);
      // Keep loading true until we have a userId to check
    }
  }, [userId]);

  const checkPermission = async () => {
    if (!userId) return;

    try {
      // First check user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "security_admin");

      if (roleError) throw roleError;

      if ((roleData?.length ?? 0) > 0) {
        setCanCreate(true);
        setIsLoading(false);
        return;
      }

      // If not found in user_roles, check profiles.primary_role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("primary_role")
        .eq("id", userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const result = profileData?.primary_role === "admin";
      setCanCreate(result);
    } catch (error) {
      console.error("Error checking project creation permission:", error);
      setCanCreate(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { canCreate, isLoading, refreshPermission: checkPermission };
};
