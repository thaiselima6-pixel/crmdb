"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Building2, Mail, Star } from "lucide-react";
import { calculateLeadScore, getScoreColor } from "@/lib/utils-leads";

interface KanbanCardProps {
  lead: any;
  onClick: (lead: any) => void;
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const score = calculateLeadScore(lead);
  const scoreVariant = getScoreColor(score);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Lead",
      lead,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 h-[120px] min-h-[120px] items-center flex justify-center border-2 border-dashed border-primary rounded-xl mb-3"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
      onClick={() => onClick(lead)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-sm line-clamp-1">{lead.name}</h4>
          <div className="flex flex-col items-end gap-1">
            {lead.value > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                R$ {lead.value.toLocaleString()}
              </Badge>
            )}
            <Badge variant={scoreVariant as any} className="text-[9px] h-4 px-1">
              Score: {score}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1.5">
          {lead.company && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="line-clamp-1">{lead.company}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="line-clamp-1">{lead.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex -space-x-2">
            <div className="h-5 w-5 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {lead.name[0]}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground italic">
            {new Date(lead.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
