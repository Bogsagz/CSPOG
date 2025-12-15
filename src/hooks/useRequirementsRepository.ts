import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RequirementRepository {
  id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  requirement_type: string;
  category: string | null;
  description: string | null;
  reference_url: string | null;
}

export const useRequirementsRepository = () => {
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ["requirements_repository"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirements_repository")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as RequirementRepository[];
    },
  });

  const createRequirement = useMutation({
    mutationFn: async (requirement: Omit<RequirementRepository, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("requirements_repository")
        .insert({ ...requirement, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements_repository"] });
      toast.success("Requirement added to repository");
    },
    onError: (error) => {
      toast.error(`Failed to add requirement: ${error.message}`);
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("requirements_repository")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements_repository"] });
      toast.success("Requirement deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete requirement: ${error.message}`);
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RequirementRepository> & { id: string }) => {
      const { data, error } = await supabase
        .from("requirements_repository")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements_repository"] });
      toast.success("Requirement updated");
    },
    onError: (error) => {
      toast.error(`Failed to update requirement: ${error.message}`);
    },
  });

  return {
    requirements,
    isLoading,
    createRequirement: createRequirement.mutate,
    updateRequirement: updateRequirement.mutate,
    deleteRequirement: deleteRequirement.mutate,
  };
};
