import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2 } from "lucide-react";
import type { SelectedTechnique } from "@/components/AttackTechniqueSelector";

interface Link {
  table1: number;
  item1: number;
  table2: number;
  item2: number;
}

export type ThreatBuilderStage = "initial" | "intermediate" | "final";

interface ThreatBuilderProps {
  tables: { title: string; items: string[] }[];
  links: Link[];
  onClearLinks: () => void;
  onSaveThreat: (threat: string, stage: ThreatBuilderStage) => void;
  canWrite: boolean;
  stage?: ThreatBuilderStage;
  baseThreatStatement?: string;
  localImpact?: string;
  onLocalImpactChange?: (value: string) => void;
  selectedAttackTechniques?: SelectedTechnique[];
  baseIntermediateThreat?: string;
}

// Table indices:
// 0: Actors, 1: Vectors, 2: Stride+, 3: Assets, 4: Adversarial actions, 5: Local Objectives, 6: CIANA, 7: Strategic Objectives

// Stage definitions:
// Initial: Actors, Vectors, Assets, Local Objectives, Strategic Objectives (0, 1, 3, 5, 7)
// Intermediate: + Stride+, CIANA, Adversarial actions (2, 4, 6)
// Final: All tables (0, 1, 2, 3, 4, 5, 6, 7)

export const getTablesForStage = (stage: ThreatBuilderStage): number[] => {
  switch (stage) {
    case "initial":
      return [0, 1, 3, 5, 7]; // Actors, Vectors, Assets, Local Objectives, Strategic Objectives
    case "intermediate":
      return [0, 1, 2, 3, 4, 5, 6, 7]; // + Stride+, CIANA, Adversarial actions
    case "final":
      return [0, 1, 2, 3, 4, 5, 6, 7]; // All tables
    default:
      return [0, 1, 2, 3, 4, 5, 6, 7];
  }
};

