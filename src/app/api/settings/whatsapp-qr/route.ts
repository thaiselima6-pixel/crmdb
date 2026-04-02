import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const { url, token } = await req.json();
    if (!url || !token) return new NextResponse("Bad Request", { status: 400 });

    const baseUrl = url.replace(/\/$/, '');
    
    let qrBase64 = null;
    let qrRawString = null;
    let isConnected = false;

    // Tentativas heurísticas de buscar o QR Code nos padrões de APIs que usam /send/text
    const endpointsToTry = [
      '/instance/connectionState',
      '/instance/qr',
      '/qr',
      '/qrcode',
      '/status',
      '/instance/connect',
      '/whatsapp/qr'
    ];

    for (const endpoint of endpointsToTry) {
      if (qrBase64 || isConnected) break;
      try {
        const res = await axios.get(`${baseUrl}${endpoint}`, {
          headers: { 'Token': token, 'Authorization': `Bearer ${token}` }
        });

        const state = res.data?.state || res.data?.instance?.state || res.data?.status || res.data?.instance?.status;
        if (state === "open" || state === "connected" || state === "CONNECTED" || state === "SUCCESS" || res.data?.connected === true) {
          isConnected = true;
          break;
        }

        if (res.data?.base64) qrBase64 = res.data.base64;
        else if (res.data?.qrcode && res.data.qrcode.startsWith("data:image")) qrBase64 = res.data.qrcode;
        else if (res.data?.qr) qrBase64 = res.data.qr;
        else if (res.data?.qrcode) qrRawString = res.data.qrcode; // string like '2@...'

      } catch (err) {
        // Ignora erro e tenta o próximo
      }
    }

    if (isConnected) {
      return NextResponse.json({ isConnected: true });
    }

    // Se a API não retornou a tela do QR Code Base64...
    if (!qrBase64 && !qrRawString) {
      return NextResponse.json({ 
        error: "QR Code não encontrado. O painel (UazAPI/Sua API) parece não expor o QR ou não existe sessão pendente."
      }, { status: 404 });
    }

    if (!qrBase64 && qrRawString) {
      qrBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrRawString)}`;
    }

    if (qrBase64 && !qrBase64.startsWith("data:image") && !qrBase64.startsWith("http")) {
      qrBase64 = `data:image/png;base64,${qrBase64.replace(/^base64,/, "")}`;
    }

    return NextResponse.json({ qrCodeBase64: qrBase64 });
  } catch (error) {
    console.error("WHATSAPP_QR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
