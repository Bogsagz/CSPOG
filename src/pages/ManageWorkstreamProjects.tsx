import { useParams } from "react-router-dom";
import { WorkstreamProjectsManager } from "@/components/WorkstreamProjectsManager";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Navigate } from "react-router-dom";

export default function ManageWorkstreamProjects() {
  const { workstream } = useParams<{ workstream: string }>();
  const { workstreams, isLoading } = useAppSettings();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Check if this workstream exists (case-insensitive)
  const validWorkstream = workstreams.find(
    w => w.toLowerCase() === workstream?.toLowerCase()
  );

  if (!validWorkstream) {
    return <Navigate to="/home" replace />;
  }

  return <WorkstreamProjectsManager workstream={validWorkstream} />;
}
