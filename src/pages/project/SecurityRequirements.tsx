import { useParams } from "react-router-dom";
import { useRequirements } from "@/hooks/useRequirements";
import { CAF_FRAMEWORK } from "@/lib/cafFramework";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { govAssureProfiles } from "@/lib/cafGovAssureProfiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SecurityRequirements() {
  const { projectId } = useParams<{ projectId: string }>();
  const { requirements, isLoading } = useRequirements(projectId!);
  const [activeTab, setActiveTab] = useState("requirements");

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
        heading: "Security Requirements",
        content: "NCSC CAF aligned security requirements for this project.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    if (requirements.length === 0) {
      sections.push({
        heading: "No Requirements",
        content: "No requirements have been defined for this project.",
        level: HeadingLevel.HEADING_2,
      });
    } else {
      CAF_FRAMEWORK.forEach((objective) => {
        const objectiveReqs = requirements.filter(req => req.source?.startsWith(objective.objective));
        if (objectiveReqs.length > 0) {
          sections.push({
            heading: `${objective.objective} - ${objective.title}`,
            content: objectiveReqs.map(req => `${req.name}: ${req.description || "No description"}`),
            level: HeadingLevel.HEADING_2,
          });
        }
      });
    }

    return sections;
  };

  // Calculate completion statistics
  const getCompletionStats = () => {
    const totalOutcomes = CAF_FRAMEWORK.reduce((acc, obj) => 
      acc + obj.principles.reduce((pAcc, p) => pAcc + p.outcomes.length, 0), 0
    );
    
    const completedOutcomes = CAF_FRAMEWORK.reduce((acc, obj) => 
      acc + obj.principles.reduce((pAcc, p) => 
        pAcc + p.outcomes.filter(o => requirements.some(r => r.source === o.id)).length, 0
      ), 0
    );
    
    return { 
      totalOutcomes, 
      completedOutcomes, 
      percentage: totalOutcomes > 0 ? Math.round((completedOutcomes / totalOutcomes) * 100) : 0
    };
  };

  const stats = getCompletionStats();

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Security Requirements</h2>
          <p className="text-muted-foreground">
            NCSC CAF aligned security requirements for this project
          </p>
        </div>
        <div className="text-center py-12">Loading requirements...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Security Requirements</h2>
          <p className="text-muted-foreground">
            NCSC CAF aligned security requirements for this project
          </p>
        </div>
        {projectId && project && activeTab === "requirements" && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="security-requirements"
            artefactName="Security Requirements"
            generateContent={generateContent}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="profiles">GOV Assure Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements">
      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CAF Coverage Summary</CardTitle>
              <CardDescription>Overall compliance across all CAF outcomes</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.percentage}%</div>
              <div className="text-sm text-muted-foreground">
                {stats.completedOutcomes} of {stats.totalOutcomes} outcomes
              </div>
            </div>
          </div>
          <Progress value={stats.percentage} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Requirements:</span>
            <span className="font-semibold">{requirements.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Requirements by CAF Structure */}
      {requirements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Requirements Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use the Requirements Tools to create CAF-aligned security requirements
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {CAF_FRAMEWORK.map((objective) => {
            const objectiveReqs = requirements.filter(req => 
              req.source?.startsWith(objective.objective)
            );
            
            if (objectiveReqs.length === 0) return null;

            return (
              <AccordionItem 
                key={objective.objective} 
                value={objective.objective}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-base">
                        {objective.objective}
                      </Badge>
                      <span className="font-semibold">{objective.title}</span>
                    </div>
                    <Badge variant="secondary">
                      {objectiveReqs.length} requirement{objectiveReqs.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    {objective.principles.map((principle) => {
                      const principleReqs = requirements.filter(req => 
                        req.source?.startsWith(principle.id)
                      );
                      
                      if (principleReqs.length === 0) return null;

                      return (
                        <div key={principle.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{principle.id}</Badge>
                                <h4 className="font-semibold">{principle.name}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">{principle.description}</p>
                            </div>
                            <Badge variant="secondary" className="ml-4 flex-shrink-0">
                              {principleReqs.length}
                            </Badge>
                          </div>

                          {/* Outcomes */}
                          <div className="ml-4 space-y-3">
                            {principle.outcomes.map((outcome) => {
                              const outcomeReqs = requirements.filter(req => req.source === outcome.id);
                              
                              if (outcomeReqs.length === 0) return null;

                              return (
                                <div key={outcome.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                                  <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold">{outcome.id}</span>
                                        <span className="text-sm font-medium">{outcome.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {outcome.description}
                                      </p>
                                      
                                      {/* Requirements List */}
                                      <div className="space-y-2">
                                        {outcomeReqs.map((req) => (
                                          <div 
                                            key={req.id} 
                                            className="bg-background rounded border p-3 space-y-2"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1">
                                                <h5 className="font-medium text-sm mb-1">{req.name}</h5>
                                                {req.description && (
                                                  <p className="text-xs text-muted-foreground">
                                                    {req.description}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex gap-2 flex-shrink-0">
                                                {req.priority && (
                                                  <Badge 
                                                    variant={
                                                      req.priority === "Critical" ? "destructive" :
                                                      req.priority === "High" ? "default" :
                                                      "secondary"
                                                    }
                                                    className="text-xs"
                                                  >
                                                    {req.priority}
                                                  </Badge>
                                                )}
                                                {req.status && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {req.status}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Government CAF Profiles</CardTitle>
              <CardDescription>
                Required achievement levels for Baseline and Enhanced profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outcome Number</TableHead>
                    <TableHead>Outcome Name</TableHead>
                    <TableHead>Baseline Profile</TableHead>
                    <TableHead>Enhanced Profile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {govAssureProfiles.map((profile) => (
                    <TableRow key={profile.outcomeNumber}>
                      <TableCell className="font-medium">{profile.outcomeNumber}</TableCell>
                      <TableCell>{profile.outcomeName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            profile.baselineProfile === "Achieved" ? "default" :
                            profile.baselineProfile === "Partially Achieved" ? "secondary" :
                            "outline"
                          }
                        >
                          {profile.baselineProfile}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            profile.enhancedProfile === "Achieved" ? "default" :
                            profile.enhancedProfile === "Partially Achieved" ? "secondary" :
                            "outline"
                          }
                        >
                          {profile.enhancedProfile}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
