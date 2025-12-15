import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface VersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (isMajor: boolean) => void;
  currentVersion: string;
  nextMajorVersion: string;
  nextMinorVersion: string;
}

export function VersionDialog({
  open,
  onOpenChange,
  onConfirm,
  currentVersion,
  nextMajorVersion,
  nextMinorVersion,
}: VersionDialogProps) {
  const [versionType, setVersionType] = useState<"major" | "minor">("minor");

  const handleConfirm = () => {
    onConfirm(versionType === "major");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Document Version</DialogTitle>
          <DialogDescription>
            Current version: {currentVersion || "No previous versions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={versionType} onValueChange={(value) => setVersionType(value as "major" | "minor")}>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="minor" id="minor" />
              <div className="flex-1">
                <Label htmlFor="minor" className="font-semibold cursor-pointer">
                  Minor Change (v{nextMinorVersion})
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Small updates, corrections, or formatting changes that don't significantly alter the document content.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="major" id="major" />
              <div className="flex-1">
                <Label htmlFor="major" className="font-semibold cursor-pointer">
                  Major Change (v{nextMajorVersion})
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Significant content updates, structural changes, or major revisions that substantially modify the document.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Generate Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
