import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimeAllocation {
  id: string;
  project_id: string;
  allocation_percentage: number;
  updated_at: string;
}

// Calculate working days between two dates (Mon-Fri only)
const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

export const useProjectTimeAllocation = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: allocations, isLoading } = useQuery({
    queryKey: ["project-time-allocation", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("project_time_allocation")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data as TimeAllocation[];
    },
    enabled: !!userId,
  });

  const saveAllocationHistory = async (
    projectId: string, 
    oldPercentage: number, 
    periodStart: Date,
    periodEnd: Date
  ) => {
    if (!userId) return;

    const workingDays = calculateWorkingDays(periodStart, periodEnd);
    const hoursWorked = workingDays * 8 * (oldPercentage / 100);

    const { error } = await supabase
      .from("project_time_allocation_history")
      .insert({
        user_id: userId,
        project_id: projectId,
        allocation_percentage: oldPercentage,
        hours_worked: hoursWorked,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });

    if (error) {
      console.error("Error saving allocation history:", error);
    }
  };

  const updateAllocation = useMutation({
    mutationFn: async ({ projectId, percentage }: { projectId: string; percentage: number }) => {
      if (!userId) throw new Error("User not authenticated");

      const now = new Date();

      // Check if allocation exists
      const { data: existing } = await supabase
        .from("project_time_allocation")
        .select("id, allocation_percentage, updated_at")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .single();

      if (existing) {
        // Save history of the old allocation before updating
        const periodStart = new Date(existing.updated_at);
        await saveAllocationHistory(projectId, existing.allocation_percentage, periodStart, now);

        // Update existing
        const { error } = await supabase
          .from("project_time_allocation")
          .update({ allocation_percentage: percentage, updated_at: now.toISOString() })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new (no history to save for new allocations)
        const { error } = await supabase
          .from("project_time_allocation")
          .insert({
            user_id: userId,
            project_id: projectId,
            allocation_percentage: percentage,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-time-allocation", userId] });
    },
    onError: (error) => {
      console.error("Error updating allocation:", error);
      toast.error("Failed to update time allocation");
    },
  });

  return {
    allocations,
    isLoading,
    updateAllocation,
  };
};
