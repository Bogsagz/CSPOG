import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectDeliverableAssignment {
  id: string;
  project_id: string;
  deliverable_name: string;
  owner_role: string;
  effort_hours: number;
  due_date: string | null;
  required: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjectDeliverables(projectId: string | null) {
  const [assignments, setAssignments] = useState<ProjectDeliverableAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadAssignments();
    }
  }, [projectId]);

  const loadAssignments = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from("project_deliverable_assignments")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading deliverable assignments:", error);
      toast.error("Failed to load deliverable assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssignments = async (
    deliverableOwners: Record<string, string>,
    timeline: Array<{ name: string; effortHours?: { riskManager: number; securityArchitect: number; soc: number }; date: Date; isMilestone: boolean }>,
    requiredDeliverables: Record<string, boolean> = {}
  ) => {
    if (!projectId) return;

    console.log("Starting saveAssignments with:", { projectId, deliverableOwners, timelineLength: timeline.length });

    try {
      // Delete existing assignments first
      console.log("Deleting existing assignments for project:", projectId);
      const { error: deleteError } = await supabase
        .from("project_deliverable_assignments")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

      // Create new assignments from selected owners
      const newAssignments = Object.entries(deliverableOwners)
        .filter(([_, owner]) => owner) // Only include deliverables with owners
        .map(([deliverableName, ownerRole]) => {
          const timelineEvent = timeline.find(t => t.name === deliverableName && !t.isMilestone);
          let effortHours = 0;

          if (timelineEvent?.effortHours) {
            switch (ownerRole) {
              case 'risk_manager':
                effortHours = timelineEvent.effortHours.riskManager;
                break;
              case 'security_architect':
                effortHours = timelineEvent.effortHours.securityArchitect;
                break;
              case 'soc':
                effortHours = timelineEvent.effortHours.soc;
                break;
            }
          }

          return {
            project_id: projectId,
            deliverable_name: deliverableName,
            owner_role: ownerRole,
            effort_hours: effortHours,
            due_date: timelineEvent ? timelineEvent.date.toISOString().split('T')[0] : null,
            required: requiredDeliverables[deliverableName] !== false // Default to true if not specified
          };
        });

      console.log("Prepared assignments to insert:", newAssignments);

      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("project_deliverable_assignments")
          .insert(newAssignments);

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
        console.log("Assignments inserted successfully");
      } else {
        console.log("No assignments to insert");
      }

      await loadAssignments();
      toast.success("Deliverable assignments saved");
    } catch (error) {
      console.error("Error saving deliverable assignments:", error);
      toast.error("Failed to save deliverable assignments");
      throw error;
    }
  };

  const updateEffortHours = async (assignmentId: string, newEffortHours: number) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from("project_deliverable_assignments")
        .update({ effort_hours: newEffortHours })
        .eq("id", assignmentId);

      if (error) throw error;
      await loadAssignments();
      toast.success("Effort hours updated");
    } catch (error) {
      console.error("Error updating effort hours:", error);
      toast.error("Failed to update effort hours");
    }
  };

  const updateRequired = async (assignmentId: string, required: boolean) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from("project_deliverable_assignments")
        .update({ required })
        .eq("id", assignmentId);

      if (error) throw error;
      await loadAssignments();
      toast.success(required ? "Deliverable marked as required" : "Deliverable marked as optional");
    } catch (error) {
      console.error("Error updating required status:", error);
      toast.error("Failed to update required status");
    }
  };

  return {
    assignments,
    isLoading,
    saveAssignments,
    updateEffortHours,
    updateRequired,
    refreshAssignments: loadAssignments
  };
}
