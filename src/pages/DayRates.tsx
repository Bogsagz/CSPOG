import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDayRates, type DayRatesConfig } from "@/hooks/useDayRates";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";

const ROLE_LABELS: Record<keyof DayRatesConfig, string> = {
  delivery: "Delivery",
  security_architect: "Security Architect",
  sec_mon: "Sec Mon",
  sec_eng: "Sec Eng",
  sa_mentor: "SA Mentor"
};

const SFIA_GRADES = ["3", "4", "5"];

export default function DayRates() {
  const { dayRates, isLoading, updateDayRates } = useDayRates();
  const [editedRates, setEditedRates] = useState<DayRatesConfig | null>(null);

  const handleRateChange = (role: keyof DayRatesConfig, grade: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedRates(prev => ({
      ...(prev || dayRates || {} as DayRatesConfig),
      [role]: {
        ...(prev?.[role] || dayRates?.[role] || {}),
        [grade]: numValue
      }
    }));
  };

  const handleSave = () => {
    if (editedRates) {
      updateDayRates.mutate(editedRates);
      setEditedRates(null);
    }
  };

  const handleCancel = () => {
    setEditedRates(null);
  };

  const displayRates = editedRates || dayRates;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Day Rates</h1>
          <p className="text-muted-foreground">Configure day rates per role and SFIA grade</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Day Rates</h1>
        <p className="text-muted-foreground">Configure day rates per role and SFIA grade</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Day Rates Configuration
          </CardTitle>
          <CardDescription>
            Set the daily rates for each role at different SFIA grades (3, 4, and 5)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">SFIA 3</TableHead>
                  <TableHead className="text-right">SFIA 4</TableHead>
                  <TableHead className="text-right">SFIA 5</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <TableRow key={role}>
                    <TableCell className="font-medium">{label}</TableCell>
                    {SFIA_GRADES.map(grade => (
                      <TableCell key={grade} className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-muted-foreground">£</span>
                          <Input
                            type="number"
                            value={displayRates?.[role as keyof DayRatesConfig]?.[grade] || 0}
                            onChange={(e) => handleRateChange(role as keyof DayRatesConfig, grade, e.target.value)}
                            className="w-24 text-right"
                            min="0"
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {editedRates && (
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateDayRates.isPending}>
                  {updateDayRates.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
