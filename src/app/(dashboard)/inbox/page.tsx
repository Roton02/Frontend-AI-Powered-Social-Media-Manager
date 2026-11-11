"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Paperclip, RefreshCw, Send, Smile, X } from "lucide-react";
import { api, getToken, getWorkspaceId } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

// Manual inbox: Messenger and Instagram DMs, answered by a person. No AI replies.
// The server keeps each conversation's latest 30 messages in Redis; older ones load when you scroll up.
type Attachment = { type: "image" | "video" | "audio" | "file" | "sticker"; url: string; name?: string };
type Message = { id: string; text: string; direction: string; status: string; timestamp: string; attachments: Attachment[]; error?: string };
type Conversation = { id: string; platform: string; customerName?: string | null; accountName?: string | null; lastMessageAt?: string | null; lastIncomingAt?: string | null; lastMessageText?: string | null; lastMessageDirection?: string | null; unread: number };
type InboxAccount = { id: string; platform: string; accountName: string; messaging: boolean; error?: string | null };
type Page = { messages: Message[]; hasMore: boolean };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WINDOW_MS = 24 * 60 * 60 * 1000;
const EMOJIS = "😀 😂 😊 😍 🥰 😘 😉 😎 🤩 🥳 😇 🙂 🤗 🤔 😅 😢 😭 😡 😮 🙏 👍 👎 👌 👏 🙌 💪 🤝 👋 ❤️ 🧡 💛 💚 💙 💜 🖤 💯 🔥 ✨ ⭐ 🎉 🎁 🛍️ 🛒 📦 🚚 💳 💰 🏷️ ✅ ❌ ⏰ 📞 📍 📸 👀 💬".split(" ");
const platformName = (p: string) => (p === "INSTAGRAM" ? "Instagram" : "Facebook");
const customer = (c: Conversation) => c.customerName || `${platformName(c.platform)} customer`;
const statusLabel: Record<string, string> = { sending: "Sending…", sent: "Sent", failed: "Not sent", uncertain: "Delivery unknown — check the platform" };
// A message made only of 1–6 emojis is shown large, like in Messenger.
const emojiOnly = (text: string) => /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(text) && [...text.replace(/\s/g, "")].length <= 12 && /\p{Extended_Pictographic}/u.test(text);
const merge = (current: Message[], page: Message[]) => {
  // Keep older pages already loaded; the newest page replaces the rest.
  const start = page[0] ? new Date(page[0].timestamp).getTime() : Infinity;
  return [...current.filter(m => !m.id.startsWith("tmp-") && new Date(m.timestamp).getTime() < start), ...page];
};
function shortTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
}
const PlatformBadge = ({ platform }: { platform: string }) => <span title={platformName(platform)} className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white ${platform === "INSTAGRAM" ? "bg-pink-600" : "bg-blue-600"}`}><span aria-hidden>{platform === "INSTAGRAM" ? "IG" : "f"}</span><span className="sr-only">{platformName(platform)}</span></span>;

function AttachmentView({ a, mine }: { a: Attachment; mine: boolean }) {
  /* eslint-disable @next/next/no-img-element -- platform CDN URLs, shown as sent */
  if (a.type === "sticker") return <img src={a.url} alt="Sticker" className="h-24 w-24 object-contain" loading="lazy" />;
  if (a.type === "image") return <a href={a.url} target="_blank" rel="noreferrer noopener"><img src={a.url} alt={a.name || "Photo"} className="max-h-64 max-w-full rounded-xl object-cover" loading="lazy" /></a>;
  /* eslint-enable @next/next/no-img-element */
  if (a.type === "video") return <video src={a.url} controls preload="metadata" className="max-h-64 max-w-full rounded-xl" />;
  if (a.type === "audio") return <audio src={a.url} controls preload="none" className="max-w-full" />;
  return <a href={a.url} target="_blank" rel="noreferrer noopener" className={`flex items-center gap-2 text-sm underline ${mine ? "text-white" : ""}`}><FileText aria-hidden className="h-4 w-4" />{a.name || "File"}</a>;
}

// eslint-disable-next-line @next/next/no-img-element -- an uploaded thumbnail, no optimisation needed
const AttachmentPreview = ({ url }: { url: string }) => <img src={url} alt="" className="h-10 w-10 rounded object-cover" />;

export default function InboxPage() {
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [accounts, setAccounts] = useState<InboxAccount[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; uploading: boolean; attachment?: Attachment } | null>(null);
  const [syncing, setSyncing] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null), input = useRef<HTMLTextAreaElement>(null), fileInput = useRef<HTMLInputElement>(null);
  const keepScroll = useRef<number | null>(null), stickToBottom = useRef(true), activeRef = useRef("");
  activeRef.current = activeId;

  const loadList = useCallback(async () => {
    try {
      const [rows, inboxAccounts] = await Promise.all([
        api.get<Conversation[]>("/social/conversations", { workspace: true }),
        api.get<InboxAccount[]>("/social/inbox/accounts", { workspace: true }).catch(() => null),
      ]);
      setConversations(rows);
      if (inboxAccounts) setAccounts(inboxAccounts);
      setError("");
    } catch { setError("Could not load the inbox. Please retry."); }
    finally { setLoading(false); }
  }, []);
  const loadThread = useCallback(async (id: string) => {
    try {
      const page = await api.get<Page>(`/social/conversations/${id}/messages`, { workspace: true });
      if (activeRef.current !== id) return;
      setMessages(current => merge(current, page.messages));
      setHasMore(h => h || page.hasMore);
    } catch { toast.error("Could not load messages."); }
  }, []);

  // Live updates over the socket; a slow poll covers a dropped connection.
  useEffect(() => { void loadList(); const t = setInterval(loadList, 30000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => {
    if (!socket) return;
    const onUpdate = ({ conversationId }: { conversationId: string }) => { void loadList(); if (conversationId === activeRef.current) void loadThread(conversationId); };
    socket.on("inbox-updated", onUpdate);
    return () => { socket.off("inbox-updated", onUpdate); };
  }, [socket, loadList, loadThread]);
  useEffect(() => { if (!activeId) return; const t = setInterval(() => loadThread(activeId), 30000); return () => clearInterval(t); }, [activeId, loadThread]);

  const active = conversations.find(c => c.id === activeId);
  const windowOpen = Boolean(active?.lastIncomingAt && Date.now() - new Date(active.lastIncomingAt).getTime() < WINDOW_MS);
  const limit = active?.platform === "INSTAGRAM" ? 1000 : 2000;

  useEffect(() => {
    if (active?.unread) api.patch(`/social/conversations/${active.id}/read`, {}, { workspace: true }).catch(() => toast.error("Could not mark the conversation as read."));
  }, [active?.id, active?.unread]);

  // Stay at the bottom for new messages; keep the reading position when older messages are added on top.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (keepScroll.current !== null) { el.scrollTop = el.scrollHeight - keepScroll.current; keepScroll.current = null; }
    else if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function select(c: Conversation) {
    setActiveId(c.id); setMessages([]); setHasMore(false); setText(""); setFile(null); stickToBottom.current = true;
    activeRef.current = c.id; void loadThread(c.id);
  }
  async function loadOlder() {
    if (!activeId || !hasMore || loadingOlder || !messages[0]) return;
    setLoadingOlder(true);
    try {
      const page = await api.get<Page>(`/social/conversations/${activeId}/messages?before=${encodeURIComponent(messages[0].timestamp)}`, { workspace: true });
      keepScroll.current = (scroller.current?.scrollHeight || 0) - (scroller.current?.scrollTop || 0);
      setMessages(current => [...page.messages, ...current]);
      setHasMore(page.hasMore);
    } catch { toast.error("Could not load older messages."); }
    finally { setLoadingOlder(false); }
  }
  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60) void loadOlder();
  }
  async function refresh() {
    setSyncing(true);
    try { await api.post("/social/inbox/sync", {}, { workspace: true }); await loadList(); if (activeId) await loadThread(activeId); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not refresh. Please retry."); }
    finally { setSyncing(false); }
  }
  function insertEmoji(emoji: string) {
    const el = input.current, start = el?.selectionStart ?? text.length, end = el?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, limit);
    setText(next);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + emoji.length, start + emoji.length); });
  }
  async function pickFile(picked?: File) {
    if (!picked) return;
    setFile({ name: picked.name, uploading: true });
    try {
      const body = new FormData(); body.append("file", picked);
      const response = await fetch(`${API_URL}/api/v1/upload/inbox-attachment`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}`, "x-workspace-id": getWorkspaceId() || "" }, body });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.message || "Upload failed.");
      const attachment = json.result as Attachment;
      if (active?.platform === "INSTAGRAM" && attachment.type === "file") throw new Error("Instagram messages accept photos, videos and audio only.");
      setFile({ name: picked.name, uploading: false, attachment });
    } catch (e) { setFile(null); toast.error(e instanceof Error ? e.message : "Upload failed."); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  }
  // Each part (attachment, then text) is its own message, as on Messenger. It appears instantly as "Sending…".
  async function sendPart(conversationId: string, part: { text?: string; attachment?: Attachment }) {
    const tempId = `tmp-${crypto.randomUUID()}`;
    stickToBottom.current = true;
    setMessages(current => [...current, { id: tempId, text: part.text || "", attachments: part.attachment ? [part.attachment] : [], direction: "outgoing", status: "sending", timestamp: new Date().toISOString() }]);
    try {
      await api.post(`/social/conversations/${conversationId}/reply`, { ...part, requestId: crypto.randomUUID() }, { workspace: true });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Please retry.";
      setMessages(current => current.map(m => m.id === tempId ? { ...m, status: "failed", error: message } : m));
      toast.error(message);
      return false;
    }
  }
  async function send() {
    if (!active || file?.uploading) return;
    const body = text.trim(), attachment = file?.attachment, id = active.id;
    if (!body && !attachment) return;
    setText(""); setFile(null);
    if (attachment && !await sendPart(id, { attachment })) { setText(body); return; }
    if (body && !await sendPart(id, { text: body })) setText(body);
    void loadThread(id);
  }

  const visible = conversations.filter(c => filter === "all" || c.unread > 0);
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);
  const ready = accounts.filter(a => a.messaging), needsReconnect = accounts.filter(a => !a.messaging), failing = ready.filter(a => a.error);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-bold">Inbox</h1><p className="text-sm text-slate-500">Facebook Messenger and Instagram messages in one place. Replies are written by you.</p></div>
      <Button variant="outline" onClick={refresh} disabled={syncing}><RefreshCw aria-hidden className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Checking…" : "Check for new messages"}</Button>
    </div>

    {!loading && !ready.length && <div role="status" className="rounded-xl border bg-amber-50 p-4 text-sm">No account can receive messages yet. <Link href="/accounts" className="underline">Reconnect Facebook or Instagram</Link> and allow message access.</div>}
    {ready.length > 0 && needsReconnect.length > 0 && <p className="text-sm text-slate-500">Not receiving messages: {needsReconnect.map(a => `${a.accountName} (${platformName(a.platform)})`).join(", ")}. <Link href="/accounts" className="underline">Reconnect</Link> to include them.</p>}
    {failing.map(a => <p key={a.id} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">{a.accountName}: messages are not updating. {a.error}</p>)}
    {error && <p role="alert">{error} <Button onClick={loadList}>Retry</Button></p>}

    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <aside className={`space-y-3 ${active ? "hidden md:block" : ""}`}>
        <div className="flex gap-2" role="group" aria-label="Filter conversations">
          {(["all", "unread"] as const).map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f === "all" ? "All" : `Unread${totalUnread ? ` (${totalUnread})` : ""}`}</Button>)}
        </div>
        {loading ? <p role="status">Loading messages…</p> : !visible.length && <p className="text-sm text-slate-500">{filter === "unread" ? "No unread messages." : "No messages yet. New messages appear here within about 30 seconds."}</p>}
        <ul className="space-y-2">{visible.map(c => <li key={c.id}><button onClick={() => select(c)} aria-current={c.id === activeId} className={`w-full rounded-xl border p-3 text-left transition-colors ${c.id === activeId ? "border-blue-300 bg-blue-50" : "bg-white hover:bg-slate-50"}`}>
          <span className="flex items-center gap-2"><PlatformBadge platform={c.platform} /><span className={`flex-1 truncate ${c.unread ? "font-semibold" : ""}`}>{customer(c)}</span><span className="text-xs text-slate-500">{shortTime(c.lastMessageAt)}</span></span>
          <span className="mt-1 flex items-center gap-2"><span className="flex-1 truncate text-sm text-slate-600">{c.lastMessageDirection === "outgoing" ? "You: " : ""}{c.lastMessageText ?? ""}</span>{c.unread > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs text-white" aria-label={`${c.unread} unread`}>{c.unread}</span>}</span>
          {c.accountName && <span className="mt-1 block truncate text-xs text-slate-400">to {c.accountName}</span>}
        </button></li>)}</ul>
      </aside>

      <section className={`flex min-h-[60vh] flex-col rounded-xl border bg-white ${active ? "" : "hidden md:flex"}`}>
        {active ? <>
          <header className="flex items-center gap-3 border-b p-4">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActiveId("")} aria-label="Back to conversations"><ArrowLeft className="h-4 w-4" /></Button>
            <PlatformBadge platform={active.platform} />
            <div className="min-w-0"><p className="truncate font-semibold">{customer(active)}</p><p className="truncate text-xs text-slate-500">{platformName(active.platform)}{active.accountName ? ` · ${active.accountName}` : ""}</p></div>
          </header>
          <div ref={scroller} onScroll={onScroll} className="h-[55vh] space-y-2 overflow-y-auto p-4" aria-live="polite">
            {hasMore ? <p className="text-center text-xs text-slate-400">{loadingOlder ? "Loading older messages…" : "Scroll up for older messages"}</p> : messages.length > 0 && <p className="text-center text-xs text-slate-400">Start of conversation</p>}
            {messages.map(m => {
              const mine = m.direction !== "incoming", big = Boolean(m.text) && !m.attachments.length && emojiOnly(m.text);
              const mediaOnly = !m.text && m.attachments.every(a => a.type === "sticker" || a.type === "image");
              return <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${big || mediaOnly ? "" : `rounded-2xl px-4 py-2 ${mine ? "bg-blue-600 text-white" : "bg-slate-100"}`} ${m.status === "failed" ? "opacity-60" : ""}`}>
                  {m.attachments.map((a, i) => <div key={`${a.url}-${i}`} className={m.text ? "mb-1" : ""}><AttachmentView a={a} mine={mine && !mediaOnly} /></div>)}
                  {m.text && <p className={`whitespace-pre-wrap break-words ${big ? "text-4xl leading-tight" : ""}`}>{m.text}</p>}
                  {!m.text && !m.attachments.length && <p className="text-sm italic">Unsupported message — open it in the {platformName(active.platform)} app.</p>}
                  <p className={`mt-1 text-[11px] ${mine && !big && !mediaOnly ? "text-blue-100" : "text-slate-500"}`}>{new Date(m.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}{mine && statusLabel[m.status] ? ` · ${statusLabel[m.status]}` : ""}</p>
                  {m.error && <p className="text-[11px] text-red-600">{m.error}</p>}
                </div>
              </div>;
            })}
          </div>
          <footer className="space-y-2 border-t p-3">
            {!windowOpen ? <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm">The customer&apos;s last message is more than 24 hours old. Meta only allows replies within 24 hours, so reply in the {platformName(active.platform)} app instead.</p> : <>
              {file && <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm">
                {file.attachment?.type === "image" ? <AttachmentPreview url={file.attachment.url} /> : <Paperclip aria-hidden className="h-4 w-4" />}
                <span className="flex-1 truncate">{file.uploading ? `Uploading ${file.name}…` : file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} aria-label="Remove attachment"><X className="h-4 w-4" /></Button>
              </div>}
              <div className="flex items-end gap-2">
                <input ref={fileInput} type="file" className="hidden" accept={active.platform === "INSTAGRAM" ? "image/jpeg,image/png,image/gif,video/mp4,audio/mpeg" : "image/jpeg,image/png,image/gif,video/mp4,audio/mpeg,application/pdf"} onChange={e => pickFile(e.target.files?.[0])} />
                <Button variant="ghost" size="sm" aria-label="Attach a file" disabled={Boolean(file)} onClick={() => fileInput.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                <Popover>
                  <PopoverTrigger aria-label="Add emoji" className="inline-flex h-8 items-center rounded-md px-2 hover:bg-slate-100"><Smile className="h-5 w-5" /></PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-72">
                    <div className="grid grid-cols-8 gap-1">{EMOJIS.map(e => <button key={e} type="button" onClick={() => insertEmoji(e)} className="rounded p-1 text-xl hover:bg-slate-100" aria-label={`Insert ${e}`}>{e}</button>)}</div>
                  </PopoverContent>
                </Popover>
                <label className="sr-only" htmlFor="reply">Your reply</label>
                <Textarea id="reply" ref={input} rows={1} value={text} maxLength={limit} placeholder={`Message ${customer(active)}…`} className="max-h-40 min-h-10 flex-1 resize-none"
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} />
                <Button onClick={send} disabled={(!text.trim() && !file?.attachment) || Boolean(file?.uploading)} aria-label="Send reply"><Send className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-slate-500">Enter to send · Shift + Enter for a new line · {text.length}/{limit}</p>
            </>}
          </footer>
        </> : <p className="m-auto p-6 text-slate-500">Select a conversation.</p>}
      </section>
    </div>
  </div>;
}
