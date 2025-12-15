import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ObligationDocument {
  id: string;
  obligation_id: string;
  document_id: string;
  created_at: string;
  document?: {
    id: string;
    name: string;
    document_type: string;
    category?: string;
    description?: string;
    url?: string;
  };
}

export const useObligationDocuments = (obligationId: string | null) => {
  const queryClient = useQueryClient();

  const { data: linkedDocuments = [], isLoading } = useQuery({
    queryKey: ["obligation_documents", obligationId],
    queryFn: async () => {
      if (!obligationId) return [];
      
      const { data, error } = await supabase
        .from("obligation_documents")
        .select(`
          *,
          document:document_repository(*)
        `)
        .eq("obligation_id", obligationId);

      if (error) throw error;
      return data as ObligationDocument[];
    },
    enabled: !!obligationId,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ obligationId, documentId }: { obligationId: string; documentId: string }) => {
      const { data, error } = await supabase
        .from("obligation_documents")
        .insert({ obligation_id: obligationId, document_id: documentId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["obligation_documents", variables.obligationId] });
      toast.success("Document linked to obligation");
    },
    onError: (error) => {
      toast.error(`Failed to link document: ${error.message}`);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("obligation_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obligation_documents"] });
      toast.success("Document unlinked");
    },
    onError: (error) => {
      toast.error(`Failed to unlink document: ${error.message}`);
    },
  });

  return {
    linkedDocuments,
    isLoading,
    linkDocument: linkMutation.mutate,
    unlinkDocument: unlinkMutation.mutate,
  };
};
