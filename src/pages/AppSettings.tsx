import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Save, Settings, Plus, Trash2, Edit, X, Check, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TimelineActivity {
  name: string;
  infoAssurerDays: number;
  securityArchitectDays: number;
  socAnalystDays: number;
  isMilestone?: boolean;
}

interface PublicHoliday {
  date: string;
  name: string;
}

export default function AppSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingActivities, setEditingActivities] = useState<TimelineActivity[]>([]);
  const [editingHolidays, setEditingHolidays] = useState<PublicHoliday[]>([]);
  const [editingStringArray, setEditingStringArray] = useState<string[]>([]);
  const [editingNumberArray, setEditingNumberArray] = useState<number[]>([]);
  const [editingMapping, setEditingMapping] = useState<Record<string, number | string>>({});
  const [editingNumber, setEditingNumber] = useState<number>(0);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'activities' | 'holidays' | 'stringArray' | 'numberArray' | 'mapping' | 'number'>('activities');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditActivities = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    if (Array.isArray(setting.setting_value)) {
      setEditingActivities([...setting.setting_value]);
    }
    setDialogType('activities');
    setShowDialog(true);
  };

  const handleEditHolidays = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    if (Array.isArray(setting.setting_value)) {
      setEditingHolidays([...setting.setting_value]);
    }
    setDialogType('holidays');
    setShowDialog(true);
  };

  const handleEditStringArray = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    if (Array.isArray(setting.setting_value)) {
      setEditingStringArray([...setting.setting_value]);
    }
    setDialogType('stringArray');
    setShowDialog(true);
  };

  const handleEditNumberArray = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    if (Array.isArray(setting.setting_value)) {
      setEditingNumberArray([...setting.setting_value]);
    }
    setDialogType('numberArray');
    setShowDialog(true);
  };

  const handleEditMapping = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    if (typeof setting.setting_value === 'object' && !Array.isArray(setting.setting_value)) {
      setEditingMapping({ ...setting.setting_value });
    }
    setDialogType('mapping');
    setShowDialog(true);
  };

  const handleEditNumber = (setting: AppSetting) => {
    setEditingKey(setting.setting_key);
    setEditingNumber(setting.setting_value || 0);
    setDialogType('number');
    setShowDialog(true);
  };

  const handleAddActivity = () => {
    setEditingActivities([
      ...editingActivities,
      {
        name: "",
        infoAssurerDays: 0,
        securityArchitectDays: 0,
        socAnalystDays: 0,
        isMilestone: false
      }
    ]);
  };

  const handleAddHoliday = () => {
    setEditingHolidays([
      ...editingHolidays,
      { date: new Date().toISOString().split('T')[0], name: "" }
    ]);
  };

  const handleAddStringItem = () => {
    setEditingStringArray([...editingStringArray, ""]);
  };

  const handleAddNumberItem = () => {
    setEditingNumberArray([...editingNumberArray, 0]);
  };

  const handleAddMappingItem = () => {
    if (editingKey === 'project_roles') {
      // For project roles, add a new role with empty key and value
      const newKey = `new_role_${Date.now()}`;
      setEditingMapping({ ...editingMapping, [newKey]: "" });
    } else {
      // For numeric mappings like SFIA capacity
      const nextKey = Math.max(0, ...Object.keys(editingMapping).map(k => parseInt(k))) + 1;
      setEditingMapping({ ...editingMapping, [nextKey]: 0 });
    }
  };

  const handleRemoveActivity = (index: number) => {
    setEditingActivities(editingActivities.filter((_, i) => i !== index));
  };

  const handleRemoveHoliday = (index: number) => {
    setEditingHolidays(editingHolidays.filter((_, i) => i !== index));
  };

  const handleRemoveStringItem = (index: number) => {
    setEditingStringArray(editingStringArray.filter((_, i) => i !== index));
  };

  const handleRemoveNumberItem = (index: number) => {
    setEditingNumberArray(editingNumberArray.filter((_, i) => i !== index));
  };

  const handleRemoveMappingItem = (key: string) => {
    const updated = { ...editingMapping };
    delete updated[key];
    setEditingMapping(updated);
  };

  const handleActivityChange = (index: number, field: keyof TimelineActivity, value: any) => {
    const updated = [...editingActivities];
    updated[index] = { ...updated[index], [field]: value };
    setEditingActivities(updated);
  };

  const handleHolidayChange = (index: number, field: keyof PublicHoliday, value: string) => {
    const updated = [...editingHolidays];
    updated[index] = { ...updated[index], [field]: value };
    setEditingHolidays(updated);
  };

  const handleStringItemChange = (index: number, value: string) => {
    const updated = [...editingStringArray];
    updated[index] = value;
    setEditingStringArray(updated);
  };

  const handleNumberItemChange = (index: number, value: number) => {
    const updated = [...editingNumberArray];
    updated[index] = value;
    setEditingNumberArray(updated);
  };

  const handleMappingChange = (key: string, value: number | string) => {
    setEditingMapping({ ...editingMapping, [key]: value });
  };

  const handleMappingKeyChange = (oldKey: string, newKey: string) => {
    const updated = { ...editingMapping };
    const value = updated[oldKey];
    delete updated[oldKey];
    updated[newKey] = value;
    setEditingMapping(updated);
  };

  const handleSave = async () => {
    try {
      if (!editingKey) return;

      let valueToSave: any;
      
      switch (dialogType) {
        case 'activities':
          valueToSave = editingActivities;
          break;
        case 'holidays':
          valueToSave = editingHolidays;
          break;
        case 'stringArray':
          valueToSave = editingStringArray;
          break;
        case 'numberArray':
          valueToSave = editingNumberArray;
          break;
        case 'mapping':
          valueToSave = editingMapping;
          break;
        case 'number':
          valueToSave = editingNumber;
          break;
      }

      const { error } = await supabase
        .from("app_settings")
        .update({ setting_value: valueToSave as any })
        .eq("setting_key", editingKey);

      if (error) throw error;

      toast.success("Setting updated successfully");
      setShowDialog(false);
      setEditingKey(null);
      
      // Invalidate the query cache so sidebar and other components update
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      
      await loadSettings();
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error("Failed to update setting");
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setShowDialog(false);
    setEditingActivities([]);
    setEditingHolidays([]);
    setEditingStringArray([]);
    setEditingNumberArray([]);
    setEditingMapping({});
    setEditingNumber(0);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Application Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage application configuration and variables
            </p>
          </div>
          <Button onClick={loadSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => {
          const isTimelineActivities = setting.setting_key === 'timeline_activities';
          const isHolidays = setting.setting_key === 'uk_public_holidays';
          const isStringArray = ['risk_categories', 'risk_levels', 'fleet_sizes', 'absence_types', 'workstreams'].includes(setting.setting_key);
          const isNumberArray = setting.setting_key === 'sfia_grades';
          const isMapping = setting.setting_key === 'sfia_capacity_mapping' || setting.setting_key === 'project_roles';
          const isNumber = setting.setting_key === 'working_hours_per_week';
          const isArray = Array.isArray(setting.setting_value);
          const isObject = typeof setting.setting_value === 'object' && !Array.isArray(setting.setting_value);

          return (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{setting.setting_key}</CardTitle>
                    {setting.description && (
                      <CardDescription>{setting.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      if (isTimelineActivities) handleEditActivities(setting);
                      else if (isHolidays) handleEditHolidays(setting);
                      else if (isStringArray) handleEditStringArray(setting);
                      else if (isNumberArray) handleEditNumberArray(setting);
                      else if (isMapping) handleEditMapping(setting);
                      else if (isNumber) handleEditNumber(setting);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isTimelineActivities && isArray ? (
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity Name</TableHead>
                            <TableHead className="text-right">Info Assurer Days</TableHead>
                            <TableHead className="text-right">Security Architect Days</TableHead>
                            <TableHead className="text-right">SOC Analyst Days</TableHead>
                            <TableHead className="text-center">Milestone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {setting.setting_value.map((activity: TimelineActivity, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{activity.name}</TableCell>
                              <TableCell className="text-right">{activity.infoAssurerDays}</TableCell>
                              <TableCell className="text-right">{activity.securityArchitectDays}</TableCell>
                              <TableCell className="text-right">{activity.socAnalystDays}</TableCell>
                              <TableCell className="text-center">
                                {activity.isMilestone ? "✓" : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total activities: {setting.setting_value.length}
                    </p>
                  </div>
                ) : isHolidays && isArray ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {setting.setting_value.map((holiday: PublicHoliday, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {holiday.date}: {holiday.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total holidays: {setting.setting_value.length}
                    </p>
                  </div>
                ) : isStringArray && isArray ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {setting.setting_value.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total items: {setting.setting_value.length}
                    </p>
                  </div>
                ) : isNumberArray && isArray ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {setting.setting_value.map((item: number, index: number) => (
                        <Badge key={index} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total items: {setting.setting_value.length}
                    </p>
                  </div>
                ) : isMapping && isObject ? (
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {setting.setting_key === 'project_roles' ? 'Role Key' : 'SFIA Grade'}
                            </TableHead>
                            <TableHead className="text-right">
                              {setting.setting_key === 'project_roles' ? 'Display Name' : 'Capacity'}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(setting.setting_value).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium">{key}</TableCell>
                              <TableCell className="text-right">
                                {setting.setting_key === 'project_roles' ? value as string : value as number}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : isNumber ? (
                  <div className="text-2xl font-semibold">{setting.setting_value}</div>
                ) : (
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(setting.setting_value, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Last updated: {new Date(setting.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {settings.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground">No settings found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'activities' && 'Edit Timeline Activities'}
              {dialogType === 'holidays' && 'Edit Public Holidays'}
              {dialogType === 'stringArray' && 'Edit Items'}
              {dialogType === 'numberArray' && 'Edit Values'}
              {dialogType === 'mapping' && (editingKey === 'project_roles' ? 'Edit Project Roles' : 'Edit SFIA Capacity Mapping')}
              {dialogType === 'number' && 'Edit Value'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'activities' && 'Manage the timeline activities and their effort estimates'}
              {dialogType === 'holidays' && 'Manage UK public holidays'}
              {dialogType === 'stringArray' && 'Add, edit, or remove items from the list'}
              {dialogType === 'numberArray' && 'Add, edit, or remove numbers from the list'}
              {dialogType === 'mapping' && 'Configure SFIA grade to capacity mapping'}
              {dialogType === 'number' && 'Edit the numeric value'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogType === 'activities' && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {editingActivities.length} activities
                  </p>
                  <Button onClick={handleAddActivity} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Activity Name</TableHead>
                        <TableHead className="w-[140px] text-right">Info Assurer Days</TableHead>
                        <TableHead className="w-[140px] text-right">Sec Architect Days</TableHead>
                        <TableHead className="w-[140px] text-right">SOC Days</TableHead>
                        <TableHead className="w-[100px] text-center">Milestone</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingActivities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={activity.name}
                              onChange={(e) => handleActivityChange(index, 'name', e.target.value)}
                              placeholder="Activity name"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={activity.infoAssurerDays}
                              onChange={(e) => handleActivityChange(index, 'infoAssurerDays', parseFloat(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={activity.securityArchitectDays}
                              onChange={(e) => handleActivityChange(index, 'securityArchitectDays', parseFloat(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={activity.socAnalystDays}
                              onChange={(e) => handleActivityChange(index, 'socAnalystDays', parseFloat(e.target.value) || 0)}
                              className="w-full text-right"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={activity.isMilestone || false}
                              onCheckedChange={(checked) => handleActivityChange(index, 'isMilestone', checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveActivity(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {dialogType === 'holidays' && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {editingHolidays.length} holidays
                  </p>
                  <Button onClick={handleAddHoliday} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holiday
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Date</TableHead>
                        <TableHead>Holiday Name</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingHolidays.map((holiday, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              type="date"
                              value={holiday.date}
                              onChange={(e) => handleHolidayChange(index, 'date', e.target.value)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={holiday.name}
                              onChange={(e) => handleHolidayChange(index, 'name', e.target.value)}
                              placeholder="Holiday name"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveHoliday(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {dialogType === 'stringArray' && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {editingStringArray.length} items
                  </p>
                  <Button onClick={handleAddStringItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingStringArray.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleStringItemChange(index, e.target.value)}
                        placeholder="Enter value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStringItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {dialogType === 'numberArray' && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {editingNumberArray.length} items
                  </p>
                  <Button onClick={handleAddNumberItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingNumberArray.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="number"
                        value={item}
                        onChange={(e) => handleNumberItemChange(index, parseInt(e.target.value) || 0)}
                        placeholder="Enter number"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveNumberItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {dialogType === 'mapping' && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(editingMapping).length} mappings
                  </p>
                  <Button onClick={handleAddMappingItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mapping
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          {editingKey === 'project_roles' ? 'Role Key' : 'SFIA Grade'}
                        </TableHead>
                        <TableHead>
                          {editingKey === 'project_roles' ? 'Display Name' : 'Capacity'}
                        </TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(editingMapping).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>
                            {editingKey === 'project_roles' ? (
                              <Input
                                value={key}
                                onChange={(e) => handleMappingKeyChange(key, e.target.value)}
                                className="w-full"
                                placeholder="role_key"
                              />
                            ) : (
                              <span className="font-medium">{key}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type={editingKey === 'project_roles' ? 'text' : 'number'}
                              value={value}
                              onChange={(e) => handleMappingChange(
                                key, 
                                editingKey === 'project_roles' ? e.target.value : (parseInt(e.target.value) || 0)
                              )}
                              className="w-full"
                              placeholder={editingKey === 'project_roles' ? 'Display Name' : 'Capacity'}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMappingItem(key)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {dialogType === 'number' && (
              <div className="space-y-4">
                <Label htmlFor="number-input">Value</Label>
                <Input
                  id="number-input"
                  type="number"
                  value={editingNumber}
                  onChange={(e) => setEditingNumber(parseFloat(e.target.value) || 0)}
                  className="text-lg"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
