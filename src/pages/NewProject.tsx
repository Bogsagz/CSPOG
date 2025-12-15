import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, ShieldAlert, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import { mapWorkstreamToEnum } from "@/lib/workstreamMapping";

type FleetSize = string;
type Workstream = "Mig" | "IE" | "Land" | "Sea" | "Plat";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const NewProject = () => {
  const { workstreams, fleetSizes: appFleetSizes } = useAppSettings();
  const [projectTitle, setProjectTitle] = useState("");
  const [securityPhase, setSecurityPhase] = useState<string>("Discovery");
  const [fleetSize, setFleetSize] = useState<FleetSize | null>(null);
  const [workstream, setWorkstream] = useState<Workstream | null>(null);
  const [sbdRequired, setSbdRequired] = useState<boolean>(false);
  const [projectStart, setProjectStart] = useState<Date | undefined>(undefined);
  const [anticipatedGoLive, setAnticipatedGoLive] = useState<Date | undefined>(undefined);
  const [securityArchitect, setSecurityArchitect] = useState<string | null>(null);
  const [informationAssurer, setInformationAssurer] = useState<string | null>(null);
  const [soc, setSoc] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const { createProject } = useProjects();
  const { user, loading } = useAuth();
  const { canCreate, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !permissionLoading && !canCreate) {
      navigate("/");
    }
  }, [canCreate, loading, permissionLoading, navigate]);

  useEffect(() => {
    if (canCreate) {
      loadUsers();
    }
  }, [canCreate]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .order("email");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectTitle.trim() || !user || !canCreate) {
      return;
    }

    setIsCreating(true);
    try {
      // Check for duplicate project title
      const { data: existingProjects, error: checkError } = await supabase
        .from("projects")
        .select("id")
        .ilike("title", projectTitle.trim())
        .limit(1);

      if (checkError) throw checkError;

      if (existingProjects && existingProjects.length > 0) {
        toast.error(`A project named "${projectTitle.trim()}" already exists. Please choose a different name.`);
        setIsCreating(false);
        return;
      }

      // Create the project with all fields
      const { data, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: projectTitle.trim(),
          user_id: user.id,
          security_phase: securityPhase as any,
          fleet_size: fleetSize as any,
          workstream: workstream ? mapWorkstreamToEnum(workstream) as any : null,
          secure_by_design_required: sbdRequired,
          project_start: projectStart ? format(projectStart, 'yyyy-MM-dd') : null,
          anticipated_go_live: anticipatedGoLive ? format(anticipatedGoLive, 'yyyy-MM-dd') : null
        })
        .select();

      if (projectError) throw projectError;
      
      const project = data?.[0];
      if (!project) throw new Error("Failed to retrieve created project");

      // Add role assignments (dedupe by user and exclude creator to avoid unique constraint)
      const assignmentsRaw: { project_id: string; user_id: string; role: 'security_architect' | 'risk_manager' | 'sec_mon' }[] = [];
      if (securityArchitect) {
        assignmentsRaw.push({
          project_id: project.id,
          user_id: securityArchitect,
          role: 'security_architect'
        });
      }
      if (informationAssurer) {
        assignmentsRaw.push({
          project_id: project.id,
          user_id: informationAssurer,
          role: 'risk_manager'
        });
      }
      if (soc) {
        assignmentsRaw.push({
          project_id: project.id,
          user_id: soc,
          role: 'sec_mon'
        });
      }

      // Remove duplicates by user_id and skip creator
      // Note: Project creator will be auto-assigned as risk_manager (Information Assurer) via trigger
      const seen = new Set<string>();
      const roleAssignments = assignmentsRaw.filter((a) => {
        if (a.user_id === user.id) return false;
        if (seen.has(a.user_id)) return false;
        seen.add(a.user_id);
        return true;
      });

      if (roleAssignments.length > 0) {
        const { error: rolesError } = await supabase
          .from("project_members")
          .insert(roleAssignments);

        // Ignore duplicate errors from race conditions; proceed with success
        // @ts-ignore - rolesError may be typed as PostgrestError | null
        if (rolesError && rolesError.code !== '23505') throw rolesError;
      }

      toast.success("Project created successfully");
      navigate("/manage-projects");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          <Card>
            <CardContent className="py-16 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Permission Denied</h3>
              <p className="text-muted-foreground mb-6">
                Only Security Admins can create new projects. Please contact your administrator.
              </p>
              <Button onClick={() => navigate("/")}>
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Create New Project
          </h1>
          <p className="text-muted-foreground text-lg">
            Start building threat statements for your new project
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-title">Project Name</Label>
                <Input
                  id="project-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter project name..."
                  required
                />
              </div>

              {/* Fleet Size, Workstream, and SbD Required */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fleet-size">Fleet Size</Label>
                  <Select value={fleetSize || "none"} onValueChange={(value) => setFleetSize(value === "none" ? null : value as FleetSize)}>
                    <SelectTrigger id="fleet-size" className="bg-background">
                      <SelectValue placeholder="Select fleet size" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      {appFleetSizes.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workstream">Workstream</Label>
                  <Select value={workstream || "none"} onValueChange={(value) => setWorkstream(value === "none" ? null : value as Workstream)}>
                    <SelectTrigger id="workstream" className="bg-background">
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

                <div className="space-y-2">
                  <Label htmlFor="sbd-required">SbD Required</Label>
                  <Select value={sbdRequired ? "yes" : "no"} onValueChange={(value) => setSbdRequired(value === "yes")}>
                    <SelectTrigger id="sbd-required" className="bg-background">
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
                <div className="space-y-2">
                  <Label htmlFor="security-architect">Security Architect</Label>
                  <Select value={securityArchitect || "none"} onValueChange={(value) => setSecurityArchitect(value === "none" ? null : value)}>
                    <SelectTrigger id="security-architect" className="bg-background">
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

                <div className="space-y-2">
                  <Label htmlFor="information-assurer">Information Assurer</Label>
                  <Select value={informationAssurer || "none"} onValueChange={(value) => setInformationAssurer(value === "none" ? null : value)}>
                    <SelectTrigger id="information-assurer" className="bg-background">
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

                <div className="space-y-2">
                  <Label htmlFor="soc">SOC</Label>
                  <Select value={soc || "none"} onValueChange={(value) => setSoc(value === "none" ? null : value)}>
                    <SelectTrigger id="soc" className="bg-background">
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !projectStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {projectStart ? format(projectStart, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={projectStart}
                        onSelect={setProjectStart}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Anticipated Go Live</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !anticipatedGoLive && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {anticipatedGoLive ? format(anticipatedGoLive, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={anticipatedGoLive}
                        onSelect={setAnticipatedGoLive}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!projectTitle.trim() || isCreating}>
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
