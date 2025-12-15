import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Users, FolderKanban, Gauge } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

type Workstream = "Mig" | "IE" | "Land" | "Sea" | "Plat";
type RoleFilter = "risk_manager" | "security_architect" | "soc" | "security_admin" | "security_delivery";

interface DashboardMetrics {
  totalProjects: number;
  projectsByWorkstream: Record<string, number>;
  totalTeamSize: number;
  teamByWorkstream: Record<string, number>;
  teamByRole: Record<string, number>;
  capacityByWorkstream: Record<string, { total: number; used: number; remaining: number }>;
  capacityByRole: Record<string, { total: number; used: number; remaining: number }>;
}

const FLEET_SIZE_COST: Record<string, number> = {
  "X-Wing": 3,
  "Red Dwarf": 5,
  "Enterprise": 8,
  "Star Destroyer": 13,
  "Death Star": 21
};

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sfiaCapacityMapping } = useAppSettings();
  
  const SFIA_CAPACITY = sfiaCapacityMapping;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  const loadMetrics = async () => {
    try {
      // Get all projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, workstream, fleet_size");

      if (projectsError) throw projectsError;

      // Get all profiles with roles and workstreams
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, primary_role, workstream, sfia_grade, disabled");

      if (profilesError) throw profilesError;

      // Get all project memberships
      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select("user_id, project_id, projects(fleet_size)");

      if (membersError) throw membersError;

      // Calculate metrics
      const totalProjects = projects?.length || 0;

      // Projects by workstream
      const projectsByWorkstream: Record<string, number> = {};
      projects?.forEach(project => {
        if (project.workstream) {
          projectsByWorkstream[project.workstream] = (projectsByWorkstream[project.workstream] || 0) + 1;
        }
      });

      // Active team members only (not disabled)
      const activeProfiles = profiles?.filter(p => !p.disabled) || [];
      const totalTeamSize = activeProfiles.length;

      // Team by workstream
      const teamByWorkstream: Record<string, number> = {};
      activeProfiles.forEach(profile => {
        if (profile.workstream) {
          teamByWorkstream[profile.workstream] = (teamByWorkstream[profile.workstream] || 0) + 1;
        }
      });

      // Team by role (filtered roles only)
      const roleFilter: RoleFilter[] = ["risk_manager", "security_architect", "soc", "security_admin", "security_delivery"];
      const teamByRole: Record<string, number> = {};
      activeProfiles.forEach(profile => {
        if (profile.primary_role && roleFilter.includes(profile.primary_role as RoleFilter)) {
          teamByRole[profile.primary_role] = (teamByRole[profile.primary_role] || 0) + 1;
        }
      });

      // Calculate capacity by workstream
      const capacityByWorkstream: Record<string, { total: number; used: number; remaining: number }> = {};
      activeProfiles.forEach(profile => {
        if (profile.workstream) {
          if (!capacityByWorkstream[profile.workstream]) {
            capacityByWorkstream[profile.workstream] = { total: 0, used: 0, remaining: 0 };
          }

          const totalCapacity = profile.sfia_grade ? SFIA_CAPACITY[profile.sfia_grade] || 0 : 0;
          capacityByWorkstream[profile.workstream].total += totalCapacity;

          // Calculate used capacity for this user
          const userProjects = members?.filter(m => m.user_id === profile.id) || [];
          const usedCapacity = userProjects.reduce((sum, member) => {
            const fleetSize = (member.projects as any)?.fleet_size;
            const cost = fleetSize ? FLEET_SIZE_COST[fleetSize] || 0 : 0;
            return sum + cost;
          }, 0);

          capacityByWorkstream[profile.workstream].used += usedCapacity;
        }
      });

      // Calculate remaining capacity
      Object.keys(capacityByWorkstream).forEach(ws => {
        capacityByWorkstream[ws].remaining = capacityByWorkstream[ws].total - capacityByWorkstream[ws].used;
      });

      // Calculate capacity by role (filtered roles only)
      const capacityByRole: Record<string, { total: number; used: number; remaining: number }> = {};
      activeProfiles.forEach(profile => {
        if (profile.primary_role && roleFilter.includes(profile.primary_role as RoleFilter)) {
          if (!capacityByRole[profile.primary_role]) {
            capacityByRole[profile.primary_role] = { total: 0, used: 0, remaining: 0 };
          }

          const totalCapacity = profile.sfia_grade ? SFIA_CAPACITY[profile.sfia_grade] || 0 : 0;
          capacityByRole[profile.primary_role].total += totalCapacity;

          // Calculate used capacity for this user
          const userProjects = members?.filter(m => m.user_id === profile.id) || [];
          const usedCapacity = userProjects.reduce((sum, member) => {
            const fleetSize = (member.projects as any)?.fleet_size;
            const cost = fleetSize ? FLEET_SIZE_COST[fleetSize] || 0 : 0;
            return sum + cost;
          }, 0);

          capacityByRole[profile.primary_role].used += usedCapacity;
        }
      });

      // Calculate remaining capacity by role
      Object.keys(capacityByRole).forEach(role => {
        capacityByRole[role].remaining = capacityByRole[role].total - capacityByRole[role].used;
      });

      setMetrics({
        totalProjects,
        projectsByWorkstream,
        totalTeamSize,
        teamByWorkstream,
        teamByRole,
        capacityByWorkstream,
        capacityByRole
      });
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    risk_manager: "Information Assurer",
    security_architect: "Security Architect",
    soc: "SOC",
    security_admin: "Security Admin",
    security_delivery: "Security Delivery"
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of projects, team, and capacity metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTeamSize}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(metrics.capacityByWorkstream).reduce((sum, c) => sum + c.remaining, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Remaining capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects by Workstream */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Projects by Workstream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.projectsByWorkstream).map(([workstream, count]) => (
              <div key={workstream} className="flex items-center justify-between">
                <span className="font-medium">{workstream}</span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(metrics.projectsByWorkstream).length === 0 && (
              <p className="text-muted-foreground text-sm">No projects with workstreams assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members by Workstream */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members by Workstream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.teamByWorkstream).map(([workstream, count]) => (
              <div key={workstream} className="flex items-center justify-between">
                <span className="font-medium">{workstream}</span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(metrics.teamByWorkstream).length === 0 && (
              <p className="text-muted-foreground text-sm">No team members with workstreams assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members by Role */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.teamByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="font-medium">{roleLabels[role] || role}</span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(metrics.teamByRole).length === 0 && (
              <p className="text-muted-foreground text-sm">No team members with specified roles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capacity by Workstream */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Capacity by Workstream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.capacityByWorkstream).map(([workstream, capacity]) => (
              <div key={workstream} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{workstream}</span>
                  <span className="text-sm text-muted-foreground">
                    {capacity.used}/{capacity.total} used
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-semibold">{capacity.total}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Used: </span>
                    <span className="font-semibold">{capacity.used}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="font-semibold text-green-600">{capacity.remaining}</span>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(metrics.capacityByWorkstream).length === 0 && (
              <p className="text-muted-foreground text-sm">No capacity data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capacity by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.capacityByRole).map(([role, capacity]) => (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{roleLabels[role] || role}</span>
                  <span className="text-sm text-muted-foreground">
                    {capacity.used}/{capacity.total} used
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-semibold">{capacity.total}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Used: </span>
                    <span className="font-semibold">{capacity.used}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="font-semibold text-green-600">{capacity.remaining}</span>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(metrics.capacityByRole).length === 0 && (
              <p className="text-muted-foreground text-sm">No capacity data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
