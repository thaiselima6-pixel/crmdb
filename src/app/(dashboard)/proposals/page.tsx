"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  MoreVertical, 
  Download, 
  Send, 
  Copy, 
  Trash2,
  ExternalLink,
  PlusCircle,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Proposal {
  id: string;
  title: string;
  value: number;
  status: string;
  clientName: string;
  clientEmail: string;
  content: string;
  createdAt: string;
}

export default function ProposalsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const SUGGESTED_TEMPLATES = [
    {
      id: "suggested-social-media",
      name: "Social Media",
      content: `PROPOSTA - GESTÃO DE REDES SOCIAIS
CLIENTE: {{client_name}}
DATA: {{date}}

📱 PACOTE
{{package_name}} — {{posts_per_week}} posts/semana

O QUE ESTÁ INCLUÍDO
✓ {{total_posts}} posts/mês (feed)
✓ {{stories_per_week}} stories/semana
✓ {{reels_per_month}} reels/mês
✓ Copies + design profissional
✓ Agendamento e gestão de engajamento
✓ Relatório mensal de desempenho

💰 INVESTIMENTO
R$ {{value}}/mês

✅ PRÓXIMOS PASSOS
Responda "SIM, VAMOS!" para receber contrato, briefing e link de pagamento.
Início: {{start_date}}

{{your_name}} | {{your_company}} | {{your_phone}}`,
      isSuggested: true
    },
    {
      id: "suggested-web-dev",
      name: "Desenvolvimento Web",
      content: `PROPOSTA - DESENVOLVIMENTO WEB
CLIENTE: {{client_name}}
DATA: {{date}}

🎯 OBJETIVO
{{project_description}}

🔧 ESCOPO
✓ {{feature_1}}
✓ {{feature_2}}
✓ {{feature_3}}
✓ {{feature_4}}
✓ {{feature_5}}

📦 ENTREGAS
→ Protótipo navegável (Figma)
→ Sistema completo + testes
→ Deploy em produção
→ Documentação e treinamento
→ 30 dias de suporte pós-entrega

📅 PRAZO
{{total_weeks}} semanas

💰 INVESTIMENTO
R$ {{value}}

Pagamento:
→ 30% na aprovação — R$ {{value_30}}
→ 40% na entrega do protótipo — R$ {{value_40}}
→ 30% no go-live — R$ {{value_30_final}}

✅ PRÓXIMOS PASSOS
Validade: 15 dias
1. Aprovação da proposta
2. Assinatura do contrato
3. Pagamento do sinal

{{your_name}} | {{your_company}} | {{your_phone}}`,
      isSuggested: true
    },
    {
      id: "suggested-traffic",
      name: "Gestão de Tráfego Pago",
      content: `PROPOSTA - GESTÃO DE TRÁFEGO PAGO
CLIENTE: {{client_name}}
DATA: {{date}}

🎯 OBJETIVO
{{campaign_objective}}

📈 PLATAFORMAS
{{platforms}}

O QUE ESTÁ INCLUÍDO
✓ Estratégia e definição de público-alvo
✓ Criação e gestão de campanhas
✓ Otimização diária + testes A/B
✓ Configuração de Pixel / Tag Manager
✓ Relatórios semanais com recomendações

💰 INVESTIMENTO
Gestão: R$ {{value}}/mês
Budget de mídia: R$ {{media_budget}}/mês
Total: R$ {{total_monthly}}/mês

✅ PRÓXIMOS PASSOS
1. Aprovação da proposta
2. Envio de acessos (Meta Business / Google Ads)
3. Kickoff e início das campanhas

{{your_name}} | {{your_phone}} | {{your_email}}`,
      isSuggested: true
    }
  ];

  const { toast } = useToast();

  // Template Form State
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  // Proposal Form State (Extended for traffic paid template)
  const [proposalTitle, setProposalTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [proposalValue, setProposalValue] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [mediaBudget, setMediaBudget] = useState("");
  const [additionalPlatform, setAdditionalPlatform] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourPhone, setYourPhone] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [yourCompany, setYourCompany] = useState("");
  const [packageName, setPackageName] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState("");
  const [totalPosts, setTotalPosts] = useState("");
  const [storiesPerWeek, setStoriesPerWeek] = useState("");
  const [reelsPerMonth, setReelsPerMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  // Web Dev States
  const [projectDescription, setProjectDescription] = useState("");
  const [features, setFeatures] = useState(["", "", "", "", ""]);
  const [pages, setPages] = useState(["", "", "", ""]);
  const [integrations, setIntegrations] = useState(["", "", ""]);
  const [frontendTech, setFrontendTech] = useState("");
  const [backendTech, setBackendTech] = useState("");
  const [database, setDatabase] = useState("");
  const [hosting, setHosting] = useState("");
  const [totalWeeks, setTotalWeeks] = useState("");
  
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    meta: true,
    google: true,
    linkedin: false,
    tiktok: false,
    youtube: false,
    pinterest: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-seleciona um template quando abrir o diálogo de proposta
  useEffect(() => {
    if (isProposalDialogOpen && !selectedTemplate) {
      const first = templates[0] || SUGGESTED_TEMPLATES[0] || null;
      if (first) setSelectedTemplate(first as any);
    }
  }, [isProposalDialogOpen, templates.length]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [templatesRes, proposalsRes] = await Promise.all([
        axios.get("/api/proposals/templates"),
        axios.get("/api/proposals")
      ]);
      setTemplates(templatesRes.data);
      setProposals(proposalsRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({ title: "Erro", description: "Falha ao carregar propostas", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await axios.post("/api/proposals/templates", {
        name: templateName,
        content: templateContent
      });
      toast({ title: "Sucesso", description: "Template criado com sucesso" });
      setTemplateName("");
      setTemplateContent("");
      setIsTemplateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;
    
    try {
      await axios.delete(`/api/proposals/templates/${id}`);
      toast({ title: "Sucesso", description: "Template excluído com sucesso" });
      fetchData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir template", variant: "destructive" });
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;
    
    try {
      await axios.delete(`/api/proposals?id=${id}`);
      toast({ title: "Sucesso", description: "Proposta excluída com sucesso" });
      fetchData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir proposta", variant: "destructive" });
    }
  };

  const handleCreateProposal = async () => {
    if (!selectedTemplate) {
      toast({ title: "Erro", description: "Selecione um template", variant: "destructive" });
      return;
    }

    if (!proposalTitle || !clientName || !clientEmail || !proposalValue) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios (Título, Cliente, Email e Valor)", variant: "destructive" });
      return;
    }

    try {
      // Extended template replacement
      const pValue = parseFloat(proposalValue) || 0;
      const mBudget = parseFloat(mediaBudget) || 0;
      const total = pValue + mBudget;

      // Build platforms list
      const platformNames: Record<string, string> = {
        meta: "Meta Ads (Facebook + Instagram)",
        google: "Google Ads (Pesquisa + Display)",
        linkedin: "LinkedIn Ads",
        tiktok: "TikTok Ads",
        youtube: "YouTube Ads",
        pinterest: "Pinterest Ads"
      };

      const selectedList = Object.entries(selectedPlatforms)
        .filter(([_, selected]) => selected)
        .map(([key, _]) => `→ ${platformNames[key]}`);
      
      if (additionalPlatform) {
        selectedList.push(`→ ${additionalPlatform}`);
      }

      const platformsString = selectedList.length > 0 
        ? selectedList.join('\n') 
        : "Nenhuma plataforma selecionada";

      let finalContent = selectedTemplate.content
        .replace(/{{client_name}}/g, clientName)
        .replace(/{{title}}/g, proposalTitle)
        .replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{{value}}/g, pValue.toLocaleString('pt-BR'))
        .replace(/{{campaign_objective}}/g, campaignObjective || "Não especificado")
        .replace(/{{media_budget}}/g, mBudget.toLocaleString('pt-BR'))
        .replace(/{{total_monthly}}/g, total.toLocaleString('pt-BR'))
        .replace(/{{additional_platform}}/g, additionalPlatform || "Nenhuma")
        .replace(/{{platforms}}/g, platformsString) // New variable
        .replace(/{{your_name}}/g, yourName)
        .replace(/{{your_phone}}/g, yourPhone)
        .replace(/{{your_email}}/g, yourEmail)
        .replace(/{{your_company}}/g, yourCompany || "")
        .replace(/{{package_name}}/g, packageName || "Personalizado")
        .replace(/{{posts_per_week}}/g, postsPerWeek || "0")
        .replace(/{{total_posts}}/g, totalPosts || "0")
        .replace(/{{stories_per_week}}/g, storiesPerWeek || "0")
        .replace(/{{reels_per_month}}/g, reelsPerMonth || "0")
        .replace(/{{start_date}}/g, startDate || "Imediato")
        .replace(/{{project_description}}/g, projectDescription || "")
        .replace(/{{feature_1}}/g, features[0] || "")
        .replace(/{{feature_2}}/g, features[1] || "")
        .replace(/{{feature_3}}/g, features[2] || "")
        .replace(/{{feature_4}}/g, features[3] || "")
        .replace(/{{feature_5}}/g, features[4] || "")
        .replace(/{{page_1}}/g, pages[0] || "")
        .replace(/{{page_2}}/g, pages[1] || "")
        .replace(/{{page_3}}/g, pages[2] || "")
        .replace(/{{page_4}}/g, pages[3] || "")
        .replace(/{{integration_1}}/g, integrations[0] || "")
        .replace(/{{integration_2}}/g, integrations[1] || "")
        .replace(/{{integration_3}}/g, integrations[2] || "")
        .replace(/{{frontend_tech}}/g, frontendTech || "")
        .replace(/{{backend_tech}}/g, backendTech || "")
        .replace(/{{database}}/g, database || "")
        .replace(/{{hosting}}/g, hosting || "")
        .replace(/{{total_weeks}}/g, totalWeeks || "0")
        .replace(/{{value_30}}/g, (Number(pValue) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        .replace(/{{value_40}}/g, (Number(pValue) * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        .replace(/{{value_30_final}}/g, (Number(pValue) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

      const response = await axios.post("/api/proposals", {
        title: proposalTitle,
        value: pValue,
        clientName,
        clientEmail,
        content: finalContent
      });

      toast({ title: "Sucesso", description: "Proposta gerada com sucesso!" });
      setIsProposalDialogOpen(false);
      resetProposalForm();
      fetchData();
      
      // Auto-generate PDF after creation
      generatePDF(response.data);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar proposta", variant: "destructive" });
    }
  };

  const resetProposalForm = () => {
    setProposalTitle("");
    setClientName("");
    setClientEmail("");
    setProposalValue("");
    setCampaignObjective("");
    setMediaBudget("");
    setAdditionalPlatform("");
    setYourName("");
    setYourPhone("");
    setYourEmail("");
    setYourCompany("");
    setPackageName("");
    setPostsPerWeek("");
    setTotalPosts("");
    setStoriesPerWeek("");
    setReelsPerMonth("");
    setStartDate("");
    setProjectDescription("");
    setFeatures(["", "", "", "", ""]);
    setPages(["", "", "", ""]);
    setIntegrations(["", "", ""]);
    setFrontendTech("");
    setBackendTech("");
    setDatabase("");
    setHosting("");
    setTotalWeeks("");
    setSelectedTemplate(null);
    setSelectedPlatforms({
      meta: true,
      google: true,
      linkedin: false,
      tiktok: false,
      youtube: false,
      pinterest: false,
    });
  };

  const generatePDF = (proposal: Proposal) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 0;

    // Helper to remove ONLY emojis and preserve accented characters and common symbols
    const cleanText = (text: string) => {
      // Preserve: A-Z, a-z, 0-9, space, punctuation, accented chars, and common symbols (✓, →, -)
      return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "") // Remove 4-byte emojis
                 .replace(/[^\x00-\x7F\u00C0-\u00FF\u2713\u2192]/g, ""); // Remove other non-standard chars except check and arrow
    };

    // Design Colors
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [243, 244, 246]; // Gray-100
    const textColor = [31, 41, 55]; // Gray-800
    const lightTextColor = [107, 114, 128]; // Gray-500

    // Header Background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    yPos = 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("PROPOSTA COMERCIAL", margin, yPos);

    // Header Info
    yPos = 55;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(cleanText(proposal.clientName.toUpperCase()), margin + 20, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("PROJETO:", margin + 100, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(cleanText(proposal.title.toUpperCase()), margin + 120, yPos);

    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(proposal.createdAt).toLocaleDateString('pt-BR'), margin + 20, yPos);

    yPos += 15;
    
    // Line separator
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Process Content
    const lines = proposal.content.split('\n');
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    lines.forEach((line: string) => {
      if (line.includes('══') || line.trim() === '') {
        if (line.trim() === '') yPos += 5;
        return;
      }

      // Check for section headers (contain emojis or are all caps)
      const isHeader = /🎯|📊|💰|📈|⏱️|✅/.test(line) || 
                       (line.toUpperCase() === line && line.length > 3 && !line.includes(':'));

      if (isHeader) {
        yPos += 10;
        
        // Header background for sections
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(margin, yPos - 6, contentWidth, 10, 'F');
        
        const cleanHeader = cleanText(line).trim();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(cleanHeader, margin + 5, yPos);
        yPos += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      } else {
        const text = cleanText(line).trim();
        if (text) {
          const splitLine = doc.splitTextToSize(text, contentWidth);
          
          // Check for bullet points
          if (text.startsWith('→') || text.startsWith('✓') || text.startsWith('-')) {
            doc.text(splitLine, margin + 5, yPos);
          } else {
            doc.text(splitLine, margin, yPos);
          }
          
          yPos += (splitLine.length * 6);
        }
      }

      // Check for page overflow
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Investment Section
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 15;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPos, contentWidth, 20, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    const valueText = `INVESTIMENTO TOTAL: R$ ${Number(proposal.value).toLocaleString('pt-BR')}`;
    doc.text(valueText, pageWidth / 2, yPos + 13, { align: "center" });

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
      doc.text(
        `Pagina ${i} de ${totalPages} | Gerado por CRM Agência`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`proposta_${proposal.clientName.replace(/\s+/g, '_')}.pdf`);
  };

  const copyProposalLink = (proposal: Proposal) => {
    const link = `${window.location.origin}/proposals/view/${proposal.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!", description: "O link da proposta foi copiado para a área de transferência." });
  };

  const sendWhatsApp = (proposal: Proposal) => {
    const message = `Olá ${proposal.clientName}! Segue o link da sua proposta: ${window.location.origin}/proposals/view/${proposal.id}\n\nValor: R$ ${Number(proposal.value).toLocaleString('pt-BR')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propostas</h1>
          <p className="text-muted-foreground">Crie e gerencie propostas comerciais em segundos.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" /> Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle>Criar Template de Proposta</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary gap-1"
                  onClick={() => {
                    setTemplateName("Desenvolvimento Web");
                    setTemplateContent(`PROPOSTA - DESENVOLVIMENTO WEB
CLIENTE: {{client_name}}
DATA: {{date}}

🎯 OBJETIVO
{{project_description}}

🔧 ESCOPO
✓ {{feature_1}}
✓ {{feature_2}}
✓ {{feature_3}}
✓ {{feature_4}}
✓ {{feature_5}}

📦 ENTREGAS
→ Protótipo navegável (Figma)
→ Sistema completo + testes
→ Deploy em produção
→ Documentação e treinamento
→ 30 dias de suporte pós-entrega

📅 PRAZO
{{total_weeks}} semanas

💰 INVESTIMENTO
R$ {{value}}

Pagamento:
→ 30% na aprovação — R$ {{value_30}}
→ 40% na entrega do protótipo — R$ {{value_40}}
→ 30% no go-live — R$ {{value_30_final}}

✅ PRÓXIMOS PASSOS
Validade: 15 dias
1. Aprovação da proposta
2. Assinatura do contrato
3. Pagamento do sinal

{{your_name}} | {{your_company}} | {{your_phone}}`);
                  }}
                >
                  <Wand2 className="h-3 w-3" /> Modelo Web
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary gap-1"
                  onClick={() => {
                    setTemplateName("Social Media");
                    setTemplateContent(`PROPOSTA - GESTÃO DE REDES SOCIAIS
CLIENTE: {{client_name}}
DATA: {{date}}

📱 PACOTE
{{package_name}} — {{posts_per_week}} posts/semana

O QUE ESTÁ INCLUÍDO
✓ {{total_posts}} posts/mês (feed)
✓ {{stories_per_week}} stories/semana
✓ {{reels_per_month}} reels/mês
✓ Copies + design profissional
✓ Agendamento e gestão de engajamento
✓ Relatório mensal de desempenho

💰 INVESTIMENTO
R$ {{value}}/mês

✅ PRÓXIMOS PASSOS
Responda "SIM, VAMOS!" para receber contrato, briefing e link de pagamento.
Início: {{start_date}}

{{your_name}} | {{your_company}} | {{your_phone}}`);
                  }}
                >
                  <Wand2 className="h-3 w-3" /> Modelo Social Media
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary gap-1"
                  onClick={() => {
                    setTemplateName("Gestão de Tráfego Pago");
                    setTemplateContent(`PROPOSTA - GESTÃO DE TRÁFEGO PAGO
CLIENTE: {{client_name}}
DATA: {{date}}

🎯 OBJETIVO
{{campaign_objective}}

📈 PLATAFORMAS
{{platforms}}

O QUE ESTÁ INCLUÍDO
✓ Estratégia e definição de público-alvo
✓ Criação e gestão de campanhas
✓ Otimização diária + testes A/B
✓ Configuração de Pixel / Tag Manager
✓ Relatórios semanais com recomendações

💰 INVESTIMENTO
Gestão: R$ {{value}}/mês
Budget de mídia: R$ {{media_budget}}/mês
Total: R$ {{total_monthly}}/mês

✅ PRÓXIMOS PASSOS
1. Aprovação da proposta
2. Envio de acessos (Meta Business / Google Ads)
3. Kickoff e início das campanhas

{{your_name}} | {{your_phone}} | {{your_email}}`);
                  }}
                >
                  <Wand2 className="h-3 w-3" /> Modelo Tráfego Pago
                </Button>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Template</Label>
                  <Input 
                    placeholder="Ex: Consultoria SEO" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo Padrão</Label>
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Use {{client_name}}, {{value}}, {{title}} como variáveis..."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTemplate}>Salvar Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Wand2 className="h-4 w-4" /> Gerar Proposta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gerar Nova Proposta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Escolher Template</Label>
                  <select 
                    className="w-full p-2 rounded-md border bg-background"
                    onChange={(e) => {
                      const all = [...templates, ...SUGGESTED_TEMPLATES];
                      const found = all.find(t => t.id === e.target.value) || null;
                      setSelectedTemplate(found as any);
                    }}
                  >
                    <option value="">Selecione um template...</option>
                    {templates.length === 0 && (
                      <option value="" disabled>Sem templates salvos — use uma Sugestão</option>
                    )}
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                    <option value="" disabled>— Sugestões —</option>
                    {SUGGESTED_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (sugestão)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título da Proposta</Label>
                    <Input 
                      placeholder="Ex: Campanha Tráfego Pago"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Gestão (R$)</Label>
                    <Input 
                      type="number"
                      placeholder="2500.00"
                      value={proposalValue}
                      onChange={(e) => setProposalValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input 
                      placeholder="João Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email do Cliente</Label>
                    <Input 
                      type="email"
                      placeholder="cliente@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Campos específicos por template */}
                {selectedTemplate?.id === "suggested-social-media" && (
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h4 className="text-sm font-semibold">Social Media</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Pacote</Label>
                        <Input placeholder="Ex: Start, Pro, Gold" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Posts por Semana</Label>
                        <Input type="number" placeholder="3" value={postsPerWeek} onChange={(e) => setPostsPerWeek(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Total de Posts (Mês)</Label>
                        <Input type="number" placeholder="12" value={totalPosts} onChange={(e) => setTotalPosts(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Stories por Semana</Label>
                        <Input type="number" placeholder="5" value={storiesPerWeek} onChange={(e) => setStoriesPerWeek(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Reels por Mês</Label>
                        <Input type="number" placeholder="4" value={reelsPerMonth} onChange={(e) => setReelsPerMonth(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input placeholder="Ex: 01/05/2026" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {selectedTemplate?.id === "suggested-traffic" && (
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h4 className="text-sm font-semibold">Tráfego Pago</h4>
                    <div className="space-y-2">
                      <Label>Objetivo da Campanha</Label>
                      <Input placeholder="Ex: Aumentar vendas online em 3x" value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget de Mídia (R$)</Label>
                      <Input type="number" placeholder="5000.00" value={mediaBudget} onChange={(e) => setMediaBudget(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Plataformas</Label>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {[
                          { id: "meta", label: "Meta Ads (FB/IG)" },
                          { id: "google", label: "Google Ads" },
                          { id: "linkedin", label: "LinkedIn Ads" },
                          { id: "tiktok", label: "TikTok Ads" },
                          { id: "youtube", label: "YouTube Ads" },
                          { id: "pinterest", label: "Pinterest Ads" },
                        ].map(({ id, label }) => (
                          <div key={id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={id}
                              checked={selectedPlatforms[id as keyof typeof selectedPlatforms]}
                              onChange={(e) => setSelectedPlatforms({ ...selectedPlatforms, [id]: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={id} className="text-sm font-normal cursor-pointer">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTemplate?.id === "suggested-web-dev" && (
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h4 className="text-sm font-semibold">Desenvolvimento Web</h4>
                    <div className="space-y-2">
                      <Label>Descrição do Projeto</Label>
                      <Textarea placeholder="Descreva o objetivo do site/sistema..." value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Funcionalidades (até 5)</Label>
                      {features.map((f, i) => (
                        <Input key={i} placeholder={`Funcionalidade ${i + 1}`} value={f} onChange={(e) => { const n = [...features]; n[i] = e.target.value; setFeatures(n); }} className="mb-1" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo Total (Semanas)</Label>
                      <Input type="number" placeholder="8" value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold mb-3">Suas Informações de Contato</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Seu Nome</Label>
                      <Input 
                        placeholder="Seu Nome Completo"
                        value={yourName}
                        onChange={(e) => setYourName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Seu Telefone</Label>
                        <Input 
                          placeholder="(11) 99999-9999"
                          value={yourPhone}
                          onChange={(e) => setYourPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome da sua Empresa</Label>
                        <Input 
                          placeholder="Minha Agência"
                          value={yourCompany}
                          onChange={(e) => setYourCompany(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Seu Email</Label>
                      <Input 
                        placeholder="seu@email.com"
                        value={yourEmail}
                        onChange={(e) => setYourEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!selectedTemplate} onClick={handleCreateProposal} className="w-full">
                  Gerar Proposta Profissional
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="proposals">Propostas Enviadas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proposals" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="group hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={
                      proposal.status === "SENT" ? "secondary" : 
                      proposal.status === "OPENED" ? "outline" : 
                      proposal.status === "ACCEPTED" ? "default" : "destructive"
                    }>
                      {proposal.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => generatePDF(proposal)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyProposalLink(proposal)}>
                          <Copy className="mr-2 h-4 w-4" /> Copiar Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => sendWhatsApp(proposal)}>
                          <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/proposals/view/${proposal.id}`);
                          toast({ title: "Copiado", description: "Link da proposta copiado!" });
                        }}>
                          <Copy className="mr-2 h-4 w-4" /> Copiar Link
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteProposal(proposal.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg mt-2">{proposal.title}</CardTitle>
                  <CardDescription>{proposal.clientName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-primary">
                      R$ {Number(proposal.value).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Suggested Templates */}
            {SUGGESTED_TEMPLATES.map((template) => (
              <Card key={template.id} className="border-dashed border-2 hover:border-primary/50 transition-colors bg-muted/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <FileText className="h-8 w-8 text-primary/60 mb-2" />
                    <Badge variant="outline" className="text-[10px] uppercase">Sugestão</Badge>
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>
                    {template.content.substring(0, 80)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full text-xs" onClick={() => {
                    setSelectedTemplate(template as any);
                    setIsProposalDialogOpen(true);
                  }}>
                    Usar este Template
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* User Templates */}
            {templates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>
                    {template.content.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full text-xs" onClick={() => {
                    setSelectedTemplate(template);
                    setIsProposalDialogOpen(true);
                  }}>
                    Usar este Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
