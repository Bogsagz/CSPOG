import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Plus } from "lucide-react";
import { ASSET_TYPES } from "@/hooks/useAssets";

interface AssetDialogProps {
  onCreateAsset: (data: {
    name: string;
    description: string;
    vendor: string;
    version: string;
    model_number: string;
    type: string;
  }) => Promise<void>;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function AssetDialog({ onCreateAsset, trigger, disabled }: AssetDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    await onCreateAsset(formData);
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      setDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger || (
          <Button disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Enter the details of the asset. Assets can be referenced in the Threat Builder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="asset-name">Name *</Label>
              <Input
                id="asset-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Database Server"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="asset-type">
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
              <Label htmlFor="asset-description">Description</Label>
              <Textarea
                id="asset-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the asset..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset-vendor">Vendor</Label>
              <Input
                id="asset-vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Microsoft"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="asset-version">Version</Label>
                <Input
                  id="asset-version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 2.0.1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset-model">Model Number</Label>
                <Input
                  id="asset-model"
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
            <Button type="submit">Create Asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
