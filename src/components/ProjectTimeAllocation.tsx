import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProjectTimeAllocation } from "@/hooks/useProjectTimeAllocation";
import { useAppSettings } from "@/hooks/useAppSettings";
import { PieChart, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Project {
  id: string;
  title: string;
}

interface ProjectTimeAllocationProps {
  projects: Project[];
}

export default function ProjectTimeAllocation({ projects }: ProjectTimeAllocationProps) {
  const { user } = useAuth();
  const { allocations, updateAllocation } = useProjectTimeAllocation(user?.id);
  const { workingHoursPerWeek, isLoading: settingsLoading } = useAppSettings();
  const [localAllocations, setLocalAllocations] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const TOTAL_HOURS = workingHoursPerWeek;

  // Initialize local allocations from database (convert percentage to hours)
  useEffect(() => {
    if (allocations && projects.length > 0) {
      const allocationMap: Record<string, number> = {};
      
      projects.forEach(project => {
        const existing = allocations.find(a => a.project_id === project.id);
        // Convert percentage to hours: percentage * 40 / 100
        allocationMap[project.id] = existing ? Math.round((existing.allocation_percentage * TOTAL_HOURS) / 100) : 0;
      });
      
      setLocalAllocations(allocationMap);
    }
  }, [allocations, projects]);

  const totalHours = Object.values(localAllocations).reduce((sum, val) => sum + val, 0);
  const isValid = totalHours === TOTAL_HOURS || totalHours === 0;

  const handleSliderChange = (projectId: string, value: number[]) => {
    setLocalAllocations(prev => ({
      ...prev,
      [projectId]: value[0]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isValid && totalHours > 0) {
      return;
    }

    for (const [projectId, hours] of Object.entries(localAllocations)) {
      // Convert hours to percentage: (hours / 40) * 100
      const percentage = (hours / TOTAL_HOURS) * 100;
      await updateAllocation.mutateAsync({ projectId, percentage });
    }
    
    setHasChanges(false);
  };

  const handleReset = () => {
    if (allocations) {
      const allocationMap: Record<string, number> = {};
      projects.forEach(project => {
        const existing = allocations.find(a => a.project_id === project.id);
        allocationMap[project.id] = existing ? Math.round((existing.allocation_percentage * TOTAL_HOURS) / 100) : 0;
      });
      setLocalAllocations(allocationMap);
    }
    setHasChanges(false);
  };

  const handleEqualSplit = () => {
    const hoursPerProject = projects.length > 0 ? Math.floor(TOTAL_HOURS / projects.length) : 0;
    const remainder = TOTAL_HOURS - (hoursPerProject * projects.length);
    const newAllocations: Record<string, number> = {};
    
    projects.forEach((project, index) => {
      // Give the remainder to the first project
      newAllocations[project.id] = hoursPerProject + (index === 0 ? remainder : 0);
    });
    
    setLocalAllocations(newAllocations);
    setHasChanges(true);
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Time Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Loading settings...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Time Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No projects assigned. Join a project to allocate your time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Time Allocation Across Projects
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Allocate your {TOTAL_HOURS} hours per week across projects
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isValid && totalHours > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Total must equal {TOTAL_HOURS} hours. Current total: {totalHours} hours
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-medium">Total: </span>
            <span className={totalHours === TOTAL_HOURS ? "text-primary" : "text-destructive"}>
              {totalHours}/{TOTAL_HOURS} hours
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEqualSplit}
          >
            Split Equally
          </Button>
        </div>

        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor={`slider-${project.id}`} className="font-medium">
                  {project.title}
                </Label>
                <span className="text-sm font-medium">
                  {localAllocations[project.id] || 0} hours
                </span>
              </div>
              <Slider
                id={`slider-${project.id}`}
                min={0}
                max={TOTAL_HOURS}
                step={1}
                value={[localAllocations[project.id] || 0]}
                onValueChange={(value) => handleSliderChange(project.id, value)}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!isValid && totalHours > 0}
              className="flex-1"
            >
              Save Allocation
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
