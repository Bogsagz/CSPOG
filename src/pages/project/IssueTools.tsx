import { useState } from "react";
import { useParams } from "react-router-dom";
import { useIssues, Issue } from "@/hooks/useIssues";
import { useAssets } from "@/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const IssueTools = () => {
  const { projectId } = useParams();
  const { issues, isLoading, createIssue, updateIssue, deleteIssue } = useIssues(projectId!);
  const { assets } = useAssets(projectId!);
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "other" as "vulnerability" | "weakness" | "other",
    date_first_occurred: "",
    description: "",
    linked_asset_id: "",
    cve_score: "",
    epss_score: "",
    patch_available: false,
    resolution_plan: "",
    date_resolved: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "other",
      date_first_occurred: "",
      description: "",
      linked_asset_id: "",
      cve_score: "",
      epss_score: "",
      patch_available: false,
      resolution_plan: "",
      date_resolved: "",
    });
    setEditingIssue(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const issueData: any = {
      project_id: projectId!,
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      date_first_occurred: formData.date_first_occurred || null,
      resolution_plan: formData.resolution_plan || null,
      date_resolved: formData.date_resolved || null,
      linked_asset_id: formData.linked_asset_id || null,
    };

    if (formData.type === "vulnerability") {
      issueData.cve_score = formData.cve_score || null;
      issueData.epss_score = formData.epss_score || null;
      issueData.patch_available = formData.patch_available;
    } else {
      issueData.cve_score = null;
      issueData.epss_score = null;
      issueData.patch_available = null;
    }

    if (editingIssue) {
      await updateIssue.mutateAsync({
        id: editingIssue,
        ...issueData,
      });
    } else {
      await createIssue.mutateAsync(issueData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue.id);
    setFormData({
      name: issue.name,
      type: issue.type,
      date_first_occurred: issue.date_first_occurred || "",
      description: issue.description || "",
      linked_asset_id: issue.linked_asset_id || "",
      cve_score: issue.cve_score || "",
      epss_score: issue.epss_score || "",
      patch_available: issue.patch_available || false,
      resolution_plan: issue.resolution_plan || "",
      date_resolved: issue.date_resolved || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this issue?")) {
      await deleteIssue.mutateAsync(id);
    }
  };

  const getAssetName = (assetId?: string) => {
    if (!assetId) return "-";
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || "-";
  };

  const downloadExampleCSV = () => {
    const csv = `name,type,description,date_first_occurred,resolution_plan,date_resolved,cve_score,epss_score,patch_available
SQL Injection Vulnerability,vulnerability,Database query injection in login form,2024-01-15,Apply input validation and parameterized queries,,7.5,0.85,true
Weak Password Policy,weakness,Password complexity requirements are insufficient,2024-01-20,Implement stronger password requirements,,,,,
Configuration Error,other,Incorrect firewall rule configuration,2024-02-01,Review and update firewall rules,2024-02-05,,,,`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'issues_example.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (issues.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no issues to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['name', 'type', 'description', 'date_first_occurred', 'resolution_plan', 'date_resolved', 'cve_score', 'epss_score', 'patch_available'];
    const csvContent = [
      headers.join(','),
      ...issues.map(issue => 
        headers.map(header => {
          const value = issue[header as keyof Issue] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${issues.length} issues to CSV.`,
    });
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      
      if (rows.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain at least a header and one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const dataRows = rows.slice(1);

      let imported = 0;
      let failed = 0;

      for (const row of dataRows) {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const issueData: any = { project_id: projectId! };
        
        headers.forEach((header, index) => {
          if (values[index]) {
            if (header === 'patch_available') {
              issueData[header] = values[index].toLowerCase() === 'true';
            } else {
              issueData[header] = values[index];
            }
          }
        });

        if (issueData.name && issueData.type) {
          try {
            await createIssue.mutateAsync(issueData);
            imported++;
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${imported} issues. ${failed > 0 ? `${failed} failed.` : ''}`,
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Issue Tools</h1>
        <p className="text-muted-foreground">
          Track and manage project issues, vulnerabilities, and weaknesses
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIssue ? "Edit Issue" : "Add New Issue"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the details of the issue
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Issue Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., SQL Injection in Login Form"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vulnerability">Vulnerability</SelectItem>
                          <SelectItem value="weakness">Weakness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="date_first_occurred">Date of First Occurrence</Label>
                      <Input
                        id="date_first_occurred"
                        type="date"
                        value={formData.date_first_occurred}
                        onChange={(e) => setFormData({ ...formData, date_first_occurred: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Issue Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the issue in detail..."
                        rows={4}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="linked_asset_id">Linked Asset</Label>
                      <Select
                        value={formData.linked_asset_id}
                        onValueChange={(value) => setFormData({ ...formData, linked_asset_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.type === "vulnerability" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="cve_score">CVE Score</Label>
                            <Input
                              id="cve_score"
                              value={formData.cve_score}
                              onChange={(e) => setFormData({ ...formData, cve_score: e.target.value })}
                              placeholder="e.g., 7.5"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="epss_score">EPSS Score</Label>
                            <Input
                              id="epss_score"
                              value={formData.epss_score}
                              onChange={(e) => setFormData({ ...formData, epss_score: e.target.value })}
                              placeholder="e.g., 0.85"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="patch_available"
                            checked={formData.patch_available}
                            onCheckedChange={(checked) => setFormData({ ...formData, patch_available: checked })}
                          />
                          <Label htmlFor="patch_available">Patch Available</Label>
                        </div>
                      </>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="resolution_plan">Resolution Plan</Label>
                      <Textarea
                        id="resolution_plan"
                        value={formData.resolution_plan}
                        onChange={(e) => setFormData({ ...formData, resolution_plan: e.target.value })}
                        placeholder="Describe the plan to resolve this issue..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="date_resolved">Date of Resolution</Label>
                      <Input
                        id="date_resolved"
                        type="date"
                        value={formData.date_resolved}
                        onChange={(e) => setFormData({ ...formData, date_resolved: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingIssue ? "Update Issue" : "Create Issue"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
              <CardDescription>
                All issues registered for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading issues...</div>
              ) : issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No issues yet. Click "Add Issue" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Asset</TableHead>
                      <TableHead>First Occurred</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            issue.type === "vulnerability" 
                              ? "bg-destructive/10 text-destructive"
                              : issue.type === "weakness"
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{getAssetName(issue.linked_asset_id)}</TableCell>
                        <TableCell>{issue.date_first_occurred || "-"}</TableCell>
                        <TableCell>{issue.date_resolved || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(issue)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(issue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Issues</CardTitle>
              <CardDescription>
                View and modify existing issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading issues...</div>
              ) : issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No issues yet. Use Issue Builder to create issues.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Asset</TableHead>
                      <TableHead>First Occurred</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            issue.type === "vulnerability" 
                              ? "bg-destructive/10 text-destructive"
                              : issue.type === "weakness"
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{getAssetName(issue.linked_asset_id)}</TableCell>
                        <TableCell>{issue.date_first_occurred || "-"}</TableCell>
                        <TableCell>{issue.date_resolved || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(issue)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(issue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import/Export</CardTitle>
              <CardDescription>
                Import or export issues in bulk using CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export Issues</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all issues as a CSV file
                  </p>
                  <Button onClick={exportToCSV} disabled={issues.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Import Issues</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file to import issues. Required columns: name, type. Optional columns: description, date_first_occurred, resolution_plan, date_resolved, cve_score, epss_score, patch_available
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="issue-csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                    <Button onClick={() => document.getElementById('issue-csv-upload')?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Import from CSV
                    </Button>
                    <Button variant="outline" onClick={downloadExampleCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Example CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IssueTools;
