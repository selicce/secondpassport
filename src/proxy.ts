import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Proxy (the Next.js 16 successor to "middleware").
 *
 * Demo mode: pass-through (auth is a cookie-selected demo user).
 *
 * Production: refresh the Supabase auth session on every request so server
 * components always see a valid user. Authorization is still enforced by the
 * route-group layouts (requireUser/requireStaff) and by Postgres RLS — this only
 * keeps the session cookie fresh.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false" && url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Touch the session so expired tokens are refreshed into the response cookies.
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
