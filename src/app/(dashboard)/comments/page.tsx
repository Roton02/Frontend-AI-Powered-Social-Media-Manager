"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MessageSquare,
  Send,
  Bot,
  MoreVertical,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { UnifiedMessage } from "@/lib/types";

export default function CommentsPage() {
  const [comments, setComments] = useState<UnifiedMessage[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      setLoading(true);
      const data = await api.get<UnifiedMessage[]>("/social/comments", { workspace: true });
      setComments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  const filteredComments = comments.filter(c =>
    (c.senderId || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.text || "").toLowerCase().includes(search.toLowerCase())
  );

  const unanswered = filteredComments.filter(c => c.status === "unread");
  const aiReplied = filteredComments.filter(c => c.aiProcessed);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Unified Comments</h1>
          <p className="text-slate-500">Manage and reply to comments on your posts across all platforms.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search comments..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={16} />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="all">All Comments</TabsTrigger>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          <TabsTrigger value="ai">AI-Handled</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CommentsTable comments={filteredComments} onChanged={fetchComments} />
        </TabsContent>
        <TabsContent value="unanswered">
          <CommentsTable comments={unanswered} onChanged={fetchComments} />
        </TabsContent>
        <TabsContent value="ai">
          <CommentsTable comments={aiReplied} onChanged={fetchComments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommentsTable({ comments, onChanged }: { comments: UnifiedMessage[]; onChanged: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender &amp; Platform</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    No comments yet. Comments on your connected accounts will appear here once incoming webhooks are configured.
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
                  <TableRow
                    key={comment.id}
                    className={cn(selectedId === comment.id && "bg-blue-50/50 cursor-pointer")}
                    onClick={() => setSelectedId(comment.id)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{comment.senderId}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{comment.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-600">
                      {comment.text}
                    </TableCell>
                    <TableCell>
                      <Badge variant={comment.status === "unread" ? "destructive" : comment.aiProcessed ? "secondary" : "outline"} className="text-[10px]">
                        {comment.status === "unread" ? "Unanswered" : comment.aiProcessed ? "AI-Handled" : "Answered"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => setSelectedId(comment.id)}>
                            <MessageSquare size={14} />
                            Reply Now
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="space-y-6">
        {selectedId ? (
          <ReplyPanel
            comment={comments.find(c => c.id === selectedId)}
            onReplied={onChanged}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Select a comment to reply</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyPanel({ comment, onReplied }: { comment: UnifiedMessage | undefined; onReplied: () => void }) {
  const [reply, setReply] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setReply("");
      setRequestId(crypto.randomUUID());
  }, [comment?.id]);

  if (!comment) return null;

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/social/comments/${comment.id}/reply`, { text: reply.trim(), requestId }, { workspace: true });
      toast.success("Reply sent");
      setReply("");
      setRequestId(crypto.randomUUID());
      onReplied();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Reply to {comment.senderId}
          {comment.aiProcessed && <Bot size={16} className="text-purple-600" />}
        </CardTitle>
        <p className="text-xs text-slate-500 capitalize">{comment.platform.toLowerCase()} • {new Date(comment.timestamp).toLocaleString()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <p className="text-xs font-medium text-slate-400 mb-1">Original Comment</p>
          <p className="text-sm text-slate-700">&quot;{comment.text}&quot;</p>
        </div>

        <div className="space-y-2">
          <Label>Your Reply</Label>
          <Textarea
            placeholder="Write your response..."
            className="min-h-[120px]"
            value={reply}
            onChange={(e) => { setReply(e.target.value); setRequestId(crypto.randomUUID()); }}
          />
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={handleReply}
          disabled={sending || !reply.trim()}
        >
          {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          Send Reply
        </Button>
      </CardContent>
    </Card>
  );
}
