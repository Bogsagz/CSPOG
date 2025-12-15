import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSavedThreats } from "@/hooks/useSavedThreats";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Detection {
  id: string;
  detection_id: string;
  name: string;
  description: string | null;
  analytics: string | null;
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

interface ThreatWithDetections {
  id: string;
  threat_statement: string;
  stage: string;
  techniqueIds: string[];
  detections: TechniqueDetection[];
  hasAttackMapping: boolean;
}

export default function MonitoringRequirements() {
  const { projectId } = useParams();
  
  // Load all threats (all stages)
  const { threatObjects: allThreats, isLoading: threatsLoading } = useSavedThreats(projectId || null);
  const [threatsWithDetections, setThreatsWithDetections] = useState<ThreatWithDetections[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract ATT&CK technique IDs from threat statement
  const extractTechniqueIds = (threatStatement: string): string[] => {
    const techniquePattern = /T\d{4}(?:\.\d{3})?/g;
    const matches = threatStatement.match(techniquePattern);
    return matches ? [...new Set(matches)] : [];
  };

  // Get the highest maturity threat for each threat chain
  const getHighestMaturityThreats = () => {
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
      
      const stagePriority = { final: 3, intermediate: 2, initial: 1 };
      chainThreats.sort((a, b) => 
        (stagePriority[b.stage as keyof typeof stagePriority] || 0) - 
        (stagePriority[a.stage as keyof typeof stagePriority] || 0)
      );
      
      if (chainThreats.length > 0) {
        maturestThreats.push(chainThreats[0]);
      }
    });
    
    return maturestThreats;
  };

  // Load detections for all threats
  useEffect(() => {
    const loadAllDetections = async () => {
      if (allThreats.length === 0) {
        setThreatsWithDetections([]);
        return;
      }

      setLoading(true);
      try {
        const maturestThreats = getHighestMaturityThreats();
        const results: ThreatWithDetections[] = [];

        for (const threat of maturestThreats) {
          const techniqueIds = extractTechniqueIds(threat.threat_statement);
          const hasAttackMapping = techniqueIds.length > 0 && threat.stage === 'final';
          
          let detections: TechniqueDetection[] = [];
          
          if (hasAttackMapping) {
            const { data: techniqueDetections, error } = await supabase
              .from("attack_technique_detections")
              .select(`
                technique_id,
                detection_id,
                attack_detections (
                  id,
                  detection_id,
                  name,
                  description,
                  analytics
                )
              `)
              .in("technique_id", techniqueIds);

            if (!error && techniqueDetections) {
              // Get all detection IDs to fetch structured log sources
              const detectionIds = techniqueDetections
                .filter(td => td.attack_detections)
                .map(td => (td.attack_detections as any).id);

              // Fetch structured log sources
              const { data: structuredSources, error: sourcesError } = await supabase
                .from("detection_log_sources")
                .select("*")
                .in("detection_id", detectionIds);

              if (!sourcesError) {
                detections = techniqueDetections
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
              }
            }
          }

          results.push({
            id: threat.id,
            threat_statement: threat.threat_statement,
            stage: threat.stage,
            techniqueIds,
            detections,
            hasAttackMapping
          });
        }

        // Sort: threats with monitoring requirements first
        const sorted = results.sort((a, b) => {
          const aHasMonitoring = a.hasAttackMapping && a.detections.length > 0 ? 1 : 0;
          const bHasMonitoring = b.hasAttackMapping && b.detections.length > 0 ? 1 : 0;
          return bHasMonitoring - aHasMonitoring;
        });
        setThreatsWithDetections(sorted);
      } catch (error) {
        console.error("Error loading detections:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllDetections();
  }, [allThreats]);

  if (threatsLoading || loading) {
    return (
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Monitoring Requirements</h2>
          <p className="text-muted-foreground">Loading threat statements and detection strategies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Monitoring Requirements</h2>
        <p className="text-muted-foreground">
          Security monitoring requirements based on identified threats and MITRE ATT&CK detection strategies
        </p>
      </div>

      {threatsWithDetections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No threat statements have been created for this project.</p>
          </CardContent>
        </Card>
      ) : (
        threatsWithDetections.map((threat, index) => (
          <Card key={threat.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span>Threat Statement {index + 1}</span>
                <Badge variant={threat.stage === 'final' ? 'default' : threat.stage === 'intermediate' ? 'secondary' : 'outline'}>
                  {threat.stage.charAt(0).toUpperCase() + threat.stage.slice(1)} Stage
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Threat Statement */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-foreground">{threat.threat_statement}</p>
              </div>

              {/* ATT&CK Techniques (if any) */}
              {threat.techniqueIds.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">ATT&CK Techniques:</span>
                  {threat.techniqueIds.map(id => (
                    <Badge key={id} variant="secondary">{id}</Badge>
                  ))}
                </div>
              )}

              {/* No MITRE Mapping Warning */}
              {!threat.hasAttackMapping && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-700 dark:text-amber-400">
                    MITRE ATT&CK mapping does not yet exist for this threat. This threat statement requires further maturation to the final stage with adversarial techniques applied.
                  </p>
                </div>
              )}

              {/* Detection Strategies with Structured Log Sources */}
              {threat.hasAttackMapping && threat.detections.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Detection Strategies & Log Sources
                  </h4>
                  
                  {threat.detections.map((td, detIdx) => (
                    <div key={detIdx} className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/50 border-b flex items-center gap-2">
                        <Badge variant="outline">{td.technique_id}</Badge>
                        <span className="font-medium">{td.detection.name}</span>
                      </div>
                      
                      {/* Analytics Section */}
                      {td.detection.analytics && (
                        <div className="p-4 border-b bg-primary/5">
                          <h5 className="text-sm font-semibold mb-2 text-primary">Detection Analytics</h5>
                          <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded-lg overflow-x-auto">
                            {td.detection.analytics}
                          </pre>
                        </div>
                      )}

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
                        <div className="p-3 text-sm text-muted-foreground">
                          No structured log sources available for this detection
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* No detections found */}
              {threat.hasAttackMapping && threat.detections.length === 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-muted-foreground">
                    No detection strategies found for the identified ATT&CK techniques.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
