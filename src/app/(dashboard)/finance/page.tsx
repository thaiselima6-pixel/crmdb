"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TrendingUp, CreditCard, Receipt, MoreHorizontal,
  Plus, Trash2, Lock, Shuffle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { InvoiceDialog } from "@/components/finance/invoice-dialog";
import { ReminderTemplateDialog } from "@/components/finance/reminder-template-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Loader2, CheckCircle2, Clock, Zap, Pencil } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────

const invoiceStatusMap: Record<string, { label: string; variant: string }> = {
  PENDING:   { label: "Pendente",   variant: "warning" },
  PAID:      { label: "Pago",       variant: "success" },
  OVERDUE:   { label: "Atrasado",   variant: "destructive" },
  CANCELLED: { label: "Cancelado",  variant: "secondary" },
};

const EXPENSE_CATEGORIES = [
  { value: "internet",      label: "Internet / Telecom" },
  { value: "ferramentas",   label: "Ferramentas / Software" },
  { value: "aluguel",       label: "Aluguel / Escritório" },
  { value: "salarios",      label: "Salários / Freelancers" },
  { value: "marketing",     label: "Marketing / Anúncios" },
  { value: "contabilidade", label: "Contabilidade / Jurídico" },
  { value: "outros",        label: "Outros" },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [data, setData]         = useState<any>({ invoices: [], mrr: 0 });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [transactionsView, setTransactionsView] =
    useState<"current_and_pending" | "all">("current_and_pending");
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice]       = useState<any>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseType, setExpenseType]   = useState<"fixed" | "variable">("fixed");
  const [newExpense, setNewExpense]     = useState({
    name: "", amount: "", category: "internet",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const { toast } = useToast();

  // Date helpers
  const now               = new Date();
  const startOfMonth      = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const isInCurrentMonth = (d: unknown) => {
    const date = d instanceof Date ? d : new Date(String(d));
    return !isNaN(date.getTime()) && date >= startOfMonth && date < startOfNextMonth;
  };
  const isPending = (inv: any) => inv.status === "PENDING" || inv.status === "OVERDUE";

  // Derived values
  const fixedExpenses    = expenses.filter((e) => e.recurring);
  const variableExpenses = expenses.filter((e) => !e.recurring);

  const totalFixed    = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalVariable = variableExpenses.filter((e) => isInCurrentMonth(e.date)).reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalFixed + totalVariable;

  const totalReceived = data.invoices
    .filter((i: any) => i.status === "PAID" && isInCurrentMonth(i.dueDate))
    .reduce((s: number, i: any) => s + i.amount, 0);

  const netProfit = totalReceived - totalExpenses;

  const displayedInvoices =
    transactionsView === "all"
      ? data.invoices
      : data.invoices.filter((i: any) => isInCurrentMonth(i.dueDate) || isPending(i));

  // Data fetching
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [finRes, expRes] = await Promise.all([
        axios.get("/api/finance"),
        axios.get("/api/expenses"),
      ]);
      setData(finRes.data);
      setExpenses(expRes.data);
    } catch {
      console.error("Failed to fetch finance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Actions
  const sendAutomatedReminders = async () => {
    try {
      setIsSendingReminders(true);
      const r = await axios.post("/api/finance/reminders");
      const { processed = 0, attempted = 0, skippedNoPhone = 0 } = r.data || {};
      toast({ title: "Automação Concluída", description: `${processed} enviados • ${attempted} analisados • ${skippedNoPhone} sem telefone` });
    } catch (err: any) {
      toast({ title: "Erro na Automação", description: err?.response?.data?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/finance/${id}`, { status });
      toast({ title: "Status atualizado." });
      fetchData();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    try { await axios.delete(`/api/finance/${id}`); fetchData(); } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    try { await axios.delete(`/api/expenses/${id}`); fetchData(); } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const openExpenseDialog = (type: "fixed" | "variable") => {
    setExpenseType(type);
    setNewExpense({ name: "", amount: "", category: type === "fixed" ? "internet" : "marketing", date: new Date().toISOString().split("T")[0] });
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.date) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      setIsSavingExpense(true);
      await axios.post("/api/expenses", {
        ...newExpense,
        recurring: expenseType === "fixed",
      });
      toast({ title: `Despesa ${expenseType === "fixed" ? "fixa" : "variável"} adicionada!` });
      setExpenseDialogOpen(false);
      fetchData();
    } catch {
      toast({ title: "Erro ao salvar despesa", variant: "destructive" });
    } finally {
      setIsSavingExpense(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Receitas, despesas fixas, variáveis e lucro da agência.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <ReminderTemplateDialog
            templates={data.templates || { reminderTemplateUpcoming: "", reminderTemplateDueToday: "", reminderTemplateOverdue: "", autoRemindersEnabled: false }}
            onSuccess={fetchData}
          />
          <div className="flex items-center gap-1">
            {data.templates?.autoRemindersEnabled && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-200">
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
            onOpenChange={(v) => { setIsEditInvoiceOpen(v); if (!v) setEditingInvoice(null); }}
            onSuccess={() => { setIsEditInvoiceOpen(false); setEditingInvoice(null); fetchData(); }}
            trigger={null}
          />
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1,2,3,4].map((i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            {/* Faturamento */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
              <Card className="bg-primary text-primary-foreground h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-80 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Faturamento (Mês)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalReceived)}</div>
                  <p className="text-xs opacity-70 mt-2">Pagamentos confirmados no mês</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Despesas Fixas */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.07 }}>
              <Card className="h-full border-rose-200 dark:border-rose-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-rose-500" /> Despesas Fixas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-rose-500">{formatCurrency(totalFixed)}</div>
                  <p className="text-xs text-muted-foreground mt-2">{fixedExpenses.length} despesas recorrentes</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Despesas Variáveis */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.14 }}>
              <Card className="h-full border-orange-200 dark:border-orange-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Shuffle className="h-3.5 w-3.5 text-orange-500" /> Despesas Variáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">{formatCurrency(totalVariable)}</div>
                  <p className="text-xs text-muted-foreground mt-2">{variableExpenses.filter((e) => isInCurrentMonth(e.date)).length} lançamentos no mês</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lucro Líquido */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.21 }}>
              <Card className={`h-full ${netProfit >= 0 ? "border-emerald-200 dark:border-emerald-900" : "border-rose-200 dark:border-rose-900"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className={`h-3.5 w-3.5 ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`} /> Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(netProfit)}</div>
                  <p className="text-xs text-muted-foreground mt-2">Faturamento − Fixas − Variáveis</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* ── Resumo visual de despesas ─────────────────────────────────────── */}
      {!isLoading && totalExpenses > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Composição das Despesas</p>
          <div className="flex rounded-full h-4 overflow-hidden gap-0.5">
            {totalFixed > 0 && (
              <div
                className="bg-rose-500 transition-all"
                style={{ width: `${(totalFixed / totalExpenses) * 100}%` }}
                title={`Fixas: ${formatCurrency(totalFixed)}`}
              />
            )}
            {totalVariable > 0 && (
              <div
                className="bg-orange-400 transition-all"
                style={{ width: `${(totalVariable / totalExpenses) * 100}%` }}
                title={`Variáveis: ${formatCurrency(totalVariable)}`}
              />
            )}
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /> Fixas {totalExpenses > 0 ? `${Math.round((totalFixed / totalExpenses) * 100)}%` : ""}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400" /> Variáveis {totalExpenses > 0 ? `${Math.round((totalVariable / totalExpenses) * 100)}%` : ""}</div>
            <div className="flex items-center gap-1.5 ml-auto font-medium text-foreground">Total: {formatCurrency(totalExpenses)}</div>
          </div>
        </div>
      )}

      {/* ── Tabs: Receitas / Despesas Fixas / Despesas Variáveis ─────────── */}
      <Tabs defaultValue="receitas">
        <TabsList className="mb-4">
          <TabsTrigger value="receitas" className="gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Receitas
          </TabsTrigger>
          <TabsTrigger value="fixas" className="gap-2">
            <Lock className="h-3.5 w-3.5" /> Despesas Fixas
          </TabsTrigger>
          <TabsTrigger value="variaveis" className="gap-2">
            <Shuffle className="h-3.5 w-3.5" /> Despesas Variáveis
          </TabsTrigger>
        </TabsList>

        {/* ── Receitas ──────────────────────────────────────────────────── */}
        <TabsContent value="receitas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Faturas / Receitas</h2>
              <span className="text-xs text-muted-foreground">
                {transactionsView === "all" ? "Exibindo: todas" : "Exibindo: mês atual + pendentes"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant={transactionsView === "current_and_pending" ? "default" : "outline"} size="sm" onClick={() => setTransactionsView("current_and_pending")}>Mês atual</Button>
              <Button variant={transactionsView === "all" ? "default" : "outline"} size="sm" onClick={() => setTransactionsView("all")}>Todas</Button>
            </div>
          </div>
          <InvoiceTable
            invoices={displayedInvoices}
            isLoading={isLoading}
            invoiceStatusMap={invoiceStatusMap}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteTransaction}
            onEdit={(inv: any) => { setEditingInvoice(inv); setIsEditInvoiceOpen(true); }}
          />
          {/* Faturas pendentes destaque */}
          {!isLoading && data.invoices.filter((i: any) => isPending(i)).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              {data.invoices.filter((i: any) => isPending(i)).length} fatura(s) pendente(s) totalizando{" "}
              <strong>{formatCurrency(data.invoices.filter((i: any) => isPending(i)).reduce((s: number, i: any) => s + i.amount, 0))}</strong>
            </div>
          )}
        </TabsContent>

        {/* ── Despesas Fixas ────────────────────────────────────────────── */}
        <TabsContent value="fixas" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Despesas Fixas</h2>
              <span className="text-xs text-muted-foreground">Mensalidades e custos recorrentes — internet, aluguel, salários, assinaturas.</span>
            </div>
            <Button size="sm" className="gap-2 bg-rose-600 hover:bg-rose-700" onClick={() => openExpenseDialog("fixed")}>
              <Plus className="h-4 w-4" /> Adicionar Fixa
            </Button>
          </div>
          <ExpenseTable expenses={fixedExpenses} isLoading={isLoading} onDelete={handleDeleteExpense} type="fixed" />
          {!isLoading && fixedExpenses.length > 0 && (
            <div className="flex items-center justify-end gap-2 text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-2">
              <Lock className="h-3.5 w-3.5" /> Total fixo mensal: {formatCurrency(totalFixed)}
            </div>
          )}
        </TabsContent>

        {/* ── Despesas Variáveis ────────────────────────────────────────── */}
        <TabsContent value="variaveis" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Despesas Variáveis</h2>
              <span className="text-xs text-muted-foreground">Gastos pontuais do mês — anúncios, freelancers, materiais, eventos.</span>
            </div>
            <Button size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => openExpenseDialog("variable")}>
              <Plus className="h-4 w-4" /> Adicionar Variável
            </Button>
          </div>
          <ExpenseTable expenses={variableExpenses} isLoading={isLoading} onDelete={handleDeleteExpense} type="variable" />
          {!isLoading && variableExpenses.length > 0 && (
            <div className="flex items-center justify-end gap-2 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-2">
              <Shuffle className="h-3.5 w-3.5" /> Total variável (mês): {formatCurrency(totalVariable)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Expense Dialog ──────────────────────────────────────────────── */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {expenseType === "fixed"
                ? <><Lock className="h-4 w-4 text-rose-500" /> Nova Despesa Fixa</>
                : <><Shuffle className="h-4 w-4 text-orange-500" /> Nova Despesa Variável</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className={`text-xs px-3 py-2 rounded-lg border ${
              expenseType === "fixed"
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-orange-50 border-orange-200 text-orange-700"
            }`}>
              {expenseType === "fixed"
                ? "Despesa fixa = valor que se repete todo mês (internet, aluguel, assinatura...)"
                : "Despesa variável = gasto pontual do mês (anúncio extra, freelancer, material...)"}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-name">Descrição *</Label>
              <Input
                id="exp-name"
                placeholder={expenseType === "fixed" ? "Ex: Internet Vivo Fibra, Adobe Creative..." : "Ex: Impulsionamento Instagram, Freelancer..."}
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
                <Label htmlFor="exp-date">{expenseType === "fixed" ? "Início / Vencimento" : "Data"} *</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveExpense}
              disabled={isSavingExpense}
              className={expenseType === "fixed" ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-500 hover:bg-orange-600"}
            >
              {isSavingExpense && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InvoiceTable({ invoices, isLoading, invoiceStatusMap, onUpdateStatus, onDelete, onEdit }: any) {
  return (
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
            [1,2,3,4,5].map((i) => (
              <TableRow key={i}>
                {[32,48,24,20,24,8].map((w, j) => (
                  <TableCell key={j}><Skeleton className={`h-4 w-${w}`} /></TableCell>
                ))}
              </TableRow>
            ))
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhuma transação encontrada.</TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice: any, index: number) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-mono">#{invoice.id.substring(0, 8)}</span>
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
                  <Badge variant={(invoiceStatusMap[invoice.status]?.variant || "outline") as any} className="font-normal">
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
                        <DropdownMenuItem className="gap-2 text-green-600" onClick={() => onUpdateStatus(invoice.id, "PAID")}>
                          <CheckCircle2 className="h-4 w-4" /> Marcar como Pago
                        </DropdownMenuItem>
                      )}
                      {invoice.status === "PAID" && (
                        <DropdownMenuItem className="gap-2 text-orange-600" onClick={() => onUpdateStatus(invoice.id, "PENDING")}>
                          <Clock className="h-4 w-4" /> Marcar como Pendente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2" onClick={() => onEdit(invoice)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(invoice.id)}>
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
  );
}

function ExpenseTable({ expenses, isLoading, onDelete, type }: { expenses: any[]; isLoading: boolean; onDelete: (id: string) => void; type: "fixed" | "variable" }) {
  const accentColor = type === "fixed" ? "text-rose-500" : "text-orange-500";

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Excluir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [1,2,3].map((i) => (
              <TableRow key={i}>
                {[32,24,20,24,8].map((w, j) => (
                  <TableCell key={j}><Skeleton className={`h-4 w-${w}`} /></TableCell>
                ))}
              </TableRow>
            ))
          ) : expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                {type === "fixed"
                  ? 'Nenhuma despesa fixa. Clique em "Adicionar Fixa" para começar.'
                  : 'Nenhuma despesa variável neste mês.'}
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense: any, index: number) => (
              <motion.tr
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium text-sm">
                  <div className="flex items-center gap-2">
                    {type === "fixed"
                      ? <Lock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      : <Shuffle className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                    {expense.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal capitalize text-[10px]">
                    {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label || expense.category}
                  </Badge>
                </TableCell>
                <TableCell className={`font-bold text-sm ${accentColor}`}>{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(expense.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
