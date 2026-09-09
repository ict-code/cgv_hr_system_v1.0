import { NextResponse, type NextRequest } from "next/server";

// Cookie presence is just the UX gate — the NestJS API independently
// verifies the JWT on every request, so this isn't the security boundary.
export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has("egaps_token");

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employees/:path*", "/departments/:path*", "/positions/:path*"],
};
