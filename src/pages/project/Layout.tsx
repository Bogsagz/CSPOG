import { useEffect } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useProjectTimelineRisk } from "@/hooks/useProjectTimelineRisk";

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { hasTimelineRisk } = useProjectTimelineRisk(projectId || null);

  const currentProject = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!projectsLoading && !authLoading && !projectId) {
      navigate("/");
    }
  }, [projectId, projectsLoading, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ProjectSidebar
          projectId={projectId || ""}
          onBackToProjects={() => navigate("/home")}
          onSignOut={handleSignOut}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{currentProject?.title || "Project"}</h1>
              {hasTimelineRisk && (
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                  Timeline Risk
                </span>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
