import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RiskTableType = 
  | "issues" 
  | "likelihood" 
  | "threats" 
  | "cia" 
  | "systems" 
  | "system_impact" 
  | "impact_level" 
  | "impact_type" 
  | "business_impact"
  | "controls";

interface TableItem {
  id: string;
  table_type: string;
  item_text: string;
  created_at: string;
  project_id: string;
}

export const useRiskTableItems = (projectId: string | null, tableType: RiskTableType) => {
  const [items, setItems] = useState<string[]>([]);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadItems();
    } else {
      setItems([]);
      setItemIds([]);
      setIsLoading(false);
    }
  }, [projectId, tableType]);

  const loadItems = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from("table_items")
        .select("*")
        .eq("project_id", projectId)
        .eq("table_type", tableType)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setItems(data.map((item: TableItem) => item.item_text));
        setItemIds(data.map((item: TableItem) => item.id));
      }
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (itemText: string) => {
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
        setItems(prev => [...prev, data.item_text]);
        setItemIds(prev => [...prev, data.id]);
        toast.success("Item added successfully");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const removeItem = async (itemIndex: number) => {
    const itemId = itemIds[itemIndex];
    
    try {
      const { error } = await supabase
        .from("table_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(prev => prev.filter((_, i) => i !== itemIndex));
      setItemIds(prev => prev.filter((_, i) => i !== itemIndex));
      toast.success("Item removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  return { items, isLoading, addItem, removeItem };
};
