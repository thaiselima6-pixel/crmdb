import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook para integração com LeadForce (Supabase)
 * Ações: create_lead | update_status | log_conversation
 */
export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.N8N_API_KEY) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return new NextResponse("workspaceId is required", { status: 400 });
    }

    // ── ACTION: create_lead ──────────────────────────────────────────────────
    // Called by send-whatsapp after Victor Vendas sends the first message
    if (action === "create_lead") {
      const { name, company, phone, email, niche, city, website, rating, personalizedMessage } = body;

      // Avoid duplicates — check by phone
      const existing = await prisma.lead.findFirst({
        where: { phone: phone || undefined, workspaceId },
      });

      if (existing) {
        // Update status to CONTACTED if it was NEW
        if (existing.status === "NEW") {
          await prisma.lead.update({
            where: { id: existing.id },
            data: {
              status: "CONTACTED",
              source: "LeadForce",
            },
          });
        }
        return NextResponse.json({ success: true, leadId: existing.id, duplicate: true });
      }

      const tags: string[] = [];
      if (niche) tags.push(niche);
      if (rating) tags.push(`⭐ ${rating}`);
      if (!website || website === "no_website") tags.push("Sem site");

      const lead = await prisma.lead.create({
        data: {
          name: company || name || "Lead LeadForce",
          company: company || null,
          phone: phone || null,
          email: email || "sem-email@leadforce.com",
          source: "LeadForce",
          status: "CONTACTED",
          tags,
          workspaceId,
        },
      });

      if (personalizedMessage) {
        await prisma.note.create({
          data: {
            content: `📨 Mensagem enviada pelo Victor Vendas:\n\n${personalizedMessage}`,
            leadId: lead.id,
          },
        });
      }

      return NextResponse.json({ success: true, leadId: lead.id });
    }

    // ── ACTION: update_status ────────────────────────────────────────────────
    // Called by webhook-whatsapp when Maya detects intent
    if (action === "update_status") {
      const { phone, intent } = body;

      if (!phone) return new NextResponse("phone is required", { status: 400 });

      const statusMap: Record<string, string> = {
        interested: "QUALIFIED",
        not_interested: "LOST",
        question: "CONTACTED",
        auto_reply: "CONTACTED",
        other: "CONTACTED",
      };

      const newStatus = statusMap[intent] || "CONTACTED";

      const lead = await prisma.lead.findFirst({
        where: { phone, workspaceId },
      });

      if (!lead) {
        return NextResponse.json({ success: false, reason: "lead not found" });
      }

      // Only upgrade status, never downgrade (QUALIFIED stays QUALIFIED)
      const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
      const currentIdx = statusOrder.indexOf(lead.status);
      const newIdx = statusOrder.indexOf(newStatus);

      if (newIdx > currentIdx || newStatus === "LOST") {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: newStatus },
        });
      }

      return NextResponse.json({ success: true, leadId: lead.id, status: newStatus });
    }

    // ── ACTION: log_conversation ─────────────────────────────────────────────
    // Called by webhook-whatsapp to log Maya conversations in CRM
    if (action === "log_conversation") {
      const { phone, content, role } = body;

      if (!phone || !content || !role) {
        return new NextResponse("phone, content and role are required", { status: 400 });
      }

      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) return new NextResponse("Invalid workspaceId", { status: 400 });

      let conversation = await prisma.aIConversation.findFirst({
        where: { workspaceId, phone },
        orderBy: { updatedAt: "desc" },
      });

      if (!conversation) {
        const lead = await prisma.lead.findFirst({ where: { phone, workspaceId } });
        conversation = await prisma.aIConversation.create({
          data: {
            workspaceId,
            phone,
            title: lead?.name ? `Maya ↔ ${lead.name}` : `Maya ↔ ${phone}`,
          },
        });
      }

      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role,
          content,
          metadata: { phone },
        },
      });

      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("WEBHOOK_LEADFORCE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
