import { NavLink, useLocation } from "react-router-dom";
import { Users, LogOut, FolderKanban, Home, CalendarOff, ChevronDown, User, BarChart3, Folder, Settings, Layers, Database, DollarSign, Palette, Megaphone } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import cspogLogo from "@/assets/cspog-logo-full.jpg";
import cspogLogoDark from "@/assets/cspog-logo-dark.png";
import { useTheme } from "@/hooks/useTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AppSidebarProps {
  onSignOut: () => void;
  canManageTeam: boolean;
  userRoles: string[];
  userId: string | undefined;
}

export function AppSidebar({ onSignOut, canManageTeam, userRoles, userId }: AppSidebarProps) {
  const { open } = useSidebar();
  const { workstreams } = useAppSettings();
  const location = useLocation();
  const currentPath = location.pathname;
  const [userWorkstream, setUserWorkstream] = useState<string | null>(null);
  const [userWorkstreamAssignments, setUserWorkstreamAssignments] = useState<string[]>([]);
  const { theme } = useTheme();

  // Role-based visibility helpers
  const isAdmin = userRoles.includes('security_admin');
  const isDelivery = userRoles.includes('security_delivery');
  const isMentor = userRoles.includes('security_mentor');
  const isUser = userRoles.includes('security_user');

  // Fetch user's workstream from both profiles and junction table
  useEffect(() => {
    if (!userId) return;

    const fetchUserWorkstreams = async () => {
      // Get workstream from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('workstream')
        .eq('id', userId)
        .single();

      if (profileData?.workstream) {
        setUserWorkstream(profileData.workstream);
      }

      // Get workstream assignments from junction table (for delivery/mentor users)
      const { data: assignmentData } = await supabase
        .from('user_workstream_assignments')
        .select('workstream')
        .eq('user_id', userId);

      if (assignmentData && assignmentData.length > 0) {
        setUserWorkstreamAssignments(assignmentData.map(a => a.workstream));
      }
    };

    fetchUserWorkstreams();
  }, [userId]);

  // Helper to map display name to enum for comparison
  const getWorkstreamEnum = (displayName: string): string => {
    const mapping: Record<string, string> = {
      'Migration': 'Mig',
      'Platforms': 'Plat',
      'IE': 'IE',
      'Land': 'Land',
      'Sea': 'Sea',
    };
    return mapping[displayName] || displayName;
  };

  // Dynamically generate workstream sections from app settings
  const workstreamSections = workstreams
    .filter(workstream => {
      // Admins and Delivery can see all workstreams
      if (isAdmin || isDelivery) {
        return true;
      }
      
      // Mentors: check junction table assignments
      if (isMentor) {
        const workstreamEnum = getWorkstreamEnum(workstream);
        return userWorkstreamAssignments.includes(workstreamEnum);
      }
      
      // Regular users: check profile workstream
      if (isUser) {
        const workstreamEnum = getWorkstreamEnum(workstream);
        return userWorkstream === workstreamEnum;
      }
      
      return false;
    })
    .map(workstream => ({
      section: workstream,
      icon: Folder,
      items: [
        {
          title: `${workstream} Overview`,
          url: `/manage/${workstream.toLowerCase()}/overview`,
          icon: BarChart3,
          visible: true, // Everyone who can see the workstream can see overview
        },
        {
          title: `${workstream} Team`,
          url: `/manage/${workstream.toLowerCase()}`,
          icon: Users,
          visible: canManageTeam || isDelivery || isMentor, // Admins, Delivery, and Mentors can see team
        },
        {
          title: `${workstream} Projects`,
          url: `/manage/${workstream.toLowerCase()}/projects`,
          icon: FolderKanban,
          visible: canManageTeam || isDelivery || isMentor, // Admins, Delivery, and Mentors can see projects
        }
      ]
    }));

  const menuStructure = [
    {
      section: "Home",
      icon: Home,
      items: [
        {
          title: "Home",
          url: "/home",
          icon: Home,
          visible: true,
        },
        {
          title: "Updates",
          url: "/updates",
          icon: Megaphone,
          visible: true,
        }
      ]
    },
    {
      section: "My Things",
      icon: User,
      items: [
        {
          title: "My Projects",
          url: "/projects",
          icon: FolderKanban,
          visible: true,
        },
        {
          title: "My Tasks",
          url: "/my-tasks",
          icon: CalendarOff,
          visible: true,
        },
        {
          title: "My Details",
          url: "/my-details",
          icon: User,
          visible: true,
        },
        {
          title: "My Time",
          url: "/manage-absences",
          icon: CalendarOff,
          visible: true,
        },
        {
          title: "Display Settings",
          url: "/theme-settings",
          icon: Palette,
          visible: true,
        }
      ]
    },
    // Full Project - Hidden for Mentors and Users
    ...(isMentor || isUser ? [] : [{
      section: "Full Project",
      icon: Folder,
      items: [
        {
          title: "Manage Team",
          url: "/manage-team",
          icon: Users,
          visible: canManageTeam || isDelivery,
        },
        {
          title: "Manage Projects",
          url: "/manage-projects",
          icon: FolderKanban,
          visible: canManageTeam || isDelivery,
        },
        {
          title: "Bulk Absences",
          url: "/bulk-absences",
          icon: CalendarOff,
          visible: canManageTeam || isDelivery,
        }
      ]
    }]),
    ...workstreamSections,
    // Reports - Hidden for Mentors and Users
    ...(isMentor || isUser ? [] : [{
      section: "Reports",
      icon: BarChart3,
      items: [
        {
          title: "Cross Charging",
          url: "/cross-charging",
          icon: BarChart3,
          visible: canManageTeam || isDelivery,
        },
        {
          title: "Deliverables",
          url: "/deliverables",
          icon: BarChart3,
          visible: canManageTeam || isDelivery,
        },
        {
          title: "Projects/People",
          url: "/projects-people",
          icon: BarChart3,
          visible: canManageTeam || isDelivery,
        }
      ]
    }]),
    // Advanced - Hidden for Mentors and Users
    ...(isMentor || isUser ? [] : [{
      section: "Advanced",
      icon: Settings,
      items: [
        {
          title: "Application Settings",
          url: "/app-settings",
          icon: Settings,
          visible: isAdmin, // Only admins can see
        },
        {
          title: "Day Rates",
          url: "/day-rates",
          icon: DollarSign,
          visible: canManageTeam,
        },
        {
          title: "Manage Workstreams",
          url: "/manage-workstreams",
          icon: Layers,
          visible: canManageTeam,
        },
        {
          title: "Bulk Uploads",
          url: "/bulk-uploads",
          icon: FolderKanban,
          visible: canManageTeam,
        },
        {
          title: "Backup & Restore",
          url: "/backup-restore",
          icon: Database,
          visible: canManageTeam,
        },
        {
          title: "System Roles",
          url: "/system-roles",
          icon: Users,
          visible: isAdmin, // Only admins can see
        }
      ]
    }])
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="font-orbitron font-bold">
        {open && (
          <div className="p-4">
            <img src={theme === 'dark' ? cspogLogoDark : cspogLogo} alt="C-SPOG - Cyber Single Pane Of Glass" className="w-full h-auto" />
          </div>
        )}
        
        {/* Home Menu Items - Always Visible */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/home"} className="data-[active=true]:underline">
                  <NavLink
                    to="/home"
                    end
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/updates"} className="data-[active=true]:underline">
                  <NavLink
                    to="/updates"
                    end
                  >
                    <Megaphone className="h-4 w-4" />
                    <span>Updates</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacing */}
        <div className="h-8" />
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuStructure.map((section) => {
                // Skip the Home section since we've rendered it separately
                if (section.section === "Home") {
                  return null;
                }

                // Filter visible items
                const visibleItems = section.items.filter(item => item.visible);
                
                // Skip sections with no visible items
                if (visibleItems.length === 0 && section.section !== "Reports") {
                  return null;
                }

                return (
                  <Collapsible key={section.section} defaultOpen={section.section === "My Things"} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="text-sidebar-foreground">
                          <section.icon className="h-4 w-4" />
                          <span>{section.section}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {visibleItems.length > 0 ? (
                            visibleItems.map((item) => (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild isActive={currentPath === item.url} className="data-[active=true]:underline">
                                  <NavLink
                                    to={item.url}
                                    end
                                  >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))
                          ) : (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton>
                                <span className="text-muted-foreground text-sm">Coming soon</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20"
            size={open ? "default" : "icon"}
          >
            <LogOut className="h-4 w-4" />
            {open && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
