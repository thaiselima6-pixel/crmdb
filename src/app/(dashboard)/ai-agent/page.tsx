"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  MessageSquare, Bot, User, Phone, RefreshCcw, Search, Send, Loader2, AlertCircle, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Chat {
  id: string;
  remoteJid: string;
  name: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unread: number;
}

interface Message {
  id: string;
  key: { remoteJid: string; fromMe: boolean; id: string };
  message: { conversation?: string; extendedTextMessage?: { text: string }; imageMessage?: { caption?: string } };
  messageTimestamp: number;
  pushName?: string;
}

function getMessageText(msg: Message): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    "📎 Mídia"
  );
}

function formatPhone(remoteJid: string): string {
  return remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function AIAgentPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [configError, setConfigError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchChats = useCallback(async () => {
    try {
      setIsLoadingChats(true);
      setConfigError(false);
      const res = await fetch("/api/whatsapp/chats");
      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.includes("não configurada")) setConfigError(true);
        throw new Error(data?.error || "Erro ao buscar conversas");
      }

      const formatted: Chat[] = data
        .filter((c: any) => c.remoteJid && !c.remoteJid.includes("@g.us"))
        .map((c: any) => ({
          id: c.id || c.remoteJid,
          remoteJid: c.remoteJid,
          name: c.pushName || c.name || formatPhone(c.remoteJid),
          lastMessage: c.lastMessage?.message?.conversation || c.lastMessage?.message?.extendedTextMessage?.text || "...",
          lastMessageTime: c.lastMessage?.messageTimestamp ? new Date(c.lastMessage.messageTimestamp * 1000) : null,
          unread: c.unreadCount || 0,
        }))
        .sort((a: Chat, b: Chat) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        });

      setChats(formatted);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível carregar conversas.", variant: "destructive" });
    } finally {
      setIsLoadingChats(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const fetchMessages = useCallback(async (chat: Chat) => {
    try {
      setIsLoadingMsgs(true);
      const res = await fetch(`/api/whatsapp/messages?remoteJid=${encodeURIComponent(chat.remoteJid)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao buscar mensagens");
      const sorted = [...data].sort((a: Message, b: Message) => a.messageTimestamp - b.messageTimestamp);
      setMessages(sorted);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingMsgs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat);
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || !selectedChat || isSending) return;
    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: formatPhone(selectedChat.remoteJid), text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao enviar");
      toast({ title: "Enviado!", description: "Mensagem enviada com sucesso." });
      setTimeout(() => fetchMessages(selectedChat), 1500);
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      setReplyText(text);
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatPhone(c.remoteJid).includes(searchTerm)
  );

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-orange-500" />
            Maya — Inbox WhatsApp
          </h1>
          <p className="text-sm text-slate-500">Conversas em tempo real via Evolution API</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchChats} disabled={isLoadingChats}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoadingChats ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Link href="/integrations">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Integrações
            </Button>
          </Link>
        </div>
      </div>

      {/* Config error banner */}
      {configError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 text-sm shrink-0">
          <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
          <span>Evolution API não configurada. Configure a URL e a chave em <Link href="/integrations" className="underline font-medium">Integrações</Link>.</span>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Lista de conversas */}
        <Card className="col-span-4 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar conversa..."
                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="px-3 pb-3 space-y-1">
              {isLoadingChats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredChats.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-12">Nenhuma conversa encontrada</p>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.remoteJid}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      selectedChat?.remoteJid === chat.remoteJid
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold text-sm truncate flex-1 mr-2">{chat.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {chat.lastMessageTime ? formatTime(chat.lastMessageTime.getTime() / 1000) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 truncate flex-1">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <Badge className="h-4 min-w-4 text-[10px] px-1 bg-orange-500 shrink-0">{chat.unread}</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      <Phone className="inline h-2.5 w-2.5 mr-1" />
                      {formatPhone(chat.remoteJid)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Área de chat */}
        <Card className="col-span-8 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Header do chat */}
              <CardHeader className="border-b py-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedChat.name}</CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {formatPhone(selectedChat.remoteJid)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMessages(selectedChat)}
                    disabled={isLoadingMsgs}
                  >
                    <RefreshCcw className={`h-3 w-3 mr-1 ${isLoadingMsgs ? "animate-spin" : ""}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>

              {/* Mensagens */}
              <ScrollArea className="flex-1 bg-slate-50/30 dark:bg-slate-950/30">
                <div className="p-4 space-y-3">
                  {isLoadingMsgs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-12">Nenhuma mensagem encontrada</p>
                  ) : (
                    messages.map((msg) => {
                      const isFromMe = msg.key.fromMe;
                      const text = getMessageText(msg);
                      return (
                        <div key={msg.key.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isFromMe
                              ? "bg-orange-500 text-white rounded-tr-none"
                              : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800"
                          }`}>
                            {!isFromMe && msg.pushName && (
                              <p className="text-[10px] font-semibold text-orange-500 mb-0.5">{msg.pushName}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{text}</p>
                            <p className={`text-[10px] mt-1 text-right ${isFromMe ? "text-orange-100" : "text-slate-400"}`}>
                              {formatTime(msg.messageTimestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de resposta */}
              <div className="p-3 border-t bg-white dark:bg-slate-950 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !replyText.trim()} className="bg-orange-500 hover:bg-orange-600 shrink-0">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Mensagens enviadas aqui saem diretamente pelo WhatsApp via Evolution API
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-medium">Selecione uma conversa</p>
                <p className="text-sm">As mensagens aparecerão aqui</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
