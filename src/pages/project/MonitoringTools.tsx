import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSavedThreats } from "@/hooks/useSavedThreats";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Activity, Search, AlertTriangle } from "lucide-react";

interface Detection {
  id: string;
  detection_id: string;
  name: string;
  description: string | null;
}

interface StructuredLogSource {
  id: string;
  data_source: string;
  data_component: string;
  channel: string;
}

interface TechniqueDetection {
  technique_id: string;
  detection: Detection;
  logSources: StructuredLogSource[];
}

export default function MonitoringTools() {
  const { projectId } = useParams();
  const { threatObjects, isLoading: threatsLoading } = useSavedThreats(projectId || null, 'final');
  const [selectedThreatId, setSelectedThreatId] = useState<string>("");
  const [detections, setDetections] = useState<TechniqueDetection[]>([]);
  const [loadingDetections, setLoadingDetections] = useState(false);
  const [selectedLogSources, setSelectedLogSources] = useState<Set<string>>(new Set());
  const [savingSelection, setSavingSelection] = useState(false);

  // Extract ATT&CK technique IDs from threat statement
  const extractTechniqueIds = (threatStatement: string): string[] => {
    const techniquePattern = /T\d{4}(?:\.\d{3})?/g;
    const matches = threatStatement.match(techniquePattern);
    return matches ? [...new Set(matches)] : [];
  };

  // Load detections and saved log sources when threat is selected
  useEffect(() => {
    const loadDetectionsAndSelections = async () => {
      if (!selectedThreatId) {
        setDetections([]);
        setSelectedLogSources(new Set());
        return;
      }

      const threat = threatObjects.find(t => t.id === selectedThreatId);
      if (!threat) return;

      const techniqueIds = extractTechniqueIds(threat.threat_statement);
      
      setLoadingDetections(true);
      try {
        // Load saved log source selections for this threat
        const { data: savedSources, error: savedError } = await supabase
          .from("threat_log_sources")
          .select("log_source")
          .eq("threat_id", selectedThreatId);

        if (!savedError && savedSources) {
          setSelectedLogSources(new Set(savedSources.map(s => s.log_source)));
        }

        if (techniqueIds.length === 0) {
          setDetections([]);
          return;
        }

        // Get detections for the techniques
        const { data: techniqueDetections, error } = await supabase
          .from("attack_technique_detections")
          .select(`
            technique_id,
            detection_id,
            attack_detections (
              id,
              detection_id,
              name,
              description
            )
          `)
          .in("technique_id", techniqueIds);

        if (error) throw error;

        if (techniqueDetections) {
          // Get all detection IDs to fetch structured log sources
          const detectionIds = techniqueDetections
            .filter(td => td.attack_detections)
            .map(td => (td.attack_detections as any).id);

          // Fetch structured log sources
          const { data: structuredSources, error: sourcesError } = await supabase
            .from("detection_log_sources")
            .select("*")
            .in("detection_id", detectionIds);

          if (sourcesError) throw sourcesError;

          const mappedDetections: TechniqueDetection[] = techniqueDetections
            .filter(td => td.attack_detections)
            .map(td => {
              const detection = td.attack_detections as unknown as Detection;
              const logSources = (structuredSources || []).filter(
                s => s.detection_id === detection.id
              );
              return {
                technique_id: td.technique_id,
                detection,
                logSources
              };
            });
          setDetections(mappedDetections);
        }
      } catch (error) {
        console.error("Error loading detections:", error);
      } finally {
        setLoadingDetections(false);
      }
    };

    loadDetectionsAndSelections();
  }, [selectedThreatId, threatObjects]);

  const selectedThreat = threatObjects.find(t => t.id === selectedThreatId);
  const techniqueIds = selectedThreat ? extractTechniqueIds(selectedThreat.threat_statement) : [];

  // Get unique channels from all detections for selection
  const allChannels = [...new Set(
    detections.flatMap(d => d.logSources.map(ls => ls.channel))
  )].sort();

  const toggleLogSource = async (source: string) => {
    if (!selectedThreatId || savingSelection) return;
    
    setSavingSelection(true);
    const isCurrentlySelected = selectedLogSources.has(source);
    
    try {
      if (isCurrentlySelected) {
        const { error } = await supabase
          .from("threat_log_sources")
          .delete()
          .eq("threat_id", selectedThreatId)
          .eq("log_source", source);
        
        if (error) throw error;
        
        setSelectedLogSources(prev => {
          const newSet = new Set(prev);
          newSet.delete(source);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from("threat_log_sources")
          .insert({ threat_id: selectedThreatId, log_source: source });
        
        if (error) throw error;
        
        setSelectedLogSources(prev => {
          const newSet = new Set(prev);
          newSet.add(source);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error saving log source selection:", error);
    } finally {
      setSavingSelection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monitoring Tools</h1>
        <p className="text-muted-foreground mt-1">
          Select a threat statement to view and configure logging sources from detection strategies
        </p>
      </div>

      {/* Threat Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Threat Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedThreatId} onValueChange={setSelectedThreatId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a final stage threat statement..." />
            </SelectTrigger>
            <SelectContent>
              {threatsLoading ? (
                <SelectItem value="loading" disabled>Loading threats...</SelectItem>
              ) : threatObjects.length === 0 ? (
                <SelectItem value="none" disabled>No final stage threats found</SelectItem>
              ) : (
                threatObjects.map(threat => (
                  <SelectItem key={threat.id} value={threat.id}>
                    <span className="line-clamp-2">{threat.threat_statement.substring(0, 100)}...</span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedThreat && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground">{selectedThreat.threat_statement}</p>
              {techniqueIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">ATT&CK Techniques:</span>
                  {techniqueIds.map(id => (
                    <Badge key={id} variant="secondary">{id}</Badge>
                  ))}
                </div>
              )}
              {techniqueIds.length === 0 && (
                <div className="mt-3 flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">No ATT&CK techniques detected in this threat statement</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Strategies with Structured Log Sources */}
      {selectedThreatId && techniqueIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detection Strategies & Log Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDetections ? (
              <p className="text-muted-foreground">Loading detection strategies...</p>
            ) : detections.length === 0 ? (
              <p className="text-muted-foreground">No detection strategies found for the identified techniques</p>
            ) : (
              <div className="space-y-6">
                {detections.map((td, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{td.technique_id}</Badge>
                        <span className="font-medium">{td.detection.name}</span>
                      </div>
                      {td.detection.description && (
                        <p className="text-sm text-muted-foreground mt-2">{td.detection.description}</p>
                      )}
                    </div>
                    {td.logSources.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data Source</TableHead>
                            <TableHead>Data Component</TableHead>
                            <TableHead>Channel</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {td.logSources.map((ls) => (
                            <TableRow key={ls.id}>
                              <TableCell className="font-medium">{ls.data_source}</TableCell>
                              <TableCell>{ls.data_component}</TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">{ls.channel}</code>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        No structured log sources available for this detection
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Channel Selection */}
      {selectedThreatId && allChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Applicable Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Select the logging channels that are available in your environment:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChannels.map(channel => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel}
                    checked={selectedLogSources.has(channel)}
                    onCheckedChange={() => toggleLogSource(channel)}
                    disabled={savingSelection}
                  />
                  <label
                    htmlFor={channel}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {channel}
                  </label>
                </div>
              ))}
            </div>

            {selectedLogSources.size > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Channels ({selectedLogSources.size})</h4>
                <div className="flex flex-wrap gap-2">
                  {[...selectedLogSources].map(source => (
                    <Badge key={source} variant="default">{source}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
