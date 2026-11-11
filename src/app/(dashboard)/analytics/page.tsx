"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  MessageSquare,
  Share2,
  Loader2,
  Package,
  ShoppingBag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { WorkspaceAnalytics } from "@/lib/types";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const data = await api.get<WorkspaceAnalytics>("/workspace/analytics", { workspace: true });
        setAnalytics(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Analytics unavailable.
      </div>
    );
  }

  const { totals, perPlatform, byDay } = analytics;

  const filteredData = perPlatform.filter((d) =>
    d.platform.toLowerCase().includes(search.toLowerCase())
  );

  const maxDay = Math.max(1, ...byDay.map(d => Math.max(d.messages, d.posts)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Performance Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Real metrics from your connected platforms, computed from your data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Messages"
          value={totals.messages}
          icon={<MessageSquare size={16} className="text-blue-600" />}
        />
        <StatCard
          label="Published Posts"
          value={totals.published}
          icon={<CheckCircle2 size={16} className="text-green-600" />}
        />
        <StatCard
          label="Failed Posts"
          value={totals.failed}
          icon={<XCircle size={16} className="text-red-500" />}
        />
        <StatCard
          label="Connected Accounts"
          value={totals.connectedAccounts}
          icon={<Share2 size={16} className="text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-600" />
              Last 7 Days Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-40">
              {byDay.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div
                      title={`${d.messages} messages`}
                      className="w-4 rounded-t bg-blue-500"
                      style={{ height: `${(d.messages / maxDay) * 100}%`, minHeight: d.messages > 0 ? "4px" : "0" }}
                    />
                    <div
                      title={`${d.posts} posts`}
                      className="w-4 rounded-t bg-green-500"
                      style={{ height: `${(d.posts / maxDay) * 100}%`, minHeight: d.posts > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500" /> Messages</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Posts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Catalog &amp; Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-slate-500" />
                <span className="text-sm text-slate-600">Products</span>
              </div>
              <span className="text-lg font-bold">{totals.products}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-slate-500" />
                <span className="text-sm text-slate-600">Orders</span>
              </div>
              <span className="text-lg font-bold">{totals.orders}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            placeholder="Search platform..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Accounts</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  No platform activity yet. Connect an account and publish or receive a message to see analytics.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((d) => {
                const active = d.connectedAccounts > 0;
                const healthy = active && d.failed === 0;
                return (
                  <TableRow key={d.platform}>
                    <TableCell className="font-medium capitalize">
                      {d.platform.toLowerCase()}
                    </TableCell>
                    <TableCell>{d.messages}</TableCell>
                    <TableCell>{d.published}</TableCell>
                    <TableCell>{d.pending}</TableCell>
                    <TableCell>{d.failed}</TableCell>
                    <TableCell>{d.connectedAccounts}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          healthy
                            ? "text-green-600 border-green-200 bg-green-50"
                            : active
                              ? "text-amber-600 border-amber-200 bg-amber-50"
                              : "text-slate-500 border-slate-200 bg-slate-50",
                        )}
                      >
                        {healthy ? "Healthy" : active ? "Needs Attention" : "Not Connected"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
