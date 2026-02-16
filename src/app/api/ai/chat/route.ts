import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from '@/lib/whatsapp';

// Lazy load Anthropic only when needed to prevent crashes if module is missing
let Anthropic: any;
try {
  Anthropic = require('@anthropic-ai/sdk').Anthropic;
} catch (e) {
  console.warn('@anthropic-ai/sdk not found. Claude model will be unavailable.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = Anthropic ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
}) : null;

const functions = [
  {
    name: 'get_leads_stats',
    description: 'Retorna estatísticas de leads',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['all', 'hot', 'warm', 'cold'] },
        period: { type: 'string', enum: ['today', 'week', 'month'] }
      }
    }
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no projeto',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        projectId: { type: 'string' }
      },
      required: ['title', 'projectId']
    }
  },
  {
    name: 'send_whatsapp',
    description: 'Envia mensagem WhatsApp via Evolution API',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['phone', 'message']
    }
  },
  {
    name: 'update_lead_status',
    description: 'Atualiza o status de um lead',
    parameters: {
      type: 'object',
      properties: {
        leadId: { type: 'string' },
        status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] }
      },
      required: ['leadId', 'status']
    }
  },
  {
    name: 'add_lead_tag',
    description: 'Adiciona uma tag a um lead',
    parameters: {
      type: 'object',
      properties: {
        leadId: { type: 'string' },
        tag: { type: 'string' }
      },
      required: ['leadId', 'tag']
    }
  },
  {
    name: 'update_project_status',
    description: 'Atualiza o status de um projeto',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        status: { type: 'string', enum: ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ON_HOLD'] }
      },
      required: ['projectId', 'status']
    }
  },
  {
    name: 'get_overdue_projects',
    description: 'Busca projetos com tarefas atrasadas ou prazo vencido',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { content: "A chave da API da OpenAI não foi configurada. Por favor, adicione OPENAI_API_KEY ao seu arquivo .env" },
        { status: 200 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const { messages, context, model = 'gpt' } = await req.json();

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

    // Buscar ou criar conversa
    let conversation = await prisma.aIConversation.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' }
    });

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { workspaceId }
      });
    }

    // Salvar mensagem do usuário
    const lastUserMessage = messages[messages.length - 1];
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: lastUserMessage.role,
        content: lastUserMessage.content
      }
    });

    // Buscar dados reais para o contexto
    const leadsCount = await prisma.lead.count({ where: { workspaceId } });
    const hotLeads = await prisma.lead.count({ where: { workspaceId, status: 'HOT' } });
    const activeClients = await prisma.client.count({ where: { workspaceId, status: 'ACTIVE' } });
    const activeProjects = await prisma.project.count({ where: { workspaceId, status: 'IN_PROGRESS' } });
    
    // Buscar faturamento detalhado
    const financeData = await prisma.invoice.aggregate({
      where: { workspaceId, status: 'PAID' },
      _sum: { amount: true }
    });

    // Buscar leads recentes para contexto de qualificação
    const recentLeads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, status: true, company: true }
    });

    // Buscar projetos recentes
    const recentProjects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, status: true }
    });

    const systemMessage = {
      role: 'system',
      content: `Você é um assistente IA integrado ao CRM de uma agência digital. 
      Você está conversando com ${session.user.name || 'um membro da equipe'}.
      
      Dados do workspace atual: 
      - Total de leads: ${leadsCount} 
      - Leads quentes: ${hotLeads} 
      - Clientes ativos: ${activeClients} 
      - Faturamento total (pago): R$ ${financeData._sum.amount || 0} 
      - Projetos em andamento: ${activeProjects} 
      
      Leads recentes (IDs e Nomes): ${recentLeads.map(l => `${l.name} (${l.id})`).join(', ')}
      Projetos recentes (IDs e Nomes): ${recentProjects.map(p => `${p.name} (${p.id})`).join(', ')}

      Contexto da página atual: ${context?.path || 'Dashboard'}

      Você pode: 
      1. Responder perguntas sobre dados do CRM (leads, faturamento, projetos)
      2. Criar tarefas, atualizar status de leads e projetos, e adicionar tags
      3. Gerar conteúdo (emails de follow-up, propostas, posts de redes sociais)
      4. Enviar mensagens WhatsApp (se solicitado com telefone e mensagem)
      5. Dar insights proativos sobre churn, atrasos e oportunidades de venda
      
      Ao atualizar algo, use os IDs fornecidos acima. Se precisar de um ID que não tem, peça ao usuário.`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      functions,
      function_call: 'auto',
    });

    const message = response.choices[0].message;

    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      let functionResponse;

      if (functionName === 'get_leads_stats') {
        const stats = await prisma.lead.groupBy({
          by: ['status'],
          where: { workspaceId },
          _count: true
        });
        functionResponse = JSON.stringify(stats);
      } else if (functionName === 'create_task') {
        const task = await prisma.task.create({
          data: {
            title: functionArgs.title,
            description: functionArgs.description,
            dueDate: functionArgs.dueDate ? new Date(functionArgs.dueDate) : null,
            projectId: functionArgs.projectId,
          }
        });
        functionResponse = JSON.stringify(task);
      } else if (functionName === 'send_whatsapp') {
        try {
          await WhatsAppService.sendMessage(workspaceId, functionArgs.phone, functionArgs.message);
          functionResponse = JSON.stringify({ success: true, message: "Mensagem enviada com sucesso" });
        } catch (error: any) {
          functionResponse = JSON.stringify({ success: false, error: error.message });
        }
      } else if (functionName === 'update_lead_status') {
        const lead = await prisma.lead.update({
          where: { id: functionArgs.leadId, workspaceId },
          data: { status: functionArgs.status }
        });
        functionResponse = JSON.stringify({ success: true, lead });
      } else if (functionName === 'add_lead_tag') {
        const lead = await prisma.lead.findUnique({
          where: { id: functionArgs.leadId, workspaceId }
        });
        if (lead) {
          const tags = [...new Set([...lead.tags, functionArgs.tag])];
          const updatedLead = await prisma.lead.update({
            where: { id: functionArgs.leadId },
            data: { tags }
          });
          functionResponse = JSON.stringify({ success: true, lead: updatedLead });
        } else {
          functionResponse = JSON.stringify({ success: false, error: "Lead não encontrado" });
        }
      } else if (functionName === 'update_project_status') {
        const project = await prisma.project.update({
          where: { id: functionArgs.projectId, workspaceId },
          data: { status: functionArgs.status }
        });
        functionResponse = JSON.stringify({ success: true, project });
      } else if (functionName === 'get_overdue_projects') {
        const overdueProjects = await prisma.project.findMany({
          where: { 
            workspaceId,
            OR: [
              { status: { not: 'COMPLETED' } },
              { tasks: { some: { status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } } } }
            ]
          },
          include: { tasks: true }
        });
        functionResponse = JSON.stringify(overdueProjects);
      }

      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          systemMessage,
          ...messages,
          message,
          {
            role: 'function',
            name: functionName,
            content: functionResponse as string,
          },
        ],
      });

      const assistantMessage = secondResponse.choices[0].message;
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: assistantMessage.content || ""
        }
      });

      return NextResponse.json(assistantMessage);
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: message.content || ""
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("AI_CHAT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
// Force rebuild comment
