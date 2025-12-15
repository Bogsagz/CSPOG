import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  created_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // Only fetch projects where the user is a direct member
      const { data: membershipData, error: membershipError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const projectIds = membershipData?.map(m => m.project_id) || [];

      if (projectIds.length === 0) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // Fetch only the projects where user is a member
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .in("id", projectIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (title: string, userId: string, securityPhase?: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ 
          title, 
          user_id: userId,
          security_phase: (securityPhase || 'Discovery') as any
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProjects(prev => [data, ...prev]);
        toast.success("Project created successfully");
        return data.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
      return null;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  return { projects, isLoading, createProject, deleteProject, refreshProjects: loadProjects };
};
