import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { toast } from "sonner";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useIssues } from "@/hooks/useIssues";
import { useRiskControls } from "@/hooks/useRiskControls";
import { useRiskIssues } from "@/hooks/useRiskIssues";
import { useThreatControls } from "@/hooks/useThreatControls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, AlertCircle, Calculator } from "lucide-react";
import { LikelihoodCalculatorDialog } from "@/components/LikelihoodCalculatorDialog";

export default function RiskTuner() {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { risks: savedRisks, updateRisk, updateModifiedRisk, isLoading } = useSavedRisks(projectId || null);
  const { controls, isLoading: controlsLoading } = useSecurityControls(projectId);
  const { issues, isLoading: issuesLoading } = useIssues(projectId || "");
  
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedLikelihood, setSelectedLikelihood] = useState<string>("");
  const [selectedImpact, setSelectedImpact] = useState<string>("");
  const [likelihoodJustification, setLikelihoodJustification] = useState<string>("");
  const [impactJustification, setImpactJustification] = useState<string>("");
  const [pendingControlIds, setPendingControlIds] = useState<Set<string>>(new Set());
  const [pendingIssueIds, setPendingIssueIds] = useState<Set<string>>(new Set());
  const [showLikelihoodCalculator, setShowLikelihoodCalculator] = useState(false);
  const [refactoredStatement, setRefactoredStatement] = useState<string>("");
  
  const selectedRisk = savedRisks.find(r => r.id === selectedRiskId);
  
  const { controlIds, toggleControl } = useRiskControls(selectedRiskId);
  const { issueIds, toggleIssue } = useRiskIssues(selectedRiskId);
  const { controlIds: threatControlIds } = useThreatControls(selectedRisk?.threat_id || null);
  
  const likelihoods = ["Remote", "Unlikely", "Possible", "Likely", "Very Likely"];
  const impacts = ["Minor", "Moderate", "Major", "Significant", "Critical"];
  
  useEffect(() => {
    if (selectedRisk) {
      // Use modified values if available, otherwise use base values
      setSelectedLikelihood(selectedRisk.modified_likelihood || selectedRisk.base_likelihood || "");
      setSelectedImpact(selectedRisk.modified_impact || selectedRisk.base_impact || "");
      setLikelihoodJustification(selectedRisk.likelihood_justification || "");
      setImpactJustification(selectedRisk.impact_justification || "");
      // Initialize pending selections with current links
      setPendingControlIds(new Set(controlIds));
      setPendingIssueIds(new Set(issueIds));
    }
  }, [selectedRisk, controlIds, issueIds]);
  
  // Generate refactored statement when controls/issues or risk changes
  useEffect(() => {
    if (selectedRisk) {
      let statement = "";
      
      if (pendingControlIds.size > 0 || pendingIssueIds.size > 0) {
        statement = "Due to ";
        
        if (pendingControlIds.size > 0) {
          const controlNames = Array.from(pendingControlIds)
            .map(id => controls.find(c => c.id === id)?.name)
            .filter(Boolean)
            .join(", ");
          statement += `${pendingControlIds.size} control${pendingControlIds.size > 1 ? "s" : ""} (${controlNames})`;
        }
        
        if (pendingControlIds.size > 0 && pendingIssueIds.size > 0) {
          statement += " & ";
        }
        
        if (pendingIssueIds.size > 0) {
          const issueNames = Array.from(pendingIssueIds)
            .map(id => issues.find(i => i.id === id)?.name)
            .filter(Boolean)
            .join(", ");
          statement += `${pendingIssueIds.size} issue${pendingIssueIds.size > 1 ? "s" : ""} (${issueNames})`;
        }
        
        statement += ", ";
      }
      
      statement += selectedRisk.risk_statement;
      setRefactoredStatement(statement);
    }
  }, [selectedRisk, pendingControlIds, pendingIssueIds, controls, issues]);
  
  const parseRiskStatement = (statement: string): { likelihood: string; impact: string } | null => {
    const likelihoodMatch = statement.match(/\(Likelihood:\s*([^,]+),/);
    const impactMatch = statement.match(/Impact:\s*([^)]+)\)/);
    
    if (likelihoodMatch && impactMatch) {
      return {
        likelihood: likelihoodMatch[1].trim(),
        impact: impactMatch[1].trim()
      };
    }
    return null;
  };
  
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
  
  const handleUpdateRisk = async () => {
    if (!selectedRisk || !selectedLikelihood || !selectedImpact || !selectedRiskId) return;
    
    // Check if values changed from base
    const likelihoodChanged = selectedLikelihood !== selectedRisk.base_likelihood;
    const impactChanged = selectedImpact !== selectedRisk.base_impact;
    
    // Only require justifications if values changed
    if (likelihoodChanged && !likelihoodJustification.trim()) {
      toast.error("Likelihood justification is required when changing the likelihood value");
      return;
    }
    
    if (impactChanged && !impactJustification.trim()) {
      toast.error("Impact justification is required when changing the impact value");
      return;
    }
    
    // Apply control and issue changes
    const controlsToAdd = Array.from(pendingControlIds).filter(id => !controlIds.has(id));
    const controlsToRemove = Array.from(controlIds).filter(id => !pendingControlIds.has(id));
    const issuesToAdd = Array.from(pendingIssueIds).filter(id => !issueIds.has(id));
    const issuesToRemove = Array.from(issueIds).filter(id => !pendingIssueIds.has(id));
    
    // Toggle controls
    for (const controlId of controlsToAdd) {
      await toggleControl(controlId);
    }
    for (const controlId of controlsToRemove) {
      await toggleControl(controlId);
    }
    
    // Toggle issues
    for (const issueId of issuesToAdd) {
      await toggleIssue(issueId);
    }
    for (const issueId of issuesToRemove) {
      await toggleIssue(issueId);
    }
    
    await updateModifiedRisk(
      selectedRiskId, 
      selectedLikelihood, 
      selectedImpact,
      likelihoodJustification,
      impactJustification
    );
  };
  
  const suggestedControls = controls.filter(c => 
    selectedRisk?.threat_id && threatControlIds.has(c.id)
  );
  
  const suggestedIssues = issues.filter(issue => {
    if (!selectedRisk?.threat_id || !issue.linked_asset_id) return false;
    // For now, suggest all issues with assets
    // In future, could check if asset is linked to threat
    return true;
  });

  if (isLoading || controlsLoading || issuesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Risk Tuner</h2>
        <p className="text-muted-foreground">
          Create modified risk assessments by attaching mitigating controls and issues. Base risk remains unchanged.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Risk</CardTitle>
          <CardDescription>Choose a risk from the risk register to tune</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRiskId || ""} onValueChange={setSelectedRiskId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a risk..." />
            </SelectTrigger>
            <SelectContent>
              {savedRisks.map((risk) => (
                <SelectItem key={risk.id} value={risk.id}>
                  {risk.risk_statement}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedRisk && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Base Risk Assessment</CardTitle>
                <CardDescription>Original risk assessment from Risk Builder (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Base Likelihood</Label>
                  <p className="font-medium">{selectedRisk.base_likelihood || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Base Impact</Label>
                  <p className="font-medium">{selectedRisk.base_impact || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Base Risk Rating</Label>
                  <Badge className="mt-1" variant={
                    calculateRiskRating(selectedRisk.base_likelihood || "", selectedRisk.base_impact || "") === "Very High Risk" ? "destructive" :
                    calculateRiskRating(selectedRisk.base_likelihood || "", selectedRisk.base_impact || "") === "High Risk" ? "destructive" :
                    "default"
                  }>
                    {calculateRiskRating(selectedRisk.base_likelihood || "", selectedRisk.base_impact || "")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mitigations Summary</CardTitle>
                <CardDescription>Controls and issues linked to this risk</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Linked Controls</Label>
                  <p className="text-2xl font-bold text-primary">{pendingControlIds.size}</p>
                </div>
                <div>
                  <Label>Linked Issues</Label>
                  <p className="text-2xl font-bold text-primary">{pendingIssueIds.size}</p>
                </div>
                {selectedRisk.threat_id && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>This is a threat-based risk</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Link Controls</CardTitle>
                <CardDescription>Link security controls to mitigate this risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {controls.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No controls available</p>
                  ) : (
                    controls.map((control) => {
                      const isSuggested = selectedRisk?.threat_id && threatControlIds.has(control.id);
                      return (
                        <div 
                          key={control.id} 
                          className={`flex items-center gap-2 p-2 border rounded ${
                            isSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-700' : ''
                          }`}
                        >
                          <Checkbox
                            checked={pendingControlIds.has(control.id)}
                            onCheckedChange={() => {
                              setPendingControlIds(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(control.id)) {
                                  newSet.delete(control.id);
                                } else {
                                  newSet.add(control.id);
                                }
                                return newSet;
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{control.name}</p>
                              {isSuggested && (
                                <Badge variant="outline" className="flex items-center gap-1 text-yellow-700 border-yellow-400 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-950/30">
                                  <Lightbulb className="h-3 w-3" />
                                  Suggested
                                </Badge>
                              )}
                            </div>
                            {control.description && (
                              <p className="text-sm text-muted-foreground">{control.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Issues</CardTitle>
                <CardDescription>Link issues that impact this risk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {issues.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No issues available</p>
                  ) : (
                    issues.map((issue) => {
                      const isSuggested = selectedRisk?.threat_id && issue.linked_asset_id;
                      return (
                        <div 
                          key={issue.id} 
                          className={`flex items-center gap-2 p-2 border rounded ${
                            isSuggested ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/20 dark:border-yellow-700' : ''
                          }`}
                        >
                          <Checkbox
                            checked={pendingIssueIds.has(issue.id)}
                            onCheckedChange={() => {
                              setPendingIssueIds(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(issue.id)) {
                                  newSet.delete(issue.id);
                                } else {
                                  newSet.add(issue.id);
                                }
                                return newSet;
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{issue.name}</p>
                              {isSuggested && (
                                <Badge variant="outline" className="flex items-center gap-1 text-yellow-700 border-yellow-400 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-950/30">
                                  <Lightbulb className="h-3 w-3" />
                                  Suggested
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Residual Risk Assessment</CardTitle>
              <CardDescription>Adjust likelihood and impact to create modified risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Likelihood</Label>
                  <div className="flex gap-2">
                    <Select value={selectedLikelihood} onValueChange={setSelectedLikelihood}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {likelihoods.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
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
                
                <div>
                  <Label>Impact</Label>
                  <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {impacts.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Modified Risk Rating</Label>
                  <div className="mt-2">
                    <Badge variant={
                      calculateRiskRating(selectedLikelihood, selectedImpact) === "Very High Risk" ? "destructive" :
                      calculateRiskRating(selectedLikelihood, selectedImpact) === "High Risk" ? "destructive" :
                      calculateRiskRating(selectedLikelihood, selectedImpact) === "Medium Risk" ? "default" :
                      "secondary"
                    }>
                      {calculateRiskRating(selectedLikelihood, selectedImpact)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="likelihood-justification">
                    Likelihood Justification 
                    {selectedLikelihood !== selectedRisk.base_likelihood && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  <Textarea
                    id="likelihood-justification"
                    placeholder={selectedLikelihood !== selectedRisk.base_likelihood 
                      ? "Explain why the likelihood has been adjusted..." 
                      : "No justification needed if likelihood unchanged"}
                    value={likelihoodJustification}
                    onChange={(e) => setLikelihoodJustification(e.target.value)}
                    className="mt-2"
                    rows={4}
                    disabled={selectedLikelihood === selectedRisk.base_likelihood}
                  />
                </div>
                
                <div>
                  <Label htmlFor="impact-justification">
                    Impact Justification 
                    {selectedImpact !== selectedRisk.base_impact && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  <Textarea
                    id="impact-justification"
                    placeholder={selectedImpact !== selectedRisk.base_impact 
                      ? "Explain why the impact has been adjusted..." 
                      : "No justification needed if impact unchanged"}
                    value={impactJustification}
                    onChange={(e) => setImpactJustification(e.target.value)}
                    className="mt-2"
                    rows={4}
                    disabled={selectedImpact === selectedRisk.base_impact}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label>Refactored Risk Statement (Editable)</Label>
                <Textarea
                  value={refactoredStatement}
                  onChange={(e) => setRefactoredStatement(e.target.value)}
                  placeholder="Refactored risk statement will appear here..."
                  rows={6}
                  className="font-mono text-sm"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {refactoredStatement.length}/2000 characters
                </p>
              </div>
              
              <Button onClick={handleUpdateRisk} className="w-full">
                Update Modified Risk Assessment
              </Button>
            </CardContent>
          </Card>
        </>
      )}
      
      <LikelihoodCalculatorDialog
        open={showLikelihoodCalculator}
        onOpenChange={setShowLikelihoodCalculator}
        onSave={(likelihood) => setSelectedLikelihood(likelihood)}
      />
    </div>
  );
}
