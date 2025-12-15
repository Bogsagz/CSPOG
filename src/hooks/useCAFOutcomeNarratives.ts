import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CAFOutcomeNarrative {
  id: string;
  project_id: string;
  outcome_id: string;
  narrative: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentDataItem {
  questionText: string;
  response: boolean | null;
  isNegativeIndicator: boolean;
  evidence: string[];
}

export function useCAFOutcomeNarratives(projectId: string) {
  const queryClient = useQueryClient();

  const { data: narratives, isLoading } = useQuery({
    queryKey: ["caf-outcome-narratives", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caf_outcome_narratives")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as CAFOutcomeNarrative[];
    },
    enabled: !!projectId,
  });

  const generateNarrative = useMutation({
    mutationFn: async ({
      outcomeId,
      outcomeName,
      outcomeDescription,
      assessmentData,
    }: {
      outcomeId: string;
      outcomeName: string;
      outcomeDescription: string;
      assessmentData: AssessmentDataItem[];
    }) => {
      toast.info("Generating narrative with AI...");

      const { data, error } = await supabase.functions.invoke("generate-caf-narrative", {
        body: {
          projectId,
          outcomeId,
          outcomeName,
          outcomeDescription,
          assessmentData,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to generate narrative");
      }

      if (!data?.narrative) {
        throw new Error("No narrative returned from AI");
      }

      return { narrative: data.narrative };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["caf-outcome-narratives", projectId],
      });
      toast.success("Narrative generated successfully");
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Unknown error";
      if (errorMsg.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
      } else if (errorMsg.includes("credits")) {
        toast.error("AI credits exhausted. Please add credits in Settings.");
      } else {
        toast.error("Failed to generate narrative: " + errorMsg);
      }
      console.error(error);
    },
  });

  const getNarrative = (outcomeId: string): string | null => {
    const narrative = narratives?.find((n) => n.outcome_id === outcomeId);
    return narrative?.narrative || null;
  };

  return {
    narratives,
    isLoading,
    generateNarrative,
    getNarrative,
  };
}
