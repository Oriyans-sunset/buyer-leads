import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // SSR helper enforces PKCE + cookie-based storage for browser.
      // No need to override; keep defaults for reliable server access.
      persistSession: true,
    },
  }
);
