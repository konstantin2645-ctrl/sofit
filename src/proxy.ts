import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (isLogin) {
    return session ? NextResponse.redirect(new URL("/admin", req.url)) : NextResponse.next();
  }
  if (!session) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // API routes authorise themselves (requireAdmin) so large uploads are not buffered here.
  matcher: ["/admin/:path*"],
};
