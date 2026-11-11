"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"confirming" | "success" | "canceled" | "error">("confirming");

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const sessionId = searchParams.get("session_id");

    if (canceled) {
      setStatus("canceled");
      return;
    }

    if (!success || !sessionId) {
      setStatus("error");
      return;
    }

    api
      .post("/payment/confirm/stripe-subscription", { sessionId })
      .then(() => {
        setStatus("success");
        toast.success("Subscription activated successfully");
      })
      .catch((err) => {
        setStatus("error");
        toast.error(err instanceof Error ? err.message : "Failed to confirm subscription");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {status === "confirming" && "Confirming your subscription…"}
          {status === "success" && "Subscription active!"}
          {status === "canceled" && "Checkout canceled"}
          {status === "error" && "Something went wrong"}
        </CardTitle>
        <CardDescription>
          {status === "canceled" && "You canceled the Stripe checkout. No charge was made."}
          {status === "success" && "Your workspace plan has been upgraded."}
          {status === "error" && "We could not confirm your subscription. Please contact support."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8">
        {status === "confirming" && <Loader2 className="animate-spin text-blue-600" size={40} />}
        {status === "success" && <CheckCircle2 size={40} className="text-green-500" />}
        {status === "canceled" && <XCircle size={40} className="text-slate-400" />}
        {status === "error" && <XCircle size={40} className="text-red-500" />}
        {status !== "confirming" && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/billing")}
          >
            Back to Billing
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}
