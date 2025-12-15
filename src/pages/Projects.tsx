import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useProjectTimelineRisk } from "@/hooks/useProjectTimelineRisk";
import { FolderOpen } from "lucide-react";
import { format } from "date-fns";

const ProjectCard = ({ project }: { project: { id: string; title: string; created_at: string } }) => {
  const navigate = useNavigate();
  const { hasTimelineRisk } = useProjectTimelineRisk(project.id);

  return (
    <Card
      className="transition-all hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">{project.title}</CardTitle>
          {hasTimelineRisk && (
            <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive whitespace-nowrap">
              Timeline Risk
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Created {format(new Date(project.created_at), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
};

const Projects = () => {
  const { projects, isLoading } = useProjects();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <Input
          placeholder="Search projects by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No matching projects" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Try a different search term" 
                : "You don't have any projects yet. Contact a Security Admin to get access."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
