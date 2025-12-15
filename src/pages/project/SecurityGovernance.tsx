import { useParams } from "react-router-dom";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function SecurityGovernance() {
  const { projectId } = useParams<{ projectId: string }>();

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
        heading: "Security Governance",
        content: "This document outlines security governance policies and procedures.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "Overview",
        content: "Security governance content to be implemented.",
        level: HeadingLevel.HEADING_2,
      },
    ];
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Security Governance</h2>
          <p className="text-muted-foreground">
            Manage security governance policies and procedures
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="security-governance"
            artefactName="Security Governance"
            generateContent={generateContent}
          />
        )}
      </div>
      {/* Content will be implemented */}
    </div>
  );
}
