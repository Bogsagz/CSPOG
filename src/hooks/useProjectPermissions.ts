import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectRole } from "./useProjectMembers";

export interface ProjectPermissions {
  canDelete: boolean;
  canManageTeam: boolean;
  canWriteTables: boolean;
  canWriteThreats: boolean;
  canWriteRiskAppetite: boolean;
  canCreateProjects: boolean;
  role: ProjectRole | null;
}

export const useProjectPermissions = (projectId: string | null, userId: string | null) => {
  const [permissions, setPermissions] = useState<ProjectPermissions>({
    canDelete: false,
    canManageTeam: false,
    canWriteTables: false,
    canWriteThreats: false,
    canWriteRiskAppetite: false,
    canCreateProjects: false,
    role: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId && userId) {
      loadPermissions();
    } else {
      setPermissions({
        canDelete: false,
        canManageTeam: false,
        canWriteTables: false,
        canWriteThreats: false,
        canWriteRiskAppetite: false,
        canCreateProjects: false,
        role: null
      });
      setIsLoading(false);
    }
  }, [projectId, userId]);

  const loadPermissions = async () => {
    if (!projectId || !userId) return;

    try {
      const { data, error } = await supabase
        .from("project_members")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      const role = data?.role as ProjectRole;
      
      setPermissions({
        canDelete: ["delivery"].includes(role),
        canManageTeam: ["delivery"].includes(role),
        canWriteTables: ["security_architect", "risk_manager"].includes(role),
        canWriteThreats: ["security_architect", "risk_manager", "sec_mon", "sec_eng"].includes(role),
        canWriteRiskAppetite: ["risk_manager", "security_architect"].includes(role),
        canCreateProjects: ["delivery"].includes(role),
        role
      });
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { permissions, isLoading, refreshPermissions: loadPermissions };
};
