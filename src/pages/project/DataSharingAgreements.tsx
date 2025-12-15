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

export default function DataSharingAgreements() {
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
    const dataSharingRequired = securityScope?.requires_data_sharing === true;
    const dataSharingDetailsList = securityScope?.data_sharing_details
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.trim()) || [];

    return [
      {
        heading: "Data Sharing Agreements",
        content: "This document outlines data sharing agreement requirements and ICO/NCSC guidance.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "ICO and NCSC Guidance",
        content: NCSC_ICO_GUIDANCE,
        level: HeadingLevel.HEADING_2,
      },
      {
        heading: "Agreement Requirement",
        content: dataSharingRequired
          ? "Data sharing agreements are required for this project."
          : "No data sharing agreements required for this project.",
        level: HeadingLevel.HEADING_2,
      },
      ...(dataSharingRequired && dataSharingDetailsList.length > 0
        ? [{
            heading: "Data Sharing Details",
            content: dataSharingDetailsList,
            level: HeadingLevel.HEADING_2,
          }]
        : []),
    ];
  };

  const NCSC_ICO_GUIDANCE = "Data Sharing Agreements (DSAs) are formal arrangements that establish the terms and conditions under which personal or sensitive data is shared between organisations. The Information Commissioner's Office (ICO) and National Cyber Security Centre (NCSC) emphasise that DSAs are critical for maintaining data protection compliance, particularly under UK GDPR. These agreements must clearly define the purpose of data sharing, the lawful basis, security measures, retention periods, and respective responsibilities of all parties. DSAs help ensure accountability, protect data subjects' rights, and mitigate risks associated with unauthorised access, data breaches, or misuse. For public sector organisations, proper data sharing agreements are essential for maintaining public trust and meeting statutory obligations while enabling effective collaboration and service delivery.";

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const dataSharingRequired = securityScope?.requires_data_sharing === true;
  const dataSharingDetailsList = securityScope?.data_sharing_details
    ?.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim()) || [];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Sharing Agreements</h2>
          <p className="text-muted-foreground">
            Manage agreements for data sharing with third parties
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="data-sharing-agreements"
            artefactName="Data Sharing Agreements"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* NCSC/ICO Guidance */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Why Data Sharing Agreements Matter</CardTitle>
          </div>
          <CardDescription>ICO and NCSC Guidance on Data Sharing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{NCSC_ICO_GUIDANCE}</p>
        </CardContent>
      </Card>

      {/* Agreement Requirement Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Agreement Requirement</CardTitle>
          <CardDescription>
            Based on information provided in Project Foundations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataSharingRequired ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Data Sharing Agreements Required</AlertTitle>
              <AlertDescription>
                This project requires data sharing with third parties and formal agreements must be established.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Data Sharing Agreements Required</AlertTitle>
              <AlertDescription>
                No data sharing requirements have been identified for this project in Project Foundations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Sharing Details List */}
      {dataSharingRequired && dataSharingDetailsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing Details</CardTitle>
            <CardDescription>
              Information about data to be shared and recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dataSharingDetailsList.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dataSharingRequired && dataSharingDetailsList.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">
              Data sharing agreements are required but no specific details have been provided yet. 
              Please update the information in Project Foundations to specify what data will be shared and with whom.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
