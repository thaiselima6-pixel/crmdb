"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Bell, Shield, Loader2, Upload, Check, MessageSquare, Zap, LayoutGrid, Plus, Trash2, Facebook, Search as GoogleIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";

  const [isLoading, setIsLoading] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<any>({ name: "", logo: "" });
  const [userData, setUserData] = useState<any>({ name: "", email: "" });
  const [securityData, setSecurityData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifications, setNotifications] = useState({
    newLead: true,
    newInvoice: true,
    projectUpdates: true,
    weeklyReport: false,
  });
  const [pipelines, setPipelines] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || "",
        email: session.user.email || ""
      });
      
      const fetchWorkspace = async () => {
        try {
          const response = await axios.get("/api/settings/workspace");
          setWorkspaceData(response.data);
        } catch (error) {
          console.error("Failed to fetch workspace", error);
        }
      };

      const fetchNotifications = async () => {
        try {
          const response = await axios.get("/api/settings/notifications");
          if (response.data) {
            setNotifications(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      };

      const fetchPipelines = async () => {
        try {
          const response = await axios.get("/api/pipelines");
          setPipelines(response.data);
        } catch (error) {
          console.error("Failed to fetch pipelines", error);
        }
      };

      fetchWorkspace();
      fetchNotifications();
      fetchPipelines();
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/profile", userData);
      await update();
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/workspace", workspaceData);
      toast({
        title: "Workspace atualizado",
        description: "As configurações da agência foram salvas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o workspace.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
    }
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/security", securityData);
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a senha.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setIsLoading(true);
      await axios.patch("/api/settings/notifications", notifications);
      toast({
        title: "Preferências salvas",
        description: "Suas configurações de notificação foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulação de upload - converter para base64 para demonstração
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorkspaceData({ ...workspaceData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie sua conta e as configurações da agência.</p>
        </div>

        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Perfil
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2">
              <Building2 className="h-4 w-4" /> Agência
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="pipelines" className="gap-2">
              <LayoutGrid className="h-4 w-4" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" /> Segurança
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" /> Automações
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plus className="h-4 w-4" /> Ads & Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Seu Perfil</CardTitle>
                <CardDescription>Atualize suas informações pessoais.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      value={userData.name} 
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      disabled 
                      value={userData.email} 
                    />
                    <p className="text-[10px] text-muted-foreground">O email não pode ser alterado por motivos de segurança.</p>
                  </div>
                  <Button disabled={isLoading} className="mt-4">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Configurações da Agência</CardTitle>
                <CardDescription>Gerencie o nome e identidade da sua workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 group-hover:border-primary transition-colors">
                        {workspaceData.logo ? (
                          <img src={workspaceData.logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <Upload className="h-5 w-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium">Logo da Agência</h4>
                      <p className="text-xs text-muted-foreground">Recomendado: 512x512px (PNG ou JPG). Tamanho máx: 2MB.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ws-name">Nome da Agência</Label>
                    <Input 
                      id="ws-name" 
                      value={workspaceData.name} 
                      onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                    />
                  </div>
                  <Button disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar Workspace
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Escolha quais alertas você deseja receber por e-mail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novos Leads</Label>
                      <p className="text-xs text-muted-foreground">Receba um alerta quando um novo lead for cadastrado.</p>
                    </div>
                    <Switch 
                      checked={notifications.newLead} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newLead: checked })} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novas Faturas</Label>
                      <p className="text-xs text-muted-foreground">Aviso quando uma fatura for gerada ou paga.</p>
                    </div>
                    <Switch 
                      checked={notifications.newInvoice} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newInvoice: checked })} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atualizações de Projeto</Label>
                      <p className="text-xs text-muted-foreground">Notificar quando uma tarefa for concluída ou prazo alterado.</p>
                    </div>
                    <Switch 
                      checked={notifications.projectUpdates} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, projectUpdates: checked })} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Relatório Semanal</Label>
                      <p className="text-xs text-muted-foreground">Resumo do desempenho da agência toda segunda-feira.</p>
                    </div>
                    <Switch 
                      checked={notifications.weeklyReport} 
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })} 
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleUpdateNotifications}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipelines">
            <Card className="border-none shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pipelines de Vendas</CardTitle>
                    <CardDescription>Personalize os estágios do seu processo comercial.</CardDescription>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => {
                    // Logic to add a new pipeline would go here
                    toast({ title: "Funcionalidade em desenvolvimento", description: "Em breve você poderá criar múltiplos pipelines." });
                  }}>
                    <Plus className="h-4 w-4" /> Novo Pipeline
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="space-y-4 p-4 border rounded-xl bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{pipeline.name}</h4>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estágios do Pipeline</Label>
                      <div className="space-y-2">
                        {pipeline.stages.map((stage: any, index: number) => (
                          <div key={stage.id} className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {index + 1}
                            </div>
                            <Input 
                              value={stage.name} 
                              onChange={(e) => {
                                const newPipelines = [...pipelines];
                                const pIdx = newPipelines.findIndex(p => p.id === pipeline.id);
                                const sIdx = newPipelines[pIdx].stages.findIndex((s: any) => s.id === stage.id);
                                newPipelines[pIdx].stages[sIdx].name = e.target.value;
                                setPipelines(newPipelines);
                              }}
                              className="flex-1"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full mt-2 border-dashed border-2 gap-2" onClick={() => {
                          const newPipelines = [...pipelines];
                          const pIdx = newPipelines.findIndex(p => p.id === pipeline.id);
                          newPipelines[pIdx].stages.push({ id: `new-${Date.now()}`, name: "Novo Estágio", order: pipeline.stages.length });
                          setPipelines(newPipelines);
                        }}>
                          <Plus className="h-4 w-4" /> Adicionar Estágio
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            // logic to save pipeline stages
                            // await axios.patch(`/api/pipelines/${pipeline.id}`, pipeline);
                            toast({ title: "Pipeline salvo", description: "As alterações foram aplicadas com sucesso." });
                          } catch (error) {
                            toast({ title: "Erro", description: "Não foi possível salvar o pipeline.", variant: "destructive" });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Pipeline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Mantenha sua conta segura alterando sua senha regularmente.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSecurity} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="mt-4">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automations">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Automações de Vendas</CardTitle>
                <CardDescription>Configure gatilhos e ações automáticas para ganhar escala.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-xl bg-muted/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Follow-up Automático</p>
                      <p className="text-xs text-muted-foreground">Enviar mensagem se o lead não responder em 48 horas.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="p-4 border rounded-xl bg-muted/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Boas-vindas Instantâneo</p>
                      <p className="text-xs text-muted-foreground">Enviar mensagem via WhatsApp assim que um novo lead entrar.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="p-4 border rounded-xl bg-muted/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Lembrete de Reunião</p>
                      <p className="text-xs text-muted-foreground">Aviso automático 1 hora antes de compromissos no calendário.</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="font-bold text-sm mb-4">Configurações de API (WhatsApp & N8N)</h4>
                  <form onSubmit={handleUpdateWorkspace} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-instance">Nome da Instância</Label>
                      <Input 
                        id="wa-instance" 
                        placeholder="ex: agencial_whatsapp"
                        value={workspaceData.whatsappInstance || ""} 
                        onChange={(e) => setWorkspaceData({ ...workspaceData, whatsappInstance: e.target.value })}
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="n8n-url">Webhook N8N (Opcional)</Label>
                        <Input 
                          id="n8n-url" 
                          placeholder="https://n8n.seu-servidor.com/webhook/..."
                          value={workspaceData.n8nWebhookUrl || ""} 
                          onChange={(e) => setWorkspaceData({ ...workspaceData, n8nWebhookUrl: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">URL para disparar fluxos complexos no N8N.</p>
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Configurações de Automação
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Integrações de Anúncios</CardTitle>
                <CardDescription>Conecte suas contas de tráfego pago para gerar relatórios automáticos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                  <div className="grid gap-6">
                    {/* Meta Ads Section */}
                    <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                            <Facebook className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold">Meta Ads (Facebook/Instagram)</p>
                            <p className="text-xs text-muted-foreground">Configure seu Pixel e Access Token.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={!!workspaceData.metaAdsEnabled} 
                          onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, metaAdsEnabled: checked })}
                        />
                      </div>
                      
                      {workspaceData.metaAdsEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <Label htmlFor="meta-pixel">ID do Pixel / BM</Label>
                            <Input 
                              id="meta-pixel" 
                              placeholder="ex: 1234567890"
                              value={workspaceData.metaAdsPixelId || ""} 
                              onChange={(e) => setWorkspaceData({ ...workspaceData, metaAdsPixelId: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="meta-token">Access Token</Label>
                            <Input 
                              id="meta-token" 
                              type="password"
                              placeholder="EAAB..."
                              value={workspaceData.metaAdsToken || ""} 
                              onChange={(e) => setWorkspaceData({ ...workspaceData, metaAdsToken: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Google Ads Section */}
                    <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <GoogleIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold">Google Ads</p>
                            <p className="text-xs text-muted-foreground">Configure seu Customer ID e Developer Token.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={!!workspaceData.googleAdsEnabled} 
                          onCheckedChange={(checked) => setWorkspaceData({ ...workspaceData, googleAdsEnabled: checked })}
                        />
                      </div>

                      {workspaceData.googleAdsEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <Label htmlFor="google-id">Customer ID</Label>
                            <Input 
                              id="google-id" 
                              placeholder="xxx-xxx-xxxx"
                              value={workspaceData.googleAdsCustomerId || ""} 
                              onChange={(e) => setWorkspaceData({ ...workspaceData, googleAdsCustomerId: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="google-token">Developer Token</Label>
                            <Input 
                              id="google-token" 
                              type="password"
                              placeholder="Token da API"
                              value={workspaceData.googleAdsDeveloperToken || ""} 
                              onChange={(e) => setWorkspaceData({ ...workspaceData, googleAdsDeveloperToken: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Configurações de Ads
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
