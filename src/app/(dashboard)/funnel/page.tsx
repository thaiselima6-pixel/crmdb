"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors
} from "@dnd-kit/core";
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Mail, Phone, Building2, DollarSign, MessageSquare, Loader2 } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const STAGES = [
  { id: "NEW", title: "Novos Leads", color: "bg-blue-500" },
  { id: "CONTACTED", title: "Contatados", color: "bg-purple-500" },
  { id: "QUALIFIED", title: "Qualificados", color: "bg-indigo-500" },
  { id: "PROPOSAL", title: "Proposta", color: "bg-amber-500" },
  { id: "NEGOTIATION", title: "Negociação", color: "bg-orange-500" },
  { id: "WON", title: "Ganhos", color: "bg-emerald-500" },
];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  value: number;
  status: string;
}

export default function FunnelPage() {
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/funnel");
      const leadsByStatus = response.data.leadsByStatus || [];
      
      const groupedLeads: Record<string, Lead[]> = {};
      STAGES.forEach(stage => {
        groupedLeads[stage.id] = leadsByStatus.filter((l: any) => l.status === stage.id);
      });
      
      setLeads(groupedLeads);
    } catch (error) {
      console.error("Failed to fetch funnel data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await axios.patch("/api/leads", { id: leadId, status: newStatus });
      toast({
        title: "Status atualizado",
        description: `Lead movido para ${STAGES.find(s => s.id === newStatus)?.title}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível mudar o status do lead.",
        variant: "destructive",
      });
      fetchFunnelData(); // Rollback
    }
  };

  const onDragStart = (event: DragStartEvent) => {
  setActiveId(event.active.id as string);
};

const onDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  const activeContainer = active.data.current?.sortable.containerId || findContainer(activeId);
  const overContainer = over.data.current?.sortable.containerId || findContainer(overId);

  if (!activeContainer || !overContainer || activeContainer === overContainer) return;

  setLeads((prev) => {
    const activeItems = prev[activeContainer];
    const overItems = prev[overContainer];

    const activeIndex = activeItems.findIndex((item) => item.id === activeId);
    const overIndex = overItems.findIndex((item) => item.id === overId);

    let newIndex;
    if (overId in prev) {
      newIndex = overItems.length + 1;
    } else {
      const isBelowLastItem = over && overIndex === overItems.length - 1;
      const modifier = isBelowLastItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
    }

    return {
      ...prev,
      [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
      [overContainer]: [
        ...prev[overContainer].slice(0, newIndex),
        prev[activeContainer][activeIndex],
        ...prev[overContainer].slice(newIndex, prev[overContainer].length)
      ]
    };
  });
};

const onDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  const activeContainer = findContainer(activeId);
  const overContainer = findContainer(overId);

  if (!activeContainer || !overContainer || activeContainer !== overContainer) {
    if (activeContainer && overContainer) {
      updateLeadStatus(activeId, overContainer);
    }
  }

  setActiveId(null);
};

  const findContainer = (id: string) => {
    if (id in leads) return id;
    return Object.keys(leads).find((key) => leads[key].find((item) => item.id === id));
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="min-w-[300px] space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const calculateColumnTotal = (stageId: string) => {
    return leads[stageId]?.reduce((acc, lead) => acc + Number(lead.value || 0), 0) || 0;
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h1>
        <p className="text-muted-foreground">Gerencie seus leads e oportunidades de forma visual.</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-muted">
          {STAGES.map((stage) => (
            <div key={stage.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage.title}</h3>
                  <Badge variant="secondary" className="ml-2 font-bold">
                    {leads[stage.id]?.length || 0}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-muted-foreground">
                  R$ {calculateColumnTotal(stage.id).toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 flex-1 flex flex-col gap-3 min-h-[150px] border-2 border-dashed border-transparent hover:border-muted-foreground/20 transition-colors">
                <SortableContext
                  id={stage.id}
                  items={leads[stage.id]?.map(l => l.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {leads[stage.id]?.map((lead) => (
                    <SortableItem key={lead.id} lead={lead} />
                  ))}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <LeadCard 
              lead={Object.values(leads).flat().find(l => l.id === activeId)!} 
              isOverlay 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableItem({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) {
      toast({
        title: "Telefone não cadastrado",
        description: "Adicione um telefone ao lead para enviar follow-up.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const response = await axios.post(`/api/leads/${lead.id}/follow-up`);
      const { message, phone } = response.data;

      const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Follow-up gerado!",
        description: "Mensagem enviada para o WhatsApp.",
      });
    } catch (error) {
      console.error("Follow-up error", error);
      toast({
        title: "Erro ao gerar follow-up",
        description: "Não foi possível conectar com a IA agora.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={cn(
      "border-none shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
      isOverlay && "shadow-xl border-2 border-primary rotate-2"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
              {lead.name}
            </h4>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs mt-0.5">
              R$ {Number(lead.value || 0).toLocaleString('pt-BR')}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={handleFollowUp}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </Button>
        </div>

        {lead.company && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {lead.phone && (
            <div className="p-1 rounded bg-muted text-[10px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" /> Contato
            </div>
          )}
          {lead.email && (
            <div className="p-1 rounded bg-muted text-[10px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-2.5 w-2.5" /> Email
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
