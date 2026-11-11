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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email: email.trim() });
      toast.success("Reset code sent to your email");
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Reset Password
        </CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset code
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
            {loading ? "Sending…" : "Send Reset Code"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4 text-center">
        <Link href="/sign-in" className="text-sm text-blue-600 hover:underline font-medium">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
