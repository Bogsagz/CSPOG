import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, ExternalLink, Pencil, Check } from "lucide-react";

interface DataTableProps {
  id: string;
  title: string;
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
  onEditItem?: (index: number, newValue: string) => void;
  selectedItem: number | null;
  onSelectItem: (index: number) => void;
  readOnly?: boolean;
  linkTo?: string;
  customAddComponent?: React.ReactNode;
  annotations?: Record<number, string>;
  presetCount?: number;
}

export const DataTable = ({
  id,
  title,
  items,
  onAddItem,
  onRemoveItem,
  onEditItem,
  selectedItem,
  onSelectItem,
  readOnly = false,
  linkTo,
  customAddComponent,
  annotations,
  presetCount = 0,
}: DataTableProps) => {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  const startEditing = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditValue(currentValue);
  };

  const saveEdit = (index: number) => {
    if (editValue.trim() && onEditItem) {
      onEditItem(index, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      saveEdit(index);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${selectedItem !== null ? 'bg-muted/50 opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          {title}
          {linkTo && (
            <Link to={linkTo}>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <ExternalLink className="h-3 w-3" />
                Manage
              </Button>
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {customAddComponent ? (
          <div>{customAddComponent}</div>
        ) : !readOnly && (
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add new entry..."
              className="flex-1"
            />
            <Button onClick={handleAdd} size="icon" variant="default">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, index) => {
            const isPreset = index < presetCount;
            return (
            <div
              key={index}
              onClick={() => editingIndex !== index && onSelectItem(index)}
              className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                selectedItem === index
                  ? "bg-primary text-primary-foreground border-primary"
                  : isPreset 
                    ? "bg-muted/50 hover:bg-muted border-border text-muted-foreground"
                    : "bg-card hover:bg-accent/50 border-border"
              }`}
            >
              {editingIndex === index ? (
                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyPress(e, index)}
                    className="flex-1 h-7 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => saveEdit(index)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item}</span>
                    {annotations && annotations[index] && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        selectedItem === index 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {annotations[index]}
                      </span>
                    )}
                  </div>
                  {!readOnly && !customAddComponent && (
                    <div className="flex items-center gap-1">
                      {onEditItem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(index, item);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )})}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No entries yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
