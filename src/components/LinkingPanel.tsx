import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Info } from "lucide-react";
import { toast } from "sonner";

interface Selection {
  tableId: number;
  itemIndex: number;
}

interface LinkingPanelProps {
  tables: { title: string; items: string[] }[];
  selection: Selection | null;
  onCreateLink: () => void;
}

export const LinkingPanel = ({ tables, selection, onCreateLink }: LinkingPanelProps) => {
  const handleCreateLink = () => {
    if (!selection) {
      toast.error("Please select an item first");
      return;
    }
    onCreateLink();
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Link Creator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {selection ? (
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Currently selected:</p>
              <p className="text-sm font-semibold text-foreground">
                {tables[selection.tableId]?.items[selection.itemIndex]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                from {tables[selection.tableId]?.title}
              </p>
            </div>
            <Button onClick={handleCreateLink} className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Select Another Item to Link
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-muted">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click on an item in any table to start creating links
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
