"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

interface AuthWrapperProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthWrapper({
  children,
  redirectTo = "/login",
}: AuthWrapperProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Get current path for redirect
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(
          currentPath
        )}`;
        router.push(loginUrl);
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [user, loading, router, redirectTo]);

  // Show loading state while checking authentication
  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
}
