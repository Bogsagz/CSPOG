import { useMemo, useState, useEffect } from 'react';
import { useAppSettings } from './useAppSettings';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  name: string;
  infoAssurerDays: number;
  securityArchitectDays: number;
  socAnalystDays: number;
  isMilestone?: boolean;
}

interface TimelineEvent {
  name: string;
  date: Date;
  isMilestone: boolean;
  phase: 'Discovery' | 'Alpha' | 'Go Live';
  effortHours?: {
    riskManager: number;
    securityArchitect: number;
    soc: number;
  };
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function isPublicHoliday(date: Date, holidays: string[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

function isWorkingDay(date: Date, holidays: string[]): boolean {
  return !isWeekend(date) && !isPublicHoliday(date, holidays);
}

// Helper function to add working days to a date
function addWorkingDays(fromDate: Date, workingDays: number, holidays: string[]): Date {
  let date = new Date(fromDate);
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date, holidays)) {
      daysAdded++;
    }
  }
  
  return date;
}

export function useProjectTimeline(projectStartDate: string | null, goLiveDate: string | null, projectId?: string | null) {
  const { timelineActivities, ukPublicHolidays } = useAppSettings();
  const [roleAllocations, setRoleAllocations] = useState<Record<string, number>>({});
  
  // Fetch team members and their time allocations
  useEffect(() => {
    const loadRoleAllocations = async () => {
      if (!projectId) {
        setRoleAllocations({});
        return;
      }

      try {
        // Get project members with their roles
        const { data: members, error: membersError } = await supabase
          .from('project_members')
          .select('user_id, role')
          .eq('project_id', projectId);

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
          setRoleAllocations({});
          return;
        }

        // Get time allocations for these users
        const userIds = members.map(m => m.user_id);
        const { data: allocations, error: allocError } = await supabase
          .from('project_time_allocation')
          .select('user_id, allocation_percentage')
          .eq('project_id', projectId)
          .in('user_id', userIds);

        if (allocError) throw allocError;

        // Create a map of role to allocation percentage
        const roleAllocationMap: Record<string, number> = {};
        
        members.forEach(member => {
          const allocation = allocations?.find(a => a.user_id === member.user_id);
          const percentage = allocation?.allocation_percentage || 100; // Default to 100% if not set
          
          // Map project roles to timeline activity roles
          let timelineRole = '';
          switch (member.role) {
            case 'risk_manager':
              timelineRole = 'infoAssurer';
              break;
            case 'security_architect':
              timelineRole = 'securityArchitect';
              break;
            case 'sec_mon':
            case 'sec_eng':
              timelineRole = 'soc';
              break;
          }
          
          if (timelineRole) {
            roleAllocationMap[timelineRole] = percentage;
          }
        });

        setRoleAllocations(roleAllocationMap);
      } catch (error) {
        console.error('Error loading role allocations:', error);
        setRoleAllocations({});
      }
    };

    loadRoleAllocations();
  }, [projectId]);

  // Convert holidays to string array for easier comparison
  const holidayDates = useMemo(() => 
    ukPublicHolidays.map(h => h.date), 
    [ukPublicHolidays]
  );
  
  const timeline = useMemo(() => {
    if (!projectStartDate || timelineActivities.length === 0) return [];

    const events: TimelineEvent[] = [];
    let currentDate = new Date(projectStartDate);

    // Add Project Start milestone
    events.push({
      name: 'Project Start',
      date: new Date(currentDate),
      isMilestone: true,
      phase: 'Discovery'
    });

    // Process activities in forward order
    for (let i = 0; i < timelineActivities.length; i++) {
      const activity = timelineActivities[i];
      
      if (activity.isMilestone) {
        events.push({
          name: activity.name,
          date: new Date(currentDate),
          isMilestone: true,
          phase: activity.name === 'End Security Discovery' ? 'Discovery' : 'Alpha'
        });
      } else {
        // Calculate duration for each role, adjusted by allocation percentage
        const adjustedDays = {
          infoAssurer: activity.infoAssurerDays / ((roleAllocations['infoAssurer'] || 100) / 100),
          securityArchitect: activity.securityArchitectDays / ((roleAllocations['securityArchitect'] || 100) / 100),
          soc: activity.socAnalystDays / ((roleAllocations['soc'] || 100) / 100)
        };

        // Calculate maximum duration across all roles (after adjustment)
        const maxDays = Math.ceil(Math.max(
          adjustedDays.infoAssurer,
          adjustedDays.securityArchitect,
          adjustedDays.soc
        ));

        if (maxDays > 0) {
          // Add working days
          currentDate = addWorkingDays(currentDate, maxDays, holidayDates);
          
          // Determine phase
          let phase: 'Discovery' | 'Alpha' | 'Go Live' = 'Discovery';
          if (i > 16) phase = 'Alpha'; // After "End Discovery" milestone
          
          events.push({
            name: activity.name,
            date: new Date(currentDate),
            isMilestone: false,
            phase,
            effortHours: {
              riskManager: activity.infoAssurerDays * 8, // Convert days to hours (8 hours/day)
              securityArchitect: activity.securityArchitectDays * 8,
              soc: activity.socAnalystDays * 8
            }
          });
        }
      }
    }

    // Add End Security Alpha milestone
    events.push({
      name: 'End Security Alpha',
      date: new Date(currentDate),
      isMilestone: true,
      phase: 'Alpha'
    });

    // Add Go Live milestone if date is provided
    if (goLiveDate) {
      events.push({
        name: 'Go Live',
        date: new Date(goLiveDate),
        isMilestone: true,
        phase: 'Go Live'
      });
    }

    return events;
  }, [projectStartDate, goLiveDate, timelineActivities, holidayDates, roleAllocations]);

  // Get key milestones only
  const milestones = useMemo(() => {
    return timeline.filter(event => event.isMilestone);
  }, [timeline]);

  return { timeline, milestones };
}
