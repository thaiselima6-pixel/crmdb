"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Chrome, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Tratar erro (ex: mostrar toast)
        console.error(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const loginWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="container grid h-full max-w-5xl grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-10 items-center">
        <div className="relative hidden lg:flex h-full flex-col justify-between rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-950 to-black p-10 shadow-[0_0_60px_-30px_rgba(249,115,22,0.9)]">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-orange-500/60 bg-black/60">
              <Image
                src="/digital_brain_dynamic_1.png"
                alt="Digital Brain MKT"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-orange-400/80">
                Digital Brain
              </p>
              <p className="text-lg font-semibold">CRM de Agência</p>
            </div>
          </div>
          {/* Dashboard preview */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-xs space-y-3">
              {/* Metric cards row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-orange-500/20 bg-black/40 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Leads</p>
                  <p className="text-2xl font-bold text-white mt-0.5">248</p>
                  <p className="text-[10px] text-orange-400">↑ 12 esta semana</p>
                </div>
                <div className="rounded-xl border border-orange-500/20 bg-black/40 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">MRR</p>
                  <p className="text-2xl font-bold text-white mt-0.5">R$18k</p>
                  <p className="text-[10px] text-orange-400">↑ 8% vs mês ant.</p>
                </div>
              </div>
              {/* Pipeline mini */}
              <div className="rounded-xl border border-orange-500/20 bg-black/40 p-3 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pipeline</p>
                {[
                  { label: "Qualificados", value: 65, color: "bg-orange-500" },
                  { label: "Proposta",     value: 40, color: "bg-orange-400" },
                  { label: "Negociação",   value: 20, color: "bg-orange-300" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-300 w-20 shrink-0">{s.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 w-6 text-right">{s.value}%</span>
                  </div>
                ))}
              </div>
              {/* Recent activity */}
              <div className="rounded-xl border border-orange-500/20 bg-black/40 p-3 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Atividade recente</p>
                {[
                  { icon: "🤖", text: "Maya qualificou novo lead", time: "2m" },
                  { icon: "📋", text: "Proposta enviada — Agência X", time: "1h" },
                  { icon: "✅", text: "Projeto fechado — R$3.500", time: "3h" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm">{a.icon}</span>
                    <span className="text-[10px] text-slate-300 flex-1 truncate">{a.text}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-auto">
            <h2 className="text-3xl font-bold leading-tight">
              Organize leads, projetos e financeiro em um só lugar.
            </h2>
            <p className="text-sm text-slate-300/80 max-w-md">
              Gestão visual de funil, automações de follow-up com IA e visão
              financeira da sua recorrência mensal.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border border-slate-800/70 bg-slate-950/80 backdrop-blur-sm shadow-2xl shadow-black/50">
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-orange-500/60 bg-black/60 shadow-[0_0_25px_-5px_rgba(249,115,22,0.9)]">
                  <Image
                    src="/digital_brain_dynamic_1.png"
                    alt="Digital Brain MKT"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Entrar no CRM
                  </h1>
                  <p className="text-sm text-slate-400">
                    Faça login para acessar seu painel da Digital Brain.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      placeholder="nome@exemplo.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading || isGoogleLoading}
                      required
                      className="bg-black/40 border-slate-700/80 text-slate-50 placeholder:text-slate-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      disabled={isLoading || isGoogleLoading}
                      required
                      className="bg-black/40 border-slate-700/80 text-slate-50 placeholder:text-slate-500 focus-visible:ring-orange-500"
                    />
                  </div>
                  <Button
                    disabled={isLoading || isGoogleLoading}
                    className="w-full bg-orange-500 hover:bg-orange-500/90 text-white font-medium shadow-[0_0_25px_-5px_rgba(249,115,22,0.9)]"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Entrar com Email
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950/80 px-3 text-slate-500">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading || isGoogleLoading}
                  onClick={loginWithGoogle}
                  className="w-full border-slate-700/80 bg-black/40 text-slate-100 hover:bg-black/60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Google
                </Button>
              </div>

              <p className="text-center text-xs text-slate-500">
                Não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-medium text-orange-400 hover:text-orange-300 underline underline-offset-4"
                >
                  Cadastre-se
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
