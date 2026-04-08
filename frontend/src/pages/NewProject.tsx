import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NewProject() {
  const [name, setName] = useState("");
  const [investment, setInvestment] = useState("");
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), initial_investment: parseFloat(investment) || 0 },
      {
        onSuccess: () => {
          toast({ title: "Project created!" });
          navigate("/");
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Set up a new farming project to track expenses and profit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="e.g., Cow Farming, Tomato Cultivation" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment">Initial Investment (₹)</Label>
              <Input id="investment" type="number" min="0" step="0.01" placeholder="0.00" value={investment} onChange={(e) => setInvestment(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
