import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAssets, Asset, ASSET_TYPES } from "@/hooks/useAssets";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
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
import { useToast } from "@/hooks/use-toast";
import { SystemDiagram } from "@/components/SystemDiagram";
import { useAuth } from "@/hooks/useAuth";

const AssetTools = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { assets, isLoading, createAsset, updateAsset, deleteAsset } = useAssets(projectId!);
  const { permissions } = useProjectPermissions(projectId!, user?.id || null);
  const { toast } = useToast();
  
  const canWrite = permissions.canWriteTables;
  
  const currentTab = searchParams.get("tab") || "builder";
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vendor: "",
    version: "",
    model_number: "",
    type: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      vendor: "",
      version: "",
      model_number: "",
      type: "",
    });
    setEditingAsset(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (editingAsset) {
      await updateAsset.mutateAsync({
        id: editingAsset,
        ...formData,
      });
    } else {
      await createAsset.mutateAsync({
        project_id: projectId!,
        ...formData,
      });
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset.id);
    setFormData({
      name: asset.name,
      description: asset.description || "",
      vendor: asset.vendor || "",
      version: asset.version || "",
      model_number: asset.model_number || "",
      type: asset.type || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      await deleteAsset.mutateAsync(id);
    }
  };

  const downloadExampleCSV = () => {
    const csv = `name,type,description,vendor,version,model_number
Web Application Server,Cloud component,Main application server,AWS,2.0,EC2-t3.large
Database Server,Software component,PostgreSQL database,PostgreSQL,14.5,RDS-db.m5.large
API Gateway,Cloud component,External API gateway,Kong,3.0,API-GW-001`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets_example.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (assets.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no assets to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['name', 'type', 'description', 'vendor', 'version', 'model_number'];
    const csvContent = [
      headers.join(','),
      ...assets.map(asset => 
        headers.map(header => {
          const value = asset[header as keyof Asset] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${assets.length} assets to CSV.`,
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
        const assetData: any = { project_id: projectId! };
        
        headers.forEach((header, index) => {
          if (values[index]) {
            assetData[header] = values[index];
          }
        });

        if (assetData.name) {
          try {
            await createAsset.mutateAsync(assetData);
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
        description: `Successfully imported ${imported} assets. ${failed > 0 ? `${failed} failed.` : ''}`,
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Asset Tools</h1>
        <p className="text-muted-foreground">
          Manage project assets for threat modeling
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="diagram">System Diagram</TabsTrigger>
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
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingAsset ? "Edit Asset" : "Add New Asset"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the details of the asset. Assets can be referenced in the Threat Builder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Database Server"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the asset..."
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        value={formData.vendor}
                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                        placeholder="e.g., Microsoft"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="version">Version</Label>
                        <Input
                          id="version"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          placeholder="e.g., 2.0.1"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="model_number">Model Number</Label>
                        <Input
                          id="model_number"
                          value={formData.model_number}
                          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                          placeholder="e.g., XR-2000"
                        />
                      </div>
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
                      {editingAsset ? "Update Asset" : "Create Asset"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <CardDescription>
                All assets registered for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading assets...</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assets yet. Click "Add Asset" to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Model Number</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.type || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {asset.description || "-"}
                        </TableCell>
                        <TableCell>{asset.vendor || "-"}</TableCell>
                        <TableCell>{asset.version || "-"}</TableCell>
                        <TableCell>{asset.model_number || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(asset.id)}
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
              <CardTitle>Edit Assets</CardTitle>
              <CardDescription>
                View and modify existing assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading assets...</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assets yet. Use Asset Builder to create assets.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Model Number</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.type || "-"}</TableCell>
                        <TableCell>{asset.model_number || "-"}</TableCell>
                        <TableCell>{asset.version || "-"}</TableCell>
                        <TableCell>{asset.vendor || "-"}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {asset.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(asset.id)}
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
                Import or export assets in bulk using CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export Assets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all assets as a CSV file
                  </p>
                  <Button onClick={exportToCSV} disabled={assets.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Import Assets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file to import assets. Required column: name. Optional columns: type, description, vendor, version, model_number
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="asset-csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                    <Button onClick={() => document.getElementById('asset-csv-upload')?.click()}>
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

        <TabsContent value="diagram" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Diagram</CardTitle>
              <CardDescription>
                Create a visual diagram of your system by deploying assets and connecting them together
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading assets...</div>
              ) : assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assets yet. Use the Builder tab to create assets first.
                </div>
              ) : (
                <SystemDiagram
                  assets={assets.map(a => ({
                    id: a.id,
                    name: a.name,
                    vendor: a.vendor || undefined,
                    version: a.version || undefined,
                    type: a.type || undefined,
                  }))}
                  canWrite={canWrite}
                  projectId={projectId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetTools;
