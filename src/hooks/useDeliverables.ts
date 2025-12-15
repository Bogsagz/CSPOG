import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDayRates } from "./useDayRates";

export interface DeliverableCompletion {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  sfiaGrade: number | null;
  completedDate: string;
  effortHours: number;
  cost: number;
}

export interface DeliverableResult {
  deliverableName: string;
  completions: DeliverableCompletion[];
  totalHours: number;
  totalCost: number;
}

export interface DeliverablesFilters {
  startDate: Date;
  endDate: Date;
  groupType: "workstream" | "whole_team" | "primary_role" | "individual" | "project";
  groupValue?: string;
}

export function useDeliverables(filters: DeliverablesFilters | null) {
  const [results, setResults] = useState<DeliverableResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dayRates } = useDayRates();

  useEffect(() => {
    if (filters) {
      loadDeliverablesData();
    }
  }, [filters, dayRates]);

  const loadDeliverablesData = async () => {
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
        setResults([]);
        setIsLoading(false);
        return;
      }

      const { data: deliverables, error } = await supabase
        .from("user_deliverables")
        .select(`
          *,
          profiles!user_deliverables_user_id_fkey(first_name, last_name, sfia_grade, primary_role, workstream),
          projects!user_deliverables_project_id_fkey(title, workstream)
        `)
        .eq("is_completed", true)
        .in("user_id", userIds)
        .gte("updated_at", filters.startDate.toISOString())
        .lte("updated_at", filters.endDate.toISOString());

      if (error) throw error;

      // Group by deliverable name
      const grouped = new Map<string, DeliverableCompletion[]>();

      deliverables?.forEach((d: any) => {
        const profile = d.profiles;
        const project = d.projects;
        
        // Calculate cost based on role and grade
        const role = d.role?.toLowerCase().replace(/\s+/g, "_") || "delivery";
        const grade = profile?.sfia_grade || 1;
        const dayRate = dayRates[role]?.[grade] || dayRates.delivery?.[grade] || 500;
        const hourlyRate = dayRate / 8;
        const cost = d.estimated_effort_remaining * hourlyRate;

        const completion: DeliverableCompletion = {
          projectId: d.project_id,
          projectTitle: project?.title || "Unknown Project",
          userId: d.user_id,
          userName: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown User",
          sfiaGrade: profile?.sfia_grade,
          completedDate: new Date(d.updated_at).toLocaleDateString(),
          effortHours: d.estimated_effort_remaining,
          cost,
        };

        if (!grouped.has(d.deliverable_name)) {
          grouped.set(d.deliverable_name, []);
        }
        grouped.get(d.deliverable_name)!.push(completion);
      });

      // Convert to result format
      const resultArray: DeliverableResult[] = Array.from(grouped.entries()).map(
        ([deliverableName, completions]) => ({
          deliverableName,
          completions,
          totalHours: completions.reduce((sum, c) => sum + c.effortHours, 0),
          totalCost: completions.reduce((sum, c) => sum + c.cost, 0),
        })
      );

      // Sort by deliverable name
      resultArray.sort((a, b) => a.deliverableName.localeCompare(b.deliverableName));

      setResults(resultArray);
    } catch (error) {
      console.error("Error loading deliverables:", error);
      toast.error("Failed to load deliverables data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    isLoading,
  };
}
