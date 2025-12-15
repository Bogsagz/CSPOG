// ThreatTooling - Threat building, editing, and mitigation tools
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { ThreatBuilder as ThreatBuilderComponent, getTablesForStage, ThreatBuilderStage } from "@/components/ThreatBuilder";
import { ThreatStatementsTable } from "@/components/ThreatStatementsTable";
import { ThreatVisualizer } from "@/components/ThreatVisualizer";
import { AssetDialog } from "@/components/AssetDialog";
import { useTableItems } from "@/hooks/useTableItems";
import { useAssets } from "@/hooks/useAssets";
import { useSavedThreats, ThreatStage } from "@/hooks/useSavedThreats";
import { useAuth } from "@/hooks/useAuth";
import { useProjectPermissions } from "@/hooks/useProjectPermissions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useThreatControls } from "@/hooks/useThreatControls";
import { Shield, CheckCircle2, Plus, Layers, X, Lightbulb } from "lucide-react";
import { AttackTechniqueSelector, SelectedTechnique } from "@/components/AttackTechniqueSelector";
import { getUniqueMitigationsForTechniques, Mitigation } from "@/lib/attackMitigations";

interface TableData {
  title: string;
  items: string[];
}

interface Link {
  table1: number;
  item1: number;
  table2: number;
  item2: number;
}

interface Selection {
  tableId: number;
  itemIndex: number;
}

