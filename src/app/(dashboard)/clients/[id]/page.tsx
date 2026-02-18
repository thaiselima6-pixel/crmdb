"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  ExternalLink,
  Edit,
  Download
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ClientDialog } from "@/components/clients/client-dialog";

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchClientDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/clients/${id}`);
      setClient(response.data);
    } catch (error) {
      console.error("Failed to fetch client details", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do cliente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <Badge variant={client.status === "ACTIVE" ? "success" : "secondary"}>
              {client.status === "ACTIVE" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{client.company || "Pessoa Física"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" /> Editar Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span>{client.email || "Sem email"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <span>{client.phone || "Sem telefone"}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 gap-2"
              onClick={() => {
                toast({
                  title: "Relatório Completo",
                  description: "Gerando relatório detalhado do cliente...",
                });
              }}
            >
              <Download className="h-3 w-3" /> Relatório Completo
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold">MRR: {Number(client.mrr).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Vencimento mensal:{" "}
                {client.billingDay ? `${client.billingDay} de cada mês` : "não definido"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Cliente desde{" "}
                {client.startDate
                  ? format(new Date(client.startDate), "dd/MM/yyyy", { locale: ptBR })
                  : format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Atividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>{client.projects?.length || 0} Projetos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span>{client.invoices?.length || 0} Faturas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="projects" className="gap-2">
            <Briefcase className="h-4 w-4" /> Projetos
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" /> Faturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="pt-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Projetos Associados</CardTitle>
            </CardHeader>
            <CardContent>
              {client.projects?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground italic">Nenhum projeto encontrado.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {client.projects?.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors flex justify-between items-center group">
                        <div>
                          <p className="font-bold group-hover:text-primary transition-colors">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.status}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="pt-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Histórico Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              {client.invoices?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground italic">Nenhuma fatura encontrada.</p>
              ) : (
                <div className="space-y-2">
                  {client.invoices?.map((invoice: any) => (
                    <div key={invoice.id} className="p-4 rounded-lg border flex justify-between items-center">
                      <div>
                        <p className="font-bold">{Number(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {format(new Date(invoice.dueDate), "dd/MM/yyyy")}</p>
                      </div>
                      <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        client={client}
        onSuccess={fetchClientDetails}
      />
    </div>
  );
}
