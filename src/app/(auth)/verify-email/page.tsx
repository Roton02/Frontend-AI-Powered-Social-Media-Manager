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
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/types";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !phone) {
      toast.error("Missing sign-up details. Please start over.");
      router.push("/sign-up");
      return;
    }
    setLoading(true);
    try {
      const result = await api.post<AuthUser>("/users/create", {
        email,
        phone,
        otp: otp.trim(),
      });
      setSession(result);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await api.post("/users/otp-resend", { email });
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full shadow-lg text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <MailCheck size={32} />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verify your email
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email || "your email"}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification code</Label>
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
          <Button type="submit" className="w-full py-6 text-lg font-semibold" disabled={loading}>
            {loading ? "Verifying…" : "Verify & Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onResend}
            disabled={resending}
          >
            {resending ? "Sending…" : "Resend code"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4 justify-center">
        <Link href="/sign-in" className="text-sm text-blue-600 hover:underline font-medium">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
