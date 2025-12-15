import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectTimeline } from "@/hooks/useProjectTimeline";
import { GitBranch, Clock, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { ProjectDeliverableAssignment } from "@/hooks/useProjectDeliverables";

interface CriticalPathViewProps {
  projectStartDate: string | null;
  goLiveDate: string | null;
  projectId?: string | null;
  assignments?: ProjectDeliverableAssignment[];
}

// First concurrent block - activities within each group must be done together,
// and all these groups run in parallel
const CONCURRENT_GROUPS_1 = [
  ['Business Impact Analysis', 'Gov Assure Profiling'], // Steps 2&3
  ['Obligations Discovery', '3rd Party Assessments', 'Intellectual Property Assessments', 'Data Sharing Agreements'], // Steps 4,5,6,13
  ['Threat Assessment', 'Initial Threat Model'], // Steps 7&8
  ['DPIA Part 1', 'DPIA Part 2'] // Steps 9&10
];

// Second concurrent block - another set of parallel activities
const CONCURRENT_GROUPS_2 = [
  ['Risk Appetite Capture', 'Initial Risk Assessment'],
  ['Cyber Governance Process Definition', 'Continual Assurance Process Definition'],
  ['cyber security requirements'] // match by substring, case-insensitive
];

// Third concurrent block - testing and deeper security activities
const CONCURRENT_GROUPS_3 = [
  ['Cyber Testing – Static Analysis', 'Cyber Testing – Dynamic Analysis', 'Cyber Testing – ITHC'],
  ['Deeper Threat Modelling', 'Security Controls Definition', 'Security Monitoring Requirements']
];

// Fourth concurrent block - final stage activities
const CONCURRENT_GROUPS_4 = [
  ['Compliance Document Completion'],
  ['Risk Profile Acceptance']
];

// Define sequential groups - activities that should be grouped together but run sequentially
const SEQUENTIAL_GROUPS: string[][] = [];

// Map activity names to their corresponding routes
const getActivityRoute = (activityName: string, projectId: string): string | null => {
  const lowerName = activityName.toLowerCase();
  
  // Initiation artefacts
  if (lowerName.includes('security ownership')) return `/project/${projectId}/security-ownership`;
  
  // Delivery Phase 1 artefacts
  if (lowerName.includes('business impact analysis')) return `/project/${projectId}/business-impact-assessment`;
  
  // Discovery artefacts
  if (lowerName.includes('gov assure profiling')) return `/project/${projectId}/gov-assure`;
  if (lowerName.includes('obligations discovery')) return `/project/${projectId}/security-obligations`;
  if (lowerName.includes('3rd party') || lowerName.includes('third party')) return `/project/${projectId}/third-party-assessments`;
  if (lowerName.includes('intellectual property')) return `/project/${projectId}/ip-assessment`;
  if (lowerName.includes('data sharing')) return `/project/${projectId}/data-sharing-agreements`;
  if (lowerName.includes('threat assessment') || lowerName.includes('initial threat model')) return `/project/${projectId}/threat-model`;
  if (lowerName.includes('dpia')) return `/project/${projectId}/dpia`;
  if (lowerName.includes('risk appetite')) return `/project/${projectId}/risk-appetite`;
  if (lowerName.includes('initial risk') || lowerName.includes('risk assessment')) return `/project/${projectId}/risk-register`;
  if (lowerName.includes('cyber governance')) return `/project/${projectId}/security-governance`;
  if (lowerName.includes('continual assurance')) return `/project/${projectId}/continual-assurance`;
  if (lowerName.includes('security requirements') || lowerName.includes('cyber security requirements')) return `/project/${projectId}/security-requirements`;
  
  // Alpha artefacts
  if (lowerName.includes('deeper threat')) return `/project/${projectId}/deeper-threat-model`;
  if (lowerName.includes('security controls')) return `/project/${projectId}/security-controls`;
  if (lowerName.includes('monitoring requirements') || lowerName.includes('security monitoring')) return `/project/${projectId}/monitoring-requirements`;
  if (lowerName.includes('cyber testing') || lowerName.includes('static analysis') || lowerName.includes('dynamic analysis') || lowerName.includes('ithc')) return `/project/${projectId}/testing-evaluation`;
  if (lowerName.includes('compliance document') || lowerName.includes('compliance (gsd)')) return `/project/${projectId}/compliance-gsd`;
  
  return null;
};

export function CriticalPathView({ projectStartDate, goLiveDate, projectId, assignments = [] }: CriticalPathViewProps) {
  const navigate = useNavigate();
  const { timeline } = useProjectTimeline(projectStartDate, goLiveDate, projectId);

  // Handle activity click - navigate to corresponding page
  const handleActivityClick = (activityName: string) => {
    if (!projectId) return;
    const route = getActivityRoute(activityName, projectId);
    if (route) {
      navigate(route);
    }
  };

  // Helper to check if an activity is required
  const isActivityRequired = (activityName: string): boolean => {
    const assignment = assignments.find(a => a.deliverable_name === activityName);
    // If no assignment exists, consider it required by default
    return assignment ? assignment.required : true;
  };

  // Helper to calculate working days between two dates
  const getWorkingDaysBetween = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Helper to get activity status from deliverable assignments
  const getActivityStatus = (activityName: string, activityDate: Date) => {
    const assignment = assignments.find(a => a.deliverable_name === activityName);
    if (!assignment) return 'default';
    
    // Check if not required first
    if (!assignment.required) return 'not-required';
    
    if (assignment.is_completed) return 'completed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(activityDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    
    // Check if at risk: not enough working days for required hours
    const workingDaysRemaining = getWorkingDaysBetween(today, dueDate);
    const availableHours = workingDaysRemaining * 8;
    const requiredHours = assignment.effort_hours || 0;
    
    if (requiredHours > 0 && availableHours < requiredHours) {
      return 'at-risk';
    }
    
    return 'default';
  };

  // Get styling based on activity status
  const getActivityStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500 hover:bg-green-500/30';
      case 'overdue':
        return 'bg-red-500/20 border-red-500 hover:bg-red-500/30';
      case 'at-risk':
        return 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/30';
      case 'not-required':
        return 'bg-muted/50 border-muted-foreground/30 opacity-50';
      default:
        return 'bg-primary/10 border-primary hover:bg-primary/20';
    }
  };

  // Filter and reorder activities
  const allActivities = useMemo(() => {
    let activities = timeline.filter(event => !event.isMilestone && event.effortHours);
    
    // Reorder: Ensure Threat Assessment comes right after Security Ownership
    const ownershipIndex = activities.findIndex(a => a.name.toLowerCase().includes('security ownership'));
    const threatAssessmentIndex = activities.findIndex(a => a.name.toLowerCase().includes('threat assessment'));
    
    if (ownershipIndex !== -1 && threatAssessmentIndex !== -1 && threatAssessmentIndex !== ownershipIndex + 1) {
      const threatAssessment = activities[threatAssessmentIndex];
      activities = [
        ...activities.slice(0, ownershipIndex + 1),
        threatAssessment,
        ...activities.slice(ownershipIndex + 1, threatAssessmentIndex),
        ...activities.slice(threatAssessmentIndex + 1)
      ];
    }
    
    // Reorder: Ensure Data Sharing Agreements comes right after Intellectual Property Assessments
    const ipIndex = activities.findIndex(a => a.name.toLowerCase().includes('intellectual property assessments'));
    const dsaIndex = activities.findIndex(a => a.name.toLowerCase().includes('data sharing agreements'));
    
    if (ipIndex !== -1 && dsaIndex !== -1 && dsaIndex !== ipIndex + 1) {
      const dsa = activities[dsaIndex];
      activities = [
        ...activities.slice(0, ipIndex + 1),
        dsa,
        ...activities.slice(ipIndex + 1, dsaIndex),
        ...activities.slice(dsaIndex + 1)
      ];
    }
    
    return activities;
  }, [timeline]);
  
  // Group activities into parallel swimlanes and sequential steps
  const timelineStructure = useMemo(() => {
    const structure: Array<Array<typeof allActivities>> = [];
    const processedIndices = new Set<number>();
    
    // Collect all activities in first concurrent block
    const concurrentActivityIndices1 = new Set<number>();
    CONCURRENT_GROUPS_1.forEach(group => {
      allActivities.forEach((activity, index) => {
        if (group.some(name => activity.name === name)) {
          concurrentActivityIndices1.add(index);
        }
      });
    });
    
    // Collect all activities in second concurrent block (using substring match for flexibility)
    const concurrentActivityIndices2 = new Set<number>();
    CONCURRENT_GROUPS_2.forEach(group => {
      allActivities.forEach((activity, index) => {
        const activityName = activity.name.toLowerCase();
        if (group.some(name => activityName.includes(name.toLowerCase()))) {
          concurrentActivityIndices2.add(index);
        }
      });
    });
    
    // Collect all activities in third concurrent block
    const concurrentActivityIndices3 = new Set<number>();
    CONCURRENT_GROUPS_3.forEach(group => {
      allActivities.forEach((activity, index) => {
        const activityName = activity.name.toLowerCase();
        if (group.some(name => activityName.includes(name.toLowerCase()))) {
          concurrentActivityIndices3.add(index);
        }
      });
    });
    
    // Collect all activities in fourth concurrent block (final stage)
    const concurrentActivityIndices4 = new Set<number>();
    CONCURRENT_GROUPS_4.forEach(group => {
      allActivities.forEach((activity, index) => {
        const activityName = activity.name.toLowerCase();
        if (group.some(name => activityName.includes(name.toLowerCase()))) {
          concurrentActivityIndices4.add(index);
        }
      });
    });
    
    // Collect all activities that are in sequential groups
    const sequentialGroupActivityIndices = new Set<number>();
    SEQUENTIAL_GROUPS.forEach(group => {
      allActivities.forEach((activity, index) => {
        const activityName = activity.name.toLowerCase();
        if (group.some(name => activityName.includes(name.toLowerCase()))) {
          sequentialGroupActivityIndices.add(index);
        }
      });
    });
    
    // Create first concurrent mega-step with all groups as swimlanes (maintaining group order)
    const concurrentSwimlanesStep1: typeof allActivities[] = [];
    CONCURRENT_GROUPS_1.forEach(group => {
      const swimlane: typeof allActivities = [];
      group.forEach(groupName => {
        const matchingActivity = allActivities.find(activity => activity.name === groupName);
        if (matchingActivity) {
          swimlane.push(matchingActivity);
        }
      });
      if (swimlane.length > 0) {
        concurrentSwimlanesStep1.push(swimlane);
        swimlane.forEach(activity => {
          const index = allActivities.indexOf(activity);
          processedIndices.add(index);
        });
      }
    });
    
    // Create second concurrent mega-step with all groups as swimlanes (maintaining group order)
    const concurrentSwimlanesStep2: typeof allActivities[] = [];
    CONCURRENT_GROUPS_2.forEach(group => {
      const swimlane: typeof allActivities = [];
      group.forEach(groupName => {
        const matchingActivity = allActivities.find(activity => {
          const activityName = activity.name.toLowerCase();
          return activityName.includes(groupName.toLowerCase());
        });
        if (matchingActivity) {
          swimlane.push(matchingActivity);
        }
      });
      if (swimlane.length > 0) {
        concurrentSwimlanesStep2.push(swimlane);
        swimlane.forEach(activity => {
          const index = allActivities.indexOf(activity);
          processedIndices.add(index);
        });
      }
    });
    
    // Create third concurrent mega-step with all groups as swimlanes (maintaining group order)
    const concurrentSwimlanesStep3: typeof allActivities[] = [];
    CONCURRENT_GROUPS_3.forEach(group => {
      const swimlane: typeof allActivities = [];
      group.forEach(groupName => {
        const matchingActivity = allActivities.find(activity => {
          const activityName = activity.name.toLowerCase();
          return activityName.includes(groupName.toLowerCase());
        });
        if (matchingActivity) {
          swimlane.push(matchingActivity);
        }
      });
      if (swimlane.length > 0) {
        concurrentSwimlanesStep3.push(swimlane);
        swimlane.forEach(activity => {
          const index = allActivities.indexOf(activity);
          processedIndices.add(index);
        });
      }
    });
    
    // Create fourth concurrent mega-step with all groups as swimlanes (final stage)
    const concurrentSwimlanesStep4: typeof allActivities[] = [];
    CONCURRENT_GROUPS_4.forEach(group => {
      const swimlane: typeof allActivities = [];
      group.forEach(groupName => {
        const matchingActivity = allActivities.find(activity => {
          const activityName = activity.name.toLowerCase();
          return activityName.includes(groupName.toLowerCase());
        });
        if (matchingActivity) {
          swimlane.push(matchingActivity);
        }
      });
      if (swimlane.length > 0) {
        concurrentSwimlanesStep4.push(swimlane);
        swimlane.forEach(activity => {
          const index = allActivities.indexOf(activity);
          processedIndices.add(index);
        });
      }
    });
    
    // Add sequential activities before the first concurrent block
    const beforeConcurrent1: typeof allActivities[] = [];
    allActivities.forEach((activity, index) => {
      if (!concurrentActivityIndices1.has(index) && !concurrentActivityIndices2.has(index) && !concurrentActivityIndices3.has(index) && !concurrentActivityIndices4.has(index) && !sequentialGroupActivityIndices.has(index) && !processedIndices.has(index)) {
        const firstConcurrentIndex = Math.min(...Array.from(concurrentActivityIndices1));
        if (index < firstConcurrentIndex) {
          beforeConcurrent1.push([activity]);
          processedIndices.add(index);
        }
      }
    });
    
    // Add sequential activities between the first and second concurrent blocks
    const betweenConcurrent1And2: typeof allActivities[] = [];
    allActivities.forEach((activity, index) => {
      if (!processedIndices.has(index) && !sequentialGroupActivityIndices.has(index) && !concurrentActivityIndices2.has(index) && !concurrentActivityIndices3.has(index) && !concurrentActivityIndices4.has(index)) {
        const lastConcurrent1Index = Math.max(...Array.from(concurrentActivityIndices1));
        const firstConcurrent2Index = Math.min(...Array.from(concurrentActivityIndices2));
        if (index > lastConcurrent1Index && index < firstConcurrent2Index) {
          betweenConcurrent1And2.push([activity]);
          processedIndices.add(index);
        }
      }
    });
    
    // Add sequential activities between the second and third concurrent blocks
    const betweenConcurrent2And3: typeof allActivities[] = [];
    allActivities.forEach((activity, index) => {
      if (!processedIndices.has(index) && !sequentialGroupActivityIndices.has(index) && !concurrentActivityIndices3.has(index) && !concurrentActivityIndices4.has(index)) {
        const lastConcurrent2Index = Math.max(...Array.from(concurrentActivityIndices2));
        const firstConcurrent3Index = Math.min(...Array.from(concurrentActivityIndices3));
        if (index > lastConcurrent2Index && index < firstConcurrent3Index) {
          betweenConcurrent2And3.push([activity]);
          processedIndices.add(index);
        }
      }
    });
    
    // Add sequential activities between the third and fourth concurrent blocks
    const betweenConcurrent3And4: typeof allActivities[] = [];
    allActivities.forEach((activity, index) => {
      if (!processedIndices.has(index) && !sequentialGroupActivityIndices.has(index) && !concurrentActivityIndices4.has(index)) {
        const lastConcurrent3Index = Math.max(...Array.from(concurrentActivityIndices3));
        const firstConcurrent4Index = concurrentActivityIndices4.size > 0 ? Math.min(...Array.from(concurrentActivityIndices4)) : Infinity;
        if (index > lastConcurrent3Index && index < firstConcurrent4Index) {
          betweenConcurrent3And4.push([activity]);
          processedIndices.add(index);
        }
      }
    });
    
    // Add sequential groups as individual steps (activities grouped left-to-right)
    const sequentialGroupSteps: typeof allActivities[] = [];
    SEQUENTIAL_GROUPS.forEach(group => {
      const groupActivities = allActivities.filter(activity => {
        const activityName = activity.name.toLowerCase();
        return group.some(name => activityName.includes(name.toLowerCase()));
      });
      if (groupActivities.length > 0) {
        sequentialGroupSteps.push(groupActivities);
        groupActivities.forEach(activity => {
          const index = allActivities.indexOf(activity);
          processedIndices.add(index);
        });
      }
    });
    
    // Add remaining sequential activities after all concurrent blocks
    const afterAllConcurrent: typeof allActivities[] = [];
    allActivities.forEach((activity, index) => {
      if (!processedIndices.has(index)) {
        afterAllConcurrent.push([activity]);
        processedIndices.add(index);
      }
    });
    
    return [
      ...beforeConcurrent1, 
      concurrentSwimlanesStep1, 
      ...betweenConcurrent1And2, 
      concurrentSwimlanesStep2, 
      ...betweenConcurrent2And3,
      concurrentSwimlanesStep3,
      ...betweenConcurrent3And4,
      concurrentSwimlanesStep4,
      ...sequentialGroupSteps, 
      ...afterAllConcurrent
    ];
  }, [allActivities]);
  
  const activities = allActivities;

  // Calculate total effort hours by role (Maximum - only required activities)
  const totalEffort = activities.reduce((acc, activity) => {
    if (activity.effortHours && isActivityRequired(activity.name)) {
      acc.riskManager += activity.effortHours.riskManager;
      acc.securityArchitect += activity.effortHours.securityArchitect;
      acc.soc += activity.effortHours.soc;
    }
    return acc;
  }, { riskManager: 0, securityArchitect: 0, soc: 0 });

  // Calculate critical path effort (Minimum - longest path through concurrent activities, only required)
  const criticalPathEffort = useMemo(() => {
    let effort = { riskManager: 0, securityArchitect: 0, soc: 0 };
    
    timelineStructure.forEach(step => {
      if (Array.isArray(step[0])) {
        // For concurrent blocks, take the maximum effort from any swimlane
        const swimlaneEfforts = step.map(swimlane => {
          return swimlane.reduce((acc, activity) => {
            if (activity.effortHours && isActivityRequired(activity.name)) {
              acc.riskManager += activity.effortHours.riskManager;
              acc.securityArchitect += activity.effortHours.securityArchitect;
              acc.soc += activity.effortHours.soc;
            }
            return acc;
          }, { riskManager: 0, securityArchitect: 0, soc: 0 });
        });
        
        // Add the maximum from each role across all swimlanes
        effort.riskManager += Math.max(...swimlaneEfforts.map(e => e.riskManager));
        effort.securityArchitect += Math.max(...swimlaneEfforts.map(e => e.securityArchitect));
        effort.soc += Math.max(...swimlaneEfforts.map(e => e.soc));
      } else {
        // For sequential steps, add all effort (only required)
        step.forEach(activity => {
          if (activity.effortHours && isActivityRequired(activity.name)) {
            effort.riskManager += activity.effortHours.riskManager;
            effort.securityArchitect += activity.effortHours.securityArchitect;
            effort.soc += activity.effortHours.soc;
          }
        });
      }
    });
    
    return effort;
  }, [timelineStructure]);

  // Calculate total days (max across all roles)
  const totalDays = Math.max(
    totalEffort.riskManager / 8,
    totalEffort.securityArchitect / 8,
    totalEffort.soc / 8
  );

  // Calculate completion date
  const completionDate = activities.length > 0 ? activities[activities.length - 1].date : null;

  if (!projectStartDate || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Critical Path for Security Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No timeline data available. Please set a project start date.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Critical Path for Security Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Total Duration
            </div>
            <p className="text-2xl font-bold">{Math.ceil(totalDays)} days</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Completion Date
            </div>
            <p className="text-2xl font-bold">
              {completionDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Activities</div>
            <p className="text-2xl font-bold">{activities.length}</p>
          </div>
        </div>

        {/* Effort Breakdown by Role */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Effort by Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Information Assurer</p>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Maximum:</span>
                  <span className="text-lg font-semibold">{totalEffort.riskManager}h <span className="text-xs text-muted-foreground">({Math.ceil(totalEffort.riskManager / 8)}d)</span></span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Minimum:</span>
                  <span className="text-lg font-semibold">{criticalPathEffort.riskManager}h <span className="text-xs text-muted-foreground">({Math.ceil(criticalPathEffort.riskManager / 8)}d)</span></span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Security Architect</p>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Maximum:</span>
                  <span className="text-lg font-semibold">{totalEffort.securityArchitect}h <span className="text-xs text-muted-foreground">({Math.ceil(totalEffort.securityArchitect / 8)}d)</span></span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Minimum:</span>
                  <span className="text-lg font-semibold">{criticalPathEffort.securityArchitect}h <span className="text-xs text-muted-foreground">({Math.ceil(criticalPathEffort.securityArchitect / 8)}d)</span></span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">SOC</p>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Maximum:</span>
                  <span className="text-lg font-semibold">{totalEffort.soc}h <span className="text-xs text-muted-foreground">({Math.ceil(totalEffort.soc / 8)}d)</span></span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Minimum:</span>
                  <span className="text-lg font-semibold">{criticalPathEffort.soc}h <span className="text-xs text-muted-foreground">({Math.ceil(criticalPathEffort.soc / 8)}d)</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Artefacts & Activities Timeline</h3>
          <div className="relative overflow-x-auto pb-4">
            <div className="flex items-center gap-12 min-w-max p-4">
              {timelineStructure.map((step, stepIndex) => (
                <div key={stepIndex} className="flex items-center gap-12">
                  {/* Check if this step contains multiple swimlanes (parallel groups) */}
                  {Array.isArray(step[0]) ? (
                    // Multiple swimlanes running in parallel
                    <div className="flex flex-col gap-4">
                      {step.map((swimlane, swimlaneIndex) => (
                        <div key={swimlaneIndex} className="flex flex-row gap-3 p-3 bg-muted/30 rounded-lg">
                          {swimlane.map((activity, activityIndex) => {
                            const globalIndex = activities.indexOf(activity);
                            const status = getActivityStatus(activity.name, new Date(activity.date));
                            const styles = getActivityStyles(status);
                            return (
                              <div key={activityIndex} className="flex flex-col items-center gap-2">
                                <div 
                                  className={`border-2 rounded-lg p-4 w-48 transition-colors cursor-pointer ${styles}`}
                                  onClick={() => handleActivityClick(activity.name)}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {status === 'completed' && (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )}
                                    {status === 'at-risk' && (
                                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    )}
                                  </div>
                                  <p className="text-sm font-semibold mb-2 line-clamp-2">{activity.name}</p>
                                  <p className={`text-xs mb-2 ${status === 'overdue' ? 'text-red-600 font-medium' : status === 'at-risk' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                    {activity.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </p>
                                  {activity.effortHours && (
                                    <div className="space-y-1">
                                      {activity.effortHours.riskManager > 0 && (
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">IA:</span>
                                          <span className="font-medium">{activity.effortHours.riskManager}h</span>
                                        </div>
                                      )}
                                      {activity.effortHours.securityArchitect > 0 && (
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">SA:</span>
                                          <span className="font-medium">{activity.effortHours.securityArchitect}h</span>
                                        </div>
                                      )}
                                      {activity.effortHours.soc > 0 && (
                                        <div className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">SOC:</span>
                                          <span className="font-medium">{activity.effortHours.soc}h</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ) : step.length > 1 ? (
                    // Sequential group (multiple activities grouped together, flowing left-to-right)
                    <div className="flex flex-row gap-3">
                      {step.map((activity, activityIndex) => {
                        const globalIndex = activities.indexOf(activity);
                        const status = getActivityStatus(activity.name, new Date(activity.date));
                        const styles = getActivityStyles(status);
                        return (
                          <div key={activityIndex} className="flex flex-col items-center gap-2">
                            <div 
                              className={`border-2 rounded-lg p-4 w-48 transition-colors cursor-pointer ${styles}`}
                              onClick={() => handleActivityClick(activity.name)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {status === 'completed' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                {status === 'at-risk' && (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <p className="text-sm font-semibold mb-2 line-clamp-2">{activity.name}</p>
                              <p className={`text-xs mb-2 ${status === 'overdue' ? 'text-red-600 font-medium' : status === 'at-risk' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                {activity.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                              {activity.effortHours && (
                                <div className="space-y-1">
                                  {activity.effortHours.riskManager > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">IA:</span>
                                      <span className="font-medium">{activity.effortHours.riskManager}h</span>
                                    </div>
                                  )}
                                  {activity.effortHours.securityArchitect > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">SA:</span>
                                      <span className="font-medium">{activity.effortHours.securityArchitect}h</span>
                                    </div>
                                  )}
                                  {activity.effortHours.soc > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">SOC:</span>
                                      <span className="font-medium">{activity.effortHours.soc}h</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Single activity (sequential)
                    <div className="flex flex-col gap-2">
                      {step.map((activity, activityIndex) => {
                        const globalIndex = activities.indexOf(activity);
                        const status = getActivityStatus(activity.name, new Date(activity.date));
                        const styles = getActivityStyles(status);
                        return (
                          <div key={activityIndex} className="flex flex-col items-center gap-2">
                            <div 
                              className={`border-2 rounded-lg p-4 w-48 transition-colors cursor-pointer ${styles}`}
                              onClick={() => handleActivityClick(activity.name)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {status === 'completed' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                {status === 'at-risk' && (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                              <p className="text-sm font-semibold mb-2 line-clamp-2">{activity.name}</p>
                              <p className={`text-xs mb-2 ${status === 'overdue' ? 'text-red-600 font-medium' : status === 'at-risk' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                {activity.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                              {activity.effortHours && (
                                <div className="space-y-1">
                                  {activity.effortHours.riskManager > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">IA:</span>
                                      <span className="font-medium">{activity.effortHours.riskManager}h</span>
                                    </div>
                                  )}
                                  {activity.effortHours.securityArchitect > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">SA:</span>
                                      <span className="font-medium">{activity.effortHours.securityArchitect}h</span>
                                    </div>
                                  )}
                                  {activity.effortHours.soc > 0 && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">SOC:</span>
                                      <span className="font-medium">{activity.effortHours.soc}h</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Connector Arrow to next step */}
                  {stepIndex < timelineStructure.length - 1 && (
                    <div className="flex items-center justify-center w-12 h-0.5 bg-primary relative">
                      <div className="absolute right-0 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
