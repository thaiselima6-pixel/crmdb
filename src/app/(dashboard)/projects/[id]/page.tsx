"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  FileText, 
  MoreVertical,
  Paperclip,
  Trash2,
  CheckCircle,
  BookOpen,
  Sparkles,
  Loader2,
  Save
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { TaskDialog } from "@/components/projects/task-dialog";
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog";
import { Textarea } from "@/components/ui/textarea";

const projectStatusMap: any = {
  PLANNING: { label: "Planejamento", variant: "secondary" },
  IN_PROGRESS: { label: "Em Andamento", variant: "default" },
  ON_HOLD: { label: "Em Espera", variant: "outline" },
  COMPLETED: { label: "Concluído", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSyllabus, setIsSavingSyllabus] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [syllabus, setSyllabus] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`/api/projects/${id}`),
        axios.get(`/api/projects/${id}/tasks`)
      ]);
      setProject(projectRes.data);
      setSyllabus(projectRes.data.syllabus || "");
      setTasks(tasksRes.data);
    } catch (error) {
      console.error("Failed to fetch project details", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do projeto.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
      await axios.patch(`/api/projects/${id}/tasks`, { id: taskId, status: newStatus });
      fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`/api/projects/${id}/tasks`, { data: { id: taskId } });
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso."
      });
      fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive"
      });
    }
  };

  const saveSyllabus = async () => {
    try {
      setIsSavingSyllabus(true);
      await axios.patch(`/api/projects/${id}`, { syllabus });
      toast({
        title: "Sucesso",
        description: "Conteúdo programático salvo com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o conteúdo programático.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSyllabus(false);
    }
  };

  const distributeEvents = async () => {
    try {
      setIsDistributing(true);
      await axios.post(`/api/projects/${id}/distribute-syllabus`, { syllabus });
      toast({
        title: "Sucesso",
        description: "Eventos distribuídos no calendário com sucesso!"
      });
      fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível distribuir os eventos.",
        variant: "destructive"
      });
    } finally {
      setIsDistributing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-40 col-span-2" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) return null;

  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={projectStatusMap[project.status]?.variant || "outline"}>
                {projectStatusMap[project.status]?.label || project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Cliente: {project.client?.name}</p>
          </div>
          <div className="flex gap-2">
            {/* Editar Projeto */}
            <ProjectEditDialog 
              project={project} 
              onSuccess={fetchProjectDetails}
              trigger={<Button variant="outline">Editar Projeto</Button>}
            />
            {/* Nova Tarefa */}
            <TaskDialog projectId={id} onSuccess={fetchProjectDetails} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-md">
            <CardHeader>
              <CardTitle>Sobre o Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {project.description || "Sem descrição fornecida para este projeto."}
              </p>
              
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Data de Início</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {project.startDate ? format(new Date(project.startDate), "PPP", { locale: ptBR }) : "Não definida"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Prazo Final</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {project.endDate ? format(new Date(project.endDate), "PPP", { locale: ptBR }) : "Não definido"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progresso Geral</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Orçamento</span>
                    <span className="font-bold text-lg">
                      {project.budget ? project.budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tarefas Concluídas</span>
                    <span className="font-bold">{completedTasks} / {tasks.length}</span>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="tasks" className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="syllabus" className="gap-2">
              <BookOpen className="h-4 w-4" /> Conteúdo Programático
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <Paperclip className="h-4 w-4" /> Arquivos
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" /> Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="pt-4">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lista de Tarefas</CardTitle>
                  <CardDescription>Gerencie as entregas deste projeto.</CardDescription>
                </div>
                <TaskDialog projectId={id} onSuccess={fetchProjectDetails} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground italic">Nenhuma tarefa criada.</p>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => handleEditTask(task)}
                      >
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8 shrink-0",
                            task.status === "COMPLETED" ? "text-primary" : "text-muted-foreground"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id, task.status);
                          }}
                        >
                          {task.status === "COMPLETED" ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2" />}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            task.status === "COMPLETED" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prazo: {format(new Date(task.dueDate), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="syllabus" className="pt-4">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Conteúdo Programático</CardTitle>
                  <CardDescription>Insira o cronograma ou conteúdo para distribuição automática.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={saveSyllabus}
                    disabled={isSavingSyllabus}
                    className="gap-2"
                  >
                    {isSavingSyllabus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={distributeEvents}
                    disabled={isDistributing || !syllabus}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
                  >
                    {isDistributing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Distribuir com IA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4" /> Dica da IA
                  </p>
                  Cole aqui o conteúdo programático, cronograma de aulas ou tópicos do projeto. Nossa IA irá analisar as datas e temas para criar automaticamente as tarefas no calendário com lembretes.
                </div>
                <Textarea 
                  placeholder="Ex: 
Aula 1 - 15/02: Introdução ao Marketing Digital
Aula 2 - 22/02: Gestão de Redes Sociais
..."
                  className="min-h-[300px] font-mono text-sm resize-none"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="pt-4">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Arquivos e Anexos</CardTitle>
                  <CardDescription>Upload de documentos e materiais do projeto.</CardDescription>
                </div>
                {/* @ts-ignore */}
                <UploadButton<OurFileRouter, "projectAttachment">
                  endpoint="projectAttachment"
                  onClientUploadComplete={(res) => {
                    toast({ title: "Upload concluído", description: `${res.length} arquivo(s) enviado(s).` });
                    fetchProjectDetails();
                  }}
                  onUploadError={(error: Error) => {
                    toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
                  }}
                  className="ut-button:bg-primary ut-button:ut-readying:bg-primary/50"
                />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Mock de arquivos para visualização */}
                  <div className="p-4 rounded-xl border bg-card hover:shadow-md transition-all group relative">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-bold text-sm truncate">Contrato_Projeto.pdf</p>
                    <p className="text-[10px] text-muted-foreground">1.2 MB • PDF</p>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="pt-4">
            <Card className="border-none shadow-md h-[400px] flex items-center justify-center text-muted-foreground italic">
              Espaço para anotações rápidas e brainstorm em breve.
            </Card>
          </TabsContent>
        </Tabs>

        {selectedTask && (
          <TaskDialog
            projectId={id}
            task={selectedTask}
            open={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            onSuccess={fetchProjectDetails}
          />
        )}
      </div>
    );
  }
