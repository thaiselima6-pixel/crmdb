
import axios from "axios";

async function testCloudflareWebhook() {
  const url = "https://green-broadcast-correction-murray.trycloudflare.com/api/webhooks/maya-assistente";
  const apiKey = "maya_crm_secure_key_2024";
  const workspaceId = "cm73r5msc00003b6qxti8856j";

  console.log("Iniciando teste de log para Maya via Cloudflare...");

  try {
    const response = await axios.post(url, {
      action: "log_chat",
      workspaceId: workspaceId,
      phone: "5511999999999",
      role: "assistant",
      content: "🚀 Conexão via Cloudflare estabelecida com sucesso! Maya pronta para agir no n8n."
    }, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ RESPOSTA DO CRM:", response.status, response.data);
    console.log("Acesse o dashboard 'Maya Assistente' no CRM para ver a mensagem!");
  } catch (error: any) {
    console.error("❌ ERRO NO TESTE:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testCloudflareWebhook();
