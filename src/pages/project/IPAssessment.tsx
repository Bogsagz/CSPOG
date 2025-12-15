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

export default function IPAssessment() {
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
    const ipRequired = securityScope?.uses_intellectual_property === true;
    const ipDetailsList = securityScope?.intellectual_property_details
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim()) || [];

    return [
      {
        heading: "Intellectual Property Assessment",
        content: "This document outlines intellectual property security assessment requirements and NCSC guidance.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "NCSC Guidance",
        content: NCSC_GUIDANCE,
        level: HeadingLevel.HEADING_2,
      },
      {
        heading: "Assessment Requirement",
        content: ipRequired
          ? "Intellectual property assessments are required for this project."
          : "No intellectual property assessments required for this project.",
        level: HeadingLevel.HEADING_2,
      },
      ...(ipRequired && ipDetailsList.length > 0
        ? [{
            heading: "Intellectual Property",
            content: ipDetailsList,
            level: HeadingLevel.HEADING_2,
          }]
        : []),
    ];
  };

  const NCSC_GUIDANCE = "Intellectual property (IP) security assessments are essential for protecting valuable organisational assets including patents, trademarks, copyrights, and trade secrets. The National Cyber Security Centre (NCSC) highlights that IP theft represents a significant threat to UK organisations, particularly in technology and research sectors. IP assessments help identify vulnerabilities in how intellectual property is stored, transmitted, and accessed, ensuring appropriate protective measures are in place. This is critical for maintaining competitive advantage, complying with legal obligations, and preventing unauthorised disclosure or theft of proprietary information. Proper IP security controls protect not only the organisation's own innovations but also any third-party IP under licence or collaborative development agreements.";

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const ipRequired = securityScope?.uses_intellectual_property === true;
  const ipDetailsList = securityScope?.intellectual_property_details
    ?.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim()) || [];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Intellectual Property Assessment</h2>
          <p className="text-muted-foreground">
            Assess and document intellectual property considerations
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="ip-assessment"
            artefactName="Intellectual Property Assessment"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* NCSC Guidance */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Why Intellectual Property Security Assessments Matter</CardTitle>
          </div>
          <CardDescription>NCSC Guidance on IP Protection</CardDescription>
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
          {ipRequired ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Intellectual Property Assessments Required</AlertTitle>
              <AlertDescription>
                This project involves intellectual property and requires security assessments to be conducted.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Intellectual Property Assessments Required</AlertTitle>
              <AlertDescription>
                No intellectual property usage has been identified for this project in Project Foundations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* IP Details List */}
      {ipRequired && ipDetailsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
            <CardDescription>
              IP requiring security assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ipDetailsList.map((ip, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{ip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ipRequired && ipDetailsList.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              Intellectual property assessments are required but no specific IP has been listed yet. 
              Please update the details in Project Foundations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
