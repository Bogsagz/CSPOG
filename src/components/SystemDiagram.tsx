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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Server, Database, CloudCog, Workflow, AppWindow, Save } from "lucide-react";
import { useSystemDiagram } from "@/hooks/useSystemDiagram";

interface SystemDiagramProps {
  assets: { id: string; name: string; vendor?: string; version?: string; type?: string }[];
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
function AssetNode({ data }: { data: { label: string; vendor?: string; version?: string; type?: string } }) {
  const Icon = getAssetIcon(data.type);
  
  return (
    <div className="flex flex-col items-center gap-1.5 p-2">
      <Handle type="source" position={Position.Top} id="top" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Left} id="left" className="w-2 h-2 !bg-primary" />
      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-primary" />
      
      <div className="w-12 h-12 rounded bg-card border border-primary flex items-center justify-center shadow-sm">
        <Icon className="h-6 w-6 text-primary" />
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

export function SystemDiagram({ assets, canWrite, projectId }: SystemDiagramProps) {
  const { diagram, isLoading, saveDiagram, nodes: savedNodes, edges: savedEdges } = useSystemDiagram(projectId);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load saved diagram on mount
  useEffect(() => {
    if (!isLoading && savedNodes.length > 0) {
      setNodes(savedNodes);
      setEdges(savedEdges);
    }
  }, [isLoading, savedNodes, savedEdges, setNodes, setEdges]);

  // Track unsaved changes
  useEffect(() => {
    if (isLoading) return;
    
    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(savedNodes);
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(savedEdges);
    setHasUnsavedChanges(nodesChanged || edgesChanged);
  }, [nodes, edges, savedNodes, savedEdges, isLoading]);

  // Get asset IDs already in diagram
  const assetIdsInDiagram = useMemo(() => {
    return nodes.map((n) => n.data.assetId as string);
  }, [nodes]);

  // Get available assets (not yet in diagram)
  const availableAssets = useMemo(() => {
    return assets.filter((a) => !assetIdsInDiagram.includes(a.id));
  }, [assets, assetIdsInDiagram]);

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

  const handleAddAsset = () => {
    if (!selectedAssetId || !canWrite) return;

    const asset = assets.find(a => a.id === selectedAssetId);
    if (!asset) return;

    const newNode: Node = {
      id: `asset-${Date.now()}`,
      type: "asset",
      position: { x: Math.random() * 700 + 20, y: Math.random() * 300 + 20 },
      data: { 
        label: asset.name, 
        assetId: asset.id,
        vendor: asset.vendor,
        version: asset.version,
        type: asset.type,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedAssetId("");
  };

  const handleRemoveNode = () => {
    if (!selectedNode || !canWrite) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  };

  const handleSave = () => {
    saveDiagram.mutate({ nodes, edges });
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode);
  }, [nodes, selectedNode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[300px]">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Add Asset to Diagram</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex gap-2">
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId} disabled={!canWrite}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {availableAssets.length === 0 ? (
                    <SelectItem value="-1" disabled>
                      No assets available
                    </SelectItem>
                  ) : (
                    availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddAsset} disabled={!selectedAssetId || !canWrite} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[200px]">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Save Diagram</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <Button 
              onClick={handleSave} 
              disabled={!canWrite || saveDiagram.isPending || !hasUnsavedChanges}
              size="sm"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveDiagram.isPending ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
            </Button>
          </CardContent>
        </Card>

        {selectedNode && selectedNodeData && (
          <Card className="flex-1 min-w-[300px]">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected: {selectedNodeData.data.label as string}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveNode}
                  disabled={!canWrite}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-sm text-muted-foreground">
                Click the delete button to remove this asset from the diagram.
                Click on a connection line to remove it.
              </p>
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

      {nodes.length === 0 && (
        <p className="text-center text-muted-foreground text-sm">
          Add assets from the dropdown above to start building your system diagram. 
          Connect assets by dragging from one handle to another.
        </p>
      )}
    </div>
  );
}
