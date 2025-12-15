import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Issue {
  id: string;
  project_id: string;
  name: string;
  type: "vulnerability" | "weakness" | "other";
  description?: string;
  date_first_occurred?: string;
  resolution_plan?: string;
  date_resolved?: string;
  linked_asset_id?: string;
  cve_score?: string;
  epss_score?: string;
  patch_available?: boolean;
  created_at: string;
  updated_at: string;
}

export const useIssues = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      if (error) throw error;
      return data as Issue[];
    },
  });

  const createIssue = useMutation({
    mutationFn: async (issue: Omit<Issue, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("issues")
        .insert(issue)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Issue> & { id: string }) => {
      const { data, error } = await supabase
        .from("issues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      toast({
        title: "Success",
        description: "Issue updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteIssue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("issues").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      toast({
        title: "Success",
        description: "Issue deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    issues,
    isLoading,
    createIssue,
    updateIssue,
    deleteIssue,
  };
};
