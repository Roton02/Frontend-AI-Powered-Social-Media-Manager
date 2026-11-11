"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Bot,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.get<DashboardStats>("/workspace/stats", { workspace: true });
        setStats(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-slate-500 animate-pulse">Loading your overview…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-slate-500">No stats available. Please connect your accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back! Here is what is happening across your platforms.</p>
        </div>
        <Link href="/create-post" className="text-blue-600 underline">Create / schedule post</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Messages"
          value={stats.totalMessages}
          icon={<MessageSquare className="text-blue-600" />}
          trend="Across all platforms"
        />
        <StatCard
          title="Unread Messages"
          value={stats.unreadMessages}
          icon={<Clock className="text-orange-500" />}
          trend="Requires attention"
          highlight
        />
        <StatCard
          title="AI features paused"
          value={0}
          icon={<Bot className="text-purple-600" />}
          trend="Scheduler testing only"
        />
        <StatCard
          title="Published Posts"
          value={stats.publishedPosts}
          icon={<CheckCircle2 className="text-green-600" />}
          trend="Successful deliveries"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
                ) : (
                  stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          activity.status === "success" || activity.status === "PUBLISHED" ? "bg-green-500" :
                          activity.status === "error" || activity.status === "FAILED" ? "bg-red-500" :
                          activity.status === "unread" || activity.status === "PENDING" ? "bg-blue-500" : "bg-slate-400"
                        )}></div>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-slate-800">{activity.event}</p>
                          <p className="text-xs text-slate-500">{activity.platform} • {activity.time}</p>
                        </div>
                      </div>
                      <Badge variant={
                        activity.status === "success" || activity.status === "PUBLISHED" ? "default" :
                        activity.status === "error" || activity.status === "FAILED" ? "destructive" :
                        activity.status === "unread" || activity.status === "PENDING" ? "outline" : "secondary"
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Test the post scheduler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p>Connect a Facebook Page or Instagram Professional account, then choose a future time in Create Post.</p>
              <Link href="/accounts" className="block text-blue-600 underline">Connect account</Link>
              <Link href="/posts" className="block text-blue-600 underline">View schedules and drafts</Link>
              <p className="text-sm text-slate-500">AI features are paused.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickPostModal({ onPost, isLoading }: { onPost: (content: string) => void, isLoading: boolean }) {
  const [content, setContent] = useState("");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
          </Button>
        }
      >
        Quick Post
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Post</DialogTitle>
          <DialogDescription>
            Draft a quick update and publish it to all connected platforms.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Post Content</Label>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[120px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isLoading || !content.trim()}
            onClick={() => {
              onPost(content);
              setContent("");
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Publishing..." : "Publish Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon, trend, highlight = false }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden", highlight && "border-orange-200 bg-orange-50/30")}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">{title}</span>
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">{value}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}
