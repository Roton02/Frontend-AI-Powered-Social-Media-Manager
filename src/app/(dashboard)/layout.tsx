"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainLayout } from "@/components/layout/MainLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { workspace, loading: workspaceLoading, error, refresh } = useWorkspace();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setCreateError("");
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
      await api.post("/workspace", { name, slug: `${slug}-${crypto.randomUUID().slice(0, 8)}` });
      await refresh();
    } catch (err) { setCreateError(err instanceof Error ? err.message : "Please try again."); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/sign-in");
    }
  }, [token, loading, router]);

  if (loading || !token || workspaceLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error) return <div className="p-8"><p>{error}</p><Button onClick={refresh}>Retry</Button></div>;
  if (!workspace) return <form onSubmit={createWorkspace} className="max-w-md mx-auto p-8 space-y-4">
    <h1 className="text-2xl font-bold">Create your business workspace</h1>
    <label htmlFor="business-name">Business name</label>
    <Input id="business-name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required />
    {createError && <p role="alert">{createError}</p>}
    <Button type="submit" disabled={saving || !name.trim()}>{saving ? "Creating…" : "Create workspace"}</Button>
  </form>;
  if (pathname === "/ai") return <MainLayout><h1 className="text-2xl font-bold">AI features are paused</h1><p className="mt-3">We’re focusing on post scheduling. No AI replies are running.</p></MainLayout>;
  return <MainLayout>{children}</MainLayout>;
}
