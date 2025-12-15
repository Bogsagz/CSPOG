import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RepositoryDocument {
  id: string;
  name: string;
  document_type: string;
  category?: string;
  description?: string;
  url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useDocumentRepository = () => {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["document_repository"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_repository")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as RepositoryDocument[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (document: Omit<RepositoryDocument, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("document_repository")
        .insert({ ...document, created_by: userData.user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_repository"] });
      toast.success("Document added to repository");
    },
    onError: (error) => {
      toast.error(`Failed to add document: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RepositoryDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from("document_repository")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_repository"] });
      toast.success("Document updated");
    },
    onError: (error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_repository")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_repository"] });
      toast.success("Document deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  return {
    documents,
    isLoading,
    createDocument: createMutation.mutate,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,
  };
};
