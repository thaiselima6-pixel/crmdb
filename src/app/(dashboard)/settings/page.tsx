"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Bell, Shield, Loader2, Upload, Check, MessageSquare, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
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

      fetchWorkspace();
      fetchNotifications();
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

        <Tabs defaultValue="profile" className="space-y-6">
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
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" /> Segurança
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Zap className="h-4 w-4" /> Automações
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
                <CardTitle>WhatsApp & N8N</CardTitle>
                <CardDescription>Configure suas integrações com Evolution API e N8N.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                  <div className="space-y-4">
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
                  </div>
                  <Button disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Configurações de Automação
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
