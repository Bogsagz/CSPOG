import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Layer definitions in order from highest (+3) to lowest (-3)
const LAYER_DEFINITIONS: Record<number, string> = {
  3: "Policies & Standards",
  2: "Process & Procedures",
  1: "Physical & Location Controls",
  "-1": "Authorisation Controls",
  "-2": "Network & Authentication Controls",
  "-3": "Detection Controls",
};

const LAYER_ORDER = [3, 2, 1, -1, -2, -3];

// Effectiveness rating colors (A=best, E=worst)
const getEffectivenessStyles = (rating: string | null): string => {
  switch (rating?.toUpperCase()) {
    case "A":
      return "bg-green-700 text-white border-green-800";
    case "B":
      return "bg-green-500 text-white border-green-600";
    case "C":
      return "bg-yellow-500 text-black border-yellow-600";
    case "D":
      return "bg-orange-500 text-white border-orange-600";
    case "E":
      return "bg-red-800 text-white border-red-900";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getLayerBackgroundStyle = (rating: string | null): string => {
  switch (rating?.toUpperCase()) {
    case "A":
      return "bg-green-700/20 border-green-700";
    case "B":
      return "bg-green-500/20 border-green-500";
    case "C":
      return "bg-yellow-500/20 border-yellow-600";
    case "D":
      return "bg-orange-500/20 border-orange-600";
    case "E":
      return "bg-red-800/20 border-red-800";
    default:
      return "bg-muted/50 border-border";
  }
};

export default function SecurityControls() {
  const { projectId } = useParams();
  const { controls, isLoading, updateControl, deleteControl } = useSecurityControls(projectId);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Group controls by layer
  const controlsByLayer = LAYER_ORDER.reduce((acc, layer) => {
    acc[layer] = controls.filter(c => c.layer === layer);
    return acc;
  }, {} as Record<number, typeof controls>);

  // Controls without a layer
  const unassignedControls = controls.filter(c => c.layer === null || !LAYER_ORDER.includes(c.layer));

  // Get dominant effectiveness for a layer (most common rating)
  const getLayerEffectiveness = (layerControls: typeof controls): string | null => {
    if (layerControls.length === 0) return null;
    const ratings = layerControls.map(c => c.effectiveness_rating?.toUpperCase()).filter(Boolean);
    if (ratings.length === 0) return null;
    
    // Return the worst (lowest) effectiveness in the layer
    const order = ["E", "D", "C", "B", "A"];
    for (const rating of order) {
      if (ratings.includes(rating)) return rating;
    }
    return null;
  };

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    const sections: DocumentSection[] = [
      {
        heading: "Security Controls",
        content: "This document lists all security controls for the project, organised by control layer.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    if (controls.length === 0) {
      sections.push({
        heading: "No Controls",
        content: "No security controls have been defined for this project.",
        level: HeadingLevel.HEADING_2,
      });
    } else {
      // Group by layer in document
      LAYER_ORDER.forEach(layer => {
        const layerControls = controlsByLayer[layer];
        if (layerControls && layerControls.length > 0) {
          sections.push({
            heading: `Layer ${layer > 0 ? '+' : ''}${layer}: ${LAYER_DEFINITIONS[layer]}`,
            content: layerControls.map(control => 
              `${control.name}\n` +
              `Effectiveness: ${control.effectiveness_rating || "N/A"}\n` +
              `Type: ${control.type || "N/A"}\n` +
              `Description: ${control.description || "No description"}`
            ),
            level: HeadingLevel.HEADING_2,
          });
        }
      });

      if (unassignedControls.length > 0) {
        sections.push({
          heading: "Unassigned Controls",
          content: unassignedControls.map(control => 
            `${control.name}\n` +
            `Effectiveness: ${control.effectiveness_rating || "N/A"}\n` +
            `Type: ${control.type || "N/A"}\n` +
            `Description: ${control.description || "No description"}`
          ),
          level: HeadingLevel.HEADING_2,
        });
      }
    }

    return sections;
  };
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    layer: "",
    effectiveness_rating: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      layer: "",
      effectiveness_rating: "",
    });
    setEditingControl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !editingControl) {
      return;
    }

    await updateControl(editingControl, {
      name: formData.name,
      description: formData.description || null,
      type: formData.type || null,
      layer: formData.layer ? parseInt(formData.layer) : null,
      effectiveness_rating: formData.effectiveness_rating || null,
    });
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (control: any) => {
    setEditingControl(control.id);
    setFormData({
      name: control.name,
      description: control.description || "",
      type: control.type || "",
      layer: control.layer?.toString() || "",
      effectiveness_rating: control.effectiveness_rating || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this control?")) {
      await deleteControl(id);
    }
  };

  const renderControlCard = (control: any) => (
    <div
      key={control.id}
      className={cn(
        "p-3 rounded-lg border-2 transition-all hover:shadow-md",
        getEffectivenessStyles(control.effectiveness_rating)
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{control.name}</h4>
          {control.description && (
            <p className="text-sm opacity-90 mt-1 line-clamp-2">{control.description}</p>
          )}
          <div className="flex gap-2 mt-2 text-xs opacity-80">
            {control.type && <span>Type: {control.type}</span>}
            {control.effectiveness_rating && (
              <span className="font-bold">Rating: {control.effectiveness_rating}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/20"
            onClick={() => handleEdit(control)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/20"
            onClick={() => handleDelete(control.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Security Controls</h1>
          <p className="text-muted-foreground">
            View, edit, and manage security controls organised by layer
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="security-controls"
            artefactName="Security Controls"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* Effectiveness Legend */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Effectiveness Rating Legend</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-3">
            {["A", "B", "C", "D", "E"].map(rating => (
              <div key={rating} className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold", getEffectivenessStyles(rating))}>
                  {rating}
                </div>
                <span className="text-sm text-muted-foreground">
                  {rating === "A" && "Excellent"}
                  {rating === "B" && "Good"}
                  {rating === "C" && "Adequate"}
                  {rating === "D" && "Poor"}
                  {rating === "E" && "Inadequate"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Security Control</DialogTitle>
              <DialogDescription>
                Update the details of this security control
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Control Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Multi-factor Authentication"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the security control..."
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Control Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Preventive, Detective, Corrective"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="layer">Control Layer</Label>
                <Select
                  value={formData.layer}
                  onValueChange={(value) => setFormData({ ...formData, layer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select control layer" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYER_ORDER.map(layer => (
                      <SelectItem key={layer} value={layer.toString()}>
                        {layer > 0 ? '+' : ''}{layer}: {LAYER_DEFINITIONS[layer]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="effectiveness_rating">Effectiveness Rating</Label>
                <Select
                  value={formData.effectiveness_rating}
                  onValueChange={(value) => setFormData({ ...formData, effectiveness_rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select effectiveness rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Excellent</SelectItem>
                    <SelectItem value="B">B - Good</SelectItem>
                    <SelectItem value="C">C - Adequate</SelectItem>
                    <SelectItem value="D">D - Poor</SelectItem>
                    <SelectItem value="E">E - Inadequate</SelectItem>
                  </SelectContent>
                </Select>
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
                Update Control
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-8">Loading controls...</div>
      ) : controls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No controls yet. Use Control Builder to create security controls.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Layers with controls */}
          {LAYER_ORDER.map(layer => {
            const layerControls = controlsByLayer[layer];
            if (!layerControls || layerControls.length === 0) return null;
            
            const layerEffectiveness = getLayerEffectiveness(layerControls);

            return (
              <Card 
                key={layer} 
                className={cn("border-2", getLayerBackgroundStyle(layerEffectiveness))}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <span>Layer {layer > 0 ? '+' : ''}{layer}: {LAYER_DEFINITIONS[layer]}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({layerControls.length} control{layerControls.length !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {layerControls.map(renderControlCard)}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Unassigned controls */}
          {unassignedControls.length > 0 && (
            <Card className="border-2 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <span>Unassigned Controls</span>
                  <span className="text-sm font-normal">
                    ({unassignedControls.length} control{unassignedControls.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
                <CardDescription>
                  These controls have not been assigned to a layer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unassignedControls.map(renderControlCard)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
