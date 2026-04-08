import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sprout, Trash2, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its expenses?`)) return;
    deleteProject.mutate(id, {
      onSuccess: () => toast({ title: "Project deleted" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Sprout className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farm Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your agricultural projects</p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {!projects?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <Sprout className="h-16 w-16 mx-auto text-primary/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">No projects yet</h2>
            <p className="text-muted-foreground mb-6">Create your first farming project to get started</p>
            <Button asChild>
              <Link to="/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const profit = p.total_returns - p.initial_investment;
            const isProfitable = profit >= 0;
            return (
              <Card key={p.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investment</span>
                    <span className="font-medium text-foreground">₹{p.initial_investment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Returns</span>
                    <span className="font-medium text-foreground">₹{p.total_returns.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {isProfitable ? <TrendingUp className="h-3 w-3 text-profit" /> : <TrendingDown className="h-3 w-3 text-loss" />}
                      {isProfitable ? "Profit" : "Loss"}
                    </span>
                    <span className={`font-bold ${isProfitable ? "text-profit" : "text-loss"}`}>
                      ₹{Math.abs(profit).toLocaleString()}
                    </span>
                  </div>
                  <Button variant="outline" asChild className="w-full mt-2">
                    <Link to={`/projects/${p.id}`}>
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
