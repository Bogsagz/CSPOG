import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import { CalendarOff, Trash2, Calendar } from "lucide-react";
import { z } from "zod";
import ProjectTimeAllocation from "@/components/ProjectTimeAllocation";
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
} from "@/components/ui/alert-dialog";

const absenceSchema = z.object({
  absenceType: z.enum(['leave', 'sickness', 'other', 'working_elsewhere'], { message: "Please select an absence type" }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

interface Project {
  id: string;
  title: string;
}

interface TeamLeave {
  id: string;
  project_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  description: string | null;
  absence_type: string;
  project_title?: string;
  user_email?: string;
}

export default function ManageAbsences() {
  const { user } = useAuth();
  const { ukPublicHolidays } = useAppSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaves, setLeaves] = useState<TeamLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [absenceType, setAbsenceType] = useState<'leave' | 'sickness' | 'other' | 'working_elsewhere'>('leave');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load user's projects
      const { data: projectMembers, error: membersError } = await supabase
        .from("project_members")
        .select("project_id, projects(id, title)")
        .eq("user_id", user.id);

      if (membersError) throw membersError;

      const userProjects = projectMembers?.map(pm => ({
        id: (pm.projects as any).id,
        title: (pm.projects as any).title
      })) || [];

      setProjects(userProjects);

      // Load user's leaves
      const { data: leavesData, error: leavesError } = await supabase
        .from("team_leave")
        .select(`
          *,
          projects(title)
        `)
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (leavesError) throw leavesError;

      const formattedLeaves = leavesData?.map(leave => ({
        ...leave,
        project_title: (leave.projects as any)?.title
      })) || [];

      // Deduplicate absences - show only one per unique date/type combination
      const uniqueLeaves: TeamLeave[] = [];
      const seenAbsences = new Set<string>();

      formattedLeaves.forEach(leave => {
        // Create a unique key based on dates, type, and description
        const key = `${leave.start_date}|${leave.end_date}|${leave.absence_type}|${leave.description || ''}`;
        
        if (!seenAbsences.has(key)) {
          seenAbsences.add(key);
          uniqueLeaves.push(leave);
        }
      });

      setLeaves(uniqueLeaves);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load absences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    // Validate inputs
    const validation = absenceSchema.safeParse({
      absenceType,
      startDate,
      endDate,
      description: description.trim()
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      toast.error("Please fix the errors before submitting");
      return;
    }

    setErrors({});

    try {
      // Insert absence for all user's projects
      const insertPromises = projects.map(project => 
        supabase
          .from("team_leave")
          .insert({
            project_id: project.id,
            user_id: user.id,
            start_date: startDate,
            end_date: endDate,
            absence_type: absenceType,
            description: description.trim() || null
          })
      );

      const results = await Promise.all(insertPromises);
      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        throw new Error("Failed to add absence to some projects");
      }

      const typeLabel = absenceType === 'leave' ? 'Leave' : 
                        absenceType === 'sickness' ? 'Sickness' :
                        absenceType === 'working_elsewhere' ? 'Working elsewhere' : 'Other';
      toast.success(`${typeLabel} recorded for all your projects`);
      setAbsenceType('leave');
      setStartDate("");
      setEndDate("");
      setDescription("");
      await loadData();
    } catch (error) {
      console.error("Error adding absence:", error);
      toast.error("Failed to record absence");
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      // Find the leave to get its details for deleting all matching entries
      const leaveToDelete = leaves.find(l => l.id === leaveId);
      if (!leaveToDelete) {
        toast.error("Leave entry not found");
        return;
      }

      // Delete all leave entries that match the same date range and type
      // This ensures we delete the absence from all projects
      const { error } = await supabase
        .from("team_leave")
        .delete()
        .eq("user_id", user!.id)
        .eq("start_date", leaveToDelete.start_date)
        .eq("end_date", leaveToDelete.end_date)
        .eq("absence_type", leaveToDelete.absence_type);

      if (error) throw error;

      toast.success("Absence deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting leave:", error);
      toast.error("Failed to delete absence");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading absences...</p>
      </div>
    );
  }

  const upcomingAbsences = leaves.filter(leave => new Date(leave.end_date) >= new Date());
  const pastAbsences = leaves.filter(leave => new Date(leave.end_date) < new Date());

  // Get upcoming UK public holidays (next 3 months)
  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  const upcomingHolidays = ukPublicHolidays
    .filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= today && holidayDate <= threeMonthsFromNow;
    })
    .slice(0, 5);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">My Time</h2>
        <p className="text-muted-foreground">
          Record and manage your absences - they will automatically adjust project timelines
        </p>
      </div>

      {/* Time Allocation Tool */}
      <div className="mb-8">
        <ProjectTimeAllocation projects={projects} />
      </div>

      {/* Planned Absences */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planned Absences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upcoming Public Holidays */}
          {upcomingHolidays.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                Upcoming Public Holidays (Next 3 Months)
              </h3>
              <div className="space-y-2">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.date}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(holiday.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      UK Holiday
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User's Planned Absences */}
          {upcomingAbsences.length > 0 && (
            <>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                Your Planned Absences
              </h3>
              <div className="space-y-3">
                {upcomingAbsences.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          leave.absence_type === 'sickness' 
                            ? 'bg-destructive/10 text-destructive' 
                            : leave.absence_type === 'working_elsewhere'
                            ? 'bg-blue-500/10 text-blue-600'
                            : leave.absence_type === 'other'
                            ? 'bg-orange-500/10 text-orange-600'
                            : leave.absence_type === 'public_holiday'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {leave.absence_type === 'sickness' ? 'Sickness' : 
                           leave.absence_type === 'working_elsewhere' ? 'Working elsewhere' :
                           leave.absence_type === 'other' ? 'Other' : 
                           leave.absence_type === 'public_holiday' ? 'Public Holiday' : 'Leave'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(leave.start_date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {" - "}
                        {new Date(leave.end_date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      {leave.description && (
                        <p className="text-sm text-muted-foreground mt-1">{leave.description}</p>
                    )}
                  </div>
                  {leave.absence_type !== 'public_holiday' && (
                    <AlertDialog open={deleteLeaveId === leave.id} onOpenChange={(open) => !open && setDeleteLeaveId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteLeaveId(leave.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Absence</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this absence? This will remove it from all your projects and cannot be undone.
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>{leave.absence_type === 'sickness' ? 'Sickness' : 
                               leave.absence_type === 'working_elsewhere' ? 'Working elsewhere' :
                               leave.absence_type === 'other' ? 'Other' : 'Leave'}</strong>
                              <br />
                              {new Date(leave.start_date).toLocaleDateString('en-GB')} - {new Date(leave.end_date).toLocaleDateString('en-GB')}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              handleDeleteLeave(leave.id);
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
            </>
          )}

          {upcomingAbsences.length === 0 && upcomingHolidays.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No planned absences or upcoming holidays in the next 3 months.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Record Absence Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Forecast or Record Absence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="absence-type">Absence Type *</Label>
              <Select value={absenceType} onValueChange={(value: 'leave' | 'sickness' | 'other' | 'working_elsewhere') => setAbsenceType(value)}>
                <SelectTrigger id="absence-type" className={errors.absenceType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select absence type" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="sickness">Sickness</SelectItem>
                  <SelectItem value="working_elsewhere">Working Elsewhere</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.absenceType && (
                <p className="text-sm text-destructive mt-1">{errors.absenceType}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={errors.startDate ? "border-destructive" : ""}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive mt-1">{errors.startDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={errors.endDate ? "border-destructive" : ""}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Annual leave, Doctor appointment"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                maxLength={500}
                className={errors.description ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500 characters
              </p>
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This absence will be recorded across all your projects ({projects.length} project{projects.length !== 1 ? 's' : ''}) 
                and will automatically adjust project timelines.
              </p>
            </div>

            <Button onClick={handleAddLeave} className="w-full" size="lg">
              Record Absence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Absences */}
      {pastAbsences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Previous Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastAbsences.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        leave.absence_type === 'sickness' 
                          ? 'bg-destructive/10 text-destructive' 
                          : leave.absence_type === 'working_elsewhere'
                          ? 'bg-blue-500/10 text-blue-600'
                          : leave.absence_type === 'other'
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {leave.absence_type === 'sickness' ? 'Sickness' : 
                         leave.absence_type === 'working_elsewhere' ? 'Working elsewhere' :
                         leave.absence_type === 'other' ? 'Other' : 'Leave'}
                      </span>
                      <p className="text-sm font-medium">{leave.project_title || "Unknown Project"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(leave.start_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {" - "}
                      {new Date(leave.end_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    {leave.description && (
                      <p className="text-xs text-muted-foreground mt-1">{leave.description}</p>
                    )}
                  </div>
                  <AlertDialog open={deleteLeaveId === leave.id} onOpenChange={(open) => !open && setDeleteLeaveId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteLeaveId(leave.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Past Absence</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this past absence record? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleDeleteLeave(leave.id);
                            setDeleteLeaveId(null);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
