import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ThreatStage = 'initial' | 'intermediate' | 'final';

export interface SavedThreat {
  id: string;
  project_id: string;
  threat_statement: string;
  stage: ThreatStage;
  parent_threat_id: string | null;
  created_at: string;
}

export const useSavedThreats = (projectId: string | null, stage?: ThreatStage) => {
  const [threats, setThreats] = useState<string[]>([]);
  const [threatIds, setThreatIds] = useState<string[]>([]);
  const [threatObjects, setThreatObjects] = useState<SavedThreat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadThreats();
    } else {
      setThreats([]);
      setThreatIds([]);
      setThreatObjects([]);
      setIsLoading(false);
    }
  }, [projectId, stage]);

  const loadThreats = async () => {
    if (!projectId) return;
    
    try {
      let query = supabase
        .from("saved_threats")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      
      if (stage) {
        query = query.eq("stage", stage);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const typedData = data.map(t => ({
          ...t,
          stage: t.stage as ThreatStage
        })) as SavedThreat[];
        
        setThreats(typedData.map(t => t.threat_statement));
        setThreatIds(typedData.map(t => t.id));
        setThreatObjects(typedData);
      }
    } catch (error) {
      console.error("Error loading threats:", error);
      toast.error("Failed to load saved threats");
    } finally {
      setIsLoading(false);
    }
  };

  const saveThreat = async (
    threatStatement: string, 
    threatStage: ThreatStage = 'initial',
    parentThreatId?: string
  ) => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    try {
      const insertData: any = { 
        project_id: projectId, 
        threat_statement: threatStatement, 
        stage: threatStage 
      };
      
      if (parentThreatId) {
        insertData.parent_threat_id = parentThreatId;
      }

      const { data, error } = await supabase
        .from("saved_threats")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const typedData = {
          ...data,
          stage: data.stage as ThreatStage
        } as SavedThreat;
        
        // Only add to local state if we're viewing the same stage or no stage filter
        if (!stage || stage === threatStage) {
          setThreats(prev => [...prev, typedData.threat_statement]);
          setThreatIds(prev => [...prev, typedData.id]);
          setThreatObjects(prev => [...prev, typedData]);
        }
        toast.success("Threat statement saved");
        return typedData;
      }
    } catch (error) {
      console.error("Error saving threat:", error);
      toast.error("Failed to save threat statement");
    }
  };

  const updateThreat = async (index: number, newStatement: string) => {
    const threatId = threatIds[index];
    
    try {
      const { error } = await supabase
        .from("saved_threats")
        .update({ threat_statement: newStatement })
        .eq("id", threatId);

      if (error) throw error;

      setThreats(prev => prev.map((t, i) => i === index ? newStatement : t));
      setThreatObjects(prev => prev.map((t, i) => 
        i === index ? { ...t, threat_statement: newStatement } : t
      ));
      toast.success("Threat statement updated");
    } catch (error) {
      console.error("Error updating threat:", error);
      toast.error("Failed to update threat statement");
    }
  };

  const deleteThreat = async (index: number) => {
    const threatId = threatIds[index];
    
    try {
      const { error } = await supabase
        .from("saved_threats")
        .delete()
        .eq("id", threatId);

      if (error) throw error;

      setThreats(prev => prev.filter((_, i) => i !== index));
      setThreatIds(prev => prev.filter((_, i) => i !== index));
      setThreatObjects(prev => prev.filter((_, i) => i !== index));
      toast.success("Threat statement deleted");
    } catch (error) {
      console.error("Error deleting threat:", error);
      toast.error("Failed to delete threat statement");
    }
  };

  // Get related threats (parent and children) for a given threat
  const getRelatedThreatIds = (threatId: string): string[] => {
    const threat = threatObjects.find(t => t.id === threatId);
    if (!threat) return [threatId];

    const relatedIds = new Set<string>([threatId]);

    // Find parent chain via parent_threat_id
    let current = threat;
    while (current.parent_threat_id) {
      relatedIds.add(current.parent_threat_id);
      const parent = threatObjects.find(t => t.id === current.parent_threat_id);
      if (parent) {
        current = parent;
      } else {
        break;
      }
    }

    // Find children recursively via parent_threat_id
    const findChildren = (parentId: string) => {
      const children = threatObjects.filter(t => t.parent_threat_id === parentId);
      children.forEach(child => {
        relatedIds.add(child.id);
        findChildren(child.id);
      });
    };
    findChildren(threatId);

    // If no parent links found, try content-based matching
    // This handles threats created before parent linking was implemented
    if (relatedIds.size === 1) {
      const threatStatement = threat.threat_statement.toLowerCase();
      
      // Extract key identifiers: actor phrase and asset
      // Actor pattern: "a/an [actor] with [vector]"
      const actorMatch = threatStatement.match(/^(a|an)\s+([^,]+?)\s+(could|with)/i);
      const actorPhrase = actorMatch ? actorMatch[2].trim() : null;
      
      // Find related threats by matching actor phrase
      if (actorPhrase) {
        threatObjects.forEach(t => {
          if (t.id !== threatId) {
            const otherStatement = t.threat_statement.toLowerCase();
            // Check if other threat has same actor phrase
            if (otherStatement.includes(actorPhrase)) {
              // Additional check: try to match asset too if possible
              // Assets are usually after "of" or "target the" or at end
              const assetPatterns = [
                /of\s+([a-z0-9\s]+?)\s+in order/i,
                /target(?:ing)?\s+(?:the\s+)?([a-z0-9\s]+?)\s+to/i,
                /impacting\s+\w+\s+of\s+([a-z0-9\s]+?)\s+in order/i
              ];
              
              let thisAsset: string | null = null;
              let otherAsset: string | null = null;
              
              for (const pattern of assetPatterns) {
                const thisMatch = threatStatement.match(pattern);
                const otherMatch = otherStatement.match(pattern);
                if (thisMatch) thisAsset = thisMatch[1].trim();
                if (otherMatch) otherAsset = otherMatch[1].trim();
              }
              
              // If we found assets, they should match
              // If we didn't find assets, just match on actor
              if ((thisAsset && otherAsset && thisAsset === otherAsset) || 
                  (!thisAsset || !otherAsset)) {
                relatedIds.add(t.id);
              }
            }
          }
        });
      }
    }

    return Array.from(relatedIds);
  };

  return { 
    threats, 
    threatIds, 
    threatObjects,
    isLoading, 
    saveThreat, 
    updateThreat, 
    deleteThreat,
    getRelatedThreatIds,
    reload: loadThreats
  };
};
