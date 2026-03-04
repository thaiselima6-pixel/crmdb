"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, User, Phone, Mail, MoreVertical, MessageSquare, Zap, Loader2, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ContactsPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [leadsRes, clientsRes] = await Promise.all([
        axios.get("/api/leads"),
        axios.get("/api/clients")
      ]);
      
      const allContacts = [
        ...leadsRes.data.map((l: any) => ({ ...l, type: "LEAD" })),
        ...clientsRes.data.map((c: any) => ({ ...c, type: "CLIENT" }))
      ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setContacts(allContacts);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchMessages = async (contact: any) => {
    if (!contact.phone) return;
    try {
      // Usando o endpoint de webhook maya-assistente para buscar log se existir, 
      // ou criar uma nova rota específica para chat se necessário.
      // Por enquanto, vamos simular ou buscar do aiconversations
      const response = await axios.get(`/api/ai/conversations?phone=${contact.phone}`);
      if (response.data && response.data.length > 0) {
        setMessages(response.data[0].messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
    }
  }, [selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !selectedContact.phone) return;

    try {
      setIsSending(true);
      // Aqui integraria com a API de WhatsApp (Evolution API) ou similar
      await axios.post("/api/ai/chat", {
        phone: selectedContact.phone,
        message: newMessage,
        workspaceId: (session?.user as any).workspaceId
      });
      
      setMessages([...messages, { role: "user", content: newMessage, createdAt: new Date() }]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contatos & Chat</h1>
        <p className="text-muted-foreground">Converse com seus leads e clientes em tempo real.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Contact List */}
        <Card className="w-80 flex flex-col border-none shadow-md overflow-hidden shrink-0">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar contatos..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredContacts.map((contact) => (
                <button
                  key={`${contact.type}-${contact.id}`}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/50 text-left",
                    selectedContact?.id === contact.id && "bg-primary/10 hover:bg-primary/15"
                  )}
                >
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={contact.logo || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm truncate">{contact.name}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase shrink-0",
                        contact.type === "LEAD" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {contact.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{contact.phone || contact.email || "Sem contato"}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-none shadow-md overflow-hidden min-w-0">
          {selectedContact ? (
            <>
              <CardHeader className="py-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedContact.logo || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {selectedContact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedContact.name}</CardTitle>
                      <CardDescription className="text-xs flex items-center gap-2">
                        {selectedContact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedContact.phone}</span>}
                        {selectedContact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedContact.email}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4 bg-muted/20">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                      <MessageSquare className="h-12 w-12 opacity-20" />
                      <p className="text-sm">Nenhuma mensagem encontrada para este contato.</p>
                      <p className="text-[10px]">As conversas via IA e WhatsApp aparecerão aqui.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex flex-col max-w-[80%] gap-1",
                          msg.role === "assistant" ? "items-start" : "items-end ml-auto"
                        )}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-2xl text-sm shadow-sm",
                            msg.role === "assistant" 
                              ? "bg-card border text-card-foreground rounded-tl-none" 
                              : "bg-primary text-primary-foreground rounded-tr-none"
                          )}
                        >
                          {msg.content}
                          {msg.voiceUrl && (
                            <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 rounded-full hover:bg-current/10"
                                onClick={() => {
                                  const audio = new Audio(msg.voiceUrl);
                                  audio.play();
                                }}
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                              <div className="flex-1 h-1.5 bg-current/20 rounded-full overflow-hidden">
                                <div className="h-full bg-current/60 w-1/3" />
                              </div>
                              <Volume2 className="h-3 w-3 opacity-60" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <CardContent className="p-4 border-t shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full border-primary/20 hover:bg-primary/5 text-primary">
                    <Zap className="h-5 w-5" />
                  </Button>
                  <Input 
                    placeholder="Digite sua mensagem..." 
                    className="flex-1 rounded-full bg-muted/50 border-none focus-visible:ring-primary/30"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    disabled={isSending || !newMessage.trim() || !selectedContact.phone}
                    className="rounded-full px-6 shadow-lg shadow-primary/20"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Sua Central de Atendimento</p>
                <p className="text-sm">Selecione um contato ao lado para iniciar uma conversa.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
