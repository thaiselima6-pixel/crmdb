import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifySignature(secret: string, body: string, signature: string): boolean {
  const expected = crypto.createHmac("sha1", secret).update(body).digest("hex");
  return expected === signature;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    // workspaceId pode vir como query param ou no payload
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId") || body.workspaceId;

    if (!workspaceId) {
      return new NextResponse("workspaceId is required", { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        kiwifyEnabled: true,
        kiwifyWebhookSecret: true,
        kiwifyCartRecoveryEnabled: true,
      },
    });

    if (!workspace?.kiwifyEnabled) {
      return new NextResponse("Kiwify integration not enabled", { status: 403 });
    }

    // Verificar assinatura HMAC se configurada
    if (workspace.kiwifyWebhookSecret) {
      const signature = req.headers.get("x-kiwify-signature") || req.headers.get("x-signature") || "";
      if (!verifySignature(workspace.kiwifyWebhookSecret, rawBody, signature)) {
        return new NextResponse("Invalid signature", { status: 401 });
      }
    }

    const event: string = body.event || body.type || "";

    // Carrinho abandonado
    if (event === "AbandonedCart" || event === "abandoned_cart") {
      if (!workspace.kiwifyCartRecoveryEnabled) {
        return NextResponse.json({ received: true, action: "cart_recovery_disabled" });
      }

      const customer = body.Customer || body.customer || {};
      const phone: string = customer.mobile || customer.phone || customer.telefone || "";
      const customerName: string = customer.full_name || customer.name || customer.nome || "Cliente";
      const customerEmail: string = customer.email || "";
      const productName: string = body.product_name || body.produto_nome || body.Product?.name || "Produto";
      const productPrice: number = Number(body.product_price || body.Product?.price || body.valor || 0);
      const checkoutUrl: string = body.checkout_link || body.checkout_url || body.link || "";
      const externalId: string = body.order_id || body.cart_id || body.id || `${Date.now()}`;

      await prisma.kiwifyAbandonedCart.upsert({
        where: { workspaceId_externalId: { workspaceId, externalId } },
        create: {
          workspaceId,
          externalId,
          customerName,
          customerEmail,
          customerPhone: phone || null,
          productName,
          productPrice,
          checkoutUrl: checkoutUrl || null,
          status: "PENDING",
          abandonedAt: new Date(),
        },
        update: {
          customerName,
          customerEmail,
          customerPhone: phone || null,
          productName,
          productPrice,
          checkoutUrl: checkoutUrl || null,
          status: "PENDING",
          abandonedAt: new Date(),
        },
      });

      return NextResponse.json({ received: true, action: "cart_queued" });
    }

    // Compra concluída — marcar carrinho como recuperado
    if (
      event === "order_paid" ||
      event === "OrderPaid" ||
      event === "purchase_complete" ||
      body.order_status === "paid"
    ) {
      const externalId: string = body.order_id || body.cart_id || body.id || "";
      if (externalId) {
        await prisma.kiwifyAbandonedCart.updateMany({
          where: { workspaceId, externalId, status: "PENDING" },
          data: { status: "RECOVERED", updatedAt: new Date() },
        });
      }
      return NextResponse.json({ received: true, action: "cart_recovered" });
    }

    return NextResponse.json({ received: true, action: "ignored" });
  } catch (error) {
    console.error("WEBHOOK_KIWIFY_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
