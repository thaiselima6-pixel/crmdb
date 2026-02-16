"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Users, 
  Layers, 
  Briefcase, 
  FileText, 
  Search,
  Plus
} from "lucide-react";
import axios from "axios";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any>({
    leads: [],
    clients: [],
    projects: [],
    proposals: []
  });
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults({ leads: [], clients: [], projects: [], proposals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error("Search failed", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setQuery(""); // Limpar a busca ao selecionar
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border rounded-md transition-all w-full max-w-[300px]"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Busque por clientes, leads, projetos..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {results.leads.length > 0 && (
            <CommandGroup heading="Leads">
              {results.leads.map((lead: any) => (
                <CommandItem
                  key={lead.id}
                  onSelect={() => runCommand(() => router.push(`/funnel`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{lead.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {lead.status} • R$ {Number(lead.value || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.clients.length > 0 && (
            <CommandGroup heading="Clientes">
              {results.clients.map((client: any) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => runCommand(() => router.push(`/clients/${client.id}`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {client.status} • MRR: R$ {Number(client.mrr || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.projects.length > 0 && (
            <CommandGroup heading="Projetos">
              {results.projects.map((project: any) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {project.status} • Budget: R$ {Number(project.budget || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.proposals.length > 0 && (
            <CommandGroup heading="Propostas">
              {results.proposals.map((proposal: any) => (
                <CommandItem
                  key={proposal.id}
                  onSelect={() => runCommand(() => router.push(`/proposals`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{proposal.title} - {proposal.clientName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {proposal.status} • R$ {Number(proposal.value || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => runCommand(() => router.push("/leads/new"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Novo Lead</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/proposals"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Nova Proposta</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
