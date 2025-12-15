import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentVersion {
  id: string;
  project_id: string;
  artefact_type: string;
  version_number: string;
  major_version: number;
  minor_version: number;
  created_by: string | null;
  created_at: string;
}

export function useDocumentVersions(projectId: string, artefactType: string) {
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ["document-versions", projectId, artefactType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("project_id", projectId)
        .eq("artefact_type", artefactType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DocumentVersion[];
    },
    enabled: !!projectId && !!artefactType,
  });

  const createVersion = useMutation({
    mutationFn: async (params: { isMajor: boolean }) => {
      const latestVersion = versions?.[0];
      let major = 1;
      let minor = 0;

      if (latestVersion) {
        if (params.isMajor) {
          major = latestVersion.major_version + 1;
          minor = 0;
        } else {
          major = latestVersion.major_version;
          minor = latestVersion.minor_version + 1;
        }
      }

      const versionNumber = `${major}.${minor}`;

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("document_versions")
        .insert({
          project_id: projectId,
          artefact_type: artefactType,
          version_number: versionNumber,
          major_version: major,
          minor_version: minor,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions", projectId, artefactType] });
      toast.success("Document version created");
    },
    onError: (error) => {
      toast.error("Failed to create document version");
      console.error(error);
    },
  });

  const getNextVersion = (isMajor: boolean): string => {
    const latestVersion = versions?.[0];
    if (!latestVersion) return "1.0";

    if (isMajor) {
      return `${latestVersion.major_version + 1}.0`;
    } else {
      return `${latestVersion.major_version}.${latestVersion.minor_version + 1}`;
    }
  };

  const latestVersion = versions?.[0];
  const currentVersion = latestVersion ? latestVersion.version_number : "0.0";

  return {
    versions,
    isLoading,
    createVersion,
    getNextVersion,
    currentVersion,
    latestVersion,
  };
}
