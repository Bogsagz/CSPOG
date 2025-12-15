import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { useSavedThreats, SavedThreat } from "@/hooks/useSavedThreats";
import { useSecurityControls } from "@/hooks/useSecurityControls";
import { useThreatControls } from "@/hooks/useThreatControls";
import { useSystemDiagram } from "@/hooks/useSystemDiagram";
import { useAssets } from "@/hooks/useAssets";
import { GenerateArtefactButton } from "@/components/GenerateArtefactButton";
import { DocumentSection } from "@/utils/documentGenerator";
import { HeadingLevel } from "docx";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, CheckCircle2, X, Shield, AlertTriangle, Server, Database, CloudCog, Workflow, AppWindow } from "lucide-react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Map asset types to icons
const getAssetIcon = (type?: string) => {
  switch (type) {
    case "Physical device": return Server;
    case "Data": return Database;
    case "Process": return Workflow;
    case "Cloud component": return CloudCog;
    case "Software component": return AppWindow;
    default: return Server;
  }
};

// Custom Asset Node for diagram
function DiagramAssetNode({ data }: { data: { label: string; threatNumbers: number[]; type?: string } }) {
  const Icon = getAssetIcon(data.type);
  
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 relative">
      <Handle type="source" position={Position.Top} id="top" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-primary" />
      
      <div className="relative">
        <div className="w-12 h-12 rounded bg-card border border-primary flex items-center justify-center shadow-sm">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {data.threatNumbers && data.threatNumbers.length > 0 && (
          <div className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {data.threatNumbers.join(",")}
          </div>
        )}
      </div>
      
      <div className="text-center max-w-[80px]">
        <span className="font-semibold text-[10px] block truncate">{data.label}</span>
        {data.type && (
          <span className="text-[8px] text-muted-foreground block truncate">{data.type}</span>
        )}
      </div>
    </div>
  );
}

const diagramNodeTypes: NodeTypes = {
  asset: DiagramAssetNode,
};

// Control layers configuration
const layersConfig = [
  { value: 3, label: "Policies & standards" },
  { value: 2, label: "Process & procedures" },
  { value: 1, label: "Physical & location controls" },
  { value: -1, label: "Authorisation controls" },
  { value: -2, label: "Network & authentication controls" },
  { value: -3, label: "Detection controls" },
];

// Actor pattern detection
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

interface ThreatWithControlsProps {
  threatStatement: string;
  threatId: string;
  controls: any[];
  index: number;
  getRelatedThreatIds: (id: string) => string[];
  stage: string;
}

