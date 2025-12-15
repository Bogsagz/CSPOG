import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Statement {
  id: number;
  text: string;
  effect: "+" | "-";
}

const statements: Statement[] = [
  {
    id: 1,
    text: "The service is public facing or There is data available in the public domain about the system functionality",
    effect: "+",
  },
  {
    id: 2,
    text: "The system has a secure patching process and patches within required timescales",
    effect: "-",
  },
  {
    id: 11,
    text: "The system is onboarded to SOC for monitoring",
    effect: "-",
  },
  {
    id: 12,
    text: "All admin level users have a vetting one level higher than the data classification requires",
    effect: "-",
  },
  {
    id: 3,
    text: "There are unpatched CVEs with a criticality score of 5 or higher",
    effect: "+",
  },
  {
    id: 4,
    text: "The security controls efficacy is suitable for the adversary",
    effect: "-",
  },
  {
    id: 5,
    text: "The system stores, collects or processes PII, Healthcare, Financial, Intellectual Property, or Government Data at OS or above",
    effect: "+",
  },
  {
    id: 6,
    text: "The system contains unique data that cannot be found elsewhere such as the master copy of a dataset or an aggregate of data from two or more sources",
    effect: "+",
  },
  {
    id: 9,
    text: "The system stores or processes medium or larger dataset (Over 1 Million records) within a year",
    effect: "+",
  },
  {
    id: 10,
    text: "The system accepts removable media such as USB or is directly accessible from the internet",
    effect: "+",
  },
];

const likelihoodLevels = [
  { score: 1, label: "Remote" },
  { score: 2, label: "Unlikely" },
  { score: 3, label: "Possible" },
  { score: 4, label: "Likely" },
  { score: 5, label: "Very Likely" },
];

export default function LikelihoodCalculator() {
  const [selectedStatements, setSelectedStatements] = useState<{ [key: number]: boolean }>({});
  const [score, setScore] = useState(2);

  useEffect(() => {
    const selectedIds = Object.entries(selectedStatements)
      .filter(([, checked]) => checked)
      .map(([id]) => Number(id));

    const hasTile2 = selectedIds.includes(2);
    const hasTile11 = selectedIds.includes(11);
    const hasTile12 = selectedIds.includes(12);
    const hasTile4 = selectedIds.includes(4);
    const hasTileOne = selectedIds.includes(1);
    const positiveCount = selectedIds.filter((id) => id !== 4 && id !== 2 && id !== 11 && id !== 12).length;

    // Tile 1 adds 2, Tiles 2, 11 & 12 reduce by 1 each, Tile 4 reduces by 3
    const rawScore = 2 + positiveCount + (hasTileOne ? 1 : 0) - (hasTile2 ? 1 : 0) - (hasTile11 ? 1 : 0) - (hasTile12 ? 1 : 0) - (hasTile4 ? 3 : 0);
    const clampedScore = Math.max(1, Math.min(5, rawScore));

    console.log({ selectedIds, positiveCount, hasTile2, hasTile11, hasTile12, hasTile4, hasTileOne, rawScore, clampedScore });
    setScore(clampedScore);
  }, [selectedStatements]);

  const handleStatementToggle = (statementId: number, checked: boolean) => {
    setSelectedStatements(prev => ({
      ...prev,
      [statementId]: checked,
    }));
  };

  const getLikelihoodLabel = (score: number): string => {
    const level = likelihoodLevels.find(l => l.score === score);
    return level?.label || "Unknown";
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score <= 2) return "secondary";
    if (score === 3) return "default";
    return "destructive";
  };

  const selectedCount = Object.values(selectedStatements).filter(Boolean).length;
  const totalStatements = statements.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Likelihood Calculator</h3>
        <p className="text-muted-foreground">
          Select all statements that apply to determine the likelihood rating of your risk
        </p>
      </div>

      <Alert>
        <AlertDescription>
          This calculator starts with a baseline likelihood of <strong>Unlikely (2)</strong> and adjusts based on your selections. 
          Selected: <strong>{selectedCount}/{totalStatements}</strong> statements
        </AlertDescription>
      </Alert>

      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle>Current Likelihood Score</CardTitle>
          <CardDescription>Based on your responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{score}</div>
            <Badge variant={getScoreVariant(score)} className="text-lg py-2 px-4">
              {getLikelihoodLabel(score)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statements.map((statement) => {
          const isSelected = selectedStatements[statement.id] || false;
          const isLightGreenTile = statement.id === 2 || statement.id === 11 || statement.id === 12;
          const isDarkGreenTile = statement.id === 4;
          const isRedTile = statement.id === 1; // Tile 1 adds 2 to score
          
          return (
            <Card 
              key={statement.id} 
              className={cn(
                "cursor-pointer transition-all",
                isSelected 
                  ? isLightGreenTile
                    ? "bg-green-500 text-white border-green-500 border-2 shadow-md"
                    : isDarkGreenTile
                    ? "bg-green-700 text-white border-green-700 border-2 shadow-md"
                    : isRedTile
                    ? "bg-red-700 text-white border-red-700 border-2 shadow-md"
                    : "bg-orange-600 text-white border-orange-600 border-2 shadow-md"
                  : "bg-background hover:bg-accent/50"
              )}
              onClick={() => handleStatementToggle(statement.id, !isSelected)}
            >
              <CardContent className="pt-6">
                <div className="text-sm font-medium leading-tight">
                  {statement.text}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
