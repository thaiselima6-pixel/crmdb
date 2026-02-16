"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Building2,
  MoreVertical,
  ExternalLink,
  Globe,
  Edit,
  Trash2,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientDialog } from "@/components/clients/client-dialog";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/clients");
      setClients(response.data);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-purple-500", "bg-pink-500", 
      "bg-indigo-500", "bg-teal-500", "bg-orange-500", 
      "bg-emerald-500", "bg-rose-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes e contatos.</p>
        </div>
        <ClientDialog onSuccess={fetchClients} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome, email ou empresa..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {searchQuery ? "Tente mudar sua busca." : "Sua base de clientes está vazia. Adicione seu primeiro cliente para começar."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="group hover:shadow-xl transition-all duration-500 border-none shadow-md overflow-hidden flex flex-col bg-white">
              {/* Top Color Bar */}
              <div className={`h-2 w-full ${getClientColor(client.name)}`} />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={`h-14 w-14 rounded-2xl ${getClientColor(client.name)} flex items-center justify-center text-white font-bold text-2xl shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                    {client.logo ? (
                      <img src={client.logo} alt={client.name} className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-black/10" />
                        <span className="relative z-10">{client.name[0].toUpperCase()}</span>
                      </>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/clients/${client.id}`}>
                        <DropdownMenuItem className="gap-2">
                          <User className="h-4 w-4" /> Ver Perfil
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        className="gap-2" 
                        onSelect={() => {
                          setSelectedClient(client);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                  {client.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {client.company || "Pessoa Física"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.email || "Sem email"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{client.phone || "Sem telefone"}</span>
                  </div>
                  {client.website && (
                    <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{client.website}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t flex items-center justify-between gap-2">
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Projetos</span>
                    <span className="font-semibold">{client._count?.projects || 0} ativos</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        Perfil <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        client={selectedClient}
        onSuccess={fetchClients}
      />
    </div>
  );
}
