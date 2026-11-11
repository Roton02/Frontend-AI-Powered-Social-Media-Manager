"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, Trash2, Search, Filter, MoreVertical, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const data = await api.get<AppNotification[]>("/notifications", { workspace: true });
      setNotifications(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {}, { workspace: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      toast.success("Marked as read");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all", {}, { workspace: true });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-slate-500">Stay updated with your platform's activity and alerts.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={markAllAsRead}>
            <CheckCircle2 size={18} />
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search notifications..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={16} />
          Filter Category
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  No notifications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((n) => (
                <TableRow key={n.id} className={!n.isRead ? "bg-blue-50/30" : ""}>
                  <TableCell className="font-medium">
                    {n.title}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{n.message}</TableCell>
                  <TableCell>
                    <Badge variant={n.isRead ? "outline" : "default"} className="text-[10px]">
                      {n.isRead ? "Read" : "Unread"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Recently"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreVertical size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => markAsRead(n.id)}
                          disabled={n.isRead}
                        >
                          <CheckCircle2 size={14} />
                          Mark as read
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
  );
}
