"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Facebook, Search as GoogleIcon, Zap, MessageSquare, Link2, Unlink } from "lucide-react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function IntegrationsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast({ title: "Conectado!", description: `Sua conta do ${success === 'meta' ? 'Meta' : 'Google'} Ads foi vinculada com sucesso.` });
    }
    if (error) {
      toast({ title: "Erro na conexão", description: `Não foi possível conectar ao ${error === 'meta' ? 'Meta' : 'Google'} Ads.`, variant: "destructive" });
    }
  }, [searchParams, toast]);

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

  const handleConnectAds = (provider: 'meta' | 'google') => {
    // Redireciona para a rota de conexão OAuth
    window.location.href = `/api/auth/connect/${provider}`;
  };

  const handleDisconnectAds = async (provider: 'meta' | 'google') => {
    try {
      setIsLoading(true);
      await axios.post(`/api/auth/disconnect/${provider}`);
      toast({ title: "Desconectado", description: `Sua conta do ${provider === 'meta' ? 'Meta' : 'Google'} Ads foi desconectada.` });
      fetchWorkspace();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível desconectar a conta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

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
                
                <div className="pt-2">
                  {workspaceData.metaAdsToken ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-700">Conectado: {workspaceData.metaAdsAccountName || 'Conta Meta'}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDisconnectAds('meta')}>
                        <Unlink className="h-3 w-3" /> Desconectar
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-blue-600/30 text-blue-600 hover:bg-blue-600/5" onClick={() => handleConnectAds('meta')}>
                      <Link2 className="h-3.5 w-3.5" /> Conectar Conta Meta
                    </Button>
                  )}
                </div>

                {workspaceData.metaAdsEnabled && (
                  <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <Label htmlFor="meta-pixel" className="text-xs">ID da Conta de Anúncios</Label>
                      <Input 
                        id="meta-pixel" 
                        placeholder="act_1234567890"
                        value={workspaceData.metaAdsPixelId || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, metaAdsPixelId: e.target.value })}
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

                <div className="pt-2">
                  {workspaceData.googleAdsToken ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-700">Conectado: {workspaceData.googleAdsAccountName || 'Conta Google'}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDisconnectAds('google')}>
                        <Unlink className="h-3 w-3" /> Desconectar
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5" onClick={() => handleConnectAds('google')}>
                      <Link2 className="h-3.5 w-3.5" /> Conectar Conta Google
                    </Button>
                  )}
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

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
