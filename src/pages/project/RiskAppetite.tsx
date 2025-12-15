import { useParams } from "react-router-dom";
import { RiskAppetiteCapture } from "@/components/RiskAppetiteCapture";
import { useAuth } from "@/hooks/useAuth";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRiskAppetite } from "@/hooks/useRiskAppetite";

export default function RiskAppetite() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { permissions, isLoading } = useProjectPermissions(projectId || null, user?.id || null);
  const { riskAppetites } = useRiskAppetite(projectId || null);

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
    const appetiteEntries = Object.entries(riskAppetites)
      .filter(([_, level]) => level !== null)
      .map(([category, level]) => `${category}: ${level}`);

    return [
      {
        heading: "Risk Appetite Summary",
        content: "This document outlines the organisation's risk appetite across different impact categories.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "Risk Appetite Levels",
        content: appetiteEntries.length > 0 ? appetiteEntries : ["No risk appetite levels defined"],
        level: HeadingLevel.HEADING_2,
      },
    ];
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
          <h2 className="text-2xl font-bold mb-2">Risk Appetite Summary</h2>
          <p className="text-muted-foreground">
            Review your selected risk appetite levels across different categories
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="risk-appetite"
            artefactName="Risk Appetite"
            generateContent={generateContent}
          />
        )}
      </div>

      <RiskAppetiteCapture 
        projectId={projectId || null} 
        canWrite={permissions.canWriteRiskAppetite}
        summaryOnly={true}
      />
    </div>
  );
}
