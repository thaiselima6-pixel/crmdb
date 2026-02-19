"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProjectEditDialogProps {
  project: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ProjectEditDialog({ project, onSuccess, trigger }: ProjectEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    budget: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (open && project) {
      setForm({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "PLANNING",
        priority: project.priority || "MEDIUM",
        budget: project.budget ? String(project.budget) : "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "",
      });
    }
  }, [open, project]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.patch(`/api/projects/${project.id}`, {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      toast({ title: "Projeto atualizado", description: "As informações do projeto foram salvas." });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Não foi possível atualizar o projeto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">Editar Projeto</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">Editar Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nome *</Label>
              <Input
                id="name"
                name="name"
                required
                className="bg-transparent"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-transparent">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planejamento</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descrição</Label>
            <Textarea
              id="description"
              className="bg-transparent min-h-[90px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-slate-700 dark:text-slate-300">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                className="bg-transparent"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-700 dark:text-slate-300">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                className="bg-transparent"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-700 dark:text-slate-300">Prazo Final</Label>
              <Input
                id="endDate"
                type="date"
                className="bg-transparent"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
