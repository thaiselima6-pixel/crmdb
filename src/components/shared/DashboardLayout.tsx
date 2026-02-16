"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  FileText,
  Settings, 
  LogOut,
  Bot
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { GlobalSearch } from "./GlobalSearch";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Funil de Vendas", href: "/funnel", icon: Layers },
    { label: "Clientes", href: "/clients", icon: Users },
    { label: "Propostas", href: "/proposals", icon: FileText },
    { label: "Projetos", href: "/projects", icon: Briefcase },
    { label: "Calendário", href: "/calendar", icon: Calendar },
    { label: "Financeiro", href: "/finance", icon: DollarSign },
    { label: "Maya Assistente", href: "/ai-agent", icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            CRM Agência
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start gap-2 transition-all duration-200",
                    isActive ? "bg-accent text-accent-foreground font-medium shadow-sm" : "hover:bg-accent/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link href="/settings">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-2 transition-all duration-200",
                pathname === "/settings" ? "bg-accent text-accent-foreground font-medium shadow-sm" : "hover:bg-accent/50 text-muted-foreground"
              )}
            >
              <Settings className={cn("h-4 w-4", pathname === "/settings" ? "text-primary" : "text-muted-foreground")} /> Configurações
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex-1 max-w-md">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-semibold">{session?.user?.name}</span>
              <span className="text-[10px] text-muted-foreground">Administrador</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
              {session?.user?.name?.[0] || "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          {children}
        </main>
        <AIAssistant />
      </div>
    </div>
  );
}
