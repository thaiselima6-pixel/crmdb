"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Users, Layers, Briefcase, Calendar, DollarSign, Settings, LogOut, TrendingUp, TrendingDown, CreditCard, Receipt, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

const invoiceStatusMap: any = {
  PENDING: { label: "Pendente", variant: "warning" },
  PAID: { label: "Pago", variant: "success" },
  OVERDUE: { label: "Atrasado", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
};

import { InvoiceDialog } from "@/components/finance/invoice-dialog";
import { ReminderTemplateDialog } from "@/components/finance/reminder-template-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Loader2, CheckCircle2, Trash2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function FinancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>({ invoices: [], mrr: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const { toast } = useToast();

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/finance");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAutomatedReminders = async () => {
    try {
      setIsSendingReminders(true);
      const response = await axios.post("/api/finance/reminders");
      toast({
        title: "Automação Concluída",
        description: `${response.data.processed} lembretes foram processados e enviados via WhatsApp.`,
      });
    } catch (error) {
      toast({
        title: "Erro na Automação",
        description: "Não foi possível processar os lembretes automáticos.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/finance/${id}`, { status });
      toast({
        title: "Status Atualizado",
        description: `A transação foi marcada como ${invoiceStatusMap[status].label.toLowerCase()}.`,
      });
      fetchFinanceData();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da transação.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    
    try {
      await axios.delete(`/api/finance/${id}`);
      toast({
        title: "Transação Excluída",
        description: "A transação foi removida com sucesso.",
      });
      fetchFinanceData();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe a saúde financeira da sua agência.</p>
        </div>
        <div className="flex gap-2">
          <ReminderTemplateDialog 
            templates={data.templates || { reminderTemplateUpcoming: "", reminderTemplateOverdue: "" }} 
            onSuccess={fetchFinanceData} 
          />
          <Button 
            variant="outline" 
            className="gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
            onClick={sendAutomatedReminders}
            disabled={isSendingReminders}
          >
            {isSendingReminders ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            Lembretes WhatsApp
          </Button>
          <InvoiceDialog onSuccess={fetchFinanceData} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-primary text-primary-foreground h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium opacity-80">MRR (Receita Mensal)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatCurrency(data.mrr)}</div>
                      <div className="flex items-center mt-2 text-xs opacity-80">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +12% em relação ao mês anterior
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-500">
                        {formatCurrency(data.invoices.filter((i: any) => i.status === "PENDING").reduce((acc: number, i: any) => acc + i.amount, 0))}
                      </div>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Receipt className="h-3 w-3 mr-1" />
                        {data.invoices.filter((i: any) => i.status === "PENDING").length} faturas aguardando
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido (Mês)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-500">
                        {formatCurrency(data.invoices.filter((i: any) => i.status === "PAID").reduce((acc: number, i: any) => acc + i.amount, 0))}
                      </div>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pagamentos confirmados
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>

          {/* Transactions Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Últimas Transações</h2>
              <Button variant="outline" size="sm">Ver Relatório Completo</Button>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Cliente / Projeto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhuma transação encontrada.</TableCell>
                    </TableRow>
                  ) : (
                    data.invoices.map((invoice: any, index: number) => (
                      <motion.tr
                       key={invoice.id}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ duration: 0.2, delay: index * 0.05 }}
                       className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">#{invoice.id.substring(0, 8)}</span>
                            <span className="text-sm">{invoice.description || "Fatura de Serviço"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{invoice.client?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{invoice.project?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-primary">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={invoiceStatusMap[invoice.status]?.variant || "outline"} className="font-normal">
                            {invoiceStatusMap[invoice.status]?.label || invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {invoice.status !== "PAID" && (
                                <DropdownMenuItem 
                                  className="gap-2 text-green-600 focus:text-green-600 focus:bg-green-50"
                                  onClick={() => handleUpdateStatus(invoice.id, "PAID")}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                              )}
                              {invoice.status === "PAID" && (
                                <DropdownMenuItem 
                                  className="gap-2 text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                  onClick={() => handleUpdateStatus(invoice.id, "PENDING")}
                                >
                                  <Clock className="h-4 w-4" />
                                  Marcar como Pendente
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDeleteTransaction(invoice.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir Transação
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>
    );
}
