"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Facebook, Search as GoogleIcon, Zap, Link2, Unlink, Bot, Copy, CheckCheck, Info, QrCode, Rocket } from "lucide-react";
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

  useEffect(() => { fetchWorkspace(); }, []);

  const handleConnectAds = (provider: 'meta' | 'google') => {
    window.location.href = `/api/auth/connect/${provider}`;
  };

  const handleDisconnectAds = async (provider: 'meta' | 'google') => {
    try {
      setIsLoading(true);
      await axios.post(`/api/auth/disconnect/${provider}`);
      toast({ title: "Desconectado", description: `Sua conta do ${provider === 'meta' ? 'Meta' : 'Google'} Ads foi desconectada.` });
      fetchWorkspace();
    } catch {
      toast({ title: "Erro", description: "Não foi possível desconectar a conta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWorkspace = async () => {
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/workspace", workspaceData);
      toast({ title: "Configurações salvas", description: "Integrações atualizadas com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar as configurações.", variant: "destructive" });
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
      setQrCodeData(res.data.isConnected ? "connected" : res.data.qrCodeBase64);
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
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Conecte suas ferramentas e automatize processos comerciais.</p>
      </div>

      {/* ── SECTION 1: Conexões ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Conexões</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Canais de comunicação e tráfego pago.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* WhatsApp */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>WhatsApp (UazAPI)</CardTitle>
              <CardDescription>Conecte seu número para enviar e receber mensagens.</CardDescription>
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
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
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
                      toast({ title: "Erro", description: err?.response?.data?.message || "Não foi possível configurar.", variant: "destructive" });
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
                  className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading || !workspaceData.whatsappUrl || !workspaceData.whatsappApiKey}
                  onClick={handleGenerateQR}
                >
                  <QrCode className="h-4 w-4" /> Conectar via QR
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Automações */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>Gatilhos automáticos para atendimento e follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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

          {/* Tráfego Pago — full width */}
          <Card className="border-none shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle>Tráfego Pago (Ads)</CardTitle>
              <CardDescription>Conecte suas contas para relatórios automáticos no CRM.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Meta Ads */}
                <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <Facebook className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Meta Ads</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Facebook / Instagram</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!workspaceData.metaAdsEnabled}
                      onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, metaAdsEnabled: checked })}
                    />
                  </div>
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
                  {workspaceData.metaAdsEnabled && (
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
                  )}
                </div>

                {/* Google Ads */}
                <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <GoogleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Google Ads</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Busca / Display</p>
                      </div>
                    </div>
                    <Switch
                      checked={!!workspaceData.googleAdsEnabled}
                      onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, googleAdsEnabled: checked })}
                    />
                  </div>
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
                  {workspaceData.googleAdsEnabled && (
                    <div className="space-y-2">
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
        </div>
      </section>

      {/* ── SECTION 2: IA — Maya ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">IA — Maya</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Assistente virtual para atendimento automático via WhatsApp.</p>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Maya — Assistente Virtual</CardTitle>
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
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Como conectar o WhatsApp à Maya</p>
                  <p className="text-xs mt-1 opacity-90">
                    Use o botão <strong>"Ligar Webhook"</strong> na seção WhatsApp acima, ou copie a URL abaixo e configure manualmente no painel UazAPI em <strong>Webhooks</strong>, habilitando o evento <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">messages</code>.
                  </p>
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
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/whatsapp`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maya-prompt" className="font-semibold">Personalidade e Instruções da Maya</Label>
              <p className="text-xs text-muted-foreground">
                Descreva como a Maya deve se comportar. Deixe em branco para usar a personalidade padrão.
              </p>
              <Textarea
                id="maya-prompt"
                placeholder={`Exemplo:\nVocê é Maya, assistente virtual da ${workspaceData?.name || "minha agência"}.\nSeja simpática e objetiva. Quando alguém quiser saber sobre nossos serviços, apresente nossas soluções de tráfego pago e gestão de redes sociais.`}
                className="min-h-[120px] resize-none font-mono text-xs"
                value={workspaceData.mayaSystemPrompt || ""}
                onChange={(e) => setWorkspaceData({ ...workspaceData, mayaSystemPrompt: e.target.value })}
              />
            </div>

            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
              workspaceData.mayaEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-muted/30 border-border text-muted-foreground"
            }`}>
              <div className={`h-2 w-2 rounded-full ${workspaceData.mayaEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
              {workspaceData.mayaEnabled
                ? "Maya ativa — respondendo mensagens automaticamente."
                : "Maya desativada — mensagens registradas mas não respondidas."}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION 3: Integrações Externas ─────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Integrações Externas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sistemas externos que enviam dados para o CRM.</p>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>LeadForce → CRM</CardTitle>
                <CardDescription>
                  Recebe leads automaticamente do LeadForce e os insere no pipeline com boas-vindas via WhatsApp.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Como conectar o LeadForce</p>
                  <p className="text-xs mt-1 opacity-90">
                    No LeadForce, configure o envio via <strong>POST</strong> para a URL abaixo com o header{" "}
                    <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">x-api-key: LEADFORCE_API_KEY</code>.
                    Defina a variável <strong>LEADFORCE_API_KEY</strong> no Easypanel.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-orange-700 dark:text-orange-300">URL do Webhook</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-black/40 border border-orange-200 dark:border-orange-800 rounded px-3 py-2 font-mono truncate">
                    {typeof window !== "undefined" ? window.location.origin : "https://seu-dominio.com"}/api/webhooks/leadforce
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/leadforce`);
                      toast({ title: "URL copiada!" });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-orange-700 dark:text-orange-300">Payload esperado (JSON)</Label>
                <pre className="text-[10px] bg-white dark:bg-black/40 border border-orange-200 dark:border-orange-800 rounded px-3 py-2 font-mono overflow-x-auto text-muted-foreground">
{`{
  "name": "João Silva",       // ou "nome"
  "phone": "11999999999",     // ou "telefone"
  "email": "joao@email.com",
  "company": "Empresa Ltda",  // ou "empresa" (opcional)
  "source": "instagram"       // ou "origem" (opcional)
}`}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
              <div className="space-y-0.5">
                <p className="font-bold text-xs">Boas-vindas Automático via WhatsApp</p>
                <p className="text-[10px] text-muted-foreground">
                  Envia mensagem ao lead assim que ele chega pelo LeadForce. Requer WhatsApp configurado acima.
                </p>
              </div>
              <Switch
                checked={!!workspaceData?.autoWelcomeEnabled}
                onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, autoWelcomeEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="pb-4">
        <Button onClick={handleUpdateWorkspace} disabled={isLoading} className="w-full h-12 shadow-lg shadow-primary/20">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md flex flex-col items-center text-center">
          <DialogHeader>
            <DialogTitle>Conexão WhatsApp via QR Code</DialogTitle>
            <DialogDescription>Abra o WhatsApp no celular → Aparelhos Conectados → aponte para o código abaixo.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 bg-white rounded-xl min-h-[250px] w-[250px] border shadow-sm mt-4">
            {isGeneratingQr ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm font-medium animate-pulse">Buscando QR Code...</p>
              </div>
            ) : qrCodeData === "connected" ? (
              <div className="flex flex-col items-center gap-4 text-emerald-600 p-4 text-center">
                <CheckCheck className="h-16 w-16" />
                <p className="text-lg font-bold">WhatsApp Conectado!</p>
                <p className="text-[11px] text-slate-600">Sua instância já está ativa. Os disparos estão funcionando.</p>
              </div>
            ) : qrCodeData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeData} alt="QR Code WhatsApp" className="w-[200px] h-[200px] object-contain" />
            ) : qrError ? (
              <div className="flex flex-col items-center gap-2 text-center text-destructive p-2">
                <p className="text-xs font-bold uppercase">QR Indisponível</p>
                <p className="text-xs font-medium text-slate-700">{qrError}</p>
                <a href={workspaceData?.whatsappUrl} target="_blank" className="mt-3 text-xs text-white bg-blue-600 hover:bg-blue-700 w-full py-2 rounded-md font-medium">Abrir Painel UazAPI</a>
                <p className="text-[10px] text-muted-foreground mt-2">Conecte direto no painel UazAPI e o CRM funcionará automaticamente.</p>
              </div>
            ) : (
              <p className="text-sm text-destructive font-medium">Verifique sua URL e Token.</p>
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
