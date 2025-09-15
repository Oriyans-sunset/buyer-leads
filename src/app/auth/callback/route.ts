import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/buyers";
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = (searchParams.get("type") as any) || "magiclink";

  const redirectTo = new URL(next, req.url);
  const onError = (message: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}&redirect=${encodeURIComponent(next)}`, req.url)
    );

  const res = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) return onError(error.message || "verify_failed");
      return res;
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return onError(error.message || "exchange_failed");
      return res;
    }

    return onError("no_params");
  } catch (e: any) {
    return onError(e?.message || "callback_error");
  }
}

