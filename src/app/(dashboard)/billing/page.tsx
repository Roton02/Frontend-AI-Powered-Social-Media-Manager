"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  CreditCard,
  Zap,
  Star,
  Crown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Plan, Subscription } from "@/lib/types";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={12} className="mr-1" />,
  starter: <Star size={12} className="mr-1" />,
  gold: <Crown size={12} className="mr-1" />,
};

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [plansData, subData] = await Promise.all([
          api.get<Plan[]>("/payment/active-plans"),
          api.get<Subscription>("/payment/my-subscription").catch(() => null),
        ]);
        setPlans(plansData);
        setSubscription(subData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load billing info");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChoosePlan = async (plan: Plan) => {
    setCheckoutPlanId(plan.id);
    try {
      const { url } = await api.post<{ url: string; sessionId: string }>(
        "/payment/create/stripe-subscription",
        {
          priceId: plan.priceId,
          planType: plan.planType,
          successOrigin: window.location.origin,
        }
      );
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setCheckoutPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const activePlanType = subscription?.status === "ACTIVE" ? subscription.planType : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing &amp; Plans</h1>
          <p className="text-slate-500">Choose the plan that best fits your business needs.</p>
        </div>
        {subscription && activePlanType && (
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            Active: {subscription.planType} ({subscription.interval})
          </Badge>
        )}
      </div>

      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-2">
            <p className="text-slate-600 font-medium">No plans available yet</p>
            <p className="text-slate-400 text-sm">
              Plans are created by the platform admin from the admin panel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isActive = activePlanType?.toLowerCase() === plan.planType.toLowerCase();
            const highlight = plan.planType.toLowerCase() === "gold";
            const icon = PLAN_ICONS[plan.planType.toLowerCase()] || <Zap size={12} className="mr-1" />;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col transition-all duration-200",
                  highlight ? "border-blue-500 shadow-xl scale-105 z-10" : "border-slate-200",
                  isActive ? "ring-2 ring-blue-600" : ""
                )}
              >
                {highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <Badge
                      variant={highlight ? "default" : "outline"}
                      className={highlight ? "bg-blue-600 text-white" : "text-blue-600 border-blue-200 bg-blue-50"}
                    >
                      {icon} {plan.planType}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.planType}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold">
                      {plan.amount === 0 ? "Free" : `${plan.currency?.toUpperCase() === "BDT" ? "৳" : "$"}${plan.amount}`}
                    </span>
                    {plan.amount > 0 && <span className="text-slate-500 text-sm">/{plan.interval}</span>}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="space-y-3">
                    {(plan.feature || []).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn("w-full py-6 text-lg font-semibold")}
                    variant={highlight ? "default" : "outline"}
                    onClick={() => handleChoosePlan(plan)}
                    disabled={isActive || checkoutPlanId !== null}
                  >
                    {isActive
                      ? "Current Plan"
                      : checkoutPlanId === plan.id
                        ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Redirecting to Stripe…
                          </>
                        )
                        : "Choose Plan"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CreditCard size={20} className="text-slate-600" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200">
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900">Managed by Stripe</p>
              <p className="text-xs text-slate-500">
                Cards and payment methods are entered securely on Stripe Checkout when you subscribe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
