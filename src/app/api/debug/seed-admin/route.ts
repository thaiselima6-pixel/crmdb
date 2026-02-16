import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const password = "admin";
  const hashedPassword = await bcrypt.hash(password, 10);

  const workspace = await prisma.workspace.upsert({
    where: { slug: "agencia-admin" },
    update: {},
    create: {
      name: "Agência Admin",
      slug: "agencia-admin",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      password: hashedPassword,
      workspaceId: workspace.id,
      role: "ADMIN",
    },
    create: {
      email: "admin@admin.com",
      name: "Admin Tester",
      password: hashedPassword,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  return { email: admin.email, password, workspace: workspace.name };
}

export async function GET() {
  try {
    const result = await main();
    return new Response(JSON.stringify({
      message: "USUÁRIO ADMIN CRIADO COM SUCESSO!",
      ...result
    }), { status: 200 });
  } catch (error: any) {
    console.error("SEED ERROR:", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 });
  }
}
