import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Pencil, Trash2, CheckCircle2, Calculator } from "lucide-react";
import { useRiskDecisions } from "@/hooks/useRiskDecisions";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { useRiskAppetite } from "@/hooks/useRiskAppetite";
import { useAppSettings } from "@/hooks/useAppSettings";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { SecondaryRiskBuilder } from "@/components/SecondaryRiskBuilder";
import { AlertTriangle } from "lucide-react";
import { LikelihoodCalculatorDialog } from "@/components/LikelihoodCalculatorDialog";

export default function RiskDecisions() {
  const { projectId } = useParams<{ projectId: string }>();
  const { rdds, isLoading: rddsLoading, createRDD, updateRDD, deleteRDD, createOption, updateOption, deleteOption, setPreferredOption } = useRiskDecisions(projectId || null);
  const { risks } = useSavedRisks(projectId || null);
  const { riskAppetites } = useRiskAppetite(projectId || null);
  const { businessImpactMatrix } = useAppSettings();
  
  const [mode, setMode] = useState<"list" | "create" | "edit" | "select-edit">("list");
  const [selectedRiskId, setSelectedRiskId] = useState<string>("");
  const [background, setBackground] = useState("");
  const [currentRddId, setCurrentRddId] = useState<string | null>(null);
  const [showOptionDialog, setShowOptionDialog] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  
  // Option form fields
  const [approach, setApproach] = useState<"Accept" | "Avoid" | "Mitigate" | "Transfer">("Accept");
  const [description, setDescription] = useState("");
  const [businessImpactType, setBusinessImpactType] = useState("");
  const [businessImpactLevel, setBusinessImpactLevel] = useState("");
  const [businessImpacts, setBusinessImpacts] = useState("");
  const [residualLikelihood, setResidualLikelihood] = useState("");
  const [residualImpact, setResidualImpact] = useState("");
  const [secondaryRiskStatement, setSecondaryRiskStatement] = useState("");
  const [resourceImpactsHuman, setResourceImpactsHuman] = useState("");
  const [resourceImpactsMaterial, setResourceImpactsMaterial] = useState("");
  const [resourceImpactsFinancial, setResourceImpactsFinancial] = useState("");
  const [resourceImpactsTime, setResourceImpactsTime] = useState("");
  const [additionalBenefits, setAdditionalBenefits] = useState("");
  const [showLikelihoodCalculator, setShowLikelihoodCalculator] = useState(false);

  const impactTypes = Object.keys(businessImpactMatrix || {});
  const impactLevels = ["Minor", "Moderate", "Major", "Significant", "Critical"];

  // Update businessImpacts when type and level change
  useEffect(() => {
    if (businessImpactType && businessImpactLevel && businessImpactMatrix) {
      const impactText = businessImpactMatrix[businessImpactType]?.[businessImpactLevel] || "";
      setBusinessImpacts(impactText);
    }
  }, [businessImpactType, businessImpactLevel, businessImpactMatrix]);

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

  const likelihoods = ["Remote", "Unlikely", "Possible", "Likely", "Very Likely"];
  const impacts = ["Minor", "Moderate", "Major", "Significant", "Critical"];

  const calculateRiskRating = (likelihood: string, impact: string): string => {
    const matrix: { [key: string]: { [key: string]: string } } = {
      "Remote": { "Minor": "Very Low Risk", "Moderate": "Very Low Risk", "Major": "Low Risk", "Significant": "Low Risk", "Critical": "Medium Risk" },
      "Unlikely": { "Minor": "Very Low Risk", "Moderate": "Low Risk", "Major": "Low Risk", "Significant": "Medium Risk", "Critical": "Medium Risk" },
      "Possible": { "Minor": "Low Risk", "Moderate": "Low Risk", "Major": "Medium Risk", "Significant": "Medium Risk", "Critical": "High Risk" },
      "Likely": { "Minor": "Low Risk", "Moderate": "Medium Risk", "Major": "Medium Risk", "Significant": "High Risk", "Critical": "Very High Risk" },
      "Very Likely": { "Minor": "Low Risk", "Moderate": "Medium Risk", "Major": "High Risk", "Significant": "Very High Risk", "Critical": "Very High Risk" }
    };
    return matrix[likelihood]?.[impact] || "Unknown";
  };

  const isRiskOutOfTolerance = (risk: any): boolean => {
    if (!risk.impact_type) return false;
    const appetiteLevel = riskAppetites[risk.impact_type as keyof typeof riskAppetites];
    if (!appetiteLevel) return false;
    
    const likelihood = risk.modified_likelihood || risk.base_likelihood;
    const impact = risk.modified_impact || risk.base_impact;
    if (!likelihood || !impact) return false;
    
    const currentRating = calculateRiskRating(likelihood, impact);
    const riskValue = getRiskRatingValue(currentRating);
    const appetiteValue = getAppetiteRiskRatingValue(appetiteLevel);
    
    return riskValue > appetiteValue;
  };

  const getRiskRatingValue = (rating: string): number => {
    const values: { [key: string]: number } = {
      "Very Low Risk": 1, "Low Risk": 2, "Medium Risk": 3, "High Risk": 4, "Very High Risk": 5
    };
    return values[rating] || 0;
  };

  const getImpactLevelValue = (level: string): number => {
    const values: { [key: string]: number } = {
      "Minor": 1, "Moderate": 2, "Major": 3, "Significant": 4, "Critical": 5
    };
    return values[level] || 0;
  };

  // Map appetite levels (Orange Book) to numeric values
  const getAppetiteRiskRatingValue = (appetiteLevel: string): number => {
    const values: { [key: string]: number } = {
      "Averse": 1, "Minimal": 2, "Cautious": 3, "Open": 4, "Eager": 5
    };
    return values[appetiteLevel] || 0;
  };

  const outOfToleranceRisks = risks.filter(isRiskOutOfTolerance);

  const handleCreateRDD = async () => {
    if (!selectedRiskId || !background.trim()) {
      return;
    }
    const rddId = await createRDD(selectedRiskId, background);
    if (rddId) {
      setCurrentRddId(rddId);
    }
  };

  // Auto-create RDD when risk and background are set
  useEffect(() => {
    if (mode === "create" && selectedRiskId && background.trim() && !currentRddId) {
      handleCreateRDD();
    }
  }, [selectedRiskId, background, mode]);

  const handleAddOption = () => {
    setEditingOption(null);
    setApproach("Accept");
    setDescription("");
    setBusinessImpactType("");
    setBusinessImpactLevel("");
    setBusinessImpacts("");
    setResidualLikelihood("");
    setResidualImpact("");
    setSecondaryRiskStatement("");
    setResourceImpactsHuman("");
    setResourceImpactsMaterial("");
    setResourceImpactsFinancial("");
    setResourceImpactsTime("");
    setAdditionalBenefits("");
    setShowOptionDialog(true);
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option);
    setApproach(option.approach);
    setDescription(option.description || "");
    setBusinessImpactType("");
    setBusinessImpactLevel("");
    setBusinessImpacts(option.business_impacts || "");
    setResidualLikelihood(option.residual_likelihood || "");
    setResidualImpact(option.residual_impact || "");
    setSecondaryRiskStatement(option.secondary_risk_statement || "");
    
    // Parse resource impacts from stored format
    const resourceImpacts = option.resource_impacts || "";
    const humanMatch = resourceImpacts.match(/Human: (.*?)(?=Material & Equipment:|Financial:|Time:|$)/s);
    const materialMatch = resourceImpacts.match(/Material & Equipment: (.*?)(?=Financial:|Time:|$)/s);
    const financialMatch = resourceImpacts.match(/Financial: (.*?)(?=Time:|$)/s);
    const timeMatch = resourceImpacts.match(/Time: (.*?)$/s);
    
    setResourceImpactsHuman(humanMatch ? humanMatch[1].trim() : "");
    setResourceImpactsMaterial(materialMatch ? materialMatch[1].trim() : "");
    setResourceImpactsFinancial(financialMatch ? financialMatch[1].trim() : "");
    setResourceImpactsTime(timeMatch ? timeMatch[1].trim() : "");
    
    setAdditionalBenefits(option.additional_benefits || "");
    setShowOptionDialog(true);
  };

  const handleSaveOption = async () => {
    if (!currentRddId) return;
    
    // Combine resource impacts into formatted string
    const resourceImpactsFormatted = [
      resourceImpactsHuman && `Human: ${resourceImpactsHuman}`,
      resourceImpactsMaterial && `Material & Equipment: ${resourceImpactsMaterial}`,
      resourceImpactsFinancial && `Financial: ${resourceImpactsFinancial}`,
      resourceImpactsTime && `Time: ${resourceImpactsTime}`
    ].filter(Boolean).join("\n");

    const optionData = {
      approach,
      description,
      business_impacts: businessImpacts,
      residual_likelihood: residualLikelihood,
      residual_impact: residualImpact,
      secondary_risk_statement: secondaryRiskStatement,
      resource_impacts: resourceImpactsFormatted,
      additional_benefits: additionalBenefits,
    };

    if (editingOption) {
      await updateOption(editingOption.id, optionData);
    } else {
      await createOption(currentRddId, optionData);
    }
    
    setShowOptionDialog(false);
  };

  const currentRDD = rdds.find(rdd => rdd.id === currentRddId);
  const currentRisk = currentRDD ? risks.find(r => r.id === currentRDD.risk_id) : null;

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    const sections: DocumentSection[] = [
      {
        heading: "Risk Decision Documents",
        content: "This document contains all risk decision documents for the project.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    rdds.forEach((rdd, idx) => {
      const risk = risks.find(r => r.id === rdd.risk_id);
      if (!risk) return;

      sections.push({
        heading: `RDD ${idx + 1}: ${risk.impact_type || "Unknown"} Risk`,
        content: `Background: ${rdd.background || "N/A"}\n\nRisk Statement: ${risk.risk_statement}`,
        level: HeadingLevel.HEADING_2,
      });

      if (rdd.options && rdd.options.length > 0) {
        rdd.options.forEach((opt, optIdx) => {
          sections.push({
            heading: `Option ${optIdx + 1}: ${opt.approach}`,
            content: [
              `Approach: ${opt.approach}`,
              `Description: ${opt.description || "N/A"}`,
              `Business Impacts: ${opt.business_impacts || "N/A"}`,
              `Residual Risk: ${opt.residual_likelihood || "N/A"} / ${opt.residual_impact || "N/A"}`,
              `Resource Impacts: ${opt.resource_impacts || "N/A"}`,
              `Additional Benefits: ${opt.additional_benefits || "N/A"}`,
            ].join("\n"),
            level: HeadingLevel.HEADING_3,
          });
        });
      }
    });

    return sections;
  };

  if (rddsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (mode === "create") {
    const selectedRisk = risks.find(r => r.id === selectedRiskId);
    const selectedRiskAppetite = selectedRisk?.impact_type 
      ? riskAppetites[selectedRisk.impact_type as keyof typeof riskAppetites]
      : null;
    const activeRDD = currentRddId ? rdds.find(rdd => rdd.id === currentRddId) : null;

    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { 
            setMode("list"); 
            setSelectedRiskId(""); 
            setBackground(""); 
            setCurrentRddId(null); 
          }} className="mb-4">
            ← Back to List
          </Button>
          <h2 className="text-2xl font-bold">Create New Risk Decision Document</h2>
          <p className="text-muted-foreground">Select a risk, provide background, and define options</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Selection & Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="risk-select">Select Out of Tolerance Risk</Label>
                <Select value={selectedRiskId} onValueChange={setSelectedRiskId} disabled={!!currentRddId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a risk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {outOfToleranceRisks.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.impact_type}: {risk.risk_statement.substring(0, 80)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Background</Label>
                <Textarea
                  id="background"
                  value={currentRddId && activeRDD ? activeRDD.background || "" : background}
                  onChange={(e) => {
                    if (currentRddId && activeRDD) {
                      updateRDD(currentRddId, { background: e.target.value });
                    } else {
                      setBackground(e.target.value);
                    }
                  }}
                  placeholder="Provide background information for this risk decision..."
                  rows={4}
                />
              </div>

              {selectedRisk && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Risk Statement</Label>
                      <p className="text-sm mt-1">{selectedRisk.risk_statement}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-semibold">Risk Appetite ({selectedRisk.impact_type})</Label>
                      <div className="mt-1">
                        <Badge className="text-sm">
                          {selectedRiskAppetite || "Not Set"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {currentRddId && activeRDD && selectedRisk && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Options</CardTitle>
                  <Button onClick={handleAddOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!activeRDD.options || activeRDD.options.length === 0 ? (
                  <p className="text-muted-foreground">No options created yet. Click "Add Option" to get started.</p>
                ) : (
                  <div className="space-y-4">
                    {activeRDD.options.map((option, idx) => (
                      <Card key={option.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Option {idx + 1}: {option.approach}</CardTitle>
                              {activeRDD.preferred_option_id === option.id && (
                                <Badge variant="default" className="mt-2">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Preferred
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditOption(option)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteOption(option.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {activeRDD.preferred_option_id !== option.id && (
                                <Button size="sm" onClick={() => setPreferredOption(activeRDD.id, option.id)}>
                                  Set Preferred
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {option.description && (
                            <div>
                              <Label className="text-sm font-semibold">Description</Label>
                              <p className="text-sm mt-1">{option.description}</p>
                            </div>
                          )}
                          
                          {(option.residual_likelihood || option.residual_impact) && (
                            <div className="p-3 bg-muted rounded-md space-y-2">
                              <Label className="text-sm font-semibold">Residual Risk</Label>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="font-medium">Original:</span> {selectedRisk.modified_likelihood || selectedRisk.base_likelihood} / {selectedRisk.modified_impact || selectedRisk.base_impact}
                                </div>
                                <div>
                                  <span className="font-medium">Adjusted:</span> {option.residual_likelihood || "Not changed"} / {option.residual_impact || "Not changed"}
                                </div>
                                {option.residual_likelihood && option.residual_impact && (
                                  <div>
                                    <span className="font-medium">New Rating:</span>{" "}
                                    <Badge className="ml-1">
                                      {calculateRiskRating(option.residual_likelihood, option.residual_impact)}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {option.business_impacts && (
                            <div>
                              <Label className="text-sm font-semibold">Business Impacts</Label>
                              <p className="text-sm mt-1">{option.business_impacts}</p>
                            </div>
                          )}

                          {option.secondary_risk_statement && (
                            <div>
                              <Label className="text-sm font-semibold">Secondary Risk</Label>
                              <p className="text-sm mt-1">{option.secondary_risk_statement}</p>
                            </div>
                          )}

                          {option.resource_impacts && (
                            <div>
                              <Label className="text-sm font-semibold">Resource Impacts</Label>
                              <p className="text-sm mt-1">{option.resource_impacts}</p>
                            </div>
                          )}

                          {option.additional_benefits && (
                            <div>
                              <Label className="text-sm font-semibold">Additional Benefits</Label>
                              <p className="text-sm mt-1">{option.additional_benefits}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={showOptionDialog} onOpenChange={setShowOptionDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-visible">
            <DialogHeader>
              <DialogTitle>{editingOption ? "Edit Option" : "Add Option"}</DialogTitle>
              <DialogDescription>Define the approach and details for this option</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={approach} onValueChange={(v: any) => setApproach(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      <SelectItem value="Accept">Accept</SelectItem>
                      <SelectItem value="Avoid">Avoid</SelectItem>
                      <SelectItem value="Mitigate">Mitigate</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe this option in detail..."
                    rows={4} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Residual Risk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRisk && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                      <Label className="text-sm font-semibold">Original Risk</Label>
                      <div className="text-sm">
                        <span className="font-medium">Likelihood:</span> {selectedRisk.modified_likelihood || selectedRisk.base_likelihood || "Not set"}
                        {" | "}
                        <span className="font-medium">Impact:</span> {selectedRisk.modified_impact || selectedRisk.base_impact || "Not set"}
                      </div>
                      {(selectedRisk.modified_likelihood || selectedRisk.base_likelihood) && 
                       (selectedRisk.modified_impact || selectedRisk.base_impact) && (
                        <div className="text-sm">
                          <span className="font-medium">Rating:</span>{" "}
                          <Badge>
                            {calculateRiskRating(
                              selectedRisk.modified_likelihood || selectedRisk.base_likelihood,
                              selectedRisk.modified_impact || selectedRisk.base_impact
                            )}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Adjusted Likelihood</Label>
                      <div className="flex gap-2">
                        <Select value={residualLikelihood} onValueChange={setResidualLikelihood}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {likelihoods.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowLikelihoodCalculator(true)}
                          title="Open Likelihood Calculator"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Adjusted Impact</Label>
                      <Select value={residualImpact} onValueChange={setResidualImpact}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="z-[100] bg-popover">
                          {impacts.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {residualLikelihood && residualImpact && selectedRisk && (
                    <div className="p-3 bg-primary/10 rounded-md space-y-2">
                      <Label className="text-sm font-semibold">Changes</Label>
                      <div className="text-sm space-y-1">
                        {(selectedRisk.modified_likelihood || selectedRisk.base_likelihood) !== residualLikelihood && (
                          <div>
                            <span className="font-medium">Likelihood:</span> {selectedRisk.modified_likelihood || selectedRisk.base_likelihood} → {residualLikelihood}
                          </div>
                        )}
                        {(selectedRisk.modified_impact || selectedRisk.base_impact) !== residualImpact && (
                          <div>
                            <span className="font-medium">Impact:</span> {selectedRisk.modified_impact || selectedRisk.base_impact} → {residualImpact}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">New Rating:</span>{" "}
                          <Badge>
                            {calculateRiskRating(residualLikelihood, residualImpact)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Impacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={businessImpacts} 
                    onChange={(e) => setBusinessImpacts(e.target.value)} 
                    placeholder="Describe the business impacts of this option..."
                    rows={3} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Secondary Risk</CardTitle>
                  <CardDescription>
                    Define any secondary risks that may arise from implementing this option
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecondaryRiskBuilder
                    value={secondaryRiskStatement}
                    onChange={setSecondaryRiskStatement}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resource Impacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Human:</Label>
                    <Textarea 
                      value={resourceImpactsHuman} 
                      onChange={(e) => setResourceImpactsHuman(e.target.value)} 
                      placeholder="Describe human resource impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Material & Equipment:</Label>
                    <Textarea 
                      value={resourceImpactsMaterial} 
                      onChange={(e) => setResourceImpactsMaterial(e.target.value)} 
                      placeholder="Describe material and equipment impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Financial:</Label>
                    <Textarea 
                      value={resourceImpactsFinancial} 
                      onChange={(e) => setResourceImpactsFinancial(e.target.value)} 
                      placeholder="Describe financial impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Time:</Label>
                    <Textarea 
                      value={resourceImpactsTime} 
                      onChange={(e) => setResourceImpactsTime(e.target.value)} 
                      placeholder="Describe time impacts..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={additionalBenefits} 
                    onChange={(e) => setAdditionalBenefits(e.target.value)} 
                    placeholder="List any additional benefits of this option..."
                    rows={3} 
                  />
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowOptionDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveOption}>Save Option</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (mode === "edit") {
    if (!currentRDD || !currentRisk) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading RDD details...</p>
        </div>
      );
    }
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setMode("list"); setCurrentRddId(null); }} className="mb-4">
            ← Back to List
          </Button>
          <h2 className="text-2xl font-bold">Edit Risk Decision Document</h2>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Background</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentRDD.background || ""}
                onChange={(e) => updateRDD(currentRDD.id, { background: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Risk Statement</Label>
                <p className="text-sm">{currentRisk.risk_statement}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Risk Appetite ({currentRisk.impact_type})</Label>
                <Badge className="ml-2">
                  {riskAppetites[currentRisk.impact_type as keyof typeof riskAppetites] || "Not Set"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Options</CardTitle>
                <Button onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!currentRDD.options || currentRDD.options.length === 0 ? (
                <p className="text-muted-foreground">No options created yet</p>
              ) : (
                <div className="space-y-4">
                  {currentRDD.options.map((option, idx) => (
                    <Card key={option.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Option {idx + 1}: {option.approach}</CardTitle>
                            {currentRDD.preferred_option_id === option.id && (
                              <Badge variant="default" className="mt-2">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Preferred
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditOption(option)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteOption(option.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {currentRDD.preferred_option_id !== option.id && (
                              <Button size="sm" onClick={() => setPreferredOption(currentRDD.id, option.id)}>
                                Set Preferred
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {option.description && (
                          <div>
                            <Label className="text-sm font-semibold">Description</Label>
                            <p className="text-sm mt-1">{option.description}</p>
                          </div>
                        )}
                        
                        {(option.residual_likelihood || option.residual_impact) && (
                          <div className="p-3 bg-muted rounded-md space-y-2">
                            <Label className="text-sm font-semibold">Residual Risk</Label>
                            <div className="text-sm space-y-1">
                              {currentRisk && (
                                <>
                                  <div>
                                    <span className="font-medium">Original:</span> {currentRisk.modified_likelihood || currentRisk.base_likelihood} / {currentRisk.modified_impact || currentRisk.base_impact}
                                  </div>
                                  <div>
                                    <span className="font-medium">Adjusted:</span> {option.residual_likelihood || "Not changed"} / {option.residual_impact || "Not changed"}
                                  </div>
                                  {option.residual_likelihood && option.residual_impact && (
                                    <div>
                                      <span className="font-medium">New Rating:</span>{" "}
                                      <Badge className="ml-1">
                                        {calculateRiskRating(option.residual_likelihood, option.residual_impact)}
                                      </Badge>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {option.business_impacts && (
                          <div>
                            <Label className="text-sm font-semibold">Business Impacts</Label>
                            <p className="text-sm mt-1">{option.business_impacts}</p>
                          </div>
                        )}

                        {option.secondary_risk_statement && (
                          <div>
                            <Label className="text-sm font-semibold">Secondary Risk</Label>
                            <p className="text-sm mt-1">{option.secondary_risk_statement}</p>
                          </div>
                        )}

                        {option.resource_impacts && (
                          <div>
                            <Label className="text-sm font-semibold">Resource Impacts</Label>
                            <p className="text-sm mt-1">{option.resource_impacts}</p>
                          </div>
                        )}

                        {option.additional_benefits && (
                          <div>
                            <Label className="text-sm font-semibold">Additional Benefits</Label>
                            <p className="text-sm mt-1">{option.additional_benefits}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showOptionDialog} onOpenChange={setShowOptionDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-visible">
            <DialogHeader>
              <DialogTitle>{editingOption ? "Edit Option" : "Add Option"}</DialogTitle>
              <DialogDescription>Define the approach and details for this option</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={approach} onValueChange={(v: any) => setApproach(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      <SelectItem value="Accept">Accept</SelectItem>
                      <SelectItem value="Avoid">Avoid</SelectItem>
                      <SelectItem value="Mitigate">Mitigate</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe this option in detail..."
                    rows={4} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Residual Risk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentRisk && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                      <Label className="text-sm font-semibold">Original Risk</Label>
                      <div className="text-sm">
                        <span className="font-medium">Likelihood:</span> {currentRisk.modified_likelihood || currentRisk.base_likelihood || "Not set"}
                        {" | "}
                        <span className="font-medium">Impact:</span> {currentRisk.modified_impact || currentRisk.base_impact || "Not set"}
                      </div>
                      {(currentRisk.modified_likelihood || currentRisk.base_likelihood) && 
                       (currentRisk.modified_impact || currentRisk.base_impact) && (
                        <div className="text-sm">
                          <span className="font-medium">Rating:</span>{" "}
                          <Badge>
                            {calculateRiskRating(
                              currentRisk.modified_likelihood || currentRisk.base_likelihood,
                              currentRisk.modified_impact || currentRisk.base_impact
                            )}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Adjusted Likelihood</Label>
                      <div className="flex gap-2">
                        <Select value={residualLikelihood} onValueChange={setResidualLikelihood}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-popover">
                            {likelihoods.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowLikelihoodCalculator(true)}
                          title="Open Likelihood Calculator"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Adjusted Impact</Label>
                      <Select value={residualImpact} onValueChange={setResidualImpact}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="z-[100] bg-popover">
                          {impacts.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {residualLikelihood && residualImpact && currentRisk && (
                    <div className="p-3 bg-primary/10 rounded-md space-y-2">
                      <Label className="text-sm font-semibold">Changes</Label>
                      <div className="text-sm space-y-1">
                        {(currentRisk.modified_likelihood || currentRisk.base_likelihood) !== residualLikelihood && (
                          <div>
                            <span className="font-medium">Likelihood:</span> {currentRisk.modified_likelihood || currentRisk.base_likelihood} → {residualLikelihood}
                          </div>
                        )}
                        {(currentRisk.modified_impact || currentRisk.base_impact) !== residualImpact && (
                          <div>
                            <span className="font-medium">Impact:</span> {currentRisk.modified_impact || currentRisk.base_impact} → {residualImpact}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">New Rating:</span>{" "}
                          <Badge>
                            {calculateRiskRating(residualLikelihood, residualImpact)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Impacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Impact Type</Label>
                    <Select value={businessImpactType} onValueChange={setBusinessImpactType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select impact type..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        {impactTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Impact Level</Label>
                    <Select value={businessImpactLevel} onValueChange={setBusinessImpactLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select impact level..." />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        {impactLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {businessImpacts && (
                    <div className="space-y-2">
                      <Label>Selected Impact</Label>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {businessImpacts}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Secondary Risk</CardTitle>
                  <CardDescription>
                    Define any secondary risks that may arise from implementing this option
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecondaryRiskBuilder
                    value={secondaryRiskStatement}
                    onChange={setSecondaryRiskStatement}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resource Impacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Human:</Label>
                    <Textarea 
                      value={resourceImpactsHuman} 
                      onChange={(e) => setResourceImpactsHuman(e.target.value)} 
                      placeholder="Describe human resource impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Material & Equipment:</Label>
                    <Textarea 
                      value={resourceImpactsMaterial} 
                      onChange={(e) => setResourceImpactsMaterial(e.target.value)} 
                      placeholder="Describe material and equipment impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Financial:</Label>
                    <Textarea 
                      value={resourceImpactsFinancial} 
                      onChange={(e) => setResourceImpactsFinancial(e.target.value)} 
                      placeholder="Describe financial impacts..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Time:</Label>
                    <Textarea 
                      value={resourceImpactsTime} 
                      onChange={(e) => setResourceImpactsTime(e.target.value)} 
                      placeholder="Describe time impacts..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={additionalBenefits} 
                    onChange={(e) => setAdditionalBenefits(e.target.value)} 
                    placeholder="List any additional benefits of this option..."
                    rows={3} 
                  />
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowOptionDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveOption}>Save Option</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Risk Decisions</h2>
        <p className="text-muted-foreground">
          Manage risk decision documents for out-of-tolerance risks requiring cyber risk owner approval
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setMode("create")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New RDD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start a new risk decision document for an out-of-tolerance risk
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:border-primary transition-colors ${rdds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={() => rdds.length > 0 && setMode("select-edit")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Existing RDD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {rdds.length === 0 ? "No RDDs available to edit" : "Modify an existing risk decision document"}
            </p>
          </CardContent>
        </Card>

        {projectId && project && (
          <Card className={`border-dashed ${rdds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Artefact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rdds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No RDDs available to generate</p>
              ) : (
                <GenerateArtefactButton
                  projectId={projectId}
                  projectName={project.title}
                  artefactType="risk-decisions"
                  artefactName="Risk Decisions"
                  generateContent={generateContent}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {mode === "select-edit" && rdds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Select RDD to Edit</CardTitle>
              <Button variant="ghost" onClick={() => setMode("list")}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Background</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Preferred</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rdds.map((rdd) => {
                    const risk = risks.find(r => r.id === rdd.risk_id);
                    return (
                      <TableRow key={rdd.id}>
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            <Badge>{risk?.impact_type || "Unknown"}</Badge>
                            <p className="text-sm">{risk?.risk_statement.substring(0, 100)}...</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm">{rdd.background?.substring(0, 100)}...</p>
                        </TableCell>
                        <TableCell>{rdd.options?.length || 0}</TableCell>
                        <TableCell>
                          {rdd.preferred_option_id ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => { setCurrentRddId(rdd.id); setMode("edit"); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteRDD(rdd.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <LikelihoodCalculatorDialog
        open={showLikelihoodCalculator}
        onOpenChange={setShowLikelihoodCalculator}
        onSave={(likelihood) => setResidualLikelihood(likelihood)}
      />
    </div>
  );
}
