import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS, ProjectRole } from "@/hooks/useProjectMembers";
import { ShieldAlert, Save, Ban, CheckCircle, UserPlus, Pencil } from "lucide-react";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mapWorkstreamToEnum, mapEnumToWorkstream } from "@/lib/workstreamMapping";
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

type Workstream = "Mig" | "IE" | "Land" | "Sea" | "Plat";

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
  workstream_assignments: Workstream[];
  disabled: boolean;
  projects: ProjectAssignment[];
}

export default function ManageTeam() {
  const { workstreams, sfiaCapacityMapping, sfiaGrades } = useAppSettings();
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const { isUserOnline } = useOnlineUsers();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allProjects, setAllProjects] = useState<Array<{ id: string; title: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, Partial<UserProfile>>>({});
  const [pendingRemoval, setPendingRemoval] = useState<{ userId: string; projectId: string; projectTitle: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ userId: string; userName: string; newPassword?: string } | null>(null);
  const [editUserDialog, setEditUserDialog] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const [editWorkstreamAssignments, setEditWorkstreamAssignments] = useState<Workstream[]>([]);

  useEffect(() => {
    if (!permissionLoading && !isSecurityAdmin) {
      navigate("/projects");
    }
  }, [isSecurityAdmin, permissionLoading, navigate]);

  useEffect(() => {
    if (isSecurityAdmin) {
      loadTeamData();
    }
  }, [isSecurityAdmin]);

  const loadTeamData = async () => {
    try {
      // Get all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");

      if (projectsError) throw projectsError;
      setAllProjects(projectsData || []);

      // Get all users with SFIA grade and primary role
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, created_at, last_login, sfia_grade, primary_role, workstream, disabled")
        .order("email");

      if (profilesError) throw profilesError;

      // Get all project memberships with fleet sizes
      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select(`
          user_id, 
          role, 
          project_id,
          projects(title, fleet_size)
        `);

      if (membersError) throw membersError;

      // Get workstream assignments for delivery/mentor users
      const { data: workstreamAssignments, error: wsError } = await supabase
        .from("user_workstream_assignments")
        .select("user_id, workstream");
      
      if (wsError) console.error("Error fetching workstream assignments:", wsError);

      // Map users with their project assignments and workstream assignments
      const userProfiles: UserProfile[] = allProfiles?.map(profile => {
        const userProjects = members?.filter(m => m.user_id === profile.id).map(m => ({
          project_id: m.project_id,
          project_title: (m.projects as any)?.title || "Unknown Project",
          role: m.role as ProjectRole,
          fleet_size: (m.projects as any)?.fleet_size || null
        })) || [];

        const userWsAssignments = workstreamAssignments?.filter(wa => wa.user_id === profile.id)
          .map(wa => mapEnumToWorkstream(wa.workstream as any) as Workstream) || [];

        return {
          user_id: profile.id,
          email: profile.email || "Unknown",
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_joined: profile.created_at,
          last_login: profile.last_login,
          sfia_grade: profile.sfia_grade,
          primary_role: profile.primary_role as ProjectRole | null,
          workstream: profile.workstream ? mapEnumToWorkstream(profile.workstream as any) as Workstream : null,
          workstream_assignments: userWsAssignments,
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
    
    // Update local state immediately
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
    
    // Update local state immediately
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
    
    // Update local state immediately
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, workstream: workstream } : u
    ));
  };

  const addWorkstreamAssignment = async (userId: string, workstream: Workstream) => {
    try {
      const { error } = await supabase
        .from("user_workstream_assignments")
        .insert({
          user_id: userId,
          workstream: mapWorkstreamToEnum(workstream)
        });

      if (error) throw error;
      
      toast.success("Workstream assigned");
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId 
          ? { ...u, workstream_assignments: [...u.workstream_assignments, workstream] }
          : u
      ));
    } catch (error) {
      console.error("Error adding workstream assignment:", error);
      toast.error("Failed to assign workstream");
    }
  };

  const removeWorkstreamAssignment = async (userId: string, workstream: Workstream) => {
    try {
      const { error } = await supabase
        .from("user_workstream_assignments")
        .delete()
        .eq("user_id", userId)
        .eq("workstream", mapWorkstreamToEnum(workstream));

      if (error) throw error;
      
      toast.success("Workstream removed");
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId 
          ? { ...u, workstream_assignments: u.workstream_assignments.filter(w => w !== workstream) }
          : u
      ));
    } catch (error) {
      console.error("Error removing workstream assignment:", error);
      toast.error("Failed to remove workstream");
    }
  };

  const updateUserProfile = async (userId: string, field: 'first_name' | 'last_name', value: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
    
    // Update local state immediately
    setUsers(prev => prev.map(u => 
      u.user_id === userId ? { ...u, [field]: value } : u
    ));
  };

  const saveUserChanges = async (userId: string) => {
    const changes = unsavedChanges[userId];
    if (!changes) return;

    try {
      // Convert workstream display name to database enum value if present
      const updatedChanges = { ...changes };
      if (updatedChanges.workstream) {
        updatedChanges.workstream = mapWorkstreamToEnum(updatedChanges.workstream) as any;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedChanges as any)
        .eq("id", userId);

      if (error) throw error;
      
      toast.success("Changes saved successfully");
      
      // Clear unsaved changes for this user
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

  const openEditDialog = (user: UserProfile) => {
    setEditUserDialog(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      sfia_grade: user.sfia_grade,
      primary_role: user.primary_role,
      workstream: user.workstream,
    });
    setEditWorkstreamAssignments(user.workstream_assignments || []);
  };

  const isDeliveryOrMentor = (role: string | null | undefined): boolean => {
    return role === 'delivery' || role === 'sa_mentor';
  };

  const saveEditDialog = async () => {
    if (!editUserDialog) return;

    try {
      const updatedChanges: any = { ...editFormData };
      
      // For non-delivery/mentor users, update the single workstream field
      if (!isDeliveryOrMentor(editFormData.primary_role)) {
        if (updatedChanges.workstream) {
          updatedChanges.workstream = mapWorkstreamToEnum(updatedChanges.workstream);
        }
      } else {
        // For delivery/mentor, set workstream to null since they use the junction table
        updatedChanges.workstream = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updatedChanges)
        .eq("id", editUserDialog.user_id);

      if (error) throw error;

      // For delivery/mentor users, update workstream assignments
      if (isDeliveryOrMentor(editFormData.primary_role)) {
        // Delete existing assignments
        await supabase
          .from("user_workstream_assignments")
          .delete()
          .eq("user_id", editUserDialog.user_id);

        // Insert new assignments
        if (editWorkstreamAssignments.length > 0) {
          const assignments = editWorkstreamAssignments.map(ws => ({
            user_id: editUserDialog.user_id,
            workstream: mapWorkstreamToEnum(ws)
          }));

          const { error: insertError } = await supabase
            .from("user_workstream_assignments")
            .insert(assignments);

          if (insertError) throw insertError;
        }
      }
      
      toast.success("User updated successfully");
      setEditUserDialog(null);
      await loadTeamData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
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
      // Check if user already has this project assigned
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

  if (permissionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading team data...</p>
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
              Only Security Admins can access team management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team Management</h2>
          <p className="text-muted-foreground">
            Manage user profiles, roles, and project assignments
          </p>
        </div>
        <Button onClick={() => navigate("/create-user")}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name, email, role, workstream, or SFIA grade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.filter(user => {
          const searchLower = searchTerm.toLowerCase();
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
          return (
            fullName.includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.sfia_grade?.toString().includes(searchLower) ||
            user.primary_role?.toLowerCase().includes(searchLower) ||
            user.workstream?.toLowerCase().includes(searchLower)
          );
        }).map((userData) => {
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(userData)}
                    className="gap-1 w-full"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit User
                  </Button>
                  {hasUnsavedChanges && (
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
              {/* SFIA Grade, Primary Role, and Workstream */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">SFIA Grade</label>
                  <Select
                    value={userData.sfia_grade?.toString() || "none"}
                    onValueChange={(value) => 
                      updateSfiaGrade(userData.user_id, value === "none" ? null : parseInt(value))
                    }
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
                  <label className="text-sm font-medium mb-2 block">
                    Workstream{isDeliveryOrMentor(userData.primary_role) ? 's' : ''}
                  </label>
                  {isDeliveryOrMentor(userData.primary_role) ? (
                    <div className="space-y-2">
                      {/* Show dropdowns for each assigned workstream */}
                      {userData.workstream_assignments.map((ws, index) => {
                        const availableForThis = workstreams.filter(w => 
                          !userData.workstream_assignments.includes(w as Workstream) || w === ws
                        );
                        return (
                          <Select
                            key={`${userData.user_id}-ws-${index}`}
                            value={ws}
                            onValueChange={async (value) => {
                              if (value === "none") {
                                // Remove this workstream
                                await removeWorkstreamAssignment(userData.user_id, ws);
                              } else if (value !== ws) {
                                // Replace with new workstream
                                await removeWorkstreamAssignment(userData.user_id, ws);
                                await addWorkstreamAssignment(userData.user_id, value as Workstream);
                              }
                            }}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select workstream" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="none">Remove workstream</SelectItem>
                              {availableForThis.map(w => (
                                <SelectItem key={w} value={w}>{w}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })}
                      {/* Show another dropdown to add more if there are available workstreams */}
                      {userData.workstream_assignments.length < workstreams.length && (
                        <Select
                          value="none"
                          onValueChange={async (value) => {
                            if (value !== "none") {
                              await addWorkstreamAssignment(userData.user_id, value as Workstream);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Add workstream..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="none" disabled>Select a workstream</SelectItem>
                            {workstreams
                              .filter(w => !userData.workstream_assignments.includes(w as Workstream))
                              .map(w => (
                                <SelectItem key={w} value={w}>{w}</SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      )}
                      {userData.workstream_assignments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No workstreams assigned</p>
                      )}
                    </div>
                  ) : (
                    <Select
                      value={userData.workstream || "none"}
                      onValueChange={(value) => 
                        updateWorkstream(userData.user_id, value === "none" ? null : value as Workstream)
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select workstream" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="none">Not assigned</SelectItem>
                        {workstreams.map(ws => (
                          <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Project Assignments - Hidden for delivery/mentor users */}
              {!isDeliveryOrMentor(userData.primary_role) && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Project Assignments</label>
                  <div className="space-y-3">
                    {/* Show existing projects */}
                    {userData.projects.map((assignment, index) => {
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
                            disabled={!assignment}
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
                    
                    {/* Show one empty slot for new project */}
                    <div className="flex items-center gap-3">
                      <Select
                        value="none"
                        onValueChange={(value) => {
                          if (value !== "none") {
                            assignProjectRole(userData.user_id, value, "security_architect");
                          }
                        }}
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
              )}

              {/* Workstream Assignments display for delivery/mentor users */}
              {isDeliveryOrMentor(userData.primary_role) && userData.workstream_assignments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Workstream Assignments</label>
                  <div className="flex flex-wrap gap-2">
                    {userData.workstream_assignments.map(ws => (
                      <span key={ws} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                        {ws}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Password and Disable User Buttons at Bottom */}
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
            </CardContent>
          </Card>
          );
        })}

        {users.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog for Project Removal */}
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

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog !== null} onOpenChange={(open) => !open && setEditUserDialog(null)}>
        <DialogContent className="bg-background max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={editFormData.first_name || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={editFormData.last_name || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editUserDialog?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label>SFIA Grade</Label>
              <Select
                value={editFormData.sfia_grade?.toString() || "none"}
                onValueChange={(value) => 
                  setEditFormData(prev => ({ ...prev, sfia_grade: value === "none" ? null : parseInt(value) }))
                }
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
            <div className="space-y-2">
              <Label>Primary Role</Label>
              <Select
                value={editFormData.primary_role || "none"}
                onValueChange={(value) => {
                  const newRole = value === "none" ? null : value as ProjectRole;
                  const wasDeliveryOrMentor = isDeliveryOrMentor(editFormData.primary_role);
                  const willBeDeliveryOrMentor = isDeliveryOrMentor(newRole);
                  
                  // When switching TO delivery/mentor, copy existing workstream to assignments
                  if (!wasDeliveryOrMentor && willBeDeliveryOrMentor && editFormData.workstream) {
                    setEditWorkstreamAssignments([editFormData.workstream]);
                  }
                  // When switching FROM delivery/mentor, copy first assignment to single workstream
                  else if (wasDeliveryOrMentor && !willBeDeliveryOrMentor && editWorkstreamAssignments.length > 0) {
                    setEditFormData(prev => ({ ...prev, primary_role: newRole, workstream: editWorkstreamAssignments[0] }));
                    return;
                  }
                  
                  setEditFormData(prev => ({ ...prev, primary_role: newRole }));
                }}
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
            <div className="space-y-2">
              <Label>Workstream{isDeliveryOrMentor(editFormData.primary_role) ? 's' : ''}</Label>
              {isDeliveryOrMentor(editFormData.primary_role) ? (
                <div className="space-y-2">
                  {/* Show dropdowns for each assigned workstream */}
                  {editWorkstreamAssignments.map((ws, index) => {
                    const availableForThis = workstreams.filter(w => 
                      !editWorkstreamAssignments.includes(w as Workstream) || w === ws
                    );
                    return (
                      <Select
                        key={index}
                        value={ws}
                        onValueChange={(value) => {
                          if (value === "none") {
                            // Remove this workstream
                            setEditWorkstreamAssignments(prev => prev.filter((_, i) => i !== index));
                          } else {
                            // Update this workstream
                            setEditWorkstreamAssignments(prev => 
                              prev.map((w, i) => i === index ? value as Workstream : w)
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select workstream" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="none">Remove workstream</SelectItem>
                          {availableForThis.map(w => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })}
                  {/* Show another dropdown to add more if there are available workstreams */}
                  {editWorkstreamAssignments.length < workstreams.length && (
                    <Select
                      value="none"
                      onValueChange={(value) => {
                        if (value !== "none") {
                          setEditWorkstreamAssignments(prev => [...prev, value as Workstream]);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Add workstream..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="none" disabled>Select a workstream</SelectItem>
                        {workstreams
                          .filter(w => !editWorkstreamAssignments.includes(w as Workstream))
                          .map(w => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  )}
                  {editWorkstreamAssignments.length === 0 && (
                    <p className="text-xs text-muted-foreground">Select at least one workstream</p>
                  )}
                </div>
              ) : (
                <Select
                  value={editFormData.workstream || "none"}
                  onValueChange={(value) => 
                    setEditFormData(prev => ({ ...prev, workstream: value === "none" ? null : value as Workstream }))
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select workstream" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="none">Not assigned</SelectItem>
                    {workstreams.map(ws => (
                      <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog(null)}>Cancel</Button>
            <Button onClick={saveEditDialog}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
