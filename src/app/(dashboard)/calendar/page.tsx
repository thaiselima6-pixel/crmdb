"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2 } from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { TaskDialog } from "@/components/projects/task-dialog";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "border-slate-400 bg-slate-100 text-slate-700",
  MEDIUM: "border-amber-400 bg-amber-100 text-amber-700",
  HIGH: "border-rose-500 bg-rose-100 text-rose-700",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    priority: "MEDIUM",
    clientId: "",
  });
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/calendar/events");
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get("/api/clients");
      setClients(res.data?.clients || res.data || []);
    } catch {
      // clients are optional
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, [currentDate]);

  const handleEventClick = (event: any) => {
    if (event.type === "TASK") {
      setSelectedTask(event.originalData);
      setIsTaskDialogOpen(true);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/calendar/events/${id}`);
      toast({ title: "Evento removido" });
      fetchEvents();
    } catch {
      toast({ title: "Erro ao remover evento", variant: "destructive" });
    }
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast({ title: "Título e data são obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      setIsSavingEvent(true);
      await axios.post("/api/calendar/events", {
        ...newEvent,
        clientId: newEvent.clientId || null,
      });
      toast({ title: "Evento criado!" });
      setEventDialogOpen(false);
      setNewEvent({ title: "", date: new Date().toISOString().split("T")[0], description: "", priority: "MEDIUM", clientId: "" });
      fetchEvents();
    } catch {
      toast({ title: "Erro ao criar evento", variant: "destructive" });
    } finally {
      setIsSavingEvent(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">Acompanhe prazos e compromissos da agência.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-none border-r">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 font-bold min-w-[150px] text-center capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-none border-l">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEventDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Evento
          </Button>
          <ProjectDialog onSuccess={fetchEvents} />
        </div>
      </div>

      <Card className="flex-1 border-none shadow-md overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter((event) => isSameDay(new Date(event.date), day));

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r last:border-r-0 relative transition-colors hover:bg-muted/30",
                  !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                  isToday && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full mb-1",
                  isToday && "bg-primary text-primary-foreground font-bold shadow-md"
                )}>
                  {format(day, "d")}
                </span>

                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  <AnimatePresence>
                    {dayEvents.map((event, idx) => (
                      <motion.div
                        key={`${event.id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "group text-[10px] p-1 rounded border-l-2 truncate leading-tight cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-between gap-1",
                          event.type === "PROJECT" ? "bg-purple-100 text-purple-700 border-purple-500" :
                          event.type === "TASK" ? "bg-blue-100 text-blue-700 border-blue-500" :
                          event.priority ? PRIORITY_COLORS[event.priority] ?? "bg-emerald-100 text-emerald-700 border-emerald-500" :
                          "bg-emerald-100 text-emerald-700 border-emerald-500"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <span className="truncate">{event.title}</span>
                        {event.type === "EVENT" && (
                          <button
                            className="opacity-0 group-hover:opacity-100 shrink-0 hover:text-rose-600 transition-opacity"
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-200 border-l-2 border-purple-500" /> Projeto</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-200 border-l-2 border-blue-500" /> Tarefa</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-100 border-l-2 border-amber-400" /> Evento (média)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-100 border-l-2 border-rose-500" /> Evento (alta)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-100 border-l-2 border-slate-400" /> Evento (baixa)</div>
      </div>

      {selectedTask && (
        <TaskDialog
          projectId={selectedTask.projectId}
          task={selectedTask}
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSuccess={fetchEvents}
        />
      )}

      {/* New Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ev-title">Título *</Label>
              <Input
                id="ev-title"
                placeholder="Ex: Reunião com cliente, Apresentação..."
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ev-date">Data *</Label>
                <Input
                  id="ev-date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={newEvent.priority} onValueChange={(v) => setNewEvent({ ...newEvent, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select value={newEvent.clientId} onValueChange={(v) => setNewEvent({ ...newEvent, clientId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-desc">Descrição (opcional)</Label>
              <Textarea
                id="ev-desc"
                placeholder="Detalhes do evento..."
                className="resize-none min-h-[80px]"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvent} disabled={isSavingEvent}>
              {isSavingEvent && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
