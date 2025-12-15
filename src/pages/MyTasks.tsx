import { useAuth } from "@/hooks/useAuth";
import { useMyTasks } from "@/hooks/useMyTasks";
import { useActiveTask } from "@/hooks/useActiveTask";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarDays, FolderKanban, User, Clock, Briefcase, Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyTasks() {
  const { user } = useAuth();
  const { deliverables, isLoading, refreshDeliverables } = useMyTasks(user?.id);
  const { activeTask, calculatedHours, startWorking, stopWorking } = useActiveTask(user?.id);
  const navigate = useNavigate();

  const handleStartWorking = async (deliverableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await startWorking(deliverableId);
    refreshDeliverables();
  };

  const handleStopWorking = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await stopWorking();
    refreshDeliverables();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const formatDateRange = (start: Date, end: Date) => {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const getStatusBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysDiff <= 2) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Due Soon</Badge>;
    }
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  const renderDeliverablesList = (items: typeof deliverables.thisWeek) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No deliverables for this week</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => {
          const isActive = activeTask?.id === item.id;
          const displayHours = isActive && calculatedHours 
            ? calculatedHours.displayHours 
            : item.estimated_effort_remaining;

          return (
            <Card key={item.id} className={isActive ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-base">{item.deliverable_name}</h4>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleStopWorking}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleStartWorking(item.id, e)}
                          disabled={!!activeTask}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {getStatusBadge(item.due_date)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FolderKanban className="h-4 w-4" />
                      <span>{item.project_title}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="capitalize">{item.role.replace(/_/g, " ")}</span>
                    </div>
                    
                    {item.due_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Due: {format(new Date(item.due_date), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-2 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      <Clock className="h-4 w-4" />
                      <span>{displayHours.toFixed(1)}h remaining</span>
                      {isActive && <Badge variant="outline" className="text-xs">Active</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-orbitron">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Your upcoming deliverables across all projects
        </p>
      </div>

      {/* Currently Working On */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-orbitron">
            <Briefcase className="h-5 w-5" />
            Currently Working On
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All active deliverables across your projects
          </p>
        </CardHeader>
        <CardContent>
          {deliverables.currentlyWorkingOn.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active deliverables</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliverables.currentlyWorkingOn.map((item) => {
                const isActive = activeTask?.id === item.id;
                const displayHours = isActive && calculatedHours 
                  ? calculatedHours.displayHours 
                  : item.estimated_effort_remaining;

                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer hover:bg-accent/50 transition-colors ${isActive ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => navigate(`/project/${item.project_id}/home`)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base">
                              <span className="text-muted-foreground font-normal">Project: </span>
                              {item.project_title}
                            </h4>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Deliverable: </span>
                              {item.deliverable_name}
                            </p>
                            <div className="space-y-1 text-sm mt-2">
                              <p>
                                <span className="text-muted-foreground">Due Date: </span>
                                {item.due_date ? format(new Date(item.due_date), "MMM d, yyyy") : "Not set"}
                              </p>
                              <p className={isActive ? "text-primary font-medium" : ""}>
                                <span className="text-muted-foreground">Remaining Effort: </span>
                                {displayHours.toFixed(1)}h
                                {isActive && <Badge variant="outline" className="ml-2 text-xs">Counting down</Badge>}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {isActive ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleStopWorking}
                              >
                                <Square className="h-3 w-3 mr-1" />
                                Stop Working
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => handleStartWorking(item.id, e)}
                                disabled={!!activeTask}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start Working
                              </Button>
                            )}
                            {getStatusBadge(item.due_date)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-orbitron">
              <CalendarDays className="h-5 w-5" />
              This Week
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(deliverables.thisWeekRange.start, deliverables.thisWeekRange.end)}
            </p>
          </CardHeader>
          <CardContent>
            {renderDeliverablesList(deliverables.thisWeek)}
          </CardContent>
        </Card>

        {/* Next Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-orbitron">
              <CalendarDays className="h-5 w-5" />
              Next Week
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(deliverables.nextWeekRange.start, deliverables.nextWeekRange.end)}
            </p>
          </CardHeader>
          <CardContent>
            {renderDeliverablesList(deliverables.nextWeek)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}