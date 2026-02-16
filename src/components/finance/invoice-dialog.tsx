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

interface InvoiceDialogProps {
  onSuccess?: () => void;
}

export function InvoiceDialog({ onSuccess }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      axios.get("/api/clients").then((res) => setClients(res.data));
      axios.get("/api/projects").then((res) => setProjects(res.data));
    }
  }, [open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      description: formData.get("description"),
      amount: formData.get("amount"),
      status: formData.get("status"),
      dueDate: formData.get("dueDate"),
      clientId: formData.get("clientId"),
      projectId: formData.get("projectId"),
    };

    try {
      await axios.post("/api/finance", data);
      toast({
        title: "Sucesso!",
        description: "Fatura criada com sucesso.",
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a fatura.",
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
          <Plus className="h-4 w-4" /> Nova Fatura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">Gerar Nova Fatura</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descrição da Fatura *</Label>
            <Input id="description" name="description" placeholder="Ex: Manutenção Mensal - Fevereiro" required className="bg-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">Valor (R$) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="0,00" required className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-700 dark:text-slate-300">Vencimento *</Label>
              <Input id="dueDate" name="dueDate" type="date" required className="bg-transparent" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId" className="text-slate-700 dark:text-slate-300">Cliente *</Label>
            <Select name="clientId" required>
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-slate-700 dark:text-slate-300">Projeto (Opcional)</Label>
            <Select name="projectId">
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status Inicial</Label>
            <Select name="status" defaultValue="PENDING">
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="OVERDUE">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? "Gerando..." : "Gerar Fatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
