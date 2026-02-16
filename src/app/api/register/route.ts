import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password, workspaceName } = await req.json();

    if (!email || !password || !name || !workspaceName) {
      return new NextResponse("Campos obrigatórios ausentes", { status: 400 });
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
