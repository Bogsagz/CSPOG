import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProjectTimelineRisk(projectId: string | null) {
  const [hasTimelineRisk, setHasTimelineRisk] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTimelineRisk = async () => {
      if (!projectId) {
        setHasTimelineRisk(false);
        setIsLoading(false);
        return;
      }

      try {
        // Get project's go-live date
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('anticipated_go_live')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        // If no go-live date is set, no risk
        if (!project?.anticipated_go_live) {
          setHasTimelineRisk(false);
          setIsLoading(false);
          return;
        }

        // Get the last deliverable's due date
        const { data: deliverables, error: deliverablesError } = await supabase
          .from('project_deliverable_assignments')
          .select('due_date')
          .eq('project_id', projectId)
          .order('due_date', { ascending: false })
          .limit(1);

        if (deliverablesError) throw deliverablesError;

        // Check if last deliverable is after go-live date
        if (deliverables && deliverables.length > 0 && deliverables[0].due_date) {
          const lastDeliverableDate = new Date(deliverables[0].due_date);
          const goLiveDate = new Date(project.anticipated_go_live);
          setHasTimelineRisk(lastDeliverableDate > goLiveDate);
        } else {
          setHasTimelineRisk(false);
        }
      } catch (error) {
        console.error('Error checking timeline risk:', error);
        setHasTimelineRisk(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTimelineRisk();
  }, [projectId]);

  return { hasTimelineRisk, isLoading };
}
