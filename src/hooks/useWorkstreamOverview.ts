import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';

// Map URL workstream to database enum value
const mapWorkstreamToDbValue = (workstream: string): string => {
  const mapping: Record<string, string> = {
    'migration': 'Mig',
    'ie': 'IE',
    'land': 'Land',
    'sea': 'Sea',
    'platforms': 'Plat',
    'mig': 'Mig',
    'plat': 'Plat'
  };
  return mapping[workstream.toLowerCase()] || workstream;
};

export interface WorkstreamAbsence {
  id: string;
  user_name: string;
  project_title: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

export interface WorkstreamDeliverable {
  id: string;
  deliverable_name: string;
  project_title: string;
  person_name: string;
  due_date: string;
  is_completed: boolean;
  owner_role: string;
}

export interface WeekData {
  startDate: Date;
  endDate: Date;
  absences: WorkstreamAbsence[];
  deliverables: WorkstreamDeliverable[];
}

export function useWorkstreamOverview(workstream: string | undefined) {
  const [thisWeek, setThisWeek] = useState<WeekData | null>(null);
  const [nextWeek, setNextWeek] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (workstream) {
      loadOverviewData();
    }
  }, [workstream]);

  // Set up real-time subscriptions for automatic updates
  useEffect(() => {
    if (!workstream) return;

    const dbWorkstream = mapWorkstreamToDbValue(workstream);
    
    const channel = supabase
      .channel('workstream-overview-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `workstream=eq.${dbWorkstream}`
        },
        () => {
          loadOverviewData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_deliverable_assignments'
        },
        () => {
          loadOverviewData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_leave'
        },
        () => {
          loadOverviewData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workstream]);

  const getWeekRanges = () => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday, but we'll use Friday
    
    const nextWeekStart = addWeeks(thisWeekStart, 1);
    const nextWeekEnd = addWeeks(thisWeekEnd, 1);

    // Adjust to Friday
    const thisFriday = new Date(thisWeekStart);
    thisFriday.setDate(thisFriday.getDate() + 4);
    
    const nextFriday = new Date(nextWeekStart);
    nextFriday.setDate(nextFriday.getDate() + 4);

    return {
      thisWeek: { start: thisWeekStart, end: thisFriday },
      nextWeek: { start: nextWeekStart, end: nextFriday }
    };
  };

  const loadOverviewData = async () => {
    try {
      setIsLoading(true);
      const ranges = getWeekRanges();
      const dbWorkstream = mapWorkstreamToDbValue(workstream!);

      // Get all projects for this workstream (used for filtering and titles)
      const { data: wsProjects, error: wsProjectsError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('workstream', dbWorkstream as any);
      if (wsProjectsError) throw wsProjectsError;

      const projectIds = (wsProjects || []).map(p => p.id);
      const projectTitleMap = new Map<string, string>((wsProjects || []).map(p => [p.id, p.title]));

      // If no projects in this workstream, clear and exit early
      if (projectIds.length === 0) {
        setThisWeek({ startDate: ranges.thisWeek.start, endDate: ranges.thisWeek.end, absences: [], deliverables: [] });
        setNextWeek({ startDate: ranges.nextWeek.start, endDate: ranges.nextWeek.end, absences: [], deliverables: [] });
        setIsLoading(false);
        return;
      }

      // Fetch absences for both weeks (no FK joins; filter by project ids)
      const { data: absencesData, error: absencesError } = await supabase
        .from('team_leave')
        .select('id, start_date, end_date, absence_type, description, user_id, project_id')
        .in('project_id', projectIds)
        .gte('end_date', format(ranges.thisWeek.start, 'yyyy-MM-dd'))
        .lte('start_date', format(ranges.nextWeek.end, 'yyyy-MM-dd'));
      if (absencesError) throw absencesError;

      // Fetch deliverables for both weeks (filter by project ids)
      const { data: deliverablesData, error: deliverablesError } = await supabase
        .from('project_deliverable_assignments')
        .select('id, deliverable_name, due_date, is_completed, owner_role, project_id')
        .in('project_id', projectIds)
        .eq('is_completed', false)
        .gte('due_date', format(ranges.thisWeek.start, 'yyyy-MM-dd'))
        .lte('due_date', format(ranges.nextWeek.end, 'yyyy-MM-dd'))
        .order('due_date');
      if (deliverablesError) throw deliverablesError;

      // Get project members for deliverables to find responsible persons
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('project_id, user_id, role')
        .in('project_id', projectIds);
      if (membersError) throw membersError;

      // Build user name map for all users we need (from absences and members)
      const userIdsNeeded = Array.from(new Set([
        ...((absencesData || []).map(a => a.user_id)),
        ...((membersData || []).map(m => m.user_id)),
      ]));
      let profileNameMap = new Map<string, string>();
      if (userIdsNeeded.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIdsNeeded);
        if (profilesError) throw profilesError;
        profileNameMap = new Map(
          (profilesData || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'])
        );
      }

      // Process absences - deduplicate by user_id (show each absence once per person)
      const absencesByUser = new Map<string, any>();
      (absencesData || []).forEach((absence: any) => {
        const key = `${absence.user_id}_${absence.start_date}_${absence.end_date}`;
        if (!absencesByUser.has(key)) {
          absencesByUser.set(key, absence);
        }
      });

      const processedAbsences: WorkstreamAbsence[] = Array.from(absencesByUser.values()).map((absence: any) => ({
        id: absence.id,
        user_name: profileNameMap.get(absence.user_id) || 'Unknown',
        project_title: projectTitleMap.get(absence.project_id) || 'Unknown Project',
        absence_type: absence.absence_type,
        start_date: absence.start_date,
        end_date: absence.end_date,
        description: absence.description
      }));

      // Process deliverables
      const processedDeliverables: WorkstreamDeliverable[] = (deliverablesData || []).map((deliverable: any) => {
        const member = (membersData || []).find(
          (m: any) => m.project_id === deliverable.project_id && m.role === deliverable.owner_role
        );
        const personName = member ? (profileNameMap.get(member.user_id) || 'Unknown') : deliverable.owner_role.replace(/_/g, ' ');
        return {
          id: deliverable.id,
          deliverable_name: deliverable.deliverable_name,
          project_title: projectTitleMap.get(deliverable.project_id) || 'Unknown Project',
          person_name: personName,
          due_date: deliverable.due_date,
          is_completed: deliverable.is_completed,
          owner_role: deliverable.owner_role
        };
      });

      // Split into this week and next week
      const thisWeekAbsences = processedAbsences.filter(a => {
        const start = new Date(a.start_date);
        const end = new Date(a.end_date);
        return (start <= ranges.thisWeek.end && end >= ranges.thisWeek.start);
      });

      const nextWeekAbsences = processedAbsences.filter(a => {
        const start = new Date(a.start_date);
        const end = new Date(a.end_date);
        return (start <= ranges.nextWeek.end && end >= ranges.nextWeek.start);
      });

      const thisWeekDeliverables = processedDeliverables.filter(d => {
        const dueDate = new Date(d.due_date);
        return dueDate >= ranges.thisWeek.start && dueDate <= ranges.thisWeek.end;
      });

      const nextWeekDeliverables = processedDeliverables.filter(d => {
        const dueDate = new Date(d.due_date);
        return dueDate >= ranges.nextWeek.start && dueDate <= ranges.nextWeek.end;
      });

      setThisWeek({
        startDate: ranges.thisWeek.start,
        endDate: ranges.thisWeek.end,
        absences: thisWeekAbsences,
        deliverables: thisWeekDeliverables
      });

      setNextWeek({
        startDate: ranges.nextWeek.start,
        endDate: ranges.nextWeek.end,
        absences: nextWeekAbsences,
        deliverables: nextWeekDeliverables
      });

    } catch (error) {
      console.error('Error loading workstream overview:', error);
      toast.error('Failed to load workstream overview');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    thisWeek,
    nextWeek,
    isLoading,
    refreshData: loadOverviewData
  };
}
