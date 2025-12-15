import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectSecurityScope } from "@/hooks/useProjectSecurityScope";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function ThirdPartyAssessments() {
  const { projectId } = useParams<{ projectId: string }>();
  const { securityScope, isLoading } = useProjectSecurityScope(projectId || "");

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
    const thirdPartiesRequired = securityScope?.uses_third_party_providers === true;
    const thirdPartiesList = securityScope?.third_party_providers_details
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim()) || [];

    return [
      {
        heading: "3rd Party Security Assessments",
        content: "This document outlines third-party security assessment requirements and NCSC guidance.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "NCSC Guidance",
        content: NCSC_GUIDANCE,
        level: HeadingLevel.HEADING_2,
      },
      {
        heading: "Assessment Requirement",
        content: thirdPartiesRequired
          ? "Third-party assessments are required for this project."
          : "No third-party assessments required for this project.",
        level: HeadingLevel.HEADING_2,
      },
      ...(thirdPartiesRequired && thirdPartiesList.length > 0
        ? [{
            heading: "Third-Party Providers",
            content: thirdPartiesList,
            level: HeadingLevel.HEADING_2,
          }]
        : []),
    ];
  };

  const NCSC_GUIDANCE = "Third-party security assessments are crucial for understanding and managing supply chain risks. The National Cyber Security Centre (NCSC) emphasises that organisations must have confidence in their suppliers' ability to protect sensitive data and maintain service continuity. These assessments help identify security vulnerabilities, ensure compliance with security standards, and verify that third parties implement appropriate security controls. Regular assessment of third-party providers is essential for maintaining a robust security posture, particularly for government and critical national infrastructure projects.";

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const thirdPartiesRequired = securityScope?.uses_third_party_providers === true;
  const thirdPartiesList = securityScope?.third_party_providers_details
    ?.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim()) || [];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">3rd Party Assessments</h2>
          <p className="text-muted-foreground">
            Manage third-party security assessments and evaluations
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="third-party-assessments"
            artefactName="3rd Party Assessments"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* NCSC Guidance */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Why Third-Party Security Assessments Matter</CardTitle>
          </div>
          <CardDescription>NCSC Guidance on Supply Chain Security</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{NCSC_GUIDANCE}</p>
        </CardContent>
      </Card>

      {/* Assessment Requirement Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment Requirement</CardTitle>
          <CardDescription>
            Based on information provided in Project Foundations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thirdPartiesRequired ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Third-Party Assessments Required</AlertTitle>
              <AlertDescription>
                This project uses third-party providers and requires security assessments to be conducted.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Third-Party Assessments Required</AlertTitle>
              <AlertDescription>
                No third-party providers have been identified for this project in Project Foundations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Third Parties List */}
      {thirdPartiesRequired && thirdPartiesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Third-Party Providers</CardTitle>
            <CardDescription>
              Providers requiring security assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {thirdPartiesList.map((party, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{party}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {thirdPartiesRequired && thirdPartiesList.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Third-Party Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              Third-party assessments are required but no specific providers have been listed yet. 
              Please update the details in Project Foundations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
