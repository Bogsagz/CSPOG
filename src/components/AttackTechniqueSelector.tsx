import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { 
  getAttackMatrices, 
  AttackMatrix, 
  Tactic, 
  Technique, 
  SubTechnique 
} from "@/lib/attackFramework";
import { ChevronDown, ChevronRight, Search, X, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedTechnique {
  matrix: AttackMatrix;
  tacticId: string;
  tacticName: string;
  techniqueId: string;
  techniqueName: string;
  subTechniqueId?: string;
  subTechniqueName?: string;
}

interface AttackTechniqueSelectorProps {
  selectedTechniques: SelectedTechnique[];
  onSelectionChange: (techniques: SelectedTechnique[]) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const AttackTechniqueSelector = ({
  selectedTechniques,
  onSelectionChange,
  disabled = false,
  children,
}: AttackTechniqueSelectorProps) => {
  const [activeMatrix, setActiveMatrix] = useState<AttackMatrix>("enterprise");
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(new Set());
  const [expandedTechniques, setExpandedTechniques] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const matrices = useMemo(() => getAttackMatrices(), []);
  const currentMatrix = matrices[activeMatrix];

  const filteredTactics = useMemo(() => {
    if (!searchQuery.trim()) return currentMatrix.tactics;
    
    const query = searchQuery.toLowerCase();
    return currentMatrix.tactics
      .map(tactic => ({
        ...tactic,
        techniques: tactic.techniques.filter(tech => {
          const techMatch = tech.id.toLowerCase().includes(query) || 
                           tech.name.toLowerCase().includes(query);
          const subMatch = tech.subTechniques?.some(sub => 
            sub.id.toLowerCase().includes(query) || 
            sub.name.toLowerCase().includes(query)
          );
          return techMatch || subMatch;
        })
      }))
      .filter(tactic => 
        tactic.techniques.length > 0 ||
        tactic.name.toLowerCase().includes(query)
      );
  }, [currentMatrix, searchQuery]);

  const toggleTactic = (tacticId: string) => {
    setExpandedTactics(prev => {
      const next = new Set(prev);
      if (next.has(tacticId)) {
        next.delete(tacticId);
      } else {
        next.add(tacticId);
      }
      return next;
    });
  };

  const toggleTechnique = (techniqueId: string) => {
    setExpandedTechniques(prev => {
      const next = new Set(prev);
      if (next.has(techniqueId)) {
        next.delete(techniqueId);
      } else {
        next.add(techniqueId);
      }
      return next;
    });
  };

  const isSelected = (
    tacticId: string, 
    techniqueId: string, 
    subTechniqueId?: string
  ): boolean => {
    return selectedTechniques.some(t => 
      t.matrix === activeMatrix &&
      t.tacticId === tacticId &&
      t.techniqueId === techniqueId &&
      t.subTechniqueId === subTechniqueId
    );
  };

  const handleSelect = (
    tactic: Tactic,
    technique: Technique,
    subTechnique?: SubTechnique
  ) => {
    if (disabled) return;

    const selection: SelectedTechnique = {
      matrix: activeMatrix,
      tacticId: tactic.id,
      tacticName: tactic.name,
      techniqueId: technique.id,
      techniqueName: technique.name,
      subTechniqueId: subTechnique?.id,
      subTechniqueName: subTechnique?.name,
    };

    const existingIndex = selectedTechniques.findIndex(t =>
      t.matrix === selection.matrix &&
      t.tacticId === selection.tacticId &&
      t.techniqueId === selection.techniqueId &&
      t.subTechniqueId === selection.subTechniqueId
    );

    if (existingIndex >= 0) {
      onSelectionChange(selectedTechniques.filter((_, i) => i !== existingIndex));
    } else {
      onSelectionChange([...selectedTechniques, selection]);
    }
  };

  const removeSelection = (index: number) => {
    if (disabled) return;
    onSelectionChange(selectedTechniques.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  const formatTechniquesString = (): string => {
    if (selectedTechniques.length === 0) return "";
    return selectedTechniques
      .map(t => `${t.subTechniqueName || t.techniqueName} (${t.subTechniqueId || t.techniqueId})`)
      .join(" or ");
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            ATT&CK Techniques
          </CardTitle>
          {selectedTechniques.length > 0 && !disabled && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Techniques Display */}
        {selectedTechniques.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Selected ({selectedTechniques.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedTechniques.map((tech, index) => (
                <Badge 
                  key={`${tech.techniqueId}-${tech.subTechniqueId || 'base'}-${index}`}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <span className="text-xs font-mono">
                    {tech.subTechniqueId || tech.techniqueId}
                  </span>
                  <span className="text-xs">
                    {tech.subTechniqueName || tech.techniqueName}
                  </span>
                  {!disabled && (
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeSelection(index)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            {/* Embedded threat statement component */}
            {children}
          </div>
        )}

        {/* Matrix Tabs */}
        <Tabs value={activeMatrix} onValueChange={(v) => setActiveMatrix(v as AttackMatrix)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
            <TabsTrigger value="ics">ICS</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search techniques..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={disabled}
            />
          </div>

          {/* Matrix Content */}
          <TabsContent value={activeMatrix} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredTactics.map(tactic => (
                  <Collapsible
                    key={tactic.id}
                    open={expandedTactics.has(tactic.id)}
                    onOpenChange={() => toggleTactic(tactic.id)}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      {expandedTactics.has(tactic.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-semibold text-sm">{tactic.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {tactic.techniques.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1 mt-1">
                      {tactic.techniques.map(technique => (
                        <div key={technique.id} className="space-y-1">
                          {technique.subTechniques && technique.subTechniques.length > 0 ? (
                            <Collapsible
                              open={expandedTechniques.has(technique.id)}
                              onOpenChange={() => toggleTechnique(technique.id)}
                            >
                              <div className="flex items-center gap-1">
                                <CollapsibleTrigger className="p-1 hover:bg-accent/50 rounded">
                                  {expandedTechniques.has(technique.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </CollapsibleTrigger>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "justify-start flex-1 h-auto py-1 px-2 text-left",
                                    isSelected(tactic.id, technique.id) && "bg-primary/20 text-primary"
                                  )}
                                  onClick={() => handleSelect(tactic, technique)}
                                  disabled={disabled}
                                >
                                  <span className="font-mono text-xs mr-2 text-muted-foreground">
                                    {technique.id}
                                  </span>
                                  <span className="text-sm truncate">{technique.name}</span>
                                </Button>
                              </div>
                              <CollapsibleContent className="pl-6 space-y-1 mt-1">
                                {technique.subTechniques.map(sub => (
                                  <Button
                                    key={sub.id}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "justify-start w-full h-auto py-1 px-2 text-left",
                                      isSelected(tactic.id, technique.id, sub.id) && "bg-primary/20 text-primary"
                                    )}
                                    onClick={() => handleSelect(tactic, technique, sub)}
                                    disabled={disabled}
                                  >
                                    <span className="font-mono text-xs mr-2 text-muted-foreground">
                                      {sub.id}
                                    </span>
                                    <span className="text-sm truncate">{sub.name}</span>
                                  </Button>
                                ))}
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "justify-start w-full h-auto py-1 px-2 text-left ml-5",
                                isSelected(tactic.id, technique.id) && "bg-primary/20 text-primary"
                              )}
                              onClick={() => handleSelect(tactic, technique)}
                              disabled={disabled}
                            >
                              <span className="font-mono text-xs mr-2 text-muted-foreground">
                                {technique.id}
                              </span>
                              <span className="text-sm truncate">{technique.name}</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export type { SelectedTechnique };
