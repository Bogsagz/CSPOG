import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Download, Upload, FileText, CheckCircle2, ExternalLink, Link as LinkIcon, X, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRequirements, Requirement } from "@/hooks/useRequirements";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { useRequirementsRepository } from "@/hooks/useRequirementsRepository";
import { useRequirementLinks } from "@/hooks/useRequirementLinks";
import { CAF_FRAMEWORK } from "@/lib/cafFramework";
import { govAssureProfiles } from "@/lib/cafGovAssureProfiles";
import { CAF_ASSESSMENT_QUESTIONS } from "@/lib/cafAssessment";

export default function RequirementsTools() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { requirements, isLoading, createRequirement, updateRequirement, deleteRequirement } =
    useRequirements(projectId!);
  const { assessmentDoc } = useProjectAssessmentDocumentation(projectId!);
  const { requirements: repoRequirements, isLoading: repoLoading, createRequirement: createRepoRequirement, updateRequirement: updateRepoRequirement, deleteRequirement: deleteRepoRequirement } = useRequirementsRepository();
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const { linkedRequirements, linkRequirement, unlinkRequirement } = useRequirementLinks(selectedRequirementId);

  // CAF Builder state
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [expandedPrinciples, setExpandedPrinciples] = useState<string[]>([]);
  const [builderForm, setBuilderForm] = useState({
    name: "",
    description: "",
  });

  // Builder state - for Requirements Builder tab
  const [selectedRepoRequirementId, setSelectedRepoRequirementId] = useState<string>("");
  const [reqBuilderForm, setReqBuilderForm] = useState({
    relevance_description: "",
  });

  // Editor state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    type: "",
    priority: "",
    status: "",
    source: "",
  });

  // Repository state
  const [addRepoReqDialogOpen, setAddRepoReqDialogOpen] = useState(false);
  const [editRepoReqDialogOpen, setEditRepoReqDialogOpen] = useState(false);
  const [editingRepoRequirement, setEditingRepoRequirement] = useState<any | null>(null);
  const [reqBuilderDialogOpen, setReqBuilderDialogOpen] = useState(false);
  const [newRepoReqForm, setNewRepoReqForm] = useState({
    name: "",
    category: "",
    description: "",
    reference_url: "",
  });
  const [editRepoReqForm, setEditRepoReqForm] = useState({
    name: "",
    category: "",
    description: "",
    reference_url: "",
  });
  const [repoFilter, setRepoFilter] = useState<string>("all");

  // Get current outcome details
  const getCurrentOutcome = () => {
    if (!selectedOutcome) return null;
    for (const obj of CAF_FRAMEWORK) {
      for (const principle of obj.principles) {
        const outcome = principle.outcomes.find(o => o.id === selectedOutcome);
        if (outcome) return { 
          ...outcome, 
          principleName: principle.name,
          principleId: principle.id,
          objective: obj.title 
        };
      }
    }
    return null;
  };

  // Calculate completion stats
  const getCompletionStats = () => {
    const stats = CAF_FRAMEWORK.map(obj => ({
      objective: obj.objective,
      title: obj.title,
      principles: obj.principles.map(p => ({
        ...p,
        outcomes: p.outcomes.map(o => ({
          ...o,
          count: requirements.filter(r => r.source === o.id).length
        }))
      }))
    }));
    
    const totalOutcomes = CAF_FRAMEWORK.reduce((acc, obj) => 
      acc + obj.principles.reduce((pAcc, p) => pAcc + p.outcomes.length, 0), 0
    );
    
    const completedOutcomes = stats.reduce((acc, obj) => 
      acc + obj.principles.reduce((pAcc, p) => 
        pAcc + p.outcomes.filter(o => o.count > 0).length, 0
      ), 0
    );
    
    return { 
      stats, 
      totalOutcomes, 
      completedOutcomes, 
      percentage: Math.round((completedOutcomes / totalOutcomes) * 100) 
    };
  };

  // Get completion status for outcome color coding
  const getOutcomeCompletionStatus = (outcomeId: string): "complete" | "partial" | "none" => {
    const reqCount = requirements.filter(r => r.source === outcomeId).length;
    if (reqCount >= 3) return "complete";
    if (reqCount > 0) return "partial";
    return "none";
  };

  const completionStats = getCompletionStats();
  const currentOutcome = getCurrentOutcome();

  const togglePrinciple = (principleId: string) => {
    setExpandedPrinciples(prev => 
      prev.includes(principleId) 
        ? prev.filter(id => id !== principleId)
        : [...prev, principleId]
    );
  };

  const handleBuilderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) return;
    
    await createRequirement.mutateAsync({
      project_id: projectId!,
      type: "Security",
      source: selectedOutcome,
      priority: "Medium",
      status: "Draft",
      ...builderForm,
    });
    setBuilderForm({
      name: "",
      description: "",
    });
  };

  const handleEditClick = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setEditForm({
      name: requirement.name,
      description: requirement.description || "",
      type: requirement.type || "",
      priority: requirement.priority || "",
      status: requirement.status || "",
      source: requirement.source || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingRequirement) return;
    await updateRequirement.mutateAsync({
      id: editingRequirement.id,
      ...editForm,
    });
    setEditDialogOpen(false);
    setEditingRequirement(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this requirement?")) {
      await deleteRequirement.mutateAsync(id);
    }
  };

  const downloadExampleCSV = () => {
    const headers = ["name", "description", "type", "priority", "status", "source"];
    const exampleRow = ["Example Requirement", "This is an example requirement", "Security", "High", "Draft", "A1"];
    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "requirements_example.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!requirements.length) {
      toast({
        title: "No data",
        description: "No requirements to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["name", "description", "type", "priority", "status", "source"];
    const rows = requirements.map((req) => [
      req.name,
      req.description || "",
      req.type || "",
      req.priority || "",
      req.status || "",
      req.source || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requirements_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Requirements exported successfully",
    });
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file is empty or invalid",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        
        const requirement: any = {
          project_id: projectId!,
        };

        headers.forEach((header, index) => {
          if (values[index]) {
            requirement[header] = values[index];
          }
        });

        if (!requirement.name) {
          errorCount++;
          continue;
        }

        try {
          await createRequirement.mutateAsync(requirement);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} requirements. ${errorCount} errors.`,
      });
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReqBuilderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedReq = repoRequirements.find(r => r.id === selectedRepoRequirementId);
    if (!selectedReq) {
      toast({
        title: "Error",
        description: "Please select a requirement",
        variant: "destructive",
      });
      return;
    }

    await createRequirement.mutateAsync({
      project_id: projectId!,
      name: selectedReq.name,
      description: reqBuilderForm.relevance_description,
      type: "Security",
      priority: "Medium",
      status: "Draft",
      source: selectedReq.category || "",
    } as any);
    
    setSelectedRepoRequirementId("");
    setReqBuilderForm({
      relevance_description: "",
    });
    setReqBuilderDialogOpen(false);
  };

  const handleAddRepoRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    createRepoRequirement({ ...newRepoReqForm, requirement_type: 'security' });
    setNewRepoReqForm({
      name: "",
      category: "",
      description: "",
      reference_url: "",
    });
    setAddRepoReqDialogOpen(false);
  };

  const handleEditRepoRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepoRequirement) return;
    updateRepoRequirement({
      id: editingRepoRequirement.id,
      ...editRepoReqForm,
    });
    setEditRepoReqDialogOpen(false);
    setEditingRepoRequirement(null);
  };

  const filteredRepoRequirements = repoRequirements.filter(req => 
    repoFilter === "all" || req.category === repoFilter
  );

  const categories = Array.from(new Set(repoRequirements.map(r => r.category).filter(Boolean))) as string[];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-2">NCSC CAF Requirements Builder</h2>
          <p className="text-muted-foreground">
            Generate security requirements aligned with NCSC Cyber Assessment Framework
          </p>
        </div>
        {assessmentDoc?.gov_assure_profile && (
          <Badge variant="secondary" className="text-sm">
            {assessmentDoc.gov_assure_profile} Profile
          </Badge>
        )}
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder">Project Requirements</TabsTrigger>
          <TabsTrigger value="overview">CAF Coverage</TabsTrigger>
          <TabsTrigger value="repository">Requirements Repository</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="repository">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Requirements Repository</CardTitle>
                  <CardDescription>
                    Central repository of reusable requirement templates and standards
                  </CardDescription>
                </div>
                <Button onClick={() => setAddRepoReqDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={repoFilter} onValueChange={setRepoFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {repoLoading ? (
                <div>Loading requirements...</div>
              ) : (
                <div className="space-y-2">
                  {categories.map(category => {
                    const categoryReqs = filteredRepoRequirements.filter(r => r.category === category);
                    if (categoryReqs.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
                        <div className="space-y-1">
                          {categoryReqs.map(req => (
                            <div
                              key={req.id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{req.name}</h4>
                                </div>
                                {req.description && (
                                  <p className="text-sm text-muted-foreground">{req.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingRepoRequirement(req);
                                      setEditRepoReqForm({
                                        name: req.name,
                                        category: req.category || "",
                                        description: req.description || "",
                                        reference_url: req.reference_url || "",
                                      });
                                      setEditRepoReqDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                {req.reference_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(req.reference_url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="builder">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Panel - CAF Structure */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>CAF Outcomes</CardTitle>
                <CardDescription>Select an outcome to define requirements</CardDescription>
                <div className="pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-semibold">
                      {completionStats.completedOutcomes}/{completionStats.totalOutcomes}
                    </span>
                  </div>
                  <Progress
                    value={completionStats.percentage}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {CAF_FRAMEWORK.map((objective) => (
                  <div key={objective.objective} className="space-y-2">
                    <h3 className="font-semibold text-sm">
                      Objective {objective.objective}: {objective.title}
                    </h3>
                    <div className="space-y-1">
                      {objective.principles.map((principle) => {
                        const isExpanded = expandedPrinciples.includes(principle.id);
                        const principleReqCount = principle.outcomes.reduce((acc, o) => 
                          acc + requirements.filter(r => r.source === o.id).length, 0
                        );
                        
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
                              <div className="flex items-center gap-2">
                                {principleReqCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {principleReqCount}
                                  </Badge>
                                )}
                                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                              </div>
                            </Button>
                            
                            {isExpanded && (
                              <div className="ml-4 space-y-1">
                                {principle.outcomes.map((outcome) => {
                                  const outcomeReqCount = requirements.filter(r => r.source === outcome.id).length;
                                  const isSelected = selectedOutcome === outcome.id;
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
                                        completionStatus === "complete" 
                                          ? "bg-green-100 hover:bg-green-200 border-green-500 dark:bg-green-900/30 dark:hover:bg-green-900/50" 
                                          : completionStatus === "partial" 
                                          ? "bg-yellow-100 hover:bg-yellow-200 border-yellow-500 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50" 
                                          : ""
                                      }`}
                                      onClick={() => setSelectedOutcome(outcome.id)}
                                    >
                                      <span className="text-xs">
                                        {outcome.id}: {outcome.name}
                                      </span>
                                      {outcomeReqCount > 0 && (
                                        <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
                                          {outcomeReqCount}
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
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Right Panel - Requirement Builder */}
            <Card className="col-span-2">
              {selectedOutcome && currentOutcome ? (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{currentOutcome.principleId}</Badge>
                          <span className="text-sm text-muted-foreground">{currentOutcome.principleName}</span>
                        </div>
                        <CardTitle>{currentOutcome.id}: {currentOutcome.name}</CardTitle>
                        <CardDescription>
                          {currentOutcome.description}
                        </CardDescription>
                        <Badge variant="secondary" className="mt-2">
                          {currentOutcome.objective}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {currentOutcome.evidence && currentOutcome.evidence.length > 0 && (
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Evidence Requirements for Critical Systems
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          The following evidence may be required to demonstrate compliance with this outcome:
                        </p>
                        <ul className="space-y-2 text-sm">
                          {currentOutcome.evidence.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Achievement Level Statements Section */}
                    {(() => {
                      const profileData = govAssureProfiles.find(p => p.outcomeNumber === currentOutcome.id);
                      if (!profileData) return null;
                      
                      const govAssureProfile = assessmentDoc?.gov_assure_profile;
                      const requiredLevel = govAssureProfile === "Enhanced" 
                        ? profileData.enhancedProfile 
                        : profileData.baselineProfile;
                      
                      // Map the required level to the section type
                      const sectionType = requiredLevel === "Achieved" ? "achieved" : "partial";
                      
                      // Get the relevant statements for this outcome
                      const statements = CAF_ASSESSMENT_QUESTIONS.filter(
                        q => q.outcomeId === currentOutcome.id && q.section === sectionType
                      );
                      
                      if (statements.length === 0) return null;
                      
                      return (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {requiredLevel} Level Indicators
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Statements demonstrating {requiredLevel.toLowerCase()} compliance for {govAssureProfile || "Baseline"} profile:
                          </p>
                          <ul className="space-y-2 text-sm">
                            {statements.map((statement) => (
                              <li key={statement.id} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span className="flex-1">{statement.question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                    
                    <form onSubmit={handleBuilderSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Security Requirement *</Label>
                        <Select
                          value={builderForm.name}
                          onValueChange={(value) =>
                            setBuilderForm({ ...builderForm, name: value })
                          }
                          required
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select a security requirement type..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="Access Control">Access Control</SelectItem>
                            <SelectItem value="Authentication">Authentication</SelectItem>
                            <SelectItem value="Authorisation">Authorisation</SelectItem>
                            <SelectItem value="Data Protection">Data Protection</SelectItem>
                            <SelectItem value="Encryption">Encryption</SelectItem>
                            <SelectItem value="Logging and Monitoring">Logging and Monitoring</SelectItem>
                            <SelectItem value="Network Security">Network Security</SelectItem>
                            <SelectItem value="Vulnerability Management">Vulnerability Management</SelectItem>
                            <SelectItem value="Incident Response">Incident Response</SelectItem>
                            <SelectItem value="Backup and Recovery">Backup and Recovery</SelectItem>
                            <SelectItem value="Configuration Management">Configuration Management</SelectItem>
                            <SelectItem value="Patch Management">Patch Management</SelectItem>
                            <SelectItem value="Security Testing">Security Testing</SelectItem>
                            <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
                            <SelectItem value="Security Awareness Training">Security Awareness Training</SelectItem>
                            <SelectItem value="Third-Party Security">Third-Party Security</SelectItem>
                            <SelectItem value="Physical Security">Physical Security</SelectItem>
                            <SelectItem value="Business Continuity">Business Continuity</SelectItem>
                            <SelectItem value="Privacy Protection">Privacy Protection</SelectItem>
                            <SelectItem value="Compliance Monitoring">Compliance Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Implementation Details</Label>
                        <Textarea
                          id="description"
                          value={builderForm.description}
                          onChange={(e) =>
                            setBuilderForm({ ...builderForm, description: e.target.value })
                          }
                          placeholder="Describe how this requirement will be implemented and verified"
                          rows={4}
                        />
                      </div>

                      <div className="pt-4 space-y-4">
                        <Button type="submit" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Requirement
                        </Button>

                        {/* Show existing requirements for this outcome */}
                        {requirements.filter(r => r.source === selectedOutcome).length > 0 && (
                          <div className="border rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-sm">Existing Requirements ({requirements.filter(r => r.source === selectedOutcome).length})</h4>
                            {requirements.filter(r => r.source === selectedOutcome).map((req) => (
                              <div key={req.id} className="text-sm p-2 bg-muted rounded flex items-center justify-between">
                                <span>{req.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-96 text-center">
                  <div>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Select a CAF Outcome</h3>
                    <p className="text-sm text-muted-foreground">
                      Expand a principle and choose an outcome from the left to start defining security requirements
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CAF Coverage Overview</CardTitle>
                  <CardDescription>Track your progress across all CAF outcomes</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{completionStats.percentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {completionStats.completedOutcomes} of {completionStats.totalOutcomes} outcomes covered
                  </div>
                </div>
              </div>
              <Progress value={completionStats.percentage} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              {completionStats.stats.map((objective) => (
                <div key={objective.objective} className="space-y-3">
                  <h3 className="font-semibold">
                    Objective {objective.objective}: {objective.title}
                  </h3>
                  <div className="grid gap-3">
                    {objective.principles.map((principle) => (
                      <div key={principle.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{principle.id}: {principle.name}</div>
                          <Badge variant="outline">
                            {principle.outcomes.filter(o => o.count > 0).length} / {principle.outcomes.length} outcomes
                          </Badge>
                        </div>
                        <div className="ml-4 space-y-2">
                          {principle.outcomes.map((outcome) => (
                            <div key={outcome.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center gap-3">
                                {outcome.count > 0 ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                )}
                                <div>
                                  <div className="text-sm font-medium">{outcome.id}: {outcome.name}</div>
                                  <div className="text-xs text-muted-foreground">{outcome.description}</div>
                                </div>
                              </div>
                              <Badge variant={outcome.count > 0 ? "default" : "outline"} className="ml-2">
                                {outcome.count} req{outcome.count !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Requirements</CardTitle>
                <CardDescription>
                  Download all requirements as a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExportCSV} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Requirements</CardTitle>
                <CardDescription>
                  Upload a CSV file to bulk import requirements. Use CAF principle IDs (A1, A2, B1, etc.) in the source column.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Required column: name. Optional: description, type, priority, status, source (CAF principle ID)
                </p>
                <div className="flex gap-2">
                  <Input
                    id="requirement-csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <Button onClick={() => document.getElementById('requirement-csv-upload')?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import from CSV
                  </Button>
                  <Button variant="outline" onClick={downloadExampleCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Example CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Requirement</DialogTitle>
            <DialogDescription>
              Update the requirement details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Functional">Functional</SelectItem>
                    <SelectItem value="Non-Functional">Non-Functional</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Implemented">Implemented</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-source">CAF Principle</Label>
                <Select
                  value={editForm.source}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select principle" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAF_FRAMEWORK.map((obj) =>
                      obj.principles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.id}: {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Repository Requirement Dialog */}
      <Dialog open={addRepoReqDialogOpen} onOpenChange={setAddRepoReqDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Requirement to Repository</DialogTitle>
            <DialogDescription>
              Add a reusable requirement template to the central repository
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRepoRequirement}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-name">Requirement Name *</Label>
                <Input
                  id="repo-name"
                  value={newRepoReqForm.name}
                  onChange={(e) => setNewRepoReqForm({ ...newRepoReqForm, name: e.target.value })}
                  placeholder="e.g., Multi-Factor Authentication"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-category">Category *</Label>
                <Input
                  id="repo-category"
                  value={newRepoReqForm.category}
                  onChange={(e) => setNewRepoReqForm({ ...newRepoReqForm, category: e.target.value })}
                  placeholder="e.g., Authentication, Network Security"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-description">Description</Label>
                <Textarea
                  id="repo-description"
                  value={newRepoReqForm.description}
                  onChange={(e) => setNewRepoReqForm({ ...newRepoReqForm, description: e.target.value })}
                  placeholder="Describe the requirement template..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-url">Reference URL</Label>
                <Input
                  id="repo-url"
                  type="url"
                  value={newRepoReqForm.reference_url}
                  onChange={(e) => setNewRepoReqForm({ ...newRepoReqForm, reference_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAddRepoReqDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add to Repository</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Requirements Builder Dialog */}
      <Dialog open={reqBuilderDialogOpen} onOpenChange={setReqBuilderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Requirement</DialogTitle>
            <DialogDescription>
              Select a requirement template from the repository and explain its relevance to your project
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReqBuilderSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="requirement-select">Select Requirement Template *</Label>
              <Select value={selectedRepoRequirementId} onValueChange={setSelectedRepoRequirementId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a requirement template" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover z-50">
                  {categories.map(category => {
                    const categoryReqs = repoRequirements.filter(r => r.category === category);
                    return (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {category}
                        </div>
                        {categoryReqs.map(req => (
                          <SelectItem key={req.id} value={req.id}>
                            <span>{req.name}</span>
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedRepoRequirementId && (
                <div className="mt-2 p-3 rounded-lg border bg-accent/50">
                  {(() => {
                    const req = repoRequirements.find(r => r.id === selectedRepoRequirementId);
                    return req ? (
                      <div className="space-y-2">
                        {req.category && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">{req.category}</span>
                          </div>
                        )}
                        {req.description && (
                          <p className="text-sm">{req.description}</p>
                        )}
                        {req.reference_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(req.reference_url, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            View Reference
                          </Button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="req-relevance">Relevance to Project *</Label>
              <Textarea
                id="req-relevance"
                value={reqBuilderForm.relevance_description}
                onChange={(e) => setReqBuilderForm({ ...reqBuilderForm, relevance_description: e.target.value })}
                placeholder="Explain why this requirement is relevant to your project and how it should be implemented..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReqBuilderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedRepoRequirementId}>
                Create Requirement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Repository Requirement Dialog */}
      <Dialog open={editRepoReqDialogOpen} onOpenChange={setEditRepoReqDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Requirement</DialogTitle>
            <DialogDescription>
              Update the requirement template details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRepoRequirement}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-repo-name">Requirement Name *</Label>
                <Input
                  id="edit-repo-name"
                  value={editRepoReqForm.name}
                  onChange={(e) => setEditRepoReqForm({ ...editRepoReqForm, name: e.target.value })}
                  placeholder="e.g., Multi-Factor Authentication"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-repo-category">Category *</Label>
                <Input
                  id="edit-repo-category"
                  value={editRepoReqForm.category}
                  onChange={(e) => setEditRepoReqForm({ ...editRepoReqForm, category: e.target.value })}
                  placeholder="e.g., Authentication, Network Security"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-repo-description">Description</Label>
                <Textarea
                  id="edit-repo-description"
                  value={editRepoReqForm.description}
                  onChange={(e) => setEditRepoReqForm({ ...editRepoReqForm, description: e.target.value })}
                  placeholder="Describe the requirement template..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-repo-url">Reference URL</Label>
                <Input
                  id="edit-repo-url"
                  type="url"
                  value={editRepoReqForm.reference_url}
                  onChange={(e) => setEditRepoReqForm({ ...editRepoReqForm, reference_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditRepoReqDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
