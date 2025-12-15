import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";

const absenceSchema = z.object({
  absenceType: z.enum(["furlough", "mandatory_leave", "public_holiday"], {
    required_error: "Please select an absence type",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  disabled: boolean;
}

export default function BulkAbsences() {
  const [absenceType, setAbsenceType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(true);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, disabled")
        .eq("disabled", false)
        .order("first_name", { ascending: true });

      if (error) throw error;

      setUsers(data || []);
      setUsersLoaded(true);
      // Initially select all users
      setSelectedUsers(new Set((data || []).map(u => u.id)));
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === users.length);
  };

  const handleSubmit = async () => {
    try {
      // Validate input
      const validation = absenceSchema.safeParse({
        absenceType,
        startDate,
        endDate,
        description,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      if (selectedUsers.size === 0) {
        toast.error("Please select at least one user");
        return;
      }

      setIsLoading(true);

      // Get absence type label for description
      const typeLabels = {
        furlough: "Furlough",
        mandatory_leave: "Mandatory Leave",
        public_holiday: "Public Holiday",
      };

      const absenceLabel = typeLabels[absenceType as keyof typeof typeLabels];
      const finalDescription = description.trim() || absenceLabel;

      // Create absences for selected users
      const absences = Array.from(selectedUsers).map(userId => ({
        user_id: userId,
        start_date: format(startDate!, "yyyy-MM-dd"),
        end_date: format(endDate!, "yyyy-MM-dd"),
        absence_type: absenceType,
        description: finalDescription,
        project_id: null,
      }));

      const { error } = await supabase
        .from("team_leave")
        .insert(absences);

      if (error) throw error;

      toast.success(`Successfully created ${absences.length} absence record(s)`);

      // Reset form
      setAbsenceType("");
      setStartDate(undefined);
      setEndDate(undefined);
      setDescription("");
      setSelectedUsers(new Set(users.map(u => u.id)));
      setSelectAll(true);
    } catch (error) {
      console.error("Error creating absences:", error);
      toast.error("Failed to create absences");
    } finally {
      setIsLoading(false);
    }
  };

  // Load users when component mounts
  if (!usersLoaded) {
    loadUsers();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Absence Management</h1>
        <p className="text-muted-foreground">
          Create absences for multiple users at once
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Absence Details</CardTitle>
            <CardDescription>Configure the absence to apply to selected users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="absence-type">Absence Type *</Label>
              <Select value={absenceType} onValueChange={setAbsenceType}>
                <SelectTrigger id="absence-type">
                  <SelectValue placeholder="Select absence type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furlough">Furlough</SelectItem>
                  <SelectItem value="mandatory_leave">Mandatory Leave</SelectItem>
                  <SelectItem value="public_holiday">Public Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
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
              <Label>End Date *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter a description for this absence..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || !absenceType || !startDate || !endDate || selectedUsers.size === 0}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Absences for {selectedUsers.size} User(s)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Users</CardTitle>
            <CardDescription>Choose which users to apply this absence to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 pb-4 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All ({users.length} users)
              </label>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active users found
                </p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) =>
                        handleUserToggle(user.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={user.id}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {user.first_name} {user.last_name}
                      <span className="text-muted-foreground ml-2">({user.email})</span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
