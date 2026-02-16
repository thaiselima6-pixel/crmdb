"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: any;
}

export function LeadDialog({ isOpen, onClose, onSuccess, lead }: LeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSendWhatsApp() {
    if (!lead?.phone) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post("/api/ai/chat", {
        messages: [
          { role: "user", content: `Gere uma mensagem de primeiro contato via WhatsApp para o lead ${lead.name} da empresa ${lead.company || 'N/A'}. Seja profissional e amigável.` }
        ]
      });

      const message = response.data.content;
      
      // Abre o link do WhatsApp (fallback se a API Evolution não estiver configurada no backend)
      const phone = lead.phone.replace(/\D/g, "");
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
      
      toast({
        title: "WhatsApp aberto",
        description: "A mensagem foi gerada pela IA e aberta no WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a mensagem automática.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      status: formData.get("status"),
      value: formData.get("value"),
      source: formData.get("source"),
    };

    try {
      if (lead) {
        await axios.patch("/api/leads", { ...data, id: lead.id });
      } else {
        await axios.post("/api/leads", data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("DEBUG: Error saving lead", error);
      alert("Erro ao salvar lead. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nome do Lead</Label>
              <Input id="name" name="name" defaultValue={lead?.name} required className="bg-transparent" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={lead?.email} className="bg-transparent" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Telefone (WhatsApp)</Label>
              <Input id="phone" name="phone" defaultValue={lead?.phone} placeholder="(11) 99999-9999" className="bg-transparent" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">Empresa</Label>
              <Input id="company" name="company" defaultValue={lead?.company} className="bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status</Label>
                <Select name="status" defaultValue={lead?.status || "NEW"}>
                  <SelectTrigger className="bg-transparent">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950">
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="CONTACTED">Contatado</SelectItem>
                    <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                    <SelectItem value="PROPOSAL">Proposta</SelectItem>
                    <SelectItem value="NEGOTIATION">Negociação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value" className="text-slate-700 dark:text-slate-300">Valor Estimado</Label>
                <Input id="value" name="value" type="number" defaultValue={lead?.value} placeholder="0.00" className="bg-transparent" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {lead?.phone && (
              <Button 
                type="button" 
                variant="outline" 
                className="gap-2 border-green-500/50 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                onClick={handleSendWhatsApp}
                disabled={isLoading}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp IA
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lead ? "Salvar Alterações" : "Criar Lead"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
