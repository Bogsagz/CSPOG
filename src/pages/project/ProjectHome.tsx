import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, Rocket, Database, Shield, Target, CheckCircle2, Clock, ArrowRight, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectTimeline } from "@/hooks/useProjectTimeline";
import { TeamLeaveManager } from "@/components/TeamLeaveManager";
import { useAuth } from "@/hooks/useAuth";
import { useUserDeliverables } from "@/hooks/useUserDeliverables";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { ProjectTimelineCompact } from "@/components/ProjectTimelineCompact";
import { useProjectTimelineRisk } from "@/hooks/useProjectTimelineRisk";
import { CriticalPathView } from "@/components/CriticalPathView";

interface ProjectInfo {
  id: string;
  title: string;
  created_at: string;
  fleet_size: string | null;
  workstream: string | null;
  project_start: string | null;
  anticipated_go_live: string | null;
  secure_by_design_required: boolean;
  security_phase: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function ProjectHome() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deliverableOwners, setDeliverableOwners] = useState<Record<string, string>>({});
  const [deliverableRequired, setDeliverableRequired] = useState<Record<string, boolean>>({});
  const [isSavingDeliverables, setIsSavingDeliverables] = useState(false);
  const [isSavingMyDeliverables, setIsSavingMyDeliverables] = useState(false);
  const [myDeliverableChanges, setMyDeliverableChanges] = useState<Record<string, { effort?: number }>>({});
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedDeliverablePhase, setSelectedDeliverablePhase] = useState<string>('current');
  const [selectedAllDeliverablesPhase, setSelectedAllDeliverablesPhase] = useState<string>('all');
  const { milestones, timeline } = useProjectTimeline(project?.project_start || null, project?.anticipated_go_live || null, projectId);
  const { deliverables, isLoading: deliverablesLoading, updateEffortRemaining, toggleComplete, createOrUpdateDeliverable } = useUserDeliverables(projectId || null, user?.id || null);
  const { assignments: projectAssignments, saveAssignments, updateEffortHours, updateRequired, refreshAssignments } = useProjectDeliverables(projectId || null);
  const { hasTimelineRisk } = useProjectTimelineRisk(projectId || null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Update user role when user or team members change
  useEffect(() => {
    if (user?.id && teamMembers.length > 0) {
      const userMember = teamMembers.find(m => m.user_id === user.id);
      setUserRole(userMember?.role || null);
      console.log('Setting user role:', userMember?.role || null, 'for user:', user.id);
    }
  }, [user?.id, teamMembers]);

  const loadProjectData = async () => {
    try {
      // Load project info
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, created_at, fleet_size, workstream, project_start, anticipated_go_live, secure_by_design_required, security_phase")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select(`
          id,
          user_id,
          role,
          profiles(email, first_name, last_name)
        `)
        .eq("project_id", projectId);

      if (membersError) throw membersError;

      const formattedMembers: TeamMember[] = membersData?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        email: (member.profiles as any)?.email || "Unknown",
        first_name: (member.profiles as any)?.first_name,
        last_name: (member.profiles as any)?.last_name
      })) || [];

      setTeamMembers(formattedMembers);

      // Get current user's role
      if (user?.id) {
        const userMember = formattedMembers.find(m => m.user_id === user.id);
        setUserRole(userMember?.role || null);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      security_architect: "Security Architect",
      risk_manager: "Information Assurer",
      soc: "SOC",
      project_delivery: "Project Delivery",
      security_admin: "Security Admin",
      security_delivery: "Security Delivery"
    };
    return labels[role] || role;
  };

  const getNextMilestoneDate = (): Date | null => {
    if (!project?.security_phase || milestones.length === 0) return null;
    
    const phaseToMilestone: Record<string, string> = {
      'Discovery': 'End Security Discovery',
      'Alpha': 'End Security Alpha',
      'Live': 'Go Live'
    };
    
    const targetMilestone = phaseToMilestone[project.security_phase];
    const milestone = milestones.find(m => m.name === targetMilestone);
    
    return milestone?.date || null;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPhaseColor = (phase: string): string => {
    const colors: Record<string, string> = {
      'Discovery': 'bg-blue-500',
      'Alpha': 'bg-purple-500',
      'Go Live': 'bg-green-500'
    };
    return colors[phase] || 'bg-gray-500';
  };

  const saveDeliverableChanges = async () => {
    if (!projectId) return;
    
    console.log("Saving deliverable assignments:", deliverableOwners);
    console.log("Saving required status:", deliverableRequired);
    console.log("Timeline events:", timeline.length);
    
    setIsSavingDeliverables(true);
    try {
      await saveAssignments(deliverableOwners, timeline, deliverableRequired);
      // Refresh assignments to trigger sync to user deliverables
      await refreshAssignments();
      toast.success("Deliverable assignments saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save deliverable assignments");
    } finally {
      setIsSavingDeliverables(false);
    }
  };

  const saveMyDeliverableChanges = async () => {
    if (!projectId || Object.keys(myDeliverableChanges).length === 0) return;
    
    setIsSavingMyDeliverables(true);
    try {
      // Save all pending effort changes (completion is now immediate)
      for (const [deliverableId, changes] of Object.entries(myDeliverableChanges)) {
        const deliverable = deliverables.find(d => d.id === deliverableId);
        if (!deliverable) continue;

        if (changes.effort !== undefined) {
          await updateEffortRemaining(deliverableId, changes.effort);
        }
      }
      
      // Clear pending changes
      setMyDeliverableChanges({});
      
      // Refresh all data
      await loadProjectData();
      await refreshAssignments();
      
      toast.success("My deliverables saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save my deliverables");
    } finally {
      setIsSavingMyDeliverables(false);
    }
  };

  // Load saved deliverable owners and required status from database
  useEffect(() => {
    if (projectAssignments.length > 0) {
      const owners: Record<string, string> = {};
      const required: Record<string, boolean> = {};
      projectAssignments.forEach(assignment => {
        owners[assignment.deliverable_name] = assignment.owner_role;
        required[assignment.deliverable_name] = assignment.required;
      });
      setDeliverableOwners(owners);
      setDeliverableRequired(required);
    }
  }, [projectAssignments]);

  // Sync project assignments to user deliverables (only required ones)
  useEffect(() => {
    console.log('Sync check:', {
      userRole,
      deliverablesLoading,
      userId: user?.id,
      projectId,
      projectAssignmentsCount: projectAssignments.length,
      deliverablesCount: deliverables.length
    });
    
    if (userRole && !deliverablesLoading && user?.id && projectId && projectAssignments.length > 0) {
      // Find all REQUIRED assignments for the current user's role
      const userRoleAssignments = projectAssignments.filter(
        assignment => assignment.owner_role === userRole && assignment.required === true
      );
      
      console.log('User role assignments (required only):', userRoleAssignments);
      
      // Create user deliverables for each required assignment
      userRoleAssignments.forEach(assignment => {
        const existingDeliverable = deliverables.find(
          d => d.deliverable_name === assignment.deliverable_name
        );
        
        console.log(`Deliverable "${assignment.deliverable_name}": exists=${!!existingDeliverable}, required=${assignment.required}`);
        
        // Only create if it doesn't exist yet
        if (!existingDeliverable) {
          console.log('Creating user deliverable:', assignment.deliverable_name);
          createOrUpdateDeliverable(
            assignment.deliverable_name,
            userRole,
            assignment.effort_hours
          );
        }
      });
    }
  }, [userRole, deliverablesLoading, user?.id, projectId, projectAssignments, deliverables]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">{project.title}</h2>
          {hasTimelineRisk && (
            <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
              Timeline Risk
            </span>
          )}
        </div>
        <p className="text-muted-foreground">Project Overview and Details</p>
      </div>

      {/* Project Timeline */}
      {project.anticipated_go_live && project.project_start && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <ProjectTimelineCompact
              projectStartDate={project.project_start}
              goLiveDate={project.anticipated_go_live}
              fleetSize={project.fleet_size}
              projectId={project.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Critical Path */}
      {project.project_start && (
        <div className="mb-8">
          <CriticalPathView
            projectStartDate={project.project_start}
            goLiveDate={project.anticipated_go_live}
            projectId={project.id}
            assignments={projectAssignments}
          />
        </div>
      )}

      {/* Current Project Activities */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Project Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Information Assurer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Information Assurer</h3>
                  {(() => {
                    const assignedMember = teamMembers.find(m => m.role === 'risk_manager');
                    return assignedMember && (
                      <p className="text-xs text-muted-foreground">
                        {assignedMember.first_name && assignedMember.last_name 
                          ? `${assignedMember.first_name} ${assignedMember.last_name}`
                          : assignedMember.first_name || assignedMember.last_name || 'Unknown User'}
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  const roleAssignments = projectAssignments.filter(
                    assignment => assignment.owner_role === 'risk_manager' && assignment.required === true && assignment.is_completed === false
                  );
                  
                  if (roleAssignments.length === 0) {
                    return (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">No current assignments</p>
                      </div>
                    );
                  }
                  
                  return roleAssignments.slice(0, 1).map(assignment => (
                    <div key={assignment.id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{assignment.deliverable_name}</p>
                      {assignment.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Security Architect */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Security Architect</h3>
                  {(() => {
                    const assignedMember = teamMembers.find(m => m.role === 'security_architect');
                    return assignedMember && (
                      <p className="text-xs text-muted-foreground">
                        {assignedMember.first_name && assignedMember.last_name 
                          ? `${assignedMember.first_name} ${assignedMember.last_name}`
                          : assignedMember.first_name || assignedMember.last_name || 'Unknown User'}
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  const roleAssignments = projectAssignments.filter(
                    assignment => assignment.owner_role === 'security_architect' && assignment.required === true && assignment.is_completed === false
                  );
                  
                  if (roleAssignments.length === 0) {
                    return (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">No current assignments</p>
                      </div>
                    );
                  }
                  
                  return roleAssignments.slice(0, 1).map(assignment => (
                    <div key={assignment.id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{assignment.deliverable_name}</p>
                      {assignment.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* SOC */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">SOC</h3>
                  {(() => {
                    const assignedMember = teamMembers.find(m => m.role === 'soc');
                    return assignedMember && (
                      <p className="text-xs text-muted-foreground">
                        {assignedMember.first_name && assignedMember.last_name 
                          ? `${assignedMember.first_name} ${assignedMember.last_name}`
                          : assignedMember.first_name || assignedMember.last_name || 'Unknown User'}
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  const roleAssignments = projectAssignments.filter(
                    assignment => assignment.owner_role === 'soc' && assignment.required === true && assignment.is_completed === false
                  );
                  
                  if (roleAssignments.length === 0) {
                    return (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">No current assignments</p>
                      </div>
                    );
                  }
                  
                  return roleAssignments.slice(0, 1).map(assignment => (
                    <div key={assignment.id} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">{assignment.deliverable_name}</p>
                      {assignment.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(assignment.due_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Security Phase</label>
              <p className="text-lg font-semibold">{project.security_phase || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fleet Size</label>
              <p className="text-lg font-semibold">{project.fleet_size || "Not assigned"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Workstream</label>
              <p className="text-lg font-semibold">{project.workstream || "Not assigned"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Secure By Design Required</label>
              <p className="text-lg font-semibold">
                {project.secure_by_design_required ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date Started</label>
              <p className="text-lg font-semibold">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Anticipated Go Live</label>
              <p className="text-lg font-semibold">
                {project.anticipated_go_live 
                  ? new Date(project.anticipated_go_live).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* My Deliverables */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                My Deliverables
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedDeliverablePhase} onValueChange={setSelectedDeliverablePhase}>
                  <SelectTrigger className="w-[180px] bg-background z-50">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="current">Current Phase</SelectItem>
                    <SelectItem value="all">All Phases</SelectItem>
                    <SelectItem value="Discovery">Discovery</SelectItem>
                    <SelectItem value="Alpha">Alpha</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Disposal">Disposal</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={saveMyDeliverableChanges} 
                  size="sm"
                  disabled={isSavingMyDeliverables || Object.keys(myDeliverableChanges).length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingMyDeliverables ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {deliverablesLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading deliverables...</p>
            ) : !userRole ? (
              <p className="text-muted-foreground text-center py-8">No role assigned</p>
            ) : (() => {
              // Get the deliverable phase mapping
              const getDeliverablePhase = (deliverableName: string): string | null => {
                const deliverableEvent = timeline.find(event => event.name === deliverableName);
                return deliverableEvent?.phase || null;
              };

              // Determine which phase to show
              const effectivePhase = selectedDeliverablePhase === 'current' 
                ? (project?.security_phase || 'Discovery') 
                : selectedDeliverablePhase;

              // Filter deliverables for the user's role (including non-required, they'll be grayed out)
              let myDeliverables = projectAssignments.filter(
                assignment => assignment.owner_role === userRole
              );

              // Apply phase filter if not "all"
              if (effectivePhase !== 'all') {
                myDeliverables = myDeliverables.filter(assignment => {
                  const phase = getDeliverablePhase(assignment.deliverable_name);
                  return phase === effectivePhase;
                });
              }

              // Sort by due date chronologically
              myDeliverables = myDeliverables.sort((a, b) => {
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              });

              if (myDeliverables.length === 0) {
                return (
                  <p className="text-muted-foreground text-center py-8">
                    No deliverables for this phase
                  </p>
                );
              }

              return (
                <div className="space-y-3">
                  {myDeliverables.map((assignment) => {
                    const userDeliverable = deliverables.find(
                      d => d.deliverable_name === assignment.deliverable_name
                    );
                    const isCompleted = userDeliverable?.is_completed || assignment.is_completed;
                    const isRequired = assignment.required;
                    
                    return (
                      <div
                        key={assignment.id}
                        className={`p-4 border rounded-lg space-y-2 ${!isRequired ? 'opacity-50 bg-muted/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 flex items-start gap-3">
                            <Button
                              variant={isCompleted ? "default" : "outline"}
                              size="sm"
                              onClick={async () => {
                                if (userDeliverable && projectId && isRequired) {
                                  await toggleComplete(userDeliverable.id, !isCompleted, assignment.deliverable_name, projectId);
                                  await refreshAssignments();
                                }
                              }}
                              className="shrink-0"
                              disabled={!isRequired}
                            >
                              {!isRequired ? 'Not Required' : isCompleted ? 'Completed' : 'Not Completed'}
                            </Button>
                            <div className={isCompleted || !isRequired ? 'opacity-60' : ''}>
                              <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                                {assignment.deliverable_name}
                              </p>
                              {assignment.due_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(assignment.due_date).toLocaleDateString('en-GB', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={(myDeliverableChanges[userDeliverable?.id || '']?.effort ?? userDeliverable?.estimated_effort_remaining) || assignment.effort_hours || 0}
                              onChange={(e) => {
                                if (userDeliverable) {
                                  setMyDeliverableChanges(prev => ({
                                    ...prev,
                                    [userDeliverable.id]: {
                                      ...prev[userDeliverable.id],
                                      effort: parseFloat(e.target.value) || 0
                                    }
                                  }));
                                }
                              }}
                              className="w-24"
                              placeholder="Hours"
                              min="0"
                              step="0.5"
                              disabled={isCompleted || !isRequired}
                            />
                            <span className="text-sm text-muted-foreground">hrs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* All Security Deliverables */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              All Security Deliverables
            </div>
            <Button 
              onClick={saveDeliverableChanges} 
              size="sm"
              disabled={isSavingDeliverables}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingDeliverables ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedAllDeliverablesPhase} onValueChange={setSelectedAllDeliverablesPhase}>
              <SelectTrigger className="w-full md:w-64 bg-background">
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="Discovery">Discovery</SelectItem>
                <SelectItem value="Alpha">Alpha</SelectItem>
                <SelectItem value="Live">Live</SelectItem>
                <SelectItem value="Disposal">Disposal</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              {(() => {
                // Get role label helper
                const getRoleDisplayLabel = (role: string): string => {
                  const labels: Record<string, string> = {
                    'security_admin': 'Security Admin',
                    'security_delivery': 'Security Delivery',
                    'security_architect': 'Security Architect',
                    'risk_manager': 'Information Assurer',
                    'soc': 'SOC',
                    'project_delivery': 'Project Delivery'
                  };
                  return labels[role] || role;
                };

                // Get the deliverable phase mapping
                const getDeliverablePhase = (deliverableName: string): string | null => {
                  const deliverableEvent = timeline.find(event => event.name === deliverableName);
                  return deliverableEvent?.phase || null;
                };

                // Get all activities from timeline (non-milestones with effort hours)
                const allActivities = timeline.filter(event => !event.isMilestone && event.effortHours);
                
                // Build combined list: timeline activities with their saved assignment data
                let combinedDeliverables = allActivities.map(activity => {
                  const savedAssignment = projectAssignments.find(a => a.deliverable_name === activity.name);
                  return {
                    id: savedAssignment?.id || `timeline-${activity.name}`,
                    deliverable_name: activity.name,
                    owner_role: savedAssignment?.owner_role || deliverableOwners[activity.name] || '',
                    effort_hours: savedAssignment?.effort_hours || 0,
                    due_date: savedAssignment?.due_date || activity.date.toISOString().split('T')[0],
                    required: savedAssignment?.required ?? deliverableRequired[activity.name] ?? true,
                    is_completed: savedAssignment?.is_completed || false,
                    phase: activity.phase
                  };
                });

                // Filter by phase if not "all"
                if (selectedAllDeliverablesPhase !== 'all') {
                  combinedDeliverables = combinedDeliverables.filter(d => d.phase === selectedAllDeliverablesPhase);
                }

                // Sort chronologically by due_date
                combinedDeliverables = combinedDeliverables.sort((a, b) => {
                  if (!a.due_date && !b.due_date) return 0;
                  if (!a.due_date) return 1;
                  if (!b.due_date) return -1;
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                });

                if (combinedDeliverables.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-8">
                      No deliverables available. Set project start and go-live dates.
                    </p>
                  );
                }

                return combinedDeliverables.map((deliverable) => (
                  <div 
                    key={deliverable.id} 
                    className={`flex items-center justify-between gap-4 p-3 rounded border ${
                      !deliverable.required ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Button
                        variant={deliverable.required ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setDeliverableRequired(prev => ({
                            ...prev,
                            [deliverable.deliverable_name]: !deliverable.required
                          }));
                          // If already saved, update in DB
                          const savedAssignment = projectAssignments.find(a => a.deliverable_name === deliverable.deliverable_name);
                          if (savedAssignment) {
                            updateRequired(savedAssignment.id, !deliverable.required);
                          }
                        }}
                        className="shrink-0"
                      >
                        {deliverable.required ? 'Required' : 'Optional'}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!deliverable.required ? 'line-through' : ''}`}>
                            {deliverable.deliverable_name}
                          </p>
                          {(() => {
                            // Calculate status
                            if (deliverable.is_completed) {
                              return (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed
                                </span>
                              );
                            }
                            
                            if (deliverable.due_date) {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const dueDate = new Date(deliverable.due_date);
                              dueDate.setHours(0, 0, 0, 0);
                              
                              if (dueDate < today) {
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive flex items-center gap-1">
                                    Overdue
                                  </span>
                                );
                              }
                              
                              // Check if at risk
                              const getWorkingDaysBetween = (start: Date, end: Date): number => {
                                let count = 0;
                                const current = new Date(start);
                                while (current <= end) {
                                  const dayOfWeek = current.getDay();
                                  if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
                                  current.setDate(current.getDate() + 1);
                                }
                                return count;
                              };
                              
                              const workingDaysRemaining = getWorkingDaysBetween(today, dueDate);
                              const availableHours = workingDaysRemaining * 8;
                              const requiredHours = deliverable.effort_hours || 0;
                              
                              if (requiredHours > 0 && availableHours < requiredHours) {
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    At Risk
                                  </span>
                                );
                              }
                            }
                            
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {deliverable.owner_role && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {getRoleDisplayLabel(deliverable.owner_role)}
                            </span>
                          )}
                          {deliverable.due_date && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(deliverable.due_date).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={deliverable.owner_role || ''}
                        onValueChange={(value) => {
                          setDeliverableOwners(prev => ({
                            ...prev,
                            [deliverable.deliverable_name]: value
                          }));
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-background">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="security_admin">Security Admin</SelectItem>
                          <SelectItem value="security_delivery">Security Delivery</SelectItem>
                          <SelectItem value="security_architect">Security Architect</SelectItem>
                          <SelectItem value="risk_manager">Information Assurer</SelectItem>
                          <SelectItem value="soc">SOC</SelectItem>
                          <SelectItem value="project_delivery">Project Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm font-medium">{deliverable.effort_hours}</span>
                      <span className="text-sm text-muted-foreground">hrs</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Leave Calendar */}
      <div className="mt-8">
        <TeamLeaveManager projectId={projectId!} />
      </div>
    </div>
  );
}
