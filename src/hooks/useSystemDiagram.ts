import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Node, Edge } from "@xyflow/react";
import { Json } from "@/integrations/supabase/types";

export interface SystemDiagram {
  id: string;
  project_id: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

export const useSystemDiagram = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: diagram, isLoading } = useQuery({
    queryKey: ["system-diagram", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_diagrams")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        nodes: (data.nodes || []) as unknown as Node[],
        edges: (data.edges || []) as unknown as Edge[],
      } as SystemDiagram;
    },
  });

  const saveDiagram = useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
      const payload = {
        project_id: projectId,
        nodes: nodes as unknown as Json,
        edges: edges as unknown as Json,
      };

      // Check if diagram exists
      const { data: existing } = await supabase
        .from("system_diagrams")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("system_diagrams")
          .update({ nodes: payload.nodes, edges: payload.edges })
          .eq("project_id", projectId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("system_diagrams")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-diagram", projectId] });
      toast({
        title: "Success",
        description: "System diagram saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save diagram: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    diagram,
    isLoading,
    saveDiagram,
    nodes: (diagram?.nodes || []) as Node[],
    edges: (diagram?.edges || []) as Edge[],
  };
};
