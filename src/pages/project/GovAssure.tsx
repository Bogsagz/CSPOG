import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function GovAssure() {
  const { projectId } = useParams<{ projectId: string }>();
  const { assessmentDoc, isLoading } = useProjectAssessmentDocumentation(projectId || "");

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
        heading: "Government Assurance (Gov Assure)",
        content: "This document outlines the Government Assurance profile and requirements for the project.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "What is Gov Assure?",
        content: GOV_ASSURE_DEFINITION,
        level: HeadingLevel.HEADING_2,
      },
      {
        heading: "Gov Assure Profile",
        content: assessmentDoc?.gov_assure_profile
          ? `Selected Profile: ${assessmentDoc.gov_assure_profile.charAt(0).toUpperCase() + assessmentDoc.gov_assure_profile.slice(1)}\n\n${PROFILE_DEFINITIONS[assessmentDoc.gov_assure_profile as keyof typeof PROFILE_DEFINITIONS]}`
          : "No Gov Assure profile selected.",
        level: HeadingLevel.HEADING_2,
      },
    ];
  };

  const GOV_ASSURE_DEFINITION = "Government Assurance (Gov Assure) is the UK government's framework for providing confidence that projects and programmes will achieve their intended outcomes. It encompasses a range of reviews and assessments throughout the project lifecycle to ensure effective delivery, value for money, and alignment with strategic objectives.";

  const PROFILE_DEFINITIONS = {
    normal: "Normal Profile is applied to projects with standard governance requirements. These projects follow baseline assurance processes with regular reviews at key decision points. Suitable for projects with manageable complexity and risk levels that can be effectively overseen through standard governance arrangements.",
    enhanced: "Enhanced Profile is applied to projects requiring additional scrutiny and more rigorous assurance processes. This profile is typically used for high-risk, high-value, or strategically critical projects that need closer monitoring and more frequent reviews. Enhanced assurance includes additional checkpoints, senior-level oversight, and more detailed reporting requirements."
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gov Assure</h2>
          <p className="text-muted-foreground">
            Government assurance documentation and compliance tracking
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="gov-assure"
            artefactName="Gov Assure"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* Gov Assure Overview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>What is Gov Assure?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{GOV_ASSURE_DEFINITION}</p>
        </CardContent>
      </Card>

      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Gov Assure Profile</CardTitle>
          <CardDescription>
            Profile selected for this project based on Business Impact Assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessmentDoc?.gov_assure_profile ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">Selected Profile:</span>
                <Badge variant={assessmentDoc.gov_assure_profile === "enhanced" ? "destructive" : "default"} className="text-base">
                  {assessmentDoc.gov_assure_profile.charAt(0).toUpperCase() + assessmentDoc.gov_assure_profile.slice(1)}
                </Badge>
              </div>
              
              <div className="border-l-4 border-primary/30 pl-4 py-3 bg-muted/30 rounded-r">
                <h4 className="font-semibold text-sm mb-2">
                  {assessmentDoc.gov_assure_profile.charAt(0).toUpperCase() + assessmentDoc.gov_assure_profile.slice(1)} Profile Definition
                </h4>
                <p className="text-sm text-muted-foreground">
                  {PROFILE_DEFINITIONS[assessmentDoc.gov_assure_profile as keyof typeof PROFILE_DEFINITIONS]}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No Gov Assure profile selected. Please complete the Business Impact Assessment in Project Foundations to set the recommended profile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
