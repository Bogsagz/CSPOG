import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Obligation {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  obligation_type?: string;
  compliance_framework?: string;
  status?: string;
  due_date?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
}

export const useObligations = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: obligations = [], isLoading } = useQuery({
    queryKey: ["obligations", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obligations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Obligation[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (obligation: Omit<Obligation, "id" | "created_at" | "updated_at"> & { document_id?: string }) => {
      const { document_id, ...obligationData } = obligation;
      const { data, error } = await supabase
        .from("obligations")
        .insert(obligationData)
        .select()
        .single();

      if (error) throw error;

      // If a document_id is provided, link it
      if (document_id && data) {
        await supabase
          .from("obligation_documents")
          .insert({
            obligation_id: data.id,
            document_id: document_id,
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations", projectId] });
      toast.success("Obligation created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create obligation: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Obligation> & { id: string }) => {
      const { data, error } = await supabase
        .from("obligations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations", projectId] });
      toast.success("Obligation updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update obligation: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("obligations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligations", projectId] });
      toast.success("Obligation deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete obligation: ${error.message}`);
    },
  });

  return {
    obligations,
    isLoading,
    createObligation: createMutation.mutate,
    updateObligation: updateMutation.mutate,
    deleteObligation: deleteMutation.mutate,
  };
};
