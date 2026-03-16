import axios from 'axios';
import { prisma } from '@/lib/prisma';

export class WhatsAppService {
  private static async getSettings(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        whatsappUrl: true,
        whatsappApiKey: true,
      }
    });
    return workspace;
  }

  /**
   * Envia mensagem de texto via UazAPI
   * POST {whatsappUrl}/send/text
   * Header: Token: {whatsappApiKey}
   * Body: { number, text }
   */
  static async sendMessage(workspaceId: string, phone: string, message: string) {
    const settings = await this.getSettings(workspaceId);

    if (!settings?.whatsappUrl || !settings?.whatsappApiKey) {
      throw new Error('Configurações do WhatsApp não encontradas para este workspace.');
    }

    const url = `${settings.whatsappUrl.replace(/\/$/, '')}/send/text`;
    let number = phone.replace(/\D/g, '');
    if (!number.startsWith('55') && (number.length === 10 || number.length === 11)) {
      number = `55${number}`;
    }

    try {
      const response = await axios.post(url, { number, text: message }, {
        headers: {
          'Token': settings.whatsappApiKey,
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('WhatsApp (UazAPI) Error:', error.response?.data || error.message);
      throw new Error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
    }
  }

  /**
   * Configura o webhook no UazAPI apontando para o CRM
   * POST {whatsappUrl}/webhook
   */
  static async configureWebhook(workspaceId: string, webhookUrl: string) {
    const settings = await this.getSettings(workspaceId);

    if (!settings?.whatsappUrl || !settings?.whatsappApiKey) {
      throw new Error('Configurações do WhatsApp não encontradas.');
    }

    const url = `${settings.whatsappUrl.replace(/\/$/, '')}/webhook`;

    const response = await axios.post(url, {
      url: webhookUrl,
      events: ['messages'],
      excludeMessages: ['wasNotSentByApi', 'isGroupYes'],
      enabled: true,
    }, {
      headers: {
        'Token': settings.whatsappApiKey,
        'Content-Type': 'application/json',
      }
    });

    return response.data;
  }

  // Função para enviar via N8N (Webhook) — mantida para compatibilidade
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
