import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedRisk {
  id: string;
  project_id: string;
  risk_statement: string;
  risk_rating?: string;
  impact_type?: string;
  threat_id?: string;
  base_likelihood?: string;
  base_impact?: string;
  modified_likelihood?: string;
  modified_impact?: string;
  likelihood_justification?: string;
  impact_justification?: string;
  remediation_plan?: string;
  created_at: string;
}

export const useSavedRisks = (projectId: string | null) => {
  const [risks, setRisks] = useState<SavedRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadRisks();
    } else {
      setRisks([]);
      setIsLoading(false);
    }
  }, [projectId]);

  const loadRisks = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from("saved_risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setRisks(data);
      }
    } catch (error) {
      console.error("Error loading risks:", error);
      toast.error("Failed to load saved risks");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRisk = async (
    riskStatement: string, 
    riskRating: string, 
    impactType: string, 
    threatId?: string,
    baseLikelihood?: string,
    baseImpact?: string
  ) => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_risks")
        .insert({ 
          project_id: projectId, 
          risk_statement: riskStatement,
          risk_rating: riskRating,
          impact_type: impactType,
          threat_id: threatId || null,
          base_likelihood: baseLikelihood,
          base_impact: baseImpact
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRisks(prev => [...prev, data]);
        toast.success("Base risk saved");
      }
    } catch (error) {
      console.error("Error saving risk:", error);
      toast.error("Failed to save risk statement");
    }
  };

  const updateRisk = async (
    index: number, 
    riskStatement: string, 
    riskRating: string, 
    impactType: string, 
    threatId?: string,
    baseLikelihood?: string,
    baseImpact?: string
  ) => {
    const riskId = risks[index].id;
    
    try {
      const { error } = await supabase
        .from("saved_risks")
        .update({ 
          risk_statement: riskStatement,
          risk_rating: riskRating,
          impact_type: impactType,
          threat_id: threatId || null,
          base_likelihood: baseLikelihood,
          base_impact: baseImpact
        })
        .eq("id", riskId);

      if (error) throw error;

      setRisks(prev => prev.map((r, i) => 
        i === index ? { 
          ...r, 
          risk_statement: riskStatement, 
          risk_rating: riskRating, 
          impact_type: impactType, 
          threat_id: threatId || null,
          base_likelihood: baseLikelihood,
          base_impact: baseImpact
        } : r
      ));
      toast.success("Base risk updated");
    } catch (error) {
      console.error("Error updating risk:", error);
      toast.error("Failed to update risk statement");
    }
  };

  const updateModifiedRisk = async (
    riskId: string, 
    modifiedLikelihood: string, 
    modifiedImpact: string,
    likelihoodJustification?: string,
    impactJustification?: string
  ) => {
    try {
      const { error } = await supabase
        .from("saved_risks")
        .update({ 
          modified_likelihood: modifiedLikelihood,
          modified_impact: modifiedImpact,
          likelihood_justification: likelihoodJustification,
          impact_justification: impactJustification
        })
        .eq("id", riskId);

      if (error) throw error;

      setRisks(prev => prev.map(r => 
        r.id === riskId ? { 
          ...r, 
          modified_likelihood: modifiedLikelihood,
          modified_impact: modifiedImpact,
          likelihood_justification: likelihoodJustification,
          impact_justification: impactJustification
        } : r
      ));
      toast.success("Modified risk updated");
    } catch (error) {
      console.error("Error updating modified risk:", error);
      toast.error("Failed to update modified risk");
    }
  };

  const deleteRisk = async (index: number) => {
    const riskId = risks[index].id;
    
    try {
      const { error } = await supabase
        .from("saved_risks")
        .delete()
        .eq("id", riskId);

      if (error) throw error;

      setRisks(prev => prev.filter((_, i) => i !== index));
      toast.success("Risk statement deleted");
    } catch (error) {
      console.error("Error deleting risk:", error);
      toast.error("Failed to delete risk statement");
    }
  };

  const updateRemediation = async (riskId: string, remediationPlan: string) => {
    try {
      const { error } = await supabase
        .from("saved_risks")
        .update({ remediation_plan: remediationPlan })
        .eq("id", riskId);

      if (error) throw error;

      setRisks(prev => prev.map(r => 
        r.id === riskId ? { ...r, remediation_plan: remediationPlan } : r
      ));
      toast.success("Remediation plan updated successfully");
    } catch (error) {
      console.error("Error updating remediation:", error);
      toast.error("Failed to update remediation plan");
    }
  };

  return { risks, isLoading, saveRisk, updateRisk, updateModifiedRisk, deleteRisk, updateRemediation };
};
