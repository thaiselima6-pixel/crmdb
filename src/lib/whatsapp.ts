import axios from 'axios';
import { prisma } from '@/lib/prisma';

export class WhatsAppService {
  private static async getSettings(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { 
        whatsappUrl: true, 
        whatsappApiKey: true, 
        whatsappInstance: true 
      }
    });
    return workspace;
  }

  static async sendMessage(workspaceId: string, phone: string, message: string) {
    const settings = await this.getSettings(workspaceId);
    
    if (!settings?.whatsappUrl || !settings?.whatsappApiKey || !settings?.whatsappInstance) {
      throw new Error('Configurações do WhatsApp não encontradas para este workspace.');
    }

    const url = `${settings.whatsappUrl}/message/sendText/${settings.whatsappInstance}`;
    
    try {
      const response = await axios.post(url, {
        number: phone.replace(/\D/g, ''), // Remove non-digits
        text: message
      }, {
        headers: {
          'apikey': settings.whatsappApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('WhatsApp Service Error:', error.response?.data || error.message);
      throw new Error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
    }
  }

  // Função para enviar via N8N (Webhook)
  static async triggerN8N(webhookUrl: string, data: any) {
    try {
      const response = await axios.post(webhookUrl, data);
      return response.data;
    } catch (error: any) {
      console.error('N8N Trigger Error:', error.message);
      throw new Error(`Erro ao disparar automação no N8N: ${error.message}`);
    }
  }
}
