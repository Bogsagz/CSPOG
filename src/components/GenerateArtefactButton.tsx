import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { VersionDialog } from "./VersionDialog";
import { useDocumentVersions } from "@/hooks/useDocumentVersions";
import { DocumentGenerator, DocumentSection } from "@/utils/documentGenerator";
import { toast } from "sonner";

interface GenerateArtefactButtonProps {
  projectId: string;
  projectName: string;
  artefactType: string;
  artefactName: string;
  generateContent: (version: string) => Promise<DocumentSection[]>;
}

export function GenerateArtefactButton({
  projectId,
  projectName,
  artefactType,
  artefactName,
  generateContent,
}: GenerateArtefactButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentVersion, getNextVersion, createVersion } = useDocumentVersions(
    projectId,
    artefactType
  );

  const handleGenerate = async (isMajor: boolean) => {
    setIsGenerating(true);
    try {
      const nextVersion = getNextVersion(isMajor);

      // Create version record
      await createVersion.mutateAsync({ isMajor });

      // Generate document content
      const sections = await generateContent(nextVersion);

      // Generate document
      const blob = await DocumentGenerator.generateDocument(
        {
          title: artefactName,
          version: nextVersion,
          projectName,
          artefactName,
          date: new Date(),
        },
        sections
      );

      // Download document
      const fileName = DocumentGenerator.generateFileName(
        projectName,
        artefactName,
        new Date()
      );
      DocumentGenerator.downloadBlob(blob, fileName);

      toast.success(`Document v${nextVersion} generated successfully`);
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={isGenerating}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Generate Artefact
          </>
        )}
      </Button>

      <VersionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleGenerate}
        currentVersion={currentVersion}
        nextMajorVersion={getNextVersion(true)}
        nextMinorVersion={getNextVersion(false)}
      />
    </>
  );
}
