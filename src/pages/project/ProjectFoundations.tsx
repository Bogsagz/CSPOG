import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectKeyPeople, ROLE_LABELS, KeyPersonRole } from "@/hooks/useProjectKeyPeople";
import { useProjectSecurityScope } from "@/hooks/useProjectSecurityScope";
import { useProjectAssessmentDocumentation } from "@/hooks/useProjectAssessmentDocumentation";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useAuth } from "@/hooks/useAuth";
import { RiskAppetiteCapture } from "@/components/RiskAppetiteCapture";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const KEY_ROLES: KeyPersonRole[] = [
  "delivery_manager",
  "cyber_risk_owner",
  "deputy_cyber_risk_owner",
  "second_line_assurer",
  "technical_architect",
];

export default function ProjectFoundations() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { keyPeople, isLoading, createOrUpdateKeyPerson, deleteKeyPerson } = useProjectKeyPeople(projectId || "");
  const { securityScope, isLoading: scopeLoading, updateSecurityScope } = useProjectSecurityScope(projectId || "");
  const { assessmentDoc, isLoading: assessmentLoading, updateAssessmentDoc } = useProjectAssessmentDocumentation(projectId || "");
  const { permissions, isLoading: permissionsLoading } = useProjectPermissions(projectId || null, user?.id || null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    const sections: DocumentSection[] = [
      {
        heading: "Project Foundations",
        content: "This document captures the foundational information for the project including key personnel, security scope, assessment documentation, and risk appetite.",
        level: HeadingLevel.HEADING_1,
      },
    ];

    // Key People section
    if (keyPeople.length > 0) {
      sections.push({
        heading: "Key People",
        content: "",
        level: HeadingLevel.HEADING_2,
      });
      keyPeople.forEach((person) => {
        sections.push({
          heading: ROLE_LABELS[person.role_type as KeyPersonRole] || person.role_type,
          content: [
            `Name: ${person.first_name} ${person.last_name}`,
            `Email: ${person.email}`,
            ...(person.grade ? [`Grade: ${person.grade}`] : []),
          ],
          level: HeadingLevel.HEADING_3,
        });
      });
    }

    // Security Scope section
    sections.push({
      heading: "Security Scope",
      content: "",
      level: HeadingLevel.HEADING_2,
    });
    sections.push({
      heading: "Third-Party Providers",
      content: securityScope?.uses_third_party_providers 
        ? (securityScope.third_party_providers_details || "Yes, details to be provided")
        : "No",
      level: HeadingLevel.HEADING_3,
    });
    sections.push({
      heading: "Intellectual Property",
      content: securityScope?.uses_intellectual_property
        ? (securityScope.intellectual_property_details || "Yes, details to be provided")
        : "No",
      level: HeadingLevel.HEADING_3,
    });
    sections.push({
      heading: "Data Sharing",
      content: securityScope?.requires_data_sharing
        ? (securityScope.data_sharing_details || "Yes, details to be provided")
        : "No",
      level: HeadingLevel.HEADING_3,
    });

    return sections;
  };

  const [forms, setForms] = useState<Record<KeyPersonRole, {
    first_name: string;
    last_name: string;
    grade: string;
    email: string;
  }>>(() => {
    const initialForms = {} as any;
    KEY_ROLES.forEach(role => {
      const existing = keyPeople.find(p => p.role_type === role);
      initialForms[role] = {
        first_name: existing?.first_name || "",
        last_name: existing?.last_name || "",
        grade: existing?.grade || "",
        email: existing?.email || "",
      };
    });
    return initialForms;
  });

  const handleInputChange = (role: KeyPersonRole, field: string, value: string) => {
    setForms(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  const handleSave = (role: KeyPersonRole) => {
    const form = forms[role];
    if (!form.first_name || !form.last_name || !form.email) {
      return;
    }

    createOrUpdateKeyPerson.mutate({
      project_id: projectId!,
      role_type: role,
      first_name: form.first_name,
      last_name: form.last_name,
      grade: form.grade || null,
      email: form.email,
    });
  };

  const handleDelete = (role: KeyPersonRole) => {
    const person = keyPeople.find(p => p.role_type === role);
    if (person) {
      deleteKeyPerson.mutate(person.id);
      setForms(prev => ({
        ...prev,
        [role]: {
          first_name: "",
          last_name: "",
          grade: "",
          email: "",
        },
      }));
    }
  };

  // Update forms when data loads
  if (!isLoading && keyPeople.length > 0) {
    const shouldUpdate = KEY_ROLES.some(role => {
      const existing = keyPeople.find(p => p.role_type === role);
      return existing && forms[role].first_name === "" && existing.first_name !== "";
    });

    if (shouldUpdate) {
      const updatedForms = { ...forms };
      KEY_ROLES.forEach(role => {
        const existing = keyPeople.find(p => p.role_type === role);
        if (existing && forms[role].first_name === "") {
          updatedForms[role] = {
            first_name: existing.first_name,
            last_name: existing.last_name,
            grade: existing.grade || "",
            email: existing.email,
          };
        }
      });
      setForms(updatedForms);
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Project Foundations</h2>
          <p className="text-muted-foreground">
            Capture key project information and team details
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="project-foundations"
            artefactName="Project Foundations"
            generateContent={generateContent}
          />
        )}
      </div>

      <Tabs defaultValue="key-people" className="w-full">
        <TabsList>
          <TabsTrigger value="key-people">Key People</TabsTrigger>
          <TabsTrigger value="security-scope">Security Scope</TabsTrigger>
          <TabsTrigger value="assessment-documentation">Assessment Documentation</TabsTrigger>
          <TabsTrigger value="risk-appetite">Risk Appetite</TabsTrigger>
        </TabsList>

        <TabsContent value="key-people" className="space-y-6">
          {KEY_ROLES.map((role) => {
            const person = keyPeople.find(p => p.role_type === role);
            const form = forms[role];

            return (
              <Card key={role}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ROLE_LABELS[role]}</CardTitle>
                      <CardDescription>
                        Enter details for the {ROLE_LABELS[role].toLowerCase()}
                      </CardDescription>
                    </div>
                    {person && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${role}-first-name`}>First Name</Label>
                      <Input
                        id={`${role}-first-name`}
                        value={form.first_name}
                        onChange={(e) => handleInputChange(role, "first_name", e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${role}-last-name`}>Last Name</Label>
                      <Input
                        id={`${role}-last-name`}
                        value={form.last_name}
                        onChange={(e) => handleInputChange(role, "last_name", e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${role}-grade`}>Grade</Label>
                      <Input
                        id={`${role}-grade`}
                        value={form.grade}
                        onChange={(e) => handleInputChange(role, "grade", e.target.value)}
                        placeholder="Enter grade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${role}-email`}>Email</Label>
                      <Input
                        id={`${role}-email`}
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange(role, "email", e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => handleSave(role)}
                      disabled={!form.first_name || !form.last_name || !form.email}
                    >
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="security-scope" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Providers</CardTitle>
              <CardDescription>
                Will the project link with or use 3rd party providers?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={securityScope?.uses_third_party_providers === true ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ uses_third_party_providers: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={securityScope?.uses_third_party_providers === false ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ 
                    uses_third_party_providers: false,
                    third_party_providers_details: null
                  })}
                >
                  No
                </Button>
              </div>

              {securityScope?.uses_third_party_providers && (
                <div className="space-y-2">
                  <Label htmlFor="third-party-details">Provide Details</Label>
                  <Textarea
                    id="third-party-details"
                    value={securityScope?.third_party_providers_details || ""}
                    onChange={(e) => updateSecurityScope.mutate({ third_party_providers_details: e.target.value })}
                    placeholder="Enter details about third-party providers"
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
              <CardDescription>
                Will the project use any Intellectual Property?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={securityScope?.uses_intellectual_property === true ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ uses_intellectual_property: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={securityScope?.uses_intellectual_property === false ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ 
                    uses_intellectual_property: false,
                    intellectual_property_details: null
                  })}
                >
                  No
                </Button>
              </div>

              {securityScope?.uses_intellectual_property && (
                <div className="space-y-2">
                  <Label htmlFor="ip-details">Provide Details</Label>
                  <Textarea
                    id="ip-details"
                    value={securityScope?.intellectual_property_details || ""}
                    onChange={(e) => updateSecurityScope.mutate({ intellectual_property_details: e.target.value })}
                    placeholder="Enter details about intellectual property usage"
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sharing</CardTitle>
              <CardDescription>
                Will there be a requirement to share data with a 3rd party?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={securityScope?.requires_data_sharing === true ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ requires_data_sharing: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={securityScope?.requires_data_sharing === false ? "default" : "outline"}
                  onClick={() => updateSecurityScope.mutate({ 
                    requires_data_sharing: false,
                    data_sharing_details: null
                  })}
                >
                  No
                </Button>
              </div>

              {securityScope?.requires_data_sharing && (
                <div className="space-y-2">
                  <Label htmlFor="data-sharing-details">Provide Details</Label>
                  <Textarea
                    id="data-sharing-details"
                    value={securityScope?.data_sharing_details || ""}
                    onChange={(e) => updateSecurityScope.mutate({ data_sharing_details: e.target.value })}
                    placeholder="Enter details about data sharing requirements"
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment-documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Impact Assessment (BIA)</CardTitle>
              <CardDescription>
                Has the BIA been completed?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={assessmentDoc?.bia_completed === true ? "default" : "outline"}
                  onClick={() => updateAssessmentDoc.mutate({ bia_completed: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={assessmentDoc?.bia_completed === false ? "default" : "outline"}
                  onClick={() => updateAssessmentDoc.mutate({ 
                    bia_completed: false,
                    bia_link: null,
                    gov_assure_profile: null
                  })}
                >
                  No
                </Button>
              </div>

              {assessmentDoc?.bia_completed && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bia-link">Link to the BIA</Label>
                    <Input
                      id="bia-link"
                      type="url"
                      value={assessmentDoc?.bia_link || ""}
                      onChange={(e) => updateAssessmentDoc.mutate({ bia_link: e.target.value })}
                      placeholder="Enter BIA link"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>What Gov Assure Profile is recommended?</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={assessmentDoc?.gov_assure_profile === "Baseline" ? "default" : "outline"}
                        onClick={() => updateAssessmentDoc.mutate({ gov_assure_profile: "Baseline" })}
                      >
                        Baseline
                      </Button>
                      <Button
                        variant={assessmentDoc?.gov_assure_profile === "Enhanced" ? "default" : "outline"}
                        onClick={() => updateAssessmentDoc.mutate({ gov_assure_profile: "Enhanced" })}
                      >
                        Enhanced
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Protection Impact Assessment (DPIA)</CardTitle>
              <CardDescription>
                Has a DPIA been created?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={assessmentDoc?.dpia_created === true ? "default" : "outline"}
                  onClick={() => updateAssessmentDoc.mutate({ dpia_created: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={assessmentDoc?.dpia_created === false ? "default" : "outline"}
                  onClick={() => updateAssessmentDoc.mutate({ 
                    dpia_created: false,
                    dpia_link: null
                  })}
                >
                  No
                </Button>
              </div>

              {assessmentDoc?.dpia_created && (
                <div className="space-y-2">
                  <Label htmlFor="dpia-link">Link to the DPIA</Label>
                  <Input
                    id="dpia-link"
                    type="url"
                    value={assessmentDoc?.dpia_link || ""}
                    onChange={(e) => updateAssessmentDoc.mutate({ dpia_link: e.target.value })}
                    placeholder="Enter DPIA link"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-appetite">
          <RiskAppetiteCapture 
            projectId={projectId || null} 
            canWrite={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
