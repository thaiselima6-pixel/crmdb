"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Loader2, Save, Info, Zap } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface ReminderTemplateDialogProps {
  templates: {
    reminderTemplateUpcoming: string | null;
    reminderTemplateDueToday: string | null;
    reminderTemplateOverdue: string | null;
    autoRemindersEnabled: boolean | null;
  };
  onSuccess: () => void;
}

export function ReminderTemplateDialog({ templates, onSuccess }: ReminderTemplateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [upcoming, setUpcoming] = useState(templates.reminderTemplateUpcoming || "");
  const [dueToday, setDueToday] = useState(templates.reminderTemplateDueToday || "");
  const [overdue, setOverdue] = useState(templates.reminderTemplateOverdue || "");
  const [autoEnabled, setAutoEnabled] = useState(templates.autoRemindersEnabled ?? false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setUpcoming(templates.reminderTemplateUpcoming || "");
      setDueToday(templates.reminderTemplateDueToday || "");
      setOverdue(templates.reminderTemplateOverdue || "");
      setAutoEnabled(templates.autoRemindersEnabled ?? false);
    }
  }, [isOpen, templates]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.patch("/api/finance", {
        reminderTemplateUpcoming: upcoming,
        reminderTemplateDueToday: dueToday,
        reminderTemplateOverdue: overdue,
        autoRemindersEnabled: autoEnabled,
      });
      toast({
        title: "Configurações salvas",
        description: "Templates e automação de lembretes atualizados com sucesso.",
      });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações de lembrete.",
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
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Lembretes WhatsApp</DialogTitle>
          <DialogDescription>
            Personalize as mensagens e ative o disparo automático diário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle automação */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm">Disparos Automáticos Diários</p>
                <p className="text-xs text-muted-foreground">
                  Envia mensagens automaticamente todo dia às 9h sem precisar clicar no botão.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoEnabled}
              onClick={() => setAutoEnabled(!autoEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                autoEnabled ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  autoEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Variáveis */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{client_name}}"}</code>
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{valor}}"}</code>
                <code className="bg-white dark:bg-black/50 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">{"{{due_date}}"}</code>
              </div>
            </div>
          </div>

          {/* Template 1: 2 dias antes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">2 dias antes</span>
              <Label className="text-base font-semibold">Lembrete Preventivo</Label>
            </div>
            <p className="text-sm text-muted-foreground">Enviado 2 dias antes da data de vencimento.</p>
            <Textarea
              placeholder="Ex: Olá {{client_name}}, sua fatura de R$ {{valor}} vence em {{due_date}}..."
              className="min-h-[90px] resize-none"
              value={upcoming}
              onChange={(e) => setUpcoming(e.target.value)}
            />
          </div>

          {/* Template 2: No dia */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">No dia</span>
              <Label className="text-base font-semibold">Lembrete de Vencimento</Label>
            </div>
            <p className="text-sm text-muted-foreground">Enviado no próprio dia do vencimento da fatura.</p>
            <Textarea
              placeholder="Ex: Olá {{client_name}}, sua fatura de R$ {{valor}} vence hoje ({{due_date}})..."
              className="min-h-[90px] resize-none"
              value={dueToday}
              onChange={(e) => setDueToday(e.target.value)}
            />
          </div>

          {/* Template 3: 1 dia após */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">1 dia após</span>
              <Label className="text-base font-semibold">Cobrança de Atraso</Label>
            </div>
            <p className="text-sm text-muted-foreground">Enviado 1 dia após o vencimento quando a fatura não foi paga.</p>
            <Textarea
              placeholder="Ex: Olá {{client_name}}, identificamos atraso no pagamento da fatura de R$ {{valor}}..."
              className="min-h-[90px] resize-none"
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
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
