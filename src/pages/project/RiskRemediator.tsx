import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useIssues } from "@/hooks/useIssues";
import { useRiskControls } from "@/hooks/useRiskControls";
import { useRiskIssues } from "@/hooks/useRiskIssues";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function RiskRemediator() {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { risks: savedRisks, updateRemediation, isLoading } = useSavedRisks(projectId || null);
  const { controls, isLoading: controlsLoading } = useSecurityControls(projectId);
  const { issues, isLoading: issuesLoading } = useIssues(projectId || "");
  
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [remediationPlan, setRemediationPlan] = useState<string>("");
  
  const selectedRisk = savedRisks.find(r => r.id === selectedRiskId);
  
  const { controlIds } = useRiskControls(selectedRiskId);
  const { issueIds } = useRiskIssues(selectedRiskId);
  
  const linkedControls = controls.filter(c => controlIds.has(c.id));
  const linkedIssues = issues.filter(i => issueIds.has(i.id));
  
  useEffect(() => {
    if (selectedRisk) {
      setRemediationPlan(selectedRisk.remediation_plan || "");
    }
  }, [selectedRisk]);
  
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
  
  const handleUpdateRemediation = async () => {
    if (!selectedRiskId) return;
    
    if (!remediationPlan.trim()) {
      toast.error("Remediation plan is required");
      return;
    }
    
    await updateRemediation(selectedRiskId, remediationPlan);
  };

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
        <h2 className="text-2xl font-bold mb-2">Risk Remediator</h2>
        <p className="text-muted-foreground">
          Document remediation plans for risks to guide implementation and tracking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Risk to Remediate</CardTitle>
          <CardDescription>Choose a risk from the risk register</CardDescription>
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
                <CardTitle>Risk Information</CardTitle>
                <CardDescription>Current risk assessment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Risk Statement</Label>
                  <p className="text-sm mt-1">{selectedRisk.risk_statement}</p>
                </div>
                
                {selectedRisk.base_likelihood && selectedRisk.base_impact && (
                  <div className="space-y-2 pb-4 border-b">
                    <div>
                      <Label className="text-muted-foreground">Base Likelihood</Label>
                      <p className="font-medium">{selectedRisk.base_likelihood}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Base Impact</Label>
                      <p className="font-medium">{selectedRisk.base_impact}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Base Risk Rating</Label>
                      <Badge className="mt-1" variant={
                        calculateRiskRating(selectedRisk.base_likelihood, selectedRisk.base_impact) === "Very High Risk" ? "destructive" :
                        calculateRiskRating(selectedRisk.base_likelihood, selectedRisk.base_impact) === "High Risk" ? "destructive" :
                        "default"
                      }>
                        {calculateRiskRating(selectedRisk.base_likelihood, selectedRisk.base_impact)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {selectedRisk.modified_likelihood && selectedRisk.modified_impact && (
                  <div className="space-y-2 pb-4 border-b">
                    <div>
                      <Label className="text-muted-foreground">Modified Likelihood</Label>
                      <p className="font-medium">{selectedRisk.modified_likelihood}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Modified Impact</Label>
                      <p className="font-medium">{selectedRisk.modified_impact}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Modified Risk Rating</Label>
                      <Badge className="mt-1" variant={
                        calculateRiskRating(selectedRisk.modified_likelihood, selectedRisk.modified_impact) === "Very High Risk" ? "destructive" :
                        calculateRiskRating(selectedRisk.modified_likelihood, selectedRisk.modified_impact) === "High Risk" ? "destructive" :
                        calculateRiskRating(selectedRisk.modified_likelihood, selectedRisk.modified_impact) === "Medium Risk" ? "default" :
                        "secondary"
                      }>
                        {calculateRiskRating(selectedRisk.modified_likelihood, selectedRisk.modified_impact)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {linkedControls.length > 0 && (
                  <div className="space-y-2 pb-4 border-b">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Linked Controls ({linkedControls.length})
                    </Label>
                    <div className="space-y-2">
                      {linkedControls.map((control) => (
                        <div key={control.id} className="text-sm p-2 bg-muted rounded">
                          <p className="font-medium">{control.name}</p>
                          {control.description && (
                            <p className="text-xs text-muted-foreground mt-1">{control.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {linkedIssues.length > 0 && (
                  <div className="space-y-2 pb-4 border-b">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Linked Issues ({linkedIssues.length})
                    </Label>
                    <div className="space-y-2">
                      {linkedIssues.map((issue) => (
                        <div key={issue.id} className="text-sm p-2 bg-muted rounded">
                          <p className="font-medium">{issue.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRisk.threat_id && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>This is a threat-based risk</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Remediation Status</CardTitle>
                <CardDescription>Existing remediation documentation</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRisk.remediation_plan ? (
                  <div>
                    <Label className="text-muted-foreground">Documented Remediation</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedRisk.remediation_plan}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No remediation plan documented yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Remediation Plan</CardTitle>
              <CardDescription>Describe how this risk will be remediated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="remediation-plan">
                  Remediation Plan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="remediation-plan"
                  placeholder="Describe the steps to remediate this risk, including timelines, responsible parties, resources required, and success criteria..."
                  value={remediationPlan}
                  onChange={(e) => setRemediationPlan(e.target.value)}
                  className="mt-2"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Include details such as specific actions, responsible teams, timelines, and expected outcomes.
                </p>
              </div>
              
              <Button onClick={handleUpdateRemediation} className="w-full">
                Save Remediation Plan
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
