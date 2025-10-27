import { NextRequest, NextResponse } from "next/server";

// Define route patterns for authentication system
const publicRoutes = ["/", "/catalog", "/login", "/admin/login"];
const protectedRoutes = ["/dashboard", "/questionnaires"];
const adminRoutes = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("Proxy processing:", pathname);

  // Allow API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") ||
    pathname.startsWith("/_vercel")
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side RouteGuard handle auth checks
  // This is the recommended approach for Firebase Auth with Next.js App Router
  // Server-side authentication would require additional Firebase Admin SDK setup

  // Example Basic Auth for /admin routes (commented out - using client-side Firebase Auth instead)
  /*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    const [type, credentials] = authHeader.split(' ');

    if (type !== 'Basic' || !credentials) {
      return new NextResponse('Invalid authentication', { status: 401 });
    }

    const [username, password] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':');

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (username !== adminUser || password !== adminPass) {
      return new NextResponse('Invalid credentials', { status: 401 });
    }
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _vercel (Vercel internals)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|_vercel).*)",
  ],
};
