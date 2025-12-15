import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Trash2, Plus, Calendar, CalendarIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ProjectRole } from "@/hooks/useProjectMembers";
import { ProjectTimelineCompact } from "@/components/ProjectTimelineCompact";
import { useProjectTimeline } from "@/hooks/useProjectTimeline";
import { useProjectTimelineRisk } from "@/hooks/useProjectTimelineRisk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { mapWorkstreamToEnum } from "@/lib/workstreamMapping";

const ProjectTimelineRiskBadge = ({ projectId }: { projectId: string }) => {
  const { hasTimelineRisk } = useProjectTimelineRisk(projectId);
  
  if (!hasTimelineRisk) return null;
  
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive whitespace-nowrap">
      Timeline Risk
    </span>
  );
};

type FleetSize = "X-Wing" | "Enterprise" | "Red Dwarf" | "Star Destroyer" | "Death Star";
type Workstream = "Mig" | "IE" | "Land" | "Sea" | "Plat";
type SecurityPhase = "Discovery" | "Alpha" | "Live" | "Disposal";

interface ProjectRoleAssignment {
  security_architect: string | null;
  risk_manager: string | null;
  sec_mon: string | null;
}

interface Project {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  fleet_size: FleetSize | null;
  workstream: Workstream | null;
  project_start: string | null;
  end_discovery: string | null;
  anticipated_go_live: string | null;
  end_live: string | null;
  complete_disposal: string | null;
  secure_by_design_required: boolean;
  security_phase: SecurityPhase | null;
  creator_name?: string;
  member_count: number;
  role_assignments: ProjectRoleAssignment;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ProjectLifecycleDatesProps {
  project: Project;
  onReload: () => Promise<void>;
}

function ProjectLifecycleDates({ project, onReload }: ProjectLifecycleDatesProps) {
  const { milestones } = useProjectTimeline(project.project_start, project.anticipated_go_live, project.id);
  const [hasChanges, setHasChanges] = useState(false);
  const [localDates, setLocalDates] = useState({
    project_start: project.project_start,
    anticipated_go_live: project.anticipated_go_live,
    end_live: project.end_live,
    complete_disposal: project.complete_disposal
  });

  // Update local dates when project changes
  useEffect(() => {
    setLocalDates({
      project_start: project.project_start,
      anticipated_go_live: project.anticipated_go_live,
      end_live: project.end_live,
      complete_disposal: project.complete_disposal
    });
    setHasChanges(false);
  }, [project]);

  // Auto-populate calculated dates from timeline when project start is set
  useEffect(() => {
    if (!project.project_start || milestones.length === 0) return;
    
    // Remove auto-population logic since we removed end_discovery
  }, [milestones, project.project_start]);

  const handleDateChange = (field: 'project_start' | 'end_live' | 'complete_disposal' | 'anticipated_go_live', date: Date | undefined) => {
    // Don't allow clearing project_start or anticipated_go_live as they're required for timeline
    if (!date && (field === 'project_start' || field === 'anticipated_go_live')) {
      return;
    }
    
    const newValue = date ? format(date, 'yyyy-MM-dd') : null;
    setLocalDates(prev => ({
      ...prev,
      [field]: newValue
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    // Collect all changed dates
    const updates: Partial<Project> = {};
    let hasAnyChanges = false;
    
    Object.entries(localDates).forEach(([field, value]) => {
      const projectField = field as 'project_start' | 'end_live' | 'complete_disposal' | 'anticipated_go_live';
      if (value !== project[projectField]) {
        updates[projectField] = value;
        hasAnyChanges = true;
      }
    });
    
    if (hasAnyChanges) {
      // Update all dates in a single batch
      try {
        const { error } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", project.id);
        
        if (error) throw error;
        toast.success("Dates updated successfully");
        await onReload(); // Reload projects to get fresh data
      } catch (error) {
        console.error("Error updating dates:", error);
        toast.error("Failed to update dates");
      }
    }
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalDates({
      project_start: project.project_start,
      anticipated_go_live: project.anticipated_go_live,
      end_live: project.end_live,
      complete_disposal: project.complete_disposal
    });
    setHasChanges(false);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const DatePickerField = ({ 
    label, 
    value, 
    field 
  }: { 
    label: string; 
    value: string | null; 
    field: 'project_start' | 'end_live' | 'complete_disposal' | 'anticipated_go_live';
  }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-8 text-sm",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background" align="start">
          <CalendarComponent
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => handleDateChange(field, date)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="mt-6 border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Project Lifecycle Dates
        </h3>
        {hasChanges && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DatePickerField 
          label="Project Start"
          value={localDates.project_start}
          field="project_start"
        />

        <DatePickerField 
          label="Anticipated Go Live"
          value={localDates.anticipated_go_live}
          field="anticipated_go_live"
        />

        <DatePickerField 
          label="End Live"
          value={localDates.end_live}
          field="end_live"
        />

        <DatePickerField 
          label="Complete Disposal"
          value={localDates.complete_disposal}
          field="complete_disposal"
        />
      </div>
    </div>
  );
}

export default function ManageProjects() {
  const { workstreams } = useAppSettings();
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<Project>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!permissionLoading && !isSecurityAdmin) {
      navigate("/projects");
    }
  }, [isSecurityAdmin, permissionLoading, navigate]);

  useEffect(() => {
    if (isSecurityAdmin) {
      loadProjects();
    }
  }, [isSecurityAdmin]);

  const loadProjects = async () => {
    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .order("email");

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load projects without joining profiles
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, created_at, user_id, fleet_size, workstream, project_start, end_discovery, anticipated_go_live, end_live, complete_disposal, secure_by_design_required, security_phase")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Get all project members
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("project_id, user_id, role");

      if (membersError) throw membersError;

      // Create a map of user IDs to names
      const userNameMap = usersData?.reduce((acc, user) => {
        const name = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.last_name || 'Unknown User';
        acc[user.id] = name;
        return acc;
      }, {} as Record<string, string>) || {};

      // Group members by project and role
      const projectRoles: Record<string, ProjectRoleAssignment> = {};
      const memberCounts: Record<string, number> = {};

      membersData?.forEach(member => {
        if (!projectRoles[member.project_id]) {
          projectRoles[member.project_id] = {
            security_architect: null,
            risk_manager: null,
            sec_mon: null
          };
        }
        memberCounts[member.project_id] = (memberCounts[member.project_id] || 0) + 1;

        const role = member.role as ProjectRole;
        if (role === "security_architect" || role === "risk_manager" || role === "sec_mon") {
          projectRoles[member.project_id][role] = member.user_id;
        }
      });

      const formattedProjects: Project[] = projectsData?.map(project => ({
        id: project.id,
        title: project.title,
        created_at: project.created_at,
        user_id: project.user_id,
        fleet_size: project.fleet_size as FleetSize | null,
        workstream: project.workstream as Workstream | null,
        project_start: project.project_start,
        end_discovery: project.end_discovery,
        anticipated_go_live: project.anticipated_go_live,
        end_live: project.end_live,
        complete_disposal: project.complete_disposal,
        secure_by_design_required: project.secure_by_design_required || false,
        security_phase: project.security_phase as SecurityPhase | null,
        creator_name: userNameMap[project.user_id] || "Unknown User",
        member_count: memberCounts[project.id] || 0,
        role_assignments: projectRoles[project.id] || {
          security_architect: null,
          risk_manager: null,
          sec_mon: null
        }
      })) || [];

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFleetSize = async (projectId: string, fleetSize: FleetSize | null) => {
    setPendingChanges(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        fleet_size: fleetSize
      }
    }));
  };

  const updateWorkstream = async (projectId: string, workstream: Workstream | null) => {
    setPendingChanges(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        workstream: workstream
      }
    }));
  };

  const updateSecureByDesign = async (projectId: string, required: boolean) => {
    setPendingChanges(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        secure_by_design_required: required
      }
    }));
  };

  const saveProjectChanges = async (projectId: string) => {
    const changes = pendingChanges[projectId];
    if (!changes || Object.keys(changes).length === 0) {
      toast.error("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Saving changes for project:", projectId, changes);
      
const sanitizedChanges = { ...changes } as Partial<Project>;
if (sanitizedChanges.workstream) {
  sanitizedChanges.workstream = mapWorkstreamToEnum(String(sanitizedChanges.workstream)) as Workstream;
}

const { error } = await supabase
        .from("projects")
        .update(sanitizedChanges)
        .eq("id", projectId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      // Clear pending changes for this project
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
      
      toast.success("Changes saved successfully");
      await loadProjects();
    } catch (error: any) {
      console.error("Error saving changes:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      toast.error(`Failed to save changes: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const assignUserToRole = async (projectId: string, userId: string | null, role: ProjectRole) => {
    try {
      if (!userId) {
        // Remove assignment
        const { error } = await supabase
          .from("project_members")
          .delete()
          .eq("project_id", projectId)
          .eq("role", role as any);

        if (error) throw error;
      } else {
        // Check if user already has a role in this project
        const { data: existing, error: checkError } = await supabase
          .from("project_members")
          .select("id, role")
          .eq("user_id", userId)
          .eq("project_id", projectId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          // Update existing role
          const { error } = await supabase
            .from("project_members")
            .update({ role: role as any })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // Insert new assignment
          const { error } = await supabase
            .from("project_members")
            .insert({
              project_id: projectId,
              user_id: userId,
              role: role as any
            });

          if (error) throw error;
        }
      }

      toast.success("Role assignment updated");
      await loadProjects();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Project deleted successfully");
      await loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const updateLifecycleDate = async (projectId: string, field: 'project_start' | 'end_live' | 'complete_disposal' | 'anticipated_go_live', value: string | null) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [field]: value })
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Date updated successfully");
      await loadProjects();
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update date");
    }
  };

  if (permissionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (!isSecurityAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only Security Admins can manage projects.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => {
    const searchLower = searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.creator_name?.toLowerCase().includes(searchLower) ||
      project.workstream?.toLowerCase().includes(searchLower) ||
      project.fleet_size?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Manage Projects</h2>
          <p className="text-muted-foreground">
            View and manage all projects in the system
          </p>
        </div>
        <Button onClick={() => navigate("/new-project")}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by project title, creator, workstream, or fleet size..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <ProjectTimelineRiskBadge projectId={project.id} />
                  </div>
                  {project.security_phase && (
                    <p className="text-sm font-medium text-primary mt-1">
                      Security Phase: {project.security_phase}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Created by: {project.creator_name || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Members: {project.member_count} | Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {pendingChanges[project.id] && (
                    <Button 
                      onClick={() => saveProjectChanges(project.id)}
                      size="sm"
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.title}"? This action cannot be undone.
                          All associated data will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProject(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fleet Size, Workstream, and SbD Required */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fleet Size</label>
                  <Select
                    value={(pendingChanges[project.id]?.fleet_size !== undefined ? pendingChanges[project.id]?.fleet_size : project.fleet_size) || "none"}
                    onValueChange={(value) => 
                      updateFleetSize(project.id, value === "none" ? null : value as FleetSize)
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select fleet size" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      <SelectItem value="X-Wing">X-Wing</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="Red Dwarf">Red Dwarf</SelectItem>
                      <SelectItem value="Star Destroyer">Star Destroyer</SelectItem>
                      <SelectItem value="Death Star">Death Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Workstream</label>
                  <Select
                    value={(pendingChanges[project.id]?.workstream !== undefined ? pendingChanges[project.id]?.workstream : project.workstream) || "none"}
                    onValueChange={(value) => 
                      updateWorkstream(project.id, value === "none" ? null : value as Workstream)
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select workstream" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
{workstreams.map(ws => {
  const enumVal = mapWorkstreamToEnum(ws as string);
  return (
    <SelectItem key={enumVal} value={enumVal}>{ws}</SelectItem>
  );
})}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">SbD Required</label>
                  <Select
                    value={(pendingChanges[project.id]?.secure_by_design_required !== undefined ? pendingChanges[project.id]?.secure_by_design_required : project.secure_by_design_required) ? "yes" : "no"}
                    onValueChange={(value) => 
                      updateSecureByDesign(project.id, value === "yes")
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select requirement" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Role Assignments */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Security Architect</label>
                  <Select
                    value={project.role_assignments.security_architect || "none"}
                    onValueChange={(value) => 
                      assignUserToRole(project.id, value === "none" ? null : value, "security_architect")
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Assign user" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      {users.map(user => {
                        const displayName = user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || 'Unknown User';
                        return (
                          <SelectItem key={user.id} value={user.id}>{displayName}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Information Assurer</label>
                  <Select
                    value={project.role_assignments.risk_manager || "none"}
                    onValueChange={(value) => 
                      assignUserToRole(project.id, value === "none" ? null : value, "risk_manager")
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Assign user" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      {users.map(user => {
                        const displayName = user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || 'Unknown User';
                        return (
                          <SelectItem key={user.id} value={user.id}>{displayName}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sec Mon</label>
                  <Select
                    value={project.role_assignments.sec_mon || "none"}
                    onValueChange={(value) => 
                      assignUserToRole(project.id, value === "none" ? null : value, "sec_mon")
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Assign user" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      {users.map(user => {
                        const displayName = user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || 'Unknown User';
                        return (
                          <SelectItem key={user.id} value={user.id}>{displayName}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Lifecycle Dates */}
              <ProjectLifecycleDates 
                project={project} 
                onReload={loadProjects}
              />

              {/* Project Timeline */}
              <ProjectTimelineCompact 
                key={`${project.id}-${project.project_start}-${project.anticipated_go_live}-${project.fleet_size}`}
                projectStartDate={project.project_start}
                goLiveDate={project.anticipated_go_live}
                fleetSize={project.fleet_size}
                projectId={project.id}
              />
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
