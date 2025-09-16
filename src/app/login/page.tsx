"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useUser } from "@/app/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center p-6">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading } = useUser();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  // If a user is already logged in, bounce them to redirect target
  useEffect(() => {
    if (!loading && user) {
      const next = sp.get("redirect") || "/buyers";
      router.replace(next);
    }
  }, [user, loading, router, sp]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    try {
      const params = new URLSearchParams(location.search);
      const next = params.get("redirect") || "/buyers";

      // Use the current window location for the redirect
      const currentOrigin = window.location.origin;
      const emailRedirectTo = `${currentOrigin}/auth/callback?next=${encodeURIComponent(
        next
      )}`;

      console.log("Current origin:", currentOrigin);
      console.log("Sending magic link with redirect to:", emailRedirectTo);

      // Also log what will be in the email
      console.log(
        "The magic link in your email should redirect to:",
        emailRedirectTo
      );

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage("Check your email for the login link.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Failed to send magic link");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-600 mb-4">Sign in via magic link</p>
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={status === 'sending'}>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            disabled={status === "sending"}
            type="submit"
            className="btn btn-primary w-full"
          >
            {status === "sending" ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
        {message && (
          <p role="status" aria-live="polite" className={`mt-4 ${status === "error" ? "text-red-600" : "text-green-700"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
