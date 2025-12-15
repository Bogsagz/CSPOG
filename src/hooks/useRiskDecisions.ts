import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RDDOption {
  id: string;
  rdd_id: string;
  approach: "Accept" | "Avoid" | "Mitigate" | "Transfer";
  description: string | null;
  business_impacts: string | null;
  residual_likelihood: string | null;
  residual_impact: string | null;
  secondary_risk_statement: string | null;
  resource_impacts: string | null;
  additional_benefits: string | null;
  created_at: string;
}

export interface RiskDecisionDocument {
  id: string;
  project_id: string;
  risk_id: string;
  background: string | null;
  preferred_option_id: string | null;
  created_at: string;
  updated_at: string;
  options?: RDDOption[];
}

export const useRiskDecisions = (projectId: string | null) => {
  const [rdds, setRdds] = useState<RiskDecisionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadRDDs();
    } else {
      setRdds([]);
      setIsLoading(false);
    }
  }, [projectId]);

  const loadRDDs = async () => {
    if (!projectId) return;
    
    try {
      const { data: rddData, error: rddError } = await supabase
        .from("risk_decision_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (rddError) throw rddError;

      const rddIds = (rddData || []).map((r: any) => r.id);
      let optionsByRdd: Record<string, RDDOption[]> = {};

      if (rddIds.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from("rdd_options")
          .select("*")
          .in("rdd_id", rddIds)
          .order("created_at", { ascending: true });
        if (optionsError) throw optionsError;
        optionsByRdd = (optionsData || []).reduce((acc: Record<string, RDDOption[]>, opt: any) => {
          const arr = acc[opt.rdd_id] || [];
          arr.push(opt as RDDOption);
          acc[opt.rdd_id] = arr;
          return acc;
        }, {});
      }

      const merged = (rddData || []).map((r: any) => ({
        ...(r as RiskDecisionDocument),
        options: optionsByRdd[r.id] || [],
      }));

      setRdds(merged as RiskDecisionDocument[]);
    } catch (error) {
      console.error("Error loading RDDs:", error);
      toast.error("Failed to load risk decision documents");
    } finally {
      setIsLoading(false);
    }
  };

  const createRDD = async (riskId: string, background: string): Promise<string | null> => {
    if (!projectId) {
      toast.error("No project selected");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from("risk_decision_documents")
        .insert({
          project_id: projectId,
          risk_id: riskId,
          background,
        })
        .select()
        .single();

      if (error) throw error;

      await loadRDDs();
      toast.success("Risk decision document created");
      return data.id;
    } catch (error) {
      console.error("Error creating RDD:", error);
      toast.error("Failed to create risk decision document");
      return null;
    }
  };

  const updateRDD = async (rddId: string, updates: Partial<RiskDecisionDocument>) => {
    try {
      const { error } = await supabase
        .from("risk_decision_documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rddId);

      if (error) throw error;

      await loadRDDs();
      toast.success("Risk decision document updated");
    } catch (error) {
      console.error("Error updating RDD:", error);
      toast.error("Failed to update risk decision document");
    }
  };

  const deleteRDD = async (rddId: string) => {
    try {
      const { error } = await supabase
        .from("risk_decision_documents")
        .delete()
        .eq("id", rddId);

      if (error) throw error;

      await loadRDDs();
      toast.success("Risk decision document deleted");
    } catch (error) {
      console.error("Error deleting RDD:", error);
      toast.error("Failed to delete risk decision document");
    }
  };

  const createOption = async (
    rddId: string,
    option: Omit<RDDOption, "id" | "rdd_id" | "created_at">
  ) => {
    try {
      const { error } = await supabase
        .from("rdd_options")
        .insert({
          rdd_id: rddId,
          ...option,
        });

      if (error) throw error;

      await loadRDDs();
      toast.success("Option added");
    } catch (error) {
      console.error("Error creating option:", error);
      toast.error("Failed to create option");
    }
  };

  const updateOption = async (
    optionId: string,
    updates: Partial<Omit<RDDOption, "id" | "rdd_id" | "created_at">>
  ) => {
    try {
      const { error } = await supabase
        .from("rdd_options")
        .update(updates)
        .eq("id", optionId);

      if (error) throw error;

      await loadRDDs();
      toast.success("Option updated");
    } catch (error) {
      console.error("Error updating option:", error);
      toast.error("Failed to update option");
    }
  };

  const deleteOption = async (optionId: string) => {
    try {
      const { error } = await supabase
        .from("rdd_options")
        .delete()
        .eq("id", optionId);

      if (error) throw error;

      await loadRDDs();
      toast.success("Option deleted");
    } catch (error) {
      console.error("Error deleting option:", error);
      toast.error("Failed to delete option");
    }
  };

  const setPreferredOption = async (rddId: string, optionId: string) => {
    await updateRDD(rddId, { preferred_option_id: optionId });
  };

  return {
    rdds,
    isLoading,
    createRDD,
    updateRDD,
    deleteRDD,
    createOption,
    updateOption,
    deleteOption,
    setPreferredOption,
    refreshRDDs: loadRDDs,
  };
};
