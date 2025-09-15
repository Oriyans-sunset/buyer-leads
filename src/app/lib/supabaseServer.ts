import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options } as any);
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options } as any);
      },
    },
  });
}

export async function createSupabaseServerClientFromRequest(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // For API routes, we can't set cookies in the same way
        // This is mainly for reading existing cookies
      },
      remove(name: string, options: CookieOptions) {
        // For API routes, we can't remove cookies in the same way
        // This is mainly for reading existing cookies
      },
    },
  });
}

export async function getAuthenticatedUser(req: NextRequest) {
  const supabase = await createSupabaseServerClientFromRequest(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: No valid session found");
  }

  return user;
}
