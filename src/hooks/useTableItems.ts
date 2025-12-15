import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TableType = "Vectors" | "Assets" | "Adversarial actions" | "Local Objectives" | "Strategic Objectives";

interface TableItem {
  id: string;
  table_type: string;
  item_text: string;
  created_at: string;
  project_id: string;
}

export const useTableItems = (projectId: string | null) => {
  const [items, setItems] = useState<Record<TableType, string[]>>({
    "Vectors": [],
    "Assets": [],
    "Adversarial actions": [],
    "Local Objectives": [],
    "Strategic Objectives": []
  });
  const [itemIds, setItemIds] = useState<Record<TableType, string[]>>({
    "Vectors": [],
    "Assets": [],
    "Adversarial actions": [],
    "Local Objectives": [],
    "Strategic Objectives": []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load items from database
  useEffect(() => {
    if (projectId) {
      loadItems();
    } else {
      // Reset items when no project selected
      setItems({
        "Vectors": [],
        "Assets": [],
        "Adversarial actions": [],
        "Local Objectives": [],
        "Strategic Objectives": []
      });
      setItemIds({
        "Vectors": [],
        "Assets": [],
        "Adversarial actions": [],
        "Local Objectives": [],
        "Strategic Objectives": []
      });
      setIsLoading(false);
    }
  }, [projectId]);

  const loadItems = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from("table_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const newItems: Record<TableType, string[]> = {
          "Vectors": [],
          "Assets": [],
          "Adversarial actions": [],
          "Local Objectives": [],
          "Strategic Objectives": []
        };
        const newItemIds: Record<TableType, string[]> = {
          "Vectors": [],
          "Assets": [],
          "Adversarial actions": [],
          "Local Objectives": [],
          "Strategic Objectives": []
        };

        data.forEach((item: TableItem) => {
          const tableType = item.table_type as TableType;
          newItems[tableType].push(item.item_text);
          newItemIds[tableType].push(item.id);
        });

        setItems(newItems);
        setItemIds(newItemIds);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (tableType: TableType, itemText: string) => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("table_items")
        .insert({ table_type: tableType, item_text: itemText, project_id: projectId })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setItems(prev => ({
          ...prev,
          [tableType]: [...prev[tableType], data.item_text]
        }));
        setItemIds(prev => ({
          ...prev,
          [tableType]: [...prev[tableType], data.id]
        }));
        toast.success("Item added successfully");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const removeItem = async (tableType: TableType, itemIndex: number) => {
    const itemId = itemIds[tableType][itemIndex];
    
    try {
      const { error } = await supabase
        .from("table_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => ({
        ...prev,
        [tableType]: prev[tableType].filter((_, i) => i !== itemIndex)
      }));
      setItemIds(prev => ({
        ...prev,
        [tableType]: prev[tableType].filter((_, i) => i !== itemIndex)
      }));
      toast.success("Item removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const editItem = async (tableType: TableType, itemIndex: number, newText: string) => {
    const itemId = itemIds[tableType][itemIndex];
    
    try {
      const { error } = await supabase
        .from("table_items")
        .update({ item_text: newText })
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => ({
        ...prev,
        [tableType]: prev[tableType].map((item, i) => i === itemIndex ? newText : item)
      }));
      toast.success("Item updated");
    } catch (error) {
      console.error("Error editing item:", error);
      toast.error("Failed to edit item");
    }
  };

  return { items, isLoading, addItem, removeItem, editItem };
};
