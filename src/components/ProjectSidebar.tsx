import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import cspogLogo from "@/assets/cspog-logo-full.jpg";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  ArrowLeft, 
  Home,
  CheckSquare,
  FileCheck,
  UserCheck,
  Lightbulb,
  Lock,
  FileText,
  AlertTriangle,
  FileSignature,
  List,
  Building,
  RefreshCw,
  Hammer,
  Search,
  Rocket,
  Radio,
  Trash2,
  Wrench,
  ChevronDown,
  Settings,
  ShieldCheck,
  Target,
  TestTube,
  ClipboardCheck,
  ListChecks,
  Monitor,
  Edit,
  ShieldAlert,
  FileEdit,
  AlertCircle,
  LogOut,
  FolderOpen,
  Layers,
  Activity
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface ProjectSidebarProps {
  projectId: string;
  onBackToProjects: () => void;
  onSignOut: () => void;
}

export function ProjectSidebar({ projectId, onBackToProjects, onSignOut }: ProjectSidebarProps) {
  const { open } = useSidebar();
  const [openSections, setOpenSections] = useState({
    delivery: true,
    initiation: false,
    phase1: false,
    phase2: false,
    phase3: false,
    completion: false,
    live: false,
    disposal: false,
    securityTools: true,
  });
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Delivery > Initiation
  const initiationItems = [
    { title: "Security Ownership", url: `/project/${projectId}/security-ownership`, icon: UserCheck },
  ];

  // Delivery > Phase 1
  const phase1Items = [
    { title: "Business Impact Analysis", url: `/project/${projectId}/business-impact-assessment`, icon: FileCheck },
    { title: "Gov Assure", url: `/project/${projectId}/gov-assure`, icon: CheckSquare },
    { title: "Obligations Discovery", url: `/project/${projectId}/security-obligations`, icon: FileCheck },
    { title: "3rd Party Assessments", url: `/project/${projectId}/third-party-assessments`, icon: UserCheck },
    { title: "IP Assessment", url: `/project/${projectId}/ip-assessment`, icon: Lightbulb },
    { title: "Data Sharing Agreements", url: `/project/${projectId}/data-sharing-agreements`, icon: FileSignature },
    { title: "DPIA", url: `/project/${projectId}/dpia`, icon: Lock },
    { title: "Initial Threat Model", url: `/project/${projectId}/threat-model`, icon: Shield },
  ];

  // Delivery > Phase 2
  const phase2Items = [
    { title: "Risk Appetite", url: `/project/${projectId}/risk-appetite`, icon: TrendingUp },
    { title: "Risk Register", url: `/project/${projectId}/risk-register`, icon: AlertTriangle },
    { title: "Security Governance", url: `/project/${projectId}/security-governance`, icon: Building },
    { title: "Continual Assurance", url: `/project/${projectId}/continual-assurance`, icon: RefreshCw },
    { title: "Security Requirements", url: `/project/${projectId}/security-requirements`, icon: List },
  ];

  // Delivery > Phase 3
  const phase3Items = [
    { title: "Deeper Threat Model", url: `/project/${projectId}/deeper-threat-model`, icon: Shield },
    { title: "Testing & Evaluation", url: `/project/${projectId}/testing-evaluation`, icon: TestTube },
    { title: "Security Controls", url: `/project/${projectId}/security-controls`, icon: Target },
    { title: "Monitoring Requirements", url: `/project/${projectId}/monitoring-requirements`, icon: Monitor },
  ];

  // Delivery > Completion
  const completionItems = [
    { title: "Compliance (GSD)", url: `/project/${projectId}/compliance-gsd`, icon: ClipboardCheck },
    { title: "Risk Profile Acceptance", url: `/project/${projectId}/risk-profile-acceptance`, icon: ShieldCheck },
  ];

  // Live items
  const liveItems = [
    { title: "Issue Register", url: `/project/${projectId}/issue-register`, icon: ListChecks },
  ];

  // Disposal items (placeholder)
  const disposalItems: typeof initiationItems = [];

  const toolsItems = [
    { title: "Project Foundations", url: `/project/${projectId}/project-foundations`, icon: Layers },
    { title: "Obligations Tools", url: `/project/${projectId}/obligations-tools`, icon: ShieldCheck },
    { title: "Threat Tooling", url: `/project/${projectId}/threat-tooling`, icon: Shield },
    { title: "Risk Tooling", url: `/project/${projectId}/risk-tooling`, icon: FileText },
    { title: "Asset Tools", url: `/project/${projectId}/asset-tools`, icon: Building },
    { title: "Control Tools", url: `/project/${projectId}/control-tools`, icon: Settings },
    { title: "Issue Tools", url: `/project/${projectId}/issue-tools`, icon: AlertCircle },
    { title: "Requirements Tools", url: `/project/${projectId}/requirements-tools`, icon: FileEdit },
    { title: "Monitoring Tools", url: `/project/${projectId}/monitoring-tools`, icon: Activity },
    { title: "CAF Evidence Assessment", url: `/project/${projectId}/caf-evidence-assessment`, icon: FileCheck },
  ];

  const renderMenuSection = (
    title: string,
    items: typeof toolsItems,
    sectionKey: keyof typeof openSections,
    Icon: React.ElementType
  ) => (
    <SidebarGroup>
      <div 
        className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent/20 rounded-md text-sidebar-foreground"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {open && <SidebarGroupLabel className="cursor-pointer text-sidebar-foreground font-bold">{title}</SidebarGroupLabel>}
        </div>
        {open && (
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`}
          />
        )}
      </div>
      {openSections[sectionKey] && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={currentPath === item.url} className="data-[active=true]:underline">
                  <NavLink
                    to={item.url}
                    end
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-bold">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );

  const renderNestedSection = (
    title: string,
    items: typeof toolsItems,
    sectionKey: keyof typeof openSections,
    Icon: React.ElementType
  ) => (
    <div className={openSections[sectionKey] ? "pl-4" : ""}>
      <div 
        className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent/20 rounded-md text-sidebar-foreground"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3 w-3" />
          {open && <span className="text-sm font-bold">{title}</span>}
        </div>
        {open && (
          <ChevronDown 
            className={`h-3 w-3 transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`}
          />
        )}
      </div>
      {openSections[sectionKey] && (
        <SidebarMenu className="pl-4">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={currentPath === item.url} className="data-[active=true]:underline text-sm">
                <NavLink
                  to={item.url}
                  end
                >
                  <item.icon className="h-3 w-3" />
                  <span className="font-bold">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </div>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="font-orbitron font-bold">
        {open && (
          <div className="p-4">
            <img src={cspogLogo} alt="C-SPOG - Cyber Single Pane Of Glass" className="w-full h-auto" />
          </div>
        )}
        
        {/* Home Menu Item - Always Visible */}
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
                    <span className="font-bold">Home</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacing */}
        <div className="h-8" />
        
        {/* Project Home */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={currentPath === `/project/${projectId}/home`} className="data-[active=true]:underline">
                <NavLink
                  to={`/project/${projectId}/home`}
                  end
                >
                  <Home className="h-4 w-4" />
                  <span className="font-bold">Project Home</span>
                </NavLink>
              </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacing before hierarchical sections */}
        <div className="h-4" />
        
        {/* Delivery Section with nested subsections */}
        <SidebarGroup>
          <div 
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent/20 rounded-md text-sidebar-foreground"
            onClick={() => toggleSection("delivery")}
          >
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              {open && <SidebarGroupLabel className="cursor-pointer text-sidebar-foreground font-bold">Delivery</SidebarGroupLabel>}
            </div>
            {open && (
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${openSections.delivery ? 'rotate-180' : ''}`}
              />
            )}
          </div>
          {openSections.delivery && (
            <SidebarGroupContent>
              {renderNestedSection("Initiation", initiationItems, "initiation", Search)}
              {renderNestedSection("Phase 1", phase1Items, "phase1", FileCheck)}
              {renderNestedSection("Phase 2", phase2Items, "phase2", TrendingUp)}
              {renderNestedSection("Phase 3", phase3Items, "phase3", TestTube)}
              {renderNestedSection("Completion", completionItems, "completion", ClipboardCheck)}
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Live Section */}
        <SidebarGroup>
          <div 
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent/20 rounded-md text-sidebar-foreground"
            onClick={() => toggleSection("live")}
          >
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              {open && <SidebarGroupLabel className="cursor-pointer text-sidebar-foreground font-bold">Live</SidebarGroupLabel>}
            </div>
            {open && (
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${openSections.live ? 'rotate-180' : ''}`}
              />
            )}
          </div>
          {openSections.live && liveItems.length > 0 && (
            <SidebarGroupContent>
              <SidebarMenu>
                {liveItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url} className="data-[active=true]:underline">
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span className="font-bold">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Disposal Section */}
        <SidebarGroup>
          <div 
            className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-sidebar-accent/20 rounded-md text-sidebar-foreground"
            onClick={() => toggleSection("disposal")}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {open && <SidebarGroupLabel className="cursor-pointer text-sidebar-foreground font-bold">Disposal</SidebarGroupLabel>}
            </div>
            {open && (
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${openSections.disposal ? 'rotate-180' : ''}`}
              />
            )}
          </div>
          {openSections.disposal && disposalItems.length > 0 && (
            <SidebarGroupContent>
              <SidebarMenu>
                {disposalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url} className="data-[active=true]:underline">
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span className="font-bold">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Security Tools Section */}
        {renderMenuSection("Security Tools", toolsItems, "securityTools", Wrench)}

        <div className="mt-auto p-4 space-y-2">
          <Button
            variant="ghost"
            onClick={onBackToProjects}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20 font-bold"
            size={open ? "default" : "icon"}
          >
            <Home className="h-4 w-4" />
            {open && <span className="ml-2">Home</span>}
          </Button>
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/20 font-bold"
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
