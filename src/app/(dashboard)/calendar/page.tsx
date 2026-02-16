"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Briefcase, CheckCircle2 } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { TaskDialog } from "@/components/projects/task-dialog";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

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

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const handleEventClick = (event: any) => {
    if (event.type === "TASK") {
      setSelectedTask(event.originalData);
      setIsTaskDialogOpen(true);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground">Acompanhe prazos e compromissos da agência.</p>
          </div>
          <div className="flex items-center gap-4">
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
            {calendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const dayEvents = events.filter(event => isSameDay(new Date(event.date), day));

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
                    {dayEvents.map((event, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "text-[10px] p-1 rounded border-l-2 truncate leading-tight cursor-pointer hover:opacity-80 transition-opacity",
                          event.type === "PROJECT" ? "bg-purple-100 text-purple-700 border-purple-500" :
                          event.type === "TASK" ? "bg-blue-100 text-blue-700 border-blue-500" :
                          "bg-amber-100 text-amber-700 border-amber-500"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
      </Card>

      {selectedTask && (
        <TaskDialog
          projectId={selectedTask.projectId}
          task={selectedTask}
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSuccess={fetchEvents}
        />
      )}
    </div>
  );
}
