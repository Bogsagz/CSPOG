import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export default function ThemeSettings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Display Settings</h1>
        <p className="text-muted-foreground">Customise your visual preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Dark Mode
          </CardTitle>
          <CardDescription>
            Toggle between light and dark appearance modes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col gap-1">
              <span className="text-base font-medium">
                {isDark ? 'Dark Mode Enabled' : 'Light Mode Enabled'}
              </span>
              <span className="text-sm text-muted-foreground">
                Your preference is automatically saved
              </span>
            </Label>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Theme Preview</CardTitle>
          <CardDescription>
            See how different elements look in your selected theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm font-medium mb-2">Background</p>
              <p className="text-xs text-muted-foreground">Default surface color</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-sm font-medium mb-2">Card</p>
              <p className="text-xs text-muted-foreground">Elevated surface</p>
            </div>
            <div className="p-4 border rounded-lg bg-primary text-primary-foreground">
              <p className="text-sm font-medium mb-2">Primary</p>
              <p className="text-xs opacity-90">Main brand color</p>
            </div>
            <div className="p-4 border rounded-lg bg-secondary text-secondary-foreground">
              <p className="text-sm font-medium mb-2">Secondary</p>
              <p className="text-xs opacity-90">Secondary accent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