export default function ThreatTooling() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "initial";
  const { user } = useAuth();
  const { permissions, isLoading: permissionsLoading } = useProjectPermissions(projectId || null, user?.id || null);
  const { items: dbItems, isLoading, addItem: addDbItem, removeItem: removeDbItem, editItem: editDbItem } = useTableItems(projectId || null);
  const { assets, isLoading: assetsLoading, createAsset } = useAssets(projectId || "");
  // Separate hooks for each stage
  const { threats: initialThreats, saveThreat: saveInitialThreat, deleteThreat: deleteInitialThreat, updateThreat: updateInitialThreat, isLoading: initialThreatsLoading, threatIds: initialThreatIds } = useSavedThreats(projectId || null, 'initial');
  const { threats: intermediateThreats, saveThreat: saveIntermediateThreat, deleteThreat: deleteIntermediateThreat, updateThreat: updateIntermediateThreat, isLoading: intermediateThreatsLoading, threatIds: intermediateThreatIds } = useSavedThreats(projectId || null, 'intermediate');
  const { threats: finalThreats, saveThreat: saveFinalThreat, deleteThreat: deleteFinalThreat, updateThreat: updateFinalThreat, isLoading: finalThreatsLoading, threatIds: finalThreatIds } = useSavedThreats(projectId || null, 'final');
  const { threats: allThreats, threatIds: allThreatIds, threatObjects: allThreatObjects, getRelatedThreatIds, isLoading: allThreatsLoading } = useSavedThreats(projectId || null);
  const threatsLoading = initialThreatsLoading || intermediateThreatsLoading || finalThreatsLoading || allThreatsLoading;

  // Intermediate builder state - selected base threat for building upon
  const [selectedBaseThreatIndex, setSelectedBaseThreatIndex] = useState<number | null>(null);
  const [localImpact, setLocalImpact] = useState<string>("");
  
  // Final builder state - selected intermediate threat and ATT&CK techniques
  const [selectedIntermediateThreatIndex, setSelectedIntermediateThreatIndex] = useState<number | null>(null);
  const [selectedAttackTechniques, setSelectedAttackTechniques] = useState<SelectedTechnique[]>([]);

  // Threat Builder State
  const [tables, setTables] = useState<TableData[]>([
    { 
      title: "Actors", 
      items: [
        "Nation State",
        "Organised Crime Group",
        "Malicious User",
        "Malicious Admin",
        "Accidental User",
        "Accidental Admin",
        "Hacker",
        "Terrorist",
        "Hactavist",
        "Force majeure"
      ] 
    },
    { title: "Vectors", items: [] },
    { 
      title: "Stride+", 
      items: [
        "Spoofing",
        "Tampering",
        "Repudiation",
        "Information Disclosure",
        "Denial of Service",
        "Elevation of Privilege",
        "Bypass"
      ] 
    },
    { title: "Assets", items: [] },
    { title: "Adversarial actions", items: [] },
    { title: "Local Objectives", items: ["Data Theft", "Tampering", "Denial Of Service", "Spoofing", "As a precursor"] },
    { title: "CIANA", items: ["Confidentiality", "Integrity", "Availability", "Non-repudiation", "Authentication"] },
    { title: "Strategic Objectives", items: [] },
  ]);

  useEffect(() => {
    if (!isLoading && !assetsLoading) {
      setTables(prev => {
        const newTables = [...prev];
        newTables[1].items = dbItems["Vectors"];
        newTables[3].items = assets.map(a => a.name);
        newTables[4].items = dbItems["Adversarial actions"];
        // Merge preset local objectives with database items
        const presetLocalObjectives = ["Data Theft", "Tampering", "Denial Of Service", "Spoofing", "As a precursor"];
        const dbLocalObjectives = dbItems["Local Objectives"] || [];
        newTables[5].items = [...new Set([...presetLocalObjectives, ...dbLocalObjectives])];
        newTables[7].items = dbItems["Strategic Objectives"];
        return newTables;
      });
    }
  }, [dbItems, isLoading, assets, assetsLoading]);

  const [selectedItems, setSelectedItems] = useState<(number | null)[]>([null, null, null, null, null, null, null, null]);
  const [firstSelection, setFirstSelection] = useState<Selection | null>(null);
  const [links, setLinks] = useState<Link[]>([]);

  // Calculate asset annotations based on which threats mention each asset
  const assetAnnotations = useMemo(() => {
    const annotations: Record<number, string> = {};
    const assetNames = tables[3].items;
    
    assetNames.forEach((assetName, assetIndex) => {
      const threatNumbers: number[] = [];
      allThreats.forEach((threat, threatIndex) => {
        if (threat.toLowerCase().includes(assetName.toLowerCase())) {
          threatNumbers.push(threatIndex + 1); // 1-indexed for display
        }
      });
      if (threatNumbers.length > 0) {
        annotations[assetIndex] = threatNumbers.join(", ");
      }
    });
    
    return annotations;
  }, [tables, allThreats]);

  // Threat Mitigator State
  const { controls, isLoading: controlsLoading } = useSecurityControls(projectId);
  const [mitigatorStageFilter, setMitigatorStageFilter] = useState<ThreatStage | 'all'>('all');
  const [selectedThreatIndex, setSelectedThreatIndex] = useState<number | null>(null);
  
  // Filter threats for mitigator based on stage
  const mitigatorThreats = mitigatorStageFilter === 'all' 
    ? allThreats 
    : allThreatObjects.filter(t => t.stage === mitigatorStageFilter).map(t => t.threat_statement);
  const mitigatorThreatIds = mitigatorStageFilter === 'all'
    ? allThreatIds
    : allThreatObjects.filter(t => t.stage === mitigatorStageFilter).map(t => t.id);
  const mitigatorThreatObjects = mitigatorStageFilter === 'all'
    ? allThreatObjects
    : allThreatObjects.filter(t => t.stage === mitigatorStageFilter);
  
  const selectedThreatId = selectedThreatIndex !== null ? mitigatorThreatIds[selectedThreatIndex] : null;
  const relatedThreatIds = selectedThreatId ? getRelatedThreatIds(selectedThreatId) : [];
  const { controlIds, isLoading: linksLoading, toggleControl, isControlLinked } = useThreatControls(selectedThreatId, relatedThreatIds);

  // Mitigation Advice State
  const [mitigationAdviceOpen, setMitigationAdviceOpen] = useState(false);
  const [mitigationData, setMitigationData] = useState<{ techniques: string[]; mitigations: Mitigation[] }>({ techniques: [], mitigations: [] });

  const loadMitigationAdvice = (threatStatement: string) => {
    // Extract technique IDs from threat statement (e.g., T1610, T1234)
    const techniquePattern = /T\d{4}(?:\.\d{3})?/g;
    const techniques = threatStatement.match(techniquePattern) || [];
    
    if (techniques.length === 0) {
      setMitigationData({ techniques: [], mitigations: [] });
      return;
    }
    
    const mitigations = getUniqueMitigationsForTechniques(techniques);
    setMitigationData({ techniques, mitigations });
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Threat Builder Handlers
  const handleAddItem = async (tableIndex: number, item: string) => {
    const tableTypeMap: { [key: number]: string } = {
      1: "Vectors",
      3: "Assets",
      4: "Adversarial actions",
      5: "Local Objectives",
      7: "Strategic Objectives"
    };
    
    if (tableTypeMap[tableIndex]) {
      await addDbItem(tableTypeMap[tableIndex] as any, item);
    }
  };

  const handleRemoveItem = async (tableIndex: number, itemIndex: number) => {
    const tableTypeMap: { [key: number]: string } = {
      1: "Vectors",
      3: "Assets",
      4: "Adversarial actions",
      5: "Local Objectives",
      7: "Strategic Objectives"
    };
    
    if (tableTypeMap[tableIndex]) {
      await removeDbItem(tableTypeMap[tableIndex] as any, itemIndex);
    }
    
    setSelectedItems((prev) => {
      const newSelected = [...prev];
      if (newSelected[tableIndex] === itemIndex) {
        newSelected[tableIndex] = null;
      }
      return newSelected;
    });
  };

  const handleEditItem = async (tableIndex: number, itemIndex: number, newValue: string) => {
    const tableTypeMap: { [key: number]: string } = {
      1: "Vectors",
      4: "Adversarial actions",
      5: "Local Objectives",
      7: "Strategic Objectives"
    };
    
    if (tableTypeMap[tableIndex]) {
      await editDbItem(tableTypeMap[tableIndex] as any, itemIndex, newValue);
      // Update local state
      setTables(prev => {
        const newTables = [...prev];
        newTables[tableIndex].items = newTables[tableIndex].items.map((item, i) => 
          i === itemIndex ? newValue : item
        );
        return newTables;
      });
    }
  };

  const handleSelectItem = (tableIndex: number, itemIndex: number) => {
    setSelectedItems((prev) => {
      const newSelected = [...prev];
      newSelected[tableIndex] = itemIndex;
      return newSelected;
    });

    const strideIndex = 2;
    const cianaIndex = 6;
    const strideToCianaMap: { [key: number]: number } = {
      0: 4,
      1: 1,
      2: 3,
      3: 0,
      4: 2,
    };

    if (tableIndex === strideIndex && strideToCianaMap[itemIndex] !== undefined) {
      const cianaItemIndex = strideToCianaMap[itemIndex];
      
      setSelectedItems((prev) => {
        const newSelected = [...prev];
        newSelected[cianaIndex] = cianaItemIndex;
        return newSelected;
      });

      setLinks((prev) => [
        ...prev,
        {
          table1: strideIndex,
          item1: itemIndex,
          table2: cianaIndex,
          item2: cianaItemIndex,
        },
      ]);
      
      toast.success("Stride+ item linked to CIANA automatically!");
      setFirstSelection(null);
      return;
    }

    if (firstSelection) {
      if (firstSelection.tableId !== tableIndex) {
        setLinks((prev) => [
          ...prev,
          {
            table1: firstSelection.tableId,
            item1: firstSelection.itemIndex,
            table2: tableIndex,
            item2: itemIndex,
          },
        ]);
        toast.success("Link created!");
        setFirstSelection(null);
      } else {
        // Same table clicked - just update selection to new item, keep linking mode active
        setFirstSelection({ tableId: tableIndex, itemIndex });
        toast.info("Selection updated - click an item from another table to create link");
      }
    } else {
      setFirstSelection({ tableId: tableIndex, itemIndex });
    }
  };

  const handleClearLinks = () => {
    setLinks([]);
    setFirstSelection(null);
    setSelectedItems([null, null, null, null, null, null, null, null]);
    toast.success("All links cleared");
  };

  const handleSaveThreat = async (threat: string, stage: ThreatStage, parentId?: string) => {
    if (stage === 'initial') {
      await saveInitialThreat(threat, 'initial');
    } else if (stage === 'intermediate') {
      // Parent is the selected initial threat
      const parentThreatId = parentId || (selectedBaseThreatIndex !== null ? initialThreatIds[selectedBaseThreatIndex] : undefined);
      await saveIntermediateThreat(threat, 'intermediate', parentThreatId);
    } else {
      // Parent is the selected intermediate threat
      const parentThreatId = parentId || (selectedIntermediateThreatIndex !== null ? intermediateThreatIds[selectedIntermediateThreatIndex] : undefined);
      await saveFinalThreat(threat, 'final', parentThreatId);
    }
  };

  // Threat Editor Handlers - for initial stage
  const handleUpdateInitialThreat = async (index: number, newStatement: string) => {
    await updateInitialThreat(index, newStatement);
  };

  const handleDeleteInitialThreat = async (index: number) => {
    await deleteInitialThreat(index);
  };

  // Threat Editor Handlers - for intermediate stage
  const handleUpdateIntermediateThreat = async (index: number, newStatement: string) => {
    await updateIntermediateThreat(index, newStatement);
  };

  const handleDeleteIntermediateThreat = async (index: number) => {
    await deleteIntermediateThreat(index);
  };

  // Threat Editor Handlers - for final stage
  const handleUpdateFinalThreat = async (index: number, newStatement: string) => {
    await updateFinalThreat(index, newStatement);
  };

  const handleDeleteFinalThreat = async (index: number) => {
    await deleteFinalThreat(index);
  };

  // Threat Mitigator Handlers
  const handleThreatChange = (value: string) => {
    setSelectedThreatIndex(parseInt(value));
  };

  const handleControlToggle = (controlId: string) => {
    if (permissions.canWriteTables) {
      toggleControl(controlId);
    }
  };

  if (permissionsLoading || isLoading || threatsLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Threat Tooling</h1>
        <p className="text-muted-foreground">
          Build, edit, and mitigate threats for your project
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="initial">Initial</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="final">Final</TabsTrigger>
          <TabsTrigger value="mitigator">Mitigator</TabsTrigger>
          <TabsTrigger value="visualizer">Visualiser</TabsTrigger>
        </TabsList>

        {/* Initial Threat Builder */}
        <TabsContent value="initial" className="mt-6 space-y-8">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Start by selecting the threat actor, attack vector, target asset, adversarial action, and objectives.
            </p>
            {permissions.role && (
              <p className="text-sm text-muted-foreground">
                Your role: <span className="font-semibold">{permissions.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </p>
            )}
          </div>

          <ThreatBuilderComponent 
            tables={tables} 
            links={links} 
            onClearLinks={handleClearLinks} 
            onSaveThreat={handleSaveThreat}
            canWrite={permissions.canWriteThreats}
            stage="initial"
          />

          <div className="grid md:grid-cols-2 gap-6">
            {tables.map((table, index) => {
              if (!getTablesForStage("initial").includes(index)) return null;
              return (
                <DataTable
                  key={index}
                  id={`table-initial-${index}`}
                  title={table.title}
                  items={table.items}
                  onAddItem={(item) => handleAddItem(index, item)}
                  onRemoveItem={(itemIndex) => handleRemoveItem(index, itemIndex)}
                  onEditItem={index !== 0 && index !== 2 && index !== 3 && index !== 6 && permissions.canWriteTables ? (itemIndex, newValue) => handleEditItem(index, itemIndex, newValue) : undefined}
                  selectedItem={selectedItems[index]}
                  onSelectItem={(itemIndex) => handleSelectItem(index, itemIndex)}
                  readOnly={index === 0 || index === 2 || index === 6 || !permissions.canWriteTables}
                  linkTo={index === 3 ? `/project/${projectId}/asset-tools` : undefined}
                  annotations={index === 3 ? assetAnnotations : undefined}
                  presetCount={index === 0 ? table.items.length : index === 2 ? table.items.length : index === 5 ? 5 : index === 6 ? table.items.length : 0}
                  customAddComponent={index === 3 ? (
                    <AssetDialog
                      onCreateAsset={async (data) => {
                        await createAsset.mutateAsync({
                          project_id: projectId!,
                          ...data,
                        });
                      }}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Plus className="h-4 w-4" />
                          Add Asset
                        </Button>
                      }
                      disabled={!permissions.canWriteTables}
                    />
                  ) : undefined}
                />
              );
            })}
          </div>

          <ThreatStatementsTable 
            statements={initialThreats} 
            onDeleteStatement={handleDeleteInitialThreat}
            onUpdateStatement={handleUpdateInitialThreat}
          />
        </TabsContent>

        {/* Intermediate Threat Builder */}
        <TabsContent value="intermediate" className="mt-6 space-y-8">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Select an initial threat statement, then add the attack type (STRIDE+) and impact category (CIANA).
            </p>
            {permissions.role && (
              <p className="text-sm text-muted-foreground">
                Your role: <span className="font-semibold">{permissions.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </p>
            )}
          </div>

          {/* Base Threat Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Initial Threat Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBaseThreatIndex !== null ? selectedBaseThreatIndex.toString() : ""}
                onValueChange={(value) => setSelectedBaseThreatIndex(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an initial threat statement to build upon" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {initialThreats.length === 0 ? (
                    <SelectItem value="-1" disabled>No threat statements available - create one in the Initial stage first</SelectItem>
                  ) : (
                    initialThreats.map((threat, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {threat}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedBaseThreatIndex !== null && (
                <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Selected threat:</p>
                  <p className="text-foreground">{initialThreats[selectedBaseThreatIndex]}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedBaseThreatIndex !== null ? (
            <>
              <ThreatBuilderComponent 
                tables={tables} 
                links={links} 
                onClearLinks={handleClearLinks} 
                onSaveThreat={handleSaveThreat}
                canWrite={permissions.canWriteThreats}
                stage="intermediate"
                baseThreatStatement={initialThreats[selectedBaseThreatIndex]}
                localImpact={localImpact}
                onLocalImpactChange={setLocalImpact}
              />

              {/* Local Impact free text input */}
              <Card>
                <CardHeader>
                  <CardTitle>Local Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={localImpact}
                    onChange={(e) => setLocalImpact(e.target.value)}
                    placeholder="Describe the local impact (e.g., data breach, service disruption, credential theft...)"
                    disabled={!permissions.canWriteTables}
                  />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Show Adversarial actions and CIANA for intermediate stage */}
                {[4, 6].map((index) => (
                  <DataTable
                    key={index}
                    id={`table-intermediate-${index}`}
                    title={tables[index].title}
                    items={tables[index].items}
                    onAddItem={(item) => handleAddItem(index, item)}
                    onRemoveItem={(itemIndex) => handleRemoveItem(index, itemIndex)}
                    onEditItem={index === 4 && permissions.canWriteTables ? (itemIndex, newValue) => handleEditItem(index, itemIndex, newValue) : undefined}
                    selectedItem={selectedItems[index]}
                    onSelectItem={(itemIndex) => handleSelectItem(index, itemIndex)}
                    readOnly={index === 6 || !permissions.canWriteTables}
                    presetCount={index === 6 ? tables[index].items.length : 0}
                  />
                ))}
              </div>

              <ThreatStatementsTable 
                statements={intermediateThreats} 
                onDeleteStatement={handleDeleteIntermediateThreat}
                onUpdateStatement={handleUpdateIntermediateThreat}
              />
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Select an initial threat statement above to continue building</p>
            </div>
          )}
        </TabsContent>

        {/* Final Threat Builder */}
        <TabsContent value="final" className="mt-6 space-y-8">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Select an intermediate threat and add ATT&CK techniques to create the final threat statement.
            </p>
            {permissions.role && (
              <p className="text-sm text-muted-foreground">
                Your role: <span className="font-semibold">{permissions.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </p>
            )}
          </div>

          {/* Intermediate Threat Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Intermediate Threat Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedIntermediateThreatIndex !== null ? selectedIntermediateThreatIndex.toString() : ""}
                onValueChange={(value) => setSelectedIntermediateThreatIndex(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an intermediate threat statement to build upon" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {intermediateThreats.length === 0 ? (
                    <SelectItem value="-1" disabled>No intermediate threats available</SelectItem>
                  ) : (
                    intermediateThreats.map((threat, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {threat}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedIntermediateThreatIndex !== null && (
            <>
              {/* ATT&CK Technique Selector with embedded threat statement */}
              <AttackTechniqueSelector
                selectedTechniques={selectedAttackTechniques}
                onSelectionChange={setSelectedAttackTechniques}
                disabled={!permissions.canWriteThreats}
              >
                <ThreatBuilderComponent 
                  tables={tables} 
                  links={links} 
                  onClearLinks={handleClearLinks} 
                  onSaveThreat={handleSaveThreat}
                  canWrite={permissions.canWriteThreats}
                  stage="final"
                  selectedAttackTechniques={selectedAttackTechniques}
                  baseIntermediateThreat={intermediateThreats[selectedIntermediateThreatIndex]}
                />
              </AttackTechniqueSelector>
            </>
          )}

          <ThreatStatementsTable 
            statements={finalThreats} 
            onDeleteStatement={handleDeleteFinalThreat}
            onUpdateStatement={handleUpdateFinalThreat}
          />
        </TabsContent>

        <TabsContent value="mitigator" className="mt-6">
          <div className="mb-8">
            <p className="text-muted-foreground">
              Link security controls to threats to document mitigation strategies. Controls applied to a threat will automatically propagate to related threats across stages.
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Select Threat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stage Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Stage</label>
                <Select
                  value={mitigatorStageFilter}
                  onValueChange={(value) => {
                    setMitigatorStageFilter(value as ThreatStage | 'all');
                    setSelectedThreatIndex(null); // Reset selection when filter changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="initial">Initial Threats</SelectItem>
                    <SelectItem value="intermediate">Intermediate Threats</SelectItem>
                    <SelectItem value="final">Final Threats</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Threat Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Threat Statement</label>
                <Select
                  value={selectedThreatIndex !== null ? selectedThreatIndex.toString() : ""}
                  onValueChange={handleThreatChange}
                  disabled={!permissions.canWriteTables}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a threat to mitigate" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {mitigatorThreats.length === 0 ? (
                      <SelectItem value="-1" disabled>No threats available</SelectItem>
                    ) : (
                      mitigatorThreats.map((threat, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground capitalize">
                              {mitigatorThreatObjects[index]?.stage}
                            </span>
                            <span className="truncate max-w-[400px]">{threat}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Related Threats Info */}
              {selectedThreatIndex !== null && relatedThreatIds.length > 1 && (
                <div className="p-3 bg-accent/30 rounded-lg border border-accent">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{relatedThreatIds.length} related threats</span> will share controls (linked across stages)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedThreatIndex !== null && (() => {
            // Extract actor from threat statement
            const selectedThreatStatement = mitigatorThreats[selectedThreatIndex] || "";
            const actorPatterns = [
              { pattern: /nation state/i, type: "nation_state" },
              { pattern: /organised crime/i, type: "organised_crime" },
              { pattern: /malicious user/i, type: "malicious_insider" },
              { pattern: /malicious admin/i, type: "malicious_insider" },
              { pattern: /accidental user/i, type: "accidental_insider" },
              { pattern: /accidental admin/i, type: "accidental_insider" },
              { pattern: /hacktivist|hactavist/i, type: "hacktivist_terrorist_hacker" },
              { pattern: /terrorist/i, type: "hacktivist_terrorist_hacker" },
              { pattern: /hacker/i, type: "hacktivist_terrorist_hacker" },
            ];
            
            let detectedActorType: string | null = null;
            for (const { pattern, type } of actorPatterns) {
              if (pattern.test(selectedThreatStatement)) {
                detectedActorType = type;
                break;
              }
            }

            // Define layers
            const layersConfig = [
              { value: 3, label: "Policies & standards" },
              { value: 2, label: "Process & procedures" },
              { value: 1, label: "Physical & location controls" },
              { value: -1, label: "Authorisation controls" },
              { value: -2, label: "Network & authentication controls" },
              { value: -3, label: "Detection controls" },
            ];

            // Calculate controls per layer with effectiveness
            const controlsByLayer = layersConfig.map(layer => {
              const linkedControlsAtLayer = controls.filter(
                c => isControlLinked(c.id) && c.layer === layer.value
              );
              return {
                layer: layer.value,
                controls: linkedControlsAtLayer,
                countAtBOrHigher: linkedControlsAtLayer.filter(c => 
                  c.effectiveness_rating && ['A', 'B'].includes(c.effectiveness_rating)
                ).length,
                countAtCOrHigher: linkedControlsAtLayer.filter(c => 
                  c.effectiveness_rating && ['A', 'B', 'C'].includes(c.effectiveness_rating)
                ).length,
              };
            });

            // Total controls across all layers
            const totalControlsAtBOrHigher = controlsByLayer.reduce((sum, l) => sum + l.countAtBOrHigher, 0);
            const totalControlsAtCOrHigher = controlsByLayer.reduce((sum, l) => sum + l.countAtCOrHigher, 0);

            // Check mitigation status based on actor type
            let isMitigated = false;
            let mitigationRequirement = "";

            switch (detectedActorType) {
              case "nation_state":
                // 3 controls at every layer, B or higher
                isMitigated = controlsByLayer.every(l => l.countAtBOrHigher >= 3);
                mitigationRequirement = "Nation State: 3 controls at B+ per layer";
                break;
              case "organised_crime":
                // 2 controls at every layer, B or higher
                isMitigated = controlsByLayer.every(l => l.countAtBOrHigher >= 2);
                mitigationRequirement = "Organised Crime: 2 controls at B+ per layer";
                break;
              case "malicious_insider":
                // 8 controls at B or higher across all layers
                isMitigated = totalControlsAtBOrHigher >= 8;
                mitigationRequirement = "Malicious Insider: 8 controls at B+ total";
                break;
              case "accidental_insider":
                // 6 controls at C or higher across all layers
                isMitigated = totalControlsAtCOrHigher >= 6;
                mitigationRequirement = "Accidental Insider: 6 controls at C+ total";
                break;
              case "hacktivist_terrorist_hacker":
                // 2 controls at every layer, C or higher
                isMitigated = controlsByLayer.every(l => l.countAtCOrHigher >= 2);
                mitigationRequirement = "Hacktivist/Terrorist/Hacker: 2 controls at C+ per layer";
                break;
              default:
                mitigationRequirement = "Unknown actor type";
            }

            return (
            <>
              {/* Selected Threat Statement */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Selected Threat</span>
                    <Dialog open={mitigationAdviceOpen} onOpenChange={setMitigationAdviceOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => loadMitigationAdvice(selectedThreatStatement)}
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Mitigation Advice
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            MITRE ATT&CK Mitigations
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          {mitigationData.techniques.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No ATT&CK techniques found in this threat statement.</p>
                          ) : (
                            <>
                              <div className="text-sm text-muted-foreground">
                                Techniques detected: {mitigationData.techniques.join(', ')}
                              </div>
                              {mitigationData.mitigations.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No mitigations found for these techniques.</p>
                              ) : (
                                <div className="space-y-4">
                                  {mitigationData.mitigations.map((mitigation) => (
                                    <Card key={mitigation.id} className="p-4">
                                      <div className="flex items-start gap-3">
                                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                                          {mitigation.id}
                                        </span>
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-sm">{mitigation.name}</h4>
                                          <p className="text-sm text-muted-foreground mt-1">{mitigation.description}</p>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedThreatStatement}</p>
                </CardContent>
              </Card>

              {/* Control Layers Overview */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Control Layers
                    <div className="ml-auto flex items-center gap-2">
                      {detectedActorType && (
                        <span className="text-xs text-muted-foreground">{mitigationRequirement}</span>
                      )}
                      {detectedActorType ? (
                        isMitigated ? (
                          <span className="text-sm font-semibold px-3 py-1 rounded bg-green-600 text-white">
                            Mitigated
                          </span>
                        ) : (
                          <span className="text-sm font-semibold px-3 py-1 rounded bg-red-600 text-white">
                            Unmitigated
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">No actor detected</span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {layersConfig.map((layer) => {
                      // Get linked controls at this layer
                      const linkedControlsAtLayer = controls.filter(
                        c => isControlLinked(c.id) && c.layer === layer.value
                      );
                      
                      // Count controls by effectiveness threshold
                      const countAtBOrHigher = linkedControlsAtLayer.filter(c => 
                        c.effectiveness_rating && ['A', 'B'].includes(c.effectiveness_rating)
                      ).length;
                      const countAtCOrHigher = linkedControlsAtLayer.filter(c => 
                        c.effectiveness_rating && ['A', 'B', 'C'].includes(c.effectiveness_rating)
                      ).length;
                      const hasAnyAboveE = linkedControlsAtLayer.some(c => 
                        c.effectiveness_rating && ['A', 'B', 'C', 'D'].includes(c.effectiveness_rating)
                      );
                      
                      // Calculate layer status based on actor requirements
                      const getLayerProgressColor = () => {
                        if (!detectedActorType) return "bg-card border-border";
                        
                        let progress = 0; // 0 to 1
                        let layerMet = false;
                        
                        switch (detectedActorType) {
                          case "nation_state":
                            // 3 controls at B+ per layer
                            progress = Math.min(countAtBOrHigher / 3, 1);
                            layerMet = countAtBOrHigher >= 3;
                            break;
                          case "organised_crime":
                            // 2 controls at B+ per layer
                            progress = Math.min(countAtBOrHigher / 2, 1);
                            layerMet = countAtBOrHigher >= 2;
                            break;
                          case "malicious_insider":
                            // 8 controls at B+ total - show layer's contribution
                            progress = Math.min(totalControlsAtBOrHigher / 8, 1);
                            layerMet = totalControlsAtBOrHigher >= 8;
                            break;
                          case "accidental_insider":
                            // 6 controls at C+ total - show layer's contribution
                            progress = Math.min(totalControlsAtCOrHigher / 6, 1);
                            layerMet = totalControlsAtCOrHigher >= 6;
                            break;
                          case "hacktivist_terrorist_hacker":
                            // 2 controls at C+ per layer
                            progress = Math.min(countAtCOrHigher / 2, 1);
                            layerMet = countAtCOrHigher >= 2;
                            break;
                          default:
                            return "bg-card border-border";
                        }
                        
                        // Color based on progress: dark red -> orange -> yellow -> green -> blue
                        if (layerMet) {
                          return "bg-blue-500/80 border-blue-500";
                        } else if (linkedControlsAtLayer.length === 0 || !hasAnyAboveE) {
                          return "bg-red-800/80 border-red-800"; // Dark red - no controls or only E
                        } else if (progress >= 0.75) {
                          return "bg-green-500/80 border-green-500"; // Almost there
                        } else if (progress >= 0.5) {
                          return "bg-yellow-500/80 border-yellow-500"; // Halfway
                        } else if (progress >= 0.25) {
                          return "bg-orange-500/80 border-orange-500"; // Some progress
                        } else {
                          return "bg-red-600/80 border-red-600"; // Little progress
                        }
                      };
                      
                      // Check if this layer meets requirements
                      let layerMet = false;
                      switch (detectedActorType) {
                        case "nation_state":
                          layerMet = countAtBOrHigher >= 3;
                          break;
                        case "organised_crime":
                          layerMet = countAtBOrHigher >= 2;
                          break;
                        case "malicious_insider":
                          layerMet = totalControlsAtBOrHigher >= 8;
                          break;
                        case "accidental_insider":
                          layerMet = totalControlsAtCOrHigher >= 6;
                          break;
                        case "hacktivist_terrorist_hacker":
                          layerMet = countAtCOrHigher >= 2;
                          break;
                      }
                      
                      return (
                        <div
                          key={layer.value}
                          className={`p-3 rounded-lg border ${getLayerProgressColor()} flex items-center`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-mono w-6 text-center text-black font-semibold">
                                {layer.value > 0 ? `+${layer.value}` : layer.value}
                              </span>
                              <span className="text-sm font-semibold text-black">{layer.label}</span>
                              {linkedControlsAtLayer.length > 0 && (
                                <span className="text-xs text-black/80 ml-auto">
                                  {countAtBOrHigher > 0 && `${countAtBOrHigher} at B+`}
                                  {countAtBOrHigher > 0 && countAtCOrHigher > countAtBOrHigher && ' / '}
                                  {countAtCOrHigher > countAtBOrHigher && `${countAtCOrHigher} at C+`}
                                </span>
                              )}
                            </div>
                            {linkedControlsAtLayer.length > 0 ? (
                              <div className="ml-9 flex flex-wrap gap-1">
                                {linkedControlsAtLayer.map(control => {
                                  const getControlBubbleColor = (rating: string | null | undefined) => {
                                    switch (rating) {
                                      case 'A': return "bg-green-600 text-white";
                                      case 'B': return "bg-green-400 text-green-950";
                                      case 'C': return "bg-yellow-400 text-yellow-950";
                                      case 'D': return "bg-orange-500 text-white";
                                      case 'E': return "bg-red-700 text-white";
                                      default: return "bg-gray-300 text-gray-800";
                                    }
                                  };
                                  return (
                                    <span 
                                      key={control.id}
                                      className={`text-xs px-2 py-1 rounded border border-black ${getControlBubbleColor(control.effectiveness_rating)}`}
                                    >
                                      {control.name}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="ml-9 text-xs text-black/60">No controls</div>
                            )}
                          </div>
                          <div className="ml-4 flex items-center justify-center">
                            {layerMet ? (
                              <CheckCircle2 className="h-12 w-12 text-green-700" strokeWidth={2.5} />
                            ) : linkedControlsAtLayer.length === 0 ? (
                              <X className="h-12 w-12 text-black" strokeWidth={2.5} />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Available Controls
                    {controlIds.size > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({controlIds.size} linked)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {controlsLoading ? (
                    <p className="text-muted-foreground">Loading controls...</p>
                  ) : controls.length === 0 ? (
                    <p className="text-muted-foreground">No security controls available. Create controls in the Control Builder first.</p>
                  ) : (
                    <div className="space-y-4">
                      {controls.map((control) => (
                        <div
                          key={control.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                            isControlLinked(control.id)
                              ? "bg-accent/50 border-accent"
                              : "bg-card border-border hover:bg-accent/20"
                          }`}
                        >
                          <RadioGroup
                            value={isControlLinked(control.id) ? "linked" : "unlinked"}
                            onValueChange={() => handleControlToggle(control.id)}
                            disabled={!permissions.canWriteTables || linksLoading}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="linked" id={`control-${control.id}`} />
                            </div>
                          </RadioGroup>
                          <div className="flex-1">
                            <Label
                              htmlFor={`control-${control.id}`}
                              className={`cursor-pointer font-semibold ${
                                !permissions.canWriteTables ? "cursor-not-allowed" : ""
                              }`}
                            >
                              {control.name}
                            </Label>
                            {control.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {control.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {control.layer !== null && (
                                <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                                  Layer {control.layer > 0 ? `+${control.layer}` : control.layer}
                                </span>
                              )}
                              {control.type && (
                                <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                                  {control.type}
                                </span>
                              )}
                              {control.effectiveness_rating && (
                                <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                                  Effectiveness: {control.effectiveness_rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
            );
          })()}

          {!permissions.canWriteTables && (
            <p className="text-sm text-muted-foreground mt-4">
              You have read-only access to this project
            </p>
          )}
        </TabsContent>

        <TabsContent value="visualizer" className="mt-6">
          <div className="mb-8">
            <p className="text-muted-foreground">
              Create a visual block diagram of assets and map threats against them
            </p>
          </div>

          <ThreatVisualizer
            assets={tables[3].items}
            threatObjects={allThreatObjects}
            canWrite={permissions.canWriteTables}
            projectId={projectId || ""}
          />

          {!permissions.canWriteTables && (
            <p className="text-sm text-muted-foreground mt-4">
              You have read-only access to this project
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
