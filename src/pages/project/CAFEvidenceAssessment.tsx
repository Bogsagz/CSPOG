import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ChevronRight, ChevronDown, CheckCircle2, XCircle, Plus } from "lucide-react";
import { CAF_FRAMEWORK } from "@/lib/cafFramework";
import { CAF_ASSESSMENT_QUESTIONS } from "@/lib/cafAssessment";
import { govAssureProfiles } from "@/lib/cafGovAssureProfiles";
import { useCAFEvidenceSelections } from "@/hooks/useCAFEvidenceSelections";
import { useCAFAssessmentResponses } from "@/hooks/useCAFAssessmentResponses";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { useCAFQuestionEvidence } from "@/hooks/useCAFQuestionEvidence";
import { toast } from "sonner";

export default function CAFEvidenceAssessment() {
  const { projectId } = useParams<{ projectId: string }>();
  const { isEvidenceSelected, toggleSelection, isLoading, selections } = useCAFEvidenceSelections(projectId!);
  const { getResponse, toggleResponse } = useCAFAssessmentResponses(projectId!);
  const { assessmentDoc } = useProjectAssessmentDocumentation(projectId!);
  const { getQuestionEvidence, isEvidenceLinked, toggleQuestionEvidence } = useCAFQuestionEvidence(projectId!);
  
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [expandedObjectives, setExpandedObjectives] = useState<string[]>(["A"]);
  const [expandedPrinciples, setExpandedPrinciples] = useState<string[]>([]);
  const [customEvidence, setCustomEvidence] = useState<string>("");

  // Get current outcome details
  const getCurrentOutcome = () => {
    if (!selectedOutcome) return null;
    for (const obj of CAF_FRAMEWORK) {
      for (const principle of obj.principles) {
        const outcome = principle.outcomes.find((o) => o.id === selectedOutcome);
        if (outcome)
          return {
            ...outcome,
            principleName: principle.name,
            principleId: principle.id,
            objective: obj.title,
          };
      }
    }
    return null;
  };

  const currentOutcome = getCurrentOutcome();

  const toggleObjective = (objectiveId: string) => {
    setExpandedObjectives((prev) =>
      prev.includes(objectiveId)
        ? prev.filter((id) => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const togglePrinciple = (principleId: string) => {
    setExpandedPrinciples((prev) =>
      prev.includes(principleId)
        ? prev.filter((id) => id !== principleId)
        : [...prev, principleId]
    );
  };

  const handleEvidenceToggle = async (evidenceItem: string) => {
    if (!selectedOutcome) return;
    const currentState = isEvidenceSelected(selectedOutcome, evidenceItem);
    await toggleSelection.mutateAsync({
      outcomeId: selectedOutcome,
      evidenceItem,
      selected: !currentState,
    });
  };
  
  const handleQuestionEvidenceToggle = async (questionId: string, evidenceItem: string, currentlySelected: boolean) => {
    if (!selectedOutcome) return;
    
    // If trying to unselect and this is the last evidence item for an answered question
    if (currentlySelected) {
      const response = getResponse(questionId);
      const linkedEvidence = getQuestionEvidence(questionId);
      
      // If question is answered and this is the only evidence selected, prevent removal
      if (response !== null && linkedEvidence.length === 1) {
        toast.error("Cannot remove the last piece of evidence from an answered question. Clear your answer first or select different evidence.");
        return;
      }
    }
    
    await toggleQuestionEvidence.mutateAsync({
      questionId,
      outcomeId: selectedOutcome,
      evidenceItem,
      selected: !currentlySelected,
    });
  };

  const getEvidenceSelectionCount = (outcomeId: string): number => {
    const outcome = CAF_FRAMEWORK.flatMap((obj) =>
      obj.principles.flatMap((p) => p.outcomes)
    ).find((o) => o.id === outcomeId);
    
    // Count predefined evidence
    const predefinedCount = outcome?.evidence 
      ? outcome.evidence.filter((item) => isEvidenceSelected(outcomeId, item)).length 
      : 0;
    
    // Count custom evidence for this outcome
    const customCount = selections?.filter(
      (s) => s.outcome_id === outcomeId && 
             s.selected && 
             !outcome?.evidence?.includes(s.evidence_item)
    ).length || 0;
    
    return predefinedCount + customCount;
  };

  const getCustomEvidenceForOutcome = (outcomeId: string): string[] => {
    const outcome = CAF_FRAMEWORK.flatMap((obj) =>
      obj.principles.flatMap((p) => p.outcomes)
    ).find((o) => o.id === outcomeId);
    
    const predefinedEvidence = outcome?.evidence || [];
    
    // Get all selected evidence items that are not in the predefined list
    return selections
      ?.filter(
        (s) => s.outcome_id === outcomeId && 
               s.selected && 
               !predefinedEvidence.includes(s.evidence_item)
      )
      .map((s) => s.evidence_item) || [];
  };

  const handleAddCustomEvidence = async () => {
    if (!selectedOutcome || !customEvidence.trim()) {
      toast.error("Please enter evidence text");
      return;
    }

    // Validate input length
    if (customEvidence.trim().length > 500) {
      toast.error("Evidence text must be less than 500 characters");
      return;
    }

    await toggleSelection.mutateAsync({
      outcomeId: selectedOutcome,
      evidenceItem: customEvidence.trim(),
      selected: true,
    });

    setCustomEvidence("");
    toast.success("Custom evidence added");
  };

  const handleQuestionResponse = async (questionId: string, outcomeId: string, currentValue: boolean | null, newValue: string) => {
    // Check if evidence has been selected for this question
    const linkedEvidence = getQuestionEvidence(questionId);
    const outcome = CAF_FRAMEWORK.flatMap((obj) =>
      obj.principles.flatMap((p) => p.outcomes)
    ).find((o) => o.id === outcomeId);
    
    const availableEvidence = outcome?.evidence || [];
    
    // Find the question to check if it's a negative indicator
    const question = CAF_ASSESSMENT_QUESTIONS.find(q => q.id === questionId);
    const isNegativeIndicator = question?.section === "negative";
    
    // If there's available evidence and user is trying to answer the question
    // Skip evidence requirement for negative indicators
    if (availableEvidence.length > 0 && newValue !== "" && !isNegativeIndicator) {
      if (linkedEvidence.length === 0) {
        toast.error("Please select at least one piece of supporting evidence before answering this question.");
        return;
      }
    }
    
    let response: boolean | null = null;
    
    if (newValue === "yes") {
      response = true;
    } else if (newValue === "no") {
      response = false;
    }
    
    await toggleResponse.mutateAsync({
      outcomeId,
      questionId,
      response,
    });
  };

  const getQuestionsForOutcome = (outcomeId: string, section: "negative" | "partial" | "achieved") => {
    return CAF_ASSESSMENT_QUESTIONS.filter(
      (q) => q.outcomeId === outcomeId && q.section === section
    );
  };

  // Calculate overall progress based on Gov Assure Profile requirements
  const calculateOverallProgress = () => {
    const govAssureProfile = assessmentDoc?.gov_assure_profile;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    // For each outcome, count only the questions that match the required profile level
    CAF_FRAMEWORK.forEach(objective => {
      objective.principles.forEach(principle => {
        principle.outcomes.forEach(outcome => {
          const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
          if (!profileData) return;

          const requiredLevel = govAssureProfile === "Enhanced" 
            ? profileData.enhancedProfile 
            : profileData.baselineProfile;

          const sectionType = requiredLevel === "Achieved" 
            ? "achieved" 
            : requiredLevel === "Partially Achieved" 
            ? "partial" 
            : requiredLevel === "Not Achieved"
            ? "negative"
            : null;

          if (!sectionType) return;

          const questions = CAF_ASSESSMENT_QUESTIONS.filter(
            q => q.outcomeId === outcome.id && q.section === sectionType
          );

          totalQuestions += questions.length;

          questions.forEach(question => {
            const response = getResponse(question.id);
            if (response !== null && response !== undefined) {
              answeredQuestions++;
            }
          });
        });
      });
    });

    return { total: totalQuestions, answered: answeredQuestions };
  };

  // Get completion status for a specific outcome
  const getOutcomeCompletionStatus = (outcomeId: string): "complete" | "partial" | "none" | "failed" => {
    const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcomeId);
    if (!profileData) return "none";

    const govAssureProfile = assessmentDoc?.gov_assure_profile;
    const requiredLevel = govAssureProfile === "Enhanced" 
      ? profileData.enhancedProfile 
      : profileData.baselineProfile;

    const sectionType = requiredLevel === "Achieved" 
      ? "achieved" 
      : requiredLevel === "Partially Achieved" 
      ? "partial" 
      : requiredLevel === "Not Achieved"
      ? "negative"
      : null;

    if (!sectionType) return "none";

    // Get negative questions (always shown)
    const negativeQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
      q => q.outcomeId === outcomeId && q.section === "negative"
    );
    
    // Check if any negative indicator is marked "Yes" - if so, automatic fail
    const hasNegativeIndicator = negativeQuestions.some(q => {
      const response = getResponse(q.id);
      return response === true; // Yes to a negative indicator = fail
    });
    
    if (hasNegativeIndicator) return "failed";
    
    // Get primary questions based on required level
    const primaryQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
      q => q.outcomeId === outcomeId && q.section === sectionType
    );

    const allRelevantQuestions = [...negativeQuestions, ...primaryQuestions];
    
    if (allRelevantQuestions.length === 0) return "none";

    let answeredCount = 0;
    allRelevantQuestions.forEach(question => {
      const response = getResponse(question.id);
      if (response !== null && response !== undefined) {
        answeredCount++;
      }
    });

    if (answeredCount === allRelevantQuestions.length) return "complete";
    if (answeredCount > 0) return "partial";
    return "none";
  };

  const overallProgress = calculateOverallProgress();

  const renderAssessmentQuestions = () => {
    if (!selectedOutcome) return null;

    // Find the profile requirement for this outcome
    const profileData = govAssureProfiles.find(p => p.outcomeNumber === selectedOutcome);
    if (!profileData) return null;

    const govAssureProfile = assessmentDoc?.gov_assure_profile;
    const requiredLevel = govAssureProfile === "Enhanced" 
      ? profileData.enhancedProfile 
      : profileData.baselineProfile;

    // Always get negative questions (shown regardless of required level)
    const negativeQuestions = getQuestionsForOutcome(selectedOutcome, "negative");
    
    // Get questions for the required level only
    let primaryQuestions: any[] = [];
    let primarySection: "partial" | "achieved" | null = null;
    
    if (requiredLevel === "Partially Achieved") {
      primaryQuestions = getQuestionsForOutcome(selectedOutcome, "partial");
      primarySection = "partial";
    } else if (requiredLevel === "Achieved") {
      primaryQuestions = getQuestionsForOutcome(selectedOutcome, "achieved");
      primarySection = "achieved";
    }

    if (negativeQuestions.length === 0 && primaryQuestions.length === 0) {
      return null;
    }

    const renderSection = (
      questions: any[],
      section: "negative" | "partial" | "achieved",
    ) => {
      if (questions.length === 0) return null;

      let sectionTitle = "";
      let sectionIcon = null as React.ReactNode;
      let helperText = "";

      if (section === "negative") {
        sectionTitle = "Negative Indicators";
        sectionIcon = <XCircle className="h-5 w-5 text-destructive" />;
        helperText = "Answer \"Yes\" if this negative indicator is present in your organisation. Supporting evidence is optional.";
      } else if (section === "partial") {
        sectionTitle = "Partially Achieved";
        sectionIcon = <Badge variant="secondary">Partially Achieved</Badge>;
        helperText = "Answer \"Yes\" if your organisation demonstrates this partially achieved indicator";
      } else {
        sectionTitle = "Achieved";
        sectionIcon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
        helperText = "Answer \"Yes\" if your organisation fully demonstrates this achieved indicator";
      }

      return (
        <div className="space-y-4" key={section}>
          <div className="flex items-center gap-2">
            {sectionIcon}
            <h4 className="font-semibold">{sectionTitle}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{helperText}</p>
          <div className="space-y-4">
            {questions.map((question) => {
              const response = getResponse(question.id);
              const value = response === null ? "" : response ? "yes" : "no";
              const linkedEvidence = getQuestionEvidence(question.id);
              const availableEvidence = currentOutcome?.evidence || [];
              const hasResponse = response !== null;
              const isNegative = section === "negative";
              const needsEvidence = !isNegative && availableEvidence.length > 0 && linkedEvidence.length === 0;
              
              return (
                <div key={question.id} className={`p-4 rounded-lg border bg-card space-y-3 ${hasResponse && needsEvidence ? 'border-destructive' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{question.question}</p>
                    {hasResponse && needsEvidence && (
                      <Badge variant="destructive" className="text-xs">Evidence Required</Badge>
                    )}
                  </div>
                  <RadioGroup
                    value={value}
                    onValueChange={(newValue) =>
                      handleQuestionResponse(question.id, selectedOutcome, response, newValue)
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                        <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${question.id}-no`} />
                        <Label htmlFor={`${question.id}-no`} className="cursor-pointer">
                          No
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  
                    {/* Supporting Evidence Dropdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Supporting Evidence {availableEvidence.length > 0 && !isNegative && <span className="text-destructive">*</span>}
                        </Label>
                      {linkedEvidence.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {linkedEvidence.length} selected
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {availableEvidence.map((evidence) => {
                        const isLinked = isEvidenceLinked(question.id, evidence);
                        return (
                          <div key={evidence} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${question.id}-${evidence}`}
                              checked={isLinked}
                              onCheckedChange={() => {
                                handleQuestionEvidenceToggle(question.id, evidence, isLinked);
                              }}
                            />
                            <label
                              htmlFor={`${question.id}-${evidence}`}
                              className="text-xs cursor-pointer flex-1"
                            >
                              {evidence}
                            </label>
                          </div>
                        );
                      })}
                      {availableEvidence.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No evidence items available for this outcome</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="mt-8 space-y-6 border-t pt-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Assessment Questions</h3>
          <p className="text-sm text-muted-foreground">
            Required level for this outcome: <span className="font-medium">{requiredLevel}</span>
          </p>
        </div>

        <div className="space-y-8">
          {renderSection(negativeQuestions, "negative")}
          {primarySection && renderSection(primaryQuestions, primarySection)}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          CAF Evidence Assessment Tool
          {assessmentDoc?.gov_assure_profile && ` - ${assessmentDoc.gov_assure_profile}`}
        </h2>
        <p className="text-muted-foreground">
          Select sources of evidence for NCSC Cyber Assessment Framework compliance
        </p>
      </div>

      <Tabs defaultValue="assessment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="overview">Coverage Overview</TabsTrigger>
          <TabsTrigger value="profiles">GOV Assure Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <div className="grid grid-cols-3 gap-6">
        {/* Left Panel - Hierarchical Menu */}
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>CAF Framework</CardTitle>
            <CardDescription>Navigate objectives and outcomes</CardDescription>
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-semibold">
                  {overallProgress.answered}/{overallProgress.total}
                </span>
              </div>
              <Progress
                value={overallProgress.total > 0 ? (overallProgress.answered / overallProgress.total) * 100 : 0}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {CAF_FRAMEWORK.map((objective) => {
              const isObjectiveExpanded = expandedObjectives.includes(objective.objective);
              
              return (
                <div key={objective.objective} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-left h-auto py-2"
                    onClick={() => toggleObjective(objective.objective)}
                  >
                    <span className="font-semibold text-sm">
                      Objective {objective.objective}: {objective.title}
                    </span>
                    {isObjectiveExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {isObjectiveExpanded && (
                    <div className="ml-4 space-y-1">
                      {objective.principles.map((principle) => {
                        const isPrincipleExpanded = expandedPrinciples.includes(principle.id);

                        return (
                          <div key={principle.id} className="space-y-1">
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-left h-auto py-2"
                              onClick={() => togglePrinciple(principle.id)}
                            >
                              <span className="text-sm font-medium">
                                {principle.id}: {principle.name}
                              </span>
                              {isPrincipleExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>

                            {isPrincipleExpanded && (
                              <div className="ml-4 space-y-1">
                                {principle.outcomes.map((outcome) => {
                                  const isSelected = selectedOutcome === outcome.id;
                                  const selectionCount = getEvidenceSelectionCount(outcome.id);
                                  const hasEvidence = outcome.evidence && outcome.evidence.length > 0;
                                  const completionStatus = getOutcomeCompletionStatus(outcome.id);

                                  return (
                                <Button
                                      key={outcome.id}
                                      variant="outline"
                                      size="sm"
                                      className={`w-full justify-between text-left h-auto py-2 transition-all ${
                                        isSelected 
                                          ? "border-l-4 border-l-primary shadow-md" 
                                          : ""
                                      } ${
                                        completionStatus === "failed"
                                          ? "bg-red-100 hover:bg-red-200 border-red-500 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                                          : completionStatus === "complete" 
                                          ? "bg-green-100 hover:bg-green-200 border-green-500 dark:bg-green-900/30 dark:hover:bg-green-900/50" 
                                          : completionStatus === "partial" 
                                          ? "bg-yellow-100 hover:bg-yellow-200 border-yellow-500 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50" 
                                          : ""
                                      }`}
                                      onClick={() => setSelectedOutcome(outcome.id)}
                                      disabled={!hasEvidence}
                                    >
                                      <span className="text-xs">
                                        {outcome.id}: {outcome.name}
                                      </span>
                                      {selectionCount > 0 && (
                                        <Badge
                                          variant={isSelected ? "secondary" : "outline"}
                                          className="text-xs"
                                        >
                                          {selectionCount}
                                        </Badge>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right Panel - Sources of Evidence */}
        <Card className="col-span-2">
          {selectedOutcome && currentOutcome ? (
            <>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentOutcome.principleId}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentOutcome.principleName}
                    </span>
                  </div>
                  <CardTitle>
                    {currentOutcome.id}: {currentOutcome.name}
                  </CardTitle>
                  <CardDescription>{currentOutcome.description}</CardDescription>
                  <Badge variant="secondary" className="mt-2">
                    {currentOutcome.objective}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentOutcome.evidence && currentOutcome.evidence.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Sources of Evidence</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select the sources of evidence used to demonstrate compliance with this
                      outcome:
                    </p>
                    <div className="space-y-3">
                      {currentOutcome.evidence.map((item, index) => {
                        const isSelected = isEvidenceSelected(selectedOutcome, item);
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={`evidence-${index}`}
                              checked={isSelected}
                              onCheckedChange={() => handleEvidenceToggle(item)}
                              disabled={isLoading}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`evidence-${index}`}
                              className="text-sm flex-1 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        );
                      })}
                      
                      {/* Custom Evidence Items */}
                      {getCustomEvidenceForOutcome(selectedOutcome).map((item, index) => {
                        const isSelected = isEvidenceSelected(selectedOutcome, item);
                        return (
                          <div
                            key={`custom-${index}`}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors border-primary/50"
                          >
                            <Checkbox
                              id={`custom-evidence-${index}`}
                              checked={isSelected}
                              onCheckedChange={() => handleEvidenceToggle(item)}
                              disabled={isLoading}
                              className="mt-0.5"
                            />
                            <label
                              htmlFor={`custom-evidence-${index}`}
                              className="text-sm flex-1 cursor-pointer"
                            >
                              {item}
                            </label>
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Add Custom Evidence */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="text-sm font-semibold">Add Custom Evidence</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter custom evidence item..."
                          value={customEvidence}
                          onChange={(e) => setCustomEvidence(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomEvidence();
                            }
                          }}
                          maxLength={500}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddCustomEvidence}
                          disabled={!customEvidence.trim() || isLoading}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter or click + to add custom evidence (max 500 characters)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No evidence requirements defined for this outcome</p>
                  </div>
                )}

                {/* Assessment Questions Section */}
                {renderAssessmentQuestions()}
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an outcome from the left panel to view sources of evidence</p>
              </div>
            </CardContent>
          )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Coverage Overview</CardTitle>
              <CardDescription>
                Track your progress across all CAF objectives and outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {overallProgress.answered} / {overallProgress.total}
                    </h3>
                    <p className="text-sm text-muted-foreground">Questions Answered</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-bold">
                      {overallProgress.total > 0 
                        ? Math.round((overallProgress.answered / overallProgress.total) * 100)
                        : 0}%
                    </h3>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                  </div>
                </div>
                <Progress 
                  value={overallProgress.total > 0 ? (overallProgress.answered / overallProgress.total) * 100 : 0} 
                  className="h-3" 
                />
              </div>

              <div className="space-y-6">
                {CAF_FRAMEWORK.map((objective) => {
                  const objectiveTotalQuestions = objective.principles.reduce((sum, principle) => {
                    return sum + principle.outcomes.reduce((outcomeSum, outcome) => {
                      const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
                      if (!profileData) return outcomeSum;

                      const requiredLevel = assessmentDoc?.gov_assure_profile === "Enhanced" 
                        ? profileData.enhancedProfile 
                        : profileData.baselineProfile;

                      const sectionType = requiredLevel === "Achieved" 
                        ? "achieved" 
                        : requiredLevel === "Partially Achieved" 
                        ? "partial" 
                        : null;

                      if (!sectionType) return outcomeSum;

                      const questions = CAF_ASSESSMENT_QUESTIONS.filter(
                        q => q.outcomeId === outcome.id && q.section === sectionType
                      );

                      return outcomeSum + questions.length;
                    }, 0);
                  }, 0);

                  const objectiveAnswered = objective.principles.reduce((sum, principle) => {
                    return sum + principle.outcomes.reduce((outcomeSum, outcome) => {
                      const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
                      if (!profileData) return outcomeSum;

                      const requiredLevel = assessmentDoc?.gov_assure_profile === "Enhanced" 
                        ? profileData.enhancedProfile 
                        : profileData.baselineProfile;

                      const sectionType = requiredLevel === "Achieved" 
                        ? "achieved" 
                        : requiredLevel === "Partially Achieved" 
                        ? "partial" 
                        : null;

                      if (!sectionType) return outcomeSum;

                      const questions = CAF_ASSESSMENT_QUESTIONS.filter(
                        q => q.outcomeId === outcome.id && q.section === sectionType
                      );

                      let answeredCount = 0;
                      questions.forEach(question => {
                        const response = getResponse(question.id);
                        if (response !== null && response !== undefined) {
                          answeredCount++;
                        }
                      });

                      return outcomeSum + answeredCount;
                    }, 0);
                  }, 0);

                  const objectivePercentage = objectiveTotalQuestions > 0 
                    ? Math.round((objectiveAnswered / objectiveTotalQuestions) * 100) 
                    : 0;

                  if (objectiveTotalQuestions === 0) return null;

                  return (
                    <div key={objective.objective} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Objective {objective.objective}: {objective.title}
                        </h3>
                        <Badge variant="secondary">
                          {objectiveAnswered}/{objectiveTotalQuestions} answered
                        </Badge>
                      </div>
                      <Progress value={objectivePercentage} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-3 ml-4">
                        {objective.principles.map((principle) => {
                          return principle.outcomes.map((outcome) => {
                            const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
                            if (!profileData) return null;

                            const requiredLevel = assessmentDoc?.gov_assure_profile === "Enhanced" 
                              ? profileData.enhancedProfile 
                              : profileData.baselineProfile;

                            const sectionType = requiredLevel === "Achieved" 
                              ? "achieved" 
                              : requiredLevel === "Partially Achieved" 
                              ? "partial" 
                              : null;

                            if (!sectionType) return null;

                            const questions = CAF_ASSESSMENT_QUESTIONS.filter(
                              q => q.outcomeId === outcome.id && q.section === sectionType
                            );

                            if (questions.length === 0) return null;

                            let answeredCount = 0;
                            questions.forEach(question => {
                              const response = getResponse(question.id);
                              if (response !== null && response !== undefined) {
                                answeredCount++;
                              }
                            });

                            const percentage = questions.length > 0 
                              ? Math.round((answeredCount / questions.length) * 100) 
                              : 0;

                            // Count evidence selections
                            const evidenceCount = getEvidenceSelectionCount(outcome.id);
                            
                            return (
                              <div key={outcome.id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {outcome.id}: {outcome.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {principle.name}
                                    </p>
                                    {evidenceCount > 0 && (
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {evidenceCount} evidence items
                                      </Badge>
                                    )}
                                  </div>
                                  {answeredCount === questions.length && (
                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{answeredCount}/{questions.length} questions</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <Progress value={percentage} className="h-1.5" />
                                </div>
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Government CAF Profiles</CardTitle>
              <CardDescription>
                Required achievement levels for Baseline and Enhanced profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outcome Number</TableHead>
                    <TableHead>Outcome Name</TableHead>
                    <TableHead>Baseline Profile</TableHead>
                    <TableHead>Enhanced Profile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {govAssureProfiles.map((profile) => (
                    <TableRow key={profile.outcomeNumber}>
                      <TableCell className="font-medium">{profile.outcomeNumber}</TableCell>
                      <TableCell>{profile.outcomeName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            profile.baselineProfile === "Achieved" ? "default" :
                            profile.baselineProfile === "Partially Achieved" ? "secondary" :
                            "outline"
                          }
                        >
                          {profile.baselineProfile}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            profile.enhancedProfile === "Achieved" ? "default" :
                            profile.enhancedProfile === "Partially Achieved" ? "secondary" :
                            "outline"
                          }
                        >
                          {profile.enhancedProfile}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
