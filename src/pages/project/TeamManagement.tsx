import { useParams } from "react-router-dom";
import { ProjectTeamManager } from "@/components/ProjectTeamManager";
import { useAuth } from "@/hooks/useAuth";

export default function TeamManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Team Management</h2>
        <p className="text-muted-foreground">
          Manage team members and assign roles for this project
        </p>
      </div>

      <ProjectTeamManager projectId={projectId || ""} userId={user?.id || ""} />
    </div>
  );
}
