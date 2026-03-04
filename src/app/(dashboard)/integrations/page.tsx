"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Facebook, Search as GoogleIcon, Zap, MessageSquare } from "lucide-react";
import axios from "axios";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  const fetchWorkspace = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/settings/workspace");
      setWorkspaceData(response.data);
    } catch (error) {
      console.error("Failed to fetch workspace", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleUpdateWorkspace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/workspace", workspaceData);
      toast({
        title: "Configurações salvas",
        description: "Suas integrações e automações foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspaceData) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações & Automações</h1>
        <p className="text-muted-foreground">Conecte suas ferramentas e automatize processos comerciais.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ads Section */}
        <Card className="border-none shadow-md md:col-span-2">
          <CardHeader>
            <CardTitle>Tráfego Pago (Ads)</CardTitle>
            <CardDescription>Conecte suas contas para gerar relatórios automáticos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Meta Ads */}
              <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                      <Facebook className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">Meta Ads</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Facebook / Instagram</p>
                    </div>
                  </div>
                  <Switch 
                    checked={!!workspaceData.metaAdsEnabled} 
                    onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, metaAdsEnabled: checked })}
                  />
                </div>
                
                {workspaceData.metaAdsEnabled && (
                  <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <Label htmlFor="meta-pixel" className="text-xs">ID do Pixel / BM</Label>
                      <Input 
                        id="meta-pixel" 
                        placeholder="ex: 1234567890"
                        value={workspaceData.metaAdsPixelId || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, metaAdsPixelId: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="meta-token" className="text-xs">Access Token</Label>
                      <Input 
                        id="meta-token" 
                        type="password"
                        placeholder="EAAB..."
                        value={workspaceData.metaAdsToken || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, metaAdsToken: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <GoogleIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold">Google Ads</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Busca / Display</p>
                    </div>
                  </div>
                  <Switch 
                    checked={!!workspaceData.googleAdsEnabled} 
                    onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, googleAdsEnabled: checked })}
                  />
                </div>

                {workspaceData.googleAdsEnabled && (
                  <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <Label htmlFor="google-id" className="text-xs">Customer ID</Label>
                      <Input 
                        id="google-id" 
                        placeholder="xxx-xxx-xxxx"
                        value={workspaceData.googleAdsCustomerId || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, googleAdsCustomerId: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="google-token" className="text-xs">Developer Token</Label>
                      <Input 
                        id="google-token" 
                        type="password"
                        placeholder="Token da API"
                        value={workspaceData.googleAdsDeveloperToken || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, googleAdsDeveloperToken: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp & N8N Section */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>WhatsApp & N8N</CardTitle>
            <CardDescription>Conecte sua Evolution API e Webhooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa-url">URL Evolution API</Label>
              <Input 
                id="wa-url" 
                placeholder="https://api.sua-instancia.com"
                value={workspaceData.whatsappUrl || ""} 
                onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-key">API Key</Label>
              <Input 
                id="wa-key" 
                type="password"
                value={workspaceData.whatsappApiKey || ""} 
                onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappApiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-instance">Instância</Label>
              <Input 
                id="wa-instance" 
                placeholder="ex: agencial_whatsapp"
                value={workspaceData.whatsappInstance || ""} 
                onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappInstance: e.target.value })}
              />
            </div>
            <div className="pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="n8n-url">Webhook N8N</Label>
                <Input 
                  id="n8n-url" 
                  placeholder="https://n8n.seu-servidor.com/webhook/..."
                  value={workspaceData.n8nWebhookUrl || ""} 
                  onChange={(e) => setWorkspaceData({ ...workspaceData, n8nWebhookUrl: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automations Section */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Regras de Automação</CardTitle>
            <CardDescription>Gatilhos automáticos para ganhos de escala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-xl bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Boas-vindas Instantâneo</p>
                <p className="text-[10px] text-muted-foreground">Mensagem via WhatsApp para novos leads.</p>
              </div>
              <Switch 
                checked={!!workspaceData.autoWelcomeEnabled} 
                onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, autoWelcomeEnabled: checked })}
              />
            </div>
            <div className="p-3 border rounded-xl bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Follow-up Automático</p>
                <p className="text-[10px] text-muted-foreground">Lembrete após 48h sem resposta.</p>
              </div>
              <Switch 
                checked={!!workspaceData.autoFollowUpEnabled} 
                onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, autoFollowUpEnabled: checked })}
              />
            </div>
            <div className="p-3 border rounded-xl bg-muted/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Lembrete de Reunião</p>
                <p className="text-[10px] text-muted-foreground">Aviso 1 hora antes de compromissos.</p>
              </div>
              <Switch 
                checked={!!workspaceData.meetingRemindersEnabled} 
                onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, meetingRemindersEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 pt-4">
          <Button onClick={() => handleUpdateWorkspace()} disabled={isLoading} className="w-full h-12 shadow-lg shadow-primary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
