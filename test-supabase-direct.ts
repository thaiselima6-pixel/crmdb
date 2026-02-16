import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const workspaces = await prisma.workspace.findMany({
      select: { id: true, name: true }
    });
    
    if (workspaces.length === 0) {
      console.log("--- NENHUM WORKSPACE ENCONTRADO ---");
    } else {
      console.log("--- SEUS WORKSPACES ---");
      workspaces.forEach(w => {
        console.log(`NOME: ${w.name}`);
        console.log(`ID: ${w.id}`);
        console.log("-----------------------");
      });
    }
  } catch (e) {
    console.error("Erro ao buscar workspaces:", e);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();
