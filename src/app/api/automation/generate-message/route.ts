import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "A chave da API da OpenAI não foi configurada. Adicione OPENAI_API_KEY ao ambiente do servidor." },
        { status: 200 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { alertType, alertData } = await req.json();

    if (!alertType || !alertData) {
      return new NextResponse("Missing data", { status: 400 });
    }

    let prompt = "";
    if (alertType === "LEAD_STALE") {
      prompt = `Gere uma mensagem amigável e profissional de follow-up para o lead ${alertData.name} que não recebe contato há alguns dias. O objetivo é reengajar sem ser invasivo.`;
    } else if (alertType === "PROPOSAL_STALE") {
      prompt = `Gere uma mensagem profissional para o cliente ${alertData.clientName} sobre a proposta "${alertData.title}". A proposta foi enviada há 3 dias e ainda não tivemos retorno. Pergunte se ele tem alguma dúvida.`;
    } else if (alertType === "INVOICE_DUE") {
      prompt = `Gere um lembrete gentil de pagamento para ${alertData.client.name}. A fatura no valor de R$ ${Number(alertData.amount).toLocaleString('pt-BR')} vence em 3 dias.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Você é um assistente de vendas de alta performance. Gere mensagens de WhatsApp curtas, persuasivas e cordiais. Use emojis de forma moderada. Não use placeholders como [Seu Nome], apenas gere a mensagem direta." 
        },
        { role: "user", content: prompt }
      ],
    });

    const message = response.choices[0].message.content;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("GENERATE_MESSAGE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
