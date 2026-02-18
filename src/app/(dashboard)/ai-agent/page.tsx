"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  MessageSquare, 
  Bot, 
  User, 
  Phone, 
  Calendar, 
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCcw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function AIAgentPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setConversations([
        {
          id: "1",
          phone: "5511999999999",
          name: "João Silva",
          lastMessage: "Quanto custa o plano de social media?",
          time: new Date(),
          status: "ASSISTING",
          messages: [
            { role: "user", content: "Olá, gostaria de saber mais sobre os serviços.", time: new Date(Date.now() - 3600000) },
            { role: "assistant", content: "Olá João! Sou a Maya, assistente virtual da agência. Temos Social Media, Tráfego Pago e SEO. Qual te interessa mais?", time: new Date(Date.now() - 3500000) },
            { role: "user", content: "Quanto custa o plano de social media?", time: new Date() }
          ]
        },
        {
          id: "2",
          phone: "5511888888888",
          name: "Maria Souza",
          lastMessage: "Obrigada, vou pensar.",
          time: new Date(Date.now() - 86400000),
          status: "FINISHED",
          messages: []
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 h-[calc(100vh-100px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            Maya - Assistente Virtual
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Monitore e gerencie as conversas da sua assistente virtual via n8n.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchConversations}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { window.location.href = "/settings"; }}>
            Configurar Assistente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Lista de Conversas */}
        <Card className="col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 pt-0 space-y-2">
              {filteredConversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedChat?.id === chat.id 
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm truncate">{chat.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {format(chat.time, "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mb-2">
                    {chat.phone}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">
                      {chat.lastMessage}
                    </p>
                    <Badge variant={chat.status === "ASSISTING" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                      {chat.status === "ASSISTING" ? "Ativa" : "Finalizada"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Selecionado */}
        <Card className="col-span-8 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              <CardHeader className="border-b py-3 flex flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedChat.name}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedChat.phone}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${selectedChat.phone}`, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no WhatsApp
                  </Button>
                  <Button variant="destructive" size="sm">
                    Pausar ANA
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4 bg-slate-50/30 dark:bg-slate-950/30">
                <div className="space-y-4">
                  {selectedChat.messages.map((msg: any, idx: number) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800'
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                          {format(msg.time, "HH:mm")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-white dark:bg-slate-950">
                <div className="flex gap-2">
                  <Input placeholder="Digite para assumir o chat..." className="flex-1" />
                  <Button>Enviar</Button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> 
                  ANA está ativa neste chat. Se você enviar uma mensagem, ela será pausada automaticamente.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-slate-300" />
              </div>
              <p>Selecione uma conversa para visualizar os logs da ANA.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
