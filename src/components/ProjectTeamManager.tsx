import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProjectMembers, ProjectRole, ROLE_LABELS } from "@/hooks/useProjectMembers";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { Users, Trash2, UserPlus } from "lucide-react";
import { getUserDisplayName } from "@/lib/userUtils";
import { supabase } from "@/integrations/supabase/client";
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

interface ProjectTeamManagerProps {
  projectId: string;
  userId: string;
}

interface AvailableUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  primary_role: string;
  workstream: string;
}

export const ProjectTeamManager = ({ projectId, userId }: ProjectTeamManagerProps) => {
  const { members, isLoading, addMember, removeMember, updateMemberRole } = useProjectMembers(projectId);
  const { permissions } = useProjectPermissions(projectId, userId);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>("security_architect");
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [projectWorkstream, setProjectWorkstream] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadProjectWorkstream();
  }, [projectId]);

  useEffect(() => {
    if (projectWorkstream) {
      loadAvailableUsers();
    }
  }, [newMemberRole, projectWorkstream, members]);

  const loadProjectWorkstream = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("workstream")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProjectWorkstream(data?.workstream || null);
    } catch (error) {
      console.error("Error loading project workstream:", error);
    }
  };

  const loadAvailableUsers = async () => {
    if (!projectWorkstream) return;
    
    setLoadingUsers(true);
    try {
      // Map project role to organizational role (primary_role in profiles)
      const roleMapping: Record<ProjectRole, string> = {
        delivery: "delivery",
        security_architect: "security_architect",
        risk_manager: "risk_manager",
        sec_mon: "sec_mon",
        sec_eng: "sec_eng"
      };

      const primaryRole = roleMapping[newMemberRole];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, primary_role, workstream")
        .eq("workstream", projectWorkstream as any)
        .eq("primary_role", primaryRole as any)
        .eq("disabled", false)
        .order("email");

      if (error) throw error;

      // Filter out users who are already members
      const memberUserIds = new Set(members.map(m => m.user_id));
      const filtered = (data || []).filter(user => !memberUserIds.has(user.id));
      
      setAvailableUsers(filtered as AvailableUser[]);
    } catch (error) {
      console.error("Error loading available users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberUserId) return;

    const selectedUser = availableUsers.find(u => u.id === newMemberUserId);
    if (!selectedUser) return;

    await addMember(selectedUser.email, newMemberRole);
    setNewMemberUserId("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {permissions.canManageTeam && (
          <form onSubmit={handleAddMember} className="space-y-4 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select value={newMemberRole} onValueChange={(value) => {
                  setNewMemberRole(value as ProjectRole);
                  setNewMemberUserId("");
                }}>
                  <SelectTrigger id="member-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="security_architect">Security Architect</SelectItem>
                    <SelectItem value="risk_manager">Risk Manager</SelectItem>
                    <SelectItem value="sec_mon">Sec Mon</SelectItem>
                    <SelectItem value="sec_eng">Sec Eng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-user">User</Label>
                <Select 
                  value={newMemberUserId} 
                  onValueChange={setNewMemberUserId}
                  disabled={loadingUsers || availableUsers.length === 0}
                >
                  <SelectTrigger id="member-user">
                    <SelectValue placeholder={
                      loadingUsers ? "Loading users..." : 
                      availableUsers.length === 0 ? "No available users" :
                      "Select a user"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserDisplayName(user.first_name, user.last_name)} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={!newMemberUserId}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {getUserDisplayName(member.first_name, member.last_name)}
                </p>
                <div className="mt-1">
                  {permissions.canManageTeam && member.role !== "delivery" ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateMemberRole(member.id, value as ProjectRole)}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security_architect">Security Architect</SelectItem>
                        <SelectItem value="risk_manager">Risk Manager</SelectItem>
                        <SelectItem value="sec_mon">Sec Mon</SelectItem>
                        <SelectItem value="sec_eng">Sec Eng</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                  )}
                </div>
              </div>
              {permissions.canManageTeam && member.role !== "delivery" && (
                <AlertDialog open={deleteMemberId === member.id} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteMemberId(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove <strong>
                          {getUserDisplayName(member.first_name, member.last_name)}
                        </strong> from this project? 
                        This will revoke their access to the project.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          removeMember(member.id);
                          setDeleteMemberId(null);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
