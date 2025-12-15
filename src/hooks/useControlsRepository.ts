import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RepositoryControl {
  id: string;
  name: string;
  control_type: string;
  category?: string | null;
  description?: string | null;
  cloud_provider?: string | null;
  reference_url?: string | null;
  implementation_guidance?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export const useControlsRepository = () => {
  const queryClient = useQueryClient();

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["controls_repository"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls_repository" as any)
        .select("*")
        .order("control_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return ((data || []) as unknown) as RepositoryControl[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (control: Omit<RepositoryControl, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("controls_repository" as any)
        .insert({ ...control, created_by: userData.user?.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controls_repository"] });
      toast.success("Control added to repository");
    },
    onError: (error) => {
      toast.error(`Failed to add control: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RepositoryControl> & { id: string }) => {
      const { data, error } = await supabase
        .from("controls_repository" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controls_repository"] });
      toast.success("Control updated");
    },
    onError: (error) => {
      toast.error(`Failed to update control: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("controls_repository" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controls_repository"] });
      toast.success("Control deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete control: ${error.message}`);
    },
  });

  return {
    controls,
    isLoading,
    createControl: createMutation.mutate,
    updateControl: updateMutation.mutate,
    deleteControl: deleteMutation.mutate,
  };
};
