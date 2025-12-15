import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecurityScope {
  id: string;
  project_id: string;
  uses_third_party_providers: boolean | null;
  uses_intellectual_property: boolean | null;
  requires_data_sharing: boolean | null;
  third_party_providers_details: string | null;
  intellectual_property_details: string | null;
  data_sharing_details: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectSecurityScope(projectId: string) {
  const queryClient = useQueryClient();

  const { data: securityScope, isLoading } = useQuery({
    queryKey: ["project-security-scope", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_security_scope")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as SecurityScope | null;
    },
    enabled: !!projectId,
  });

  const updateSecurityScope = useMutation({
    mutationFn: async (updates: Partial<Omit<SecurityScope, "id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("project_security_scope")
        .upsert({ project_id: projectId, ...updates }, { onConflict: "project_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-security-scope", projectId] });
      toast.success("Security scope updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update security scope");
      console.error(error);
    },
  });

  return {
    securityScope,
    isLoading,
    updateSecurityScope,
  };
}
