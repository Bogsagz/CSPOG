import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useObligations } from "@/hooks/useObligations";
import { useObligationDocuments } from "@/hooks/useObligationDocuments";
import { ExternalLink, BookOpen } from "lucide-react";
import { useState } from "react";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function SecurityObligations() {
  const { projectId } = useParams();
  const { obligations, isLoading } = useObligations(projectId!);
  const [expandedObligation, setExpandedObligation] = useState<string | null>(null);

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
    const sections: DocumentSection[] = [
      {
        heading: "Security Obligations",
        content: "This document outlines security obligations with linked compliance documents.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    if (obligations.length === 0) {
      sections.push({
        heading: "No Obligations",
        content: "No obligations have been defined for this project.",
        level: HeadingLevel.HEADING_2,
      });
    } else {
      obligations.forEach((obligation) => {
        sections.push({
          heading: obligation.name,
          content: [
            `Type: ${obligation.obligation_type || "N/A"}`,
            `Framework: ${obligation.compliance_framework || "N/A"}`,
            `Status: ${obligation.status || "N/A"}`,
            `Description: ${obligation.description || "No description"}`,
          ],
          level: HeadingLevel.HEADING_2,
        });
      });
    }

    return sections;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      law: "bg-red-500/10 text-red-500 border-red-500/20",
      standard: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      policy: "bg-green-500/10 text-green-500 border-green-500/20",
      framework: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      guidance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Security Obligations</h2>
          <p className="text-muted-foreground">
            Track and manage security obligations with linked compliance documents
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="security-obligations"
            artefactName="Security Obligations"
            generateContent={generateContent}
          />
        )}
      </div>

      {isLoading ? (
        <div>Loading obligations...</div>
      ) : obligations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No obligations found. Create obligations in the Obligations Tools page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {obligations.map((obligation) => (
            <ObligationCard
              key={obligation.id}
              obligation={obligation}
              expanded={expandedObligation === obligation.id}
              onToggle={() => setExpandedObligation(
                expandedObligation === obligation.id ? null : obligation.id
              )}
              getTypeColor={getTypeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ObligationCard({ 
  obligation, 
  expanded, 
  onToggle,
  getTypeColor 
}: { 
  obligation: any;
  expanded: boolean;
  onToggle: () => void;
  getTypeColor: (type: string) => string;
}) {
  const { linkedDocuments } = useObligationDocuments(obligation.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{obligation.name}</CardTitle>
            <CardDescription className="mt-1">
              {obligation.description || "No description provided"}
            </CardDescription>
            <div className="flex gap-2 mt-3 flex-wrap">
              {obligation.obligation_type && (
                <Badge variant="secondary">{obligation.obligation_type}</Badge>
              )}
              {obligation.compliance_framework && (
                <Badge variant="outline">{obligation.compliance_framework}</Badge>
              )}
              {obligation.status && (
                <Badge>{obligation.status}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {obligation.due_date && (
              <div>Due: {new Date(obligation.due_date).toLocaleDateString()}</div>
            )}
            {obligation.owner && (
              <div>Owner: {obligation.owner}</div>
            )}
          </div>
        </div>
      </CardHeader>
      {linkedDocuments.length > 0 && (
        <CardContent>
          <Button
            variant="ghost"
            onClick={onToggle}
            className="w-full justify-start"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {linkedDocuments.length} Linked Document{linkedDocuments.length !== 1 ? 's' : ''}
          </Button>
          
          {expanded && (
            <div className="mt-4 space-y-2">
              {linkedDocuments.map((link) => (
                <div
                  key={link.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-accent/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{link.document?.name}</h4>
                      <Badge variant="outline" className={getTypeColor(link.document?.document_type || "")}>
                        {link.document?.document_type}
                      </Badge>
                    </div>
                    {link.document?.category && (
                      <p className="text-xs text-muted-foreground">{link.document?.category}</p>
                    )}
                    {link.document?.description && (
                      <p className="text-xs text-muted-foreground">{link.document?.description}</p>
                    )}
                  </div>
                  {link.document?.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link.document?.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
