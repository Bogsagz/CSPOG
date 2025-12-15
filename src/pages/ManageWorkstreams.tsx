import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { mapWorkstreamToEnum } from "@/lib/workstreamMapping";

export default function ManageWorkstreams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workstreams } = useAppSettings();
  const [newWorkstream, setNewWorkstream] = useState("");
  const [workstreamToDelete, setWorkstreamToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateWorkstream = async () => {
    if (!newWorkstream.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workstream name",
        variant: "destructive",
      });
      return;
    }

    // Check if workstream already exists
    if (workstreams.includes(newWorkstream)) {
      toast({
        title: "Error",
        description: "This workstream already exists",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Note: This requires a database migration to add the new enum value
      // For now, we'll show a message that this needs to be done via migration
      toast({
        title: "Migration Required",
        description: `To add workstream "${newWorkstream}", a database migration is needed. This will be implemented to add the new workstream to the system.`,
        variant: "default",
      });
      
      setNewWorkstream("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkstream = async () => {
    if (!workstreamToDelete) return;

    setIsLoading(true);
    try {
      // Map display name to enum value for checking
      const workstreamEnum = mapWorkstreamToEnum(workstreamToDelete);

      // First check if any profiles are using this workstream
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .eq("workstream", workstreamEnum as any)
        .limit(1);

      if (profilesError) throw profilesError;

      if (profilesData && profilesData.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This workstream is assigned to team members. Please reassign them first.",
          variant: "destructive",
        });
        setWorkstreamToDelete(null);
        setIsLoading(false);
        return;
      }

      // Check if any projects are using this workstream
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("workstream", workstreamEnum as any)
        .limit(1);

      if (projectsError) throw projectsError;

      if (projectsData && projectsData.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This workstream has projects assigned to it. Please reassign or delete them first.",
          variant: "destructive",
        });
        setWorkstreamToDelete(null);
        setIsLoading(false);
        return;
      }

      // Note: This requires a database migration to remove the enum value
      toast({
        title: "Migration Required",
        description: `To delete workstream "${workstreamToDelete}", a database migration is needed. The workstream has been verified as safe to remove.`,
        variant: "default",
      });

      setWorkstreamToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Manage Workstreams</h1>
        <p className="text-muted-foreground">
          Create and manage workstreams across the organisation
        </p>
      </div>

      {/* Create New Workstream */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Workstream</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="workstream-name">Workstream Name</Label>
            <Input
              id="workstream-name"
              placeholder="e.g., Air, Cyber, Space"
              value={newWorkstream}
              onChange={(e) => setNewWorkstream(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateWorkstream();
                }
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleCreateWorkstream}
              disabled={isLoading || !newWorkstream.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Creating a workstream requires a database migration and will add a new section to the sidebar menu.
        </p>
      </Card>

      {/* Existing Workstreams */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Existing Workstreams</h2>
        
        <div className="mb-4">
          <Input
            placeholder="Search workstreams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {workstreams.filter(w => w.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
            <p className="text-muted-foreground">{searchTerm ? "No matching workstreams" : "No workstreams found"}</p>
          ) : (
            workstreams
              .filter(w => w.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((workstream) => (
              <div
                key={workstream}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{workstream}</p>
                  <p className="text-sm text-muted-foreground">
                    Active workstream with team and projects
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setWorkstreamToDelete(workstream)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Deleting a workstream requires a database migration and will remove the section from the sidebar menu.
        </p>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!workstreamToDelete} onOpenChange={(open) => !open && setWorkstreamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workstream</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the <strong>{workstreamToDelete}</strong> workstream?
              This action will:
              <ul className="list-disc list-inside mt-2">
                <li>Remove the workstream from the sidebar menu</li>
                <li>Require a database migration to complete</li>
                <li>Cannot be undone easily</li>
              </ul>
              <p className="mt-2 text-destructive font-medium">
                This will fail if any team members or projects are assigned to this workstream.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkstream} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Workstream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