function ThreatWithControls({ threatStatement, threatId, controls, index, getRelatedThreatIds, stage }: ThreatWithControlsProps) {
  const relatedThreatIds = getRelatedThreatIds(threatId);
  const { isControlLinked } = useThreatControls(threatId, relatedThreatIds);

  // Detect actor type
  let detectedActorType: string | null = null;
  for (const { pattern, type } of actorPatterns) {
    if (pattern.test(threatStatement)) {
      detectedActorType = type;
      break;
    }
  }

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
      isMitigated = controlsByLayer.every(l => l.countAtBOrHigher >= 3);
      mitigationRequirement = "Nation State: 3 controls at B+ per layer";
      break;
    case "organised_crime":
      isMitigated = controlsByLayer.every(l => l.countAtBOrHigher >= 2);
      mitigationRequirement = "Organised Crime: 2 controls at B+ per layer";
      break;
    case "malicious_insider":
      isMitigated = totalControlsAtBOrHigher >= 8;
      mitigationRequirement = "Malicious Insider: 8 controls at B+ total";
      break;
    case "accidental_insider":
      isMitigated = totalControlsAtCOrHigher >= 6;
      mitigationRequirement = "Accidental Insider: 6 controls at C+ total";
      break;
    case "hacktivist_terrorist_hacker":
      isMitigated = controlsByLayer.every(l => l.countAtCOrHigher >= 2);
      mitigationRequirement = "Hacktivist/Terrorist/Hacker: 2 controls at C+ per layer";
      break;
    default:
      mitigationRequirement = "Unknown actor type";
  }

  const getLayerProgressColor = (layer: typeof controlsByLayer[0]) => {
    const linkedControlsAtLayer = layer.controls;
    const countAtBOrHigher = layer.countAtBOrHigher;
    const countAtCOrHigher = layer.countAtCOrHigher;
    const hasAnyAboveE = linkedControlsAtLayer.some(c => 
      c.effectiveness_rating && ['A', 'B', 'C', 'D'].includes(c.effectiveness_rating)
    );

    if (!detectedActorType) return "bg-card border-border";

    let progress = 0;
    let layerMet = false;

    switch (detectedActorType) {
      case "nation_state":
        progress = Math.min(countAtBOrHigher / 3, 1);
        layerMet = countAtBOrHigher >= 3;
        break;
      case "organised_crime":
        progress = Math.min(countAtBOrHigher / 2, 1);
        layerMet = countAtBOrHigher >= 2;
        break;
      case "malicious_insider":
        progress = Math.min(totalControlsAtBOrHigher / 8, 1);
        layerMet = totalControlsAtBOrHigher >= 8;
        break;
      case "accidental_insider":
        progress = Math.min(totalControlsAtCOrHigher / 6, 1);
        layerMet = totalControlsAtCOrHigher >= 6;
        break;
      case "hacktivist_terrorist_hacker":
        progress = Math.min(countAtCOrHigher / 2, 1);
        layerMet = countAtCOrHigher >= 2;
        break;
      default:
        return "bg-card border-border";
    }

    if (layerMet) {
      return "bg-blue-500/80 border-blue-500";
    } else if (linkedControlsAtLayer.length === 0 || !hasAnyAboveE) {
      return "bg-red-800/80 border-red-800";
    } else if (progress >= 0.75) {
      return "bg-green-500/80 border-green-500";
    } else if (progress >= 0.5) {
      return "bg-yellow-500/80 border-yellow-500";
    } else if (progress >= 0.25) {
      return "bg-orange-500/80 border-orange-500";
    } else {
      return "bg-red-600/80 border-red-600";
    }
  };

  const getLayerMet = (countAtBOrHigher: number, countAtCOrHigher: number) => {
    switch (detectedActorType) {
      case "nation_state":
        return countAtBOrHigher >= 3;
      case "organised_crime":
        return countAtBOrHigher >= 2;
      case "malicious_insider":
        return totalControlsAtBOrHigher >= 8;
      case "accidental_insider":
        return totalControlsAtCOrHigher >= 6;
      case "hacktivist_terrorist_hacker":
        return countAtCOrHigher >= 2;
      default:
        return false;
    }
  };

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

  const totalLinkedControls = controlsByLayer.reduce((sum, l) => sum + l.controls.length, 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Threat {index + 1}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              stage === 'final' ? 'bg-primary text-primary-foreground' : 
              stage === 'intermediate' ? 'bg-secondary text-secondary-foreground' : 
              'bg-muted text-muted-foreground'
            }`}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
      <CardContent className="space-y-4">
        {/* Threat Statement */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">{threatStatement}</p>
        </div>

        {/* Control Layers */}
        {totalLinkedControls > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="h-4 w-4" />
              Control Assessment
            </div>
            {layersConfig.map((layer) => {
              const layerData = controlsByLayer.find(l => l.layer === layer.value)!;
              const linkedControlsAtLayer = layerData.controls;
              const layerMet = getLayerMet(layerData.countAtBOrHigher, layerData.countAtCOrHigher);

              if (linkedControlsAtLayer.length === 0) return null;

              return (
                <div
                  key={layer.value}
                  className={`p-2 rounded-lg border ${getLayerProgressColor(layerData)} flex items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono w-6 text-center text-black font-semibold">
                        {layer.value > 0 ? `+${layer.value}` : layer.value}
                      </span>
                      <span className="text-xs font-semibold text-black">{layer.label}</span>
                      {linkedControlsAtLayer.length > 0 && (
                        <span className="text-xs text-black/80 ml-auto">
                          {layerData.countAtBOrHigher > 0 && `${layerData.countAtBOrHigher} at B+`}
                          {layerData.countAtBOrHigher > 0 && layerData.countAtCOrHigher > layerData.countAtBOrHigher && ' / '}
                          {layerData.countAtCOrHigher > layerData.countAtBOrHigher && `${layerData.countAtCOrHigher} at C+`}
                        </span>
                      )}
                    </div>
                    <div className="ml-8 flex flex-wrap gap-1">
                      {linkedControlsAtLayer.map(control => (
                        <span 
                          key={control.id}
                          className={`text-xs px-2 py-0.5 rounded border border-black ${getControlBubbleColor(control.effectiveness_rating)}`}
                        >
                          {control.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center justify-center">
                    {layerMet ? (
                      <CheckCircle2 className="h-8 w-8 text-green-700" strokeWidth={2.5} />
                    ) : (
                      <X className="h-8 w-8 text-black" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalLinkedControls === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            No controls linked to this threat
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DeeperThreatModel() {
  const { projectId } = useParams<{ projectId: string }>();
  // Fetch ALL threats to get highest maturity for each chain
  const { threatObjects: allThreats, getRelatedThreatIds, isLoading: threatsLoading } = useSavedThreats(projectId || null);
  const { controls, isLoading: controlsLoading } = useSecurityControls(projectId);
  const { nodes: savedNodes, edges: savedEdges, isLoading: diagramLoading } = useSystemDiagram(projectId || "");
  const { assets, isLoading: assetsLoading } = useAssets(projectId || "");

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

  // Get highest maturity threat for each threat chain
  const getHighestMaturityThreats = (): SavedThreat[] => {
    const stagePriority = { final: 3, intermediate: 2, initial: 1 };
    
    // If parent_threat_id is set, use chain-based grouping
    const hasParentLinks = allThreats.some(t => t.parent_threat_id);
    
    if (hasParentLinks) {
      const threatMap = new Map<string, typeof allThreats[0]>();
      allThreats.forEach(t => threatMap.set(t.id, t));
      
      const processedRoots = new Set<string>();
      const maturestThreats: typeof allThreats = [];
      
      allThreats.forEach(threat => {
        let root = threat;
        while (root.parent_threat_id && threatMap.has(root.parent_threat_id)) {
          root = threatMap.get(root.parent_threat_id)!;
        }
        
        if (processedRoots.has(root.id)) return;
        processedRoots.add(root.id);
        
        const chainThreats = allThreats.filter(t => {
          let current = t;
          while (current) {
            if (current.id === root.id) return true;
            if (!current.parent_threat_id) break;
            current = threatMap.get(current.parent_threat_id)!;
          }
          return false;
        });
        
        chainThreats.sort((a, b) => 
          (stagePriority[b.stage as keyof typeof stagePriority] || 0) - 
          (stagePriority[a.stage as keyof typeof stagePriority] || 0)
        );
        
        if (chainThreats.length > 0) {
          maturestThreats.push(chainThreats[0]);
        }
      });
      
      return maturestThreats.sort((a, b) => 
        (stagePriority[b.stage as keyof typeof stagePriority] || 0) - 
        (stagePriority[a.stage as keyof typeof stagePriority] || 0)
      );
    }
    
    // Fallback: group by content similarity (extract actor + core pattern)
    const extractCorePattern = (statement: string) => {
      // Extract actor type and key identifiers
      const actorMatch = statement.match(/^(?:Using [^,]+, )?(?:A |An )([^with]+)/i);
      const assetMatch = statement.match(/(?:of|target(?:ing)?)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\s+to|\s+in order|\s*$)/i);
      const actor = actorMatch ? actorMatch[1].trim().toLowerCase() : '';
      const asset = assetMatch ? assetMatch[1].trim().toLowerCase() : '';
      return `${actor}::${asset}`;
    };
    
    const groupedThreats = new Map<string, typeof allThreats>();
    
    allThreats.forEach(threat => {
      const pattern = extractCorePattern(threat.threat_statement);
      if (!groupedThreats.has(pattern)) {
        groupedThreats.set(pattern, []);
      }
      groupedThreats.get(pattern)!.push(threat);
    });
    
    const maturestThreats: typeof allThreats = [];
    
    groupedThreats.forEach(threats => {
      threats.sort((a, b) => 
        (stagePriority[b.stage as keyof typeof stagePriority] || 0) - 
        (stagePriority[a.stage as keyof typeof stagePriority] || 0)
      );
      maturestThreats.push(threats[0]);
    });
    
    return maturestThreats.sort((a, b) => 
      (stagePriority[b.stage as keyof typeof stagePriority] || 0) - 
      (stagePriority[a.stage as keyof typeof stagePriority] || 0)
    );
  };

  const maturestThreats = allThreats.length > 0 ? getHighestMaturityThreats() : [];

  // Calculate which threat numbers are associated with each asset
  const assetThreatNumbers = useMemo(() => {
    const mapping: Record<string, number[]> = {};
    const assetNames = assets.map(a => a.name);
    
    maturestThreats.forEach((threat, index) => {
      const threatNum = index + 1;
      assetNames.forEach(assetName => {
        if (threat.threat_statement.toLowerCase().includes(assetName.toLowerCase())) {
          if (!mapping[assetName]) {
            mapping[assetName] = [];
          }
          if (!mapping[assetName].includes(threatNum)) {
            mapping[assetName].push(threatNum);
          }
        }
      });
    });
    
    return mapping;
  }, [maturestThreats, assets]);

  // Prepare diagram nodes with threat numbers
  const diagramNodes = useMemo(() => {
    if (savedNodes.length === 0) return [];
    return savedNodes.map(node => {
      const assetName = node.data.label as string;
      return {
        ...node,
        type: "asset",
        data: {
          ...node.data,
          threatNumbers: assetThreatNumbers[assetName] || [],
        },
      };
    });
  }, [savedNodes, assetThreatNumbers]);

  const generateContent = async (version: string): Promise<DocumentSection[]> => {
    return [
      {
        heading: "Deeper Threat Model",
        content: "This document outlines the detailed threat analysis with control assessments.",
        level: HeadingLevel.HEADING_1,
      },
      {
        heading: "Threat Statements",
        content: maturestThreats.length > 0 ? maturestThreats.map(t => t.threat_statement) : ["No threats identified"],
        level: HeadingLevel.HEADING_2,
      },
    ];
  };

  const isLoading = threatsLoading || controlsLoading || diagramLoading || assetsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Deeper Threat Model</h2>
          <p className="text-muted-foreground">
            View threats at their highest maturity with control assessment analysis
          </p>
        </div>
        {projectId && project && (
          <GenerateArtefactButton
            projectId={projectId}
            projectName={project.title}
            artefactType="deeper-threat-model"
            artefactName="Deeper Threat Model"
            generateContent={generateContent}
          />
        )}
      </div>

      {/* System Diagram */}
      {diagramNodes.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">System Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px] border rounded-lg bg-background">
              <ReactFlow
                nodes={diagramNodes}
                edges={savedEdges}
                nodeTypes={diagramNodeTypes}
                proOptions={{ hideAttribution: true }}
                style={{ width: '100%', height: '100%' }}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                panOnDrag={false}
                panOnScroll={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                minZoom={1}
                maxZoom={1}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                nodeExtent={[[0, 0], [800, 330]]}
              >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
            <p className="text-center text-muted-foreground text-sm mt-2">
              Numbers on assets indicate associated threats from the list below
            </p>
          </CardContent>
        </Card>
      )}

      {maturestThreats.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No threats found. Build threats using the Threat Tooling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {maturestThreats.map((threat, index) => (
            <ThreatWithControls
              key={threat.id}
              threatStatement={threat.threat_statement}
              threatId={threat.id}
              controls={controls}
              index={index}
              getRelatedThreatIds={getRelatedThreatIds}
              stage={threat.stage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
