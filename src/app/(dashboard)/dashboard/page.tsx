"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  MessageSquare
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, alertRes] = await Promise.all([
          axios.get("/api/dashboard"),
          axios.get("/api/automation/follow-up")
        ]);
        setData(dashRes.data);
        setAlerts(alertRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerateFollowUp = async (alert: any) => {
    try {
      setIsGenerating(alert.id);
      const response = await axios.post("/api/automation/generate-message", {
        alertType: alert.type,
        alertData: alert.data
      });
      
      const message = response.data.message;
      const phone = alert.data.phone || alert.data.client?.phone;
      
      if (phone) {
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        toast({ title: "Sucesso", description: "Mensagem gerada e WhatsApp aberto!" });
      } else {
        navigator.clipboard.writeText(message);
        toast({ title: "Copiado", description: "Mensagem copiada (telefone não encontrado)" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar mensagem com IA", variant: "destructive" });
    } finally {
      setIsGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-muted rounded-xl" />
          <div className="h-[400px] bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "MRR Atual",
      value: `R$ ${data?.kpis?.mrr?.toLocaleString('pt-BR') || '0'}`,
      description: "Receita Recorrente Mensal",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-100/50"
    },
    {
      title: "Novos Clientes",
      value: data?.kpis?.newClients || "0",
      description: "Conquistados este mês",
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-100/40"
    },
    {
      title: "Taxa de Conversão",
      value: `${data?.kpis?.conversionRate || "0"}%`,
      description: "Leads para Clientes",
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-100/30"
    },
    {
      title: "Projetos Atrasados",
      value: data?.kpis?.overdueProjects || "0",
      description: "Precisam de atenção",
      icon: AlertCircle,
      color: data?.kpis?.overdueProjects > 0 ? "text-amber-600" : "text-orange-600",
      bg: data?.kpis?.overdueProjects > 0 ? "bg-amber-100/50" : "bg-orange-100/20"
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o resumo da sua agência.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={i}
              className="border border-orange-500/10 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent shadow-lg hover:shadow-xl transition-all overflow-hidden group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors ring-1 ring-orange-400/20",
                      kpi.bg
                    )}
                  >
                    <Icon className={cn("h-6 w-6", kpi.color)} />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <h2 className="text-3xl font-bold tracking-tight">{kpi.value}</h2>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Automação e Follow-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg overflow-hidden bg-gradient-to-br from-orange-500/10 via-transparent to-transparent border border-orange-500/15">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />
              Follow-up Inteligente (IA)
            </CardTitle>
            <CardDescription>Alertas automáticos para nunca mais perder uma venda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 hover:border-orange-400/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        alert.severity === "high"
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      )}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 border border-orange-400/30" 
                      onClick={() => handleGenerateFollowUp(alert)}
                      disabled={isGenerating === alert.id}
                    >
                      {isGenerating === alert.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      Enviar Follow-up
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold">Tudo em dia!</p>
                    <p className="text-sm text-muted-foreground">Você não tem alertas de follow-up pendentes.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg overflow-hidden border border-orange-500/10 bg-gradient-to-br from-orange-50/40 to-transparent dark:from-orange-950/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
              Tarefas de Hoje
            </CardTitle>
            <CardDescription>O que precisa ser feito agora</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.todayTasks?.length > 0 ? (
                data.todayTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.project.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhuma tarefa para hoje</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-2 border-orange-300/50 hover:bg-orange-50/40" asChild>
                <Link href="/calendar">Ver Calendário Completo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico MRR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendência de Faturamento (MRR)
            </CardTitle>
            <CardDescription>Evolução dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.mrrHistory || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  formatter={(value) => [`R$ ${value}`, "Faturamento"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tarefas Hoje */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Tarefas de Hoje
            </CardTitle>
            <CardDescription>O que precisa ser feito agora</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.todayTasks?.length > 0 ? (
                data.todayTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.project.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                  <Clock className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhuma tarefa para hoje</p>
                </div>
              )}
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href="/calendar">Ver Calendário Completo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Vencimentos */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-500" />
            Próximos Vencimentos
          </CardTitle>
          <CardDescription>Faturas que vencem nos próximos 3 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-muted">
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Vencimento</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                  <th className="pb-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {data?.nextInvoices?.length > 0 ? (
                  data.nextInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="py-4 font-medium">{invoice.client.name}</td>
                      <td className="py-4 text-muted-foreground">
                        {format(new Date(invoice.dueDate), "dd 'de' MMM", { locale: ptBR })}
                      </td>
                      <td className="py-4 font-bold">R$ {Number(invoice.amount).toLocaleString('pt-BR')}</td>
                      <td className="py-4 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                          Pendente
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-2 text-xs"
                          onClick={() => handleGenerateFollowUp({
                            id: `invoice-${invoice.id}`,
                            type: "INVOICE_DUE",
                            data: invoice
                          })}
                          disabled={isGenerating === `invoice-${invoice.id}`}
                        >
                          <Zap className="h-3 w-3" /> Cobrar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-medium">
                      Nenhum vencimento próximo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
