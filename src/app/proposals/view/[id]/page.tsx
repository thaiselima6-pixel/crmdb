"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle2, Clock, Mail } from "lucide-react";
import { jsPDF } from "jspdf";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProposalViewPage() {
  const { id } = useParams();
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setIsLoading(true);
        // We'll need a public API route or handle this specially
        const response = await axios.get(`/api/proposals/public/${id}`);
        setProposal(response.data);
      } catch (err) {
        console.error("Failed to fetch proposal", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProposal();
  }, [id]);

  const generatePDF = () => {
    if (!proposal) return;
    
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
    doc.text(format(new Date(proposal.createdAt), "dd/MM/yyyy"), margin + 20, yPos);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Carregando sua proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground mb-6">Esta proposta pode ter sido removida ou o link está incorreto.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <p className="text-muted-foreground">Proposta comercial para {proposal.clientName}</p>
            </div>
          </div>
          <Button onClick={generatePDF} className="gap-2 shadow-lg hover:shadow-xl transition-all">
            <Download className="h-4 w-4" /> Baixar em PDF
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-none">
            <CardHeader className="border-b bg-card/50">
              <CardTitle>Detalhamento da Proposta</CardTitle>
              <CardDescription>Confira abaixo todos os detalhes e escopo do projeto.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-slate max-w-none whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                {proposal.content}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm border-none overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground text-center">
                <p className="text-sm opacity-90 uppercase tracking-wider font-semibold mb-1">Investimento Total</p>
                <h2 className="text-3xl font-bold">R$ {Number(proposal.value).toLocaleString('pt-BR')}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Válido por 7 dias</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span>Início imediato após aprovação</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="truncate">{proposal.clientEmail}</span>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <p className="text-xs text-muted-foreground text-center italic">
                    Ao aceitar esta proposta, você concorda com os termos de serviço da agência.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10 shadow-none">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base">Dúvidas?</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Entre em contato conosco para esclarecer qualquer ponto da proposta.
                </p>
                <Button variant="outline" className="w-full bg-background" asChild>
                  <a href={`mailto:${proposal.workspace?.users?.[0]?.email || ''}`}>
                    Falar com Consultor
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <footer className="text-center py-8 text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} - Gerado via CRM Agência</p>
        </footer>
      </div>
    </div>
  );
}
