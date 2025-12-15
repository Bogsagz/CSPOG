import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecurityControl {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  effectiveness_rating: string | null;
  layer: number | null;
  created_at: string;
  updated_at: string;
}

export function useSecurityControls(projectId: string | undefined) {
  const [controls, setControls] = useState<SecurityControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadControls();
    } else {
      setControls([]);
      setIsLoading(false);
    }
  }, [projectId]);

  const loadControls = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("security_controls")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setControls(data || []);
    } catch (error: any) {
      toast.error("Failed to load security controls");
      console.error("Error loading controls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addControl = async (control: Omit<SecurityControl, "id" | "created_at" | "updated_at">) => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("security_controls")
        .insert({
          project_id: projectId,
          ...control,
        })
        .select()
        .single();

      if (error) throw error;
      
      setControls((prev) => [data, ...prev]);
      toast.success("Security control added successfully");
      return data;
    } catch (error: any) {
      toast.error("Failed to add security control");
      console.error("Error adding control:", error);
      throw error;
    }
  };

  const updateControl = async (id: string, updates: Partial<Omit<SecurityControl, "id" | "created_at" | "updated_at" | "project_id">>) => {
    try {
      const { data, error } = await supabase
        .from("security_controls")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setControls((prev) =>
        prev.map((control) => (control.id === id ? data : control))
      );
      toast.success("Security control updated successfully");
      return data;
    } catch (error: any) {
      toast.error("Failed to update security control");
      console.error("Error updating control:", error);
      throw error;
    }
  };

  const deleteControl = async (id: string) => {
    try {
      const { error } = await supabase
        .from("security_controls")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setControls((prev) => prev.filter((control) => control.id !== id));
      toast.success("Security control deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete security control");
      console.error("Error deleting control:", error);
      throw error;
    }
  };

  return {
    controls,
    isLoading,
    addControl,
    updateControl,
    deleteControl,
    refresh: loadControls,
  };
}
