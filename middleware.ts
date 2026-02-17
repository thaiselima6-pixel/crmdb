import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMITS: Record<string, number> = {
  "/api/auth/callback/credentials": 10,
  "/api/register": 10,
  "default": 60,
};

const STORE: {
  hits: Map<string, { count: number; ts: number }>;
} = (globalThis as any).__rate_store__ ?? { hits: new Map() };
(globalThis as any).__rate_store__ = STORE;

function key(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}

function limitFor(pathname: string) {
  return RATE_LIMITS[pathname] ?? RATE_LIMITS["default"];
}

function checkRate(req: NextRequest) {
  const pathname = new URL(req.url).pathname;
  const max = limitFor(pathname);
  const k = key(req);
  const now = Date.now();
  const entry = STORE.hits.get(k);
  if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
    STORE.hits.set(k, { count: 1, ts: now });
    return { ok: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: max - entry.count };
}

export function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname;
  const isProtected =
    req.method === "POST" &&
    (pathname === "/api/auth/callback/credentials" || pathname === "/api/register");

  if (isProtected) {
    const result = checkRate(req);
    if (!result.ok) {
      const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      res.headers.set("Retry-After", String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)));
      return res;
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "0");
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
