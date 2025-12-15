import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDayRates } from "./useDayRates";
import { differenceInDays } from "date-fns";

export interface ProjectDetail {
  name: string;
  startDate: string;
  endDate: string | null;
  totalDays: number;
  totalCost: number;
}

export interface UserDetail {
  name: string;
  joinDate: string;
  endDate: string | null;
  totalDays: number;
  totalCost: number;
  role: string;
  grade: number | null;
}

export interface HandoverDetail {
  projectName: string;
  role: string;
  fromUser: string;
  toUser: string;
  date: string;
}

export interface ProjectsPeopleResult {
  projectsStarted: {
    count: number;
    items: ProjectDetail[];
  };
  projectsCompleted: {
    count: number;
    items: ProjectDetail[];
  };
  usersCreated: {
    count: number;
    items: UserDetail[];
  };
  usersDisabled: {
    count: number;
    items: UserDetail[];
  };
  handovers: {
    count: number;
    items: HandoverDetail[];
  };
}

export interface ProjectsPeopleFilters {
  startDate: Date;
  endDate: Date;
  groupType: "workstream" | "whole_team" | "primary_role" | "individual" | "project";
  groupValue?: string;
}

export function useProjectsPeople(filters: ProjectsPeopleFilters | null) {
  const [results, setResults] = useState<ProjectsPeopleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dayRates } = useDayRates();

  useEffect(() => {
    if (filters && dayRates) {
      loadData();
    }
  }, [filters, dayRates]);

  const calculateUserCost = (
    role: string,
    grade: number | null,
    days: number
  ): number => {
    const roleKey = role?.toLowerCase().replace(/\s+/g, "_") || "delivery";
    const gradeNum = grade || 1;
    const dayRate = dayRates?.[roleKey]?.[gradeNum] || dayRates?.delivery?.[gradeNum] || 500;
    return dayRate * days;
  };

  const loadData = async () => {
    if (!filters || !dayRates) return;

    setIsLoading(true);
    try {
      // Get user IDs based on grouping
      let userIds: string[] = [];

      if (filters.groupType === "whole_team") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("disabled", false);
        userIds = profiles?.map(p => p.id) || [];
      } else if (filters.groupType === "workstream") {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("workstream", filters.groupValue as any)
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
        userIds = [filters.groupValue || ""];
      } else if (filters.groupType === "project") {
        const { data: members } = await supabase
          .from("project_members")
          .select("user_id")
          .eq("project_id", filters.groupValue);
        userIds = members?.map(m => m.user_id) || [];
      }

      if (userIds.length === 0) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      const startISO = filters.startDate.toISOString();
      const endISO = filters.endDate.toISOString();

      // Fetch projects started in range
      let projectsStartedQuery = supabase
        .from("projects")
        .select("id, title, project_start, created_at, anticipated_go_live, workstream")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: true });

      if (filters.groupType === "workstream") {
        projectsStartedQuery = projectsStartedQuery.eq("workstream", filters.groupValue as any);
      } else if (filters.groupType === "project") {
        projectsStartedQuery = projectsStartedQuery.eq("id", filters.groupValue);
      }

      const { data: projectsStartedData, error: psError } = await projectsStartedQuery;

      if (psError) throw psError;

      // Fetch projects completed in range (using anticipated_go_live as completion date)
      let projectsCompletedQuery = supabase
        .from("projects")
        .select("id, title, project_start, anticipated_go_live, created_at, workstream")
        .not("anticipated_go_live", "is", null)
        .gte("anticipated_go_live", startISO)
        .lte("anticipated_go_live", endISO)
        .order("anticipated_go_live", { ascending: true });

      if (filters.groupType === "workstream") {
        projectsCompletedQuery = projectsCompletedQuery.eq("workstream", filters.groupValue as any);
      } else if (filters.groupType === "project") {
        projectsCompletedQuery = projectsCompletedQuery.eq("id", filters.groupValue);
      }

      const { data: projectsCompletedData, error: pcError } = await projectsCompletedQuery;

      if (pcError) throw pcError;

      // Fetch users created in range
      const { data: usersCreatedData, error: ucError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, created_at, primary_role, sfia_grade")
        .in("id", userIds)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: true });

      if (ucError) throw ucError;

      // Fetch users disabled (we'll look at profiles with disabled=true)
      const { data: usersDisabledData, error: udError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, created_at, primary_role, sfia_grade, disabled")
        .in("id", userIds)
        .eq("disabled", true);

      if (udError) throw udError;

      // Calculate project costs based on allocations
      const calculateProjectCost = async (projectId: string, startDate: string, endDate: string | null) => {
        const { data: allocations } = await supabase
          .from("project_time_allocation_history")
          .select("user_id, allocation_percentage, created_at")
          .eq("project_id", projectId);

        if (!allocations || allocations.length === 0) return 0;

        let totalCost = 0;
        const projectEnd = endDate ? new Date(endDate) : new Date();
        const projectStart = new Date(startDate);
        const daysInRange = Math.max(1, differenceInDays(projectEnd, projectStart));

        // Get user profiles for allocations
        for (const allocation of allocations) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("primary_role, sfia_grade")
            .eq("id", allocation.user_id)
            .single();

          if (profile) {
            const role = profile.primary_role?.toLowerCase().replace(/\s+/g, "_") || "delivery";
            const grade = profile.sfia_grade || 1;
            const dayRate = dayRates[role]?.[grade] || dayRates.delivery?.[grade] || 500;
            const allocatedDays = (daysInRange * allocation.allocation_percentage) / 100;
            totalCost += dayRate * allocatedDays;
          }
        }

        return totalCost;
      };

      // Process projects started
      const projectsStarted: ProjectDetail[] = await Promise.all(
        (projectsStartedData || []).map(async (p) => {
          const startDate = p.project_start || p.created_at;
          const endDate = p.anticipated_go_live || null;
          const days = endDate
            ? differenceInDays(new Date(endDate), new Date(startDate))
            : differenceInDays(filters.endDate, new Date(startDate));
          const cost = await calculateProjectCost(p.id, startDate, endDate);

          return {
            name: p.title,
            startDate: new Date(p.created_at).toLocaleDateString(),
            endDate: endDate ? new Date(endDate).toLocaleDateString() : null,
            totalDays: Math.max(0, days),
            totalCost: cost,
          };
        })
      );

      // Process projects completed
      const projectsCompleted: ProjectDetail[] = await Promise.all(
        (projectsCompletedData || []).map(async (p) => {
          const startDate = p.project_start || p.created_at;
          const endDate = p.anticipated_go_live!;
          const days = differenceInDays(new Date(endDate), new Date(startDate));
          const cost = await calculateProjectCost(p.id, startDate, endDate);

          return {
            name: p.title,
            startDate: new Date(startDate).toLocaleDateString(),
            endDate: new Date(endDate).toLocaleDateString(),
            totalDays: Math.max(0, days),
            totalCost: cost,
          };
        })
      );

      // Process users created
      const usersCreated: UserDetail[] = (usersCreatedData || []).map((u) => {
        const joinDate = new Date(u.created_at);
        const days = differenceInDays(filters.endDate, joinDate);
        const cost = calculateUserCost(u.primary_role || "delivery", u.sfia_grade, days);

        return {
          name: `${u.first_name} ${u.last_name}`,
          joinDate: joinDate.toLocaleDateString(),
          endDate: null,
          totalDays: Math.max(0, days),
          totalCost: cost,
          role: u.primary_role || "N/A",
          grade: u.sfia_grade,
        };
      });

      // Process users disabled
      const usersDisabled: UserDetail[] = (usersDisabledData || []).map((u) => {
        const joinDate = new Date(u.created_at);
        const endDate = new Date(); // Assume disabled now for simplicity
        const days = differenceInDays(endDate, joinDate);
        const cost = calculateUserCost(u.primary_role || "delivery", u.sfia_grade, days);

        return {
          name: `${u.first_name} ${u.last_name}`,
          joinDate: joinDate.toLocaleDateString(),
          endDate: endDate.toLocaleDateString(),
          totalDays: Math.max(0, days),
          totalCost: cost,
          role: u.primary_role || "N/A",
          grade: u.sfia_grade,
        };
      });

      // For handovers, we look at project_members table
      // A handover is when multiple users have the same role on a project
      const { data: projectMembers, error: pmError } = await supabase
        .from("project_members")
        .select(`
          id,
          project_id,
          user_id,
          role,
          created_at,
          projects!inner(title),
          profiles!inner(first_name, last_name)
        `)
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .order("created_at", { ascending: true });

      if (pmError) throw pmError;

      // Detect handovers by finding multiple users with same role on same project
      const handoversMap = new Map<string, any[]>();
      (projectMembers || []).forEach((pm: any) => {
        const key = `${pm.project_id}_${pm.role}`;
        if (!handoversMap.has(key)) {
          handoversMap.set(key, []);
        }
        handoversMap.get(key)!.push(pm);
      });

      const handovers: HandoverDetail[] = [];
      handoversMap.forEach((members, key) => {
        if (members.length > 1) {
          // Sort by created_at
          members.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          // Create handover entries between consecutive members
          for (let i = 1; i < members.length; i++) {
            handovers.push({
              projectName: members[i].projects.title,
              role: members[i].role,
              fromUser: `${members[i - 1].profiles.first_name} ${members[i - 1].profiles.last_name}`,
              toUser: `${members[i].profiles.first_name} ${members[i].profiles.last_name}`,
              date: new Date(members[i].created_at).toLocaleDateString(),
            });
          }
        }
      });

      setResults({
        projectsStarted: {
          count: projectsStarted.length,
          items: projectsStarted,
        },
        projectsCompleted: {
          count: projectsCompleted.length,
          items: projectsCompleted,
        },
        usersCreated: {
          count: usersCreated.length,
          items: usersCreated,
        },
        usersDisabled: {
          count: usersDisabled.length,
          items: usersDisabled,
        },
        handovers: {
          count: handovers.length,
          items: handovers,
        },
      });
    } catch (error) {
      console.error("Error loading projects/people data:", error);
      toast.error("Failed to load projects/people data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    isLoading,
  };
}
