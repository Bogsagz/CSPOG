import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Download, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDeliverables, DeliverablesFilters } from "@/hooks/useDeliverables";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAppSettings } from "@/hooks/useAppSettings";
import { downloadCSV } from "@/lib/csvExport";

export default function Deliverables() {
  const { workstreams, projectRoles } = useAppSettings();
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [groupType, setGroupType] = useState<"workstream" | "whole_team" | "primary_role" | "individual" | "project">("workstream");
  const [groupValue, setGroupValue] = useState<string>("");
  const [filters, setFilters] = useState<DeliverablesFilters | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-deliverables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("disabled", false)
        .order("first_name");
      if (error) throw error;
      return data;
    }
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-for-deliverables"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_list');
      if (error) throw error;
      return data;
    }
  });

  const { results, isLoading } = useDeliverables(filters);

  const handleGenerate = () => {
    if (!startDate || !endDate) return;

    setFilters({
      startDate,
      endDate,
      groupType,
      groupValue: groupType === "whole_team" ? undefined : groupValue
    });
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;

    const csvData: any[][] = [
      ["Deliverable", "Project", "Completed By", "SFIA Grade", "Date", "Hours", "Cost"]
    ];

    results.forEach(deliverable => {
      deliverable.completions.forEach(completion => {
        csvData.push([
          deliverable.deliverableName,
          completion.projectTitle,
          completion.userName,
          completion.sfiaGrade || "N/A",
          completion.completedDate,
          completion.effortHours.toFixed(1),
          `£${completion.cost.toFixed(2)}`
        ]);
      });
    });

    downloadCSV(csvData, `deliverables-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const renderGroupValueSelector = () => {
    if (groupType === "whole_team") return null;

    if (groupType === "workstream") {
      return (
        <div className="space-y-2">
          <Label>Workstream</Label>
          <Select value={groupValue} onValueChange={setGroupValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select workstream" />
            </SelectTrigger>
            <SelectContent>
              {workstreams.map(ws => (
                <SelectItem key={ws} value={ws}>{ws}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (groupType === "primary_role") {
      return (
        <div className="space-y-2">
          <Label>Primary Role</Label>
          <Select value={groupValue} onValueChange={setGroupValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(projectRoles).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (groupType === "individual") {
      return (
        <div className="space-y-2">
          <Label>Individual</Label>
          <Select value={groupValue} onValueChange={setGroupValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map(profile => (
                <SelectItem key={profile.id} value={profile.id}>
                  {`${profile.first_name} ${profile.last_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (groupType === "project") {
      return (
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={groupValue} onValueChange={setGroupValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return null;
  };

  const canGenerate = startDate && endDate && (groupType === "whole_team" || groupValue);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deliverables Report</h1>
        <p className="text-muted-foreground">
          View completed deliverables across all projects
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select time period and user group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

          </div>

          <div className="space-y-2">
            <Label>Group By</Label>
            <Select value={groupType} onValueChange={(value: any) => {
              setGroupType(value);
              setGroupValue("");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workstream">Workstream</SelectItem>
                <SelectItem value="whole_team">Whole Team</SelectItem>
                <SelectItem value="primary_role">Primary Role</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="project">Project Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderGroupValueSelector()}

          <Button 
            onClick={handleGenerate} 
            disabled={!canGenerate}
            className="w-full"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && results.length === 0 && filters && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No completed deliverables found for the selected date range.
          </CardContent>
        </Card>
      )}

      {!isLoading && results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Deliverables Results</CardTitle>
              <CardDescription>
                Completed deliverables from {startDate && format(startDate, "PPP")} to {endDate && format(endDate, "PPP")}
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
          {results.map((deliverable) => (
            <Collapsible key={deliverable.deliverableName}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="text-left">
                      <CardTitle className="flex items-center gap-2">
                        {deliverable.deliverableName}
                        <ChevronDown className="h-4 w-4" />
                      </CardTitle>
                      <CardDescription>
                        {deliverable.completions.length} completion(s) • {deliverable.totalHours.toFixed(1)} hours • £
                        {deliverable.totalCost.toFixed(2)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Project</th>
                            <th className="text-left p-2 font-medium">Completed By</th>
                            <th className="text-left p-2 font-medium">SFIA Grade</th>
                            <th className="text-left p-2 font-medium">Date Completed</th>
                            <th className="text-right p-2 font-medium">Hours</th>
                            <th className="text-right p-2 font-medium">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliverable.completions.map((completion, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{completion.projectTitle}</td>
                              <td className="p-2">{completion.userName}</td>
                              <td className="p-2">{completion.sfiaGrade || "N/A"}</td>
                              <td className="p-2">{completion.completedDate}</td>
                              <td className="p-2 text-right">{completion.effortHours.toFixed(1)}</td>
                              <td className="p-2 text-right">£{completion.cost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
