import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DayRatesConfig {
  delivery: Record<string, number>;
  security_architect: Record<string, number>;
  sec_mon: Record<string, number>;
  sec_eng: Record<string, number>;
  sa_mentor: Record<string, number>;
}

export const useDayRates = () => {
  const queryClient = useQueryClient();

  const { data: dayRates, isLoading } = useQuery({
    queryKey: ["day-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "day_rates")
        .single();

      if (error) throw error;
      return data.setting_value as unknown as DayRatesConfig;
    }
  });

  const updateDayRates = useMutation({
    mutationFn: async (newRates: DayRatesConfig) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ setting_value: newRates as any })
        .eq("setting_key", "day_rates");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["day-rates"] });
      toast.success("Day rates updated successfully");
    },
    onError: (error) => {
      console.error("Error updating day rates:", error);
      toast.error("Failed to update day rates");
    }
  });

  return {
    dayRates,
    isLoading,
    updateDayRates
  };
};
