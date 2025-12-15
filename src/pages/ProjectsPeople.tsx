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
import { useProjectsPeople, ProjectsPeopleFilters } from "@/hooks/useProjectsPeople";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAppSettings } from "@/hooks/useAppSettings";
import { downloadCSV } from "@/lib/csvExport";

export default function ProjectsPeople() {
  const { workstreams, projectRoles } = useAppSettings();
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [groupType, setGroupType] = useState<"workstream" | "whole_team" | "primary_role" | "individual" | "project">("workstream");
  const [groupValue, setGroupValue] = useState<string>("");
  const [filters, setFilters] = useState<ProjectsPeopleFilters | null>(null);

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-projectspeople"],
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
    queryKey: ["projects-for-projectspeople"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_list');
      if (error) throw error;
      return data;
    }
  });

  const { results, isLoading } = useProjectsPeople(filters);

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
    if (!results) return;

    const csvData: any[][] = [];

    // Projects Started
    csvData.push(["Projects Started"]);
    csvData.push(["Project Name", "Start Date", "End Date", "Total Days", "Total Cost"]);
    results.projectsStarted.items.forEach(p => {
      csvData.push([p.name, p.startDate, p.endDate || "Ongoing", p.totalDays, `£${p.totalCost.toFixed(2)}`]);
    });
    csvData.push([]);

    // Projects Completed
    csvData.push(["Projects Completed"]);
    csvData.push(["Project Name", "Start Date", "Completion Date", "Total Days", "Total Cost"]);
    results.projectsCompleted.items.forEach(p => {
      csvData.push([p.name, p.startDate, p.endDate, p.totalDays, `£${p.totalCost.toFixed(2)}`]);
    });
    csvData.push([]);

    // Users Created
    csvData.push(["Users Created"]);
    csvData.push(["Name", "Role", "Grade", "Join Date", "Days Active", "Total Cost"]);
    results.usersCreated.items.forEach(u => {
      csvData.push([u.name, u.role, u.grade || "N/A", u.joinDate, u.totalDays, `£${u.totalCost.toFixed(2)}`]);
    });
    csvData.push([]);

    // Users Disabled
    csvData.push(["Users Disabled"]);
    csvData.push(["Name", "Role", "Grade", "Join Date", "Disabled Date", "Days Active", "Total Cost"]);
    results.usersDisabled.items.forEach(u => {
      csvData.push([u.name, u.role, u.grade || "N/A", u.joinDate, u.endDate, u.totalDays, `£${u.totalCost.toFixed(2)}`]);
    });
    csvData.push([]);

    // Handovers
    csvData.push(["Role Handovers"]);
    csvData.push(["Project", "Role", "From", "To", "Date"]);
    results.handovers.items.forEach(h => {
      csvData.push([h.projectName, h.role, h.fromUser, h.toUser, h.date]);
    });

    downloadCSV(csvData, `projects-people-${format(new Date(), "yyyy-MM-dd")}.csv`);
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
        <h1 className="text-3xl font-bold">Projects & People Report</h1>
        <p className="text-muted-foreground">
          View project and user activity statistics
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

      {!isLoading && results && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="space-y-4">
          {/* Projects Started */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      Projects Started
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                    <CardDescription>
                      {results.projectsStarted.count} project(s) started in this period
                    </CardDescription>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {results.projectsStarted.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Project Name</th>
                            <th className="text-left p-2 font-medium">Start Date</th>
                            <th className="text-left p-2 font-medium">End Date</th>
                            <th className="text-right p-2 font-medium">Total Days</th>
                            <th className="text-right p-2 font-medium">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.projectsStarted.items.map((project, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{project.name}</td>
                              <td className="p-2">{project.startDate}</td>
                              <td className="p-2">{project.endDate || "Ongoing"}</td>
                              <td className="p-2 text-right">{project.totalDays}</td>
                              <td className="p-2 text-right">£{project.totalCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No projects started in this period</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Projects Completed */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      Projects Completed
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                    <CardDescription>
                      {results.projectsCompleted.count} project(s) completed in this period
                    </CardDescription>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {results.projectsCompleted.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Project Name</th>
                            <th className="text-left p-2 font-medium">Start Date</th>
                            <th className="text-left p-2 font-medium">Completion Date</th>
                            <th className="text-right p-2 font-medium">Total Days</th>
                            <th className="text-right p-2 font-medium">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.projectsCompleted.items.map((project, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{project.name}</td>
                              <td className="p-2">{project.startDate}</td>
                              <td className="p-2">{project.endDate}</td>
                              <td className="p-2 text-right">{project.totalDays}</td>
                              <td className="p-2 text-right">£{project.totalCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No projects completed in this period</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Users Created */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      Users Created
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                    <CardDescription>
                      {results.usersCreated.count} user(s) created in this period
                    </CardDescription>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {results.usersCreated.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Name</th>
                            <th className="text-left p-2 font-medium">Role</th>
                            <th className="text-left p-2 font-medium">Grade</th>
                            <th className="text-left p-2 font-medium">Join Date</th>
                            <th className="text-right p-2 font-medium">Days Active</th>
                            <th className="text-right p-2 font-medium">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.usersCreated.items.map((user, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{user.name}</td>
                              <td className="p-2">{user.role}</td>
                              <td className="p-2">{user.grade || "N/A"}</td>
                              <td className="p-2">{user.joinDate}</td>
                              <td className="p-2 text-right">{user.totalDays}</td>
                              <td className="p-2 text-right">£{user.totalCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No users created in this period</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Users Disabled */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      Users Disabled
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                    <CardDescription>
                      {results.usersDisabled.count} user(s) currently disabled
                    </CardDescription>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {results.usersDisabled.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Name</th>
                            <th className="text-left p-2 font-medium">Role</th>
                            <th className="text-left p-2 font-medium">Grade</th>
                            <th className="text-left p-2 font-medium">Join Date</th>
                            <th className="text-left p-2 font-medium">Disabled Date</th>
                            <th className="text-right p-2 font-medium">Days Active</th>
                            <th className="text-right p-2 font-medium">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.usersDisabled.items.map((user, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{user.name}</td>
                              <td className="p-2">{user.role}</td>
                              <td className="p-2">{user.grade || "N/A"}</td>
                              <td className="p-2">{user.joinDate}</td>
                              <td className="p-2">{user.endDate}</td>
                              <td className="p-2 text-right">{user.totalDays}</td>
                              <td className="p-2 text-right">£{user.totalCost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No disabled users</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Handovers */}
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="flex items-center gap-2">
                      Role Handovers
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                    <CardDescription>
                      {results.handovers.count} handover(s) detected in this period
                    </CardDescription>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {results.handovers.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Project</th>
                            <th className="text-left p-2 font-medium">Role</th>
                            <th className="text-left p-2 font-medium">From</th>
                            <th className="text-left p-2 font-medium">To</th>
                            <th className="text-left p-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.handovers.items.map((handover, idx) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="p-2">{handover.projectName}</td>
                              <td className="p-2">{handover.role}</td>
                              <td className="p-2">{handover.fromUser}</td>
                              <td className="p-2">{handover.toUser}</td>
                              <td className="p-2">{handover.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No handovers detected in this period</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </div>
        </>
      )}

      {!isLoading && !results && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a date range and click Generate Report to view data.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
