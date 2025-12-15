import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useThreatControls(threatId: string | null, relatedThreatIds?: string[]) {
  const [controlIds, setControlIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (threatId) {
      loadThreatControls();
    } else {
      setControlIds(new Set());
      setIsLoading(false);
    }
  }, [threatId, relatedThreatIds?.join(',')]);

  const loadThreatControls = async () => {
    if (!threatId) return;
    
    setIsLoading(true);
    try {
      // Load controls for the selected threat and all related threats
      const threatIdsToQuery = relatedThreatIds && relatedThreatIds.length > 0 
        ? relatedThreatIds 
        : [threatId];

      const { data, error } = await supabase
        .from("threat_controls")
        .select("control_id")
        .in("threat_id", threatIdsToQuery);

      if (error) throw error;
      
      const ids = new Set(data?.map(tc => tc.control_id) || []);
      setControlIds(ids);
    } catch (error: any) {
      console.error("Error loading threat controls:", error);
      toast.error("Failed to load threat controls");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleControl = async (controlId: string) => {
    if (!threatId) return;

    const isCurrentlyLinked = controlIds.has(controlId);

    // Get all threat IDs to update (propagate to related threats)
    const threatIdsToUpdate = relatedThreatIds && relatedThreatIds.length > 0 
      ? relatedThreatIds 
      : [threatId];

    try {
      if (isCurrentlyLinked) {
        // Remove the link from all related threats
        const { error } = await supabase
          .from("threat_controls")
          .delete()
          .in("threat_id", threatIdsToUpdate)
          .eq("control_id", controlId);

        if (error) throw error;

        setControlIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(controlId);
          return newSet;
        });
        toast.success("Control removed from threat family");
      } else {
        // Add the link to all related threats
        const insertData = threatIdsToUpdate.map(tid => ({
          threat_id: tid,
          control_id: controlId
        }));

        // Use upsert to handle duplicates gracefully
        const { error } = await supabase
          .from("threat_controls")
          .upsert(insertData, { 
            onConflict: 'threat_id,control_id',
            ignoreDuplicates: true 
          });

        if (error) throw error;

        setControlIds(prev => new Set([...prev, controlId]));
        toast.success("Control linked to threat family");
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