export const ThreatBuilder = ({ tables, links, onClearLinks, onSaveThreat, canWrite, stage = "final", baseThreatStatement, localImpact = "", onLocalImpactChange, selectedAttackTechniques = [], baseIntermediateThreat }: ThreatBuilderProps) => {
  const generateSentence = () => {
    // Extract selected items from each table type
    const selectedItems: { [key: string]: string | null } = {
      asset: null,
      actor: null,
      localObjective: null,
      strategicObjective: null,
      vector: null,
      adversarialAction: null,
      stride: null,
      ciana: null,
    };

    // Process links to extract items from relevant tables
    links.forEach((link) => {
      const item1 = tables[link.table1]?.items[link.item1];
      const item2 = tables[link.table2]?.items[link.item2];
      
      // Map table indices to item types
      const tableMapping = [
        { index: 0, key: 'actor' },
        { index: 1, key: 'vector' },
        { index: 2, key: 'stride' },
        { index: 3, key: 'asset' },
        { index: 4, key: 'adversarialAction' },
        { index: 5, key: 'localObjective' },
        { index: 6, key: 'ciana' },
        { index: 7, key: 'strategicObjective' },
      ];
      
      tableMapping.forEach(({ index, key }) => {
        if (link.table1 === index && item1) selectedItems[key] = item1;
        if (link.table2 === index && item2) selectedItems[key] = item2;
      });
    });

    const { actor, localObjective, strategicObjective, vector, adversarialAction, stride, ciana, asset } = selectedItems;
    
    // Build stage-appropriate message and statement
    if (stage === "initial") {
      // Initial stage: Actors, Vectors, Assets, Local Objectives, Strategic Objectives
      const missingTables: string[] = [];
      if (!actor) missingTables.push("Actors");
      if (!vector) missingTables.push("Vectors");
      if (!asset) missingTables.push("Assets");
      if (!localObjective) missingTables.push("Local Objectives");
      if (!strategicObjective) missingTables.push("Strategic Objectives");
      
      if (missingTables.length > 0) {
        const tableList = missingTables.length === 1 
          ? missingTables[0]
          : missingTables.slice(0, -1).join(", ") + " and " + missingTables[missingTables.length - 1];
        return `Select items from ${tableList} to build the initial threat statement.`;
      }

      const startsWithVowel = /^[aeiou]/i.test(actor);
      const article = startsWithVowel ? "An" : "A";
      return `${article} ${actor} with ${vector} could target the ${asset} to conduct ${localObjective} in order to ${strategicObjective}`;
    }
    
    if (stage === "intermediate") {
      // Intermediate stage: Build upon base threat statement
      // New format: "A/An [Actor] with [Vector] could [Adversarial Action] which leads to [local impact], resulting in [Local Objective] impacting [CIANA] of [Asset] in order to [Strategic Objective]"
      if (!baseThreatStatement) {
        return "Select an initial threat statement to build upon.";
      }
      
      const missingItems: string[] = [];
      if (!adversarialAction) missingItems.push("Adversarial actions");
      if (!localImpact?.trim()) missingItems.push("Local Impact (free text)");
      if (!ciana) missingItems.push("CIANA");
      
      if (missingItems.length > 0) {
        const itemList = missingItems.length === 1 
          ? missingItems[0]
          : missingItems.slice(0, -1).join(", ") + " and " + missingItems[missingItems.length - 1];
        return `Provide ${itemList} to enhance the threat statement.`;
      }

      // Parse base threat to extract components
      // Base format: "A/An [actor] with [vector] could target the [asset] to conduct [localObjective] in order to [strategicObjective]"
      const baseMatch = baseThreatStatement.match(/^(An?\s+)(.+?)\s+with\s+(.+?)\s+could\s+target\s+the\s+(.+?)\s+to\s+conduct\s+(.+?)\s+in\s+order\s+to\s+(.+)$/i);
      
      if (baseMatch) {
        const [, article, baseActor, baseVector, baseAsset, baseLocalObj, baseStrategicObj] = baseMatch;
        return `${article}${baseActor} with ${baseVector} could ${adversarialAction} which leads to ${localImpact}, resulting in ${baseLocalObj} impacting ${ciana} of ${baseAsset} in order to ${baseStrategicObj}`;
      }
      
      // Fallback if parsing fails - append components
      return `${baseThreatStatement} [Enhanced: ${adversarialAction}, ${localImpact}, ${ciana}]`;
    }

    // Final stage: Build upon intermediate threat with ATT&CK techniques
    // Format: "Using [ATT&CK Techniques] [intermediate threat statement]"
    
    if (!baseIntermediateThreat) {
      return "Select an intermediate threat statement to build upon.";
    }
    
    if (selectedAttackTechniques.length === 0) {
      return "Select ATT&CK techniques to complete the final threat statement.";
    }
    
    // Format techniques as "technique1 or technique2 or technique3"
    const techniquesString = selectedAttackTechniques
      .map(t => `${t.subTechniqueName || t.techniqueName} (${t.subTechniqueId || t.techniqueId})`)
      .join(" or ");
    
    return `Using ${techniquesString}, ${baseIntermediateThreat.charAt(0).toLowerCase()}${baseIntermediateThreat.slice(1)}`;
  };

  const getStageLabel = () => {
    switch (stage) {
      case "initial":
        return "Initial Threat Statement";
      case "intermediate":
        return "Intermediate Threat Statement";
      case "final":
        return "Complete Threat Statement";
      default:
        return "Threat Statement";
    }
  };

  const sentence = generateSentence();
  const hasLinks = links.length > 0;
  const isCompleteThreat = !sentence.startsWith("Select items");

  return (
    <Card className="transition-all hover:shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg font-semibold">{getStageLabel()}</CardTitle>
          </div>
          {hasLinks && canWrite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLinks}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Links
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[100px] p-6 rounded-lg bg-accent/10 border-2 border-accent/20">
          <p className={`text-lg leading-relaxed ${hasLinks ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {sentence}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {hasLinks && (
            <div className="text-sm text-muted-foreground">
              {links.length} {links.length === 1 ? "link" : "links"} created
            </div>
          )}
          {isCompleteThreat && canWrite && (
            <Button
              onClick={() => onSaveThreat(sentence, stage)}
              className="ml-auto"
            >
              Save Threat Statement
            </Button>
          )}
          {!canWrite && (
            <div className="ml-auto text-sm text-muted-foreground italic">
              Read-only access
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
