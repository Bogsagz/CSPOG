import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProjectRole = 
  | "security_architect" 
  | "risk_manager" 
  | "sec_mon"
  | "sec_eng"
  | "delivery";

export const ROLE_LABELS: Record<ProjectRole, string> = {
  security_architect: "Security Architect",
  risk_manager: "Risk Manager",
  sec_mon: "Sec Mon",
  sec_eng: "Sec Eng",
  delivery: "Delivery"
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
}

export const useProjectMembers = (projectId: string | null) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadMembers();
    } else {
      setMembers([]);
      setIsLoading(false);
    }
  }, [projectId]);

  const loadMembers = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          *,
          profiles(email, first_name, last_name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Don't filter out any roles - show all members including risk_manager (formerly risk_owner)
      const membersWithEmail = data?.map(member => ({
        ...member,
        email: (member.profiles as any)?.email,
        first_name: (member.profiles as any)?.first_name,
        last_name: (member.profiles as any)?.last_name
      })) || [];

      setMembers(membersWithEmail as ProjectMember[]);
    } catch (error) {
      console.error("Error loading project members:", error);
      toast.error("Failed to load project members");
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = async (email: string, role: ProjectRole) => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    try {
      // First, find the user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        toast.error("User not found with that email");
        return;
      }

      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: profile.id,
          role: role as any
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("User is already a member of this project");
        } else {
          throw error;
        }
        return;
      }

      await loadMembers();
      toast.success("Team member added successfully");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add team member");
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success("Team member removed");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove team member");
    }
  };

  const updateMemberRole = async (memberId: string, newRole: ProjectRole) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .update({ role: newRole as any })
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
      );
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  return { members, isLoading, addMember, removeMember, updateMemberRole, refreshMembers: loadMembers };
};
