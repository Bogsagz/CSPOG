import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { LikelihoodCalculatorDialog } from "./LikelihoodCalculatorDialog";

interface SecondaryRiskBuilderProps {
  value: string;
  onChange: (statement: string) => void;
}

export const SecondaryRiskBuilder = ({ value, onChange }: SecondaryRiskBuilderProps) => {
  const { businessImpactMatrix } = useAppSettings();
  const [showLikelihoodCalculator, setShowLikelihoodCalculator] = useState(false);
  
  const [riskEvent, setRiskEvent] = useState("");
  const [likelihood, setLikelihood] = useState("");
  const [impactLevel, setImpactLevel] = useState("");
  const [impactType, setImpactType] = useState("");
  const [localImpact, setLocalImpact] = useState("");

  const likelihoods = ["Remote", "Unlikely", "Possible", "Likely", "Very Likely"];
  const impacts = ["Minor", "Moderate", "Major", "Significant", "Critical"];
  const impactTypes = ["Reputational", "Financial", "Operational", "Legal/Regulatory", "Strategic"];

  const generateStatement = () => {
    if (!likelihood || !riskEvent.trim() || !localImpact.trim() || !impactLevel || !impactType) {
      return "";
    }

    const businessImpact = businessImpactMatrix[impactType]?.[impactLevel] || "";
    if (!businessImpact) return "";

    return `It is ${likelihood} that ${riskEvent} would occur, resulting in a local impact ${localImpact}, and a ${impactLevel} ${impactType} impact of ${businessImpact}`;
  };

  useEffect(() => {
    const statement = generateStatement();
    if (statement) {
      onChange(statement);
    }
  }, [riskEvent, likelihood, impactLevel, impactType, localImpact]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Risk Event</Label>
        <Textarea
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="Describe the secondary risk event..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Likelihood</Label>
        <div className="flex gap-2">
          <Select value={likelihood} onValueChange={setLikelihood}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Business Impact Type</Label>
          <Select value={impactType} onValueChange={setImpactType}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {impactTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Business Impact Level</Label>
          <Select value={impactLevel} onValueChange={setImpactLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {impacts.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {impactType && impactLevel && (
        <div className="space-y-2">
          <Label>Selected Business Impact</Label>
          <div className="p-3 bg-muted rounded-md text-sm">
            {businessImpactMatrix[impactType]?.[impactLevel] || "Impact description not available"}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Local Impact</Label>
        <Textarea
          value={localImpact}
          onChange={(e) => setLocalImpact(e.target.value)}
          placeholder="Describe the local impact..."
          rows={2}
        />
      </div>

      {value && (
        <div className="space-y-2">
          <Label>Generated Statement</Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Edit the secondary risk statement..."
            rows={4}
          />
        </div>
      )}
      
      <LikelihoodCalculatorDialog
        open={showLikelihoodCalculator}
        onOpenChange={setShowLikelihoodCalculator}
        onSave={(likelihood) => setLikelihood(likelihood)}
      />
    </div>
  );
};
