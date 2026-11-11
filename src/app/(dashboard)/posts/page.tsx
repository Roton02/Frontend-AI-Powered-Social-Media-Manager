"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Post = { jobId: string; content: string; platform: string; accountName?: string | null; status: string; scheduledAt: string; errorLog?: string };
const filters = ["ALL", "PENDING", "DRAFT", "PUBLISHED", "FAILED", "CANCELLED"];
const labels: Record<string, string> = { ALL: "All posts", PENDING: "Scheduled / queued", DRAFT: "Drafts", PUBLISHED: "Published", FAILED: "Failed", CANCELLED: "Cancelled", PROCESSING: "Publishing" };

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setPosts(await api.get<Post[]>("/publishing", { workspace: true }));
      setError("");
    } catch { setError("Could not load posts. Please retry."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = setInterval(load, 10000); return () => clearInterval(timer); }, [load]);
  async function action(id: string, action: string) {
    setBusy(id);
    try {
      await api.post(`/publishing/${id}/${action}`, {}, { workspace: true });
      toast.success(action === "cancel" ? "Post cancelled" : "Draft queued for publishing");
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Please retry."); }
    finally { setBusy(null); }
  }
  const visible = posts.filter(p => filter === "ALL" || p.status === filter);
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">Post scheduler</h1><Link href="/create-post" className="text-blue-600 underline">Create post</Link></div>
    <p className="text-sm text-slate-500">Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Scheduled posts run on the server, even when this page is closed.</p>
    <label className="block">Show <select aria-label="Post status" value={filter} onChange={e => setFilter(e.target.value)} className="border rounded p-2 ml-2">{filters.map(f => <option key={f} value={f}>{labels[f]}</option>)}</select></label>
    {error && <p role="alert">{error} <Button onClick={load}>Retry</Button></p>}
    {loading ? <p role="status">Loading posts…</p> : !visible.length && !error && <p>No posts in this view.</p>}
    {visible.map(p => <article key={p.jobId} className="rounded-xl border p-5 space-y-3 bg-white">
      <p className="font-semibold">{p.accountName ? `${p.accountName} · ` : ""}{p.platform} · {p.status === "PENDING" ? new Date(p.scheduledAt).getTime() > Date.now() ? "Scheduled" : "Queued" : labels[p.status] || p.status}</p>
      <p className="whitespace-pre-wrap break-words">{p.content}</p>
      {p.status !== "DRAFT" && <p>Scheduled time: {new Date(p.scheduledAt).toLocaleString()}</p>}
      {p.errorLog && <p role="alert" className="whitespace-pre-wrap break-words">{p.errorLog}</p>}
      <div className="flex gap-3">
        {p.status === "DRAFT" && <Button disabled={busy !== null} onClick={() => action(p.jobId, "publish")}>Publish draft now</Button>}
        {["DRAFT", "PENDING"].includes(p.status) && <Button disabled={busy !== null} variant="outline" onClick={() => action(p.jobId, "cancel")}>{busy === p.jobId ? "Updating…" : "Cancel"}</Button>}
      </div>
    </article>)}
  </div>;
}
