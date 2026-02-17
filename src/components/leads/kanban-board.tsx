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

const COLUMNS = [
  { id: "NEW", title: "Novo" },
  { id: "CONTACTED", title: "Contatado" },
  { id: "QUALIFIED", title: "Qualificado" },
  { id: "PROPOSAL", title: "Proposta" },
  { id: "NEGOTIATION", title: "Negociação" },
];

interface KanbanBoardProps {
  leads: any[];
  onLeadsChange: (newLeads: any[]) => void;
  onLeadClick: (lead: any) => void;
}

export function KanbanBoard({ leads, onLeadsChange, onLeadClick }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<any>(null);

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

  function onDragStart(event: DragStart) {
    if (event.active.data.current?.type === "Lead") {
      setActiveLead(event.active.data.current.lead);
    }
  }

  async function onDragEnd(event: DragEnd) {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status !== newStatus && COLUMNS.some(c => c.id === newStatus)) {
      // Update local state first (optimistic update)
      const updatedLeads = leads.map((l) =>
        l.id === leadId ? { ...l, status: newStatus } : l
      );
      onLeadsChange(updatedLeads);

      // Update database
      try {
        await axios.patch("/api/leads", { id: leadId, status: newStatus });
      } catch (error) {
        console.error("Failed to update lead status", error);
        // Rollback on error
        onLeadsChange(leads);
      }
    }

    setActiveLead(null);
  }

  function onDragOver(event: DragOver) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.type === "Lead";
    const isOverAColumn = COLUMNS.some((col) => col.id === overId);

    if (isActiveALead && isOverAColumn) {
      // Logic handled in onDragEnd for simplicity in this CRM
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
