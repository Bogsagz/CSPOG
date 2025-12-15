import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfWeek, endOfWeek, addWeeks, startOfDay, endOfDay } from "date-fns";

export interface MyTaskDeliverable {
  id: string;
  deliverable_name: string;
  project_id: string;
  project_title: string;
  role: string;
  estimated_effort_remaining: number;
  due_date: string | null;
  is_completed: boolean;
}

export interface WeekDeliverables {
  currentlyWorkingOn: MyTaskDeliverable[];
  thisWeek: MyTaskDeliverable[];
  nextWeek: MyTaskDeliverable[];
  thisWeekRange: { start: Date; end: Date };
  nextWeekRange: { start: Date; end: Date };
}

export function useMyTasks(userId: string | undefined) {
  const [deliverables, setDeliverables] = useState<WeekDeliverables>({
    currentlyWorkingOn: [],
    thisWeek: [],
    nextWeek: [],
    thisWeekRange: { start: new Date(), end: new Date() },
    nextWeekRange: { start: new Date(), end: new Date() }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadDeliverables();
    }
  }, [userId]);

  const loadDeliverables = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Calculate date ranges (Monday to Friday)
      const today = new Date();
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const thisWeekEnd = endOfDay(addWeeks(thisWeekStart, 0).setDate(thisWeekStart.getDate() + 4)); // Friday
      
      const nextWeekStart = addWeeks(thisWeekStart, 1);
      const nextWeekEnd = endOfDay(addWeeks(nextWeekStart, 0).setDate(nextWeekStart.getDate() + 4)); // Friday

      // Fetch user deliverables
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from("user_deliverables")
        .select("*")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (deliverablesError) throw deliverablesError;

      // Get unique project IDs
      const projectIds = [...new Set(deliverablesData?.map(d => d.project_id) || [])];

      // Fetch project details
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);

      if (projectsError) throw projectsError;

      // Create a map of project IDs to titles
      const projectMap = new Map(projectsData?.map(p => [p.id, p.title]) || []);

      // Filter deliverables by week and get next deliverable per project
      const thisWeek: MyTaskDeliverable[] = [];
      const nextWeek: MyTaskDeliverable[] = [];
      const projectDeliverablesMap = new Map<string, MyTaskDeliverable[]>();

      // Group deliverables by project
      deliverablesData?.forEach((item: any) => {
        const deliverable: MyTaskDeliverable = {
          id: item.id,
          deliverable_name: item.deliverable_name,
          project_id: item.project_id,
          project_title: projectMap.get(item.project_id) || 'Unknown Project',
          role: item.role,
          estimated_effort_remaining: item.estimated_effort_remaining,
          due_date: item.due_date,
          is_completed: item.is_completed
        };

        if (!projectDeliverablesMap.has(item.project_id)) {
          projectDeliverablesMap.set(item.project_id, []);
        }
        projectDeliverablesMap.get(item.project_id)!.push(deliverable);

        // Filter by date for week sections if there is a due date
        if (item.due_date) {
          const dueDate = new Date(item.due_date);
          
          if (dueDate >= thisWeekStart && dueDate <= thisWeekEnd) {
            thisWeek.push(deliverable);
          } else if (dueDate >= nextWeekStart && dueDate <= nextWeekEnd) {
            nextWeek.push(deliverable);
          }
        }
      });

      // Get the next deliverable per project (earliest due date, or first if no dates)
      const currentlyWorkingOn: MyTaskDeliverable[] = [];
      projectDeliverablesMap.forEach((deliverables) => {
        // Sort by due date (nulls last), then take the first one
        const sorted = deliverables.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        currentlyWorkingOn.push(sorted[0]);
      });

      setDeliverables({
        currentlyWorkingOn,
        thisWeek,
        nextWeek,
        thisWeekRange: { start: thisWeekStart, end: thisWeekEnd },
        nextWeekRange: { start: nextWeekStart, end: nextWeekEnd }
      });
    } catch (error) {
      console.error("Error loading deliverables:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deliverables,
    isLoading,
    refreshDeliverables: loadDeliverables
  };
}
