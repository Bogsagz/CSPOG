import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type KeyPersonRole = 
  | "delivery_manager"
  | "cyber_risk_owner"
  | "deputy_cyber_risk_owner"
  | "second_line_assurer"
  | "technical_architect";

export interface KeyPerson {
  id: string;
  project_id: string;
  role_type: KeyPersonRole;
  first_name: string;
  last_name: string;
  grade: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<KeyPersonRole, string> = {
  delivery_manager: "Delivery Manager",
  cyber_risk_owner: "Cyber Risk Owner",
  deputy_cyber_risk_owner: "Deputy Cyber Risk Owner",
  second_line_assurer: "2nd Line Assurer",
  technical_architect: "Technical Architect",
};

export function useProjectKeyPeople(projectId: string) {
  const queryClient = useQueryClient();

  const { data: keyPeople = [], isLoading } = useQuery({
    queryKey: ["project-key-people", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_key_people")
        .select("*")
        .eq("project_id", projectId)
        .order("role_type");

      if (error) throw error;
      return data as KeyPerson[];
    },
    enabled: !!projectId,
  });

  const createOrUpdateKeyPerson = useMutation({
    mutationFn: async (person: Omit<KeyPerson, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("project_key_people")
        .upsert(person, { onConflict: "project_id,role_type" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-key-people", projectId] });
      toast.success("Key person saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save key person");
      console.error(error);
    },
  });

  const deleteKeyPerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_key_people")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-key-people", projectId] });
      toast.success("Key person deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete key person");
      console.error(error);
    },
  });

  return {
    keyPeople,
    isLoading,
    createOrUpdateKeyPerson,
    deleteKeyPerson,
  };
}
