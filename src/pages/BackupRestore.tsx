import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-restore', {
        body: { action: 'backup' }
      });

      if (error) throw error;

      // Create and download the backup file
      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cspog-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Backup created successfully");
    } catch (error) {
      console.error("Backup error:", error);
      toast.error("Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreResult(null);

    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      const { data, error } = await supabase.functions.invoke('backup-restore', {
        body: { 
          action: 'restore',
          backup: backupData
        }
      });

      if (error) throw error;

      setRestoreResult({
        success: true,
        message: `Restore completed successfully. ${data.restored} records restored.`
      });
      toast.success("Data restored successfully");
    } catch (error) {
      console.error("Restore error:", error);
      setRestoreResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to restore backup"
      });
      toast.error("Failed to restore backup");
    } finally {
      setIsRestoring(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Backup & Restore</h1>
        <p className="text-muted-foreground">
          Create full backups of your application data or restore from a previous backup
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Create Backup
            </CardTitle>
            <CardDescription>
              Download a complete backup of all your application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The backup will include all projects, team members, risks, threats, controls, and settings.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isBackingUp ? "Creating Backup..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore from Backup
            </CardTitle>
            <CardDescription>
              Upload a backup file to restore your application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Restoring will add data from the backup. Existing data will not be deleted.
              </AlertDescription>
            </Alert>
            <div className="relative">
              <Input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={isRestoring}
                className="cursor-pointer"
              />
              {isRestoring && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <span className="text-sm">Restoring...</span>
                </div>
              )}
            </div>
            {restoreResult && (
              <Alert variant={restoreResult.success ? "default" : "destructive"}>
                {restoreResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{restoreResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Create regular backups before making major changes</li>
            <li>Store backup files securely in multiple locations</li>
            <li>Test restore functionality periodically</li>
            <li>Keep track of backup dates in the filename</li>
            <li>Ensure you have sufficient permissions before restoring</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
