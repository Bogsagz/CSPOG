import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  vendor?: string;
  version?: string;
  model_number?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export const ASSET_TYPES = [
  "Physical device",
  "Data",
  "Process",
  "Cloud component",
  "Software component",
] as const;

export const useAssets = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("project_id", projectId)
        .order("name");

      if (error) throw error;
      return data as Asset[];
    },
  });

  const createAsset = useMutation({
    mutationFn: async (asset: Omit<Asset, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("assets")
        .insert(asset)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", projectId] });
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create asset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Asset> & { id: string }) => {
      const { data, error } = await supabase
        .from("assets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", projectId] });
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update asset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", projectId] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete asset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    assets,
    isLoading,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};
