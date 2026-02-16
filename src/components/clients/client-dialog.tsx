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
import { Plus, Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ClientDialogProps {
  onSuccess?: () => void;
  client?: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClientDialog({ onSuccess, client, trigger, open: externalOpen, onOpenChange: setExternalOpen }: ClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    logo: "",
  });

  useEffect(() => {
    if (open && client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        company: client.company || "",
        logo: client.logo || "",
      });
    } else if (open) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        logo: "",
      });
    }
  }, [client, open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (client?.id) {
        await axios.patch(`/api/clients/${client.id}`, formData);
        toast({
          title: "Sucesso!",
          description: "Cliente atualizado com sucesso.",
        });
      } else {
        await axios.post("/api/clients", formData);
        toast({
          title: "Sucesso!",
          description: "Cliente cadastrado com sucesso.",
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${client ? 'atualizar' : 'cadastrar'} o cliente.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">
            {client ? "Editar Cliente" : "Cadastrar Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nome do Cliente *</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Ex: João Silva" 
              required 
              className="bg-transparent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">Empresa</Label>
            <Input 
              id="company" 
              name="company" 
              placeholder="Ex: Tech Solutions" 
              className="bg-transparent"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">E-mail</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="joao@email.com" 
                className="bg-transparent"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Telefone</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="(11) 99999-9999" 
                className="bg-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-slate-700 dark:text-slate-300">URL da Logo</Label>
            <Input 
              id="logo" 
              name="logo" 
              placeholder="https://exemplo.com/logo.png" 
              className="bg-transparent"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? "Salvar Alterações" : "Salvar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
