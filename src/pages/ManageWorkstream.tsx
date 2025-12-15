import { useParams } from "react-router-dom";
import { WorkstreamTeamManager } from "@/components/WorkstreamTeamManager";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

export default function ManageWorkstream() {
  const { workstream } = useParams<{ workstream: string }>();
  const { workstreams, isLoading } = useAppSettings();

  useEffect(() => {
    console.log("ManageWorkstream - URL param:", workstream);
    console.log("ManageWorkstream - Available workstreams:", workstreams);
  }, [workstream, workstreams]);

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

  console.log("ManageWorkstream - Valid workstream found:", validWorkstream);

  if (!validWorkstream) {
    console.log("ManageWorkstream - No valid workstream, redirecting to home");
    return <Navigate to="/home" replace />;
  }

  return <WorkstreamTeamManager workstream={validWorkstream} />;
}
