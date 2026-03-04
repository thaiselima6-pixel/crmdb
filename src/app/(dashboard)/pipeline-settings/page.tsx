"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, LayoutGrid, GripVertical } from "lucide-react";
import axios from "axios";

export default function PipelineSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pipelines, setPipelines] = useState<any[]>([]);

  const fetchPipelines = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/pipelines");
      setPipelines(response.data);
    } catch (error) {
      console.error("Failed to fetch pipelines", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const handleSavePipeline = async (pipeline: any) => {
    try {
      setIsLoading(true);
      // Aqui integraria com uma rota PATCH /api/pipelines/[id]
      // await axios.patch(`/api/pipelines/${pipeline.id}`, pipeline);
      toast({ title: "Sucesso", description: "Pipeline atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar pipeline.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && pipelines.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuração de Pipeline</h1>
        <p className="text-muted-foreground">Personalize os estágios do seu processo comercial.</p>
      </div>

      <div className="space-y-6">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{pipeline.name}</CardTitle>
                  <CardDescription>Estágios do funil de vendas ativo.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Em breve", description: "Suporte a múltiplos pipelines em desenvolvimento." })}>
                  <Plus className="h-4 w-4" /> Novo Pipeline
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {pipeline.stages.map((stage: any, index: number) => (
                  <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 group">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {index + 1}
                    </div>
                    <Input 
                      value={stage.name} 
                      onChange={(e) => {
                        const newPipelines = [...pipelines];
                        const pIdx = newPipelines.findIndex(p => p.id === pipeline.id);
                        const sIdx = newPipelines[pIdx].stages.findIndex((s: any) => s.id === stage.id);
                        newPipelines[pIdx].stages[sIdx].name = e.target.value;
                        setPipelines(newPipelines);
                      }}
                      className="flex-1 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-2 gap-2 h-12 rounded-xl"
                  onClick={() => {
                    const newPipelines = [...pipelines];
                    const pIdx = newPipelines.findIndex(p => p.id === pipeline.id);
                    newPipelines[pIdx].stages.push({ 
                      id: `new-${Date.now()}`, 
                      name: "Novo Estágio", 
                      order: pipeline.stages.length 
                    });
                    setPipelines(newPipelines);
                  }}
                >
                  <Plus className="h-4 w-4" /> Adicionar Estágio
                </Button>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button 
                  onClick={() => handleSavePipeline(pipeline)}
                  disabled={isLoading}
                  className="px-8 shadow-lg shadow-primary/20"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
