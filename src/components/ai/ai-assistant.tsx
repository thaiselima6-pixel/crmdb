"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2, Maximize2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function AIAssistant() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [model, setModel] = useState<"gpt" | "claude">("gpt");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou a Maya, sua assistente IA. Posso analisar seus dados, gerar conteúdos, automatizar tarefas e dar insights sobre seu negócio. Como posso ajudar?" }
  ]);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchInsights = async () => {
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Analise brevemente meu CRM e me dê 3 insights rápidos ou alertas (ex: leads sem contato, faturamento, projetos atrasados). Seja curto e direto em bullet points." }],
          context: { path: window.location.pathname },
          model: "gpt"
        }),
      });
      const data = await response.json();
      const insightList = data.content.split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d\./));
      setInsights(insightList.slice(0, 3));
    } catch (error) {
      console.error("Erro ao buscar insights:", error);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 1) {
      fetchInsights();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {
            path: window.location.pathname,
          },
          model: model
        }),
      });

      if (!response.ok) throw new Error("Falha ao obter resposta da IA");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Erro no chat IA:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, tive um erro ao processar sua solicitação. Tente novamente mais tarde." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary text-primary-foreground z-50"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 shadow-2xl z-[100] transition-all duration-300 flex flex-col border-primary/20 bg-white dark:bg-zinc-950 opacity-100",
      isMinimized ? "h-14" : "h-[600px]"
    )}>
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Maya - Assistente IA</CardTitle>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={() => setModel("gpt")}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                  model === "gpt" ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-muted-foreground/30"
                )}
              >
                GPT-4o
              </button>
              <button 
                onClick={() => setModel("claude")}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                  model === "claude" ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-muted-foreground/30"
                )}
              >
                Claude 3.5
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4">
                {insights.length > 0 && (
                  <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> Insights Rápidos
                      </div>
                      <div className="space-y-1">
                        {insights.map((insight, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            {insight.replace(/^[-\d.]\s*/, '')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                    )}>
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted border rounded-tl-none"
                    )}>
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 mr-auto max-w-[85%]">
                    <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted border p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 border-t bg-white dark:bg-zinc-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex w-full items-center gap-2"
            >
              <Input
                placeholder="Como posso ajudar?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-muted/50 border-none focus-visible:ring-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
