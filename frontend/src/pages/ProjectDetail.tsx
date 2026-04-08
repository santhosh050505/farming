import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject, useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useUpdateProject } from "@/hooks/useProjects";
import type { Expense } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Pencil, TrendingUp, TrendingDown, DollarSign, Receipt, PiggyBank, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: pLoading } = useProject(id!);
  const { data: expenses = [], isLoading: eLoading } = useExpenses(id!);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateProject = useUpdateProject();
  const { toast } = useToast();

  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const [returnsInput, setReturnsInput] = useState("");
  const [returnsOpen, setReturnsOpen] = useState(false);

  if (pLoading || eLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }
  if (!project) {
    return <div className="text-center py-20 text-muted-foreground">Project not found</div>;
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInvestment = project.initial_investment + totalExpenses;
  const profit = project.total_returns - totalInvestment;
  const isProfitable = profit >= 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate(
      { project_id: id!, date: expDate, description: expDesc.trim(), amount: parseFloat(expAmount) || 0 },
      {
        onSuccess: () => {
          toast({ title: "Expense added" });
          setExpDesc("");
          setExpAmount("");
          setAddOpen(false);
        },
      }
    );
  };

  const openEdit = (exp: Expense) => {
    setEditExpense(exp);
    setEditDate(exp.date);
    setEditDesc(exp.description);
    setEditAmount(String(exp.amount));
    setEditOpen(true);
  };

  const handleEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense) return;
    updateExpense.mutate(
      { id: editExpense.id, project_id: id!, date: editDate, description: editDesc.trim(), amount: parseFloat(editAmount) || 0 },
      {
        onSuccess: () => {
          toast({ title: "Expense updated" });
          setEditOpen(false);
        },
      }
    );
  };

  const handleDelete = (expId: string) => {
    if (!confirm("Delete this expense?")) return;
    deleteExpense.mutate({ id: expId, project_id: id! }, {
      onSuccess: () => toast({ title: "Expense deleted" }),
    });
  };

  const handleUpdateReturns = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate(
      { id: id!, total_returns: parseFloat(returnsInput) || 0 },
      {
        onSuccess: () => {
          toast({ title: "Returns updated" });
          setReturnsOpen(false);
        },
      }
    );
  };

  // Chart data
  const expensesByDate = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.amount;
    return acc;
  }, {});
  const chartData = Object.entries(expensesByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({ date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }), amount }));

  const pieData = [
    { name: "Initial Investment", value: project.initial_investment },
    { name: "Expenses", value: totalExpenses },
    { name: "Returns", value: project.total_returns },
  ].filter((d) => d.value > 0);
  const PIE_COLORS = ["hsl(28, 60%, 55%)", "hsl(0, 65%, 50%)", "hsl(142, 55%, 38%)"];

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">Created {new Date(project.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={returnsOpen} onOpenChange={setReturnsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setReturnsInput(String(project.total_returns))}>
                <DollarSign className="mr-2 h-4 w-4" /> Update Returns
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Update Total Returns</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateReturns} className="space-y-4">
                <div className="space-y-2">
                  <Label>Total Returns (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={returnsInput} onChange={(e) => setReturnsInput(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={updateProject.isPending}>Save</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="e.g., Feed, Medicine, Labor" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={createExpense.isPending}>Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/20 p-2"><PiggyBank className="h-5 w-5 text-accent" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Initial Investment</p>
                <p className="text-lg font-bold text-foreground">₹{project.initial_investment.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2"><Receipt className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Returns</p>
                <p className="text-lg font-bold text-foreground">₹{project.total_returns.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isProfitable ? "bg-profit/10" : "bg-loss/10"}`}>
                {isProfitable ? <TrendingUp className="h-5 w-5 text-profit" /> : <TrendingDown className="h-5 w-5 text-loss" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isProfitable ? "Profit" : "Loss"}</p>
                <p className={`text-lg font-bold ${isProfitable ? "text-profit" : "text-loss"}`}>₹{Math.abs(profit).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="summary">Profit Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense History</CardTitle>
              <CardDescription>{expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {!expenses.length ? (
                <p className="text-center text-muted-foreground py-8">No expenses yet. Add your first expense above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell className="text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{exp.description}</TableCell>
                          <TableCell className="text-right font-medium">₹{exp.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(exp.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Daily Expenses</CardTitle></CardHeader>
              <CardContent>
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(36,20%,88%)" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                      <Bar dataKey="amount" fill="hsl(142,45%,32%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No expense data to chart</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Financial Breakdown</CardTitle></CardHeader>
              <CardContent>
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">No financial data to display</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Profit Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Initial Investment</span>
                  <span className="font-medium">₹{project.initial_investment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">+ Total Expenses</span>
                  <span className="font-medium">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                  <span>= Total Investment</span>
                  <span>₹{totalInvestment.toLocaleString()}</span>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Returns</span>
                  <span className="font-medium">₹{project.total_returns.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">− Total Investment</span>
                  <span className="font-medium">₹{totalInvestment.toLocaleString()}</span>
                </div>
                <div className={`border-t pt-2 flex justify-between text-base font-bold ${isProfitable ? "text-profit" : "text-loss"}`}>
                  <span>= {isProfitable ? "Net Profit" : "Net Loss"}</span>
                  <span>₹{Math.abs(profit).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Expense Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={updateExpense.isPending}>Update Expense</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
