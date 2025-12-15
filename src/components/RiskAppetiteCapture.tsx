import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRiskAppetite, RiskCategory, RiskLevel } from "@/hooks/useRiskAppetite";
import { useAppSettings } from "@/hooks/useAppSettings";
import { RISK_APPETITE_DEFINITIONS, RISK_CATEGORY_GUIDANCE } from "@/lib/orangeBookDefinitions";
import { Info } from "lucide-react";
import { useState } from "react";

interface RiskAppetiteCaptureProps {
  projectId: string | null;
  canWrite: boolean;
  summaryOnly?: boolean;
}

export const RiskAppetiteCapture = ({ projectId, canWrite, summaryOnly = false }: RiskAppetiteCaptureProps) => {
  const { riskAppetites, isLoading, setRiskLevel, clearAll, isComplete } = useRiskAppetite(projectId);
  const { riskCategories, riskLevels, isLoading: settingsLoading } = useAppSettings();
  const [showDefinitions, setShowDefinitions] = useState(true);

  const RISK_CATEGORIES = riskCategories as RiskCategory[];
  const RISK_LEVELS = riskLevels as RiskLevel[];

  if (isLoading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Appetite Capture</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const hasAnySelection = Object.values(riskAppetites).some(level => level !== null);

  if (summaryOnly) {
    return (
      <Card>
        <CardContent className="space-y-6 pt-6">
          {RISK_CATEGORIES.map((category) => {
            const selectedLevel = riskAppetites[category];
            const definition = selectedLevel 
              ? RISK_APPETITE_DEFINITIONS[selectedLevel as keyof typeof RISK_APPETITE_DEFINITIONS]
              : null;
            const categoryGuidance = RISK_CATEGORY_GUIDANCE[category];
            
            return (
              <div key={category} className="space-y-2">
                <h3 className="text-lg font-bold">{category}</h3>
                {categoryGuidance && (
                  <p className="text-sm text-muted-foreground pl-4">
                    {categoryGuidance}
                  </p>
                )}
                {selectedLevel ? (
                  <div className="pl-4 space-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">Appetite Level:</span>
                      <span className="text-sm font-medium">{selectedLevel}</span>
                    </div>
                    {definition && (
                      <p className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-4 py-2">
                        {definition}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic pl-4">No appetite level selected</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Appetite Selection */}
    <Card>
      <CardHeader>
        <CardTitle>Risk Appetite Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Risk Category</th>
                {RISK_LEVELS.map((level) => (
                  <th key={level} className="text-center py-3 px-2 font-semibold text-sm">
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_CATEGORIES.map((category) => (
                <tr key={category} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4 font-medium">{category}</td>
                  {RISK_LEVELS.map((level) => (
                    <td key={level} className="text-center py-4 px-2">
                      <RadioGroup
                        value={riskAppetites[category] || ""}
                        onValueChange={(value) => canWrite && setRiskLevel(category, value as RiskLevel)}
                        disabled={!canWrite}
                      >
                        <div className="flex items-center justify-center">
                          <RadioGroupItem
                            value={level}
                            id={`${category}-${level}`}
                            className="cursor-pointer"
                            disabled={!canWrite}
                          />
                          <Label
                            htmlFor={`${category}-${level}`}
                            className="sr-only"
                          >
                            {category} - {level}
                          </Label>
                        </div>
                      </RadioGroup>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          {hasAnySelection && canWrite && (
            <Button
              variant="outline"
              onClick={clearAll}
            >
              Clear All
            </Button>
          )}
          {isComplete && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">✓ All categories completed</span>
            </div>
          )}
          {!canWrite && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground italic">Read-only access</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Orange Book Definitions */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Orange Book Risk Appetite Levels</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDefinitions(!showDefinitions)}
          >
            {showDefinitions ? "Hide" : "Show"} Definitions
          </Button>
        </div>
        <CardDescription>
          Official UK Government HM Treasury definitions (August 2021)
        </CardDescription>
      </CardHeader>
      {showDefinitions && (
        <CardContent className="space-y-4">
          {RISK_LEVELS.map((level) => {
            const definition = RISK_APPETITE_DEFINITIONS[level as keyof typeof RISK_APPETITE_DEFINITIONS];
            return definition ? (
              <div key={level} className="border-l-4 border-primary/20 pl-4 py-2">
                <h4 className="font-semibold text-sm mb-1">{level}</h4>
                <p className="text-sm text-muted-foreground">{definition}</p>
              </div>
            ) : null;
          })}
        </CardContent>
      )}
    </Card>

    {/* Selected Risk Appetites Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Selected Risk Appetites</CardTitle>
        <CardDescription>Your chosen appetite levels for each risk category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {RISK_CATEGORIES.map((category) => {
          const selectedLevel = riskAppetites[category];
          const definition = selectedLevel 
            ? RISK_APPETITE_DEFINITIONS[selectedLevel as keyof typeof RISK_APPETITE_DEFINITIONS]
            : null;
          
          return (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-bold">{category}</h3>
              {selectedLevel ? (
                <div className="pl-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">Appetite Level:</span>
                    <span className="text-sm font-medium">{selectedLevel}</span>
                  </div>
                  {definition && (
                    <p className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-4 py-2">
                      {definition}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic pl-4">No appetite level selected</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
    </div>
  );
};
