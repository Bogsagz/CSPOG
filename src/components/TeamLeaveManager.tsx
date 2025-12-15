import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { useTeamLeave } from '@/hooks/useTeamLeave';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { getUserDisplayName } from '@/lib/userUtils';
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
} from '@/components/ui/alert-dialog';

interface TeamLeaveManagerProps {
  projectId: string;
}

interface LeaveItem {
  id: string;
  date: string;
  endDate?: string;
  name: string;
  isPublicHoliday: boolean;
  user_id: string | null;
  leaveId?: string;
}

export function TeamLeaveManager({ projectId }: TeamLeaveManagerProps) {
  const { leaves, addLeave, deleteLeave, isLoading } = useTeamLeave(projectId);
  const { members } = useProjectMembers(projectId);
  const { user } = useAuth();
  const { permissions } = useProjectPermissions(projectId, user?.id || null);
  const { ukPublicHolidays } = useAppSettings();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [absenceType, setAbsenceType] = useState<string>('leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);
  const { absenceTypes } = useAppSettings();

  const handleAddLeave = async () => {
    if (!selectedUserId || !startDate || !endDate) {
      return;
    }

    await addLeave(selectedUserId, startDate, endDate, absenceType as 'leave' | 'sickness' | 'other' | 'working_elsewhere', description);
    setIsDialogOpen(false);
    setSelectedUserId('');
    setAbsenceType('leave');
    setStartDate('');
    setEndDate('');
    setDescription('');
  };

  // Combine and sort all leave dates
  const upcomingLeave: LeaveItem[] = [
    ...ukPublicHolidays.map(h => ({
      id: h.date,
      date: h.date,
      name: h.name,
      isPublicHoliday: true,
      user_id: null
    })),
    ...leaves.map(l => {
      const member = members.find(m => m.user_id === l.user_id);
      const memberName = getUserDisplayName(member?.first_name, member?.last_name);
      
      return {
        id: l.id,
        date: l.start_date,
        endDate: l.end_date,
        name: `${memberName} - ${l.description || 'Leave'}`,
        isPublicHoliday: false,
        user_id: l.user_id,
        leaveId: l.id
      };
    })
  ]
    .filter(item => new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Team Leave & Holidays
          </CardTitle>
          {permissions.canWriteTables && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Team Member</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {getUserDisplayName(member.first_name, member.last_name)} - {member.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Absence Type</Label>
                    <Select value={absenceType} onValueChange={setAbsenceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select absence type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {absenceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="e.g., Annual leave"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddLeave} className="w-full">
                    Add Leave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {upcomingLeave.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No upcoming leave or holidays</p>
        ) : (
          <div className="space-y-2">
            {upcomingLeave.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.isPublicHoliday ? 'bg-primary/5 border-primary/20' : 'bg-background'
                }`}
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    {item.endDate && item.endDate !== item.date && (
                      <> - {new Date(item.endDate).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</>
                    )}
                  </p>
                  </div>
                  {!item.isPublicHoliday && permissions.canWriteTables && item.leaveId && (
                    <AlertDialog open={deleteLeaveId === item.leaveId} onOpenChange={(open) => !open && setDeleteLeaveId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteLeaveId(item.leaveId!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Leave Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this leave entry? This action cannot be undone.
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              {item.name}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteLeave(item.leaveId!);
                              setDeleteLeaveId(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
