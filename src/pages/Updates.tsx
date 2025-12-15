import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Bug, Lightbulb, Trash2, Megaphone, Sparkles, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Feedback {
  id: string;
  user_id: string;
  feedback_type: "bug" | "feature";
  title: string;
  description: string | null;
  created_at: string;
}

const RELEASE_NOTES = [
  {
    version: "1.5.0",
    date: "2024-12-05",
    changes: [
      "Added real-time task hour countdown based on work allocation",
      "Time worked now saved to history when allocation changes",
      "Online status indicators for team members",
      "Risk Profile Acceptance artefact under Completion phase",
    ],
  },
  {
    version: "1.4.0",
    date: "2024-11-28",
    changes: [
      "Deeper Threat Model now displays system diagram with threat annotations",
      "Enhanced CAF compliance narrative generation",
      "Improved control layers visualization",
    ],
  },
  {
    version: "1.3.0",
    date: "2024-11-20",
    changes: [
      "Dark mode support added",
      "MITRE ATT&CK framework integration",
      "Threat Visualizer with asset linking",
    ],
  },
];

export default function Updates() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "bug" as "bug" | "feature",
    title: "",
    description: "",
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback((data || []) as Feedback[]);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        feedback_type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully");
      setFormData({ type: "bug", title: "", description: "" });
      loadFeedback();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_feedback")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Feedback deleted");
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Failed to delete feedback");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-orbitron flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          Updates & Feedback
        </h1>
        <p className="text-muted-foreground mt-2">
          Stay informed about recent changes and share your feedback
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Release Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-orbitron">
              <Sparkles className="h-5 w-5" />
              Release Notes
            </CardTitle>
            <CardDescription>Recent updates and improvements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {RELEASE_NOTES.map((release) => (
              <div key={release.version} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    v{release.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(release.date), "MMM d, yyyy")}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                  {release.changes.map((change, idx) => (
                    <li key={idx}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-orbitron">
              <AlertCircle className="h-5 w-5" />
              Report Bug or Request Feature
            </CardTitle>
            <CardDescription>Help us improve the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Tabs
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, type: v as "bug" | "feature" }))
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bug" className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Bug Report
                    </TabsTrigger>
                    <TabsTrigger value="feature" className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Feature Request
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={
                    formData.type === "bug"
                      ? "Brief description of the issue"
                      : "What feature would you like?"
                  }
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  maxLength={1000}
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Community Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-orbitron">
            <Shield className="h-5 w-5" />
            Community Feedback
          </CardTitle>
          <CardDescription>
            Bug reports and feature requests from the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading feedback...</p>
          ) : feedback.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No feedback submitted yet. Be the first to share!
            </p>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.feedback_type === "bug" ? "destructive" : "default"}
                        className="flex items-center gap-1"
                      >
                        {item.feedback_type === "bug" ? (
                          <Bug className="h-3 w-3" />
                        ) : (
                          <Lightbulb className="h-3 w-3" />
                        )}
                        {item.feedback_type === "bug" ? "Bug" : "Feature"}
                      </Badge>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {user?.id === item.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
