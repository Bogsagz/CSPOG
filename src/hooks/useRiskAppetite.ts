import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RiskCategory = "Human" | "Financial" | "Reputational" | "Delivery" | "Compliance";
export type RiskLevel = "Minor" | "Moderate" | "Major" | "Significant" | "Critical";

export interface RiskAppetite {
  id: string;
  project_id: string;
  category: RiskCategory;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export const useRiskAppetite = (projectId: string | null) => {
  const [riskAppetites, setRiskAppetites] = useState<Record<RiskCategory, RiskLevel | null>>({
    "Human": null,
    "Financial": null,
    "Reputational": null,
    "Delivery": null,
    "Compliance": null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadRiskAppetites();
    } else {
      setRiskAppetites({
        "Human": null,
        "Financial": null,
        "Reputational": null,
        "Delivery": null,
        "Compliance": null
      });
      setIsLoading(false);
    }
  }, [projectId]);

  const loadRiskAppetites = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from("risk_appetite")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      const appetites: Record<RiskCategory, RiskLevel | null> = {
        "Human": null,
        "Financial": null,
        "Reputational": null,
        "Delivery": null,
        "Compliance": null
      };

      if (data) {
        data.forEach((item) => {
          appetites[item.category as RiskCategory] = item.risk_level as RiskLevel;
        });
      }

      setRiskAppetites(appetites);
    } catch (error) {
      console.error("Error loading risk appetites:", error);
      toast.error("Failed to load risk appetites");
    } finally {
      setIsLoading(false);
    }
  };

  const setRiskLevel = async (category: RiskCategory, riskLevel: RiskLevel) => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("risk_appetite")
        .upsert(
          { 
            project_id: projectId, 
            category, 
            risk_level: riskLevel,
            updated_at: new Date().toISOString()
          },
          { onConflict: "project_id,category" }
        );

      if (error) throw error;

      setRiskAppetites(prev => ({
        ...prev,
        [category]: riskLevel
      }));
      toast.success(`${category} risk level set to ${riskLevel}`);
    } catch (error) {
      console.error("Error setting risk level:", error);
      toast.error("Failed to set risk level");
    }
  };

  const clearAll = async () => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("risk_appetite")
        .delete()
        .eq("project_id", projectId);

      if (error) throw error;

      setRiskAppetites({
        "Human": null,
        "Financial": null,
        "Reputational": null,
        "Delivery": null,
        "Compliance": null
      });
      toast.success("All risk levels cleared");
    } catch (error) {
      console.error("Error clearing risk appetites:", error);
      toast.error("Failed to clear risk appetites");
    }
  };

  const isComplete = () => {
    return Object.values(riskAppetites).every(level => level !== null);
  };

  return { riskAppetites, isLoading, setRiskLevel, clearAll, isComplete: isComplete() };
};
