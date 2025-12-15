import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useWorkstreamOverview } from "@/hooks/useWorkstreamOverview";
import { useWorkstreamActivities } from "@/hooks/useWorkstreamActivities";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useAuth } from "@/hooks/useAuth";
import { useCanCreateProjects } from "@/hooks/useCanCreateProjects";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldAlert, FolderKanban, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, User, Package, Briefcase, Clock, UserCircle, Users } from "lucide-react";
import { mapWorkstreamToEnum } from "@/lib/workstreamMapping";
import { Button } from "@/components/ui/button";
import { CriticalPathView } from "@/components/CriticalPathView";

interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  primary_role: string | null;
  sfia_grade: number | null;
  last_login: string | null;
  disabled: boolean;
}

interface WorkstreamProject {
  id: string;
  title: string;
  security_phase: string | null;
  created_at: string;
  status: 'on_track' | 'at_risk' | 'unknown';
}

export default function WorkstreamOverview() {
  const { workstream } = useParams<{ workstream: string }>();
  const { user } = useAuth();
  const { canCreate: isSecurityAdmin, isLoading: permissionLoading } = useCanCreateProjects(user?.id || null);
  // null = loading, true = is mentor, false = not mentor
  const [mentorStatus, setMentorStatus] = useState<boolean | null>(null);
  const [isDelivery, setIsDelivery] = useState<boolean>(false);
  const isMentor = mentorStatus === true;
  const mentorCheckLoading = mentorStatus === null;
  const navigate = useNavigate();
  const { workstreams, isLoading: settingsLoading } = useAppSettings();
  const { thisWeek, nextWeek, isLoading } = useWorkstreamOverview(workstream);
  const { activities, completedActivities, isLoading: activitiesLoading } = useWorkstreamActivities(workstream);
  const { isUserOnline } = useOnlineUsers();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [projects, setProjects] = useState<WorkstreamProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<TeamMember | null>(null);
  const [personDetails, setPersonDetails] = useState<{
    projects: { id: string; title: string; role: string }[];
    absences: { start_date: string; end_date: string; absence_type: string }[];
    deliverables: { deliverable_name: string; project_title: string; due_date: string | null; is_completed: boolean }[];
  } | null>(null);
  const [personDetailsLoading, setPersonDetailsLoading] = useState(false);
  const [projectDetails, setProjectDetails] = useState<{
    title: string;
    project_start: string | null;
    anticipated_go_live: string | null;
    assignments: any[];
  } | null>(null);
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);

  // Load project details when selected
  useEffect(() => {
    if (!selectedProject) {
      setProjectDetails(null);
      return;
    }

    const loadProjectDetails = async () => {
      setProjectDetailsLoading(true);
      try {
        // Fetch project info
        const { data: project } = await supabase
          .from('projects')
          .select('title, project_start, anticipated_go_live')
          .eq('id', selectedProject)
          .single();

        // Fetch deliverable assignments for CriticalPathView
        const { data: assignments } = await supabase
          .from('project_deliverable_assignments')
          .select('*')
          .eq('project_id', selectedProject);

        if (project) {
          setProjectDetails({
            title: project.title,
            project_start: project.project_start,
            anticipated_go_live: project.anticipated_go_live,
            assignments: assignments || []
          });
        }
      } catch (error) {
        console.error('Error loading project details:', error);
      } finally {
        setProjectDetailsLoading(false);
      }
    };

    loadProjectDetails();
  }, [selectedProject]);

  // Load person details when selected
  useEffect(() => {
    if (!selectedPerson) {
      setPersonDetails(null);
      return;
    }

    const loadPersonDetails = async () => {
      setPersonDetailsLoading(true);
      try {
        // Fetch projects for this person
        const { data: projectMemberships } = await supabase
          .from('project_members')
          .select('role, projects(id, title)')
          .eq('user_id', selectedPerson.id);

        // Fetch absences for this person
        const { data: absences } = await supabase
          .from('team_leave')
          .select('start_date, end_date, absence_type')
          .eq('user_id', selectedPerson.id)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true });

        // Fetch active deliverables for this person
        const { data: deliverables } = await supabase
          .from('user_deliverables')
          .select('deliverable_name, due_date, is_completed, projects(title)')
          .eq('user_id', selectedPerson.id)
          .eq('is_completed', false)
          .order('due_date', { ascending: true });

        setPersonDetails({
          projects: projectMemberships?.map(pm => ({
            id: (pm.projects as any)?.id || '',
            title: (pm.projects as any)?.title || 'Unknown',
            role: pm.role
          })) || [],
          absences: absences?.map(a => ({
            start_date: a.start_date,
            end_date: a.end_date,
            absence_type: a.absence_type
          })) || [],
          deliverables: deliverables?.map(d => ({
            deliverable_name: d.deliverable_name,
            project_title: (d.projects as any)?.title || 'Unknown',
            due_date: d.due_date,
            is_completed: d.is_completed
          })) || []
        });
      } catch (error) {
        console.error('Error loading person details:', error);
      } finally {
        setPersonDetailsLoading(false);
      }
    };

    loadPersonDetails();
  }, [selectedPerson]);

  // Check if user is a mentor/delivery and if they have access to this workstream
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
        const workstreamEnum = mapWorkstreamToEnum(workstream || '');
        
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

  // Redirect if not authorized
  useEffect(() => {
    if (!permissionLoading && !mentorCheckLoading && !isSecurityAdmin && !isDelivery && !isMentor) {
      navigate("/projects");
    }
  }, [isSecurityAdmin, isDelivery, isMentor, permissionLoading, mentorCheckLoading, navigate]);

  // Fetch team members for this workstream
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!workstream) return;
      
      // Convert URL workstream name to database enum value
      // Handle case variations (e.g., "migration" -> "Mig")
      const capitalizedWs = workstream.charAt(0).toUpperCase() + workstream.slice(1).toLowerCase();
      const workstreamEnum = mapWorkstreamToEnum(capitalizedWs);
      
      setTeamLoading(true);
      
      // Get users directly assigned to workstream via profiles table
      const { data: directProfiles, error: directError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, primary_role, sfia_grade, last_login, disabled')
        .eq('workstream', workstreamEnum as any)
        .eq('disabled', false)
        .neq('primary_role', 'admin')
        .order('primary_role', { ascending: true });
      
      if (directError) {
        console.error('Error fetching direct profiles:', directError);
        setTeamLoading(false);
        return;
      }

      // Get users assigned via junction table (delivery/mentor)
      const { data: junctionAssignments, error: junctionError } = await supabase
        .from('user_workstream_assignments')
        .select('user_id')
        .eq('workstream', workstreamEnum as any);

      if (junctionError) {
        console.error('Error fetching junction assignments:', junctionError);
        setTeamLoading(false);
        return;
      }

      // Get profiles for junction table users
      let junctionProfiles: typeof directProfiles = [];
      if (junctionAssignments && junctionAssignments.length > 0) {
        const userIds = junctionAssignments.map(a => a.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, primary_role, sfia_grade, last_login, disabled')
          .in('id', userIds)
          .eq('disabled', false)
          .neq('primary_role', 'admin')
          .order('primary_role', { ascending: true });

        if (!profilesError && profiles) {
          junctionProfiles = profiles;
        }
      }

      // Combine and deduplicate profiles
      const allProfilesMap = new Map<string, TeamMember>();
      for (const profile of (directProfiles || [])) {
        allProfilesMap.set(profile.id, profile);
      }
      for (const profile of (junctionProfiles || [])) {
        if (!allProfilesMap.has(profile.id)) {
          allProfilesMap.set(profile.id, profile);
        }
      }
      
      setTeamMembers(Array.from(allProfilesMap.values()));
      setTeamLoading(false);
    };

    fetchTeamMembers();
  }, [workstream]);

  // Fetch projects for this workstream
  useEffect(() => {
    const fetchProjects = async () => {
      if (!workstream) return;
      
      const capitalizedWs = workstream.charAt(0).toUpperCase() + workstream.slice(1).toLowerCase();
      const workstreamEnum = mapWorkstreamToEnum(capitalizedWs);
      
      setProjectsLoading(true);
      
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('id, title, security_phase, created_at')
        .eq('workstream', workstreamEnum as any)
        .order('title', { ascending: true });
      
      if (!error && projectData) {
        // Fetch deliverables for all projects to determine status
        const projectIds = projectData.map(p => p.id);
        const { data: deliverables } = await supabase
          .from('user_deliverables')
          .select('project_id, is_completed, due_date, estimated_effort_remaining')
          .in('project_id', projectIds)
          .eq('is_completed', false);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const projectsWithStatus = projectData.map(project => {
          const projectDeliverables = deliverables?.filter(d => d.project_id === project.id) || [];
          
          // Check if any deliverable is overdue or at risk
          let status: 'on_track' | 'at_risk' | 'unknown' = 'on_track';
          
          if (projectDeliverables.length === 0) {
            status = 'unknown';
          } else {
            for (const del of projectDeliverables) {
              if (del.due_date) {
                const dueDate = new Date(del.due_date);
                dueDate.setHours(0, 0, 0, 0);
                
                // Check if overdue
                if (dueDate < today) {
                  status = 'at_risk';
                  break;
                }
                
                // Check if at risk (not enough time to complete)
                const workingDaysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const hoursAvailable = workingDaysRemaining * 8;
                if (hoursAvailable < (del.estimated_effort_remaining || 0)) {
                  status = 'at_risk';
                  break;
                }
              }
            }
          }
          
          return { ...project, status };
        });
        
        setProjects(projectsWithStatus);
      }
      setProjectsLoading(false);
    };

    fetchProjects();
  }, [workstream]);

  // Group team members by role, mentors first
  const groupedTeamMembers = () => {
    const mentors = teamMembers.filter(m => 
      m.primary_role?.toLowerCase().includes('mentor')
    );
    const others = teamMembers.filter(m => 
      !m.primary_role?.toLowerCase().includes('mentor')
    );
    
    // Group others by role
    const grouped: Record<string, TeamMember[]> = {};
    others.forEach(member => {
      const role = member.primary_role || 'Unassigned';
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(member);
    });
    
    return { mentors, grouped };
  };

  const formatLastSeen = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never';
    return formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
  };

  if (settingsLoading || permissionLoading || mentorCheckLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
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
              You don't have permission to access this workstream overview.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validWorkstream = workstreams.find(
    w => w.toLowerCase() === workstream?.toLowerCase()
  );

  if (!validWorkstream) {
    return <Navigate to="/home" replace />;
  }

  const getAbsenceColor = (type: string) => {
    switch (type) {
      case 'leave':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'sickness':
        return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
      case 'working_elsewhere':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20';
    }
  };

  const getDeliverableStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (due < today) {
      return { label: 'Overdue', color: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20' };
    }
    
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3) {
      return { label: 'Due Soon', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' };
    }
    
    return { label: 'Upcoming', color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20' };
  };

  const WeekCard = ({ 
    title, 
    startDate, 
    endDate, 
    absences, 
    deliverables 
  }: { 
    title: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    absences: any[] | undefined;
    deliverables: any[] | undefined;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        {startDate && endDate && (
          <p className="text-sm text-muted-foreground">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Team Absences
          </h3>
          {!absences || absences.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No absences scheduled</p>
          ) : (
            <div className="space-y-2">
              {absences.map((absence) => (
                <div key={absence.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-medium text-sm">{absence.user_name}</span>
                    <Badge variant="outline" className={getAbsenceColor(absence.absence_type)}>
                      {absence.absence_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{absence.project_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(absence.start_date), 'MMM d')} - {format(new Date(absence.end_date), 'MMM d')}
                  </p>
                  {absence.description && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{absence.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Deliverables Due
          </h3>
          {!deliverables || deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No deliverables due</p>
          ) : (
            <div className="space-y-2">
              {deliverables.map((deliverable) => {
                const status = getDeliverableStatus(deliverable.due_date);
                return (
                  <div key={deliverable.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm">{deliverable.deliverable_name}</span>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{deliverable.project_title}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{deliverable.person_name}</span>
                      <span>Due: {format(new Date(deliverable.due_date), 'MMM d')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{validWorkstream} Overview</h1>
      
      {/* Week View */}
      <div className="grid md:grid-cols-2 gap-6">
        <WeekCard
          title="This Week"
          startDate={thisWeek?.startDate}
          endDate={thisWeek?.endDate}
          absences={thisWeek?.absences}
          deliverables={thisWeek?.deliverables}
        />
        
        <WeekCard
          title="Next Week"
          startDate={nextWeek?.startDate}
          endDate={nextWeek?.endDate}
          absences={nextWeek?.absences}
          deliverables={nextWeek?.deliverables}
        />
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Current team members in this workstream
          </p>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members in this workstream</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mentors first */}
              {groupedTeamMembers().mentors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Mentors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {groupedTeamMembers().mentors.map(member => {
                      const online = isUserOnline(member.id);
                      return (
                        <div 
                          key={member.id} 
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity ${
                            online 
                              ? 'bg-green-500/20 border-green-500/30' 
                              : 'bg-muted/50 border-muted-foreground/20'
                          }`}
                          onClick={() => setSelectedPerson(member)}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatLastSeen(member.last_login)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Other roles grouped */}
              {Object.entries(groupedTeamMembers().grouped).map(([role, members]) => (
                <div key={role}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{role}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {members.map(member => {
                      const online = isUserOnline(member.id);
                      return (
                        <div 
                          key={member.id} 
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity ${
                            online 
                              ? 'bg-green-500/20 border-green-500/30' 
                              : 'bg-muted/50 border-muted-foreground/20'
                          }`}
                          onClick={() => setSelectedPerson(member)}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatLastSeen(member.last_login)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Projects in this workstream
          </p>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No projects in this workstream</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {projects.map(project => {
                const statusClasses = project.status === 'at_risk' 
                  ? 'bg-red-500/20 border-red-500/30' 
                  : project.status === 'on_track'
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-muted/50 border-muted-foreground/20';
                const statusLabel = project.status === 'at_risk' 
                  ? 'At Risk' 
                  : project.status === 'on_track'
                  ? 'On Track'
                  : 'No Tasks';
                return (
                  <div 
                    key={project.id} 
                    className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${statusClasses}`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <p className="font-medium text-sm truncate">{project.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{statusLabel}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workstream Current Activities */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Workstream Current Activities
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All active tasks across the workstream, grouped by project
          </p>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active deliverables in this workstream</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((projectActivities) => (
                <div key={projectActivities.project_id} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {projectActivities.project_title}
                  </h3>
                  <div className="space-y-2 pl-6">
                    {projectActivities.activities.map((activity) => (
                      <Card key={activity.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Deliverable</p>
                              <p className="font-medium text-sm">{activity.deliverable_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                              <div className="flex items-center gap-1.5">
                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">{activity.user_name}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Remaining Effort</p>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">{activity.estimated_effort_remaining}h</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">
                                  {activity.due_date 
                                    ? format(new Date(activity.due_date), "MMM d, yyyy")
                                    : "Not set"}
                                </p>
                                {activity.due_date && new Date(activity.due_date) < new Date() && (
                                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workstream Completed Activities */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Completed Activities (Last 5 Weeks)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Deliverables completed in the last 5 weeks, grouped by project
          </p>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : completedActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No completed deliverables in the last 5 weeks</p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedActivities.map((projectActivities) => (
                <div key={projectActivities.project_id} className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {projectActivities.project_title}
                  </h3>
                  <div className="space-y-2 pl-6">
                    {projectActivities.activities.map((activity) => (
                      <Card key={activity.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Deliverable</p>
                              <p className="font-medium text-sm">{activity.deliverable_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Completed By</p>
                              <div className="flex items-center gap-1.5">
                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">{activity.user_name}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Effort Hours</p>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">{activity.estimated_effort_remaining}h</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <p className="text-sm">
                                  {activity.due_date 
                                    ? format(new Date(activity.due_date), "MMM d, yyyy")
                                    : "Not set"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Critical Path Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{projectDetails?.title || 'Loading...'}</span>
            </DialogTitle>
          </DialogHeader>
          
          {projectDetailsLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20" />
              <Skeleton className="h-64" />
            </div>
          ) : projectDetails?.project_start ? (
            <div className="space-y-4">
              <CriticalPathView
                projectStartDate={projectDetails.project_start}
                goLiveDate={projectDetails.anticipated_go_live}
                projectId={selectedProject!}
                assignments={projectDetails.assignments}
              />
              
              <Button 
                className="w-full" 
                onClick={() => navigate(`/project/${selectedProject}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Project
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No project timeline configured</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate(`/project/${selectedProject}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Project
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Person Details Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPerson?.first_name} {selectedPerson?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {personDetailsLoading ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
            </div>
          ) : personDetails ? (
            <div className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isUserOnline(selectedPerson?.id || '') ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <span className="text-sm">
                    {isUserOnline(selectedPerson?.id || '') ? 'Online' : 'Offline'}
                    {selectedPerson?.last_login && ` • Last seen: ${formatLastSeen(selectedPerson.last_login)}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Primary Role</p>
                    <p className="font-medium capitalize">{selectedPerson?.primary_role?.replace(/_/g, ' ') || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SFIA Grade</p>
                    <p className="font-medium">{selectedPerson?.sfia_grade ? `Grade ${selectedPerson.sfia_grade}` : 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Projects ({personDetails.projects.length})
                </h3>
                {personDetails.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects assigned</p>
                ) : (
                  <div className="space-y-2">
                    {personDetails.projects.map((project, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 bg-muted rounded text-sm flex justify-between items-center cursor-pointer hover:bg-muted/80"
                        onClick={() => {
                          setSelectedPerson(null);
                          navigate(`/project/${project.id}`);
                        }}
                      >
                        <span className="font-medium">{project.title}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.role.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Absences */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Absences ({personDetails.absences.length})
                </h3>
                {personDetails.absences.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming absences</p>
                ) : (
                  <div className="space-y-2">
                    {personDetails.absences.slice(0, 5).map((absence, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded text-sm flex justify-between items-center">
                        <span className="capitalize">{absence.absence_type}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(absence.start_date), 'dd MMM')} - {format(new Date(absence.end_date), 'dd MMM')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Deliverables */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Active Deliverables ({personDetails.deliverables.length})
                </h3>
                {personDetails.deliverables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active deliverables</p>
                ) : (
                  <div className="space-y-2">
                    {personDetails.deliverables.slice(0, 5).map((del, idx) => (
                      <div key={idx} className="p-2 bg-muted rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{del.deliverable_name}</span>
                          {del.due_date && (
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(del.due_date), 'dd MMM')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{del.project_title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
