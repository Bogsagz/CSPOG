import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRiskAppetite } from "@/hooks/useRiskAppetite";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function RiskRegister() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get("editor") === "true";
  const { riskAppetites, isLoading: appetiteLoading } = useRiskAppetite(projectId || null);
  const { risks: savedRisks, updateRisk, updateModifiedRisk, deleteRisk, isLoading: risksLoading } = useSavedRisks(projectId || null);

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

  const [editingRisk, setEditingRisk] = useState<{ index: number; risk: typeof savedRisks[0] } | null>(null);
  const [editLikelihood, setEditLikelihood] = useState("");
  const [editImpact, setEditImpact] = useState("");

  const likelihoods = ["Remote", "Unlikely", "Possible", "Likely", "Very Likely"];
  const impacts = ["Minor", "Moderate", "Major", "Significant", "Critical"];

  const calculateRiskRating = (likelihood: string, impact: string): string => {
    const matrix: { [key: string]: { [key: string]: string } } = {
      "Remote": {
        "Minor": "Very Low Risk",
        "Moderate": "Very Low Risk",
        "Major": "Low Risk",
        "Significant": "Low Risk",
        "Critical": "Medium Risk"
      },
      "Unlikely": {
        "Minor": "Very Low Risk",
        "Moderate": "Low Risk",
        "Major": "Low Risk",
        "Significant": "Medium Risk",
        "Critical": "Medium Risk"
      },
      "Possible": {
        "Minor": "Low Risk",
        "Moderate": "Low Risk",
        "Major": "Medium Risk",
        "Significant": "Medium Risk",
        "Critical": "High Risk"
      },
      "Likely": {
        "Minor": "Low Risk",
        "Moderate": "Medium Risk",
        "Major": "Medium Risk",
        "Significant": "High Risk",
        "Critical": "Very High Risk"
      },
      "Very Likely": {
        "Minor": "Low Risk",
        "Moderate": "Medium Risk",
        "Major": "High Risk",
        "Significant": "Very High Risk",
        "Critical": "Very High Risk"
      }
    };
    return matrix[likelihood]?.[impact] || "Unknown";
  };

  const parseRiskStatement = (statement: string): { likelihood: string; impact: string } | null => {
    // Format: "It is [likelihood] that ... and a [impact] [type] impact of"
    const likelihoodMatch = statement.match(/It is (\w+(?:\s\w+)?)\s+that/i);
    const impactMatch = statement.match(/and a (\w+)\s+\w+\s+impact of/i);
    
    if (likelihoodMatch && impactMatch) {
      const parsedLikelihood = likelihoodMatch[1];
      const parsedImpact = impactMatch[1];
      
      console.log("Parsed likelihood:", parsedLikelihood);
      console.log("Parsed impact:", parsedImpact);
      
      // Verify the parsed values are valid
      if (likelihoods.includes(parsedLikelihood) && impacts.includes(parsedImpact)) {
        return {
          likelihood: parsedLikelihood,
          impact: parsedImpact
        };
      } else {
        console.error("Parsed values not in valid lists:", { parsedLikelihood, parsedImpact });
      }
    } else {
      console.error("Could not parse risk statement:", statement);
    }
    return null;
  };

  const handleEditClick = (index: number, risk: typeof savedRisks[0]) => {
    console.log("Attempting to edit risk:", risk);
    // Use base values for editing
    const baseLikelihood = risk.base_likelihood || "";
    const baseImpact = risk.base_impact || "";
    
    if (baseLikelihood && baseImpact) {
      setEditLikelihood(baseLikelihood);
      setEditImpact(baseImpact);
      setEditingRisk({ index, risk });
    } else {
      console.error("Missing base likelihood or impact");
      toast.error("Could not edit risk. Missing base assessment values.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRisk) return;

    const newRiskRating = calculateRiskRating(editLikelihood, editImpact);
    // Update the risk statement with new likelihood and impact
    const updatedStatement = editingRisk.risk.risk_statement
      .replace(/It is \w+(?:\s\w+)?\s+that/i, `It is ${editLikelihood} that`)
      .replace(/and a \w+\s+(\w+)\s+impact of/i, `and a ${editImpact} $1 impact of`);

    // Maintain the threat linkage and update base values
    await updateRisk(
      editingRisk.index,
      updatedStatement,
      newRiskRating,
      editingRisk.risk.impact_type || "",
      editingRisk.risk.threat_id,
      editLikelihood,
      editImpact
    );
    setEditingRisk(null);
  };

  const handleDeleteRisk = async (index: number) => {
    await deleteRisk(index);
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case "Minor":
      case "Very Low Risk":
        return "bg-emerald-700 text-white";
      case "Moderate":
      case "Low Risk":
        return "bg-green-500 text-white";
      case "Major":
      case "Medium Risk":
        return "bg-yellow-500 text-black";
      case "Significant":
      case "High Risk":
        return "bg-orange-500 text-white";
      case "Critical":
      case "Very High Risk":
        return "bg-red-700 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Map risk ratings to numeric values for comparison
  const getRiskRatingValue = (rating: string): number => {
    switch (rating) {
      case "Very Low Risk": return 1;
      case "Low Risk": return 2;
      case "Medium Risk": return 3;
      case "High Risk": return 4;
      case "Very High Risk": return 5;
      default: return 0;
    }
  };

  // Map impact levels to numeric values for comparison
  const getImpactLevelValue = (level: string): number => {
    switch (level) {
      case "Minor": return 1;
      case "Moderate": return 2;
      case "Major": return 3;
      case "Significant": return 4;
      case "Critical": return 5;
      default: return 0;
    }
  };

  // Map appetite levels (Orange Book) to numeric values
  const getAppetiteRiskRatingValue = (appetiteLevel: string): number => {
    switch (appetiteLevel) {
      case "Averse": return 1;
      case "Minimal": return 2;
      case "Cautious": return 3;
      case "Open": return 4;
      case "Eager": return 5;
      default: return 0;
    }
  };

  // Determine if a risk is in tolerance
  const isRiskInTolerance = (risk: typeof savedRisks[0]): boolean => {
    console.log("Checking tolerance for risk:", risk.risk_statement.substring(0, 50));
    console.log("Risk impact_type:", risk.impact_type);
    
    if (!risk.impact_type) {
      console.log("No impact_type - out of tolerance");
      return false;
    }
    
    const appetiteLevel = riskAppetites[risk.impact_type as keyof typeof riskAppetites];
    console.log("Appetite level for", risk.impact_type, ":", appetiteLevel);
    
    if (!appetiteLevel) {
      console.log("No appetite set for this type - out of tolerance");
      return false;
    }

    // Use modified likelihood/impact if available, otherwise use base values
    const likelihood = risk.modified_likelihood || risk.base_likelihood;
    const impact = risk.modified_impact || risk.base_impact;
    
    console.log("Risk likelihood:", likelihood, "impact:", impact);
    
    if (!likelihood || !impact) {
      console.log("Missing likelihood or impact - out of tolerance");
      return false;
    }
    
    // Calculate the overall risk rating and compare against appetite
    const currentRating = calculateRiskRating(likelihood, impact);
    const riskValue = getRiskRatingValue(currentRating);
    const appetiteValue = getAppetiteRiskRatingValue(appetiteLevel);
    
    console.log("Current rating:", currentRating, "value:", riskValue);
    console.log("Appetite value:", appetiteValue);
    console.log("In tolerance?", riskValue <= appetiteValue);

    return riskValue <= appetiteValue;
  };

  // Sort risks by rating (highest first), using modified values when available
  const sortByRiskRating = (a: typeof savedRisks[0], b: typeof savedRisks[0]) => {
    const aLikelihood = a.modified_likelihood || a.base_likelihood || "";
    const aImpact = a.modified_impact || a.base_impact || "";
    const bLikelihood = b.modified_likelihood || b.base_likelihood || "";
    const bImpact = b.modified_impact || b.base_impact || "";
    
    const aRating = calculateRiskRating(aLikelihood, aImpact);
    const bRating = calculateRiskRating(bLikelihood, bImpact);
    
    return getRiskRatingValue(bRating) - getRiskRatingValue(aRating);
  };

  // Split risks into tolerance categories
  const outOfToleranceRisks = savedRisks.filter(risk => !isRiskInTolerance(risk)).sort(sortByRiskRating);
  const inToleranceRisks = savedRisks.filter(risk => isRiskInTolerance(risk)).sort(sortByRiskRating);

  // Convert Record to array for display
  const appetiteArray = Object.entries(riskAppetites)
    .filter(([_, level]) => level !== null)
    .map(([category, level]) => ({ category, risk_level: level }));

  if (appetiteLoading || risksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    const sections: DocumentSection[] = [
      {
        heading: "Risk Register",
        content: "This document contains the risk register for the project.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    if (outOfToleranceRisks.length > 0) {
      sections.push({
        heading: "Out of Tolerance Risks",
        content: outOfToleranceRisks.map((risk, idx) => {
          const likelihood = risk.modified_likelihood || risk.base_likelihood || "";
          const impact = risk.modified_impact || risk.base_impact || "";
          const rating = calculateRiskRating(likelihood, impact);
          return `${idx + 1}. ${risk.impact_type} - ${rating}\n   ${risk.risk_statement}`;
        }),
        level: HeadingLevel.HEADING_2,
      });
    }

    if (inToleranceRisks.length > 0) {
      sections.push({
        heading: "In Tolerance Risks",
        content: inToleranceRisks.map((risk, idx) => {
          const likelihood = risk.modified_likelihood || risk.base_likelihood || "";
          const impact = risk.modified_impact || risk.base_impact || "";
          const rating = calculateRiskRating(likelihood, impact);
          return `${idx + 1}. ${risk.impact_type} - ${rating}\n   ${risk.risk_statement}`;
        }),
        level: HeadingLevel.HEADING_2,
      });
    }

    return sections;
  };

  const exportToCSV = () => {
    const headers = [
      "Status",
      "Impact Type",
      "Likelihood",
      "Impact",
      "Risk Rating",
      "Risk Statement",
      "Modified Likelihood",
      "Modified Impact",
      "Modified Risk Rating",
      "Likelihood Justification",
      "Impact Justification",
      "Remediation Plan"
    ];

    const rows = savedRisks.map(risk => {
      const likelihood = risk.modified_likelihood || risk.base_likelihood || "";
      const impact = risk.modified_impact || risk.base_impact || "";
      const currentRating = calculateRiskRating(likelihood, impact);
      const baseRating = risk.base_likelihood && risk.base_impact 
        ? calculateRiskRating(risk.base_likelihood, risk.base_impact)
        : "";
      const inTolerance = isRiskInTolerance(risk);

      return [
        inTolerance ? "In Tolerance" : "Out of Tolerance",
        risk.impact_type || "",
        risk.base_likelihood || "",
        risk.base_impact || "",
        baseRating,
        `"${(risk.risk_statement || "").replace(/"/g, '""')}"`,
        risk.modified_likelihood || "",
        risk.modified_impact || "",
        risk.modified_likelihood && risk.modified_impact ? currentRating : "",
        `"${(risk.likelihood_justification || "").replace(/"/g, '""')}"`,
        `"${(risk.impact_justification || "").replace(/"/g, '""')}"`,
        `"${(risk.remediation_plan || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${project?.title || "project"}_risks_SNOW.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Risks exported to CSV");
  };

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Risk Register</h2>
          <p className="text-muted-foreground">
            Track and manage identified risks throughout the project
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={savedRisks.length === 0}
          >
            Export Risks to SNOW
          </Button>
          {projectId && project && (
            <GenerateArtefactButton
              projectId={projectId}
              projectName={project.title}
              artefactType="risk-register"
              artefactName="Risk Register"
              generateContent={generateContent}
            />
          )}
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Project Risk Appetite
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appetiteArray.length === 0 ? (
            <p className="text-muted-foreground">No risk appetite defined for this project</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {appetiteArray.map((appetite) => (
                <div key={appetite.category} className="flex flex-col items-center space-y-2">
                  <h3 className="font-semibold text-sm text-center">{appetite.category}</h3>
                  <Badge 
                    className={`${getRiskLevelColor(appetite.risk_level)} px-6 py-3 text-sm font-medium w-full text-center justify-center`}
                  >
                    {appetite.risk_level}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Out of Tolerance Risks */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Out of Tolerance Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outOfToleranceRisks.length === 0 ? (
            <p className="text-muted-foreground">No risks out of tolerance</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead className="w-[130px]">Impact Type</TableHead>
                    <TableHead className="w-[150px]">Risk Rating</TableHead>
                    <TableHead>Risk Statement</TableHead>
                    {isEditorMode && <TableHead className="w-[120px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfToleranceRisks.map((risk, index) => {
                    const originalIndex = savedRisks.findIndex(r => r.id === risk.id);
                    const likelihood = risk.modified_likelihood || risk.base_likelihood || "";
                    const impact = risk.modified_impact || risk.base_impact || "";
                    const currentRating = calculateRiskRating(likelihood, impact);
                    const isModified = !!(risk.modified_likelihood && risk.modified_impact);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{risk.impact_type}</span>
                            {isModified && (
                              <Badge variant="outline" className="w-fit text-xs">Modified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="destructive" className={getRiskLevelColor(currentRating)}>
                              {currentRating}
                            </Badge>
                            {isModified && (
                              <span className="text-xs text-muted-foreground">
                                Base: {calculateRiskRating(risk.base_likelihood || "", risk.base_impact || "")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{risk.risk_statement}</TableCell>
                        {isEditorMode && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(originalIndex, risk)}
                                className="hover:bg-accent"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRisk(originalIndex)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Tolerance Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            In Tolerance Risks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inToleranceRisks.length === 0 ? (
            <p className="text-muted-foreground">No risks in tolerance</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead className="w-[130px]">Impact Type</TableHead>
                    <TableHead className="w-[150px]">Risk Rating</TableHead>
                    <TableHead>Risk Statement</TableHead>
                    {isEditorMode && <TableHead className="w-[120px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inToleranceRisks.map((risk, index) => {
                    const originalIndex = savedRisks.findIndex(r => r.id === risk.id);
                    const likelihood = risk.modified_likelihood || risk.base_likelihood || "";
                    const impact = risk.modified_impact || risk.base_impact || "";
                    const currentRating = calculateRiskRating(likelihood, impact);
                    const isModified = !!(risk.modified_likelihood && risk.modified_impact);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{risk.impact_type}</span>
                            {isModified && (
                              <Badge variant="outline" className="w-fit text-xs">Modified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={getRiskLevelColor(currentRating)}>
                              {currentRating}
                            </Badge>
                            {isModified && (
                              <span className="text-xs text-muted-foreground">
                                Base: {calculateRiskRating(risk.base_likelihood || "", risk.base_impact || "")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{risk.risk_statement}</TableCell>
                        {isEditorMode && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(originalIndex, risk)}
                                className="hover:bg-accent"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRisk(originalIndex)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Risk Dialog */}
      <Dialog open={editingRisk !== null} onOpenChange={() => setEditingRisk(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Base Risk</DialogTitle>
            <DialogDescription>
              Update the base likelihood and impact for this risk. Use Risk Tuner to create modified assessments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Likelihood</Label>
              <Select value={editLikelihood} onValueChange={setEditLikelihood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select likelihood" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {likelihoods.map((likelihood) => (
                    <SelectItem key={likelihood} value={likelihood}>
                      {likelihood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Impact</Label>
              <Select value={editImpact} onValueChange={setEditImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="Select impact" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {impacts.map((impact) => (
                    <SelectItem key={impact} value={impact}>
                      {impact}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editLikelihood && editImpact && (
              <div className="space-y-2">
                <Label>Updated Risk Rating</Label>
                <Badge className={getRiskLevelColor(calculateRiskRating(editLikelihood, editImpact))}>
                  {calculateRiskRating(editLikelihood, editImpact)}
                </Badge>
              </div>
            )}
            {editingRisk && editLikelihood && editImpact && (
              <div className="space-y-2">
                <Label>Risk Statement Preview</Label>
                <p className="text-sm p-3 rounded-md bg-muted">
                  {editingRisk.risk.risk_statement
                    .replace(/It is \w+(?:\s\w+)?\s+that/i, `It is ${editLikelihood} that`)
                    .replace(/and a \w+\s+(\w+)\s+impact of/i, `and a ${editImpact} $1 impact of`)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRisk(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editLikelihood || !editImpact}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
