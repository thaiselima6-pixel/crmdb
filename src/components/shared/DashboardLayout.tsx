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
import Image from "next/image";

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
      <aside className="w-64 border-r hidden md:flex flex-col shrink-0 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-orange-950/40" />
        <div className="relative p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-orange-500/60 shadow-lg">
              <Image src="/digital_brain_dynamic_1.png" alt="Digital Brain" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">Digital Brain</span>
              <span className="text-[10px] text-orange-300/80 uppercase">CRM</span>
            </div>
          </div>
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
                    "w-full justify-start gap-2 transition-all duration-200 text-slate-300 hover:text-white",
                    isActive 
                      ? "bg-orange-500/15 text-white font-medium shadow-md border border-orange-500/30"
                      : "hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-orange-400" : "text-slate-400")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="relative p-4 border-t border-white/5 space-y-2">
          <Link href="/settings">
            <Button 
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 transition-all duration-200 text-slate-300 hover:text-white",
                pathname === "/settings" 
                  ? "bg-orange-500/15 text-white font-medium shadow-md border border-orange-500/30" 
                  : "hover:bg-white/5"
              )}
            >
              <Settings className={cn("h-4 w-4", pathname === "/settings" ? "text-orange-400" : "text-slate-400")} /> Configurações
            </Button>
          </Link>
          <Button 
            variant="ghost"
            className="w-full justify-start gap-2 text-red-300 hover:text-red-200 hover:bg-red-900/20"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex-1 max-w-md">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-semibold">{session?.user?.name}</span>
              <span className="text-[10px] text-muted-foreground">Administrador</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-orange-400 font-bold shadow-inner">
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
