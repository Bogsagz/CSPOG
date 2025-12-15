import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RiskBuilder from "./RiskBuilder";
import RiskTuner from "./RiskTuner";
import RiskRemediator from "./RiskRemediator";
import RiskDecisions from "./RiskDecisions";
import LikelihoodCalculator from "./LikelihoodCalculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RiskTooling() {
  const { projectId } = useParams<{ projectId: string }>();
  const { risks, deleteRisk, isLoading } = useSavedRisks(projectId || null);
  const [editingRisk, setEditingRisk] = useState<number | null>(null);

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

  const handleDelete = async (index: number) => {
    if (confirm("Are you sure you want to delete this risk?")) {
      await deleteRisk(index);
    }
  };

  const RiskEditorTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Risk Editor</h3>
        <p className="text-muted-foreground">
          View and manage all saved risks for this project
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading risks...</p>
        </div>
      ) : risks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No risks saved yet. Use the Risk Builder tab to create risks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Saved Risks</CardTitle>
            <CardDescription>All risks registered for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk Statement</TableHead>
                  <TableHead>Base Likelihood</TableHead>
                  <TableHead>Base Impact</TableHead>
                  <TableHead>Base Rating</TableHead>
                  <TableHead>Modified Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.map((risk, index) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium max-w-md">
                      {risk.risk_statement}
                    </TableCell>
                    <TableCell>{risk.base_likelihood || "-"}</TableCell>
                    <TableCell>{risk.base_impact || "-"}</TableCell>
                    <TableCell>
                      {risk.base_likelihood && risk.base_impact ? (
                        <Badge variant={
                          calculateRiskRating(risk.base_likelihood, risk.base_impact) === "Very High Risk" ? "destructive" :
                          calculateRiskRating(risk.base_likelihood, risk.base_impact) === "High Risk" ? "destructive" :
                          "default"
                        }>
                          {calculateRiskRating(risk.base_likelihood, risk.base_impact)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {risk.modified_likelihood && risk.modified_impact ? (
                        <Badge variant={
                          calculateRiskRating(risk.modified_likelihood, risk.modified_impact) === "Very High Risk" ? "destructive" :
                          calculateRiskRating(risk.modified_likelihood, risk.modified_impact) === "High Risk" ? "destructive" :
                          calculateRiskRating(risk.modified_likelihood, risk.modified_impact) === "Medium Risk" ? "default" :
                          "secondary"
                        }>
                          {calculateRiskRating(risk.modified_likelihood, risk.modified_impact)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Risk Tooling</h1>
        <p className="text-muted-foreground">
          Comprehensive risk management tools for building, tuning, and remediating risks
        </p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="builder" className="font-bold">Risk Builder</TabsTrigger>
          <TabsTrigger value="editor" className="font-bold">Risk Editor</TabsTrigger>
          <TabsTrigger value="calculator" className="font-bold">Likelihood Calculator</TabsTrigger>
          <TabsTrigger value="tuner" className="font-bold">Risk Tuner</TabsTrigger>
          <TabsTrigger value="remediator" className="font-bold">Risk Remediator</TabsTrigger>
          <TabsTrigger value="decisions" className="font-bold">Risk Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <RiskBuilder />
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          <RiskEditorTab />
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <LikelihoodCalculator />
        </TabsContent>

        <TabsContent value="tuner" className="mt-6">
          <RiskTuner />
        </TabsContent>

        <TabsContent value="remediator" className="mt-6">
          <RiskRemediator />
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <RiskDecisions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
