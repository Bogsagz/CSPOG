import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AssessmentDocumentation {
  id: string;
  project_id: string;
  bia_completed: boolean | null;
  bia_link: string | null;
  gov_assure_profile: string | null;
  dpia_created: boolean | null;
  dpia_link: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectAssessmentDocumentation(projectId: string) {
  const queryClient = useQueryClient();

  const { data: assessmentDoc, isLoading } = useQuery({
    queryKey: ["project-assessment-documentation", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_assessment_documentation")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data as AssessmentDocumentation | null;
    },
    enabled: !!projectId,
  });

  const updateAssessmentDoc = useMutation({
    mutationFn: async (updates: Partial<Omit<AssessmentDocumentation, "id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("project_assessment_documentation")
        .upsert({ project_id: projectId, ...updates }, { onConflict: "project_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-assessment-documentation", projectId] });
      toast.success("Assessment documentation updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update assessment documentation");
      console.error(error);
    },
  });

  return {
    assessmentDoc,
    isLoading,
    updateAssessmentDoc,
  };
}
