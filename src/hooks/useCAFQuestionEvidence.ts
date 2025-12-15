import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CAFQuestionEvidence {
  id: string;
  project_id: string;
  question_id: string;
  outcome_id: string;
  evidence_item: string;
  created_at: string;
  updated_at: string;
}

export function useCAFQuestionEvidence(projectId: string) {
  const queryClient = useQueryClient();

  const { data: questionEvidence, isLoading } = useQuery({
    queryKey: ["caf-question-evidence", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caf_question_evidence")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as CAFQuestionEvidence[];
    },
    enabled: !!projectId,
  });

  const toggleQuestionEvidence = useMutation({
    mutationFn: async ({
      questionId,
      outcomeId,
      evidenceItem,
      selected,
    }: {
      questionId: string;
      outcomeId: string;
      evidenceItem: string;
      selected: boolean;
    }) => {
      if (selected) {
        // Add the evidence link
        const { error } = await supabase
          .from("caf_question_evidence")
          .upsert(
            {
              project_id: projectId,
              question_id: questionId,
              outcome_id: outcomeId,
              evidence_item: evidenceItem,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "project_id,question_id,evidence_item",
            }
          );

        if (error) throw error;
      } else {
        // Remove the evidence link
        const { error } = await supabase
          .from("caf_question_evidence")
          .delete()
          .eq("project_id", projectId)
          .eq("question_id", questionId)
          .eq("evidence_item", evidenceItem);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["caf-question-evidence", projectId],
      });
    },
    onError: (error) => {
      toast.error("Failed to update supporting evidence");
      console.error(error);
    },
  });

  const getQuestionEvidence = (questionId: string): string[] => {
    if (!questionEvidence) return [];
    return questionEvidence
      .filter((qe) => qe.question_id === questionId)
      .map((qe) => qe.evidence_item);
  };

  const isEvidenceLinked = (questionId: string, evidenceItem: string): boolean => {
    if (!questionEvidence) return false;
    return questionEvidence.some(
      (qe) => qe.question_id === questionId && qe.evidence_item === evidenceItem
    );
  };

  return {
    questionEvidence,
    isLoading,
    toggleQuestionEvidence,
    getQuestionEvidence,
    isEvidenceLinked,
  };
}
