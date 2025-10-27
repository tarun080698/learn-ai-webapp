import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // TODO: Replace with Firebase custom claims authentication
  console.log("proxy Middleware processing:", request.nextUrl.pathname);

  // Example Basic Auth for /admin routes (commented out for MVP)
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
