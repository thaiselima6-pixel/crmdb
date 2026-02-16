"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Search, Filter, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadDialog } from "@/components/leads/lead-dialog";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/leads");
      setLeads(response.data);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(lead.status);
    
    return matchesSearch && matchesStatus;
  });

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsDialogOpen(true);
  };

  const handleCreateLead = () => {
    setSelectedLead(null);
    setIsDialogOpen(true);
  };

  const exportLeadsToCSV = () => {
    const headers = ["Nome", "Empresa", "Email", "Telefone", "Status", "Valor", "Fonte", "Data de Cadastro"];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.company || "",
      lead.email || "",
      lead.phone || "",
      lead.status,
      lead.value || 0,
      lead.source || "",
      new Date(lead.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 flex-1 overflow-hidden flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header local */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Leads</h1>
            <p className="text-muted-foreground">Acompanhe e converta seus leads em clientes.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={exportLeadsToCSV}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button onClick={handleCreateLead} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Novo Lead
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shrink-0">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads por nome, empresa ou email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", statusFilters.length > 0 && "border-primary text-primary")}>
                  <Filter className="h-4 w-4" /> 
                  Filtros
                  {statusFilters.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px]">
                      {statusFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Status do Lead</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  >
                    {status === "NEW" && "Novo"}
                    {status === "CONTACTED" && "Contatado"}
                    {status === "QUALIFIED" && "Qualificado"}
                    {status === "PROPOSAL" && "Proposta"}
                    {status === "NEGOTIATION" && "Negociação"}
                    {status === "WON" && "Ganhamos"}
                    {status === "LOST" && "Perdemos"}
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      onCheckedChange={() => setStatusFilters([])}
                      className="text-destructive focus:text-destructive"
                    >
                      Limpar Filtros
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* View Toggle & Content */}
        <Tabs defaultValue="kanban" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" /> Tabela
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{filteredLeads.length}</span> leads
            </div>
          </div>

          <TabsContent value="kanban" className="flex-1 overflow-x-auto overflow-y-hidden outline-none">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-full w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <KanbanBoard 
                leads={filteredLeads} 
                onLeadsChange={setLeads} 
                onLeadClick={handleEditLead}
              />
            )}
          </TabsContent>

          <TabsContent value="table" className="flex-1 overflow-auto outline-none">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <LeadsTable leads={filteredLeads} onLeadClick={handleEditLead} />
            )}
          </TabsContent>
        </Tabs>

      <LeadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchLeads}
        lead={selectedLead}
      />
    </div>
  );
}
