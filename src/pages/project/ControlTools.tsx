import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useControlsRepository } from "@/hooks/useControlsRepository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import { Trash2, Pencil, Download, Upload, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const controlSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().optional(),
  type: z.string().optional(),
  effectiveness_rating: z.string().optional(),
  layer: z.number().optional(),
});

const layerOptions = [
  { value: 3, label: "+3 - Policies & standards" },
  { value: 2, label: "+2 - Process & procedures" },
  { value: 1, label: "+1 - Physical & location controls" },
  { value: -1, label: "-1 - Authorisation controls" },
  { value: -2, label: "-2 - Network & authentication controls" },
  { value: -3, label: "-3 - Detection controls" },
];

type ControlFormValues = z.infer<typeof controlSchema>;

export default function ControlTools() {
  const { projectId } = useParams<{ projectId: string }>();
  const { controls, isLoading, addControl, updateControl, deleteControl } = useSecurityControls(projectId);
  const { controls: repositoryControls, isLoading: isLoadingRepository, createControl: createControlInRepo } = useControlsRepository();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    effectiveness_rating: "",
    layer: undefined as number | undefined,
  });

  const [repositoryFilter, setRepositoryFilter] = useState({
    controlType: "all",
    cloudProvider: "all",
    searchTerm: "",
  });

  const [addControlDialogOpen, setAddControlDialogOpen] = useState(false);
  const [newControlForm, setNewControlForm] = useState({
    name: "",
    control_type: "Preventive",
    category: "",
    description: "",
    cloud_provider: "Multi-Cloud",
    reference_url: "",
    implementation_guidance: "",
  });

  const [builderMode, setBuilderMode] = useState<"design" | "import">("design");

  const form = useForm<ControlFormValues>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      effectiveness_rating: "",
      layer: undefined,
    },
  });

  const onSubmit = async (data: ControlFormValues) => {
    try {
      await addControl({
        name: data.name,
        description: data.description || null,
        type: data.type || null,
        effectiveness_rating: data.effectiveness_rating || null,
        layer: data.layer || null,
      });
      form.reset();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      effectiveness_rating: "",
      layer: undefined,
    });
    setEditingControl(null);
  };

  const handleEdit = (control: any) => {
    setEditingControl(control.id);
    setFormData({
      name: control.name,
      description: control.description || "",
      type: control.type || "",
      effectiveness_rating: control.effectiveness_rating || "",
      layer: control.layer,
    });
    setDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !editingControl) {
      return;
    }

    await updateControl(editingControl, {
      name: formData.name,
      description: formData.description || null,
      type: formData.type || null,
      effectiveness_rating: formData.effectiveness_rating || null,
      layer: formData.layer || null,
    });
    
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this control?")) {
      await deleteControl(id);
    }
  };

  const downloadExampleCSV = () => {
    const csv = `name,description,type,effectiveness_rating,layer
Access Control Policy,User authentication and authorisation policy,preventive,A,0
Firewall Configuration,Network firewall rules,preventive,B,-2
Security Monitoring,Real-time threat detection,detective,A,-3`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'controls_example.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (controls.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no controls to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['name', 'description', 'type', 'effectiveness_rating', 'layer'];
    const csvContent = [
      headers.join(','),
      ...controls.map(control => 
        headers.map(header => {
          const value = control[header as keyof typeof control] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controls_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${controls.length} controls to CSV.`,
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
        const controlData: any = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            if (header === 'layer') {
              controlData[header] = parseInt(values[index]) || null;
            } else {
              controlData[header] = values[index];
            }
          }
        });

        if (controlData.name) {
          try {
            await addControl(controlData);
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
        description: `Successfully imported ${imported} controls. ${failed > 0 ? `${failed} failed.` : ''}`,
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Repository functionality
  const filteredRepositoryControls = repositoryControls.filter(control => {
    const matchesType = repositoryFilter.controlType === "all" || control.control_type === repositoryFilter.controlType;
    const matchesProvider = repositoryFilter.cloudProvider === "all" || control.cloud_provider === repositoryFilter.cloudProvider;
    const matchesSearch = !repositoryFilter.searchTerm || 
      control.name.toLowerCase().includes(repositoryFilter.searchTerm.toLowerCase()) ||
      (control.description?.toLowerCase().includes(repositoryFilter.searchTerm.toLowerCase()));
    return matchesType && matchesProvider && matchesSearch;
  });

  const handleAddFromRepository = async (repositoryControl: any) => {
    try {
      await addControl({
        name: repositoryControl.name,
        description: repositoryControl.description,
        type: repositoryControl.control_type,
        effectiveness_rating: null,
        layer: null,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const uniqueControlTypes = Array.from(new Set(repositoryControls.map(c => c.control_type))).sort();
  const uniqueCloudProviders = Array.from(new Set(repositoryControls.map(c => c.cloud_provider).filter(Boolean))).sort();

  const getControlTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Preventive: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Detective: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      Corrective: "bg-green-500/10 text-green-500 border-green-500/20",
      Authentication: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Authorisation: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Cryptographic: "bg-red-500/10 text-red-500 border-red-500/20",
      Network: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const handleAddControlToRepository = (e: React.FormEvent) => {
    e.preventDefault();
    createControlInRepo(newControlForm);
    setNewControlForm({
      name: "",
      control_type: "Preventive",
      category: "",
      description: "",
      cloud_provider: "Multi-Cloud",
      reference_url: "",
      implementation_guidance: "",
    });
    setAddControlDialogOpen(false);
  };

  const cloudProviders = Array.from(new Set(filteredRepositoryControls.map(c => c.cloud_provider).filter(Boolean))).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Control Tools</h2>
        <p className="text-muted-foreground">
          Build and manage security controls for this project
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="repository">Repository</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="repository" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Controls Repository</CardTitle>
                  <CardDescription>
                    Central repository of security controls from AWS, Azure, GCP, and industry standards
                  </CardDescription>
                </div>
                <Button onClick={() => setAddControlDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Control
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={repositoryFilter.controlType} onValueChange={(value) => setRepositoryFilter({ ...repositoryFilter, controlType: value })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueControlTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={repositoryFilter.cloudProvider} onValueChange={(value) => setRepositoryFilter({ ...repositoryFilter, cloudProvider: value })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {uniqueCloudProviders.map(provider => (
                      <SelectItem key={provider} value={provider || ""}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingRepository ? (
                <div>Loading controls...</div>
              ) : (
                <div className="space-y-4">
                  {cloudProviders.map(provider => {
                    const providerControls = filteredRepositoryControls.filter(c => c.cloud_provider === provider);
                    if (providerControls.length === 0) return null;
                    
                    return (
                      <div key={provider} className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">{provider}</h3>
                        <div className="space-y-2">
                          {providerControls.map(control => (
                            <div
                              key={control.id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{control.name}</h4>
                                  <Badge variant="outline" className={getControlTypeColor(control.control_type)}>
                                    {control.control_type}
                                  </Badge>
                                  {control.category && (
                                    <Badge variant="outline" className="bg-muted">
                                      {control.category}
                                    </Badge>
                                  )}
                                </div>
                                {control.description && (
                                  <p className="text-sm text-muted-foreground">{control.description}</p>
                                )}
                                {control.implementation_guidance && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <strong>Implementation:</strong> {control.implementation_guidance}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddFromRepository(control)}
                                  title="Add to project"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                {control.reference_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(control.reference_url!, '_blank')}
                                    title="View reference"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Security Control</CardTitle>
              <CardDescription>
                Choose to design a new control or import from the repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Button
                  variant={builderMode === "design" ? "default" : "outline"}
                  onClick={() => setBuilderMode("design")}
                >
                  Design New
                </Button>
                <Button
                  variant={builderMode === "import" ? "default" : "outline"}
                  onClick={() => setBuilderMode("import")}
                >
                  Import from Repository
                </Button>
              </div>

              {builderMode === "design" ? (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter control name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter control description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="preventive">Preventive</SelectItem>
                              <SelectItem value="detective">Detective</SelectItem>
                              <SelectItem value="corrective">Corrective</SelectItem>
                              <SelectItem value="deterrent">Deterrent</SelectItem>
                              <SelectItem value="compensating">Compensating</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveness_rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effectiveness Rating</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">A - Effective</SelectItem>
                              <SelectItem value="B">B - Functional</SelectItem>
                              <SelectItem value="C">C - Minimal</SelectItem>
                              <SelectItem value="D">D - Unvalidated</SelectItem>
                              <SelectItem value="E">E - Ineffective</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="layer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Layer</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select layer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {layerOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Add Control
                  </Button>
                </form>
              </Form>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search controls..."
                      value={repositoryFilter.searchTerm}
                      onChange={(e) => setRepositoryFilter({ ...repositoryFilter, searchTerm: e.target.value })}
                      className="flex-1"
                    />
                    <Select value={repositoryFilter.controlType} onValueChange={(value) => setRepositoryFilter({ ...repositoryFilter, controlType: value })}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueControlTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoadingRepository ? (
                    <div className="text-center py-8 text-muted-foreground">Loading controls...</div>
                  ) : filteredRepositoryControls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No controls found</div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filteredRepositoryControls.map(control => (
                        <div
                          key={control.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{control.name}</h4>
                              <Badge variant="outline" className={getControlTypeColor(control.control_type)}>
                                {control.control_type}
                              </Badge>
                              {control.cloud_provider && (
                                <Badge variant="outline" className="bg-muted">
                                  {control.cloud_provider}
                                </Badge>
                              )}
                            </div>
                            {control.description && (
                              <p className="text-sm text-muted-foreground">{control.description}</p>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAddFromRepository(control)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Project
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Controls</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading controls...</div>
              ) : controls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security controls yet. Add your first control above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Effectiveness</TableHead>
                        <TableHead>Layer</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controls.map((control) => (
                        <TableRow key={control.id}>
                          <TableCell className="font-medium">{control.name}</TableCell>
                          <TableCell className="max-w-md">
                            {control.description || "-"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {control.type || "-"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {control.effectiveness_rating || "-"}
                          </TableCell>
                          <TableCell>
                            {control.layer !== null && control.layer !== undefined
                              ? layerOptions.find((opt) => opt.value === control.layer)?.label || control.layer
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(control.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6 mt-6">
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleUpdate}>
                <DialogHeader>
                  <DialogTitle>Edit Control</DialogTitle>
                  <DialogDescription>
                    Update the details of this security control
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="detective">Detective</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="deterrent">Deterrent</SelectItem>
                        <SelectItem value="compensating">Compensating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-effectiveness">Effectiveness Rating</Label>
                    <Select
                      value={formData.effectiveness_rating}
                      onValueChange={(value) => setFormData({ ...formData, effectiveness_rating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A - Effective</SelectItem>
                        <SelectItem value="B">B - Functional</SelectItem>
                        <SelectItem value="C">C - Minimal</SelectItem>
                        <SelectItem value="D">D - Unvalidated</SelectItem>
                        <SelectItem value="E">E - Ineffective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-layer">Layer</Label>
                    <Select
                      value={formData.layer?.toString()}
                      onValueChange={(value) => setFormData({ ...formData, layer: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select layer" />
                      </SelectTrigger>
                      <SelectContent>
                        {layerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Control</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>Edit Controls</CardTitle>
              <CardDescription>View and modify security controls grouped by layer</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading controls...</div>
              ) : controls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No controls yet. Use Control Builder to create controls.
                </div>
              ) : (
                <div className="space-y-4">
                  {layerOptions.map((layer) => {
                    const layerControls = controls.filter(c => c.layer === layer.value);
                    const unassignedControls = layer.value === layerOptions[layerOptions.length - 1].value 
                      ? controls.filter(c => c.layer === null || c.layer === undefined)
                      : [];
                    const allLayerControls = [...layerControls];
                    
                    if (layerControls.length === 0 && unassignedControls.length === 0) return null;
                    
                    const getEffectivenessColor = (rating: string | null | undefined) => {
                      switch (rating) {
                        case 'A': return "bg-green-600 text-white border-green-700";
                        case 'B': return "bg-green-400 text-green-950 border-green-500";
                        case 'C': return "bg-yellow-400 text-yellow-950 border-yellow-500";
                        case 'D': return "bg-orange-500 text-white border-orange-600";
                        case 'E': return "bg-red-700 text-white border-red-800";
                        default: return "bg-gray-300 text-gray-800 border-gray-400";
                      }
                    };
                    
                    return (
                      <div key={layer.value} className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-mono font-bold w-8 text-center">
                            {layer.value > 0 ? `+${layer.value}` : layer.value}
                          </span>
                          <span className="font-semibold">{layer.label.split(' - ')[1]}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {allLayerControls.length} control{allLayerControls.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {allLayerControls.map(control => (
                            <button
                              key={control.id}
                              onClick={() => handleEdit(control)}
                              className={`px-3 py-1.5 rounded border text-sm font-medium transition-all hover:scale-105 cursor-pointer ${getEffectivenessColor(control.effectiveness_rating)}`}
                              title={`${control.name}${control.description ? `: ${control.description}` : ''}\nEffectiveness: ${control.effectiveness_rating || 'Not rated'}\nClick to edit`}
                            >
                              {control.name}
                              {control.effectiveness_rating && (
                                <span className="ml-1.5 opacity-80">({control.effectiveness_rating})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Unassigned controls */}
                  {controls.filter(c => c.layer === null || c.layer === undefined).length > 0 && (
                    <div className="rounded-lg border border-dashed bg-muted/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-mono font-bold w-8 text-center">?</span>
                        <span className="font-semibold text-muted-foreground">Unassigned Layer</span>
                        <Badge variant="outline" className="ml-auto">
                          {controls.filter(c => c.layer === null || c.layer === undefined).length} control{controls.filter(c => c.layer === null || c.layer === undefined).length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {controls.filter(c => c.layer === null || c.layer === undefined).map(control => {
                          const getEffectivenessColor = (rating: string | null | undefined) => {
                            switch (rating) {
                              case 'A': return "bg-green-600 text-white border-green-700";
                              case 'B': return "bg-green-400 text-green-950 border-green-500";
                              case 'C': return "bg-yellow-400 text-yellow-950 border-yellow-500";
                              case 'D': return "bg-orange-500 text-white border-orange-600";
                              case 'E': return "bg-red-700 text-white border-red-800";
                              default: return "bg-gray-300 text-gray-800 border-gray-400";
                            }
                          };
                          return (
                            <button
                              key={control.id}
                              onClick={() => handleEdit(control)}
                              className={`px-3 py-1.5 rounded border text-sm font-medium transition-all hover:scale-105 cursor-pointer ${getEffectivenessColor(control.effectiveness_rating)}`}
                              title={`${control.name}${control.description ? `: ${control.description}` : ''}\nEffectiveness: ${control.effectiveness_rating || 'Not rated'}\nClick to edit`}
                            >
                              {control.name}
                              {control.effectiveness_rating && (
                                <span className="ml-1.5 opacity-80">({control.effectiveness_rating})</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Effectiveness:</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-green-600 text-white">A - Effective</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-green-400 text-green-950">B - Functional</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-400 text-yellow-950">C - Minimal</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-500 text-white">D - Unvalidated</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-red-700 text-white">E - Ineffective</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-300 text-gray-800">Not Rated</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import/Export</CardTitle>
              <CardDescription>
                Import or export controls in bulk using CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Export Controls</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all controls as a CSV file
                  </p>
                  <Button onClick={exportToCSV} disabled={controls.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Import Controls</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file to import controls. Required column: name. Optional columns: description, type, effectiveness_rating, layer
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="control-csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                    <Button onClick={() => document.getElementById('control-csv-upload')?.click()}>
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

      {/* Add Control to Repository Dialog */}
      <Dialog open={addControlDialogOpen} onOpenChange={setAddControlDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleAddControlToRepository}>
            <DialogHeader>
              <DialogTitle>Add Control to Repository</DialogTitle>
              <DialogDescription>
                Add a new security control to the central repository
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="repo-name">Name *</Label>
                <Input
                  id="repo-name"
                  value={newControlForm.name}
                  onChange={(e) => setNewControlForm({ ...newControlForm, name: e.target.value })}
                  placeholder="e.g., Multi-Factor Authentication (MFA)"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-control_type">Control Type *</Label>
                  <Select
                    value={newControlForm.control_type}
                    onValueChange={(value) => setNewControlForm({ ...newControlForm, control_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventive">Preventive</SelectItem>
                      <SelectItem value="Detective">Detective</SelectItem>
                      <SelectItem value="Corrective">Corrective</SelectItem>
                      <SelectItem value="Authentication">Authentication</SelectItem>
                      <SelectItem value="Authorisation">Authorisation</SelectItem>
                      <SelectItem value="Cryptographic">Cryptographic</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repo-cloud_provider">Cloud Provider *</Label>
                  <Select
                    value={newControlForm.cloud_provider}
                    onValueChange={(value) => setNewControlForm({ ...newControlForm, cloud_provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multi-Cloud">Multi-Cloud</SelectItem>
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="GCP">GCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-category">Category</Label>
                <Input
                  id="repo-category"
                  value={newControlForm.category}
                  onChange={(e) => setNewControlForm({ ...newControlForm, category: e.target.value })}
                  placeholder="e.g., Identity & Access Management"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-description">Description</Label>
                <Textarea
                  id="repo-description"
                  value={newControlForm.description}
                  onChange={(e) => setNewControlForm({ ...newControlForm, description: e.target.value })}
                  placeholder="Describe the security control..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-implementation_guidance">Implementation Guidance</Label>
                <Textarea
                  id="repo-implementation_guidance"
                  value={newControlForm.implementation_guidance}
                  onChange={(e) => setNewControlForm({ ...newControlForm, implementation_guidance: e.target.value })}
                  placeholder="How to implement this control..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-reference_url">Reference URL</Label>
                <Input
                  id="repo-reference_url"
                  type="url"
                  value={newControlForm.reference_url}
                  onChange={(e) => setNewControlForm({ ...newControlForm, reference_url: e.target.value })}
                  placeholder="https://docs.aws.amazon.com/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddControlDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add to Repository</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
