import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const resolvedParams = await params;
    const { id: projectId } = resolvedParams;
    const { syllabus } = await req.json();

    if (!syllabus) {
      return new NextResponse("Syllabus is required", { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true }
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const systemPrompt = `
      Você é um assistente de gestão de projetos especialista em estruturação de cronogramas. 
      Sua tarefa é analisar um "Conteúdo Programático" e extrair TODAS as aulas, módulos, eventos ou marcos, transformando-os em tarefas detalhadas.
      
      Regras de Ouro:
      1. Título: Extraia um título claro e conciso para a tarefa.
      2. Descrição Completa: NÃO resuma. O campo "description" deve conter TODO o detalhamento, tópicos, sub-itens e o contexto completo associado àquela aula ou evento específico no conteúdo original. Se houver uma lista de assuntos da aula, inclua-os integralmente na descrição.
      3. Datas: Extraia a data se disponível. Se não houver data explícita, sugira datas sequenciais lógicas (ex: uma por dia ou uma por semana) começando por hoje: ${new Date().toISOString()}.
      4. Formato de Saída: Retorne EXCLUSIVAMENTE um JSON no formato: 
         {"tasks": [{"title": "...", "description": "...", "dueDate": "ISO Date"}]}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: syllabus }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    const extractedTasks = result.tasks || [];

    const createdTasks = await Promise.all(
      extractedTasks.map((task: any) => 
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            projectId: projectId,
            status: "TODO",
            priority: "MEDIUM"
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      count: createdTasks.length,
      tasks: createdTasks 
    });

  } catch (error) {
    console.error("DISTRIBUTE_SYLLABUS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }

    const result = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
    const extractedTasks = result.tasks || [];

    // Criar as tarefas no banco de dados
    const createdTasks = await Promise.all(
      extractedTasks.map((task: any) => 
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            projectId: projectId,
            status: "TODO",
            priority: "MEDIUM"
          }
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      count: createdTasks.length,
      tasks: createdTasks 
    });

  } catch (error) {
    console.error("DISTRIBUTE_SYLLABUS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
