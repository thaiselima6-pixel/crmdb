"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, RefreshCcw } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  onSuccess?: () => void;
  invoice?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode | null;
}

export function InvoiceDialog({ onSuccess, invoice, open: openProp, onOpenChange, trigger }: InvoiceDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof openProp === "boolean" && typeof onOpenChange === "function";
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("PENDING");
  const { toast } = useToast();

  const reloadLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const [clientsRes, projectsRes] = await Promise.all([
        axios.get(`/api/clients?t=${timestamp}`),
        axios.get(`/api/projects?t=${timestamp}`),
      ]);

      const nextClients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      nextClients.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));
      setClients(nextClients);

      const nextProjects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      nextProjects.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));
      setProjects(nextProjects);
    } catch (error) {
      console.error("Erro ao carregar dados para fatura", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes e projetos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const nextClientId = invoice?.clientId ? String(invoice.clientId) : "";
    const nextProjectId = invoice?.projectId ? String(invoice.projectId) : "";
    const nextDueDate = invoice?.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : "";

    setSelectedClientId(nextClientId);
    setSelectedProjectId(nextProjectId);
    setDueDate(nextDueDate);
    setDescription(invoice?.description ? String(invoice.description) : "");
    setAmount(invoice?.amount !== undefined && invoice?.amount !== null ? String(invoice.amount) : "");
    setStatus(invoice?.status ? String(invoice.status) : "PENDING");
    reloadLists();
  }, [open, reloadLists, invoice]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const data = {
      description,
      amount,
      status,
      dueDate,
      clientId: selectedClientId,
      projectId: selectedProjectId === "__none__" ? null : selectedProjectId || null,
    };

    try {
      if (invoice?.id) {
        await axios.put(`/api/finance/${invoice.id}`, data);
      } else {
        await axios.post("/api/finance", data);
      }
      toast({
        title: "Sucesso!",
        description: invoice?.id ? "Fatura atualizada com sucesso." : "Fatura criada com sucesso.",
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: invoice?.id ? "Ocorreu um erro ao editar a fatura." : "Ocorreu um erro ao criar a fatura.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === null ? null : (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Fatura
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">
            {invoice?.id ? "Editar Fatura" : "Gerar Nova Fatura"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descrição da Fatura *</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Manutenção Mensal - Fevereiro"
              required
              className="bg-transparent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">Valor (R$) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                required
                className="bg-transparent"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-slate-700 dark:text-slate-300">Vencimento *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                className="bg-transparent"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="clientId" className="text-slate-700 dark:text-slate-300">Cliente *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-2 text-xs"
                onClick={reloadLists}
                disabled={isLoading}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
            </div>
            <Select
              name="clientId"
              required
              value={selectedClientId}
              onValueChange={(value) => {
                setSelectedClientId(value);
                const client = clients.find((c) => c.id === value);
                if (client && client.billingDay) {
                  const today = new Date();
                  let month = today.getMonth();
                  let year = today.getFullYear();
                  const billingDay = client.billingDay as number;
                  if (billingDay < today.getDate()) {
                    month += 1;
                  }
                  const nextDue = new Date(year, month, billingDay);
                  const iso = nextDue.toISOString().slice(0, 10);
                  setDueDate(iso);
                }
              }}
            >
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder={isLoading ? "Carregando clientes..." : "Selecione o cliente"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                {clients.length === 0 && !isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="text-slate-700 dark:text-slate-300">Projeto (Opcional)</Label>
            <Select
              name="projectId"
              value={selectedProjectId}
              onValueChange={(value) => setSelectedProjectId(value)}
            >
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder={isLoading ? "Carregando projetos..." : "Selecione o projeto"} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <SelectItem value="__none__">Sem projeto</SelectItem>
                {projects.length === 0 && !isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Nenhum projeto encontrado</div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status Inicial</Label>
            <Select name="status" value={status} onValueChange={(value) => setStatus(value)}>
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
              {isLoading ? (invoice?.id ? "Salvando..." : "Gerando...") : invoice?.id ? "Salvar Alterações" : "Gerar Fatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
