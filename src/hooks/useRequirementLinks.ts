import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RequirementLink {
  id: string;
  requirement_id: string;
  repository_requirement_id: string;
  created_at: string;
  repository_requirement?: {
    id: string;
    name: string;
    requirement_type: string;
    category: string | null;
    description: string | null;
    reference_url: string | null;
  };
}

export const useRequirementLinks = (requirementId: string | null) => {
  const queryClient = useQueryClient();

  const { data: linkedRequirements = [], isLoading } = useQuery({
    queryKey: ["requirement_links", requirementId],
    queryFn: async () => {
      if (!requirementId) return [];
      
      const { data, error } = await supabase
        .from("requirement_links")
        .select(`
          *,
          repository_requirement:requirements_repository(*)
        `)
        .eq("requirement_id", requirementId);

      if (error) throw error;
      return data as RequirementLink[];
    },
    enabled: !!requirementId,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ requirementId, repositoryRequirementId }: { requirementId: string; repositoryRequirementId: string }) => {
      const { data, error } = await supabase
        .from("requirement_links")
        .insert({ requirement_id: requirementId, repository_requirement_id: repositoryRequirementId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requirement_links", variables.requirementId] });
      toast.success("Requirement linked");
    },
    onError: (error) => {
      toast.error(`Failed to link requirement: ${error.message}`);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("requirement_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirement_links"] });
      toast.success("Requirement unlinked");
    },
    onError: (error) => {
      toast.error(`Failed to unlink requirement: ${error.message}`);
    },
  });

  return {
    linkedRequirements,
    isLoading,
    linkRequirement: linkMutation.mutate,
    unlinkRequirement: unlinkMutation.mutate,
  };
};
