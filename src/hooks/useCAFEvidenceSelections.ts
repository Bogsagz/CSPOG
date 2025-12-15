import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CAFEvidenceSelection {
  id: string;
  project_id: string;
  outcome_id: string;
  evidence_item: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

export function useCAFEvidenceSelections(projectId: string) {
  const queryClient = useQueryClient();

  const { data: selections, isLoading } = useQuery({
    queryKey: ["caf-evidence-selections", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caf_evidence_selections")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as CAFEvidenceSelection[];
    },
    enabled: !!projectId,
  });

  const toggleSelection = useMutation({
    mutationFn: async ({
      outcomeId,
      evidenceItem,
      selected,
    }: {
      outcomeId: string;
      evidenceItem: string;
      selected: boolean;
    }) => {
      const { data, error } = await supabase
        .from("caf_evidence_selections")
        .upsert(
          {
            project_id: projectId,
            outcome_id: outcomeId,
            evidence_item: evidenceItem,
            selected,
          },
          {
            onConflict: "project_id,outcome_id,evidence_item",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caf-evidence-selections", projectId] });
    },
    onError: (error) => {
      toast.error("Failed to update evidence selection");
      console.error(error);
    },
  });

  const isEvidenceSelected = (outcomeId: string, evidenceItem: string): boolean => {
    const selection = selections?.find(
      (s) => s.outcome_id === outcomeId && s.evidence_item === evidenceItem
    );
    return selection?.selected ?? false;
  };

  return {
    selections: selections || [],
    isLoading,
    toggleSelection,
    isEvidenceSelected,
  };
}
