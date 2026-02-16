"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: any[];
  onCardClick: (lead: any) => void;
}

export function KanbanColumn({ id, title, leads, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col bg-muted/30 rounded-xl p-3 w-[300px] min-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {title}
          <span className="text-xs bg-background border px-1.5 py-0.5 rounded-full text-muted-foreground font-normal">
            {leads.length}
          </span>
        </h3>
      </div>

      <div ref={setNodeRef} className="flex-1">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
