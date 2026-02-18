import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: typeof process !== "undefined" && process.uptime ? process.uptime() : null,
      env: process.env.VERCEL ? "vercel" : "self-hosted",
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}

