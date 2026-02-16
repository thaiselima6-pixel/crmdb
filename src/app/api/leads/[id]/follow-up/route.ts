import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { id: leadId } = resolvedParams;
    const workspaceId = (session.user as any).workspaceId;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId, workspaceId }
    });

    if (!lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    const systemPrompt = `
      Você é um assistente de vendas de alta performance. 
      Sua tarefa é gerar uma mensagem de follow-up amigável, profissional e persuasiva para o WhatsApp.
      O objetivo é reengajar o lead de forma natural.
      
      Contexto do Lead:
      Nome: ${lead.name}
      Status Atual: ${lead.status}
      Empresa: ${lead.company || 'Não informada'}
      Valor Potencial: R$ ${lead.value}
      
      Regras:
      1. Use o primeiro nome do lead.
      2. Seja conciso (máximo 3 parágrafos curtos).
      3. Termine com uma pergunta aberta para incentivar a resposta.
      4. Use emojis de forma moderada e profissional.
      5. O tom deve ser de ajuda, não de cobrança.
      6. Se o status for "NEW", dê boas-vindas. 
      7. Se for "CONTACTED" ou "QUALIFIED", pergunte se ele teve tempo de ver o que conversaram.
      8. Se for "PROPOSAL", pergunte se restou alguma dúvida sobre os valores ou escopo.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Gere uma mensagem de follow-up para este lead." }
      ],
    });

    const message = response.choices[0].message.content;

    return NextResponse.json({ 
      success: true, 
      message,
      phone: lead.phone
    });

  } catch (error) {
    console.error("FOLLOW_UP_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
