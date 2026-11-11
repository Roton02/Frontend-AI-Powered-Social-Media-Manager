"use client";

import { useState, Suspense, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!email) {
      toast.error("Missing email. Please request a new code.");
      router.push("/forgot-password");
      return;
    }
    setLoading(true);
    try {
      const { forgetToken } = await api.post<{ forgetToken: string }>(
        "/auth/verify-otp",
        { email, otp: otp.trim() }
      );
      await api.patch(
        "/auth/reset-password",
        { newPassword: password },
        { token: forgetToken }
      );
      toast.success("Password updated. Sign in with your new password.");
      router.push("/sign-in");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          New Password
        </CardTitle>
        <CardDescription>
          Enter the code sent to <span className="font-medium text-foreground">{email || "your email"}</span> and choose a new password
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Reset code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="text-center tracking-[0.5em] text-lg"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
            {loading ? "Resetting…" : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
