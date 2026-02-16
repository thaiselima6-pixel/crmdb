
import { prisma } from "./src/lib/prisma";

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
    process.exit();
  }
}

main();
