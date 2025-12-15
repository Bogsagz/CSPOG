import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCrossCharging } from "@/hooks/useCrossCharging";
import { useAppSettings } from "@/hooks/useAppSettings";
import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp, Users, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { downloadCSV } from "@/lib/csvExport";

export default function CrossCharging() {
  const { workstreams, projectRoles } = useAppSettings();
  
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [groupType, setGroupType] = useState<"workstream" | "whole_team" | "primary_role" | "individual" | "project">("workstream");
  const [groupValue, setGroupValue] = useState<string>("");
  const [filters, setFilters] = useState<any>(null);

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-cross-charging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("disabled", false)
        .order("first_name");
      
      if (error) throw error;
      return data;
    }
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-for-cross-charging"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_list');
      if (error) throw error;
      return data;
    }
  });

  const { results, isLoading } = useCrossCharging(filters);

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
      ["Project", "Person", "Role", "SFIA Grade", "Hours", "Cost"]
    ];

    results.forEach(result => {
      result.user_breakdown.forEach(user => {
        csvData.push([
          result.project_title,
          user.user_name,
          user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          user.sfia_grade,
          user.hours,
          `£${user.cost.toLocaleString()}`
        ]);
      });
    });

    downloadCSV(csvData, `cross-charging-${format(new Date(), "yyyy-MM-dd")}.csv`);
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cross Charging</h1>
        <p className="text-muted-foreground">
          Calculate project hours for selected groups based on time allocation, working week, and absences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select time period and user group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cross Charging Results
              </CardTitle>
              <CardDescription>
                Hours worked per project from {startDate && format(startDate, "PPP")} to {endDate && format(endDate, "PPP")}
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <Collapsible key={result.project_id}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-lg">{result.project_title}</CardTitle>
                            <CardDescription className="mt-1">
                              {result.user_breakdown.length} {result.user_breakdown.length === 1 ? 'person' : 'people'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="text-base px-4 py-2">
                              {result.total_hours}h
                            </Badge>
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              £{result.total_cost.toLocaleString()}
                            </Badge>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Person</TableHead>
                              <TableHead className="text-right">Hours</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.user_breakdown.map((user) => (
                              <TableRow key={user.user_id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.user_name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} · SFIA {user.sfia_grade}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {user.hours}h
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  £{user.cost.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && filters && results.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No data found for the selected filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
