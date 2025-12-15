import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

interface PublicHoliday {
  date: string;
  name: string;
}

interface TimelineActivity {
  name: string;
  infoAssurerDays: number;
  securityArchitectDays: number;
  socAnalystDays: number;
  isMilestone?: boolean;
}

export const useAppSettings = () => {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      if (error) throw error;
      
      // Convert array to object for easier access
      const settingsMap: Record<string, any> = {};
      data?.forEach((setting: AppSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      
      return settingsMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    workingHoursPerWeek: settings?.working_hours_per_week || 40,
    ukPublicHolidays: (settings?.uk_public_holidays || []) as PublicHoliday[],
    timelineActivities: (settings?.timeline_activities || []) as TimelineActivity[],
    workstreams: (settings?.workstreams || ["Mig", "IE", "Land", "Sea", "Plat"]) as string[],
    riskCategories: (settings?.risk_categories || ["Human", "Financial", "Reputational", "Delivery", "Compliance"]) as string[],
    riskLevels: (settings?.risk_levels || ["Minor", "Moderate", "Major", "Significant", "Critical"]) as string[],
    fleetSizes: (settings?.fleet_sizes || ["X-Wing", "Enterprise", "Red Dwarf", "Star Destroyer", "Death Star"]) as string[],
    absenceTypes: (settings?.absence_types || ["leave", "sickness", "other", "working_elsewhere"]) as string[],
    sfiaGrades: (settings?.sfia_grades || [3, 4, 5, 6, 7]) as number[],
    sfiaCapacityMapping: (settings?.sfia_capacity_mapping || {3: 11, 4: 21, 5: 31, 6: 42, 7: 50}) as Record<number, number>,
    projectRoles: (settings?.project_roles || {
      delivery: "Delivery",
      security_architect: "Security Architect",
      risk_manager: "Risk Manager",
      sec_mon: "Sec Mon",
      sec_eng: "Sec Eng"
    }) as Record<string, string>,
    businessImpactMatrix: (settings?.business_impact_matrix || {}) as Record<string, Record<string, string>>,
    isLoading,
    error,
  };
};
