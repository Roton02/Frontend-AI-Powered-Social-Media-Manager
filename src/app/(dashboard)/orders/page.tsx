"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
  items: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const data = await api.get<Order[]>("/orders", { workspace: true });
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o =>
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders Management</h1>
          <p className="text-slate-500">Track and manage customer orders and shipments.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by order ID or customer..."
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold text-blue-600">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(order.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      order.status === "Delivered" ? "default" :
                      order.status === "Processing" ? "secondary" : "outline"
                    } className={cn(
                      "text-[10px]",
                      order.status === "Delivered" && "bg-green-100 text-green-700 border-green-200"
                    )}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye size={14} />
                      View Details
                    </Button>
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
