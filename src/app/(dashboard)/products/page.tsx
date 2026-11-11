"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Filter,
  MoreVertical,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: string;
}

const EMPTY_FORM: ProductForm = { name: "", sku: "", category: "", price: "", stock: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>("/products", { workspace: true });
      setProducts(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`, { workspace: true });
      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="text-slate-500">Manage your product inventory and pricing.</p>
        </div>
        <ProductModal mode="create" onSaved={fetchProducts} />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by name or SKU..."
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
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  No products found. Add your first product to build your catalog.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={
                      product.status === "In Stock" ? "outline" :
                      product.status === "Low Stock" ? "secondary" : "destructive"
                    } className={cn(
                      "text-[10px]",
                      product.status === "In Stock" && "text-green-600 border-green-200 bg-green-50"
                    )}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreVertical size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 p-0">
                          <ProductModal
                            mode="edit"
                            product={product}
                            onSaved={fetchProducts}
                            trigger={
                              <div className="flex items-center gap-2 px-2 py-1.5 w-full text-left">
                                <Edit3 size={14} />
                                Edit Product
                              </div>
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={14} />
                          Delete Product
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

function ProductModal({
  mode,
  product,
  onSaved,
  trigger,
}: {
  mode: "create" | "edit";
  product?: Product;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && mode === "edit" && product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
      });
    }
    if (open && mode === "create") setForm(EMPTY_FORM);
  }, [open, mode, product]);

  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    const price = Number(form.price);
    const stock = form.stock ? Number(form.stock) : 0;
    if (Number.isNaN(price) || price < 0) {
      toast.error("Price must be a valid number");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || "General",
        price,
        stock,
        status: stock === 0 ? "Out of Stock" : stock < 10 ? "Low Stock" : "In Stock",
      };

      if (mode === "create") {
        await api.post("/products", { ...payload, sku: form.sku.trim() || `SKU-${Date.now()}` }, { workspace: true });
        toast.success("Product created");
      } else if (product) {
        await api.patch(`/products/${product.id}`, payload, { workspace: true });
        toast.success("Product updated");
      }

      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={trigger
          ? <div className="w-full" />
          : <Button className="bg-blue-600 hover:bg-blue-700 gap-2" />}
      >
        {trigger || (<><Plus size={18} /> Add Product</>)}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Product" : "Edit Product"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new item to your catalog." : `Editing ${product?.name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={form.name} onChange={set("name")} placeholder="Product name" />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="p-sku">SKU (optional — auto-generated if empty)</Label>
              <Input id="p-sku" value={form.sku} onChange={set("sku")} placeholder="TS-BLK-01" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-price">Price</Label>
              <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} placeholder="25.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">Stock</Label>
              <Input id="p-stock" type="number" min="0" value={form.stock} onChange={set("stock")} placeholder="100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-category">Category</Label>
            <Input id="p-category" value={form.category} onChange={set("category")} placeholder="Apparel" />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
