
import { prisma } from "./src/lib/prisma";

async function testConnection() {
  console.log("Iniciando teste de conexão com o banco de dados...");
  console.log("Host: 72.61.47.36");
  console.log("Porta: 5433");
  
  try {
    // Tenta fazer uma query simples
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const end = Date.now();
    
    console.log("✅ CONEXÃO BEM-SUCEDIDA!");
    console.log(`Tempo de resposta: ${end - start}ms`);
    
    // Verifica se consegue ler a tabela Workspace
    const count = await prisma.workspace.count();
    console.log(`Acesso aos dados: OK (${count} workspaces encontrados)`);
    
  } catch (error: any) {
    console.error("❌ FALHA NA CONEXÃO:");
    console.error("Mensagem:", error.message);
    
    if (error.message.includes("ETIMEDOUT") || error.message.includes("Can't reach database server")) {
      console.log("\nPossível causa: O firewall do seu banco de dados está bloqueando conexões externas.");
      console.log("Ação recomendada: No seu servidor de banco de dados, libere o acesso para o IP 0.0.0.0/0 ou adicione os IPs da Vercel na lista permitida.");
    }
  } finally {
    process.exit();
  }
}

testConnection();
