import { useParams, useSearchParams } from "react-router-dom";
import { ThreatStatementsTable } from "@/components/ThreatStatementsTable";
import { useSavedThreats } from "@/hooks/useSavedThreats";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ThreatModel() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get("editor") === "true";
  const { threats: savedThreats, updateThreat, deleteThreat, isLoading } = useSavedThreats(projectId || null, 'initial');

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

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    return [
      {
        heading: "Threat Model",
        content: "This document outlines the identified threats for the project.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "Threat Statements",
        content: savedThreats.length > 0 ? savedThreats : ["No threats identified"],
        level: HeadingLevel.HEADING_2,
      },
    ];
  };

  const handleUpdateThreat = async (index: number, newStatement: string) => {
    await updateThreat(index, newStatement);
  };

  const handleDeleteThreat = async (index: number) => {
    await deleteThreat(index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Initial Threat Model</h2>
          <p className="text-muted-foreground">
            View and manage initial stage threat statements for this project
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="threat-model"
            artefactName="Threat Model"
            generateContent={generateContent}
          />
        )}
      </div>

      <ThreatStatementsTable 
        statements={savedThreats}
        onUpdateStatement={isEditorMode ? handleUpdateThreat : undefined}
        onDeleteStatement={isEditorMode ? handleDeleteThreat : undefined}
      />
    </div>
  );
}
