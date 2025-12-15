import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, UserCog, Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getUserDisplayName } from "@/lib/userUtils";

type AppRole = "security_admin" | "security_user" | "security_delivery" | "security_mentor";

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  primary_role: string;
  workstream: string;
  system_roles: AppRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  security_admin: "Security Admin",
  security_user: "Security User",
  security_delivery: "Security Delivery",
  security_mentor: "Security Mentor"
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  security_admin: "Full system administrator with access to all features",
  security_user: "Standard user with basic project access",
  security_delivery: "Delivery team member with project creation rights",
  security_mentor: "Mentor with advisory access and guidance capabilities"
};

export default function SystemRoles() {
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (!permissionLoading && !isSecurityAdmin) {
      navigate("/home");
    }
  }, [isSecurityAdmin, permissionLoading, navigate]);

  useEffect(() => {
    if (isSecurityAdmin) {
      loadUsers();
    }
  }, [isSecurityAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get all users with their profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, primary_role, workstream")
        .eq("disabled", false)
        .order("email");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => {
        const userRoles = (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role as AppRole);

        return {
          ...profile,
          system_roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const addRoleToUser = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("User already has this role");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Role added successfully");
      loadUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Failed to add role");
    }
  };

  const removeRoleFromUser = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast.success("Role removed successfully");
      loadUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
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
              Only Security Admins can manage system authorisation roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">System Authorisation Roles</h2>
        <p className="text-muted-foreground">
          Manage system-wide permissions for users. These roles control access to administrative features.
        </p>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(Object.entries(ROLE_LABELS) as [AppRole, string][]).map(([role, label]) => (
          <Card key={role}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User System Roles
          </CardTitle>
          <CardDescription>
            View and manage system authorisation roles for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organisational Role</TableHead>
                <TableHead>Workstream</TableHead>
                <TableHead>System Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {getUserDisplayName(user.first_name, user.last_name)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.primary_role || "Not set"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.workstream || "Not set"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.system_roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No roles</span>
                      ) : (
                        user.system_roles.map(role => (
                          <div key={role} className="flex items-center gap-1">
                            <Badge variant="default">
                              {ROLE_LABELS[role]}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove the <strong>{ROLE_LABELS[role]}</strong> role from{" "}
                                    <strong>{getUserDisplayName(user.first_name, user.last_name)}</strong>?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeRoleFromUser(user.id, role)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Select
                        value={selectedUser === user.id && selectedRole ? selectedRole : ""}
                        onValueChange={(value) => {
                          setSelectedUser(user.id);
                          setSelectedRole(value as AppRole);
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(ROLE_LABELS) as [AppRole, string][])
                            .filter(([role]) => !user.system_roles.includes(role))
                            .map(([role, label]) => (
                              <SelectItem key={role} value={role}>
                                {label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedUser === user.id && selectedRole) {
                            addRoleToUser(user.id, selectedRole);
                            setSelectedUser(null);
                            setSelectedRole(null);
                          }
                        }}
                        disabled={selectedUser !== user.id || !selectedRole}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
