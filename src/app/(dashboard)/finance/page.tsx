"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, CreditCard, Receipt, MoreHorizontal, Plus, Trash2, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { useSession } from "next-auth/react";

const invoiceStatusMap: any = {
  PENDING: { label: "Pendente", variant: "warning" },
  PAID: { label: "Pago", variant: "success" },
  OVERDUE: { label: "Atrasado", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
};

const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: "internet", label: "Internet" },
  { value: "ferramentas", label: "Ferramentas / Software" },
  { value: "aluguel", label: "Aluguel" },
  { value: "marketing", label: "Marketing" },
  { value: "salarios", label: "Salários" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "outros", label: "Outros" },
];

import { InvoiceDialog } from "@/components/finance/invoice-dialog";
import { ReminderTemplateDialog } from "@/components/finance/reminder-template-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Loader2, CheckCircle2, Clock, Zap, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function FinancePage() {
  useSession();
  const [data, setData] = useState<any>({ invoices: [], mrr: 0 });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [transactionsView, setTransactionsView] = useState<"current_and_pending" | "all">("current_and_pending");
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "outros", date: new Date().toISOString().split("T")[0], recurring: false });
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const { toast } = useToast();

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const isPendingInvoice = (invoice: any) => invoice?.status === "PENDING" || invoice?.status === "OVERDUE";
  const isInCurrentMonth = (dateValue: unknown) => {
    const d = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
    if (Number.isNaN(d.getTime())) return false;
    return d >= startOfCurrentMonth && d < startOfNextMonth;
  };

  const displayedInvoices =
    transactionsView === "all"
      ? data.invoices
      : data.invoices.filter((inv: any) => isInCurrentMonth(inv.dueDate) || isPendingInvoice(inv));

  const totalReceived = data.invoices
    .filter((i: any) => i.status === "PAID" && isInCurrentMonth(i.dueDate))
    .reduce((acc: number, i: any) => acc + i.amount, 0);

  const totalExpenses = expenses
    .filter((e) => isInCurrentMonth(e.date))
    .reduce((acc: number, e: any) => acc + e.amount, 0);

  const netProfit = totalReceived - totalExpenses;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [finRes, expRes] = await Promise.all([
        axios.get("/api/finance"),
        axios.get("/api/expenses"),
      ]);
      setData(finRes.data);
      setExpenses(expRes.data);
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
      const { processed = 0, attempted = 0, skippedNoPhone = 0 } = response.data || {};
      toast({ title: "Automação Concluída", description: `${processed} enviados • ${attempted} analisados • ${skippedNoPhone} sem telefone` });
    } catch (error: any) {
      toast({ title: "Erro na Automação", description: error?.response?.data?.message || "Não foi possível processar os lembretes.", variant: "destructive" });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/finance/${id}`, { status });
      toast({ title: "Status Atualizado", description: `Marcado como ${invoiceStatusMap[status].label.toLowerCase()}.` });
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar o status.", variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      await axios.delete(`/api/finance/${id}`);
      toast({ title: "Transação Excluída" });
      fetchData();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      toast({ title: "Despesa removida" });
      fetchData();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleSaveExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.date) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      setIsSavingExpense(true);
      await axios.post("/api/expenses", newExpense);
      toast({ title: "Despesa adicionada!" });
      setExpenseDialogOpen(false);
      setNewExpense({ name: "", amount: "", category: "outros", date: new Date().toISOString().split("T")[0], recurring: false });
      fetchData();
    } catch {
      toast({ title: "Erro ao salvar despesa", variant: "destructive" });
    } finally {
      setIsSavingExpense(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe receitas, despesas e lucro da agência.</p>
        </div>
        <div className="flex gap-2">
          <ReminderTemplateDialog
            templates={data.templates || { reminderTemplateUpcoming: "", reminderTemplateDueToday: "", reminderTemplateOverdue: "", autoRemindersEnabled: false }}
            onSuccess={fetchData}
          />
          <div className="flex items-center gap-1">
            {data.templates?.autoRemindersEnabled && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Zap className="h-3 w-3" /> Auto ativo
              </span>
            )}
            <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white" onClick={sendAutomatedReminders} disabled={isSendingReminders}>
              {isSendingReminders ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              Lembretes WhatsApp
            </Button>
          </div>
          <InvoiceDialog onSuccess={fetchData} />
          <InvoiceDialog
            invoice={editingInvoice}
            open={isEditInvoiceOpen}
            onOpenChange={(nextOpen) => { setIsEditInvoiceOpen(nextOpen); if (!nextOpen) setEditingInvoice(null); }}
            onSuccess={() => { setIsEditInvoiceOpen(false); setEditingInvoice(null); fetchData(); }}
            trigger={null}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-primary text-primary-foreground h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Receita (Mês)</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalReceived)}</div>
                  <div className="flex items-center mt-2 text-xs opacity-80"><TrendingUp className="h-3 w-3 mr-1" /> Pagamentos confirmados</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</div>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground"><TrendingDown className="h-3 w-3 mr-1" /> {expenses.filter((e) => isInCurrentMonth(e.date)).length} despesas registradas</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Lucro Líquido (Mês)</CardTitle></CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(netProfit)}</div>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground"><CreditCard className="h-3 w-3 mr-1" /> Receita − Despesas</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <Card className="h-full">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">
                    {formatCurrency(data.invoices.filter((i: any) => i.status === "PENDING").reduce((acc: number, i: any) => acc + i.amount, 0))}
                  </div>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <Receipt className="h-3 w-3 mr-1" /> {data.invoices.filter((i: any) => i.status === "PENDING").length} aguardando
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
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">Receitas</h2>
            <span className="text-xs text-muted-foreground">
              {transactionsView === "all" ? "Exibindo: todas" : "Exibindo: mês atual + pendentes"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant={transactionsView === "current_and_pending" ? "default" : "outline"} size="sm" onClick={() => setTransactionsView("current_and_pending")}>Mês atual + pendentes</Button>
            <Button variant={transactionsView === "all" ? "default" : "outline"} size="sm" onClick={() => setTransactionsView("all")}>Todas</Button>
          </div>
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
              ) : displayedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhuma transação encontrada.</TableCell>
                </TableRow>
              ) : (
                displayedInvoices.map((invoice: any, index: number) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
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
                    <TableCell className="text-xs text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {invoice.status !== "PAID" && (
                            <DropdownMenuItem className="gap-2 text-green-600 focus:text-green-600 focus:bg-green-50" onClick={() => handleUpdateStatus(invoice.id, "PAID")}>
                              <CheckCircle2 className="h-4 w-4" /> Marcar como Pago
                            </DropdownMenuItem>
                          )}
                          {invoice.status === "PAID" && (
                            <DropdownMenuItem className="gap-2 text-orange-600 focus:text-orange-600 focus:bg-orange-50" onClick={() => handleUpdateStatus(invoice.id, "PENDING")}>
                              <Clock className="h-4 w-4" /> Marcar como Pendente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2" onClick={() => { setEditingInvoice(invoice); setIsEditInvoiceOpen(true); }}>
                            <Pencil className="h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteTransaction(invoice.id)}>
                            <Trash2 className="h-4 w-4" /> Excluir
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

      {/* Expenses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Despesas</h2>
            <span className="text-xs text-muted-foreground">Custos operacionais da agência.</span>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setExpenseDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar Despesa
          </Button>
        </div>
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Recorrente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Nenhuma despesa registrada. Clique em &ldquo;Adicionar Despesa&rdquo; para começar.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense: any, index: number) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-sm">{expense.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal capitalize">
                        {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-rose-500">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {expense.recurring ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600"><Repeat className="h-3 w-3" /> Sim</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExpense(expense.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-name">Descrição *</Label>
              <Input
                id="exp-name"
                placeholder="Ex: Internet, Hospedagem, Adobe Creative..."
                value={newExpense.name}
                onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Valor (R$) *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-date">Data *</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Despesa recorrente</p>
                <p className="text-xs text-muted-foreground">Repete todo mês (internet, assinaturas...)</p>
              </div>
              <Switch
                checked={newExpense.recurring}
                onCheckedChange={(v) => setNewExpense({ ...newExpense, recurring: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveExpense} disabled={isSavingExpense}>
              {isSavingExpense && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Despesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
