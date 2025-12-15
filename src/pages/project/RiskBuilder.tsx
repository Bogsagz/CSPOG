import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { RiskBuilderComponent } from "@/components/RiskBuilderComponent";
import { RiskStatementsTable } from "@/components/RiskStatementsTable";
import { useSavedRisks } from "@/hooks/useSavedRisks";
import { useSavedThreats } from "@/hooks/useSavedThreats";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { useAuth } from "@/hooks/useAuth";
import { useObligations } from "@/hooks/useObligations";
import { supabase } from "@/integrations/supabase/client";
import { useTableItems } from "@/hooks/useTableItems";
import { toast } from "sonner";

interface TableData {
  title: string;
  items: string[];
}

interface Selection {
  [key: string]: number | null;
}

export default function RiskBuilder() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [projectName, setProjectName] = useState<string>("");
  
  // Fetch Local Objectives from Threat Builder as System Impact (read-only)
  const { items: localObjectives } = useTableItems(projectId || null);

  const IMPACT_TYPES = ["Human", "Financial", "Reputational", "Delivery", "Compliance"];
  const IMPACT_LEVELS = ["Minor", "Moderate", "Major", "Significant", "Critical"];
  const CIANA_OPTIONS = ["Confidentiality", "Integrity", "Availability", "Non-repudiation", "Authenticity"];
  const LIKELIHOOD_LEVELS = ["Remote", "Unlikely", "Possible", "Likely", "Very Likely"];

  const { risks: savedRisks, saveRisk, deleteRisk } = useSavedRisks(projectId || null);
  const { threats: savedThreats, threatIds, isLoading: threatsLoading } = useSavedThreats(projectId || null, 'initial');
  const { permissions, isLoading: permissionsLoading } = useProjectPermissions(projectId || null, user?.id || null);
  const { obligations } = useObligations(projectId || "");

  const [riskType, setRiskType] = useState<"Threat Based" | "Compliance Based" | "Other">("Threat Based");
  const [selectedObligationId, setSelectedObligationId] = useState<string>("");

  const [tables, setTables] = useState<TableData[]>([
    { title: "Likelihood", items: [] },
    { title: "Threat", items: [] },
    { title: "CIANA", items: [] },
    { title: "System Impact", items: [] },
    { title: "Impact Level", items: IMPACT_LEVELS },
    { title: "Impact Type", items: IMPACT_TYPES },
  ]);

  const [selections, setSelections] = useState<Selection>({
    "Likelihood": null,
    "Threat": null,
    "CIANA": null,
    "System Impact": null,
    "Impact Level": null,
    "Impact Type": null,
  });

  const [customRiskEvent, setCustomRiskEvent] = useState<string>("");
  const [systemImpactText, setSystemImpactText] = useState<string>("");

  const handleImpactTypeChange = (impactTypeIndex: number) => {
    setSelections(prev => ({ ...prev, "Impact Type": impactTypeIndex }));
  };

  const handleImpactLevelChange = (impactLevelIndex: number) => {
    setSelections(prev => ({ ...prev, "Impact Level": impactLevelIndex }));
  };

  const handleCIANAChange = (cianaIndex: number) => {
    setSelections(prev => ({ ...prev, "CIANA": cianaIndex }));
  };

  const handleLikelihoodChange = (likelihoodIndex: number) => {
    setSelections(prev => ({ ...prev, "Likelihood": likelihoodIndex }));
  };

  const extractCIANA = (threatStatement: string): string => {
    // Extract CIANA from threat statement format: "... impacting ${ciana} in order to ..."
    const match = threatStatement.match(/impacting\s+(.+?)\s+in order to/i);
    return match ? match[1] : "";
  };

  const handleThreatChange = (threatIndex: number) => {
    // -1 indicates "Non-threat based risk" option
    if (threatIndex === -1) {
      setSelections(prev => ({ 
        ...prev, 
        "Threat": threatIndex,
        "CIANA": null
      }));
      return;
    }

    const cianaValue = extractCIANA(savedThreats[threatIndex]);
    const cianaIndex = CIANA_OPTIONS.findIndex(option => 
      option.toLowerCase() === cianaValue.toLowerCase()
    );
    
    setSelections(prev => ({ 
      ...prev, 
      "Threat": threatIndex,
      "CIANA": cianaIndex !== -1 ? cianaIndex : null
    }));
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const { data, error } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .maybeSingle();
      
      if (!error && data) {
        setProjectName(data.title);
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    setTables(prev => {
      const newTables = [
        { title: "Likelihood", items: LIKELIHOOD_LEVELS },
        { title: "Threat", items: [] },
        { title: "CIANA", items: CIANA_OPTIONS },
        { title: "System Impact", items: localObjectives["Local Objectives"] || [] },
        { title: "Impact Level", items: IMPACT_LEVELS },
        { title: "Impact Type", items: IMPACT_TYPES },
      ];
      return newTables;
    });
  }, [localObjectives]);

  // Reset threat selection when threats list changes to avoid invalid indices
  useEffect(() => {
    setSelections(prev => ({ ...prev, "Threat": null, "CIANA": null }));
  }, [savedThreats.length]);


  const handleSelectItem = (tableTitle: string, itemIndex: number) => {
    setSelections(prev => ({ ...prev, [tableTitle]: itemIndex }));
  };

  const handleClearSelections = () => {
    setSelections({
      "Likelihood": null,
      "Threat": null,
      "CIANA": null,
      "System Impact": null,
      "Impact Level": null,
      "Impact Type": null,
    });
    setCustomRiskEvent("");
    setSystemImpactText("");
  };

  const calculateRiskRating = (likelihood: string, impactLevel: string): string => {
    const likelihoodIndex = LIKELIHOOD_LEVELS.indexOf(likelihood);
    const impactIndex = IMPACT_LEVELS.indexOf(impactLevel);

    // Remote
    if (likelihoodIndex === 0) {
      if (impactIndex <= 1) return "Very Low Risk";
      if (impactIndex <= 3) return "Low Risk";
      return "Medium Risk";
    }
    
    // Unlikely
    if (likelihoodIndex === 1) {
      if (impactIndex === 0) return "Very Low Risk";
      if (impactIndex <= 2) return "Low Risk";
      return "Medium Risk";
    }
    
    // Possible
    if (likelihoodIndex === 2) {
      if (impactIndex <= 1) return "Low Risk";
      if (impactIndex <= 3) return "Medium Risk";
      return "High Risk";
    }
    
    // Likely
    if (likelihoodIndex === 3) {
      if (impactIndex === 0) return "Low Risk";
      if (impactIndex <= 2) return "Medium Risk";
      if (impactIndex === 3) return "High Risk";
      return "Very High Risk";
    }
    
    // Very Likely
    if (likelihoodIndex === 4) {
      if (impactIndex === 0) return "Low Risk";
      if (impactIndex === 1) return "Medium Risk";
      if (impactIndex === 2) return "High Risk";
      return "Very High Risk";
    }
    
    return "Unknown";
  };

  const handleSaveRisk = async (statement: string) => {
    const likelihoodIndex = selections["Likelihood"];
    const impactLevelIndex = selections["Impact Level"];
    const impactTypeIndex = selections["Impact Type"];
    const threatIndex = selections["Threat"];
    
    if (likelihoodIndex === null || impactLevelIndex === null || impactTypeIndex === null) {
      toast.error("Please select likelihood, impact level, and impact type");
      return;
    }
    
    const likelihood = LIKELIHOOD_LEVELS[likelihoodIndex];
    const impactLevel = IMPACT_LEVELS[impactLevelIndex];
    const impactType = IMPACT_TYPES[impactTypeIndex];
    
    // Get threat_id if this is a threat-based risk (threatIndex is not -1 and not null)
    const threatId = threatIndex !== null && threatIndex !== -1 ? threatIds[threatIndex] : undefined;
    
    const riskRating = calculateRiskRating(likelihood, impactLevel);
    
    await saveRisk(statement, riskRating, impactType, threatId, likelihood, impactLevel);
    handleClearSelections();
  };

  const handleDeleteRisk = async (index: number) => {
    await deleteRisk(index);
  };

  if (permissionsLoading || threatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Risk Builder</h2>
        <p className="text-muted-foreground">
          Build and document risk scenarios and assessments
        </p>
      </div>

      <RiskBuilderComponent
        tables={tables}
        selections={selections}
        savedThreats={savedThreats}
        impactTypes={IMPACT_TYPES}
        impactLevels={IMPACT_LEVELS}
        cianaOptions={CIANA_OPTIONS}
        likelihoodLevels={LIKELIHOOD_LEVELS}
        customRiskEvent={customRiskEvent}
        systemImpactText={systemImpactText}
        projectName={projectName}
        riskType={riskType}
        obligations={obligations.map(o => ({ id: o.id, name: o.name }))}
        selectedObligationId={selectedObligationId}
        onRiskTypeChange={setRiskType}
        onObligationChange={setSelectedObligationId}
        onThreatChange={handleThreatChange}
        onImpactTypeChange={handleImpactTypeChange}
        onImpactLevelChange={handleImpactLevelChange}
        onCIANAChange={handleCIANAChange}
        onLikelihoodChange={handleLikelihoodChange}
        onCustomRiskEventChange={setCustomRiskEvent}
        onSystemImpactTextChange={setSystemImpactText}
        onSaveRisk={handleSaveRisk}
        onClearSelections={handleClearSelections}
        canWrite={permissions.canWriteTables}
      />

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Saved Risk Statements</h3>
        <RiskStatementsTable 
          statements={savedRisks} 
          onDeleteStatement={handleDeleteRisk}
          canWrite={permissions.canWriteTables}
        />
      </div>

      {!permissions.canWriteTables && (
        <p className="text-sm text-muted-foreground mt-4">
          You have read-only access to this project
        </p>
      )}
    </div>
  );
}
