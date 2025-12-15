import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { LikelihoodCalculatorDialog } from "./LikelihoodCalculatorDialog";

interface TableData {
  title: string;
  items: string[];
}

interface Selection {
  [key: string]: number | null;
}

interface RiskBuilderComponentProps {
  tables: TableData[];
  selections: Selection;
  savedThreats: string[];
  impactTypes: string[];
  impactLevels: string[];
  cianaOptions: string[];
  likelihoodLevels: string[];
  customRiskEvent: string;
  systemImpactText: string;
  projectName: string;
  riskType: "Threat Based" | "Compliance Based" | "Other";
  obligations: Array<{ id: string; name: string }>;
  selectedObligationId: string;
  onRiskTypeChange: (type: "Threat Based" | "Compliance Based" | "Other") => void;
  onObligationChange: (id: string) => void;
  onThreatChange: (index: number) => void;
  onImpactTypeChange: (index: number) => void;
  onImpactLevelChange: (index: number) => void;
  onCIANAChange: (index: number) => void;
  onLikelihoodChange: (index: number) => void;
  onCustomRiskEventChange: (event: string) => void;
  onSystemImpactTextChange: (text: string) => void;
  onSaveRisk: (statement: string) => void;
  onClearSelections: () => void;
  canWrite: boolean;
}

