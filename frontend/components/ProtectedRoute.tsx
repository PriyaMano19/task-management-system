"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import { RootState } from "@/store";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isAuthenticated,
    initialized,
    loading,
  } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
 
    if (!initialized || loading) {
      return;
    }

  
    if (!isAuthenticated) {
      const redirectUrl =
        pathname +
        window.location.search;

      router.replace(
        `/login?redirect=${encodeURIComponent(
          redirectUrl
        )}`
      );
    }
  }, [
    initialized,
    loading,
    isAuthenticated,
    pathname,
    router,
  ]);

  /*
   * Authentication is still being initialized.
   */
  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  /*
   * Initialization finished but user is not
   * authenticated.
   *
   * Don't render the dashboard while the
   * redirect is happening.
   */
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">
          Redirecting to login...
        </div>
      </div>
    );
  }


  return <>{children}</>;
}