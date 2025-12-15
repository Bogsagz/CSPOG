import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useUserRoles } from "@/hooks/useUserRoles";
import cspogLogo from "@/assets/cspog-logo-horizontal.jpg";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: adminCheckLoading } = useCanCreateProjects(user?.id || null);
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || adminCheckLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          onSignOut={handleSignOut} 
          canManageTeam={isSecurityAdmin} 
          userRoles={roles}
          userId={user?.id}
        />
        
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
