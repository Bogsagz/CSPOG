import { useParams } from "react-router-dom";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function DPIA() {
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
        heading: "Data Protection Impact Assessment",
        content: "This document outlines the Data Protection Impact Assessment for the project.",
        level: HeadingLevel.HEADING_1,
      },
    ];
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Protection Impact Assessment</h2>
          <p className="text-muted-foreground">
            Conduct and document data protection impact assessments
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="dpia"
            artefactName="Data Protection Impact Assessment"
            generateContent={generateContent}
          />
        )}
      </div>
      {/* Content will be implemented */}
    </div>
  );
}
