import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Node,
  Edge,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, CloudCog, Workflow, AppWindow } from "lucide-react";
import { useSystemDiagram } from "@/hooks/useSystemDiagram";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SavedThreat } from "@/hooks/useSavedThreats";

interface ThreatVisualizerProps {
  assets: string[];
  threatObjects: SavedThreat[];
  canWrite: boolean;
  projectId: string;
}

// Map asset types to icons
const getAssetIcon = (type?: string) => {
  switch (type) {
    case "Physical device":
      return Server;
    case "Data":
      return Database;
    case "Process":
      return Workflow;
    case "Cloud component":
      return CloudCog;
    case "Software component":
      return AppWindow;
    default:
      return Server;
  }
};

// Custom Asset Node component with icon-centered design
function AssetNode({ data }: { data: { label: string; threatNumbers: number[]; type?: string } }) {
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

const nodeTypes: NodeTypes = {
  asset: AssetNode,
};

// Get the most mature threats (one per chain)
const getHighestMaturityThreats = (threats: SavedThreat[]): SavedThreat[] => {
  const stageOrder: Record<string, number> = { initial: 0, intermediate: 1, final: 2 };
  
  // Group threats by content similarity
  const getActorAndAsset = (statement: string): string => {
    const actorMatch = statement.match(/^(?:A |An |Using [^,]+, (?:a |an )?)(\w+(?:\s+\w+)?)/i);
    const assetMatch = statement.match(/(?:of|against|targeting)\s+([^,.\n]+)/i);
    const actor = actorMatch?.[1]?.toLowerCase() || '';
    const asset = assetMatch?.[1]?.toLowerCase().trim() || '';
    return `${actor}|${asset}`;
  };
  
  const groups = new Map<string, SavedThreat[]>();
  
  threats.forEach(threat => {
    const key = getActorAndAsset(threat.threat_statement);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(threat);
  });
  
  const maturest: SavedThreat[] = [];
  groups.forEach(group => {
    const sorted = [...group].sort((a, b) => stageOrder[b.stage] - stageOrder[a.stage]);
    maturest.push(sorted[0]);
  });
  
  return maturest;
};

export function ThreatVisualizer({ assets, threatObjects, canWrite, projectId }: ThreatVisualizerProps) {
  const { isLoading, nodes: savedNodes, edges: savedEdges } = useSystemDiagram(projectId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Get mature threats for the table
  const matureThreats = useMemo(() => getHighestMaturityThreats(threatObjects), [threatObjects]);

  // Calculate which threat numbers are associated with each asset
  const assetThreatNumbers = useMemo(() => {
    const mapping: Record<string, number[]> = {};
    
    matureThreats.forEach((threat, index) => {
      const threatNum = index + 1;
      assets.forEach(assetName => {
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
  }, [matureThreats, assets]);

  // Load saved diagram on mount - convert to threat visualizer format
  useEffect(() => {
    if (!isLoading && savedNodes.length > 0) {
      const nodesWithThreats = savedNodes.map(node => {
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
      setNodes(nodesWithThreats);
      setEdges(savedEdges);
    }
  }, [isLoading, savedNodes, savedEdges, setNodes, setEdges, assetThreatNumbers]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (canWrite) {
        setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds));
      }
    },
    [canWrite, setEdges]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (canWrite) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [canWrite, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode);
  }, [nodes, selectedNode]);

  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case 'final': return 'default';
      case 'intermediate': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading diagram...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {nodes.length === 0 && (
          <Card className="flex-1">
            <CardContent className="py-4">
              <p className="text-muted-foreground text-sm">
                No system diagram found. Please create a diagram in Asset Tools → System Diagram first.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedNode && selectedNodeData && (
          <Card className="flex-1 min-w-[300px]">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                Selected: {selectedNodeData.data.label as string}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {(selectedNodeData.data.threatNumbers as number[])?.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Associated with threat{(selectedNodeData.data.threatNumbers as number[]).length > 1 ? 's' : ''}: {(selectedNodeData.data.threatNumbers as number[]).join(", ")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No threats associated with this asset</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full h-[400px] border rounded-lg bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={canWrite ? onNodesChange : undefined}
          onEdgesChange={canWrite ? onEdgesChange : undefined}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          proOptions={{ hideAttribution: true }}
          style={{ width: '100%', height: '100%' }}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          panOnScroll={false}
          minZoom={1}
          maxZoom={1}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodeExtent={[[0, 0], [800, 380]]}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {nodes.length > 0 && (
        <p className="text-center text-muted-foreground text-sm">
          Click on an asset to view associated threats.
        </p>
      )}

      {/* Mature Threats Table */}
      {matureThreats.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Threat Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead className="w-24">Stage</TableHead>
                  <TableHead>Threat Statement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matureThreats.map((threat, index) => (
                  <TableRow key={threat.id}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell>
                      <Badge variant={getStageBadgeVariant(threat.stage)}>
                        {threat.stage.charAt(0).toUpperCase() + threat.stage.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{threat.threat_statement}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
