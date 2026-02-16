"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Calendar,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDialog } from "@/components/projects/project-dialog";

const projectStatusMap: any = {
  PLANNING: { label: "Planejamento", variant: "secondary" },
  IN_PROGRESS: { label: "Em Andamento", variant: "default" },
  ON_HOLD: { label: "Em Espera", variant: "outline" },
  COMPLETED: { label: "Concluído", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe o progresso dos seus projetos.</p>
        </div>
        <ProjectDialog onSuccess={fetchProjects} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar projetos ou clientes..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {searchQuery ? "Tente mudar sua busca ou filtro." : "Comece criando seu primeiro projeto para a agência."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 border-none shadow-md overflow-hidden flex flex-col h-full">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <Badge variant={projectStatusMap[project.status]?.variant || "outline"}>
                      {projectStatusMap[project.status]?.label || project.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    Cliente: {project.client?.name || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Início: {format(new Date(project.startDate), "dd 'de' MMM", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Progresso</span>
                        <span className="text-muted-foreground">65%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[65%] rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between pt-4 border-t">
                    <div className="flex -space-x-2">
                      {[1, 2].map(i => (
                        <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                          {i === 1 ? "JD" : "AM"}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-xs font-medium text-primary">
                      Ver detalhes <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
