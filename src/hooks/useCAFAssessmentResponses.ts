import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCAFAssessmentResponses = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useQuery({
    queryKey: ["caf-assessment-responses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caf_assessment_responses")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const getResponse = (questionId: string): boolean | null => {
    const response = responses?.find((r) => r.question_id === questionId);
    return response?.response ?? null;
  };

  const toggleResponse = useMutation({
    mutationFn: async ({
      outcomeId,
      questionId,
      response,
    }: {
      outcomeId: string;
      questionId: string;
      response: boolean | null;
    }) => {
      if (response === null) {
        // Delete the response
        const { error } = await supabase
          .from("caf_assessment_responses")
          .delete()
          .eq("project_id", projectId)
          .eq("question_id", questionId);

        if (error) throw error;
      } else {
        // Upsert the response
        const { error } = await supabase
          .from("caf_assessment_responses")
          .upsert(
            {
              project_id: projectId,
              outcome_id: outcomeId,
              question_id: questionId,
              response,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "project_id,question_id",
            }
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["caf-assessment-responses", projectId],
      });
    },
    onError: (error) => {
      toast.error("Failed to save response");
      console.error(error);
    },
  });

  return {
    responses,
    isLoading,
    getResponse,
    toggleResponse,
  };
};
