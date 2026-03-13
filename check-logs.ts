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
    console.log("Verificando se chegaram logs no Supabase...");
    
    const count = await prisma.aIMessage.count();
    const conversations = await prisma.aIConversation.findMany({
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
    
    console.log(`Total de mensagens: ${count}`);
    console.log(`Total de conversas: ${conversations.length}`);
    
    if (conversations.length > 0) {
      console.log("--- ÚLTIMAS CONVERSAS ---");
      conversations.forEach(c => {
        console.log(`ID: ${c.id} | Mensagens: ${c._count.messages} | Atualizada em: ${c.updatedAt}`);
      });
    } else {
      console.log("Nenhuma conversa encontrada ainda.");
    }
    
  } catch (e) {
    console.error("Erro ao verificar logs:", e);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();
