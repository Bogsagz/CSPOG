import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Download, Users, FolderKanban, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UploadResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
}

export default function BulkUploads() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ file: File; type: "users" | "projects" } | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);

  const downloadUserTemplate = () => {
    const headers = ["email", "first_name", "last_name", "workstream", "primary_role", "sfia_grade"];
    const csvContent = headers.join(",") + "\n" + 
      "example@email.com,John,Doe,Mig,security_architect,5\n" +
      "example2@email.com,Jane,Smith,IE,risk_manager,4";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const downloadProjectTemplate = () => {
    const headers = ["title", "workstream", "fleet_size", "project_start", "anticipated_go_live", "security_phase", "secure_by_design_required"];
    const csvContent = headers.join(",") + "\n" + 
      "Project Alpha,Mig,X-Wing,2025-01-15,2025-06-30,Discovery,true\n" +
      "Project Beta,IE,Enterprise,2025-02-01,2025-08-15,Alpha,false";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFileUpload = async (file: File, type: "users" | "projects") => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke("bulk-import", {
          body: {
            type,
            csvData: text
          }
        });

        if (error) throw error;

        setUploadResult(data);
        
        if (data.success) {
          toast.success(`Successfully imported ${data.successCount} ${type}`);
        } else {
          toast.error(`Import completed with ${data.errorCount} errors`);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "users" | "projects") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setSelectedFile({ file, type });
    toast.success(`File "${file.name}" selected. Click Import to upload.`);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    handleFileUpload(selectedFile.file, selectedFile.type);
  };

  const handleRefresh = () => {
    setUploadResult(null);
    setSelectedFile(null);
    setIsUploading(false);
    setShowAllErrors(false);
    // Reset file inputs
    const userInput = document.getElementById("user-file-upload") as HTMLInputElement;
    const projectInput = document.getElementById("project-file-upload") as HTMLInputElement;
    if (userInput) userInput.value = "";
    if (projectInput) projectInput.value = "";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Upload className="h-8 w-8" />
            Bulk Uploads
          </h1>
          <p className="text-muted-foreground mt-2">
            Import users and projects from CSV or Excel files
          </p>
        </div>
        {(uploadResult || selectedFile) && (
          <Button onClick={handleRefresh} variant="outline">
            <Download className="h-4 w-4 mr-2 rotate-180" />
            Refresh
          </Button>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderKanban className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Upload Users</CardTitle>
              <CardDescription>
                Import multiple users from a CSV or Excel file. Users will be created with authentication accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={downloadUserTemplate}
                  variant="outline"
                  className="w-fit"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="user-file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, "users")}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="user-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Processing...</p>
                      </>
                    ) : selectedFile?.type === "users" ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-sm font-medium">{selectedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">File ready to import</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CSV or Excel files only
                        </p>
                      </>
                    )}
                  </label>
                </div>

                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || selectedFile.type !== "users" || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Users
                    </>
                  )}
                </Button>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Required Columns:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>email</strong> - User email address</li>
                    <li><strong>first_name</strong> - First name</li>
                    <li><strong>last_name</strong> - Last name</li>
                    <li><strong>workstream</strong> - Mig, IE, Land, Sea, or Plat</li>
                    <li><strong>primary_role</strong> - security_architect, risk_manager, soc, etc.</li>
                    <li><strong>sfia_grade</strong> - SFIA grade (1-7)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Upload Projects</CardTitle>
              <CardDescription>
                Import multiple projects from a CSV or Excel file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={downloadProjectTemplate}
                  variant="outline"
                  className="w-fit"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="project-file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, "projects")}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="project-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Processing...</p>
                      </>
                    ) : selectedFile?.type === "projects" ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-sm font-medium">{selectedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">File ready to import</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CSV or Excel files only
                        </p>
                      </>
                    )}
                  </label>
                </div>

                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || selectedFile.type !== "projects" || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Projects
                    </>
                  )}
                </Button>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Required Columns:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>title</strong> - Project title</li>
                    <li><strong>workstream</strong> - Mig, IE, Land, Sea, or Plat</li>
                    <li><strong>fleet_size</strong> - X-Wing, Red Dwarf, Enterprise, Star Destroyer, or Death Star</li>
                    <li><strong>project_start</strong> - Start date (YYYY-MM-DD)</li>
                    <li><strong>anticipated_go_live</strong> - Go-live date (YYYY-MM-DD)</li>
                    <li><strong>security_phase</strong> - Discovery, Alpha, Beta, or Live</li>
                    <li><strong>secure_by_design_required</strong> - true or false</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {uploadResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  <strong>{uploadResult.successCount}</strong> successful
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">
                  <strong>{uploadResult.errorCount}</strong> failed
                </span>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errors</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(showAllErrors ? uploadResult.errors : uploadResult.errors.slice(0, 10)).map((error, index) => (
                      <li key={index}>
                        Row {error.row}: {error.error}
                      </li>
                    ))}
                  </ul>
                  {uploadResult.errors.length > 10 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllErrors(!showAllErrors)}
                      className="mt-2 text-xs"
                    >
                      {showAllErrors ? (
                        <>Show less</>
                      ) : (
                        <>Show all {uploadResult.errors.length} errors</>
                      )}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
