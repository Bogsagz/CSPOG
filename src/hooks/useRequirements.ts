import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Requirement {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  type: string | null;
  priority: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export const useRequirements = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["requirements", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirements")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Requirement[];
    },
  });

  const createRequirement = useMutation({
    mutationFn: async (newRequirement: Omit<Requirement, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("requirements")
        .insert([newRequirement])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      toast({
        title: "Success",
        description: "Requirement created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async (requirement: Partial<Requirement> & { id: string }) => {
      const { data, error } = await supabase
        .from("requirements")
        .update(requirement)
        .eq("id", requirement.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      toast({
        title: "Success",
        description: "Requirement updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (requirementId: string) => {
      const { error } = await supabase
        .from("requirements")
        .delete()
        .eq("id", requirementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      toast({
        title: "Success",
        description: "Requirement deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    requirements: requirements || [],
    isLoading,
    createRequirement,
    updateRequirement,
    deleteRequirement,
  };
};
