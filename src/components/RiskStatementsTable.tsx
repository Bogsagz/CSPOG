import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
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
import { useState } from "react";

interface SavedRisk {
  id: string;
  project_id: string;
  risk_statement: string;
  risk_rating?: string;
  impact_type?: string;
  created_at: string;
}

interface RiskStatementsTableProps {
  statements: SavedRisk[];
  onDeleteStatement?: (index: number) => void;
  canWrite?: boolean;
}

export const RiskStatementsTable = ({ statements, onDeleteStatement, canWrite = true }: RiskStatementsTableProps) => {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  
  const getRiskRatingColor = (rating?: string) => {
    switch (rating) {
      case "Very Low Risk": return "default";
      case "Low Risk": return "secondary";
      case "Medium Risk": return "outline";
      case "High Risk": return "destructive";
      case "Very High Risk": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">#</TableHead>
            <TableHead>Risk Statement</TableHead>
            <TableHead className="w-[150px]">Risk Rating</TableHead>
            <TableHead className="w-[130px]">Impact Type</TableHead>
            {canWrite && onDeleteStatement && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWrite && onDeleteStatement ? 5 : 4} className="text-center text-muted-foreground">
                No risk statements saved yet
              </TableCell>
            </TableRow>
          ) : (
            statements.map((statement, index) => (
              <TableRow key={statement.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{statement.risk_statement}</TableCell>
                <TableCell>
                  <Badge variant={getRiskRatingColor(statement.risk_rating)}>
                    {statement.risk_rating || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell>{statement.impact_type || "N/A"}</TableCell>
                {canWrite && onDeleteStatement && (
                  <TableCell>
                    <AlertDialog open={deleteIndex === index} onOpenChange={(open) => !open && setDeleteIndex(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteIndex(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-background">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Risk Statement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this risk statement? This action cannot be undone.
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              {statement.risk_statement}
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
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
