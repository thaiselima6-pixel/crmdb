import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendInvoiceReminders } from "@/lib/send-invoice-reminders";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    const workspaceId = (session.user as any).workspaceId;
    const result = await sendInvoiceReminders(workspaceId);

    if (result.error === 'missing_credentials') {
      return NextResponse.json({ message: result.message, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("FINANCE_REMINDERS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
