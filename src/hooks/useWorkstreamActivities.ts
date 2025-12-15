import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Map URL workstream to database enum value
const mapWorkstreamToDbValue = (workstream: string): string => {
  const mapping: Record<string, string> = {
    'migration': 'Mig',
    'ie': 'IE',
    'land': 'Land',
    'sea': 'Sea',
    'platforms': 'Plat',
    'mig': 'Mig',
    'plat': 'Plat'
  };
  return mapping[workstream.toLowerCase()] || workstream;
};

export interface WorkstreamActivity {
  id: string;
  deliverable_name: string;
  project_id: string;
  project_title: string;
  user_id: string;
  user_name: string;
  estimated_effort_remaining: number;
  due_date: string | null;
  role: string;
}

export interface ProjectActivities {
  project_id: string;
  project_title: string;
  activities: WorkstreamActivity[];
}

export interface WorkstreamActivitiesData {
  current: ProjectActivities[];
  completed: ProjectActivities[];
}

export function useWorkstreamActivities(workstream: string | undefined) {
  const [activities, setActivities] = useState<ProjectActivities[]>([]);
  const [completedActivities, setCompletedActivities] = useState<ProjectActivities[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (workstream) {
      loadActivities();
    }
  }, [workstream]);

  const loadActivities = async () => {
    if (!workstream) return;

    try {
      setIsLoading(true);

      const dbWorkstream = mapWorkstreamToDbValue(workstream);
      console.log("useWorkstreamActivities - Loading for workstream:", workstream, "mapped to:", dbWorkstream);

      // Calculate date range for last 5 weeks
      const today = new Date();
      const fiveWeeksAgo = new Date(today);
      fiveWeeksAgo.setDate(today.getDate() - (5 * 7));

      // Get all users in the workstream
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("workstream", dbWorkstream as any);

      if (usersError) throw usersError;

      console.log("useWorkstreamActivities - Found users:", users?.length);

      if (!users || users.length === 0) {
        console.log("useWorkstreamActivities - No users found for workstream");
        setActivities([]);
        setCompletedActivities([]);
        setIsLoading(false);
        return;
      }

      const userIds = users.map(u => u.id);
      console.log("useWorkstreamActivities - User IDs:", userIds.length);

      // Get projects for this workstream to filter deliverables
      const { data: workstreamProjects, error: wsProjectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("workstream", dbWorkstream as any);

      if (wsProjectsError) throw wsProjectsError;

      console.log("useWorkstreamActivities - Found projects:", workstreamProjects?.length);

      if (!workstreamProjects || workstreamProjects.length === 0) {
        console.log("useWorkstreamActivities - No projects found for workstream");
        setActivities([]);
        setCompletedActivities([]);
        setIsLoading(false);
        return;
      }

      const projectIds = workstreamProjects.map(p => p.id);
      console.log("useWorkstreamActivities - Project IDs:", projectIds.length);

      // Get all incomplete deliverables for these users in this workstream's projects
      const { data: deliverables, error: deliverablesError } = await supabase
        .from("user_deliverables")
        .select("*")
        .in("user_id", userIds)
        .in("project_id", projectIds)
        .eq("is_completed", false)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (deliverablesError) throw deliverablesError;

      console.log("useWorkstreamActivities - Found incomplete deliverables:", deliverables?.length);

      // Get completed deliverables from last 5 weeks in this workstream's projects
      const { data: completedDeliverables, error: completedError } = await supabase
        .from("user_deliverables")
        .select("*")
        .in("user_id", userIds)
        .in("project_id", projectIds)
        .eq("is_completed", true)
        .gte("updated_at", fiveWeeksAgo.toISOString())
        .order("updated_at", { ascending: false });

      if (completedError) throw completedError;

      console.log("useWorkstreamActivities - Found completed deliverables:", completedDeliverables?.length);

      // Get unique project IDs from both current and completed
      const allProjectIds = [...new Set([
        ...(deliverables?.map(d => d.project_id) || []),
        ...(completedDeliverables?.map(d => d.project_id) || [])
      ])];

      if (allProjectIds.length === 0) {
        setActivities([]);
        setCompletedActivities([]);
        setIsLoading(false);
        return;
      }

      // Fetch project details
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", allProjectIds);

      if (projectsError) throw projectsError;

      // Create maps
      const projectMap = new Map(projects?.map(p => [p.id, p.title]) || []);
      const userMap = new Map(
        users.map(u => [
          u.id,
          `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User'
        ])
      );

      // Process current activities - show current deliverable per user per project
      const processActivities = (items: any[]): ProjectActivities[] => {
        // Group by user and project to find current deliverable for each
        const userProjectMap = new Map<string, WorkstreamActivity[]>();

        items.forEach((item: any) => {
          const activity: WorkstreamActivity = {
            id: item.id,
            deliverable_name: item.deliverable_name,
            project_id: item.project_id,
            project_title: projectMap.get(item.project_id) || 'Unknown Project',
            user_id: item.user_id,
            user_name: userMap.get(item.user_id) || 'Unknown User',
            estimated_effort_remaining: item.estimated_effort_remaining,
            due_date: item.due_date,
            role: item.role
          };

          const key = `${item.user_id}_${item.project_id}`;
          if (!userProjectMap.has(key)) {
            userProjectMap.set(key, []);
          }
          userProjectMap.get(key)!.push(activity);
        });

        // Get the current (earliest due date) deliverable for each user-project combination
        const currentDeliverables: WorkstreamActivity[] = [];
        userProjectMap.forEach((activities) => {
          // Sort by due date (nulls last)
          const sorted = activities.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });
          // Take only the first one (current activity)
          currentDeliverables.push(sorted[0]);
        });

        // Group by project
        const projectActivitiesMap = new Map<string, WorkstreamActivity[]>();
        currentDeliverables.forEach(activity => {
          if (!projectActivitiesMap.has(activity.project_id)) {
            projectActivitiesMap.set(activity.project_id, []);
          }
          projectActivitiesMap.get(activity.project_id)!.push(activity);
        });

        return Array.from(projectActivitiesMap.entries())
          .map(([project_id, activities]) => {
            // Sort activities by user name
            activities.sort((a, b) => a.user_name.localeCompare(b.user_name));

            return {
              project_id,
              project_title: projectMap.get(project_id) || 'Unknown Project',
              activities
            };
          })
          .sort((a, b) => a.project_title.localeCompare(b.project_title));
      };

      // Process completed activities - show all completed items
      const processCompletedActivities = (items: any[]): ProjectActivities[] => {
        const projectActivitiesMap = new Map<string, WorkstreamActivity[]>();

        items.forEach((item: any) => {
          const activity: WorkstreamActivity = {
            id: item.id,
            deliverable_name: item.deliverable_name,
            project_id: item.project_id,
            project_title: projectMap.get(item.project_id) || 'Unknown Project',
            user_id: item.user_id,
            user_name: userMap.get(item.user_id) || 'Unknown User',
            estimated_effort_remaining: item.estimated_effort_remaining,
            due_date: item.due_date,
            role: item.role
          };

          if (!projectActivitiesMap.has(item.project_id)) {
            projectActivitiesMap.set(item.project_id, []);
          }
          projectActivitiesMap.get(item.project_id)!.push(activity);
        });

        return Array.from(projectActivitiesMap.entries())
          .map(([project_id, activities]) => ({
            project_id,
            project_title: projectMap.get(project_id) || 'Unknown Project',
            activities: activities.sort((a, b) => {
              if (!a.due_date && !b.due_date) return 0;
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(b.due_date).getTime() - new Date(a.due_date).getTime(); // Most recent first
            })
          }))
          .sort((a, b) => a.project_title.localeCompare(b.project_title));
      };

      const processedActivities = processActivities(deliverables || []);
      const processedCompleted = processCompletedActivities(completedDeliverables || []);
      
      console.log("useWorkstreamActivities - Processed activities:", processedActivities.length, "projects");
      console.log("useWorkstreamActivities - Processed completed:", processedCompleted.length, "projects");
      
      setActivities(processedActivities);
      setCompletedActivities(processedCompleted);
    } catch (error) {
      console.error("Error loading workstream activities:", error);
      toast.error("Failed to load workstream activities");
      setActivities([]);
      setCompletedActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activities,
    completedActivities,
    isLoading,
    refreshActivities: loadActivities
  };
}
