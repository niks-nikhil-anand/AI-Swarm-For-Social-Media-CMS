import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const AUTH_PATHS = ["/login", "/register"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("swarm-session")?.value;
  const authed = token ? !!verifySession(token) : false;

  if (!authed && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  // `_next/image` optimizes local `public/` assets by fetching them over HTTP
  // from itself — `/icons` and `/logo` must stay excluded or that internal
  // fetch gets redirected to `/login` and Next sees HTML instead of image bytes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|logo).*)"],
};
