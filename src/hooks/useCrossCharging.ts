import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppSettings } from "./useAppSettings";
import { eachDayOfInterval, isWeekend, isWithinInterval, format } from "date-fns";

interface CrossChargingResult {
  project_id: string;
  project_title: string;
  total_hours: number;
  total_cost: number;
  user_breakdown: {
    user_id: string;
    user_name: string;
    role: string;
    sfia_grade: number;
    hours: number;
    cost: number;
  }[];
}

interface CrossChargingFilters {
  startDate: Date;
  endDate: Date;
  groupType: "workstream" | "whole_team" | "primary_role" | "individual" | "project";
  groupValue?: string; // workstream name, role name, user id, or project id
}

export const useCrossCharging = (filters: CrossChargingFilters | null) => {
  const [results, setResults] = useState<CrossChargingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { workingHoursPerWeek } = useAppSettings();

  useEffect(() => {
    if (!filters) return;
    loadCrossChargingData();
  }, [filters, workingHoursPerWeek]);

  const loadCrossChargingData = async () => {
    if (!filters) return;
    
    setIsLoading(true);
    try {
      // Step 1: Get users based on group type
      let userIds: string[] = [];
      
      if (filters.groupType === "workstream") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("workstream", filters.groupValue as any)
          .eq("disabled", false);
        userIds = profiles?.map(p => p.id) || [];
      } else if (filters.groupType === "whole_team") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("disabled", false);
        userIds = profiles?.map(p => p.id) || [];
      } else if (filters.groupType === "primary_role") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("primary_role", filters.groupValue as any)
          .eq("disabled", false);
        userIds = profiles?.map(p => p.id) || [];
      } else if (filters.groupType === "individual") {
        userIds = [filters.groupValue!];
      } else if (filters.groupType === "project") {
        const { data: members } = await supabase
          .from("project_members")
          .select("user_id")
          .eq("project_id", filters.groupValue);
        userIds = members?.map(m => m.user_id) || [];
      }

      if (userIds.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Get current allocations and historical allocations
      const { data: currentAllocations } = await supabase
        .from("project_time_allocation")
        .select("user_id, project_id, allocation_percentage")
        .in("user_id", userIds);

      const { data: historicalAllocations } = await supabase
        .from("project_time_allocation_history")
        .select("user_id, project_id, allocation_percentage, created_at")
        .in("user_id", userIds)
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString())
        .order("created_at", { ascending: true });

      // Step 2a: Get project memberships for users without allocations (for balanced default)
      const { data: projectMemberships } = await supabase
        .from("project_members")
        .select("user_id, project_id")
        .in("user_id", userIds);

      // Step 3: Get absences for the period
      const { data: absences } = await supabase
        .from("team_leave")
        .select("user_id, start_date, end_date")
        .in("user_id", userIds)
        .or(`start_date.lte.${format(filters.endDate, "yyyy-MM-dd")},end_date.gte.${format(filters.startDate, "yyyy-MM-dd")}`);

      // Step 4: Get user and project details
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, primary_role, sfia_grade")
        .in("id", userIds);

      // Step 4a: Get day rates
      const { data: dayRatesData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "day_rates")
        .maybeSingle();

      const dayRates = dayRatesData?.setting_value as any || {};

      const projectIds = [...new Set([
        ...(currentAllocations?.map(a => a.project_id) || []),
        ...(historicalAllocations?.map(a => a.project_id) || []),
        ...(projectMemberships?.map(pm => pm.project_id) || [])
      ])];

      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);

      // Step 5: Calculate hours per project per user
      const hoursPerDay = workingHoursPerWeek / 5;
      const projectHours = new Map<string, Map<string, number>>();

      // Get all days in the period
      const allDays = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
      const workingDays = allDays.filter(day => !isWeekend(day));

      for (const userId of userIds) {
        const userAbsences = absences?.filter(a => a.user_id === userId) || [];
        
        for (const day of workingDays) {
          // Check if user is absent on this day
          const isAbsent = userAbsences.some(absence => 
            isWithinInterval(day, { 
              start: new Date(absence.start_date), 
              end: new Date(absence.end_date) 
            })
          );

          if (isAbsent) continue;

          // Find allocation for this day
          const historicalForDay = historicalAllocations
            ?.filter(h => h.user_id === userId && new Date(h.created_at) <= day)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // Get only allocations from the most recent timestamp
          let allocations;
          if (historicalForDay && historicalForDay.length > 0) {
            const mostRecentTimestamp = historicalForDay[0].created_at;
            allocations = historicalForDay.filter(h => h.created_at === mostRecentTimestamp);
          } else {
            allocations = currentAllocations?.filter(a => a.user_id === userId) || [];
          }

          // If no allocations exist, default to balanced (equal distribution across all projects)
          if (allocations.length === 0) {
            const userProjects = projectMemberships?.filter(pm => pm.user_id === userId) || [];
            if (userProjects.length > 0) {
              const balancedPercentage = 100 / userProjects.length;
              allocations = userProjects.map(pm => ({
                user_id: userId,
                project_id: pm.project_id,
                allocation_percentage: balancedPercentage
              }));
            }
          }

          for (const allocation of allocations) {
            const projectId = allocation.project_id;
            const percentage = allocation.allocation_percentage;
            const hours = (hoursPerDay * percentage) / 100;

            if (!projectHours.has(projectId)) {
              projectHours.set(projectId, new Map());
            }
            const projectUserHours = projectHours.get(projectId)!;
            projectUserHours.set(userId, (projectUserHours.get(userId) || 0) + hours);
          }
        }
      }

      // Step 6: Format results
      const formattedResults: CrossChargingResult[] = [];
      
      for (const [projectId, userHoursMap] of projectHours.entries()) {
        const project = projects?.find(p => p.id === projectId);
        if (!project) continue;

        const userBreakdown = Array.from(userHoursMap.entries()).map(([userId, hours]) => {
          const profile = profiles?.find(p => p.id === userId);
          
          // Calculate cost: (hours / hours_per_day) * day_rate
          let cost = 0;
          if (profile?.primary_role && profile?.sfia_grade) {
            const roleRates = dayRates[profile.primary_role] || {};
            const dayRate = roleRates[profile.sfia_grade.toString()] || 0;
            const days = hours / hoursPerDay;
            cost = days * dayRate;
            
            // Debug logging
            if (dayRate === 0) {
              console.warn(`No day rate found for ${profile.first_name} ${profile.last_name}: role=${profile.primary_role}, grade=${profile.sfia_grade}`);
            }
          } else {
            console.warn(`Missing profile data for user ${userId}: role=${profile?.primary_role}, grade=${profile?.sfia_grade}`);
          }
          
          return {
            user_id: userId,
            user_name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
            role: profile?.primary_role || "unknown",
            sfia_grade: profile?.sfia_grade || 0,
            hours: Math.round(hours * 100) / 100,
            cost: Math.round(cost * 100) / 100
          };
        });

        const totalHours = userBreakdown.reduce((sum, ub) => sum + ub.hours, 0);
        const totalCost = userBreakdown.reduce((sum, ub) => sum + ub.cost, 0);

        formattedResults.push({
          project_id: projectId,
          project_title: project.title,
          total_hours: Math.round(totalHours * 100) / 100,
          total_cost: Math.round(totalCost * 100) / 100,
          user_breakdown: userBreakdown.sort((a, b) => b.hours - a.hours)
        });
      }

      setResults(formattedResults.sort((a, b) => b.total_hours - a.total_hours));
    } catch (error) {
      console.error("Error loading cross charging data:", error);
      toast.error("Failed to load cross charging data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    isLoading
  };
};
