import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { useRiskAppetite } from "@/hooks/useRiskAppetite";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useIssues } from "@/hooks/useIssues";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Shield, AlertTriangle, FileText } from "lucide-react";

const RISK_LEVELS = ["Minor", "Moderate", "Major", "Significant", "Critical"];
const APPETITE_LEVEL_VALUES: Record<string, number> = {
  "Averse": 1,
  "Minimal": 2,
  "Cautious": 3,
  "Open": 4,
  "Eager": 5,
};

const getRiskLevelValue = (level: string | null): number => {
  if (!level) return 0;
  const index = RISK_LEVELS.indexOf(level);
  return index >= 0 ? index + 1 : 0;
};

const calculateRiskRating = (likelihood: string | null, impact: string | null): string => {
  if (!likelihood || !impact) return "Unknown";
  const likelihoodValue = getRiskLevelValue(likelihood);
  const impactValue = getRiskLevelValue(impact);
  const score = likelihoodValue * impactValue;
  
  if (score <= 4) return "Minor";
  if (score <= 9) return "Moderate";
  if (score <= 15) return "Major";
  if (score <= 20) return "Significant";
  return "Critical";
};

export default function RiskProfileAcceptance() {
  const { projectId } = useParams<{ projectId: string }>();
  const { risks, isLoading: risksLoading } = useSavedRisks(projectId || null);
  const { riskAppetites, isLoading: appetiteLoading } = useRiskAppetite(projectId || null);
  const { controls } = useSecurityControls(projectId || "");
  const { issues } = useIssues(projectId || "");

  // Fetch all risk_controls for this project's risks
  const { data: riskControls = [] } = useQuery({
    queryKey: ["all-risk-controls", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("risk_controls")
        .select("risk_id, control_id");
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch all risk_issues for this project's risks
  const { data: riskIssues = [] } = useQuery({
    queryKey: ["all-risk-issues", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("risk_issues")
        .select("risk_id, issue_id");
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: projectTitle } = useQuery({
    queryKey: ["project-title", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();
      return data?.title;
    },
    enabled: !!projectId,
  });

  const isLoading = risksLoading || appetiteLoading;

  // Get risk appetite for impact type comparison
  const getAppetiteForImpactType = (impactType: string | null): number => {
    if (!impactType || !riskAppetites) return 3; // Default to Cautious
    const appetite = riskAppetites[impactType as keyof typeof riskAppetites];
    if (!appetite) return 3;
    return APPETITE_LEVEL_VALUES[appetite] || 3;
  };

  // Determine if a risk is within tolerance
  const isRiskInTolerance = (risk: typeof risks[0]): boolean => {
    const likelihood = risk.modified_likelihood || risk.base_likelihood;
    const impact = risk.modified_impact || risk.base_impact;
    const rating = calculateRiskRating(likelihood, impact);
    const ratingValue = getRiskLevelValue(rating);
    const appetiteValue = getAppetiteForImpactType(risk.impact_type);
    return ratingValue <= appetiteValue;
  };

  // Split risks into in/out of tolerance
  const inToleranceRisks = risks.filter(isRiskInTolerance);
  const outOfToleranceRisks = risks.filter(r => !isRiskInTolerance(r));

  // Get controls for a risk
  const getControlsForRisk = (riskId: string) => {
    const linkedControlIds = riskControls
      .filter(rc => rc.risk_id === riskId)
      .map(rc => rc.control_id);
    return controls.filter(c => linkedControlIds.includes(c.id));
  };

  // Get issues for a risk
  const getIssuesForRisk = (riskId: string) => {
    const linkedIssueIds = riskIssues
      .filter(ri => ri.risk_id === riskId)
      .map(ri => ri.issue_id);
    return issues.filter(i => linkedIssueIds.includes(i.id));
  };

  const RiskCard = ({ risk, inTolerance }: { risk: typeof risks[0]; inTolerance: boolean }) => {
    const linkedControls = getControlsForRisk(risk.id);
    const linkedIssues = getIssuesForRisk(risk.id);
    const likelihood = risk.modified_likelihood || risk.base_likelihood;
    const impact = risk.modified_impact || risk.base_impact;
    const rating = calculateRiskRating(likelihood, impact);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium leading-relaxed flex-1">
              {risk.risk_statement}
            </CardTitle>
            <Badge variant={inTolerance ? "default" : "destructive"} className="ml-2 shrink-0">
              {rating}
            </Badge>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
            <span>Likelihood: {likelihood || "Not set"}</span>
            <span>•</span>
            <span>Impact: {impact || "Not set"}</span>
            {risk.impact_type && (
              <>
                <span>•</span>
                <span>Type: {risk.impact_type}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contributing Controls */}
          {linkedControls.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                <Shield className="h-3 w-3" />
                Contributing Controls
              </div>
              <div className="flex flex-wrap gap-1">
                {linkedControls.map(control => (
                  <Badge key={control.id} variant="secondary" className="text-xs">
                    {control.name}
                    {control.effectiveness_rating && (
                      <span className="ml-1 opacity-70">({control.effectiveness_rating})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contributing Issues */}
          {linkedIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                <AlertTriangle className="h-3 w-3" />
                Contributing Issues
              </div>
              <div className="flex flex-wrap gap-1">
                {linkedIssues.map(issue => (
                  <Badge key={issue.id} variant="outline" className="text-xs">
                    {issue.name}
                    <span className="ml-1 opacity-70">({issue.type})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Remediation Plan */}
          {risk.remediation_plan && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
                Remediation Plan
              </div>
              <p className="text-xs bg-muted/50 p-2 rounded">{risk.remediation_plan}</p>
            </div>
          )}

          {linkedControls.length === 0 && linkedIssues.length === 0 && !risk.remediation_plan && (
            <p className="text-xs text-muted-foreground italic">No controls, issues, or remediation plan linked.</p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading risk profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risk Profile Acceptance</h1>
        <p className="text-muted-foreground">
          Overview of project risk tolerance and risk status for {projectTitle || "this project"}.
        </p>
      </div>

      {/* Risk Appetite Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Tolerance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {riskAppetites ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(["Human", "Financial", "Reputational", "Delivery", "Compliance"] as const).map(category => (
                <div key={category} className="text-center p-3 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">{category}</p>
                  <p className="font-semibold">{riskAppetites[category] || "Not set"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Risk appetite has not been defined for this project.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Risks In Tolerance */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Risks Within Tolerance ({inToleranceRisks.length})</h2>
        </div>
        {inToleranceRisks.length > 0 ? (
          inToleranceRisks.map(risk => (
            <RiskCard key={risk.id} risk={risk} inTolerance={true} />
          ))
        ) : (
          <p className="text-muted-foreground text-sm italic">No risks currently within tolerance.</p>
        )}
      </div>

      <Separator />

      {/* Risks Out of Tolerance */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold">Risks Out of Tolerance ({outOfToleranceRisks.length})</h2>
        </div>
        {outOfToleranceRisks.length > 0 ? (
          outOfToleranceRisks.map(risk => (
            <RiskCard key={risk.id} risk={risk} inTolerance={false} />
          ))
        ) : (
          <p className="text-muted-foreground text-sm italic">No risks currently out of tolerance.</p>
        )}
      </div>
    </div>
  );
}
