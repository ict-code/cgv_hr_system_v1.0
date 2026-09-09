import { NextResponse } from "next/server";

// Not under /api/* deliberately — Caddy routes the whole /api/* prefix
// straight to the NestJS container (see Caddyfile), so a Next.js route
// handler placed there would never be reached.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

export async function POST(request: Request) {
  const body = await request.json();

  const apiRes = await fetch(`${API_INTERNAL_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!apiRes.ok) {
    const error = await apiRes.json().catch(() => ({ message: "Login failed" }));
    return NextResponse.json(error, { status: apiRes.status });
  }

  const { accessToken, user } = await apiRes.json();

  const response = NextResponse.json({ user });
  response.cookies.set("egaps_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
