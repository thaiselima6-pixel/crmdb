"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Facebook, Search as GoogleIcon, Zap, MessageSquare, Link2, Unlink, Bot, Copy, CheckCheck, Info, QrCode } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function IntegrationsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

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

  const handleGenerateQR = async () => {
    if (!workspaceData.whatsappUrl || !workspaceData.whatsappApiKey) {
      toast({ title: "Credenciais ausentes", description: "Preencha a URL e Token primeiro.", variant: "destructive" });
      return;
    }
    setQrDialogOpen(true);
    setIsGeneratingQr(true);
    setQrCodeData(null);
    setQrError(null);
    try {
      await axios.patch("/api/settings/workspace", {
        whatsappUrl: workspaceData.whatsappUrl,
        whatsappApiKey: workspaceData.whatsappApiKey,
      });
      const res = await axios.post("/api/settings/whatsapp-qr", {
        url: workspaceData.whatsappUrl,
        token: workspaceData.whatsappApiKey
      });
      setQrCodeData(res.data.qrCodeBase64);
    } catch (err: any) {
      setQrError(err.response?.data?.error || "Servidor offline ou recusou a conexão.");
    } finally {
      setIsGeneratingQr(false);
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

        {/* WhatsApp (UazAPI) Section */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>WhatsApp (UazAPI)</CardTitle>
            <CardDescription>Conecte seu número via UazAPI para enviar e receber mensagens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wa-url">URL do Servidor UazAPI</Label>
              <Input
                id="wa-url"
                placeholder="https://httpseasyn8n.uazapi.com"
                value={workspaceData.whatsappUrl || ""}
                onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-key">Token da Instância</Label>
              <Input
                id="wa-key"
                type="password"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={workspaceData.whatsappApiKey || ""}
                onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappApiKey: e.target.value })}
              />
            </div>

            {/* Ações Avançadas WA */}
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Habilite o CRM a ler e responder suas mensagens apontando o Webhook, e emparelhe a conexão ativando o QR Code Nativo abaixo.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  disabled={isLoading || !workspaceData.whatsappUrl || !workspaceData.whatsappApiKey}
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      await axios.patch("/api/settings/workspace", {
                        whatsappUrl: workspaceData.whatsappUrl,
                        whatsappApiKey: workspaceData.whatsappApiKey,
                      });
                      const webhookUrl = `${window.location.origin}/api/webhooks/whatsapp`;
                      await axios.post("/api/settings/configure-webhook", { webhookUrl });
                      toast({ title: "Webhook configurado!", description: "UazAPI agora aponta para o CRM." });
                    } catch (err: any) {
                      toast({ title: "Erro", description: err?.response?.data?.message || "Não foi possível configurar o webhook.", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Ligar Webhook
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading || !workspaceData.whatsappUrl || !workspaceData.whatsappApiKey}
                  onClick={handleGenerateQR}
                >
                  <QrCode className="h-4 w-4" /> Conectar via QR Code
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Label htmlFor="n8n-url">Webhook N8N (opcional)</Label>
              <Input
                id="n8n-url"
                placeholder="https://n8n.seu-servidor.com/webhook/..."
                value={workspaceData.n8nWebhookUrl || ""}
                onChange={(e) => setWorkspaceData({ ...workspaceData, n8nWebhookUrl: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">Se preenchido, o CRM também encaminha eventos para o N8N.</p>
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

        {/* Maya IA Section */}
        <Card className="border-none shadow-md md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Maya — Assistente Virtual WhatsApp</CardTitle>
                  <CardDescription>Responde automaticamente a leads e clientes usando IA.</CardDescription>
                </div>
              </div>
              <Switch
                checked={!!workspaceData.mayaEnabled}
                onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, mayaEnabled: checked })}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* URL do webhook para configurar no Evolution API */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Como conectar o WhatsApp à Maya</p>
                  <p className="text-xs mt-1 opacity-90">Use o botão <strong>"Configurar Webhook Automaticamente"</strong> acima (seção WhatsApp). Ou copie a URL abaixo e configure manualmente no painel UazAPI em <strong>Webhooks</strong>, habilitando o evento <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">messages</code>.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-black/40 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 font-mono truncate">
                  {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/whatsapp
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                  onClick={() => {
                    const url = `${window.location.origin}/api/webhooks/whatsapp`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>

            {/* System prompt / personalidade */}
            <div className="space-y-2">
              <Label htmlFor="maya-prompt" className="font-semibold">
                Personalidade e Instruções da Maya
              </Label>
              <p className="text-xs text-muted-foreground">
                Descreva como a Maya deve se comportar, o que oferecer e como abordar os contatos. Deixe em branco para usar a personalidade padrão.
              </p>
              <Textarea
                id="maya-prompt"
                placeholder={`Exemplo:\nVocê é Maya, assistente virtual da ${workspaceData?.name || "minha agência"}.\nSeja simpática e objetiva. Quando alguém quiser saber sobre nossos serviços, apresente nossas soluções de tráfego pago e gestão de redes sociais.\nSempre finalize coletando o WhatsApp do interessado para um especialista retornar.`}
                className="min-h-[130px] resize-none font-mono text-xs"
                value={workspaceData.mayaSystemPrompt || ""}
                onChange={(e) => setWorkspaceData({ ...workspaceData, mayaSystemPrompt: e.target.value })}
              />
            </div>

            {/* Status visual */}
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
              workspaceData.mayaEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-muted/30 border-border text-muted-foreground"
            }`}>
              <div className={`h-2 w-2 rounded-full ${workspaceData.mayaEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
              {workspaceData.mayaEnabled
                ? "Maya ativa — respondendo mensagens recebidas via WhatsApp automaticamente."
                : "Maya desativada — mensagens são registradas mas não respondidas automaticamente."}
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

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md flex flex-col items-center text-center">
          <DialogHeader>
            <DialogTitle>Conexão Nativa WhatsApp</DialogTitle>
            <DialogDescription>Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para o código abaixo.</DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center p-6 bg-white rounded-xl min-h-[250px] w-[250px] border shadow-sm mt-4">
            {isGeneratingQr ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm font-medium animate-pulse">Buscando QR Code...</p>
              </div>
            ) : qrCodeData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeData} alt="WhatsApp QR Code Base64" className="w-[200px] h-[200px] object-contain" />
            ) : qrError ? (
              <div className="flex flex-col items-center gap-2 text-center text-destructive p-2">
                 <p className="text-xs font-bold uppercase">QR Secundário Indisponível</p>
                 <p className="text-xs font-medium text-slate-700">{qrError}</p>
                 <a href={workspaceData?.whatsappUrl} target="_blank" className="mt-3 text-xs text-white bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-md font-medium">Abrir Painel do UazAPI</a>
                 <p className="text-[10px] text-muted-foreground mt-2">Dica: Se você usa UazAPI / Serviços Fechados, a plataforma deles bloqueia a exportação do QR para CRMs. Vá diretamente no site oficial deles, conecte o seu celular e o CRM funcionará automaticamente!</p>
              </div>
            ) : (
              <p className="text-sm text-destructive font-medium">Falha na API: Verifique sua URL e Token.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
