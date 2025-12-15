import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useNavigate } from "react-router-dom";
import { ProjectRole } from "@/hooks/useProjectMembers";
import { ShieldAlert, Save, Ban, CheckCircle, UserPlus } from "lucide-react";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { mapWorkstreamToEnum, mapEnumToWorkstream } from "@/lib/workstreamMapping";

type Workstream = string;

interface ProjectAssignment {
  project_id: string;
  project_title: string;
  role: ProjectRole;
  fleet_size: string | null;
}

interface UserProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  date_joined: string;
  last_login: string | null;
  sfia_grade: number | null;
  primary_role: ProjectRole | null;
  workstream: Workstream | null;
  disabled: boolean;
  projects: ProjectAssignment[];
}

interface WorkstreamTeamManagerProps {
  workstream: Workstream;
}

export function WorkstreamTeamManager({ workstream }: WorkstreamTeamManagerProps) {
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const { isUserOnline } = useOnlineUsers();
  // null = loading, true = is mentor, false = not mentor
  const [mentorStatus, setMentorStatus] = useState<boolean | null>(null);
  const isMentor = mentorStatus === true;
  const mentorCheckLoading = mentorStatus === null;
  const navigate = useNavigate();
  const { sfiaCapacityMapping, sfiaGrades } = useAppSettings();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allProjects, setAllProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, Partial<UserProfile>>>({});
  const [pendingRemoval, setPendingRemoval] = useState<{ userId: string; projectId: string; projectTitle: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ userId: string; userName: string; newPassword?: string } | null>(null);

  // Check if user is a mentor/delivery and if they have access to this workstream
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  
  useEffect(() => {
    let cancelled = false;
    
    if (!user?.id) {
      setMentorStatus(false);
      setIsDelivery(false);
      return;
    }
    
    const checkRoles = async () => {
      // Check if user has delivery role - delivery gets full access like admin
      const { data: deliveryRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'security_delivery')
        .maybeSingle();
      
      if (cancelled) return;
      
      if (deliveryRole) {
        setIsDelivery(true);
        setMentorStatus(false);
        return;
      }
      
      // Check if user has mentor role
      const { data: mentorRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'security_mentor')
        .maybeSingle();
      
      if (cancelled) return;
      
      if (mentorRole) {
        // Mentors need junction table assignment
        const workstreamEnum = mapWorkstreamToEnum(workstream);
        
        const { data: assignmentData } = await supabase
          .from('user_workstream_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('workstream', workstreamEnum as any)
          .maybeSingle();
        
        if (cancelled) return;
        
        if (assignmentData) {
          setMentorStatus(true);
          return;
        }
      }
      
      if (!cancelled) {
        setMentorStatus(false);
        setIsDelivery(false);
      }
    };
    
    checkRoles();
    
    return () => {
      cancelled = true;
    };
  }, [user?.id, workstream]);

  const canEdit = isSecurityAdmin || isDelivery; // Admins and Delivery can edit

  useEffect(() => {
    if (!permissionLoading && !mentorCheckLoading && !isSecurityAdmin && !isDelivery && !isMentor) {
      navigate("/projects");
    }
  }, [isSecurityAdmin, isDelivery, isMentor, permissionLoading, mentorCheckLoading, navigate]);

  useEffect(() => {
    if (isSecurityAdmin || isDelivery || isMentor) {
      loadTeamData();
    }
  }, [isSecurityAdmin, isDelivery, isMentor, workstream]);

  const loadTeamData = async () => {
    try {
      // Map workstream display name to enum value for query
      const workstreamEnum = mapWorkstreamToEnum(workstream);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .eq("workstream", workstreamEnum as any)
        .order("title");

      if (projectsError) throw projectsError;
      setAllProjects(projectsData || []);

      // Get users directly assigned to workstream via profiles table
      const { data: directProfiles, error: directError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, created_at, last_login, sfia_grade, primary_role, workstream, disabled")
        .eq("workstream", workstreamEnum as any)
        .neq("primary_role", "admin")
        .order("email");

      if (directError) throw directError;

      // Get users assigned via junction table (delivery/mentor)
      const { data: junctionAssignments, error: junctionError } = await supabase
        .from("user_workstream_assignments")
        .select("user_id")
        .eq("workstream", workstreamEnum as any);

      if (junctionError) throw junctionError;

      // Get profiles for junction table users
      let junctionProfiles: any[] = [];
      if (junctionAssignments && junctionAssignments.length > 0) {
        const userIds = junctionAssignments.map(a => a.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, created_at, last_login, sfia_grade, primary_role, workstream, disabled")
          .in("id", userIds)
          .neq("primary_role", "admin")
          .order("email");

        if (profilesError) throw profilesError;
        junctionProfiles = profiles || [];
      }

      // Combine and deduplicate profiles
      const allProfilesMap = new Map<string, any>();
      for (const profile of (directProfiles || [])) {
        allProfilesMap.set(profile.id, profile);
      }
      for (const profile of junctionProfiles) {
        if (!allProfilesMap.has(profile.id)) {
          allProfilesMap.set(profile.id, profile);
        }
      }
      const allProfiles = Array.from(allProfilesMap.values());

      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select(`
          user_id, 
          role, 
          project_id,
          projects(title, fleet_size)
        `);

      if (membersError) throw membersError;

      const userProfiles: UserProfile[] = allProfiles?.map(profile => {
        const userProjects = members?.filter(m => m.user_id === profile.id).map(m => ({
          project_id: m.project_id,
          project_title: (m.projects as any)?.title || "Unknown Project",
          role: m.role as ProjectRole,
          fleet_size: (m.projects as any)?.fleet_size || null
        })) || [];

        return {
          user_id: profile.id,
          email: profile.email || "Unknown",
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_joined: profile.created_at,
          last_login: profile.last_login,
          sfia_grade: profile.sfia_grade,
          primary_role: profile.primary_role as ProjectRole | null,
          workstream: profile.workstream as Workstream | null,
          disabled: profile.disabled || false,
          projects: userProjects
        };
      }) || [];

      setUsers(userProfiles);
      setUnsavedChanges({});
    } catch (error) {
      console.error("Error loading team data:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSfiaGrade = async (userId: string, grade: number | null) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        sfia_grade: grade
      }
    }));
    
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, sfia_grade: grade } : u
    ));
  };

  const updatePrimaryRole = async (userId: string, role: ProjectRole | null) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        primary_role: role
      }
    }));
    
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, primary_role: role } : u
    ));
  };

  const updateWorkstream = async (userId: string, workstream: Workstream | null) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        workstream: workstream
      }
    }));
    
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, workstream: workstream } : u
    ));
  };

  const updateUserProfile = async (userId: string, field: 'first_name' | 'last_name', value: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
    
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, [field]: value } : u
    ));
  };

  const saveUserChanges = async (userId: string) => {
    const changes = unsavedChanges[userId];
    if (!changes) return;

    try {
      // Convert workstream to enum value if it's being updated
      const updateData = { ...changes };
      if (updateData.workstream) {
        updateData.workstream = mapWorkstreamToEnum(updateData.workstream) as any;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData as any)
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("Changes saved successfully");
      
      setUnsavedChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[userId];
        return newChanges;
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    }
  };

  const toggleUserDisabled = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ disabled: !currentStatus })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success(`User ${!currentStatus ? 'disabled' : 'enabled'} successfully`);
      await loadTeamData();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    setResetPasswordDialog({ userId, userName });
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordDialog) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await supabase.functions.invoke('reset-user-password', {
        body: { userId: resetPasswordDialog.userId },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      const newPassword = response.data?.newPassword;
      setResetPasswordDialog({ ...resetPasswordDialog, newPassword });
      
      toast.success("Password reset successfully");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
      setResetPasswordDialog(null);
    }
  };

  const calculateCapacity = (sfiaGrade: number | null, projects: ProjectAssignment[]) => {
    const SFIA_CAPACITY = sfiaCapacityMapping;

    const FLEET_SIZE_COST: Record<string, number> = {
      "X-Wing": 3,
      "Red Dwarf": 5,
      "Enterprise": 8,
      "Star Destroyer": 13,
      "Death Star": 21
    };

    const totalCapacity = sfiaGrade ? SFIA_CAPACITY[sfiaGrade] || 0 : 0;
    const usedCapacity = projects.reduce((sum, project) => {
      const cost = project.fleet_size ? FLEET_SIZE_COST[project.fleet_size] || 0 : 0;
      return sum + cost;
    }, 0);

    const remainingCapacity = totalCapacity - usedCapacity;
    const percentageUsed = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      usedCapacity,
      remainingCapacity,
      percentageUsed
    };
  };

  const assignProjectRole = async (userId: string, projectId: string, role: ProjectRole) => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from("project_members")
        .select("id, role")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const { error } = await supabase
          .from("project_members")
          .update({ role: role as any })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("project_members")
          .insert({
            user_id: userId,
            project_id: projectId,
            role: role as any
          });

        if (error) throw error;
      }

      toast.success("Project role assigned");
      await loadTeamData();
    } catch (error) {
      console.error("Error assigning project role:", error);
      toast.error("Failed to assign project role");
    }
  };

  const removeProjectAssignment = async (userId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);

      if (error) throw error;
      toast.success("Project assignment removed");
      await loadTeamData();
    } catch (error) {
      console.error("Error removing project:", error);
      toast.error("Failed to remove project");
    }
  };

  if (permissionLoading || mentorCheckLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading team data...</p>
      </div>
    );
  }

  if (!isSecurityAdmin && !isDelivery && !isMentor) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view this workstream's team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.sfia_grade?.toString().includes(searchLower) ||
      user.primary_role?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">{workstream} Team</h2>
          <p className="text-muted-foreground">
            {canEdit ? "Manage user profiles, roles, and project assignments for" : "View user profiles and project assignments for"} {workstream} workstream
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => navigate("/create-user")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name, email, role, or SFIA grade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          const hasUnsavedChanges = !!unsavedChanges[userData.user_id];
          const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'Unnamed User';
          const capacity = calculateCapacity(userData.sfia_grade, userData.projects);
          
          return (
            <Card key={userData.user_id} className={userData.disabled ? "opacity-60" : ""}>
              <CardHeader>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <OnlineIndicator isOnline={isUserOnline(userData.user_id)} />
                    <h3 className="text-lg font-semibold">{fullName}</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Capacity: {capacity.usedCapacity}/{capacity.totalCapacity}</span>
                      <span>{Math.round(capacity.percentageUsed)}% used</span>
                    </div>
                    <Progress 
                      value={capacity.percentageUsed} 
                      className={cn(
                        "h-2",
                        capacity.percentageUsed > 100 && "bg-destructive/20"
                      )}
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {userData.disabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-md">
                        <Ban className="h-3 w-3" />
                        User Disabled
                      </span>
                    )}
                    {!userData.disabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-md">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  {canEdit && hasUnsavedChanges && (
                    <Button 
                      size="sm" 
                      onClick={() => saveUserChanges(userData.user_id)}
                      className="gap-1 w-full"
                    >
                      <Save className="h-3 w-3" />
                      Save Changes
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name</label>
                    <input
                      type="text"
                      value={userData.first_name || ""}
                      onChange={(e) => updateUserProfile(userData.user_id, 'first_name', e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
                    <input
                      type="text"
                      value={userData.last_name || ""}
                      onChange={(e) => updateUserProfile(userData.user_id, 'last_name', e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Date Joined</label>
                    <p className="text-sm">{new Date(userData.date_joined).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Last Logged In</label>
                    <p className="text-sm">
                      {userData.last_login 
                        ? new Date(userData.last_login).toLocaleString()
                        : "Never"
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <p className="text-sm break-all">{userData.email}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">SFIA Grade</label>
                  <Select
                    value={userData.sfia_grade?.toString() || "none"}
                    onValueChange={(value) => 
                      updateSfiaGrade(userData.user_id, value === "none" ? null : parseInt(value))
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      {sfiaGrades.map((grade) => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Primary Role</label>
                  <Select
                    value={userData.primary_role || "none"}
                    onValueChange={(value) => 
                      updatePrimaryRole(userData.user_id, value === "none" ? null : value as ProjectRole)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="none">Not assigned</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="security_architect">Security Architect</SelectItem>
                        <SelectItem value="risk_manager">Risk Manager</SelectItem>
                        <SelectItem value="sec_mon">Sec Mon</SelectItem>
                        <SelectItem value="sec_eng">Sec Eng</SelectItem>
                        <SelectItem value="sa_mentor">SA Mentor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Workstream</label>
                  <Select
                    value={userData.workstream ? mapWorkstreamToEnum(userData.workstream) : "none"}
                    onValueChange={(value) => 
                      updateWorkstream(userData.user_id, value === "none" ? null : value as Workstream)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select workstream">
                        {userData.workstream ? mapEnumToWorkstream(mapWorkstreamToEnum(userData.workstream) as any) : "Not assigned"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">Not assigned</SelectItem>
                      <SelectItem value="Mig">Migration</SelectItem>
                      <SelectItem value="IE">IE</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Sea">Sea</SelectItem>
                      <SelectItem value="Plat">Platforms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">Project Assignments</label>
                <div className="space-y-3">
                  {userData.projects.map((assignment) => {
                    const availableProjects = allProjects.filter(p => 
                      !userData.projects.some(up => up.project_id === p.id) || 
                      assignment?.project_id === p.id
                    );
                    
                    return (
                      <div key={assignment.project_id} className="flex items-center gap-3">
                        <Select
                          value={assignment?.project_id || "none"}
                          onValueChange={(value) => {
                            if (value === "none" && assignment) {
                              const project = allProjects.find(p => p.id === assignment.project_id);
                              setPendingRemoval({
                                userId: userData.user_id,
                                projectId: assignment.project_id,
                                projectTitle: project?.title || "Unknown Project"
                              });
                            } else if (value !== "none") {
                              assignProjectRole(userData.user_id, value, "security_architect");
                            }
                          }}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="flex-1 bg-background">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="none">No project</SelectItem>
                            {availableProjects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={assignment?.role || "none"}
                          onValueChange={(value) => {
                            if (value !== "none" && assignment?.project_id) {
                              assignProjectRole(userData.user_id, assignment.project_id, value as ProjectRole);
                            }
                          }}
                          disabled={!canEdit || !assignment}
                        >
                          <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="security_architect">Security Architect</SelectItem>
                            <SelectItem value="risk_manager">Information Assurer</SelectItem>
                            <SelectItem value="soc">SOC</SelectItem>
                            <SelectItem value="project_delivery">Project Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3">
                    <Select
                      value="none"
                      onValueChange={(value) => {
                        if (value !== "none") {
                          assignProjectRole(userData.user_id, value, "security_architect");
                        }
                      }}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className="flex-1 bg-background">
                        <SelectValue placeholder="Add new project" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="none">No project</SelectItem>
                        {allProjects.filter(p => 
                          !userData.projects.some(up => up.project_id === p.id)
                        ).map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value="none"
                      disabled={true}
                    >
                      <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="security_architect">Security Architect</SelectItem>
                        <SelectItem value="risk_manager">Information Assurer</SelectItem>
                        <SelectItem value="soc">SOC</SelectItem>
                        <SelectItem value="project_delivery">Project Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Reset Password and Disable User Buttons at Bottom - Admin Only */}
              {canEdit && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResetPassword(userData.user_id, [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'User')}
                    className="w-full"
                  >
                    Reset Password
                  </Button>
                  <Button
                    size="sm"
                    variant={userData.disabled ? "default" : "destructive"}
                    onClick={() => toggleUserDisabled(userData.user_id, userData.disabled)}
                    className="w-full"
                  >
                    {userData.disabled ? "Enable User" : "Disable User"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}

        {users.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No users found in {workstream} workstream</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Project Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from <strong>{pendingRemoval?.projectTitle}</strong>? 
              This will revoke their access to the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemoval) {
                  removeProjectAssignment(pendingRemoval.userId, pendingRemoval.projectId);
                  setPendingRemoval(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <AlertDialog open={resetPasswordDialog !== null} onOpenChange={(open) => !open && setResetPasswordDialog(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetPasswordDialog?.newPassword ? "Password Reset Complete" : "Reset User Password"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetPasswordDialog?.newPassword ? (
                <div className="space-y-3">
                  <p>The password for <strong>{resetPasswordDialog.userName}</strong> has been reset to:</p>
                  <div className="p-4 bg-muted rounded-md font-mono text-lg text-center">
                    {resetPasswordDialog.newPassword}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please save this password and share it securely with the user. They will be required to change it on their next login.
                  </p>
                </div>
              ) : (
                <>
                  Are you sure you want to reset the password for <strong>{resetPasswordDialog?.userName}</strong>?
                  <br /><br />
                  This will generate a new random password and require the user to change it on their next login.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {resetPasswordDialog?.newPassword ? (
              <AlertDialogAction onClick={() => setResetPasswordDialog(null)}>
                Close
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmResetPassword}>
                  Reset Password
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