export const RiskBuilderComponent = ({ 
  tables, 
  selections,
  savedThreats,
  impactTypes,
  impactLevels,
  cianaOptions,
  likelihoodLevels,
  customRiskEvent,
  systemImpactText,
  projectName,
  riskType,
  obligations,
  selectedObligationId,
  onRiskTypeChange,
  onObligationChange,
  onThreatChange,
  onImpactTypeChange,
  onImpactLevelChange,
  onCIANAChange,
  onLikelihoodChange,
  onCustomRiskEventChange,
  onSystemImpactTextChange,
  onSaveRisk, 
  onClearSelections,
  canWrite 
}: RiskBuilderComponentProps) => {
  const [editableStatement, setEditableStatement] = useState<string>("");
  const [showLikelihoodCalculator, setShowLikelihoodCalculator] = useState(false);
  const { businessImpactMatrix, isLoading: settingsLoading } = useAppSettings();
  
  const generateRiskStatement = () => {
    const likelihoodTable = tables.find(t => t.title === "Likelihood");
    const cianaTable = tables.find(t => t.title === "CIANA");
    const impactLevelTable = tables.find(t => t.title === "Impact Level");
    const impactTypeTable = tables.find(t => t.title === "Impact Type");

    const likelihood = selections["Likelihood"] !== null && likelihoodTable ? likelihoodTable.items[selections["Likelihood"]] : null;
    
    const ciana = selections["CIANA"] !== null && cianaTable ? cianaTable.items[selections["CIANA"]] : null;
    const systemImpact = systemImpactText.trim();
    const impactLevel = selections["Impact Level"] !== null && impactLevelTable ? impactLevelTable.items[selections["Impact Level"]] : null;
    const impactType = selections["Impact Type"] !== null && impactTypeTable ? impactTypeTable.items[selections["Impact Type"]] : null;
    
    // Auto-determine business impact from matrix
    const businessImpact = impactType && impactLevel ? businessImpactMatrix[impactType]?.[impactLevel] : null;

    // Handle different risk types
    if (riskType === "Threat Based") {
      const threat = selections["Threat"] !== null ? savedThreats[selections["Threat"]] : null;
      let cleanThreat = threat;
      
      // Remove the CIANA portion from threat statement
      if (cleanThreat) {
        cleanThreat = cleanThreat.replace(/\s+impacting\s+\w+\s+in order to/, ' in order to');
      }
      
      if (!likelihood || !cleanThreat || !ciana || !projectName || !systemImpact || !impactLevel || !impactType || !businessImpact) {
        return "Complete all fields to generate a risk statement";
      }
      
      return `It is ${likelihood} that ${cleanThreat} impacting the ${ciana} of ${projectName}, resulting in a system impact ${systemImpact}, and a ${impactLevel} ${impactType} impact of ${businessImpact}`;
    }
    
    if (riskType === "Compliance Based") {
      const obligation = obligations.find(o => o.id === selectedObligationId);
      if (!likelihood || !obligation || !projectName || !systemImpact || !impactLevel || !impactType || !businessImpact) {
        return "Complete all fields to generate a risk statement";
      }
      
      return `It is ${likelihood} that non-compliance with ${obligation.name} occurs for ${projectName}, resulting in a system impact ${systemImpact}, and a ${impactLevel} ${impactType} impact of ${businessImpact}`;
    }
    
    if (riskType === "Other") {
      if (!likelihood || !customRiskEvent.trim() || !projectName || !systemImpact || !impactLevel || !impactType || !businessImpact) {
        return "Complete all fields to generate a risk statement";
      }
      
      return `It is ${likelihood} that ${customRiskEvent} of ${projectName}, resulting in a system impact ${systemImpact}, and a ${impactLevel} ${impactType} impact of ${businessImpact}`;
    }

    return "Select a risk type to continue";
  };

  const statement = generateRiskStatement();
  const isComplete = !statement.startsWith("Complete all");

  // Update editable statement when auto-generated statement changes
  useEffect(() => {
    setEditableStatement(statement);
  }, [statement]);

  const handleSave = () => {
    if (isComplete && editableStatement.trim()) {
      onSaveRisk(editableStatement.trim());
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Risk Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Risk Type</label>
            <Select
              value={riskType}
              onValueChange={onRiskTypeChange}
              disabled={!canWrite}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select risk type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="Threat Based">Threat Based</SelectItem>
                <SelectItem value="Compliance Based">Compliance Based</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {riskType === "Threat Based" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Threat Statement</label>
              <Select
                value={selections["Threat"] !== null ? selections["Threat"].toString() : ""}
                onValueChange={(value) => onThreatChange(parseInt(value))}
                disabled={!canWrite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a threat statement" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {savedThreats.map((threat, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {threat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {riskType === "Compliance Based" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Obligation</label>
              <Select
                value={selectedObligationId}
                onValueChange={onObligationChange}
                disabled={!canWrite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an obligation" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {obligations.map((obligation) => (
                    <SelectItem key={obligation.id} value={obligation.id}>
                      {obligation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {riskType === "Other" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Risk Event</label>
              <Textarea
                value={customRiskEvent}
                onChange={(e) => onCustomRiskEventChange(e.target.value)}
                placeholder="Describe the risk event..."
                disabled={!canWrite}
                maxLength={500}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customRiskEvent.length}/500 characters
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {riskType === "Threat Based" && (
              <div>
                <label className="text-sm font-medium mb-2 block">CIANA</label>
                <Select
                  value={selections["CIANA"] !== null ? selections["CIANA"].toString() : ""}
                  onValueChange={(value) => onCIANAChange(parseInt(value))}
                  disabled={!canWrite}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CIANA aspect" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {cianaOptions.map((option, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Likelihood</label>
              <div className="flex gap-2">
                <Select
                  value={selections["Likelihood"] !== null ? selections["Likelihood"].toString() : ""}
                  onValueChange={(value) => onLikelihoodChange(parseInt(value))}
                  disabled={!canWrite}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select likelihood" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {likelihoodLevels.map((level, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLikelihoodCalculator(true)}
                  disabled={!canWrite}
                  title="Open Likelihood Calculator"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Business Impact Type</label>
              <Select
                value={selections["Impact Type"] !== null ? selections["Impact Type"].toString() : ""}
                onValueChange={(value) => onImpactTypeChange(parseInt(value))}
                disabled={!canWrite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {impactTypes.map((type, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Business Impact Level</label>
              <Select
                value={selections["Impact Level"] !== null ? selections["Impact Level"].toString() : ""}
                onValueChange={(value) => onImpactLevelChange(parseInt(value))}
                disabled={!canWrite}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {impactLevels.map((level, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selections["Impact Type"] !== null && selections["Impact Level"] !== null && (
            <div>
              <label className="text-sm font-medium mb-2 block">Selected Business Impact</label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {settingsLoading 
                  ? "Loading impact description..." 
                  : (businessImpactMatrix[impactTypes[selections["Impact Type"]]]?.[impactLevels[selections["Impact Level"]]] || "Impact description not configured")}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">System Impact</label>
            <Textarea
              value={systemImpactText}
              onChange={(e) => onSystemImpactTextChange(e.target.value)}
              placeholder="Describe the system impact..."
              disabled={!canWrite}
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {systemImpactText.length}/500 characters
            </p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Risk Statement (Editable)</label>
          <Textarea
            value={editableStatement}
            onChange={(e) => setEditableStatement(e.target.value)}
            placeholder="Complete all fields to generate a risk statement"
            disabled={!canWrite}
            maxLength={2000}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {editableStatement.length}/2000 characters
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!isComplete || !editableStatement.trim()}
            >
              Save Risk Statement
            </Button>
            <Button 
              variant="outline" 
              onClick={onClearSelections}
              disabled={Object.values(selections).every(v => v === null)}
            >
              Clear Selections
            </Button>
          </div>
        )}
      </CardContent>
      <LikelihoodCalculatorDialog
        open={showLikelihoodCalculator}
        onOpenChange={setShowLikelihoodCalculator}
        onSave={(likelihood) => {
          const index = likelihoodLevels.indexOf(likelihood);
          if (index !== -1) {
            onLikelihoodChange(index);
          }
        }}
      />
    </Card>
  );
};
