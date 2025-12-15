import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProjectTimeAllocation } from "./useProjectTimeAllocation";

interface ActiveTask {
  id: string;
  deliverable_name: string;
  project_id: string;
  estimated_effort_remaining: number;
  started_working_at: string | null;
  role: string;
}

interface CalculatedHours {
  displayHours: number;
  hoursWorkedSinceStart: number;
}

// Calculate working hours between two dates (9am-5pm, Mon-Fri)
const calculateWorkingHoursElapsed = (startTime: Date, endTime: Date): number => {
  let hoursWorked = 0;
  const current = new Date(startTime);
  
  while (current < endTime) {
    const dayOfWeek = current.getDay();
    const hour = current.getHours();
    
    // Only count Mon-Fri (1-5), 9am-5pm
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 17) {
      // Calculate how much of this hour to count
      const nextHour = new Date(current);
      nextHour.setHours(hour + 1, 0, 0, 0);
      
      if (nextHour > endTime) {
        // Partial hour at the end
        hoursWorked += (endTime.getTime() - current.getTime()) / (1000 * 60 * 60);
      } else if (current.getMinutes() > 0 || current.getSeconds() > 0) {
        // Partial hour at the start
        hoursWorked += (nextHour.getTime() - current.getTime()) / (1000 * 60 * 60);
      } else {
        hoursWorked += 1;
      }
    }
    
    // Move to next hour
    current.setHours(current.getHours() + 1, 0, 0, 0);
  }
  
  return hoursWorked;
};

export function useActiveTask(userId: string | undefined) {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [calculatedHours, setCalculatedHours] = useState<CalculatedHours | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { allocations } = useProjectTimeAllocation(userId);

  const loadActiveTask = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_deliverables")
        .select("id, deliverable_name, project_id, estimated_effort_remaining, started_working_at, role")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setActiveTask(data || null);
    } catch (error) {
      console.error("Error loading active task:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadActiveTask();
  }, [loadActiveTask]);

  // Real-time countdown calculation
  useEffect(() => {
    if (!activeTask || !activeTask.started_working_at || !allocations) {
      setCalculatedHours(null);
      return;
    }

    const calculateCountdown = () => {
      const allocation = allocations.find(a => a.project_id === activeTask.project_id);
      const allocationPercentage = allocation?.allocation_percentage || 0;
      
      if (allocationPercentage === 0) {
        setCalculatedHours({
          displayHours: activeTask.estimated_effort_remaining,
          hoursWorkedSinceStart: 0
        });
        return;
      }

      const startTime = new Date(activeTask.started_working_at!);
      const now = new Date();
      
      // Calculate raw working hours elapsed
      const rawHoursElapsed = calculateWorkingHoursElapsed(startTime, now);
      
      // Apply allocation percentage (e.g., 50% allocation = half the countdown speed)
      const effectiveHoursWorked = rawHoursElapsed * (allocationPercentage / 100);
      
      // Calculate display hours
      const displayHours = Math.max(0, activeTask.estimated_effort_remaining - effectiveHoursWorked);
      
      setCalculatedHours({
        displayHours: Math.round(displayHours * 100) / 100,
        hoursWorkedSinceStart: Math.round(effectiveHoursWorked * 100) / 100
      });
    };

    // Calculate immediately
    calculateCountdown();
    
    // Update every minute
    const interval = setInterval(calculateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, [activeTask, allocations]);

  const startWorking = async (deliverableId: string) => {
    if (!userId) return;

    try {
      // First, deactivate any currently active task
      await supabase
        .from("user_deliverables")
        .update({ is_active: false, started_working_at: null })
        .eq("user_id", userId)
        .eq("is_active", true);

      // Activate the new task
      const { error } = await supabase
        .from("user_deliverables")
        .update({ 
          is_active: true, 
          started_working_at: new Date().toISOString() 
        })
        .eq("id", deliverableId);

      if (error) throw error;
      
      await loadActiveTask();
      toast.success("Started working on task");
    } catch (error) {
      console.error("Error starting work:", error);
      toast.error("Failed to start working on task");
    }
  };

  const stopWorking = async () => {
    if (!userId || !activeTask || !calculatedHours) return;

    try {
      // Update the effort remaining with the new calculated value
      const { error } = await supabase
        .from("user_deliverables")
        .update({ 
          is_active: false, 
          started_working_at: null,
          estimated_effort_remaining: calculatedHours.displayHours
        })
        .eq("id", activeTask.id);

      if (error) throw error;
      
      setActiveTask(null);
      setCalculatedHours(null);
      toast.success(`Stopped working. ${calculatedHours.hoursWorkedSinceStart}h logged.`);
    } catch (error) {
      console.error("Error stopping work:", error);
      toast.error("Failed to stop working");
    }
  };

  return {
    activeTask,
    calculatedHours,
    isLoading,
    startWorking,
    stopWorking,
    refreshActiveTask: loadActiveTask
  };
}
