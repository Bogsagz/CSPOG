import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const NCSC_GUIDANCE = `A Business Impact Assessment (BIA) is a critical component of cyber security and business continuity planning. The National Cyber Security Centre (NCSC) emphasises the importance of understanding the potential impact of disruption to business-critical services and data.

A BIA helps organisations identify and prioritise critical business functions, understand dependencies between systems and processes, determine acceptable downtime and data loss thresholds, and establish appropriate security controls based on business criticality.

For government and critical national infrastructure organisations, BIA findings directly inform the selection of Gov Assure profiles and the level of security controls required. The assessment should consider confidentiality, integrity, and availability impacts across financial, operational, reputational, and legal dimensions.`;

const GOV_ASSURE_PROFILE_DESCRIPTIONS: Record<string, string> = {
  baseline: "The Baseline Profile applies to systems where a security incident would have limited impact on operations, finances, or reputation. These systems typically process non-sensitive data and support non-critical business functions.",
  enhanced: "The Enhanced Profile applies to systems where a security incident could have significant impact on operations, finances, or reputation. These systems may process sensitive data or support important business functions requiring additional security controls.",
};

export default function BusinessImpactAssessment() {
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
    const biaCompleted = assessmentDoc?.bia_completed === true;
    const govAssureProfile = assessmentDoc?.gov_assure_profile;
    const biaLink = assessmentDoc?.bia_link;

    return [
      {
        heading: "Business Impact Assessment",
        content: "This document summarises the Business Impact Assessment findings and their implications for security controls.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "NCSC Guidance",
        content: NCSC_GUIDANCE,
        level: HeadingLevel.HEADING_2,
      },
      {
        heading: "Assessment Status",
        content: biaCompleted
          ? "The Business Impact Assessment has been completed for this project."
          : "The Business Impact Assessment has not yet been completed for this project.",
        level: HeadingLevel.HEADING_2,
      },
      ...(govAssureProfile
        ? [{
            heading: "Gov Assure Profile",
            content: `Based on the BIA findings, this project has been assigned the ${govAssureProfile.charAt(0).toUpperCase() + govAssureProfile.slice(1)} Profile. ${GOV_ASSURE_PROFILE_DESCRIPTIONS[govAssureProfile.toLowerCase()] || ""}`,
            level: HeadingLevel.HEADING_2,
          }]
        : []),
      ...(biaLink
        ? [{
            heading: "BIA Documentation",
            content: `The full BIA documentation can be accessed at: ${biaLink}`,
            level: HeadingLevel.HEADING_2,
          }]
        : []),
    ];
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const biaCompleted = assessmentDoc?.bia_completed === true;
  const govAssureProfile = assessmentDoc?.gov_assure_profile;
  const biaLink = assessmentDoc?.bia_link;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Business Impact Assessment</h2>
          <p className="text-muted-foreground">
            Review and document business impact assessment findings
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="business-impact-assessment"
            artefactName="Business Impact Assessment"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* NCSC Guidance */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Why Business Impact Assessments Matter</CardTitle>
          </div>
          <CardDescription>NCSC Guidance on BIA</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{NCSC_GUIDANCE}</p>
        </CardContent>
      </Card>

      {/* Assessment Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment Status</CardTitle>
          <CardDescription>
            Based on information provided in Project Foundations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {biaCompleted ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Business Impact Assessment Completed</AlertTitle>
              <AlertDescription>
                The BIA has been completed for this project and the findings inform the security requirements.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Business Impact Assessment Not Completed</AlertTitle>
              <AlertDescription>
                The BIA has not yet been completed. Please complete the BIA in Project Foundations to determine the appropriate Gov Assure profile and security controls.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gov Assure Profile */}
      {govAssureProfile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gov Assure Profile</CardTitle>
            <CardDescription>
              Security profile determined by BIA findings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <Badge 
                variant="default" 
                className={`text-sm py-1 px-3 ${
                  govAssureProfile.toLowerCase() === 'enhanced' 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {govAssureProfile.charAt(0).toUpperCase() + govAssureProfile.slice(1)} Profile
              </Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {GOV_ASSURE_PROFILE_DESCRIPTIONS[govAssureProfile.toLowerCase()] || "Profile description not available."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* BIA Documentation Link */}
      {biaLink && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>BIA Documentation</CardTitle>
            <CardDescription>
              Link to full BIA documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a 
                href={biaLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {biaLink}
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Profile Set */}
      {biaCompleted && !govAssureProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Gov Assure Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              The BIA has been marked as completed but no Gov Assure profile has been assigned yet.
              Please update the profile selection in Project Foundations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
