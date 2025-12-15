import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useCAFAssessmentResponses } from "@/hooks/useCAFAssessmentResponses";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { useCAFOutcomeNarratives } from "@/hooks/useCAFOutcomeNarratives";
import { useCAFQuestionEvidence } from "@/hooks/useCAFQuestionEvidence";
import { CAF_FRAMEWORK } from "@/lib/cafFramework";
import { CAF_ASSESSMENT_QUESTIONS } from "@/lib/cafAssessment";
import { govAssureProfiles } from "@/lib/cafGovAssureProfiles";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ComplianceGSD() {
  const { projectId } = useParams<{ projectId: string }>();
  const { responses, isLoading } = useCAFAssessmentResponses(projectId!);
  const { assessmentDoc } = useProjectAssessmentDocumentation(projectId!);
  const { getNarrative, generateNarrative } = useCAFOutcomeNarratives(projectId!);
  const { getQuestionEvidence } = useCAFQuestionEvidence(projectId!);

  // Calculate compliance for an outcome
  const calculateOutcomeCompliance = (outcomeId: string) => {
    // Find the required profile level for this outcome
    const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcomeId);
    if (!profileData) return null;

    const govAssureProfile = assessmentDoc?.gov_assure_profile;
    const requiredLevel = govAssureProfile === "Enhanced" 
      ? profileData.enhancedProfile 
      : profileData.baselineProfile;

    // Get questions for the required level
    const sectionType = requiredLevel === "Achieved" ? "achieved" : requiredLevel === "Partially Achieved" ? "partial" : null;
    if (!sectionType) return null;

    // Get primary questions (achieved/partial) AND negative indicators
    const primaryQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
      q => q.outcomeId === outcomeId && q.section === sectionType
    );
    
    const negativeQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
      q => q.outcomeId === outcomeId && q.section === "negative"
    );
    
    const allQuestions = [...negativeQuestions, ...primaryQuestions];

    if (allQuestions.length === 0) return null;

    // Check if any negative indicator is marked "Yes" - if so, automatic fail
    const hasNegativeIndicator = negativeQuestions.some(q => {
      const response = responses?.find(r => r.question_id === q.id);
      return response?.response === true; // Yes to a negative indicator = fail
    });

    // Count answered questions and compliant answers
    let answeredCount = 0;
    let compliantCount = 0;

    allQuestions.forEach(question => {
      const response = responses?.find(r => r.question_id === question.id);
      if (response?.response !== null && response?.response !== undefined) {
        answeredCount++;
        // For negative indicators: No = compliant, Yes = non-compliant
        // For partial/achieved indicators: Yes = compliant, No = non-compliant
        const isCompliant = question.isNegative ? !response.response : response.response;
        if (isCompliant) compliantCount++;
      }
    });

    // If any negative indicator is marked Yes, compliance is 0%
    const percentage = hasNegativeIndicator 
      ? 0 
      : allQuestions.length > 0 
        ? Math.round((compliantCount / allQuestions.length) * 100) 
        : 0;

    return {
      total: allQuestions.length,
      answered: answeredCount,
      compliant: hasNegativeIndicator ? 0 : compliantCount,
      percentage,
      requiredLevel,
      hasFailed: hasNegativeIndicator,
    };
  };

  // Calculate principle compliance
  const calculatePrincipleCompliance = (principleOutcomes: string[]) => {
    const outcomeStats = principleOutcomes
      .map(outcomeId => calculateOutcomeCompliance(outcomeId))
      .filter(stat => stat !== null);

    if (outcomeStats.length === 0) return null;

    const totalQuestions = outcomeStats.reduce((sum, stat) => sum + stat.total, 0);
    const totalAnswered = outcomeStats.reduce((sum, stat) => sum + stat.answered, 0);
    const totalCompliant = outcomeStats.reduce((sum, stat) => sum + stat.compliant, 0);
    const hasFailed = outcomeStats.some(stat => stat.hasFailed);

    return {
      total: totalQuestions,
      answered: totalAnswered,
      compliant: totalCompliant,
      percentage: totalQuestions > 0 ? Math.round((totalCompliant / totalQuestions) * 100) : 0,
      hasFailed,
    };
  };

  // Calculate objective compliance
  const calculateObjectiveCompliance = (objective: typeof CAF_FRAMEWORK[0]) => {
    const allOutcomes = objective.principles.flatMap(p => p.outcomes.map(o => o.id));
    return calculatePrincipleCompliance(allOutcomes);
  };

  // Calculate overall compliance
  const calculateOverallCompliance = () => {
    const allOutcomes = CAF_FRAMEWORK.flatMap(obj =>
      obj.principles.flatMap(p => p.outcomes.map(o => o.id))
    );
    return calculatePrincipleCompliance(allOutcomes);
  };

  const overallCompliance = calculateOverallCompliance();

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (percentage >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl">
        <div className="text-center">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Compliance (GSD)
          {assessmentDoc?.gov_assure_profile && ` - ${assessmentDoc.gov_assure_profile} Profile`}
        </h2>
        <p className="text-muted-foreground">
          CAF compliance assessment results based on full framework coverage
        </p>
      </div>

      {/* Overall Compliance Score */}
      {overallCompliance && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Overall CAF Compliance Score</CardTitle>
                <CardDescription>
                  Based on full CAF framework ({overallCompliance.total} total questions, {overallCompliance.answered} answered)
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {getComplianceIcon(overallCompliance.percentage)}
                <span className={`text-4xl font-bold ${getComplianceColor(overallCompliance.percentage)}`}>
                  {overallCompliance.percentage}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallCompliance.percentage} className="h-3" />
            <div className="mt-2 text-sm text-muted-foreground">
              {overallCompliance.compliant} of {overallCompliance.total} requirements met
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives Breakdown */}
      <Accordion type="multiple" className="space-y-4">
        {CAF_FRAMEWORK.map((objective) => {
          const objCompliance = calculateObjectiveCompliance(objective);
          
          if (!objCompliance) return null;

          return (
            <AccordionItem key={objective.objective} value={objective.objective} className={`border rounded-lg ${objCompliance.hasFailed ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base">
                      Objective {objective.objective}
                    </Badge>
                    <span className="font-semibold text-lg">{objective.title}</span>
                    {objCompliance.hasFailed && (
                      <Badge variant="destructive" className="text-sm">
                        Failed - Negative Indicator
                      </Badge>
                    )}
                  </div>
                  {objCompliance.answered === 0 ? (
                    <Badge variant="secondary" className="text-sm">Section not complete</Badge>
                  ) : (
                    <div className="flex items-center gap-3">
                      {getComplianceIcon(objCompliance.percentage)}
                      <span className={`text-xl font-bold ${objCompliance.hasFailed ? 'text-red-600 dark:text-red-400' : getComplianceColor(objCompliance.percentage)}`}>
                        {objCompliance.percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-4 mt-4">
                  {objective.principles.map((principle) => {
                    const outcomeIds = principle.outcomes.map(o => o.id);
                    const principleCompliance = calculatePrincipleCompliance(outcomeIds);
                    
                    if (!principleCompliance) return null;

                    return (
                      <Card key={principle.id} className={principleCompliance.hasFailed ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base">
                                  {principle.id}: {principle.name}
                                </CardTitle>
                                {principleCompliance.hasFailed && (
                                  <Badge variant="destructive" className="text-xs">
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm">
                                {principle.description}
                              </CardDescription>
                            </div>
                            {principleCompliance.answered === 0 ? (
                              <Badge variant="secondary" className="text-sm">Section not complete</Badge>
                            ) : (
                              <div className="flex items-center gap-2">
                                {getComplianceIcon(principleCompliance.percentage)}
                                <span className={`text-lg font-bold ${principleCompliance.hasFailed ? 'text-red-600 dark:text-red-400' : getComplianceColor(principleCompliance.percentage)}`}>
                                  {principleCompliance.percentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {principle.outcomes.map((outcome) => {
                              const outcomeCompliance = calculateOutcomeCompliance(outcome.id);
                              
                              if (!outcomeCompliance) return null;

                              const narrative = getNarrative(outcome.id);
                              const isGenerating = generateNarrative.isPending;

                              return (
                                <div key={outcome.id} className="p-4 border rounded-lg bg-card space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {outcome.id}
                                        </Badge>
                                        <span className="font-medium text-sm">{outcome.name}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{outcome.description}</p>
                                               {outcomeCompliance.answered === 0 ? (
                                        <div className="mt-2">
                                          <Badge variant="secondary" className="text-xs">Section not complete</Badge>
                                        </div>
                                      ) : (
                                        <div className="mt-2 flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            Required: {outcomeCompliance.requiredLevel}
                                          </Badge>
                                          {outcomeCompliance.hasFailed && (
                                            <Badge variant="destructive" className="text-xs">
                                              Failed - Negative Indicator Present
                                            </Badge>
                                          )}
                                          <span className="text-xs text-muted-foreground">
                                            {outcomeCompliance.compliant}/{outcomeCompliance.total} requirements met
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {outcomeCompliance.answered === 0 ? (
                                      <Badge variant="secondary" className="text-sm">Not complete</Badge>
                                    ) : (
                                      <div className="flex items-center gap-2 ml-4">
                                        {getComplianceIcon(outcomeCompliance.percentage)}
                                        <span className={`text-lg font-bold ${getComplianceColor(outcomeCompliance.percentage)}`}>
                                          {outcomeCompliance.percentage}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                 {outcomeCompliance.answered > 0 && (
                                    <div className="space-y-2">
                                      {narrative ? (
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-semibold text-muted-foreground">Compliance Narrative</h5>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
                                                const govAssureProfile = assessmentDoc?.gov_assure_profile;
                                                const requiredLevel = govAssureProfile === "Enhanced" 
                                                  ? profileData?.enhancedProfile 
                                                  : profileData?.baselineProfile;
                                                
                                                const sectionType = requiredLevel === "Achieved" ? "achieved" : requiredLevel === "Partially Achieved" ? "partial" : null;
                                                
                                                const primaryQuestions = sectionType 
                                                  ? CAF_ASSESSMENT_QUESTIONS.filter(
                                                      q => q.outcomeId === outcome.id && q.section === sectionType
                                                    )
                                                  : [];

                                                const negativeQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
                                                  q => q.outcomeId === outcome.id && q.section === "negative"
                                                );
                                                
                                                const allQuestions = [...negativeQuestions, ...primaryQuestions];
                                                
                                                const assessmentData = allQuestions.map(q => ({
                                                  questionText: q.question,
                                                  response: responses?.find(r => r.question_id === q.id)?.response ?? null,
                                                  isNegativeIndicator: q.isNegative,
                                                  evidence: getQuestionEvidence(q.id),
                                                }));
                                                
                                                generateNarrative.mutate({
                                                  outcomeId: outcome.id,
                                                  outcomeName: outcome.name,
                                                  outcomeDescription: outcome.description,
                                                  assessmentData,
                                                });
                                              }}
                                              disabled={isGenerating}
                                            >
                                              {isGenerating ? (
                                                <>
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                  Regenerating...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles className="h-3 w-3 mr-1" />
                                                  Regenerate
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                          <div className="p-3 bg-muted/50 rounded-md">
                                            <p className="text-sm leading-relaxed">{narrative}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const profileData = govAssureProfiles.find(p => p.outcomeNumber === outcome.id);
                                            const govAssureProfile = assessmentDoc?.gov_assure_profile;
                                            const requiredLevel = govAssureProfile === "Enhanced" 
                                              ? profileData?.enhancedProfile 
                                              : profileData?.baselineProfile;
                                            
                                            const sectionType = requiredLevel === "Achieved" ? "achieved" : requiredLevel === "Partially Achieved" ? "partial" : null;
                                            
                                            const primaryQuestions = sectionType 
                                              ? CAF_ASSESSMENT_QUESTIONS.filter(
                                                  q => q.outcomeId === outcome.id && q.section === sectionType
                                                )
                                              : [];

                                            const negativeQuestions = CAF_ASSESSMENT_QUESTIONS.filter(
                                              q => q.outcomeId === outcome.id && q.section === "negative"
                                            );
                                            
                                            const allQuestions = [...negativeQuestions, ...primaryQuestions];
                                            
                                            const assessmentData = allQuestions.map(q => ({
                                              questionText: q.question,
                                              response: responses?.find(r => r.question_id === q.id)?.response ?? null,
                                              isNegativeIndicator: q.isNegative,
                                              evidence: getQuestionEvidence(q.id),
                                            }));
                                            
                                            generateNarrative.mutate({
                                              outcomeId: outcome.id,
                                              outcomeName: outcome.name,
                                              outcomeDescription: outcome.description,
                                              assessmentData,
                                            });
                                          }}
                                          disabled={isGenerating}
                                        >
                                          {isGenerating ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="h-4 w-4 mr-2" />
                                              Generate Compliance Narrative
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
