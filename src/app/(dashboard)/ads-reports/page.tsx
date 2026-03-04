"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Target, DollarSign, Facebook, Instagram, Search, Download, RefreshCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdsReportsPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Ads</h1>
          <p className="text-muted-foreground">Analise o desempenho das suas campanhas de Google e Meta Ads.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
            }, 1500);
          }}>
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Atualizar Dados
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Investimento Total</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> R$ 12.450,00
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% em relação ao mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Impressões</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-blue-600">
              <BarChart3 className="h-5 w-5" /> 450.230
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +8.4%
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Cliques</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-amber-600">
              <Target className="h-5 w-5" /> 12.840
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +15.2%
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-green-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">Leads Gerados</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600">
              <Search className="h-5 w-5" /> 184
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +5.6%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meta" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-muted/50 p-1 w-[400px]">
          <TabsTrigger value="meta" className="gap-2">
            <Facebook className="h-4 w-4" /> Meta Ads
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <Search className="h-4 w-4" /> Google Ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="flex-1 pt-6 overflow-auto">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 border-2 border-dashed rounded-3xl bg-muted/20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Facebook className="h-10 w-10 opacity-20" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">Conecte sua conta Meta Ads</p>
              <p className="text-sm max-w-sm mx-auto">Para gerar relatórios automáticos, conecte seu Business Manager nas configurações.</p>
              <Link href="/settings">
                <Button variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/5 gap-2">
                  <ExternalLink className="h-4 w-4" /> Configurar Integração
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="google" className="flex-1 pt-6 overflow-auto">
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 border-2 border-dashed rounded-3xl bg-muted/20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="h-10 w-10 opacity-20" />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">Conecte sua conta Google Ads</p>
              <p className="text-sm max-w-sm mx-auto">Para gerar relatórios automáticos, conecte seu Google Ads nas configurações.</p>
              <Link href="/settings">
                <Button variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/5 gap-2">
                  <ExternalLink className="h-4 w-4" /> Configurar Integração
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
