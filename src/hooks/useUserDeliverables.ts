import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserDeliverable {
  id: string;
  user_id: string;
  project_id: string;
  deliverable_name: string;
  role: string;
  estimated_effort_remaining: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserDeliverables(projectId: string | null, userId: string | null) {
  const [deliverables, setDeliverables] = useState<UserDeliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId && userId) {
      loadDeliverables();
    }
  }, [projectId, userId]);

  const loadDeliverables = async () => {
    if (!projectId || !userId) return;

    try {
      const { data, error } = await supabase
        .from("user_deliverables")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setDeliverables(data || []);
    } catch (error) {
      console.error("Error loading deliverables:", error);
      toast.error("Failed to load deliverables");
    } finally {
      setIsLoading(false);
    }
  };

  const updateEffortRemaining = async (deliverableId: string, effortRemaining: number) => {
    try {
      const { error } = await supabase
        .from("user_deliverables")
        .update({ estimated_effort_remaining: effortRemaining })
        .eq("id", deliverableId);

      if (error) throw error;
      await loadDeliverables();
      toast.success("Effort updated");
    } catch (error) {
      console.error("Error updating effort:", error);
      toast.error("Failed to update effort");
    }
  };

  const toggleComplete = async (deliverableId: string, isCompleted: boolean, deliverableName: string, projectId: string) => {
    try {
      // Update user_deliverables
      const { error: userError } = await supabase
        .from("user_deliverables")
        .update({ is_completed: isCompleted })
        .eq("id", deliverableId);

      if (userError) throw userError;

      // Update project_deliverable_assignments
      const { error: projectError } = await supabase
        .from("project_deliverable_assignments")
        .update({ is_completed: isCompleted })
        .eq("project_id", projectId)
        .eq("deliverable_name", deliverableName);

      if (projectError) throw projectError;

      await loadDeliverables();
      toast.success(isCompleted ? "Deliverable marked as complete" : "Deliverable marked as incomplete");
    } catch (error) {
      console.error("Error updating completion status:", error);
      toast.error("Failed to update completion status");
    }
  };

  const createOrUpdateDeliverable = async (
    deliverableName: string,
    role: string,
    effortRemaining: number
  ) => {
    if (!projectId || !userId) return;

    try {
      const { error } = await supabase
        .from("user_deliverables")
        .upsert({
          user_id: userId,
          project_id: projectId,
          deliverable_name: deliverableName,
          role,
          estimated_effort_remaining: effortRemaining,
          is_completed: false
        }, {
          onConflict: 'user_id,project_id,deliverable_name'
        });

      if (error) throw error;
      await loadDeliverables();
    } catch (error) {
      console.error("Error creating/updating deliverable:", error);
      toast.error("Failed to save deliverable");
    }
  };

  return {
    deliverables,
    isLoading,
    updateEffortRemaining,
    toggleComplete,
    createOrUpdateDeliverable,
    refreshDeliverables: loadDeliverables
  };
}
