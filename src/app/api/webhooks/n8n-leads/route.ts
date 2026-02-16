import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // API Key simple para segurança básica entre n8n e CRM
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.N8N_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { 
      name, 
      company, 
      phone, 
      email, 
      website, 
      category, 
      workspaceId 
    } = body;

    if (!workspaceId) {
      return new NextResponse("workspaceId is required", { status: 400 });
    }

    // Criar o lead no CRM
    const lead = await prisma.lead.create({
      data: {
        name: name || company || "Lead do Google Maps",
        company: company || null,
        phone: phone || null,
        email: email || "sem-email@maps.com",
        source: "n8n_google_maps",
        status: "NEW",
        tags: category ? [category] : ["Mined"],
        workspaceId,
      }
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id
    });

  } catch (error) {
    console.error("WEBHOOK_N8N_LEADS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
