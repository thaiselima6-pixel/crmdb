import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
