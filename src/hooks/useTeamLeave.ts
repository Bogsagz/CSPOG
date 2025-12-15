import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeamLeave {
  id: string;
  project_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  description: string | null;
  absence_type: string;
}

export function useTeamLeave(projectId: string | undefined) {
  const [leaves, setLeaves] = useState<TeamLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadLeaves();
    }
  }, [projectId]);

  const loadLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('team_leave')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error loading team leave:', error);
      toast.error('Failed to load team leave data');
    } finally {
      setIsLoading(false);
    }
  };

  const addLeave = async (userId: string, startDate: string, endDate: string, absenceType: 'leave' | 'sickness' | 'other' | 'working_elsewhere' = 'leave', description?: string) => {
    try {
      const { error } = await supabase
        .from('team_leave')
        .insert({
          project_id: projectId,
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          absence_type: absenceType,
          description: description || null
        });

      if (error) throw error;
      
      toast.success('Leave added successfully');
      await loadLeaves();
    } catch (error) {
      console.error('Error adding leave:', error);
      toast.error('Failed to add leave');
    }
  };

  const deleteLeave = async (leaveId: string) => {
    try {
      const { error } = await supabase
        .from('team_leave')
        .delete()
        .eq('id', leaveId);

      if (error) throw error;
      
      toast.success('Leave deleted successfully');
      await loadLeaves();
    } catch (error) {
      console.error('Error deleting leave:', error);
      toast.error('Failed to delete leave');
    }
  };

  return {
    leaves,
    isLoading,
    addLeave,
    deleteLeave,
    refreshLeaves: loadLeaves
  };
}
