import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRiskControls(riskId: string | null) {
  const [controlIds, setControlIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (riskId) {
      loadRiskControls();
    } else {
      setControlIds(new Set());
      setIsLoading(false);
    }
  }, [riskId]);

  const loadRiskControls = async () => {
    if (!riskId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("risk_controls")
        .select("control_id")
        .eq("risk_id", riskId);

      if (error) throw error;
      
      const ids = new Set(data?.map(rc => rc.control_id) || []);
      setControlIds(ids);
    } catch (error: any) {
      console.error("Error loading risk controls:", error);
      toast.error("Failed to load risk controls");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleControl = async (controlId: string) => {
    if (!riskId) return;

    const isCurrentlyLinked = controlIds.has(controlId);

    try {
      if (isCurrentlyLinked) {
        const { error } = await supabase
          .from("risk_controls")
          .delete()
          .eq("risk_id", riskId)
          .eq("control_id", controlId);

        if (error) throw error;

        setControlIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(controlId);
          return newSet;
        });
        toast.success("Control removed from risk");
      } else {
        const { error } = await supabase
          .from("risk_controls")
          .insert({
            risk_id: riskId,
            control_id: controlId
          });

        if (error) throw error;

        setControlIds(prev => new Set([...prev, controlId]));
        toast.success("Control linked to risk");
      }
    } catch (error: any) {
      console.error("Error toggling control:", error);
      toast.error("Failed to update control link");
    }
  };

  return {
    controlIds,
    isLoading,
    toggleControl,
    isControlLinked: (controlId: string) => controlIds.has(controlId)
  };
}
