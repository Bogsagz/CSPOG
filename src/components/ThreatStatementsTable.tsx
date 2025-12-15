import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParsedToken {
  type: 'text' | 'token';
  value: string;
  tokenType?: string;
}

// Parse a threat statement into tokens and text segments
const parseStatement = (statement: string): ParsedToken[] => {
  const tokens: ParsedToken[] = [];

  // Simple parsing: split by known connectors and treat segments as tokens
  // Include connectors for both initial, intermediate, and final threat formats
  const connectors = [
    ' with ', 
    ' could target the ', 
    ' could conduct ', 
    ' could ',  // For intermediate: "could [adversarial action]"
    ' which leads to ', // For intermediate: local impact
    ', resulting in ', // For intermediate: local objective
    ' of the ', 
    ' of ', // For intermediate: "of [asset]"
    ' by ', 
    ' to ', 
    ' impacting ', 
    ' in order to '
  ];
  
  let parts: string[] = [statement];
  connectors.forEach(connector => {
    const newParts: string[] = [];
    parts.forEach(part => {
      const split = part.split(connector);
      split.forEach((s, i) => {
        if (s) newParts.push(s);
        if (i < split.length - 1) newParts.push(connector);
      });
    });
    parts = newParts;
  });

  // Track the most recent connector to determine token type
  let lastConnector = '';

  // Categorize parts
  parts.forEach((part) => {
    const trimmed = part.trim();
    const isConnector = connectors.some(c => c.trim() === trimmed || c.trim() === trimmed.replace(/^,\s*/, ''));
    
    if (isConnector || trimmed === ',' || trimmed === ', to') {
      lastConnector = trimmed.replace(/^,\s*/, '');
      tokens.push({ type: 'text', value: part });
    } else if (trimmed.match(/^(An?|The)$/i)) {
      tokens.push({ type: 'text', value: part });
    } else if (trimmed) {
      // Determine token type based on the most recent connector
      let tokenType = 'Actor';
      
      if (lastConnector === 'in order to') tokenType = 'Strategic Objective';
      else if (lastConnector === 'of' || lastConnector === 'of the') tokenType = 'Asset';
      else if (lastConnector === 'impacting') tokenType = 'CIANA';
      else if (lastConnector === 'to') tokenType = 'Local Objective';
      else if (lastConnector === 'resulting in' || lastConnector === ', resulting in') tokenType = 'Local Objective';
      else if (lastConnector === 'which leads to') tokenType = 'Local Impact';
      else if (lastConnector === 'by') tokenType = 'Adversarial Action';
      else if (lastConnector === 'could target the') tokenType = 'Asset';
      else if (lastConnector === 'could conduct') tokenType = 'STRIDE+';
      else if (lastConnector === 'could') tokenType = 'Adversarial Action';
      else if (lastConnector === 'with') tokenType = 'Vector';
      // Default to 'Actor' for first token (no connector yet)
      
      tokens.push({ type: 'token', value: trimmed, tokenType });
    }
  });

  return tokens;
};

// Reconstruct statement from tokens
const reconstructStatement = (tokens: ParsedToken[]): string => {
  return tokens.map(t => t.value).join('');
};

interface ThreatStatementsTableProps {
  statements: string[];
  onDeleteStatement?: (index: number) => void;
  onUpdateStatement?: (index: number, newStatement: string) => void;
}

export const ThreatStatementsTable = ({ statements, onDeleteStatement, onUpdateStatement }: ThreatStatementsTableProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editTokens, setEditTokens] = useState<ParsedToken[]>([]);

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditTokens(parseStatement(statements[index]));
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && onUpdateStatement) {
      onUpdateStatement(editingIndex, reconstructStatement(editTokens));
      setEditingIndex(null);
      setEditTokens([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditTokens([]);
  };

  const handleTokenChange = (tokenIndex: number, newValue: string) => {
    setEditTokens(prev => {
      const updated = [...prev];
      updated[tokenIndex] = { ...updated[tokenIndex], value: newValue };
      return updated;
    });
  };

  return (
    <>
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Threat Statements</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {statements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No threat statements saved yet. Create and save threat statements above.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Threat Statement</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((statement, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{statement}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {onUpdateStatement && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(index)}
                        className="hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteStatement && (
                      <AlertDialog open={deleteIndex === index} onOpenChange={(open) => !open && setDeleteIndex(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteIndex(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Threat Statement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this threat statement? This action cannot be undone.
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                {statement}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                onDeleteStatement(index);
                                setDeleteIndex(null);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <Dialog open={editingIndex !== null} onOpenChange={handleCancelEdit}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Threat Statement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit text fields or modify tokens. Tokens (highlighted) represent selectable objects from the threat builder.
          </p>
          <div className="flex flex-wrap items-center gap-1 p-4 bg-muted/50 rounded-lg min-h-[100px]">
            {editTokens.map((token, index) => (
              token.type === 'token' ? (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm py-1 px-2 bg-primary/20 text-primary border border-primary/30"
                >
                  <span className="text-xs text-muted-foreground mr-1">{token.tokenType}:</span>
                  {token.value}
                </Badge>
              ) : (
                <Input
                  key={index}
                  value={token.value}
                  onChange={(e) => handleTokenChange(index, e.target.value)}
                  className="inline-flex w-auto min-w-[60px] max-w-[200px] h-7 text-sm bg-background"
                  style={{ width: `${Math.max(60, token.value.length * 8 + 20)}px` }}
                />
              )
            ))}
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-sm font-medium mb-1">Preview:</p>
            <p className="text-sm">{reconstructStatement(editTokens)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
