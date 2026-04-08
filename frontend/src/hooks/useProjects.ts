import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Project = {
  id: string;
  name: string;
  initial_investment: number;
  total_returns: number;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Expense = {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
};

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!user && !!id,
  });
}

export function useExpenses(projectId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("project_id", projectId).order("date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { name: string; initial_investment: number }) => {
      const { error } = await supabase.from("projects").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; total_returns?: number; name?: string; initial_investment?: number }) => {
      const { error } = await supabase.from("projects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", vars.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { project_id: string; date: string; description: string; amount: number }) => {
      const { error } = await supabase.from("expenses").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["expenses", vars.project_id] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id, ...data }: { id: string; project_id: string; date?: string; description?: string; amount?: number }) => {
      const { error } = await supabase.from("expenses").update(data).eq("id", id);
      if (error) throw error;
      return project_id;
    },
    onSuccess: (projectId) => qc.invalidateQueries({ queryKey: ["expenses", projectId] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      return project_id;
    },
    onSuccess: (projectId) => qc.invalidateQueries({ queryKey: ["expenses", projectId] }),
  });
}
