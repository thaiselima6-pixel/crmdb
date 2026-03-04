"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import axios from "axios";

interface KanbanBoardProps {
  leads: any[];
  onLeadsChange: (newLeads: any[]) => void;
  onLeadClick: (lead: any) => void;
  stages?: any[];
}

export function KanbanBoard({ leads, onLeadsChange, onLeadClick, stages }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<any>(null);

  const COLUMNS = stages || [
    { id: "NEW", title: "Novo" },
    { id: "CONTACTED", title: "Contatado" },
    { id: "QUALIFIED", title: "Qualificado" },
    { id: "PROPOSAL", title: "Proposta" },
    { id: "NEGOTIATION", title: "Negociação" },
    { id: "WON", title: "Ganhos" },
  ];

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

 function onDragStart(event: DragStartEvent) {
  if (event.active.data.current?.type === "Lead") {
    setActiveLead(event.active.data.current.lead);
  }
}

async function onDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const leadId = active.id as string;
  const newStageId = over.id as string;

  const lead = leads.find((l) => l.id === leadId);
  if (lead && (lead.stageId !== newStageId || lead.status !== newStageId) && COLUMNS.some(c => c.id === newStageId)) {
    const updatedLeads = leads.map((l) =>
      l.id === leadId ? { ...l, stageId: newStageId, status: newStageId } : l
    );
    onLeadsChange(updatedLeads);

    try {
      await axios.patch("/api/leads", { 
        id: leadId, 
        stageId: newStageId,
        status: newStageId 
      });
    } catch (error) {
      console.error("Failed to update lead status", error);
      onLeadsChange(leads);
    }
  }

  setActiveLead(null);
}

function onDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id;
  const overId = over.id;

  if (activeId === overId) return;

  const isActiveALead = active.data.current?.type === "Lead";
  const isOverAColumn = COLUMNS.some((col) => col.id === overId);

  if (isActiveALead && isOverAColumn) {
    // lógica original
  }
 }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[600px]">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            leads={leads.filter((l) => l.status === column.id)}
            onCardClick={onLeadClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: "0.5",
            },
          },
        }),
      }}>
        {activeLead && <KanbanCard lead={activeLead} onClick={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}
