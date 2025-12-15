import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, UserPlus } from "lucide-react";
import { z } from "zod";
import { useAppSettings } from "@/hooks/useAppSettings";
import { mapWorkstreamToEnum } from "@/lib/workstreamMapping";

const userSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  sfiaGrade: z.number().min(3).max(7),
  primaryRole: z.string().min(1, "Primary role is required"),
  workstream: z.string().min(1, "Workstream is required"),
});

export default function CreateUser() {
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  const { workstreams, sfiaGrades, projectRoles } = useAppSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sfiaGrade, setSfiaGrade] = useState<number | null>(null);
  const [primaryRole, setPrimaryRole] = useState<string>("");
  const [workstream, setWorkstream] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permissionLoading && !isSecurityAdmin) {
      navigate("/projects");
    }
  }, [isSecurityAdmin, permissionLoading, navigate]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      userSchema.parse({ 
        email, 
        password, 
        firstName, 
        lastName, 
        sfiaGrade, 
        primaryRole, 
        workstream 
      });

      // Store current session before creating new user
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Create user via Supabase Auth with user metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("This email is already registered.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Update the user's profile with additional information
        const workstreamDbValue = mapWorkstreamToEnum(workstream);
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            sfia_grade: sfiaGrade,
            primary_role: primaryRole as any,
            workstream: workstreamDbValue as any,
          })
          .eq("id", data.user.id);

        if (profileError) {
          toast.error("User created but profile update failed. Please update manually.");
          return;
        }

        // Restore the admin's session
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          });
        }

        toast.success("User created successfully! They can now log in.");
        
        // Navigate back to previous page
        navigate(-1);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (permissionLoading) {
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
              Only Security Admins can create new users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create New User</h2>
        <p className="text-muted-foreground">
          Create a new user account. They can then be added to projects with specific roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Username will be automatically created from the part before @ (e.g., user@example.com → username: "user")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                The user can change this password after their first login
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sfiaGrade">SFIA Grade</Label>
                <Select 
                  value={sfiaGrade?.toString() || ""} 
                  onValueChange={(value) => setSfiaGrade(parseInt(value))}
                  required
                >
                  <SelectTrigger id="sfiaGrade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {sfiaGrades.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workstream">Workstream</Label>
                <Select value={workstream} onValueChange={setWorkstream} required>
                  <SelectTrigger id="workstream">
                    <SelectValue placeholder="Select workstream" />
                  </SelectTrigger>
                  <SelectContent>
                    {workstreams.map((ws) => (
                      <SelectItem key={ws} value={ws}>
                        {ws}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryRole">Primary Role</Label>
              <Select value={primaryRole} onValueChange={setPrimaryRole} required>
                <SelectTrigger id="primaryRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectRoles).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating User..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
