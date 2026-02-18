import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Lazy load Anthropic only when needed to prevent crashes if module is missing
let Anthropic: any;
try {
  Anthropic = require('@anthropic-ai/sdk').Anthropic;
} catch (e) {
  console.warn('@anthropic-ai/sdk not found. Claude model will be unavailable.');
}


const anthropic = Anthropic ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
}) : null;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { content: "A chave da API da OpenAI não foi configurada. Por favor, adicione OPENAI_API_KEY ao seu arquivo .env" },
        { status: 200 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { messages, model = 'gpt' } = await req.json();

    // ... resto do código igual
    // Se o modelo solicitado for Claude
    if (model === 'claude') {
      if (!anthropic) {
        return NextResponse.json(
          { content: "O suporte ao Claude (Anthropic) não está instalado ou configurado no servidor." },
          { status: 200 }
        );
      }
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          { content: "A chave da API da Anthropic não foi configurada. Por favor, adicione ANTHROPIC_API_KEY ao seu arquivo .env" },
          { status: 200 }
        );
      }

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        system: `Você é um assistente IA especializado em criação de conteúdo para uma agência digital. 
        Você está conversando com ${session.user.name || 'um membro da equipe'}.
        Use um tom profissional, criativo e focado em conversão.`,
        messages: messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';

      return NextResponse.json({ role: 'assistant', content });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
      });

      const message = response.choices[0].message;
      return NextResponse.json({ content: message.content || "" });
    } catch (err: any) {
      console.error("AI_CHAT_OPENAI_ERROR", err);
      return NextResponse.json(
        { content: "Não consegui falar com o modelo de IA agora. Tente novamente em alguns instantes." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("AI_CHAT_ERROR", error);
    return NextResponse.json(
      { content: "Ocorreu um erro interno no servidor da IA. Tente novamente em alguns minutos." },
      { status: 200 }
    );
  }
}
// Force rebuild comment
