"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/request", {
        userName: form.userName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        address: form.address.trim() || "-",
      });
      toast.success("Verification code sent to your email");
      router.push(
        `/verify-email?email=${encodeURIComponent(form.email.trim())}&phone=${encodeURIComponent(form.phone.trim())}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>
          Start managing your social media presence today
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="userName">Full Name</Label>
            <Input id="userName" placeholder="John Doe" value={form.userName} onChange={set("userName")} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" value={form.email} onChange={set("email")} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+880..." value={form.phone} onChange={set("phone")} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Your address" value={form.address} onChange={set("address")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required />
          </div>
          <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4 text-center">
        <div className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
