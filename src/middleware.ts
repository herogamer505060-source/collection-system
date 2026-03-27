import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { getPublicEnv } from "@/lib/supabase/env";

const AUTH_PATHS = new Set(["/login"]);
const PROTECTED_PREFIXES = [
  "/contracts",
  "/customers",
  "/dashboard",
  "/follow-ups",
  "/import-issues",
  "/imports",
  "/installments",
  "/units",
  "/users",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) && !AUTH_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const env = getPublicEnv();
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  type CookieOptions = Parameters<typeof response.cookies.set>[2];
  type CookieToSet = { name: string; options?: CookieOptions; value: string };

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    if (request.nextUrl.pathname !== "/") {
      const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      loginUrl.searchParams.set("next", nextPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (user && AUTH_PATHS.has(pathname)) {
    const raw = request.nextUrl.searchParams.get("next") ?? "";
    const destination = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/users";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
