import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSecurityControlImplementations(controlId: string | null) {
  const [implementationIds, setImplementationIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (controlId) {
      loadImplementations();
    } else {
      setImplementationIds(new Set());
      setIsLoading(false);
    }
  }, [controlId]);

  const loadImplementations = async () => {
    if (!controlId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("security_control_implementations" as any)
        .select("control_repository_id")
        .eq("security_control_id", controlId);

      if (error) throw error;
      
      const ids = new Set(data?.map((sci: any) => sci.control_repository_id) || []);
      setImplementationIds(ids);
    } catch (error: any) {
      console.error("Error loading control implementations:", error);
      toast.error("Failed to load control implementations");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleImplementation = async (repositoryControlId: string) => {
    if (!controlId) return;

    const isCurrentlyLinked = implementationIds.has(repositoryControlId);

    try {
      if (isCurrentlyLinked) {
        const { error } = await supabase
          .from("security_control_implementations" as any)
          .delete()
          .eq("security_control_id", controlId)
          .eq("control_repository_id", repositoryControlId);

        if (error) throw error;

        setImplementationIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(repositoryControlId);
          return newSet;
        });
        toast.success("Implementation removed");
      } else {
        const { error } = await supabase
          .from("security_control_implementations" as any)
          .insert({
            security_control_id: controlId,
            control_repository_id: repositoryControlId
          } as any);

        if (error) throw error;

        setImplementationIds(prev => new Set([...prev, repositoryControlId]));
        toast.success("Implementation linked");
      }
    } catch (error: any) {
      console.error("Error toggling implementation:", error);
      toast.error("Failed to update implementation link");
    }
  };

  return {
    implementationIds,
    isLoading,
    toggleImplementation,
    isImplementationLinked: (repositoryControlId: string) => implementationIds.has(repositoryControlId)
  };
}
