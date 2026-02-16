"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Loader2, Save, Info } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ReminderTemplateDialogProps {
  templates: {
    reminderTemplateUpcoming: string | null;
    reminderTemplateOverdue: string | null;
  };
  onSuccess: () => void;
}

export function ReminderTemplateDialog({ templates, onSuccess }: ReminderTemplateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [upcoming, setUpcoming] = useState(templates.reminderTemplateUpcoming || "");
  const [overdue, setOverdue] = useState(templates.reminderTemplateOverdue || "");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setUpcoming(templates.reminderTemplateUpcoming || "");
      setOverdue(templates.reminderTemplateOverdue || "");
    }
  }, [isOpen, templates]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.patch("/api/finance", {
        reminderTemplateUpcoming: upcoming,
        reminderTemplateOverdue: overdue,
      });
      toast({
        title: "Templates atualizados",
        description: "As mensagens de lembrete foram salvas com sucesso.",
      });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os templates de mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configurar Mensagens de Lembrete</DialogTitle>
          <DialogDescription>
            Personalize as mensagens enviadas via WhatsApp para seus clientes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            <Info className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Variáveis disponíveis:</p>
              <p>Utilize as tags abaixo para personalizar a mensagem com dados reais:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{client_name}}"}</code>
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{valor}}"}</code>
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{due_date}}"}</code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="upcoming" className="text-base font-semibold">Lembrete Preventivo (Vencimento Próximo)</Label>
            <p className="text-sm text-muted-foreground">Enviado para faturas que vencem nos próximos 3 dias.</p>
            <Textarea
              id="upcoming"
              placeholder="Ex: Olá {{client_name}}, sua fatura de R$ {{valor}} vence em {{due_date}}..."
              className="min-h-[100px] resize-none"
              value={upcoming}
              onChange={(e) => setUpcoming(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="overdue" className="text-base font-semibold">Lembrete de Cobrança (Atrasado)</Label>
            <p className="text-sm text-muted-foreground">Enviado para faturas com pagamento pendente após o vencimento.</p>
            <Textarea
              id="overdue"
              placeholder="Ex: Olá {{client_name}}, identificamos um atraso no pagamento da fatura de R$ {{valor}}..."
              className="min-h-[100px] resize-none"
              value={overdue}
              onChange={(e) => setOverdue(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Templates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
