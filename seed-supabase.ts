import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log("Criando workspace inicial no Supabase...");
    
    const workspace = await prisma.workspace.create({
      data: {
        name: "Meu CRM",
        slug: "meu-crm",
      }
    });
    
    console.log("--- WORKSPACE CRIADO COM SUCESSO ---");
    console.log(`NOME: ${workspace.name}`);
    console.log(`ID: ${workspace.id}`);
    console.log("-----------------------");
    
  } catch (e) {
    console.error("Erro ao criar workspace:", e);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();
