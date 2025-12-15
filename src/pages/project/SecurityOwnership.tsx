import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectKeyPeople, ROLE_LABELS, KeyPersonRole } from "@/hooks/useProjectKeyPeople";
import { UserCheck, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const KEY_ROLES: KeyPersonRole[] = [
  "delivery_manager",
  "cyber_risk_owner",
  "deputy_cyber_risk_owner",
  "second_line_assurer",
  "technical_architect",
];

const SecurityOwnership = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { keyPeople, isLoading: isPeopleLoading } = useProjectKeyPeople(projectId || "");

  const { data: project, isLoading: isProjectLoading } = useQuery({
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

  const isLoading = isPeopleLoading || isProjectLoading;

  const getRoleNarrative = (role: KeyPersonRole): string | null => {
    const person = keyPeople.find(p => p.role_type === role);
    if (!person) return null;

    const fullName = `${person.first_name} ${person.last_name}`;
    const gradeInfo = person.grade ? ` (${person.grade})` : "";
    const projectName = project?.title || "this project";

    switch (role) {
      case "cyber_risk_owner":
        return `Within ${projectName}, the Cyber Risk Owner is ${fullName}${gradeInfo}. They are responsible for making risk-based decisions and accepting residual risks on behalf of the organisation. They can be contacted at ${person.email}.`;
      
      case "deputy_cyber_risk_owner":
        return `The Deputy Cyber Risk Owner for ${projectName} is ${fullName}${gradeInfo}. They support the Cyber Risk Owner and can make risk decisions in their absence. They can be reached at ${person.email}.`;
      
      case "delivery_manager":
        return `${fullName}${gradeInfo} serves as the Delivery Manager for ${projectName}. They are accountable for ensuring security requirements are integrated into project delivery and that the team follows security governance processes. Contact: ${person.email}.`;
      
      case "second_line_assurer":
        return `The 2nd Line Assurer for ${projectName} is ${fullName}${gradeInfo}. They provide independent oversight and assurance of cyber security activities, ensuring compliance with organisational standards and frameworks. They can be contacted at ${person.email}.`;
      
      case "technical_architect":
        return `${fullName}${gradeInfo} is the Technical Architect for ${projectName}. They are responsible for the technical design and ensuring security is embedded into the system architecture from the outset. Contact: ${person.email}.`;
      
      default:
        return null;
    }
  };

  if (!projectId) {
    return <div>Project ID not found</div>;
  }

  const hasAnyPeople = keyPeople.length > 0;
  const narratives = KEY_ROLES.map(role => ({
    role,
    narrative: getRoleNarrative(role),
  })).filter(item => item.narrative !== null);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Security Ownership</h2>
        </div>
        <p className="text-muted-foreground">
          Key people responsible for security governance on this project
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground">Loading security ownership information...</p>
          </CardContent>
        </Card>
      ) : !hasAnyPeople ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <p>No security ownership information has been defined for this project yet. Please configure key people in Project Foundations.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {project?.title ? `Security Ownership for ${project.title}` : "Security Ownership Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {narratives.map(({ role, narrative }) => (
              <div key={role} className="prose prose-sm max-w-none">
                <h4 className="font-semibold text-foreground mb-2">{ROLE_LABELS[role]}</h4>
                <p className="text-muted-foreground leading-relaxed">{narrative}</p>
              </div>
            ))}

            {narratives.length < KEY_ROLES.length && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  Note: Some roles have not been assigned yet. The following positions remain unfilled:{" "}
                  {KEY_ROLES.filter(role => !keyPeople.find(p => p.role_type === role))
                    .map(role => ROLE_LABELS[role])
                    .join(", ")}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityOwnership;
