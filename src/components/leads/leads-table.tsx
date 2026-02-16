"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Phone, Building2, Star } from "lucide-react";
import { calculateLeadScore, getScoreColor } from "@/lib/utils-leads";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LeadsTableProps {
  leads: any[];
  onLeadClick: (lead: any) => void;
}

const statusMap: any = {
  NEW: { label: "Novo", variant: "default" },
  CONTACTED: { label: "Contatado", variant: "secondary" },
  QUALIFIED: { label: "Qualificado", variant: "success" },
  PROPOSAL: { label: "Proposta", variant: "warning" },
  NEGOTIATION: { label: "Negociação", variant: "primary" },
};

export function LeadsTable({ leads, onLeadClick }: LeadsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                Nenhum lead encontrado.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const score = calculateLeadScore(lead);
              const scoreVariant = getScoreColor(score);
              
              return (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => onLeadClick(lead)}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[lead.status]?.variant || "outline"}>
                      {statusMap[lead.status]?.label || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scoreVariant as any} className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {score}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {lead.company || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.value > 0 ? `R$ ${lead.value.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onLeadClick(lead)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Arquivar Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
