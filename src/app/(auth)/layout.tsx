"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) {
      router.replace("/");
    }
  }, [token, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
