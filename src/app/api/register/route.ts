import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password, workspaceName } = await req.json();

    if (!email || !password || !name || !workspaceName) {
      return new NextResponse("Campos obrigatórios ausentes", { status: 400 });
    }

    if (password.length < 8) {
      return new NextResponse("Senhas devem ter no mínimo 8 caracteres", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Email já cadastrado", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar Workspace e Usuário em uma transação
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: workspaceName.toLowerCase().replace(/ /g, "-") + "-" + Math.random().toString(36).substring(2, 7),
        },
      });

      // Criar Pipeline padrão
      const pipeline = await tx.pipeline.create({
        data: {
          name: "Vendas",
          workspaceId: workspace.id,
        }
      });

      // Criar Estágios do Pipeline
      const stages = [
        { name: "Novo", order: 0 },
        { name: "Contatado", order: 1 },
        { name: "Qualificado", order: 2 },
        { name: "Proposta", order: 3 },
        { name: "Negociação", order: 4 },
        { name: "Ganhos", order: 5 },
      ];

      for (const stage of stages) {
        await tx.pipelineStage.create({
          data: {
            name: stage.name,
            order: stage.order,
            pipelineId: pipeline.id,
          }
        });
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
      });

      return { user, workspace };
    });

    return NextResponse.json(result.user, { status: 201 });
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}
