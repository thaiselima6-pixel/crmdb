"use client";

import { useState, useEffect } from "react";
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
import { Plus } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ProjectDialogProps {
  onSuccess?: () => void;
}

export function ProjectDialog({ onSuccess }: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      axios.get("/api/clients").then((res) => setClients(res.data));
    }
  }, [open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      clientId: formData.get("clientId"),
      budget: formData.get("budget"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    };

    try {
      await axios.post("/api/projects", data);
      toast({
        title: "Sucesso!",
        description: "Projeto criado com sucesso.",
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o projeto.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">Criar Novo Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nome do Projeto *</Label>
              <Input id="name" name="name" placeholder="Ex: Website Institucional" required className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId" className="text-slate-700 dark:text-slate-300">Cliente *</Label>
              <Select name="clientId" required>
                <SelectTrigger className="bg-transparent">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descrição</Label>
            <Input id="description" name="description" placeholder="Breve descrição do projeto" className="bg-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget" className="text-slate-700 dark:text-slate-300">Orçamento (R$)</Label>
              <Input id="budget" name="budget" type="number" step="0.01" placeholder="0,00" className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-700 dark:text-slate-300">Data de Início</Label>
              <Input id="startDate" name="startDate" type="date" className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-700 dark:text-slate-300">Previsão de Entrega</Label>
              <Input id="endDate" name="endDate" type="date" className="bg-transparent" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? "Criando..." : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
