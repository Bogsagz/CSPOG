import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRiskIssues(riskId: string | null) {
  const [issueIds, setIssueIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (riskId) {
      loadRiskIssues();
    } else {
      setIssueIds(new Set());
      setIsLoading(false);
    }
  }, [riskId]);

  const loadRiskIssues = async () => {
    if (!riskId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("risk_issues")
        .select("issue_id")
        .eq("risk_id", riskId);

      if (error) throw error;
      
      const ids = new Set(data?.map(ri => ri.issue_id) || []);
      setIssueIds(ids);
    } catch (error: any) {
      console.error("Error loading risk issues:", error);
      toast.error("Failed to load risk issues");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIssue = async (issueId: string) => {
    if (!riskId) return;

    const isCurrentlyLinked = issueIds.has(issueId);

    try {
      if (isCurrentlyLinked) {
        const { error } = await supabase
          .from("risk_issues")
          .delete()
          .eq("risk_id", riskId)
          .eq("issue_id", issueId);

        if (error) throw error;

        setIssueIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(issueId);
          return newSet;
        });
        toast.success("Issue removed from risk");
      } else {
        const { error } = await supabase
          .from("risk_issues")
          .insert({
            risk_id: riskId,
            issue_id: issueId
          });

        if (error) throw error;

        setIssueIds(prev => new Set([...prev, issueId]));
        toast.success("Issue linked to risk");
      }
    } catch (error: any) {
      console.error("Error toggling issue:", error);
      toast.error("Failed to update issue link");
    }
  };

  return {
    issueIds,
    isLoading,
    toggleIssue,
    isIssueLinked: (issueId: string) => issueIds.has(issueId)
  };
}
